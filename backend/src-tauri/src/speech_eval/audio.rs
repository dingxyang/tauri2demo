use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::Stream;
use shine_rs::{Mp3EncoderConfig, StereoMode};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

/// 录音状态，Tauri 全局管理
pub struct RecordingState {
    pub is_recording: Arc<AtomicBool>,
    pub audio_buffer: Arc<Mutex<Vec<f32>>>,
    pub stream: Arc<Mutex<Option<Stream>>>,
    /// 录音时设备的实际采样率
    pub device_sample_rate: Arc<Mutex<u32>>,
    /// 录音时设备的实际通道数
    pub device_channels: Arc<Mutex<u16>>,
    /// 实时 ASR：PCM 数据发送通道
    pub rtasr_tx: Arc<Mutex<Option<tokio::sync::mpsc::Sender<Vec<i16>>>>>,
    /// 实时 ASR：最终识别结果
    pub rtasr_result: Arc<Mutex<Option<String>>>,
    /// 实时 ASR：WebSocket 任务句柄
    pub rtasr_handle: Arc<Mutex<Option<tokio::task::JoinHandle<()>>>>,
}

// cpal::Stream 不是 Send/Sync，但我们通过 Mutex 保护访问，
// 且 Tauri State 要求 Send + Sync，因此手动实现。
unsafe impl Send for RecordingState {}
unsafe impl Sync for RecordingState {}

impl RecordingState {
    pub fn new() -> Self {
        Self {
            is_recording: Arc::new(AtomicBool::new(false)),
            audio_buffer: Arc::new(Mutex::new(Vec::new())),
            stream: Arc::new(Mutex::new(None)),
            device_sample_rate: Arc::new(Mutex::new(0)),
            device_channels: Arc::new(Mutex::new(0)),
            rtasr_tx: Arc::new(Mutex::new(None)),
            rtasr_result: Arc::new(Mutex::new(None)),
            rtasr_handle: Arc::new(Mutex::new(None)),
        }
    }
}

/// 开始录音：使用设备默认配置启动 cpal 输入流，将原始 f32 数据写入 buffer
/// 如果 rtasr_tx 存在，同时将重采样后的 i16 PCM 数据发送到实时 ASR 通道
pub fn start_recording(state: &RecordingState) -> Result<(), String> {
    if state.is_recording.load(Ordering::SeqCst) {
        return Err("already recording".to_string());
    }

    // 清空上次的录音数据
    state.audio_buffer.lock().unwrap().clear();
    *state.rtasr_result.lock().unwrap() = None;

    let host = cpal::default_host();
    let device = host
        .default_input_device()
        .ok_or("no input device available")?;

    // 使用设备默认配置，不强制 16kHz
    let default_config = device
        .default_input_config()
        .map_err(|e| format!("failed to get default input config: {}", e))?;

    let config: cpal::StreamConfig = default_config.into();
    let sample_rate = config.sample_rate.0;
    let channels = config.channels;

    *state.device_sample_rate.lock().unwrap() = sample_rate;
    *state.device_channels.lock().unwrap() = channels;

    let buffer = state.audio_buffer.clone();
    let is_recording = state.is_recording.clone();
    let rtasr_tx = state.rtasr_tx.clone();

    let stream = device
        .build_input_stream(
            &config,
            move |data: &[f32], _: &cpal::InputCallbackInfo| {
                if !is_recording.load(Ordering::SeqCst) {
                    return;
                }
                // 写入原始 f32 buffer（用于保存完整录音）
                buffer.lock().unwrap().extend_from_slice(data);

                // 如果实时 ASR 通道存在，转换并发送 PCM 数据
                if let Some(tx) = rtasr_tx.lock().unwrap().as_ref() {
                    // Step 1: 多通道转 mono（取第一通道）
                    let mono: Vec<f32> = if channels > 1 {
                        data.chunks(channels as usize)
                            .map(|chunk| chunk[0])
                            .collect()
                    } else {
                        data.to_vec()
                    };

                    // Step 2: 重采样到 16kHz（线性插值）
                    let resampled = if sample_rate != 16000 {
                        resample(&mono, sample_rate, 16000)
                    } else {
                        mono
                    };

                    // Step 3: f32 → i16
                    let pcm_i16: Vec<i16> = resampled
                        .iter()
                        .map(|&s| {
                            let clamped = s.clamp(-1.0, 1.0);
                            (clamped * i16::MAX as f32) as i16
                        })
                        .collect();

                    // try_send 非阻塞，如果通道满则丢弃（避免音频回调阻塞）
                    let _ = tx.try_send(pcm_i16);
                }
            },
            |err| {
                // CoreAudio device-state warnings during stream teardown are harmless
                let msg = err.to_string();
                if !msg.contains("kAudioHardwareBadDeviceError")
                    && !msg.contains("Could not determine whether Device is playing")
                    && !msg.contains("Could not resume")
                {
                    eprintln!("audio input error: {}", err);
                }
            },
            None,
        )
        .map_err(|e| format!("failed to build input stream: {}", e))?;

    stream.play().map_err(|e| format!("failed to start stream: {}", e))?;

    state.is_recording.store(true, Ordering::SeqCst);
    *state.stream.lock().unwrap() = Some(stream);

    Ok(())
}

