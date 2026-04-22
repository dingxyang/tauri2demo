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

pub async fn recognize(config: &XfConfig, mp3_data: &[u8]) -> Result<AsrResult, String> {
    let url = build_auth_url(ASR_HOST, ASR_PATH, &config.api_key, &config.api_secret);
    let url_preview = if url.len() > 100 { format!("{}...{}", &url[..60], &url[url.len()-20..]) } else { url.clone() };
    println!("[asr] connecting to WebSocket: {}", url_preview);
    let (ws_stream, _) = connect_async(&url).await.map_err(|e| format!("ASR WebSocket connect failed: {}", e))?;
    println!("[asr] WebSocket connected");
    let (mut write, mut read) = ws_stream.split();

    let frames: Vec<&[u8]> = mp3_data.chunks(FRAME_SIZE).collect();
    let total_frames = frames.len();
    println!("[asr] sending {} frames", total_frames);

    for (i, frame) in frames.iter().enumerate() {
        let is_first = i == 0;
        let is_last = i == total_frames - 1;
        let header_status = if is_first { 0 } else if is_last { 2 } else { 1 };

        let request = AsrRequest {
            header: AsrRequestHeader { app_id: config.app_id.clone(), status: header_status },
            parameter: if is_first { Some(AsrParameter { nls: AsrNlsParam { eng: "cn".to_string(), aue: Some("lame".to_string()), ent: Some("fr".to_string()) } }) } else { None },
            payload: AsrPayload { data: AsrAudioData { encoding: "lame".to_string(), sample_rate: 16000, channels: 1, bit_depth: 16, status: header_status, seq: i as i32, audio: BASE64.encode(frame), frame_size: 0 } },
        };

        let msg = serde_json::to_string(&request).map_err(|e| format!("ASR serialize error: {}", e))?;
        write.send(Message::Text(msg.into())).await.map_err(|e| format!("ASR send error: {}", e))?;
        if !is_last { tokio::time::sleep(std::time::Duration::from_millis(40)).await; }
    }
    println!("[asr] all frames sent, waiting for response...");

    let mut final_text = String::new();
    while let Some(msg) = read.next().await {
        let msg = msg.map_err(|e| format!("ASR receive error: {}", e))?;
        match msg {
            Message::Text(text) => {
                println!("[asr] received: {}...", &text[..text.len().min(200)]);
                if let Ok(response) = serde_json::from_str::<serde_json::Value>(&text) {
                    if let Some(code) = response.get("header").and_then(|h| h.get("code")).and_then(|c| c.as_i64()) {
                        if code != 0 {
                            let message = response.get("header").and_then(|h| h.get("message")).and_then(|m| m.as_str()).unwrap_or("unknown error");
                            return Err(format!("ASR API error {}: {}", code, message));
                        }
                    }
                    if let Some(result_text) = response.get("payload").and_then(|p| p.get("result")).and_then(|r| r.get("text")).and_then(|t| t.as_str()) {
                        final_text = result_text.to_string();
                    }
                    if let Some(status) = response.get("header").and_then(|h| h.get("status")).and_then(|s| s.as_i64()) {
                        if status == 2 { break; }
                    }
                }
            }
            Message::Close(_) => break,
            _ => {}
        }
    }

    if final_text.is_empty() { return Err("ASR 未识别到有效文本".to_string()); }
    println!("[asr] recognition complete, text: {}", final_text);
    Ok(AsrResult { text: final_text })
}
