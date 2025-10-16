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
