/**
 * DAG (Directed Acyclic Graph) Analysis
 * Used for analyzing workflow node dependencies and execution order
 */

import type { Edge } from '@xyflow/react'
import type { WorkflowNode } from '@/types/workflow'
import type { DAGNode, DAGAnalysis } from './types'

/**
 * Analyze workflow DAG structure
 */
export function analyzeDAG(nodes: WorkflowNode[], edges: Edge[]): DAGAnalysis {
  // Build node mapping
  const nodeMap: Record<string, DAGNode> = {}

  // Initialize all nodes
  for (const node of nodes) {
    nodeMap[node.id] = {
      id: node.id,
      type: node.type || 'unknown',
      dependencies: [],
      dependents: [],
      level: -1,
    }
  }

  // Build dependencies based on edges
  for (const edge of edges) {
    const sourceNode = nodeMap[edge.source]
    const targetNode = nodeMap[edge.target]

    if (sourceNode && targetNode) {
      // source is target's dependency
      targetNode.dependencies.push(edge.source)
      // target is source's dependent
      sourceNode.dependents.push(edge.target)
    }
  }

  // Detect circular dependencies
  const hasCircle = detectCycle(nodeMap)

  // Start nodes (nodes with no dependencies)
  const startNodes = Object.keys(nodeMap).filter((id) => nodeMap[id].dependencies.length === 0)

  // End nodes (nodes with no dependents)
  const endNodes = Object.keys(nodeMap).filter((id) => nodeMap[id].dependents.length === 0)

  // Calculate node hierarchy (topological sort)
  const levels = calculateLevels(nodeMap, startNodes)

  // Generate execution order
  const executionOrder = levels.flat()

  return {
    nodes: nodeMap,
    levels,
    executionOrder,
    hasCircle,
    startNodes,
    endNodes,
  }
}

/**
 * Detect circular dependencies
 */
function detectCycle(nodeMap: Record<string, DAGNode>): boolean {
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  function dfs(nodeId: string): boolean {
    visited.add(nodeId)
    recursionStack.add(nodeId)

    const node = nodeMap[nodeId]
    if (node) {
      for (const dependentId of node.dependents) {
        if (!visited.has(dependentId)) {
          if (dfs(dependentId)) {
            return true
          }
        } else if (recursionStack.has(dependentId)) {
          return true
        }
      }
    }

    recursionStack.delete(nodeId)
    return false
  }

  for (const nodeId of Object.keys(nodeMap)) {
    if (!visited.has(nodeId)) {
      if (dfs(nodeId)) {
        return true
      }
    }
  }

  return false
}

/**
 * Calculate node hierarchy (Kahn's Algorithm)
 */
function calculateLevels(nodeMap: Record<string, DAGNode>, startNodes: string[]): string[][] {
  const levels: string[][] = []
  const inDegree: Record<string, number> = {}

  // Initialize in-degree
  for (const nodeId of Object.keys(nodeMap)) {
    inDegree[nodeId] = nodeMap[nodeId].dependencies.length
  }

  // BFS layered traversal
  let currentLevel = [...startNodes]

  while (currentLevel.length > 0) {
    levels.push(currentLevel)

    // Update node hierarchy
    for (const nodeId of currentLevel) {
      nodeMap[nodeId].level = levels.length - 1
    }

    // Collect next level nodes
    const nextLevel: string[] = []

    for (const nodeId of currentLevel) {
      const node = nodeMap[nodeId]

      for (const dependentId of node.dependents) {
        inDegree[dependentId]--

        if (inDegree[dependentId] === 0) {
          nextLevel.push(dependentId)
        }
      }
    }

    currentLevel = nextLevel
  }

  return levels
}

/**
 * Get all upstream nodes of a node
 */
export function getUpstreamNodes(nodeId: string, nodeMap: Record<string, DAGNode>): string[] {
  const upstream: string[] = []
  const visited = new Set<string>()

  function traverse(id: string) {
    const node = nodeMap[id]
    if (!node) return

    for (const depId of node.dependencies) {
      if (!visited.has(depId)) {
        visited.add(depId)
        upstream.push(depId)
        traverse(depId)
      }
    }
  }

  traverse(nodeId)
  return upstream
}

/**
 * Get all downstream nodes of a node
 */
export function getDownstreamNodes(nodeId: string, nodeMap: Record<string, DAGNode>): string[] {
  const downstream: string[] = []
  const visited = new Set<string>()

  function traverse(id: string) {
    const node = nodeMap[id]
    if (!node) return

    for (const depId of node.dependents) {
      if (!visited.has(depId)) {
        visited.add(depId)
        downstream.push(depId)
        traverse(depId)
      }
    }
  }

  traverse(nodeId)
  return downstream
}

/**
 * Check if a node can execute (all dependencies are completed)
 */
export function canExecuteNode(
  nodeId: string,
  nodeMap: Record<string, DAGNode>,
  completedNodes: Set<string>
): boolean {
  const node = nodeMap[nodeId]
  if (!node) return false

  return node.dependencies.every((depId) => completedNodes.has(depId))
}

/**
 * Get nodes that can be executed in parallel
 */
export function getExecutableNodes(
  nodeMap: Record<string, DAGNode>,
  completedNodes: Set<string>,
  runningNodes: Set<string>
): string[] {
  const executable: string[] = []

  for (const nodeId of Object.keys(nodeMap)) {
    // Skip completed or currently running nodes
    if (completedNodes.has(nodeId) || runningNodes.has(nodeId)) {
      continue
    }

    // Check if all dependencies are completed
    if (canExecuteNode(nodeId, nodeMap, completedNodes)) {
      executable.push(nodeId)
    }
  }

  return executable
}
