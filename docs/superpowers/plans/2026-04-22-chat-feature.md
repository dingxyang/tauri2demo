# Chat Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "对话" (Chat) tab with voice/text input, AI conversation, TTS playback, and session management to the 西语助手 app.

**Architecture:** New Vue page + Pinia store for session state, extending existing aiClientManager for multi-turn chat, new Rust ASR command reusing existing audio recording infrastructure, and UI components following the mixed visual style (blue user bubbles + app-consistent framework).

**Tech Stack:** Vue 3 + TypeScript, Pinia, Element Plus, Tauri 2 (Rust), 讯飞 ASR WebSocket API, Vercel AI SDK

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `frontend/src/pages/chat/index.vue` | Chat page root, composes sub-components |
| `frontend/src/pages/chat/ChatHeader.vue` | Header bar: history icon, title, new-chat + settings icons |
| `frontend/src/pages/chat/MessageList.vue` | Scrollable message list, auto-scroll to bottom |
| `frontend/src/pages/chat/MessageItem.vue` | Single message bubble (user/AI), AI has TTS button |
| `frontend/src/pages/chat/InputArea.vue` | Text/voice mode toggle, textarea, send button |
| `frontend/src/pages/chat/VoiceButton.vue` | "按住说话" button, sound wave animation, cancel gesture |
| `frontend/src/pages/chat/HistorySidebar.vue` | Left-sliding panel for session history |
| `frontend/src/pages/chat/PromptSettings.vue` | el-dialog for system prompt editing |
| `frontend/src/stores/chat.ts` | Pinia store: ChatSession, Message, CRUD, localStorage persistence |
| `backend/src-tauri/src/speech_eval/asr.rs` | Xfyun real-time ASR WebSocket client |

### Modified Files

| File | Change |
|------|--------|
| `frontend/src/router/index.ts` | Add `/chat` route |
| `frontend/src/layouts/BottomNav.vue` | Add "对话" nav item |
| `frontend/src/layouts/DefaultLayout.vue` | Adjust padding-bottom for chat input area |
| `frontend/src/services/aiClientManager.ts` | Support multi-turn messages + custom systemPrompt for CHAT |
| `frontend/src/pages/settings/index.vue` | Add "场景对话" menu item + form section |
| `frontend/src/stores/settings.ts` | Add `chatDefaultPrompt` to settingsState |
| `backend/src-tauri/src/speech_eval/mod.rs` | Add `asr` module declaration |
| `backend/src-tauri/src/speech_eval/types.rs` | Add ASR request/response types |
| `backend/src-tauri/src/speech_eval/commands.rs` | Add `stop_recording_and_recognize` command |
| `backend/src-tauri/src/lib.rs` | Register new command in invoke_handler |

---

## Task 1: Chat Pinia Store

**Files:**
- Create: `frontend/src/stores/chat.ts`

- [ ] **Step 1: Create chat store with types and CRUD operations**

```typescript
// frontend/src/stores/chat.ts
import { defineStore } from "pinia";
import { reactive, computed } from "vue";

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isVoice?: boolean; // 语音输入标识
  createdAt: number;
}

export interface ChatSession {
  id: string;
  title: string;
  systemPrompt: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'chatSessions';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load chat sessions:', e);
  }
  return [];
}

function saveSessions(sessions: ChatSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save chat sessions:', e);
  }
}

export const useChatStore = defineStore("chat", () => {
  const sessions = reactive<ChatSession[]>(loadSessions());
  const activeSessionId = ref<string>('');

  const activeSession = computed(() => {
    return sessions.find(s => s.id === activeSessionId.value) || null;
  });

  const sortedSessions = computed(() => {
    return [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
  });

  function createSession(defaultPrompt = '') {
    const session: ChatSession = {
      id: generateId(),
      title: '新对话',
      systemPrompt: defaultPrompt,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    sessions.push(session);
    activeSessionId.value = session.id;
    saveSessions([...sessions]);
    return session;
  }

  function switchSession(id: string) {
    const session = sessions.find(s => s.id === id);
    if (session) {
      activeSessionId.value = id;
    }
  }

  function deleteSession(id: string) {
    const idx = sessions.findIndex(s => s.id === id);
    if (idx !== -1) {
      sessions.splice(idx, 1);
      if (activeSessionId.value === id) {
        activeSessionId.value = sessions.length > 0 ? sessions[sessions.length - 1].id : '';
        if (activeSessionId.value === '' && sessions.length === 0) {
          // Will auto-create in the component
        }
      }
      saveSessions([...sessions]);
    }
  }

  function addMessage(role: 'user' | 'assistant', content: string, isVoice = false) {
    const session = sessions.find(s => s.id === activeSessionId.value);
    if (!session) return;
    const msg: Message = {
      id: generateId(),
      role,
      content,
      isVoice,
      createdAt: Date.now(),
    };
    session.messages.push(msg);
    session.updatedAt = Date.now();
    // 首条用户消息作为标题
    if (role === 'user' && session.messages.filter(m => m.role === 'user').length === 1) {
      session.title = content.substring(0, 20) + (content.length > 20 ? '...' : '');
    }
    saveSessions([...sessions]);
    return msg;
  }

  function updateLastAssistantMessage(content: string) {
    const session = sessions.find(s => s.id === activeSessionId.value);
    if (!session) return;
    const lastMsg = session.messages[session.messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') {
      lastMsg.content = content;
    }
  }

  function updateSystemPrompt(prompt: string) {
    const session = sessions.find(s => s.id === activeSessionId.value);
    if (!session) return;
    session.systemPrompt = prompt;
    saveSessions([...sessions]);
  }

  function ensureActiveSession(defaultPrompt = '') {
    if (!activeSession.value) {
      if (sessions.length > 0) {
        activeSessionId.value = sessions[sessions.length - 1].id;
      } else {
        createSession(defaultPrompt);
      }
    }
  }

  return {
    sessions,
    activeSessionId,
    activeSession,
    sortedSessions,
    createSession,
    switchSession,
    deleteSession,
    addMessage,
    updateLastAssistantMessage,
    updateSystemPrompt,
    ensureActiveSession,
  };
});
```

- [ ] **Step 2: Fix the missing `ref` import**

