<!-- 系统设置页面，支持设置 OpenAI proxy url 和 api key -->
<template>
  <el-container class="settings-container">
    <el-header class="settings-header flex-header">
      <div>{{ $t('settings.title') }}</div>
      <el-icon @click="goToDictionary"><CloseBold /></el-icon>
    </el-header>
    <el-main class="settings-main">
      <el-form :model="settings" label-width="120px" class="settings-form">
        <el-form-item :label="$t('settings.apiBaseUrl')">
          <el-input v-model="settings.openai.apiBaseUrl" :placeholder="OPENAI_BASE_URL"/>
        </el-form-item>
        <el-form-item :label="$t('settings.apiKey')">
          <el-input v-model="settings.openai.apiKey" placeholder="请输入 API Key" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveSettings">{{ $t('settings.save') }}</el-button>
        </el-form-item>
      </el-form>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElInput, ElForm, ElFormItem, ElButton, ElMessage } from "element-plus";
import { useSettingsStore } from "@/stores/settings";
import { useRouter } from "vue-router";
import { OPENAI_BASE_URL } from "@/constant";
import { CloseBold } from "@element-plus/icons-vue";

const settingsStore = useSettingsStore();   
const router = useRouter();

const settings = computed(() => settingsStore.settingsState);


// 配置已在应用初始化时加载，这里不需要重复加载
// onMounted(() => {
//   settingsStore.loadSettings();
// });

const goToDictionary = () => {
  router.push('/dictionary');
};

const saveSettings = () => {
  settingsStore.saveSettings({
    openai: {
      apiBaseUrl: settings.value.openai.apiBaseUrl,
      apiKey: settings.value.openai.apiKey
    }
  });   
  ElMessage.success("设置已保存！");
}
</script>

<style scoped>
.settings-header {
  background-color: #409eff;
  color: white;
  display: flex;
  align-items: center;
}

.settings-form {
  margin: 0 auto;
  background: white;
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.02);
}

.el-form-item {
  margin-bottom: 26px;
}

.mt-16 {
  margin-top: 16px;
}
</style>