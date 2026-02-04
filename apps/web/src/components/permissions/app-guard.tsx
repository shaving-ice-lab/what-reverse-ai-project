"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { appApi, type App } from "@/lib/api/app";
import { ApiError } from "@/lib/api";
import { ExceptionState } from "@/components/ui/empty-state";
import { useWorkspaceContext } from "@/components/permissions/workspace-guard";
import {
  hasAnyWorkspacePermission,
  type WorkspacePermission,
} from "@/lib/permissions";

type GuardStatus = "loading" | "ready" | "not_found" | "forbidden" | "error";

interface AppGuardProps {
  workspaceId: string;
  appId: string;
  requiredPermissions?: WorkspacePermission[];
  children: React.ReactNode;
}

export function AppGuard({
  workspaceId,
  appId,
  requiredPermissions = [],
  children,
}: AppGuardProps) {
  const { permissions, isLoading: workspaceLoading } = useWorkspaceContext();
  const [app, setApp] = useState<App | null>(null);
  const [status, setStatus] = useState<GuardStatus>("loading");

  const hasPermission = useMemo(() => {
    if (requiredPermissions.length === 0) return true;
    return hasAnyWorkspacePermission(permissions, ...requiredPermissions);
  }, [permissions, requiredPermissions]);

  useEffect(() => {
    if (!appId) {
      setStatus("not_found");
      setApp(null);
      return;
    }

    let cancelled = false;
    const loadApp = async () => {
      setStatus("loading");
      try {
        const response = await appApi.get(appId);
        if (cancelled) return;
        const data = "data" in response ? response.data : (response as App);
        const appWorkspaceId =
          (data as App & { workspaceId?: string; workspace_id?: string })?.workspaceId ||
          (data as App & { workspaceId?: string; workspace_id?: string })?.workspace_id;
        if (appWorkspaceId && appWorkspaceId !== workspaceId) {
          setStatus("not_found");
          setApp(null);
          return;
        }
        setApp(data || null);
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError) {
          if (error.status === 404) {
            setStatus("not_found");
            return;
          }
          if (error.status === 403) {
            setStatus("forbidden");
            return;
          }
        }
        setStatus("error");
      }
    };

    loadApp();
    return () => {
      cancelled = true;
    };
  }, [appId, workspaceId]);

  if (workspaceLoading || status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-foreground-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          正在加载应用...
        </div>
      </div>
    );
  }

  if (status === "not_found") {
    return (
      <ExceptionState
        variant="not_found"
        title="应用不存在"
        description="没有找到该应用或已被移除。"
        action={{ label: "返回应用列表", href: `/workspaces/${workspaceId}/apps` }}
      />
    );
  }

  if (status === "forbidden") {
    return (
      <ExceptionState
        variant="permission"
        title="无权访问该应用"
        description="请联系管理员或切换到有权限的工作空间。"
        action={{ label: "返回应用列表", href: `/workspaces/${workspaceId}/apps` }}
      />
    );
  }

  if (!hasPermission) {
    return (
      <ExceptionState
        variant="permission"
        title="权限不足"
        description="当前角色无法访问该页面。"
        action={{ label: "返回应用列表", href: `/workspaces/${workspaceId}/apps` }}
      />
    );
  }

  if (status === "error") {
    return (
      <ExceptionState
        variant="error"
        title="加载失败"
        description="应用信息加载失败，请稍后重试。"
        action={{ label: "返回应用列表", href: `/workspaces/${workspaceId}/apps` }}
      />
    );
  }

  return <>{children}</>;
}
