/**
 * AI 客户端管理器 - 支持多种 Provider 和单例模式
 */

import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText, generateText } from 'ai';
import { OPENAI_TEMPERATURE, ES_TO_CN_PROMPT, CN_TO_ES_PROMPT } from "@/utils/constant";
import { SYSTEM_MODELS, SystemProvider } from '@/utils/constant/model';
import { ApiError, handleAIRequestError } from '@/utils/errorHandler';

// Provider 类型枚举
export enum ProviderType {
  OPENAI_OFFICIAL = 'openai_official',    // OpenAI 官方 API
  OPENAI_COMPATIBLE = 'openai_compatible' // OpenAI 兼容 API
}

// 请求类型枚举
export enum RequestType {
  CHAT = 'chat',           // AI对话
  ES_TO_CN = 'es_to_cn',   // 西语翻译成中文
  CN_TO_ES = 'cn_to_es'    // 中文翻译成西语
}

// 基础请求参数接口
export interface BaseRequestParams {
  text: string;
  requestType?: RequestType;
  stream?: boolean;
  abortController?: AbortController;
}

// 流式请求参数接口
export interface StreamRequestParams extends BaseRequestParams {
  onData: (chunk: string) => void;
}

// AI 客户端配置接口
export interface AIClientConfig {
  apiBaseUrl: string;
  apiKey: string;
  providerType?: ProviderType;
}

/**
 * AI 客户端管理器类
 * 负责管理不同 Provider 的客户端实例，支持单例模式
 */
export class AIClientManager {
  private static instance: AIClientManager | null = null;
  private client: any = null;
  private config: AIClientConfig | null = null;
  private providerType: ProviderType = ProviderType.OPENAI_COMPATIBLE;

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): AIClientManager {
    if (!AIClientManager.instance) {
      AIClientManager.instance = new AIClientManager();
    }
    return AIClientManager.instance;
  }

  /**
   * 初始化客户端
   * @param config 客户端配置
   */
  public initialize(config: AIClientConfig): void {
    this.config = config;
    this.providerType = this.detectProviderType(config.apiBaseUrl);
    this.client = this.createClient();
    
    console.log(`AI客户端已初始化，Provider类型: ${this.providerType}`);
  }

  /**
   * 检测 Provider 类型
   * @param apiBaseUrl API 基础URL
   * @returns Provider 类型
   */
  private detectProviderType(apiBaseUrl: string): ProviderType {
    if (apiBaseUrl.includes('api.openai.com')) {
      return ProviderType.OPENAI_OFFICIAL;
    }
    return ProviderType.OPENAI_COMPATIBLE;
  }

  /**
   * 创建客户端实例
   * @returns 客户端实例
   */
  private createClient() {
    if (!this.config) {
      throw new ApiError("客户端配置未初始化", 0, "CLIENT_NOT_CONFIGURED");
    }

    const { apiBaseUrl, apiKey } = this.config;

    switch (this.providerType) {
      case ProviderType.OPENAI_OFFICIAL:
        return createOpenAI({
          apiKey: apiKey,
          baseURL: apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`,
        });

      case ProviderType.OPENAI_COMPATIBLE:
      default:
        return createOpenAICompatible({
          name: 'openai-compatible',
          baseURL: apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`,
          apiKey: apiKey,
        });
    }
  }

  /**
   * 获取模型名称
   * @returns 模型名称
   */
  private getModelName(): string {
    if (!this.config) {
      throw new ApiError("客户端配置未初始化", 0, "CLIENT_NOT_CONFIGURED");
    }

    const { apiBaseUrl } = this.config;
    
    if (apiBaseUrl.includes('ark.cn-beijing.volces.com')) {
      return SYSTEM_MODELS[SystemProvider.doubao][0].id;
    } else if (apiBaseUrl.includes('api.openai.com')) {
      return SYSTEM_MODELS[SystemProvider.openai][0].id;
    } else {
      return SYSTEM_MODELS[SystemProvider.defaultprovider][0].id;
    }
  }

  /**
   * 获取系统提示词
   * @param requestType 请求类型
   * @param text 输入文本
   * @returns 系统提示词
   */
  private getSystemPrompt(requestType: RequestType, text: string): string {
    switch (requestType) {
      case RequestType.ES_TO_CN:
        return ES_TO_CN_PROMPT.replace('{{text}}', text);
      case RequestType.CN_TO_ES:
        return CN_TO_ES_PROMPT.replace('{{text}}', text);
      case RequestType.CHAT:
      default:
        return '';
    }
  }

  /**
   * 构建消息数组
   * @param text 输入文本
   * @param requestType 请求类型
   * @returns 消息数组
   */
  private buildMessages(text: string, requestType: RequestType) {
    const systemPrompt = this.getSystemPrompt(requestType, text);
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
  }

  /**
   * 验证客户端是否已初始化
   */
  private validateClient(): void {
    if (!this.client || !this.config) {
      throw new ApiError("AI客户端未初始化，请先配置API设置", 0, "CLIENT_NOT_INITIALIZED");
    }
  }

  /**
   * 流式调用 AI API
   * @param params 请求参数
   */
  public async callStream(params: StreamRequestParams): Promise<void> {
    this.validateClient();
    
    const { text, onData, requestType = RequestType.CHAT, abortController } = params;

    console.log("AIClientManager callStream", { 
      providerType: this.providerType, 
      requestType,
      textLength: text.length 
    });

    try {
      const model = this.getModelName();
      const messages = this.buildMessages(text, requestType);

      const result = await streamText({
        model: this.client(model),
        messages,
        temperature: OPENAI_TEMPERATURE,
        abortSignal: abortController?.signal,
        onError: (error) => {
           handleAIRequestError(error?.error || error);
        },
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
  }

  /**
   * 非流式调用 AI API
   * @param params 请求参数
   * @returns 响应文本
   */
  public async call(params: BaseRequestParams): Promise<string> {
    this.validateClient();
    
    const { text, requestType = RequestType.CHAT, abortController } = params;

    try {
      const model = this.getModelName();
      const messages = this.buildMessages(text, requestType);

      const result = await generateText({
        model: this.client(model),
        messages,
        temperature: OPENAI_TEMPERATURE,
        abortSignal: abortController?.signal,
      });

      return result.text || "未获取到有效响应";
    } catch (error) {
      handleAIRequestError(error);
    }
  }

  /**
   * 获取当前配置信息
   * @returns 当前配置
   */
  public getConfig(): AIClientConfig | null {
    return this.config;
  }

  /**
   * 获取当前 Provider 类型
   * @returns Provider 类型
   */
  public getProviderType(): ProviderType {
    return this.providerType;
  }

  /**
   * 检查客户端是否已初始化
   * @returns 是否已初始化
   */
  public isInitialized(): boolean {
    return this.client !== null && this.config !== null;
  }

  /**
   * 重置客户端（用于测试或重新配置）
   */
  public reset(): void {
    this.client = null;
    this.config = null;
    this.providerType = ProviderType.OPENAI_COMPATIBLE;
  }
}

// 导出单例实例
export const aiClientManager = AIClientManager.getInstance();