The code uses `ref` but the import only has `reactive` and `computed`. Update the import line:

```typescript
import { reactive, computed, ref } from "vue";
```

- [ ] **Step 3: Verify the store compiles**

Run: `cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo/frontend && npx vue-tsc --noEmit --pretty 2>&1 | head -30`

Expected: No errors related to `chat.ts` (other type errors in existing code are pre-existing).

- [ ] **Step 4: Commit**

```bash
cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo
git add frontend/src/stores/chat.ts
git commit -m "feat(chat): add chat Pinia store with session management"
```

---

## Task 2: AI Client Manager — Multi-turn Chat Support

**Files:**
- Modify: `frontend/src/services/aiClientManager.ts`

- [ ] **Step 1: Add ChatRequestParams interface and modify callStream/call**

Add a new interface for chat-specific requests that supports passing a full messages array and custom system prompt. Then modify `callStream` and `call` to accept these new parameters.

In `aiClientManager.ts`, after the existing `StreamRequestParams` interface (around line 38), add:

```typescript
// 多轮对话请求参数接口
export interface ChatStreamParams {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  currentModelInfo: string;
  systemPrompt?: string;
  onData: (chunk: string) => void;
  abortController?: AbortController;
}
```

Then add a new `chatStream` method to the `AIClientManager` class, after the existing `callStream` method (around line 315):

```typescript
  /**
   * 多轮对话流式调用
   */
  public async chatStream(params: ChatStreamParams): Promise<void> {
    if (!params.currentModelInfo) {
      throw new ApiError("模型信息未指定", 0, "MODEL_INFO_NOT_SPECIFIED");
    }

    const { messages, systemPrompt, onData, currentModelInfo, abortController } = params;

    try {
      const modelConfig = this.parseModelInfo(currentModelInfo);

      const config: AIClientConfig = {
        providerId: modelConfig.providerId,
        modelId: modelConfig.modelId,
        apiBaseUrl: modelConfig.apiBaseUrl,
        apiKey: modelConfig.apiKey,
      };

      const client = this.getOrCreateClient(config);
      const model = this.validateModelId(modelConfig.modelId);

      // 构建完整消息数组：系统提示语 + 对话历史
      const fullMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
      if (systemPrompt) {
        fullMessages.push({ role: 'system', content: systemPrompt });
      }
      fullMessages.push(...messages);

      const result = await streamText({
        model: client(model),
        messages: fullMessages,
        temperature: OPENAI_TEMPERATURE,
        abortSignal: abortController?.signal,
        onError: (error) => {
          handleAIRequestError(error?.error || error);
        },
        onFinish({ text, finishReason, usage }) {
          console.log("[chat] onFinish", { finishReason, usage });
        },
      });

      for await (const textPart of result.textStream) {
        if (abortController?.signal.aborted) {
          throw new ApiError("请求已被取消", 0, "REQUEST_ABORTED");
        }
        onData(textPart);
      }
    } catch (error) {
      handleAIRequestError(error);
    }
  }
```

- [ ] **Step 2: Verify the service compiles**

Run: `cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo/frontend && npx vue-tsc --noEmit --pretty 2>&1 | head -30`

Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo
git add frontend/src/services/aiClientManager.ts
git commit -m "feat(chat): add chatStream method for multi-turn conversation"
```

---

## Task 3: Rust Backend — ASR Command

**Files:**
- Create: `backend/src-tauri/src/speech_eval/asr.rs`
- Modify: `backend/src-tauri/src/speech_eval/types.rs`
- Modify: `backend/src-tauri/src/speech_eval/commands.rs`
- Modify: `backend/src-tauri/src/speech_eval/mod.rs`
- Modify: `backend/src-tauri/src/lib.rs`

- [ ] **Step 1: Add ASR types to types.rs**

Append to `backend/src-tauri/src/speech_eval/types.rs`:

```rust
// === 实时语音转写（ASR）请求/响应结构 ===

#[derive(Serialize)]
pub struct AsrRequest {
    pub header: AsrRequestHeader,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parameter: Option<AsrParameter>,
    pub payload: AsrPayload,
}

#[derive(Serialize)]
pub struct AsrRequestHeader {
    pub app_id: String,
    pub status: i32,
}

#[derive(Serialize)]
pub struct AsrParameter {
    pub nls: AsrNlsParam,
}

#[derive(Serialize)]
pub struct AsrNlsParam {
    #[serde(rename = "eng")]
    pub eng: String,
    #[serde(rename = "aue", skip_serializing_if = "Option::is_none")]
    pub aue: Option<String>,
    #[serde(rename = "ent", skip_serializing_if = "Option::is_none")]
    pub ent: Option<String>,
}

#[derive(Serialize)]
pub struct AsrPayload {
    pub data: AsrAudioData,
}

#[derive(Serialize)]
pub struct AsrAudioData {
    pub encoding: String,
    pub sample_rate: i32,
    pub channels: i32,
    pub bit_depth: i32,
    pub status: i32,
    pub seq: i32,
    pub audio: String,
    pub frame_size: i32,
}

#[derive(Deserialize, Debug)]
pub struct AsrResponse {
    pub header: AsrResponseHeader,
    pub payload: Option<AsrResponsePayload>,
}

#[allow(dead_code)]
#[derive(Deserialize, Debug)]
pub struct AsrResponseHeader {
    pub code: i32,
    pub message: String,
    pub sid: Option<String>,
    pub status: Option<i32>,
}

#[derive(Deserialize, Debug)]
pub struct AsrResponsePayload {
    pub result: Option<AsrResponseResult>,
}

#[allow(dead_code)]
#[derive(Deserialize, Debug)]
pub struct AsrResponseResult {
    pub bg: Option<String>,
    pub ed: Option<String>,
    pub ls: Option<bool>,
    pub pg: Option<String>,
    pub rg: Option<Vec<i32>>,
    pub sn: Option<String>,
    pub wa: Option<serde_json::Value>,
    // cn.st.rt 识别结果
}

