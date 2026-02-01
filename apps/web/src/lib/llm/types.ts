/**
 * 本地 LLM 类型定义
 * @description 用于本地 LLM 集成的类型定义（Ollama/LM Studio 等）
 */

// ============================================================================
// 基础类型
// ============================================================================

/**
 * LLM 提供者类型
 */
export type LLMProviderType = 'ollama' | 'lm-studio' | 'llama-cpp';

/**
 * 本地模型信息
 */
export interface LocalModelInfo {
  /** 模型名称 */
  name: string;
  /** 模型标识 */
  model: string;
  /** 模型大小（字节） */
  size: number;
  /** 模型摘要 */
  digest: string;
  /** 修改时间 */
  modifiedAt: string;
  /** 详细信息 */
  details?: ModelDetails;
}

/**
 * 模型详细信息
 */
export interface ModelDetails {
  /** 模型家族 */
  family?: string;
  /** 参数规模 */
  parameterSize?: string;
  /** 量化级别 */
  quantizationLevel?: string;
  /** 格式 */
  format?: string;
}

// ============================================================================
// Ollama 相关类型
// ============================================================================

/**
 * Ollama 配置
 */
export interface OllamaConfig {
  /** 基础 URL */
  baseUrl: string;
  /** 请求超时（毫秒） */
  timeout: number;
  /** 最大重试次数 */
  maxRetries: number;
}

/**
 * Ollama 状态
 */
export interface OllamaStatus {
  /** 是否运行中 */
  running: boolean;
  /** 版本号 */
  version?: string;
  /** 已安装模型数量 */
  modelsCount: number;
}

/**
 * 拉取进度
 */
export interface PullProgress {
  /** 状态 */
  status: string;
  /** 摘要 */
  digest?: string;
  /** 总大小 */
  total?: number;
  /** 已完成大小 */
  completed?: number;
}

// ============================================================================
// 聊天相关类型
// ============================================================================

/**
 * 聊天消息
 */
export interface ChatMessage {
  /** 角色 */
  role: 'system' | 'user' | 'assistant';
  /** 内容 */
  content: string;
  /** 图片（可选，用于多模态） */
  images?: string[];
}

/**
 * 聊天选项
 */
export interface ChatOptions {
  /** 模型名称 */
  model?: string;
  /** 消息列表 */
  messages: ChatMessage[];
  /** 是否流式 */
  stream?: boolean;
  /** 温度（0-1） */
  temperature?: number;
  /** Top P 采样 */
  topP?: number;
  /** Top K 采样 */
  topK?: number;
  /** 最大生成 token 数 */
  maxTokens?: number;
  /** 停止词 */
  stop?: string[];
}

/**
 * 聊天响应
 */
export interface ChatResponse {
  /** 回复内容 */
  content: string;
  /** 使用的模型 */
  model: string;
  /** token 使用统计 */
  usage: TokenUsage;
  /** 完成原因 */
  finishReason: 'stop' | 'length' | 'error';
  /** 完整的原始消息 */
  message?: ChatMessage;
}

/**
 * Token 使用统计
 */
export interface TokenUsage {
  /** Prompt token 数 */
  promptTokens: number;
  /** 生成 token 数 */
  completionTokens: number;
  /** 总 token 数 */
  totalTokens: number;
}

/**
 * 流式输出块
 */
export interface StreamChunk {
  /** 内容片段 */
  content: string;
  /** 是否完成 */
  done: boolean;
  /** 模型名称 */
  model?: string;
}

// ============================================================================
// 嵌入相关类型
// ============================================================================

/**
 * 嵌入请求选项
 */
export interface EmbedOptions {
  /** 模型名称 */
  model?: string;
  /** 要嵌入的文本 */
  text: string;
}

/**
 * 嵌入响应
 */
export interface EmbedResponse {
  /** 嵌入向量 */
  embedding: number[];
  /** 模型名称 */
  model: string;
}

// ============================================================================
// Provider 接口
// ============================================================================

/**
 * 本地 LLM 提供者接口
 */
export interface LocalLLMProvider {
  /** 提供者类型 */
  readonly type: LLMProviderType;

  /** 检查服务是否可用 */
  isAvailable(): Promise<boolean>;

  /** 列出可用模型 */
  listModels(): Promise<LocalModelInfo[]>;

  /** 下载模型 */
  pullModel(modelName: string, onProgress?: (progress: PullProgress) => void): Promise<void>;

  /** 删除模型 */
  deleteModel(modelName: string): Promise<void>;

  /** 聊天 */
  chat(options: ChatOptions): Promise<ChatResponse>;

  /** 流式聊天 */
  chatStream(options: ChatOptions): AsyncIterable<StreamChunk>;

  /** 文本嵌入 */
  embed(text: string, model?: string): Promise<number[]>;

  /** 取消请求 */
  cancel(requestId: string): void;
}

// ============================================================================
// 推荐模型
// ============================================================================

/**
 * 推荐模型信息
 */
export interface RecommendedModel {
  /** 模型名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 大小（人类可读） */
  size: string;
  /** 能力标签 */
  capabilities: string[];
  /** 最小内存要求（GB） */
  minMemory?: number;
}

/**
 * 推荐模型列表
 */
export const RECOMMENDED_MODELS: RecommendedModel[] = [
  {
    name: 'llama3.2:latest',
    description: 'Meta 最新开源模型，平衡性能和效率',
    size: '2.0 GB',
    capabilities: ['聊天', '推理', '代码'],
    minMemory: 8,
  },
  {
    name: 'qwen2.5:7b',
    description: '阿里通义千问，中文能力强',
    size: '4.4 GB',
    capabilities: ['聊天', '中文', '代码'],
    minMemory: 8,
  },
  {
    name: 'deepseek-coder:6.7b',
    description: '专注代码生成的模型',
    size: '3.8 GB',
    capabilities: ['代码', '补全', '解释'],
    minMemory: 8,
  },
  {
    name: 'nomic-embed-text',
    description: '文本嵌入模型，用于语义搜索',
    size: '274 MB',
    capabilities: ['嵌入', '搜索'],
    minMemory: 4,
  },
  {
    name: 'phi3:mini',
    description: '微软 Phi-3 轻量模型',
    size: '2.3 GB',
    capabilities: ['聊天', '推理'],
    minMemory: 4,
  },
  {
    name: 'gemma2:2b',
    description: 'Google Gemma 2 轻量版',
    size: '1.6 GB',
    capabilities: ['聊天', '推理'],
    minMemory: 4,
  },
];

// ============================================================================
// 错误类型
// ============================================================================

/**
 * LLM 错误类型
 */
export class LLMError extends Error {
  constructor(
    message: string,
    public code: LLMErrorCode,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

/**
 * LLM 错误代码
 */
export type LLMErrorCode =
  | 'CONNECTION_ERROR'
  | 'MODEL_NOT_FOUND'
  | 'GENERATION_ERROR'
  | 'TIMEOUT'
  | 'CANCELLED'
  | 'INVALID_REQUEST'
  | 'RATE_LIMITED'
  | 'UNKNOWN';

// ============================================================================
// 工具函数类型
// ============================================================================

/**
 * 格式化字节数
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 解析模型名称获取参数规模
 */
export function parseModelSize(modelName: string): string | undefined {
  const match = modelName.match(/(\d+(?:\.\d+)?[bBmM])/);
  return match ? match[1].toUpperCase() : undefined;
}
