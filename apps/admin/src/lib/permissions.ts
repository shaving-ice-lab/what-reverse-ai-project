/**
 * Permission Management Module
 * Defines admin role matrix, capability points, and permission control logic
 */

// ===== Admin Role Definitions =====

export type AdminRole =
  | "super_admin"
  | "ops"
  | "support"
  | "finance"
  | "reviewer"
  | "viewer";

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  ops: "Ops Admin",
  support: "Support",
  finance: "Finance Admin",
  reviewer: "Content Reviewer",
  viewer: "Read-only Admin",
};

export const ADMIN_ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin: "Has all admin permissions, can perform any operation",
  ops: "System operations, configuration management, and queue management permissions",
  support: "Ticket handling and user support related permissions",
  finance: "Billing, earnings, withdrawal, and refund management permissions",
  reviewer: "Content review and template management permissions",
  viewer: "Read-only access, no operational permissions",
};

// ===== Capability Point Definitions =====

export type PermissionAction = "read" | "write" | "manage" | "approve" | "export" | "delete";

export interface PermissionPoint {
  key: string;
  module: string;
  action: PermissionAction;
  label: string;
  description: string;
  risk_level: "low" | "medium" | "high" | "critical";
}

// ===== Permission Points List =====

export const PERMISSION_POINTS: PermissionPoint[] = [
  // User Management
  { key: "users.read", module: "users", action: "read", label: "View Users", description: "View user list and details", risk_level: "low" },
  { key: "users.write", module: "users", action: "write", label: "Edit Users", description: "Modify user status and roles", risk_level: "high" },
  { key: "users.manage", module: "users", action: "manage", label: "Manage Users", description: "Advanced user management operations", risk_level: "high" },
  { key: "users.delete", module: "users", action: "delete", label: "Delete Users", description: "Delete user accounts", risk_level: "critical" },
  { key: "users.export", module: "users", action: "export", label: "Export Users", description: "Export user data", risk_level: "medium" },

  // Workspace Management
  { key: "workspaces.read", module: "workspaces", action: "read", label: "View Workspaces", description: "View workspace list and details", risk_level: "low" },
  { key: "workspaces.write", module: "workspaces", action: "write", label: "Edit Workspaces", description: "Modify workspace status", risk_level: "high" },
  { key: "workspaces.manage", module: "workspaces", action: "manage", label: "Manage Workspaces", description: "Advanced workspace management", risk_level: "high" },
  { key: "workspaces.delete", module: "workspaces", action: "delete", label: "Delete Workspaces", description: "Delete workspaces", risk_level: "critical" },
  { key: "workspaces.export", module: "workspaces", action: "export", label: "Export Workspaces", description: "Export workspace data", risk_level: "medium" },

  // App Management
  { key: "apps.read", module: "apps", action: "read", label: "View Apps", description: "View app list and details", risk_level: "low" },
  { key: "apps.write", module: "apps", action: "write", label: "Edit Apps", description: "Modify app status", risk_level: "high" },
  { key: "apps.manage", module: "apps", action: "manage", label: "Manage Apps", description: "Advanced app management", risk_level: "high" },
  { key: "apps.delete", module: "apps", action: "delete", label: "Delete Apps", description: "Delete apps", risk_level: "critical" },
  { key: "apps.approve", module: "apps", action: "approve", label: "Review Apps", description: "Review app publishing", risk_level: "medium" },

  // Workflow Management
  { key: "workflows.read", module: "workflows", action: "read", label: "View Workflows", description: "View workflow list and details", risk_level: "low" },
  { key: "workflows.manage", module: "workflows", action: "manage", label: "Manage Workflows", description: "Adjust workflow status and configuration", risk_level: "high" },

  // Execution Management
  { key: "executions.read", module: "executions", action: "read", label: "View Executions", description: "View execution history and details", risk_level: "low" },
  { key: "executions.manage", module: "executions", action: "manage", label: "Manage Executions", description: "Cancel or retry executions", risk_level: "high" },

  // Conversation Management
  { key: "conversations.read", module: "conversations", action: "read", label: "View Conversations", description: "View conversation list and details", risk_level: "low" },
  { key: "conversations.manage", module: "conversations", action: "manage", label: "Manage Conversations", description: "Archive or delete conversations", risk_level: "medium" },

  // Tickets & Support
  { key: "support.read", module: "support", action: "read", label: "View Tickets", description: "View ticket list and details", risk_level: "low" },
  { key: "support.write", module: "support", action: "write", label: "Handle Tickets", description: "Update ticket status and reply", risk_level: "low" },
  { key: "support.manage", module: "support", action: "manage", label: "Manage Support", description: "Manage channels, teams, queues", risk_level: "medium" },

  // Billing & Earnings
  { key: "billing.read", module: "billing", action: "read", label: "View Billing", description: "View bills and invoices", risk_level: "low" },
  { key: "billing.write", module: "billing", action: "write", label: "Edit Billing", description: "Modify billing configuration", risk_level: "high" },
  { key: "billing.approve", module: "billing", action: "approve", label: "Approve Refunds", description: "Process refund requests", risk_level: "critical" },

  // Earnings Management
  { key: "earnings.read", module: "earnings", action: "read", label: "View Earnings", description: "View earnings and withdrawals", risk_level: "low" },
  { key: "earnings.approve", module: "earnings", action: "approve", label: "Approve Withdrawals", description: "Process withdrawal requests", risk_level: "critical" },

  // System Operations
  { key: "system.read", module: "system", action: "read", label: "View System", description: "View system status", risk_level: "low" },
  { key: "system.write", module: "system", action: "write", label: "System Operations", description: "System configuration and operations", risk_level: "high" },
  { key: "system.manage", module: "system", action: "manage", label: "System Management", description: "Advanced system management", risk_level: "critical" },

  // Configuration Management
  { key: "config.read", module: "config", action: "read", label: "View Config", description: "View system configuration", risk_level: "low" },
  { key: "config.write", module: "config", action: "write", label: "Edit Config", description: "Modify system configuration", risk_level: "high" },

  // Secret Management
  { key: "secrets.read", module: "secrets", action: "read", label: "View Secrets", description: "View secrets list", risk_level: "medium" },
  { key: "secrets.write", module: "secrets", action: "write", label: "Manage Secrets", description: "Rotate or disable secrets", risk_level: "high" },

  // Audit Logs
  { key: "audit.read", module: "audit", action: "read", label: "View Audit", description: "View audit logs", risk_level: "low" },
  { key: "audit.export", module: "audit", action: "export", label: "Export Audit", description: "Export audit logs", risk_level: "medium" },

  // Announcements Management
  { key: "announcements.read", module: "announcements", action: "read", label: "View Announcements", description: "View announcements list", risk_level: "low" },
  { key: "announcements.write", module: "announcements", action: "write", label: "Manage Announcements", description: "Create and edit announcements", risk_level: "medium" },

  // Templates & Content
  { key: "templates.read", module: "templates", action: "read", label: "View Templates", description: "View templates list", risk_level: "low" },
  { key: "templates.write", module: "templates", action: "write", label: "Edit Templates", description: "Modify template configuration", risk_level: "medium" },
  { key: "templates.approve", module: "templates", action: "approve", label: "Review Templates", description: "Review template publishing", risk_level: "medium" },

  // Permission Management
  { key: "permissions.read", module: "permissions", action: "read", label: "View Permissions", description: "View permission configuration", risk_level: "low" },
  { key: "permissions.write", module: "permissions", action: "write", label: "Manage Permissions", description: "Modify role permissions", risk_level: "critical" },

  // Session Management
  { key: "sessions.read", module: "sessions", action: "read", label: "View Sessions", description: "View login sessions", risk_level: "low" },
  { key: "sessions.write", module: "sessions", action: "write", label: "Manage Sessions", description: "Terminate sessions", risk_level: "medium" },

  // Analytics Data
  { key: "analytics.read", module: "analytics", action: "read", label: "View Analytics", description: "View analytics data", risk_level: "low" },
  { key: "analytics.export", module: "analytics", action: "export", label: "Export Analytics", description: "Export analytics reports", risk_level: "medium" },

  // Approval Management
  { key: "approvals.read", module: "approvals", action: "read", label: "View Approvals", description: "View approval requests", risk_level: "low" },
  { key: "approvals.approve", module: "approvals", action: "approve", label: "Process Approvals", description: "Approve or reject requests", risk_level: "high" },
];

