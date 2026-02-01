/**
 * 对话模板 API
 */

import { request, API_BASE_URL } from "./shared";
import type { AIParameters } from "@/types/conversation";

// 模板初始消息
export interface TemplateInitialMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// 对话模板
export interface ConversationTemplate extends AIParameters {
  id: string;
  userId: string;
  name: string;
  description: string;
  icon: string;
  model: string;
  systemPrompt?: string;
  initialMessages?: TemplateInitialMessage[];
  tags?: string[];
  isPublic: boolean;
  isSystem: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// 创建模板请求
export interface CreateTemplateRequest extends AIParameters {
  name: string;
  description?: string;
  icon?: string;
  model?: string;
  systemPrompt?: string;
  initialMessages?: TemplateInitialMessage[];
  tags?: string[];
  isPublic?: boolean;
}

// 更新模板请求
export interface UpdateTemplateRequest extends AIParameters {
  name?: string;
  description?: string;
  icon?: string;
  model?: string;
  systemPrompt?: string;
  initialMessages?: TemplateInitialMessage[];
  tags?: string[];
  isPublic?: boolean;
}

// 模板列表响应
export interface TemplateListResponse {
  templates: ConversationTemplate[];
  total: number;
  page: number;
  pageSize: number;
}

// 模板列表参数
export interface ListTemplatesParams {
  page?: number;
  pageSize?: number;
  includePublic?: boolean;
  includeSystem?: boolean;
  search?: string;
}

export const conversationTemplateApi = {
  /**
   * 获取模板列表
   */
  async list(params?: ListTemplatesParams): Promise<TemplateListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.pageSize) searchParams.set("page_size", params.pageSize.toString());
    if (params?.includePublic !== undefined) searchParams.set("include_public", params.includePublic.toString());
    if (params?.includeSystem !== undefined) searchParams.set("include_system", params.includeSystem.toString());
    if (params?.search) searchParams.set("search", params.search);

    const queryString = searchParams.toString();
    const url = `${API_BASE_URL}/conversation-templates${queryString ? `?${queryString}` : ""}`;
    
    return request<TemplateListResponse>(url);
  },

  /**
   * 获取模板详情
   */
  async get(id: string): Promise<ConversationTemplate> {
    const response = await request<{ template: ConversationTemplate }>(
      `${API_BASE_URL}/conversation-templates/${id}`
    );
    return response.template;
  },

  /**
   * 创建模板
   */
  async create(data: CreateTemplateRequest): Promise<ConversationTemplate> {
    const response = await request<{ success: boolean; template: ConversationTemplate }>(
      `${API_BASE_URL}/conversation-templates`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          icon: data.icon,
          model: data.model,
          system_prompt: data.systemPrompt,
          temperature: data.temperature,
          max_tokens: data.maxTokens,
          top_p: data.topP,
          top_k: data.topK,
          frequency_penalty: data.frequencyPenalty,
          presence_penalty: data.presencePenalty,
          initial_messages: data.initialMessages,
          tags: data.tags,
          is_public: data.isPublic,
        }),
      }
    );
    return response.template;
  },

  /**
   * 更新模板
   */
  async update(id: string, data: UpdateTemplateRequest): Promise<ConversationTemplate> {
    const response = await request<{ success: boolean; template: ConversationTemplate }>(
      `${API_BASE_URL}/conversation-templates/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          icon: data.icon,
          model: data.model,
          system_prompt: data.systemPrompt,
          temperature: data.temperature,
          max_tokens: data.maxTokens,
          top_p: data.topP,
          top_k: data.topK,
          frequency_penalty: data.frequencyPenalty,
          presence_penalty: data.presencePenalty,
          initial_messages: data.initialMessages,
          tags: data.tags,
          is_public: data.isPublic,
        }),
      }
    );
    return response.template;
  },

  /**
   * 删除模板
   */
  async delete(id: string): Promise<void> {
    await request<{ success: boolean }>(
      `${API_BASE_URL}/conversation-templates/${id}`,
      { method: "DELETE" }
    );
  },

  /**
   * 使用模板
   */
  async use(id: string): Promise<ConversationTemplate> {
    const response = await request<{ success: boolean; template: ConversationTemplate }>(
      `${API_BASE_URL}/conversation-templates/${id}/use`,
      { method: "POST" }
    );
    return response.template;
  },
};
