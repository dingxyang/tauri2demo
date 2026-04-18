# 语音评测功能 Demo 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在西语助手中集成讯飞语音评测 API，实现用户朗读文本获得发音评分和逐词反馈的技术验证 Demo。

**Architecture:** 全 Rust 实现 — 录音(cpal)、MP3编码(mp3lame-encoder)、WebSocket通信(tokio-tungstenite)、HMAC-SHA256鉴权全部在 Rust 端完成。前端 Vue 3 + Element Plus 仅负责 UI 交互，通过 Tauri invoke 调用 Rust commands。

**Tech Stack:** Rust (cpal, mp3lame-encoder, tokio-tungstenite, hmac, sha2, base64, chrono) + Vue 3 + Element Plus + Tauri 2

---

## File Structure

### Rust 端 (新建)

| 文件 | 职责 |
|------|------|
| `backend/src-tauri/src/speech_eval/mod.rs` | 模块入口，re-export |
| `backend/src-tauri/src/speech_eval/auth.rs` | 讯飞 HMAC-SHA256 鉴权 URL 生成 |
| `backend/src-tauri/src/speech_eval/audio.rs` | 麦克风录音(cpal) + PCM→MP3 编码 |
| `backend/src-tauri/src/speech_eval/client.rs` | WebSocket 客户端，帧发送，结果解析 |
| `backend/src-tauri/src/speech_eval/types.rs` | 所有数据结构（请求/响应/结果） |
| `backend/src-tauri/src/speech_eval/commands.rs` | Tauri Commands 定义 |

### Rust 端 (修改)

| 文件 | 变更 |
|------|------|
| `backend/src-tauri/Cargo.toml` | 添加依赖: cpal, mp3lame-encoder, tokio-tungstenite, hmac, sha2, base64, chrono, url, tokio |
| `backend/src-tauri/src/lib.rs` | 注册 speech_eval 模块、commands、AppState |

### 前端 (新建)

| 文件 | 职责 |
|------|------|
| `frontend/src/pages/speech-eval/index.vue` | 语音评测主页面 |
| `frontend/src/pages/speech-eval/components/RecordButton.vue` | 录音按钮组件 |
| `frontend/src/pages/speech-eval/components/EvalResult.vue` | 评测结果展示组件 |

### 前端 (修改)

| 文件 | 变更 |
|------|------|
| `frontend/src/router/index.ts` | 添加 `/speech-eval` 路由 |
| `frontend/src/layouts/BottomNav.vue` | 添加语音评测导航 tab |

---

### Task 1: 添加 Rust 依赖

**Files:**
- Modify: `backend/src-tauri/Cargo.toml`

- [ ] **Step 1: 添加所有需要的 crate 依赖**

在 `backend/src-tauri/Cargo.toml` 的 `[dependencies]` 末尾追加：

```toml
cpal = "0.15"
mp3lame-encoder = "0.2"
tokio = { version = "1", features = ["full"] }
tokio-tungstenite = { version = "0.26", features = ["native-tls"] }
hmac = "0.12"
sha2 = "0.10"
base64 = "0.22"
chrono = "0.4"
url = "2"
```

- [ ] **Step 2: 验证依赖能编译**

Run: `cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo && cargo check --manifest-path backend/src-tauri/Cargo.toml`
Expected: 编译通过无错误（首次下载依赖可能较慢）

- [ ] **Step 3: Commit**

```bash
git add backend/src-tauri/Cargo.toml
git commit -m "feat(speech-eval): add Rust dependencies for audio recording and WebSocket"
```

---

### Task 2: 定义数据结构 (`types.rs`)

**Files:**
- Create: `backend/src-tauri/src/speech_eval/types.rs`
- Create: `backend/src-tauri/src/speech_eval/mod.rs`

- [ ] **Step 1: 创建 speech_eval 模块入口**

创建 `backend/src-tauri/src/speech_eval/mod.rs`：

```rust
pub mod types;
```

- [ ] **Step 2: 定义所有数据结构**

创建 `backend/src-tauri/src/speech_eval/types.rs`：

