import { createApp } from "vue";
import ElementPlus from 'element-plus'
import { createPinia } from 'pinia';
import 'element-plus/dist/index.css';
import './main.css';
import App from "./App.vue";
import router from './router'
import { i18n } from './utils/i18n';
import { useSettingsStore } from '@/stores/settings';

// 初始化应用
async function initApp() {
  const app = createApp(App)
  
  // 注册国际化
  app.use(i18n);
  
  // 注册pinia store
  app.use(createPinia());
  
  // 在应用挂载前初始化配置
  const settingsStore = useSettingsStore();
  await settingsStore.loadSettings();
  
  app.use(ElementPlus)
  app.use(router)
  app.mount('#app')
}

// 启动应用
initApp().catch(console.error);
