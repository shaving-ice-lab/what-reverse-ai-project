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
export * from "./marketplace";
export * from "./system";
export * from "./support";
export * from "./admin";
export * from "./activity";
export * from "./device";
export * from "./tags";
export * from "./dashboard";
export { configApi } from "./config";
export type { ConfigItem, ConfigItemListParams, UpsertConfigItemRequest } from "./config";
export { billingApi } from "./billing";
export type { BudgetSettings, BudgetSettingsUpdate, WorkspaceUsageStat } from "./billing";
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

// Workspace API（Workspace 现在就是 App）
export { workspaceApi, appApi } from "./workspace";
export type {
  // Workspace 核心类型
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceQuota,
  // 日志归档
  LogArchiveJob,
  LogArchiveStatus,
  LogArchiveType,
  LogArchiveRequest,
  LogArchiveListParams,
  LogArchiveReplayParams,
  LogArchiveReplayResult,
  // 请求类型
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  InviteMemberRequest,
  UpdateMemberRoleRequest,
  // App 相关类型（现在是 Workspace 的一部分）
  App,
  AppVersion,
  AppDomain,
  AppAccessPolicy,
  WorkspaceVersion,
  WorkspaceDomain,
  WorkspaceAccessPolicy,
  WorkspaceDomainBindingResult,
  WorkspaceExecution,
  WorkspaceMetrics,
  DomainVerificationInfo,
  AppVersionDiff,
  AppMetrics,
  AppExecution,
} from "./workspace";