```rust
use serde::{Deserialize, Serialize};

// === 讯飞 API 请求结构 ===

#[derive(Serialize)]
pub struct XfRequest {
    pub header: XfRequestHeader,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parameter: Option<XfParameter>,
    pub payload: XfPayload,
}

#[derive(Serialize)]
pub struct XfRequestHeader {
    pub app_id: String,
    pub status: i32,
}

#[derive(Serialize)]
pub struct XfParameter {
    pub st: XfStParam,
}

#[derive(Serialize)]
pub struct XfStParam {
    pub lang: String,
    pub core: String,
    #[serde(rename = "refText")]
    pub ref_text: String,
    pub result: XfResultFormat,
}

#[derive(Serialize)]
pub struct XfResultFormat {
    pub encoding: String,
    pub compress: String,
    pub format: String,
}

#[derive(Serialize)]
pub struct XfPayload {
    pub data: XfAudioData,
}

#[derive(Serialize)]
pub struct XfAudioData {
    pub encoding: String,
    pub sample_rate: i32,
    pub channels: i32,
    pub bit_depth: i32,
    pub status: i32,
    pub seq: i32,
    pub audio: String,
    pub frame_size: i32,
}

// === 讯飞 API 响应结构 ===

#[derive(Deserialize, Debug)]
pub struct XfResponse {
    pub header: XfResponseHeader,
    pub payload: Option<XfResponsePayload>,
}

#[derive(Deserialize, Debug)]
pub struct XfResponseHeader {
    pub code: i32,
    pub message: String,
    pub sid: Option<String>,
    pub status: Option<i32>,
}

#[derive(Deserialize, Debug)]
pub struct XfResponsePayload {
    pub result: Option<XfResponseResult>,
}

#[derive(Deserialize, Debug)]
pub struct XfResponseResult {
    pub text: String,
    pub seq: Option<i32>,
    pub status: Option<i32>,
}

// === 解码后的评测结果（从 base64 text 解码） ===

#[derive(Deserialize, Debug)]
pub struct XfEvalRaw {
    pub eof: Option<i32>,
    #[serde(rename = "refText")]
    pub ref_text: Option<String>,
    pub result: Option<serde_json::Value>,
}

// === 返回给前端的结构化结果 ===

#[derive(Serialize, Clone, Debug)]
pub struct EvalResult {
    pub overall: f64,
    pub pronunciation: f64,
    pub fluency: f64,
    pub integrity: f64,
    pub words: Vec<WordScore>,
}

#[derive(Serialize, Clone, Debug)]
pub struct WordScore {
    pub word: String,
    pub overall: f64,
    pub pronunciation: f64,
    pub read_type: i32,
}

// === 讯飞 API 配置 ===

pub struct XfConfig {
    pub app_id: String,
    pub api_key: String,
    pub api_secret: String,
}

impl XfConfig {
    /// 技术验证阶段：硬编码配置
    /// TODO: 后续改为设置页面配置
    pub fn hardcoded() -> Self {
        Self {
            app_id: "YOUR_APP_ID".to_string(),
            api_key: "YOUR_API_KEY".to_string(),
            api_secret: "YOUR_API_SECRET".to_string(),
        }
    }
}

/// 根据语言选择 WebSocket 端点
pub fn get_ws_endpoint(lang: &str) -> (&'static str, &'static str) {
    match lang {
        "cn" | "en" => (
            "cn-east-1.ws-api.xf-yun.com",
            "/v1/private/s8e098720",
        ),
        _ => (
            "cn-east-1.ws-api.xf-yun.com",
            "/v1/private/sffc17cdb",
        ),
    }
}
```

- [ ] **Step 3: 在 lib.rs 中注册模块**

修改 `backend/src-tauri/src/lib.rs`，在文件顶部添加：

```rust
mod speech_eval;
```

- [ ] **Step 4: 验证编译**

Run: `cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo && cargo check --manifest-path backend/src-tauri/Cargo.toml`
Expected: 编译通过

- [ ] **Step 5: Commit**

```bash
git add backend/src-tauri/src/speech_eval/
git commit -m "feat(speech-eval): define data types for XFyun API request/response and eval results"
```

---

### Task 3: 实现鉴权模块 (`auth.rs`)

**Files:**
- Create: `backend/src-tauri/src/speech_eval/auth.rs`
- Modify: `backend/src-tauri/src/speech_eval/mod.rs`

- [ ] **Step 1: 实现鉴权 URL 生成**

创建 `backend/src-tauri/src/speech_eval/auth.rs`：

