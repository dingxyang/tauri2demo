// 文本选择组合式函数
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { throttle, debounce } from 'lodash-es';
import { isMobile } from '@/utils/os';

export interface UseTextSelectionOptions {
  /** 容器元素选择器 */
  containerSelector?: string;
  /** 最小选择文本长度 */
  minTextLength?: number;
  /** 最大选择文本长度 */
  maxTextLength?: number;
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
  let longPressTimer: NodeJS.Timeout | null = null;

  // 显示弹窗
  const showPopup = (info: TextSelectionInfo) => {
    // 确保有有效的文本和位置信息才显示弹窗
    if (!info.text || !info.rect) {
      hidePopup();
      return;
    }
    
    // 获取当前实际选中的文本，确保使用最新的选择
    const currentSelection = window.getSelection();
    const currentText = currentSelection?.toString().trim();
    
    // 使用当前实际选中的文本，如果没有则使用传入的文本
    const actualText = currentText || info.text;
    
    selectionInfo.value = {
      ...info,
      text: actualText
    };
    selectedText.value = actualText;
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
    
    // 对于用户手动选择的文本，放宽长度限制
    const isManualSelection = isUserSelection();
    const effectiveMaxLength = isManualSelection ? maxTextLength * 2 : maxTextLength;
    
    // 检查文本长度
    if (text.length < minTextLength || text.length > effectiveMaxLength) {
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
  }, isMobile ? 200 : 100);

  // 鼠标事件处理
  const handleMouseUp = (event: MouseEvent) => {
    // 延迟处理，确保选择完成
    setTimeout(() => {
      handleTextSelection();
    }, 10);
  };

  // 触摸事件处理（移动端）
  const handleTouchStart = (event: TouchEvent) => {
    if (!isMobile) return;
    
    touchStartTime = Date.now();
    const touch = event.touches[0];
    touchStartPos = { x: touch.clientX, y: touch.clientY };
    isSelecting = true; // 标记开始选择
    
    // 检查是否点击在已选择的文本上
    const existingSelection = window.getSelection();
    const existingText = existingSelection?.toString().trim();
    
    if (existingText && existingText.length > 0) {
      // 如果已经有选择的文本，检查是否点击在选择区域内
      const ranges = [];
      for (let i = 0; i < existingSelection.rangeCount; i++) {
        ranges.push(existingSelection.getRangeAt(i));
      }
      
      const clickedElement = document.elementFromPoint(touch.clientX, touch.clientY);
      let clickedInSelection = false;
      
      for (const range of ranges) {
        if (range.intersectsNode(clickedElement as Node)) {
          clickedInSelection = true;
          break;
        }
      }
      
      if (clickedInSelection) {
        // 点击在已选择的文本上，不清除弹窗，直接显示
        clearLongPressTimer();
        setTimeout(() => {
          const info = getSelectionInfo();
          if (info) {
            showPopup(info);
          }
        }, 100);
        return;
      }
    }
    
    // 清除之前的弹窗和定时器
    hidePopup();
    clearLongPressTimer();
    
    // 设置长按定时器
    longPressTimer = setTimeout(() => {
      if (isSelecting) {
        // 长按触发，尝试创建选择
        handleLongPress(event);
      }
    }, 500); // 500ms 长按
  };

  const handleTouchEnd = (event: TouchEvent) => {
    if (!isMobile) return;
    
    isSelecting = false;
    clearLongPressTimer();
    
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime;
    
    // 如果是短按，隐藏弹窗
    if (touchDuration < 500) {
      hidePopup();
    }
    // 长按的处理已经在定时器中完成
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (!isMobile) return;
    
    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.y);
    
