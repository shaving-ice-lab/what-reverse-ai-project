/**
 * CustomNode API Service
 */

import type {
 CustomNode,
 CustomNodeDetail,
 CustomNodeListParams,
 CustomNodeListResponse,
 CustomNodeDetailResponse,
 CustomNodeReview,
} from "@/types/custom-node";
import { request } from "./shared";

/**
 * CustomNode API
 */
export const customNodeApi = {
 /**
 * FetchNodeList
 */
 async list(params?: CustomNodeListParams): Promise<CustomNodeListResponse> {
 const searchParams = new URLSearchParams();
 
 if (params) {
 Object.entries(params).forEach(([key, value]) => {
 if (value !== undefined && value !== null) {
 searchParams.set(key, String(value));
 }
 });
 }
 
 const query = searchParams.toString();
 return request<CustomNodeListResponse>(`/nodes${query ? `?${query}` : ""}`);
 },

 /**
 * FetchPopularNode
 */
 async getPopular(): Promise<CustomNodeListResponse> {
 return request<CustomNodeListResponse>("/nodes/popular");
 },

 /**
 * FetchmostnewNode
 */
 async getNewest(): Promise<CustomNodeListResponse> {
 return request<CustomNodeListResponse>("/nodes/newest");
 },

 /**
 * FetchNodeDetails
 */
 async getBySlug(slug: string): Promise<CustomNodeDetailResponse> {
 return request<CustomNodeDetailResponse>(`/nodes/${slug}`);
 },

 /**
 * FetchNodeDetails(Via ID)
 */
 async getById(id: string): Promise<CustomNodeDetailResponse> {
 return request<CustomNodeDetailResponse>(`/nodes/id/${id}`);
 },

 /**
 * InstallNode
 */
 async install(id: string): Promise<{ success: boolean; data: { version: string } }> {
 return request(`/nodes/${id}/install`, {
 method: "POST",
 });
 },

 /**
 * UninstallNode
 */
 async uninstall(id: string): Promise<{ success: boolean }> {
 return request(`/nodes/${id}/uninstall`, {
 method: "POST",
 });
 },

 /**
 * UpdateNode
 */
 async update(id: string): Promise<{ success: boolean; data: { version: string } }> {
 return request(`/nodes/${id}/update`, {
 method: "POST",
 });
 },

 /**
 * Favorite/UnfavoriteNode
 */
 async star(id: string): Promise<{ success: boolean; data: { isStarred: boolean } }> {
 return request(`/nodes/${id}/star`, {
 method: "POST",
 });
 },

 /**
 * FetchNodeReviewsList
 */
 async getReviews(id: string, params?: { page?: number; pageSize?: number }): Promise<{
 success: boolean;
 data: CustomNodeReview[];
 meta: { total: number; page: number; pageSize: number };
 }> {
 const searchParams = new URLSearchParams();
 
 if (params?.page) searchParams.set("page", String(params.page));
 if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
 
 const query = searchParams.toString();
 return request(`/nodes/${id}/reviews${query ? `?${query}` : ""}`);
 },

 /**
 * FetchalreadyInstall'sNode
 */
 async getInstalled(): Promise<CustomNodeListResponse> {
 return request<CustomNodeListResponse>("/nodes/installed");
 },

 /**
 * FetchCategoryList
 */
 async getCategories(): Promise<{
 success: boolean;
 data: { categories: Array<{
 id: string;
 name: string;
 icon: string;
 count: number;
 }> };
 }> {
 return request("/nodes/categories");
 },

 /**
 * FetchFeaturedNode
 */
 async getFeatured(limit: number = 6): Promise<{
 success: boolean;
 data: { nodes: CustomNode[] };
 }> {
 return request(`/nodes/featured?limit=${limit}`);
 },

 /**
 * CreateNode
 */
 async create(data: {
 name: string;
 slug?: string;
 displayName: string;
 description: string;
 longDescription?: string;
 category: string;
 tags?: string[];
 repositoryUrl?: string;
 documentationUrl?: string;
 homepageUrl?: string;
 inputs?: Array<{
 name: string;
 type: string;
 description?: string;
 required?: boolean;
 }>;
 outputs?: Array<{
 name: string;
 type: string;
 description?: string;
 }>;
 version: string;
 changelog?: string;
 }): Promise<{ success: boolean; data: CustomNodeDetail }> {
 return request("/nodes", {
 method: "POST",
 body: JSON.stringify(data),
 });
 },

 /**
 * UpdateNode
 */
 async updateNode(id: string, data: Partial<{
 displayName: string;
 description: string;
 longDescription: string;
 category: string;
 tags: string[];
 repositoryUrl: string;
 documentationUrl: string;
 homepageUrl: string;
 }>): Promise<{ success: boolean; data: CustomNodeDetail }> {
 return request(`/nodes/${id}`, {
 method: "PATCH",
 body: JSON.stringify(data),
 });
 },

 /**
 * DeleteNode
 */
 async deleteNode(id: string): Promise<{ success: boolean }> {
 return request(`/nodes/${id}`, {
 method: "DELETE",
 });
 },

 /**
 * SaveDraft
 */
 async saveDraft(id: string, data: any): Promise<{ success: boolean; data: CustomNodeDetail }> {
 return request(`/nodes/${id}/draft`, {
 method: "PUT",
 body: JSON.stringify(data),
 });
 },

 /**
 * SubmitReview
 */
 async submit(id: string): Promise<{ success: boolean; data: CustomNodeDetail }> {
 return request(`/nodes/${id}/submit`, {
 method: "POST",
 });
 },

 /**
 * CreatenewVersion
 */
 async createVersion(nodeId: string, data: {
 version: string;
 changelog: string;
 packageUrl?: string;
 inputs?: Array<{
 name: string;
 type: string;
 description?: string;
 required?: boolean;
 }>;
 outputs?: Array<{
 name: string;
 type: string;
 description?: string;
 }>;
 }): Promise<{ success: boolean; data: { version: string } }> {
 return request(`/nodes/${nodeId}/versions`, {
 method: "POST",
 body: JSON.stringify(data),
 });
 },

 /**
 * SubmitReviews
 */
 async createReview(nodeId: string, data: {
 rating: number;
 title?: string;
 content: string;
 }): Promise<{ success: boolean; data: CustomNodeReview }> {
 return request(`/nodes/${nodeId}/reviews`, {
 method: "POST",
 body: JSON.stringify(data),
 });
 },

 /**
 * FetchUseralreadyInstall'sNode
 */
 async getMyInstalled(): Promise<CustomNodeListResponse> {
 return request("/nodes/my/installed");
 },

 /**
 * FetchUserCreate'sNode
 */
 async getMyNodes(): Promise<CustomNodeListResponse> {
 return request("/nodes/my/created");
 },

 /**
 * FetchUserFavorite'sNode
 */
 async getMyStarred(): Promise<CustomNodeListResponse> {
 return request("/nodes/my/starred");
 },
};

// NodeCategoryInterface
export interface NodeCategory {
 id: string;
 name: string;
 icon: string;
 count: number;
}
