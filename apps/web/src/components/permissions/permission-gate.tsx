import type { ReactNode } from "react";
import {
  hasAnyWorkspacePermission,
  type WorkspacePermission,
  type WorkspacePermissionMap,
} from "@/lib/permissions";

interface PermissionGateProps {
  permissions?: Partial<WorkspacePermissionMap>;
  required: WorkspacePermission[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({
  permissions,
  required,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGateProps) {
  const allowed = requireAll
    ? required.every((permission) => Boolean(permissions?.[permission]))
    : hasAnyWorkspacePermission(permissions, ...required);

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
