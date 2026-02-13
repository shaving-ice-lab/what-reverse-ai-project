'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { SandboxHost } from '../sandbox/sandbox-host'
import { useDataProvider } from '../data-provider'
import type { ApiSource } from '../types'

export interface CustomCodeConfig {
  code?: string
  api_source?: ApiSource
  min_height?: number
  max_height?: number
}

interface CustomCodeBlockProps {
  config: CustomCodeConfig
  apiSource?: ApiSource
}

export function CustomCodeBlock({ config, apiSource }: CustomCodeBlockProps) {
  const { fetchApiSource } = useDataProvider()
  const [data, setData] = useState<Record<string, unknown>>({})
  const [error, setError] = useState<string | null>(null)

  const source = apiSource || config.api_source

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

  if (!config.code) {
    return (
      <div className="border border-dashed border-border rounded-lg p-6 text-center text-sm text-foreground-muted">
        No component code deployed yet.
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
        code={config.code}
        data={data}
        minHeight={config.min_height || 60}
        maxHeight={config.max_height || 800}
        onError={(msg) => setError(msg)}
      />
    </div>
  )
}
