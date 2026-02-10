'use client'

/**
 * AppAccessGate Compatibility Component
 * In the workspace-as-app architecture, app-level permission checks are handled at the workspace level
 */

import type { ReactNode } from 'react'

interface AppAccessGateProps {
  appId?: string
  workspaceId?: string
  requiredPermission?: string
  children: ReactNode
  fallback?: ReactNode
  /** @deprecated Compatible with old call method - Permissions are already handled by WorkspaceGuard */
  app?: unknown
  /** @deprecated Compatible with old call method */
  permissions?: unknown
  /** @deprecated Use requiredPermission instead */
  required?: string[]
  /** @deprecated Compatible with old call method */
  backHref?: string
}

/**
 * AppAccessGate is a passthrough component in the new architecture.
 * Permission checks are already handled by WorkspaceGuard in the layout.
 */
export function AppAccessGate({ children }: AppAccessGateProps) {
  return <>{children}</>
}
