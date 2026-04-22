<template>
  <div class="scenario-overlay" v-if="visible" @click.self="$emit('close')">
    <transition name="fade">
      <div v-if="visible" class="scenario-panel">
        <div class="panel-header">
          <span class="panel-title">情景对话</span>
          <button class="close-btn" @click="$emit('close')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="filter-bar">
          <div class="filter-group">
            <button
              :class="['filter-tag', { active: activeCategory === '' }]"
              @click="activeCategory = ''"
            >全部</button>
            <button
              v-for="cat in scenarioCategories"
              :key="cat"
              :class="['filter-tag', { active: activeCategory === cat }]"
              @click="activeCategory = cat"
            >{{ cat }}</button>
          </div>
          <div class="filter-group">
            <button
              :class="['filter-tag', { active: activeDifficulty === '' }]"
              @click="activeDifficulty = ''"
            >全部难度</button>
            <button
              v-for="d in difficulties"
              :key="d"
              :class="['filter-tag', { active: activeDifficulty === d }]"
              @click="activeDifficulty = d"
            >{{ difficultyLabels[d] }}</button>
          </div>
        </div>

        <div class="scenario-list">
          <div
            v-for="s in filteredScenarios"
            :key="s.id"
            class="scenario-card"
            @click="$emit('select-scenario', s)"
          >
            <div class="card-top">
              <span class="card-title">{{ s.title }}</span>
              <span :class="['difficulty-badge', s.difficulty]">{{ difficultyLabels[s.difficulty] }}</span>
            </div>
            <div class="card-title-es">{{ s.titleEs }}</div>
            <div class="card-desc">{{ s.description }}</div>
            <div class="card-roles">
              <span class="role-tag">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                你：{{ s.userRole.name }}
              </span>
              <span class="role-tag">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                AI：{{ s.aiRole.name }}
              </span>
            </div>
            <span class="category-tag">{{ s.category }}</span>
          </div>
          <div v-if="filteredScenarios.length === 0" class="empty-state">
            没有匹配的场景
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { scenarios, scenarioCategories, difficultyLabels } from './data/scenarios';
import type { Scenario } from './data/scenarios';

defineProps<{ visible: boolean }>();

const emit = defineEmits<{
  'close': [];
  'select-scenario': [scenario: Scenario];
}>();

const activeCategory = ref('');
const activeDifficulty = ref('');
const difficulties: Scenario['difficulty'][] = ['beginner', 'intermediate', 'advanced'];

const filteredScenarios = computed(() => {
  return scenarios.filter(s => {
    if (activeCategory.value && s.category !== activeCategory.value) return false;
    if (activeDifficulty.value && s.difficulty !== activeDifficulty.value) return false;
    return true;
  });
});
</script>

<style scoped>
.scenario-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
  display: flex;
  align-items: flex-end;
}

.scenario-panel {
  width: 100%;
  max-height: 90vh;
  background: #f5f5f5;
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.fade-enter-active,
.fade-leave-active {
  transition: transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  transform: translateY(100%);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.panel-title {
  font-size: 17px;
  font-weight: 600;
  color: #1a1a1a;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  cursor: pointer;
  color: #999;
  border-radius: 8px;
}

.close-btn:active {
  background: #f5f5f5;
}

.filter-bar {
  padding: 12px 16px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.filter-group {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.filter-group::-webkit-scrollbar {
  display: none;
}

.filter-tag {
  flex-shrink: 0;
  padding: 4px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 16px;
  background: #fff;
  color: #606266;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.filter-tag.active {
  background: #2B5CE6;
  color: #fff;
  border-color: #2B5CE6;
}

.scenario-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}

.scenario-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: transform 0.12s, box-shadow 0.12s;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.scenario-card:active {
  transform: scale(0.98);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.difficulty-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
  flex-shrink: 0;
}

.difficulty-badge.beginner {
  background: #e8f8e8;
  color: #52c41a;
}

.difficulty-badge.intermediate {
  background: #fff7e6;
  color: #fa8c16;
}

.difficulty-badge.advanced {
  background: #fff1f0;
  color: #f5222d;
}

.card-title-es {
  font-size: 13px;
  color: #999;
  font-style: italic;
  margin-bottom: 8px;
}

.card-desc {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 10px;
}

.card-roles {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.role-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.category-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #f0f4ff;
  color: #2B5CE6;
}

.empty-state {
  text-align: center;
  padding: 40px 16px;
  color: #999;
  font-size: 14px;
}
</style>
