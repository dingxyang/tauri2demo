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
        :label-position="isMobile ? 'top' : 'left'"
        :model="settings"
        label-width="120px"
        class="settings-form"
      >
        <!-- <el-alert class="mb-16" title="url需携带版本号vxx，并忽略/chat/completions,eg: https://api.openai.com/v1" type="info" /> -->
        <el-form-item :label="$t('settings.apiBaseUrl')">
          <el-input
            v-model="settings.openai.apiBaseUrl"
            :placeholder="VOLCENGINE_BASE_URL"
          />
        </el-form-item>
        <el-form-item :label="$t('settings.apiKey')">
          <el-input
            v-model="settings.openai.apiKey"
            :placeholder="$t('settings.apiKeyPlaceholder')"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveSettings">{{
            $t("settings.save")
          }}</el-button>
          <el-button type="primary" @click="testApiBaseUrl">{{
            $t("settings.test")
          }}</el-button>
        </el-form-item>
      </el-form>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElInput, ElForm, ElFormItem, ElButton, ElMessage } from "element-plus";
import { useSettingsStore } from "@/stores/settings";
import { useRouter } from "vue-router";
import { VOLCENGINE_BASE_URL } from "@/utils/constant";
import { CloseBold } from "@element-plus/icons-vue";
import { isMobile } from "@/utils/os";
import { SYSTEM_MODELS, SystemProvider } from "@/utils/constant/model";
import { i18nGlobal } from "@/utils/i18n";

const settingsStore = useSettingsStore();
const router = useRouter();

const settings = computed(() => settingsStore.settingsState);

const isApiBaseUrlValid = ref(false);

const goToDictionary = () => {
  router.push("/dictionary");
};

const saveSettings = async () => {
  settingsStore.saveSettings({
    openai: {
      apiBaseUrl: settings.value.openai.apiBaseUrl,
      apiKey: settings.value.openai.apiKey,
    },
  });
  ElMessage.success(i18nGlobal.t("settings.saveSuccess"));
};

// @ai-sdk 的包无法准确返回错误信息，所以需要手动测试
const testApiBaseUrl = async () => {
  try {
    const testModel = settingsStore.settingsState.openai.apiBaseUrl.includes(
      "ark.cn-beijing.volces.com"
    )
      ? SYSTEM_MODELS[SystemProvider.doubao][0].id
      : SYSTEM_MODELS[SystemProvider.openai][0].id;
    await fetch(settings.value.openai.apiBaseUrl + `/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.value.openai.apiKey}`,
      },
      body: JSON.stringify({
        model: testModel,
        messages: [{ role: "user", content: "Hello, world!" }],
      }),
    });
    ElMessage.success(i18nGlobal.t("settings.testSuccess"));
    isApiBaseUrlValid.value = true;
  } catch (error) {
    console.error("error", error);
    ElMessage.error(i18nGlobal.t("settings.testFailedMessage"));
    isApiBaseUrlValid.value = false;
    return;
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