/// ASR 识别结果
#[derive(Serialize, Clone, Debug)]
pub struct AsrResult {
    pub text: String,
}
```

- [ ] **Step 2: Create asr.rs**

Create `backend/src-tauri/src/speech_eval/asr.rs`:

```rust
use base64::Engine;
use base64::engine::general_purpose::STANDARD as BASE64;
use futures_util::{SinkExt, StreamExt};
use tokio_tungstenite::connect_async;
use tokio_tungstenite::tungstenite::Message;

use super::auth::build_auth_url;
use super::types::{AsrRequest, AsrRequestHeader, AsrParameter, AsrNlsParam, AsrPayload, AsrAudioData, XfConfig, AsrResult};

const ASR_HOST: &str = "rtasr.xfyun.cn";
const ASR_PATH: &str = "/v1/rtasr";
const FRAME_SIZE: usize = 1280;

/// 调用讯飞实时语音转写 API，返回识别文本
pub async fn recognize(
    config: &XfConfig,
    mp3_data: &[u8],
) -> Result<AsrResult, String> {
    // 1. 生成鉴权 URL 并连接
    let url = build_auth_url(ASR_HOST, ASR_PATH, &config.api_key, &config.api_secret);
    let url_preview = if url.len() > 100 {
        format!("{}...{}", &url[..60], &url[url.len()-20..])
    } else {
        url.clone()
    };
    println!("[asr] connecting to WebSocket: {}", url_preview);
    let (ws_stream, _) = connect_async(&url)
        .await
        .map_err(|e| format!("ASR WebSocket connect failed: {}", e))?;
    println!("[asr] WebSocket connected");
    let (mut write, mut read) = ws_stream.split();

    // 2. 分帧发送音频
    let frames: Vec<&[u8]> = mp3_data.chunks(FRAME_SIZE).collect();
    let total_frames = frames.len();
    println!("[asr] sending {} frames", total_frames);

    for (i, frame) in frames.iter().enumerate() {
        let is_first = i == 0;
        let is_last = i == total_frames - 1;
        let header_status = if is_first { 0 } else if is_last { 2 } else { 1 };

        let request = AsrRequest {
            header: AsrRequestHeader {
                app_id: config.app_id.clone(),
                status: header_status,
            },
            parameter: if is_first {
                Some(AsrParameter {
                    nls: AsrNlsParam {
                        eng: "cn".to_string(),
                        aue: Some("lame".to_string()),
                        ent: Some("fr".to_string()),
                    },
                })
            } else {
                None
            },
            payload: AsrPayload {
                data: AsrAudioData {
                    encoding: "lame".to_string(),
                    sample_rate: 16000,
                    channels: 1,
                    bit_depth: 16,
                    status: header_status,
                    seq: i as i32,
                    audio: BASE64.encode(frame),
                    frame_size: 0,
                },
            },
        };

        let msg = serde_json::to_string(&request)
            .map_err(|e| format!("ASR serialize error: {}", e))?;
        write
            .send(Message::Text(msg.into()))
            .await
            .map_err(|e| format!("ASR send error: {}", e))?;

        if !is_last {
            tokio::time::sleep(std::time::Duration::from_millis(40)).await;
        }
    }
    println!("[asr] all frames sent, waiting for response...");

    // 3. 接收响应，提取最终识别文本
    let mut final_text = String::new();

    while let Some(msg) = read.next().await {
        let msg = msg.map_err(|e| format!("ASR receive error: {}", e))?;
        match msg {
            Message::Text(text) => {
                println!("[asr] received: {}...", &text[..text.len().min(200)]);

                // 讯飞 ASR 响应格式：直接是 JSON
                if let Ok(response) = serde_json::from_str::<serde_json::Value>(&text) {
                    // 检查错误码
                    if let Some(code) = response.get("header").and_then(|h| h.get("code")).and_then(|c| c.as_i64()) {
                        if code != 0 {
                            let message = response.get("header").and_then(|h| h.get("message")).and_then(|m| m.as_str()).unwrap_or("unknown error");
                            return Err(format!("ASR API error {}: {}", code, message));
                        }
                    }

                    // 提取识别结果文本
                    if let Some(result_text) = response
                        .get("payload")
                        .and_then(|p| p.get("result"))
                        .and_then(|r| r.get("text"))
                        .and_then(|t| t.as_str())
                    {
                        final_text = result_text.to_string();
                    }

                    // 检查是否完成
                    if let Some(status) = response.get("header").and_then(|h| h.get("status")).and_then(|s| s.as_i64()) {
                        if status == 2 {
                            break;
                        }
                    }
                }
            }
            Message::Close(_) => break,
            _ => {}
        }
    }

    if final_text.is_empty() {
        return Err("ASR 未识别到有效文本".to_string());
    }

    println!("[asr] recognition complete, text: {}", final_text);
    Ok(AsrResult { text: final_text })
}
```

- [ ] **Step 3: Add ASR command to commands.rs**

Append to `backend/src-tauri/src/speech_eval/commands.rs`:

Add import at the top (after existing imports):

```rust
use super::asr;
use super::types::AsrResult;
```

Add new command function at the end:

```rust
#[tauri::command]
pub async fn stop_recording_and_recognize(
    state: State<'_, RecordingState>,
    app_id: String,
    api_key: String,
    api_secret: String,
) -> Result<AsrResult, String> {
    // 1. 停止录音，获取 PCM 数据
    println!("[asr] stopping recording...");
    let pcm_data = audio::stop_recording(&state)?;
    println!("[asr] recorded {} PCM samples", pcm_data.len());

    // 2. 构建讯飞配置
    let config = XfConfig { app_id, api_key, api_secret };

    // 3. PCM → MP3 编码
    println!("[asr] encoding {} PCM samples to MP3...", pcm_data.len());
    let mp3_data = audio::encode_pcm_to_mp3(&pcm_data)?;
    println!("[asr] MP3 encoded, {} bytes", mp3_data.len());

    // 4. 发送到讯飞 ASR API
    println!("[asr] starting recognition...");
    let result = asr::recognize(&config, &mp3_data).await?;
    println!("[asr] recognition complete, text={}", result.text);

    Ok(result)
}
```

- [ ] **Step 4: Register ASR module in mod.rs**

In `backend/src-tauri/src/speech_eval/mod.rs`, add `asr` to the module declarations:

```rust
pub mod asr;
```

- [ ] **Step 5: Register ASR command in lib.rs**

In `backend/src-tauri/src/lib.rs`, add the new command to the `generate_handler!` macro:

```rust
.invoke_handler(tauri::generate_handler![
    greet,
    commands::start_recording,
    commands::stop_recording_and_evaluate,
    commands::evaluate_mp3_file,
    commands::tts_synthesize,
    commands::stop_recording_and_recognize
])
```

- [ ] **Step 6: Verify Rust code compiles**

Run: `cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo/backend/src-tauri && cargo check 2>&1 | tail -5`

Expected: `Finished dev [unoptimized + debuginfo] target(s)` without errors.

- [ ] **Step 7: Commit**

```bash
cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo
git add backend/src-tauri/src/speech_eval/asr.rs backend/src-tauri/src/speech_eval/types.rs backend/src-tauri/src/speech_eval/commands.rs backend/src-tauri/src/speech_eval/mod.rs backend/src-tauri/src/lib.rs
git commit -m "feat(chat): add ASR command for voice-to-text recognition"
```

---

## Task 4: Route & Bottom Nav — Add Chat Tab

**Files:**
- Modify: `frontend/src/router/index.ts`
- Modify: `frontend/src/layouts/BottomNav.vue`
- Create: `frontend/src/pages/chat/index.vue` (minimal placeholder)

- [ ] **Step 1: Add chat route**

In `frontend/src/router/index.ts`, add a new child route inside the `DefaultLayout` children array, after the `/speech-eval` entry:

```typescript
{
  path: '/chat',
  name: 'Chat',
  component: () => import('@/pages/chat/index.vue'),
  meta: { keepAlive: true }
}
```

- [ ] **Step 2: Add chat nav item to BottomNav**

In `frontend/src/layouts/BottomNav.vue`, add a new `<router-link>` block between the SpeechEval and Settings items:

```html
<router-link
  to="/chat"
  class="nav-item"
  :class="{ active: $route.name === 'Chat' }"
