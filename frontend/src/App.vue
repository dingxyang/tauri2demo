<script setup lang="ts">
import { ref } from "vue";
import { HomePage, DetailPage, AboutPage, BottomNav } from "./components";
import type { ListItem, PageType } from "./types";

// 当前页面状态
const currentPage = ref<PageType>('home');

// 当前选中的项目
const selectedItem = ref<ListItem | null>(null);

// 切换到详情页
function goToDetail(item: ListItem) {
  selectedItem.value = item;
  currentPage.value = 'detail';
}

// 返回主页
function goBack() {
  currentPage.value = 'home';
  selectedItem.value = null;
}

// 切换底部导航
function switchTab(tab: 'home' | 'about') {
  currentPage.value = tab;
  selectedItem.value = null;
}
</script>

<template>
  <div class="app">
    <!-- 主页 -->
    <HomePage 
      v-if="currentPage === 'home'"
      @go-to-detail="goToDetail"
    />

    <!-- 详情页 -->
    <DetailPage 
      v-if="currentPage === 'detail'"
      :selected-item="selectedItem"
      @go-back="goBack"
    />

    <!-- 说明页 -->
    <AboutPage 
      v-if="currentPage === 'about'"
    />

    <!-- 底部工具栏 -->
    <BottomNav 
      :current-page="currentPage"
      @switch-tab="switchTab"
    />
  </div>
</template>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}


</style>