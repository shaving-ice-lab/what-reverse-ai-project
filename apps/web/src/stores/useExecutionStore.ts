import { create } from 'zustand';
import type { ExecutionPayload, LogPayload, WSMessage } from '@/hooks/useWebSocket';

// Node Execution Status
export type NodeExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

// Execution Status
export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

// Node Execution Record
export interface NodeExecution {
 nodeId: string;
 nodeType: string;
 status: NodeExecutionStatus;
 inputs?: Record<string, unknown>;
 outputs?: Record<string, unknown>;
 error?: string;
 startedAt?: Date;
 completedAt?: Date;
 durationMs?: number;
}

// Execution Logs
export interface ExecutionLog {
 id: string;
 executionId: string;
 nodeId?: string;
 level: 'info' | 'warn' | 'error' | 'debug';
 message: string;
 timestamp: Date;
}

// Execution Record
export interface Execution {
 id: string;
 workflowId: string;
 status: ExecutionStatus;
 progress: number;
 totalNodes: number;
 completedNodes: number;
 startedAt?: Date;
 completedAt?: Date;
 durationMs?: number;
 error?: string;
 nodes: Record<string, NodeExecution>;
 logs: ExecutionLog[];
}

interface ExecutionStore {
  // Current Execution
 currentExecutionId: string | null;
 executions: Record<string, Execution>;
 
 // Action
 startExecution: (executionId: string, workflowId: string, totalNodes: number) => void;
 updateExecution: (executionId: string, updates: Partial<Execution>) => void;
 completeExecution: (executionId: string, status: ExecutionStatus, error?: string) => void;
 
  // Node Status
 updateNodeStatus: (executionId: string, nodeId: string, update: Partial<NodeExecution>) => void;
 
 // Logs
 addLog: (executionId: string, log: Omit<ExecutionLog, 'id'>) => void;
 clearLogs: (executionId: string) => void;
 
  // Set Current Execution
 setCurrentExecution: (executionId: string | null) => void;
 
 // Process WebSocket Message
 handleWSMessage: (message: WSMessage) => void;
 
 // Get Node Status
 getNodeStatus: (nodeId: string) => NodeExecutionStatus | undefined;
 
 // Clean up
 clearExecution: (executionId: string) => void;
 clearAllExecutions: () => void;
}

