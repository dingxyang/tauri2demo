# 每日一句 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the speech evaluation page into a "Daily Sentence" mode with 30 built-in Spanish sentences, daily random selection, and a redesigned minimal UI.

**Architecture:** Data layer (static sentences + localStorage composable) feeds a simplified Vue page. The page renders a sentence card and a 3-state record button, delegating evaluation to existing Tauri backend commands. EvalResult component is reused unchanged.

**Tech Stack:** Vue 3 Composition API, TypeScript, Tauri invoke API, localStorage, Element Plus (minimal — only ElMessage for errors)

**Spec:** `docs/superpowers/specs/2026-04-19-daily-sentence-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `frontend/src/pages/speech-eval/data/dailySentences.ts` | Create | 30 Spanish sentence objects, type export |
| `frontend/src/pages/speech-eval/composables/useDailySentence.ts` | Create | Daily random selection logic with localStorage persistence |
| `frontend/src/pages/speech-eval/components/RecordButton.vue` | Rewrite | Green circle button, 3 states (ready/recording/loading), white mic SVG |
| `frontend/src/pages/speech-eval/index.vue` | Rewrite | Daily sentence page layout: header, card, button, result |
| `frontend/src/layouts/BottomNav.vue` | Modify | Tab text "评测" → "每日一句" |
| `frontend/src/pages/speech-eval/components/EvalResult.vue` | No change | Reused as-is |

---

### Task 1: Create sentence data file

**Files:**
- Create: `frontend/src/pages/speech-eval/data/dailySentences.ts`

- [ ] **Step 1: Create the data file with type and 30 sentences**

```ts
// frontend/src/pages/speech-eval/data/dailySentences.ts

export interface DailySentence {
  date: string
  sentence_original: string
  sentence_translation: string
}

