'use client'

import React, { useCallback, useRef } from 'react'
import { DataProviderContext } from './data-provider'
import { getRuntimeBaseUrl } from '@/lib/env'
import { getStoredTokens } from '@/lib/api/shared'

interface RuntimeDataProviderProps {
  workspaceSlug: string
  children: React.ReactNode
  appAuthToken?: string | null
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

async function runtimeFetch<T>(
  path: string,
  options: RequestInit = {},
  appAuthToken?: string | null
): Promise<T> {
  const url = buildRuntimeUrl(path)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  const tokens = getStoredTokens()
  if (tokens?.accessToken) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`
  }
  if (appAuthToken) {
    headers['X-App-Token'] = appAuthToken
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
type TableChangeListener = (table: string) => void

export function RuntimeDataProvider({
  workspaceSlug,
  children,
  appAuthToken,
}: RuntimeDataProviderProps) {
  const basePath = `/runtime/${encodeURIComponent(workspaceSlug)}/data`
  const listenersRef = useRef<Set<TableChangeListener>>(new Set())

  const notifyTableChange = useCallback((table: string) => {
    listenersRef.current.forEach((fn) => fn(table))
  }, [])

  const onTableChange = useCallback((listener: TableChangeListener) => {
    listenersRef.current.add(listener)
    return () => {
      listenersRef.current.delete(listener)
    }
  }, [])

  const queryRows = useCallback(
    async (
      table: string,
      params?: {
        columns?: string[]
        filters?: { column: string; operator: string; value: unknown }[]
        filter_combinator?: 'AND' | 'OR'
        order_by?: { column: string; direction: string }[]
        limit?: number
        offset?: number
      }
    ) => {
      const searchParams = new URLSearchParams()
      if (params?.limit) searchParams.set('page_size', String(params.limit))
      if (params?.offset && params.limit) {
        searchParams.set('page', String(Math.floor(params.offset / params.limit) + 1))
      }
      if (params?.filters?.length) {
        params.filters.forEach((f, i) => {
          searchParams.set(`filters[${i}][column]`, f.column)
          searchParams.set(`filters[${i}][operator]`, f.operator)
          searchParams.set(`filters[${i}][value]`, String(f.value ?? ''))
        })
      }
      if (params?.order_by?.length) {
        const ob = params.order_by[0]
        searchParams.set('order_by', ob.column)
        searchParams.set('order_dir', ob.direction || 'ASC')
      }
      if (params?.filter_combinator) {
        searchParams.set('filter_combinator', params.filter_combinator)
      }
      const qs = searchParams.toString()
      const url = `${basePath}/${encodeURIComponent(table)}${qs ? `?${qs}` : ''}`
      const res = await runtimeFetch<{
        rows: Record<string, unknown>[]
        total: number
        columns: string[]
      }>(url, {}, appAuthToken)
      return res || { rows: [], total: 0, columns: [] }
    },
    [basePath, appAuthToken]
  )

  const insertRow = useCallback(
    async (table: string, data: Record<string, unknown>) => {
      await runtimeFetch(
        `${basePath}/${encodeURIComponent(table)}`,
        {
          method: 'POST',
          body: JSON.stringify({ data }),
        },
        appAuthToken
      )
    },
    [basePath, appAuthToken]
  )

  const updateRow = useCallback(
    async (table: string, data: Record<string, unknown>, _where: string) => {
      await runtimeFetch(
        `${basePath}/${encodeURIComponent(table)}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ data }),
        },
        appAuthToken
      )
    },
    [basePath, appAuthToken]
  )

  const deleteRows = useCallback(
    async (table: string, where: string, ids?: unknown[]) => {
      // Prefer structured ids when available; fall back to parsing WHERE clause
      let resolvedIds = ids?.length ? ids : []
      if (resolvedIds.length === 0 && where) {
        const idMatch = where.match(/id\s*=\s*'([^']+)'/)
        resolvedIds = idMatch ? [idMatch[1]] : []
      }
      if (resolvedIds.length === 0) return
      await runtimeFetch(
        `${basePath}/${encodeURIComponent(table)}`,
        {
          method: 'DELETE',
          body: JSON.stringify({ ids: resolvedIds }),
        },
        appAuthToken
      )
    },
    [basePath, appAuthToken]
  )

  const uploadFile = useCallback(
    async (file: File, prefix?: string): Promise<string> => {
      const formData = new FormData()
      formData.append('file', file)
      if (prefix) formData.append('prefix', prefix)
      const url = buildRuntimeUrl(`/runtime/${encodeURIComponent(workspaceSlug)}/storage/upload`)
      const headers: Record<string, string> = {}
      const tokens = getStoredTokens()
      if (tokens?.accessToken) headers['Authorization'] = `Bearer ${tokens.accessToken}`
      if (appAuthToken) headers['X-App-Token'] = appAuthToken
      const res = await fetch(url, { method: 'POST', headers, body: formData })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((payload as any)?.message || 'Upload failed')
      return (payload as any)?.data?.public_url || ''
    },
    [workspaceSlug, appAuthToken]
  )

  return (
    <DataProviderContext.Provider
      value={{
        workspaceId: workspaceSlug,
        queryRows,
        insertRow,
        updateRow,
        deleteRows,
        uploadFile,
        notifyTableChange,
        onTableChange,
      }}
    >
      {children}
    </DataProviderContext.Provider>
  )
}
