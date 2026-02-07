/**
 * Audit Log Utility Library
 * Provides operation audit recording, tracking, and reporting capabilities
 */

import { api } from "@/lib/api";

// ===== Audit Event Type Definitions =====

export type AuditAction =
  // User Management
  | "admin.user.view"
  | "admin.user.status_update"
  | "admin.user.role_update"
  | "admin.user.force_logout"
  | "admin.user.password_reset"
  | "admin.user.delete"
  | "admin.user.batch_update"
  // Workspace Management
  | "admin.workspace.view"
  | "admin.workspace.status_update"
  | "admin.workspace.delete"
  | "admin.workspace.member_remove"
  | "admin.workspace.plan_change"
  // Workspace Publishing Management
  | "admin.workspace.view"
  | "admin.workspace.publish_status_update"
  | "admin.workspace.version_rollback"
  // Billing & Earnings
  | "admin.billing.refund_process"
  | "admin.billing.invoice_void"
  | "admin.earnings.withdrawal_process"
  // Configuration & Security
  | "admin.config.update"
  | "admin.secret.rotate"
  | "admin.secret.disable"
  | "admin.secret.view"
  // Tickets & Support
  | "admin.support.ticket_status_update"
  | "admin.support.ticket_assign"
  | "admin.support.ticket_escalate"
  // System Operations
  | "admin.system.feature_toggle"
  | "admin.system.queue_retry"
  | "admin.system.queue_delete"
  // Authentication & Permissions
  | "admin.auth.login"
  | "admin.auth.logout"
  | "admin.auth.session_terminate"
  | "admin.permission.role_assign"
  | "admin.permission.capability_update"
  // Approval Flow
  | "admin.approval.create"
  | "admin.approval.approve"
  | "admin.approval.reject"
  // Export Operations
  | "admin.export.create"
  | "admin.export.download";

export type AuditTargetType =
  | "user"
  | "workspace"
  | "config"
  | "secret"
  | "ticket"
  | "refund"
  | "withdrawal"
  | "invoice"
  | "session"
  | "feature"
  | "queue"
  | "approval"
  | "export"
  | "system";

export interface AuditLogEntry {
  action: AuditAction;
  target_type: AuditTargetType;
  target_id: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  previous_value?: unknown;
  new_value?: unknown;
}

export interface AuditContext {
  request_id?: string;
  trace_id?: string;
  ip_address?: string;
  user_agent?: string;
}

// ===== Audit Reporting API =====

export const auditApi = {
  /**
   * Record an audit log entry
   */
  async log(entry: AuditLogEntry, context?: AuditContext): Promise<{ id: string }> {
    return api.post<{ id: string }>("/admin/audit-logs", {
      ...entry,
      ...context,
    });
  },

  /**
   * Batch record audit log entries
   */
  async logBatch(entries: AuditLogEntry[], context?: AuditContext): Promise<{ ids: string[] }> {
    return api.post<{ ids: string[] }>("/admin/audit-logs/batch", {
      entries: entries.map((entry) => ({ ...entry, ...context })),
    });
  },
};

// ===== Audit Event Description Mapping =====

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  "admin.user.view": "View User",
  "admin.user.status_update": "Update User Status",
  "admin.user.role_update": "Update User Role",
  "admin.user.force_logout": "Force User Logout",
  "admin.user.password_reset": "Reset User Password",
  "admin.user.delete": "Delete User",
  "admin.user.batch_update": "Batch Update Users",
  "admin.workspace.view": "View Workspace",
  "admin.workspace.status_update": "Update Workspace Status",
  "admin.workspace.delete": "Delete Workspace",
  "admin.workspace.member_remove": "Remove Workspace Member",
  "admin.workspace.plan_change": "Change Workspace Plan",
  "admin.workspace.view": "View Workspace",
  "admin.workspace.publish_status_update": "Update Publish Status",
  "admin.workspace.version_rollback": "Rollback Version",
  "admin.billing.refund_process": "Process Refund",
  "admin.billing.invoice_void": "Void Invoice",
  "admin.earnings.withdrawal_process": "Process Withdrawal",
  "admin.config.update": "Update Configuration",
  "admin.secret.rotate": "Rotate Secret",
  "admin.secret.disable": "Disable Secret",
  "admin.secret.view": "View Secret",
  "admin.support.ticket_status_update": "Update Ticket Status",
  "admin.support.ticket_assign": "Assign Ticket",
  "admin.support.ticket_escalate": "Escalate Ticket",
  "admin.system.feature_toggle": "Toggle Feature Flag",
  "admin.system.queue_retry": "Retry Queue Task",
  "admin.system.queue_delete": "Delete Queue Task",
  "admin.auth.login": "Admin Login",
  "admin.auth.logout": "Admin Logout",
  "admin.auth.session_terminate": "Terminate Session",
  "admin.permission.role_assign": "Assign Role",
  "admin.permission.capability_update": "Update Capability",
  "admin.approval.create": "Create Approval",
  "admin.approval.approve": "Approval Approved",
  "admin.approval.reject": "Approval Rejected",
  "admin.export.create": "Create Export",
  "admin.export.download": "Download Export",
};

