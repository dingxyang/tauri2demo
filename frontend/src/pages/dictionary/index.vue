<!-- 字典页 -->
<template>
  <el-container class="dictionary-container">
    <el-header class="dictionary-header flex-header">
      <h2>翻译助手</h2>
      <el-icon @click="goToSettings"><Setting /></el-icon>
    </el-header>
    <!-- 输入框 -->
    <el-main class="dictionary-main">
        <el-input
          :rows="4"
          type="textarea"
          v-model="userInput"
          placeholder="请输入内容"
          resize="none"
        />
        <div class="button-container">
          <el-button @click="translate">翻译</el-button>
          <el-button @click="clearInput">清空</el-button>
        </div>
      <h2>翻译结果</h2>
      <!-- 加载状态（仅在没有流式内容时显示） -->
      <div v-if="isLoading && !streamingText" class="loading-state">
        <div class="loading-spinner"></div>
        正在翻译中...
      </div>
      <!-- 使用Markdown渲染翻译结果 -->
      <div
        v-if="markdownResult || (isLoading && streamingText)"
        class="markdown-result"
      >
        <div v-html="markdownResult"></div>
        <!-- 流式输出时显示光标 -->
        <span v-if="isLoading && streamingText" class="streaming-cursor"
          >|</span
        >
      </div>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElInput, ElMessage, ElButton } from "element-plus";
import { Setting } from "@element-plus/icons-vue";
import MarkdownIt from "markdown-it";
import { callOpenAI, callOpenAIStream } from "../../services/openai";
import { handleError, generateErrorMarkdown } from "../../utils/errorHandler";
import { USER_DEFAULT_INPUT } from "@/constant";
import { useRouter } from "vue-router";
import { useSettingsStore } from "@/stores/settings";

const router = useRouter();
const settingsStore = useSettingsStore();   
const userInput = ref(USER_DEFAULT_INPUT);
const markdownResult = ref("");
const isLoading = ref(false);
const streamingText = ref(""); // 存储流式输出的原始文本
const useStreaming = ref(true); // 默认使用流式输出

const settings = computed(() => settingsStore.settingsState);

const mdi = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
  typographer: true,
});

// 跳转至设置页面
const goToSettings = () => {
  router.push({ path: "/settings" });
};

// 清空内容
const clearInput = () => {
  userInput.value = "";
  markdownResult.value = "";
  streamingText.value = "";
};

// 翻译函数（支持流式和普通输出）
const translate = async () => {
  if (!userInput.value.trim()) {
    markdownResult.value = "";
    streamingText.value = "";
    return;
  }

  isLoading.value = true;
  streamingText.value = ""; // 清空之前的流式文本
  markdownResult.value = ""; // 清空之前的结果

  try {
    if (useStreaming.value) {
      // 使用流式输出
      await callOpenAIStream(userInput.value, (chunk: string) => {
        // 每收到一个数据块就更新显示
        streamingText.value += chunk;
        markdownResult.value = mdi.render(streamingText.value);
      },
      settings.value.openai.apiBaseUrl,
      settings.value.openai.apiKey
    );
    } else {
      // 使用普通输出
      const result = await callOpenAI(userInput.value, settings.value.openai.apiBaseUrl, settings.value.openai.apiKey );
      markdownResult.value = mdi.render(result);
    }

    ElMessage.success("翻译完成");
  } catch (error) {
    // 使用统一的错误处理
    const errorInfo = handleError(error);
    markdownResult.value = mdi.render(generateErrorMarkdown(errorInfo));
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.markdown-result {
  padding: 10px;
  background-color: #ffffff;
  border-radius: 5px;
  max-width: 100%;
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

/* 加载状态样式 */
.loading-state {
  padding: 20px;
  text-align: center;
  color: #409eff;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 加载动画 */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 流式输出光标动画 */
.streaming-cursor {
  color: #409eff;
  font-weight: bold;
  animation: blink 1s infinite;
  margin-left: 2px;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}
</style>
