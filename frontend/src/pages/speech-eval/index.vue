<script setup lang="ts">
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { ElSelect, ElOption, ElInput, ElMessage } from 'element-plus'
import RecordButton from './components/RecordButton.vue'
import EvalResult from './components/EvalResult.vue'

defineOptions({
  name: 'SpeechEval'
})

interface EvalResultData {
  overall: number
  pronunciation: number
  fluency: number
  integrity: number
  words: { word: string; overall: number; pronunciation: number; read_type: number }[]
}

const lang = ref('sp')
const category = ref('sent')
const refText = ref('Hola, bienvenido a España.')
const recording = ref(false)
const loading = ref(false)
const evalResult = ref<EvalResultData | null>(null)
const errorMsg = ref('')

const languages = [
  { value: 'sp', label: '西班牙语' },
  { value: 'en', label: '英语' },
  { value: 'cn', label: '中文' },
  { value: 'jp', label: '日语' },
  { value: 'kr', label: '韩语' },
  { value: 'fr', label: '法语' },
  { value: 'de', label: '德语' },
  { value: 'ru', label: '俄语' },
]

const categories = [
  { value: 'word', label: '单词' },
  { value: 'sent', label: '句子' },
  { value: 'para', label: '段落' },
]

async function handleStart() {
  errorMsg.value = ''
  evalResult.value = null

  if (!refText.value.trim()) {
    ElMessage.warning('请输入参考文本')
    return
  }

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
      lang: lang.value,
      category: category.value,
      refText: refText.value,
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
  <el-container class="speech-eval-page">
    <el-header class="page-header">
      <h2 class="page-title">语音评测</h2>
    </el-header>

    <el-main class="page-main">
      <!-- 参数区域 -->
      <div class="config-section">
        <div class="config-row">
          <label class="config-label">语言</label>
          <el-select v-model="lang" size="default" style="width: 140px">
            <el-option
              v-for="item in languages"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>

        <div class="config-row">
          <label class="config-label">类型</label>
          <el-select v-model="category" size="default" style="width: 140px">
            <el-option
              v-for="item in categories"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>

        <div class="config-row">
          <label class="config-label">参考文本</label>
          <el-input
            v-model="refText"
            type="textarea"
            :rows="3"
            placeholder="请输入要朗读的文本"
            :maxlength="4096"
            show-word-limit
          />
        </div>
      </div>

      <!-- 录音按钮 -->
      <RecordButton
        :recording="recording"
        :loading="loading"
        @start="handleStart"
        @stop="handleStop"
      />

      <!-- 错误信息 -->
      <div v-if="errorMsg" class="error-msg">
        {{ errorMsg }}
      </div>

      <!-- 评测结果 -->
      <EvalResult :result="evalResult" />
    </el-main>
  </el-container>
</template>

<style scoped>
.speech-eval-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  height: auto;
  background: white;
  border-bottom: 1px solid #ebeef5;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.page-main {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.config-section {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.config-row {
  margin-bottom: 12px;
}

.config-row:last-child {
  margin-bottom: 0;
}

.config-label {
  display: block;
  font-size: 14px;
  color: #606266;
  margin-bottom: 6px;
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
