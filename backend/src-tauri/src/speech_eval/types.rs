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

#[allow(dead_code)]
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

#[allow(dead_code)]
#[derive(Deserialize, Debug)]
pub struct XfResponseResult {
    pub text: String,
    pub seq: Option<i32>,
    pub status: Option<i32>,
}

// === 解码后的评测结果（从 base64 text 解码） ===

#[allow(dead_code)]
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

// === 讯飞 API 配置（由前端通过命令参数传入） ===

pub struct XfConfig {
    pub app_id: String,
    pub api_key: String,
    pub api_secret: String,
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
