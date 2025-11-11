<!-- 系统设置页面，支持设置 OpenAI proxy url 和 api key -->
<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted } from "vue";
import {
  ElInput,
  ElForm,
  ElFormItem,
  ElButton,
  ElMessage,
  ElSelect,
  ElOption,
  ElSwitch,
  ElCard,
  ElDivider,
  FormRules,
} from "element-plus";
import { useSettingsStore } from "@/stores/settings";
import { useRouter } from "vue-router";
import {
  VOLCENGINE_BASE_URL,
  OPENAI_BASE_URL,
  DEEPSEEK_BASE_URL,
} from "@/utils/constant";
import { CloseBold } from "@element-plus/icons-vue";
import { isMobile } from "@/utils/os";
import { providers } from "@/utils/constant/providers";
import {
  setCachedModels,
  setCachedTestResult,
  getCachedModels,
  isCacheExpired,
  clearProviderCache,
} from "@/utils/localStorage";

const openaiFormRef = ref<InstanceType<typeof ElForm>>();
const doubaoFormRef = ref<InstanceType<typeof ElForm>>();
const deepseekFormRef = ref<InstanceType<typeof ElForm>>();
const customFormRef = ref<InstanceType<typeof ElForm>>();

const providerFormRules = ref<FormRules>({
  "options.baseURL": [{ required: true, message: "请输入 API Base URL" }],
  "options.apiKey": [{ required: true, message: "请输入 API Key" }],
  defaultModel: [{ required: true, message: "请选择模型" }],
});

const customProviderFormRules = ref<FormRules>({
  name: [{ required: true, message: "请输入提供商名称" }],
  "options.baseURL": [{ required: true, message: "请输入 API Base URL" }],
  "options.apiKey": [{ required: true, message: "请输入 API Key" }],
  defaultModel: [{ required: true, message: "请选择模型" }],
});

const settingsStore = useSettingsStore();
const router = useRouter();

const settings = computed(() => settingsStore.settingsState);

// 获取指定提供商的可用模型
const getAvailableModels = (providerId: string) => {
  const providerModels = providers[providerId].models;
  // 对象转数组 'deepseek-v3-250324': models['deepseek-v3-0324'],
  const models = [];
  Object.keys(providerModels).forEach((key) => {
    const model = providerModels[key];
    console.log("model", model);
    models.push({
      id: key,
      name: key,
    });
  });
  return models;
};

const customAvailableModels = ref([]);
const loadingModels = ref(false);

// 防抖保存函数
let saveTimeout: NodeJS.Timeout | null = null;
const autoSave = () => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(async () => {
    try {
      await settingsStore.saveSettings({ providers: settings.value.providers });
      console.log("设置已自动保存");
    } catch (error) {
      console.error("自动保存失败:", error);
    }
  }, 500); // 500ms 防抖延迟
};

// 监听设置变化并自动保存
watch(
  () => settings.value.providers,
  () => {
    autoSave();
  },
  { deep: true }
);

const goToDictionary = () => {
  router.push("/dictionary");
};

// 查询可用模型列表
const queryModels = async (
  providerId: string,
  forceRefresh: boolean = false
) => {
  const providerConfig = settings.value.providers[providerId];
  const baseURL = providerConfig.options.baseURL;
  const apiKey = providerConfig.options.apiKey;

  if (!baseURL || !apiKey) {
    ElMessage.warning("请先配置 API Base URL 和 API Key");
    return;
  }

  // 如果强制刷新，清除缓存
  if (forceRefresh) {
    clearProviderCache(providerId);
  } else {
    // 先检查缓存
    const cachedModels = getCachedModels(providerId);
    if (cachedModels) {
      try {
        const modelCache = JSON.parse(cachedModels);
        if (modelCache && !isCacheExpired(modelCache.timestamp)) {
          // 使用缓存的模型列表
          const models = modelCache.models;
          customAvailableModels.value = models.sort((a: any, b: any) =>
            a.id.localeCompare(b.id)
          );
          settings.value.providers[providerId].models = models.reduce(
            (acc: any, model: any) => {
              acc[model.id] = model;
              return acc;
            },
            {}
          );
          settings.value.providers[providerId].available = true;
          ElMessage.success(`从缓存加载了 ${models.length} 个可用模型`);
          return;
        }
      } catch (error) {
        console.warn(`加载 ${providerId} 模型缓存失败:`, error);
      }
    }
  }

  // 缓存不存在或已过期，从API查询
  loadingModels.value = true;
  try {
    const response = await fetch(baseURL + `/models`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.data && Array.isArray(data.data)) {
      const models = data.data.sort((a: any, b: any) =>
        a.id.localeCompare(b.id)
      );

      customAvailableModels.value = models;
      // 需要把模型存储到 providers 里
      settings.value.providers[providerId].models = models.reduce(
        (acc: any, model: any) => {
          acc[model.id] = model;
          return acc;
        },
        {}
      );
      settings.value.providers[providerId].available = true;
      settingsStore.saveSettings({ providers: settings.value.providers });

      // 缓存查询结果
      setCachedModels(providerId, models);
      setCachedTestResult(providerId, true);

      ElMessage.success(`成功获取 ${models.length} 个可用模型`);
    } else {
      throw new Error("Invalid response format");
    }
  } catch (error) {
    console.error("查询模型列表失败:", error);
    ElMessage.error("查询模型列表失败，请检查配置是否正确");
    customAvailableModels.value = [];
  } finally {
    loadingModels.value = false;
  }
};

