<template>
  <div class="message-list" ref="listRef">
    <div v-if="messages.length === 0" class="empty-guide">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c0c4cc" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <p class="guide-text">开始一段西班牙语对话吧</p>
      <button v-if="showScenarioEntry" class="scenario-entry-btn" @click="emit('open-scenarios')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
          <line x1="9" y1="9" x2="9.01" y2="9"/>
          <line x1="15" y1="9" x2="15.01" y2="9"/>
        </svg>
        试试情景对话
      </button>
    </div>
    <template v-else>
      <MessageItem v-for="msg in messages" :key="msg.id" :message="msg" :is-playing="playingMessageId === msg.id" @play-tts="handlePlayTts" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import MessageItem from './MessageItem.vue';
import type { Message } from '@/stores/chat';

const props = defineProps<{ messages: Message[]; playingMessageId: string | null; showScenarioEntry: boolean }>();
const emit = defineEmits<{ 'play-tts': [message: Message]; 'open-scenarios': [] }>();
const listRef = ref<HTMLElement | null>(null);

function scrollToBottom() {
  nextTick(() => { if (listRef.value) { listRef.value.scrollTop = listRef.value.scrollHeight; } });
}

function handlePlayTts(msg: Message) { emit('play-tts', msg); }

watch(() => props.messages.length, () => scrollToBottom());
watch(() => { const last = props.messages[props.messages.length - 1]; return last?.content?.length || 0; }, () => scrollToBottom());

defineExpose({ scrollToBottom });
</script>

<style scoped>
.message-list { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 16px 16px 8px; }
.message-list::-webkit-scrollbar { width: 4px; }
.message-list::-webkit-scrollbar-track { background: transparent; }
.message-list::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
.empty-guide { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 16px; }
.guide-text { font-size: 15px; color: #999; }
.scenario-entry-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 20px; border: 1px solid #2B5CE6; border-radius: 20px; background: #fff; color: #2B5CE6; font-size: 14px; cursor: pointer; transition: all 0.15s; }
.scenario-entry-btn:active { background: #2B5CE6; color: #fff; }
</style>
