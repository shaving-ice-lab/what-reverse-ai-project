import type { UserRole } from "@/types/auth";

export type WorkspaceRole = "owner" | "admin" | "member";

export type WorkspacePermission =
  | "members_manage"
  | "billing_manage"
  | "workspace_publish"
  | "workspace_edit"
  | "workspace_view_metrics"
  | "logs_view"
  | "workspace_admin"
  | "workspace_create"
  | "plan_view"
  | "plan_manage";

export type WorkspacePermissionMap = Record<WorkspacePermission, boolean>;

export const workspaceRolePermissions: Record<WorkspaceRole, WorkspacePermissionMap> = {
  owner: {
    members_manage: true,
    billing_manage: true,
    workspace_publish: true,
    workspace_edit: true,
    workspace_view_metrics: true,
    logs_view: true,
    workspace_admin: true,
    workspace_create: true,
    plan_view: true,
    plan_manage: true,
  },
  admin: {
    members_manage: true,
    billing_manage: false,
    workspace_publish: true,
    workspace_edit: true,
    workspace_view_metrics: true,
    logs_view: true,
    workspace_admin: false,
    workspace_create: true,
    plan_view: true,
    plan_manage: true,
  },
  member: {
    members_manage: false,
    billing_manage: false,
    workspace_publish: false,
    workspace_edit: true,
    workspace_view_metrics: true,
    logs_view: true,
    workspace_admin: false,
    workspace_create: true,
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
