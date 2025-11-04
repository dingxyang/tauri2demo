/**
 * AI 客户端管理器 - 支持多种 Provider 和调用时初始化
 */

import { streamText, generateText } from 'ai';
import { OPENAI_TEMPERATURE, ES_TO_CN_PROMPT, CN_TO_ES_PROMPT } from "@/utils/constant";
import { ApiError, handleAIRequestError } from '@/utils/errorHandler';
import { Provider, providers } from '@/utils/constant/providers';
import { getSettings } from '@/utils/localStorage';

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
  currentModelInfo: string; // 格式: "providerId/modelId"
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
 * 负责管理不同 Provider 的客户端实例，支持调用时初始化
 */
export class AIClientManager {
  private static instance: AIClientManager | null = null;
  private clientCache: Map<string, any> = new Map(); // 缓存已创建的客户端

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
   * 获取或创建客户端实例（调用时初始化）
   * @param config 客户端配置
   * @returns 客户端实例
   */
  private getOrCreateClient(config: AIClientConfig): any {
    // 生成缓存键
    const cacheKey = `${config.providerId}-${config.apiBaseUrl || ''}-${config.apiKey || ''}`;
    
    // 检查缓存
    if (this.clientCache.has(cacheKey)) {
      return this.clientCache.get(cacheKey);
    }
    
    // 获取提供商配置
    const provider = this.getProviderConfig(config.providerId);
    if (!provider) {
      throw new ApiError(`未找到提供商配置: ${config.providerId}`, 0, "PROVIDER_NOT_FOUND");
    }
    
    // 如果配置中没有提供API信息，使用提供商默认配置
    const apiBaseUrl = config.apiBaseUrl || provider.options?.baseURL || provider.api;
    const apiKey = config.apiKey || provider.options?.apiKey || '';
    
    if (!apiKey) {
      throw new ApiError("API密钥未配置", 0, "API_KEY_NOT_CONFIGURED");
    }
    
    // 创建客户端
    const client = this.createClient(provider, apiBaseUrl, apiKey);
    
    // 缓存客户端
    this.clientCache.set(cacheKey, client);
    
    console.log(`AI客户端已创建，Provider: ${provider.name}`);
    return client;
  }

  /**
   * 获取提供商配置
   * @param providerId 提供商ID
   * @returns 提供商配置
   */
  private getProviderConfig(providerId: string): Provider | null {
    // 直接从 localstorage 里面获取
    const settings = getSettings();
    let provider = providers[providerId];
    if (!provider) {
      console.error(`不支持提供商: ${providerId}`);
      return null;
    }
    if (settings) {
      const settingsData = JSON.parse(settings);
      if (settingsData.providers && settingsData.providers[providerId]) {
        return {
          ...provider,
          enabled: settingsData.providers[providerId].enabled,
          defaultModel: settingsData.providers[providerId].defaultModel,
          models: settingsData.providers[providerId].models,
          options: {
            baseURL: settingsData.providers[providerId].options.baseURL,
            apiKey: settingsData.providers[providerId].options.apiKey,
          },
        }
      }
    }
    return providers[providerId] || null;
  }

