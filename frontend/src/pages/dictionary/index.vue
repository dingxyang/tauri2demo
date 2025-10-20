<!-- 字典页 -->
<template>
  <el-container class="dictionary-container" @click="handleContainerClick">
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
          <el-button @click="aiChat(RequestType.CN_TO_ES)" :disabled="isLoading">中文翻译</el-button>
          <el-button @click="aiChat(RequestType.ES_TO_CN)" :disabled="isLoading">西语翻译</el-button>
          <!-- <el-button @click="aiChat(RequestType.CHAT)" :disabled="isLoading">AI对话</el-button> -->
          <el-button @click="clearInput" :disabled="isLoading">清空</el-button>
          <el-button v-if="isLoading" @click="abortRequest" type="danger">终止</el-button>
        </div>
      <!-- 加载状态（仅在没有流式内容时显示） -->
      <div v-if="isLoading && !streamingText" class="loading-state">
        <div class="loading-spinner"></div>
        正在会话中...
      </div>
      <!-- 使用Markdown渲染翻译结果 -->
      <div
        v-if="markdownResult || (isLoading && streamingText)"
        class="markdown-result"
      >
        <div v-html="markdownResult"></div>
      </div>
      
      <!-- 文本选择弹窗 -->
      <TextSelectionPopup
        :visible="textSelection.isVisible.value"
        :selected-text="textSelection.selectedText.value"
        :selection-rect="textSelection.selectionRect.value"
        @close="textSelection.hidePopup"
        @translate="handlePopupTranslate"
      />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { ElInput, ElMessage, ElButton } from "element-plus";
import { Setting } from "@element-plus/icons-vue";
import MarkdownIt from "markdown-it";
import { callOpenAI, callOpenAIStream, RequestType } from "../../services/openai";
import { handleError, generateErrorMarkdown } from "../../utils/errorHandler";
import { useRouter } from "vue-router";
import { useSettingsStore } from "@/stores/settings";
import { useShikiHighlighter } from './hooks/useShikiHighlighter';
import { useTextSelection } from './hooks/useTextSelection';
import TextSelectionPopup from './components/TextSelectionPopup.vue';

const router = useRouter();
const settingsStore = useSettingsStore();
const userInput = ref('挖土机');
const markdownResult = ref("");
const isLoading = ref(false);
const streamingText = ref(""); // 存储流式输出的原始文本
const useStreaming = ref(true); // 默认使用流式输出
const currentAbortController = ref<AbortController | null>(null); // 当前请求的终止控制器

// 使用文本选择功能
const textSelection = useTextSelection({
  containerSelector: '.markdown-result',
  minTextLength: 1,
  maxTextLength: 100,
  enableMobile: true,
  autoHideDelay: 5000
});

const settings = computed(() => settingsStore.settingsState);


// 高亮任务管理
const highlightTasks = new Map();
const { codeToHtml } = useShikiHighlighter();

const mdi = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
  typographer: true,
  highlight: (code, language) => {
    const id = `shiki-${Date.now()}-${Math.random()}`;
    highlightTasks.set(id, codeToHtml(code, language));
    return `<div data-shiki-id="${id}"></div>`;
  },
});

// 处理异步高亮结果
const processHighlightedContent = async (html: string) => {
  let processedHtml = html;

  // 查找所有需要替换的占位符
  const placeholders = Array.from(html.matchAll(/<div data-shiki-id="([^"]+)"><\/div>/g));

  // 等待所有高亮任务完成并替换
  for (const [fullMatch, id] of placeholders) {
    if (highlightTasks.has(id)) {
      try {
        const highlightedCode = await highlightTasks.get(id);
        processedHtml = processedHtml.replace(fullMatch, highlightedCode);
        highlightTasks.delete(id); // 清理已完成的任务
      } catch (error) {
        console.error('代码高亮失败:', error);
        processedHtml = processedHtml.replace(fullMatch, `<code>代码高亮失败</code>`);
      }
    }
  }

  return processedHtml;
};


// 跳转至设置页面
const goToSettings = () => {
  router.push({ path: "/settings" });
};

// 处理容器点击事件
const handleContainerClick = (event: MouseEvent) => {
  textSelection.hidePopup();
};

// 清空内容
const clearInput = () => {
  userInput.value = "挖土机";
  markdownResult.value = "";
  streamingText.value = "";
};

// 终止当前请求
const abortRequest = () => {
  if (currentAbortController.value) {
    currentAbortController.value.abort();
    currentAbortController.value = null;
    isLoading.value = false;
  }
};

// 处理弹窗翻译
const handlePopupTranslate = async (text: string) => {
  if (!text.trim()) return;
  
  // 将选中的文本放入输入框
  userInput.value = text;
  
  // 延迟清除选择，确保弹窗先关闭
  setTimeout(() => {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  }, 100);
  
  // 等待DOM更新后开始翻译
  await nextTick();
  
  // 自动开始翻译（默认西语翻译）
  await aiChat(RequestType.ES_TO_CN);
};


// 翻译函数（支持流式和普通输出）
const aiChat = async (prompt: RequestType) => {
  if (!userInput.value.trim()) {
    markdownResult.value = "";
    streamingText.value = "";
    return;
  }

  // 创建新的AbortController
  currentAbortController.value = new AbortController();
  isLoading.value = true;
  streamingText.value = ""; // 清空之前的流式文本
  markdownResult.value = ""; // 清空之前的结果

  try {
    if (useStreaming.value) {
      // 使用流式输出
      await callOpenAIStream({
        text: userInput.value,
        onData: async (chunk: string) => {
        // 每收到一个数据块就更新显示
        streamingText.value += chunk;
        const rawHtml = mdi.render(streamingText.value);
        markdownResult.value = await processHighlightedContent(rawHtml);
      },
        apiBaseUrl: settings.value.openai.apiBaseUrl,
        apiKey: settings.value.openai.apiKey,
        requestType: prompt,
        abortController: currentAbortController.value
      });
    } else {
      // 使用普通输出
      const result = await callOpenAI({
        text: userInput.value,
        apiBaseUrl: settings.value.openai.apiBaseUrl,
        apiKey: settings.value.openai.apiKey,
        requestType: prompt,
        abortController: currentAbortController.value
      });
      const rawHtml = mdi.render(result);
      markdownResult.value = await processHighlightedContent(rawHtml);
    }

    ElMessage.success("会话完成");
  } catch (error) {
    // 使用统一的错误处理
    const errorInfo = handleError(error);
    const rawHtml = mdi.render(generateErrorMarkdown(errorInfo));
    markdownResult.value = await processHighlightedContent(rawHtml);
  } finally {
    isLoading.value = false;
    currentAbortController.value = null; // 清理AbortController
    
    // 翻译完成后重新初始化容器元素，确保文本选择功能正常
    setTimeout(() => {
      textSelection.reinitContainer();
    }, 200);
  }
};
</script>

<style scoped>
.button-container {
  margin-top: 10px;
  margin-bottom: 10px;
}

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


/* 文本选择增强样式 */
.markdown-result {
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
}

.markdown-result::selection {
  background-color: #409eff;
  color: white;
}

.markdown-result::-moz-selection {
  background-color: #409eff;
  color: white;
}
</style>
