'use client'

import { useCallback, useRef, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useWorkflowStore, type WorkflowNode } from '@/stores/useWorkflowStore'
import { generateId, cn } from '@/lib/utils'
import { nodeTypes } from './nodes'
import { edgeTypes } from './edges'
import {
  Workflow,
  GitBranch,
  MousePointerClick,
  Sparkles,
  Play,
  Zap,
  Plus,
  Bot,
  Globe,
  Code2,
} from 'lucide-react'

/**
 * Editor Canvas - Based on React Flow - Professional Clean Style
 */

interface EditorCanvasProps {
  showEmptyState?: boolean
}

// Data Type Compatibility Matrix
const typeCompatibility: Record<string, string[]> = {
  string: ['string', 'any'],
  number: ['number', 'any'],
  boolean: ['boolean', 'any'],
  object: ['object', 'any'],
  array: ['array', 'any'],
  any: ['string', 'number', 'boolean', 'object', 'array', 'any'],
}

// Check if port types are compatible
function areTypesCompatible(sourceType: string, targetType: string): boolean {
  if (sourceType === 'any' || targetType === 'any') return true
  const compatibleTypes = typeCompatibility[sourceType]
  return compatibleTypes?.includes(targetType) ?? sourceType === targetType
}

// Detect Cyclic Connection (DFS)
function detectCycle(edges: Edge[], sourceId: string, targetId: string): boolean {
  const visited = new Set<string>()
  const stack: string[] = [targetId]

  while (stack.length > 0) {
    const current = stack.pop()!
    if (current === sourceId) return true

    if (visited.has(current)) continue
    visited.add(current)

    edges.forEach((edge) => {
      if (edge.source === current && !visited.has(edge.target)) {
        stack.push(edge.target)
      }
    })
  }

  return false
}

// Default Edge Config
const defaultEdgeOptions = {
  type: 'smoothstep',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
  },
  style: {
    strokeWidth: 2,
  },
}

