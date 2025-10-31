import { defineStore } from "pinia";
import { reactive } from "vue";
import { getSettings, setSettings } from "@/utils/localStorage";
import { VOLCENGINE_BASE_URL } from "@/utils/constant";
import { aiClientManager } from "@/services/aiClientManager";

export const useSettingsStore = defineStore("settings", () => {
  const settingsState = reactive({
    openai: {
      apiBaseUrl: VOLCENGINE_BASE_URL,
      apiKey: "",
    },
    isDark: false,
  });


  const loadSettings = async () => {
    // 先从本地缓存读取
    let settings = getSettings();
    if (settings) {
      settings = JSON.parse(settings);
      settingsState.openai.apiBaseUrl = settings.openai.apiBaseUrl;
      settingsState.openai.apiKey = settings.openai.apiKey;
      
      // 如果有完整配置，初始化 AI 客户端管理器
      if (settingsState.openai.apiBaseUrl && settingsState.openai.apiKey) {
        aiClientManager.initialize({
          apiBaseUrl: settingsState.openai.apiBaseUrl,
          apiKey: settingsState.openai.apiKey
        });
      }
    }
  };

  const saveSettings = async (data) => {
    if (data.apiBaseUrl) {
      settingsState.openai.apiBaseUrl = data.apiBaseUrl;
    }
    if (data.apiKey) {
      settingsState.openai.apiKey = data.apiKey;
    }
    setSettings(settingsState);
    
    // 重新初始化 AI 客户端管理器
    if (settingsState.openai.apiBaseUrl && settingsState.openai.apiKey) {
      aiClientManager.initialize({
        apiBaseUrl: settingsState.openai.apiBaseUrl,
        apiKey: settingsState.openai.apiKey
      });
    }
  };

  return {
    settingsState,
    loadSettings,
    saveSettings
  };
});
