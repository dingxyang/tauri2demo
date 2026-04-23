# Chat Model Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "场景对话" settings section with a chat model selector that lets users pick which AI model service the chat uses, auto-defaulting to the first enabled+available provider.

**Architecture:** Remove `chatDefaultPrompt` from settings state and all references. Add a grouped model selector in the settings page "对话设置" section using `el-option-group`. Add auto-default logic in settings store to pick the first available provider when no model is saved or the saved model is unavailable. Simplify chat page to no longer pass `chatDefaultPrompt` when creating/ensuring sessions.

**Tech Stack:** Vue 3, Pinia, Element Plus (`el-select`, `el-option-group`), localStorage

---

### Task 1: Remove `chatDefaultPrompt` from settings store

**Files:**
- Modify: `frontend/src/stores/settings.ts`

- [ ] **Step 1: Remove `chatDefaultPrompt` from `settingsState` reactive definition**

Remove line 27 (`chatDefaultPrompt: '',`) from the `settingsState` object:

```typescript
// BEFORE (lines 17-28):
const settingsState = reactive({
  providers: createProviderConfig(),
  isDark: false,
  defaultModelInfo: '',
  xfSpeechEval: {
    appId: '',
    apiKey: '',
    apiSecret: '',
  },
  chatDefaultPrompt: '',
});

// AFTER:
const settingsState = reactive({
  providers: createProviderConfig(),
  isDark: false,
  defaultModelInfo: '',
  xfSpeechEval: {
    appId: '',
    apiKey: '',
    apiSecret: '',
  },
});
```

- [ ] **Step 2: Remove `chatDefaultPrompt` loading logic from `loadSettings()`**

Remove lines 106-107:

```typescript
// REMOVE these lines:
if (settings.chatDefaultPrompt !== undefined) {
  settingsState.chatDefaultPrompt = settings.chatDefaultPrompt;
}
```

- [ ] **Step 3: Add auto-default logic in `loadSettings()`**

After the `defaultModelInfo` loading block (line 34-36), add logic to auto-select the first available provider if `defaultModelInfo` is empty or invalid. Insert after the line `settingsState.defaultModelInfo = currentModelInfo;` (line 36):

```typescript
// Auto-default: if no model saved or saved model unavailable, pick first available
if (!settingsState.defaultModelInfo || !isModelAvailable(settingsState.defaultModelInfo)) {
  const firstAvailable = getFirstAvailableProvider();
  if (firstAvailable) {
    settingsState.defaultModelInfo = `${firstAvailable.id}/${firstAvailable.defaultModel}`;
    setCurrentModelInfo(settingsState.defaultModelInfo);
  }
}
```

And add the helper functions at the top of the store function body (after `const settingsState = reactive(...)` block):

```typescript
/** Check if a "providerId/modelId" model info points to an enabled+available provider */
function isModelAvailable(modelInfo: string): boolean {
  const [providerId] = modelInfo.split('/');
  const provider = settingsState.providers[providerId];
  return provider && provider.enabled && provider.available === true;
}

/** Get the first provider that is enabled and available (tested successfully) */
function getFirstAvailableProvider(): Provider | null {
  const entries = Object.values(settingsState.providers);
  for (const p of entries) {
    if (p.enabled && p.available === true) return p;
  }
  return null;
}
```

Also add the import for `setCurrentModelInfo` — check if it's already imported. Looking at line 3-10, `getCurrentModelInfo` and `setCurrentModelInfo` are both already imported from `@/utils/localStorage`. Good.

Also need to import `Provider` type. Looking at line 14, `createProviderConfig` is imported from `@/utils/constant/providers` but `Provider` is not. Add it:

```typescript
import { 
  createProviderConfig, 
  Provider,
} from "@/utils/constant/providers";
```

- [ ] **Step 4: Verify no TypeScript errors**

Run: `cd frontend && npx vue-tsc --noEmit`
Expected: No errors related to `chatDefaultPrompt` removal or new functions

- [ ] **Step 5: Commit**

```bash
git add frontend/src/stores/settings.ts
git commit -m "refactor: remove chatDefaultPrompt from settings, add auto-default model logic"
```

