/**
 * Workflow API TypeDefinition
 */

import type { WorkflowNode, WorkflowEdge, WorkflowStatus } from "./workflow";

export type { WorkflowStatus };

// Workflowcan
export type WorkflowVisibility = "private" | "public" | "team";

// WorkflowData
export interface WorkflowMeta {
 id: string;
 name: string;
 description?: string;
 icon?: string;
 color?: string;
 status: WorkflowStatus;
 visibility: WorkflowVisibility;
 version: number;
 tags: string[];
 folderId?: string;
 
 // StatisticsInfo
 runCount: number;
 successCount: number;
 failCount: number;
 avgDuration?: number;
 lastRunAt?: string;
 
 // Time
 createdAt: string;
 updatedAt: string;
 
 // CreateuserInfo
 createdBy: {
 id: string;
 username: string;
 avatar?: string;
 };
}

// CompleteWorkflowDefinition
export interface Workflow extends WorkflowMeta {
 nodes: WorkflowNode[];
 edges: WorkflowEdge[];
 variables?: Record<string, unknown>;
 settings?: WorkflowSettings;
}

// WorkflowSettings
export interface WorkflowSettings {
 // ExecuteSettings
 timeout?: number;
 retryCount?: number;
 retryDelay?: number;
 maxConcurrency?: number;
 
 // TriggerSettings
 triggers?: WorkflowTrigger[];
 
 // Notification Settings
 notifications?: {
 onSuccess?: boolean;
 onFailure?: boolean;
 channels?: string[];
 };
}

// WorkflowTrigger
export interface WorkflowTrigger {
 id: string;
 type: "manual" | "schedule" | "webhook" | "event";
 enabled: boolean;
 config: Record<string, unknown>;
}

// CreateWorkflowRequest
export interface CreateWorkflowRequest {
 name: string;
 description?: string;
 icon?: string;
 color?: string;
 folderId?: string;
 tags?: string[];
 templateId?: string; // fromTemplateCreate
}

// CreateWorkflowResponse
export interface CreateWorkflowResponse {
 success: boolean;
 workflow: WorkflowMeta;
}

// UpdateWorkflowRequest
export interface UpdateWorkflowRequest {
 name?: string;
 description?: string;
 icon?: string;
 color?: string;
 status?: WorkflowStatus;
 visibility?: WorkflowVisibility;
 folderId?: string;
 tags?: string[];
 nodes?: WorkflowNode[];
 edges?: WorkflowEdge[];
 variables?: Record<string, unknown>;
 settings?: WorkflowSettings;
}

// WorkflowListRequest
export interface ListWorkflowsRequest {
 page?: number;
 pageSize?: number;
 status?: WorkflowStatus;
 visibility?: WorkflowVisibility;
 folderId?: string;
 search?: string;
 tags?: string[];
 sortBy?: "name" | "createdAt" | "updatedAt" | "runCount";
 sortOrder?: "asc" | "desc";
}

// WorkflowListResponse
export interface ListWorkflowsResponse {
 success: boolean;
 data: WorkflowMeta[];
 meta: {
 total: number;
 page: number;
 pageSize: number;
 totalPages: number;
 };
}

// WorkflowDetailsResponse
export interface GetWorkflowResponse {
 success: boolean;
 workflow: Workflow;
}

// WorkflowFolder
export interface WorkflowFolder {
 id: string;
 name: string;
 parentId?: string;
 color?: string;
 workflowCount: number;
 createdAt: string;
 updatedAt: string;
}

// FolderListResponse
export interface ListFoldersResponse {
 success: boolean;
 folders: WorkflowFolder[];
}

// CopyWorkflowRequest
export interface DuplicateWorkflowRequest {
 name?: string;
 folderId?: string;
}

// ExportWorkflowResponse
export interface ExportWorkflowResponse {
 success: boolean;
 data: string; // JSON string
 filename: string;
}

// ImportWorkflowRequest
export interface ImportWorkflowRequest {
 data: string; // JSON string
 name?: string;
 folderId?: string;
}

// WorkflowExecuteRecord
export interface WorkflowExecution {
 id: string;
 workflowId: string;
 workflowVersion: number;
 status: "pending" | "running" | "completed" | "failed" | "cancelled";
 startTime: string;
 endTime?: string;
 duration?: number;
 trigger: {
 type: string;
 data?: Record<string, unknown>;
 };
 inputs?: Record<string, unknown>;
 outputs?: Record<string, unknown>;
 error?: {
 code: string;
 message: string;
 nodeId?: string;
 };
 nodeResults?: Record<string, {
 status: string;
 duration?: number;
 outputs?: Record<string, unknown>;
 }>;
}

// ExecuteRecordListResponse
export interface ListExecutionsResponse {
 success: boolean;
 data: WorkflowExecution[];
 meta: {
 total: number;
 page: number;
 pageSize: number;
 };
}

// WorkflowTemplate
export interface WorkflowTemplate {
 id: string;
 name: string;
 description: string;
 category: string;
 tags: string[];
 thumbnail?: string;
 workflow: Omit<Workflow, "id" | "createdAt" | "updatedAt" | "createdBy">;
 useCount: number;
 rating: number;
 createdBy: {
 id: string;
 username: string;
 avatar?: string;
 };
}

// TemplateListResponse
export interface ListTemplatesResponse {
 success: boolean;
 data: WorkflowTemplate[];
 meta: {
 total: number;
 page: number;
 pageSize: number;
 };
}
