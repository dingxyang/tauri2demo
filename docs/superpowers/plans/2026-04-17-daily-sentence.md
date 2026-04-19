# 每日一句 (Daily Sentence) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "每日一句" tab to the Spanish Assistant app that displays a daily Spanish sentence with Chinese translation, provides TTS audio playback (iFlytek + Web Speech API), lets users record themselves reading the sentence, and evaluates pronunciation via iFlytek Suntone API.

**Architecture:** New bottom nav tab → DailySentence page with card-based UI. Local JSON data with template import support. iFlytek WebSocket services for TTS and evaluation share a common auth module. Audio recording via Web Audio API + lamejs MP3 encoding. Settings page extended for iFlytek credentials.

**Tech Stack:** Vue 3, Element Plus, Pinia, iFlytek WebSocket API (TTS + Suntone evaluation), Web Speech API (fallback), Web Audio API + lamejs (recording), Tauri plugin-fs (file import)

---

## File Structure

```
frontend/src/
  types/daily-sentence.ts          — Type definitions for sentence data, evaluation results
  utils/constant/daily-sentences.ts — Built-in sentence dataset
  services/xfyun/
    auth.ts                         — Shared iFlytek HMAC-SHA256 WebSocket auth
    tts.ts                          — TTS service (iFlytek WS + Web Speech API fallback)
    evaluation.ts                   — Suntone speech evaluation service
  services/audio-recorder.ts        — Web Audio API recording + MP3 encoding
  stores/daily-sentence.ts          — Pinia store for sentence data, playback state, eval results
  stores/settings.ts                — (Modify) Add iFlytek config fields
  pages/daily-sentence/
    index.vue                       — Main page with sentence display, audio, recording, import
  pages/settings/index.vue          — (Modify) Add iFlytek configuration section
  layouts/BottomNav.vue             — (Modify) Add 4th tab
  router/index.ts                   — (Modify) Add route
```

---

### Task 1: Type Definitions

**Files:**
- Create: `frontend/src/types/daily-sentence.ts`

- [ ] **Step 1: Create type definitions file**

```typescript
// frontend/src/types/daily-sentence.ts

/** 每日一句数据结构 */
export interface DailySentence {
  date: string                    // e.g. "17.abr"
  sentence_original: string       // Spanish sentence
  sentence_translation: string    // Chinese translation
}

/** 每日一句数据集（用于导入导出） */
export interface DailySentenceDataset {
  sentences: DailySentence[]
}

/** 讯飞配置 */
export interface XfyunConfig {
  appId: string
  apiKey: string
  apiSecret: string
}

/** TTS 播放速度 */
export type TtsSpeed = 'normal' | 'slow'

/** TTS 提供者 */
export type TtsProvider = 'xfyun' | 'web-speech'

/** 语音评测单词结果 */
export interface EvalWordResult {
  word: string
  score: number
  /** 0=正常, 1=多读, 2=漏读 */
  readType: number
}

/** 语音评测结果 */
export interface EvaluationResult {
  /** 总分 0-100 */
  overall: number
  /** 发音分 */
  pronunciation: number
  /** 流利度分 */
  fluency: number
  /** 完整度分 */
  integrity: number
  /** 逐词结果 */
  words: EvalWordResult[]
  /** 原始 JSON（调试用） */
  raw?: unknown
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/types/daily-sentence.ts
git commit -m "feat(daily-sentence): add type definitions"
```

---

### Task 2: Built-in Sentence Data

**Files:**
- Create: `frontend/src/utils/constant/daily-sentences.ts`

- [ ] **Step 1: Create built-in dataset**

```typescript
// frontend/src/utils/constant/daily-sentences.ts
import type { DailySentence } from '@/types/daily-sentence'

export const BUILT_IN_SENTENCES: DailySentence[] = [
  {
    date: '17.abr',
    sentence_original: 'La felicidad no necesita ser transmutada en belleza, pero la desventura sí.',
    sentence_translation: '幸福不需要变成美丽，但不幸却需要。'
  },
  {
    date: '18.abr',
    sentence_original: 'El que lee mucho y anda mucho, ve mucho y sabe mucho.',
    sentence_translation: '读万卷书，行万里路，见多识广。'
  },
  {
    date: '19.abr',
    sentence_original: 'No hay camino para la paz, la paz es el camino.',
    sentence_translation: '没有通往和平的路，和平本身就是路。'
  },
  {
    date: '20.abr',
    sentence_original: 'La vida es lo que pasa mientras estás ocupado haciendo otros planes.',
    sentence_translation: '生活就是当你忙于制定其他计划时发生的事情。'
  },
  {
    date: '21.abr',
    sentence_original: 'Cada día es una nueva oportunidad para cambiar tu vida.',
    sentence_translation: '每一天都是改变你生活的新机会。'
  },
  {
    date: '22.abr',
    sentence_original: 'El conocimiento es poder, pero el entusiasmo enciende el interruptor.',
    sentence_translation: '知识就是力量，但热情才是开关。'
  },
  {
    date: '23.abr',
    sentence_original: 'No dejes para mañana lo que puedas hacer hoy.',
    sentence_translation: '今日事今日毕。'
  }
]
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/utils/constant/daily-sentences.ts
git commit -m "feat(daily-sentence): add built-in sentence dataset"
```

---

### Task 3: Daily Sentence Pinia Store

**Files:**
- Create: `frontend/src/stores/daily-sentence.ts`

- [ ] **Step 1: Create the store**

