/**
 * LM Studio LLM Provider Implementation
 * @description LM Studio uses OpenAI-compatible API
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
} from './types'
import { LLMError } from './types'

/**
 * LM Studio Config
 */
export interface LMStudioConfig {
  /** Base URL (default: http://localhost:1234) */
  baseUrl: string
  /** Request timeout (ms) */
  timeout: number
  /** Maximum retry count */
  maxRetries: number
}

/**
 * LM Studio Status
 */
export interface LMStudioStatus {
  /** Whether running */
  running: boolean
  /** Version number */
  version?: string
  /** Currently loaded model */
  loadedModel?: string
  /** Installed model count */
  modelsCount: number
}

/**
 * Default Config
 */
const DEFAULT_CONFIG: LMStudioConfig = {
  baseUrl: 'http://localhost:1234',
  timeout: 30000,
  maxRetries: 3,
}

/**
 * LM Studio Provider Implementation
 */
export class LMStudioProvider implements LocalLLMProvider {
  readonly type: LLMProviderType = 'lm-studio'
  private config: LMStudioConfig
  private abortControllers: Map<string, AbortController> = new Map()

  constructor(config: Partial<LMStudioConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Check if LM Studio is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.fetchWithRetry('/v1/models', {
        method: 'GET',
        timeout: 5000,
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Fetch LM Studio Status
   */
  async getStatus(): Promise<LMStudioStatus> {
    try {
      const response = await this.fetchWithRetry('/v1/models')

      if (!response.ok) {
        return { running: false, modelsCount: 0 }
      }

      const data = await response.json()
      const models = data.data || []

      return {
        running: true,
        version: 'LM Studio',
        loadedModel: models.length > 0 ? models[0].id : undefined,
        modelsCount: models.length,
      }
    } catch {
      return { running: false, modelsCount: 0 }
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<LocalModelInfo[]> {
    const response = await this.fetchWithRetry('/v1/models')

    if (!response.ok) {
      throw new LLMError('Failed to fetch model list', 'CONNECTION_ERROR')
    }

    const data = await response.json()
    const models = data.data || []

    return models.map((model: { id: string; created?: number; owned_by?: string }) => ({
      name: model.id,
      model: model.id,
      size: 0, // LM Studio API does not provide size info
      digest: '',
      modifiedAt: model.created
        ? new Date(model.created * 1000).toISOString()
        : new Date().toISOString(),
      details: {
        family: model.owned_by || 'unknown',
      },
    }))
  }

  /**
   * Download model (LM Studio does not support downloading via API)
   */
  async pullModel(
    _modelName: string,
    _onProgress?: (progress: PullProgress) => void
  ): Promise<void> {
    throw new LLMError(
      'LM Studio does not support downloading models via API. Please download manually in the LM Studio app.',
      'INVALID_REQUEST'
    )
  }

  /**
   * Delete model (LM Studio does not support deleting via API)
   */
  async deleteModel(_modelName: string): Promise<void> {
    throw new LLMError(
      'LM Studio does not support deleting models via API. Please delete manually in the LM Studio app.',
      'INVALID_REQUEST'
    )
  }

  /**
   * Chat
   */
  async chat(options: ChatOptions): Promise<ChatResponse> {
    const requestId = crypto.randomUUID()
    const controller = new AbortController()
    this.abortControllers.set(requestId, controller)

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
      })

      if (!response.ok) {
        const error = await response.text()
        throw new LLMError(`Chat failed: ${error}`, 'GENERATION_ERROR')
      }

      const data = await response.json()
      const choice = data.choices?.[0]

      const usage: TokenUsage = {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      }

      return {
        content: choice?.message?.content || '',
        model: data.model || options.model || 'local-model',
        usage,
        finishReason: choice?.finish_reason === 'stop' ? 'stop' : 'length',
        message: {
          role: 'assistant',
          content: choice?.message?.content || '',
        },
      }
    } finally {
      this.abortControllers.delete(requestId)
    }
  }

  /**
   * Streaming chat
   */
  async *chatStream(options: ChatOptions): AsyncIterable<StreamChunk> {
    const requestId = crypto.randomUUID()
    const controller = new AbortController()
    this.abortControllers.set(requestId, controller)

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
      })

      if (!response.ok) {
        const error = await response.text()
        throw new LLMError(`Streaming chat failed: ${error}`, 'GENERATION_ERROR')
      }

      if (!response.body) {
        throw new LLMError('Response body is empty', 'GENERATION_ERROR')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          yield { content: '', done: true }
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed === 'data: [DONE]') continue

          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.slice(6))
              const content = json.choices?.[0]?.delta?.content || ''

              if (content) {
                yield {
                  content,
                  done: false,
                  model: json.model,
                }
              }

              if (json.choices?.[0]?.finish_reason) {
                yield { content: '', done: true, model: json.model }
              }
            } catch {
              // Ignore parse error
            }
          }
        }
      }
    } finally {
      this.abortControllers.delete(requestId)
    }
  }

  /**
   * Text embedding
   */
  async embed(text: string, model?: string): Promise<number[]> {
    const response = await this.fetchWithRetry('/v1/embeddings', {
      method: 'POST',
      body: JSON.stringify({
        model: model || 'local-model',
        input: text,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new LLMError(`Embedding failed: ${error}`, 'GENERATION_ERROR')
    }

    const data = await response.json()
    return data.data?.[0]?.embedding || []
  }

  /**
   * Cancel request
   */
  cancel(requestId: string): void {
    const controller = this.abortControllers.get(requestId)
    if (controller) {
      controller.abort()
      this.abortControllers.delete(requestId)
    }
  }

  /**
   * Cancel all requests
   */
  cancelAll(): void {
    for (const controller of this.abortControllers.values()) {
      controller.abort()
    }
    this.abortControllers.clear()
  }

  /**
   * Update config
   */
  updateConfig(config: Partial<LMStudioConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current config
   */
  getConfig(): LMStudioConfig {
    return { ...this.config }
  }

  /**
   * Fetch with retry
   */
  private async fetchWithRetry(
    path: string,
    options: RequestInit & { timeout?: number } = {}
  ): Promise<Response> {
    const { timeout = this.config.timeout, ...fetchOptions } = options
    let lastError: Error | null = null

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(`${this.config.baseUrl}${path}`, {
          ...fetchOptions,
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
          signal: options.signal || controller.signal,
        })

        clearTimeout(timeoutId)
        return response
      } catch (error) {
        lastError = error as Error

        if ((error as Error).name === 'AbortError') {
          throw new LLMError('Request timeout', 'TIMEOUT')
        }

        // Wait before retrying
        if (attempt < this.config.maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
        }
      }
    }

    throw new LLMError(`Failed to connect to LM Studio: ${lastError?.message}`, 'CONNECTION_ERROR')
  }
}

/**
 * Create LM Studio provider instance
 */
export function createLMStudioProvider(config?: Partial<LMStudioConfig>): LMStudioProvider {
  return new LMStudioProvider(config)
}

/**
 * Default LM Studio provider instance
 */
let defaultProvider: LMStudioProvider | null = null

/**
 * Get default LM Studio provider
 */
export function getDefaultLMStudioProvider(): LMStudioProvider {
  if (!defaultProvider) {
    defaultProvider = new LMStudioProvider()
  }
  return defaultProvider
}