// Create Default Node Data
function createDefaultNodeData(type: string, label: string) {
  const baseData = {
    label,
    config: {},
    inputs: [] as { id: string; name: string; type: string; required?: boolean }[],
    outputs: [] as { id: string; name: string; type: string }[],
  }

  switch (type) {
    case 'start':
      return {
        ...baseData,
        label: label || 'Start',
        outputs: [{ id: 'output', name: 'output', type: 'any' }],
      }
    case 'end':
      return {
        ...baseData,
        label: label || 'End',
        inputs: [{ id: 'input', name: 'input', type: 'any', required: true }],
      }
    case 'llm':
      return {
        ...baseData,
        label: label || 'LLM Call',
        config: {
          model: 'gpt-4',
          systemPrompt: '',
          userPrompt: '',
          temperature: 0.7,
          maxTokens: 2048,
        },
        inputs: [{ id: 'input', name: 'Input', type: 'any' }],
        outputs: [{ id: 'output', name: 'Output', type: 'string' }],
      }
    case 'http':
      return {
        ...baseData,
        label: label || 'HTTP Request',
        config: {
          method: 'GET',
          url: '',
          headers: {},
          body: null,
        },
        inputs: [{ id: 'input', name: 'Input', type: 'any' }],
        outputs: [{ id: 'output', name: 'Response', type: 'any' }],
      }
    case 'condition':
      return {
        ...baseData,
        label: label || 'Condition',
        config: {
          conditions: [],
          logic: 'and',
        },
        inputs: [{ id: 'input', name: 'Input', type: 'any', required: true }],
        outputs: [
          { id: 'true', name: 'True', type: 'any' },
          { id: 'false', name: 'False', type: 'any' },
        ],
      }
    case 'loop':
      return {
        ...baseData,
        label: label || 'Loop',
        config: {
          mode: 'forEach',
          maxIterations: 1000,
        },
        inputs: [{ id: 'input', name: 'Input', type: 'array', required: true }],
        outputs: [
          { id: 'loop', name: 'Loop', type: 'any' },
          { id: 'done', name: 'Done', type: 'array' },
        ],
      }
    case 'code':
      return {
        ...baseData,
        label: label || 'Code',
        config: {
          language: 'javascript',
          code: '// Write your code here\nasync function main(inputs) {\n return { output: inputs };\n}',
          timeout: 30000,
        },
        inputs: [{ id: 'input', name: 'Input', type: 'any' }],
        outputs: [{ id: 'output', name: 'Output', type: 'any' }],
      }
    case 'template':
      return {
        ...baseData,
        label: label || 'Text template',
        config: {
          template: '',
        },
        inputs: [{ id: 'input', name: 'Variable', type: 'object' }],
        outputs: [{ id: 'output', name: 'Text', type: 'string' }],
      }
    case 'variable':
      return {
        ...baseData,
        label: label || 'Variable',
        config: {
          variableName: 'myVar',
          valueType: 'string',
          value: '',
        },
        inputs: [{ id: 'input', name: 'Input', type: 'any' }],
        outputs: [{ id: 'output', name: 'Output', type: 'any' }],
      }
    case 'input':
      return {
        ...baseData,
        label: label || 'Form input',
        config: {
          inputType: 'text',
          name: 'input',
          label: 'User input',
          placeholder: '',
          required: true,
        },
        outputs: [{ id: 'output', name: 'Output', type: 'any' }],
      }
    case 'output':
      return {
        ...baseData,
        label: label || 'Result output',
        config: {
          outputType: 'text',
          title: 'Output result',
          showTimestamp: false,
        },
        inputs: [{ id: 'input', name: 'Input', type: 'any', required: true }],
      }
    case 'db_select':
      return {
        ...baseData,
        label: label || 'DB Query',
        config: {
          operation: 'select',
          table: 'table_name',
          where: '',
          limit: 100,
        },
        inputs: [{ id: 'params', name: 'Parameter', type: 'object' }],
        outputs: [
          { id: 'rows', name: 'rows', type: 'array' },
          { id: 'count', name: 'count', type: 'number' },
        ],
      }
    case 'db_insert':
      return {
        ...baseData,
        label: label || 'DB Add',
        config: {
          operation: 'insert',
          table: 'table_name',
          values: { field: 'value' },
        },
        inputs: [{ id: 'values', name: 'values', type: 'object' }],
        outputs: [
          { id: 'insertedId', name: 'insertedId', type: 'string' },
          { id: 'rowsAffected', name: 'rowsAffected', type: 'number' },
        ],
      }
    case 'db_update':
      return {
        ...baseData,
        label: label || 'DB Update',
        config: {
          operation: 'update',
          table: 'table_name',
          where: '',
          values: { field: 'value' },
        },
        inputs: [{ id: 'values', name: 'values', type: 'object' }],
        outputs: [{ id: 'rowsAffected', name: 'rowsAffected', type: 'number' }],
      }
    case 'db_delete':
      return {
        ...baseData,
        label: label || 'DB Delete',
        config: {
          operation: 'delete',
          table: 'table_name',
          where: '',
        },
        inputs: [{ id: 'params', name: 'Parameter', type: 'object' }],
        outputs: [{ id: 'rowsAffected', name: 'rowsAffected', type: 'number' }],
      }
    case 'db_migrate':
      return {
        ...baseData,
        label: label || 'DB Migration',
        config: {
          operation: 'migrate',
          sql: 'CREATE TABLE example (id INT PRIMARY KEY);',
        },
        inputs: [{ id: 'sql', name: 'sql', type: 'string' }],
        outputs: [
          { id: 'applied', name: 'applied', type: 'boolean' },
          { id: 'appliedCount', name: 'appliedCount', type: 'number' },
        ],
      }
    default:
      return baseData
  }
}

