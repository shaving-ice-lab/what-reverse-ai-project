'use client'

import { createContext, useContext } from 'react'
import type { Workspace } from '@/lib/api/workspace'

export interface WorkspaceContextValue {
  /** Current active workspace ID (null if none selected) */
  workspaceId: string | null
  /** Current active workspace object */
  workspace: Workspace | null
  /** All available workspaces for the user */
  workspaces: Workspace[]
  /** Whether workspaces are still loading */
  isLoading: boolean
  /** Switch to a different workspace */
  switchWorkspace: (workspaceId: string) => void
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

/**
 * Global workspace hook — provides the active workspace context
 * set by the Dashboard Layout. Replaces all `useActiveWorkspaceId()` patterns.
 */
export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) {
    throw new Error('useWorkspace() must be used within <WorkspaceContext.Provider>')
  }
  return ctx
}