>
  <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
  <span class="nav-text">对话</span>
</router-link>
```

- [ ] **Step 3: Create minimal chat page placeholder**

Create `frontend/src/pages/chat/index.vue`:

```vue
<template>
  <div class="chat-page">
    <div class="page-title">对话</div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'Chat' });
</script>

<style scoped>
.chat-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}
</style>
```

- [ ] **Step 4: Verify dev server shows the new tab**

Run: `cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo && pnpm dev`

Expected: Bottom nav shows 5 tabs including "对话", clicking it shows the placeholder page.

- [ ] **Step 5: Commit**

```bash
cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo
git add frontend/src/router/index.ts frontend/src/layouts/BottomNav.vue frontend/src/pages/chat/index.vue
git commit -m "feat(chat): add chat route, bottom nav item, and page placeholder"
```

---

## Task 5: ChatHeader Component

**Files:**
- Create: `frontend/src/pages/chat/ChatHeader.vue`

- [ ] **Step 1: Create ChatHeader component**

```vue
<template>
  <div class="chat-header">
    <button class="header-btn" @click="$emit('toggle-history')" title="历史会话">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    </button>
    <span class="header-title">{{ title }}</span>
    <div class="header-right">
      <button class="header-btn" @click="$emit('new-session')" title="新建对话">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
      <button class="header-btn" @click="$emit('open-settings')" title="提示语设置">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
}>();

defineEmits<{
  'toggle-history': [];
  'new-session': [];
  'open-settings': [];
}>();
</script>

<style scoped>
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.header-title {
  font-size: 17px;
  font-weight: 600;
  color: #1a1a1a;
  flex: 1;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  cursor: pointer;
  color: #555;
  border-radius: 8px;
  transition: background 0.12s;
}

.header-btn:active {
  background: #f5f5f5;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo
git add frontend/src/pages/chat/ChatHeader.vue
git commit -m "feat(chat): add ChatHeader component"
```

---

## Task 6: MessageItem Component

**Files:**
- Create: `frontend/src/pages/chat/MessageItem.vue`

- [ ] **Step 1: Create MessageItem component**

```vue
<template>
  <div :class="['message-item', message.role === 'user' ? 'message-user' : 'message-assistant']">
    <div :class="['message-bubble', message.role === 'user' ? 'bubble-user' : 'bubble-assistant']">
      <span v-if="message.isVoice" class="voice-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        </svg>
      </span>
      <span class="message-text">{{ message.content }}</span>
    </div>
    <button
      v-if="message.role === 'assistant'"
      :class="['tts-btn', { 'tts-playing': isPlaying }]"
      @click="$emit('play-tts', message)"
      :title="isPlaying ? '停止朗读' : '朗读'"
    >
      <svg v-if="!isPlaying" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      </svg>
      <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <rect x="17" y="9" width="4" height="6"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Message } from '@/stores/chat';

defineProps<{
  message: Message;
  isPlaying: boolean;
}>();

defineEmits<{
  'play-tts': [message: Message];
}>();
</script>

<style scoped>
.message-item {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  margin-bottom: 12px;
}

.message-user {
  justify-content: flex-end;
}

.message-assistant {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 75%;
  padding: 10px 14px;
  font-size: 15px;
  line-height: 1.5;
  word-break: break-word;
}

.bubble-user {
  background: #2B5CE6;
  color: #fff;
  border-radius: 12px 12px 4px 12px;
}

.bubble-assistant {
  background: #fff;
  color: #1a1a1a;
  border-radius: 12px 12px 12px 4px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.voice-icon {
  display: inline-flex;
  align-items: center;
  margin-right: 4px;
  opacity: 0.7;
}

.tts-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  cursor: pointer;
  color: #999;
  border-radius: 50%;
  flex-shrink: 0;
  transition: color 0.2s;
}

.tts-btn:active {
  color: #2B5CE6;
}

