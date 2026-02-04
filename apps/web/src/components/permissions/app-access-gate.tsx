"use client";

import type { ReactNode } from "react";
import { ExceptionState } from "@/components/ui/empty-state";
import {
  hasAnyWorkspacePermission,
  type WorkspacePermission,
  type WorkspacePermissionMap,
} from "@/lib/permissions";
import type { App } from "@/lib/api/app";

const resolveAppWorkspaceId = (app?: App | null) => {
  if (!app) return null;
  return (
    (app as { workspace_id?: string }).workspace_id ||
    (app as { workspaceId?: string }).workspaceId ||
    (app as { workspace?: { id?: string } }).workspace?.id ||
    null
  );
};

interface AppAccessGateProps {
  app: App | null;
  workspaceId: string;
  permissions?: Partial<WorkspacePermissionMap>;
  required?: WorkspacePermission[];
  requireAll?: boolean;
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
}

export function AppAccessGate({
  app,
  workspaceId,
  permissions,
  required,
  requireAll = false,
  backHref,
  backLabel = "返回应用列表",
  children,
}: AppAccessGateProps) {
  const hasPermission = required
    ? requireAll
      ? required.every((permission) => Boolean(permissions?.[permission]))
      : hasAnyWorkspacePermission(permissions, ...required)
    : true;

  if (!hasPermission) {
    return (
      <div className="h-full flex items-center justify-center px-6">
        <div className="w-full max-w-xl">
          <ExceptionState
            variant="permission"
            title="权限不足"
            description="当前账号没有访问该页面的权限，请联系管理员授权。"
            action={{
              label: backLabel,
              href: backHref || `/workspaces/${workspaceId}/apps`,
            }}
          />
        </div>
      </div>
    );
  }

  const appWorkspaceId = resolveAppWorkspaceId(app);
  if (app && appWorkspaceId && appWorkspaceId !== workspaceId) {
    const redirectHref = app?.id
      ? `/workspaces/${appWorkspaceId}/apps/${app.id}`
      : `/workspaces/${appWorkspaceId}/apps`;
    return (
      <div className="h-full flex items-center justify-center px-6">
        <div className="w-full max-w-xl">
          <ExceptionState
            variant="permission"
            title="应用不属于当前 Workspace"
            description="该应用属于其他 Workspace，请切换到正确的工作空间查看。"
            action={{
              label: "前往所属 Workspace",
              href: redirectHref,
            }}
            secondaryAction={{
              label: backLabel,
              href: backHref || `/workspaces/${workspaceId}/apps`,
            }}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