```typescript
// frontend/src/stores/daily-sentence.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  DailySentence,
  EvaluationResult,
  TtsProvider
} from '@/types/daily-sentence'
import { BUILT_IN_SENTENCES } from '@/utils/constant/daily-sentences'

const STORAGE_KEY = 'daily_sentence_data'

function loadSentences(): DailySentence[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  return BUILT_IN_SENTENCES
}

function saveSentences(sentences: DailySentence[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sentences))
}

export const useDailySentenceStore = defineStore('dailySentence', () => {
  const sentences = ref<DailySentence[]>(loadSentences())
  const currentIndex = ref(0)
  const ttsProvider = ref<TtsProvider>('web-speech')
  const lastEvaluation = ref<EvaluationResult | null>(null)

  const currentSentence = computed(() => {
    if (sentences.value.length === 0) return null
    return sentences.value[currentIndex.value % sentences.value.length]
  })

  const totalCount = computed(() => sentences.value.length)

  function nextSentence() {
    if (sentences.value.length === 0) return
    currentIndex.value = (currentIndex.value + 1) % sentences.value.length
    lastEvaluation.value = null
  }

  function prevSentence() {
    if (sentences.value.length === 0) return
    currentIndex.value =
      (currentIndex.value - 1 + sentences.value.length) % sentences.value.length
    lastEvaluation.value = null
  }

  function importSentences(newSentences: DailySentence[]) {
    sentences.value = newSentences
    currentIndex.value = 0
    lastEvaluation.value = null
    saveSentences(newSentences)
  }

  function resetToBuiltIn() {
    sentences.value = BUILT_IN_SENTENCES
    currentIndex.value = 0
    lastEvaluation.value = null
    saveSentences(BUILT_IN_SENTENCES)
  }

  function setEvaluation(result: EvaluationResult) {
    lastEvaluation.value = result
  }

  function setTtsProvider(provider: TtsProvider) {
    ttsProvider.value = provider
  }

  return {
    sentences,
    currentIndex,
    currentSentence,
    totalCount,
    ttsProvider,
    lastEvaluation,
    nextSentence,
    prevSentence,
    importSentences,
    resetToBuiltIn,
    setEvaluation,
    setTtsProvider
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/stores/daily-sentence.ts
git commit -m "feat(daily-sentence): add pinia store for sentence data and state"
```

---

### Task 4: iFlytek Settings Store Extension

**Files:**
- Modify: `frontend/src/stores/settings.ts`
- Modify: `frontend/src/utils/localStorage.ts`

- [ ] **Step 1: Add iFlytek config to settings store**

In `frontend/src/stores/settings.ts`, add iFlytek-related state alongside the existing AI provider config. Find the store definition and add:

```typescript
// Add near the top with other state
const xfyunConfig = ref<{ appId: string; apiKey: string; apiSecret: string }>({
  appId: '',
  apiKey: '',
  apiSecret: ''
})

// Load from localStorage on init
function loadXfyunConfig() {
  try {
    const stored = localStorage.getItem('xfyun_config')
    if (stored) {
      const parsed = JSON.parse(stored)
      xfyunConfig.value = { ...xfyunConfig.value, ...parsed }
    }
  } catch {
    // ignore
  }
}

function saveXfyunConfig() {
  localStorage.setItem('xfyun_config', JSON.stringify(xfyunConfig.value))
}

function updateXfyunConfig(config: Partial<{ appId: string; apiKey: string; apiSecret: string }>) {
  Object.assign(xfyunConfig.value, config)
  saveXfyunConfig()
}
```

Call `loadXfyunConfig()` in the store's initialization, and expose `xfyunConfig`, `updateXfyunConfig` in the return statement.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/stores/settings.ts
git commit -m "feat(settings): add iFlytek config to settings store"
```

---

### Task 5: iFlytek Authentication Utility

**Files:**
- Create: `frontend/src/services/xfyun/auth.ts`

- [ ] **Step 1: Create the auth utility**

```typescript
// frontend/src/services/xfyun/auth.ts

/**
 * Generate iFlytek WebSocket authentication URL.
 * Shared by TTS and Evaluation services.
 */
export function buildXfyunWebSocketUrl(
  baseUrl: string,
  apiKey: string,
  apiSecret: string
): string {
  const url = new URL(baseUrl)
  const host = url.host
  const path = url.pathname
  const date = new Date().toUTCString()

  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`

  // HMAC-SHA256 signing
  const encoder = new TextEncoder()
  return (async () => '')() as unknown as string // placeholder - actual implementation below
}

// We need an async version since Web Crypto API is async
export async function buildXfyunWebSocketUrlAsync(
  baseUrl: string,
  apiKey: string,
  apiSecret: string
): Promise<string> {
  const url = new URL(baseUrl)
  const host = url.host
  const path = url.pathname
  const date = new Date().toUTCString()

  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`

  // Import the API secret as HMAC key
  const encoder = new TextEncoder()
  const keyData = encoder.encode(apiSecret)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  // Sign the origin string
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(signatureOrigin)
  )

  // Base64 encode the signature
  const signatureBase64 = btoa(
    String.fromCharCode(...new Uint8Array(signatureBuffer))
  )

  // Build authorization origin
  const authorizationOrigin =
    `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureBase64}"`
  const authorization = btoa(authorizationOrigin)

  // Build final URL with query params
  const finalUrl = new URL(baseUrl)
  finalUrl.searchParams.set('authorization', authorization)
  finalUrl.searchParams.set('date', date)
  finalUrl.searchParams.set('host', host)

  return finalUrl.toString()
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/services/xfyun/auth.ts
git commit -m "feat(xfyun): add shared HMAC-SHA256 WebSocket auth utility"
```

---

### Task 6: TTS Service (iFlytek + Web Speech API)

**Files:**
- Create: `frontend/src/services/xfyun/tts.ts`

- [ ] **Step 1: Create TTS service**

```typescript
// frontend/src/services/xfyun/tts.ts
import { buildXfyunWebSocketUrlAsync } from './auth'
import type { XfyunConfig, TtsSpeed } from '@/types/daily-sentence'