```rust
use base64::Engine;
use base64::engine::general_purpose::STANDARD as BASE64;
use chrono::Utc;
use hmac::{Hmac, Mac};
use sha2::Sha256;
use url::form_urlencoded;

type HmacSha256 = Hmac<Sha256>;

/// 生成讯飞 WebSocket 鉴权 URL
///
/// 参考文档: https://www.xfyun.cn/doc/voiceservice/suntone/API.html#鉴权说明
pub fn build_auth_url(host: &str, path: &str, api_key: &str, api_secret: &str) -> String {
    // Step 1: 生成 RFC1123 格式的 UTC 时间
    let date = Utc::now().format("%a, %d %b %Y %H:%M:%S GMT").to_string();

    // Step 2: 构建签名原文
    let signature_origin = format!(
        "host: {}\ndate: {}\nGET {} HTTP/1.1",
        host, date, path
    );

    // Step 3: HMAC-SHA256 签名
    let mut mac = HmacSha256::new_from_slice(api_secret.as_bytes())
        .expect("HMAC key length is always valid");
    mac.update(signature_origin.as_bytes());
    let signature = BASE64.encode(mac.finalize().into_bytes());

    // Step 4: 构建 authorization_origin
    let authorization_origin = format!(
        r#"api_key="{}", algorithm="hmac-sha256", headers="host date request-line", signature="{}""#,
        api_key, signature
    );

    // Step 5: base64 编码得到最终 authorization
    let authorization = BASE64.encode(authorization_origin.as_bytes());

    // Step 6: 拼接完整 URL
    let encoded_date: String = form_urlencoded::Serializer::new(String::new())
        .append_pair("date", &date)
        .finish();
    // form_urlencoded 输出 "date=xxx"，我们只需要值部分
    let encoded_date = &encoded_date["date=".len()..];

    format!(
        "wss://{}{}?host={}&date={}&authorization={}",
        host, path, host, encoded_date, authorization
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_auth_url_format() {
        let url = build_auth_url(
            "cn-east-1.ws-api.xf-yun.com",
            "/v1/private/s8e098720",
            "test_api_key",
            "test_api_secret",
        );
        assert!(url.starts_with("wss://cn-east-1.ws-api.xf-yun.com/v1/private/s8e098720?"));
        assert!(url.contains("host=cn-east-1.ws-api.xf-yun.com"));
        assert!(url.contains("date="));
        assert!(url.contains("authorization="));
    }

    #[test]
    fn test_build_auth_url_authorization_is_valid_base64() {
        let url = build_auth_url(
            "cn-east-1.ws-api.xf-yun.com",
            "/v1/private/s8e098720",
            "test_key",
            "test_secret",
        );
        // 提取 authorization 参数值
        let auth_param = url.split("authorization=").nth(1).unwrap();
        let decoded = BASE64.decode(auth_param);
        assert!(decoded.is_ok(), "authorization should be valid base64");
        let decoded_str = String::from_utf8(decoded.unwrap()).unwrap();
        assert!(decoded_str.contains("api_key=\"test_key\""));
        assert!(decoded_str.contains("algorithm=\"hmac-sha256\""));
        assert!(decoded_str.contains("headers=\"host date request-line\""));
        assert!(decoded_str.contains("signature=\""));
    }
}
```

- [ ] **Step 2: 在 mod.rs 中注册**

修改 `backend/src-tauri/src/speech_eval/mod.rs`：

```rust
pub mod auth;
pub mod types;
```

- [ ] **Step 3: 运行测试验证**

Run: `cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo && cargo test --manifest-path backend/src-tauri/Cargo.toml -- speech_eval::auth`
Expected: 2 个测试通过

- [ ] **Step 4: Commit**

```bash
git add backend/src-tauri/src/speech_eval/auth.rs backend/src-tauri/src/speech_eval/mod.rs
git commit -m "feat(speech-eval): implement HMAC-SHA256 auth URL generation for XFyun API"
```

---

### Task 4: 实现音频录制模块 (`audio.rs`)

**Files:**
- Create: `backend/src-tauri/src/speech_eval/audio.rs`
- Modify: `backend/src-tauri/src/speech_eval/mod.rs`

- [ ] **Step 1: 实现录音和 MP3 编码**

创建 `backend/src-tauri/src/speech_eval/audio.rs`：

