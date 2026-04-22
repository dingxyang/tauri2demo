<template>
  <el-dialog :model-value="visible" @update:model-value="$emit('close')" title="系统提示语设置" width="90%" :close-on-click-modal="true">
    <div v-if="isScenario" class="scenario-warning">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fa8c16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span>此对话基于情景模式，修改提示语可能影响角色表现</span>
    </div>
    <el-input v-model="localPrompt" type="textarea" :rows="6" placeholder="输入系统提示语，定义AI的角色和行为" />
    <template #footer>
      <el-button @click="$emit('close')">取消</el-button>
      <el-button type="primary" @click="save" style="background: #2B5CE6; border-color: #2B5CE6;">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
const props = defineProps<{ visible: boolean; systemPrompt: string; isScenario: boolean }>();
const emit = defineEmits<{ 'close': []; 'save': [prompt: string] }>();
const localPrompt = ref('');
watch(() => props.visible, (val) => { if (val) localPrompt.value = props.systemPrompt; });
function save() { emit('save', localPrompt.value); emit('close'); }
</script>

<style scoped>
.scenario-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #fff7e6;
  border: 1px solid #ffe7ba;
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #ad6800;
}
</style>
