/**
 * WorkflowExecuteEngine
 */

import { generateId } from "@/lib/utils";
import { getNodeExecutor } from "@/lib/nodes";
import type { NodeContext, NodeResult, LogEntry } from "@/lib/nodes/types";
import type { WorkflowNode } from "@/types/workflow";
import {
 analyzeDAG,
 getExecutableNodes,
} from "./dag";
import type {
 ExecutionConfig,
 ExecutionInput,
 ExecutionResult,
 ExecutionStatus,
 WorkflowExecutionState,
 NodeExecutionState,
 ExecutionEvent,
 ExecutionEventListener,
 DAGAnalysis,
} from "./types";

/**
 * DefaultExecuteConfig
 */
const DEFAULT_CONFIG: Required<ExecutionConfig> = {
 timeout: 600000, // 10 min
 nodeTimeout: 60000, // 1 min
 retryCount: 0,
 retryDelay: 1000,
 maxConcurrency: 5,
 debug: false,
 breakpoints: [],
 onNodeStart: () => {},
 onNodeComplete: () => {},
 onNodeError: () => {},
 onLog: () => {},
 onStateChange: () => {},
};

/**
 * WorkflowExecuteEngine
 */
export class WorkflowExecutor {
 private state: WorkflowExecutionState;
 private config: Required<ExecutionConfig>;
 private dag: DAGAnalysis;
 private nodeMap: Map<string, WorkflowNode>;
 private abortController: AbortController;
 private listeners: Set<ExecutionEventListener>;
 private runningPromises: Map<string, Promise<void>>;

 constructor(input: ExecutionInput) {
 const { workflow, inputs = {}, config = {} } = input;

 // andConfig
 this.config = { ...DEFAULT_CONFIG, ...config };

 // Analytics DAG
 this.dag = analyzeDAG(workflow.nodes, workflow.edges);

 // BuildNodeMapping
 this.nodeMap = new Map();
 for (const node of workflow.nodes) {
 this.nodeMap.set(node.id, node);
 }

 // InitialStatus
 const executionId = generateId();
 this.state = {
 executionId,
 workflowId: workflow.id,
 status: "pending",
 startTime: new Date().toISOString(),
 nodeStates: {},
 variables: { ...workflow.variables, ...inputs },
 currentNodeIds: [],
 completedNodeIds: [],
 failedNodeIds: [],
 logs: [],
 };

 // InitialNodeStatus
 for (const node of workflow.nodes) {
 this.state.nodeStates[node.id] = {
 nodeId: node.id,
 status: "pending",
 };
 }

 this.abortController = new AbortController();
 this.listeners = new Set();
 this.runningPromises = new Map();
 }

 /**
 * AddEventListen
 */
 addEventListener(listener: ExecutionEventListener): () => void {
 this.listeners.add(listener);
 return () => this.listeners.delete(listener);
 }

 /**
 * TriggerEvent
 */
 private emit(event: ExecutionEvent): void {
 for (const listener of this.listeners) {
 try {
 listener(event);
 } catch (e) {
 console.error("Event listener error:", e);
 }
 }
 }

 /**
 * AddLogs
 */
 private log(level: LogEntry["level"], message: string, data?: unknown): void {
 const log: LogEntry = {
 level,
 message,
 timestamp: new Date().toISOString(),
 data,
 };
 this.state.logs.push(log);
 this.config.onLog(log);
 this.emit({ type: "log", log });
 }

 /**
 * UpdateStatus
 */
 private updateState(partial: Partial<WorkflowExecutionState>): void {
 this.state = { ...this.state, ...partial };
 this.config.onStateChange(this.state);
 }

 /**
 * UpdateNodeStatus
 */
 private updateNodeState(
 nodeId: string,
 partial: Partial<NodeExecutionState>
 ): void {
 this.state.nodeStates[nodeId] = {
 ...this.state.nodeStates[nodeId],
 ...partial,
 };
 this.config.onStateChange(this.state);
 }