```rust
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{Device, SampleRate, Stream, StreamConfig};
use mp3lame_encoder::{Builder, FlushNoGap, InterleavedPcm};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

/// 录音状态，Tauri 全局管理
pub struct RecordingState {
    pub is_recording: Arc<AtomicBool>,
    pub audio_buffer: Arc<Mutex<Vec<i16>>>,
    pub stream: Arc<Mutex<Option<Stream>>>,
}

impl RecordingState {
    pub fn new() -> Self {
        Self {
            is_recording: Arc::new(AtomicBool::new(false)),
            audio_buffer: Arc::new(Mutex::new(Vec::new())),
            stream: Arc::new(Mutex::new(None)),
        }
    }
}

/// 获取默认输入设备，配置为 16kHz/mono
fn get_input_device() -> Result<(Device, StreamConfig), String> {
    let host = cpal::default_host();
    let device = host
        .default_input_device()
        .ok_or("no input device available")?;

    let config = StreamConfig {
        channels: 1,
        sample_rate: SampleRate(16000),
        buffer_size: cpal::BufferSize::Default,
    };

    Ok((device, config))
}

/// 开始录音：启动 cpal 输入流，将 PCM 数据写入 buffer
pub fn start_recording(state: &RecordingState) -> Result<(), String> {
    if state.is_recording.load(Ordering::SeqCst) {
        return Err("already recording".to_string());
    }

    // 清空上次的录音数据
    state.audio_buffer.lock().unwrap().clear();

    let (device, config) = get_input_device()?;

    let buffer = state.audio_buffer.clone();
    let is_recording = state.is_recording.clone();

    let stream = device
        .build_input_stream(
            &config,
            move |data: &[f32], _: &cpal::InputCallbackInfo| {
                if is_recording.load(Ordering::SeqCst) {
                    let samples: Vec<i16> = data
                        .iter()
                        .map(|&s| (s * i16::MAX as f32) as i16)
                        .collect();
                    buffer.lock().unwrap().extend_from_slice(&samples);
                }
            },
            |err| {
                eprintln!("audio input error: {}", err);
            },
            None,
        )
        .map_err(|e| format!("failed to build input stream: {}", e))?;

    stream.play().map_err(|e| format!("failed to start stream: {}", e))?;

    state.is_recording.store(true, Ordering::SeqCst);
    *state.stream.lock().unwrap() = Some(stream);

    Ok(())
}

/// 停止录音：停止 cpal 流，返回录制的 PCM 数据
pub fn stop_recording(state: &RecordingState) -> Result<Vec<i16>, String> {
    if !state.is_recording.load(Ordering::SeqCst) {
        return Err("not recording".to_string());
    }

    state.is_recording.store(false, Ordering::SeqCst);

    // Drop stream to stop recording
    let _ = state.stream.lock().unwrap().take();

    let buffer = state.audio_buffer.lock().unwrap().clone();
    if buffer.is_empty() {
        return Err("no audio data recorded".to_string());
    }

    Ok(buffer)
}

/// 将 PCM (16kHz, 16bit, mono) 编码为 MP3
pub fn encode_pcm_to_mp3(pcm_data: &[i16]) -> Result<Vec<u8>, String> {
    let mut encoder = Builder::new()
        .ok_or("failed to create mp3 encoder")?;
    encoder.set_num_channels(1)
        .map_err(|e| format!("set channels error: {:?}", e))?;
    encoder.set_sample_rate(16000)
        .map_err(|e| format!("set sample rate error: {:?}", e))?;
    encoder.set_quality(mp3lame_encoder::Quality::Best)
        .map_err(|e| format!("set quality error: {:?}", e))?;

    let mut encoder = encoder.build()
        .map_err(|e| format!("build encoder error: {:?}", e))?;

    let input = InterleavedPcm(pcm_data);
    let mut mp3_out = Vec::new();

    let encoded = encoder.encode(input)
        .map_err(|e| format!("encode error: {:?}", e))?;
    mp3_out.extend_from_slice(encoded.as_ref());

    let flushed = encoder.flush::<FlushNoGap>()
        .map_err(|e| format!("flush error: {:?}", e))?;
    mp3_out.extend_from_slice(flushed.as_ref());

    Ok(mp3_out)
}
```

- [ ] **Step 2: 在 mod.rs 中注册**

修改 `backend/src-tauri/src/speech_eval/mod.rs`：

```rust
pub mod audio;
pub mod auth;
pub mod types;
```

- [ ] **Step 3: 验证编译**

Run: `cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo && cargo check --manifest-path backend/src-tauri/Cargo.toml`
Expected: 编译通过（cpal 需要系统音频库，macOS 自带 CoreAudio）

- [ ] **Step 4: Commit**

```bash
git add backend/src-tauri/src/speech_eval/audio.rs backend/src-tauri/src/speech_eval/mod.rs
git commit -m "feat(speech-eval): implement audio recording with cpal and PCM-to-MP3 encoding"
```

---

### Task 5: 实现 WebSocket 评测客户端 (`client.rs`)

**Files:**
- Create: `backend/src-tauri/src/speech_eval/client.rs`
- Modify: `backend/src-tauri/src/speech_eval/mod.rs`

- [ ] **Step 1: 实现 WebSocket 客户端**

创建 `backend/src-tauri/src/speech_eval/client.rs`：

