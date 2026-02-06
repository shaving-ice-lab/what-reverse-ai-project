"use client";

/**
 * AppAccessGate 兼容组件
 * Workspace = App 架构合并后，App 级别的权限检查由 Workspace 层承担
 */

import type { ReactNode } from "react";

interface AppAccessGateProps {
  appId?: string;
  workspaceId?: string;
  requiredPermission?: string;
  children: ReactNode;
  fallback?: ReactNode;
  /** @deprecated 兼容旧调用方式 - 权限已由 WorkspaceGuard 统一处理 */
  app?: unknown;
  /** @deprecated 兼容旧调用方式 */
  permissions?: unknown;
  /** @deprecated 使用 requiredPermission 代替 */
  required?: string[];
  /** @deprecated 兼容旧调用方式 */
  backHref?: string;
}

/**
 * AppAccessGate 在新架构下直接放行子组件。
 * 权限检查已在 WorkspaceGuard（layout 层）统一处理。
 */
export function AppAccessGate({ children }: AppAccessGateProps) {
  return <>{children}</>;
}