const testProvider = async (providerId: string) => {
  const providerConfig = settings.value.providers[providerId];
  const baseURL = providerConfig.options.baseURL;
  const apiKey = providerConfig.options.apiKey;

  if (!baseURL || !apiKey) {
    ElMessage.warning("请先配置 API Base URL 和 API Key");
    return;
  }

  try {
    const response = await fetch(baseURL + `/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: providerConfig.defaultModel,
        messages: [{ role: "user", content: "Hello, how are you?" }],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 测试成功，更新状态并缓存结果
    settings.value.providers[providerId].available = true;
    settingsStore.saveSettings({ providers: settings.value.providers });
    setCachedTestResult(providerId, true);
    ElMessage.success("测试成功");
  } catch (error) {
    // 测试失败，缓存失败结果
    settings.value.providers[providerId].available = false;
    setCachedTestResult(providerId, false);
    console.error(`${providerId} 测试失败:`, error);
    ElMessage.error("测试失败，请检查配置是否正确");
    throw error;
  }
};

onMounted(() => {
  const cachedModels = getCachedModels("openai-compatible");
  if (cachedModels) {
    const modelCache = JSON.parse(cachedModels);
    if (modelCache && !isCacheExpired(modelCache.timestamp)) {
      customAvailableModels.value = modelCache.models;
    }
  }
});
</script>
<template>
  <el-container class="settings-container">
    <el-header class="settings-header">
      <div class="page-title">{{ $t("settings.title") }}</div>
      <el-icon @click="goToDictionary"><CloseBold /></el-icon>
    </el-header>
    <el-main class="settings-main">
      <!-- 火山引擎 -->
      <el-card class="provider-card" shadow="hover">
        <template #header>
          <div class="provider-header">
            <span class="provider-title">火山引擎（豆包）</span>
            <el-switch
              :style="{
                '--el-switch-on-color': settings.providers.doubao.available
                  ? '#13ce66'
                  : '#ff4949',
              }"
              v-model="settings.providers.doubao.enabled"
            />
          </div>
        </template>
        <el-form
          v-if="settings.providers.doubao.enabled"
          ref="doubaoFormRef"
          :rules="providerFormRules"
          :label-position="isMobile ? 'top' : 'left'"
          :model="settings.providers.doubao"
          label-width="120px"
        >
          <el-form-item label="API Base URL" prop="options.baseURL">
            <el-input
              v-model="settings.providers.doubao.options.baseURL"
              :placeholder="VOLCENGINE_BASE_URL"
            />
          </el-form-item>
          <el-form-item label="API Key" prop="options.apiKey">
            <el-input
              v-model="settings.providers.doubao.options.apiKey"
              placeholder="请输入火山引擎 API Key"
              show-password
            >
              <template #append>
                <el-button @click="testProvider('doubao')">测试</el-button>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="选择模型" prop="defaultModel">
            <el-select
              v-model="settings.providers.doubao.defaultModel"
              placeholder="请选择模型"
              style="width: 100%"
            >
              <el-option
                v-for="model in getAvailableModels('doubao')"
                :key="model.id"
                :label="model.name"
                :value="model.id"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </el-card>
      <!-- DeepSeek -->
      <el-card class="provider-card" shadow="hover">
        <template #header>
          <div class="provider-header">
            <span class="provider-title">DeepSeek</span>
            <el-switch
              :style="{
                '--el-switch-on-color': settings.providers.deepseek.available
                  ? '#13ce66'
                  : '#ff4949',
              }"
              v-model="settings.providers.deepseek.enabled"
            />
          </div>
        </template>
        <el-form
          v-if="settings.providers.deepseek.enabled"
          ref="deepseekFormRef"
          :rules="providerFormRules"
          :label-position="isMobile ? 'top' : 'left'"
          :model="settings.providers.deepseek"
          label-width="120px"
        >
          <el-form-item label="API Base URL" prop="options.baseURL">
            <el-input
              v-model="settings.providers.deepseek.options.baseURL"
              :placeholder="DEEPSEEK_BASE_URL"
            />
          </el-form-item>
          <el-form-item label="API Key" prop="options.apiKey">
            <el-input
              v-model="settings.providers.deepseek.options.apiKey"
              placeholder="请输入 DeepSeek API Key"
              show-password
            >
              <template #append>
                <el-button @click="testProvider('deepseek')">测试</el-button>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="选择模型" prop="defaultModel">
            <el-select
              v-model="settings.providers.deepseek.defaultModel"
              placeholder="请选择模型"
              style="width: 100%"
            >
              <el-option
                v-for="model in getAvailableModels('deepseek')"
                :key="model.id"
                :label="model.name"
                :value="model.id"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </el-card>
      <!-- OpenAI 官方 -->
      <el-card class="provider-card" shadow="hover">
        <template #header>
          <div class="provider-header">
            <span class="provider-title">OpenAI 官方</span>
            <el-switch
              :style="{
                '--el-switch-on-color': settings.providers.openai.available
                  ? '#13ce66'
                  : '#ff4949',
              }"
              v-model="settings.providers.openai.enabled"
            />
          </div>
        </template>
        <el-form
          v-if="settings.providers.openai.enabled"
          ref="openaiFormRef"
          :rules="providerFormRules"
          :label-position="isMobile ? 'top' : 'left'"
          :model="settings.providers.openai"
          label-width="120px"
        >
          <el-form-item label="API Base URL" prop="options.baseURL">
            <el-input
              v-model="settings.providers.openai.options.baseURL"
              :placeholder="OPENAI_BASE_URL"
            />
          </el-form-item>
          <el-form-item label="API Key" prop="options.apiKey">
            <el-input
              v-model="settings.providers.openai.options.apiKey"
              placeholder="请输入 OpenAI API Key"
              show-password
            >
              <template #append>
                <el-button @click="testProvider('openai')">测试</el-button>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="选择模型" prop="defaultModel">
            <el-select
              v-model="settings.providers.openai.defaultModel"
              placeholder="请选择模型"
              style="width: 100%"
            >
              <el-option
                v-for="model in getAvailableModels('openai')"
                :key="model.id"
                :label="model.name"
                :value="model.id"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </el-card>
      <!-- 自定义 OpenAI 兼容 -->
      <el-card class="provider-card" shadow="hover">
        <template #header>
          <div class="provider-header">
            <span class="provider-title">自定义 OpenAI 兼容</span>
            <el-switch
              :style="{
                '--el-switch-on-color': settings.providers['openai-compatible']
                  .available
                  ? '#13ce66'
                  : '#ff4949',
              }"
              v-model="settings.providers['openai-compatible'].enabled"
            />
          </div>
        </template>
        <el-form
          v-if="settings.providers['openai-compatible'].enabled"
          ref="customFormRef"
          :rules="customProviderFormRules"
          :label-position="isMobile ? 'top' : 'left'"
          :model="settings.providers['openai-compatible']"
          label-width="120px"
        >
          <el-form-item label="提供商名称" prop="name">
            <el-input
              v-model="settings.providers['openai-compatible'].name"
              placeholder="请输入自定义提供商名称"
            />
          </el-form-item>
          <el-form-item label="API Base URL" prop="options.baseURL">
            <el-input
              v-model="settings.providers['openai-compatible'].options.baseURL"
              placeholder="请输入 API Base URL"
            />
          </el-form-item>
          <el-form-item label="API Key" prop="options.apiKey">
            <el-input
              v-model="settings.providers['openai-compatible'].options.apiKey"
              placeholder="请输入 API Key"
              show-password
            >
              <template #append>
                <el-button @click="queryModels('openai-compatible')"
                  >测试</el-button
                >
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="选择模型" prop="defaultModel">
            <el-select
              v-model="settings.providers['openai-compatible'].defaultModel"
              placeholder="请选择模型"
              style="width: 100%"
            >
              <el-option
                v-for="model in customAvailableModels"
                :key="model.id"
                :label="model.name"
                :value="model.id"
              >
                <span>{{ model.id }}</span>
                <span
                  v-if="model.owned_by"
                  style="float: right; color: #8492a6; font-size: 13px"
                >
                  {{ model.owned_by }}
                </span>
              </el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </el-card>
    </el-main>
  </el-container>
</template>

<style scoped>
.settings-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.settings-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.settings-main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.provider-card {
  margin-bottom: 20px;
  border-radius: 12px;
  overflow: hidden;
}

.provider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.provider-title {
  font-size: 16px;
  color: #303133;
}

.el-form {
  padding: 20px;
  background: #fafafa;
}

.el-form-item {
  margin-bottom: 20px;
}

.save-section {
  text-align: center;
  margin-top: 30px;
  padding: 20px;
}

.settings-form {
  margin: 0 auto;
  background: white;
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.02);
}

.mt-16 {
  margin-top: 16px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .settings-main {
    padding: 10px;
  }

  .provider-card {
    margin-bottom: 15px;
  }

  .el-form {
    padding: 15px;
  }
}
</style>
