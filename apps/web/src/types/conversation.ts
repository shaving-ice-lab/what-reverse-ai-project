/**
 * ConversationRelatedTypeDefinition
 */

// ===== MessageRole =====
export type MessageRole = "user" | "assistant" | "system";

// ===== MessageAttachmentType =====
export interface MessageAttachment {
 id: string;
 type: "image" | "file" | "code";
 name: string;
 url: string;
 size: number;
 mimeType: string;
}

// ===== Message =====
export interface Message {
 id: string;
 conversationId: string;
 role: MessageRole;
 content: string;
 model?: string;
 tokenUsage: number;
 promptTokens: number;
 completionTokens: number;
 attachments?: MessageAttachment[];
 metadata?: Record<string, unknown>;
 parentId?: string;
 // UserFeedback
 liked?: boolean;
 disliked?: boolean;
 bookmarked?: boolean;
 createdAt: string;
 updatedAt: string;
}

// ===== AI ParameterSettings =====
export interface AIParameters {
 temperature?: number; // 0.0-2.0, Default 1.0
 maxTokens?: number; // MaximumGenerate token count
 topP?: number; // 0.0-1.0
 topK?: number; // Top-K Sampling
 frequencyPenalty?: number; // -2.0-2.0
 presencePenalty?: number; // -2.0-2.0
}

// ===== Conversation =====
export interface Conversation extends AIParameters {
 id: string;
 userId: string;
 workspaceId?: string;
 title: string;
 preview: string;
 model: string;
 systemPrompt?: string;
 starred: boolean;
 pinned: boolean;
 archived: boolean;
 messageCount: number;
 tokenUsage: number;
 folderId?: string;
 metadata?: Record<string, unknown>;
 tags: string[];
 createdAt: string;
 updatedAt: string;
 messages?: Message[];
 folder?: ConversationFolder;
}

// ===== ConversationFolder =====
export interface ConversationFolder {
 id: string;
 userId: string;
 name: string;
 icon: string;
 color: string;
 parentId?: string;
 sortOrder: number;
 conversationCount: number;
 createdAt: string;
 updatedAt: string;
}

// ===== RequestType =====

export interface CreateConversationRequest extends AIParameters {
 workspaceId: string;
 title: string;
 model?: string;
 systemPrompt?: string;
 folderId?: string;
 tags?: string[];
}

export interface UpdateConversationRequest extends AIParameters {
 title?: string;
 model?: string;
 systemPrompt?: string;
 folderId?: string;
}

export interface ListConversationsParams {
 workspaceId?: string;
 folderId?: string;
 starred?: boolean;
 pinned?: boolean;
 archived?: boolean;
 search?: string;
 page?: number;
 pageSize?: number;
 orderBy?: string;
}

export interface AddMessageRequest {
 role: MessageRole;
 content: string;
 model?: string;
 tokenUsage?: number;
 promptTokens?: number;
 completionTokens?: number;
 parentId?: string; // Reply/use'sMessage ID
}

export interface ListMessagesParams {
 page?: number;
 pageSize?: number;
 beforeId?: string;
 afterId?: string;
}

export interface BatchOperationRequest {
 ids: string[];
}

export interface BatchStarRequest {
 ids: string[];
 starred: boolean;
}

export interface BatchArchiveRequest {
 ids: string[];
 archived: boolean;
}

export interface BatchMoveRequest {
 ids: string[];
 folderId?: string;
}

export interface CreateConversationFolderRequest {
 name: string;
 icon?: string;
 color?: string;
 parentId?: string;
}

export interface UpdateConversationFolderRequest {
 name?: string;
 icon?: string;
 color?: string;
 sortOrder?: number;
}

// ===== ResponseType =====

export interface ConversationListResponse {
 conversations: Conversation[];
 total: number;
 page: number;
 pageSize: number;
}

export interface MessageListResponse {
 messages: Message[];
 total: number;
 page: number;
 pageSize: number;
}

export interface ConversationFolderListResponse {
 folders: ConversationFolder[];
 total: number;
}

export interface BatchOperationResponse {
 success: boolean;
 count: number;
 message: string;
}

// ===== AI ModelOption =====
export interface AIModel {
 id: string;
 name: string;
 provider: string;
 description?: string;
 maxTokens: number;
 contextLength: number;
 pricing?: {
 input: number;
 output: number;
 };
}

export const AI_MODELS: AIModel[] = [
 {
 id: "gpt-4",
 name: "GPT-4",
 provider: "OpenAI",
 description: "Bestlarge'sGPTModel, SuitableComplexTask",
 maxTokens: 8192,
 contextLength: 8192,
 },
 {
 id: "gpt-4-turbo",
 name: "GPT-4 Turbo",
 provider: "OpenAI",
 description: "moreQuick'sGPT-4Version",
 maxTokens: 128000,
 contextLength: 128000,
 },
 {
 id: "gpt-3.5-turbo",
 name: "GPT-3.5 Turbo",
 provider: "OpenAI",
 description: "compareSelect",
 maxTokens: 16385,
 contextLength: 16385,
 },
 {
 id: "claude-3-opus",
 name: "Claude 3 Opus",
 provider: "Anthropic",
 description: "Anthropic BestModel",
 maxTokens: 200000,
 contextLength: 200000,
 },
 {
 id: "claude-3-sonnet",
 name: "Claude 3 Sonnet",
 provider: "Anthropic",
 description: "BalancecanandSpeed",
 maxTokens: 200000,
 contextLength: 200000,
 },
 {
 id: "claude-3-haiku",
 name: "Claude 3 Haiku",
 provider: "Anthropic",
 description: "QuickResponse",
 maxTokens: 200000,
 contextLength: 200000,
 },
];

// ===== ModelIconMapping =====
export const MODEL_ICONS: Record<string, string> = {
 "gpt-4": "✨",
 "gpt-4-turbo": "⚡",
 "gpt-3.5-turbo": "💫",
 "claude-3-opus": "🎭",
 "claude-3-sonnet": "🎵",
 "claude-3-haiku": "🌸",
};

// ===== Toolcount =====

export function getModelDisplayName(modelId: string): string {
 const model = AI_MODELS.find((m) => m.id === modelId);
 return model?.name || modelId;
}

export function getModelIcon(modelId: string): string {
 return MODEL_ICONS[modelId] || "🤖";
}

export function formatMessagePreview(content: string, maxLength = 200): string {
 if (content.length <= maxLength) return content;
 return content.slice(0, maxLength) + "...";
}

export function formatRelativeTime(dateString: string): string {
 const date = new Date(dateString);
 const now = new Date();
 const diffMs = now.getTime() - date.getTime();
 const diffSec = Math.floor(diffMs / 1000);
 const diffMin = Math.floor(diffSec / 60);
 const diffHour = Math.floor(diffMin / 60);
 const diffDay = Math.floor(diffHour / 24);

 if (diffSec < 60) return "Just now";
 if (diffMin < 60) return `${diffMin}minbefore`;
 if (diffHour < 24) return `${diffHour}hbefore`;
 if (diffDay < 7) return `${diffDay}daysbefore`;
 
 return date.toLocaleDateString("zh-CN");
}
