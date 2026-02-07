/**
 * TimerowDebug - TypeDefinition
 * 
 * Providecanvisual'sExecuteHistoryBacktrackFeatures, letUsercanViewWorkflowExecute'seach1Status.
 */

import type { ExecutionStatus } from "./execution";

// ===== NodeExecuteStatus =====

/**
 * NodeExecuteStatusEnum
 */
export type NodeStatus = 
 | "pending" // etcpendingExecute
 | "running" // Execute
 | "completed" // ExecuteDone
 | "failed" // ExecuteFailed
 | "skipped" // alreadySkip
 | "paused"; // Paused

// ===== NodeSnapshot =====

/**
 * NodeErrorInfo
 */
export interface NodeError {
 /** Error */
 code?: string;
 /** ErrorMessage */
 message: string;
 /** ErrorStack */
 stack?: string;
 /** outsideDetails */
 details?: Record<string, unknown>;
}

/**
 * NodeData
 * RecordNodeExecute'soutsideInfo, if LLM Call's token Usageetc
 */
export interface NodeMetadata {
 /** LLM Node: Token Usage */
 tokensUsed?: number;
 /** LLM Node: Usage'sModel */
 model?: string;
 /** LLM Node: Tip Token */
 promptTokens?: number;
 /** LLM Node: Done Token */
 completionTokens?: number;
 /** HTTP Node: ResponseStatus */
 httpStatusCode?: number;
 /** HTTP Node: Request URL */
 httpUrl?: string;
 /** HTTP Node: RequestMethod */
 httpMethod?: string;
 /** ConditionNode: Select'sBranch */
 conditionBranch?: "true" | "false";
 /** LoopNode: Iterationtimescount */
 loopIterations?: number;
 /** LoopNode: CurrentIterationIndex */
 currentIteration?: number;
 /** Retrytimescount */
 retryCount?: number;
 /** CustomData */
 [key: string]: unknown;
}

/**
 * NodeSnapshot
 * 
 * RecordNodeatExecutepast1time'sCompleteStatusSnapshot, 
 * Used forTimerowDebugFeatures'sBacktrackandre-.
 */
export interface NodeSnapshot {
 /** Node ID */
 nodeId: string;
 /** NodeName(DisplayName) */
 nodeName: string;
 /** NodeType (if "llm", "http", "condition" etc) */
 nodeType: string;
 /** NodeExecuteStatus */
 status: NodeStatus;
 
 // ===== TimeInfo =====
 
 /** StartExecuteTime (ISO 8601 Format) */
 startedAt: string;
 /** DoneTime (ISO 8601 Format) */
 completedAt?: string;
 /** ExecuteDuration (s) */
 durationMs: number;
 
 // ===== DataSnapshot =====
 
 /** NodeInputData */
 inputs: Record<string, unknown>;
 /** NodeOutputData */
 outputs: Record<string, unknown>;
 /** Parseafter'sConfig(VariableReplaceafter) */
 resolvedConfig?: Record<string, unknown>;
 
 // ===== ErrorInfo =====
 
 /** ErrorInfo(ifresultExecuteFailed) */
 error?: NodeError;
 
 // ===== Data =====
 
 /** ExecuteData */
 metadata?: NodeMetadata;
 
 // ===== DebugInfo =====
 
 /** LogsRecord */
 logs?: NodeLogEntry[];
 /** isnoisBreakpoint */
 isBreakpoint?: boolean;
}

/**
 * NodeLogsitem
 */
export interface NodeLogEntry {
 /** LogsLevel */
 level: "debug" | "info" | "warn" | "error";
 /** LogsMessage */
 message: string;
 /** Time (ISO 8601 Format) */
 timestamp: string;
 /** AdditionalData */
 data?: Record<string, unknown>;
}

// ===== ExecuteSnapshot =====

/**
 * SnapshotData
 */
export interface SnapshotMetadata {
 /** SnapshotCreated At */
 createdAt: string;
 /** SnapshotVersion */
 version: string;
 /** isnoCompressStorage */
 compressed?: boolean;
 /** CompressbeforeSize (bytes) */
 originalSize?: number;
 /** CompressafterSize (bytes) */
 compressedSize?: number;
 /** SnapshotSource (web | desktop) */
 source: "web" | "desktop";
}

/**
 * ExecuteSummaryInfo
 */
export interface ExecutionSummary {
 /** totalNodecount */
 totalNodes: number;
 /** CompletedNodecount */
 completedNodes: number;
 /** FailedNodecount */
 failedNodes: number;
 /** SkipNodecount */
 skippedNodes: number;
 /** total Token Usage */
 totalTokensUsed?: number;
 /** EstimateCost (USD) */
 estimatedCost?: number;
}

/**
 * ExecuteSnapshot
 * 
 * CaptureWorkflowExecute'sCompleteStatusSnapshot, ContainsAllNode'sExecuteDetails, 
 * Used forTimerowDebugFeatures'sBacktrackandre-.
 */
export interface ExecutionSnapshot {
 /** Execute ID */
 executionId: string;
 /** Workflow ID */
 workflowId: string;
 /** WorkflowName */
 workflowName?: string;
 /** WorkflowVersion */
 workflowVersion?: number;
 /** ExecuteStatus */
 status: ExecutionStatus;
 
 // ===== TimeInfo =====
 
 /** StartTime (ISO 8601 Format) */
 startedAt: string;
 /** DoneTime (ISO 8601 Format) */
 completedAt?: string;
 /** totalExecuteDuration (s) */
 durationMs?: number;
 
 // ===== NodeSnapshot =====
 
