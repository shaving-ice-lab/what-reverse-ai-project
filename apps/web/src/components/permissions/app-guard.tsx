"use client";

/**
 * AppGuard Compatible Component
 * In the Workspace = App architecture, AppGuard delegates to WorkspaceGuard
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
 // Workspace = App, directly use WorkspaceGuard
 // requiredPermissions are processed within WorkspaceGuard's context, accepted but not needed for external logic
 if (workspaceId) {
 return (
 <WorkspaceGuard workspaceId={workspaceId} fallback={fallback}>
 {children}
 </WorkspaceGuard>
 );
 }

 // No workspaceId, directly render children
 return <>{children}</>;
}

// re-newExport workspace context withCompatibleoldCode
export { useWorkspaceContext as useAppContext };
