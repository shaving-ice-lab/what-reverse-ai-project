'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import { Loader2, AlertCircle, RefreshCw, Maximize2, Table2, Network, ArrowRightLeft, ArrowDownUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { workspaceDatabaseApi } from '@/lib/api/workspace-database'
import type { SchemaGraphData, SchemaGraphNode } from '@/lib/api/workspace-database'
import { useRouter } from 'next/navigation'
import { useWorkspace } from '@/hooks/useWorkspace'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const NODE_WIDTH = 240
const NODE_HEIGHT_BASE = 40
const NODE_ROW_HEIGHT = 22

const GRID_GAP_X = 40
const GRID_GAP_Y = 40
const GRID_COLS = 4

function getLayoutedElements(graphData: SchemaGraphData, direction: 'LR' | 'TB' = 'LR'): { nodes: Node[]; edges: Edge[] } {
  const nodes = graphData.nodes || []
  const edges = graphData.edges || []
  const hasEdges = edges.length > 0

  const flowNodes: Node[] = nodes.map((table) => {
    const height = NODE_HEIGHT_BASE + table.columns.length * NODE_ROW_HEIGHT
    return {
      id: table.id,
      type: 'tableNode',
      data: { table },
      position: { x: 0, y: 0 },
      dragHandle: '.custom-drag-handle',
      style: { width: NODE_WIDTH, height },
    }
  })

  const flowEdges: Edge[] = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: `${edge.source_column} → ${edge.target_column}`,
    type: 'smoothstep',
    animated: true,
    style: { stroke: 'var(--color-brand-500)', strokeWidth: 1.5 },
    labelStyle: { fontSize: 10, fill: 'var(--color-foreground-light)' },
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-brand-500)' },
  }))

  if (hasEdges) {
    // Use dagre for relationship-aware layout
    const g = new dagre.graphlib.Graph()
    g.setDefaultEdgeLabel(() => ({}))
    g.setGraph({ rankdir: direction, nodesep: 50, ranksep: 100 })
    flowNodes.forEach((node) => {
      const h = (node.style as any)?.height || 100
      g.setNode(node.id, { width: NODE_WIDTH, height: h })
    })
    edges.forEach((edge) => g.setEdge(edge.source, edge.target))
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
  } else {
    // Grid layout: arrange tables in rows of GRID_COLS
    const cols = Math.min(GRID_COLS, flowNodes.length)
    const colHeights = new Array(cols).fill(0)

    flowNodes.forEach((node, idx) => {
      // Find the column with the smallest current height (masonry-style)
      let minCol = 0
      for (let c = 1; c < cols; c++) {
        if (colHeights[c] < colHeights[minCol]) minCol = c
      }
      const h = ((node.style as any)?.height || 100)
      node.position = {
        x: minCol * (NODE_WIDTH + GRID_GAP_X),
        y: colHeights[minCol],
      }
      colHeights[minCol] += h + GRID_GAP_Y
    })
  }

  return { nodes: flowNodes, edges: flowEdges }
}

