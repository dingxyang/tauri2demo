<template>
  <div class="voice-area">
    <div class="voice-container">
      <div class="voice-btn-wrapper" ref="btnRef">
        <button class="voice-btn" :class="{ 'voice-active': isPressed, 'voice-cancel': isInCancelZone }"
          @touchstart.prevent="onTouchStart" @touchmove.prevent="onTouchMove" @touchend.prevent="onTouchEnd"
          @mousedown.prevent="onMouseDown" @mouseup.prevent="onMouseUp" @mouseleave.prevent="onMouseLeave">
          <div v-if="isPressed && !isInCancelZone && !partialText" class="sound-wave">
            <span v-for="i in 5" :key="i" class="wave-bar" :style="{ animationDelay: `${i * 0.1}s` }"></span>
          </div>
          <span v-else-if="isInCancelZone" class="cancel-text">松开取消</span>
          <span v-else-if="isPressed && partialText" class="partial-text">{{ partialText }}</span>
          <span v-else>按住说话</span>
        </button>
        <!-- Cancel zone indicator -->
        <transition name="cancel-zone">
          <div v-if="isPressed" class="cancel-zone-hint">
            <div class="cancel-zone-icon" :class="{ active: isInCancelZone }">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
          </div>
        </transition>
      </div>
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
import { ref, onUnmounted } from 'vue';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

const emit = defineEmits<{ 'switch-to-text': []; 'start-recording': []; 'send-recording': []; 'cancel-recording': [] }>();
const isPressed = ref(false);
const isInCancelZone = ref(false);
const btnRef = ref<HTMLElement | null>(null);
const partialText = ref('');
let unlisten: UnlistenFn | null = null;

// Cancel zone: a small fan-shaped area above the button center
// Within ~80px upward AND within ~60px horizontally from center
function isInFanZone(touchX: number, touchY: number): boolean {
  const btn = btnRef.value?.querySelector('.voice-btn');
  if (!btn) return false;
  const rect = btn.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top;
  const dx = Math.abs(touchX - centerX);
  const dy = centerY - touchY; // positive = finger above button
  // Fan shape: upward distance 40-120px, horizontal spread widens with height
  if (dy < 40 || dy > 120) return false;
  // Max horizontal spread at dy: widens from 20px at dy=40 to 60px at dy=120
  const maxSpread = 20 + (dy - 40) * 0.5;
  return dx <= maxSpread;
}

async function startListening() {
  partialText.value = '';
  try {
    unlisten = await listen<{ text: string; is_final: boolean }>('asr-partial', (event) => {
      if (event.payload.text) {
        partialText.value = event.payload.text;
      }
    });
  } catch (e) {
    console.warn('Failed to listen for asr-partial events:', e);
  }
}

function stopListening() {
  if (unlisten) {
    unlisten();
    unlisten = null;
  }
  partialText.value = '';
}

function onTouchStart(e: TouchEvent) {
  isPressed.value = true;
  isInCancelZone.value = false;
  emit('start-recording');
  startListening();
}

function onTouchMove(e: TouchEvent) {
  if (!isPressed.value) return;
  const touch = e.touches[0];
  isInCancelZone.value = isInFanZone(touch.clientX, touch.clientY);
}

function onTouchEnd(e: TouchEvent) {
  if (!isPressed.value) return;
  isPressed.value = false;
  stopListening();
  if (isInCancelZone.value) {
    isInCancelZone.value = false;
    emit('cancel-recording');
  } else {
    emit('send-recording');
  }
}

function onMouseDown() { isPressed.value = true; isInCancelZone.value = false; emit('start-recording'); startListening(); }
function onMouseUp() { if (!isPressed.value) return; isPressed.value = false; stopListening(); isInCancelZone.value = false; emit('send-recording'); }
function onMouseLeave() { if (!isPressed.value) return; isPressed.value = false; stopListening(); isInCancelZone.value = false; emit('cancel-recording'); }

onUnmounted(() => {
  stopListening();
});
</script>

<style scoped>
.voice-area { display: flex; align-items: center; gap: 12px; width: 100%; }
.voice-container { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.voice-btn-wrapper { position: relative; width: 100%; }
.voice-btn {
  width: 100%; height: 44px; border: none; background: #f5f5f5; border-radius: 22px;
  font-size: 15px; color: #333; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; user-select: none; -webkit-user-select: none;
}
.voice-active { background: #e8e8e8; transform: scale(1.02); }
.voice-cancel { background: #fef0f0; color: #f56c6c; transform: scale(0.98); }
.cancel-text { font-size: 14px; color: #f56c6c; }
.partial-text {
  font-size: 13px; color: #333; max-width: 100%; overflow: hidden;
  text-overflow: ellipsis; white-space: nowrap; padding: 0 12px;
}
.sound-wave { display: flex; align-items: center; gap: 3px; height: 24px; }
.wave-bar { width: 3px; height: 8px; background: #2B5CE6; border-radius: 2px; animation: wave 0.6s ease-in-out infinite; }
@keyframes wave { 0%, 100% { height: 8px; } 50% { height: 20px; } }

/* Cancel zone hint above the button */
.cancel-zone-hint {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding-bottom: 12px;
  pointer-events: none;
}
.cancel-zone-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.05);
  color: #c0c4cc;
  transition: all 0.2s;
}
.cancel-zone-icon.active {
  background: #fef0f0;
  color: #f56c6c;
  transform: scale(1.1);
}
.cancel-zone-enter-active, .cancel-zone-leave-active { transition: opacity 0.15s; }
.cancel-zone-enter-from, .cancel-zone-leave-to { opacity: 0; }

.mode-toggle {
  display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;
  border: none; background: none; cursor: pointer; color: #666; border-radius: 8px; flex-shrink: 0;
}
.mode-toggle:active { background: #f5f5f5; }
</style>
