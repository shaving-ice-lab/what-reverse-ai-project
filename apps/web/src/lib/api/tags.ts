/**
 * Tags API Service
 */

import type { Tag, TagWithCount } from "@/types/tag";
import { request } from "./shared";

/**
 * TagsListResponse
 */
export interface TagListResponse {
 success: boolean;
 data: TagWithCount[];
}

/**
 * TagsResponse
 */
export interface TagResponse {
 success: boolean;
 data: Tag;
}

/**
 * Tags API
 */
export const tagApi = {
 /**
 * FetchUserTagsList
 * @returns TagsList(UsageCount)
 */
 async list(): Promise<TagListResponse> {
 return request<TagListResponse>("/tags");
 },

 /**
 * CreateTags
 * @param name TagsName
 * @param color TagsColor
 * @returns Create'sTags
 */
 async create(name: string, color?: string): Promise<TagResponse> {
 return request<TagResponse>("/tags", {
 method: "POST",
 body: JSON.stringify({ name, color }),
 });
 },

 /**
 * UpdateTags
 * @param id Tags ID
 * @param name TagsName
 * @param color TagsColor
 * @returns Updateafter'sTags
 */
 async update(id: string, name: string, color?: string): Promise<TagResponse> {
 return request<TagResponse>(`/tags/${id}`, {
 method: "PUT",
 body: JSON.stringify({ name, color }),
 });
 },

 /**
 * DeleteTags
 * @param id Tags ID
 */
 async delete(id: string): Promise<{ success: boolean }> {
 return request<{ success: boolean }>(`/tags/${id}`, {
 method: "DELETE",
 });
 },

 /**
 * AddTagstoWorkflow
 * @param workflowId Workflow ID
 * @param tagId Tags ID
 */
 async addToWorkflow(workflowId: string, tagId: string): Promise<{ success: boolean }> {
 return request<{ success: boolean }>(`/workflows/${workflowId}/tags/${tagId}`, {
 method: "POST",
 });
 },

 /**
 * fromWorkflowRemoveTags
 * @param workflowId Workflow ID
 * @param tagId Tags ID
 */
 async removeFromWorkflow(workflowId: string, tagId: string): Promise<{ success: boolean }> {
 return request<{ success: boolean }>(`/workflows/${workflowId}/tags/${tagId}`, {
 method: "DELETE",
 });
 },
};
