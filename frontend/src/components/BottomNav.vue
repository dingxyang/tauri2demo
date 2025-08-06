<template>
  <nav class="bottom-nav" v-if="currentPage !== 'detail'">
    <div 
      class="nav-item" 
      :class="{ active: currentPage === 'home' }"
      @click="switchTab('home')"
    >
      <div class="nav-icon">🏠</div>
      <span class="nav-text">首页</span>
    </div>
    <div 
      class="nav-item" 
      :class="{ active: currentPage === 'about' }"
      @click="switchTab('about')"
    >
      <div class="nav-icon">ℹ️</div>
      <span class="nav-text">说明</span>
    </div>
  </nav>
</template>
<script setup lang="ts">
// 定义props
const props = defineProps<{
  currentPage: 'home' | 'detail' | 'about';
}>();

// 定义事件
const emit = defineEmits<{
  switchTab: [tab: 'home' | 'about']
}>();

// 切换底部导航
function switchTab(tab: 'home' | 'about') {
  emit('switchTab', tab);
}
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