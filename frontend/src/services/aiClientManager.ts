/**
 * AI 客户端管理器 - 支持多种 Provider 和单例模式
 */

import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { streamText, generateText } from 'ai';
import { OPENAI_TEMPERATURE, ES_TO_CN_PROMPT, CN_TO_ES_PROMPT } from "@/utils/constant";
import { ApiError, handleAIRequestError } from '@/utils/errorHandler';
import { Provider, providers } from '@/utils/constant/providers';

// Provider 类型枚举 - 与providers.ts保持一致
export enum ProviderType {
  OPENAI = 'openai',                       // OpenAI 官方 API
  OPENAI_COMPATIBLE = 'openai-compatible', // OpenAI 兼容 API
  DEEPSEEK = 'deepseek',                   // DeepSeek API
  DOUBAO = 'doubao'                        // 火山引擎（豆包）API
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
  providerId: string;      // 提供商ID
  modelId: string;         // 模型ID
  apiBaseUrl?: string;     // API基础URL（可选，从provider配置获取）
  apiKey?: string;         // API密钥（可选，从provider配置获取）
  providerConfig?: Provider; // 完整的提供商配置
}

/**
 * AI 客户端管理器类
 * 负责管理不同 Provider 的客户端实例，支持单例模式
 */
export class AIClientManager {
  private static instance: AIClientManager | null = null;
  private client: any = null;
  private config: AIClientConfig | null = null;
  private currentProvider: Provider | null = null;

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
    
    // 获取提供商配置
    this.currentProvider = this.getProviderConfig(config.providerId);
    if (!this.currentProvider) {
      console.error(`未找到提供商配置: ${config.providerId}`);
      return
    }
    
    // 如果配置中没有提供API信息，使用提供商默认配置
    if (!config.apiBaseUrl) {
      config.apiBaseUrl = this.currentProvider.options?.baseURL || this.currentProvider.api;
    }
    if (!config.apiKey) {
      config.apiKey = this.currentProvider.options?.apiKey || '';
    }
    
    this.client = this.createClient();
    
    console.log(`AI客户端已初始化，Provider: ${this.currentProvider.name}`);
  }

  /**
   * 获取提供商配置
   * @param providerId 提供商ID
   * @returns 提供商配置
   */
  private getProviderConfig(providerId: string): Provider | null {
    return providers[providerId] || null;
  }

  /**
   * 创建客户端实例
   * @returns 客户端实例
   */
  private createClient() {
    if (!this.config || !this.currentProvider) {
      throw new ApiError("客户端配置未初始化", 0, "CLIENT_NOT_CONFIGURED");
    }

    const { apiBaseUrl, apiKey } = this.config;
    
    if (!apiKey) {
      throw new ApiError("API密钥未配置", 0, "API_KEY_NOT_CONFIGURED");
    }

    // 使用提供商配置中的creator函数创建客户端
    if (this.currentProvider.creator) {
      const baseURL = apiBaseUrl?.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`;
      
      // 根据不同的提供商类型传递不同的参数
      switch (this.currentProvider.id) {
        case 'openai-compatible' :
          return this.currentProvider.creator({
            name: this.currentProvider.id,
            apiKey: apiKey,
            baseURL: baseURL,
          });
        default:
          return this.currentProvider.creator({
            baseURL: baseURL,
            apiKey: apiKey,
          });
      }
    }
    
    // 如果没有creator函数，回退到默认的OpenAI兼容模式
    return createOpenAICompatible({
      name: this.currentProvider.id,
      baseURL: apiBaseUrl?.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`,
      apiKey: apiKey,
    });
  }

  /**
   * 获取模型名称
   * @returns 模型名称
   */
  private getModelName(): string {
    if (!this.config) {
      throw new ApiError("客户端配置未初始化", 0, "CLIENT_NOT_CONFIGURED");
    }

    const { modelId } = this.config;
    if (!modelId) {
      throw new ApiError("模型未选择", 0, "MODEL_NOT_SELECTED");
    }
    return modelId;
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
        providerId: this.currentProvider?.id, 
        modelId: this.config?.modelId,
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
        onFinish({ text, finishReason, usage, response, steps, totalUsage }) {
          console.log("onFinish", { text, finishReason, usage, response, steps, totalUsage });
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
   * 获取当前提供商信息
   * @returns 提供商配置
   */
  public getCurrentProvider(): Provider | null {
    return this.currentProvider;
  }

  /**
   * 获取当前提供商ID
   * @returns 提供商ID
   */
  public getProviderId(): string | null {
    return this.currentProvider?.id || null;
  }

  /**
   * 检查客户端是否已初始化
   * @returns 是否已初始化
   */
  public isInitialized(): boolean {
    return this.client !== null && this.config !== null;
  }

  /**
   * 动态切换模型
   * @param modelId 新的模型ID
   * @param providerId 提供商ID（可选）
   * @param providerConfig 提供商配置（可选，如果不提供则使用当前配置）
   */
  public switchModel(modelId: string, providerId?: string, providerConfig?: { apiBaseUrl: string; apiKey: string }): void {
    if (!this.config) {
      throw new ApiError("客户端配置未初始化", 0, "CLIENT_NOT_CONFIGURED");
    }

    // 如果提供了新的提供商ID，需要重新初始化
    if (providerId && providerId !== this.config.providerId) {
      const newConfig: AIClientConfig = {
        providerId,
        modelId,
        apiBaseUrl: providerConfig?.apiBaseUrl,
        apiKey: providerConfig?.apiKey
      };
      this.initialize(newConfig);
    } else {
      // 只是切换模型，不改变提供商
      this.config.modelId = modelId;
      
      // 如果提供了新的配置，更新配置
      if (providerConfig) {
        this.config.apiBaseUrl = providerConfig.apiBaseUrl;
        this.config.apiKey = providerConfig.apiKey;
        this.client = this.createClient();
      }
    }
    
    console.log(`模型已切换到: ${modelId}, Provider: ${this.currentProvider?.name}`);
  }

  /**
   * 获取当前使用的模型ID
   * @returns 当前模型ID
   */
  public getCurrentModel(): string | null {
    return this.config?.modelId || null;
  }

  /**
   * 重置客户端（用于测试或重新配置）
   */
  public reset(): void {
    this.client = null;
    this.config = null;
    this.currentProvider = null;
  }
}

// 导出单例实例
export const aiClientManager = AIClientManager.getInstance();