const TTS_ENDPOINT = 'wss://tts-api.xfyun.cn/v2/tts'

// Speed mapping: 'normal' -> 50, 'slow' -> 20
const SPEED_MAP: Record<TtsSpeed, number> = {
  normal: 50,
  slow: 20
}

/**
 * iFlytek TTS - synthesize Spanish text to MP3 audio via WebSocket.
 * Returns an audio Blob (MP3).
 */
export function xfyunTts(
  text: string,
  config: XfyunConfig,
  speed: TtsSpeed = 'normal',
  vcn = 'x4_esfemale1'
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      const wsUrl = await buildXfyunWebSocketUrlAsync(
        TTS_ENDPOINT,
        config.apiKey,
        config.apiSecret
      )
      const ws = new WebSocket(wsUrl)
      const audioChunks: Uint8Array[] = []

      ws.onopen = () => {
        const params = {
          common: { app_id: config.appId },
          business: {
            aue: 'lame',
            sfl: 1,
            auf: 'audio/L16;rate=16000',
            vcn,
            speed: SPEED_MAP[speed],
            volume: 50,
            pitch: 50,
            tte: 'UTF8'
          },
          data: {
            status: 2,
            text: btoa(unescape(encodeURIComponent(text)))
          }
        }
        ws.send(JSON.stringify(params))
      }

      ws.onmessage = (event) => {
        const resp = JSON.parse(event.data)
        if (resp.code !== 0) {
          ws.close()
          reject(new Error(`iFlytek TTS error ${resp.code}: ${resp.message}`))
          return
        }
        if (resp.data?.audio) {
          const binaryStr = atob(resp.data.audio)
          const bytes = new Uint8Array(binaryStr.length)
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i)
          }
          audioChunks.push(bytes)
        }
        if (resp.data?.status === 2) {
          ws.close()
          const blob = new Blob(audioChunks, { type: 'audio/mpeg' })
          resolve(blob)
        }
      }

      ws.onerror = (err) => {
        reject(new Error('WebSocket connection failed'))
      }

      ws.onclose = (event) => {
        if (audioChunks.length === 0 && event.code !== 1000) {
          reject(new Error(`WebSocket closed unexpectedly: ${event.code}`))
        }
      }
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Web Speech API fallback - uses browser built-in speech synthesis.
 * Returns a Promise that resolves when speech finishes.
 */
export function webSpeechTts(
  text: string,
  speed: TtsSpeed = 'normal'
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('Web Speech API not supported'))
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-ES'
    utterance.rate = speed === 'slow' ? 0.6 : 1.0
    utterance.pitch = 1.0

    // Try to find a Spanish voice
    const voices = window.speechSynthesis.getVoices()
    const spanishVoice = voices.find(v => v.lang.startsWith('es'))
    if (spanishVoice) {
      utterance.voice = spanishVoice
    }

    utterance.onend = () => resolve()
    utterance.onerror = (e) => reject(new Error(`Speech error: ${e.error}`))
    window.speechSynthesis.speak(utterance)
  })
}

/** Stop any ongoing Web Speech synthesis */
export function stopWebSpeech() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/services/xfyun/tts.ts
git commit -m "feat(tts): add iFlytek TTS and Web Speech API services"
```

---

### Task 7: Audio Recorder Service

**Files:**
- Create: `frontend/src/services/audio-recorder.ts`

This service captures audio from the microphone, outputs raw PCM (16kHz, mono, 16-bit), and provides base64-encoded chunks for the evaluation API. We use AudioContext + ScriptProcessorNode for PCM capture.

- [ ] **Step 1: Create audio recorder**

```typescript
// frontend/src/services/audio-recorder.ts

export interface RecorderCallbacks {
  onAudioData: (base64Chunk: string) => void
  onStop: () => void
  onError: (error: Error) => void
}

const TARGET_SAMPLE_RATE = 16000

/**
 * Downsample Float32Array from source rate to target rate.
 */
function downsample(buffer: Float32Array, srcRate: number, dstRate: number): Float32Array {
  if (srcRate === dstRate) return buffer
  const ratio = srcRate / dstRate
  const newLength = Math.round(buffer.length / ratio)
  const result = new Float32Array(newLength)
  for (let i = 0; i < newLength; i++) {
    const srcIndex = Math.round(i * ratio)
    result[i] = buffer[Math.min(srcIndex, buffer.length - 1)]
  }
  return result
}

/**
 * Convert Float32 PCM samples to 16-bit Int16 PCM, then base64 encode.
 */
