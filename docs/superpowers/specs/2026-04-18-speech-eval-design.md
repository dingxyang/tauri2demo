# 语音评测功能 Demo 设计文档

**日期**: 2026-04-18
**阶段**: 技术验证（配置硬编码，后续优化为西班牙语学习评测）
**平台**: Desktop + 移动端（macOS/Windows/Linux/Android/iOS）

## 概述

在西语助手应用中集成讯飞语音评测 API，实现用户朗读文本后获得发音评分和逐词反馈的功能。当前为技术验证阶段，API 配置硬编码，UI 保持简洁。

## 技术方案：全 Rust 实现（方案 A）

录音、音频编码、WebSocket 通信、鉴权全部在 Rust 端完成，前端仅负责 UI 交互。

### 整体架构

```
Frontend (Vue 3)                    Rust Backend
┌──────────────────┐    invoke     ┌──────────────────────┐
│ SpeechEvalPage   │──────────────>│ Tauri Commands       │
│ - 参考文本输入    │               │ - start_recording    │
│ - 语言/类型选择   │               │ - stop_and_evaluate  │
│ - 录音按钮       │               ├──────────────────────┤
│ - 结果展示       │<──────────────│ Audio Recorder (cpal)│
└──────────────────┘    result     │ MP3 Encoder (lame)   │
                                   │ WebSocket Client     │
                                   │ HMAC-SHA256 Auth     │
                                   └──────────┬───────────┘
                                              │ wss://
                                   ┌──────────▼───────────┐
                                   │ 讯飞语音评测 API      │
                                   └──────────────────────┘
```

## Rust 端设计

### 模块划分

| 文件 | 职责 |
|------|------|
| `audio.rs` | 麦克风录音（cpal）+ PCM→MP3 编码 |
| `auth.rs` | 讯飞 HMAC-SHA256 鉴权，生成签名 URL |
| `speech_eval.rs` | WebSocket 客户端，帧切分发送，接收解析结果 |
| `commands.rs` | Tauri Command 定义，连接前端与后端逻辑 |
| `lib.rs` | 入口，注册 commands 和状态 |

### 音频录制模块 (`audio.rs`)

- 使用 `cpal` 采集麦克风 PCM 数据
- 采样参数：16kHz, 16bit, mono
- 录音数据存储在内存 buffer（`Arc<Mutex<Vec<i16>>>`）
- 录音在后台线程运行，通过 `AtomicBool` 控制开始/停止
- 停止后将 PCM buffer 编码为 MP3（使用 `mp3lame-encoder` crate）

### 鉴权模块 (`auth.rs`)

- 技术验证阶段硬编码 `app_id`、`api_key`、`api_secret`
- 签名流程：
  1. 生成 RFC1123 格式 UTC 时间
  2. 拼接 signature_origin = `host: {host}\ndate: {date}\nGET {path} HTTP/1.1`
  3. HMAC-SHA256(signature_origin, api_secret) → base64 得到 signature
  4. 拼接 authorization_origin = `api_key="{key}", algorithm="hmac-sha256", headers="host date request-line", signature="{sig}"`
  5. base64(authorization_origin) 得到最终 authorization
  6. 拼接 URL: `wss://{host}{path}?host={host}&date={urlencoded_date}&authorization={auth}`

### 评测客户端模块 (`speech_eval.rs`)

- 使用 `tokio-tungstenite` 建立 WebSocket 连接
- MP3 音频按帧切分（每帧约 1280 字节）分帧发送：
  - 第一帧：header.status=0, payload.data.status=0，携带 parameter + payload
  - 中间帧：header.status=1, payload.data.status=1，仅 payload
  - 末帧：header.status=2, payload.data.status=2
- 接收响应，base64 解码 `payload.result.text` 得到评测 JSON
- 解析并返回结构化评测结果

### Tauri Commands (`commands.rs`)

```rust
#[tauri::command]
async fn start_recording(state: State<'_, AppState>) -> Result<(), String>

#[tauri::command]
async fn stop_recording_and_evaluate(
    state: State<'_, AppState>,
    lang: String,       // "sp", "cn", "en" 等
    category: String,   // "word", "sent", "para"
    ref_text: String,   // 参考文本
) -> Result<EvalResult, String>
```

