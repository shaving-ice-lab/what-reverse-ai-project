'use client';

import { useMemo } from 'react';
import { useExecutionStore, type NodeExecutionStatus } from '@/stores/useExecutionStore';

// 节点状态样式映射
export const nodeStatusStyles: Record<NodeExecutionStatus, {
  borderColor: string;
  backgroundColor: string;
  animation?: string;
}> = {
  pending: {
    borderColor: 'border-border',
    backgroundColor: 'bg-card',
  },
  running: {
    borderColor: 'border-blue-500',
    backgroundColor: 'bg-blue-50 dark:bg-blue-950',
    animation: 'animate-pulse',
  },
  completed: {
    borderColor: 'border-green-500',
    backgroundColor: 'bg-green-50 dark:bg-green-950',
  },
  failed: {
    borderColor: 'border-red-500',
    backgroundColor: 'bg-red-50 dark:bg-red-950',
  },
  skipped: {
    borderColor: 'border-border',
    backgroundColor: 'bg-muted',
  },
};

// 节点状态指示器颜色
export const nodeStatusIndicatorColors: Record<NodeExecutionStatus, string> = {
  pending: 'bg-muted-foreground',
  running: 'bg-blue-500 animate-pulse',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
  skipped: 'bg-muted-foreground',
};

/**
 * Hook to get the execution status of a specific node
 */
export function useNodeExecutionStatus(nodeId: string) {
  const { currentExecutionId, executions } = useExecutionStore();

  return useMemo(() => {
    if (!currentExecutionId) {
      return {
        status: undefined,
        isRunning: false,
        isCompleted: false,
        isFailed: false,
        nodeExecution: undefined,
        styles: nodeStatusStyles.pending,
        indicatorColor: nodeStatusIndicatorColors.pending,
      };
    }

    const execution = executions[currentExecutionId];
    const nodeExecution = execution?.nodes[nodeId];
    const status = nodeExecution?.status;

    return {
      status,
      isRunning: status === 'running',
      isCompleted: status === 'completed',
      isFailed: status === 'failed',
      nodeExecution,
      styles: status ? nodeStatusStyles[status] : nodeStatusStyles.pending,
      indicatorColor: status ? nodeStatusIndicatorColors[status] : nodeStatusIndicatorColors.pending,
    };
  }, [currentExecutionId, executions, nodeId]);
}

/**
 * Hook to get execution status for all nodes
 */
export function useAllNodeExecutionStatus() {
  const { currentExecutionId, executions } = useExecutionStore();

  return useMemo(() => {
    if (!currentExecutionId) {
      return {
        nodes: {},
        hasRunningNodes: false,
        completedCount: 0,
        failedCount: 0,
      };
    }

    const execution = executions[currentExecutionId];
    if (!execution) {
      return {
        nodes: {},
        hasRunningNodes: false,
        completedCount: 0,
        failedCount: 0,
      };
    }

    const nodes = execution.nodes;
    let hasRunningNodes = false;
    let completedCount = 0;
    let failedCount = 0;

    Object.values(nodes).forEach((node) => {
      if (node.status === 'running') hasRunningNodes = true;
      if (node.status === 'completed') completedCount++;
      if (node.status === 'failed') failedCount++;
    });

    return {
      nodes,
      hasRunningNodes,
      completedCount,
      failedCount,
    };
  }, [currentExecutionId, executions]);
}

/**
 * Get CSS classes for node based on execution status
 */
export function getNodeStatusClasses(status: NodeExecutionStatus | undefined): string {
  if (!status) return '';

  const styles = nodeStatusStyles[status];
  const classes = [styles.borderColor, styles.backgroundColor];
  
  if (styles.animation) {
    classes.push(styles.animation);
  }

  return classes.join(' ');
}

/**
 * Get indicator dot CSS classes for node status
 */
export function getStatusIndicatorClasses(status: NodeExecutionStatus | undefined): string {
  if (!status) return 'hidden';
  return `absolute -top-1 -right-1 w-3 h-3 rounded-full ${nodeStatusIndicatorColors[status]}`;
}

export default useNodeExecutionStatus;