 /**
 * ExecuteWorkflow
 */
 async execute(): Promise<ExecutionResult> {
 // CheckLoopDependency
 if (this.dag.hasCircle) {
 const error = {
 code: "CIRCULAR_DEPENDENCY",
 message: "Workflow contains circular dependencies",
 };
 this.updateState({ status: "failed", error });
 return this.buildResult("failed", error);
 }

 // CheckisnohasNode
 if (this.dag.startNodes.length === 0) {
 const error = {
 code: "NO_START_NODE",
 message: "Workflow has no start nodes",
 };
 this.updateState({ status: "failed", error });
 return this.buildResult("failed", error);
 }

 // StartExecute
 this.updateState({ status: "running", startTime: new Date().toISOString() });
 this.emit({ type: "start", executionId: this.state.executionId, timestamp: new Date().toISOString() });
 this.log("info", "Workflow execution started");

 try {
 // ExecutemainLoop
 await this.executeLoop();

 // CheckExecuteResult
 const allCompleted = Object.values(this.state.nodeStates).every(
 (ns) => ns.status === "completed" || ns.status === "cancelled"
 );

 if (this.state.status === "cancelled") {
 return this.buildResult("cancelled");
 }

 if (this.state.failedNodeIds.length > 0) {
 const failedNode = this.state.nodeStates[this.state.failedNodeIds[0]];
 const error = {
 code: "NODE_EXECUTION_FAILED",
 message: failedNode?.error?.message || "Node execution failed",
 nodeId: this.state.failedNodeIds[0],
 };
 this.updateState({ status: "failed", error });
 return this.buildResult("failed", error);
 }

 if (allCompleted) {
 this.updateState({ status: "completed" });
 this.log("info", "Workflow execution completed successfully");
 return this.buildResult("completed");
 }

 // outsideStatus
 const error = {
 code: "UNEXPECTED_STATE",
 message: "Workflow ended in unexpected state",
 };
 this.updateState({ status: "failed", error });
 return this.buildResult("failed", error);
 } catch (error) {
 const errorObj = {
 code: "EXECUTION_ERROR",
 message: error instanceof Error ? error.message : "Unknown error",
 };
 this.updateState({ status: "failed", error: errorObj });
 this.log("error", errorObj.message);
 return this.buildResult("failed", errorObj);
 }
 }

 /**
 * ExecuteLoop
 */
 private async executeLoop(): Promise<void> {
 const completedNodes = new Set(this.state.completedNodeIds);
 const runningNodes = new Set(this.state.currentNodeIds);

 while (true) {
 // CheckCancel
 if (this.abortController.signal.aborted) {
 break;
 }

 // FetchcanExecuteNode
 const executableNodes = getExecutableNodes(
 this.dag.nodes,
 completedNodes,
 runningNodes
 );

 // NocanExecuteNode
 if (executableNodes.length === 0 && runningNodes.size === 0) {
 break;
 }

 // LimitConcurrencycount
 const availableSlots = this.config.maxConcurrency - runningNodes.size;
 const nodesToExecute = executableNodes.slice(0, availableSlots);

 // LaunchNodeExecute
 for (const nodeId of nodesToExecute) {
 runningNodes.add(nodeId);
 this.state.currentNodeIds.push(nodeId);

 const promise = this.executeNode(nodeId)
 .then(() => {
 completedNodes.add(nodeId);
 this.state.completedNodeIds.push(nodeId);
 })
 .catch((error) => {
 this.state.failedNodeIds.push(nodeId);
 this.log("error", `Node ${nodeId} failed: ${error.message}`);
 })
 .finally(() => {
 runningNodes.delete(nodeId);
 this.state.currentNodeIds = this.state.currentNodeIds.filter(
 (id) => id !== nodeId
 );
 this.runningPromises.delete(nodeId);
 });

 this.runningPromises.set(nodeId, promise);
 }

 // etcpending1NodeDone
 if (this.runningPromises.size > 0) {
 await Promise.race(this.runningPromises.values());
 }

 // CheckisnohasFailedNode
 if (this.state.failedNodeIds.length > 0) {
 // etcpendingAllcurrentlyatRun'sNodeDone
 await Promise.all(this.runningPromises.values());
 break;
 }
 }
 }

