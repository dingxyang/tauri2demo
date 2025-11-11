import { ref, onMounted, onUnmounted } from 'vue'

export function useSafeArea() {
  const safeAreaTop = ref(0)
  const safeAreaBottom = ref(0)

  const updateSafeArea = () => {
    // iOS 原生支持 env()
    const computedTop = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('env(safe-area-inset-top, 0px)') || '0', 10)
    const computedBottom = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('env(safe-area-inset-bottom, 0px)') || '0', 10)

    safeAreaTop.value = computedTop || 0
    safeAreaBottom.value = computedBottom || 0

    // 安卓设备：通过 visualViewport 检测底部手势栏
    if (window.visualViewport) {
      const viewport = window.visualViewport
      const bottomInset = window.innerHeight - viewport.height - viewport.offsetTop
      if (bottomInset > 0) {
        safeAreaBottom.value = bottomInset
      }
    }

    // ⚠️ 安卓顶部刘海补偿逻辑，如果 top 仍为 0，则设置一个经验值（比如 24px ~ 32px）
    const ua = navigator.userAgent.toLowerCase()
    const isAndroid = ua.includes('android')
    if (isAndroid && safeAreaTop.value === 0) {
      safeAreaTop.value = 10 
    }

    // 同步到 CSS 变量
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