// ===== Role Permission Matrix =====

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

// ===== Permission Check Utility Functions =====

/**
 * Check if a role has the specified module permission
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
 * Check if a role has the specified permission point
 */
export function hasPermissionPoint(role: AdminRole, permissionKey: string): boolean {
  const point = PERMISSION_POINTS.find((p) => p.key === permissionKey);
  if (!point) return false;

  const level = ROLE_PERMISSION_MATRIX[role]?.[point.module];
  if (!level || level === "none") return false;

  // Read actions only require read or read_write permission
  if (point.action === "read") {
    return level === "read" || level === "read_write";
  }

  // Other actions require read_write permission
  return level === "read_write";
}

/**
 * Get all permission points for a role
 */
export function getRolePermissions(role: AdminRole): PermissionPoint[] {
  return PERMISSION_POINTS.filter((point) => hasPermissionPoint(role, point.key));
}

/**
 * Get all module list
 */
export function getAllModules(): string[] {
  return [...new Set(PERMISSION_POINTS.map((p) => p.module))];
}

/**
 * Get all permission points for a module
 */
export function getModulePermissions(module: string): PermissionPoint[] {
  return PERMISSION_POINTS.filter((p) => p.module === module);
}

// ===== Page Permission Mapping =====

export interface PagePermission {
  path: string;
  requiredPermissions: string[];
  requireAll?: boolean; // Whether all permissions are required, defaults to false (any one is sufficient)
}

