
<template>
  <div class="about-page">
    <header class="header">
      <h1>说明页</h1>
    </header>
    <main class="main-content">
      <div class="debug-info">
        <h3>调试信息</h3>
        <p>isMobile: {{ isMobile }}</p>
        <p>Safe Area Insets:</p>
        <ul>
          <li>Top: {{ safeAreaInsets.top }}</li>
          <li>Right: {{ safeAreaInsets.right }}</li>
          <li>Bottom: {{ safeAreaInsets.bottom }}</li>
          <li>Left: {{ safeAreaInsets.left }}</li>
        </ul>
        <p>Window Info:</p>
        <ul>
          <li>Window Height: {{ windowInfo.height }}px</li>
          <li>Window Width: {{ windowInfo.width }}px</li>
          <li>Screen Height: {{ windowInfo.screenHeight }}px</li>
          <li>Screen Width: {{ windowInfo.screenWidth }}px</li>
        </ul>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { isMobile } from '@/utils/os';

// 响应式数据
const safeAreaInsets = ref({
  top: '0px',
  right: '0px',
  bottom: '0px',
  left: '0px'
});

const windowInfo = ref({
  height: 0,
  width: 0,
  screenHeight: 0,
  screenWidth: 0
});

// 获取CSS变量值
const getSafeAreaInsets = () => {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  safeAreaInsets.value = {
    top: computedStyle.getPropertyValue('--safe-area-inset-top').trim() || '0px',
    right: computedStyle.getPropertyValue('--safe-area-inset-right').trim() || '0px',
    bottom: computedStyle.getPropertyValue('--safe-area-inset-bottom').trim() || '0px',
    left: computedStyle.getPropertyValue('--safe-area-inset-left').trim() || '0px'
  };
  
  console.log('Safe Area Insets:', safeAreaInsets.value);
};

// 获取窗口信息
const getWindowInfo = () => {
  windowInfo.value = {
    height: window.innerHeight,
    width: window.innerWidth,
    screenHeight: window.screen.height,
    screenWidth: window.screen.width
  };
  
  console.log('Window Info:', windowInfo.value);
};

// 监听窗口大小变化
const handleResize = () => {
  getSafeAreaInsets();
  getWindowInfo();
};

onMounted(() => {
  getSafeAreaInsets();
  getWindowInfo();
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize);
  
  // 监听设备方向变化（移动端）
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      handleResize();
    }, 100);
  });
  
  // 定期检查CSS变量变化
  const interval = setInterval(() => {
    getSafeAreaInsets();
  }, 1000);
  
  // 清理
  return () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
    clearInterval(interval);
  };
});
</script>


<style scoped>
.header {
  background-color: #007AFF;
  color: white;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.main-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  padding-bottom: 80px;
}

.about-content {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.about-content h2 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.5rem;
}

.about-text {
  line-height: 1.6;
  color: #555;
}

.about-text p {
  margin-bottom: 1rem;
}

.about-text ul {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.about-text li {
  margin-bottom: 0.5rem;
}

.debug-info {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
}

.debug-info h3 {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 1rem;
  font-weight: 600;
}

.debug-info p {
  margin: 0.5rem 0;
  color: #6c757d;
}

.debug-info ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.debug-info li {
  margin: 0.25rem 0;
  color: #495057;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .header {
    padding: 0.75rem;
  }
  
  .header h1 {
    font-size: 1.25rem;
  }
  
  .main-content {
    padding: 0.75rem;
  }
  
  .about-content {
    padding: 1rem;
  }
}

</style> 