### 状态管理 (`AppState`)

```rust
struct AppState {
    is_recording: Arc<AtomicBool>,
    audio_buffer: Arc<Mutex<Vec<i16>>>,
    recording_stream: Arc<Mutex<Option<cpal::Stream>>>,
}
```

### Rust 依赖

| crate | 用途 |
|-------|------|
| `cpal` | 跨平台音频采集 |
| `mp3lame-encoder` | PCM → MP3 编码 |
| `tokio-tungstenite` | 异步 WebSocket |
| `hmac` + `sha2` | HMAC-SHA256 签名 |
| `base64` | base64 编解码 |
| `serde` + `serde_json` | JSON 序列化 |
| `chrono` | RFC1123 时间格式 |

### 返回给前端的结果结构

```rust
#[derive(Serialize)]
struct EvalResult {
    overall: f64,           // 总分
    pronunciation: f64,     // 发音分
    fluency: f64,           // 流利度
    integrity: f64,         // 完整度
    words: Vec<WordScore>,  // 逐词分数
}

#[derive(Serialize)]
struct WordScore {
    word: String,
    overall: f64,
    pronunciation: f64,
    read_type: i32,   // 0=正常, 1=插入, 2=遗漏
}
```

## 前端设计

### 路由

新增 `/speech-eval` 路由，在底部导航中添加入口。

### 组件结构

```
pages/speech-eval/
  ├── index.vue              # 主页面
  └── components/
      ├── RecordButton.vue   # 录音按钮（状态切换+时长显示）
      └── EvalResult.vue     # 评测结果（分数+逐词反馈）
```

### UI 布局

```
┌─────────────────────────────────────┐
│  语音评测                            │
├─────────────────────────────────────┤
│  语言：  [西班牙语 ▼]               │
│  类型：  [句子 ▼]                   │
│  参考文本：                          │
│  ┌─────────────────────────────┐    │
│  │ Hola, bienvenido a España. │    │
│  └─────────────────────────────┘    │
│         🎤 按住录音 / 点击录音       │
│         (录音中显示时长)              │
├─────────────────────────────────────┤
│  评测结果                            │
│  总分: 85  发音: 82  流利度: 88     │
│  逐词反馈：                          │
│  Hola(92) bienvenido(78) a(90)     │
│  España(80)                         │
│  (低分词标红，高分词标绿)             │
└─────────────────────────────────────┘
```

### 交互流程

1. 用户选择语言（默认西班牙语）、评测类型（默认句子）、输入参考文本
2. 点击录音按钮 → `invoke('start_recording')` → 按钮变红，显示录音时长
3. 再次点击 → `invoke('stop_recording_and_evaluate', { lang, category, refText })` → loading
4. 收到结果 → 渲染总分 + 逐词反馈（低分红色、高分绿色）

### 技术验证阶段简化

- 语言和评测类型用 Element Plus Select
- 不做录音波形动画，仅显示时长
- 结果以文本+颜色标注为主
- 不做历史记录、评测对比

## 讯飞 API 关键参数

| 参数 | 值 |
|------|-----|
| WebSocket 端点 (中英) | `wss://cn-east-1.ws-api.xf-yun.com/v1/private/s8e098720` |
| WebSocket 端点 (西/日/韩/法/德/俄) | `wss://cn-east-1.ws-api.xf-yun.com/v1/private/sffc17cdb` |
| 音频格式 | MP3 (lame), 16kHz, 16bit, mono |
| 支持语言 | cn, en, sp, jp, kr, fr, de, ru |
| 评测类型 | word, sent, para |
| refText 长度 | 1-4096 字符 |
| 音频大小限制 | base64 后 ≤ 10MB |

## 后续优化方向（不在当前范围）

- API 配置从硬编码改为设置页面管理
- 录音波形动画
- 评测历史记录
- 与翻译功能联动（翻译结果直接作为评测参考文本）
- 更丰富的评测结果可视化（音调曲线、音节详情）
