<!-- 系统设置页面，支持设置 OpenAI proxy url 和 api key -->
<template>
  <el-container class="settings-container">
    <el-header class="settings-header flex-header">
      <h2>{{ $t("settings.title") }}</h2>
      <el-icon @click="goToDictionary"><CloseBold /></el-icon>
    </el-header>
    <el-main class="settings-main">
      <el-alert style="margin-bottom: 10px;" :title="$t('settings.supportServices')" type="warning" :closable="false" />

      <el-form
        ref="settingsFormRef"
        :rules="settingsFormRules"
        :label-position="isMobile ? 'top' : 'left'"
        :model="settings.openai"
        label-width="120px"
        class="settings-form"
      >
        <!-- <el-alert class="mb-16" title="url需携带版本号vxx，并忽略/chat/completions,eg: https://api.openai.com/v1" type="info" /> -->
        <el-form-item required :label="$t('settings.apiBaseUrl')" prop="apiBaseUrl">
          <el-input
            v-model="settings.openai.apiBaseUrl"
            :placeholder="VOLCENGINE_BASE_URL"
          />
        </el-form-item>
        <el-form-item required :label="$t('settings.apiKey')" prop="apiKey">
          <el-input
            v-model="settings.openai.apiKey"
            :placeholder="$t('settings.apiKeyPlaceholder')"
            show-password
          />
        </el-form-item>
        <!-- 模型列表显示区域 -->
        <el-form-item required label="可用模型" prop="selectedModel">
          <el-select
            v-model="settings.openai.selectedModel"
            placeholder="请选择模型"
            style="width: 100%"
          >
            <el-option
              v-for="model in availableModels"
              :key="model.id"
              :label="model.id"
              :value="model.id"
            >
              <span>{{ model.id }}</span>
              <span v-if="model.owned_by" style="float: right; color: #8492a6; font-size: 13px">
                {{ model.owned_by }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="success" @click="queryModels" :loading="loadingModels">
            查询模型列表
          </el-button>
          <el-button type="primary" @click="saveSettings">{{
            $t("settings.save")
          }}</el-button>
        </el-form-item>
      </el-form>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElInput, ElForm, ElFormItem, ElButton, ElMessage, ElSelect, ElOption, FormRules } from "element-plus";
import { useSettingsStore } from "@/stores/settings";
import { useRouter } from "vue-router";
import { VOLCENGINE_BASE_URL } from "@/utils/constant";
import { CloseBold } from "@element-plus/icons-vue";
import { isMobile } from "@/utils/os";
import { DEF_DOUBAO_MODEL, DEF_OPENAI_MODEL, SYSTEM_MODELS, SystemModels, SystemProvider } from "@/utils/constant/model";
import { i18nGlobal } from "@/utils/i18n";

const settingsFormRef = ref<InstanceType<typeof ElForm>>();
const settingsFormRules = ref<FormRules>({
  apiBaseUrl: [{ required: true, message: "请输入 API Base URL" }],
  apiKey: [{ required: true, message: "请输入 API Key" }],
  selectedModel: [{ required: true, message: "请选择模型" }],
});

const settingsStore = useSettingsStore();
const router = useRouter();

const settings = computed(() => settingsStore.settingsState);

const availableModels = computed(() => {
  // 如果是火山引擎（火山方舟API地址判断：包含'ark.cn-beijing.volces.com'）
  if (settings.value.openai.apiBaseUrl && settings.value.openai.apiBaseUrl.includes('ark.cn-beijing.volces.com')) {
    return SystemModels[SystemProvider.doubao];
  }
  return [];
});
const loadingModels = ref(false);

const goToDictionary = () => {
  router.push("/dictionary");
};

const saveSettings = async () => {
  await settingsFormRef.value.validate((valid, fields) => {
    debugger;
    if (valid) {
      settingsStore.saveSettings({
        openai: {
          apiBaseUrl: settings.value.openai.apiBaseUrl,
          apiKey: settings.value.openai.apiKey,
          selectedModel: settings.value.openai.selectedModel,
        },
      });
      ElMessage.success(i18nGlobal.t("settings.saveSuccess"));
    } else {
    }
  });

};

// 查询可用模型列表
const queryModels = async () => {
  if (!settings.value.openai.apiBaseUrl || !settings.value.openai.apiKey) {
    ElMessage.warning("请先配置 API Base URL 和 API Key");
    return;
  }
  // 如果是火山引擎，直接返回写死的列表
  if (settings.value.openai.apiBaseUrl.includes('ark.cn-beijing.volces.com')) {
    availableModels.value = SystemModels[SystemProvider.doubao];
    settings.value.openai.selectedModel = DEF_DOUBAO_MODEL;
    return;
  }

  loadingModels.value = true;
  try {
    const response = await fetch(settings.value.openai.apiBaseUrl + `/models`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.value.openai.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.data && Array.isArray(data.data)) {
      availableModels.value = data.data.sort((a: any, b: any) => a.id.localeCompare(b.id));
      ElMessage.success(`成功获取 ${availableModels.value.length} 个可用模型`);
    } else {
      throw new Error("Invalid response format");
    }
  } catch (error) {
    console.error("查询模型列表失败:", error);
    ElMessage.error("查询模型列表失败，请检查配置是否正确");
    availableModels.value = [];
  } finally {
    loadingModels.value = false;
  }
};
</script>

<style scoped>
.settings-header {
  display: flex;
  align-items: center;
}

.settings-form {
  margin: 0 auto;
  background: white;
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.02);
}

.el-form-item {
  margin-bottom: 26px;
}

.mt-16 {
  margin-top: 16px;
}
</style>
