<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

// 从路由参数获取数据
const selectedItem = computed(() => {
  const id = route.params.id;
  const title = route.query.title as string;
  const description = route.query.description as string;
  
  if (id && title && description) {
    return {
      id: parseInt(id as string),
      title,
      description
    };
  }
  return null;
});

// 返回主页
function goBack() {
  router.push('/');
}
</script>

<template>
  <div class="detail-page">
    <header class="header">
      <button class="back-button" @click="goBack">
        ← 返回
      </button>
      <h1>详情页</h1>
    </header>
    
    <main class="main-content">
      <div v-if="selectedItem" class="detail-content">
        <h2>{{ selectedItem.title }}</h2>
        <div class="detail-text">
          <p>这是关于 {{ selectedItem.title }} 的详细描述。</p>
          <p>这里可以显示更多的文字内容，包括项目的详细信息、功能特点、技术栈等。</p>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
          <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
        </div>
      </div>
    </main>
  </div>
</template>

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

.back-button {
  background: none;
  border: none;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: rgba(255,255,255,0.1);
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

.detail-content {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.detail-content h2 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.5rem;
}

.detail-text {
  line-height: 1.6;
  color: #555;
}

.detail-text p {
  margin-bottom: 1rem;
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
  
  .detail-content {
    padding: 1rem;
  }
}


</style> 