function float32ToBase64Pcm(samples: Float32Array): string {
  const int16 = new Int16Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  const bytes = new Uint8Array(int16.buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export class AudioRecorder {
  private audioContext: AudioContext | null = null
  private mediaStream: MediaStream | null = null
  private sourceNode: MediaStreamAudioSourceNode | null = null
  private processorNode: ScriptProcessorNode | null = null
  private callbacks: RecorderCallbacks
  private _isRecording = false
  private allChunks: Float32Array[] = []

  constructor(callbacks: RecorderCallbacks) {
    this.callbacks = callbacks
  }

  get isRecording(): boolean {
    return this._isRecording
  }

  async start(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: TARGET_SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      })

      this.audioContext = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE })
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream)

      // ScriptProcessorNode bufferSize=4096 for chunked processing
      this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1)
      this.allChunks = []

      this.processorNode.onaudioprocess = (event) => {
        if (!this._isRecording) return
        const inputData = event.inputBuffer.getChannelData(0)
        const resampled = downsample(
          inputData,
          this.audioContext!.sampleRate,
          TARGET_SAMPLE_RATE
        )
        this.allChunks.push(new Float32Array(resampled))
        const base64Chunk = float32ToBase64Pcm(resampled)
        this.callbacks.onAudioData(base64Chunk)
      }

      this.sourceNode.connect(this.processorNode)
      this.processorNode.connect(this.audioContext.destination)
      this._isRecording = true
    } catch (err) {
      this.callbacks.onError(
        err instanceof Error ? err : new Error(String(err))
      )
    }
  }

  stop(): void {
    this._isRecording = false

    if (this.processorNode) {
      this.processorNode.disconnect()
      this.processorNode = null
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect()
      this.sourceNode = null
    }
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop())
      this.mediaStream = null
    }

    this.callbacks.onStop()
  }

  /**
   * Get all recorded audio as a single base64-encoded PCM string.
   */
  getFullAudioBase64(): string {
    const totalLen = this.allChunks.reduce((sum, c) => sum + c.length, 0)
    const merged = new Float32Array(totalLen)
    let offset = 0
    for (const chunk of this.allChunks) {
      merged.set(chunk, offset)
      offset += chunk.length
    }
    return float32ToBase64Pcm(merged)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/services/audio-recorder.ts
git commit -m "feat(recorder): add PCM audio recording with base64 encoding"
```

---

### Task 8: Speech Evaluation Service

**Files:**
- Create: `frontend/src/services/xfyun/evaluation.ts`

- [ ] **Step 1: Create evaluation service**

```typescript
// frontend/src/services/xfyun/evaluation.ts
import { buildXfyunWebSocketUrlAsync } from './auth'
import type { XfyunConfig, EvaluationResult, EvalWordResult } from '@/types/daily-sentence'

// Spanish evaluation uses the "other languages" endpoint
const EVAL_ENDPOINT = 'wss://cn-east-1.ws-api.xf-yun.com/v1/private/sffc17cdb'

const FRAME_SIZE = 1280  // bytes per frame (40ms at 16kHz, 16-bit)

/**
 * Split base64-encoded PCM audio into frames for streaming.
 */
function splitAudioFrames(fullBase64: string): string[] {
  const binaryStr = atob(fullBase64)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }

  const frames: string[] = []
  for (let offset = 0; offset < bytes.length; offset += FRAME_SIZE) {
    const end = Math.min(offset + FRAME_SIZE, bytes.length)
    const chunk = bytes.slice(offset, end)
    let chunkBinary = ''
    for (let i = 0; i < chunk.length; i++) {
      chunkBinary += String.fromCharCode(chunk[i])
    }
    frames.push(btoa(chunkBinary))
  }
  return frames
}

/**
 * Parse the evaluation result from iFlytek's base64-encoded response.
 */
function parseEvalResult(base64Text: string): EvaluationResult {
  const jsonStr = decodeURIComponent(escape(atob(base64Text)))
  const data = JSON.parse(jsonStr)

  const words: EvalWordResult[] = []
  if (data.words && Array.isArray(data.words)) {
    for (const w of data.words) {
      words.push({
        word: w.content || w.word || '',
        score: w.scores?.overall ?? w.overall ?? 0,
        readType: w.readType ?? w.read_type ?? 0
      })
    }
  }

  return {
    overall: data.overall ?? 0,
    pronunciation: data.pronunciation ?? 0,
    fluency: data.fluency ?? 0,
    integrity: data.integrity ?? 0,
    words,
    raw: data
  }
}

/**
 * Evaluate user's Spanish pronunciation against a reference sentence.
 *
 * @param refText - The reference Spanish sentence
 * @param audioBase64 - Base64-encoded PCM audio (16kHz, mono, 16-bit)
 * @param config - iFlytek credentials
 * @returns Evaluation result with scores
 */
