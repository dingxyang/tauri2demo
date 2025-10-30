/**
 * 翻译服务模块 - 基于 AIClientManager 的高性能实现
 */

import { aiClientManager, BaseRequestParams, StreamRequestParams } from './aiClientManager';
import { ApiError } from '@/utils/errorHandler';

/**
 * 验证客户端是否已初始化
 */
const validateClient = () => {
  if (!aiClientManager.isInitialized()) {
    throw new ApiError("AI客户端未初始化，请先配置API设置", 0, "CLIENT_NOT_INITIALIZED");
  }
};



/**
 * 流式调用 AI API
 * @param params 流式请求参数
 */
export const callOpenAIStream = async (params: StreamRequestParams): Promise<void> => {
  validateClient();
  
  console.log("translate callOpenAIStream", {
    requestType: params.requestType,
    textLength: params.text.length,
    providerType: aiClientManager.getProviderType()
  });

  return aiClientManager.callStream(params);
};

/**
 * 非流式调用 AI API
 * @param params 基础请求参数
 * @returns 响应文本
 */
export const callOpenAI = async (params: BaseRequestParams): Promise<string> => {
  validateClient();
  
  console.log("translate callOpenAI", {
    requestType: params.requestType,
    textLength: params.text.length,
    providerType: aiClientManager.getProviderType()
  });

  return aiClientManager.call(params);
};