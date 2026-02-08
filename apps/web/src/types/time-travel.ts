/**
 * Time Travel Debug - Type Definitions
 * 
 * Provides visual execution history backtracking features, allowing users to view each step of workflow execution status.
 */

import type { ExecutionStatus } from "./execution";

// ===== Node Execution Status =====

/**
 * Node execution status enum
 */
export type NodeStatus = 
 | "pending" // Pending execution
 | "running" // Executing
 | "completed" // Execution completed
 | "failed" // Execution failed
 | "skipped" // Skipped
 | "paused"; // Paused

// ===== NodeSnapshot =====

/**
 * Node Error Info
 */
export interface NodeError {
 /** Error code */
 code?: string;
 /** Error message */
 message: string;
 /** Error stack */
 stack?: string;
 /** Additional details */
 details?: Record<string, unknown>;
}

/**
 * Node Metadata
 * Records additional node execution info, such as token usage for LLM calls
 */
export interface NodeMetadata {
 /** LLM Node: Token usage */
 tokensUsed?: number;
 /** LLM Node: Model used */
 model?: string;
 /** LLM Node: Prompt tokens */
 promptTokens?: number;
 /** LLM Node: Completion tokens */
 completionTokens?: number;
 /** HTTP Node: Response status */
 httpStatusCode?: number;
 /** HTTP Node: Request URL */
 httpUrl?: string;
 /** HTTP Node: Request method */
 httpMethod?: string;
 /** Condition Node: Selected branch */
 conditionBranch?: "true" | "false";
 /** Loop Node: Iteration count */
 loopIterations?: number;
 /** Loop Node: Current iteration index */
 currentIteration?: number;
 /** Retry count */
 retryCount?: number;
 /** Custom data */
 [key: string]: unknown;
}

/**
 * Node Snapshot
 * 
 * Records the complete status snapshot of a node during execution,
 * used for time travel debug features like backtracking and replay.
 */
export interface NodeSnapshot {
 /** Node ID */
 nodeId: string;
 /** Node name (display name) */
 nodeName: string;
 /** Node type (e.g. "llm", "http", "condition") */
 nodeType: string;
 /** Node execution status */
 status: NodeStatus;
 
 // ===== Time Info =====
 
 /** Execution start time (ISO 8601 format) */
 startedAt: string;
 /** Completion time (ISO 8601 format) */
 completedAt?: string;
 /** Execution duration (ms) */
 durationMs: number;
 
 // ===== Data Snapshot =====
 
 /** Node input data */
 inputs: Record<string, unknown>;
 /** Node output data */
 outputs: Record<string, unknown>;
 /** Resolved config (after variable substitution) */
 resolvedConfig?: Record<string, unknown>;
 
 // ===== Error Info =====
 
 /** Error info (if execution failed) */
 error?: NodeError;
 
 // ===== Metadata =====
 
 /** Execution metadata */
 metadata?: NodeMetadata;
 
 // ===== Debug Info =====
 
 /** Log records */
 logs?: NodeLogEntry[];
 /** Whether this is a breakpoint */
 isBreakpoint?: boolean;
}

/**
 * Node Log Entry
 */
export interface NodeLogEntry {
 /** Log level */
 level: "debug" | "info" | "warn" | "error";
 /** Log message */
 message: string;
 /** Timestamp (ISO 8601 format) */
 timestamp: string;
 /** Additional data */
 data?: Record<string, unknown>;
}

// ===== Execution Snapshot =====

/**
 * Snapshot Metadata
 */
export interface SnapshotMetadata {
 /** Snapshot created at */
 createdAt: string;
 /** Snapshot version */
 version: string;
 /** Whether compressed storage is used */
 compressed?: boolean;
 /** Size before compression (bytes) */
 originalSize?: number;
 /** Size after compression (bytes) */
 compressedSize?: number;
 /** Snapshot source (web | desktop) */
 source: "web" | "desktop";
}

/**
 * Execution Summary Info
 */
export interface ExecutionSummary {
 /** Total node count */
 totalNodes: number;
 /** Completed node count */
 completedNodes: number;
 /** Failed node count */
 failedNodes: number;
 /** Skipped node count */
 skippedNodes: number;
 /** Total token usage */
 totalTokensUsed?: number;
 /** Estimated cost (USD) */
 estimatedCost?: number;
}

/**
 * Execution Snapshot
 * 
 * Captures the complete status snapshot of a workflow execution, including all node execution details,
 * used for time travel debug features like backtracking and replay.
 */
export interface ExecutionSnapshot {
 /** Execution ID */
 executionId: string;
 /** Workflow ID */
 workflowId: string;
 /** Workflow name */
 workflowName?: string;
 /** Workflow version */
 workflowVersion?: number;
 /** Execution status */
 status: ExecutionStatus;
 
 // ===== Time Info =====
 
 /** Start time (ISO 8601 format) */
 startedAt: string;
 /** Completion time (ISO 8601 format) */
 completedAt?: string;
 /** Total execution duration (ms) */
 durationMs?: number;
 
 // ===== Node Snapshots =====
 
 /** All node snapshots, indexed by node ID */
 nodeSnapshots: Record<string, NodeSnapshot>;
 /** Node execution order */
 executionOrder: string[];
 /** Currently executing node ID */
 currentNodeId?: string;
 
