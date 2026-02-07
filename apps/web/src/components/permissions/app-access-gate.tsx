"use client";

/**
 * AppAccessGate CompatibleComponent
 * Workspace = App Architectureandafter, App Level'sPermissionCheck Workspace 
 */

import type { ReactNode } from "react";

interface AppAccessGateProps {
 appId?: string;
 workspaceId?: string;
 requiredPermission?: string;
 children: ReactNode;
 fallback?: ReactNode;
 /** @deprecated CompatibleoldCallmethod - Permissionalready WorkspaceGuard 1Process */
 app?: unknown;
 /** @deprecated CompatibleoldCallmethod */
 permissions?: unknown;
 /** @deprecated Usage requiredPermission */
 required?: string[];
 /** @deprecated CompatibleoldCallmethod */
 backHref?: string;
}

/**
 * AppAccessGate atnewArchitecturedownDirectrowComponent.
 * PermissionCheckalreadyat WorkspaceGuard(layout )1Process.
 */
export function AppAccessGate({ children }: AppAccessGateProps) {
 return <>{children}</>;
}
