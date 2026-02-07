/**
 * Workflow API Service
 */

import type {
 Workflow,
 WorkflowMeta,
 CreateWorkflowRequest,
 CreateWorkflowResponse,
 UpdateWorkflowRequest,
 ListWorkflowsRequest,
 ListWorkflowsResponse,
 GetWorkflowResponse,
 WorkflowFolder,
 ListFoldersResponse,
 DuplicateWorkflowRequest,
 ExportWorkflowResponse,
 ImportWorkflowRequest,
 WorkflowExecution,
 ListExecutionsResponse,
 WorkflowTemplate,
 ListTemplatesResponse,
} from "@/types/workflow-api";

// API Basic URL from shared.ts Import
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

// afterendpointBack'sWorkflowDataStructure(snake_case)
interface BackendWorkflow {
 id: string;
 user_id: string;
 name: string;
 description?: string;
 icon?: string;
 definition?: Record<string, unknown>;
 variables?: Record<string, unknown>;
 status: string;
 is_public: boolean;
 trigger_type: string;
 trigger_config?: Record<string, unknown>;
 run_count: number;
 star_count: number;
 fork_count: number;
 version: number;
 created_at: string;
 updated_at: string;
 published_at?: string | null;
 folder_id?: string | null;
}

// ConvertafterendpointWorkflowDataasbeforeendpointFormat
function transformWorkflow(backend: BackendWorkflow): WorkflowMeta {
 return {
 id: backend.id,
 name: backend.name,
 description: backend.description,
 icon: backend.icon,
 status: backend.status as WorkflowMeta["status"],
 visibility: backend.is_public ? "public" : "private",
 version: backend.version,
 tags: [],
 folderId: backend.folder_id || undefined,
 runCount: backend.run_count || 0,
 successCount: 0,
 failCount: 0,
 createdAt: backend.created_at,
 updatedAt: backend.updated_at,
 createdBy: {
 id: backend.user_id,
 username: "User",
 },
 };
}

import { request, getStoredTokens, API_BASE_URL } from "./shared";

/**
 * Workflow API
 */
export const workflowApi = {
 /**
 * FetchWorkflowList
 */
 async list(params?: ListWorkflowsRequest): Promise<ListWorkflowsResponse> {
 const searchParams = new URLSearchParams();
 
 if (params) {
 Object.entries(params).forEach(([key, value]) => {
 if (value !== undefined) {
 if (Array.isArray(value)) {
 value.forEach((v) => searchParams.append(key, v));
 } else {
 searchParams.set(key, String(value));
 }
 }
 });
 }
 
 const query = searchParams.toString();
 const response = await request<{
 success: boolean;
 data: BackendWorkflow[];
 meta: { total: number; page: number; page_size: number };
 }>(`/workflows${query ? `?${query}` : ""}`);
 
 // ConvertafterendpointDataasbeforeendpointFormat
 return {
 success: response.success,
 data: (response.data || []).map(transformWorkflow),
 meta: {
 total: response.meta?.total || 0,
 page: response.meta?.page || 1,
 pageSize: response.meta?.page_size || 20,
 totalPages: Math.ceil((response.meta?.total || 0) / (response.meta?.page_size || 20)),
 },
 };
 },

 /**
 * FetchWorkflowDetails
 */
 async get(id: string): Promise<GetWorkflowResponse> {
 const response = await request<{
 success: boolean;
 data: BackendWorkflow & { 
 nodes?: unknown[];
 edges?: unknown[];
 };
 }>(`/workflows/${id}`);
 
 const meta = transformWorkflow(response.data);
 return {
 success: response.success,
 workflow: {
 ...meta,
 nodes: response.data.definition?.nodes as unknown[] || [],
 edges: response.data.definition?.edges as unknown[] || [],
 variables: response.data.variables,
 } as Workflow,
 };
 },

 /**
 * CreateWorkflow
 */
 async create(data: CreateWorkflowRequest): Promise<CreateWorkflowResponse> {
 return request<CreateWorkflowResponse>("/workflows", {
 method: "POST",
 body: JSON.stringify(data),
 });
 },

 /**
 * UpdateWorkflow
 */
 async update(id: string, data: UpdateWorkflowRequest): Promise<GetWorkflowResponse> {
 return request<GetWorkflowResponse>(`/workflows/${id}`, {
 method: "PATCH",
 body: JSON.stringify(data),
 });
 },

 /**
 * DeleteWorkflow
 */
 async delete(id: string): Promise<{ success: boolean }> {
 return request<{ success: boolean }>(`/workflows/${id}`, {
 method: "DELETE",
 });
 },

 /**
 * CopyWorkflow
 */
 async duplicate(id: string, data?: DuplicateWorkflowRequest): Promise<CreateWorkflowResponse> {
 return request<CreateWorkflowResponse>(`/workflows/${id}/duplicate`, {
 method: "POST",
 body: JSON.stringify(data || {}),
 });
 },

 /**
 * ExportWorkflow
 */
 async export(id: string): Promise<ExportWorkflowResponse> {
 return request<ExportWorkflowResponse>(`/workflows/${id}/export`);
 },

 /**
 * ImportWorkflow
 */
 async import(data: ImportWorkflowRequest): Promise<CreateWorkflowResponse> {
 return request<CreateWorkflowResponse>("/workflows/import", {
 method: "POST",
 body: JSON.stringify(data),
 });
 },

 /**
 * PublishWorkflow
 */
 async publish(id: string): Promise<GetWorkflowResponse> {
 return request<GetWorkflowResponse>(`/workflows/${id}/publish`, {
 method: "POST",
 });
 },

 /**
 * ArchiveWorkflow
 */
 async archive(id: string): Promise<GetWorkflowResponse> {
 return request<GetWorkflowResponse>(`/workflows/${id}/archive`, {
 method: "POST",
 });
 },

 /**
 * ExecuteWorkflow
 */
 async execute(id: string, inputs?: Record<string, unknown>): Promise<{ executionId: string }> {
 return request<{ executionId: string }>(`/workflows/${id}/execute`, {
 method: "POST",
 body: JSON.stringify({ inputs }),
 });
 },
};

