import { ref, computed } from 'vue'
import { dailySentences } from '../data/dailySentences'
import type { DailySentence } from '../data/dailySentences'

const STORAGE_KEY_SHOWN = 'daily_sentence_shown_indices'
const STORAGE_KEY_TODAY = 'daily_sentence_today'

function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function loadShownIndices(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SHOWN)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveShownIndices(indices: number[]): void {
  localStorage.setItem(STORAGE_KEY_SHOWN, JSON.stringify(indices))
}

function loadTodayCache(): { date: string; index: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TODAY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveTodayCache(date: string, index: number): void {
  localStorage.setItem(STORAGE_KEY_TODAY, JSON.stringify({ date, index }))
}

function pickRandomIndex(): number {
  const today = getTodayStr()
  const cached = loadTodayCache()

  if (cached && cached.date === today) {
    return cached.index
  }

  let shown = loadShownIndices()
  const allIndices = Array.from({ length: dailySentences.length }, (_, i) => i)
  let candidates = allIndices.filter((i) => !shown.includes(i))

  if (candidates.length === 0) {
    shown = []
    candidates = allIndices
  }

  const index = candidates[Math.floor(Math.random() * candidates.length)]
  shown.push(index)
  saveShownIndices(shown)
  saveTodayCache(today, index)

  return index
}

export function useDailySentence() {
  const currentIndex = ref(pickRandomIndex())

  const sentence = computed<DailySentence>(() => dailySentences[currentIndex.value])

  const shownCount = computed<number>(() => loadShownIndices().length)

  const total = dailySentences.length

  return {
    sentence,
    shownCount,
    total,
  }
}
