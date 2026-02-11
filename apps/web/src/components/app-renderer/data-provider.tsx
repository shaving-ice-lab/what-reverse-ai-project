'use client'

import React, { createContext, useContext, useCallback } from 'react'
import { request } from '@/lib/api/shared'

interface DataProviderContextValue {
  workspaceId: string
  queryRows: (table: string, params?: QueryParams) => Promise<QueryResult>
  insertRow: (table: string, data: Record<string, unknown>) => Promise<void>
  updateRow: (table: string, data: Record<string, unknown>, where: string) => Promise<void>
  deleteRows: (table: string, where: string) => Promise<void>
  executeWorkflow: (workflowId: string, inputs: Record<string, unknown>) => Promise<void>
}

interface QueryParams {
  columns?: string[]
  where?: string
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
  const queryRows = useCallback(
    async (table: string, params?: QueryParams): Promise<QueryResult> => {
      const searchParams = new URLSearchParams()
      if (params?.limit) searchParams.set('limit', String(params.limit))
      if (params?.offset) searchParams.set('offset', String(params.offset))
      if (params?.where) searchParams.set('where', params.where)
      const qs = searchParams.toString()
      const url = `/workspaces/${workspaceId}/database/tables/${table}/rows${qs ? `?${qs}` : ''}`
      const res = await request<{ rows: Record<string, unknown>[]; total: number; columns: string[] }>(url)
      return res || { rows: [], total: 0, columns: [] }
    },
    [workspaceId]
  )

  const insertRow = useCallback(
    async (table: string, data: Record<string, unknown>) => {
      await request(`/workspaces/${workspaceId}/database/tables/${table}/rows`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    [workspaceId]
  )

  const updateRow = useCallback(
    async (table: string, data: Record<string, unknown>, where: string) => {
      await request(`/workspaces/${workspaceId}/database/tables/${table}/rows`, {
        method: 'PATCH',
        body: JSON.stringify({ values: data, where }),
      })
    },
    [workspaceId]
  )

  const deleteRows = useCallback(
    async (table: string, where: string) => {
      await request(`/workspaces/${workspaceId}/database/tables/${table}/rows`, {
        method: 'DELETE',
        body: JSON.stringify({ where }),
      })
    },
    [workspaceId]
  )

  const executeWorkflow = useCallback(
    async (workflowId: string, inputs: Record<string, unknown>) => {
      await request(`/workspaces/${workspaceId}/workflows/${workflowId}/execute`, {
        method: 'POST',
        body: JSON.stringify({ inputs, trigger_type: 'form_submit' }),
      })
    },
    [workspaceId]
  )

  return (
    <DataProviderContext.Provider value={{ workspaceId, queryRows, insertRow, updateRow, deleteRows, executeWorkflow }}>
      {children}
    </DataProviderContext.Provider>
  )
}
