/**
 * LM Studio LLM ProvideuserImplement
 * @description LM Studio Usage OpenAI Compatible API
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
 * LM Studio Config
 */
export interface LMStudioConfig {
 /** Basic URL(Default http://localhost:1234) */
 baseUrl: string;
 /** Request timeout(s) */
 timeout: number;
 /** MaximumRetrytimescount */
 maxRetries: number;
}

/**
 * LM Studio Status
 */
export interface LMStudioStatus {
 /** isnoRun */
 running: boolean;
 /** Version Number */
 version?: string;
 /** CurrentLoad'sModel */
 loadedModel?: string;
 /** alreadyInstallModelCount */
 modelsCount: number;
}

/**
 * DefaultConfig
 */
const DEFAULT_CONFIG: LMStudioConfig = {
 baseUrl: 'http://localhost:1234',
 timeout: 30000,
 maxRetries: 3,
};

/**
 * LM Studio Provider Implement
 */
export class LMStudioProvider implements LocalLLMProvider {
 readonly type: LLMProviderType = 'lm-studio';
 private config: LMStudioConfig;
 private abortControllers: Map<string, AbortController> = new Map();

 constructor(config: Partial<LMStudioConfig> = {}) {
 this.config = { ...DEFAULT_CONFIG, ...config };
 }

 /**
 * Check LM Studio isnoAvailable
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
 * Fetch LM Studio Status
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
 * ListAvailableModel
 */
 async listModels(): Promise<LocalModelInfo[]> {
 const response = await this.fetchWithRetry('/v1/models');

 if (!response.ok) {
 throw new LLMError('FetchModelListFailed', 'CONNECTION_ERROR');
 }

 const data = await response.json();
 const models = data.data || [];

 return models.map((model: { id: string; created?: number; owned_by?: string }) => ({
 name: model.id,
 model: model.id,
 size: 0, // LM Studio API notProvideSizeInfo
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
 * DownloadModel(LM Studio notSupportVia API Download)
 */
 async pullModel(
 _modelName: string,
 _onProgress?: (progress: PullProgress) => void
 ): Promise<void> {
 throw new LLMError(
 'LM Studio notSupportVia API DownloadModel, Pleaseat LM Studio AppManualDownload',
 'INVALID_REQUEST'
 );
 }

 /**
 * DeleteModel(LM Studio notSupportVia API Delete)
 */
 async deleteModel(_modelName: string): Promise<void> {
 throw new LLMError(
 'LM Studio notSupportVia API DeleteModel, Pleaseat LM Studio AppManualDelete',
 'INVALID_REQUEST'
 );
 }

 /**
 * Chat
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
 throw new LLMError(`ChatFailed: ${error}`, 'GENERATION_ERROR');
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
 * StreamingChat
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
 throw new LLMError(`StreamingChatFailed: ${error}`, 'GENERATION_ERROR');
 }

 if (!response.body) {
 throw new LLMError('ResponseasEmpty', 'GENERATION_ERROR');
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
 // IgnoreParseError
 }
 }
 }
 }
 } finally {
 this.abortControllers.delete(requestId);
 }
 }

 /**
 * TextEmbedding
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
 throw new LLMError(`EmbeddingFailed: ${error}`, 'GENERATION_ERROR');
 }

 const data = await response.json();
 return data.data?.[0]?.embedding || [];
 }

 /**
 * CancelRequest
 */
 cancel(requestId: string): void {
 const controller = this.abortControllers.get(requestId);
 if (controller) {
 controller.abort();
 this.abortControllers.delete(requestId);
 }
 }

 /**
 * CancelAllRequest
 */
 cancelAll(): void {
 for (const controller of this.abortControllers.values()) {
 controller.abort();
 }
 this.abortControllers.clear();
 }

 /**
 * UpdateConfig
 */
 updateConfig(config: Partial<LMStudioConfig>): void {
 this.config = { ...this.config, ...config };
 }

 /**
 * FetchCurrentConfig
 */
 getConfig(): LMStudioConfig {
 return { ...this.config };
 }

 /**
 * Retry's fetch
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
 throw new LLMError('Request timeout', 'TIMEOUT');
 }

 // etcpendingafterRetry
 if (attempt < this.config.maxRetries - 1) {
 await new Promise((resolve) =>
 setTimeout(resolve, 1000 * (attempt + 1))
 );
 }
 }
 }

 throw new LLMError(
 `Connect LM Studio Failed: ${lastError?.message}`,
 'CONNECTION_ERROR'
 );
 }
}

/**
 * Create LM Studio Provider Instance
 */
export function createLMStudioProvider(
 config?: Partial<LMStudioConfig>
): LMStudioProvider {
 return new LMStudioProvider(config);
}

/**
 * Default LM Studio Provider Instance
 */
let defaultProvider: LMStudioProvider | null = null;

/**
 * FetchDefault LM Studio Provider
 */
export function getDefaultLMStudioProvider(): LMStudioProvider {
 if (!defaultProvider) {
 defaultProvider = new LMStudioProvider();
 }
 return defaultProvider;
}
