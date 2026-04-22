<template>
  <div class="sidebar-overlay" v-if="visible" @click.self="$emit('close')">
    <transition name="slide">
      <div v-if="visible" class="sidebar-panel">
        <div class="sidebar-header">
          <span class="sidebar-title">历史会话</span>
          <button class="close-btn" @click="$emit('close')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="session-list">
          <div v-for="session in sessions" :key="session.id" :class="['session-item', { active: session.id === activeSessionId }]" @click="$emit('select-session', session.id)">
            <div class="session-info">
              <div class="session-title">{{ session.title }}</div>
              <div class="session-date">{{ formatDate(session.updatedAt) }}</div>
            </div>
            <button class="delete-btn" @click.stop="$emit('delete-session', session.id)" title="删除">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
          <div v-if="sessions.length === 0" class="empty-list">暂无历史会话</div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import type { ChatSession } from '@/stores/chat';
defineProps<{ visible: boolean; sessions: ChatSession[]; activeSessionId: string }>();
defineEmits<{ 'close': []; 'select-session': [id: string]; 'delete-session': [id: string] }>();
function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}
</script>

<style scoped>
.sidebar-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.3); z-index: 100; }
.sidebar-panel { position: absolute; top: 0; left: 0; width: 70%; max-width: 320px; height: 100%; background: #fff; display: flex; flex-direction: column; box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1); }
.slide-enter-active, .slide-leave-active { transition: transform 0.3s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(-100%); }
.sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid #ebeef5; flex-shrink: 0; }
.sidebar-title { font-size: 17px; font-weight: 600; color: #1a1a1a; }
.close-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: none; background: none; cursor: pointer; color: #999; border-radius: 8px; }
.close-btn:active { background: #f5f5f5; }
.session-list { flex: 1; overflow-y: auto; padding: 8px 0; }
.session-item { display: flex; align-items: center; padding: 12px 16px; cursor: pointer; transition: background 0.12s; border-bottom: 1px solid #f5f5f5; }
.session-item:active { background: #f9f9f9; }
.session-item.active { background: #f0f4ff; }
.session-info { flex: 1; min-width: 0; }
.session-title { font-size: 15px; color: #303133; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.session-date { font-size: 12px; color: #999; margin-top: 2px; }
.delete-btn { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; background: none; cursor: pointer; color: #c0c4cc; border-radius: 4px; flex-shrink: 0; }
.delete-btn:active { color: #f56c6c; background: #fef0f0; }
.empty-list { padding: 32px 16px; text-align: center; color: #999; font-size: 14px; }
</style>
