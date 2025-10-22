<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import type { ListItem } from "../../types";

const router = useRouter();

// 列表数据
const listItems = ref<ListItem[]>([
  { id: 1, title: '项目一', description: '这是第一个项目的描述' },
  { id: 2, title: '项目二', description: '这是第二个项目的描述' },
  { id: 3, title: '项目三', description: '这是第三个项目的描述' },
  { id: 4, title: '项目四', description: '这是第四个项目的描述' },
  { id: 5, title: '项目五', description: '这是第五个项目的描述' },
]);

// 切换到详情页
function goToDetail(item: ListItem) {
  router.push({
    name: 'Detail',
    params: { id: item.id.toString() },
    query: { 
      title: item.title,
      description: item.description
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
        <h2>项目列表</h2>
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