'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { SandboxHost } from '../sandbox/sandbox-host'
import { useDataProvider } from '../data-provider'
import { getStoredTokens } from '@/lib/api/shared'
import type { ApiSource, CustomCodeConfig } from '../types'

interface CustomCodeBlockProps {
  config: CustomCodeConfig
  apiSource?: ApiSource
  workspaceId?: string
}

export function CustomCodeBlock({ config, apiSource, workspaceId }: CustomCodeBlockProps) {
  const { fetchApiSource } = useDataProvider()
  const [data, setData] = useState<Record<string, unknown>>({})
  const [error, setError] = useState<string | null>(null)
  const [resolvedCode, setResolvedCode] = useState<string | undefined>(config.code)

  const source = apiSource || config.api_source

  // If component_id is set, fetch code from the component store
  useEffect(() => {
    if (!config.component_id || !workspaceId) {
      setResolvedCode(config.code)
      return
    }
    const fetchComponent = async () => {
      try {
        const tokens = getStoredTokens()
        const res = await fetch(
          `/api/v1/workspaces/${workspaceId}/components/${config.component_id}`,
          {
            headers: tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {},
          }
        )
        if (!res.ok) {
          setError(`Failed to load component ${config.component_id}`)
          return
        }
        const result = await res.json()
        setResolvedCode(result.code || '')
      } catch (err: any) {
        setError(err?.message || `Failed to load component ${config.component_id}`)
      }
    }
    fetchComponent()
  }, [config.component_id, config.code, workspaceId])

  const loadData = useCallback(async () => {
    if (!source || !fetchApiSource) return
    try {
      const result = await fetchApiSource(source.path, {
        method: source.method || 'GET',
        body: source.body,
      })
      setData((result as Record<string, unknown>) || {})
    } catch (err: any) {
      setError(err?.message || 'Failed to load data')
    }
  }, [source, fetchApiSource])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (!resolvedCode) {
    return (
      <div className="border border-dashed border-border rounded-lg p-6 text-center text-sm text-foreground-muted">
        {config.component_id
          ? `Loading component: ${config.component_id}...`
          : 'No component code deployed yet.'}
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div className="px-3 py-2 mb-2 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          Data load error: {error}
        </div>
      )}
      <SandboxHost
        code={resolvedCode}
        data={data}
        minHeight={config.min_height || 60}
        maxHeight={config.max_height || 800}
        onError={(msg) => setError(msg)}
      />
    </div>
  )
}

export type { CustomCodeConfig }
