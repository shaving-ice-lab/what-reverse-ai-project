/**
 * 权限管理模块
 * 定义管理员角色矩阵、能力点清单与权限控制逻辑
 */

// ===== 管理员角色定义 =====

export type AdminRole =
  | "super_admin"
  | "ops"
  | "support"
  | "finance"
  | "reviewer"
  | "viewer";

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "超级管理员",
  ops: "运维管理员",
  support: "客服支持",
  finance: "财务管理员",
  reviewer: "内容审核员",
  viewer: "只读管理员",
};

export const ADMIN_ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin: "拥有所有管理权限，可执行任何操作",
  ops: "系统运维、配置管理、队列管理权限",
  support: "工单处理、用户支持相关权限",
  finance: "计费、收益、提现、退款管理权限",
  reviewer: "内容审核、模板管理权限",
  viewer: "只读访问，无操作权限",
};

// ===== 能力点定义 =====

export type PermissionAction = "read" | "write" | "manage" | "approve" | "export" | "delete";

export interface PermissionPoint {
  key: string;
  module: string;
  action: PermissionAction;
  label: string;
  description: string;
  risk_level: "low" | "medium" | "high" | "critical";
}

// ===== 权限点清单 =====

export const PERMISSION_POINTS: PermissionPoint[] = [
  // 用户管理
  { key: "users.read", module: "users", action: "read", label: "查看用户", description: "查看用户列表与详情", risk_level: "low" },
  { key: "users.write", module: "users", action: "write", label: "编辑用户", description: "修改用户状态与角色", risk_level: "high" },
  { key: "users.manage", module: "users", action: "manage", label: "管理用户", description: "高级用户管理操作", risk_level: "high" },
  { key: "users.delete", module: "users", action: "delete", label: "删除用户", description: "删除用户账号", risk_level: "critical" },
  { key: "users.export", module: "users", action: "export", label: "导出用户", description: "导出用户数据", risk_level: "medium" },

  // Workspace 管理
  { key: "workspaces.read", module: "workspaces", action: "read", label: "查看工作空间", description: "查看工作空间列表与详情", risk_level: "low" },
  { key: "workspaces.write", module: "workspaces", action: "write", label: "编辑工作空间", description: "修改工作空间状态", risk_level: "high" },
  { key: "workspaces.manage", module: "workspaces", action: "manage", label: "管理工作空间", description: "高级工作空间管理", risk_level: "high" },
  { key: "workspaces.delete", module: "workspaces", action: "delete", label: "删除工作空间", description: "删除工作空间", risk_level: "critical" },
  { key: "workspaces.export", module: "workspaces", action: "export", label: "导出工作空间", description: "导出工作空间数据", risk_level: "medium" },

  // 应用管理
  { key: "apps.read", module: "apps", action: "read", label: "查看应用", description: "查看应用列表与详情", risk_level: "low" },
  { key: "apps.write", module: "apps", action: "write", label: "编辑应用", description: "修改应用状态", risk_level: "high" },
  { key: "apps.manage", module: "apps", action: "manage", label: "管理应用", description: "高级应用管理", risk_level: "high" },
  { key: "apps.delete", module: "apps", action: "delete", label: "删除应用", description: "删除应用", risk_level: "critical" },
  { key: "apps.approve", module: "apps", action: "approve", label: "审核应用", description: "审核应用上架", risk_level: "medium" },

  // 工作流管理
  { key: "workflows.read", module: "workflows", action: "read", label: "查看工作流", description: "查看工作流列表与详情", risk_level: "low" },
  { key: "workflows.manage", module: "workflows", action: "manage", label: "管理工作流", description: "调整工作流状态与配置", risk_level: "high" },

  // 执行管理
  { key: "executions.read", module: "executions", action: "read", label: "查看执行", description: "查看执行历史与详情", risk_level: "low" },
  { key: "executions.manage", module: "executions", action: "manage", label: "管理执行", description: "取消或重试执行", risk_level: "high" },

  // 对话管理
  { key: "conversations.read", module: "conversations", action: "read", label: "查看对话", description: "查看对话列表与详情", risk_level: "low" },
  { key: "conversations.manage", module: "conversations", action: "manage", label: "管理对话", description: "归档或删除对话", risk_level: "medium" },

  // 工单与支持
  { key: "support.read", module: "support", action: "read", label: "查看工单", description: "查看工单列表与详情", risk_level: "low" },
  { key: "support.write", module: "support", action: "write", label: "处理工单", description: "更新工单状态与回复", risk_level: "low" },
  { key: "support.manage", module: "support", action: "manage", label: "管理支持", description: "管理渠道、团队、队列", risk_level: "medium" },

  // 计费与收益
  { key: "billing.read", module: "billing", action: "read", label: "查看计费", description: "查看账单与发票", risk_level: "low" },
  { key: "billing.write", module: "billing", action: "write", label: "编辑计费", description: "修改计费配置", risk_level: "high" },
  { key: "billing.approve", module: "billing", action: "approve", label: "审批退款", description: "处理退款申请", risk_level: "critical" },

  // 收益管理
  { key: "earnings.read", module: "earnings", action: "read", label: "查看收益", description: "查看收益与提现", risk_level: "low" },
  { key: "earnings.approve", module: "earnings", action: "approve", label: "审批提现", description: "处理提现申请", risk_level: "critical" },

  // 系统运维
  { key: "system.read", module: "system", action: "read", label: "查看系统", description: "查看系统状态", risk_level: "low" },
  { key: "system.write", module: "system", action: "write", label: "系统运维", description: "系统配置与操作", risk_level: "high" },
  { key: "system.manage", module: "system", action: "manage", label: "系统管理", description: "高级系统管理", risk_level: "critical" },

  // 配置管理
  { key: "config.read", module: "config", action: "read", label: "查看配置", description: "查看系统配置", risk_level: "low" },
  { key: "config.write", module: "config", action: "write", label: "编辑配置", description: "修改系统配置", risk_level: "high" },

  // 密钥管理
  { key: "secrets.read", module: "secrets", action: "read", label: "查看密钥", description: "查看密钥列表", risk_level: "medium" },
  { key: "secrets.write", module: "secrets", action: "write", label: "管理密钥", description: "轮换或禁用密钥", risk_level: "high" },

  // 审计日志
  { key: "audit.read", module: "audit", action: "read", label: "查看审计", description: "查看审计日志", risk_level: "low" },
  { key: "audit.export", module: "audit", action: "export", label: "导出审计", description: "导出审计日志", risk_level: "medium" },

  // 公告管理
  { key: "announcements.read", module: "announcements", action: "read", label: "查看公告", description: "查看公告列表", risk_level: "low" },
  { key: "announcements.write", module: "announcements", action: "write", label: "管理公告", description: "创建与编辑公告", risk_level: "medium" },

  // 模板与内容
  { key: "templates.read", module: "templates", action: "read", label: "查看模板", description: "查看模板列表", risk_level: "low" },
  { key: "templates.write", module: "templates", action: "write", label: "编辑模板", description: "修改模板配置", risk_level: "medium" },
  { key: "templates.approve", module: "templates", action: "approve", label: "审核模板", description: "审核模板上架", risk_level: "medium" },

  // 权限管理
  { key: "permissions.read", module: "permissions", action: "read", label: "查看权限", description: "查看权限配置", risk_level: "low" },
  { key: "permissions.write", module: "permissions", action: "write", label: "管理权限", description: "修改角色权限", risk_level: "critical" },

  // 会话管理
  { key: "sessions.read", module: "sessions", action: "read", label: "查看会话", description: "查看登录会话", risk_level: "low" },
  { key: "sessions.write", module: "sessions", action: "write", label: "管理会话", description: "终止会话", risk_level: "medium" },

  // 分析数据
  { key: "analytics.read", module: "analytics", action: "read", label: "查看分析", description: "查看分析数据", risk_level: "low" },
  { key: "analytics.export", module: "analytics", action: "export", label: "导出分析", description: "导出分析报告", risk_level: "medium" },

  // 审批管理
  { key: "approvals.read", module: "approvals", action: "read", label: "查看审批", description: "查看审批请求", risk_level: "low" },
  { key: "approvals.approve", module: "approvals", action: "approve", label: "处理审批", description: "审批或拒绝请求", risk_level: "high" },
];

