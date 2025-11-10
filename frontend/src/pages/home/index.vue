<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import type { ListItem } from "../../types";

const router = useRouter();

// 文章列表数据
// 加入月份维度，数据结构按月份分组
const listItemsByMonth = ref<Record<string, ListItem[]>>({
  "2025-11": [
    { 
      id: 2, 
      title: '巴拿马官员：中企承建的运河第四大桥让巴拿马人倍感自豪', 
      description: '巴拿马官员：中企承建的运河第四大桥让巴拿马人倍感自豪 ... 由中国交建和中国港湾联营体承建的巴拿马运河第四大桥东主塔承台首层混凝土11月1日正式开始浇筑，...',
      url: 'https://news.qq.com/rain/a/20251102A03SAY00',
      publishTime: '2024-11-04'
    },
    { 
      id: 1, 
      title: '国内业务下滑海外签单大涨，基建巨头集体出海“掘金”', 
      description: '中国交建是我国的基建出海龙头之一。近几年来，中国交建拿下的类似海外业务数量不少。2023年，该集团境外新签订单3197.46亿元， ...',
      url: 'https://cj.sina.com.cn/articles/view/1733360754/6750fc7202001e6u0',
      publishTime: '2024-11-04'
    }
  ],
  "2025-10": [
    { 
      id: 1, 
      title: '中美在马来西亚吉隆坡举行经贸磋商', 
      description: '当地时间10月25日至26日，中美经贸中方牵头人、国务院副总理何立峰与美方牵头人、美国财政部长贝森特和贸易代表格里尔在马来西亚吉隆坡举行中美经贸 ...',
      url: 'https://www.gov.cn/yaowen/liebiao/202510/content_7045727.htm',
      publishTime: '2024-11-04'
    },
  ]
});

const activeNames = ref<string[]>(['2025-11', '2025-10']);

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
      <h1>行业动态</h1>
    </el-header>
    
    <el-main class="main-content">
      <div class="list-container">
        <div v-for="month in Object.keys(listItemsByMonth)" :key="month">
          <el-collapse v-model="activeNames">
            <el-collapse-item :title="month" :name="month">
              <div class="list">
                <div 
                  v-for="item in listItemsByMonth[month]" 
                  :key="item.id"
                  class="list-item"
                  @click="goToDetail(item)"
                >
                  <div class="item-title">{{ item.title }}</div>
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