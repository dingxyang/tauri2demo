<!-- 模型选择器组件 -->
<template>
  <div class="model-selector">
    <div class="model-display-wrapper" @click="handleDisplayClick">
      <div class="current-model-display">
        <span class="model-name">{{ currentModelName || '选择模型' }}</span>
        <el-icon class="dropdown-icon">
          <ArrowDown />
        </el-icon>
      </div>
    </div>
    
    <el-select 
      ref="selectRef"
      v-model="selectedModel" 
      placeholder="选择模型"
      @change="handleModelChange" 
      class="model-select hidden-select" 
      size="small"
      popper-class="model-selector-popper"
    >
      <el-option-group v-for="provider in enabledProviders" :key="provider.key" :label="provider.label">
        <el-option v-for="model in provider.models" :key="`${provider.key}-${model.id}`" :label="model.name"
          :value="`${provider.key}:${model.id}`">
          <span>{{ model.id }}</span>
        </el-option>
      </el-option-group>
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { ElSelect, ElOption, ElOptionGroup, ElIcon } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';
import { useSettingsStore } from '@/stores/settings';
import { getProviderBaseURL, getProviderApiKey } from '@/utils/constant/providers';

// Props
interface Props {
  modelValue?: string;
}

// Emits
interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'modelChange', modelInfo: { providerId: string; modelId: string; providerConfig: any }): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: ''
});

const emit = defineEmits<Emits>();

const settingsStore = useSettingsStore();
const selectedModel = ref(props.modelValue);
const selectRef = ref();

// 只有选择模型时才存储 defaultModelInfo 到 settings store
const handleModelSelect = (providerId: string, model: any, providerConfig: any) => {
  const modelInfo = {
    providerId,
    modelId: model.id,
    modelName: model.name
  };
  
  // 更新 settings store 中的默认模型信息（保存简化格式）
  const simpleModelInfo = `${modelInfo.providerId}/${modelInfo.modelId}`;
  settingsStore.settingsState.defaultModelInfo = simpleModelInfo;
  settingsStore.saveCurrentModelInfo(simpleModelInfo);
};

// 监听 selectedModel 变化（用户选择模型时触发），更新 defaultModelInfo
watch(
  selectedModel,
  (newVal) => {
    if (newVal) {
      const [providerId, modelId] = newVal.split(':');
      const provider = enabledProviders.value.find(p => p.key === providerId);
      if (provider) {
        const model = provider.models.find(m => m.id === modelId);
        if (model) {
          handleModelSelect(providerId, model, provider.config);
        }
      }
    }
  }
);

// 计算已启用的提供商和模型
const enabledProviders = computed(() => {
  const enabledProviders = [];
  const settings = settingsStore.settingsState;

  // 遍历所有提供商配置
  Object.keys(settings.providers).forEach(providerKey => {
    const providerConfig = settings.providers[providerKey];
    if (providerConfig.enabled) {
      // 将模型对象转换为数组，并添加id字段
      const models = Object.entries(providerConfig.models).map(([modelKey, modelData]) => ({
        id: modelKey,
        ...modelData
      }));
      
      enabledProviders.push({
        key: providerKey,
        label: providerConfig.name,
        models: models,
        config: providerConfig
      });
    }
  });

  return enabledProviders;
});

// 计算当前选中模型的显示名称
const currentModelName = computed(() => {
  if (!selectedModel.value) {
    // 如果没有选中模型，显示默认模型名称
    const defaultModelInfo = settingsStore.settingsState.defaultModelInfo;
    if (defaultModelInfo) {
      const [, modelId] = defaultModelInfo.split('/');
      return modelId || '';
    }
    return '';
  }
  
  const [providerId, modelId] = selectedModel.value.split(':');
  const provider = enabledProviders.value.find(p => p.key === providerId);
  
  if (provider) {
    const model = provider.models.find(m => m.id === modelId);
    return model ? model.id : '';
  }
  
  return '';
});

// 获取默认模型（不更新 store）
const getDefaultModel = () => {
  if (enabledProviders.value.length === 0) return '';

  const firstProvider = enabledProviders.value[0];
  if (firstProvider.models.length === 0) return '';

  // 使用提供商配置中的默认模型，如果不存在则使用第一个模型
  const defaultModelId = firstProvider.config.defaultModel;
  let targetModel = firstProvider.models.find(model => model.id === defaultModelId);
  
  if (!targetModel) {
    // 如果默认模型不在可用模型列表中，使用第一个可用模型
    targetModel = firstProvider.models[0];
  }

  return `${firstProvider.key}:${targetModel.id}`;
};

