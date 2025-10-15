<!-- 字典页 -->
<template>
  <div class="dictionary-page">
    <h2>翻译助手</h2>
    <!-- 输入框 -->
    <el-input
      :rows="4"
      type="textarea"
      v-model="input"
      placeholder="请输入内容"
      @input="translate"
      resize="none"
    />
    <h2>翻译结果</h2>
    <!-- 使用Markdown渲染翻译结果 -->
    <div class="markdown-result" v-html="markdownResult"></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElInput } from "element-plus";
import MarkdownIt from "markdown-it";
const input = ref("");
const markdownResult = ref("");

const mdi = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
  typographer: true,
});

// 搜索
const translate = () => {
  console.log(input.value);
  markdownResult.value = mdi.render(input.value);
};
</script>

<style scoped>
.dictionary-page {
  padding: 20px;
  max-width: 100%;
  box-sizing: border-box;
  padding-bottom: 100px; /* 为底部导航栏留出空间 */
}

.markdown-result {
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 5px;
  max-width: 100%;
  max-height: 400px; /* 限制最大高度 */
  overflow: auto; /* 内容超出时显示滚动条 */
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
  box-sizing: border-box;
}

/* 确保markdown内容中的元素不超出容器 */
.markdown-result * {
  max-width: 100%;
  box-sizing: border-box;
}

/* 处理代码块 */
.markdown-result pre {
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 处理表格 */
.markdown-result table {
  width: 100%;
  table-layout: fixed;
  word-wrap: break-word;
}

/* 处理图片 */
.markdown-result img {
  max-width: 100%;
  height: auto;
}
</style>