.tts-playing {
  color: #2B5CE6;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.message-text {
  white-space: pre-wrap;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo
git add frontend/src/pages/chat/MessageItem.vue
git commit -m "feat(chat): add MessageItem component with bubble styles and TTS button"
```

---

## Task 7: MessageList Component

**Files:**
- Create: `frontend/src/pages/chat/MessageList.vue`

- [ ] **Step 1: Create MessageList component**

```vue
<template>
  <div class="message-list" ref="listRef">
    <!-- 空会话引导 -->
    <div v-if="messages.length === 0" class="empty-guide">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c0c4cc" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <p class="guide-text">开始一段西班牙语对话吧</p>
    </div>
    <!-- 消息列表 -->
    <template v-else>
      <MessageItem
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
        :is-playing="playingMessageId === msg.id"
        @play-tts="handlePlayTts"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import MessageItem from './MessageItem.vue';
import type { Message } from '@/stores/chat';

const props = defineProps<{
  messages: Message[];
  playingMessageId: string | null;
}>();

const emit = defineEmits<{
  'play-tts': [message: Message];
}>();

const listRef = ref<HTMLElement | null>(null);

function scrollToBottom() {
  nextTick(() => {
    if (listRef.value) {
      listRef.value.scrollTop = listRef.value.scrollHeight;
    }
  });
}

function handlePlayTts(msg: Message) {
  emit('play-tts', msg);
}

// 消息变化时自动滚动到底部
watch(
  () => props.messages.length,
  () => scrollToBottom()
);

// 内容变化时也滚动（流式输出）
watch(
  () => {
    const last = props.messages[props.messages.length - 1];
    return last?.content?.length || 0;
  },
  () => scrollToBottom()
);

defineExpose({ scrollToBottom });
</script>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 16px 8px;
}

.message-list::-webkit-scrollbar {
  width: 4px;
}

.message-list::-webkit-scrollbar-track {
  background: transparent;
}

.message-list::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}

.empty-guide {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
}

.guide-text {
  font-size: 15px;
  color: #999;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo
git add frontend/src/pages/chat/MessageList.vue
git commit -m "feat(chat): add MessageList component with auto-scroll and empty state"
```

---

## Task 8: InputArea & VoiceButton Components

**Files:**
- Create: `frontend/src/pages/chat/InputArea.vue`
- Create: `frontend/src/pages/chat/VoiceButton.vue`

- [ ] **Step 1: Create VoiceButton component**

```vue
<template>
  <div class="voice-area">
    <div class="voice-container">
      <button
        class="voice-btn"
        :class="{ 'voice-active': isPressed }"
        @touchstart.prevent="onTouchStart"
        @touchmove.prevent="onTouchMove"
        @touchend.prevent="onTouchEnd"
        @mousedown.prevent="onMouseDown"
        @mouseup.prevent="onMouseUp"
        @mouseleave.prevent="onMouseLeave"
      >
        <div v-if="isPressed" class="sound-wave">
          <span v-for="i in 5" :key="i" class="wave-bar" :style="{ animationDelay: `${i * 0.1}s` }"></span>
        </div>
        <span v-else>按住说话</span>
      </button>
      <div v-if="isPressed" class="voice-hint">松开发送 上移取消</div>
    </div>
    <button class="mode-toggle" @click="$emit('switch-to-text')" title="切换到文本输入">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <line x1="6" y1="10" x2="18" y2="10"/>
        <line x1="6" y1="14" x2="14" y2="14"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  'switch-to-text': [];
  'start-recording': [];
  'send-recording': [];
  'cancel-recording': [];
}>();

const isPressed = ref(false);
const startY = ref(0);

function onTouchStart(e: TouchEvent) {
  startY.value = e.touches[0].clientY;
  isPressed.value = true;
  emit('start-recording');
}

function onTouchMove(e: TouchEvent) {
  if (!isPressed.value) return;
  const currentY = e.touches[0].clientY;
  const deltaX = Math.abs(e.touches[0].clientX - (e.target as HTMLElement).getBoundingClientRect().left);
  if (startY.value - currentY > 80 || deltaX > 100) {
    // 进入取消区域
  }
}

function onTouchEnd(e: TouchEvent) {
  if (!isPressed.value) return;
  const currentY = e.changedTouches[0].clientY;
  const currentX = e.changedTouches[0].clientX;
  const btnRect = (e.target as HTMLElement).closest('.voice-btn')?.getBoundingClientRect();
  const centerX = btnRect ? btnRect.left + btnRect.width / 2 : 0;

  isPressed.value = false;

  if (startY.value - currentY > 80 || Math.abs(currentX - centerX) > 100) {
    emit('cancel-recording');
  } else {
    emit('send-recording');
  }
}

function onMouseDown() {
  isPressed.value = true;
  startY.value = 0;
  emit('start-recording');
}

function onMouseUp() {
  if (!isPressed.value) return;
  isPressed.value = false;
  emit('send-recording');
}

function onMouseLeave() {
  if (!isPressed.value) return;
  isPressed.value = false;
  emit('cancel-recording');
}
</script>

<style scoped>
.voice-area {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.voice-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.voice-btn {
  width: 100%;
  height: 44px;
  border: none;
  background: #f5f5f5;
  border-radius: 22px;
  font-size: 15px;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  user-select: none;
  -webkit-user-select: none;
}

.voice-active {
  background: #e8e8e8;
  transform: scale(1.02);
}

.sound-wave {
  display: flex;
  align-items: center;
  gap: 3px;
  height: 24px;
}

.wave-bar {
  width: 3px;
  height: 8px;
  background: #2B5CE6;
  border-radius: 2px;
  animation: wave 0.6s ease-in-out infinite;
}

@keyframes wave {
  0%, 100% { height: 8px; }
  50% { height: 20px; }
}

.voice-hint {
  font-size: 12px;
  color: #999;
}

.mode-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  cursor: pointer;
  color: #666;
  border-radius: 8px;
  flex-shrink: 0;
}

.mode-toggle:active {
  background: #f5f5f5;
}
</style>
```

- [ ] **Step 2: Create InputArea component**

```vue
<template>
  <div class="input-area">
    <template v-if="mode === 'text'">
      <div class="input-wrapper">
        <textarea
          ref="textareaRef"
          v-model="inputText"
          class="chat-input"
          placeholder="发消息"
          rows="1"
          @input="autoResize"
          @keydown="handleKeydown"
        ></textarea>
        <button
          v-if="inputText.trim()"
          class="input-action-btn send-btn"
          @click="sendText"
          title="发送"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
        <button
          v-else
          class="input-action-btn voice-toggle-btn"
          @click="mode = 'voice'"
          title="语音输入"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        </button>
      </div>
    </template>
    <template v-else>
      <VoiceButton
        @switch-to-text="mode = 'text'"
        @start-recording="$emit('start-recording')"
        @send-recording="$emit('send-recording')"
        @cancel-recording="$emit('cancel-recording')"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import VoiceButton from './VoiceButton.vue';

