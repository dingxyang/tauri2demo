<template>
  <el-dialog :model-value="visible" @update:model-value="$emit('close')" title="对话总结评测" width="90%" :close-on-click-modal="true">
    <div v-if="!result && !loading" class="summary-ready">
      <p class="summary-desc">AI 将分析你在本次对话中的西语表现，从语法、词汇、流利度等方面给出评价和改进建议。</p>
      <el-button type="primary" @click="generateSummary" style="background: #2B5CE6; border-color: #2B5CE6; width: 100%;">
        开始评测
      </el-button>
    </div>
    <div v-if="loading" class="summary-loading">
      <div class="loading-spinner"></div>
      <p>正在分析对话内容...</p>
    </div>
    <div v-if="result" class="summary-result">
      <div class="result-section" v-html="renderedResult"></div>
    </div>
    <template #footer>
      <el-button @click="$emit('close')">{{ result ? '关闭' : '取消' }}</el-button>
      <el-button v-if="result" type="primary" @click="generateSummary" style="background: #2B5CE6; border-color: #2B5CE6;">重新评测</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import { aiClientManager } from '@/services/aiClientManager';
import type { ChatSession } from '@/stores/chat';

const props = defineProps<{
  visible: boolean;
  session?: ChatSession;
}>();

const emit = defineEmits<{ 'close': [] }>();

const settingsStore = useSettingsStore();
const loading = ref(false);
const result = ref('');

const renderedResult = computed(() => {
  return result.value
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<u>$1</u>');
});

async function generateSummary() {
  if (!props.session || props.session.messages.length === 0) return;

  const modelInfo = settingsStore.settingsState.defaultModelInfo;
  if (!modelInfo) {
    result.value = '请先在设置中配置 AI 模型';
    return;
  }

  loading.value = true;
  result.value = '';

  try {
    const userMessages = props.session.messages
      .filter(m => m.role === 'user')
      .map(m => m.content);

    const allMessages = props.session.messages
      .map(m => `${m.role === 'user' ? '用户' : 'AI'}：${m.content}`)
      .join('\n');

    const systemPrompt = `你是一位专业的西班牙语教师。请根据以下对话内容，对用户的西语表现进行全面评测。

评测要求：
1. **总体评价**：给出一个总体评分（1-10分）和简短总结
2. **语法分析**：指出语法错误并给出正确用法
3. **词汇使用**：评价词汇的丰富度和准确性
4. **流利度**：评价表达的流畅程度
5. **改进建议**：给出具体的改进方向和练习建议

请用中文回复，西语示例保留原文。`;

    let fullText = '';

    await aiClientManager.chatStream({
      messages: [{ role: 'user', content: allMessages }],
      currentModelInfo: modelInfo,
      systemPrompt,
      onData: (chunk: string) => {
        fullText += chunk;
        result.value = fullText;
      },
      abortController: new AbortController(),
    });
  } catch (e) {
    result.value = '评测生成失败，请稍后重试';
    console.error(e);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.summary-ready { text-align: center; padding: 20px 0; }
.summary-desc { font-size: 14px; color: #606266; line-height: 1.6; margin-bottom: 16px; }
.summary-loading { display: flex; flex-direction: column; align-items: center; padding: 40px 0; gap: 12px; color: #909399; font-size: 14px; }
.loading-spinner { width: 32px; height: 32px; border: 3px solid #ebeef5; border-top-color: #2B5CE6; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.summary-result { padding: 4px 0; }
.result-section { font-size: 14px; line-height: 1.8; color: #303133; }
.result-section :deep(strong) { color: #2B5CE6; }
</style>
