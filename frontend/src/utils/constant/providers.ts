/**
 * AI提供商配置常量
 */

import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenAI } from "@ai-sdk/openai";
import { Model, models } from "./model";

// 提供商接口定义
export interface Provider {
  id: string;
  name: string;
  api: string;
  env?: string[];
  doc?: string;
  enabled: boolean;
  available?: boolean; // 是否测试通过
  defaultModel: string;
  models: Record<string, Omit<Model, 'id' | 'cost'>>;
  creator?: (config: any) => any;
  options?: {
    baseURL?: string;
    apiKey?: string;
  };
}

// 提供商配置映射
export interface ProvidersMap {
  [key: string]: Provider;
}

/**
 * 获取提供商的Base URL
 */
export function getProviderBaseURL(provider: Provider): string {
  if (provider.options?.baseURL) {
    return provider.options.baseURL;
  }

  return provider.api;
}

/**
 * 获取提供商的API Key
 */
export function getProviderApiKey(provider: Provider): string {
  if (provider.options?.apiKey) {
    return provider.options.apiKey;
  }
  return '';
}

/**
 * 默认提供商配置
 */
export const providers: ProvidersMap = {
  "doubao": {
    id: "doubao",
    name: '火山引擎（豆包）',
    api: "https://ark.cn-beijing.volces.com/api/v3",
    doc: 'https://www.volcengine.com/docs/82379',
    enabled: true,
    defaultModel: 'deepseek-v3-250324',
    creator: createOpenAICompatible,
    models: {
      'deepseek-v3-250324': models['deepseek-v3-0324'],
      'deepseek-v3-1-250821': models['deepseek-v3-1'],
      'kimi-k2-250905': models['kimi-k2-0905'],
    },
    options: {
      baseURL: "https://ark.cn-beijing.volces.com/api/v3",
      apiKey: "",
    },
  },
  "deepseek": {
    id: "deepseek",
    name: 'DeepSeek',
    api: "https://api.deepseek.com/v1",
    doc: 'https://platform.deepseek.com/api-docs/pricing',
    enabled: false,
    defaultModel: 'deepseek-chat',
    creator: createDeepSeek,
    models: {
      'deepseek-chat': models['deepseek-v3-2-exp'],
      'deepseek-reasoner': models['deepseek-r1-0528'],
    },
    options: {
      baseURL: "https://api.deepseek.com/v1",
      apiKey: "",
    },
  },
  "openai-compatible": {
    id: "openai-compatible",
    name: '自定义提供商',
    api: "",
    enabled: false,
    creator: createOpenAICompatible,
    defaultModel: "",
    models: {},
    options: {
      baseURL: "",
      apiKey: "",
    },
  },
  "openai": {
    id: "openai",
    name: 'OpenAI 官方',
    api: "https://api.openai.com/v1",
    doc: 'https://platform.openai.com/docs/models',
    enabled: false,
    defaultModel: 'gpt-3.5-turbo',
    creator: createOpenAI,
    models: {
      'gpt-4.1': models['gpt-4.1'],
      'gpt-4': models['gpt-4'],
      'gpt-4o': models['gpt-4o'],
      o3: models['o3'],
      'o3-mini': models['o3-mini'],
      'o4-mini': models['o4-mini'],
      'gpt-5': models['gpt-5'],
      'gpt-5-mini': models['gpt-5-mini'],
    },
    options: {
      baseURL: "https://api.openai.com/v1",
      apiKey: "",
    },
  },
};

/**
 * 获取启用的提供商列表
 */
export function getEnabledProviders(providers: ProvidersMap): Provider[] {
  return Object.values(providers).filter(provider => provider.enabled);
}

/**
 * 获取第一个启用的提供商
 */
export function getFirstEnabledProvider(providers: ProvidersMap): Provider | null {
  const enabledProviders = getEnabledProviders(providers);
  return enabledProviders.length > 0 ? enabledProviders[0] : null;
}

/**
 * 创建提供商配置的深拷贝
 */
export function createProviderConfig(baseConfig: ProvidersMap = providers): ProvidersMap {
  return JSON.parse(JSON.stringify(baseConfig));
}
