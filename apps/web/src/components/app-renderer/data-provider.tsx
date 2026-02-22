'use client'

import React, { createContext, useContext, useCallback, useMemo, useRef } from 'react'
import { request, getStoredTokens } from '@/lib/api/shared'
import { getApiBaseUrl } from '@/lib/env'

type TableChangeListener = (table: string) => void

interface DataProviderContextValue {
  workspaceId: string
  queryRows: (table: string, params?: QueryParams) => Promise<QueryResult>
  insertRow: (table: string, data: Record<string, unknown>) => Promise<void>
  updateRow: (table: string, data: Record<string, unknown>, where: string) => Promise<void>
  deleteRows: (table: string, where: string, ids?: unknown[]) => Promise<void>
  uploadFile?: (file: File, prefix?: string) => Promise<string>
  fetchApiSource?: (
    path: string,
    options?: { method?: string; body?: Record<string, unknown> }
  ) => Promise<unknown>
  notifyTableChange: (table: string) => void
  onTableChange: (listener: TableChangeListener) => () => void
}

interface QueryParams {
  columns?: string[]
  filters?: { column: string; operator: string; value: unknown }[]
  filter_combinator?: 'AND' | 'OR'
  order_by?: { column: string; direction: string }[]
  limit?: number
  offset?: number
}

interface QueryResult {
  rows: Record<string, unknown>[]
  total: number
  columns: string[]
}

export const DataProviderContext = createContext<DataProviderContextValue | null>(null)

export function useDataProvider() {
  const ctx = useContext(DataProviderContext)
  if (!ctx) throw new Error('useDataProvider must be used within <DataProvider>')
  return ctx
}

interface DataProviderProps {
  workspaceId: string
  children: React.ReactNode
}

export function DataProvider({ workspaceId, children }: DataProviderProps) {
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
    async (table: string, params?: QueryParams): Promise<QueryResult> => {
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
      const url = `/workspaces/${workspaceId}/database/tables/${table}/rows${qs ? `?${qs}` : ''}`
      const res = await request<any>(url)
      const payload = (res as any)?.data ?? res
      return payload || { rows: [], total: 0, columns: [] }
    },
    [workspaceId]
  )

  const insertRow = useCallback(
    async (table: string, data: Record<string, unknown>) => {
      await request(`/workspaces/${workspaceId}/database/tables/${table}/rows`, {
        method: 'POST',
        body: JSON.stringify({ data }),
      })
    },
    [workspaceId]
  )

  const updateRow = useCallback(
    async (table: string, data: Record<string, unknown>, _where: string) => {
      await request(`/workspaces/${workspaceId}/database/tables/${table}/rows`, {
        method: 'PATCH',
        body: JSON.stringify({ data }),
      })
    },
    [workspaceId]
  )

  const deleteRows = useCallback(
    async (table: string, where: string, ids?: unknown[]) => {
      let resolvedIds = ids?.length ? ids : []
      if (resolvedIds.length === 0 && where) {
        const idMatch = where.match(/id\s*=\s*'([^']+)'/)
        resolvedIds = idMatch ? [idMatch[1]] : []
      }
      if (resolvedIds.length === 0) return
      await request(`/workspaces/${workspaceId}/database/tables/${table}/rows`, {
        method: 'DELETE',
        body: JSON.stringify({ ids: resolvedIds }),
      })
    },
    [workspaceId]
  )

  const uploadFile = useCallback(
    async (file: File, prefix?: string): Promise<string> => {
      const formData = new FormData()
      formData.append('file', file)
      if (prefix) formData.append('prefix', prefix)
      const headers: Record<string, string> = {}
      const tokens = getStoredTokens()
      if (tokens?.accessToken) headers['Authorization'] = `Bearer ${tokens.accessToken}`
      const res = await fetch(`${getApiBaseUrl()}/workspaces/${workspaceId}/storage/upload`, {
        method: 'POST',
        headers,
        body: formData,
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.message || 'Upload failed')
      return payload?.data?.public_url || ''
    },
    [workspaceId]
  )

  const contextValue = useMemo(
    () => ({
      workspaceId,
      queryRows,
      insertRow,
      updateRow,
      deleteRows,
      uploadFile,
      notifyTableChange,
      onTableChange,
    }),
    [
      workspaceId,
      queryRows,
      insertRow,
      updateRow,
      deleteRows,
      uploadFile,
      notifyTableChange,
      onTableChange,
    ]
  )

  return (
    <DataProviderContext.Provider value={contextValue}>{children}</DataProviderContext.Provider>
  )
}