  /**
   * 创建客户端实例
   * @param provider 提供商配置
   * @param apiBaseUrl API基础URL
   * @param apiKey API密钥
   * @returns 客户端实例
   */
  private createClient(provider: Provider, apiBaseUrl: string, apiKey: string): any {
    if (!provider.creator) {
      throw new ApiError(`提供商 ${provider.id} 没有配置 creator 函数`, 0, "CREATOR_NOT_CONFIGURED");
    }

    const baseURL = apiBaseUrl?.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`;
    
    // 根据不同的提供商类型传递不同的参数
    switch (provider.id) {
      case 'openai-compatible':
        return provider.creator({
          name: provider.id,
          apiKey: apiKey,
          baseURL: baseURL,
        });
      default:
        return provider.creator({
          baseURL: baseURL,
          apiKey: apiKey,
        });
    }
  }

  /**
   * 验证模型ID
   * @param modelId 模型ID
   * @returns 模型名称
   */
  private validateModelId(modelId: string): string {
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
   * 解析当前模型信息并获取配置
   * @param currentModelInfo 格式: "providerId/modelId"
   * @returns 解析后的配置信息
   */
  private parseModelInfo(currentModelInfo: string) {
    if (!currentModelInfo) {
      throw new ApiError('请先选择一个模型', 0, "MODEL_NOT_SELECTED");
    }
    
    const [providerId, modelId] = currentModelInfo.split('/');
    if (!providerId || !modelId) {
      throw new ApiError('模型信息格式错误', 0, "INVALID_MODEL_FORMAT");
    }
    
    // 从本地缓存获取设置
    const settings = getSettings();
    if (!settings) {
      throw new ApiError('未找到设置信息，请先配置', 0, "SETTINGS_NOT_FOUND");
    }
    
    const settingsData = JSON.parse(settings);
    const providerConfig = settingsData.providers?.[providerId];
    if (!providerConfig) {
      throw new ApiError(`未找到提供商 ${providerId} 的配置`, 0, "PROVIDER_CONFIG_NOT_FOUND");
    }
    
    return {
      providerId,
      modelId,
      apiBaseUrl: providerConfig.options?.baseURL,
      apiKey: providerConfig.options?.apiKey
    };
  }

  /**
   * 验证请求参数
   * @param params 请求参数
   */
  private validateRequestParams(params: BaseRequestParams): void {
    if (!params.currentModelInfo) {
      throw new ApiError("模型信息未指定", 0, "MODEL_INFO_NOT_SPECIFIED");
    }
  }

  /**
   * 流式调用 AI API
   * @param params 请求参数
   */
  public async callStream(params: StreamRequestParams): Promise<void> {
    this.validateRequestParams(params);
    
    const { text, onData, currentModelInfo, requestType = RequestType.CHAT, abortController } = params;

    try {
      // 解析模型信息并获取配置
      const modelConfig = this.parseModelInfo(currentModelInfo);
      
      // 创建客户端配置
      const config: AIClientConfig = {
        providerId: modelConfig.providerId,
        modelId: modelConfig.modelId,
        apiBaseUrl: modelConfig.apiBaseUrl,
        apiKey: modelConfig.apiKey
      };
      
      // 获取或创建客户端
      const client = this.getOrCreateClient(config);
      const model = this.validateModelId(modelConfig.modelId);
      const messages = this.buildMessages(text, requestType);

      const result = await streamText({
        model: client(model),
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
    this.validateRequestParams(params);
    
    const { text, currentModelInfo, requestType = RequestType.CHAT, abortController } = params;

    try {
      // 解析模型信息并获取配置
      const modelConfig = this.parseModelInfo(currentModelInfo);
      
      // 创建客户端配置
      const config: AIClientConfig = {
        providerId: modelConfig.providerId,
        modelId: modelConfig.modelId,
        apiBaseUrl: modelConfig.apiBaseUrl,
        apiKey: modelConfig.apiKey
      };
      
      // 获取或创建客户端
      const client = this.getOrCreateClient(config);
      const model = this.validateModelId(modelConfig.modelId);
      const messages = this.buildMessages(text, requestType);

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
  }

  /**
   * 获取提供商信息
   * @param providerId 提供商ID
   * @returns 提供商配置
   */
  public getProvider(providerId: string): Provider | null {
    return this.getProviderConfig(providerId);
  }

  /**
   * 检查提供商是否可用
   * @param providerId 提供商ID
   * @returns 是否可用
   */
  public isProviderAvailable(providerId: string): boolean {
    const provider = this.getProviderConfig(providerId);
    return provider !== null && provider.enabled;
  }

  /**
   * 清除客户端缓存
   * @param providerId 可选的提供商ID，如果不提供则清除所有缓存
   */
  public clearCache(providerId?: string): void {
    if (providerId) {
      // 清除特定提供商的缓存
      const keysToDelete = Array.from(this.clientCache.keys()).filter(key => key.startsWith(`${providerId}-`));
      keysToDelete.forEach(key => this.clientCache.delete(key));
      console.log(`已清除提供商 ${providerId} 的客户端缓存`);
    } else {
      // 清除所有缓存
      this.clientCache.clear();
      console.log('已清除所有客户端缓存');
    }
  }

  /**
   * 获取缓存统计信息
   * @returns 缓存统计
   */
  public getCacheStats(): { totalCached: number; providers: string[] } {
    const providers = Array.from(new Set(
      Array.from(this.clientCache.keys()).map(key => key.split('-')[0])
    ));
    
    return {
      totalCached: this.clientCache.size,
      providers
    };
  }
}

// 导出单例实例
export const aiClientManager = AIClientManager.getInstance();
