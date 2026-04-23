<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import type { ListItem } from "../../types";
import { NEWS_LIST } from "./new";
import { useScrollRestoration } from "@/utils/useScrollRestoration";
import PageHeader from "@/layouts/PageHeader.vue";

// 定义组件名称，用于keep-alive
defineOptions({
  name: 'Home'
});

const router = useRouter();

// 保存滚动位置
const mainContentRef = ref<HTMLElement | null>(null);
useScrollRestoration({ selector: '.main-content' });

// 文章列表数据
// 加入月份维度，数据结构按月份分组
const listItemsByMonth = ref<Record<string, ListItem[]>>(NEWS_LIST);

const activeNames = ref<string[]>(['2026-04','2026-03','2025-12','2025-11', '2025-10', '2025-08', '2025-06', '2025-04', '2024-12', '2024-09']);

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
  <div class="home-page">
    <PageHeader title="行业动态" />

    <div class="main-content" ref="mainContentRef">
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
    </div>
  </div>
</template>

<style scoped>
.home-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f5f5f5;
}

.main-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

@media (min-width: 600px) {
  .main-content {
    padding: 20px;
  }
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
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  max-width: 720px;
  margin: 0 auto;
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
@media (max-width: 600px) {
  .list-container {
    padding: 1rem;
  }

  .list-item {
    padding: 0.75rem;
  }
}

</style>
