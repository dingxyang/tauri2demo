/**
 * 基于 @ai-sdk/openai-compatible 的翻译服务模块
 */

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText, generateText } from 'ai';
import { OPENAI_TEMPERATURE, ES_TO_CN_PROMPT, CN_TO_ES_PROMPT, } from "@/utils/constant";
import { SYSTEM_MODELS, SystemProvider } from '@/utils/constant/model';
import { ApiError, handleAIRequestError } from '@/utils/errorHandler';

// 重新导出请求类型枚举
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
}

// 获取系统提示词
const getSystemPrompt = (requestType: RequestType, text: string): string => {
  switch (requestType) {
    case RequestType.ES_TO_CN:
      return ES_TO_CN_PROMPT.replace('{{text}}', text);
    case RequestType.CN_TO_ES:
      return CN_TO_ES_PROMPT.replace('{{text}}', text);
    case RequestType.CHAT:
    default:
      return '';
  }
};

// 获取模型名称
export const getModelName = (apiBaseUrl: string): string => {
  if (apiBaseUrl.includes('ark.cn-beijing.volces.com')) {
    return SYSTEM_MODELS[SystemProvider.doubao][0].id;
  } else if (apiBaseUrl.includes('api.openai.com')) {
    return SYSTEM_MODELS[SystemProvider.openai][0].id;
  } else {
    return SYSTEM_MODELS[SystemProvider.defaultprovider][0].id;
  }
};

// 创建 OpenAI 兼容客户端
const createClient = (apiBaseUrl: string, apiKey: string) => {
  return createOpenAICompatible({
    name: 'openai-compatible',
    baseURL: apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`,
    apiKey: apiKey,
  });
};

// 验证参数
export const validateParams = (apiKey?: string, apiBaseUrl?: string) => {
  if (!apiKey) {
    throw new ApiError("请先配置 API 密钥", 0, "API_NOT_CONFIGURED");
  }
  if (!apiBaseUrl) {
    throw new ApiError("请先配置 API 基础URL", 0, "API_BASE_URL_NOT_CONFIGURED");
  }
};

// 构建消息数组
export const buildMessages = (text: string, requestType: RequestType) => {
  const systemPrompt = getSystemPrompt(requestType, text);
  const messages: Array<{role: 'system' | 'user', content: string}> = [];
  
  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt
    });
  }
  
  messages.push({
    role: "user",
    content: text
  });

  return messages;
};



// 流式调用 OpenAI API
export const callOpenAIStream = async (params: StreamRequestParams): Promise<void> => {
  const { text, onData, apiBaseUrl, apiKey, requestType = RequestType.CHAT, abortController } = params;
  
  validateParams(apiKey, apiBaseUrl);

  console.log("translate callOpenAIStream", params);

  try {
    const client = createClient(apiBaseUrl!, apiKey!);
    const model = getModelName(apiBaseUrl!);
    const messages = buildMessages(text, requestType);

    const result = await streamText({
      model: client(model),
      messages,
      temperature: OPENAI_TEMPERATURE,
      abortSignal: abortController?.signal,
    });

    for await (const textPart of result.textStream) {
      if (abortController?.signal.aborted) {
        throw new ApiError("请求已被取消", 0, "REQUEST_ABORTED");
      }
      onData(textPart);
    }
  } catch (error) {
    handleAIRequestError(error);
  }
};

// 非流式调用 OpenAI API
export const callOpenAI = async (params: BaseRequestParams): Promise<string> => {
  const { text, apiBaseUrl, apiKey, requestType = RequestType.CHAT, abortController } = params;
  
  validateParams(apiKey, apiBaseUrl);

  try {
    const client = createClient(apiBaseUrl!, apiKey!);
    const model = getModelName(apiBaseUrl!);
    const messages = buildMessages(text, requestType);

    const result = await generateText({
      model: client(model),
      messages,
      temperature: OPENAI_TEMPERATURE,
      abortSignal: abortController?.signal,
    });

    return result.text || "未获取到有效响应";
  } catch (error) {
    handleAIRequestError(error);
  }
};