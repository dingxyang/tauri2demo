<template>
  <div class="default-layout">
    <!-- 主内容区域 -->
    <main class="main-content">
      <router-view />
    </main>
    
    <!-- 底部导航栏 -->
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import BottomNav from './BottomNav.vue'
</script>

<style scoped>
.default-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  /* 为底部导航栏留出空间，包含 safe area bottom */
  padding-bottom: calc(80px + var(--safe-area-inset-bottom, 0px));
}
</style>
