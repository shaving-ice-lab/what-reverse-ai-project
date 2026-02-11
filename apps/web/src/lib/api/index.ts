/**
 * API ServiceExport
 */

// Export API client
export { api, ApiError, type ApiResponse, type RequestConfig } from './client'

// ExportModule API
export * from './auth'
export { workflowApi } from './workflow'
export * from './api-keys'
export * from './agent'
export * from './stats'
export { executionApi } from './execution'
export { folderApi } from './folder'
export * from './version'
export * from './template'
export * from './marketplace'
export * from './system'
export * from './support'
export * from './admin'
export * from './activity'
export * from './device'
export * from './tags'
export * from './dashboard'
export { configApi } from './config'
export type { ConfigItem, ConfigItemListParams, UpsertConfigItemRequest } from './config'
export { billingApi } from './billing'
export type { BudgetSettings, BudgetSettingsUpdate, WorkspaceUsageStat } from './billing'
export { conversationApi, conversationFolderApi } from './conversation'
export { conversationTemplateApi } from './conversation-template'
export type {
  ConversationTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TemplateListResponse,
  ListTemplatesParams,
  TemplateInitialMessage,
} from './conversation-template'
export { aiApi, streamChat } from './ai'
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
} from './ai'

// Workspace API(Workspace atthenis App)
export { workspaceApi, appApi } from './workspace'
export type {
  // Workspace CoreType
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceQuota,
  // LogsArchive
  LogArchiveJob,
  LogArchiveStatus,
  LogArchiveType,
  LogArchiveRequest,
  LogArchiveListParams,
  LogArchiveReplayParams,
  LogArchiveReplayResult,
  // RequestType
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  InviteMemberRequest,
  UpdateMemberRoleRequest,
  // App RelatedType(atis Workspace 's1Partial)
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
} from './workspace'

// Agent Chat API
export { agentChatApi, chatStream } from './agent-chat'
export type {
  AgentEventType,
  AgentToolResult,
  AffectedResource,
  AgentEvent,
  AgentSession,
  AgentMessage,
  AgentToolCall,
  AgentSessionSummary,
} from './agent-chat'

// Workspace Database API
export { workspaceDatabaseApi } from './workspace-database'
export type {
  DatabaseTable,
  TableColumn,
  TableIndex,
  ForeignKey,
  TableSchema,
  CreateColumnDef,
  CreateIndexDef,
  CreateTableRequest,
  AlterColumnDef,
  AlterTableRequest,
  QueryFilter,
  QueryRowsParams,
  QueryResult,
  QueryHistoryItem,
  DatabaseStats,
  SchemaGraphNode,
  SchemaGraphEdge,
  SchemaGraphData,
} from './workspace-database'
