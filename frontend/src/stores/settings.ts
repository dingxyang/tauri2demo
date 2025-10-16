import { defineStore } from "pinia";
import { reactive } from "vue";
import { getSettings, setSettings } from "@/utils/localStorage";

export const useSettingsStore = defineStore("settings", () => {
  const settingsState = reactive({
    openai: {
      apiBaseUrl: "",
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
    }
  };

  const saveSettings = async (data) => {
    if (data.openai.apiBaseUrl) {
      settingsState.openai.apiBaseUrl = data.openai.apiBaseUrl;
    }
    if (data.openai.apiKey) {
      settingsState.openai.apiKey = data.openai.apiKey;
    }
    setSettings(settingsState);
  };

  return {
    settingsState,
    loadSettings,
    saveSettings
  };
});
