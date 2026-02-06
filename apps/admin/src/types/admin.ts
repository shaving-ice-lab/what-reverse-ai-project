/**
 * Admin Console domain types (aligned to server JSON tags).
 */
 
import type { User } from "@/types/auth";
 
export interface AdminCapability {
  key: string;
  title: string;
  description: string;
}
 
export type AdminUserStatus = "active" | "suspended";
export type AdminUserRole = "user" | "admin" | "creator";
 
export interface Workspace {
  id: string;
  owner_user_id: string;
  name: string;
  slug: string;
  icon: string;
  status: string;
  status_reason?: string | null;
  status_updated_at?: string | null;
  plan: string;
  region?: string | null;
  created_at: string;
  updated_at: string;
  owner?: User | null;
}
 
/** @deprecated Workspace = App，使用 Workspace 类型代替 */
export type App = Workspace;

export interface WorkspaceRole {
  id: string;
  workspace_id: string;
  name: string;
  permissions?: Record<string, unknown> | null;
  is_system?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role_id?: string | null;
  status?: string;
  invited_by?: string | null;
  joined_at?: string | null;
  created_at?: string;
  updated_at?: string;
  user?: User | null;
  role?: WorkspaceRole | null;
}

export interface WorkspaceVersion {
  id: string;
  workspace_id: string;
  version: string;
  changelog?: string | null;
  workflow_id?: string | null;
  created_by?: string | null;
  created_at: string;
  creator?: User | null;
}
/** @deprecated 使用 WorkspaceVersion 代替 */
export type AppVersion = WorkspaceVersion;

export interface WorkspaceAccessPolicy {
  id: string;
  workspace_id: string;
  access_mode: string;
  data_classification: string;
  rate_limit_json?: Record<string, unknown> | null;
  allowed_origins?: string[];
  require_captcha?: boolean;
  updated_by?: string | null;
  updated_at: string;
  created_at: string;
  updater?: User | null;
}
/** @deprecated 使用 WorkspaceAccessPolicy 代替 */
export type AppAccessPolicy = WorkspaceAccessPolicy;

export interface WorkspaceDomain {
  id: string;
  workspace_id: string;
  domain: string;
  status: string;
  ssl_status?: string;
  verified_at?: string | null;
  blocked_at?: string | null;
  blocked_reason?: string | null;
  created_at: string;
  updated_at: string;
}
/** @deprecated 使用 WorkspaceDomain 代替 */
export type AppDomain = WorkspaceDomain;
 
export type SupportTicketPriority = "low" | "medium" | "high" | "urgent";
export type SupportTicketStatus =
  | "open"
  | "in_progress"
  | "waiting_on_customer"
  | "resolved"
  | "closed";
 
export interface SupportTicket {
  id: string;
  reference: string;
  workspace_id?: string | null;
  requester_user_id?: string | null;
  requester_name?: string | null;
  requester_email: string;
  subject: string;
  description: string;
  category: string;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  status_note?: string | null;
  channel: string;
  assignee_type?: string | null;
  assignee_value?: string | null;
  assigned_at?: string | null;
  sla_response_due_at?: string | null;
  sla_update_due_at?: string | null;
  sla_resolve_due_at?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}
 
export interface SupportTicketComment {
  id: string;
  ticket_id: string;
  author_user_id?: string | null;
  author_name?: string | null;
  body: string;
  is_internal: boolean;
  created_at: string;
}

