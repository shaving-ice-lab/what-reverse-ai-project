"use client";

import { useCallback } from "react";
import dagre from "dagre";
import { useReactFlow, type Node, type Edge } from "@xyflow/react";
import { useWorkflowStore } from "@/stores/useWorkflowStore";

/**
 * 自动布局 Hook
 * 使用 dagre 库实现 DAG 自动布局
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
  direction: "LR", // 从左到右
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

      // 判断是水平布局还是垂直布局
      const isHorizontal = direction === "LR" || direction === "RL";

      dagreGraph.setGraph({
        rankdir: direction,
        nodesep: nodeSeparation,
        ranksep: rankSeparation,
        marginx: 50,
        marginy: 50,
      });

      // 添加节点到 dagre 图
      nodes.forEach((node) => {
        dagreGraph.setNode(node.id, {
          width: nodeWidth,
          height: nodeHeight,
        });
      });

      // 添加边到 dagre 图
      edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
      });

      // 执行布局计算
      dagre.layout(dagreGraph);

      // 获取布局后的节点位置
      const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);

        return {
          ...node,
          position: {
            // dagre 返回的是中心点，需要转换为左上角
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

      // 更新 store 中的节点位置
      setNodes(layoutedNodes as typeof nodes);

      // 延迟执行 fitView 以确保节点位置已更新
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
