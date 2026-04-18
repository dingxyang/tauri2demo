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