export const AUDIT_TARGET_LABELS: Record<AuditTargetType, string> = {
  user: "User",
  workspace: "Workspace",
  app: "App",
  config: "Configuration",
  secret: "Secret",
  ticket: "Ticket",
  refund: "Refund",
  withdrawal: "Withdrawal",
  invoice: "Invoice",
  session: "Session",
  feature: "Feature",
  queue: "Queue",
  approval: "Approval",
  export: "Export",
  system: "System",
};

// ===== Risk Level Definitions =====

export type RiskLevel = "low" | "medium" | "high" | "critical";

export const ACTION_RISK_LEVELS: Record<AuditAction, RiskLevel> = {
  "admin.user.view": "low",
  "admin.user.status_update": "high",
  "admin.user.role_update": "high",
  "admin.user.force_logout": "medium",
  "admin.user.password_reset": "high",
  "admin.user.delete": "critical",
  "admin.user.batch_update": "critical",
  "admin.workspace.view": "low",
  "admin.workspace.status_update": "high",
  "admin.workspace.delete": "critical",
  "admin.workspace.member_remove": "medium",
  "admin.workspace.plan_change": "high",
  "admin.workspace.view": "low",
  "admin.workspace.publish_status_update": "high",
  "admin.workspace.version_rollback": "high",
  "admin.billing.refund_process": "critical",
  "admin.billing.invoice_void": "critical",
  "admin.earnings.withdrawal_process": "critical",
  "admin.config.update": "high",
  "admin.secret.rotate": "high",
  "admin.secret.disable": "high",
  "admin.secret.view": "medium",
  "admin.support.ticket_status_update": "low",
  "admin.support.ticket_assign": "low",
  "admin.support.ticket_escalate": "medium",
  "admin.system.feature_toggle": "high",
  "admin.system.queue_retry": "medium",
  "admin.system.queue_delete": "high",
  "admin.auth.login": "low",
  "admin.auth.logout": "low",
  "admin.auth.session_terminate": "medium",
  "admin.permission.role_assign": "critical",
  "admin.permission.capability_update": "critical",
  "admin.approval.create": "medium",
  "admin.approval.approve": "high",
  "admin.approval.reject": "medium",
  "admin.export.create": "medium",
  "admin.export.download": "low",
};

// ===== High-Risk Operations Requiring Approval =====

export const REQUIRES_APPROVAL: AuditAction[] = [
  "admin.user.delete",
  "admin.user.batch_update",
  "admin.workspace.delete",
  "admin.workspace.delete",
  "admin.billing.refund_process",
  "admin.billing.invoice_void",
  "admin.earnings.withdrawal_process",
  "admin.permission.role_assign",
  "admin.permission.capability_update",
];

/**
 * Determine if an action requires approval
 */
export function requiresApproval(action: AuditAction): boolean {
  return REQUIRES_APPROVAL.includes(action);
}

/**
 * Get the risk level of an action
 */
export function getActionRiskLevel(action: AuditAction): RiskLevel {
  return ACTION_RISK_LEVELS[action] || "low";
}

/**
 * Determine if an action is high risk
 */
export function isHighRiskAction(action: AuditAction): boolean {
  const level = getActionRiskLevel(action);
  return level === "high" || level === "critical";
}