    // 如果移动距离较大，认为是滑动而不是长按选择
    if (deltaX > 15 || deltaY > 15) {
      isSelecting = false;
      clearLongPressTimer();
      // 如果正在显示弹窗，隐藏它
      if (isVisible.value) {
        hidePopup();
      }
    }
  };

  // 清除长按定时器
  const clearLongPressTimer = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
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
    // 不立即清除选择，给用户时间重新选择
    setTimeout(() => {
      clearSelection();
    }, 100);
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
    // 移动端需要更长的延迟来等待选择完成
    const delay = isMobile ? 300 : 150;
    
    if (isVisible.value) {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim() === '') {
        // 延迟隐藏，避免在弹窗操作过程中过早隐藏
        setTimeout(() => {
          if (!isVisible.value) return; // 如果已经隐藏了就不需要再处理
          const currentSelection = window.getSelection();
          if (!currentSelection || currentSelection.toString().trim() === '') {
            hidePopup();
          }
        }, delay);
      }
      // 移动端不在这里重新处理选择，避免覆盖用户选择
    } else if (!isMobile) {
      // 只有桌面端才在这里处理新的选择
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        setTimeout(() => {
          handleTextSelection();
        }, 100);
      }
    }
  }, isMobile ? 200 : 100);

  // 处理上下文菜单（移动端长按菜单）
  const handleContextMenu = (event: Event) => {
    if (isMobile) {
      // 移动端始终阻止系统上下文菜单，使用自定义弹窗
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  };

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
    document.addEventListener('touchstart', handleTouchStart, { passive: false }); // 需要阻止默认行为
    document.addEventListener('touchend', handleTouchEnd, { passive: false }); // 需要阻止默认行为
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('contextmenu', handleContextMenu, { passive: false }); // 需要能够阻止默认行为
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
    document.removeEventListener('contextmenu', handleContextMenu);
    
    clearHideTimer();
    clearLongPressTimer();
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

  // 移动端专用：检查并处理文本选择
  const checkMobileSelection = () => {
    if (!isMobile) return;
    
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      // 延迟处理，确保选择完成
      setTimeout(() => {
        const info = getSelectionInfo();
        if (info) {
          showPopup(info);
        }
      }, 100);
    }
  };

  // 检查是否是用户手动选择的文本
  const isUserSelection = (): boolean => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    
    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    
    // 如果选择的文本长度大于20个字符，很可能是用户手动选择的
    // 或者选择跨越了多个单词
    if (text.length > 20 || text.includes(' ')) {
      return true;
    }
    
    return false;
  };

  // 处理长按事件
  const handleLongPress = (event: TouchEvent) => {
    if (!isMobile) return;
    
    // 首先检查是否已经有用户手动选择的文本
    if (isUserSelection()) {
      // 如果是用户手动选择的文本，直接使用用户的选择
      setTimeout(() => {
        const info = getSelectionInfo();
        if (info) {
          showPopup(info);
        }
      }, 50);
      return;
    }
    
    // 检查是否有任何现有选择
    const existingSelection = window.getSelection();
    const existingText = existingSelection?.toString().trim();
    
    if (existingText && existingText.length > 0) {
      // 如果有现有选择但不是用户手动选择的，也直接使用
      setTimeout(() => {
        const info = getSelectionInfo();
        if (info) {
          showPopup(info);
        }
      }, 50);
      return;
    }
    
    // 如果没有现有选择，才创建新的选择
    const touch = event.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (!element) return;
    
    // 检查是否在容器内
    if (containerElement && !containerElement.contains(element)) {
      return;
    }
    
    // 查找最近的文本节点
    const textNode = findNearestTextNode(element, touch.clientX, touch.clientY);
    if (!textNode) return;
    
    // 创建文本选择
    const selectedText = createTextSelection(textNode, touch.clientX, touch.clientY);
    if (selectedText) {
      // 获取选择信息并显示弹窗
      setTimeout(() => {
        const info = getSelectionInfo();
        if (info) {
          showPopup(info);
        }
      }, 50);
    }
  };

  // 查找最近的文本节点
  const findNearestTextNode = (element: Element, x: number, y: number): Text | null => {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const text = node.textContent?.trim();
          return text && text.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    let textNode = walker.nextNode() as Text;
    return textNode;
  };

  // 创建文本选择
  const createTextSelection = (textNode: Text, x: number, y: number): string | null => {
    const text = textNode.textContent;
    if (!text) return null;
    
    // 创建范围选择一个单词或短语
    const range = document.createRange();
    const words = text.split(/\s+/);
    
    if (words.length === 0) return null;
    
    // 选择第一个有效单词，或者前几个字符
    let startOffset = 0;
    let endOffset = Math.min(text.length, 20); // 最多选择20个字符
    
    // 尝试选择一个完整的单词
    const wordMatch = text.match(/\S+/);
    if (wordMatch) {
      startOffset = wordMatch.index || 0;
      endOffset = startOffset + wordMatch[0].length;
    }
    
    try {
      range.setStart(textNode, startOffset);
      range.setEnd(textNode, endOffset);
      
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
        return selection.toString();
      }
    } catch (error) {
      console.warn('创建文本选择失败:', error);
    }
    
    return null;
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

  // 重置翻译后的状态
  const resetAfterTranslation = () => {
    // 重新初始化容器
    reinitContainer();
    
    // 清除可能存在的定时器
    clearHideTimer();
    clearLongPressTimer();
    
    // 重置内部状态
    isSelecting = false;
    touchStartTime = 0;
    touchStartPos = { x: 0, y: 0 };
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
    checkMobileSelection,
    resetAfterTranslation,
    
    // 事件处理器（用于手动绑定）
    handleMouseUp,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove,
    handleDocumentClick,
    handleKeyDown
  };
}
