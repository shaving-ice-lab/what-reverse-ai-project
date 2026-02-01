/**
 * 文件夹 API 服务
 */

import { request } from "./shared";

export interface Folder {
  id: string;
  name: string;
  icon: string;
  color: string;
  parent_id: string | null;
  sort_order: number;
  workflow_count: number;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFolderRequest {
  name: string;
  icon?: string;
  color?: string;
  parent_id?: string;
}

export interface UpdateFolderRequest {
  name?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
}

export interface FolderListResponse {
  success: boolean;
  data: {
    folders: Folder[];
    total: number;
  };
}

export interface FolderResponse {
  success: boolean;
  data: {
    folder: Folder;
  };
}

export interface BatchMoveResponse {
  success: boolean;
  data: {
    success: boolean;
    count: number;
    message: string;
  };
}

export const folderApi = {
  /**
   * 获取文件夹列表
   */
  async list(): Promise<FolderListResponse> {
    return request<FolderListResponse>("/folders");
  },

  /**
   * 创建文件夹
   */
  async create(data: CreateFolderRequest): Promise<FolderResponse> {
    return request<FolderResponse>("/folders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * 获取文件夹详情
   */
  async get(id: string): Promise<FolderResponse> {
    return request<FolderResponse>(`/folders/${id}`);
  },

  /**
   * 更新文件夹
   */
  async update(id: string, data: UpdateFolderRequest): Promise<FolderResponse> {
    return request<FolderResponse>(`/folders/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * 删除文件夹
   */
  async delete(id: string): Promise<{ success: boolean; data: { success: boolean; message: string } }> {
    return request<{ success: boolean; data: { success: boolean; message: string } }>(`/folders/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * 移动工作流到文件夹
   */
  async moveWorkflow(workflowId: string, folderId: string | null): Promise<{ success: boolean; data: { success: boolean; message: string } }> {
    return request<{ success: boolean; data: { success: boolean; message: string } }>(`/workflows/${workflowId}/folder`, {
      method: "PUT",
      body: JSON.stringify({ folder_id: folderId }),
    });
  },

  /**
   * 批量移动工作流
   */
  async batchMove(workflowIds: string[], folderId: string | null): Promise<BatchMoveResponse> {
    return request<BatchMoveResponse>("/workflows/batch/move", {
      method: "POST",
      body: JSON.stringify({ ids: workflowIds, folder_id: folderId }),
    });
  },
};
