import { computed } from 'vue'
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

export function useDailySentence() {
  const sentence = computed<DailySentence>(() => {
    const key = getTodayKey()
    return (
      dailySentences.find((s) => s.date === key) ??
      dailySentences.find((s) => s.date === getFallbackKey()) ??
      dailySentences[0]
    )
  })

  const shownCount = computed<number>(() => {
    const key = getTodayKey()
    const idx = dailySentences.findIndex((s) => s.date === key)
    return idx >= 0 ? idx + 1 : 1
  })

  const total = dailySentences.length

  return {
    sentence,
    shownCount,
    total,
  }
}