```rust
use base64::Engine;
use base64::engine::general_purpose::STANDARD as BASE64;
use futures_util::{SinkExt, StreamExt};
use tokio_tungstenite::connect_async;
use tokio_tungstenite::tungstenite::Message;

use super::auth::build_auth_url;
use super::types::*;

const FRAME_SIZE: usize = 1280; // 每帧约 1280 字节

/// 执行语音评测：连接 WebSocket、分帧发送音频、接收并解析结果
pub async fn evaluate(
    config: &XfConfig,
    lang: &str,
    category: &str,
    ref_text: &str,
    mp3_data: &[u8],
) -> Result<EvalResult, String> {
    let (host, path) = get_ws_endpoint(lang);

    // 1. 生成鉴权 URL 并连接
    let url = build_auth_url(host, path, &config.api_key, &config.api_secret);
    let (ws_stream, _) = connect_async(&url)
        .await
        .map_err(|e| format!("WebSocket connect failed: {}", e))?;
    let (mut write, mut read) = ws_stream.split();

    // 2. 将音频分帧
    let frames: Vec<&[u8]> = mp3_data.chunks(FRAME_SIZE).collect();
    let total_frames = frames.len();

    for (i, frame) in frames.iter().enumerate() {
        let is_first = i == 0;
        let is_last = i == total_frames - 1;

        let header_status = if is_first { 0 } else if is_last { 2 } else { 1 };
        let data_status = header_status;

        let request = XfRequest {
            header: XfRequestHeader {
                app_id: config.app_id.clone(),
                status: header_status,
            },
            parameter: if is_first {
                Some(XfParameter {
                    st: XfStParam {
                        lang: lang.to_string(),
                        core: category.to_string(),
                        ref_text: ref_text.to_string(),
                        result: XfResultFormat {
                            encoding: "utf8".to_string(),
                            compress: "raw".to_string(),
                            format: "plain".to_string(),
                        },
                    },
                })
            } else {
                None
            },
            payload: XfPayload {
                data: XfAudioData {
                    encoding: "lame".to_string(),
                    sample_rate: 16000,
                    channels: 1,
                    bit_depth: 16,
                    status: data_status,
                    seq: i as i32,
                    audio: BASE64.encode(frame),
                    frame_size: 0,
                },
            },
        };

        let msg = serde_json::to_string(&request)
            .map_err(|e| format!("serialize error: {}", e))?;
        write
            .send(Message::Text(msg.into()))
            .await
            .map_err(|e| format!("send error: {}", e))?;

        // 帧间间隔 40ms，模拟实时音频流
        if !is_last {
            tokio::time::sleep(std::time::Duration::from_millis(40)).await;
        }
    }

    // 3. 接收响应，等待最终结果
    let mut final_result: Option<EvalResult> = None;

    while let Some(msg) = read.next().await {
        let msg = msg.map_err(|e| format!("receive error: {}", e))?;
        match msg {
            Message::Text(text) => {
                let response: XfResponse = serde_json::from_str(&text)
                    .map_err(|e| format!("parse response error: {}: {}", e, text))?;

                if response.header.code != 0 {
                    return Err(format!(
                        "API error {}: {}",
                        response.header.code, response.header.message
                    ));
                }

                if let Some(payload) = response.payload {
                    if let Some(result) = payload.result {
                        let decoded_bytes = BASE64.decode(&result.text)
                            .map_err(|e| format!("base64 decode error: {}", e))?;
                        let decoded_str = String::from_utf8(decoded_bytes)
                            .map_err(|e| format!("utf8 decode error: {}", e))?;
                        let raw: XfEvalRaw = serde_json::from_str(&decoded_str)
                            .map_err(|e| format!("parse eval result error: {}: {}", e, decoded_str))?;

                        if raw.eof == Some(1) {
                            final_result = Some(parse_eval_result(&raw, category)?);
                        }
                    }
                }

                // 如果 header.status == 2，服务端已完成
                if response.header.status == Some(2) {
                    break;
                }
            }
            Message::Close(_) => break,
            _ => {}
        }
    }

    final_result.ok_or_else(|| "no evaluation result received".to_string())
}

/// 从讯飞原始结果中解析出结构化评分
fn parse_eval_result(raw: &XfEvalRaw, category: &str) -> Result<EvalResult, String> {
    let result = raw.result.as_ref().ok_or("missing result field")?;

    let overall = result.get("overall").and_then(|v| v.as_f64()).unwrap_or(0.0);
    let pronunciation = result.get("pronunciation").and_then(|v| v.as_f64()).unwrap_or(0.0);
    let fluency = result.get("fluency").and_then(|v| v.as_f64()).unwrap_or(0.0);
    let integrity = result.get("integrity").and_then(|v| v.as_f64()).unwrap_or(0.0);

    let words = match category {
        "word" | "sent" => parse_words_from_array(result.get("words")),
        "para" => parse_words_from_sentences(result.get("sentences")),
        _ => Vec::new(),
    };

    Ok(EvalResult {
        overall,
        pronunciation,
        fluency,
        integrity,
        words,
    })
}

fn parse_words_from_array(words_val: Option<&serde_json::Value>) -> Vec<WordScore> {
    let Some(arr) = words_val.and_then(|v| v.as_array()) else {
        return Vec::new();
    };
    arr.iter()
        .filter_map(|w| {
            let word = w.get("word")?.as_str()?.to_string();
            let char_type = w.get("charType").and_then(|v| v.as_i64()).unwrap_or(0);
            if char_type == 1 {
                return None; // 跳过标点
            }
            let scores = w.get("scores")?;
            Some(WordScore {
                word,
                overall: scores.get("overall").and_then(|v| v.as_f64()).unwrap_or(0.0),
                pronunciation: scores.get("pronunciation").and_then(|v| v.as_f64()).unwrap_or(0.0),
                read_type: w.get("readType").and_then(|v| v.as_i64()).unwrap_or(0) as i32,
            })
        })
        .collect()
}

fn parse_words_from_sentences(sentences_val: Option<&serde_json::Value>) -> Vec<WordScore> {
    let Some(sentences) = sentences_val.and_then(|v| v.as_array()) else {
        return Vec::new();
    };
    // 段落模式 sentences 数组中每个元素包含逐词信息
    sentences.iter()
        .flat_map(|sent| {
            let words = sent.get("words").and_then(|v| v.as_array());
            match words {
                Some(arr) => parse_words_from_array(Some(&serde_json::Value::Array(arr.clone()))),
                None => {
                    // 段落模式可能直接是扁平结构
                    let word = sent.get("word").and_then(|v| v.as_str()).unwrap_or("").to_string();
                    let char_type = sent.get("charType").and_then(|v| v.as_i64()).unwrap_or(0);
                    if char_type == 1 || word.is_empty() {
                        return Vec::new();
                    }
                    vec![WordScore {
                        word,
                        overall: sent.get("overall").and_then(|v| v.as_f64()).unwrap_or(0.0),
                        pronunciation: 0.0,
                        read_type: sent.get("readType").and_then(|v| v.as_i64()).unwrap_or(0) as i32,
                    }]
                }
            }
        })
        .collect()
}
```

