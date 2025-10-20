// 文本选择组合式函数
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { throttle, debounce } from 'lodash-es'

export interface UseTextSelectionOptions {
  /** 容器元素选择器 */
  containerSelector?: string;
  /** 最小选择文本长度 */
  minTextLength?: number;
  /** 最大选择文本长度 */
  maxTextLength?: number;
  /** 是否启用移动端支持 */
  enableMobile?: boolean;
  /** 自动隐藏延迟（毫秒） */
  autoHideDelay?: number;
}

export interface TextSelectionInfo {
  text: string;
  range: Range;
  rect: DOMRect;
}

/**
 * 获取选中文本的信息
 */
export function getSelectionInfo(): TextSelectionInfo | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const text = selection.toString().trim();
  
  if (!text || text.length === 0) {
    return null;
  }

  const rect = range.getBoundingClientRect();
  
  return {
    text,
    range,
    rect
  };
}

/**
 * 检查点击是否在指定元素外部
 */
export function isClickOutside(event: MouseEvent, element: HTMLElement): boolean {
  return !element.contains(event.target as Node);
}

/**
 * 清除当前选择
 */
export function clearSelection(): void {
  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
  }
}

export function useTextSelection(options: UseTextSelectionOptions = {}) {
  const {
    containerSelector = '.markdown-result',
    minTextLength = 1,
    maxTextLength = 200,
    enableMobile = true,
    autoHideDelay = 3000
  } = options;

  // 响应式状态
  const isVisible = ref(false);
  const selectedText = ref('');
  const selectionInfo = ref<TextSelectionInfo | null>(null);
  const selectionRect = ref<DOMRect | null>(null);

  // 内部状态
  let containerElement: HTMLElement | null = null;
  let hideTimer: NodeJS.Timeout | null = null;
  let isSelecting = false;
  let touchStartTime = 0;
  let touchStartPos = { x: 0, y: 0 };

  // 显示弹窗
  const showPopup = (info: TextSelectionInfo) => {
    // 确保有有效的文本和位置信息才显示弹窗
    if (!info.text || !info.rect) {
      hidePopup();
      return;
    }
    
    selectionInfo.value = info;
    selectedText.value = info.text;
    selectionRect.value = info.rect;
    isVisible.value = true;
    
    // 设置自动隐藏
    if (autoHideDelay > 0) {
      clearHideTimer();
      hideTimer = setTimeout(() => {
        hidePopup();
      }, autoHideDelay);
    }
  };

  // 隐藏弹窗
  const hidePopup = () => {
    isVisible.value = false;
    selectedText.value = '';
    selectionInfo.value = null;
    selectionRect.value = null;
    clearHideTimer();
  };

  // 清除隐藏定时器
  const clearHideTimer = () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  };

  // 处理文本选择
  const handleTextSelection = throttle(() => {
    if (isSelecting) return;
    
    // 重新查找容器元素（防止DOM更新后元素失效）
    if (!containerElement || !document.contains(containerElement)) {
      containerElement = document.querySelector(containerSelector);
    }
    
    const info = getSelectionInfo();
    
    if (!info) {
      hidePopup();
      return;
    }

    const { text } = info;
    
    // 检查文本长度
    if (text.length < minTextLength || text.length > maxTextLength) {
      hidePopup();
      return;
    }

    // 检查是否在容器内选择
    if (containerElement) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const commonAncestor = range.commonAncestorContainer;
        const element = commonAncestor.nodeType === Node.TEXT_NODE 
          ? commonAncestor.parentElement 
          : commonAncestor as Element;
        
        if (!containerElement.contains(element)) {
          hidePopup();
          return;
        }
      }
    }

    showPopup(info);
  }, 100);

  // 鼠标事件处理
  const handleMouseUp = (event: MouseEvent) => {
    // 延迟处理，确保选择完成
    setTimeout(() => {
      handleTextSelection();
    }, 10);
  };

  // 触摸事件处理（移动端）
  const handleTouchStart = (event: TouchEvent) => {
    if (!enableMobile) return;
    
    touchStartTime = Date.now();
    const touch = event.touches[0];
    touchStartPos = { x: touch.clientX, y: touch.clientY };
    isSelecting = true;
  };

  const handleTouchEnd = (event: TouchEvent) => {
    if (!enableMobile) return;
    
    isSelecting = false;
    
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime;
    
    // 长按选择文本
    if (touchDuration > 500) {
      setTimeout(() => {
        handleTextSelection();
      }, 100);
    }
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (!enableMobile) return;
    
    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.y);
    
    // 如果移动距离较大，认为是滑动而不是选择
    if (deltaX > 10 || deltaY > 10) {
      isSelecting = false;
    }
  };

  // 点击外部隐藏弹窗
  const handleDocumentClick = (event: MouseEvent) => {
    if (!isVisible.value) return;
    
    const popupElement = document.querySelector('.text-selection-popup');
    if (popupElement && !isClickOutside(event, popupElement as HTMLElement)) {
      return;
    }
    
    // 检查是否点击在选中的文本上
    if (selectionInfo.value && selectionInfo.value.rect) {
      const { rect } = selectionInfo.value;
      const { clientX, clientY } = event;
      
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        return;
      }
    }
    
    hidePopup();
    clearSelection();
  };

  // 键盘事件处理
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      hidePopup();
      clearSelection();
    }
  };

  // 选择变化处理
  const handleSelectionChange = debounce(() => {
    if (!isSelecting && isVisible.value) {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim() === '') {
        // 延迟隐藏，避免在弹窗操作过程中过早隐藏
        setTimeout(() => {
          if (!isVisible.value) return; // 如果已经隐藏了就不需要再处理
          const currentSelection = window.getSelection();
          if (!currentSelection || currentSelection.toString().trim() === '') {
            hidePopup();
          }
        }, 150);
      }
    }
  }, 100);

  // 初始化
  const init = () => {
    // 查找容器元素，如果没找到就等待DOM更新后再试
    containerElement = document.querySelector(containerSelector);
    if (!containerElement) {
      // 延迟查找，等待DOM完全渲染
      setTimeout(() => {
        containerElement = document.querySelector(containerSelector);
      }, 100);
    }
    
    // 添加事件监听器
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectionchange', handleSelectionChange);
  };

  // 清理
  const cleanup = () => {
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchend', handleTouchEnd);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('click', handleDocumentClick);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('selectionchange', handleSelectionChange);
    
    clearHideTimer();
  };

  // 手动触发选择处理
  const triggerSelection = () => {
    handleTextSelection();
  };

  // 手动设置选中文本
  const setSelectedText = (text: string, rect?: DOMRect) => {
    if (!text.trim()) {
      hidePopup();
      return;
    }

    const mockRect = rect || new DOMRect(
      window.innerWidth / 2 - 100,
      window.innerHeight / 2 - 20,
      200,
      40
    );

    const info: TextSelectionInfo = {
      text: text.trim(),
      range: new Range(),
      rect: mockRect
    };

    showPopup(info);
  };

  // 重新初始化容器元素
  const reinitContainer = () => {
    containerElement = document.querySelector(containerSelector);
    if (!containerElement) {
      // 如果还是找不到，延迟再试
      setTimeout(() => {
        containerElement = document.querySelector(containerSelector);
      }, 100);
    }
  };

  // 生命周期钩子
  onMounted(() => {
    nextTick(() => {
      init();
    });
  });

  onUnmounted(() => {
    cleanup();
  });

  return {
    // 状态
    isVisible,
    selectedText,
    selectionInfo,
    selectionRect,
    
    // 方法
    showPopup,
    hidePopup,
    triggerSelection,
    setSelectedText,
    clearSelection,
    reinitContainer,
    
    // 事件处理器（用于手动绑定）
    handleMouseUp,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove,
    handleDocumentClick,
    handleKeyDown
  };
}
