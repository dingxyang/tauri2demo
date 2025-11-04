import { defineStore } from "pinia";
import { reactive } from "vue";
import { getCurrentModelInfo, getSettings, setCurrentModelInfo, setSettings } from "@/utils/localStorage";
import { aiClientManager } from "@/services/aiClientManager";
import { 
  createProviderConfig, 
  getFirstEnabledProvider,
  getProviderBaseURL,
  getProviderApiKey,
} from "@/utils/constant/providers";

export const useSettingsStore = defineStore("settings", () => {
  const settingsState = reactive({
    // 使用新的provider配置结构
    providers: createProviderConfig(),
    isDark: false,
    defaultModelInfo: {
      providerId: '',
      modelId: '',
      modelName: ''
    }
  });


  const loadSettings = async () => {
    // 先从本地缓存读取
    const currentModelInfo = getCurrentModelInfo();
    if (currentModelInfo) {
      settingsState.defaultModelInfo = JSON.parse(currentModelInfo);
    }
    let settings = getSettings();
    if (settings) {
      settings = JSON.parse(settings);
      
      // 加载新的多提供商配置
      if (settings.providers) {
        Object.keys(settings.providers).forEach(providerId => {
          if (settingsState.providers[providerId]) {
            // 合并保存的配置到默认配置
            const savedConfig = settings.providers[providerId];
            const currentProvider = settingsState.providers[providerId];
            
            // 更新provider配置，保持默认结构
            currentProvider.enabled = savedConfig.enabled ?? currentProvider.enabled;
            if (savedConfig.options) {
              currentProvider.options = {
                ...currentProvider.options,
                ...savedConfig.options
              };
            }
            // 兼容旧的配置格式
            if (savedConfig.apiBaseUrl) {
              currentProvider.options = currentProvider.options || {};
              currentProvider.options.baseURL = savedConfig.apiBaseUrl;
            }
            if (savedConfig.apiKey) {
              currentProvider.options = currentProvider.options || {};
              currentProvider.options.apiKey = savedConfig.apiKey;
            }
            if (savedConfig.selectedModel) {
              currentProvider.defaultModel = savedConfig.selectedModel;
            }
            if (savedConfig.name && providerId === "openai-compatible") {
              currentProvider.name = savedConfig.name;
              currentProvider.options = currentProvider.options || {};
            }
          }
        });
      }
      
      // 初始化 AI 客户端管理器 - 使用第一个启用的提供商
      let firstEnabledProvider = getFirstEnabledProvider(settingsState.providers);
      if (currentModelInfo) {
        firstEnabledProvider = settingsState.providers[settingsState.defaultModelInfo.providerId];
      }
      
      if (firstEnabledProvider) {
        const baseURL = getProviderBaseURL(firstEnabledProvider);
        const apiKey = getProviderApiKey(firstEnabledProvider);
        
        if (baseURL && apiKey) {
          aiClientManager.initialize({
            apiBaseUrl: baseURL,
            apiKey: apiKey,
            providerId: firstEnabledProvider.id,
            modelId: firstEnabledProvider.defaultModel
          });
        }
      } 
    }
  
  };

  const saveSettings = async (data) => {
    // 保存新的多提供商配置
    if (data.providers) {
      Object.keys(data.providers).forEach(provider => {
        if (settingsState.providers[provider]) {
          Object.assign(settingsState.providers[provider], data.providers[provider]);
        }
      });
    }
    
    setSettings(settingsState);
    
  };

  const saveCurrentModelInfo = (modelInfo: any) => {
    setCurrentModelInfo(modelInfo);
  };

  return {
    settingsState,
    loadSettings,
    saveSettings,
    saveCurrentModelInfo
  };
});