// 检查是否有用户已设置的模型
const hasUserSelectedModel = () => {
  const currentModelInfo = settingsStore.settingsState.defaultModelInfo;
  return currentModelInfo && currentModelInfo.includes('/');
};

// 获取用户已设置的模型值
const getUserSelectedModel = () => {
  const currentModelInfo = settingsStore.settingsState.defaultModelInfo;
  if (hasUserSelectedModel()) {
    const [providerId, modelId] = currentModelInfo.split('/');
    return `${providerId}:${modelId}`;
  }
  return '';
};

// 处理显示区域点击事件
const handleDisplayClick = () => {
  if (selectRef.value) {
    // 直接调用 Element Plus 的方法来打开下拉菜单
    selectRef.value.toggleMenu();
  }
};

// 处理模型变化
const handleModelChange = (value: string) => {
  if (!value) return;

  const [providerId, modelId] = value.split(':');
  const provider = enabledProviders.value.find(p => p.key === providerId);

  if (provider) {
    emit('update:modelValue', value);
    emit('modelChange', {
      providerId,
      modelId,
      providerConfig: {
        apiBaseUrl: getProviderBaseURL(provider.config),
        apiKey: getProviderApiKey(provider.config)
      }
    });
  }
};

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  selectedModel.value = newValue;
});

// 监听设置变化，优先使用用户设置的模型
watch(enabledProviders, (newProviders) => {
  if (newProviders.length > 0 && !selectedModel.value) {
    // 优先使用用户已设置的模型
    const userSelectedModel = getUserSelectedModel();
    if (userSelectedModel) {
      // 验证用户设置的模型是否仍然可用
      const [providerId, modelId] = userSelectedModel.split(':');
      const provider = newProviders.find(p => p.key === providerId);
      if (provider && provider.models.find(m => m.id === modelId)) {
        selectedModel.value = userSelectedModel;
        return;
      }
    }
    
    // 如果没有用户设置的模型或用户设置的模型不可用，使用默认模型
    const defaultModel = getDefaultModel();
    if (defaultModel) {
      selectedModel.value = defaultModel;
      handleModelChange(defaultModel);
    }
  }
}, { immediate: true });

// 组件挂载时初始化
onMounted(() => {
  // 确保在组件挂载时优先使用用户设置的模型
  if (enabledProviders.value.length > 0 && !selectedModel.value) {
    // 优先使用用户已设置的模型
    const userSelectedModel = getUserSelectedModel();
    if (userSelectedModel) {
      // 验证用户设置的模型是否仍然可用
      const [providerId, modelId] = userSelectedModel.split(':');
      const provider = enabledProviders.value.find(p => p.key === providerId);
      if (provider && provider.models.find(m => m.id === modelId)) {
        selectedModel.value = userSelectedModel;
        return;
      }
    }
    
    // 如果没有用户设置的模型或用户设置的模型不可用，使用默认模型
    const defaultModel = getDefaultModel();
    if (defaultModel) {
      selectedModel.value = defaultModel;
      handleModelChange(defaultModel);
    }
  }
});
</script>

<style scoped>
.model-selector {
  display: flex;
  align-items: center;
  position: relative;
}

.model-display-wrapper {
  position: relative;
  z-index: 2;
}

.current-model-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 200px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
  transition: border-color 0.2s;
  font-size: 14px;
}

.current-model-display:hover {
  border-color: #c0c4cc;
}

.current-model-display:focus-within {
  border-color: #409eff;
}

.model-name {
  flex: 1;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-icon {
  color: #c0c4cc;
  font-size: 12px;
  transition: transform 0.2s;
  margin-left: 8px;
}

.current-model-display:hover .dropdown-icon {
  color: #909399;
}

.hidden-select {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  opacity: 0;
  pointer-events: none;
  z-index: 1;
}

.hidden-select :deep(.el-select__wrapper) {
  width: 100%;
}

.model-select {
  min-width: 200px;
}

.model-provider {
  float: right;
  color: #8492a6;
  font-size: 12px;
  margin-left: 8px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .current-model-display,
  .model-select {
    min-width: 150px;
  }
}

/* 暗色主题适配 */
.dark .current-model-display {
  background-color: #1d1e1f;
  border-color: #4c4d4f;
  color: #e5eaf3;
}

.dark .current-model-display:hover {
  border-color: #606266;
}

.dark .model-name {
  color: #e5eaf3;
}

.dark .dropdown-icon {
  color: #8b949e;
}

.dark .current-model-display:hover .dropdown-icon {
  color: #c9d1d9;
}
</style>
