/**
 * LM Studio LLM 提供者实现
 * @description LM Studio 使用 OpenAI 兼容 API
 */

import type {
  LLMProviderType,
  LocalLLMProvider,
  LocalModelInfo,
  PullProgress,
  ChatOptions,
  ChatResponse,
  StreamChunk,
  TokenUsage,
} from './types';
import { LLMError } from './types';

/**
 * LM Studio 配置
 */
export interface LMStudioConfig {
  /** 基础 URL（默认 http://localhost:1234） */
  baseUrl: string;
  /** 请求超时（毫秒） */
  timeout: number;
  /** 最大重试次数 */
  maxRetries: number;
}

/**
 * LM Studio 状态
 */
export interface LMStudioStatus {
  /** 是否运行中 */
  running: boolean;
  /** 版本号 */
  version?: string;
  /** 当前加载的模型 */
  loadedModel?: string;
  /** 已安装模型数量 */
  modelsCount: number;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: LMStudioConfig = {
  baseUrl: 'http://localhost:1234',
  timeout: 30000,
  maxRetries: 3,
};

/**
 * LM Studio Provider 实现
 */
export class LMStudioProvider implements LocalLLMProvider {
  readonly type: LLMProviderType = 'lm-studio';
  private config: LMStudioConfig;
  private abortControllers: Map<string, AbortController> = new Map();

  constructor(config: Partial<LMStudioConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 检查 LM Studio 是否可用
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.fetchWithRetry('/v1/models', {
        method: 'GET',
        timeout: 5000,
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 获取 LM Studio 状态
   */
  async getStatus(): Promise<LMStudioStatus> {
    try {
      const response = await this.fetchWithRetry('/v1/models');
      
      if (!response.ok) {
        return { running: false, modelsCount: 0 };
      }

      const data = await response.json();
      const models = data.data || [];

      return {
        running: true,
        version: 'LM Studio',
        loadedModel: models.length > 0 ? models[0].id : undefined,
        modelsCount: models.length,
      };
    } catch {
      return { running: false, modelsCount: 0 };
    }
  }

  /**
   * 列出可用模型
   */
  async listModels(): Promise<LocalModelInfo[]> {
    const response = await this.fetchWithRetry('/v1/models');

    if (!response.ok) {
      throw new LLMError('获取模型列表失败', 'CONNECTION_ERROR');
    }

    const data = await response.json();
    const models = data.data || [];

    return models.map((model: { id: string; created?: number; owned_by?: string }) => ({
      name: model.id,
      model: model.id,
      size: 0, // LM Studio API 不提供大小信息
      digest: '',
      modifiedAt: model.created 
        ? new Date(model.created * 1000).toISOString() 
        : new Date().toISOString(),
      details: {
        family: model.owned_by || 'unknown',
      },
    }));
  }

  /**
   * 下载模型（LM Studio 不支持通过 API 下载）
   */
  async pullModel(
    _modelName: string,
    _onProgress?: (progress: PullProgress) => void
  ): Promise<void> {
    throw new LLMError(
      'LM Studio 不支持通过 API 下载模型，请在 LM Studio 应用中手动下载',
      'INVALID_REQUEST'
    );
  }

  /**
   * 删除模型（LM Studio 不支持通过 API 删除）
   */
  async deleteModel(_modelName: string): Promise<void> {
    throw new LLMError(
      'LM Studio 不支持通过 API 删除模型，请在 LM Studio 应用中手动删除',
      'INVALID_REQUEST'
    );
  }

  /**
   * 聊天
   */
  async chat(options: ChatOptions): Promise<ChatResponse> {
    const requestId = crypto.randomUUID();
    const controller = new AbortController();
    this.abortControllers.set(requestId, controller);

    try {
      const response = await this.fetchWithRetry('/v1/chat/completions', {
        method: 'POST',
        body: JSON.stringify({
          model: options.model || 'local-model',
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
          top_p: options.topP,
          max_tokens: options.maxTokens,
          stop: options.stop,
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new LLMError(`聊天失败: ${error}`, 'GENERATION_ERROR');
      }

      const data = await response.json();
      const choice = data.choices?.[0];

      const usage: TokenUsage = {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      };

      return {
        content: choice?.message?.content || '',
        model: data.model || options.model || 'local-model',
        usage,
        finishReason: choice?.finish_reason === 'stop' ? 'stop' : 'length',
        message: {
          role: 'assistant',
          content: choice?.message?.content || '',
        },
      };
    } finally {
      this.abortControllers.delete(requestId);
    }
  }

  /**
   * 流式聊天
   */
  async *chatStream(options: ChatOptions): AsyncIterable<StreamChunk> {
    const requestId = crypto.randomUUID();
    const controller = new AbortController();
    this.abortControllers.set(requestId, controller);

    try {
      const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model || 'local-model',
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
          top_p: options.topP,
          max_tokens: options.maxTokens,
          stop: options.stop,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new LLMError(`流式聊天失败: ${error}`, 'GENERATION_ERROR');
      }

      if (!response.body) {
        throw new LLMError('响应体为空', 'GENERATION_ERROR');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          yield { content: '', done: true };
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;

          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const content = json.choices?.[0]?.delta?.content || '';

              if (content) {
                yield {
                  content,
                  done: false,
                  model: json.model,
                };
              }

              if (json.choices?.[0]?.finish_reason) {
                yield { content: '', done: true, model: json.model };
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      this.abortControllers.delete(requestId);
    }
  }

  /**
   * 文本嵌入
   */
  async embed(text: string, model?: string): Promise<number[]> {
    const response = await this.fetchWithRetry('/v1/embeddings', {
      method: 'POST',
      body: JSON.stringify({
        model: model || 'local-model',
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new LLMError(`嵌入失败: ${error}`, 'GENERATION_ERROR');
    }

    const data = await response.json();
    return data.data?.[0]?.embedding || [];
  }

  /**
   * 取消请求
   */
  cancel(requestId: string): void {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestId);
    }
  }

  /**
   * 取消所有请求
   */
  cancelAll(): void {
    for (const controller of this.abortControllers.values()) {
      controller.abort();
    }
    this.abortControllers.clear();
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<LMStudioConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前配置
   */
  getConfig(): LMStudioConfig {
    return { ...this.config };
  }

  /**
   * 带重试的 fetch
   */
  private async fetchWithRetry(
    path: string,
    options: RequestInit & { timeout?: number } = {}
  ): Promise<Response> {
    const { timeout = this.config.timeout, ...fetchOptions } = options;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(`${this.config.baseUrl}${path}`, {
          ...fetchOptions,
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
          signal: options.signal || controller.signal,
        });

        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        lastError = error as Error;

        if ((error as Error).name === 'AbortError') {
          throw new LLMError('请求超时', 'TIMEOUT');
        }

        // 等待后重试
        if (attempt < this.config.maxRetries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (attempt + 1))
          );
        }
      }
    }

    throw new LLMError(
      `连接 LM Studio 失败: ${lastError?.message}`,
      'CONNECTION_ERROR'
    );
  }
}

/**
 * 创建 LM Studio Provider 实例
 */
export function createLMStudioProvider(
  config?: Partial<LMStudioConfig>
): LMStudioProvider {
  return new LMStudioProvider(config);
}

/**
 * 默认 LM Studio Provider 实例
 */
let defaultProvider: LMStudioProvider | null = null;

/**
 * 获取默认 LM Studio Provider
 */
export function getDefaultLMStudioProvider(): LMStudioProvider {
  if (!defaultProvider) {
    defaultProvider = new LMStudioProvider();
  }
  return defaultProvider;
}
