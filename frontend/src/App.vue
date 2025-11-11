<script setup lang="ts">
// 使用Vue Router，不再需要手动管理页面状态
</script>

<template>
  <div class="app">
    <router-view />
  </div>
</template>

<style>

#app {
  /* 防止应用容器被拖拽 */
  touch-action: pan-y;
  overflow-x: hidden;
  width: 100%;
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