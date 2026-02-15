'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
  type OnSelectionChangeParams,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Maximize2,
  Table2,
  Network,
  ArrowRightLeft,
  ArrowDownUp,
  Search,
  PanelLeftClose,
  PanelLeft,
  LayoutGrid,
  X,
  Key,
  Hash,
  Type,
  ToggleLeft,
  Calendar,
  MousePointerClick,
  GripVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { workspaceDatabaseApi } from '@/lib/api/workspace-database'
import type { SchemaGraphData, SchemaGraphNode, TableColumn } from '@/lib/api/workspace-database'
import { useRouter } from 'next/navigation'
import { useWorkspace } from '@/hooks/useWorkspace'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// ===== Layout constants =====
const NODE_WIDTH = 240
const NODE_HEIGHT_BASE = 36
const NODE_ROW_HEIGHT = 24
const GRID_GAP_X = 48
const GRID_GAP_Y = 48
const GRID_COLS = 4

// ===== Column type icon helper =====
function getColumnTypeIcon(type: string) {
  const t = type.toUpperCase()
  if (t.includes('INT') || t.includes('REAL') || t.includes('FLOAT') || t.includes('DOUBLE') || t.includes('NUMERIC') || t.includes('DECIMAL'))
    return Hash
  if (t.includes('TEXT') || t.includes('VARCHAR') || t.includes('CHAR') || t.includes('STRING'))
    return Type
  if (t.includes('BOOL'))
    return ToggleLeft
  if (t.includes('DATE') || t.includes('TIME') || t.includes('TIMESTAMP'))
    return Calendar
  return Hash
}

function getColumnTypeBadge(type: string): string {
  const t = type.toUpperCase()
  if (t.includes('INTEGER') || t === 'INT') return 'INT'
  if (t.includes('TEXT')) return 'TEXT'
  if (t.includes('REAL') || t.includes('FLOAT')) return 'REAL'
  if (t.includes('BOOL')) return 'BOOL'
  if (t.includes('BLOB')) return 'BLOB'
  if (t.includes('DATE')) return 'DATE'
  if (t.includes('VARCHAR')) return 'VARCHAR'
  if (t.includes('DATETIME') || t.includes('TIMESTAMP')) return 'DATETIME'
  if (type.length > 10) return type.slice(0, 8) + '…'
  return type
}

// ===== Layout engine =====
function getLayoutedElements(
  graphData: SchemaGraphData,
  direction: 'LR' | 'TB' = 'LR'
): { nodes: Node[]; edges: Edge[] } {
  const rawNodes = graphData.nodes || []
  const rawEdges = graphData.edges || []
  const hasEdges = rawEdges.length > 0

  const flowNodes: Node[] = rawNodes.map((table) => {
    const height = NODE_HEIGHT_BASE + table.columns.length * NODE_ROW_HEIGHT
    return {
      id: table.id,
      type: 'tableNode',
      data: { table },
      position: { x: 0, y: 0 },
      dragHandle: '.custom-drag-handle',
      style: { width: NODE_WIDTH },
    }
  })

  const flowEdges: Edge[] = rawEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: `${edge.source_column} → ${edge.target_column}`,
    type: 'smoothstep',
    animated: true,
    style: { stroke: 'var(--color-brand-500)', strokeWidth: 1.5 },
    labelStyle: { fontSize: 10, fill: 'var(--color-foreground-light)' },
    labelBgStyle: { fill: 'var(--color-background)', fillOpacity: 0.8 },
    labelBgPadding: [4, 2] as [number, number],
    labelBgBorderRadius: 4,
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-brand-500)' },
  }))

  if (hasEdges) {
    const g = new dagre.graphlib.Graph()
    g.setDefaultEdgeLabel(() => ({}))
    g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 120 })
    flowNodes.forEach((node) => {
      const table = (node.data as any).table as SchemaGraphNode
      const h = NODE_HEIGHT_BASE + table.columns.length * NODE_ROW_HEIGHT
      g.setNode(node.id, { width: NODE_WIDTH, height: h })
    })
    rawEdges.forEach((edge) => g.setEdge(edge.source, edge.target))
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
    const cols = Math.min(GRID_COLS, flowNodes.length)
    const colHeights = new Array(cols).fill(0)
    flowNodes.forEach((node) => {
      let minCol = 0
      for (let c = 1; c < cols; c++) {
        if (colHeights[c] < colHeights[minCol]) minCol = c
      }
      const table = (node.data as any).table as SchemaGraphNode
      const h = NODE_HEIGHT_BASE + table.columns.length * NODE_ROW_HEIGHT
      node.position = {
        x: minCol * (NODE_WIDTH + GRID_GAP_X),
        y: colHeights[minCol],
      }
      colHeights[minCol] += h + GRID_GAP_Y
    })
  }

  return { nodes: flowNodes, edges: flowEdges }
}

