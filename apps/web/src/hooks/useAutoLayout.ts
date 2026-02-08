"use client";

import { useCallback } from "react";
import dagre from "dagre";
import { useReactFlow, type Node, type Edge } from "@xyflow/react";
import { useWorkflowStore } from "@/stores/useWorkflowStore";

/**
 * AutoLayout Hook
 * Usage dagre Implement DAG AutoLayout
 */

export type LayoutDirection = "TB" | "BT" | "LR" | "RL";

interface UseAutoLayoutOptions {
 direction?: LayoutDirection;
 nodeWidth?: number;
 nodeHeight?: number;
 nodeSeparation?: number;
 rankSeparation?: number;
}

const defaultOptions: Required<UseAutoLayoutOptions> = {
 direction: "LR", // fromlefttoright
 nodeWidth: 220,
 nodeHeight: 100,
 nodeSeparation: 50,
 rankSeparation: 100,
};

export function useAutoLayout(options: UseAutoLayoutOptions = {}) {
 const { fitView, setNodes: setReactFlowNodes } = useReactFlow();
 const { nodes, edges, setNodes } = useWorkflowStore();

 const getLayoutedElements = useCallback(
 (
 nodes: Node[],
 edges: Edge[],
 opts: Required<UseAutoLayoutOptions>
 ): Node[] => {
 const dagreGraph = new dagre.graphlib.Graph();
 dagreGraph.setDefaultEdgeLabel(() => ({}));

 const { direction, nodeWidth, nodeHeight, nodeSeparation, rankSeparation } = opts;

 // Determine if layout is horizontal or vertical
 const isHorizontal = direction === "LR" || direction === "RL";

 dagreGraph.setGraph({
 rankdir: direction,
 nodesep: nodeSeparation,
 ranksep: rankSeparation,
 marginx: 50,
 marginy: 50,
 });

 // Add nodes to dagre
 nodes.forEach((node) => {
 dagreGraph.setNode(node.id, {
 width: nodeWidth,
 height: nodeHeight,
 });
 });

 // Add edges to dagre
 edges.forEach((edge) => {
 dagreGraph.setEdge(edge.source, edge.target);
 });

 // Execute layout calculation
 dagre.layout(dagreGraph);

 // Get layouted nodes
 const layoutedNodes = nodes.map((node) => {
 const nodeWithPosition = dagreGraph.node(node.id);

 return {
 ...node,
 position: {
 // dagre returns center position, need to convert to top left
 x: nodeWithPosition.x - nodeWidth / 2,
 y: nodeWithPosition.y - nodeHeight / 2,
 },
 };
 });

 return layoutedNodes;
 },
 []
 );

 const applyLayout = useCallback(
 (direction?: LayoutDirection) => {
 if (nodes.length === 0) return;

 const mergedOptions = {
 ...defaultOptions,
 ...options,
 ...(direction ? { direction } : {}),
 };

 const layoutedNodes = getLayoutedElements(
 nodes,
 edges,
 mergedOptions
 );

 // Update store's nodes
 setNodes(layoutedNodes as typeof nodes);

 // Delayed execute fitView to ensure nodes are updated
 setTimeout(() => {
 fitView({ padding: 0.1, duration: 300 });
 }, 50);
 },
 [nodes, edges, options, getLayoutedElements, setNodes, fitView]
 );

 return {
 applyLayout,
 applyHorizontalLayout: () => applyLayout("LR"),
 applyVerticalLayout: () => applyLayout("TB"),
 };
}
