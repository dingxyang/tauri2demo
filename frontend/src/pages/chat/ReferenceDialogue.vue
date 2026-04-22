<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('close')"
    title="参考对话"
    width="90%"
    :close-on-click-modal="true"
  >
    <div v-if="scenario" class="reference-dialogue">
      <div class="scenario-info">
        <span class="scenario-title">{{ scenario.title }}</span>
        <span class="scenario-title-es">{{ scenario.titleEs }}</span>
      </div>
      <div class="dialogue-list">
        <div
          v-for="(turn, idx) in scenario.referenceDialogue"
          :key="idx"
          :class="['dialogue-turn', turn.role === 'user' ? 'turn-user' : 'turn-ai']"
        >
          <span class="turn-role">{{ turn.role === 'user' ? '你' : scenario.aiRole.name.split(' ')[0] }}</span>
          <div class="turn-content">
            <span class="turn-text">{{ turn.content }}</span>
            <span v-if="turn.note" class="turn-note">{{ turn.note }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="no-data">未找到场景信息</div>
    <template #footer>
      <el-button @click="$emit('close')">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { scenarios } from './data/scenarios';
import type { Scenario } from './data/scenarios';

const props = defineProps<{
  visible: boolean;
  scenarioId?: string;
}>();

defineEmits<{
  'close': [];
}>();

const scenario = computed<Scenario | undefined>(() => {
  if (!props.scenarioId) return undefined;
  return scenarios.find(s => s.id === props.scenarioId);
});
</script>

<style scoped>
.reference-dialogue {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scenario-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.scenario-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
}

.scenario-title-es {
  font-size: 13px;
  color: #999;
  font-style: italic;
}

.dialogue-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 50vh;
  overflow-y: auto;
}

.dialogue-turn {
  display: flex;
  gap: 8px;
}

.turn-user {
  flex-direction: row-reverse;
}

.turn-role {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.turn-user .turn-role {
  background: #2B5CE6;
  color: #fff;
}

.turn-ai .turn-role {
  background: #f0f4ff;
  color: #2B5CE6;
}

.turn-content {
  max-width: 80%;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.turn-text {
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

.turn-user .turn-text {
  background: #2B5CE6;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.turn-ai .turn-text {
  background: #fff;
  color: #1a1a1a;
  border: 1px solid #ebeef5;
  border-bottom-left-radius: 4px;
}

.turn-note {
  font-size: 11px;
  color: #c0c4cc;
  font-style: italic;
}

.turn-user .turn-note {
  text-align: right;
}

.no-data {
  text-align: center;
  padding: 20px;
  color: #999;
}
</style>
