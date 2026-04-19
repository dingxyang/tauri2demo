use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::Stream;
use mp3lame_encoder::{Builder, FlushNoGap, MonoPcm};
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
        }
    }
}

/// 开始录音：使用设备默认配置启动 cpal 输入流，将原始 f32 数据写入 buffer
pub fn start_recording(state: &RecordingState) -> Result<(), String> {
    if state.is_recording.load(Ordering::SeqCst) {
        return Err("already recording".to_string());
    }

    // 清空上次的录音数据
    state.audio_buffer.lock().unwrap().clear();

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

    let stream = device
        .build_input_stream(
            &config,
            move |data: &[f32], _: &cpal::InputCallbackInfo| {
                if is_recording.load(Ordering::SeqCst) {
                    buffer.lock().unwrap().extend_from_slice(data);
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
    println!("[speech-eval] encoder: creating builder...");
    let mut encoder = Builder::new()
        .ok_or("failed to create mp3 encoder (Builder::new returned None)")?;

    println!("[speech-eval] encoder: setting channels=1, sample_rate=16000");
    encoder.set_num_channels(1)
        .map_err(|e| format!("set channels error: {:?}", e))?;
    encoder.set_sample_rate(16000)
        .map_err(|e| format!("set sample rate error: {:?}", e))?;
    encoder.set_quality(mp3lame_encoder::Quality::Best)
        .map_err(|e| format!("set quality error: {:?}", e))?;

    println!("[speech-eval] encoder: building...");
    let mut encoder = encoder.build()
        .map_err(|e| format!("build encoder error: {:?}", e))?;

    println!("[speech-eval] encoder: encoding {} samples...", pcm_data.len());
    let input = MonoPcm(pcm_data);
    let mut mp3_out = Vec::with_capacity(mp3lame_encoder::max_required_buffer_size(pcm_data.len()));

    encoder.encode_to_vec(input, &mut mp3_out)
        .map_err(|e| format!("encode error: {:?}", e))?;

    println!("[speech-eval] encoder: flushing...");
    mp3_out.reserve(mp3lame_encoder::max_required_buffer_size(0));
    encoder.flush_to_vec::<FlushNoGap>(&mut mp3_out)
        .map_err(|e| format!("flush error: {:?}", e))?;

    println!("[speech-eval] encoder: done, {} bytes", mp3_out.len());
    Ok(mp3_out)
}