const emit = defineEmits<{
  'send-text': [text: string];
  'start-recording': [];
  'send-recording': [];
  'cancel-recording': [];
}>();

const mode = ref<'text' | 'voice'>('text');
const inputText = ref('');
const textareaRef = ref<HTMLTextAreaElement | null>(null);

function autoResize() {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = 'auto';
  const lineHeight = 20;
  const maxHeight = lineHeight * 3 + 10; // 3 lines
  el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendText();
  }
}

function sendText() {
  const text = inputText.value.trim();
  if (!text) return;
  emit('send-text', text);
  inputText.value = '';
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto';
    }
  });
}

function switchToVoice() {
  mode.value = 'voice';
}

function switchToText() {
  mode.value = 'text';
}

defineExpose({ mode, switchToVoice, switchToText });
</script>

<style scoped>
.input-area {
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #ebeef5;
  flex-shrink: 0;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  background: #f5f5f5;
  border-radius: 24px;
  padding: 4px 4px 4px 16px;
  border: 1px solid #dcdfe6;
}

.chat-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  line-height: 20px;
  resize: none;
  padding: 8px 0;
  max-height: 70px;
  font-family: inherit;
  color: #1a1a1a;
}

.chat-input::placeholder {
  color: #999;
}

.input-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s;
}

.send-btn {
  background: #2B5CE6;
  color: #fff;
}

.send-btn:active {
  background: #1e47c7;
}

.voice-toggle-btn {
  background: transparent;
  color: #666;
}

.voice-toggle-btn:active {
  background: #e8e8e8;
}
</style>
```

- [ ] **Step 3: Commit**

```bash
cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo
git add frontend/src/pages/chat/InputArea.vue frontend/src/pages/chat/VoiceButton.vue
git commit -m "feat(chat): add InputArea and VoiceButton components"
```

---

## Task 9: HistorySidebar Component

**Files:**
- Create: `frontend/src/pages/chat/HistorySidebar.vue`

- [ ] **Step 1: Create HistorySidebar component**

```vue
<template>
  <div class="sidebar-overlay" v-if="visible" @click.self="$emit('close')">
    <transition name="slide">
      <div v-if="visible" class="sidebar-panel">
        <div class="sidebar-header">
          <span class="sidebar-title">历史会话</span>
          <button class="close-btn" @click="$emit('close')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="session-list">
          <div
            v-for="session in sessions"
            :key="session.id"
            :class="['session-item', { active: session.id === activeSessionId }]"
            @click="$emit('select-session', session.id)"
          >
            <div class="session-info">
              <div class="session-title">{{ session.title }}</div>
              <div class="session-date">{{ formatDate(session.updatedAt) }}</div>
            </div>
            <button class="delete-btn" @click.stop="$emit('delete-session', session.id)" title="删除">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
          <div v-if="sessions.length === 0" class="empty-list">暂无历史会话</div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import type { ChatSession } from '@/stores/chat';

defineProps<{
  visible: boolean;
  sessions: ChatSession[];
  activeSessionId: string;
}>();

defineEmits<{
  'close': [];
  'select-session': [id: string];
  'delete-session': [id: string];
}>();

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}
</script>

<style scoped>
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 100;
}

.sidebar-panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 70%;
  max-width: 320px;
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.sidebar-title {
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

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.session-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.12s;
  border-bottom: 1px solid #f5f5f5;
}

.session-item:active {
  background: #f9f9f9;
}

.session-item.active {
  background: #f0f4ff;
}

.session-info {
  flex: 1;
  min-width: 0;
}

