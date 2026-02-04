"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { workspaceApi, type Workspace } from "@/lib/api/workspace";
import { ApiError } from "@/lib/api/client";
import { ExceptionState } from "@/components/ui/empty-state";
import {
  buildWorkspacePermissions,
  resolveWorkspaceRoleFromUser,
  type WorkspacePermissionMap,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/useAuthStore";

type WorkspaceGuardError = {
  variant: "permission" | "not_found" | "error";
  title: string;
  description: string;
};

interface WorkspaceContextValue {
  workspaceId: string;
  workspace: Workspace | null;
  permissions: WorkspacePermissionMap;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspaceContext must be used within WorkspaceGuard");
  }
  return context;
}

function resolveErrorState(error: unknown): WorkspaceGuardError {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return {
        variant: "permission",
        title: "没有访问该 Workspace 的权限",
        description: error.message || "请联系管理员获取访问权限。",
      };
    }
    if (error.status === 404) {
      return {
        variant: "not_found",
        title: "Workspace 不存在",
        description: "当前 Workspace 已被移除或无法访问。",
      };
    }
  }
  return {
    variant: "error",
    title: "Workspace 加载失败",
    description: "请稍后重试或检查网络状态。",
  };
}

export function WorkspaceGuard({
  workspaceId,
  children,
}: {
  workspaceId: string;
  children: ReactNode;
}) {
  const { user } = useAuthStore();
  const permissions = useMemo(
    () => buildWorkspacePermissions(resolveWorkspaceRoleFromUser(user?.role)),
    [user?.role]
  );
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<WorkspaceGuardError | null>(null);

  const buildRedirectPath = useCallback(
    (nextWorkspaceId: string) => {
      if (!pathname) return null;
      const segments = pathname.split("/").filter(Boolean);
      const index = segments.indexOf("workspaces");
      if (index === -1 || index + 1 >= segments.length) return null;
      segments[index + 1] = nextWorkspaceId;
      const nextPath = `/${segments.join("/")}`;
      const query = searchParams?.toString();
      return query ? `${nextPath}?${query}` : nextPath;
    },
    [pathname, searchParams]
  );

  const loadWorkspace = useCallback(async () => {
    if (!workspaceId) {
      setError({
        variant: "not_found",
        title: "Workspace 不存在",
        description: "当前 Workspace 已被移除或无法访问。",
      });
      setWorkspace(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await workspaceApi.get(workspaceId);
      if (data.status === "suspended") {
        setError({
          variant: "permission",
          title: "Workspace 已暂停",
          description: "该 Workspace 已暂停使用，请联系管理员恢复。",
        });
        setWorkspace(data);
        return;
      }
      if (data.status === "deleted") {
        setError({
          variant: "not_found",
          title: "Workspace 已删除",
          description: "该 Workspace 已被移除或无法访问。",
        });
        setWorkspace(null);
        return;
      }
      setWorkspace(data);
      return;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        try {
          const data = await workspaceApi.getBySlug(workspaceId);
          setWorkspace(data);
          const redirectPath = buildRedirectPath(data.id);
          if (redirectPath && data.id !== workspaceId) {
            router.replace(redirectPath);
          }
          return;
        } catch (slugError) {
          setError(resolveErrorState(slugError));
          setWorkspace(null);
          return;
        }
      }
      setError(resolveErrorState(error));
      setWorkspace(null);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, buildRedirectPath, router]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const contextValue = useMemo<WorkspaceContextValue>(
    () => ({
      workspaceId,
      workspace,
      permissions,
      isLoading,
      refresh: loadWorkspace,
    }),
    [workspaceId, workspace, permissions, isLoading, loadWorkspace]
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center px-6">
        <Loader2 className="w-6 h-6 animate-spin text-foreground-muted" />
      </div>
    );
  }

  if (error) {
    const action =
      error.variant === "error"
        ? { label: "重新加载", onClick: loadWorkspace }
        : { label: "返回工作空间", href: "/dashboard/workspaces" };
    const secondaryAction =
      error.variant === "permission"
        ? { label: "返回仪表盘", href: "/dashboard" }
        : undefined;
    return (
      <div className="h-full flex items-center justify-center px-6">
        <div className="w-full max-w-xl">
          <ExceptionState
            variant={error.variant}
            title={error.title}
            description={error.description}
            action={action}
            secondaryAction={secondaryAction}
          />
        </div>
      </div>
    );
  }

  return (
    <WorkspaceContext.Provider value={contextValue}>{children}</WorkspaceContext.Provider>
  );
}