- [ ] **Step 2: 添加 futures-util 依赖**

`tokio-tungstenite` 的流操作需要 `futures-util`。在 `Cargo.toml` 的 `[dependencies]` 中添加：

```toml
futures-util = "0.3"
```

- [ ] **Step 3: 在 mod.rs 中注册**

修改 `backend/src-tauri/src/speech_eval/mod.rs`：

```rust
pub mod audio;
pub mod auth;
pub mod client;
pub mod types;
```

- [ ] **Step 4: 验证编译**

Run: `cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo && cargo check --manifest-path backend/src-tauri/Cargo.toml`
Expected: 编译通过

- [ ] **Step 5: Commit**

```bash
git add backend/src-tauri/src/speech_eval/client.rs backend/src-tauri/src/speech_eval/mod.rs backend/src-tauri/Cargo.toml
git commit -m "feat(speech-eval): implement WebSocket client for XFyun speech evaluation API"
```

---

### Task 6: 实现 Tauri Commands 并注册 (`commands.rs` + `lib.rs`)

**Files:**
- Create: `backend/src-tauri/src/speech_eval/commands.rs`
- Modify: `backend/src-tauri/src/speech_eval/mod.rs`
- Modify: `backend/src-tauri/src/lib.rs`

- [ ] **Step 1: 实现 Tauri Commands**

创建 `backend/src-tauri/src/speech_eval/commands.rs`：

```rust
use tauri::State;

use super::audio::{self, RecordingState};
use super::client;
use super::types::{EvalResult, XfConfig};

#[tauri::command]
pub async fn start_recording(state: State<'_, RecordingState>) -> Result<(), String> {
    audio::start_recording(&state)
}

#[tauri::command]
pub async fn stop_recording_and_evaluate(
    state: State<'_, RecordingState>,
    lang: String,
    category: String,
    ref_text: String,
) -> Result<EvalResult, String> {
    // 1. 停止录音，获取 PCM 数据
    let pcm_data = audio::stop_recording(&state)?;

    // 2. PCM → MP3 编码
    let mp3_data = audio::encode_pcm_to_mp3(&pcm_data)?;

    // 3. 发送到讯飞 API 评测
    let config = XfConfig::hardcoded();
    let result = client::evaluate(&config, &lang, &category, &ref_text, &mp3_data).await?;

    Ok(result)
}
```

- [ ] **Step 2: 在 mod.rs 中注册**

修改 `backend/src-tauri/src/speech_eval/mod.rs`：

```rust
pub mod audio;
pub mod auth;
pub mod client;
pub mod commands;
pub mod types;
```

- [ ] **Step 3: 修改 lib.rs 注册 commands 和状态**

将 `backend/src-tauri/src/lib.rs` 替换为：

