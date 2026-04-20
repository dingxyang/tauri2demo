import { computed, ref } from 'vue'
import { dailySentences } from '../data/dailySentences'
import type { DailySentence } from '../data/dailySentences'

function getTodayKey(): string {
  const d = new Date()
  const day = String(d.getDate()).padStart(2, '0')
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${day}.${months[d.getMonth()]}`
}

function getFallbackKey(): string {
  const d = new Date()
  const day = String(d.getDate()).padStart(2, '0')
  return `${day}.abr`
}

function getTodayIndex(): number {
  const key = getTodayKey()
  const idx = dailySentences.findIndex((s) => s.date === key)
  if (idx >= 0) return idx
  const fallbackIdx = dailySentences.findIndex((s) => s.date === getFallbackKey())
  return fallbackIdx >= 0 ? fallbackIdx : 0
}

export function useDailySentence() {
  const currentIndex = ref(getTodayIndex())

  const sentence = computed<DailySentence>(() => dailySentences[currentIndex.value])

  const shownCount = computed<number>(() => currentIndex.value + 1)

  const total = dailySentences.length

  const canPrev = computed(() => currentIndex.value > 0)
  const canNext = computed(() => currentIndex.value < total - 1)

  function prev() {
    if (canPrev.value) currentIndex.value--
  }

  function next() {
    if (canNext.value) currentIndex.value++
  }

  return {
    sentence,
    shownCount,
    total,
    canPrev,
    canNext,
    prev,
    next,
  }
}

