/**
 * 翻译存储, 暂未使用
 */
import { defineStore } from "pinia";
import { reactive, watch } from "vue";
import {
  getLocalStorageItem,
  setLocalStorageItem,
} from "@/utils/localStorage";

export const useTranslateStore = defineStore("settings", () => {
  const translateState = reactive({
    active: null, //当前选中的记录
    historyList: [], //历史记录
    currentItem: {},
  });

  watch(
    () => translateState.active,
    (newActive) => {
      if (newActive) {
        const history = translateState.historyList.find(
          (v) => v.uuid === newActive
        );
        if (history) {
          translateState.currentItem = history;
        }
        updateTranslateStorage();
      } else {
        translateState.currentItem = {
          title: "",
          uuid: Date.now().toString(),
          origContent: "",
          targetContent: "",
        };
      }
    }
  );

  const updateTranslateStorage = () => {
    const translateStorage = {
      active: translateState.active,
      historyList: translateState.historyList,
    };
    setLocalStorageItem("translateStorage", translateStorage);
  };

  const initTranslateStorage = () => {
    let translateStorage = getLocalStorageItem("translateStorage");
    translateStorage = JSON.parse(translateStorage);
    if (translateStorage) {
      translateState.active = translateStorage.active;
      translateState.historyList = translateStorage.historyList;
    }
  };

  const addTranslateHistory = (history: any) => {
    let addItem;
    if (history.uuid) {
      addItem = history;
    } else {
      addItem = {
        title: "",
        uuid: Date.now().toString(),
        origContent: "",
        targetContent: "",
      };
    }
    translateState.historyList.push(history);
    updateTranslateStorage();
  };

  const deleteTranslateHistory = (uuid: string) => {
    translateState.historyList = translateState.historyList.filter(
      (v) => v.uuid !== uuid
    );
    updateTranslateStorage();
  };

  const updateTranslateHistory = (history: any) => {
    const index = translateState.historyList.findIndex(
      (v) => v.uuid === history.uuid
    );
    if (index !== -1) {
      translateState.historyList[index] = history;
    }
    updateTranslateStorage();
  };

  const clearTranslateHistory = () => {
    translateState.historyList = [];
    translateState.active = null;
    updateTranslateStorage();
  };

  return {
    translateState,
    updateTranslateStorage,
    initTranslateStorage,
    addTranslateHistory,
    deleteTranslateHistory,
    updateTranslateHistory,
    clearTranslateHistory,
  };
});
