use base64::Engine;
use base64::engine::general_purpose::STANDARD as BASE64;
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use tokio_tungstenite::connect_async;
use tokio_tungstenite::tungstenite::Message;

use super::auth::build_auth_url;
use super::types::XfConfig;

const TTS_HOST: &str = "tts-api.xfyun.cn";
const TTS_PATH: &str = "/v2/tts";

// === TTS 请求结构 ===

#[derive(Serialize)]
struct TtsRequest {
    common: TtsCommon,
    business: TtsBusiness,
    data: TtsData,
}

#[derive(Serialize)]
struct TtsCommon {
    app_id: String,
}

#[derive(Serialize)]
struct TtsBusiness {
    aue: String,
    sfl: i32,
    auf: String,
    vcn: String,
    speed: i32,
    volume: i32,
    pitch: i32,
    tte: String,
}

#[derive(Serialize)]
struct TtsData {
    status: i32,
    text: String,
}

// === TTS 响应结构 ===

#[derive(Deserialize)]
struct TtsResponse {
    code: i32,
    message: String,
    #[allow(dead_code)]
    sid: Option<String>,
    data: Option<TtsResponseData>,
}

#[derive(Deserialize)]
struct TtsResponseData {
    audio: Option<String>,
    status: Option<i32>,
    #[allow(dead_code)]
    ced: Option<String>,
}

/// 调用讯飞在线语音合成 WebSocket API，返回完整 MP3 音频数据
pub async fn xf_tts_synthesize(
    config: &XfConfig,
    text: &str,
    speed: i32,
    vcn: &str,
) -> Result<Vec<u8>, String> {
    // 1. 生成鉴权 URL 并连接
    let url = build_auth_url(TTS_HOST, TTS_PATH, &config.api_key, &config.api_secret);
    println!("[tts] connecting to WebSocket: {}...", &url[..url.len().min(80)]);
    let (ws_stream, _) = connect_async(&url)
        .await
        .map_err(|e| format!("TTS WebSocket 连接失败: {}", e))?;
    println!("[tts] WebSocket connected");
    let (mut write, mut read) = ws_stream.split();

    // 2. 构建并发送请求
    let request = TtsRequest {
        common: TtsCommon {
            app_id: config.app_id.clone(),
        },
        business: TtsBusiness {
            aue: "lame".to_string(),
            sfl: 1,
            auf: "audio/L16;rate=16000".to_string(),
            vcn: vcn.to_string(),
            speed,
            volume: 50,
            pitch: 50,
            tte: "UTF8".to_string(),
        },
        data: TtsData {
            status: 2, // 文本一次性发送
            text: BASE64.encode(text.as_bytes()),
        },
    };

    let msg = serde_json::to_string(&request)
        .map_err(|e| format!("TTS 请求序列化失败: {}", e))?;
    write
        .send(Message::Text(msg.into()))
        .await
        .map_err(|e| format!("TTS 请求发送失败: {}", e))?;
    println!("[tts] request sent, text={} chars, speed={}, vcn={}", text.len(), speed, vcn);

    // 3. 接收响应，收集音频数据
    let mut audio_buffer: Vec<u8> = Vec::new();

    while let Some(msg) = read.next().await {
        let msg = msg.map_err(|e| format!("TTS 接收错误: {}", e))?;
        match msg {
            Message::Text(text) => {
                let response: TtsResponse = serde_json::from_str(&text)
                    .map_err(|e| format!("TTS 响应解析失败: {}: {}", e, &text[..text.len().min(200)]))?;

                if response.code != 0 {
                    return Err(format!("TTS API 错误 {}: {}", response.code, response.message));
                }

                if let Some(data) = response.data {
                    if let Some(audio_b64) = data.audio {
                        let audio_bytes = BASE64.decode(&audio_b64)
                            .map_err(|e| format!("TTS 音频 base64 解码失败: {}", e))?;
                        audio_buffer.extend_from_slice(&audio_bytes);
                    }
                    if data.status == Some(2) {
                        break;
                    }
                }
            }
            Message::Close(_) => break,
            _ => {}
        }
    }

    if audio_buffer.is_empty() {
        return Err("TTS 未返回音频数据".to_string());
    }

    println!("[tts] synthesis complete, {} bytes MP3", audio_buffer.len());
    Ok(audio_buffer)
}
