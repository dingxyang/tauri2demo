<template>
  <div class="home-container">
    <h1>微信公众号文章阅读器</h1>
    <button class="open-btn" @click="openArticle">打开文章</button>
  </div>
</template>

<script setup>
import { WebviewWindow } from "@tauri-apps/api/webviewWindow"
import { getCurrentWebview, Webview } from "@tauri-apps/api/webview"

// 打开微信公众号文章的方法
async function openArticle() {
  // 创建一个新的窗口和webview
  const webview = new WebviewWindow('article-window', {
    url: 'https://mp.weixin.qq.com/s/QIuV0hMANqf8hJIk-l73xQ',
    title: '微信文章',
    width: 800,
    height: 600,
    center: true,
    resizable: true,
  });

  // 监听窗口创建成功事件
  webview.once('tauri://created', function () {
    console.log('Webview窗口创建成功');
  });

  // 监听窗口创建失败事件
  webview.once('tauri://error', function (e) {
    console.error('Webview窗口创建失败:', e);
  });
}
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  gap: 2rem;
}

h1 {
  color: white;
  font-size: 2rem;
  margin: 0;
  text-align: center;
}

.open-btn {
  background-color: white;
  color: #667eea;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.open-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  background-color: #f0f0f0;
}

.open-btn:active {
  transform: translateY(0);
}
</style>
