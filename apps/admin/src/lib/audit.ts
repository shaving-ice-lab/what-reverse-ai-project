/**
 * 审计日志工具库
 * 提供操作审计的记录、追踪和上报能力
 */

import { api } from "@/lib/api";

// ===== 审计事件类型定义 =====

export type AuditAction =
  // 用户管理
  | "admin.user.view"
  | "admin.user.status_update"
  | "admin.user.role_update"
  | "admin.user.force_logout"
  | "admin.user.password_reset"
  | "admin.user.delete"
  | "admin.user.batch_update"
  // Workspace 管理
  | "admin.workspace.view"
  | "admin.workspace.status_update"
  | "admin.workspace.delete"
  | "admin.workspace.member_remove"
  | "admin.workspace.plan_change"
  // 应用管理
  | "admin.app.view"
  | "admin.app.status_update"
  | "admin.app.delete"
  | "admin.app.version_rollback"
  // 计费与收益
  | "admin.billing.refund_process"
  | "admin.billing.invoice_void"
  | "admin.earnings.withdrawal_process"
  // 配置与安全
  | "admin.config.update"
  | "admin.secret.rotate"
  | "admin.secret.disable"
  | "admin.secret.view"
  // 工单与支持
  | "admin.support.ticket_status_update"
  | "admin.support.ticket_assign"
  | "admin.support.ticket_escalate"
  // 系统运维
  | "admin.system.feature_toggle"
  | "admin.system.queue_retry"
  | "admin.system.queue_delete"
  // 认证与权限
  | "admin.auth.login"
  | "admin.auth.logout"
  | "admin.auth.session_terminate"
  | "admin.permission.role_assign"
  | "admin.permission.capability_update"
  // 审批流
  | "admin.approval.create"
  | "admin.approval.approve"
  | "admin.approval.reject"
  // 导出操作
  | "admin.export.create"
  | "admin.export.download";

export type AuditTargetType =
  | "user"
  | "workspace"
  | "app"
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

// ===== 审计上报 API =====

export const auditApi = {
  /**
   * 记录审计日志
   */
  async log(entry: AuditLogEntry, context?: AuditContext): Promise<{ id: string }> {
    return api.post<{ id: string }>("/admin/audit-logs", {
      ...entry,
      ...context,
    });
  },

  /**
   * 批量记录审计日志
   */
  async logBatch(entries: AuditLogEntry[], context?: AuditContext): Promise<{ ids: string[] }> {
    return api.post<{ ids: string[] }>("/admin/audit-logs/batch", {
      entries: entries.map((entry) => ({ ...entry, ...context })),
    });
  },
};

// ===== 审计事件描述映射 =====

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  "admin.user.view": "查看用户",
  "admin.user.status_update": "更新用户状态",
  "admin.user.role_update": "更新用户角色",
  "admin.user.force_logout": "强制用户登出",
  "admin.user.password_reset": "重置用户密码",
  "admin.user.delete": "删除用户",
  "admin.user.batch_update": "批量更新用户",
  "admin.workspace.view": "查看工作空间",
  "admin.workspace.status_update": "更新工作空间状态",
  "admin.workspace.delete": "删除工作空间",
  "admin.workspace.member_remove": "移除工作空间成员",
  "admin.workspace.plan_change": "变更工作空间计划",
  "admin.app.view": "查看应用",
  "admin.app.status_update": "更新应用状态",
  "admin.app.delete": "删除应用",
  "admin.app.version_rollback": "回滚应用版本",
  "admin.billing.refund_process": "处理退款",
  "admin.billing.invoice_void": "作废发票",
  "admin.earnings.withdrawal_process": "处理提现",
  "admin.config.update": "更新配置",
  "admin.secret.rotate": "轮换密钥",
  "admin.secret.disable": "禁用密钥",
  "admin.secret.view": "查看密钥",
  "admin.support.ticket_status_update": "更新工单状态",
  "admin.support.ticket_assign": "分配工单",
  "admin.support.ticket_escalate": "升级工单",
  "admin.system.feature_toggle": "切换功能开关",
  "admin.system.queue_retry": "重试队列任务",
  "admin.system.queue_delete": "删除队列任务",
  "admin.auth.login": "管理员登录",
  "admin.auth.logout": "管理员登出",
  "admin.auth.session_terminate": "终止会话",
  "admin.permission.role_assign": "分配角色",
  "admin.permission.capability_update": "更新能力点",
  "admin.approval.create": "创建审批",
  "admin.approval.approve": "审批通过",
  "admin.approval.reject": "审批拒绝",
  "admin.export.create": "创建导出",
  "admin.export.download": "下载导出",
};

export const AUDIT_TARGET_LABELS: Record<AuditTargetType, string> = {
  user: "用户",
  workspace: "工作空间",
  app: "应用",
  config: "配置",
  secret: "密钥",
  ticket: "工单",
  refund: "退款",
  withdrawal: "提现",
  invoice: "发票",
  session: "会话",
  feature: "功能",
  queue: "队列",
  approval: "审批",
  export: "导出",
  system: "系统",
};

// ===== 风险级别定义 =====

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
  "admin.app.view": "low",
  "admin.app.status_update": "high",
  "admin.app.delete": "critical",
  "admin.app.version_rollback": "high",
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

// ===== 需要审批的高风险操作 =====

export const REQUIRES_APPROVAL: AuditAction[] = [
  "admin.user.delete",
  "admin.user.batch_update",
  "admin.workspace.delete",
  "admin.app.delete",
  "admin.billing.refund_process",
  "admin.billing.invoice_void",
  "admin.earnings.withdrawal_process",
  "admin.permission.role_assign",
  "admin.permission.capability_update",
];

/**
 * 判断操作是否需要审批
 */
export function requiresApproval(action: AuditAction): boolean {
  return REQUIRES_APPROVAL.includes(action);
}

/**
 * 获取操作的风险级别
 */
export function getActionRiskLevel(action: AuditAction): RiskLevel {
  return ACTION_RISK_LEVELS[action] || "low";
}

/**
 * 判断操作是否为高风险
 */
export function isHighRiskAction(action: AuditAction): boolean {
  const level = getActionRiskLevel(action);
  return level === "high" || level === "critical";
}
