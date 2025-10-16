import {
  split,
} from "lodash-es";
import { defineStore } from "pinia";
import { reactive, computed } from "vue";
import { getSettings, setSettings } from "@/utils/localStorage";

export const useSettingsStore = defineStore("settings", () => {
  const settingsState = reactive({
    openai: {
      apiBaseUrl: "",
      apiKey: "",
    },
    general: {
      language: "zh-cn",
      theme: "light",
    },
  });

  const currentLanguage = computed(() => {
    let lang = settingsState.general.language;
    if (lang === "auto") {
      const systemLang = navigator.language || "zh-cn";
      lang = split(systemLang, "-")[0];
    }
    return lang || "zh";
  });

  const isDark = computed(() => {
    const theme = settingsState.general.theme;
    return theme === "dark";
  });

  const loadSettings = async () => {
    // 先从本地缓存读取
    let settings = getSettings();
    settings = JSON.parse(settings);
    if (settings) {
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
    isDark,
    currentLanguage,
    loadSettings,
    saveSettings
  };
});
