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

    encoder.encode_to_vec(input, &mut mp3_out)
        .map_err(|e| format!("encode error: {:?}", e))?;

    encoder.flush_to_vec::<FlushNoGap>(&mut mp3_out)
        .map_err(|e| format!("flush error: {:?}", e))?;

    Ok(mp3_out)
}
