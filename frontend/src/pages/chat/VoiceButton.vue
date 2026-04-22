<template>
  <div class="voice-area">
    <div class="voice-container">
      <button class="voice-btn" :class="{ 'voice-active': isPressed }"
        @touchstart.prevent="onTouchStart" @touchmove.prevent="onTouchMove" @touchend.prevent="onTouchEnd"
        @mousedown.prevent="onMouseDown" @mouseup.prevent="onMouseUp" @mouseleave.prevent="onMouseLeave">
        <div v-if="isPressed" class="sound-wave">
          <span v-for="i in 5" :key="i" class="wave-bar" :style="{ animationDelay: `${i * 0.1}s` }"></span>
        </div>
        <span v-else>按住说话</span>
      </button>
      <div v-if="isPressed" class="voice-hint">松开发送 上移取消</div>
    </div>
    <button class="mode-toggle" @click="$emit('switch-to-text')" title="切换到文本输入">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <line x1="6" y1="10" x2="18" y2="10"/>
        <line x1="6" y1="14" x2="14" y2="14"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const emit = defineEmits<{ 'switch-to-text': []; 'start-recording': []; 'send-recording': []; 'cancel-recording': [] }>();
const isPressed = ref(false);
const startY = ref(0);

function onTouchStart(e: TouchEvent) { startY.value = e.touches[0].clientY; isPressed.value = true; emit('start-recording'); }
function onTouchMove(_e: TouchEvent) { /* touch move is handled in onTouchEnd */ }
function onTouchEnd(e: TouchEvent) {
  if (!isPressed.value) return;
  const currentY = e.changedTouches[0].clientY;
  isPressed.value = false;
  if (startY.value - currentY > 80) { emit('cancel-recording'); } else { emit('send-recording'); }
}
function onMouseDown() { isPressed.value = true; startY.value = 0; emit('start-recording'); }
function onMouseUp() { if (!isPressed.value) return; isPressed.value = false; emit('send-recording'); }
function onMouseLeave() { if (!isPressed.value) return; isPressed.value = false; emit('cancel-recording'); }
</script>

<style scoped>
.voice-area { display: flex; align-items: center; gap: 12px; width: 100%; }
.voice-container { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.voice-btn { width: 100%; height: 44px; border: none; background: #f5f5f5; border-radius: 22px; font-size: 15px; color: #333; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; user-select: none; -webkit-user-select: none; }
.voice-active { background: #e8e8e8; transform: scale(1.02); }
.sound-wave { display: flex; align-items: center; gap: 3px; height: 24px; }
.wave-bar { width: 3px; height: 8px; background: #2B5CE6; border-radius: 2px; animation: wave 0.6s ease-in-out infinite; }
@keyframes wave { 0%, 100% { height: 8px; } 50% { height: 20px; } }
.voice-hint { font-size: 12px; color: #999; }
.mode-toggle { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: none; background: none; cursor: pointer; color: #666; border-radius: 8px; flex-shrink: 0; }
.mode-toggle:active { background: #f5f5f5; }
</style>