.session-title {
  font-size: 15px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-date {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  cursor: pointer;
  color: #c0c4cc;
  border-radius: 4px;
  flex-shrink: 0;
}

.delete-btn:active {
  color: #f56c6c;
  background: #fef0f0;
}

.empty-list {
  padding: 32px 16px;
  text-align: center;
  color: #999;
  font-size: 14px;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo
git add frontend/src/pages/chat/HistorySidebar.vue
git commit -m "feat(chat): add HistorySidebar component"
```

---

## Task 10: PromptSettings Component

**Files:**
- Create: `frontend/src/pages/chat/PromptSettings.vue`

- [ ] **Step 1: Create PromptSettings component**

```vue
<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('close')"
    title="系统提示语设置"
    width="90%"
    :close-on-click-modal="true"
  >
    <el-input
      v-model="localPrompt"
      type="textarea"
      :rows="6"
      placeholder="输入系统提示语，定义AI的角色和行为"
    />
    <template #footer>
      <el-button @click="$emit('close')">取消</el-button>
      <el-button type="primary" @click="save" style="background: #2B5CE6; border-color: #2B5CE6;">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  visible: boolean;
  systemPrompt: string;
}>();

const emit = defineEmits<{
  'close': [];
  'save': [prompt: string];
}>();

const localPrompt = ref('');

watch(() => props.visible, (val) => {
  if (val) {
    localPrompt.value = props.systemPrompt;
  }
});

function save() {
  emit('save', localPrompt.value);
  emit('close');
}
</script>
```

- [ ] **Step 2: Commit**

```bash
cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo
git add frontend/src/pages/chat/PromptSettings.vue
git commit -m "feat(chat): add PromptSettings dialog component"
```

---

## Task 11: Chat Page Integration

**Files:**
- Modify: `frontend/src/pages/chat/index.vue`
- Modify: `frontend/src/layouts/DefaultLayout.vue`

- [ ] **Step 1: Replace chat page placeholder with full integration**

Replace the content of `frontend/src/pages/chat/index.vue` with the full chat page that wires all components together:

```vue
<template>
  <div class="chat-page">
    <ChatHeader
      :title="activeSession?.title || '对话'"
      @toggle-history="showHistory = true"
      @new-session="handleNewSession"
      @open-settings="showPromptSettings = true"
    />

    <MessageList
      ref="messageListRef"
      :messages="activeSession?.messages || []"
      :playing-message-id="playingMessageId"
      @play-tts="handlePlayTts"
    />

    <InputArea
      ref="inputAreaRef"
      @send-text="handleSendText"
      @start-recording="handleStartRecording"
      @send-recording="handleSendRecording"
      @cancel-recording="handleCancelRecording"
    />

    <HistorySidebar
      :visible="showHistory"
      :sessions="sortedSessions"
      :active-session-id="activeSessionId"
      @close="showHistory = false"
      @select-session="handleSelectSession"
      @delete-session="handleDeleteSession"
    />

    <PromptSettings
      :visible="showPromptSettings"
      :system-prompt="activeSession?.systemPrompt || ''"
      @close="showPromptSettings = false"
      @save="handleSavePrompt"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { ElMessage } from 'element-plus';
import { useChatStore } from '@/stores/chat';
import { useSettingsStore } from '@/stores/settings';
import { aiClientManager, ChatStreamParams } from '@/services/aiClientManager';
import ChatHeader from './ChatHeader.vue';
import MessageList from './MessageList.vue';
import InputArea from './InputArea.vue';
import HistorySidebar from './HistorySidebar.vue';
import PromptSettings from './PromptSettings.vue';
import type { Message } from '@/stores/chat';

defineOptions({ name: 'Chat' });

const chatStore = useChatStore();
const settingsStore = useSettingsStore();

const { activeSession, sortedSessions, activeSessionId } = chatStore;

const messageListRef = ref<InstanceType<typeof MessageList> | null>(null);
const inputAreaRef = ref<InstanceType<typeof InputArea> | null>(null);
const showHistory = ref(false);
const showPromptSettings = ref(false);
const isLoading = ref(false);
const currentAbortController = ref<AbortController | null>(null);
const playingMessageId = ref<string | null>(null);
const currentAudio = ref<HTMLAudioElement | null>(null);

onMounted(() => {
  chatStore.ensureActiveSession(settingsStore.settingsState.chatDefaultPrompt || '');
});

onActivated(() => {
  chatStore.ensureActiveSession(settingsStore.settingsState.chatDefaultPrompt || '');
});

// === 发送文本消息 ===
async function handleSendText(text: string) {
  if (isLoading.value) return;
  chatStore.addMessage('user', text);
  await requestAIReply();
}

// === 语音录音 ===
async function handleStartRecording() {
  try {
    await invoke('start_recording');
  } catch (e) {
    ElMessage.error('录音启动失败');
    console.error(e);
  }
}

async function handleSendRecording() {
  if (isLoading.value) return;
  try {
    const { appId, apiKey, apiSecret } = settingsStore.settingsState.xfSpeechEval;
    const result = await invoke<{ text: string }>('stop_recording_and_recognize', {
      appId, apiKey, apiSecret,
    });
    if (result.text) {
      chatStore.addMessage('user', result.text, true);
      await requestAIReply();
    } else {
      ElMessage.warning('未识别到语音内容');
    }
  } catch (e) {
    ElMessage.error('语音识别失败');
    console.error(e);
  }
}

function handleCancelRecording() {
  try {
    invoke('stop_recording_and_recognize', {
      appId: settingsStore.settingsState.xfSpeechEval.appId,
      apiKey: settingsStore.settingsState.xfSpeechEval.apiKey,
      apiSecret: settingsStore.settingsState.xfSpeechEval.apiSecret,
    }).catch(() => {});
  } catch (e) {
    // 忽略取消时的错误
  }
}

// === AI 回复 ===
async function requestAIReply() {
  const session = chatStore.activeSession;
  if (!session) return;

  const modelInfo = settingsStore.settingsState.defaultModelInfo;
  if (!modelInfo) {
    ElMessage.warning('请先在设置中配置 AI 模型');
    return;
  }

  isLoading.value = true;
  currentAbortController.value = new AbortController();

  // 先添加空的 assistant 消息
  chatStore.addMessage('assistant', '');

  try {
    // 构建对话历史（排除最后一条空的 assistant 消息）
    const historyMessages = session.messages
      .filter((_, idx) => idx < session.messages.length - 1)
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    let fullText = '';

    await aiClientManager.chatStream({
      messages: historyMessages,
      currentModelInfo: modelInfo,
      systemPrompt: session.systemPrompt || undefined,
      onData: (chunk: string) => {
        fullText += chunk;
        chatStore.updateLastAssistantMessage(fullText);
      },
      abortController: currentAbortController.value,
    });
  } catch (e) {
    console.error('AI 请求失败:', e);
    if (fullText === '') {
      chatStore.updateLastAssistantMessage('抱歉，请求失败，请重试');
    }
  } finally {
    isLoading.value = false;
    currentAbortController.value = null;
  }

  // 保存最终状态到 localStorage
  chatStore.saveSessions();
}

// === TTS 朗读 ===
async function handlePlayTts(msg: Message) {
  // 如果正在播放同一条消息，停止
  if (playingMessageId.value === msg.id) {
    stopTts();
    return;
  }

  // 停止当前播放
  stopTts();

  try {
    playingMessageId.value = msg.id;
    const { appId, apiKey, apiSecret } = settingsStore.settingsState.xfSpeechEval;
    const b64 = await invoke<string>('tts_synthesize', {
      text: msg.content,
      speed: 50,
      vcn: 'x4_yezi',
      appId, apiKey, apiSecret,
    });

    const binaryStr = atob(b64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);

    const audio = new Audio(url);
    currentAudio.value = audio;
    audio.onended = () => {
      playingMessageId.value = null;
      currentAudio.value = null;
      URL.revokeObjectURL(url);
    };
    audio.onerror = () => {
      playingMessageId.value = null;
      currentAudio.value = null;
      URL.revokeObjectURL(url);
      ElMessage.error('播放失败');
    };
    audio.play();
  } catch (e) {
    playingMessageId.value = null;
    ElMessage.error('语音合成失败');
    console.error(e);
  }
}

function stopTts() {
  if (currentAudio.value) {
    currentAudio.value.pause();
    currentAudio.value = null;
  }
  playingMessageId.value = null;
}

// === 会话管理 ===
function handleNewSession() {
  chatStore.createSession(settingsStore.settingsState.chatDefaultPrompt || '');
  showHistory.value = false;
}

function handleSelectSession(id: string) {
  chatStore.switchSession(id);
  showHistory.value = false;
}

function handleDeleteSession(id: string) {
  chatStore.deleteSession(id);
  chatStore.ensureActiveSession(settingsStore.settingsState.chatDefaultPrompt || '');
}

function handleSavePrompt(prompt: string) {
  chatStore.updateSystemPrompt(prompt);
}
</script>

<style scoped>
.chat-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: hidden;
}
</style>
```

- [ ] **Step 2: Fix chat store — add saveSessions export**

The chat page calls `chatStore.saveSessions()` but the store doesn't expose it. Update `frontend/src/stores/chat.ts` to make `saveSessions` available as a returned function from the store:

In the return block of `useChatStore`, add:

```typescript
saveSessions: () => saveSessions([...sessions]),
```

- [ ] **Step 3: Adjust DefaultLayout padding for chat input area**

The chat page has a fixed input area at the bottom, but it's inside the `main-content` div which already has `padding-bottom` for the bottom nav. The chat input area sits above the bottom nav, so no additional padding is needed — the chat page handles its own layout internally. No changes to DefaultLayout are needed.

- [ ] **Step 4: Verify the chat page renders**

Run: `cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo && pnpm dev`

Expected: Chat tab shows header, empty state guide, and input area. Can type and send (will fail without model config but UI should render).

- [ ] **Step 5: Commit**

```bash
cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo
git add frontend/src/pages/chat/index.vue frontend/src/stores/chat.ts
git commit -m "feat(chat): integrate all chat components into main page"
```

---

## Task 12: Settings Page — Add Chat Settings Section

**Files:**
- Modify: `frontend/src/pages/settings/index.vue`
- Modify: `frontend/src/stores/settings.ts`

- [ ] **Step 1: Add chatDefaultPrompt to settings store**

In `frontend/src/stores/settings.ts`, add `chatDefaultPrompt` to the `settingsState` reactive object (after the `xfSpeechEval` field):

```typescript
chatDefaultPrompt: '',
```

And in `loadSettings`, after the `xfSpeechEval` loading block (around line 103), add:

```typescript
if (settings.chatDefaultPrompt !== undefined) {
  settingsState.chatDefaultPrompt = settings.chatDefaultPrompt;
}
```

And in `saveSettings`, after the `xfSpeechEval` block, the `setSettings(settingsState)` call already serializes the full reactive object, so `chatDefaultPrompt` will be included automatically.

- [ ] **Step 2: Add chat settings menu item and form section**

In `frontend/src/pages/settings/index.vue`:

1. Update the `Section` type (around line 34):

```typescript
type Section = null | 'speech-eval' | 'model-services' | 'chat'
```

2. Add to `sectionTitle`:

```typescript
'chat': '场景对话',
```

3. Add a new menu-item button in the menu-group (after the model-services button, before `</div>` closing the menu-group):

```html
<button class="menu-item" @click="currentSection = 'chat'">
  <span class="menu-icon chat-icon">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  </span>
  <span class="menu-label">场景对话</span>
  <svg class="menu-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none">
    <path d="M1 1L6 6L1 11" stroke="#C0C4CC" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</button>
