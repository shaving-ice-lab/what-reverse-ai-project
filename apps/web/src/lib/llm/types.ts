/**
 * Local LLM TypeDefinition
 * @description Type definitions for local LLM integration (Ollama/LM Studio, etc.)
 */

// ============================================================================
// BasicType
// ============================================================================

/**
 * LLM ProvideuserType
 */
export type LLMProviderType = 'ollama' | 'lm-studio' | 'llama-cpp'

/**
 * LocalModelInfo
 */
export interface LocalModelInfo {
  /** ModelName */
  name: string
  /** ModelIdentifier */
  model: string
  /** ModelSize(Bytes) */
  size: number
  /** ModelSummary */
  digest: string
  /** Modified At */
  modifiedAt: string
  /** DetailedInfo */
  details?: ModelDetails
}

/**
 * ModelDetailedInfo
 */
export interface ModelDetails {
  /** Model */
  family?: string
  /** ParameterScale */
  parameterSize?: string
  /** Level */
  quantizationLevel?: string
  /** Format */
  format?: string
}

// ============================================================================
// Ollama RelatedType
// ============================================================================

/**
 * Ollama Config
 */
export interface OllamaConfig {
  /** Basic URL */
  baseUrl: string
  /** Request timeout(s) */
  timeout: number
  /** MaximumRetrytimescount */
  maxRetries: number
}

/**
 * Ollama Status
 */
export interface OllamaStatus {
  /** Whether it is running */
  running: boolean
  /** Version Number */
  version?: string
  /** alreadyInstallModelCount */
  modelsCount: number
}

/**
 * PullProgress
 */
export interface PullProgress {
  /** Status */
  status: string
  /** Summary */
  digest?: string
  /** totalSize */
  total?: number
  /** CompletedSize */
  completed?: number
}

// ============================================================================
// ChatRelatedType
// ============================================================================

/**
 * ChatMessage
 */
export interface ChatMessage {
  /** Role */
  role: 'system' | 'user' | 'assistant'
  /** Content */
  content: string
  /** Image (optional, used for multiple modals) */
  images?: string[]
}

/**
 * ChatOption
 */
export interface ChatOptions {
  /** ModelName */
  model?: string
  /** MessageList */
  messages: ChatMessage[]
  /** Whether streaming is enabled */
  stream?: boolean
  /** Temperature(0-1) */
  temperature?: number
  /** Top P Sampling */
  topP?: number
  /** Top K Sampling */
  topK?: number
  /** MaximumGenerate token count */
  maxTokens?: number
  /** Stop */
  stop?: string[]
}

/**
 * ChatResponse
 */
export interface ChatResponse {
  /** ReplyContent */
  content: string
  /** Model used */
  model: string
  /** token UsageStatistics */
  usage: TokenUsage
  /** DoneReason */
  finishReason: 'stop' | 'length' | 'error'
  /** Complete original message */
  message?: ChatMessage
}

/**
 * Token UsageStatistics
 */
export interface TokenUsage {
  /** Prompt token count */
  promptTokens: number
  /** Generate token count */
  completionTokens: number
  /** total token count */
  totalTokens: number
}

/**
 * Streaming Outputblock
 */
export interface StreamChunk {
  /** ContentFragment */
  content: string
  /** Whether it is done */
  done: boolean
  /** ModelName */
  model?: string
}

// ============================================================================
// EmbeddingRelatedType
// ============================================================================

/**
 * EmbeddingRequestOption
 */
export interface EmbedOptions {
  /** ModelName */
  model?: string
  /** Text to be embedded */
  text: string
}

/**
 * EmbeddingResponse
 */
export interface EmbedResponse {
  /** EmbeddingVector */
  embedding: number[]
  /** ModelName */
  model: string
}

// ============================================================================
// Provider Interface
// ============================================================================

/**
 * Local LLM ProvideuserInterface
 */
export interface LocalLLMProvider {
  /** ProvideuserType */
  readonly type: LLMProviderType

  /** Check if the service is available */
  isAvailable(): Promise<boolean>

  /** ListAvailableModel */
  listModels(): Promise<LocalModelInfo[]>

  /** DownloadModel */
  pullModel(modelName: string, onProgress?: (progress: PullProgress) => void): Promise<void>

  /** DeleteModel */
  deleteModel(modelName: string): Promise<void>

  /** Chat */
  chat(options: ChatOptions): Promise<ChatResponse>

  /** StreamingChat */
  chatStream(options: ChatOptions): AsyncIterable<StreamChunk>

  /** TextEmbedding */
  embed(text: string, model?: string): Promise<number[]>

  /** CancelRequest */
  cancel(requestId: string): void
}

// ============================================================================
// RecommendedModel
// ============================================================================

/**
 * RecommendedModelInfo
 */
export interface RecommendedModel {
  /** ModelName */
  name: string
  /** Description */
  description: string
  /** Size (human readable) */
  size: string
  /** Capability tags */
  capabilities: string[]
  /** Minimum memory required (GB) */
  minMemory?: number
}

/**
 * RecommendedModelList
 */
export const RECOMMENDED_MODELS: RecommendedModel[] = [
  {
    name: 'llama3.2:latest',
    description: 'Meta latest open source model, balanced capability and speed',
    size: '2.0 GB',
    capabilities: ['Chat', 'Inference', 'Code'],
    minMemory: 8,
  },
  {
    name: 'qwen2.5:7b',
    description: 'Alibaba Tongyi Qianwen, powerful capabilities',
    size: '4.4 GB',
    capabilities: ['Chat', '', 'Code'],
    minMemory: 8,
  },
  {
    name: 'deepseek-coder:6.7b',
    description: 'Code generation focused model',
    size: '3.8 GB',
    capabilities: ['Code', 'all', 'Explain'],
    minMemory: 8,
  },
  {
    name: 'nomic-embed-text',
    description: 'Text embedding model, used for semantic search',
    size: '274 MB',
    capabilities: ['Embedding', 'Search'],
    minMemory: 4,
  },
  {
    name: 'phi3:mini',
    description: 'Microsoft Phi-3 Model',
    size: '2.3 GB',
    capabilities: ['Chat', 'Inference'],
    minMemory: 4,
  },
  {
    name: 'gemma2:2b',
    description: 'Google Gemma 2 version',
    size: '1.6 GB',
    capabilities: ['Chat', 'Inference'],
    minMemory: 4,
  },
]

// ============================================================================
// ErrorType
// ============================================================================

/**
 * LLM ErrorType
 */
export class LLMError extends Error {
  constructor(
    message: string,
    public code: LLMErrorCode,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'LLMError'
  }
}

/**
 * LLM ErrorCode
 */
export type LLMErrorCode =
  | 'CONNECTION_ERROR'
  | 'MODEL_NOT_FOUND'
  | 'GENERATION_ERROR'
  | 'TIMEOUT'
  | 'CANCELLED'
  | 'INVALID_REQUEST'
  | 'RATE_LIMITED'
  | 'UNKNOWN'

// ============================================================================
// ToolcountType
// ============================================================================

/**
 * Format Bytes Count
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + '' + sizes[i]
}

/**
 * ParseModelNameFetchParameterScale
 */
export function parseModelSize(modelName: string): string | undefined {
  const match = modelName.match(/(\d+(?:\.\d+)?[bBmM])/)
  return match ? match[1].toUpperCase() : undefined
}