---

### Task 2: Remove `chatDefaultPrompt` from chat page

**Files:**
- Modify: `frontend/src/pages/chat/index.vue`

- [ ] **Step 1: Remove `chatDefaultPrompt` from `onMounted` and `onActivated`**

Change lines 106-112:

```typescript
// BEFORE:
onMounted(() => {
  chatStore.ensureActiveSession(settingsStore.settingsState.chatDefaultPrompt || '');
});

onActivated(() => {
  chatStore.ensureActiveSession(settingsStore.settingsState.chatDefaultPrompt || '');
});

// AFTER:
onMounted(() => {
  chatStore.ensureActiveSession();
});

onActivated(() => {
  chatStore.ensureActiveSession();
});
```

- [ ] **Step 2: Remove `chatDefaultPrompt` from `handleNewSession`**

Change line 263:

```typescript
// BEFORE:
chatStore.createSession(settingsStore.settingsState.chatDefaultPrompt || '');

// AFTER:
chatStore.createSession();
```

- [ ] **Step 3: Remove `chatDefaultPrompt` from `handleDeleteSession`**

Change line 267:

```typescript
// BEFORE:
function handleDeleteSession(id: string) { chatStore.deleteSession(id); chatStore.ensureActiveSession(settingsStore.settingsState.chatDefaultPrompt || ''); }

// AFTER:
function handleDeleteSession(id: string) { chatStore.deleteSession(id); chatStore.ensureActiveSession(); }
```

- [ ] **Step 4: Verify no TypeScript errors**

Run: `cd frontend && npx vue-tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/chat/index.vue
git commit -m "refactor: remove chatDefaultPrompt usage from chat page"
```

---

### Task 3: Replace "场景对话" settings section with model selector

**Files:**
- Modify: `frontend/src/pages/settings/index.vue`

- [ ] **Step 1: Rename menu item label**

Change line 40 (the `sectionTitle` map):

```typescript
// BEFORE:
const sectionTitle: Record<Exclude<Section, null>, string> = {
  'speech-eval': '语音评测配置',
  'model-services': '模型服务',
  'chat': '场景对话',
}

// AFTER:
const sectionTitle: Record<Exclude<Section, null>, string> = {
  'speech-eval': '语音评测配置',
  'model-services': '模型服务',
  'chat': '对话设置',
}
```

Also change the menu item label in the template. The menu item on line 256 currently has `<span class="menu-label">场景对话</span>`. Change to:

```html
<span class="menu-label">对话设置</span>
```

- [ ] **Step 2: Remove `chatDefaultPrompt` from the `watch`**

Change line 88:

```typescript
// BEFORE:
watch(
  () => [settings.value.providers, settings.value.xfSpeechEval, settings.value.chatDefaultPrompt],
  () => { autoSave(); },
  { deep: true }
);

// AFTER:
watch(
  () => [settings.value.providers, settings.value.xfSpeechEval],
  () => { autoSave(); },
  { deep: true }
);
```

- [ ] **Step 3: Add `computed` for available providers and models for the selector**

Add after the `settings` computed (around line 62):

```typescript
/** Providers that are enabled and tested successfully (available === true) */
const availableProviders = computed(() => {
  return Object.entries(settings.value.providers)
    .filter(([_, p]) => p.enabled && p.available === true)
    .map(([id, p]) => ({
      id,
      name: p.name,
      models: Object.keys(p.models).map(modelId => ({
        id: modelId,
        name: modelId,
      })),
      defaultModel: p.defaultModel,
    }));
});

/** Whether any available provider exists */
const hasAvailableProviders = computed(() => availableProviders.value.length > 0);

/** Current selected model display info */
const currentModelDisplay = computed(() => {
  const modelInfo = settings.value.defaultModelInfo;
  if (!modelInfo) return '';
  const [providerId, modelId] = modelInfo.split('/');
  const provider = settings.value.providers[providerId];
  if (!provider) return modelId;
  return `${provider.name} / ${modelId}`;
});
```

- [ ] **Step 4: Replace the "场景对话" section template content**

