<template>
  <div class="chat-page">
    <ChatHeader
      :title="activeSession?.title || '对话'"
      @toggle-history="showHistory = true"
      @new-session="handleNewSession"
      @open-settings="showPromptSettings = true"
    />
    <MessageList
      ref="messageListRef"
      :messages="activeSession?.messages || []"
      :playing-message-id="playingMessageId"
      @play-tts="handlePlayTts"
    />
    <InputArea
      ref="inputAreaRef"
      @send-text="handleSendText"
      @start-recording="handleStartRecording"
      @send-recording="handleSendRecording"
      @cancel-recording="handleCancelRecording"
    />
    <HistorySidebar
      :visible="showHistory"
      :sessions="sortedSessions"
      :active-session-id="activeSessionId"
      @close="showHistory = false"
      @select-session="handleSelectSession"
      @delete-session="handleDeleteSession"
    />
    <PromptSettings
      :visible="showPromptSettings"
      :system-prompt="activeSession?.systemPrompt || ''"
      @close="showPromptSettings = false"
      @save="handleSavePrompt"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onActivated } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { ElMessage } from 'element-plus';
import { useChatStore } from '@/stores/chat';
import { useSettingsStore } from '@/stores/settings';
import { aiClientManager } from '@/services/aiClientManager';
import ChatHeader from './ChatHeader.vue';
import MessageList from './MessageList.vue';
import InputArea from './InputArea.vue';
import HistorySidebar from './HistorySidebar.vue';
import PromptSettings from './PromptSettings.vue';
import type { Message } from '@/stores/chat';

defineOptions({ name: 'Chat' });

const chatStore = useChatStore();
const settingsStore = useSettingsStore();

const activeSession = chatStore.activeSession;
const sortedSessions = chatStore.sortedSessions;
const activeSessionId = chatStore.activeSessionId;

const messageListRef = ref<InstanceType<typeof MessageList> | null>(null);
const inputAreaRef = ref<InstanceType<typeof InputArea> | null>(null);
const showHistory = ref(false);
const showPromptSettings = ref(false);
const isLoading = ref(false);
const currentAbortController = ref<AbortController | null>(null);
const playingMessageId = ref<string | null>(null);
const currentAudio = ref<HTMLAudioElement | null>(null);

onMounted(() => {
  chatStore.ensureActiveSession(settingsStore.settingsState.chatDefaultPrompt || '');
});

onActivated(() => {
  chatStore.ensureActiveSession(settingsStore.settingsState.chatDefaultPrompt || '');
});

// === Send text message ===
async function handleSendText(text: string) {
  if (isLoading.value) return;
  chatStore.addMessage('user', text);
  await requestAIReply();
}

// === Voice recording ===
async function handleStartRecording() {
  try {
    await invoke('start_recording');
  } catch (e) {
    ElMessage.error('录音启动失败');
    console.error(e);
  }
}

async function handleSendRecording() {
  if (isLoading.value) return;
  try {
    const { appId, apiKey, apiSecret } = settingsStore.settingsState.xfSpeechEval;
    const result = await invoke<{ text: string }>('stop_recording_and_recognize', {
      appId, apiKey, apiSecret,
    });
    if (result.text) {
      chatStore.addMessage('user', result.text, true);
      await requestAIReply();
    } else {
      ElMessage.warning('未识别到语音内容');
    }
  } catch (e) {
    ElMessage.error('语音识别失败');
    console.error(e);
  }
}

function handleCancelRecording() {
  try {
    invoke('stop_recording_and_recognize', {
      appId: settingsStore.settingsState.xfSpeechEval.appId,
      apiKey: settingsStore.settingsState.xfSpeechEval.apiKey,
      apiSecret: settingsStore.settingsState.xfSpeechEval.apiSecret,
    }).catch(() => {});
  } catch (_e) {
    // Ignore cancel errors
  }
}

// === AI reply ===
async function requestAIReply() {
  const session = chatStore.activeSession;
  if (!session) return;

  const modelInfo = settingsStore.settingsState.defaultModelInfo;
  if (!modelInfo) {
    ElMessage.warning('请先在设置中配置 AI 模型');
    return;
  }

  isLoading.value = true;
  currentAbortController.value = new AbortController();
  chatStore.addMessage('assistant', '');

  try {
    const historyMessages = session.messages
      .filter((_, idx) => idx < session.messages.length - 1)
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    let fullText = '';

    await aiClientManager.chatStream({
      messages: historyMessages,
      currentModelInfo: modelInfo,
      systemPrompt: session.systemPrompt || undefined,
      onData: (chunk: string) => {
        fullText += chunk;
        chatStore.updateLastAssistantMessage(fullText);
      },
      abortController: currentAbortController.value,
    });
  } catch (e) {
    console.error('AI request failed:', e);
  } finally {
    isLoading.value = false;
    currentAbortController.value = null;
    chatStore.saveSessions();
  }
}

// === TTS playback ===
async function handlePlayTts(msg: Message) {
  if (playingMessageId.value === msg.id) { stopTts(); return; }
  stopTts();

  try {
    playingMessageId.value = msg.id;
    const { appId, apiKey, apiSecret } = settingsStore.settingsState.xfSpeechEval;
    const b64 = await invoke<string>('tts_synthesize', {
      text: msg.content, speed: 50, vcn: 'x4_yezi', appId, apiKey, apiSecret,
    });

    const binaryStr = atob(b64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio.value = audio;

    audio.onended = () => { playingMessageId.value = null; currentAudio.value = null; URL.revokeObjectURL(url); };
    audio.onerror = () => { playingMessageId.value = null; currentAudio.value = null; URL.revokeObjectURL(url); ElMessage.error('播放失败'); };
    audio.play();
  } catch (e) {
    playingMessageId.value = null;
    ElMessage.error('语音合成失败');
    console.error(e);
  }
}

function stopTts() {
  if (currentAudio.value) { currentAudio.value.pause(); currentAudio.value = null; }
  playingMessageId.value = null;
}

// === Session management ===
function handleNewSession() {
  chatStore.createSession(settingsStore.settingsState.chatDefaultPrompt || '');
  showHistory.value = false;
}
function handleSelectSession(id: string) { chatStore.switchSession(id); showHistory.value = false; }
function handleDeleteSession(id: string) { chatStore.deleteSession(id); chatStore.ensureActiveSession(settingsStore.settingsState.chatDefaultPrompt || ''); }
function handleSavePrompt(prompt: string) { chatStore.updateSystemPrompt(prompt); }
</script>

<style scoped>
.chat-page { height: 100%; display: flex; flex-direction: column; background: #f5f5f5; overflow: hidden; }
</style>