```rust
mod speech_eval;

use speech_eval::audio::RecordingState;
use speech_eval::commands;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .manage(RecordingState::new())
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::start_recording,
            commands::stop_recording_and_evaluate
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 4: 验证编译**

Run: `cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo && cargo check --manifest-path backend/src-tauri/Cargo.toml`
Expected: 编译通过

- [ ] **Step 5: Commit**

```bash
git add backend/src-tauri/src/speech_eval/commands.rs backend/src-tauri/src/speech_eval/mod.rs backend/src-tauri/src/lib.rs
git commit -m "feat(speech-eval): add Tauri commands for start_recording and stop_recording_and_evaluate"
```

---

### Task 7: 前端 — 添加路由和底部导航

**Files:**
- Modify: `frontend/src/router/index.ts`
- Modify: `frontend/src/layouts/BottomNav.vue`

- [ ] **Step 1: 添加路由**

在 `frontend/src/router/index.ts` 的 `children` 数组中，在 Settings 路由之后添加：

```typescript
      {
        path: '/speech-eval',
        name: 'SpeechEval',
        component: () => import('@/pages/speech-eval/index.vue'),
        meta: { keepAlive: true }
      }
```

- [ ] **Step 2: 添加底部导航 tab**

在 `frontend/src/layouts/BottomNav.vue` 的 template 中，在 Settings 的 `<router-link>` 之前插入：

```html
    <router-link 
      to="/speech-eval"
      class="nav-item" 
      :class="{ active: $route.name === 'SpeechEval' }"
    >
      <div class="nav-icon">🎤</div>
      <span class="nav-text">评测</span>
    </router-link>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/router/index.ts frontend/src/layouts/BottomNav.vue
git commit -m "feat(speech-eval): add /speech-eval route and bottom nav tab"
```

---

### Task 8: 前端 — 录音按钮组件

**Files:**
- Create: `frontend/src/pages/speech-eval/components/RecordButton.vue`

- [ ] **Step 1: 实现录音按钮**

创建 `frontend/src/pages/speech-eval/components/RecordButton.vue`：

```vue
<script setup lang="ts">
import { ref, onUnmounted, computed } from 'vue'

const props = defineProps<{
  recording: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  start: []
  stop: []
}>()