// ===== 角色权限矩阵 =====

export type PermissionLevel = "none" | "read" | "read_write";

export const ROLE_PERMISSION_MATRIX: Record<AdminRole, Record<string, PermissionLevel>> = {
  super_admin: {
    users: "read_write",
    workspaces: "read_write",
    apps: "read_write",
    workflows: "read_write",
    executions: "read_write",
    conversations: "read_write",
    support: "read_write",
    billing: "read_write",
    earnings: "read_write",
    system: "read_write",
    config: "read_write",
    secrets: "read_write",
    audit: "read_write",
    announcements: "read_write",
    templates: "read_write",
    permissions: "read_write",
    sessions: "read_write",
    analytics: "read_write",
    approvals: "read_write",
  },
  ops: {
    users: "read",
    workspaces: "read_write",
    apps: "read_write",
    workflows: "read_write",
    executions: "read_write",
    conversations: "read",
    support: "read",
    billing: "read",
    earnings: "read",
    system: "read_write",
    config: "read_write",
    secrets: "read_write",
    audit: "read",
    announcements: "read",
    templates: "read",
    permissions: "read",
    sessions: "read_write",
    analytics: "read",
    approvals: "read",
  },
  support: {
    users: "read",
    workspaces: "read",
    apps: "read",
    workflows: "none",
    executions: "none",
    conversations: "read_write",
    support: "read_write",
    billing: "none",
    earnings: "none",
    system: "none",
    config: "none",
    secrets: "none",
    audit: "read",
    announcements: "read",
    templates: "read",
    permissions: "none",
    sessions: "read",
    analytics: "read",
    approvals: "read",
  },
  finance: {
    users: "read",
    workspaces: "read",
    apps: "read",
    workflows: "none",
    executions: "none",
    conversations: "none",
    support: "none",
    billing: "read_write",
    earnings: "read_write",
    system: "none",
    config: "read",
    secrets: "none",
    audit: "read",
    announcements: "read",
    templates: "none",
    permissions: "none",
    sessions: "read",
    analytics: "read",
    approvals: "read",
  },
  reviewer: {
    users: "read",
    workspaces: "read",
    apps: "read_write",
    workflows: "none",
    executions: "none",
    conversations: "read",
    support: "read",
    billing: "none",
    earnings: "none",
    system: "none",
    config: "none",
    secrets: "none",
    audit: "read",
    announcements: "read_write",
    templates: "read_write",
    permissions: "none",
    sessions: "none",
    analytics: "read",
    approvals: "read",
  },
  viewer: {
    users: "read",
    workspaces: "read",
    apps: "read",
    workflows: "read",
    executions: "read",
    conversations: "read",
    support: "read",
    billing: "read",
    earnings: "read",
    system: "read",
    config: "read",
    secrets: "none",
    audit: "read",
    announcements: "read",
    templates: "read",
    permissions: "read",
    sessions: "read",
    analytics: "read",
    approvals: "read",
  },
};