export const useExecutionStore = create<ExecutionStore>((set, get) => ({
 currentExecutionId: null,
 executions: {},

 startExecution: (executionId, workflowId, totalNodes) => {
 set((state) => ({
 currentExecutionId: executionId,
 executions: {
 ...state.executions,
 [executionId]: {
 id: executionId,
 workflowId,
 status: 'running',
 progress: 0,
 totalNodes,
 completedNodes: 0,
 startedAt: new Date(),
 nodes: {},
 logs: [],
 },
 },
 }));
 },

 updateExecution: (executionId, updates) => {
 set((state) => {
 const execution = state.executions[executionId];
 if (!execution) return state;

 return {
 executions: {
 ...state.executions,
 [executionId]: {
 ...execution,
 ...updates,
 },
 },
 };
 });
 },

 completeExecution: (executionId, status, error) => {
 set((state) => {
 const execution = state.executions[executionId];
 if (!execution) return state;

 return {
 executions: {
 ...state.executions,
 [executionId]: {
 ...execution,
 status,
 error,
 completedAt: new Date(),
 durationMs: execution.startedAt
 ? new Date().getTime() - execution.startedAt.getTime()
 : undefined,
 },
 },
 };
 });
 },

 updateNodeStatus: (executionId, nodeId, update) => {
 set((state) => {
 const execution = state.executions[executionId];
 if (!execution) return state;

 const existingNode = execution.nodes[nodeId] || {
 nodeId,
 nodeType: update.nodeType || 'unknown',
 status: 'pending',
 };

 return {
 executions: {
 ...state.executions,
 [executionId]: {
 ...execution,
 nodes: {
 ...execution.nodes,
 [nodeId]: {
 ...existingNode,
 ...update,
 },
 },
 },
 },
 };
 });
 },

 addLog: (executionId, log) => {
 set((state) => {
 const execution = state.executions[executionId];
 if (!execution) return state;

 return {
 executions: {
 ...state.executions,
 [executionId]: {
 ...execution,
 logs: [
 ...execution.logs,
 {
 ...log,
 id: `${executionId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
 },
 ],
 },
 },
 };
 });
 },

 clearLogs: (executionId) => {
 set((state) => {
 const execution = state.executions[executionId];
 if (!execution) return state;

 return {
 executions: {
 ...state.executions,
 [executionId]: {
 ...execution,
 logs: [],
 },
 },
 };
 });
 },

 setCurrentExecution: (executionId) => {
 set({ currentExecutionId: executionId });
 },

 handleWSMessage: (message) => {
 const { type, payload } = message;
 const state = get();

 switch (type) {
 case 'execution.started': {
 const data = payload as ExecutionPayload;
 if (data.executionId) {
 state.startExecution(
 data.executionId,
 data.workflowId || '',
 data.totalNodes || 0
 );
 state.addLog(data.executionId, {
 executionId: data.executionId,
 level: 'info',
              message: 'Execution started',
 timestamp: new Date(),
 });
 }
 break;
 }

 case 'execution.completed': {
 const data = payload as ExecutionPayload;
 if (data.executionId) {
 state.completeExecution(data.executionId, 'completed');
 state.addLog(data.executionId, {
 executionId: data.executionId,
 level: 'info',
              message: `Execution completed, duration ${data.durationMs}ms`,
 timestamp: new Date(),
 });
 }
 break;
 }

 case 'execution.failed': {
 const data = payload as ExecutionPayload;
 if (data.executionId) {
 state.completeExecution(data.executionId, 'failed', data.error);
 state.addLog(data.executionId, {
 executionId: data.executionId,
 level: 'error',
              message: data.error || 'Failed to execute',
 timestamp: new Date(),
 });
 }
 break;
 }

 case 'execution.cancelled': {
 const data = payload as ExecutionPayload;
 if (data.executionId) {
 state.completeExecution(data.executionId, 'cancelled');
 state.addLog(data.executionId, {
 executionId: data.executionId,
 level: 'warn',
              message: 'Execution cancelled',
 timestamp: new Date(),
 });
 }
 break;
 }

 case 'execution.node.started': {
 const data = payload as ExecutionPayload;
 if (data.executionId && data.nodeId) {
 state.updateNodeStatus(data.executionId, data.nodeId, {
 nodeType: data.nodeType,
 status: 'running',
 inputs: data.inputs,
 startedAt: new Date(),
 });
 state.addLog(data.executionId, {
 executionId: data.executionId,
 nodeId: data.nodeId,
 level: 'info',
              message: `Node ${data.nodeId} started execution`,
 timestamp: new Date(),
 });
 }
 break;
 }

 case 'execution.node.completed': {
 const data = payload as ExecutionPayload;
 if (data.executionId && data.nodeId) {
 state.updateNodeStatus(data.executionId, data.nodeId, {
 status: 'completed',
 outputs: data.outputs,
 completedAt: new Date(),
 durationMs: data.durationMs,
 });
 
            // Update progress
 const execution = state.executions[data.executionId];
 if (execution && data.progress !== undefined) {
 state.updateExecution(data.executionId, {
 progress: data.progress,
 completedNodes: data.completedNodes || execution.completedNodes + 1,
 });
 }
 
 state.addLog(data.executionId, {
 executionId: data.executionId,
 nodeId: data.nodeId,
 level: 'info',
              message: `Node ${data.nodeId} execution completed, duration ${data.durationMs}ms`,
 timestamp: new Date(),
 });
 }
 break;
 }

 case 'execution.node.failed': {
 const data = payload as ExecutionPayload;
 if (data.executionId && data.nodeId) {
 state.updateNodeStatus(data.executionId, data.nodeId, {
 status: 'failed',
 error: data.error,
 completedAt: new Date(),
 durationMs: data.durationMs,
 });
 state.addLog(data.executionId, {
 executionId: data.executionId,
 nodeId: data.nodeId,
 level: 'error',
              message: `Failed to execute node ${data.nodeId}: ${data.error}`,
 timestamp: new Date(),
 });
 }
 break;
 }

 case 'execution.log': {
 const data = payload as LogPayload;
 if (data.executionId) {
 state.addLog(data.executionId, {
 executionId: data.executionId,
 nodeId: data.nodeId,
 level: data.level,
 message: data.message,
 timestamp: new Date(data.timestamp),
 });
 }
 break;
 }

 case 'execution.progress': {
 const data = payload as ExecutionPayload;
 if (data.executionId) {
 state.updateExecution(data.executionId, {
 progress: data.progress,
 completedNodes: data.completedNodes,
 });
 }
 break;
 }
 }
 },

 getNodeStatus: (nodeId) => {
 const state = get();
 const { currentExecutionId, executions } = state;
 if (!currentExecutionId) return undefined;

 const execution = executions[currentExecutionId];
 return execution?.nodes[nodeId]?.status;
 },

 clearExecution: (executionId) => {
 set((state) => {
 const { [executionId]: removed, ...rest } = state.executions;
 return {
 executions: rest,
 currentExecutionId:
 state.currentExecutionId === executionId ? null : state.currentExecutionId,
 };
 });
 },

 clearAllExecutions: () => {
 set({
 executions: {},
 currentExecutionId: null,
 });
 },
}));

export default useExecutionStore;