Replace the entire `v-else-if="currentSection === 'chat'"` block (lines 427-441):

```html
<!-- BEFORE: -->
<div v-else-if="currentSection === 'chat'" class="settings-body">
  <div class="form-group">
    <div class="form-group-header">
      <span class="form-group-title">默认系统提示语</span>
    </div>
    <div class="form-row" style="flex-direction: column; align-items: stretch; gap: 4px;">
      <el-input
        v-model="settings.chatDefaultPrompt"
        type="textarea"
        :rows="6"
        placeholder="输入系统提示语，定义AI的角色和行为"
      />
    </div>
  </div>
</div>

<!-- AFTER: -->
<div v-else-if="currentSection === 'chat'" class="settings-body">
  <div class="form-group">
    <div class="form-group-header">
      <span class="form-group-title">对话模型</span>
    </div>
    <template v-if="hasAvailableProviders">
      <div class="form-row" style="flex-direction: column; align-items: stretch; gap: 4px;">
        <el-select
          v-model="settings.defaultModelInfo"
          placeholder="选择对话模型"
          style="width: 100%"
          @change="handleChatModelChange"
        >
          <el-option-group v-for="provider in availableProviders" :key="provider.id" :label="provider.name">
            <el-option v-for="model in provider.models" :key="`${provider.id}/${model.id}`" :label="model.name" :value="`${provider.id}/${model.id}`" />
          </el-option-group>
        </el-select>
        <div v-if="currentModelDisplay" class="model-info-line">{{ currentModelDisplay }}</div>
      </div>
    </template>
    <div v-else class="empty-model-tip">
      暂无可用模型服务，请先在模型服务中配置并测试
    </div>
  </div>
</div>
```

- [ ] **Step 5: Add `handleChatModelChange` function**

Add after the `testProvider` function (around line 194):

```typescript
/** Save chat model selection when user changes it */
const handleChatModelChange = (value: string) => {
  settingsStore.saveCurrentModelInfo(value);
};
```

- [ ] **Step 6: Add CSS for the model info line and empty tip**

Add to the `<style scoped>` section (after the existing `.form-input` rule, around line 593):

```css
.model-info-line {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.empty-model-tip {
  text-align: center;
  padding: 24px 16px;
  color: #999;
  font-size: 14px;
}
```

- [ ] **Step 7: Verify no TypeScript/build errors**

Run: `cd frontend && npx vue-tsc --noEmit`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/settings/index.vue
git commit -m "feat: replace scene dialogue settings with chat model selector"
```

---

### Task 4: Manual verification — ensure basic chat AI reply works

**Files:** None — manual testing

- [ ] **Step 1: Start dev server**

Run: `cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo && pnpm dev`

- [ ] **Step 2: Configure a model service**

In the app settings:
1. Go to "模型服务"
2. Enable "火山引擎（豆包）" or any other provider
3. Enter Base URL and API Key
4. Click "测试" and confirm it passes (available turns true)

- [ ] **Step 3: Verify model selector in "对话设置"**

1. Go to "对话设置" (formerly "场景对话")
2. Confirm the model selector dropdown shows the enabled+available providers with their models grouped
3. Confirm selecting a model saves it (check it persists after navigating away and back)
4. Confirm the current selection info line shows provider name + model name

- [ ] **Step 4: Verify chat functionality**

1. Go to the chat page
2. Type a text message and send it
3. Confirm the AI responds using the selected model from settings
4. Confirm no system prompt is sent (regular chat should have no pre-set system prompt behavior)
5. Create a new session and confirm it works without `chatDefaultPrompt`

- [ ] **Step 5: Verify auto-default behavior**

1. Clear localStorage or reset settings so `defaultModelInfo` is empty
2. Re-open the app — confirm the first enabled+available provider's default model is auto-selected
3. Change the model to a different one, save, close and reopen — confirm the user's choice persists

- [ ] **Step 6: Final commit (if any fixes needed)**

If any issues were found and fixed during manual testing, commit the fixes:

```bash
git add -A
git commit -m "fix: address issues found during manual verification"
```