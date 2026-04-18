use base64::Engine;
use base64::engine::general_purpose::STANDARD as BASE64;
use chrono::Utc;
use hmac::{Hmac, Mac};
use sha2::Sha256;
use url::form_urlencoded;

type HmacSha256 = Hmac<Sha256>;

/// 生成讯飞 WebSocket 鉴权 URL
pub fn build_auth_url(host: &str, path: &str, api_key: &str, api_secret: &str) -> String {
    // Step 1: 生成 RFC1123 格式的 UTC 时间
    let date = Utc::now().format("%a, %d %b %Y %H:%M:%S GMT").to_string();

    // Step 2: 构建签名原文
    let signature_origin = format!(
        "host: {}\ndate: {}\nGET {} HTTP/1.1",
        host, date, path
    );

    // Step 3: HMAC-SHA256 签名
    let mut mac = HmacSha256::new_from_slice(api_secret.as_bytes())
        .expect("HMAC key length is always valid");
    mac.update(signature_origin.as_bytes());
    let signature = BASE64.encode(mac.finalize().into_bytes());

    // Step 4: 构建 authorization_origin
    let authorization_origin = format!(
        r#"api_key="{}", algorithm="hmac-sha256", headers="host date request-line", signature="{}""#,
        api_key, signature
    );

    // Step 5: base64 编码得到最终 authorization
    let authorization = BASE64.encode(authorization_origin.as_bytes());

    // Step 6: 拼接完整 URL
    let encoded_date: String = form_urlencoded::Serializer::new(String::new())
        .append_pair("date", &date)
        .finish();
    let encoded_date = &encoded_date["date=".len()..];

    format!(
        "wss://{}{}?host={}&date={}&authorization={}",
        host, path, host, encoded_date, authorization
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_auth_url_format() {
        let url = build_auth_url(
            "cn-east-1.ws-api.xf-yun.com",
            "/v1/private/s8e098720",
            "test_api_key",
            "test_api_secret",
        );
        assert!(url.starts_with("wss://cn-east-1.ws-api.xf-yun.com/v1/private/s8e098720?"));
        assert!(url.contains("host=cn-east-1.ws-api.xf-yun.com"));
        assert!(url.contains("date="));
        assert!(url.contains("authorization="));
    }

    #[test]
    fn test_build_auth_url_authorization_is_valid_base64() {
        let url = build_auth_url(
            "cn-east-1.ws-api.xf-yun.com",
            "/v1/private/s8e098720",
            "test_key",
            "test_secret",
        );
        let auth_param = url.split("authorization=").nth(1).unwrap();
        let decoded = BASE64.decode(auth_param);
        assert!(decoded.is_ok(), "authorization should be valid base64");
        let decoded_str = String::from_utf8(decoded.unwrap()).unwrap();
        assert!(decoded_str.contains("api_key=\"test_key\""));
        assert!(decoded_str.contains("algorithm=\"hmac-sha256\""));
        assert!(decoded_str.contains("headers=\"host date request-line\""));
        assert!(decoded_str.contains("signature=\""));
    }
}
