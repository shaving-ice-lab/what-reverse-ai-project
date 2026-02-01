/**
 * 工作流 API 服务
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

// API 基础 URL 从 shared.ts 导入
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

// 后端返回的工作流数据结构（snake_case）
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

// 转换后端工作流数据为前端格式
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
      username: "用户",
    },
  };
}

import { request, getStoredTokens, API_BASE_URL } from "./shared";

/**
 * 工作流 API
 */
export const workflowApi = {
  /**
   * 获取工作流列表
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
    
    // 转换后端数据为前端格式
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
   * 获取工作流详情
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
   * 创建工作流
   */
  async create(data: CreateWorkflowRequest): Promise<CreateWorkflowResponse> {
    return request<CreateWorkflowResponse>("/workflows", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * 更新工作流
   */
  async update(id: string, data: UpdateWorkflowRequest): Promise<GetWorkflowResponse> {
    return request<GetWorkflowResponse>(`/workflows/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /**
   * 删除工作流
   */
  async delete(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/workflows/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * 复制工作流
   */
  async duplicate(id: string, data?: DuplicateWorkflowRequest): Promise<CreateWorkflowResponse> {
    return request<CreateWorkflowResponse>(`/workflows/${id}/duplicate`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    });
  },

  /**
   * 导出工作流
   */
  async export(id: string): Promise<ExportWorkflowResponse> {
    return request<ExportWorkflowResponse>(`/workflows/${id}/export`);
  },

  /**
   * 导入工作流
   */
  async import(data: ImportWorkflowRequest): Promise<CreateWorkflowResponse> {
    return request<CreateWorkflowResponse>("/workflows/import", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * 发布工作流
   */
  async publish(id: string): Promise<GetWorkflowResponse> {
    return request<GetWorkflowResponse>(`/workflows/${id}/publish`, {
      method: "POST",
    });
  },

  /**
   * 归档工作流
   */
  async archive(id: string): Promise<GetWorkflowResponse> {
    return request<GetWorkflowResponse>(`/workflows/${id}/archive`, {
      method: "POST",
    });
  },

  /**
   * 执行工作流
   */
  async execute(id: string, inputs?: Record<string, unknown>): Promise<{ executionId: string }> {
    return request<{ executionId: string }>(`/workflows/${id}/execute`, {
      method: "POST",
      body: JSON.stringify({ inputs }),
    });
  },
};

/**
 * 工作流文件夹 API
 */
export const folderApi = {
  /**
   * 获取文件夹列表
   */
  async list(): Promise<ListFoldersResponse> {
    return request<ListFoldersResponse>("/workflows/folders");
  },

  /**
   * 创建文件夹
   */
  async create(data: { name: string; parentId?: string; color?: string }): Promise<{ folder: WorkflowFolder }> {
    return request<{ folder: WorkflowFolder }>("/workflows/folders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * 更新文件夹
   */
  async update(id: string, data: { name?: string; color?: string }): Promise<{ folder: WorkflowFolder }> {
    return request<{ folder: WorkflowFolder }>(`/workflows/folders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /**
   * 删除文件夹
   */
  async delete(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/workflows/folders/${id}`, {
      method: "DELETE",
    });
  },
};

/**
 * 执行记录 API
 */
export const executionApi = {
  /**
   * 获取执行记录列表
   */
  async list(workflowId: string, params?: { page?: number; pageSize?: number }): Promise<ListExecutionsResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
    
    const query = searchParams.toString();
    return request<ListExecutionsResponse>(`/workflows/${workflowId}/executions${query ? `?${query}` : ""}`);
  },

  /**
   * 获取执行详情
   */
  async get(executionId: string): Promise<{ execution: WorkflowExecution }> {
    return request<{ execution: WorkflowExecution }>(`/executions/${executionId}`);
  },

  /**
   * 取消执行
   */
  async cancel(executionId: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/executions/${executionId}/cancel`, {
      method: "POST",
    });
  },

  /**
   * 重试执行
   */
  async retry(executionId: string): Promise<{ success: boolean; data: { execution: WorkflowExecution } }> {
    return request<{ success: boolean; data: { execution: WorkflowExecution } }>(`/executions/${executionId}/retry`, {
      method: "POST",
    });
  },
};

/**
 * 模板 API
 */
export const templateApi = {
  /**
   * 获取模板列表
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
   * 获取模板详情
   */
  async get(id: string): Promise<{ template: WorkflowTemplate }> {
    return request<{ template: WorkflowTemplate }>(`/templates/${id}`);
  },

  /**
   * 从模板创建工作流
   */
  async useTemplate(id: string, data?: { name?: string; folderId?: string }): Promise<CreateWorkflowResponse> {
    return request<CreateWorkflowResponse>(`/templates/${id}/use`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    });
  },
};
