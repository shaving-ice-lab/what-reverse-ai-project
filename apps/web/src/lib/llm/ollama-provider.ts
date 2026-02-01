/**
 * Ollama LLM 提供者实现
 * @description 用于与 Ollama 本地服务交互的客户端
 */

import type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  LocalLLMProvider,
  LocalModelInfo,
  LLMProviderType,
  OllamaConfig,
  OllamaStatus,
  PullProgress,
  StreamChunk,
} from './types';
import { LLMError } from './types';

/**
 * 默认配置
 */
const DEFAULT_CONFIG: OllamaConfig = {
  baseUrl: 'http://localhost:11434',
  timeout: 120000,
  maxRetries: 3,
};

/**
 * Ollama 原始响应类型
 */
interface OllamaTagsResponse {
  models: Array<{
    name: string;
    model: string;
    size: number;
    digest: string;
    modified_at: string;
    details?: {
      family?: string;
      parameter_size?: string;
      quantization_level?: string;
      format?: string;
    };
  }>;
}

interface OllamaChatResponse {
  model: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  done_reason?: string;
  total_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

interface OllamaPullResponse {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

interface OllamaEmbedResponse {
  embedding: number[];
}

/**
 * Ollama LLM 提供者
 */
export class OllamaProvider implements LocalLLMProvider {
  readonly type: LLMProviderType = 'ollama';
  private config: OllamaConfig;
  private abortControllers: Map<string, AbortController>;

  constructor(config: Partial<OllamaConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.abortControllers = new Map();
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<OllamaConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前配置
   */
  getConfig(): OllamaConfig {
    return { ...this.config };
  }

  /**
   * 检查 Ollama 是否可用
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 获取 Ollama 状态
   */
  async getStatus(): Promise<OllamaStatus> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data: OllamaTagsResponse = await response.json();
        return {
          running: true,
          modelsCount: data.models?.length ?? 0,
        };
      }

      return { running: false, modelsCount: 0 };
    } catch {
      return { running: false, modelsCount: 0 };
    }
  }

  /**
   * 列出可用模型
   */
  async listModels(): Promise<LocalModelInfo[]> {
    const response = await this.fetchWithRetry(`${this.config.baseUrl}/api/tags`);

    if (!response.ok) {
      throw new LLMError('无法获取模型列表', 'CONNECTION_ERROR');
    }

    const data: OllamaTagsResponse = await response.json();

    return (data.models || []).map((model) => ({
      name: model.name,
      model: model.model,
      size: model.size,
      digest: model.digest,
      modifiedAt: model.modified_at,
      details: model.details
        ? {
            family: model.details.family,
            parameterSize: model.details.parameter_size,
            quantizationLevel: model.details.quantization_level,
            format: model.details.format,
          }
        : undefined,
    }));
  }

  /**
   * 下载模型
   */
  async pullModel(
    modelName: string,
    onProgress?: (progress: PullProgress) => void
  ): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName, stream: true }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new LLMError(`下载模型失败: ${errorText}`, 'CONNECTION_ERROR');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new LLMError('无法读取响应', 'CONNECTION_ERROR');
    }

    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const progress: OllamaPullResponse = JSON.parse(line);
            onProgress?.({
              status: progress.status,
              completed: progress.completed,
              total: progress.total,
              digest: progress.digest,
            });
          } catch {
            // 忽略解析错误
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 删除模型
   */
  async deleteModel(modelName: string): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/api/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new LLMError(`删除模型失败: ${errorText}`, 'MODEL_NOT_FOUND');
    }
  }

  /**
   * 聊天
   */
  async chat(options: ChatOptions): Promise<ChatResponse> {
    const requestId = crypto.randomUUID();
    const abortController = new AbortController();
    this.abortControllers.set(requestId, abortController);

    try {
      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: options.model || 'llama3.2',
          messages: options.messages.map((m) => ({
            role: m.role,
            content: m.content,
            images: m.images,
          })),
          stream: false,
          options: {
            temperature: options.temperature ?? 0.7,
            num_predict: options.maxTokens ?? 2048,
            top_p: options.topP ?? 0.9,
            top_k: options.topK,
            stop: options.stop,
          },
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new LLMError(`聊天请求失败: ${errorText}`, 'GENERATION_ERROR');
      }

      const data: OllamaChatResponse = await response.json();

      return {
        content: data.message.content,
        model: data.model,
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
        finishReason: data.done_reason === 'length' ? 'length' : 'stop',
        message: {
          role: data.message.role as ChatMessage['role'],
          content: data.message.content,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new LLMError('请求已取消', 'CANCELLED');
      }
      throw error;
    } finally {
      this.abortControllers.delete(requestId);
    }
  }

  /**
   * 流式聊天
   */
  async *chatStream(options: ChatOptions): AsyncIterable<StreamChunk> {
    const requestId = crypto.randomUUID();
    const abortController = new AbortController();
    this.abortControllers.set(requestId, abortController);

    try {
      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: options.model || 'llama3.2',
          messages: options.messages.map((m) => ({
            role: m.role,
            content: m.content,
            images: m.images,
          })),
          stream: true,
          options: {
            temperature: options.temperature ?? 0.7,
            num_predict: options.maxTokens ?? 2048,
            top_p: options.topP ?? 0.9,
            top_k: options.topK,
          },
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new LLMError(`聊天请求失败: ${errorText}`, 'GENERATION_ERROR');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new LLMError('无法读取响应', 'CONNECTION_ERROR');
      }

      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const lines = decoder.decode(value).split('\n').filter(Boolean);
          for (const line of lines) {
            try {
              const data: OllamaChatResponse = JSON.parse(line);
              yield {
                content: data.message?.content || '',
                done: data.done,
                model: data.model,
              };
            } catch {
              // 忽略解析错误
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new LLMError('请求已取消', 'CANCELLED');
      }
      throw error;
    } finally {
      this.abortControllers.delete(requestId);
    }
  }

  /**
   * 文本嵌入
   */
  async embed(text: string, model: string = 'nomic-embed-text'): Promise<number[]> {
    const response = await fetch(`${this.config.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new LLMError(`嵌入请求失败: ${errorText}`, 'GENERATION_ERROR');
    }

    const data: OllamaEmbedResponse = await response.json();
    return data.embedding;
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
   * 带重试的 fetch
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retries: number = this.config.maxRetries
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(this.config.timeout),
        });
        return response;
      } catch (error) {
        lastError = error as Error;
        if (i < retries - 1) {
          // 指数退避
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }

    throw new LLMError(
      `请求失败 (重试 ${retries} 次): ${lastError?.message}`,
      'CONNECTION_ERROR'
    );
  }
}

/**
 * 创建 Ollama Provider 实例
 */
export function createOllamaProvider(config?: Partial<OllamaConfig>): OllamaProvider {
  return new OllamaProvider(config);
}

/**
 * 默认 Ollama Provider 实例
 */
export const defaultOllamaProvider = new OllamaProvider();