export function evaluatePronunciation(
  refText: string,
  audioBase64: string,
  config: XfyunConfig
): Promise<EvaluationResult> {
  return new Promise(async (resolve, reject) => {
    try {
      const wsUrl = await buildXfyunWebSocketUrlAsync(
        EVAL_ENDPOINT,
        config.apiKey,
        config.apiSecret
      )
      const ws = new WebSocket(wsUrl)
      const frames = splitAudioFrames(audioBase64)
      let resultText = ''

      ws.onopen = () => {
        // Send frames with status progression: 0 -> 1 -> ... -> 2
        for (let i = 0; i < frames.length; i++) {
          let headerStatus: number
          let dataStatus: number

          if (i === 0) {
            headerStatus = 0
            dataStatus = 0
          } else if (i === frames.length - 1) {
            headerStatus = 2
            dataStatus = 2
          } else {
            headerStatus = 1
            dataStatus = 1
          }

          const msg: Record<string, unknown> = {
            header: {
              app_id: config.appId,
              status: headerStatus
            },
            payload: {
              data: {
                encoding: 'raw',
                sample_rate: 16000,
                channels: 1,
                bit_depth: 16,
                status: dataStatus,
                seq: i,
                audio: frames[i],
                frame_size: 0
              }
            }
          }

          // Only include parameter on the first frame
          if (i === 0) {
            msg.parameter = {
              st: {
                lang: 'sp',
                core: 'sent',
                refText,
                result: {
                  encoding: 'utf8',
                  compress: 'raw',
                  format: 'json'
                }
              }
            }
          }

          ws.send(JSON.stringify(msg))
        }
      }

      ws.onmessage = (event) => {
        const resp = JSON.parse(event.data)
        if (resp.header?.code !== 0) {
          ws.close()
          reject(
            new Error(
              `Evaluation error ${resp.header?.code}: ${resp.header?.message}`
            )
          )
          return
        }

        if (resp.payload?.result?.text) {
          resultText += resp.payload.result.text
        }

        // Final response
        if (resp.header?.status === 2) {
          ws.close()
          try {
            const result = parseEvalResult(resultText)
            resolve(result)
          } catch (e) {
            reject(new Error(`Failed to parse evaluation result: ${e}`))
          }
        }
      }

      ws.onerror = () => {
        reject(new Error('Evaluation WebSocket connection failed'))
      }

      ws.onclose = (event) => {
        if (!resultText && event.code !== 1000) {
          reject(new Error(`WebSocket closed: ${event.code}`))
        }
      }
    } catch (err) {
      reject(err)
    }
  })
}
```

Note: The evaluation API docs list `encoding` options as `lame`, `speex`, `speex-wb`. We are sending raw PCM. If the API does not accept `raw` encoding, change to `lame` and use a client-side MP3 encoder (lamejs). Test this during integration — if `raw` fails, install lamejs:

```bash
cd frontend && pnpm add lamejs
```

Then wrap the PCM data through `lamejs.Mp3Encoder` before sending. The frames logic stays the same.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/services/xfyun/evaluation.ts
git commit -m "feat(evaluation): add iFlytek Suntone speech evaluation service"
```

---

### Task 9: Settings Page — iFlytek Configuration UI

**Files:**
- Modify: `frontend/src/pages/settings/index.vue`

- [ ] **Step 1: Add iFlytek config section to settings page**

Add the following section to the settings page template, after the existing AI provider configuration sections. Look for the closing `</el-card>` of the last provider section and add after it:

```vue
<!-- 讯飞语音配置 -->
<el-card class="config-card" shadow="hover">
  <template #header>
    <div class="card-header">
      <span>讯飞语音服务</span>
      <span class="card-subtitle">用于语音合成(TTS)和语音评测</span>
    </div>
  </template>
  <el-form label-position="top">
    <el-form-item label="App ID">
      <el-input
        v-model="xfyunConfig.appId"
        placeholder="请输入讯飞 App ID"
        @change="onXfyunConfigChange"
      />
    </el-form-item>
    <el-form-item label="API Key">
      <el-input
        v-model="xfyunConfig.apiKey"
        placeholder="请输入讯飞 API Key"
        @change="onXfyunConfigChange"
      />
    </el-form-item>
    <el-form-item label="API Secret">
      <el-input
        v-model="xfyunConfig.apiSecret"
        placeholder="请输入讯飞 API Secret"
        type="password"
        show-password
        @change="onXfyunConfigChange"
      />
    </el-form-item>
  </el-form>
</el-card>
```

In the `<script setup>` section, add:

```typescript
const xfyunConfig = computed(() => settingsStore.xfyunConfig)

function onXfyunConfigChange() {
  settingsStore.updateXfyunConfig(xfyunConfig.value)
}
```

Add CSS for `.card-subtitle`:

```css
.card-subtitle {
  font-size: 0.8rem;
  color: #999;
  margin-left: 0.5rem;
}
```

- [ ] **Step 2: Run dev server and verify the settings UI renders**

```bash
cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo && pnpm --filter spanish-assistant-frontend dev
```

Open browser to `http://localhost:31420/#/settings` and verify the iFlytek config section appears.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/settings/index.vue
git commit -m "feat(settings): add iFlytek voice service configuration UI"
```

---

### Task 10: Daily Sentence Page — Main UI

**Files:**
- Create: `frontend/src/pages/daily-sentence/index.vue`

This is the main feature page combining: sentence display, TTS playback, recording, evaluation results, and import.

- [ ] **Step 1: Create the page component**

```vue
<!-- frontend/src/pages/daily-sentence/index.vue -->
<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import {
  ElCard,
  ElButton,
  ElMessage,
  ElProgress,
  ElDialog,
  ElInput,
  ElSwitch,
  ElTag,
  ElTooltip
} from 'element-plus'
import { useDailySentenceStore } from '@/stores/daily-sentence'
import { useSettingsStore } from '@/stores/settings'
import { xfyunTts, webSpeechTts, stopWebSpeech } from '@/services/xfyun/tts'
import { evaluatePronunciation } from '@/services/xfyun/evaluation'
import { AudioRecorder } from '@/services/audio-recorder'
import type { TtsSpeed, DailySentence } from '@/types/daily-sentence'

defineOptions({ name: 'DailySentence' })

const store = useDailySentenceStore()
const settingsStore = useSettingsStore()

// --- TTS State ---
const isSpeaking = ref(false)
const currentTtsSpeed = ref<TtsSpeed>('normal')

