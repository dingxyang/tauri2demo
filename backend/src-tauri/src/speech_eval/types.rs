use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    env, fs,
};

const XF_APP_ID_ENV: &str = "XF_APP_ID";
const XF_API_KEY_ENV: &str = "XF_API_KEY";
const XF_API_SECRET_ENV: &str = "XF_API_SECRET";
const XF_ENV_FILES: [&str; 4] = [
    ".env",
    ".env.local",
    "backend/src-tauri/.env",
    "backend/src-tauri/.env.local",
];

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

#[derive(Deserialize, Debug)]
pub struct XfResponseResult {
    pub text: String,
    pub seq: Option<i32>,
    pub status: Option<i32>,
}

// === 解码后的评测结果（从 base64 text 解码） ===

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

// === 讯飞 API 配置 ===

pub struct XfConfig {
    pub app_id: String,
    pub api_key: String,
    pub api_secret: String,
}

impl XfConfig {
    /// 优先读取进程环境变量；未设置时回退到本地 .env 配置文件。
    pub fn from_env() -> Result<Self, String> {
        let file_vars = load_env_file_candidates();
        let missing: Vec<&str> = [XF_APP_ID_ENV, XF_API_KEY_ENV, XF_API_SECRET_ENV]
            .into_iter()
            .filter(|key| resolve_config_value(key, &file_vars).is_none())
            .collect();

        if !missing.is_empty() {
            return Err(format!(
                "Missing speech eval config: {}. Set them as environment variables or in {}",
                missing.join(", "),
                XF_ENV_FILES.join(", ")
            ));
        }

        Ok(Self {
            app_id: resolve_config_value(XF_APP_ID_ENV, &file_vars).unwrap_or_default(),
            api_key: resolve_config_value(XF_API_KEY_ENV, &file_vars).unwrap_or_default(),
            api_secret: resolve_config_value(XF_API_SECRET_ENV, &file_vars).unwrap_or_default(),
        })
    }
}

fn load_env_file_candidates() -> HashMap<String, String> {
    let mut vars = HashMap::new();

    for path in XF_ENV_FILES {
        let Ok(content) = fs::read_to_string(path) else {
            continue;
        };

        for (key, value) in parse_env_content(&content) {
            vars.insert(key, value);
        }
    }

    vars
}

fn resolve_config_value(key: &str, file_vars: &HashMap<String, String>) -> Option<String> {
    env::var(key)
        .ok()
        .filter(|value| !value.trim().is_empty())
        .or_else(|| {
            file_vars
                .get(key)
                .cloned()
                .filter(|value| !value.trim().is_empty())
        })
}

fn parse_env_content(content: &str) -> Vec<(String, String)> {
    content.lines().filter_map(parse_env_line).collect()
}

fn parse_env_line(line: &str) -> Option<(String, String)> {
    let line = line.trim();
    if line.is_empty() || line.starts_with('#') {
        return None;
    }

    let line = line.strip_prefix("export ").unwrap_or(line);
    let (key, raw_value) = line.split_once('=')?;
    let key = key.trim();
    if key.is_empty() {
        return None;
    }

    let value = strip_inline_comment(raw_value.trim());
    let value = value.trim();
    let value = match (value.strip_prefix('"'), value.strip_suffix('"')) {
        (Some(stripped), Some(_)) if value.len() >= 2 => stripped[..stripped.len() - 1].to_string(),
        _ => match (value.strip_prefix('\''), value.strip_suffix('\'')) {
            (Some(stripped), Some(_)) if value.len() >= 2 => {
                stripped[..stripped.len() - 1].to_string()
            }
            _ => value.to_string(),
        },
    };

    Some((key.to_string(), value))
}

fn strip_inline_comment(value: &str) -> &str {
    let mut in_single = false;
    let mut in_double = false;
    let mut previous = None;

    for (index, ch) in value.char_indices() {
        match ch {
            '\'' if !in_double => in_single = !in_single,
            '"' if !in_single => in_double = !in_double,
            '#' if !in_single && !in_double && previous.is_none_or(char::is_whitespace) => {
                return value[..index].trim_end();
            }
            _ => {}
        }

        previous = Some(ch);
    }

    value
}

#[cfg(test)]
mod tests {
    use super::{parse_env_content, parse_env_line};

    #[test]
    fn parse_env_line_supports_quotes_and_comments() {
        let (key, value) = parse_env_line("XF_API_KEY=\"secret value\" # comment").unwrap();
        assert_eq!(key, "XF_API_KEY");
        assert_eq!(value, "secret value");
    }

    #[test]
    fn parse_env_content_ignores_blank_lines() {
        let items = parse_env_content("\n# comment\nXF_APP_ID=demo\n\nexport XF_API_SECRET='abc'\n");
        assert_eq!(items.len(), 2);
        assert_eq!(items[0], ("XF_APP_ID".to_string(), "demo".to_string()));
        assert_eq!(items[1], ("XF_API_SECRET".to_string(), "abc".to_string()));
    }
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