export interface SupportChannel {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  contact?: string | null;
  sla_overrides?: Record<string, number> | null;
  enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SupportTeam {
  id: string;
  name: string;
  description?: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupportQueue {
  id: string;
  name: string;
  description?: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupportTeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role?: string | null;
  sort_order: number;
  created_at: string;
}

export interface SupportQueueMember {
  id: string;
  queue_id: string;
  user_id: string;
  sort_order: number;
  created_at: string;
}

export interface SupportAssignmentRule {
  id: string;
  name: string;
  priority: string;
  category: string;
  channel: string;
  keyword: string;
  assignee_type: string;
  assignee_value: string;
  enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  title: string;
  content: string;
}

export interface SupportNotificationTemplates {
  ticket_created: NotificationTemplate;
  status_updated: NotificationTemplate;
  comment_added: NotificationTemplate;
}

export interface SupportNotificationTemplateConfig {
  default_channel: string;
  default_locale: string;
  channels: Record<string, Record<string, SupportNotificationTemplates>>;
}

// Workflow & Execution types
export type WorkflowStatus = "draft" | "active" | "archived" | "disabled";
export type ExecutionStatus = "pending" | "running" | "success" | "failed" | "cancelled" | "timeout";

export interface Workflow {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: WorkflowStatus;
  trigger_type: string;
  trigger_config?: Record<string, unknown> | null;
  version: number;
  nodes_count: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  last_run_at?: string | null;
  workspace?: Workspace | null;
  creator?: User | null;
}

export interface WorkflowVersion {
  id: string;
  workflow_id: string;
  version: number;
  definition?: Record<string, unknown> | null;
  changelog?: string | null;
  created_by?: string | null;
  created_at: string;
  creator?: User | null;
}

export interface Execution {
  id: string;
  workflow_id: string;
  workspace_id: string;
  version: number;
  status: ExecutionStatus;
  trigger_type: string;
  trigger_data?: Record<string, unknown> | null;
  input_data?: Record<string, unknown> | null;
  output_data?: Record<string, unknown> | null;
  error_message?: string | null;
  error_code?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  duration_ms?: number | null;
  retries?: number;
  created_at: string;
  workflow?: Workflow | null;
  workspace?: Workspace | null;
}

export interface ExecutionNode {
  id: string;
  execution_id: string;
  node_id: string;
  node_type: string;
  node_name: string;
  status: ExecutionStatus;
  input_data?: Record<string, unknown> | null;
  output_data?: Record<string, unknown> | null;
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  duration_ms?: number | null;
  sequence: number;
}

// Conversation & AI content types
export type ConversationStatus = "active" | "archived" | "deleted";

export interface Conversation {
  id: string;
  workspace_id: string;
  user_id: string;
  title?: string | null;
  status: ConversationStatus;
  message_count: number;
  model?: string | null;
  created_at: string;
  updated_at: string;
  last_message_at?: string | null;
  workspace?: Workspace | null;
  user?: User | null;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  tokens_used?: number | null;
  model?: string | null;
  created_at: string;
}

export interface CreativeTask {
  id: string;
  workspace_id: string;
  user_id: string;
  template_id?: string | null;
  title: string;
  status: "pending" | "processing" | "completed" | "failed";
  input_data?: Record<string, unknown> | null;
  output_data?: Record<string, unknown> | null;
  tokens_used?: number | null;
  model?: string | null;
  created_at: string;
  completed_at?: string | null;
  workspace?: Workspace | null;
  user?: User | null;
}

// Template & Tag types
export type TemplateStatus = "draft" | "published" | "featured" | "archived";

export interface Template {
  id: string;
  workspace_id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  category: string;
  status: TemplateStatus;
  is_public: boolean;
  is_featured: boolean;
  definition?: Record<string, unknown> | null;
  use_count: number;
  rating?: number | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  workspace?: Workspace | null;
  creator?: User | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
  description?: string | null;
  color?: string | null;
  use_count: number;
  created_at: string;
  updated_at: string;
}

// Analytics types
export interface WorkspaceAnalytics {
  workspace_id: string;
  period: string;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  error_rate: number;
  avg_duration_ms: number;
  total_api_calls: number;
  total_tokens_used: number;
  storage_used_gb: number;
  active_users: number;
  updated_at: string;
}

export interface ModelUsage {
  model: string;
  total_calls: number;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  cost_estimate?: number | null;
  period: string;
}

// Billing & Earnings types
export type InvoiceStatus = "draft" | "pending" | "paid" | "failed" | "refunded" | "cancelled";
export type WithdrawalStatus = "pending" | "processing" | "completed" | "rejected" | "cancelled";
export type RefundStatus = "pending" | "approved" | "rejected" | "processed" | "failed";

export interface Invoice {
  id: string;
  workspace_id: string;
  invoice_number: string;
  period_start: string;
  period_end: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: InvoiceStatus;
  paid_at?: string | null;
  due_date?: string | null;
  items?: InvoiceItem[];
  created_at: string;
  updated_at: string;
  workspace?: Workspace | null;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Earning {
  id: string;
  user_id: string;
  workspace_id?: string | null;
  source: string;
  amount: number;
  currency: string;
  status: "pending" | "available" | "withdrawn";
  period_start?: string | null;
  period_end?: string | null;
  created_at: string;
  user?: User | null;
  workspace?: Workspace | null;
  app?: App | null;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: WithdrawalStatus;
  payment_method: string;
  payment_details?: Record<string, unknown> | null;
  requested_at: string;
  processed_at?: string | null;
  processed_by?: string | null;
  rejection_reason?: string | null;
  transaction_id?: string | null;
  created_at: string;
  user?: User | null;
  processor?: User | null;
}

export interface Refund {
  id: string;
  invoice_id: string;
  workspace_id: string;
  requester_user_id?: string | null;
  amount: number;
  currency: string;
  reason: string;
  status: RefundStatus;
  requested_at: string;
  processed_at?: string | null;
  processed_by?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  invoice?: Invoice | null;
  workspace?: Workspace | null;
  requester?: User | null;
  processor?: User | null;
}

// Security & Config types
export interface ConfigItem {
  id: string;
  key: string;
  value: string;
  value_type: "string" | "number" | "boolean" | "json";
  is_secret: boolean;
  description?: string | null;
  category?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
  updater?: User | null;
}

export interface Secret {
  id: string;
  name: string;
  key_prefix: string;
  description?: string | null;
  scope: "system" | "workspace";
  scope_id?: string | null;
  status: "active" | "rotated" | "disabled";
  expires_at?: string | null;
  last_used_at?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  creator?: User | null;
}

export interface AuditLog {
  id: string;
  actor_user_id?: string | null;
  actor_email?: string | null;
  action: string;
  target_type: string;
  target_id: string;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  request_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  actor?: User | null;
}

// Extended Analytics types
export interface WorkspaceBehaviorMetric {
  workspace_id: string;
  workspace_name?: string;
  period: string;
  daily_active_users: number;
  weekly_active_users: number;
  monthly_active_users: number;
  total_sessions: number;
  avg_session_duration_min: number;
  total_page_views: number;
  feature_usage: Record<string, number>;
  retention_rate_7d: number;
  retention_rate_30d: number;
  churn_rate: number;
  updated_at: string;
}

export interface WorkspaceUsageMetric {
  workspace_id: string;
  workspace_name?: string;
  period: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  avg_duration_ms: number;
  total_api_calls: number;
  total_tokens_used: number;
  cost_estimate: number;
  unique_users: number;
  peak_concurrent_users: number;
  updated_at: string;
}
/** @deprecated 使用 WorkspaceUsageMetric 代替 */
export type AppUsageMetric = WorkspaceUsageMetric;

// Export job types
export type ExportJobStatus = "pending" | "running" | "completed" | "failed" | "cancelled";
export type ExportFormat = "csv" | "xlsx" | "json";

export interface ExportJob {
  id: string;
  name: string;
  module: string;
  format: ExportFormat;
  status: ExportJobStatus;
  filters?: Record<string, unknown> | null;
  fields?: string[];
  file_url?: string | null;
  file_size_bytes?: number | null;
  total_records?: number | null;
  error_message?: string | null;
  created_by?: string | null;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  expires_at?: string | null;
  creator?: User | null;
}
 
