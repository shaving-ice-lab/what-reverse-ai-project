/**
 * 快照工具函数
 * 
 * 提供快照压缩、解压缩、创建和验证等辅助功能
 */

import type {
  ExecutionSnapshot,
  NodeSnapshot,
  ExecutionSummary,
  SnapshotMetadata,
  TimelineStep,
  TimelineView,
  CreateSnapshotOptions,
} from "@/types/time-travel";
import type { ExecutionStatus } from "@/types/execution";
import type { WorkflowExecutionState, NodeExecutionState } from "@/lib/engine/types";

// ===== 压缩相关 =====

/**
 * 压缩快照
 * 使用 LZ-String 或类似算法压缩大型数据
 */
export async function compressSnapshot(
  snapshot: ExecutionSnapshot,
  _level?: number
): Promise<ExecutionSnapshot> {
  // 计算原始大小
  const originalSize = new Blob([JSON.stringify(snapshot)]).size;

  // 压缩节点输入输出数据
  const compressedNodeSnapshots: Record<string, NodeSnapshot> = {};
  
  for (const [nodeId, nodeSnapshot] of Object.entries(snapshot.nodeSnapshots)) {
    compressedNodeSnapshots[nodeId] = {
      ...nodeSnapshot,
      // 大型数据可以进行压缩处理
      inputs: compressData(nodeSnapshot.inputs),
      outputs: compressData(nodeSnapshot.outputs),
    };
  }

  const compressedSize = new Blob([
    JSON.stringify({ ...snapshot, nodeSnapshots: compressedNodeSnapshots }),
  ]).size;

  return {
    ...snapshot,
    nodeSnapshots: compressedNodeSnapshots,
    metadata: {
      ...snapshot.metadata,
      compressed: true,
      originalSize,
      compressedSize,
    },
  };
}

/**
 * 解压缩快照
 */
export async function decompressSnapshot(
  snapshot: ExecutionSnapshot
): Promise<ExecutionSnapshot> {
  if (!snapshot.metadata?.compressed) {
    return snapshot;
  }

  const decompressedNodeSnapshots: Record<string, NodeSnapshot> = {};
  
  for (const [nodeId, nodeSnapshot] of Object.entries(snapshot.nodeSnapshots)) {
    decompressedNodeSnapshots[nodeId] = {
      ...nodeSnapshot,
      inputs: decompressData(nodeSnapshot.inputs),
      outputs: decompressData(nodeSnapshot.outputs),
    };
  }

  return {
    ...snapshot,
    nodeSnapshots: decompressedNodeSnapshots,
    metadata: {
      ...snapshot.metadata,
      compressed: false,
    },
  };
}

/**
 * 压缩数据（简化实现）
 * 在实际生产中可以使用 lz-string 或 pako 库
 */
function compressData(data: Record<string, unknown>): Record<string, unknown> {
  // 移除 undefined 值
  return JSON.parse(JSON.stringify(data));
}

/**
 * 解压缩数据
 */
function decompressData(data: Record<string, unknown>): Record<string, unknown> {
  return data;
}

// ===== 快照创建 =====

/**
 * 从执行状态创建快照
 */
export function createSnapshotFromExecution(
  executionState: WorkflowExecutionState,
  workflowName?: string,
  options?: CreateSnapshotOptions
): ExecutionSnapshot {
  const now = new Date().toISOString();
  
  // 转换节点快照
  const nodeSnapshots: Record<string, NodeSnapshot> = {};
  const executionOrder: string[] = [];

  for (const [nodeId, nodeState] of Object.entries(executionState.nodeStates)) {
    nodeSnapshots[nodeId] = createNodeSnapshotFromState(nodeState);
    
    if (nodeState.startTime) {
      executionOrder.push(nodeId);
    }
  }

  // 按开始时间排序
  executionOrder.sort((a, b) => {
    const aTime = nodeSnapshots[a].startedAt;
    const bTime = nodeSnapshots[b].startedAt;
    return aTime.localeCompare(bTime);
  });

  // 计算摘要
  const summary = calculateSummary(nodeSnapshots);

  // 创建元数据
  const metadata: SnapshotMetadata = {
    createdAt: now,
    version: "1.0.0",
    compressed: false,
    source: typeof window !== "undefined" && "__TAURI__" in window 
      ? "desktop" 
      : "web",
  };

  return {
    executionId: executionState.executionId,
    workflowId: executionState.workflowId,
    workflowName,
    status: executionState.status,
    startedAt: executionState.startTime,
    completedAt: executionState.endTime,
    durationMs: executionState.duration,
    nodeSnapshots,
    executionOrder,
    currentNodeId: executionState.currentNodeIds[0],
    inputs: executionState.variables,
    outputs: {},
    variables: executionState.variables,
    error: executionState.error ? {
      code: executionState.error.code,
      message: executionState.error.message,
      nodeId: executionState.error.nodeId,
    } : undefined,
    summary,
    metadata,
  };
}

