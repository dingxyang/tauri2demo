// 本地缓存前端工具类

import { get, set, isObject } from "lodash-es";

export const SETTINGS_KEY = "settings";

export const getLocalStorageItem = (key: string) => {
  return get(localStorage, key);
};

export const setLocalStorageItem = (key: string, value: any) => {
  if (isObject(value)) {
    value = JSON.stringify(value);
  }
  set(localStorage, key, value);
};

export const getSettings = () => {
  return getLocalStorageItem(SETTINGS_KEY);
};

export const setSettings = (settings: any) => {
  setLocalStorageItem(SETTINGS_KEY, settings);
};


export const getCurrentModelInfo = () => {
  return getLocalStorageItem('defaultModelInfo');
};

export const setCurrentModelInfo = (modelInfo: any) => {
  setLocalStorageItem('defaultModelInfo', modelInfo);
};

// 缓存模型列表
export const getCachedModels = (providerId: string) => {
  return getLocalStorageItem(`models_${providerId}`);
};

export const setCachedModels = (providerId: string, models: any) => {
  setLocalStorageItem(`models_${providerId}`, {
    models,
    timestamp: Date.now()
  });
};

// 缓存提供商测试结果
export const getCachedTestResult = (providerId: string) => {
  return getLocalStorageItem(`test_${providerId}`);
};

export const setCachedTestResult = (providerId: string, result: boolean) => {
  setLocalStorageItem(`test_${providerId}`, {
    available: result,
    timestamp: Date.now()
  });
};

// 检查缓存是否过期 (默认1小时)
export const isCacheExpired = (timestamp: number, expireTime: number = 3600000) => {
  return Date.now() - timestamp > expireTime;
};

// 清除指定提供商的缓存
export const clearProviderCache = (providerId: string) => {
  localStorage.removeItem(`models_${providerId}`);
  localStorage.removeItem(`test_${providerId}`);
};

// 清除所有缓存
export const clearAllCache = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('models_') || key.startsWith('test_')) {
      localStorage.removeItem(key);
    }
  });
};