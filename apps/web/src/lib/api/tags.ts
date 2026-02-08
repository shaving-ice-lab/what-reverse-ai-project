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
  * Fetch User Tags List
  * @returns Tags List (with Usage Count)
  */
 async list(): Promise<TagListResponse> {
 return request<TagListResponse>("/tags");
 },

 /**
  * Create Tag
  * @param name Tag Name
  * @param color Tag Color
  * @returns Created Tag
  */
 async create(name: string, color?: string): Promise<TagResponse> {
 return request<TagResponse>("/tags", {
 method: "POST",
 body: JSON.stringify({ name, color }),
 });
 },

 /**
  * Update Tag
  * @param id Tag ID
  * @param name Tag Name
  * @param color Tag Color
  * @returns Updated Tag
  */
 async update(id: string, name: string, color?: string): Promise<TagResponse> {
 return request<TagResponse>(`/tags/${id}`, {
 method: "PUT",
 body: JSON.stringify({ name, color }),
 });
 },

 /**
  * Delete Tag
  * @param id Tag ID
  */
 async delete(id: string): Promise<{ success: boolean }> {
 return request<{ success: boolean }>(`/tags/${id}`, {
 method: "DELETE",
 });
 },

 /**
  * Add Tag to Workflow
  * @param workflowId Workflow ID
  * @param tagId Tag ID
  */
 async addToWorkflow(workflowId: string, tagId: string): Promise<{ success: boolean }> {
 return request<{ success: boolean }>(`/workflows/${workflowId}/tags/${tagId}`, {
 method: "POST",
 });
 },

 /**
  * Remove Tag from Workflow
  * @param workflowId Workflow ID
  * @param tagId Tag ID
  */
 async removeFromWorkflow(workflowId: string, tagId: string): Promise<{ success: boolean }> {
 return request<{ success: boolean }>(`/workflows/${workflowId}/tags/${tagId}`, {
 method: "DELETE",
 });
 },
};