const duration = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const durationText = computed(() => {
  const mins = Math.floor(duration.value / 60)
  const secs = duration.value % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

function handleClick() {
  if (props.loading) return
  if (props.recording) {
    stopTimer()
    emit('stop')
  } else {
    startTimer()
    emit('start')
  }
}

function startTimer() {
  duration.value = 0
  timer = setInterval(() => {
    duration.value++
  }, 1000)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

onUnmounted(() => {
  stopTimer()
})
</script>

<template>
  <div class="record-wrapper">
    <button
      class="record-btn"
      :class="{ recording: recording, loading: loading }"
      :disabled="loading"
      @click="handleClick"
    >
      <span v-if="loading" class="btn-icon">&#8987;</span>
      <span v-else-if="recording" class="btn-icon stop-icon">&#9632;</span>
      <span v-else class="btn-icon mic-icon">&#127908;</span>
    </button>
    <div class="record-status">
      <span v-if="loading">评测中...</span>
      <span v-else-if="recording" class="recording-text">
        录音中 {{ durationText }}
      </span>
      <span v-else class="hint-text">点击开始录音</span>
    </div>
  </div>
</template>

<style scoped>
.record-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
}

.record-btn {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 3px solid #409eff;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.record-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.record-btn.recording {
  border-color: #f56c6c;
  background: #fef0f0;
}

.record-btn.loading {
  border-color: #909399;
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-icon {
  font-size: 28px;
}

.stop-icon {
  color: #f56c6c;
}

.mic-icon {
  color: #409eff;
}

.record-status {
  font-size: 14px;
  color: #606266;
}

.recording-text {
  color: #f56c6c;
  font-weight: 500;
}

.hint-text {
  color: #909399;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
mkdir -p frontend/src/pages/speech-eval/components
git add frontend/src/pages/speech-eval/components/RecordButton.vue
git commit -m "feat(speech-eval): add RecordButton component with timer and state display"
```

---

### Task 9: 前端 — 评测结果组件

**Files:**
- Create: `frontend/src/pages/speech-eval/components/EvalResult.vue`

- [ ] **Step 1: 实现评测结果展示**

创建 `frontend/src/pages/speech-eval/components/EvalResult.vue`：

```vue
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/speech-eval/components/EvalResult.vue
git commit -m "feat(speech-eval): add EvalResult component with score display and word-level feedback"
```

---

### Task 10: 前端 — 语音评测主页面

**Files:**
- Create: `frontend/src/pages/speech-eval/index.vue`

- [ ] **Step 1: 实现主页面**

创建 `frontend/src/pages/speech-eval/index.vue`：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { ElSelect, ElOption, ElInput, ElMessage } from 'element-plus'
import RecordButton from './components/RecordButton.vue'
import EvalResult from './components/EvalResult.vue'

defineOptions({
  name: 'SpeechEval'
})

interface EvalResultData {
  overall: number
  pronunciation: number
  fluency: number
  integrity: number
  words: { word: string; overall: number; pronunciation: number; read_type: number }[]
}

const lang = ref('sp')
const category = ref('sent')
const refText = ref('Hola, bienvenido a España.')
const recording = ref(false)
const loading = ref(false)
const evalResult = ref<EvalResultData | null>(null)
const errorMsg = ref('')

const languages = [
  { value: 'sp', label: '西班牙语' },
  { value: 'en', label: '英语' },
  { value: 'cn', label: '中文' },
  { value: 'jp', label: '日语' },
  { value: 'kr', label: '韩语' },
  { value: 'fr', label: '法语' },
  { value: 'de', label: '德语' },
  { value: 'ru', label: '俄语' },
]

const categories = [
  { value: 'word', label: '单词' },
  { value: 'sent', label: '句子' },
  { value: 'para', label: '段落' },
]

async function handleStart() {
  errorMsg.value = ''
  evalResult.value = null

  if (!refText.value.trim()) {
    ElMessage.warning('请输入参考文本')
    return
  }

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
      lang: lang.value,
      category: category.value,
      refText: refText.value,
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
  <el-container class="speech-eval-page">
    <el-header class="page-header">
      <h2 class="page-title">语音评测</h2>
    </el-header>

    <el-main class="page-main">
      <!-- 参数区域 -->
      <div class="config-section">
        <div class="config-row">
          <label class="config-label">语言</label>
          <el-select v-model="lang" size="default" style="width: 140px">
            <el-option
              v-for="item in languages"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>

        <div class="config-row">
          <label class="config-label">类型</label>
          <el-select v-model="category" size="default" style="width: 140px">
            <el-option
              v-for="item in categories"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>

        <div class="config-row">
          <label class="config-label">参考文本</label>
          <el-input
            v-model="refText"
            type="textarea"
            :rows="3"
            placeholder="请输入要朗读的文本"
            :maxlength="4096"
            show-word-limit
          />
        </div>
      </div>

      <!-- 录音按钮 -->
      <RecordButton
        :recording="recording"
        :loading="loading"
        @start="handleStart"
        @stop="handleStop"
      />

      <!-- 错误信息 -->
      <div v-if="errorMsg" class="error-msg">
        {{ errorMsg }}
      </div>

      <!-- 评测结果 -->
      <EvalResult :result="evalResult" />
    </el-main>
  </el-container>
</template>

<style scoped>
.speech-eval-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  height: auto;
  background: white;
  border-bottom: 1px solid #ebeef5;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.page-main {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.config-section {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.config-row {
  margin-bottom: 12px;
}

.config-row:last-child {
  margin-bottom: 0;
}

.config-label {
  display: block;
  font-size: 14px;
  color: #606266;
  margin-bottom: 6px;
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

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/speech-eval/index.vue
git commit -m "feat(speech-eval): add main SpeechEval page with recording and evaluation flow"
```

---

### Task 11: 端到端验证

**Files:** none (testing only)

- [ ] **Step 1: 在 types.rs 中填入真实的讯飞 API 配置**

修改 `backend/src-tauri/src/speech_eval/types.rs` 中 `XfConfig::hardcoded()` 方法，将 `YOUR_APP_ID`、`YOUR_API_KEY`、`YOUR_API_SECRET` 替换为真实的讯飞控制台凭证。

**重要**：这些凭证仅用于本地技术验证，不要提交到 git。

- [ ] **Step 2: 启动开发服务器**

Run: `cd /Users/dxy/Documents/Code/github.com/snail0109/tauri2demo && pnpm tauri dev`
Expected: 应用启动，底部导航栏出现"评测"tab

- [ ] **Step 3: 功能验证**

1. 点击底部"评测"tab，进入语音评测页面
2. 确认语言默认为"西班牙语"，类型默认为"句子"
3. 确认参考文本输入框有默认文本
4. 点击录音按钮，确认：
   - 按钮变为红色停止状态
   - 显示录音时长计时
5. 朗读参考文本后，点击停止按钮，确认：
   - 显示"评测中..."
   - 收到结果后显示总分、发音分、流利度、完整度
   - 显示逐词反馈，高分绿色，低分红色

- [ ] **Step 4: 验证错误处理**

1. 不输入参考文本就点击录音 → 应提示"请输入参考文本"
2. 录音时长极短（<0.5s）→ 应显示错误信息

- [ ] **Step 5: Commit（如有修复）**

```bash
git add -A
git commit -m "fix(speech-eval): address issues found during end-to-end testing"
```
