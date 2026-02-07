/**
 * DAG (hasNone) Analytics
 * Used forAnalyticsWorkflowNodeDependencyandExecuteOrder
 */

import type { Edge } from "@xyflow/react";
import type { WorkflowNode } from "@/types/workflow";
import type { DAGNode, DAGAnalysis } from "./types";

/**
 * AnalyticsWorkflow DAG Structure
 */
export function analyzeDAG(
 nodes: WorkflowNode[],
 edges: Edge[]
): DAGAnalysis {
 // BuildNodeMapping
 const nodeMap: Record<string, DAGNode> = {};
 
 // InitialAllNode
 for (const node of nodes) {
 nodeMap[node.id] = {
 id: node.id,
 type: node.type || "unknown",
 dependencies: [],
 dependents: [],
 level: -1,
 };
 }
 
 // Based onEdgeDependency
 for (const edge of edges) {
 const sourceNode = nodeMap[edge.source];
 const targetNode = nodeMap[edge.target];
 
 if (sourceNode && targetNode) {
 // source is target 'sDependency
 targetNode.dependencies.push(edge.source);
 // target is source 'sDependencyuser
 sourceNode.dependents.push(edge.target);
 }
 }
 
 // DetectLoopDependency
 const hasCircle = detectCycle(nodeMap);
 
 // Node (NoDependency'sNode)
 const startNodes = Object.keys(nodeMap).filter(
 (id) => nodeMap[id].dependencies.length === 0
 );
 
 // EndNode (NoDependencyuser'sNode)
 const endNodes = Object.keys(nodeMap).filter(
 (id) => nodeMap[id].dependents.length === 0
 );
 
 // CalculateNodeHierarchy (TopologySort)
 const levels = calculateLevels(nodeMap, startNodes);
 
 // GenerateExecuteOrder
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
 * DetectLoopDependency
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
 * CalculateNodeHierarchy (Kahn's Algorithm)
 */
function calculateLevels(
 nodeMap: Record<string, DAGNode>,
 startNodes: string[]
): string[][] {
 const levels: string[][] = [];
 const inDegree: Record<string, number> = {};
 
 // Initialenter
 for (const nodeId of Object.keys(nodeMap)) {
 inDegree[nodeId] = nodeMap[nodeId].dependencies.length;
 }
 
 // BFS Layered
 let currentLevel = [...startNodes];
 
 while (currentLevel.length > 0) {
 levels.push(currentLevel);
 
 // UpdateNodeHierarchy
 for (const nodeId of currentLevel) {
 nodeMap[nodeId].level = levels.length - 1;
 }
 
 // down1Node
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
 * FetchNode'sAllonNode
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
 * FetchNode'sAlldownNode
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
 * CheckNodeisnocanwithExecute (AllDependencyallCompleted)
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
 * FetchcanwithandrowExecute'sNode
 */
export function getExecutableNodes(
 nodeMap: Record<string, DAGNode>,
 completedNodes: Set<string>,
 runningNodes: Set<string>
): string[] {
 const executable: string[] = [];
 
 for (const nodeId of Object.keys(nodeMap)) {
 // SkipCompletedorcurrentlyatRun'sNode
 if (completedNodes.has(nodeId) || runningNodes.has(nodeId)) {
 continue;
 }
 
 // CheckisnoAllDependencyallCompleted
 if (canExecuteNode(nodeId, nodeMap, completedNodes)) {
 executable.push(nodeId);
 }
 }
 
 return executable;
}
