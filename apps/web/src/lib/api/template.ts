/**
 * 模板 API 服务
 */

import { request } from "./shared";

export interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  long_description?: string;
  category: string;
  tags: string[];
  icon: string;
  cover_image?: string;
  screenshots?: string[];
  definition: Record<string, unknown>;
  variables: Record<string, unknown>;
  input_schema?: Record<string, unknown>;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimated_time: number;
  node_count: number;
  is_featured: boolean;
  is_official: boolean;
  use_count: number;
  view_count: number;
  like_count: number;
  author?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}

export interface TemplateListParams {
  category?: string;
  search?: string;
  difficulty?: string;
  featured?: boolean;
  official?: boolean;
  page?: number;
  page_size?: number;
  sort?: string;
}

export interface TemplateListResponse {
  success: boolean;
  data: {
    templates: Template[];
  };
  meta: {
    total: number;
    page: number;
    page_size: number;
  };
}

export interface TemplateCategoriesResponse {
  success: boolean;
  data: {
    categories: TemplateCategory[];
  };
}

export interface TemplateResponse {
  success: boolean;
  data: {
    template: Template;
  };
}

export interface UseTemplateResponse {
  success: boolean;
  data: {
    workflow: Record<string, unknown>;
    message: string;
  };
}

export const templateApiNew = {
  /**
   * 获取模板列表
   */
  async list(params?: TemplateListParams): Promise<TemplateListResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return request<TemplateListResponse>(`/templates${query ? `?${query}` : ""}`);
  },

  /**
   * 获取精选模板
   */
  async getFeatured(limit?: number): Promise<TemplateListResponse> {
    const searchParams = new URLSearchParams();
    if (limit) searchParams.set("limit", String(limit));
    const query = searchParams.toString();
    return request<TemplateListResponse>(`/templates/featured${query ? `?${query}` : ""}`);
  },

  /**
   * 获取模板分类
   */
  async getCategories(): Promise<TemplateCategoriesResponse> {
    return request<TemplateCategoriesResponse>("/templates/categories");
  },

  /**
   * 获取模板详情
   */
  async get(id: string): Promise<TemplateResponse> {
    return request<TemplateResponse>(`/templates/${id}`);
  },

  /**
   * 使用模板创建工作流
   */
  async use(id: string, data?: { name?: string; folder_id?: string }): Promise<UseTemplateResponse> {
    return request<UseTemplateResponse>(`/templates/${id}/use`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    });
  },
};
