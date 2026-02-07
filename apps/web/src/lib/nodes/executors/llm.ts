/**
 * LLM NodeExecute
 * Support OpenAI, Claude, LocalModeletc
 */

import type {
 NodeContext,
 NodeResult,
 NodeExecutor,
 LLMConfig,
 LLMMessage,
 LLMResponse,
 StreamCallback,
} from "../types";
import {
 renderTemplate,
 withRetry,
 withTimeout,
 createNodeError,
} from "../utils";

// LLM ProviderConfig
interface LLMProvider {
 name: string;
 baseUrl: string;
 models: string[];
 defaultHeaders?: Record<string, string>;
}

// inProvider
const PROVIDERS: Record<string, LLMProvider> = {
 openai: {
 name: "OpenAI",
 baseUrl: "https://api.openai.com/v1",
 models: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
 },
 anthropic: {
 name: "Anthropic",
 baseUrl: "https://api.anthropic.com/v1",
 models: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
 },
 local: {
 name: "Local",
 baseUrl: "http://localhost:11434/api",
 models: ["llama2", "mistral", "codellama"],
 },
};

/**
 * FetchModelforshould'sProvider
 */
function getProviderForModel(model: string): LLMProvider | null {
 for (const [key, provider] of Object.entries(PROVIDERS)) {
 if (provider.models.some((m) => model.toLowerCase().includes(m.toLowerCase()))) {
 return provider;
 }
 }
 // DefaultUsage OpenAI CompatibleInterface
 return PROVIDERS.openai;
}

/**
 * Build LLM Messagecountgroup
 */
function buildMessages(
 config: LLMConfig,
 variables: Record<string, unknown>,
 historyMessages?: LLMMessage[]
): LLMMessage[] {
 const messages: LLMMessage[] = [];
 
 // SystemTip
 if (config.systemPrompt) {
 const rendered = renderTemplate(config.systemPrompt, variables);
 messages.push({ role: "system", content: rendered });
 }
 
 // HistoryMessage
 if (historyMessages && historyMessages.length > 0) {
 messages.push(...historyMessages);
 }
 
 // UserTip
 if (config.userPrompt) {
 const rendered = renderTemplate(config.userPrompt, variables);
 messages.push({ role: "user", content: rendered });
 }
 
 return messages;
}

/**
 * Call OpenAI CompatibleInterface
 */
async function callOpenAICompatible(
 baseUrl: string,
 apiKey: string,
 model: string,
 messages: LLMMessage[],
 config: LLMConfig,
 abortSignal?: AbortSignal,
 onStream?: StreamCallback
): Promise<LLMResponse> {
 const requestBody = {
 model,
 messages,
 temperature: config.temperature ?? 0.7,
 max_tokens: config.maxTokens ?? 2048,
 top_p: config.topP ?? 1,
 frequency_penalty: config.frequencyPenalty ?? 0,
 presence_penalty: config.presencePenalty ?? 0,
 stream: config.streaming ?? false,
 };
 
 const response = await fetch(`${baseUrl}/chat/completions`, {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 Authorization: `Bearer ${apiKey}`,
 },
 body: JSON.stringify(requestBody),
 signal: abortSignal,
 });
 
 if (!response.ok) {
 const errorText = await response.text();
 throw new Error(`LLM API Error: ${response.status} - ${errorText}`);
 }
 
 // StreamingResponse
 if (config.streaming && response.body) {
 return handleStreamResponse(response.body, onStream);
 }
 
 // StreamingResponse
 const data = await response.json();
 const choice = data.choices?.[0];
 
 return {
 content: choice?.message?.content ?? "",
 finishReason: choice?.finish_reason,
 usage: {
 promptTokens: data.usage?.prompt_tokens ?? 0,
 completionTokens: data.usage?.completion_tokens ?? 0,
 totalTokens: data.usage?.total_tokens ?? 0,
 },
 raw: data,
 };
}

/**
 * ProcessStreamingResponse
 */
