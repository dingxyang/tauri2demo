/**
 * 翻译服务模块 - 基于 AIClientManager 的高性能实现
 */

import { aiClientManager, BaseRequestParams, StreamRequestParams } from './aiClientManager';

/**
 * 流式调用 AI API
 * @param params 流式请求参数
 */
export const callOpenAIStream = async (params: StreamRequestParams): Promise<void> => {
  return aiClientManager.callStream(params);
};

/**
 * 非流式调用 AI API
 * @param params 基础请求参数
 * @returns 响应文本
 */
export const callOpenAI = async (params: BaseRequestParams): Promise<string> => {
  return aiClientManager.call(params);
};