/**
 * 从节点状态创建节点快照
 */
function createNodeSnapshotFromState(
  nodeState: NodeExecutionState
): NodeSnapshot {
  return {
    nodeId: nodeState.nodeId,
    nodeName: nodeState.nodeId, // 可以从 workflow 中获取实际名称
    nodeType: "unknown", // 需要从 workflow 定义中获取
    status: nodeState.status === "completed" ? "completed" 
          : nodeState.status === "failed" ? "failed"
          : nodeState.status === "running" ? "running"
          : "pending",
    startedAt: nodeState.startTime || new Date().toISOString(),
    completedAt: nodeState.endTime,
    durationMs: nodeState.duration || 0,
    inputs: (nodeState.inputs || {}) as Record<string, unknown>,
    outputs: (nodeState.outputs || {}) as Record<string, unknown>,
    error: nodeState.error ? {
      code: nodeState.error.code,
      message: nodeState.error.message,
      details: nodeState.error.details as Record<string, unknown> | undefined,
    } : undefined,
    logs: nodeState.logs?.map(log => ({
      level: log.level,
      message: log.message,
      timestamp: log.timestamp,
      data: log.data as Record<string, unknown> | undefined,
    })),
    metadata: {
      retryCount: nodeState.retryCount,
    },
  };
}

/**
 * 计算执行摘要
 */
function calculateSummary(
  nodeSnapshots: Record<string, NodeSnapshot>
): ExecutionSummary {
  const nodes = Object.values(nodeSnapshots);
  
  return {
    totalNodes: nodes.length,
    completedNodes: nodes.filter(n => n.status === "completed").length,
    failedNodes: nodes.filter(n => n.status === "failed").length,
    skippedNodes: nodes.filter(n => n.status === "skipped").length,
    totalTokensUsed: nodes.reduce(
      (sum, n) => sum + (n.metadata?.tokensUsed || 0),
      0
    ),
  };
}

// ===== 时间线相关 =====

/**
 * 从快照创建时间线视图
 */
export function createTimelineView(
  snapshot: ExecutionSnapshot,
  selectedStepIndex?: number
): TimelineView {
  const steps: TimelineStep[] = snapshot.executionOrder.map((nodeId, index) => {
    const nodeSnapshot = snapshot.nodeSnapshots[nodeId];
    
    return {
      index,
      nodeId,
      nodeName: nodeSnapshot.nodeName,
      nodeType: nodeSnapshot.nodeType,
      nodeIcon: getNodeIcon(nodeSnapshot.nodeType),
      status: nodeSnapshot.status,
      startedAt: nodeSnapshot.startedAt,
      completedAt: nodeSnapshot.completedAt,
      durationMs: nodeSnapshot.durationMs,
      description: getStepDescription(nodeSnapshot),
      isSelected: index === selectedStepIndex,
      hasError: nodeSnapshot.status === "failed",
    };
  });

  return {
    executionId: snapshot.executionId,
    status: snapshot.status,
    startedAt: snapshot.startedAt,
    completedAt: snapshot.completedAt,
    durationMs: snapshot.durationMs,
    steps,
    selectedStepIndex,
  };
}

/**
 * 获取节点图标
 */
function getNodeIcon(nodeType: string): string {
  const icons: Record<string, string> = {
    start: "▶️",
    end: "⏹️",
    llm: "🤖",
    http: "🌐",
    template: "📝",
    condition: "❓",
    loop: "🔄",
    variable: "📦",
    code: "💻",
    delay: "⏰",
    webhook: "🪝",
  };
  
  return icons[nodeType] || "⚙️";
}

/**
 * 获取步骤描述
 */
function getStepDescription(nodeSnapshot: NodeSnapshot): string {
  const { nodeType, metadata, status } = nodeSnapshot;

  if (status === "failed" && nodeSnapshot.error) {
    return `错误: ${nodeSnapshot.error.message}`;
  }

  switch (nodeType) {
    case "llm":
      return metadata?.model 
        ? `模型: ${metadata.model}, Tokens: ${metadata.tokensUsed || 0}`
        : "LLM 调用";
    case "http":
      return metadata?.httpStatusCode
        ? `HTTP ${metadata.httpMethod || "GET"} - ${metadata.httpStatusCode}`
        : "HTTP 请求";
    case "condition":
      return metadata?.conditionBranch
        ? `分支: ${metadata.conditionBranch}`
        : "条件判断";
    case "loop":
      return metadata?.loopIterations
        ? `迭代: ${metadata.currentIteration || 0}/${metadata.loopIterations}`
        : "循环";
    default:
      return nodeSnapshot.nodeName;
  }
}

// ===== 敏感数据处理 =====

/**
 * 移除敏感数据
 */
