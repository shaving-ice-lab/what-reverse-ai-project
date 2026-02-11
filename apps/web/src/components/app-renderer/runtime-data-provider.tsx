'use client'

import React, { useCallback } from 'react'
import { DataProviderContext } from './data-provider'
import { getRuntimeBaseUrl } from '@/lib/env'
import { getStoredTokens } from '@/lib/api/shared'

interface RuntimeDataProviderProps {
  workspaceSlug: string
  children: React.ReactNode
}

function buildRuntimeUrl(path: string): string {
  const base = getRuntimeBaseUrl().replace(/\/$/, '')
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (base) return `${base}${normalized}`
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${normalized}`
  }
  return normalized
}

async function runtimeFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = buildRuntimeUrl(path)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  const tokens = getStoredTokens()
  if (tokens?.accessToken) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`
  }

  const response = await fetch(url, { ...options, headers })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = (payload as any)?.message || 'Request failed'
    throw new Error(message)
  }

  return (payload as any)?.data as T
}

/**
 * RuntimeDataProvider — provides the same DataProviderContext interface
 * but routes requests through /runtime/:slug/data/:table (public access).
 * This allows all existing AppRenderer blocks to work without changes.
 */
export function RuntimeDataProvider({ workspaceSlug, children }: RuntimeDataProviderProps) {
  const basePath = `/runtime/${encodeURIComponent(workspaceSlug)}/data`

  const queryRows = useCallback(
    async (table: string, params?: { columns?: string[]; where?: string; order_by?: { column: string; direction: string }[]; limit?: number; offset?: number }) => {
      const searchParams = new URLSearchParams()
      if (params?.limit) searchParams.set('page_size', String(params.limit))
      if (params?.offset && params.limit) {
        searchParams.set('page', String(Math.floor(params.offset / params.limit) + 1))
      }
      const qs = searchParams.toString()
      const url = `${basePath}/${encodeURIComponent(table)}${qs ? `?${qs}` : ''}`
      const res = await runtimeFetch<{ rows: Record<string, unknown>[]; total: number; columns: string[] }>(url)
      return res || { rows: [], total: 0, columns: [] }
    },
    [basePath]
  )

  const insertRow = useCallback(
    async (table: string, data: Record<string, unknown>) => {
      await runtimeFetch(`${basePath}/${encodeURIComponent(table)}`, {
        method: 'POST',
        body: JSON.stringify({ data }),
      })
    },
    [basePath]
  )

  const updateRow = useCallback(
    async (table: string, data: Record<string, unknown>, _where: string) => {
      await runtimeFetch(`${basePath}/${encodeURIComponent(table)}`, {
        method: 'PATCH',
        body: JSON.stringify({ data }),
      })
    },
    [basePath]
  )

  const deleteRows = useCallback(
    async (table: string, where: string) => {
      // Parse "id = 'xxx'" style where clause to extract IDs for the runtime API
      const idMatch = where.match(/id\s*=\s*'([^']+)'/)
      const ids = idMatch ? [idMatch[1]] : []
      if (ids.length === 0) return
      await runtimeFetch(`${basePath}/${encodeURIComponent(table)}`, {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
      })
    },
    [basePath]
  )

  const executeWorkflow = useCallback(
    async (workflowId: string, inputs: Record<string, unknown>) => {
      await runtimeFetch(`/runtime/${encodeURIComponent(workspaceSlug)}/workflows/${encodeURIComponent(workflowId)}/execute`, {
        method: 'POST',
        body: JSON.stringify({ inputs, trigger_type: 'form_submit' }),
      })
    },
    [workspaceSlug]
  )

  return (
    <DataProviderContext.Provider value={{ workspaceId: workspaceSlug, queryRows, insertRow, updateRow, deleteRows, executeWorkflow }}>
      {children}
    </DataProviderContext.Provider>
  )
}
