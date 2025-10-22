<template>
  <nav class="bottom-nav" v-if="$route.name !== 'Detail'">
    <router-link 
      to="/"
      class="nav-item" 
      :class="{ active: $route.name === 'Home' }"
    >
      <div class="nav-icon">🏠</div>
      <span class="nav-text">首页</span>
    </router-link>
    
    <router-link 
      to="/dictionary"
      class="nav-item" 
      :class="{ active: $route.name === 'Dictionary' }"
    >
      <div class="nav-icon">📖</div>
      <span class="nav-text">字典</span>
    </router-link>
    
    <router-link 
      to="/about"
      class="nav-item" 
      :class="{ active: $route.name === 'About' }"
    >
      <div class="nav-icon">ℹ️</div>
      <span class="nav-text">说明</span>
    </router-link>
  </nav>
</template>
<script setup lang="ts">
// 使用路由导航，不再需要props和emit
</script>


<style scoped>
/* 底部导航栏 */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e0e0e0;
  display: flex;
  padding: 0.5rem 0;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
  z-index: 1000;
  
  /* Safe Area Insets 适配 - 确保背景延伸到安全区域 */
  padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
  
  /* 背景延伸到安全区域底部 */
  background: linear-gradient(to bottom, white 0%, white calc(100% - env(safe-area-inset-bottom, 0px)), white 100%);
  
  /* 使用 ::after 伪元素确保背景完全覆盖安全区域 */
}

.bottom-nav::after {
  content: '';
  position: absolute;
  bottom: calc(-1 * env(safe-area-inset-bottom, 0px));
  left: 0;
  right: 0;
  height: env(safe-area-inset-bottom, 0px);
  background: white;
  z-index: -1;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 8px;
  margin: 0 0.25rem;
}

.nav-item:hover {
  background-color: #f0f0f0;
}

.nav-item.active {
  background-color: #e3f2fd;
}

.nav-item.active .nav-text {
  color: #007AFF;
  font-weight: 600;
}

.nav-icon {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.nav-text {
  font-size: 0.8rem;
  color: #666;
  transition: color 0.2s ease;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .bottom-nav {
    padding: 0.25rem 0;
    padding-bottom: calc(0.25rem + env(safe-area-inset-bottom, 0px));
  }
  
  .nav-item {
    padding: 0.25rem;
  }
  
  .nav-icon {
    font-size: 1.25rem;
  }
  
  .nav-text {
    font-size: 0.7rem;
  }
}

</style> 