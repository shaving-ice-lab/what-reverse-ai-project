/**
 * 版本历史 API 服务
 */

import { request } from "./shared";

export interface WorkflowVersion {
  id: string;
  workflow_id: string;
  version: number;
  name: string;
  description: string | null;
  definition: Record<string, unknown>;
  variables: Record<string, unknown>;
  change_log: string;
  change_type: "create" | "update" | "restore" | "manual";
  created_by: string;
  created_at: string;
  node_count: number;
  edge_count: number;
  creator?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export interface VersionDiff {
  v1: number;
  v2: number;
  nodes_added: Record<string, unknown>[];
  nodes_removed: Record<string, unknown>[];
  nodes_modified: {
    node_id: string;
    before: Record<string, unknown>;
    after: Record<string, unknown>;
    changes: string[];
  }[];
  edges_added: Record<string, unknown>[];
  edges_removed: Record<string, unknown>[];
  variables_changed: Record<string, unknown>;
  summary: {
    total_changes: number;
    nodes_change_count: number;
    edges_change_count: number;
  };
}

export interface VersionListResponse {
  success: boolean;
  data: {
    versions: WorkflowVersion[];
  };
  meta: {
    total: number;
    page: number;
    page_size: number;
  };
}

export interface VersionResponse {
  success: boolean;
  data: {
    version: WorkflowVersion;
  };
}

export interface RestoreResponse {
  success: boolean;
  data: {
    workflow: Record<string, unknown>;
    message: string;
  };
}

export interface CompareResponse {
  success: boolean;
  data: {
    diff: VersionDiff;
  };
}

export const versionApi = {
  /**
   * 获取版本历史列表
   */
  async list(
    workflowId: string,
    params?: { page?: number; page_size?: number }
  ): Promise<VersionListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.page_size) searchParams.set("page_size", String(params.page_size));
    const query = searchParams.toString();
    return request<VersionListResponse>(`/workflows/${workflowId}/versions${query ? `?${query}` : ""}`);
  },

  /**
   * 获取指定版本详情
   */
  async get(workflowId: string, version: number): Promise<VersionResponse> {
    return request<VersionResponse>(`/workflows/${workflowId}/versions/${version}`);
  },

  /**
   * 恢复到指定版本
   */
  async restore(
    workflowId: string,
    version: number,
    changeLog?: string
  ): Promise<RestoreResponse> {
    return request<RestoreResponse>(`/workflows/${workflowId}/versions/${version}/restore`, {
      method: "POST",
      body: JSON.stringify({ change_log: changeLog }),
    });
  },

  /**
   * 对比两个版本
   */
  async compare(
    workflowId: string,
    v1: number,
    v2: number
  ): Promise<CompareResponse> {
    return request<CompareResponse>(`/workflows/${workflowId}/versions/compare?v1=${v1}&v2=${v2}`);
  },

  /**
   * 手动创建版本快照
   */
  async createSnapshot(
    workflowId: string,
    changeLog: string
  ): Promise<VersionResponse> {
    return request<VersionResponse>(`/workflows/${workflowId}/versions`, {
      method: "POST",
      body: JSON.stringify({ change_log: changeLog }),
    });
  },
};
