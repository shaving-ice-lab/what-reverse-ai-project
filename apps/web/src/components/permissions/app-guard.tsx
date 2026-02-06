"use client";

/**
 * AppGuard 兼容组件
 * Workspace = App 架构合并后，AppGuard 委托给 WorkspaceGuard
 */

import type { ReactNode } from "react";
import { WorkspaceGuard, useWorkspaceContext } from "./workspace-guard";

interface AppGuardProps {
  appId?: string;
  workspaceId?: string;
  requiredPermissions?: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function AppGuard({ children, workspaceId, fallback }: AppGuardProps) {
  // Workspace = App，直接使用 WorkspaceGuard
  // requiredPermissions 由外层 WorkspaceGuard 的 context 处理，此处接受但不需要额外逻辑
  if (workspaceId) {
    return (
      <WorkspaceGuard workspaceId={workspaceId} fallback={fallback}>
        {children}
      </WorkspaceGuard>
    );
  }

  // 没有 workspaceId 时直接渲染子组件
  return <>{children}</>;
}

// 重新导出 workspace context 以兼容旧代码
export { useWorkspaceContext as useAppContext };
