/**
 * SnapshotToolcount
 * 
 * ProvideSnapshotCompress, Compress, CreateandVerifyetcAuxiliaryFeatures
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

// ===== CompressRelated =====

/**
 * CompressSnapshot
 * Usage LZ-String orAlgorithmCompresslargeData
 */
export async function compressSnapshot(
 snapshot: ExecutionSnapshot,
 _level?: number
): Promise<ExecutionSnapshot> {
 // CalculateOriginalSize
 const originalSize = new Blob([JSON.stringify(snapshot)]).size;

 // CompressNodeInputOutputData
 const compressedNodeSnapshots: Record<string, NodeSnapshot> = {};
 
 for (const [nodeId, nodeSnapshot] of Object.entries(snapshot.nodeSnapshots)) {
 compressedNodeSnapshots[nodeId] = {
 ...nodeSnapshot,
 // largeDatacanwithProceedCompressProcess
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
 * CompressSnapshot
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
 * CompressData(Implement)
 * atActualProductioncanwithUsage lz-string or pako 
 */
function compressData(data: Record<string, unknown>): Record<string, unknown> {
 // Remove undefined value
 return JSON.parse(JSON.stringify(data));
}

/**
 * CompressData
 */
function decompressData(data: Record<string, unknown>): Record<string, unknown> {
 return data;
}

// ===== SnapshotCreate =====

/**
 * fromExecuteStatusCreateSnapshot
 */
export function createSnapshotFromExecution(
 executionState: WorkflowExecutionState,
 workflowName?: string,
 options?: CreateSnapshotOptions
): ExecutionSnapshot {
 const now = new Date().toISOString();
 
 // ConvertNodeSnapshot
 const nodeSnapshots: Record<string, NodeSnapshot> = {};
 const executionOrder: string[] = [];

 for (const [nodeId, nodeState] of Object.entries(executionState.nodeStates)) {
 nodeSnapshots[nodeId] = createNodeSnapshotFromState(nodeState);
 
 if (nodeState.startTime) {
 executionOrder.push(nodeId);
 }
 }

 // byStartTimeSort
 executionOrder.sort((a, b) => {
 const aTime = nodeSnapshots[a].startedAt;
 const bTime = nodeSnapshots[b].startedAt;
 return aTime.localeCompare(bTime);
 });

 // CalculateSummary
 const summary = calculateSummary(nodeSnapshots);

 // CreateData
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
 * fromNodeStatusCreateNodeSnapshot
 */
function createNodeSnapshotFromState(
 nodeState: NodeExecutionState
): NodeSnapshot {
 return {
 nodeId: nodeState.nodeId,
 nodeName: nodeState.nodeId, // canwithfrom workflowFetchActualName
 nodeType: "unknown", // needneedfrom workflowDefinitionFetch
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
 * CalculateExecuteSummary
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

// ===== TimelineRelated =====

/**
 * fromSnapshotCreated AtlineView
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
 * FetchNodeIcon
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
 * FetchStepDescription
 */
function getStepDescription(nodeSnapshot: NodeSnapshot): string {
 const { nodeType, metadata, status } = nodeSnapshot;

 if (status === "failed" && nodeSnapshot.error) {
 return `Error: ${nodeSnapshot.error.message}`;
 }

 switch (nodeType) {
 case "llm":
 return metadata?.model 
 ? `Model: ${metadata.model}, Tokens: ${metadata.tokensUsed || 0}`
: "LLM Call";
 case "http":
 return metadata?.httpStatusCode ?? `HTTP ${metadata.httpMethod || "GET"} - ${metadata.httpStatusCode}`
: "HTTP Request";
 case "condition":
 return metadata?.conditionBranch
 ? `Branch: ${metadata.conditionBranch}`
: "ConditionDetermine";
 case "loop":
 return metadata?.loopIterations
 ? `Iteration: ${metadata.currentIteration || 0}/${metadata.loopIterations}`
: "Loop";
 default:
 return nodeSnapshot.nodeName;
 }
}

// ===== SensitiveDataProcess =====

/**
 * RemoveSensitiveData
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
 * Clean upfor'sSensitiveField
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

// ===== SnapshotCompare =====

/**
 * CompareSnapshot'sDiff
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
 * SnapshotDiff
 */
export interface SnapshotDiff {
 executionIdA: string;
 executionIdB: string;
 statusChanged: boolean;
 durationDiff: number;
 nodeChanges: NodeDiff[];
}

/**
 * NodeDiff
 */
export interface NodeDiff {
 nodeId: string;
 type: "added" | "removed" | "changed";
 nodeA?: NodeSnapshot;
 nodeB?: NodeSnapshot;
}

// ===== ExportFormat =====

/**
 * FormatSnapshotascanreadText
 */
export function formatSnapshotAsText(snapshot: ExecutionSnapshot): string {
 const lines: string[] = [
 `ExecuteSnapshot: ${snapshot.executionId}`,
 `Workflow: ${snapshot.workflowName || snapshot.workflowId}`,
 `Status: ${snapshot.status}`,
 `StartTime: ${snapshot.startedAt}`,
 `DoneTime: ${snapshot.completedAt || "In Progress"}`,
 `Duration: ${snapshot.durationMs ? `${snapshot.durationMs}ms`: "N/A"}`,
 "",
 "NodeExecuteDetails:",
 "---",
 ];

 for (const nodeId of snapshot.executionOrder) {
 const node = snapshot.nodeSnapshots[nodeId];
 lines.push(`[${node.status}] ${node.nodeName} (${node.nodeType})`);
 lines.push(` Duration: ${node.durationMs}ms`);
 
 if (node.error) {
 lines.push(` Error: ${node.error.message}`);
 }
 
 lines.push("");
 }

 lines.push("---");
 lines.push("Summary:");
 lines.push(` totalNode: ${snapshot.summary.totalNodes}`);
 lines.push(` Done: ${snapshot.summary.completedNodes}`);
 lines.push(` Failed: ${snapshot.summary.failedNodes}`);
 lines.push(` Skip: ${snapshot.summary.skippedNodes}`);
 
 if (snapshot.summary.totalTokensUsed) {
 lines.push(` Token Usage: ${snapshot.summary.totalTokensUsed}`);
 }

 return lines.join("\n");
}