 /** AllNode'sSnapshot, byNode ID Index */
 nodeSnapshots: Record<string, NodeSnapshot>;
 /** NodeExecuteOrder */
 executionOrder: string[];
 /** CurrentExecuteto'sNode ID */
 currentNodeId?: string;
 
 // ===== allVariable =====
 
 /** ExecuteInput */
 inputs: Record<string, unknown>;
 /** ExecuteOutput */
 outputs: Record<string, unknown>;
 /** allVariable */
 variables: Record<string, unknown>;
 
 // ===== ErrorInfo =====
 
 /** ExecuteError(ifresultFailed) */
 error?: {
 code?: string;
 message: string;
 nodeId?: string;
 stack?: string;
 };
 
 // ===== SummaryandData =====
 
 /** ExecuteSummary */
 summary: ExecutionSummary;
 /** SnapshotData */
 metadata: SnapshotMetadata;
}

// ===== TimelineRelatedType =====

/**
 * TimelineStep
 * Used foratTimeline UI DisplayExecuteStep
 */
export interface TimelineStep {
 /** StepIndex */
 index: number;
 /** Node ID */
 nodeId: string;
 /** NodeName */
 nodeName: string;
 /** NodeType */
 nodeType: string;
 /** NodeIcon */
 nodeIcon?: string;
 /** StepStatus */
 status: NodeStatus;
 /** StartTime */
 startedAt: string;
 /** DoneTime */
 completedAt?: string;
 /** Duration (s) */
 durationMs: number;
 /** needDescription */
 description?: string;
 /** isnoisCurrentselectStep */
 isSelected?: boolean;
 /** isnohasError */
 hasError?: boolean;
}

/**
 * TimelineViewData
 */
export interface TimelineView {
 /** Execute ID */
 executionId: string;
 /** ExecuteStatus */
 status: ExecutionStatus;
 /** StartTime */
 startedAt: string;
 /** DoneTime */
 completedAt?: string;
 /** totalDuration */
 durationMs?: number;
 /** TimelineStepList */
 steps: TimelineStep[];
 /** Currentselect'sStepIndex */
 selectedStepIndex?: number;
}

// ===== DebugActionRelatedType =====

/**
 * re-NodeRequest
 */
export interface RerunNodeRequest {
 /** Execute ID */
 executionId: string;
 /** needre-'sNode ID */
 nodeId: string;
 /** new'sInput(Optional, notProvidethenUsageInput) */
 newInputs?: Record<string, unknown>;
 /** isnoContinueExecuteafterNode */
 continueExecution?: boolean;
}

/**
 * re-NodeResult
 */
export interface RerunNodeResult {
 /** new'sExecute ID */
 newExecutionId: string;
 /** NodeSnapshot */
 nodeSnapshot: NodeSnapshot;
 /** isnoSuccess */
 success: boolean;
 /** ErrorMessage */
 error?: string;
}

/**
 * BreakpointInfo
 */
export interface Breakpoint {
 /** Breakpoint ID */
 id: string;
 /** Node ID */
 nodeId: string;
 /** isnoEnable */
 enabled: boolean;
 /** ConditionExpression(Optional) */
 condition?: string;
 /** Created At */
 createdAt: string;
}

/**
 * DebugwillStatus
 */
export interface DebugSession {
 /** will ID */
 sessionId: string;
 /** Associate'sExecute ID */
 executionId: string;
 /** isnoPause */
 isPaused: boolean;
 /** Pauseat'sNode ID */
 pausedAtNodeId?: string;
 /** BreakpointList */
 breakpoints: Breakpoint[];
 /** willStartTime */
 startedAt: string;
}

// ===== SnapshotStorageRelatedType =====

/**
 * SnapshotStorageOption
 */
export interface SnapshotStorageOptions {
 /** isnoCompress */
 compress?: boolean;
 /** CompressLevel (1-9) */
 compressionLevel?: number;
 /** MaximumRetainCount */
 maxSnapshots?: number;
 /** MaximumRetaindayscount */
 maxAgeDays?: number;
 /** ExcludeSensitiveData */
 excludeSensitiveData?: boolean;
 /** SensitiveFieldList */
 sensitiveFields?: string[];
}

/**
 * SnapshotQueryParameter
 */
export interface SnapshotQueryParams {
 /** Workflow ID */
 workflowId?: string;
 /** ExecuteStatus */
 status?: ExecutionStatus;
 /** StartDate */
 startDate?: string;
 /** EndDate */
 endDate?: string;
 /** Pagination - Page Number */
 page?: number;
 /** Pagination - eachpageCount */
 pageSize?: number;
 /** SortField */
 sortBy?: "startedAt" | "durationMs" | "status";
 /** Sortmethod */
 sortOrder?: "asc" | "desc";
}

/**
 * SnapshotList(notCompleteNodeData)
 */
export interface SnapshotListItem {
 /** Execute ID */
 executionId: string;
 /** Workflow ID */
 workflowId: string;
 /** WorkflowName */
 workflowName?: string;
 /** ExecuteStatus */
 status: ExecutionStatus;
 /** StartTime */
 startedAt: string;
 /** DoneTime */
 completedAt?: string;
 /** Duration */
 durationMs?: number;
 /** Summary */
 summary: ExecutionSummary;
}

// ===== ToolcountType =====

/**
 * fromExecuteResultCreateSnapshot'sOption
 */
export interface CreateSnapshotOptions {
 /** ContainsLogs */
 includeLogs?: boolean;
 /** ContainsDebugInfo */
 includeDebugInfo?: boolean;
 /** StorageOption */
 storage?: SnapshotStorageOptions;
}

// ===== ExportAggregateType =====

export type {
 NodeSnapshot as TimeTravelNodeSnapshot,
 ExecutionSnapshot as TimeTravelExecutionSnapshot,
};