function TableNodeComponent({ data }: { data: { table: SchemaGraphNode } }) {
  const { table } = data
  const router = useRouter()

  return (
    <div
      className="bg-surface-100 border border-border rounded-md shadow-sm overflow-hidden hover:border-brand-500/40 transition-colors"
      onDoubleClick={() => router.push(`/dashboard/database/tables?table=${table.name}`)}
    >
      <div className="custom-drag-handle px-2.5 py-1.5 bg-surface-200/40 border-b border-border flex items-center gap-1.5 cursor-grab active:cursor-grabbing">
        <Table2 className="w-3 h-3 text-brand-500 shrink-0" />
        <span className="text-[11px] font-semibold text-foreground truncate">{table.name}</span>
        <span className="text-[9px] text-foreground-lighter ml-auto shrink-0">{table.columns.length} cols</span>
      </div>
      <div className="max-h-[280px] overflow-y-auto">
        {table.columns.map((col) => (
          <div
            key={col.name}
            className="flex items-center gap-1 px-2.5 py-0.5 border-b border-border/30 last:border-b-0"
          >
            <span className="w-3 text-center shrink-0">
              {col.is_primary_key ? <span className="text-[8px] text-amber-500">🔑</span> : null}
            </span>
            <span className="text-[10px] text-foreground flex-1 truncate font-medium font-mono">
              {col.name}
            </span>
            <span className="text-[9px] text-foreground-lighter font-mono shrink-0">
              {col.type.length > 14 ? col.type.slice(0, 12) + '…' : col.type}
            </span>
            {!col.nullable && <span className="text-[7px] text-amber-600 font-bold shrink-0">NN</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

const nodeTypes = {
  tableNode: TableNodeComponent,
}

function SchemaGraphInner() {
  const { workspaceId } = useWorkspace()
  const { fitView } = useReactFlow()
  const [graphData, setGraphData] = useState<SchemaGraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [direction, setDirection] = useState<'LR' | 'TB'>('LR')

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const loadGraph = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const data = await workspaceDatabaseApi.getSchemaGraph(workspaceId)
      setGraphData(data)
      const { nodes: ln, edges: le } = getLayoutedElements(data, direction)
      setNodes(ln)
      setEdges(le)
      setTimeout(() => fitView({ padding: 0.2 }), 100)
    } catch (err: any) {
      setError(err?.message || 'Failed to load schema graph')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, direction, setNodes, setEdges, fitView])

  useEffect(() => { loadGraph() }, [loadGraph])

  const toggleDirection = useCallback(() => {
    const newDir = direction === 'LR' ? 'TB' : 'LR'
    setDirection(newDir)
    if (graphData) {
      const { nodes: ln, edges: le } = getLayoutedElements(graphData, newDir)
      setNodes(ln)
      setEdges(le)
      setTimeout(() => fitView({ padding: 0.2 }), 100)
    }
  }, [direction, graphData, setNodes, setEdges, fitView])

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-full text-foreground-lighter text-[13px]">
        Please select a workspace first.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 animate-spin text-foreground-lighter" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <AlertCircle className="w-5 h-5 text-destructive" />
        <span className="text-[13px] text-destructive">{error}</span>
        <Button size="sm" variant="outline" onClick={loadGraph} className="h-7 text-[11px] gap-1">
          <RefreshCw className="w-3 h-3" />
          Retry
        </Button>
      </div>
    )
  }

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-10 h-10 rounded-lg bg-surface-200 flex items-center justify-center">
          <Network className="w-5 h-5 text-foreground-lighter" />
        </div>
        <div className="text-center">
          <p className="text-[13px] font-medium text-foreground">No tables yet</p>
          <p className="text-[11px] text-foreground-lighter mt-0.5">Create tables first to visualize the schema.</p>
        </div>
        <Link href="/dashboard/database/tables?action=create">
          <Button size="sm" className="h-7 text-[11px] gap-1">
            <Table2 className="w-3 h-3" />
            Create Table
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="h-full relative">
      {/* Floating toolbar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-surface-100/95 backdrop-blur border border-border rounded-md px-2 py-1 shadow-sm">
        <span className="text-[10px] text-foreground-lighter mr-1">
          {graphData.nodes.length} table{graphData.nodes.length !== 1 ? 's' : ''}
          {(graphData.edges?.length ?? 0) > 0 && ` · ${graphData.edges!.length} relation${graphData.edges!.length !== 1 ? 's' : ''}`}
        </span>
        <div className="w-px h-4 bg-border" />
        <Button size="sm" variant="ghost" onClick={loadGraph} className="h-6 w-6 p-0" title="Refresh">
          <RefreshCw className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => fitView({ padding: 0.2 })} className="h-6 w-6 p-0" title="Fit to view">
          <Maximize2 className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="ghost" onClick={toggleDirection} className="h-6 w-6 p-0" title={`Layout: ${direction === 'LR' ? 'Left→Right' : 'Top→Bottom'}`}>
          {direction === 'LR' ? <ArrowRightLeft className="w-3 h-3" /> : <ArrowDownUp className="w-3 h-3" />}
        </Button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-background"
      >
        <Background gap={20} size={1} />
        <Controls
          showInteractive={false}
          className="bg-surface-100 border border-border rounded-md"
        />
        <MiniMap
          className="bg-surface-100 border border-border rounded-md"
          nodeColor="var(--color-surface-200)"
          maskColor="rgba(0,0,0,0.08)"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  )
}

export default function SchemaGraphPage() {
  return (
    <ReactFlowProvider>
      <SchemaGraphInner />
    </ReactFlowProvider>
  )
}
