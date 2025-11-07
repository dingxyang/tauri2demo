<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import type { ListItem } from "../../types";

const router = useRouter();

// 文章列表数据
const listItems = ref<ListItem[]>([
  { 
    id: 1, 
    title: 'QShell 功能介绍', 
    description: 'QShell 功能介绍',
    url: 'https://tea4go.github.io/',
    publishTime: '2024-11-04'
  },
  { 
    id: 2, 
    title: '大模型比拼：MiniMax M2 vs GLM 4.6 vs Claude Sonnet 4.5', 
    description: '大模型比拼：MiniMax M2 vs GLM 4.6 vs Claude Sonnet 4.5',
    url: 'https://www.ruanyifeng.com/blog/2025/11/minimax-m2.html',
    publishTime: '2024-11-04'
  },
]);

// 切换到详情页
function goToDetail(item: ListItem) {
  router.push({
    name: 'Detail',
    params: { id: item.id.toString() },
    query: { 
      title: item.title,
      description: item.description,
      url: item.url || '',
      publishTime: item.publishTime || ''
    }
  });
}
</script>

<template>
  <el-container class="home-page">
    <el-header class="flex-header">
      <h1>我的应用</h1>
    </el-header>
    
    <el-main class="main-content">
      <div class="list-container">
        <h2>行业动态</h2>
        <div class="list">
          <div 
            v-for="item in listItems" 
            :key="item.id"
            class="list-item"
            @click="goToDetail(item)"
          >
            <div class="item-title">{{ item.title }}</div>
            <div class="item-description">{{ item.description }}</div>
          </div>
        </div>
      </div>
    </el-main>
  </el-container>
</template>

<style scoped>
.main-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  padding-bottom: 80px;
}

.list-container {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.list-container h2 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.25rem;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.list-item {
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  cursor: pointer;
  transition: all 0.2s ease;
}

.list-item:hover {
  background-color: #e9ecef;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.item-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.item-description {
  color: #666;
  font-size: 0.9rem;
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
  
  .list-container {
    padding: 1rem;
  }
  
  .list-item {
    padding: 0.75rem;
  }
}

</style> 