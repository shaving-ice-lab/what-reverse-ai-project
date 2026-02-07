/**
 * AI CreativeAssistant API Customerendpoint
 * 
 * ProvideTemplate, GenerateTask, DocumentManage's API Call
 */

import { api } from "./index";
import { getApiBaseUrl } from "@/lib/env";
import type {
 CreativeTemplate,
 CreativeTemplateCategory,
 CreativeTask,
 CreativeDocument,
 CreateTaskRequest,
 CreateTaskResponse,
 ExportFormat,
 CreateShareRequest,
 CreateShareResponse,
} from "@/types/creative";

// ===== Template API =====

/**
 * FetchTemplateListParameter
 */
export interface GetTemplatesParams {
 category?: CreativeTemplateCategory;
 search?: string;
 featured?: boolean;
 official?: boolean;
 page?: number;
 pageSize?: number;
}

/**
 * TemplateListResponse
 */
export interface TemplatesResponse {
 items: CreativeTemplate[];
 total: number;
 page: number;
 pageSize: number;
}

/**
 * FetchTemplateList
 */
export async function getTemplates(params?: GetTemplatesParams): Promise<TemplatesResponse> {
 const searchParams = new URLSearchParams();
 if (params?.category) searchParams.set("category", params.category);
 if (params?.search) searchParams.set("search", params.search);
 if (params?.featured !== undefined) searchParams.set("featured", String(params.featured));
 if (params?.official !== undefined) searchParams.set("official", String(params.official));
 if (params?.page) searchParams.set("page", String(params.page));
 if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));

 const query = searchParams.toString();
 const url = `/creative/templates${query ? `?${query}` : ""}`;
 
 return api.get<TemplatesResponse>(url);
}

/**
 * FetchTemplateDetails
 */
export async function getTemplate(id: string): Promise<CreativeTemplate> {
 return api.get<CreativeTemplate>(`/creative/templates/${id}`);
}

/**
 * FetchTemplateCategoryList
 */
export interface TemplateCategoryInfo {
 id: CreativeTemplateCategory;
 name: string;
 description: string;
 icon: string;
 count: number;
}

export async function getTemplateCategories(): Promise<TemplateCategoryInfo[]> {
 return api.get<TemplateCategoryInfo[]>("/creative/templates/categories");
}

/**
 * FetchRecommendedTemplate
 */
export async function getFeaturedTemplates(limit = 6): Promise<CreativeTemplate[]> {
 const response = await getTemplates({ featured: true, pageSize: limit });
 return response.items;
}

// ===== GenerateTask API =====

/**
 * CreateGenerateTask
 */
export async function createTask(data: CreateTaskRequest): Promise<CreateTaskResponse> {
 return api.post<CreateTaskResponse>("/creative/generate", data);
}

/**
 * FetchTaskStatus
 */
export async function getTaskStatus(taskId: string): Promise<CreativeTask> {
 return api.get<CreativeTask>(`/creative/generate/${taskId}`);
}

/**
 * FetchTaskList
 */
export interface GetTasksParams {
 status?: string;
 page?: number;
 pageSize?: number;
}

export interface TasksResponse {
 items: CreativeTask[];
 total: number;
 page: number;
 pageSize: number;
}

export async function getTasks(params?: GetTasksParams): Promise<TasksResponse> {
 const searchParams = new URLSearchParams();
 if (params?.status) searchParams.set("status", params.status);
 if (params?.page) searchParams.set("page", String(params.page));
 if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));

 const query = searchParams.toString();
 return api.get<TasksResponse>(`/creative/generate${query ? `?${query}` : ""}`);
}

/**
 * CancelGenerateTask
 */
export async function cancelTask(taskId: string): Promise<void> {
 return api.post(`/creative/generate/${taskId}/cancel`, {});
}

/**
 * Create SSE ConnectFetchReal-timeUpdate
 */
export function subscribeToTask(taskId: string): EventSource {
 const baseUrl = getApiBaseUrl();
 const url = `${baseUrl}/creative/generate/${taskId}/stream`;
 return new EventSource(url, { withCredentials: true });
}

