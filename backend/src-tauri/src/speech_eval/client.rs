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
    let url_preview = if url.len() > 100 {
        format!("{}...{}", &url[..60], &url[url.len()-20..])
    } else {
        url.clone()
    };
    println!("[speech-eval] connecting to WebSocket: {}", url_preview);
    let (ws_stream, _) = connect_async(&url)
        .await
        .map_err(|e| format!("WebSocket connect failed: {}", e))?;
    println!("[speech-eval] WebSocket connected");
    let (mut write, mut read) = ws_stream.split();

    // 2. 将音频分帧
    let frames: Vec<&[u8]> = mp3_data.chunks(FRAME_SIZE).collect();
    let total_frames = frames.len();
    println!("[speech-eval] sending {} frames", total_frames);

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
    println!("[speech-eval] all frames sent, waiting for response...");

    // 3. 接收响应，等待最终结果
    let mut final_result: Option<EvalResult> = None;

    while let Some(msg) = read.next().await {
        let msg = msg.map_err(|e| format!("receive error: {}", e))?;
        match msg {
            Message::Text(text) => {
                println!("[speech-eval] received response: {}...", &text[..text.len().min(200)]);
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
    sentences.iter()
        .flat_map(|sent| {
            let words = sent.get("words").and_then(|v| v.as_array());
            match words {
                Some(arr) => parse_words_from_array(Some(&serde_json::Value::Array(arr.clone()))),
                None => {
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