// ===== 权限检查工具函数 =====

/**
 * 检查角色是否拥有指定模块的权限
 */
export function hasModulePermission(
  role: AdminRole,
  module: string,
  requiredLevel: PermissionLevel = "read"
): boolean {
  const level = ROLE_PERMISSION_MATRIX[role]?.[module];
  if (!level || level === "none") return false;
  if (requiredLevel === "read") return level === "read" || level === "read_write";
  if (requiredLevel === "read_write") return level === "read_write";
  return false;
}

/**
 * 检查角色是否拥有指定权限点
 */
export function hasPermissionPoint(role: AdminRole, permissionKey: string): boolean {
  const point = PERMISSION_POINTS.find((p) => p.key === permissionKey);
  if (!point) return false;

  const level = ROLE_PERMISSION_MATRIX[role]?.[point.module];
  if (!level || level === "none") return false;

  // read 操作只需要 read 或 read_write 权限
  if (point.action === "read") {
    return level === "read" || level === "read_write";
  }

  // 其他操作需要 read_write 权限
  return level === "read_write";
}

/**
 * 获取角色的所有权限点
 */
export function getRolePermissions(role: AdminRole): PermissionPoint[] {
  return PERMISSION_POINTS.filter((point) => hasPermissionPoint(role, point.key));
}

/**
 * 获取所有模块列表
 */
export function getAllModules(): string[] {
  return [...new Set(PERMISSION_POINTS.map((p) => p.module))];
}

/**
 * 获取模块的所有权限点
 */
export function getModulePermissions(module: string): PermissionPoint[] {
  return PERMISSION_POINTS.filter((p) => p.module === module);
}

// ===== 页面权限映射 =====

export interface PagePermission {
  path: string;
  requiredPermissions: string[];
  requireAll?: boolean; // 是否需要全部权限，默认 false（任一即可）
}

