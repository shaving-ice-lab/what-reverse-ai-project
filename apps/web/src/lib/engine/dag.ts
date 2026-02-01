/**
 * DAG (有向无环图) 分析器
 * 用于分析工作流节点依赖关系和执行顺序
 */

import type { Edge } from "@xyflow/react";
import type { WorkflowNode } from "@/types/workflow";
import type { DAGNode, DAGAnalysis } from "./types";

/**
 * 分析工作流 DAG 结构
 */
export function analyzeDAG(
  nodes: WorkflowNode[],
  edges: Edge[]
): DAGAnalysis {
  // 构建节点映射
  const nodeMap: Record<string, DAGNode> = {};
  
  // 初始化所有节点
  for (const node of nodes) {
    nodeMap[node.id] = {
      id: node.id,
      type: node.type || "unknown",
      dependencies: [],
      dependents: [],
      level: -1,
    };
  }
  
  // 根据边建立依赖关系
  for (const edge of edges) {
    const sourceNode = nodeMap[edge.source];
    const targetNode = nodeMap[edge.target];
    
    if (sourceNode && targetNode) {
      // source 是 target 的依赖
      targetNode.dependencies.push(edge.source);
      // target 是 source 的依赖者
      sourceNode.dependents.push(edge.target);
    }
  }
  
  // 检测循环依赖
  const hasCircle = detectCycle(nodeMap);
  
  // 找出起始节点 (没有依赖的节点)
  const startNodes = Object.keys(nodeMap).filter(
    (id) => nodeMap[id].dependencies.length === 0
  );
  
  // 找出结束节点 (没有依赖者的节点)
  const endNodes = Object.keys(nodeMap).filter(
    (id) => nodeMap[id].dependents.length === 0
  );
  
  // 计算节点层级 (拓扑排序)
  const levels = calculateLevels(nodeMap, startNodes);
  
  // 生成执行顺序
  const executionOrder = levels.flat();
  
  return {
    nodes: nodeMap,
    levels,
    executionOrder,
    hasCircle,
    startNodes,
    endNodes,
  };
}

/**
 * 检测循环依赖
 */
function detectCycle(nodeMap: Record<string, DAGNode>): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    
    const node = nodeMap[nodeId];
    if (node) {
      for (const dependentId of node.dependents) {
        if (!visited.has(dependentId)) {
          if (dfs(dependentId)) {
            return true;
          }
        } else if (recursionStack.has(dependentId)) {
          return true;
        }
      }
    }
    
    recursionStack.delete(nodeId);
    return false;
  }
  
  for (const nodeId of Object.keys(nodeMap)) {
    if (!visited.has(nodeId)) {
      if (dfs(nodeId)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * 计算节点层级 (Kahn's Algorithm)
 */
function calculateLevels(
  nodeMap: Record<string, DAGNode>,
  startNodes: string[]
): string[][] {
  const levels: string[][] = [];
  const inDegree: Record<string, number> = {};
  
  // 初始化入度
  for (const nodeId of Object.keys(nodeMap)) {
    inDegree[nodeId] = nodeMap[nodeId].dependencies.length;
  }
  
  // BFS 分层
  let currentLevel = [...startNodes];
  
  while (currentLevel.length > 0) {
    levels.push(currentLevel);
    
    // 更新节点层级
    for (const nodeId of currentLevel) {
      nodeMap[nodeId].level = levels.length - 1;
    }
    
    // 找出下一层节点
    const nextLevel: string[] = [];
    
    for (const nodeId of currentLevel) {
      const node = nodeMap[nodeId];
      
      for (const dependentId of node.dependents) {
        inDegree[dependentId]--;
        
        if (inDegree[dependentId] === 0) {
          nextLevel.push(dependentId);
        }
      }
    }
    
    currentLevel = nextLevel;
  }
  
  return levels;
}

/**
 * 获取节点的所有上游节点
 */
export function getUpstreamNodes(
  nodeId: string,
  nodeMap: Record<string, DAGNode>
): string[] {
  const upstream: string[] = [];
  const visited = new Set<string>();
  
  function traverse(id: string) {
    const node = nodeMap[id];
    if (!node) return;
    
    for (const depId of node.dependencies) {
      if (!visited.has(depId)) {
        visited.add(depId);
        upstream.push(depId);
        traverse(depId);
      }
    }
  }
  
  traverse(nodeId);
  return upstream;
}

/**
 * 获取节点的所有下游节点
 */
export function getDownstreamNodes(
  nodeId: string,
  nodeMap: Record<string, DAGNode>
): string[] {
  const downstream: string[] = [];
  const visited = new Set<string>();
  
  function traverse(id: string) {
    const node = nodeMap[id];
    if (!node) return;
    
    for (const depId of node.dependents) {
      if (!visited.has(depId)) {
        visited.add(depId);
        downstream.push(depId);
        traverse(depId);
      }
    }
  }
  
  traverse(nodeId);
  return downstream;
}

/**
 * 检查节点是否可以执行 (所有依赖都已完成)
 */
export function canExecuteNode(
  nodeId: string,
  nodeMap: Record<string, DAGNode>,
  completedNodes: Set<string>
): boolean {
  const node = nodeMap[nodeId];
  if (!node) return false;
  
  return node.dependencies.every((depId) => completedNodes.has(depId));
}

/**
 * 获取可以并行执行的节点
 */
export function getExecutableNodes(
  nodeMap: Record<string, DAGNode>,
  completedNodes: Set<string>,
  runningNodes: Set<string>
): string[] {
  const executable: string[] = [];
  
  for (const nodeId of Object.keys(nodeMap)) {
    // 跳过已完成或正在运行的节点
    if (completedNodes.has(nodeId) || runningNodes.has(nodeId)) {
      continue;
    }
    
    // 检查是否所有依赖都已完成
    if (canExecuteNode(nodeId, nodeMap, completedNodes)) {
      executable.push(nodeId);
    }
  }
  
  return executable;
}
