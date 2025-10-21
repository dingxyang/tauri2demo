import { ref, onMounted, onUnmounted } from 'vue';

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * 安全区域插入值组合式函数
 * 用于获取设备的安全区域插入值，通常用于处理刘海屏、圆角屏幕等情况
 */
export function useSafeAreaInsets() {
  const updated = ref(false);
  const insets = ref<SafeAreaInsets>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  /**
   * 更新安全区域插入值
   */
  const updateSafeAreaInsets = () => {
    const rootStyles = getComputedStyle(document.documentElement);
    const hasCustomProperties = rootStyles.getPropertyValue('--safe-area-inset-top');
    
    if (hasCustomProperties) {
      insets.value = {
        top: parseFloat(rootStyles.getPropertyValue('--safe-area-inset-top')) || 0,
        right: parseFloat(rootStyles.getPropertyValue('--safe-area-inset-right')) || 0,
        bottom: parseFloat(rootStyles.getPropertyValue('--safe-area-inset-bottom')) || 0,
        left: parseFloat(rootStyles.getPropertyValue('--safe-area-inset-left')) || 0,
      };
    }
    
    updated.value = true;
  };

  // 生命周期钩子
  onMounted(() => {
    updateSafeAreaInsets();
    window.addEventListener('resize', updateSafeAreaInsets);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', updateSafeAreaInsets);
  });

  return {
    /**
     * 是否已更新过安全区域插入值
     */
    updated,
    /**
     * 安全区域插入值，如果未更新过则返回 null
     */
    insets: updated.value ? insets : null,
    /**
     * 手动更新安全区域插入值
     */
    updateSafeAreaInsets,
  };
}