export function EditorCanvas({ showEmptyState = true }: EditorCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()

  const { nodes, edges, setNodes, setEdges, addNode, addEdge: storeAddEdge } = useWorkflowStore()

  // Enhanced connection validation
  const isValidConnection = useCallback(
    (connection: Connection): boolean => {
      const { source, target, sourceHandle, targetHandle } = connection

      if (source === target) return false
      if (detectCycle(edges, source!, target!)) {
        console.warn('Connection would create a cycle')
        return false
      }

      const sourceNode = nodes.find((n) => n.id === source) as WorkflowNode | undefined
      const targetNode = nodes.find((n) => n.id === target) as WorkflowNode | undefined

      if (!sourceNode || !targetNode) return false

      const sourcePort = sourceNode.data.outputs?.find((p) => p.id === sourceHandle)
      const targetPort = targetNode.data.inputs?.find((p) => p.id === targetHandle)

      if (!sourcePort || !targetPort) return true

      const sourceType = sourcePort.type || 'any'
      const targetType = targetPort.type || 'any'

      if (!areTypesCompatible(sourceType, targetType)) {
        console.warn(`Type mismatch: ${sourceType} -> ${targetType}`)
        return false
      }

      if (!targetPort.multiple) {
        const existingConnection = edges.find(
          (e) => e.target === target && e.targetHandle === targetHandle
        )
        if (existingConnection) {
          console.warn('Target port already connected')
          return false
        }
      }

      return true
    },
    [nodes, edges]
  )

  // Node Change Handler
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes(applyNodeChanges(changes, nodes) as typeof nodes)
    },
    [nodes, setNodes]
  )

  // Edge Change Handler
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setEdges(applyEdgeChanges(changes, edges))
    },
    [edges, setEdges]
  )

  // Connection Handler
  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (!isValidConnection(connection)) return

      const sourceNode = nodes.find((n) => n.id === connection.source)

      let edgeType = 'smoothstep'
      let edgeData: Record<string, unknown> = {}

      if (sourceNode?.type === 'condition') {
        edgeType = 'conditional'
      } else {
        const sourcePort = sourceNode?.data?.outputs?.find(
          (p: { id: string }) => p.id === connection.sourceHandle
        )
        if (sourcePort?.name) {
          edgeData = { sourcePortName: sourcePort.name }
          edgeType = 'labeled'
        }
      }

      const newEdge: Edge = {
        ...connection,
        id: generateId('edge'),
        type: edgeType,
        data: edgeData,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      } as Edge

      storeAddEdge(newEdge)
    },
    [storeAddEdge, isValidConnection, nodes]
  )

  // Drag & Drop Handler
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')
      const label = event.dataTransfer.getData('node/label')

      if (!type) return

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newNode: Node = {
        id: generateId('node'),
        type,
        position,
        data: createDefaultNodeData(type, label),
      }

      addNode(newNode as (typeof nodes)[number])
    },
    [screenToFlowPosition, addNode]
  )

  // Node Click Handler
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node.id)
  }, [])

  // Canvas Click Handler
  const onPaneClick = useCallback(() => {
    useWorkflowStore.getState().clearSelection()
  }, [])

  // MiniMap Node Color - Uses Design System Colors
  const nodeColor = useCallback((node: Node) => {
    switch (node.type) {
      case 'start':
        return 'var(--color-success)'
      case 'end':
        return 'var(--color-destructive)'
      case 'llm':
        return 'var(--color-brand-500)'
      case 'http':
        return 'var(--color-foreground-light)'
      case 'condition':
        return 'var(--color-warning)'
      case 'loop':
        return 'var(--color-warning)'
      case 'code':
        return 'var(--color-foreground-light)'
      case 'template':
        return 'var(--color-foreground-light)'
      case 'variable':
        return 'var(--color-brand-500)'
      default:
        return 'var(--color-foreground-muted)'
    }
  }, [])

  // Quick Add Node
  const quickAddNode = useCallback(
    (type: string, label: string) => {
      const position = { x: 400, y: 200 + nodes.length * 100 }
      const newNode: Node = {
        id: generateId('node'),
        type,
        position,
        data: createDefaultNodeData(type, label),
      }
      addNode(newNode as (typeof nodes)[number])
    },
    [addNode, nodes.length]
  )

  // Empty State Guide Component - Animation
  const EmptyStateGuide = () => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      {/* Background Decoration Animation */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Dot */}
        <div
          className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-brand-500/20 animate-pulse"
          style={{ animationDelay: '0s' }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-3 h-3 rounded-full bg-brand-500/20 animate-pulse"
          style={{ animationDelay: '0.5s' }}
        />
        <div
          className="absolute bottom-1/3 left-1/3 w-2 h-2 rounded-full bg-brand-200/30 animate-pulse"
          style={{ animationDelay: '1s' }}
        />
        <div
          className="absolute bottom-1/4 right-1/3 w-2 h-2 rounded-full bg-surface-200/60 animate-pulse"
          style={{ animationDelay: '1.5s' }}
        />

        {/* Gradient Halo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-500/5 blur-3xl animate-pulse" />
      </div>

      <div className="flex flex-col items-center gap-6 max-w-md text-center pointer-events-auto animate-fade-in">
        {/* Main Icon - Animation */}
        <div className="relative group">
          <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-brand-500/20 to-brand-600/20 flex items-center justify-center border border-brand-500/30 transition-transform duration-300 group-hover:scale-105">
            <Workflow className="w-10 h-10 text-brand-500 transition-transform duration-300 group-hover:rotate-12" />
          </div>
          {/* Pulse */}
          <div
            className="absolute inset-0 rounded-2xl border border-brand-500/20 animate-ping opacity-75"
            style={{ animationDuration: '2s' }}
          />
          {/* Sparkles Icon */}
          <div
            className="absolute -right-2 -bottom-2 w-8 h-8 rounded-lg bg-brand-200/60 flex items-center justify-center border border-brand-500/30 animate-bounce"
            style={{ animationDuration: '2s' }}
          >
            <Sparkles className="w-4 h-4 text-brand-500" />
          </div>
        </div>

        {/* Title and Description */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">Start building your workflow</h3>
          <p className="text-sm text-foreground-muted leading-relaxed">
            Drag and drop nodes from the left panel to the canvas, or use the shortcut buttons below
            to get started quickly
          </p>
        </div>

        {/* Quick Start Button - Float Effect */}
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => quickAddNode('start', 'Start')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-200/40 border border-brand-500/30 text-brand-500 hover:bg-brand-200/70 hover:scale-105 hover:shadow-lg hover:shadow-brand-500/10 transition-all duration-200"
          >
            <Play className="w-4 h-4" />
            <span className="text-sm font-medium">Add start node</span>
          </button>
          <button
            onClick={() => quickAddNode('llm', 'LLM Call')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-200/30 border border-brand-500/20 text-brand-500 hover:bg-brand-200/60 hover:scale-105 hover:shadow-lg hover:shadow-brand-500/10 transition-all duration-200"
          >
            <Bot className="w-4 h-4" />
            <span className="text-sm font-medium">AI Node</span>
          </button>
          <button
            onClick={() => quickAddNode('http', 'HTTP Request')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-200/70 border border-border/70 text-foreground-muted hover:bg-surface-200 hover:text-foreground hover:scale-105 transition-all duration-200"
          >
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">HTTP Request</span>
          </button>
        </div>

        {/* Drag & Drop Tip - Animation */}
        <div className="flex items-center gap-2 text-xs text-foreground-muted mt-4">
          <MousePointerClick
            className="w-4 h-4 animate-bounce"
            style={{ animationDuration: '1.5s' }}
          />
          <span>Or drag and drop nodes from the left panel</span>
        </div>
      </div>
    </div>
  )

  return (
    <div
      ref={reactFlowWrapper}
      className="flex-1 h-full bg-background-studio"
      data-testid="editor-canvas"
      style={{
        backgroundImage:
          'radial-gradient(circle at 1px 1px, var(--color-border-muted) 1px, transparent 0)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Empty State Guide */}
      {showEmptyState && nodes.length === 0 && <EmptyStateGuide />}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        isValidConnection={isValidConnection}
        fitView
        snapToGrid
        snapGrid={[24, 24]}
        minZoom={0.25}
        maxZoom={4}
        attributionPosition="bottom-right"
        proOptions={{ hideAttribution: true }}
        className="bg-transparent!"
      >
        {/* Background Grid - Manus Style */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="var(--color-border-muted)"
          className="bg-background-studio!"
        />

        {/* Control Panel - Optimal Style */}
        <Controls
          showInteractive={false}
          className={cn(
            'bg-surface-100/80! backdrop-blur-sm!',
            'border! border-border/70! rounded-xl!',
            'shadow-lg! shadow-black/20!',
            '[&>button]:bg-transparent! [&>button]:border-b! [&>button]:border-border/70!',
            '[&>button]:text-foreground-muted! [&>button]:hover:text-foreground! [&>button]:hover:bg-surface-200!',
            '[&>button]:transition-colors! [&>button]:duration-150!',
            '[&>button:last-child]:border-b-0!',
            '[&>button>svg]:fill-current!'
          )}
        />

        {/* MiniMap - Optimal Style */}
        <MiniMap
          nodeColor={nodeColor}
          nodeStrokeColor="transparent"
          nodeBorderRadius={6}
          maskColor="var(--color-background-overlay)"
          className={cn(
            'bg-surface-100/80! backdrop-blur-sm!',
            'border! border-border/70! rounded-xl!',
            'shadow-lg! shadow-black/20!',
            'w-[180px]! h-[120px]!'
          )}
          style={{
            background: 'var(--color-surface-100)',
          }}
        />

        {/* Canvas Info Panel - Optimal Style */}
        <Panel position="top-right" className="m-4!">
          <div
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-xl',
              'bg-surface-100/80 backdrop-blur-sm',
              'border border-border/70',
              'shadow-lg shadow-black/20'
            )}
          >
            {/* Node Count */}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-lg',
                  'bg-linear-to-br from-brand-500/20 to-brand-600/10',
                  'border border-brand-500/20'
                )}
              >
                <Workflow className="h-3.5 w-3.5 text-brand-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-foreground-muted leading-none">Node</span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {nodes.length}
                </span>
              </div>
            </div>

            <div className="w-px h-8 bg-border" />

            {/* Connection Count */}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-lg',
                  'bg-linear-to-br from-brand-500/20 to-brand-600/10',
                  'border border-brand-500/20'
                )}
              >
                <GitBranch className="h-3.5 w-3.5 text-brand-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-foreground-muted leading-none">Connections</span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {edges.length}
                </span>
              </div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}