async function playTts(speed: TtsSpeed) {
  if (isSpeaking.value) {
    stopWebSpeech()
    isSpeaking.value = false
    return
  }

  const sentence = store.currentSentence
  if (!sentence) return

  isSpeaking.value = true
  currentTtsSpeed.value = speed

  try {
    const xfyunConfig = settingsStore.xfyunConfig
    if (xfyunConfig.appId && xfyunConfig.apiKey && xfyunConfig.apiSecret) {
      // Use iFlytek TTS
      const blob = await xfyunTts(sentence.sentence_original, xfyunConfig, speed)
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.onended = () => {
        isSpeaking.value = false
        URL.revokeObjectURL(url)
      }
      audio.onerror = () => {
        isSpeaking.value = false
        URL.revokeObjectURL(url)
        ElMessage.error('音频播放失败')
      }
      await audio.play()
    } else {
      // Fallback to Web Speech API
      await webSpeechTts(sentence.sentence_original, speed)
      isSpeaking.value = false
    }
  } catch (err) {
    isSpeaking.value = false
    ElMessage.error(`语音合成失败: ${err instanceof Error ? err.message : err}`)
  }
}

// --- Recording State ---
const isRecording = ref(false)
const isEvaluating = ref(false)
let recorder: AudioRecorder | null = null

function startRecording() {
  const sentence = store.currentSentence
  if (!sentence) return

  store.setEvaluation(null as any)

  recorder = new AudioRecorder({
    onAudioData: () => {
      // Streaming data collected internally
    },
    onStop: () => {
      // Handled in stopRecording
    },
    onError: (err) => {
      isRecording.value = false
      ElMessage.error(`录音失败: ${err.message}`)
    }
  })

  recorder.start()
  isRecording.value = true
}

async function stopRecording() {
  if (!recorder) return

  recorder.stop()
  isRecording.value = false
  isEvaluating.value = true

  const sentence = store.currentSentence
  const xfyunConfig = settingsStore.xfyunConfig

  if (!sentence) {
    isEvaluating.value = false
    return
  }

  if (!xfyunConfig.appId || !xfyunConfig.apiKey || !xfyunConfig.apiSecret) {
    isEvaluating.value = false
    ElMessage.warning('请先在设置中配置讯飞语音服务')
    return
  }

  try {
    const audioBase64 = recorder.getFullAudioBase64()
    const result = await evaluatePronunciation(
      sentence.sentence_original,
      audioBase64,
      xfyunConfig
    )
    store.setEvaluation(result)
  } catch (err) {
    ElMessage.error(`评测失败: ${err instanceof Error ? err.message : err}`)
  } finally {
    isEvaluating.value = false
    recorder = null
  }
}

// --- Import State ---
const showImportDialog = ref(false)
const importJsonText = ref('')

function openImportDialog() {
  importJsonText.value = ''
  showImportDialog.value = true
}

function handleImportPaste() {
  try {
    const data = JSON.parse(importJsonText.value)
    let sentences: DailySentence[]

    if (Array.isArray(data)) {
      sentences = data
    } else if (data.sentences && Array.isArray(data.sentences)) {
      sentences = data.sentences
    } else {
      ElMessage.error('JSON 格式不正确，需要数组或包含 sentences 字段的对象')
      return
    }

    // Validate structure
    for (const s of sentences) {
      if (!s.sentence_original || !s.sentence_translation) {
        ElMessage.error('每条数据必须包含 sentence_original 和 sentence_translation')
        return
      }
    }

    store.importSentences(sentences)
    showImportDialog.value = false
    ElMessage.success(`成功导入 ${sentences.length} 条语句`)
  } catch {
    ElMessage.error('JSON 解析失败，请检查格式')
  }
}

async function handleImportFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      importJsonText.value = text
      handleImportPaste()
    } catch {
      ElMessage.error('文件读取失败')
    }
  }
  input.click()
}

