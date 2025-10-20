<!-- 文本选择弹窗组件 -->
<template>
  <el-popover
    v-model:visible="popupVisible"
    :virtual-ref="virtualRef"
    virtual-triggering
    placement="top"
    :width="60"
    :show-arrow="true"
    :popper-style="popperStyle"
    :fallback-placements="[
      'bottom',
      'left',
      'right',
      'top-start',
      'top-end',
      'bottom-start',
      'bottom-end',
    ]"
    :auto-close="0"
    @hide="emit('close')"
    popper-class="text-selection-popup"
  >
    <div
      class="text-selection-action"
      title="翻译选中文本"
      @click="handleTranslate"
    >
      <div>翻译</div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { ElPopover } from "element-plus";

export interface TextAction {
  key: string;
  label: string;
  tooltip: string;
  disabled?: boolean;
  handler: (text: string) => void | Promise<void>;
}

interface Props {
  visible: boolean;
  selectedText: string;
  selectionRect?: DOMRect;
  showTextPreview?: boolean;
  maxTextLength?: number;
  popupWidth?: number;
}

interface Emits {
  (e: "close"): void;
  (e: "translate", text: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  showTextPreview: true,
  maxTextLength: 50,
  popupWidth: 200,
});

const emit = defineEmits<Emits>();

// 虚拟引用元素 - 基于选中文本的实际位置
const virtualRef = computed(() => ({
  getBoundingClientRect: () => {
    // 只有当确实有选择区域时才返回位置信息
    if (props.selectionRect && props.selectedText) {
      return {
        x: props.selectionRect.left,
        y: props.selectionRect.top,
        width: props.selectionRect.width,
        height: props.selectionRect.height,
        top: props.selectionRect.top,
        left: props.selectionRect.left,
        right: props.selectionRect.right,
        bottom: props.selectionRect.bottom,
      };
    }
    // 当没有选中文本时，返回一个无效的位置，防止弹窗显示
    return {
      x: -9999,
      y: -9999,
      width: 0,
      height: 0,
      top: -9999,
      left: -9999,
      right: -9999,
      bottom: -9999,
    };
  },
}));

// 弹窗可见性
const popupVisible = computed({
  get: () => props.visible && !!props.selectedText && !!props.selectionRect,
  set: (value) => {
    if (!value) emit("close");
  },
});

// 弹窗样式
const popperStyle = computed(() => ({
  zIndex: 9999,
  minWidth: "60px !important",
}));

// 翻译文本
const handleTranslate = () => {
  emit("translate", props.selectedText);
  emit("close");
};

// 监听键盘事件
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      document.addEventListener("keydown", handleKeydown);
    } else {
      document.removeEventListener("keydown", handleKeydown);
    }
  }
);

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    emit("close");
  }
};
</script>

<style scoped>
.text-selection-action {
  display: flex;
  justify-content: center;
  cursor: pointer;
}
</style>
