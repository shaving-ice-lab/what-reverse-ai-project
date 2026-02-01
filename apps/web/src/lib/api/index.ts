/**
 * API 服务导出
 */

// 导出 API 客户端
export { api, ApiError, type ApiResponse, type RequestConfig } from "../api";

// 导出各模块 API
export * from "./auth";
export { workflowApi } from "./workflow";
export * from "./api-keys";
export * from "./agent";
export * from "./stats";
export { executionApi } from "./execution";
export { folderApi } from "./folder";
export * from "./version";
export * from "./template";
export * from "./system";
export * from "./activity";
export * from "./device";
export * from "./tags";
export * from "./dashboard";
export { conversationApi, conversationFolderApi } from "./conversation";
export { conversationTemplateApi } from "./conversation-template";
export type {
  ConversationTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TemplateListResponse,
  ListTemplatesParams,
  TemplateInitialMessage,
} from "./conversation-template";
export { aiApi, streamChat } from "./ai";
export type {
  ChatMessage,
  ChatAction,
  ChatResponse,
  AIChatRequest,
  AIChatResponse,
  GenerateWorkflowRequest,
  GenerateWorkflowResponse,
  IntentResult,
  NodeSuggestion,
  FixSuggestion,
} from "./ai";