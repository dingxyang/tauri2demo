/**
 * OpenAI API 服务模块
 */

import { OPENAI_MODEL, OPENAI_MAX_TOKENS, OPENAI_TEMPERATURE, OPENAI_SYSTEM_PROMPT,  } from "@/constant";

// API 配置
export const OPENAI_CONFIG = {
  MODEL: OPENAI_MODEL,
  MAX_TOKENS: OPENAI_MAX_TOKENS,
  TEMPERATURE: OPENAI_TEMPERATURE,
  SYSTEM_PROMPT: OPENAI_SYSTEM_PROMPT,
};

// API 错误类型
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// 检查 API 是否已配置

// 创建请求体
const createRequestBody = (text: string, stream: boolean = false) => ({
  model: OPENAI_CONFIG.MODEL,
  messages: [
    {
      role: "system",
      content: OPENAI_CONFIG.SYSTEM_PROMPT
    },
    {
      role: "user",
      content: text
    }
  ],
  max_tokens: OPENAI_CONFIG.MAX_TOKENS,
  temperature: OPENAI_CONFIG.TEMPERATURE,
  ...(stream && { stream: true })
});

// 处理 API 响应错误
const handleApiError = async (response: Response): Promise<never> => {
  const errorText = await response.text();
  const status = response.status;
  
  let message = "API 请求失败";
  let code = "UNKNOWN_ERROR";
  
  switch (status) {
    case 401:
      message = "API 密钥无效";
      code = "INVALID_API_KEY";
      break;
    case 403:
      message = "API 访问被拒绝";
      code = "ACCESS_DENIED";
      break;
    case 429:
      message = "请求过于频繁";
      code = "RATE_LIMIT";
      break;
    case 500:
      message = "服务器内部错误";
      code = "SERVER_ERROR";
      break;
    default:
      message = `请求失败 (${status})`;
  }
  
  throw new ApiError(`${message}: ${errorText}`, status, code);
};

// 流式调用 OpenAI API
export const callOpenAIStream = async (
  text: string, 
  onData: (chunk: string) => void,
  apiBaseUrl: string,
  apiKey: string,
): Promise<void> => {
  if (!apiKey) {
    throw new ApiError("请先配置 API 密钥", 0, "API_NOT_CONFIGURED");
  }

  try {
    const response = await fetch(apiBaseUrl+`/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(createRequestBody(text, true)),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    if (!response.body) {
      throw new ApiError("响应体为空", 0, "EMPTY_RESPONSE");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.trim() === '' || !line.startsWith('data: ')) continue;
          
          const data = line.slice(6).trim();
          if (data === '[DONE]') return;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            
            if (content) {
              onData(content);
            }
          } catch (parseError) {
            console.warn("解析数据块失败:", data);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError("网络连接失败", 0, "NETWORK_ERROR");
    }
    
    throw new ApiError(`未知错误: ${error instanceof Error ? error.message : String(error)}`, 0, "UNKNOWN_ERROR");
  }
};

// 非流式调用 OpenAI API
export const callOpenAI = async (text: string, apiBaseUrl: string, apiKey: string): Promise<string> => {
  if (!apiKey) {
    throw new ApiError("请先配置 API 密钥", 0, "API_NOT_CONFIGURED");
  }

  try {
    const response = await fetch(apiBaseUrl+`/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(createRequestBody(text, false)),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "未获取到有效响应";
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError("网络连接失败", 0, "NETWORK_ERROR");
    }
    
    throw new ApiError(`未知错误: ${error instanceof Error ? error.message : String(error)}`, 0, "UNKNOWN_ERROR");
  }
};