export const PAGE_PERMISSIONS: PagePermission[] = [
  // Dashboard
  { path: "/", requiredPermissions: [] },

  // User Management
  { path: "/users", requiredPermissions: ["users.read"] },
  { path: "/users/[id]", requiredPermissions: ["users.read"] },

  // Workspace Management
  { path: "/workspaces", requiredPermissions: ["workspaces.read"] },
  { path: "/workspaces/[id]", requiredPermissions: ["workspaces.read"] },

  // App Management
  { path: "/apps", requiredPermissions: ["apps.read"] },
  { path: "/apps/[id]", requiredPermissions: ["apps.read"] },

  // Ticket Support
  { path: "/support/tickets", requiredPermissions: ["support.read"] },
  { path: "/support/tickets/[id]", requiredPermissions: ["support.read"] },
  { path: "/support/channels", requiredPermissions: ["support.manage"] },
  { path: "/support/teams", requiredPermissions: ["support.manage"] },
  { path: "/support/queues", requiredPermissions: ["support.manage"] },
  { path: "/support/routing-rules", requiredPermissions: ["support.manage"] },
  { path: "/support/notification-templates", requiredPermissions: ["support.manage"] },

  // Billing & Earnings
  { path: "/billing", requiredPermissions: ["billing.read"] },
  { path: "/billing/invoices", requiredPermissions: ["billing.read"] },
  { path: "/billing/withdrawals", requiredPermissions: ["earnings.read"] },
  { path: "/billing/refunds", requiredPermissions: ["billing.read"] },
  { path: "/billing/anomalies", requiredPermissions: ["billing.read"] },
  { path: "/billing/rules", requiredPermissions: ["billing.read"] },

  // Security Configuration
  { path: "/security/config", requiredPermissions: ["config.read"] },
  { path: "/security/secrets", requiredPermissions: ["secrets.read"] },
  { path: "/security/audit-logs", requiredPermissions: ["audit.read"] },
  { path: "/security/sessions", requiredPermissions: ["sessions.read"] },
  { path: "/security/ip-whitelist", requiredPermissions: ["config.write"] },
  { path: "/security/2fa", requiredPermissions: ["config.write"] },
  { path: "/security/approvals", requiredPermissions: ["approvals.read"] },
  { path: "/security/compliance", requiredPermissions: ["config.read"] },
  { path: "/security/supply-chain", requiredPermissions: ["config.read"] },

  // System Operations
  { path: "/system/health", requiredPermissions: ["system.read"] },
  { path: "/system/features", requiredPermissions: ["system.read"] },
  { path: "/system/deployment", requiredPermissions: ["system.read"] },
  { path: "/system/error-codes", requiredPermissions: ["system.read"] },
  { path: "/system/capacity", requiredPermissions: ["system.read"] },

  // Ops Operations
  { path: "/ops/sops", requiredPermissions: ["system.read"] },
  { path: "/ops/queues", requiredPermissions: ["system.write"] },
  { path: "/ops/jobs", requiredPermissions: ["system.read"] },
  { path: "/ops/logs", requiredPermissions: ["system.read"] },
  { path: "/ops/changes", requiredPermissions: ["system.read"] },

  // Analytics
  { path: "/analytics/workspace-behavior", requiredPermissions: ["analytics.read"] },
  { path: "/analytics/model-usage", requiredPermissions: ["analytics.read"] },
  { path: "/analytics/app-usage", requiredPermissions: ["analytics.read"] },

  // Announcements
  { path: "/announcements", requiredPermissions: ["announcements.read"] },

  // Templates & Tags
  { path: "/templates", requiredPermissions: ["templates.read"] },
  { path: "/tags", requiredPermissions: ["templates.read"] },

  // Workflows
  { path: "/workflows", requiredPermissions: ["workflows.read"] },
  { path: "/workflows/[id]", requiredPermissions: ["workflows.read"] },
  { path: "/executions", requiredPermissions: ["executions.read"] },
  { path: "/executions/[id]", requiredPermissions: ["executions.read"] },

  // Conversations & Creative
  { path: "/conversations", requiredPermissions: ["conversations.read"] },
  { path: "/conversations/moderation", requiredPermissions: ["conversations.read"] },
  { path: "/conversations/strategies", requiredPermissions: ["conversations.read"] },
  { path: "/conversations/templates", requiredPermissions: ["conversations.read"] },
  { path: "/creative/tasks", requiredPermissions: ["conversations.read"] },

  // Export
  { path: "/exports", requiredPermissions: ["analytics.export"] },
];

/**
 * Check if a role has permission to access the specified page
 */
export function canAccessPage(role: AdminRole, path: string): boolean {
  // Super admin can access all pages
  if (role === "super_admin") return true;

  // Find matching page permission configuration
  const pagePermission = PAGE_PERMISSIONS.find((p) => {
    // Exact match
    if (p.path === path) return true;
    // Dynamic route match
    const pattern = p.path.replace(/\[.*?\]/g, "[^/]+");
    return new RegExp(`^${pattern}$`).test(path);
  });

  // Pages without permission configuration are allowed by default
  if (!pagePermission || pagePermission.requiredPermissions.length === 0) {
    return true;
  }

  // Check permissions
  if (pagePermission.requireAll) {
    return pagePermission.requiredPermissions.every((key) => hasPermissionPoint(role, key));
  }

  return pagePermission.requiredPermissions.some((key) => hasPermissionPoint(role, key));
}
