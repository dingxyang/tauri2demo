<template>
  <el-dialog :model-value="visible" @update:model-value="$emit('close')" title="系统提示语设置" width="90%" :close-on-click-modal="true">
    <el-input v-model="localPrompt" type="textarea" :rows="6" placeholder="输入系统提示语，定义AI的角色和行为" />
    <template #footer>
      <el-button @click="$emit('close')">取消</el-button>
      <el-button type="primary" @click="save" style="background: #2B5CE6; border-color: #2B5CE6;">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
const props = defineProps<{ visible: boolean; systemPrompt: string }>();
const emit = defineEmits<{ 'close': []; 'save': [prompt: string] }>();
const localPrompt = ref('');
watch(() => props.visible, (val) => { if (val) localPrompt.value = props.systemPrompt; });
function save() { emit('save', localPrompt.value); emit('close'); }
</script>