export function removeSensitiveData(
  snapshot: ExecutionSnapshot,
  sensitiveFields: string[] = ["password", "apiKey", "token", "secret", "authorization"]
): ExecutionSnapshot {
  const sanitizedNodeSnapshots: Record<string, NodeSnapshot> = {};

  for (const [nodeId, nodeSnapshot] of Object.entries(snapshot.nodeSnapshots)) {
    sanitizedNodeSnapshots[nodeId] = {
      ...nodeSnapshot,
      inputs: sanitizeObject(nodeSnapshot.inputs, sensitiveFields),
      outputs: sanitizeObject(nodeSnapshot.outputs, sensitiveFields),
    };
  }

  return {
    ...snapshot,
    nodeSnapshots: sanitizedNodeSnapshots,
    inputs: sanitizeObject(snapshot.inputs as Record<string, unknown>, sensitiveFields),
    outputs: sanitizeObject(snapshot.outputs as Record<string, unknown>, sensitiveFields),
    variables: sanitizeObject(snapshot.variables as Record<string, unknown>, sensitiveFields),
  };
}

/**
 * 清理对象中的敏感字段
 */
function sanitizeObject(
  obj: Record<string, unknown>,
  sensitiveFields: string[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveFields.some(field => 
      lowerKey.includes(field.toLowerCase())
    );

    if (isSensitive) {
      result[key] = "[REDACTED]";
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>, sensitiveFields);
    } else {
      result[key] = value;
    }
  }

  return result;
}

// ===== 快照比较 =====

/**
 * 比较两个快照的差异
 */
export function compareSnapshots(
  snapshotA: ExecutionSnapshot,
  snapshotB: ExecutionSnapshot
): SnapshotDiff {
  const nodeChanges: NodeDiff[] = [];
  const allNodeIds = new Set([
    ...Object.keys(snapshotA.nodeSnapshots),
    ...Object.keys(snapshotB.nodeSnapshots),
  ]);

  for (const nodeId of allNodeIds) {
    const nodeA = snapshotA.nodeSnapshots[nodeId];
    const nodeB = snapshotB.nodeSnapshots[nodeId];

    if (!nodeA) {
      nodeChanges.push({ nodeId, type: "added", nodeB });
    } else if (!nodeB) {
      nodeChanges.push({ nodeId, type: "removed", nodeA });
    } else if (nodeA.status !== nodeB.status || 
               JSON.stringify(nodeA.outputs) !== JSON.stringify(nodeB.outputs)) {
      nodeChanges.push({ nodeId, type: "changed", nodeA, nodeB });
    }
  }

  return {
    executionIdA: snapshotA.executionId,
    executionIdB: snapshotB.executionId,
    statusChanged: snapshotA.status !== snapshotB.status,
    durationDiff: (snapshotB.durationMs || 0) - (snapshotA.durationMs || 0),
    nodeChanges,
  };
}

/**
 * 快照差异
 */
export interface SnapshotDiff {
  executionIdA: string;
  executionIdB: string;
  statusChanged: boolean;
  durationDiff: number;
  nodeChanges: NodeDiff[];
}

/**
 * 节点差异
 */
export interface NodeDiff {
  nodeId: string;
  type: "added" | "removed" | "changed";
  nodeA?: NodeSnapshot;
  nodeB?: NodeSnapshot;
}

// ===== 导出格式化 =====

/**
 * 格式化快照为可读文本
 */
export function formatSnapshotAsText(snapshot: ExecutionSnapshot): string {
  const lines: string[] = [
    `执行快照: ${snapshot.executionId}`,
    `工作流: ${snapshot.workflowName || snapshot.workflowId}`,
    `状态: ${snapshot.status}`,
    `开始时间: ${snapshot.startedAt}`,
    `完成时间: ${snapshot.completedAt || "进行中"}`,
    `耗时: ${snapshot.durationMs ? `${snapshot.durationMs}ms` : "N/A"}`,
    "",
    "节点执行详情:",
    "---",
  ];

  for (const nodeId of snapshot.executionOrder) {
    const node = snapshot.nodeSnapshots[nodeId];
    lines.push(`[${node.status}] ${node.nodeName} (${node.nodeType})`);
    lines.push(`  耗时: ${node.durationMs}ms`);
    
    if (node.error) {
      lines.push(`  错误: ${node.error.message}`);
    }
    
    lines.push("");
  }

  lines.push("---");
  lines.push("摘要:");
  lines.push(`  总节点: ${snapshot.summary.totalNodes}`);
  lines.push(`  完成: ${snapshot.summary.completedNodes}`);
  lines.push(`  失败: ${snapshot.summary.failedNodes}`);
  lines.push(`  跳过: ${snapshot.summary.skippedNodes}`);
  
  if (snapshot.summary.totalTokensUsed) {
    lines.push(`  Token 使用: ${snapshot.summary.totalTokensUsed}`);
  }

  return lines.join("\n");
}
