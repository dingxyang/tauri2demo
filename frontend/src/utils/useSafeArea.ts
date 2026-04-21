import { ref, onMounted, onUnmounted } from 'vue'

const safeAreaTop = ref(0)
const safeAreaBottom = ref(0)
const safeAreaLeft = ref(0)
const safeAreaRight = ref(0)

let initialized = false

function readSafeAreaFromCSS() {
  const style = getComputedStyle(document.documentElement)
  const top = parseInt(style.getPropertyValue('--safe-area-inset-top')) || 0
  const bottom = parseInt(style.getPropertyValue('--safe-area-inset-bottom')) || 0
  const left = parseInt(style.getPropertyValue('--safe-area-inset-left')) || 0
  const right = parseInt(style.getPropertyValue('--safe-area-inset-right')) || 0
  return { top, bottom, left, right }
}

function updateSafeArea() {
  const values = readSafeAreaFromCSS()
  safeAreaTop.value = values.top
  safeAreaBottom.value = values.bottom
  safeAreaLeft.value = values.left
  safeAreaRight.value = values.right
}

function initSafeArea() {
  if (initialized) return
  initialized = true

  // 首次读取
  updateSafeArea()

  // Android 原生注入可能延迟，如果首次读到 0 则延迟重试
  if (safeAreaTop.value === 0 && safeAreaBottom.value === 0) {
    const retryDelays = [100, 300, 600, 1000]
    retryDelays.forEach((delay) => {
      setTimeout(() => {
        updateSafeArea()
      }, delay)
    })
  }

  // 监听窗口尺寸变化（旋转、分屏等）
  window.addEventListener('resize', updateSafeArea)
}

export function useSafeArea() {
  onMounted(() => {
    initSafeArea()
  })

  onUnmounted(() => {
    // 不移除监听，因为 safeArea 是全局共享的
  })

  return {
    safeAreaTop,
    safeAreaBottom,
    safeAreaLeft,
    safeAreaRight,
  }
}

// 导出初始化函数，供 App.vue 使用
export { initSafeArea }