 // ===== Global Variables =====
 
 /** Execution inputs */
 inputs: Record<string, unknown>;
 /** Execution outputs */
 outputs: Record<string, unknown>;
 /** Global variables */
 variables: Record<string, unknown>;
 
 // ===== Error Info =====
 
 /** Execution error (if failed) */
 error?: {
 code?: string;
 message: string;
 nodeId?: string;
 stack?: string;
 };
 
 // ===== Summary and Metadata =====
 
 /** Execution summary */
 summary: ExecutionSummary;
 /** Snapshot metadata */
 metadata: SnapshotMetadata;
}

// ===== Timeline Related Types =====

/**
 * Timeline Step
 * Used to display execution steps in the Timeline UI
 */
export interface TimelineStep {
 /** Step index */
 index: number;
 /** Node ID */
 nodeId: string;
 /** Node name */
 nodeName: string;
 /** Node type */
 nodeType: string;
 /** Node icon */
 nodeIcon?: string;
 /** Step status */
 status: NodeStatus;
 /** Start time */
 startedAt: string;
 /** Completion time */
 completedAt?: string;
 /** Duration (ms) */
 durationMs: number;
 /** Description */
 description?: string;
 /** Whether this is the currently selected step */
 isSelected?: boolean;
 /** Whether this step has an error */
 hasError?: boolean;
}

/**
 * Timeline View Data
 */
export interface TimelineView {
 /** Execution ID */
 executionId: string;
 /** Execution status */
 status: ExecutionStatus;
 /** Start time */
 startedAt: string;
 /** Completion time */
 completedAt?: string;
 /** Total duration */
 durationMs?: number;
 /** Timeline step list */
 steps: TimelineStep[];
 /** Currently selected step index */
 selectedStepIndex?: number;
}

// ===== Debug Action Related Types =====

/**
 * Rerun Node Request
 */
export interface RerunNodeRequest {
 /** Execution ID */
 executionId: string;
 /** Node ID to rerun */
 nodeId: string;
 /** New inputs (optional, uses original inputs if not provided) */
 newInputs?: Record<string, unknown>;
 /** Whether to continue executing subsequent nodes */
 continueExecution?: boolean;
}

/**
 * Rerun Node Result
 */
export interface RerunNodeResult {
 /** New execution ID */
 newExecutionId: string;
 /** Node snapshot */
 nodeSnapshot: NodeSnapshot;
 /** Whether successful */
 success: boolean;
 /** Error message */
 error?: string;
}

/**
 * Breakpoint Info
 */
export interface Breakpoint {
 /** Breakpoint ID */
 id: string;
 /** Node ID */
 nodeId: string;
 /** Whether enabled */
 enabled: boolean;
 /** Condition expression (optional) */
 condition?: string;
 /** Created at */
 createdAt: string;
}

/**
 * Debug Session Status
 */
export interface DebugSession {
 /** Session ID */
 sessionId: string;
 /** Associated execution ID */
 executionId: string;
 /** Whether paused */
 isPaused: boolean;
 /** Paused at node ID */
 pausedAtNodeId?: string;
 /** Breakpoint list */
 breakpoints: Breakpoint[];
 /** Session start time */
 startedAt: string;
}

// ===== Snapshot Storage Related Types =====

/**
 * Snapshot Storage Options
 */
export interface SnapshotStorageOptions {
 /** Whether to compress */
 compress?: boolean;
 /** Compression level (1-9) */
 compressionLevel?: number;
 /** Maximum snapshots to retain */
 maxSnapshots?: number;
 /** Maximum retention days */
 maxAgeDays?: number;
 /** Exclude sensitive data */
 excludeSensitiveData?: boolean;
 /** Sensitive field list */
 sensitiveFields?: string[];
}

/**
 * Snapshot Query Parameters
 */
export interface SnapshotQueryParams {
 /** Workflow ID */
 workflowId?: string;
 /** Execution status */
 status?: ExecutionStatus;
 /** Start date */
 startDate?: string;
 /** End date */
 endDate?: string;
 /** Pagination - page number */
 page?: number;
 /** Pagination - items per page */
 pageSize?: number;
 /** Sort field */
 sortBy?: "startedAt" | "durationMs" | "status";
 /** Sort order */
 sortOrder?: "asc" | "desc";
}

/**
 * Snapshot List Item (without full node data)
 */
export interface SnapshotListItem {
 /** Execution ID */
 executionId: string;
 /** Workflow ID */
 workflowId: string;
 /** Workflow name */
 workflowName?: string;
 /** Execution status */
 status: ExecutionStatus;
 /** Start time */
 startedAt: string;
 /** Completion time */
 completedAt?: string;
 /** Duration */
 durationMs?: number;
 /** Summary */
 summary: ExecutionSummary;
}

// ===== Utility Types =====

/**
 * Options for creating a snapshot from execution results
 */
export interface CreateSnapshotOptions {
 /** Include logs */
 includeLogs?: boolean;
 /** Include debug info */
 includeDebugInfo?: boolean;
 /** Storage options */
 storage?: SnapshotStorageOptions;
}

// ===== Export Aggregate Types =====

export type {
 NodeSnapshot as TimeTravelNodeSnapshot,
 ExecutionSnapshot as TimeTravelExecutionSnapshot,
};
