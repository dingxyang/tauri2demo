<script setup lang="ts">
defineProps<{
  recording: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  start: []
  stop: []
}>()

function handleClick(recording: boolean, loading: boolean) {
  if (loading) return
  if (recording) {
    emit('stop')
  } else {
    emit('start')
  }
}
</script>

<template>
  <div class="record-wrapper">
    <button
      class="record-btn"
      :class="{ recording, loading }"
      :disabled="loading"
      @click="handleClick(recording, loading)"
    >
      <!-- Loading spinner -->
      <svg v-if="loading" class="icon-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
      <!-- Stop square -->
      <svg v-else-if="recording" width="24" height="24" viewBox="0 0 24 24" fill="white">
        <rect x="6" y="6" width="12" height="12" rx="2" />
      </svg>
      <!-- Microphone -->
      <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    </button>
    <div class="record-hint">
      <span v-if="loading">评测中...</span>
      <span v-else-if="recording">点击结束</span>
      <span v-else>点击跟读</span>
    </div>
  </div>
</template>

<style scoped>
.record-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 0;
}

.record-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background: #67c23a;
  box-shadow: 0 4px 14px rgba(103, 194, 58, 0.35);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.record-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.record-btn.recording {
  background: #f56c6c;
  box-shadow: 0 4px 14px rgba(245, 108, 108, 0.35);
}

.record-btn.loading {
  background: #909399;
  box-shadow: 0 4px 14px rgba(144, 147, 153, 0.25);
  cursor: not-allowed;
}

.record-hint {
  font-size: 13px;
  color: #999;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.icon-spin {
  animation: spin 1s linear infinite;
}
</style>