export const dailySentences: DailySentence[] = [
  {
    date: '01.abr',
    sentence_original: '¿Puedes confirmar si el equipo ya llegó al sitio?',
    sentence_translation: '你能确认设备是否已经到现场了吗？',
  },
  {
    date: '02.abr',
    sentence_original: 'Todavía estamos esperando la aprobación del cliente.',
    sentence_translation: '我们还在等待客户的批准。',
  },
  {
    date: '03.abr',
    sentence_original: 'Hay que revisar este punto antes de continuar.',
    sentence_translation: '这个问题需要在继续之前检查一下。',
  },
  {
    date: '04.abr',
    sentence_original: 'El cronograma se ha retrasado por problemas logísticos.',
    sentence_translation: '由于物流问题，进度已经延误。',
  },
  {
    date: '05.abr',
    sentence_original: '¿Quién se encarga de esta parte del proyecto?',
    sentence_translation: '这部分项目由谁负责？',
  },
  {
    date: '06.abr',
    sentence_original: 'Necesitamos actualizar los datos lo antes posible.',
    sentence_translation: '我们需要尽快更新数据。',
  },
  {
    date: '07.abr',
    sentence_original: 'Esto no coincide con el diseño original.',
    sentence_translation: '这与原始设计不一致。',
  },
  {
    date: '08.abr',
    sentence_original: 'Vamos a coordinar una reunión con el equipo local.',
    sentence_translation: '我们来和当地团队协调一次会议。',
  },
  {
    date: '09.abr',
    sentence_original: 'El proveedor aún no ha entregado los materiales.',
    sentence_translation: '供应商还没有交付材料。',
  },
  {
    date: '10.abr',
    sentence_original: 'Hay un problema con la conexión eléctrica.',
    sentence_translation: '电力连接出现了问题。',
  },
  {
    date: '11.abr',
    sentence_original: 'Por favor, envíame el informe actualizado.',
    sentence_translation: '请把更新后的报告发给我。',
  },
  {
    date: '12.abr',
    sentence_original: 'Este cambio requiere la aprobación del supervisor.',
    sentence_translation: '这个变更需要主管批准。',
  },
  {
    date: '13.abr',
    sentence_original: 'La instalación ya está en su fase final.',
    sentence_translation: '安装已经进入最后阶段。',
  },
  {
    date: '14.abr',
    sentence_original: '¿Puedes verificar estos datos otra vez?',
    sentence_translation: '你能再核对一下这些数据吗？',
  },
  {
    date: '15.abr',
    sentence_original: 'El equipo técnico llegará mañana por la mañana.',
    sentence_translation: '技术团队明天上午到达。',
  },
  {
    date: '16.abr',
    sentence_original: 'Hay que ajustar el plan según la situación actual.',
    sentence_translation: '需要根据当前情况调整计划。',
  },
  {
    date: '17.abr',
    sentence_original: 'El cliente ha solicitado algunos cambios adicionales.',
    sentence_translation: '客户提出了一些额外的修改要求。',
  },
  {
    date: '18.abr',
    sentence_original: 'Necesitamos más tiempo para completar esta tarea.',
    sentence_translation: '我们需要更多时间来完成这项任务。',
  },
  {
    date: '19.abr',
    sentence_original: 'Esto ya fue discutido en la reunión anterior.',
    sentence_translation: '这个问题在上一次会议中已经讨论过了。',
  },
  {
    date: '20.abr',
    sentence_original: 'El progreso del proyecto es satisfactorio hasta ahora.',
    sentence_translation: '到目前为止，项目进展令人满意。',
  },
  {
    date: '21.abr',
    sentence_original: 'Por favor, mantennos informados sobre cualquier novedad.',
    sentence_translation: '如有任何新情况，请及时通知我们。',
  },
  {
    date: '22.abr',
    sentence_original: 'Vamos a priorizar las tareas más urgentes.',
    sentence_translation: '我们优先处理最紧急的任务。',
  },
  {
    date: '23.abr',
    sentence_original: 'El sistema aún no está completamente operativo.',
    sentence_translation: '系统尚未完全投入运行。',
  },
  {
    date: '24.abr',
    sentence_original: 'Hay que mejorar la comunicación entre los equipos.',
    sentence_translation: '需要加强团队之间的沟通。',
  },
  {
    date: '25.abr',
    sentence_original: 'Esto puede afectar el plazo de entrega.',
    sentence_translation: '这可能会影响交付期限。',
  },
  {
    date: '26.abr',
    sentence_original: 'Estamos trabajando en una solución alternativa.',
    sentence_translation: '我们正在制定一个替代方案。',
  },
  {
    date: '27.abr',
    sentence_original: 'El informe será entregado antes del viernes.',
    sentence_translation: '报告将在周五之前提交。',
  },
  {
    date: '28.abr',
    sentence_original: 'Por favor, confirma la recepción de este mensaje.',
    sentence_translation: '请确认收到此信息。',
  },
  {
    date: '29.abr',
    sentence_original: 'Vamos a revisar los detalles técnicos más tarde.',
    sentence_translation: '我们稍后再审查技术细节。',
  },
  {
    date: '30.abr',
    sentence_original: 'El proyecto entra en una etapa crítica.',
    sentence_translation: '项目进入关键阶段。',
  },
]
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx vue-tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to `dailySentences.ts`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/speech-eval/data/dailySentences.ts
git commit -m "feat(daily-sentence): add 30 built-in Spanish sentence data"
```

---

### Task 2: Create useDailySentence composable

**Files:**
- Create: `frontend/src/pages/speech-eval/composables/useDailySentence.ts`

- [ ] **Step 1: Create the composable**

```ts
// frontend/src/pages/speech-eval/composables/useDailySentence.ts

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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx vue-tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to `useDailySentence.ts`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/speech-eval/composables/useDailySentence.ts
git commit -m "feat(daily-sentence): add useDailySentence composable with localStorage persistence"
```

---

### Task 3: Rewrite RecordButton component

**Files:**
- Rewrite: `frontend/src/pages/speech-eval/components/RecordButton.vue`

- [ ] **Step 1: Rewrite RecordButton.vue**

Replace the entire file content with:

```vue
<script setup lang="ts">
defineProps<{
  recording: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  start: []
  stop: []
}>()

function handleClick(recording: boolean, loading: boolean) {
  if (loading) return
  if (recording) {
    emit('stop')
  } else {
    emit('start')
  }
}
</script>

<template>
  <div class="record-wrapper">
    <button
      class="record-btn"
      :class="{ recording, loading }"
      :disabled="loading"
      @click="handleClick(recording, loading)"
    >
      <!-- Loading spinner -->
      <svg v-if="loading" class="icon-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
      <!-- Stop square -->
      <svg v-else-if="recording" width="24" height="24" viewBox="0 0 24 24" fill="white">
        <rect x="6" y="6" width="12" height="12" rx="2" />
      </svg>
      <!-- Microphone -->
      <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    </button>
    <div class="record-hint">
      <span v-if="loading">评测中...</span>
      <span v-else-if="recording">点击结束</span>
      <span v-else>点击跟读</span>
    </div>
  </div>
</template>

<style scoped>
.record-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 0;
}

.record-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background: #67c23a;
  box-shadow: 0 4px 14px rgba(103, 194, 58, 0.35);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.record-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.record-btn.recording {
  background: #f56c6c;
  box-shadow: 0 4px 14px rgba(245, 108, 108, 0.35);
}

.record-btn.loading {
  background: #909399;
  box-shadow: 0 4px 14px rgba(144, 147, 153, 0.25);
  cursor: not-allowed;
}

