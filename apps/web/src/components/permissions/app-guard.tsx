"use client";

/**
 * AppGuard CompatibleComponent
 * Workspace = App Architectureandafter, AppGuard Delegateto WorkspaceGuard
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
 // Workspace = App, DirectUsage WorkspaceGuard
 // requiredPermissions outside WorkspaceGuard 's context Process, thisAcceptbutnotneedneedoutsideLogic
 if (workspaceId) {
 return (
 <WorkspaceGuard workspaceId={workspaceId} fallback={fallback}>
 {children}
 </WorkspaceGuard>
 );
 }

 // No workspaceId timeDirectRenderComponent
 return <>{children}</>;
}

// re-newExport workspace context withCompatibleoldCode
export { useWorkspaceContext as useAppContext };