```

4. Add the chat settings form section (after the model-services section, before the closing `</div>` of `settings-page`):

```html
<!-- 二级页面：场景对话 -->
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
```

5. Add the chat-icon style (in the `<style scoped>` section, after `.model-icon`):

```css
.chat-icon { background: #e8f4fd; color: #2B5CE6; }
```

- [ ] **Step 3: Verify settings page shows new chat section**

Run: `pnpm dev` → Navigate to Settings → See "场景对话" menu item → Click it → See textarea.

- [ ] **Step 4: Commit**

```bash
cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo
git add frontend/src/pages/settings/index.vue frontend/src/stores/settings.ts
git commit -m "feat(chat): add chat settings section to settings page"
```

---

## Task 13: Final Integration Verification

**Files:**
- All previous files

- [ ] **Step 1: Full type check**

Run: `cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo/frontend && npx vue-tsc --noEmit --pretty 2>&1 | head -50`

Fix any type errors found.

- [ ] **Step 2: Rust compilation check**

Run: `cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo/backend/src-tauri && cargo check 2>&1 | tail -10`

Fix any compilation errors found.

- [ ] **Step 3: Full Tauri dev mode test**

Run: `cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo && pnpm tauri dev`

Verify:
1. Bottom nav shows 5 tabs, "对话" tab works
2. Chat page renders with header, empty state, input area
3. Can type text and send (will need AI model configured)
4. Settings page shows "场景对话" section
5. No console errors

- [ ] **Step 4: Final commit (if any fixes were needed)**

```bash
cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo
git add -A
git commit -m "fix(chat): integration fixes from verification"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- Section 1 (Page structure & routing): Task 4 ✓
- Section 2 (Component decomposition): Tasks 5-10 ✓
- Section 3 (Input area interaction): Tasks 8 ✓
- Section 4 (Rust ASR command): Task 3 ✓
- Section 5 (AI call adaptation): Task 2 ✓
- Section 6 (AI reply TTS): Task 11 (handlePlayTts) ✓
- Section 7 (Session management): Task 1 ✓
- Section 8 (Header toolbar): Task 5 ✓
- Section 9 (Settings page): Task 12 ✓
- Section 10 (Message list display & visual style): Tasks 6-7 ✓
- Section 11 (Dependencies & reuse): Referenced throughout ✓
- Section 12 (YAGNI - no avatars, no timestamps): Tasks 6-7 ✓
- Section 13 (Visual style summary): Applied in Tasks 6-8 ✓

**2. Placeholder scan:** No TBD/TODO found. All code is concrete.

**3. Type consistency:**
- `Message` type from `@/stores/chat` used consistently across MessageItem, MessageList, and chat/index.vue ✓
- `ChatStreamParams` defined in aiClientManager and used in chat/index.vue ✓
- `AsrResult` defined in types.rs and returned by command ✓
- `chatDefaultPrompt` added to settingsState and referenced in chat store and chat page ✓
