/**
 * Folder API Service
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
 * FetchFolderList
   */
  async list(): Promise<FolderListResponse> {
    return request<FolderListResponse>("/folders");
  },

  /**
 * CreateFolder
   */
  async create(data: CreateFolderRequest): Promise<FolderResponse> {
    return request<FolderResponse>("/folders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
 * FetchFolderDetails
   */
  async get(id: string): Promise<FolderResponse> {
    return request<FolderResponse>(`/folders/${id}`);
  },

  /**
 * UpdateFolder
   */
  async update(id: string, data: UpdateFolderRequest): Promise<FolderResponse> {
    return request<FolderResponse>(`/folders/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
 * DeleteFolder
   */
  async delete(id: string): Promise<{ success: boolean; data: { success: boolean; message: string } }> {
    return request<{ success: boolean; data: { success: boolean; message: string } }>(`/folders/${id}`, {
      method: "DELETE",
    });
  },

  /**
 * MoveWorkflowtoFolder
   */
  async moveWorkflow(workflowId: string, folderId: string | null): Promise<{ success: boolean; data: { success: boolean; message: string } }> {
    return request<{ success: boolean; data: { success: boolean; message: string } }>(`/workflows/${workflowId}/folder`, {
      method: "PUT",
      body: JSON.stringify({ folder_id: folderId }),
    });
  },

  /**
 * BatchMoveWorkflow
   */
  async batchMove(workflowIds: string[], folderId: string | null): Promise<BatchMoveResponse> {
    return request<BatchMoveResponse>("/workflows/batch/move", {
      method: "POST",
      body: JSON.stringify({ ids: workflowIds, folder_id: folderId }),
    });
  },
};
