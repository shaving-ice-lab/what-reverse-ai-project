/**
 * 本地 LLM 模块导出
 */

// 类型导出
export type {
  LLMProviderType,
  LocalModelInfo,
  ModelDetails,
  OllamaConfig,
  OllamaStatus,
  PullProgress,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  TokenUsage,
  StreamChunk,
  EmbedOptions,
  EmbedResponse,
  LocalLLMProvider,
  RecommendedModel,
  LLMErrorCode,
} from './types';

// 常量和工具函数导出
export { RECOMMENDED_MODELS, LLMError, formatBytes, parseModelSize } from './types';

// Ollama Provider 导出
export {
  OllamaProvider,
  createOllamaProvider,
  defaultOllamaProvider,
} from './ollama-provider';

// LM Studio Provider 导出
export type { LMStudioConfig, LMStudioStatus } from './lm-studio-provider';
export {
  LMStudioProvider,
  createLMStudioProvider,
  getDefaultLMStudioProvider,
} from './lm-studio-provider';
