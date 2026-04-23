# Chat Model Selector Design

**Date**: 2026-04-23
**Scope**: Replace the "场景对话" settings section with a chat model selector, remove `chatDefaultPrompt`, and ensure basic AI chat functionality works.

## Problem

The chat page currently uses `settingsState.defaultModelInfo` to select which AI model to use for replies, but there is no dedicated UI to choose this model specifically for chat. The "场景对话" settings section only contains a "默认系统提示语" textarea, which is not useful for the basic chat workflow. Users need a way to select which model service (provider+model) the chat uses, with auto-default to the first enabled+available provider.

## Design

### 1. Settings Store Changes

- **Remove `chatDefaultPrompt`** from `settingsState`. The system prompt textarea is being removed entirely. Regular (non-scenario) chat sessions will have an empty system prompt — the AI receives no system-level instruction unless a scenario is active.
- **Keep `defaultModelInfo`** — this `"providerId/modelId"` string is already used by the chat page and `aiClientManager`. No structural change needed.
- **Add auto-default logic in `loadSettings()`**: After loading `defaultModelInfo` from localStorage, if the value is empty or the saved provider is no longer `enabled && available`, automatically set `defaultModelInfo` to the first enabled+available provider's `"providerId/defaultModel"`. This ensures the chat always has a valid model to use.
- **Remove all references to `chatDefaultPrompt`**: from settings store, localStorage utilities, chat page `ensureActiveSession`/`createSession` calls, and the `watch` in the settings page.

### 2. Settings Page "场景对话" Section → "对话设置"

**Rename**: The menu item label changes from "场景对话" to "对话设置" since it's now about chat model selection.

**Replace content**: The "默认系统提示语" textarea is removed entirely. New content:

- **Header**: "对话模型"
- **UI**: An `el-select` dropdown with `el-option-group` for grouping by provider
  - Only providers where `enabled && available === true` are shown (must have been tested successfully — `available` being undefined or false means the provider is excluded)
  - Each provider is an `el-option-group` with its `name` as the group label
  - Models under each group are the provider's configured models (from `provider.models`)
  - Selected value is stored as `defaultModelInfo` in `"providerId/modelId"` format
- **Below the selector**: Show current selection info — provider name + model name as a small info line
- **Empty state**: If no providers are enabled+available, show "暂无可用模型服务，请先在模型服务中配置并测试" message
- **On change**: Call `settingsStore.saveCurrentModelInfo(value)` to persist to localStorage

### 3. Chat Page Changes

- **Remove `chatDefaultPrompt` usage**:
  - `onMounted/onActivated`: Change from `chatStore.ensureActiveSession(settingsStore.settingsState.chatDefaultPrompt || '')` to `chatStore.ensureActiveSession()`
  - `handleNewSession`: Change from `chatStore.createSession(settingsStore.settingsState.chatDefaultPrompt || '')` to `chatStore.createSession()`
- **No change to AI calling flow**: `requestAIReply` already reads `defaultModelInfo` and passes it to `aiClientManager.chatStream`. The `systemPrompt: session.systemPrompt || undefined` already handles empty prompts correctly — when `systemPrompt` is undefined, it is not sent to the AI.

### 4. Error Handling & Edge Cases

- **No model selected**: Chat page already shows "请先在设置中配置 AI 模型" warning. This stays.
- **Selected model becomes unavailable**: Auto-default logic in `loadSettings()` falls back to first available provider.
- **Streaming errors**: Already handled by `handleAIRequestError` in `aiClientManager`. No change.
- **Scenario sessions**: Unaffected — they have their own `systemPrompt` from scenario definitions, and use whatever model is set in `defaultModelInfo`.

## Files to Modify

| File | Change |
|---|---|
| `frontend/src/stores/settings.ts` | Remove `chatDefaultPrompt` from state, add auto-default logic in `loadSettings()` |
| `frontend/src/pages/settings/index.vue` | Rename menu item, replace "场景对话" section content with model selector, remove `chatDefaultPrompt` from watch |
| `frontend/src/pages/chat/index.vue` | Remove `chatDefaultPrompt` usage in `onMounted`, `onActivated`, `handleNewSession` |
| `frontend/src/stores/chat.ts` | No structural change needed — `createSession` already defaults `defaultPrompt` to `''` |