/// 停止录音：停止 cpal 流，重采样到 16kHz mono 并返回 i16 PCM 数据
pub fn stop_recording(state: &RecordingState) -> Result<Vec<i16>, String> {
    if !state.is_recording.load(Ordering::SeqCst) {
        return Err("not recording".to_string());
    }

    state.is_recording.store(false, Ordering::SeqCst);

    // Drop stream to stop recording
    let _ = state.stream.lock().unwrap().take();

    let raw_buffer = state.audio_buffer.lock().unwrap().clone();
    if raw_buffer.is_empty() {
        return Err("no audio data recorded".to_string());
    }

    let device_sr = *state.device_sample_rate.lock().unwrap();
    let device_ch = *state.device_channels.lock().unwrap();

    // Step 1: 多通道转 mono（取第一通道）
    let mono: Vec<f32> = if device_ch > 1 {
        raw_buffer
            .chunks(device_ch as usize)
            .map(|chunk| chunk[0])
            .collect()
    } else {
        raw_buffer
    };

    // Step 2: 重采样到 16kHz（线性插值）
    let target_sr = 16000u32;
    let resampled = if device_sr != target_sr {
        resample(&mono, device_sr, target_sr)
    } else {
        mono
    };

    // Step 3: f32 → i16
    let pcm_i16: Vec<i16> = resampled
        .iter()
        .map(|&s| {
            let clamped = s.clamp(-1.0, 1.0);
            (clamped * i16::MAX as f32) as i16
        })
        .collect();

    Ok(pcm_i16)
}

/// 取消录音：停止流、清空缓冲区，不返回数据
pub fn cancel_recording(state: &RecordingState) -> Result<(), String> {
    if !state.is_recording.load(Ordering::SeqCst) {
        // 不在录音状态，直接返回成功
        return Ok(());
    }

    state.is_recording.store(false, Ordering::SeqCst);

    // Drop stream to stop recording
    let _ = state.stream.lock().unwrap().take();

    // Clear buffer
    state.audio_buffer.lock().unwrap().clear();

    // Clean up RTASR state: drop sender to signal WS task to stop
    *state.rtasr_tx.lock().unwrap() = None;
    *state.rtasr_result.lock().unwrap() = None;
    // Abort the RTASR task if still running
    if let Some(handle) = state.rtasr_handle.lock().unwrap().take() {
        handle.abort();
    }

    Ok(())
}

/// 线性插值重采样
fn resample(input: &[f32], from_rate: u32, to_rate: u32) -> Vec<f32> {
    let ratio = from_rate as f64 / to_rate as f64;
    let output_len = (input.len() as f64 / ratio) as usize;
    let mut output = Vec::with_capacity(output_len);

    for i in 0..output_len {
        let src_idx = i as f64 * ratio;
        let idx_floor = src_idx.floor() as usize;
        let frac = (src_idx - idx_floor as f64) as f32;

        let sample = if idx_floor + 1 < input.len() {
            input[idx_floor] * (1.0 - frac) + input[idx_floor + 1] * frac
        } else if idx_floor < input.len() {
            input[idx_floor]
        } else {
            0.0
        };

        output.push(sample);
    }

    output
}

/// 将 PCM (16kHz, 16bit, mono) 编码为 MP3
pub fn encode_pcm_to_mp3(pcm_data: &[i16]) -> Result<Vec<u8>, String> {
    println!("[speech-eval] encoder: creating encoder (16kHz mono 64kbps)...");
    let config = Mp3EncoderConfig::new()
        .sample_rate(16000)
        .bitrate(64)
        .channels(1)
        .stereo_mode(StereoMode::Mono);

    println!("[speech-eval] encoder: encoding {} samples...", pcm_data.len());
    let mp3_data = shine_rs::encode_pcm_to_mp3(config, pcm_data)
        .map_err(|e| format!("mp3 encode error: {:?}", e))?;

    println!("[speech-eval] encoder: done, {} bytes", mp3_data.len());
    Ok(mp3_data)
}
