/**
 * TypeDefinitionExportEntry
 */

export * from "./workflow";
export * from "./user";
export * from "./agent";
export * from "./stats";
export * from "./system";
export * from "./activity";
export * from "./device";
export * from "./tag";
export * from "./creative";
export * from "./time-travel";
export * from "./conversation";

// ===== useType =====

export interface PagedResult<T> {
 items: T[];
 total: number;
 page: number;
 pageSize: number;
 totalPages: number;
}

export interface ListParams {
 page?: number;
 pageSize?: number;
 search?: string;
 sort?: string;
 order?: "asc" | "desc";
}

// ===== API Response =====

export interface ApiResponse<T = unknown> {
 code: string;
 message: string;
 data?: T;
 meta?: {
 total?: number;
 page?: number;
 page_size?: number;
 };
 trace_id?: string;
 request_id?: string;
 error_code?: string;
 error_message?: string;
 details?: unknown;
}

export interface ApiError {
 code: string;
 message: string;
 details?: unknown;
 trace_id?: string;
 request_id?: string;
}

// ===== WebSocket Message =====

export interface WebSocketMessage<T = unknown> {
 type: string;
 payload: T;
 timestamp: string;
}

export type ExecutionEventType =
 | "execution.started"
 | "execution.completed"
 | "execution.failed"
 | "execution.node.started"
 | "execution.node.completed"
 | "execution.node.failed"
 | "execution.log";

export interface ExecutionEvent {
 executionId: string;
 nodeId?: string;
 status?: string;
 outputs?: Record<string, unknown>;
 error?: {
 message: string;
 stack?: string;
 };
 log?: {
 level: "info" | "warn" | "error" | "debug";
 message: string;
 data?: unknown;
 };
}