 /**
 * ExecuteNode
 */
 private async executeNode(nodeId: string): Promise<void> {
 const node = this.nodeMap.get(nodeId);
 if (!node) {
 throw new Error(`Node ${nodeId} not found`);
 }

 // FetchNodeTypeandExecute
 const nodeType = node.type || "unknown";
 const executor = getNodeExecutor(nodeType);

 // UpdateStatus
 this.updateNodeState(nodeId, {
 status: "running",
 startTime: new Date().toISOString(),
 });
 this.emit({ type: "node_start", nodeId, timestamp: new Date().toISOString() });
 this.config.onNodeStart(nodeId);
 this.log("info", `Executing node: ${nodeId} (${nodeType})`);

 // CollectInput
 const inputs = this.collectNodeInputs(nodeId);

 // BuildExecuteContext
 const context: NodeContext = {
 nodeId,
 nodeType,
 nodeConfig: node.data?.config || {},
 variables: this.state.variables,
 inputs,
 abortSignal: this.abortController.signal,
 };

 let result: NodeResult;

 if (!executor) {
 // NoExecute, MarkasDone
 this.log("warn", `No executor for node type: ${nodeType}`);
 result = {
 success: true,
 outputs: inputs,
 logs: [
 {
 level: "warn",
 message: `No executor for type ${nodeType}, passing through`,
 timestamp: new Date().toISOString(),
 },
 ],
 };
 } else {
 // ExecuteNode
 try {
 result = await executor.execute(context);
 } catch (error) {
 result = {
 success: false,
 outputs: {},
 error: {
 code: "EXECUTOR_ERROR",
 message: error instanceof Error ? error.message : "Unknown error",
 details: error,
 retryable: false,
 },
 };
 }
 }

 // ProcessResult
 const endTime = new Date().toISOString();
 const startTime = this.state.nodeStates[nodeId].startTime || endTime;
 const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

 if (result.success) {
 // Success
 this.updateNodeState(nodeId, {
 status: "completed",
 endTime,
 duration,
 outputs: result.outputs,
 logs: result.logs,
 });

 // UpdateVariable
 if (result.outputs) {
 this.state.variables = {
 ...this.state.variables,
 [`${nodeId}`]: result.outputs,
 };
 }

 this.emit({
 type: "node_complete",
 nodeId,
 result,
 timestamp: endTime,
 });
 this.config.onNodeComplete(nodeId, result);
 this.log("info", `Node ${nodeId} completed in ${duration}ms`);
 } else {
 // Failed
 this.updateNodeState(nodeId, {
 status: "failed",
 endTime,
 duration,
 error: result.error,
 logs: result.logs,
 });

 this.emit({
 type: "node_error",
 nodeId,
 error: result.error,
 timestamp: endTime,
 });
 this.config.onNodeError(nodeId, result.error);

 throw new Error(result.error?.message || "Node execution failed");
 }
 }

 /**
 * CollectNodeInput
 */
 private collectNodeInputs(nodeId: string): Record<string, unknown> {
 const inputs: Record<string, unknown> = {};
 const dagNode = this.dag.nodes[nodeId];

 if (!dagNode) return inputs;

 // fromDependencyNodeCollectOutput
 for (const depId of dagNode.dependencies) {
 const depState = this.state.nodeStates[depId];
 if (depState?.outputs) {
 Object.assign(inputs, depState.outputs);
 }
 }

 return inputs;
 }

 /**
 * BuildExecuteResult
 */
 private buildResult(
 status: ExecutionStatus,
 error?: { code: string; message: string; nodeId?: string }
 ): ExecutionResult {
 const endTime = new Date().toISOString();
 const duration =
 new Date(endTime).getTime() - new Date(this.state.startTime).getTime();

 this.updateState({ endTime, duration });

 // CollectAllNode'sOutput
 const outputs: Record<string, unknown> = {};
 const nodeResults: Record<string, NodeResult> = {};

 for (const [nodeId, nodeState] of Object.entries(this.state.nodeStates)) {
 if (nodeState.outputs) {
 outputs[nodeId] = nodeState.outputs;
 }
 nodeResults[nodeId] = {
 success: nodeState.status === "completed",
 outputs: nodeState.outputs || {},
 error: nodeState.error,
 logs: nodeState.logs,
 duration: nodeState.duration,
 };
 }

 const result: ExecutionResult = {
 executionId: this.state.executionId,
 status,
 outputs,
 duration,
 nodeResults,
 logs: this.state.logs,
 error,
 };

 this.emit({ type: "complete", result, timestamp: endTime });

 return result;
 }

 /**
 * CancelExecute
 */
 cancel(): void {
 this.abortController.abort();
 this.updateState({ status: "cancelled" });
 this.emit({ type: "cancel", timestamp: new Date().toISOString() });
 this.log("info", "Workflow execution cancelled");
 }

 /**
 * FetchCurrentStatus
 */
 getState(): WorkflowExecutionState {
 return { ...this.state };
 }

 /**
 * FetchExecute ID
 */
 getExecutionId(): string {
 return this.state.executionId;
 }
}

/**
 * ExecuteWorkflow'scount
 */
export async function executeWorkflow(
 input: ExecutionInput
): Promise<ExecutionResult> {
 const executor = new WorkflowExecutor(input);
 return executor.execute();
}