.record-hint {
  font-size: 13px;
  color: #999;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.icon-spin {
  animation: spin 1s linear infinite;
}
</style>
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx vue-tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/speech-eval/components/RecordButton.vue
git commit -m "feat(daily-sentence): rewrite RecordButton as green circle with 3-state design"
```

---

### Task 4: Rewrite main page

**Files:**
- Rewrite: `frontend/src/pages/speech-eval/index.vue`

- [ ] **Step 1: Rewrite index.vue**

Replace the entire file content with:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { ElMessage } from 'element-plus'
import RecordButton from './components/RecordButton.vue'
import EvalResult from './components/EvalResult.vue'
import { useDailySentence } from './composables/useDailySentence'

defineOptions({
  name: 'SpeechEval',
})

interface EvalResultData {
  overall: number
  pronunciation: number
  fluency: number
  integrity: number
  words: { word: string; overall: number; pronunciation: number; read_type: number }[]
}

const { sentence, shownCount, total } = useDailySentence()
const recording = ref(false)
const loading = ref(false)
const evalResult = ref<EvalResultData | null>(null)
const errorMsg = ref('')

async function handleStart() {
  errorMsg.value = ''
  evalResult.value = null

  try {
    await invoke('start_recording')
    recording.value = true
  } catch (e: any) {
    errorMsg.value = e.toString()
    ElMessage.error('启动录音失败: ' + e)
  }
}

async function handleStop() {
  recording.value = false
  loading.value = true
  errorMsg.value = ''

  try {
    const result = await invoke<EvalResultData>('stop_recording_and_evaluate', {
      lang: 'sp',
      category: 'sent',
      refText: sentence.value.sentence_original,
    })
    evalResult.value = result
  } catch (e: any) {
    errorMsg.value = e.toString()
    ElMessage.error('评测失败: ' + e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="daily-sentence-page">
    <!-- Header -->
    <div class="page-header">
      <div class="page-title">每日一句</div>
      <div class="page-progress">{{ shownCount }}/{{ total }}</div>
    </div>

    <div class="page-body">
      <!-- Sentence card -->
      <div class="sentence-card">
        <div class="lang-label">ESPAÑOL</div>
        <div class="sentence-original">{{ sentence.sentence_original }}</div>
        <div class="divider"></div>
        <div class="lang-label">中文翻译</div>
        <div class="sentence-translation">{{ sentence.sentence_translation }}</div>
      </div>

      <!-- Record button -->
      <RecordButton
        :recording="recording"
        :loading="loading"
        @start="handleStart"
        @stop="handleStop"
      />

      <!-- Error message -->
      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

      <!-- Eval result -->
      <EvalResult :result="evalResult" />
    </div>
  </div>
</template>

<style scoped>
.daily-sentence-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fafafa;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: white;
  border-bottom: 1px solid #ebeef5;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #333;
}

.page-progress {
  font-size: 13px;
  color: #999;
}

.page-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.sentence-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lang-label {
  font-size: 11px;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.sentence-original {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  line-height: 1.6;
}

.sentence-translation {
  font-size: 15px;
  color: #666;
  line-height: 1.5;
}

.divider {
  height: 1px;
  background: #f0f0f0;
}

.error-msg {
  color: #f56c6c;
  font-size: 13px;
  text-align: center;
  padding: 8px;
  background: #fef0f0;
  border-radius: 4px;
  margin-bottom: 16px;
}
</style>
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx vue-tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/speech-eval/index.vue
git commit -m "feat(daily-sentence): rewrite main page with daily sentence card layout"
```

---

### Task 5: Update bottom navigation tab text

**Files:**
- Modify: `frontend/src/layouts/BottomNav.vue:27`

- [ ] **Step 1: Change the tab label**

In `frontend/src/layouts/BottomNav.vue`, change line 28:

```
Old: <span class="nav-text">评测</span>
New: <span class="nav-text">每日一句</span>
```

- [ ] **Step 2: Verify in browser**

Run: `cd frontend && npx vue-tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/layouts/BottomNav.vue
git commit -m "feat(daily-sentence): rename bottom nav tab to 每日一句"
```

---

### Task 6: Manual verification

- [ ] **Step 1: Start dev server**

Run: `cd frontend && npm run dev`

- [ ] **Step 2: Verify in browser at http://localhost:31420/speech-eval**

Check the following:
1. Page shows "每日一句" title with "N/30" progress counter
2. Sentence card displays Spanish text with "ESPAÑOL" label and Chinese translation
3. Green round button with white microphone icon is centered below card
4. Clicking button starts recording (button turns red with stop square)
5. Clicking again stops recording and shows "评测中..." loading state
6. Evaluation results appear below the button after completion
7. Bottom nav tab shows "每日一句" instead of "评测"
8. Refreshing the page shows the same sentence (same day cache)

- [ ] **Step 3: Verify random logic**

Open browser console and run:
```js
localStorage.removeItem('daily_sentence_today')
localStorage.removeItem('daily_sentence_shown_indices')
```
Refresh page — a new random sentence should appear. Refresh again — same sentence (today cache). Clear `daily_sentence_today` again — a different sentence should appear (previous one is in shown list).
