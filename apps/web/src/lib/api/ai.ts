/**
 * AI Assistant API Service
 */

import { request, API_BASE_URL } from "./shared";

// ===== TypeDefinition =====

export interface ChatMessage {
 role: "user" | "assistant" | "system";
 content: string;
}

export interface ChatAction {
 type: "generate" | "modify" | "modify_app" | "explain" | "suggest";
 label: string;
 data?: Record<string, unknown>;
}

export interface ChatResponse {
 message: string;
 workflowJson?: string;
 uiSchema?: Record<string, unknown>;
 dbSchema?: Record<string, unknown>;
 suggestions?: string[];
 actions?: ChatAction[];
}

export interface AIChatRequest {
 sessionId?: string;
 message: string;
}

export interface AIChatResponse {
 sessionId: string;
 response: ChatResponse;
}

export interface GenerationPreferences {
 preferredProvider?: string;
 preferredModel?: string;
 useLocalModels?: boolean;
 complexity?: "simple" | "medium" | "complex";
}

export interface GenerateWorkflowRequest {
 description: string;
 conversationHistory?: ChatMessage[];
 preferences?: GenerationPreferences;
}

export interface NodeExplanation {
 nodeId: string;
 nodeType: string;
 nodeName: string;
 description: string;
 purpose: string;
}

export interface GenerateWorkflowResponse {
 workflowJson: string;
 explanation: string;
 nodeExplanations: NodeExplanation[];
 suggestions?: string[];
 confidence: number;
}

export interface IntentResult {
 intent: string;
 entities: Record<string, unknown>;
 confidence: number;
 suggestedNodeTypes: string[];
 needsClarification: boolean;
 clarificationQuestion?: string;
}

export interface NodeSuggestion {
 nodeType: string;
 nodeName: string;
 description: string;
 config: Record<string, unknown>;
 confidence: number;
 reason: string;
}

export interface FixSuggestion {
 problem: string;
 solution: string;
 fixedConfig?: Record<string, unknown>;
 confidence: number;
}

// ===== ChatRequest(SupportConversationHistoryandStreamingResponse) =====

export interface ConversationChatRequest {
 conversationId: string;
 message: string;
 model?: string;
 systemPrompt?: string;
 stream?: boolean;
}

export interface ConversationChatResponse {
 messageId: string;
 content: string;
 model: string;
 tokenUsage: number;
 promptTokens: number;
 completionTokens: number;
}

/**
 * AI Assistant API
 */
export const aiApi = {
 /**
 * AI Conversation(Simple, NoneConversationHistorySave)
 */
 async chat(data: AIChatRequest): Promise<AIChatResponse> {
 const response = await request<AIChatResponse>(
 `${API_BASE_URL}/ai/chat`,
 {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 session_id: data.sessionId,
 message: data.message,
 }),
 }
 );
 
 return response;
 },

 /**
 * GenerateWorkflow
 */
 async generateWorkflow(data: GenerateWorkflowRequest): Promise<GenerateWorkflowResponse> {
 const response = await request<GenerateWorkflowResponse>(
 `${API_BASE_URL}/ai/generate-workflow`,
 {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 description: data.description,
 conversation_history: data.conversationHistory,
 preferences: data.preferences,
 }),
 }
 );
 
 return response;
 },

 /**
 * Parse
 */
 async parseIntent(message: string): Promise<IntentResult> {
 const response = await request<IntentResult>(
 `${API_BASE_URL}/ai/parse-intent`,
 {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ message }),
 }
 );
 
 return response;
 },

 /**
 * Suggestiondown1Node
 */
 async suggestNextNode(workflowJson: string, currentNodeId: string): Promise<NodeSuggestion[]> {
 const response = await request<{ suggestions: NodeSuggestion[] }>(
 `${API_BASE_URL}/ai/suggest-next-node`,
 {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 workflow_json: workflowJson,
 current_node_id: currentNodeId,
 }),
 }
 );
 
 return response.suggestions;
 },

 /**
 * SuggestionNodeConfig
 */
 async suggestConfig(nodeType: string, context?: string): Promise<Record<string, unknown>> {
 const response = await request<{ config: Record<string, unknown> }>(
 `${API_BASE_URL}/ai/suggest-config`,
 {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 node_type: nodeType,
 context,
 }),
 }
 );
 
 return response.config;
 },

 /**
 * SuggestionFixPlan
 */
 async suggestFix(errorMessage: string, nodeJson?: string): Promise<FixSuggestion> {
 const response = await request<FixSuggestion>(
 `${API_BASE_URL}/ai/suggest-fix`,
 {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 error_message: errorMessage,
 node_json: nodeJson,
 }),
 }
 );
 
 return response;
 },
};

/**
 * StreamingChat - SendMessageandFetchStreamingResponse
 * Usage Server-Sent Events (SSE)
 */
export async function* streamChat(
 conversationId: string,
 message: string,
 options?: {
 model?: string;
 systemPrompt?: string;
 signal?: AbortSignal;
 }
): AsyncGenerator<string, void, unknown> {
 const { getStoredTokens } = await import("./shared");
 const tokens = getStoredTokens();
 
 const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/chat/stream`, {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 ...(tokens?.accessToken && { Authorization: `Bearer ${tokens.accessToken}` }),
 },
 body: JSON.stringify({
 message,
 model: options?.model,
 system_prompt: options?.systemPrompt,
 }),
 signal: options?.signal,
 });

 if (!response.ok) {
 throw new Error(`Chat failed: ${response.statusText}`);
 }

 const reader = response.body?.getReader();
 if (!reader) {
 throw new Error("No response body");
 }

 const decoder = new TextDecoder();
 let buffer = "";

 try {
 while (true) {
 const { done, value } = await reader.read();
 if (done) break;

 buffer += decoder.decode(value, { stream: true });
 const lines = buffer.split("\n");
 buffer = lines.pop() || "";

 for (const line of lines) {
 if (line.startsWith("data: ")) {
 const data = line.slice(6);
 if (data === "[DONE]") {
 return;
 }
 try {
 const parsed = JSON.parse(data);
 if (parsed.content) {
 yield parsed.content;
 }
 } catch {
 // ifresultnotis JSON, DirectOutput
 yield data;
 }
 }
 }
 }
 } finally {
 reader.releaseLock();
 }
}
