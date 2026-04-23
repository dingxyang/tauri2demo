<!--
  统一的页面顶部 Header 组件
  - 白底 + 底部细分割线（iOS 风）
  - 桌面 / 移动端同一套样式，高度固定 52px
  - 支持左侧（如返回按钮）/ 右侧（如设置图标、工具按钮）插槽
  - 当存在 left slot 时，标题居中；否则左对齐
-->
<template>
  <header class="page-header">
    <div class="page-header__left">
      <slot name="left" />
    </div>
    <h1 class="page-header__title" :class="{ 'is-centered': hasLeft }">
      <slot name="title">{{ title }}</slot>
    </h1>
    <div class="page-header__right">
      <slot name="right" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

defineProps<{
  title?: string
}>()

const slots = useSlots()
const hasLeft = computed(() => !!slots.left)
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 52px;
  padding: 0 16px;
  background: #ffffff;
  border-bottom: 0.5px solid #e5e5e5;
  flex-shrink: 0;
  box-sizing: border-box;
}

@media (min-width: 600px) {
  .page-header {
    padding: 0 20px;
  }
}

.page-header__left,
.page-header__right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.page-header__title {
  flex: 1;
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #1a1a1a;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-header__title.is-centered {
  text-align: center;
}
</style>
