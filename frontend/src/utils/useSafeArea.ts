import { ref, onMounted, onUnmounted } from 'vue'

export function useSafeArea() {
  const safeAreaTop = ref(0)
  const safeAreaBottom = ref(0)

  const updateSafeArea = () => {
    const style = getComputedStyle(document.documentElement)

    // Read CSS variables that may have been set by native code (Android) or CSS env() fallback
    const cssTop = parseInt(style.getPropertyValue('--safe-area-inset-top') || '0', 10)
    const cssBottom = parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0', 10)

    safeAreaTop.value = cssTop || 0
    safeAreaBottom.value = cssBottom || 0

    // Android: use visualViewport to detect bottom gesture bar
    if (window.visualViewport) {
      const viewport = window.visualViewport
      const bottomInset = window.innerHeight - viewport.height - viewport.offsetTop
      if (bottomInset > 0) {
        safeAreaBottom.value = bottomInset
      }
    }

    // Android fallback: if native code hasn't set the top inset yet, use a reasonable default
    const ua = navigator.userAgent.toLowerCase()
    const isAndroid = ua.includes('android')
    if (isAndroid && safeAreaTop.value === 0) {
      // Android status bar is typically 24-48dp; 48px is a safe default for most devices
      safeAreaTop.value = 48
    }

    // Sync back to CSS variables
    document.documentElement.style.setProperty('--safe-area-inset-top', `${safeAreaTop.value}px`)
    document.documentElement.style.setProperty('--safe-area-inset-bottom', `${safeAreaBottom.value}px`)
  }

  onMounted(() => {
    updateSafeArea()
    window.visualViewport?.addEventListener('resize', updateSafeArea)
  })

  onUnmounted(() => {
    window.visualViewport?.removeEventListener('resize', updateSafeArea)
  })

  return {
    safeAreaTop,
    safeAreaBottom,
  }
}