// --- Score Color ---
function scoreColor(score: number): string {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

function readTypeLabel(type: number): string {
  switch (type) {
    case 0: return ''
    case 1: return '多读'
    case 2: return '漏读'
    default: return ''
  }
}

// Cleanup
onBeforeUnmount(() => {
  if (recorder?.isRecording) {
    recorder.stop()
  }
  stopWebSpeech()
})
</script>

<template>
  <div class="daily-sentence-page">
    <!-- Header -->
    <div class="page-header">
      <h2 class="page-title">每日一句</h2>
      <div class="header-actions">
        <el-button size="small" @click="openImportDialog">导入</el-button>
        <el-button size="small" @click="store.resetToBuiltIn">重置</el-button>
      </div>
    </div>

    <!-- Sentence Card -->
    <el-card v-if="store.currentSentence" class="sentence-card" shadow="hover">
      <div class="sentence-date">{{ store.currentSentence.date }}</div>

      <div class="sentence-original">
        {{ store.currentSentence.sentence_original }}
      </div>

      <div class="sentence-translation">
        {{ store.currentSentence.sentence_translation }}
      </div>

      <!-- TTS Controls -->
      <div class="tts-controls">
        <el-button
          :type="isSpeaking && currentTtsSpeed === 'normal' ? 'danger' : 'primary'"
          @click="playTts('normal')"
          :loading="isSpeaking && currentTtsSpeed === 'normal'"
          round
        >
          {{ isSpeaking && currentTtsSpeed === 'normal' ? '停止' : '正常语速' }}
        </el-button>
        <el-button
          :type="isSpeaking && currentTtsSpeed === 'slow' ? 'danger' : 'info'"
          @click="playTts('slow')"
          :loading="isSpeaking && currentTtsSpeed === 'slow'"
          round
        >
          {{ isSpeaking && currentTtsSpeed === 'slow' ? '停止' : '慢速播放' }}
        </el-button>
      </div>

      <!-- Navigation -->
      <div class="sentence-nav">
        <el-button @click="store.prevSentence" :disabled="store.totalCount <= 1">
          上一句
        </el-button>
        <span class="nav-counter">
          {{ store.currentIndex + 1 }} / {{ store.totalCount }}
        </span>
        <el-button @click="store.nextSentence" :disabled="store.totalCount <= 1">
          下一句
        </el-button>
      </div>
    </el-card>

    <!-- Recording Section -->
    <el-card class="recording-card" shadow="hover">
      <template #header>
        <span>语音练习</span>
      </template>

      <div class="recording-controls">
        <el-button
          v-if="!isRecording"
          type="success"
          size="large"
          round
          @click="startRecording"
          :disabled="isEvaluating || !store.currentSentence"
        >
          开始录音
        </el-button>
        <el-button
          v-else
          type="danger"
          size="large"
          round
          @click="stopRecording"
          class="recording-btn"
        >
          停止录音
        </el-button>

        <div v-if="isRecording" class="recording-indicator">
          <span class="recording-dot"></span>
          录音中...
        </div>

        <div v-if="isEvaluating" class="evaluating-indicator">
          评测中...
        </div>
      </div>

      <!-- Evaluation Results -->
      <div v-if="store.lastEvaluation" class="eval-results">
        <h3 class="eval-title">评测结果</h3>

        <div class="eval-scores">
          <div class="score-item">
            <span class="score-label">总分</span>
            <el-progress
              type="circle"
              :percentage="Math.round(store.lastEvaluation.overall)"
              :width="70"
              :color="scoreColor(store.lastEvaluation.overall)"
            />
          </div>
          <div class="score-item">
            <span class="score-label">发音</span>
            <el-progress
              type="circle"
              :percentage="Math.round(store.lastEvaluation.pronunciation)"
              :width="70"
              :color="scoreColor(store.lastEvaluation.pronunciation)"
            />
          </div>
          <div class="score-item">
            <span class="score-label">流利度</span>
            <el-progress
              type="circle"
              :percentage="Math.round(store.lastEvaluation.fluency)"
              :width="70"
              :color="scoreColor(store.lastEvaluation.fluency)"
            />
          </div>
          <div class="score-item">
            <span class="score-label">完整度</span>
            <el-progress
              type="circle"
              :percentage="Math.round(store.lastEvaluation.integrity)"
              :width="70"
              :color="scoreColor(store.lastEvaluation.integrity)"
            />
          </div>
        </div>

        <!-- Per-word results -->
        <div v-if="store.lastEvaluation.words.length > 0" class="eval-words">
          <span
            v-for="(w, idx) in store.lastEvaluation.words"
            :key="idx"
            class="eval-word"
            :class="{
              'word-good': w.score >= 80,
              'word-ok': w.score >= 60 && w.score < 80,
              'word-bad': w.score < 60,
              'word-missed': w.readType === 2,
              'word-extra': w.readType === 1
            }"
          >
            <el-tooltip
              :content="`得分: ${w.score}${readTypeLabel(w.readType) ? ' (' + readTypeLabel(w.readType) + ')' : ''}`"
              placement="top"
            >
              <span>{{ w.word }}</span>
            </el-tooltip>
          </span>
        </div>
      </div>
    </el-card>

    <!-- Import Dialog -->
    <el-dialog v-model="showImportDialog" title="导入语句数据" width="90%" :max-width="500">
      <div class="import-content">
        <p class="import-tip">
          支持 JSON 数组格式，每条数据需包含 <code>sentence_original</code>
          和 <code>sentence_translation</code> 字段。
        </p>
        <el-input
          v-model="importJsonText"
          type="textarea"
          :rows="8"
          placeholder='[{"date":"17.abr","sentence_original":"...","sentence_translation":"..."}]'
        />
        <div class="import-actions">
          <el-button @click="handleImportFile">从文件导入</el-button>
          <el-button type="primary" @click="handleImportPaste" :disabled="!importJsonText.trim()">
            导入
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.daily-sentence-page {
  height: 100%;
  overflow-y: auto;
  padding: 1rem;
  padding-bottom: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.page-title {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

/* Sentence Card */
.sentence-card {
  margin-bottom: 1rem;
}

.sentence-date {
  font-size: 0.85rem;
  color: #999;
  margin-bottom: 0.75rem;
  text-transform: capitalize;
}

.sentence-original {
  font-size: 1.2rem;
  color: #333;
  line-height: 1.6;
  margin-bottom: 0.75rem;
  font-weight: 500;
}

.sentence-translation {
  font-size: 1rem;
  color: #666;
  line-height: 1.5;
  margin-bottom: 1rem;
  padding-top: 0.75rem;
  border-top: 1px dashed #e0e0e0;
}

.tts-controls {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.sentence-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f0f0f0;
}

.nav-counter {
  font-size: 0.9rem;
  color: #999;
  min-width: 60px;
  text-align: center;
}

/* Recording Card */
.recording-card {
  margin-bottom: 1rem;
}

.recording-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.recording-btn {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #f56c6c;
  font-size: 0.9rem;
}

.recording-dot {
  width: 10px;
  height: 10px;
  background: #f56c6c;
  border-radius: 50%;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.evaluating-indicator {
  color: #409eff;
  font-size: 0.9rem;
}

/* Evaluation Results */
.eval-results {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

.eval-title {
  font-size: 1rem;
  margin: 0 0 1rem 0;
  color: #333;
}

.eval-scores {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.score-label {
  font-size: 0.8rem;
  color: #666;
}

/* Per-word coloring */
.eval-words {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  line-height: 2;
}

.eval-word {
  cursor: pointer;
  padding: 0.1rem 0.2rem;
  border-radius: 3px;
  font-size: 1rem;
}

.word-good { color: #67c23a; }
.word-ok { color: #e6a23c; }
.word-bad { color: #f56c6c; }
.word-missed { text-decoration: line-through; color: #f56c6c; }
.word-extra { color: #909399; font-style: italic; }

/* Import */
.import-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.import-tip {
  font-size: 0.85rem;
  color: #666;
  margin: 0;
}

.import-tip code {
  background: #f5f5f5;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-size: 0.8rem;
}

.import-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* Mobile */
@media (max-width: 600px) {
  .daily-sentence-page {
    padding: 0.75rem;
  }

  .sentence-original {
    font-size: 1.1rem;
  }

  .tts-controls {
    flex-direction: column;
  }

  .tts-controls .el-button {
    width: 100%;
  }

  .eval-scores {
    gap: 0.5rem;
  }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/daily-sentence/index.vue
git commit -m "feat(daily-sentence): add main page with TTS, recording, and evaluation UI"
```

---

### Task 11: Router — Add Daily Sentence Route

**Files:**
- Modify: `frontend/src/router/index.ts`

- [ ] **Step 1: Add the route**

In `frontend/src/router/index.ts`, add the daily sentence route inside the `DefaultLayout` children array, after the `/dictionary` route:

```typescript
{
  path: '/daily-sentence',
  name: 'DailySentence',
  component: () => import('@/pages/daily-sentence/index.vue'),
  meta: { keepAlive: true }
},
```

The children array should now have 4 entries: Home, Dictionary, DailySentence, Settings.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/router/index.ts
git commit -m "feat(router): add daily-sentence route"
```

---

### Task 12: Bottom Nav — Add 4th Tab

**Files:**
- Modify: `frontend/src/layouts/BottomNav.vue`

- [ ] **Step 1: Add the daily sentence nav item**

In `frontend/src/layouts/BottomNav.vue`, add a new `<router-link>` before the Settings tab (between the Dictionary and Settings links):

```vue
<router-link 
  to="/daily-sentence"
  class="nav-item" 
  :class="{ active: $route.name === 'DailySentence' }"
>
  <div class="nav-icon">📝</div>
  <span class="nav-text">每日一句</span>
</router-link>
```

- [ ] **Step 2: Run dev server and verify all 4 tabs display and route correctly**

```bash
cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo && pnpm --filter spanish-assistant-frontend dev
```

Open `http://localhost:31420` — verify:
1. Bottom nav shows 4 tabs: 行业动态, 字典, 每日一句, 设置
2. Clicking "每日一句" navigates to the daily sentence page
3. The sentence card displays with Spanish text and Chinese translation
4. "正常语速" and "慢速播放" buttons trigger Web Speech API (if no iFlytek config)
5. Navigation between sentences works
6. "开始录音" requests microphone permission
7. Settings page shows iFlytek config section
8. Import dialog opens and accepts JSON

- [ ] **Step 3: Commit**

```bash
git add frontend/src/layouts/BottomNav.vue
git commit -m "feat(nav): add daily-sentence tab to bottom navigation"
```

---

### Task 13: Integration Testing & Polish

**Files:**
- Possibly modify any files from above based on testing

- [ ] **Step 1: Test Web Speech API TTS**

With the dev server running, navigate to "每日一句" and click "正常语速". Verify the browser reads the Spanish sentence aloud. Click "慢速播放" and verify slower speech.

- [ ] **Step 2: Test iFlytek TTS (if credentials available)**

Go to Settings, enter iFlytek app_id/api_key/api_secret. Return to "每日一句" and click "正常语速". Verify audio plays from iFlytek (should be higher quality than Web Speech).

- [ ] **Step 3: Test recording + evaluation**

Click "开始录音", read the Spanish sentence aloud, click "停止录音". Verify:
- Evaluation results appear with circle progress indicators
- Per-word coloring shows (green/yellow/red)
- Hovering over words shows score tooltips

- [ ] **Step 4: Test template import — paste JSON**

Click "导入", paste the following JSON, click "导入":

```json
[{"date":"1.may","sentence_original":"Hola mundo.","sentence_translation":"你好世界。"}]
```

Verify the sentence list updates to show the imported data.

- [ ] **Step 5: Test template import — file**

Create a test JSON file, click "从文件导入", select the file. Verify import works.

- [ ] **Step 6: Test reset**

Click "重置", verify the built-in sentences are restored.

- [ ] **Step 7: Fix any issues found during testing and commit**

```bash
git add -A
git commit -m "fix(daily-sentence): polish and bug fixes from integration testing"
```

---

## Implementation Notes

### iFlytek Spanish Voice Name (`vcn`)
The exact voice name for Spanish TTS needs to be obtained from the [iFlytek console](https://console.xfyun.cn/services/tts) after activating the Spanish voice service. The plan uses `x4_esfemale1` as a placeholder. Update in `frontend/src/services/xfyun/tts.ts` after checking the console.

### Audio Encoding for Evaluation
The evaluation API may not accept `raw` PCM encoding (documented options: `lame`, `speex`, `speex-wb`). If `raw` fails during testing:
1. Install lamejs: `cd frontend && pnpm add lamejs`
2. Add MP3 encoding wrapper in `audio-recorder.ts`
3. Change `encoding` to `lame` in `evaluation.ts`

### Web Speech API Limitations
- Voice availability depends on the OS and browser. macOS typically has built-in Spanish voices; other platforms may not.
- The Web Speech API may not work within Tauri's webview on all platforms. If it doesn't work, iFlytek TTS becomes the only option.

### CSP
The project has CSP disabled (`"csp": null` in tauri.conf.json), so WebSocket connections to iFlytek servers will work without CSP issues.
