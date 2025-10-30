/**
 * OpenAI API 服务模块
 */

import { OPENAI_TEMPERATURE, ES_TO_CN_PROMPT, CN_TO_ES_PROMPT, DEEPSEEK_MODEL_V3, OPENAI_MODEL_GPT, DEEPSEEK_MODEL_V3_250324 } from "@/utils/constant";

// 请求类型枚举
export enum RequestType {
  CHAT = 'chat',           // AI对话
  ES_TO_CN = 'es_to_cn',   // 西语翻译成中文
  CN_TO_ES = 'cn_to_es'    // 中文翻译成西语
}

// 基础请求参数接口
export interface BaseRequestParams {
  text: string;
  model?: string;
  apiBaseUrl?: string;
  apiKey?: string;
  requestType?: RequestType;
  stream?: boolean;
  abortController?: AbortController;
}

// 流式请求参数接口
export interface StreamRequestParams extends BaseRequestParams {
  onData: (chunk: string) => void;
  abortController?: AbortController;
}

// API 配置
export const OPENAI_CONFIG = {
  TEMPERATURE: OPENAI_TEMPERATURE,
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

// 获取系统提示词
const getSystemPrompt = (requestType: RequestType, text: string): string => {
  switch (requestType) {
    case RequestType.ES_TO_CN:
      return ES_TO_CN_PROMPT.replace('{{text}}', text);
    case RequestType.CN_TO_ES:
      return CN_TO_ES_PROMPT.replace('{{text}}', text);
    case RequestType.CHAT:
    default:
      return ''; // AI对话不需要特定的系统提示词
  }
};

// 创建请求体
const createRequestBody = (params: BaseRequestParams) => {
  const { text, model, stream, requestType = RequestType.CHAT } = params;
  const systemPrompt = getSystemPrompt(requestType, text);
  const messages: Array<{role: string, content: string}> = [];
  
  // 如果有系统提示词，添加系统消息
  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt
    });
  }
  
  // 对于翻译请求，用户消息只包含要翻译的文本
  // 对于对话请求，用户消息就是原始文本
  const userContent = (requestType === RequestType.ES_TO_CN || requestType === RequestType.CN_TO_ES) 
    ? text 
    : text;
    
  messages.push({
    role: "user",
    content: userContent
  });

  return {
    model,
    messages,
    temperature: OPENAI_CONFIG.TEMPERATURE,
    ...(stream && { stream: true })
  };
};

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
export const callOpenAIStream = async (params: StreamRequestParams): Promise<void> => {
  const { text, onData, apiBaseUrl, apiKey, requestType = RequestType.CHAT, abortController } = params;
  
  if (!apiKey) {
    throw new ApiError("请先配置 API 密钥", 0, "API_NOT_CONFIGURED");
  }

  let model;
  // 如果包含 ark.cn 则使用 deepseek 模型
  if (apiBaseUrl.includes('ark.cn')) {
    model = DEEPSEEK_MODEL_V3_250324;
  } else if (apiBaseUrl.includes('api.openai.com')) {
    model = OPENAI_MODEL_GPT;
  } else {
    model = DEEPSEEK_MODEL_V3;
  }

  try {
    const response = await fetch(apiBaseUrl+`/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(createRequestBody({
          text, 
          model,
          requestType, 
          stream: true,
      })),
      signal: abortController?.signal,
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
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError("请求已被取消", 0, "REQUEST_ABORTED");
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError("网络连接失败", 0, "NETWORK_ERROR");
    }
    
    throw new ApiError(`未知错误: ${error instanceof Error ? error.message : String(error)}`, 0, "UNKNOWN_ERROR");
  }
};

// 非流式调用 OpenAI API
export const callOpenAI = async (params: BaseRequestParams): Promise<string> => {
  const { text, apiBaseUrl, apiKey, requestType = RequestType.CHAT, abortController } = params;
  
  if (!apiKey) {
    throw new ApiError("请先配置 API 密钥", 0, "API_NOT_CONFIGURED");
  }

  let model;
  // 如果包含 ark.cn 则使用 deepseek 模型, 如果是 openai.com 则使用 gpt-4o-mini 模型
  if (apiBaseUrl.includes('ark.cn')) {
    model = DEEPSEEK_MODEL_V3_250324;
  } else if (apiBaseUrl.includes('api.openai.com')) {
    model = OPENAI_MODEL_GPT;
  } else {
    model = DEEPSEEK_MODEL_V3;
  }

  try {
    const response = await fetch(apiBaseUrl+`/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(createRequestBody({
        text, 
        model,
        requestType, 
        stream: false,
      })),
      signal: abortController?.signal,
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
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError("请求已被取消", 0, "REQUEST_ABORTED");
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError("网络连接失败", 0, "NETWORK_ERROR");
    }
    
    throw new ApiError(`未知错误: ${error instanceof Error ? error.message : String(error)}`, 0, "UNKNOWN_ERROR");
  }
};
