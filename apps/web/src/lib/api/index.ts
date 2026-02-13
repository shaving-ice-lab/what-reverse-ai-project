/**
 * API ServiceExport
 */

// Export API client
export { api, ApiError, type ApiResponse, type RequestConfig } from './client'

// ExportModule API
export * from './auth'
export * from './api-keys'
// Workspace API(Workspace atthenis App)
export { workspaceApi, appApi } from './workspace'
export type {
  // Workspace CoreType
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceQuota,
  // RequestType
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  InviteMemberRequest,
  UpdateMemberRoleRequest,
  // App RelatedType (Workspace = App)
  App,
  AppVersion,
  AppAccessPolicy,
  WorkspaceVersion,
  WorkspaceAccessPolicy,
  AppVersionDiff,
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