/**
 * WorkflowFolder API
 */
export const folderApi = {
 /**
 * FetchFolderList
 */
 async list(): Promise<ListFoldersResponse> {
 return request<ListFoldersResponse>("/workflows/folders");
 },

 /**
 * CreateFolder
 */
 async create(data: { name: string; parentId?: string; color?: string }): Promise<{ folder: WorkflowFolder }> {
 return request<{ folder: WorkflowFolder }>("/workflows/folders", {
 method: "POST",
 body: JSON.stringify(data),
 });
 },

 /**
 * UpdateFolder
 */
 async update(id: string, data: { name?: string; color?: string }): Promise<{ folder: WorkflowFolder }> {
 return request<{ folder: WorkflowFolder }>(`/workflows/folders/${id}`, {
 method: "PATCH",
 body: JSON.stringify(data),
 });
 },

 /**
 * DeleteFolder
 */
 async delete(id: string): Promise<{ success: boolean }> {
 return request<{ success: boolean }>(`/workflows/folders/${id}`, {
 method: "DELETE",
 });
 },
};

/**
 * ExecuteRecord API
 */
export const executionApi = {
 /**
 * FetchExecuteRecordList
 */
 async list(workflowId: string, params?: { page?: number; pageSize?: number }): Promise<ListExecutionsResponse> {
 const searchParams = new URLSearchParams();
 
 if (params?.page) searchParams.set("page", String(params.page));
 if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
 
 const query = searchParams.toString();
 return request<ListExecutionsResponse>(`/workflows/${workflowId}/executions${query ? `?${query}` : ""}`);
 },

 /**
 * FetchExecuteDetails
 */
 async get(executionId: string): Promise<{ execution: WorkflowExecution }> {
 return request<{ execution: WorkflowExecution }>(`/executions/${executionId}`);
 },

 /**
 * CancelExecute
 */
 async cancel(executionId: string): Promise<{ success: boolean; message: string }> {
 return request<{ success: boolean; message: string }>(`/executions/${executionId}/cancel`, {
 method: "POST",
 });
 },

 /**
 * RetryExecute
 */
 async retry(executionId: string): Promise<{ success: boolean; data: { execution: WorkflowExecution } }> {
 return request<{ success: boolean; data: { execution: WorkflowExecution } }>(`/executions/${executionId}/retry`, {
 method: "POST",
 });
 },
};

/**
 * Template API
 */
export const templateApi = {
 /**
 * FetchTemplateList
 */
 async list(params?: { 
 category?: string;
 search?: string;
 page?: number;
 pageSize?: number;
 }): Promise<ListTemplatesResponse> {
 const searchParams = new URLSearchParams();
 
 if (params) {
 Object.entries(params).forEach(([key, value]) => {
 if (value !== undefined) {
 searchParams.set(key, String(value));
 }
 });
 }
 
 const query = searchParams.toString();
 return request<ListTemplatesResponse>(`/templates${query ? `?${query}` : ""}`);
 },

 /**
 * FetchTemplateDetails
 */
 async get(id: string): Promise<{ template: WorkflowTemplate }> {
 return request<{ template: WorkflowTemplate }>(`/templates/${id}`);
 },

 /**
 * fromTemplateCreateWorkflow
 */
 async useTemplate(id: string, data?: { name?: string; folderId?: string }): Promise<CreateWorkflowResponse> {
 return request<CreateWorkflowResponse>(`/templates/${id}/use`, {
 method: "POST",
 body: JSON.stringify(data || {}),
 });
 },
};
