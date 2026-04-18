<script setup lang="ts">
import { ref, onUnmounted, computed } from 'vue'

const props = defineProps<{
  recording: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  start: []
  stop: []
}>()

const duration = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const durationText = computed(() => {
  const mins = Math.floor(duration.value / 60)
  const secs = duration.value % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

function handleClick() {
  if (props.loading) return
  if (props.recording) {
    stopTimer()
    emit('stop')
  } else {
    startTimer()
    emit('start')
  }
}

function startTimer() {
  duration.value = 0
  timer = setInterval(() => {
    duration.value++
  }, 1000)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

onUnmounted(() => {
  stopTimer()
})
</script>

<template>
  <div class="record-wrapper">
    <button
      class="record-btn"
      :class="{ recording: recording, loading: loading }"
      :disabled="loading"
      @click="handleClick"
    >
      <span v-if="loading" class="btn-icon">&#8987;</span>
      <span v-else-if="recording" class="btn-icon stop-icon">&#9632;</span>
      <span v-else class="btn-icon mic-icon">&#127908;</span>
    </button>
    <div class="record-status">
      <span v-if="loading">评测中...</span>
      <span v-else-if="recording" class="recording-text">
        录音中 {{ durationText }}
      </span>
      <span v-else class="hint-text">点击开始录音</span>
    </div>
  </div>
</template>

<style scoped>
.record-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
}

.record-btn {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 3px solid #409eff;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.record-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.record-btn.recording {
  border-color: #f56c6c;
  background: #fef0f0;
}

.record-btn.loading {
  border-color: #909399;
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-icon {
  font-size: 28px;
}

.stop-icon {
  color: #f56c6c;
}

.mic-icon {
  color: #409eff;
}

.record-status {
  font-size: 14px;
  color: #606266;
}

.recording-text {
  color: #f56c6c;
  font-weight: 500;
}

.hint-text {
  color: #909399;
}
</style>
