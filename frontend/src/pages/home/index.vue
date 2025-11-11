<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import type { ListItem } from "../../types";
import { NEWS_LIST } from "./new";
import { useScrollRestoration } from "@/utils/useScrollRestoration";

// 定义组件名称，用于keep-alive
defineOptions({
  name: 'Home'
});

const router = useRouter();

// 保存滚动位置
const mainContentRef = ref<HTMLElement | null>(null);
useScrollRestoration({ selector: '.el-main' });

// 文章列表数据
// 加入月份维度，数据结构按月份分组
const listItemsByMonth = ref<Record<string, ListItem[]>>(NEWS_LIST);

const activeNames = ref<string[]>(['2025-11', '2025-10', '2025-08', '2025-06', '2025-04', '2024-12', '2024-09']);

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
    <el-header class="home-header">
      <div class="page-title">行业动态</div>
    </el-header>
    
    <el-main class="main-content" ref="mainContentRef">
      <div class="list-container">
        <div v-for="month in Object.keys(listItemsByMonth)" :key="month">
          <el-collapse  v-model="activeNames">
            <el-collapse-item :title="month" :name="month">
              <div class="list">
                <div 
                  v-for="item in listItemsByMonth[month]" 
                  :key="item.id"
                  class="list-item"
                  @click="goToDetail(item)"
                >
                  <div class="item-title">{{ item.publishTime }} - {{ item.title }}</div>
                  <div class="item-description">{{ item.description }}</div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
    </el-main>
  </el-container>
</template>

<style scoped>
.home-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.home-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  padding: 20px 20px 0 20px;
  z-index: 10;
}

.main-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

/* 自定义滚动条样式 */
.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.main-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
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
  .home-header {
    padding: 12px 16px 0 16px;
  }
  
  .page-title {
    font-size: 16px;
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