// ===== Document API =====

/**
 * FetchDocumentListParameter
 */
export interface GetDocumentsParams {
 search?: string;
 templateId?: string;
 page?: number;
 pageSize?: number;
}

/**
 * DocumentListResponse
 */
export interface DocumentsResponse {
 items: CreativeDocument[];
 total: number;
 page: number;
 pageSize: number;
}

/**
 * FetchDocumentList
 */
export async function getDocuments(params?: GetDocumentsParams): Promise<DocumentsResponse> {
 const searchParams = new URLSearchParams();
 if (params?.search) searchParams.set("search", params.search);
 if (params?.templateId) searchParams.set("templateId", params.templateId);
 if (params?.page) searchParams.set("page", String(params.page));
 if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));

 const query = searchParams.toString();
 return api.get<DocumentsResponse>(`/creative/documents${query ? `?${query}` : ""}`);
}

/**
 * FetchDocument
 */
export async function getDocument(id: string): Promise<CreativeDocument> {
 return api.get<CreativeDocument>(`/creative/documents/${id}`);
}

/**
 * UpdateDocument
 */
export interface UpdateDocumentData {
 title?: string;
 content?: string;
 tags?: string[];
}

export async function updateDocument(id: string, data: UpdateDocumentData): Promise<CreativeDocument> {
 return api.patch<CreativeDocument>(`/creative/documents/${id}`, data);
}

/**
 * DeleteDocument
 */
export async function deleteDocument(id: string): Promise<void> {
 return api.delete(`/creative/documents/${id}`);
}

/**
 * ExportDocument
 */
export async function exportDocument(id: string, format: ExportFormat): Promise<Blob> {
 const baseUrl = getApiBaseUrl();
 const response = await fetch(
 `${baseUrl}/creative/documents/${id}/export?format=${format}`,
 {
 method: "GET",
 credentials: "include",
 }
 );
 
 if (!response.ok) {
 throw new Error("ExportFailed");
 }
 
 return response.blob();
}

/**
 * re-newGenerateChapter
 */
export interface RegenerateSectionRequest {
 sectionId: string;
 instruction?: string;
}

export interface RegenerateSectionResponse {
 sectionId: string;
 title: string;
 content: string;
 previousVersion: number;
 currentVersion: number;
 tokenUsed: number;
}

export async function regenerateSection(
 documentId: string,
 data: RegenerateSectionRequest
): Promise<RegenerateSectionResponse> {
 return api.post<RegenerateSectionResponse>(
 `/creative/documents/${documentId}/regenerate`,
 data
 );
}

/**
 * FetchChapterVersion History
 */
export interface SectionVersion {
 id: string;
 sectionId: string;
 version: number;
 title: string;
 content: string;
 instruction?: string;
 createdAt: string;
}

export async function getSectionVersions(
 documentId: string,
 sectionId: string
): Promise<SectionVersion[]> {
 return api.get<SectionVersion[]>(
 `/creative/documents/${documentId}/sections/${sectionId}/versions`
 );
}

// ===== Share API =====

/**
 * CreateShareLink
 */
export async function createShare(data: CreateShareRequest): Promise<CreateShareResponse> {
 return api.post<CreateShareResponse>(
 `/creative/documents/${data.documentId}/share`,
 {
 password: data.password,
 expiresInDays: data.expiresInDays,
 allowDownload: data.allowDownload,
 }
 );
}

/**
 * DeleteShare
 */
export async function deleteShare(documentId: string): Promise<void> {
 return api.delete(`/creative/documents/${documentId}/share`);
}

/**
 * ViaShareLinkFetchDocument (PublicAccess)
 */
export async function getSharedDocument(shareId: string, password?: string): Promise<CreativeDocument> {
 const searchParams = new URLSearchParams();
 if (password) searchParams.set("password", password);
 
 const query = searchParams.toString();
 return api.get<CreativeDocument>(
 `/creative/share/${shareId}${query ? `?${query}` : ""}`
 );
}