async function handleStreamResponse(
 body: ReadableStream<Uint8Array>,
 onStream?: StreamCallback
): Promise<LLMResponse> {
 const reader = body.getReader();
 const decoder = new TextDecoder();
 let content = "";
 let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
 
 try {
 while (true) {
 const { done, value } = await reader.read();
 
 if (done) {
 onStream?.("", true);
 break;
 }
 
 const chunk = decoder.decode(value, { stream: true });
 const lines = chunk.split("\n").filter((line) => line.trim() !== "");
 
 for (const line of lines) {
 if (line.startsWith("data: ")) {
 const data = line.slice(6);
 
 if (data === "[DONE]") {
 onStream?.("", true);
 continue;
 }
 
 try {
 const parsed = JSON.parse(data);
 const delta = parsed.choices?.[0]?.delta?.content;
 
 if (delta) {
 content += delta;
 onStream?.(delta, false);
 }
 
 // Update usage (ifresultProvide)
 if (parsed.usage) {
 usage = {
 promptTokens: parsed.usage.prompt_tokens ?? 0,
 completionTokens: parsed.usage.completion_tokens ?? 0,
 totalTokens: parsed.usage.total_tokens ?? 0,
 };
 }
 } catch {
 // SkipInvalid's JSON
 }
 }
 }
 }
 } finally {
 reader.releaseLock();
 }
 
 return {
 content,
 finishReason: "stop",
 usage,
 };
}

/**
 * LLM Chat NodeExecute
 */
export const llmChatExecutor: NodeExecutor<LLMConfig> = {
 type: "llm",
 
 async execute(context): Promise<NodeResult> {
 const { nodeConfig, variables, inputs, abortSignal } = context;
 const startTime = Date.now();
 const logs: NodeResult["logs"] = [];
 
 try {
 // Fetch API Key (fromEnvironmentVariableorConfig)
 const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || 
 (inputs.apiKey as string) || "";
 
 if (!apiKey) {
 return {
 success: false,
 outputs: {},
 error: createNodeError(
 "MISSING_API_KEY",
 "API Key is required for LLM calls",
 undefined,
 false
 ),
 };
 }
 
 // FetchProvider
 const provider = getProviderForModel(nodeConfig.model);
 if (!provider) {
 return {
 success: false,
 outputs: {},
 error: createNodeError(
 "UNSUPPORTED_MODEL",
 `Model ${nodeConfig.model} is not supported`,
 undefined,
 false
 ),
 };
 }
 
 // BuildMessage
 const historyMessages = inputs.messages as LLMMessage[] | undefined;
 const messages = buildMessages(nodeConfig, variables, historyMessages);
 
 logs.push({
 level: "info",
 message: `Calling ${provider.name} API with model ${nodeConfig.model}`,
 timestamp: new Date().toISOString(),
 data: { messagesCount: messages.length },
 });
 
 // ExecuteCall (RetryandTimeout)
 const timeout = nodeConfig.timeout ?? 60000;
 const retries = nodeConfig.retryCount ?? 0;
 const retryDelay = nodeConfig.retryDelay ?? 1000;
 
 const response = await withRetry(
 () =>
 withTimeout(
 () =>
 callOpenAICompatible(
 provider.baseUrl,
 apiKey,
 nodeConfig.model,
 messages,
 nodeConfig,
 abortSignal
 ),
 timeout,
 `LLM call timed out after ${timeout}ms`
 ),
 {
 retries,
 delay: retryDelay,
 onRetry: (error, attempt) => {
 logs.push({
 level: "warn",
 message: `Retry attempt ${attempt}: ${error.message}`,
 timestamp: new Date().toISOString(),
 });
 },
 }
 );
 
 const duration = Date.now() - startTime;
 
 logs.push({
 level: "info",
 message: `LLM call completed in ${duration}ms`,
 timestamp: new Date().toISOString(),
 data: { usage: response.usage },
 });
 
 return {
 success: true,
 outputs: {
 content: response.content,
 usage: response.usage,
 raw: response.raw,
 },
 logs,
 usage: {
 promptTokens: response.usage.promptTokens,
 completionTokens: response.usage.completionTokens,
 totalTokens: response.usage.totalTokens,
 },
 duration,
 };
 } catch (error) {
 const duration = Date.now() - startTime;
 const errorMessage = error instanceof Error ? error.message : "Unknown error";
 
 logs.push({
 level: "error",
 message: errorMessage,
 timestamp: new Date().toISOString(),
 });
 
 return {
 success: false,
 outputs: {},
 error: createNodeError(
 "LLM_CALL_FAILED",
 errorMessage,
 error,
 true
 ),
 logs,
 duration,
 };
 }
 },
 
 validate(config) {
 const errors: string[] = [];
 
 if (!config.model) {
 errors.push("Model is required");
 }
 
 if (config.temperature !== undefined) {
 if (config.temperature < 0 || config.temperature > 2) {
 errors.push("Temperature must be between 0 and 2");
 }
 }
 
 if (config.maxTokens !== undefined) {
 if (config.maxTokens < 1 || config.maxTokens > 128000) {
 errors.push("Max tokens must be between 1 and 128000");
 }
 }
 
 return {
 valid: errors.length === 0,
 errors,
 };
 },
};
