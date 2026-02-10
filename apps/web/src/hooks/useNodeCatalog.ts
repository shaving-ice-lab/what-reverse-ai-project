/**
 * Workflow Node(in + Custom)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { customNodeApi } from '@/lib/api/custom-node'
import type { CustomNode } from '@/types/custom-node'
import {
  buildWorkflowNodeCatalog,
  type WorkflowNodeCatalogEntry,
  type WorkflowNodeCategorySummary,
} from '@/lib/nodes/catalog'
import { DEFAULT_NODE_SDK_VERSION } from '@/lib/nodes/versioning'

export interface UseNodeCatalogOptions {
  includeCustom?: boolean
  sdkVersion?: string
  appVersion?: string
}

export interface UseNodeCatalogResult {
  nodes: WorkflowNodeCatalogEntry[]
  categories: WorkflowNodeCategorySummary[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useNodeCatalog(options: UseNodeCatalogOptions = {}): UseNodeCatalogResult {
  const { includeCustom = true, sdkVersion = DEFAULT_NODE_SDK_VERSION, appVersion } = options
  const [customNodes, setCustomNodes] = useState<CustomNode[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!includeCustom) {
      setCustomNodes([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await customNodeApi.list()
      const nodes = response?.data?.nodes ?? []
      setCustomNodes(nodes)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch custom nodes'
      setError(message)
      setCustomNodes([])
    } finally {
      setIsLoading(false)
    }
  }, [includeCustom])

  useEffect(() => {
    let active = true
    if (!includeCustom) {
      setCustomNodes([])
      return
    }

    ;(async () => {
      await refresh()
      if (!active) return
    })()

    return () => {
      active = false
    }
  }, [includeCustom, refresh])

  const catalog = useMemo(() => {
    return buildWorkflowNodeCatalog({
      customNodes: includeCustom ? customNodes : [],
      compatibilityContext: { sdkVersion, appVersion },
    })
  }, [customNodes, includeCustom, sdkVersion, appVersion])

  return {
    nodes: catalog.nodes,
    categories: catalog.categories,
    isLoading,
    error,
    refresh,
  }
}
