/**
 * 错误处理工具模块
 */

import { ElMessage } from "element-plus";
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




// 错误信息映射
const ERROR_MESSAGES = {
  API_NOT_CONFIGURED: {
    title: "配置错误",
    message: "请先配置 OpenAI API 密钥",
    suggestion: "请在代码中设置有效的 API 密钥"
  },
  INVALID_API_KEY: {
    title: "API 密钥无效",
    message: "API 密钥验证失败",
    suggestion: "请检查 OpenAI API 密钥是否正确"
  },
  ACCESS_DENIED: {
    title: "API 访问被拒绝",
    message: "无权访问 API 服务",
    suggestion: "可能是 API 密钥权限不足或账户余额不足"
  },
  RATE_LIMIT: {
    title: "请求过于频繁",
    message: "API 调用频率超限",
    suggestion: "请稍后再试，或检查 API 使用限制"
  },
  NETWORK_ERROR: {
    title: "网络连接失败",
    message: "无法连接到服务器",
    suggestion: "请检查网络连接或防火墙设置。可能是 CORS 问题，建议使用代理服务器"
  },
  SERVER_ERROR: {
    title: "服务器错误",
    message: "服务器内部错误",
    suggestion: "服务器暂时不可用，请稍后重试"
  },
  EMPTY_RESPONSE: {
    title: "响应异常",
    message: "服务器响应为空",
    suggestion: "请重试或联系技术支持"
  },
  REQUEST_ABORTED: {
    title: "请求已取消",
    message: "用户主动取消了请求",
    suggestion: "如需继续，请重新发起请求"
  },
  UNKNOWN_ERROR: {
    title: "未知错误",
    message: "发生了未知错误",
    suggestion: "请稍后重试，如果问题持续存在请联系技术支持"
  }
};

// 错误处理结果
export interface ErrorHandleResult {
  title: string;
  message: string;
  suggestion: string;
  originalError: string;
}

/**
 * 统一错误处理函数
 * @param error 错误对象
 * @param showMessage 是否显示错误消息（默认为 true）
 * @returns 处理后的错误信息
 */
export const handleError = (error: unknown, showMessage: boolean = true): ErrorHandleResult => {
  let errorInfo: ErrorHandleResult;
  
  if (error instanceof ApiError) {
    // 处理 API 错误
    const errorConfig = ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.UNKNOWN_ERROR;
    errorInfo = {
      title: errorConfig.title,
      message: errorConfig.message,
      suggestion: errorConfig.suggestion,
      originalError: error.message
    };
  } else if (error instanceof Error) {
    // 处理普通错误
    let errorConfig = ERROR_MESSAGES.UNKNOWN_ERROR;
    
    // 根据错误消息匹配错误类型
    if (error.message.includes("CORS") || error.message.includes("fetch")) {
      errorConfig = ERROR_MESSAGES.NETWORK_ERROR;
    }
    
    errorInfo = {
      title: errorConfig.title,
      message: errorConfig.message,
      suggestion: errorConfig.suggestion,
      originalError: error.message
    };
  } else {
    // 处理未知类型错误
    const errorConfig = ERROR_MESSAGES.UNKNOWN_ERROR;
    errorInfo = {
      title: errorConfig.title,
      message: errorConfig.message,
      suggestion: errorConfig.suggestion,
      originalError: String(error)
    };
  }
  
  // 显示错误消息
  if (showMessage) {
    ElMessage.error(errorInfo.message);
  }
  
  // 打印详细错误信息到控制台
  console.error("错误处理详情:", {
    title: errorInfo.title,
    message: errorInfo.message,
    suggestion: errorInfo.suggestion,
    originalError: errorInfo.originalError,
    fullError: error
  });
  
  return errorInfo;
};

/**
 * 生成错误的 Markdown 内容
 * @param errorInfo 错误信息
 * @returns Markdown 格式的错误内容
 */
export const generateErrorMarkdown = (errorInfo: ErrorHandleResult): string => {
  return `**${errorInfo.title}**

${errorInfo.message}

**解决建议：**
${errorInfo.suggestion}

**错误详情：**
\`${errorInfo.originalError}\``;
};

/**
 * 简化的错误处理函数，直接返回用户友好的错误消息
 * @param error 错误对象
 * @returns 用户友好的错误消息
 */
export const getErrorMessage = (error: unknown): string => {
  const errorInfo = handleError(error, false);
  return errorInfo.message;
};




// 统一错误处理
export const handleAIRequestError = (error: unknown): never => {
  if (error instanceof ApiError) {
    throw error;
  }
  
  if (error instanceof DOMException && error.name === 'AbortError') {
    throw new ApiError("请求已被取消", 0, "REQUEST_ABORTED");
  }
  
  if (error instanceof Error) {
    if (error.message.includes('401')) {
      throw new ApiError("API 密钥无效", 401, "INVALID_API_KEY");
    } else if (error.message.includes('403')) {
      throw new ApiError("API 访问被拒绝", 403, "ACCESS_DENIED");
    } else if (error.message.includes('429')) {
      throw new ApiError("请求过于频繁", 429, "RATE_LIMIT");
    } else if (error.message.includes('500')) {
      throw new ApiError("服务器内部错误", 500, "SERVER_ERROR");
    } else if (error.message.includes('fetch')) {
      throw new ApiError("网络连接失败", 0, "NETWORK_ERROR");
    }
  }
  
  throw new ApiError(`未知错误: ${error instanceof Error ? error.message : String(error)}`, 0, "UNKNOWN_ERROR");
};