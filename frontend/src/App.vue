<script setup lang="ts">
// 使用Vue Router，不再需要手动管理页面状态
</script>

<template>
  <div class="app">
    <router-view />
  </div>
</template>

<style>
/* 全局样式 - 禁止移动端拖动和缩放 */
* {
  /* 禁止文本选择 */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  
  /* 禁止拖拽 */
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
}

/* 允许输入框和文本区域的文本选择 */
input, textarea, [contenteditable] {
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  user-select: text;
}

html, body {
  /* 禁止页面滚动弹性效果 */
  overscroll-behavior: none;
  
  /* 禁止触摸操作 */
  touch-action: pan-y;
  
  /* 防止页面被拖拽 */
  -webkit-overflow-scrolling: touch;
  
  /* 固定页面宽度，防止横向滚动 */
  overflow-x: hidden;
  width: 100%;
  margin: 0;
  padding: 0;
}

#app {
  /* 防止应用容器被拖拽 */
  touch-action: pan-y;
  overflow-x: hidden;
  width: 100%;
}

/* 全局通用样式 */
.flex-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
</style>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  
  /* 防止内容溢出导致横向滚动 */
  overflow-x: hidden;
  width: 100%;
}

</style>