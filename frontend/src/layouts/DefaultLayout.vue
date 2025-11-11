<template>
  <div class="default-layout">
    <!-- 主内容区域 -->
    <main class="main-content">
      <router-view v-slot="{ Component, route }">
        <keep-alive>
          <component :is="Component" v-if="route.meta.keepAlive" :key="route.name" />
        </keep-alive>
        <component :is="Component" v-if="!route.meta.keepAlive" :key="route.name" />
      </router-view>
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
  /* 保留顶部安全区 */
  padding-top: env(safe-area-inset-top);
}

.main-content {
  flex: 1;
  overflow: hidden;
  padding-bottom: calc(80px + env(safe-area-inset-bottom)); /* 为底部导航栏+安全区留空间 */
}
</style>
