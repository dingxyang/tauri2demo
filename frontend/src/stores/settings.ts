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
      selectedModel: "",
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
      if (settings.openai.selectedModel) {
        settingsState.openai.selectedModel = settings.openai.selectedModel;
      }
      
      // 如果有完整配置，初始化 AI 客户端管理器
      if (settingsState.openai.apiBaseUrl && settingsState.openai.apiKey) {
        aiClientManager.initialize({
          apiBaseUrl: settingsState.openai.apiBaseUrl,
          apiKey: settingsState.openai.apiKey,
          selectedModel: settingsState.openai.selectedModel
        });
      }
    }
  };

  const saveSettings = async (data) => {
    if (data.openai) {
      if (data.openai.apiBaseUrl !== undefined) {
        settingsState.openai.apiBaseUrl = data.openai.apiBaseUrl;
      }
      if (data.openai.apiKey !== undefined) {
        settingsState.openai.apiKey = data.openai.apiKey;
      }
      if (data.openai.selectedModel !== undefined) {
        settingsState.openai.selectedModel = data.openai.selectedModel;
      }
    }
    // 兼容旧的调用方式
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