// ===== Table Node Component =====
function TableNodeComponent({ data, selected }: NodeProps) {
  const { table } = data as { table: SchemaGraphNode }
  const router = useRouter()

  return (
    <div
      className={cn(
        'bg-surface-100 border rounded-md shadow-sm overflow-hidden transition-all duration-150',
        selected
          ? 'border-brand-500 shadow-md ring-1 ring-brand-500/20'
          : 'border-border hover:border-foreground/20'
      )}
      onDoubleClick={() => router.push(`/dashboard/database/tables?table=${table.name}`)}
    >
      {/* Handles for edges */}
      <Handle type="target" position={Position.Left} className="w-1.5! h-1.5! bg-brand-500! border-brand-400! -left-[4px]!" />
      <Handle type="source" position={Position.Right} className="w-1.5! h-1.5! bg-brand-500! border-brand-400! -right-[4px]!" />

      {/* Header — drag handle */}
      <div className="custom-drag-handle px-2.5 py-1.5 bg-surface-200/50 border-b border-border flex items-center gap-1.5 cursor-grab active:cursor-grabbing select-none">
        <GripVertical className="w-3 h-3 text-foreground-lighter/50 shrink-0" />
        <Table2 className="w-3 h-3 text-brand-500 shrink-0" />
        <span className="text-[11px] font-semibold text-foreground truncate flex-1">{table.name}</span>
        <span className="text-[9px] text-foreground-lighter shrink-0 tabular-nums">{table.columns.length}</span>
      </div>

      {/* Columns */}
      <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
        {table.columns.map((col) => {
          const TypeIcon = getColumnTypeIcon(col.type)
          return (
            <div
              key={col.name}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-[3px] border-b border-border/20 last:border-b-0',
                'hover:bg-surface-200/30 transition-colors'
              )}
              title={`${col.name}: ${col.type}${col.is_primary_key ? ' (Primary Key)' : ''}${!col.nullable ? ' NOT NULL' : ''}${col.default_value ? ` DEFAULT ${col.default_value}` : ''}`}
            >
              <span className="w-3 shrink-0 flex items-center justify-center">
                {col.is_primary_key ? (
                  <Key className="w-2.5 h-2.5 text-amber-500" />
                ) : (
                  <TypeIcon className="w-2.5 h-2.5 text-foreground-lighter/60" />
                )}
              </span>
              <span className="text-[10px] text-foreground flex-1 truncate font-mono leading-tight">
                {col.name}
              </span>
              <span className={cn(
                'text-[8px] font-mono px-1 py-px rounded shrink-0 leading-tight',
                col.is_primary_key
                  ? 'bg-amber-500/10 text-amber-600'
                  : 'bg-surface-200/60 text-foreground-lighter'
              )}>
                {getColumnTypeBadge(col.type)}
              </span>
              {!col.nullable && (
                <span className="text-[7px] text-orange-500/80 font-bold shrink-0">!</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const nodeTypes = { tableNode: TableNodeComponent }

// ===== Sidebar =====
function SidebarTableList({
  tables,
  selectedId,
  search,
  onSearchChange,
  onSelect,
}: {
  tables: SchemaGraphNode[]
  selectedId: string | null
  search: string
  onSearchChange: (v: string) => void
  onSelect: (id: string) => void
}) {
  const filtered = useMemo(() => {
    if (!search.trim()) return tables
    const q = search.toLowerCase()
    return tables.filter((t) => t.name.toLowerCase().includes(q))
  }, [tables, search])

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-2 py-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-lighter" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tables..."
            className="h-7 pl-7 text-[11px] bg-surface-100 border-border"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-lighter hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Table list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-1">
        {filtered.length === 0 ? (
          <div className="text-center py-6 text-[10px] text-foreground-lighter">
            {search ? 'No matching tables' : 'No tables'}
          </div>
        ) : (
          filtered.map((t) => {
            const isSelected = selectedId === t.id
            const pkCol = t.columns.find((c) => c.is_primary_key)
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t.id)}
                className={cn(
                  'w-full flex items-start gap-2 px-3 py-1.5 text-left transition-colors',
                  isSelected
                    ? 'bg-brand-500/8 border-l-2 border-brand-500'
                    : 'hover:bg-surface-75 border-l-2 border-transparent'
                )}
              >
                <Table2 className={cn('w-3 h-3 mt-0.5 shrink-0', isSelected ? 'text-brand-500' : 'text-foreground-lighter')} />
                <div className="flex-1 min-w-0">
                  <div className={cn('text-[11px] font-mono truncate', isSelected ? 'text-brand-500 font-semibold' : 'text-foreground')}>
                    {t.name}
                  </div>
                  <div className="text-[9px] text-foreground-lighter leading-tight mt-0.5">
                    {t.columns.length} col{t.columns.length !== 1 ? 's' : ''}
                    {pkCol && <span className="ml-1">· PK: {pkCol.name}</span>}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Footer stats */}
      <div className="px-3 py-1.5 border-t border-border text-[9px] text-foreground-lighter">
        {filtered.length} of {tables.length} table{tables.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

// ===== Selected node detail =====
function SelectedNodeDetail({
  table,
  onClose,
}: {
  table: SchemaGraphNode
  onClose: () => void
}) {
  return (
    <div className="absolute bottom-3 right-3 z-10 w-[280px] max-h-[360px] bg-surface-100/95 backdrop-blur border border-border rounded-lg shadow-lg overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-200/40">
        <div className="flex items-center gap-1.5 min-w-0">
          <Table2 className="w-3.5 h-3.5 text-brand-500 shrink-0" />
          <span className="text-[12px] font-semibold text-foreground truncate">{table.name}</span>
        </div>
        <button onClick={onClose} className="text-foreground-lighter hover:text-foreground p-0.5 rounded hover:bg-surface-200 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-75">
              <th className="text-left px-2.5 py-1 text-[9px] font-medium text-foreground-lighter uppercase w-5" />
              <th className="text-left px-2.5 py-1 text-[9px] font-medium text-foreground-lighter uppercase">Column</th>
              <th className="text-left px-2.5 py-1 text-[9px] font-medium text-foreground-lighter uppercase">Type</th>
              <th className="text-center px-1 py-1 text-[9px] font-medium text-foreground-lighter uppercase w-6">NN</th>
            </tr>
          </thead>
          <tbody>
            {table.columns.map((col) => (
              <tr key={col.name} className="border-b border-border/30 hover:bg-surface-75 transition-colors">
                <td className="px-2.5 py-1">
                  {col.is_primary_key ? <Key className="w-2.5 h-2.5 text-amber-500" /> : null}
                </td>
                <td className="px-2.5 py-1 text-[10px] font-mono text-foreground">{col.name}</td>
                <td className="px-2.5 py-1 text-[10px] font-mono text-foreground-lighter">{col.type}</td>
                <td className="px-1 py-1 text-center text-[9px]">
                  {!col.nullable && <span className="text-orange-500 font-bold">✓</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-1.5 border-t border-border text-[9px] text-foreground-lighter flex items-center gap-1">
        <MousePointerClick className="w-2.5 h-2.5" />
        Double-click node to view data
      </div>
    </div>
  )
}

// ===== Main graph component =====
function SchemaGraphInner() {
  const { workspaceId } = useWorkspace()
  const { fitView, setCenter, getZoom } = useReactFlow()
  const [graphData, setGraphData] = useState<SchemaGraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [direction, setDirection] = useState<'LR' | 'TB'>('LR')
  const [showSidebar, setShowSidebar] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const selectedTable = useMemo(() => {
    if (!graphData || !selectedNodeId) return null
    return (graphData.nodes || []).find((n) => n.id === selectedNodeId) || null
  }, [graphData, selectedNodeId])

  const loadGraph = useCallback(async (dir?: 'LR' | 'TB') => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const data = await workspaceDatabaseApi.getSchemaGraph(workspaceId)
      setGraphData(data)
      const { nodes: ln, edges: le } = getLayoutedElements(data, dir || direction)
      setNodes(ln)
      setEdges(le)
      setTimeout(() => fitView({ padding: 0.15, duration: 300 }), 100)
    } catch (err: any) {
      setError(err?.message || 'Failed to load schema graph')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, direction, setNodes, setEdges, fitView])

  useEffect(() => { loadGraph() }, [loadGraph])

  const reLayout = useCallback((dir: 'LR' | 'TB') => {
    setDirection(dir)
    if (graphData) {
      const { nodes: ln, edges: le } = getLayoutedElements(graphData, dir)
      setNodes(ln)
      setEdges(le)
      setTimeout(() => fitView({ padding: 0.15, duration: 300 }), 50)
    }
  }, [graphData, setNodes, setEdges, fitView])

  const toggleDirection = useCallback(() => {
    reLayout(direction === 'LR' ? 'TB' : 'LR')
  }, [direction, reLayout])

  const resetLayout = useCallback(() => {
    reLayout(direction)
  }, [direction, reLayout])

  // Focus on a specific node
  const focusNode = useCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return
    setSelectedNodeId(nodeId)
    // Update selection visually
    setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === nodeId })))
    const table = (node.data as any).table as SchemaGraphNode
    const h = NODE_HEIGHT_BASE + table.columns.length * NODE_ROW_HEIGHT
    setCenter(
      node.position.x + NODE_WIDTH / 2,
      node.position.y + h / 2,
      { zoom: Math.max(getZoom(), 0.8), duration: 400 }
    )
  }, [nodes, setNodes, setCenter, getZoom])

  // Handle selection changes from ReactFlow
  const onSelectionChange = useCallback(({ nodes: selectedNodes }: OnSelectionChangeParams) => {
    if (selectedNodes.length === 1) {
      setSelectedNodeId(selectedNodes[0].id)
    } else if (selectedNodes.length === 0) {
      setSelectedNodeId(null)
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNodeId(null)
        setNodes((nds) => nds.map((n) => ({ ...n, selected: false })))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setNodes])

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-full text-foreground-lighter text-[13px]">
        Please select a workspace first.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-foreground-lighter" />
        <span className="text-[12px] text-foreground-lighter">Loading schema...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <AlertCircle className="w-5 h-5 text-destructive" />
        <span className="text-[13px] text-destructive">{error}</span>
        <Button size="sm" variant="outline" onClick={() => loadGraph()} className="h-7 text-[11px] gap-1">
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

  const edgeCount = graphData.edges?.length ?? 0

  return (
    <div className="h-full flex">
      {/* Left sidebar */}
      {showSidebar && (
        <div className="w-[200px] shrink-0 border-r border-border bg-background-studio">
          <SidebarTableList
            tables={graphData.nodes || []}
            selectedId={selectedNodeId}
            search={search}
            onSearchChange={setSearch}
            onSelect={focusNode}
          />
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 relative min-w-0">
        {/* Floating toolbar */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-surface-100/95 backdrop-blur border border-border rounded-md px-1.5 py-1 shadow-sm">
          <Button
            size="sm" variant="ghost"
            onClick={() => setShowSidebar(!showSidebar)}
            className="h-6 w-6 p-0"
            title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
          >
            {showSidebar ? <PanelLeftClose className="w-3 h-3" /> : <PanelLeft className="w-3 h-3" />}
          </Button>
          <div className="w-px h-4 bg-border" />
          <span className="text-[10px] text-foreground-lighter px-1 tabular-nums">
            {graphData.nodes.length} table{graphData.nodes.length !== 1 ? 's' : ''}
            {edgeCount > 0 && ` · ${edgeCount} FK`}
          </span>
          <div className="w-px h-4 bg-border" />
          <Button size="sm" variant="ghost" onClick={() => loadGraph()} className="h-6 w-6 p-0" title="Refresh data">
            <RefreshCw className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={resetLayout} className="h-6 w-6 p-0" title="Reset layout">
            <LayoutGrid className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => fitView({ padding: 0.15, duration: 300 })} className="h-6 w-6 p-0" title="Fit to view">
            <Maximize2 className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={toggleDirection} className="h-6 w-6 p-0" title={`Direction: ${direction === 'LR' ? 'Horizontal' : 'Vertical'}`}>
            {direction === 'LR' ? <ArrowRightLeft className="w-3 h-3" /> : <ArrowDownUp className="w-3 h-3" />}
          </Button>
        </div>

        {/* Keyboard hint */}
        <div className="absolute bottom-3 left-3 z-10 text-[9px] text-foreground-lighter/50 select-none">
          Esc deselect · Double-click → table data · Scroll to zoom
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.1}
          maxZoom={2.5}
          snapToGrid
          snapGrid={[10, 10]}
          proOptions={{ hideAttribution: true }}
          className="bg-background"
          selectNodesOnDrag={false}
        >
          <Background gap={20} size={1} />
          <MiniMap
            className="bg-surface-100 border border-border rounded-md"
            nodeColor={(node) => node.selected ? 'var(--color-brand-500)' : 'var(--color-surface-300)'}
            maskColor="rgba(0,0,0,0.06)"
            pannable
            zoomable
          />
        </ReactFlow>

        {/* Selected node detail panel */}
        {selectedTable && (
          <SelectedNodeDetail
            table={selectedTable}
            onClose={() => {
              setSelectedNodeId(null)
              setNodes((nds) => nds.map((n) => ({ ...n, selected: false })))
            }}
          />
        )}
      </div>
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
