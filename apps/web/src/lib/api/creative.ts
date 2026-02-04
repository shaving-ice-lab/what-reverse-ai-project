/**
 * AI 创意助手 API 客户端
 * 
 * 提供模板、生成任务、文档管理的 API 调用
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

// ===== 模板 API =====

/**
 * 获取模板列表参数
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
 * 模板列表响应
 */
export interface TemplatesResponse {
  items: CreativeTemplate[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 获取模板列表
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
 * 获取单个模板详情
 */
export async function getTemplate(id: string): Promise<CreativeTemplate> {
  return api.get<CreativeTemplate>(`/creative/templates/${id}`);
}

/**
 * 获取模板分类列表
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
 * 获取推荐模板
 */
export async function getFeaturedTemplates(limit = 6): Promise<CreativeTemplate[]> {
  const response = await getTemplates({ featured: true, pageSize: limit });
  return response.items;
}

// ===== 生成任务 API =====

/**
 * 创建生成任务
 */
export async function createTask(data: CreateTaskRequest): Promise<CreateTaskResponse> {
  return api.post<CreateTaskResponse>("/creative/generate", data);
}

/**
 * 获取任务状态
 */
export async function getTaskStatus(taskId: string): Promise<CreativeTask> {
  return api.get<CreativeTask>(`/creative/generate/${taskId}`);
}

/**
 * 获取任务列表
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
 * 取消生成任务
 */
export async function cancelTask(taskId: string): Promise<void> {
  return api.post(`/creative/generate/${taskId}/cancel`, {});
}

/**
 * 创建 SSE 连接获取实时更新
 */
export function subscribeToTask(taskId: string): EventSource {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/creative/generate/${taskId}/stream`;
  return new EventSource(url, { withCredentials: true });
}

// ===== 文档 API =====

/**
 * 获取文档列表参数
 */
export interface GetDocumentsParams {
  search?: string;
  templateId?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 文档列表响应
 */
export interface DocumentsResponse {
  items: CreativeDocument[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 获取文档列表
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
 * 获取单个文档
 */
export async function getDocument(id: string): Promise<CreativeDocument> {
  return api.get<CreativeDocument>(`/creative/documents/${id}`);
}

/**
 * 更新文档
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
 * 删除文档
 */
export async function deleteDocument(id: string): Promise<void> {
  return api.delete(`/creative/documents/${id}`);
}

/**
 * 导出文档
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
    throw new Error("导出失败");
  }
  
  return response.blob();
}

/**
 * 重新生成章节
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
 * 获取章节版本历史
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

// ===== 分享 API =====

/**
 * 创建分享链接
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
 * 删除分享
 */
export async function deleteShare(documentId: string): Promise<void> {
  return api.delete(`/creative/documents/${documentId}/share`);
}

/**
 * 通过分享链接获取文档 (公开访问)
 */
export async function getSharedDocument(shareId: string, password?: string): Promise<CreativeDocument> {
  const searchParams = new URLSearchParams();
  if (password) searchParams.set("password", password);
  
  const query = searchParams.toString();
  return api.get<CreativeDocument>(
    `/creative/share/${shareId}${query ? `?${query}` : ""}`
  );
}