export const PAGE_PERMISSIONS: PagePermission[] = [
  // 仪表盘
  { path: "/", requiredPermissions: [] },

  // 用户管理
  { path: "/users", requiredPermissions: ["users.read"] },
  { path: "/users/[id]", requiredPermissions: ["users.read"] },

  // Workspace 管理
  { path: "/workspaces", requiredPermissions: ["workspaces.read"] },
  { path: "/workspaces/[id]", requiredPermissions: ["workspaces.read"] },

  // 应用管理
  { path: "/apps", requiredPermissions: ["apps.read"] },
  { path: "/apps/[id]", requiredPermissions: ["apps.read"] },

  // 工单支持
  { path: "/support/tickets", requiredPermissions: ["support.read"] },
  { path: "/support/tickets/[id]", requiredPermissions: ["support.read"] },
  { path: "/support/channels", requiredPermissions: ["support.manage"] },
  { path: "/support/teams", requiredPermissions: ["support.manage"] },
  { path: "/support/queues", requiredPermissions: ["support.manage"] },
  { path: "/support/routing-rules", requiredPermissions: ["support.manage"] },
  { path: "/support/notification-templates", requiredPermissions: ["support.manage"] },

  // 计费与收益
  { path: "/billing", requiredPermissions: ["billing.read"] },
  { path: "/billing/invoices", requiredPermissions: ["billing.read"] },
  { path: "/billing/withdrawals", requiredPermissions: ["earnings.read"] },
  { path: "/billing/refunds", requiredPermissions: ["billing.read"] },
  { path: "/billing/anomalies", requiredPermissions: ["billing.read"] },
  { path: "/billing/rules", requiredPermissions: ["billing.read"] },

  // 安全配置
  { path: "/security/config", requiredPermissions: ["config.read"] },
  { path: "/security/secrets", requiredPermissions: ["secrets.read"] },
  { path: "/security/audit-logs", requiredPermissions: ["audit.read"] },
  { path: "/security/sessions", requiredPermissions: ["sessions.read"] },
  { path: "/security/ip-whitelist", requiredPermissions: ["config.write"] },
  { path: "/security/2fa", requiredPermissions: ["config.write"] },
  { path: "/security/approvals", requiredPermissions: ["approvals.read"] },
  { path: "/security/compliance", requiredPermissions: ["config.read"] },
  { path: "/security/supply-chain", requiredPermissions: ["config.read"] },

  // 系统运维
  { path: "/system/health", requiredPermissions: ["system.read"] },
  { path: "/system/features", requiredPermissions: ["system.read"] },
  { path: "/system/deployment", requiredPermissions: ["system.read"] },
  { path: "/system/error-codes", requiredPermissions: ["system.read"] },
  { path: "/system/capacity", requiredPermissions: ["system.read"] },

  // 运维操作
  { path: "/ops/sops", requiredPermissions: ["system.read"] },
  { path: "/ops/queues", requiredPermissions: ["system.write"] },
  { path: "/ops/jobs", requiredPermissions: ["system.read"] },
  { path: "/ops/logs", requiredPermissions: ["system.read"] },
  { path: "/ops/changes", requiredPermissions: ["system.read"] },

  // 分析
  { path: "/analytics/workspace-behavior", requiredPermissions: ["analytics.read"] },
  { path: "/analytics/model-usage", requiredPermissions: ["analytics.read"] },
  { path: "/analytics/app-usage", requiredPermissions: ["analytics.read"] },

  // 公告
  { path: "/announcements", requiredPermissions: ["announcements.read"] },

  // 模板与标签
  { path: "/templates", requiredPermissions: ["templates.read"] },
  { path: "/tags", requiredPermissions: ["templates.read"] },

  // 工作流
  { path: "/workflows", requiredPermissions: ["workflows.read"] },
  { path: "/workflows/[id]", requiredPermissions: ["workflows.read"] },
  { path: "/executions", requiredPermissions: ["executions.read"] },
  { path: "/executions/[id]", requiredPermissions: ["executions.read"] },

  // 对话与创意
  { path: "/conversations", requiredPermissions: ["conversations.read"] },
  { path: "/conversations/moderation", requiredPermissions: ["conversations.read"] },
  { path: "/conversations/strategies", requiredPermissions: ["conversations.read"] },
  { path: "/conversations/templates", requiredPermissions: ["conversations.read"] },
  { path: "/creative/tasks", requiredPermissions: ["conversations.read"] },

  // 导出
  { path: "/exports", requiredPermissions: ["analytics.export"] },
];

/**
 * 检查角色是否有权访问指定页面
 */
export function canAccessPage(role: AdminRole, path: string): boolean {
  // 超级管理员可以访问所有页面
  if (role === "super_admin") return true;

  // 查找匹配的页面权限配置
  const pagePermission = PAGE_PERMISSIONS.find((p) => {
    // 精确匹配
    if (p.path === path) return true;
    // 动态路由匹配
    const pattern = p.path.replace(/\[.*?\]/g, "[^/]+");
    return new RegExp(`^${pattern}$`).test(path);
  });

  // 没有配置权限的页面默认允许访问
  if (!pagePermission || pagePermission.requiredPermissions.length === 0) {
    return true;
  }

  // 检查权限
  if (pagePermission.requireAll) {
    return pagePermission.requiredPermissions.every((key) => hasPermissionPoint(role, key));
  }

  return pagePermission.requiredPermissions.some((key) => hasPermissionPoint(role, key));
}
