import type { UserRole } from "@/types/auth";

export type WorkspaceRole = "owner" | "admin" | "member";

export type WorkspacePermission =
  | "members_manage"
  | "billing_manage"
  | "app_publish"
  | "app_edit"
  | "app_view_metrics"
  | "logs_view"
  | "workspace_admin"
  | "apps_create"
  | "plan_view"
  | "plan_manage";

export type WorkspacePermissionMap = Record<WorkspacePermission, boolean>;

export const workspaceRolePermissions: Record<WorkspaceRole, WorkspacePermissionMap> = {
  owner: {
    members_manage: true,
    billing_manage: true,
    app_publish: true,
    app_edit: true,
    app_view_metrics: true,
    logs_view: true,
    workspace_admin: true,
    apps_create: true,
    plan_view: true,
    plan_manage: true,
  },
  admin: {
    members_manage: true,
    billing_manage: false,
    app_publish: true,
    app_edit: true,
    app_view_metrics: true,
    logs_view: true,
    workspace_admin: false,
    apps_create: true,
    plan_view: true,
    plan_manage: true,
  },
  member: {
    members_manage: false,
    billing_manage: false,
    app_publish: false,
    app_edit: true,
    app_view_metrics: true,
    logs_view: true,
    workspace_admin: false,
    apps_create: true,
    plan_view: true,
    plan_manage: false,
  },
};

export function resolveWorkspaceRoleFromUser(userRole?: UserRole): WorkspaceRole {
  switch (userRole) {
    case "admin":
      return "owner";
    case "creator":
      return "admin";
    case "user":
    default:
      return "member";
  }
}

export function buildWorkspacePermissions(role: WorkspaceRole): WorkspacePermissionMap {
  return workspaceRolePermissions[role];
}

export function hasWorkspacePermission(
  permissions: Partial<WorkspacePermissionMap> | undefined,
  permission: WorkspacePermission
): boolean {
  return Boolean(permissions?.[permission]);
}

export function hasAnyWorkspacePermission(
  permissions: Partial<WorkspacePermissionMap> | undefined,
  ...required: WorkspacePermission[]
): boolean {
  return required.some((permission) => hasWorkspacePermission(permissions, permission));
}
