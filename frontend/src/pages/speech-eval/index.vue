<script setup lang="ts">
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { ElMessage } from 'element-plus'
import RecordButton from './components/RecordButton.vue'
import EvalResult from './components/EvalResult.vue'
import { useDailySentence } from './composables/useDailySentence'

defineOptions({
  name: 'SpeechEval',
})

interface EvalResultData {
  overall: number
  pronunciation: number
  fluency: number
  integrity: number
  words: { word: string; overall: number; pronunciation: number; read_type: number }[]
}

const { sentence, shownCount, total } = useDailySentence()
const recording = ref(false)
const loading = ref(false)
const evalResult = ref<EvalResultData | null>(null)
const errorMsg = ref('')

async function handleStart() {
  errorMsg.value = ''
  evalResult.value = null

  try {
    await invoke('start_recording')
    recording.value = true
  } catch (e: any) {
    errorMsg.value = e.toString()
    ElMessage.error('启动录音失败: ' + e)
  }
}

async function handleStop() {
  recording.value = false
  loading.value = true
  errorMsg.value = ''

  try {
    const result = await invoke<EvalResultData>('stop_recording_and_evaluate', {
      lang: 'sp',
      category: 'sent',
      refText: sentence.value.sentence_original,
    })
    evalResult.value = result
  } catch (e: any) {
    errorMsg.value = e.toString()
    ElMessage.error('评测失败: ' + e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="daily-sentence-page">
    <!-- Header -->
    <div class="page-header">
      <div class="page-title">每日一句</div>
      <div class="page-progress">{{ shownCount }}/{{ total }}</div>
    </div>

    <div class="page-body">
      <!-- Sentence card -->
      <div class="sentence-card">
        <div class="lang-label">ESPAÑOL</div>
        <div class="sentence-original">{{ sentence.sentence_original }}</div>
        <div class="divider"></div>
        <div class="lang-label">中文翻译</div>
        <div class="sentence-translation">{{ sentence.sentence_translation }}</div>
      </div>

      <!-- Record button -->
      <RecordButton
        :recording="recording"
        :loading="loading"
        @start="handleStart"
        @stop="handleStop"
      />

      <!-- Error message -->
      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

      <!-- Eval result -->
      <EvalResult :result="evalResult" />
    </div>
  </div>
</template>

<style scoped>
.daily-sentence-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fafafa;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: white;
  border-bottom: 1px solid #ebeef5;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #333;
}

.page-progress {
  font-size: 13px;
  color: #999;
}

.page-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.sentence-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lang-label {
  font-size: 11px;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.sentence-original {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  line-height: 1.6;
}

.sentence-translation {
  font-size: 15px;
  color: #666;
  line-height: 1.5;
}

.divider {
  height: 1px;
  background: #f0f0f0;
}

.error-msg {
  color: #f56c6c;
  font-size: 13px;
  text-align: center;
  padding: 8px;
  background: #fef0f0;
  border-radius: 4px;
  margin-bottom: 16px;
}
</style>
