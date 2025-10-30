/**
 * OpenAI API 服务模块
 */

import { OPENAI_TEMPERATURE } from "@/utils/constant";
import { BaseRequestParams, buildMessages, getModelName, RequestType, StreamRequestParams, validateParams } from "./translate";
import { ApiError, handleAIRequestError } from "@/utils/errorHandler";


// 创建请求体
const createRequestBody = (params: BaseRequestParams) => {
  const { text, model, stream, requestType = RequestType.CHAT } = params;
  const messages = buildMessages(text, requestType);

  return {
    model,
    messages,
    temperature: OPENAI_TEMPERATURE,
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
  
  validateParams(apiKey, apiBaseUrl);

  const model = getModelName(apiBaseUrl!);

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
    handleAIRequestError(error);
  }
};

// 非流式调用 OpenAI API
export const callOpenAI = async (params: BaseRequestParams): Promise<string> => {
  const { text, apiBaseUrl, apiKey, requestType = RequestType.CHAT, abortController } = params;

  validateParams(apiKey, apiBaseUrl);

  const model = getModelName(apiBaseUrl!);

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
    handleAIRequestError(error);
  }
};
