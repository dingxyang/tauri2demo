use std::path::Path;
use tauri::State;

use super::audio::{self, RecordingState};
use super::client;
use super::types::{EvalResult, XfConfig};

/// 尝试解析文件路径：先按原路径查找，若为相对路径则逐级向上查找
fn resolve_file_path(file_path: &str) -> Result<std::path::PathBuf, String> {
    let path = Path::new(file_path);
    if path.exists() {
        return Ok(path.to_path_buf());
    }

    if path.is_relative() {
        if let Ok(mut dir) = std::env::current_dir() {
            for _ in 0..5 {
                if !dir.pop() {
                    break;
                }
                let candidate = dir.join(file_path);
                if candidate.exists() {
                    return Ok(candidate);
                }
            }
        }
    }

    Err(format!(
        "file not found: '{}' (cwd: {:?})",
        file_path,
        std::env::current_dir().ok()
    ))
}

#[tauri::command]
pub async fn evaluate_mp3_file(
    lang: String,
    category: String,
    ref_text: String,
    file_path: String,
) -> Result<EvalResult, String> {
    // 1. 解析并读取 MP3 文件
    let resolved = resolve_file_path(&file_path)?;
    println!("[speech-eval] reading MP3 file: {}", resolved.display());
    let mp3_data = std::fs::read(&resolved)
        .map_err(|e| format!("failed to read MP3 file '{}': {}", resolved.display(), e))?;
    println!("[speech-eval] MP3 file loaded, {} bytes", mp3_data.len());

    // 2. 读取讯飞配置
    let config = XfConfig::from_env()?;
    println!("[speech-eval] config loaded, app_id={}", config.app_id);

    // 3. 发送到讯飞 API 评测
    println!("[speech-eval] starting evaluation, lang={}, category={}", lang, category);
    let result = client::evaluate(&config, &lang, &category, &ref_text, &mp3_data).await?;
    println!("[speech-eval] evaluation complete, overall={}", result.overall);

    Ok(result)
}

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
    println!("[speech-eval] stopping recording...");
    let pcm_data = audio::stop_recording(&state)?;
    println!("[speech-eval] recorded {} PCM samples", pcm_data.len());

    // 2. 读取讯飞配置
    let config = XfConfig::from_env()?;
    println!("[speech-eval] config loaded, app_id={}", config.app_id);

    // 3. PCM → MP3 编码
    println!("[speech-eval] encoding {} PCM samples to MP3...", pcm_data.len());
    let mp3_data = audio::encode_pcm_to_mp3(&pcm_data)?;
    println!("[speech-eval] MP3 encoded, {} bytes", mp3_data.len());

    // 4. 发送到讯飞 API 评测
    println!("[speech-eval] starting evaluation, lang={}, category={}", lang, category);
    let result = client::evaluate(&config, &lang, &category, &ref_text, &mp3_data).await?;
    println!("[speech-eval] evaluation complete, overall={}", result.overall);

    Ok(result)
}
