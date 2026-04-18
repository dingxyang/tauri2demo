<script setup lang="ts">
interface WordScore {
  word: string
  overall: number
  pronunciation: number
  read_type: number
}

interface EvalResultData {
  overall: number
  pronunciation: number
  fluency: number
  integrity: number
  words: WordScore[]
}

defineProps<{
  result: EvalResultData | null
}>()

function getScoreColor(score: number): string {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

function getReadTypeLabel(readType: number): string {
  switch (readType) {
    case 1: return '(插入)'
    case 2: return '(遗漏)'
    default: return ''
  }
}
</script>

<template>
  <div v-if="result" class="eval-result">
    <div class="scores-summary">
      <div class="score-item">
        <div class="score-value" :style="{ color: getScoreColor(result.overall) }">
          {{ result.overall.toFixed(1) }}
        </div>
        <div class="score-label">总分</div>
      </div>
      <div class="score-item">
        <div class="score-value" :style="{ color: getScoreColor(result.pronunciation) }">
          {{ result.pronunciation.toFixed(1) }}
        </div>
        <div class="score-label">发音</div>
      </div>
      <div class="score-item">
        <div class="score-value" :style="{ color: getScoreColor(result.fluency) }">
          {{ result.fluency.toFixed(1) }}
        </div>
        <div class="score-label">流利度</div>
      </div>
      <div class="score-item">
        <div class="score-value" :style="{ color: getScoreColor(result.integrity) }">
          {{ result.integrity.toFixed(1) }}
        </div>
        <div class="score-label">完整度</div>
      </div>
    </div>

    <div v-if="result.words.length > 0" class="words-feedback">
      <div class="section-title">逐词反馈</div>
      <div class="words-container">
        <span
          v-for="(w, idx) in result.words"
          :key="idx"
          class="word-tag"
          :style="{ color: getScoreColor(w.overall) }"
          :class="{ 'read-error': w.read_type > 0 }"
        >
          {{ w.word }}
          <sub class="word-score">{{ w.overall.toFixed(0) }}</sub>
          <span v-if="w.read_type > 0" class="read-type-label">{{ getReadTypeLabel(w.read_type) }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.eval-result {
  padding: 16px;
  background: white;
  border-radius: 8px;
}

.scores-summary {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.score-item {
  text-align: center;
}

.score-value {
  font-size: 28px;
  font-weight: 700;
}

.score-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.words-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.word-tag {
  font-size: 16px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  background: #f5f7fa;
}

.word-tag.read-error {
  text-decoration: underline wavy;
}

.word-score {
  font-size: 11px;
  opacity: 0.7;
  margin-left: 2px;
}

.read-type-label {
  font-size: 11px;
  color: #f56c6c;
}
</style>
