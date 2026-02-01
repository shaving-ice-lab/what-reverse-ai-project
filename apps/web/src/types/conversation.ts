/**
 * 对话相关类型定义
 */

// ===== 消息角色 =====
export type MessageRole = "user" | "assistant" | "system";

// ===== 消息附件类型 =====
export interface MessageAttachment {
  id: string;
  type: "image" | "file" | "code";
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

// ===== 消息 =====
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
  // 用户反馈
  liked?: boolean;
  disliked?: boolean;
  bookmarked?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ===== AI 参数设置 =====
export interface AIParameters {
  temperature?: number;      // 0.0-2.0，默认 1.0
  maxTokens?: number;        // 最大生成 token 数
  topP?: number;             // 0.0-1.0
  topK?: number;             // Top-K 采样
  frequencyPenalty?: number; // -2.0-2.0
  presencePenalty?: number;  // -2.0-2.0
}

// ===== 对话 =====
export interface Conversation extends AIParameters {
  id: string;
  userId: string;
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

// ===== 对话文件夹 =====
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

// ===== 请求类型 =====

export interface CreateConversationRequest extends AIParameters {
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
  parentId?: string; // 回复/引用的消息 ID
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

// ===== 响应类型 =====

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

// ===== AI 模型选项 =====
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
    description: "最强大的GPT模型，适合复杂任务",
    maxTokens: 8192,
    contextLength: 8192,
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "OpenAI",
    description: "更快速的GPT-4版本",
    maxTokens: 128000,
    contextLength: 128000,
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    description: "高性价比选择",
    maxTokens: 16385,
    contextLength: 16385,
  },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    provider: "Anthropic",
    description: "Anthropic 最强模型",
    maxTokens: 200000,
    contextLength: 200000,
  },
  {
    id: "claude-3-sonnet",
    name: "Claude 3 Sonnet",
    provider: "Anthropic",
    description: "平衡性能和速度",
    maxTokens: 200000,
    contextLength: 200000,
  },
  {
    id: "claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    description: "快速响应",
    maxTokens: 200000,
    contextLength: 200000,
  },
];

// ===== 模型图标映射 =====
export const MODEL_ICONS: Record<string, string> = {
  "gpt-4": "✨",
  "gpt-4-turbo": "⚡",
  "gpt-3.5-turbo": "💫",
  "claude-3-opus": "🎭",
  "claude-3-sonnet": "🎵",
  "claude-3-haiku": "🌸",
};

// ===== 工具函数 =====

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

  if (diffSec < 60) return "刚刚";
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;
  
  return date.toLocaleDateString("zh-CN");
}
