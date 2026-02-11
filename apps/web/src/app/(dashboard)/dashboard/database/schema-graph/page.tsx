'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import { Loader2, AlertCircle, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { workspaceDatabaseApi } from '@/lib/api/workspace-database'
import type { SchemaGraphData, SchemaGraphNode, TableColumn } from '@/lib/api/workspace-database'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useWorkspace } from '@/hooks/useWorkspace'

const NODE_WIDTH = 260
const NODE_HEIGHT_BASE = 44
const NODE_ROW_HEIGHT = 24

function getLayoutedElements(
  graphData: SchemaGraphData
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 120 })

  const flowNodes: Node[] = graphData.nodes.map((table) => {
    const height = NODE_HEIGHT_BASE + table.columns.length * NODE_ROW_HEIGHT
    g.setNode(table.id, { width: NODE_WIDTH, height })
    return {
      id: table.id,
      type: 'tableNode',
      data: { table },
      position: { x: 0, y: 0 },
      style: { width: NODE_WIDTH, height },
    }
  })

  const flowEdges: Edge[] = graphData.edges.map((edge) => {
    g.setEdge(edge.source, edge.target)
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: `${edge.source_column} → ${edge.target_column}`,
      type: 'smoothstep',
      animated: true,
      style: { stroke: 'var(--brand-500)', strokeWidth: 1.5 },
      labelStyle: { fontSize: 10, fill: 'var(--foreground-light)' },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--brand-500)' },
    }
  })

  dagre.layout(g)

  flowNodes.forEach((node) => {
    const pos = g.node(node.id)
    if (pos) {
      node.position = {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - (pos.height || 100) / 2,
      }
    }
  })

  return { nodes: flowNodes, edges: flowEdges }
}

function TableNodeComponent({ data }: { data: { table: SchemaGraphNode } }) {
  const { table } = data
  const router = useRouter()

  return (
    <div
      className="bg-surface-100 border border-border rounded-lg shadow-sm overflow-hidden cursor-pointer hover:border-brand-500/50 transition-colors"
      onDoubleClick={() => router.push(`/dashboard/database/tables?table=${table.name}`)}
    >
      {/* Table header */}
      <div className="px-3 py-2 bg-surface-200/50 border-b border-border">
        <div className="text-[12px] font-semibold text-foreground truncate">
          {table.name}
        </div>
        <div className="text-[10px] text-foreground-muted">
          {table.columns.length} columns
        </div>
      </div>

      {/* Columns */}
      <div className="max-h-[300px] overflow-y-auto">
        {table.columns.map((col) => (
          <div
            key={col.name}
            className="flex items-center gap-1.5 px-3 py-1 border-b border-border/50 last:border-b-0 hover:bg-surface-200/30"
          >
            {col.is_primary_key ? (
              <span className="text-[9px] font-bold text-amber-500 w-4 text-center">🔑</span>
            ) : (
              <span className="w-4" />
            )}
            <span className="text-[11px] text-foreground flex-1 truncate font-medium">
              {col.name}
            </span>
            <span className="text-[10px] text-foreground-muted font-mono shrink-0">
              {col.type.length > 16 ? col.type.slice(0, 14) + '…' : col.type}
            </span>
            {!col.nullable && (
              <span className="text-[8px] text-amber-600 font-bold">NN</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const nodeTypes = {
  tableNode: TableNodeComponent,
}

export default function SchemaGraphPage() {
  const { workspaceId } = useWorkspace()
  const [graphData, setGraphData] = useState<SchemaGraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const data = await workspaceDatabaseApi.getSchemaGraph(workspaceId)
        setGraphData(data)
        const { nodes: layoutNodes, edges: layoutEdges } = getLayoutedElements(data)
        setNodes(layoutNodes)
        setEdges(layoutEdges)
      } catch (err: any) {
        setError(err?.message || 'Failed to load schema graph')
      } finally {
        setLoading(false)
      }
    })()
  }, [workspaceId, setNodes, setEdges])

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-64 text-foreground-light text-sm">
        Please select a workspace first.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-foreground-muted" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive text-sm gap-2">
        <AlertCircle className="w-4 h-4" />
        {error}
      </div>
    )
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-foreground-muted text-sm">
        No tables found. Create tables first to view the schema graph.
      </div>
    )
  }

  return (
    <div className="h-full -mx-6 -my-5">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-background"
      >
        <Background gap={20} size={1} />
        <Controls className="bg-surface-100 border border-border rounded-md" />
        <MiniMap
          className="bg-surface-100 border border-border rounded-md"
          nodeColor="var(--surface-200)"
          maskColor="rgba(0,0,0,0.1)"
        />
      </ReactFlow>
    </div>
  )
}
