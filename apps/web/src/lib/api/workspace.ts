/**
 * Workspace API 服务
 * 工作空间管理相关接口
 */

import { request, API_BASE_URL } from "./shared";

// ===== 类型定义 =====

export interface Workspace {
  id: string;
  owner_user_id: string;
  name: string;
  slug: string;
  icon?: string;
  status: "active" | "suspended" | "deleted";
  plan: "free" | "pro" | "enterprise";
  region?: string;
  default_app_id?: string;
  settings_json?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role_id: string;
  role_name: string;
  status: "active" | "pending" | "suspended";
  invited_by?: string;
  joined_at?: string;
  created_at: string;
  updated_at: string;
  // 用户信息（join 返回）
  user?: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  };
}

export interface WorkspaceRole {
  id: string;
  workspace_id: string;
  name: string;
  permissions_json: Record<string, boolean>;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceQuota {
  plan: string;
  requests: { used: number; limit: number };
  tokens: { used: number; limit: number };
  storage: { used: number; limit: number };
  bandwidth: { used: number; limit: number };
  apps: { used: number; limit: number };
}

export type LogArchiveStatus = "pending" | "processing" | "completed" | "failed";
export type LogArchiveType = "execution_logs" | "audit_logs";

export interface LogArchiveJob {
  id: string;
  workspace_id: string;
  status: LogArchiveStatus;
  archive_type: LogArchiveType;
  range_start?: string;
  range_end?: string;
  file_name?: string;
  file_size?: number;
  error?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  expires_at?: string;
  download_url?: string;
}

export interface LogArchiveRequest {
  archive_type: LogArchiveType;
  range_start?: string;
  range_end?: string;
}

export interface LogArchiveListParams {
  archive_type?: LogArchiveType;
}

export interface LogArchiveReplayParams {
  dataset?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
  execution_id?: string;
  workflow_id?: string;
  user_id?: string;
  node_id?: string;
  node_type?: string;
  status?: string;
  action?: string;
  actor_user_id?: string;
  target_type?: string;
  target_id?: string;
}

export interface LogArchiveReplayResult {
  records: Record<string, unknown>[];
  next_offset?: number;
}

export interface CreateWorkspaceRequest {
  name: string;
  slug: string;
  icon?: string;
  region?: string;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  slug?: string;
  icon?: string;
  plan?: "free" | "pro" | "enterprise";
}

export interface InviteMemberRequest {
  email: string;
  role: string;
}

export interface UpdateMemberRoleRequest {
  role_id: string;
}

// ===== Workspace API Key 类型 =====

export interface WorkspaceApiKey {
  id: string;
  workspace_id: string;
  user_id: string;
  provider: string;
  name: string;
  key_preview?: string;
  scopes: string[];
  is_active: boolean;
  last_used_at?: string;
  last_rotated_at?: string;
  revoked_at?: string;
  revoked_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkspaceApiKeyRequest {
  provider: string;
  name: string;
  key: string;
  scopes?: string[];
}

export interface RotateWorkspaceApiKeyRequest {
  name?: string;
  key: string;
  scopes?: string[];
}

// ===== Workspace 集成类型 =====

export type IntegrationStatus = "connected" | "disconnected" | "error" | "pending";
export type IntegrationType = "webhook" | "oauth" | "connector";

export interface WorkspaceIntegration {
  id: string;
  workspace_id: string;
  type: IntegrationType;
  provider: string;
  name: string;
  status: IntegrationStatus;
  config_json?: Record<string, unknown>;
  last_sync_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookConfig {
  url: string;
  secret?: string;
  events: string[];
  is_active: boolean;
}

export interface OAuthConnection {
  provider: string;
  scopes: string[];
  access_token_preview?: string;
  refresh_token_preview?: string;
  expires_at?: string;
}

export interface ConnectorConfig {
  connector_type: string;
  endpoint?: string;
  credentials_preview?: string;
}

// ===== API 响应类型 =====

interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// ===== Workspace API =====

export const workspaceApi = {
  /**
   * 获取用户的工作空间列表
   */
  async list(): Promise<Workspace[]> {
    const response = await request<ApiResponse<ListResponse<Workspace>>>(
      "/workspaces"
    );
    return response.data?.items || [];
  },

  /**
   * 获取单个工作空间详情
   */
  async get(id: string): Promise<Workspace> {
    const response = await request<ApiResponse<Workspace>>(
      `/workspaces/${id}`
    );
    return response.data;
  },

  /**
   * 通过 slug 获取工作空间
   */
  async getBySlug(slug: string): Promise<Workspace> {
    const response = await request<ApiResponse<Workspace>>(
      `/workspaces/by-slug/${slug}`
    );
    return response.data;
  },

  /**
   * 创建工作空间
   */
  async create(data: CreateWorkspaceRequest): Promise<Workspace> {
    const response = await request<ApiResponse<Workspace>>("/workspaces", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * 更新工作空间
   */
  async update(id: string, data: UpdateWorkspaceRequest): Promise<Workspace> {
    const response = await request<ApiResponse<Workspace>>(
      `/workspaces/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
    return response.data;
  },

  /**
   * 获取工作空间成员列表
   */
  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const response = await request<ApiResponse<ListResponse<WorkspaceMember>>>(
      `/workspaces/${workspaceId}/members`
    );
    return response.data?.items || [];
  },

  /**
   * 邀请成员
   */
  async inviteMember(
    workspaceId: string,
    data: InviteMemberRequest
  ): Promise<WorkspaceMember> {
    const response = await request<ApiResponse<WorkspaceMember>>(
      `/workspaces/${workspaceId}/members`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response.data;
  },

  /**
   * 更新成员角色
   */
  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    data: UpdateMemberRoleRequest
  ): Promise<WorkspaceMember> {
    const response = await request<ApiResponse<WorkspaceMember>>(
      `/workspaces/${workspaceId}/members/${memberId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
    return response.data;
  },

  /**
   * 移除成员
   */
  async removeMember(workspaceId: string, memberId: string): Promise<void> {
    await request<ApiResponse<null>>(
      `/workspaces/${workspaceId}/members/${memberId}`,
      {
        method: "DELETE",
      }
    );
  },

  /**
   * 获取工作空间角色列表
   */
  async getRoles(workspaceId: string): Promise<WorkspaceRole[]> {
    const response = await request<ApiResponse<ListResponse<WorkspaceRole>>>(
      `/workspaces/${workspaceId}/roles`
    );
    return response.data?.items || [];
  },

  /**
   * 获取工作空间配额使用情况
   */
  async getQuota(workspaceId: string): Promise<WorkspaceQuota> {
    const response = await request<ApiResponse<WorkspaceQuota>>(
      `/billing/workspaces/${workspaceId}/quota`
    );
    return response.data;
  },

  /**
   * 创建日志归档任务
   */
  async requestLogArchive(
    workspaceId: string,
    data: LogArchiveRequest
  ): Promise<LogArchiveJob> {
    const response = await request<ApiResponse<{ archive: LogArchiveJob }>>(
      `/workspaces/${workspaceId}/log-archives`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response.data.archive;
  },

  /**
   * 获取日志归档任务列表
   */
  async listLogArchives(
    workspaceId: string,
    params?: LogArchiveListParams
  ): Promise<LogArchiveJob[]> {
    const search = new URLSearchParams();
    if (params?.archive_type) {
      search.set("archive_type", params.archive_type);
    }
    const query = search.toString();
    const response = await request<ApiResponse<{ archives: LogArchiveJob[] }>>(
      `/workspaces/${workspaceId}/log-archives${query ? `?${query}` : ""}`
    );
    return response.data?.archives || [];
  },

  /**
   * 获取日志归档任务详情
   */
  async getLogArchive(workspaceId: string, archiveId: string): Promise<LogArchiveJob> {
    const response = await request<ApiResponse<{ archive: LogArchiveJob }>>(
      `/workspaces/${workspaceId}/log-archives/${archiveId}`
    );
    return response.data.archive;
  },

  /**
   * 下载日志归档包
   */
  async downloadLogArchive(workspaceId: string, archiveId: string): Promise<Blob> {
    const { getStoredTokens } = await import("./shared");
    const tokens = getStoredTokens();
    const response = await fetch(
      `${API_BASE_URL}/workspaces/${workspaceId}/log-archives/${archiveId}/download`,
      {
        headers: {
          ...(tokens?.accessToken && {
            Authorization: `Bearer ${tokens.accessToken}`,
          }),
        },
      }
    );
    if (!response.ok) {
      throw new Error(`Archive download failed: ${response.statusText}`);
    }
    return response.blob();
  },

  /**
   * 归档回放
   */
  async replayLogArchive(
    workspaceId: string,
    archiveId: string,
    params?: LogArchiveReplayParams
  ): Promise<LogArchiveReplayResult> {
    const search = new URLSearchParams();
    if (params?.dataset) search.set("dataset", params.dataset);
    if (params?.from) search.set("from", params.from);
    if (params?.to) search.set("to", params.to);
    if (params?.limit) search.set("limit", String(params.limit));
    if (params?.offset) search.set("offset", String(params.offset));
    if (params?.execution_id) search.set("execution_id", params.execution_id);
    if (params?.workflow_id) search.set("workflow_id", params.workflow_id);
    if (params?.user_id) search.set("user_id", params.user_id);
    if (params?.node_id) search.set("node_id", params.node_id);
    if (params?.node_type) search.set("node_type", params.node_type);
    if (params?.status) search.set("status", params.status);
    if (params?.action) search.set("action", params.action);
    if (params?.actor_user_id) search.set("actor_user_id", params.actor_user_id);
    if (params?.target_type) search.set("target_type", params.target_type);
    if (params?.target_id) search.set("target_id", params.target_id);
    const query = search.toString();
    const response = await request<ApiResponse<LogArchiveReplayResult>>(
      `/workspaces/${workspaceId}/log-archives/${archiveId}/replay${query ? `?${query}` : ""}`
    );
    return response.data;
  },

  /**
   * 删除日志归档包
   */
  async deleteLogArchive(workspaceId: string, archiveId: string): Promise<void> {
    await request<ApiResponse<null>>(
      `/workspaces/${workspaceId}/log-archives/${archiveId}`,
      { method: "DELETE" }
    );
  },

  // ===== Workspace API Key 方法 =====

  /**
   * 获取工作空间 API 密钥列表
   */
  async listApiKeys(workspaceId: string): Promise<WorkspaceApiKey[]> {
    const response = await request<ApiResponse<{ api_keys: WorkspaceApiKey[] }>>(
      `/workspaces/${workspaceId}/api-keys`
    );
    return response.data?.api_keys || [];
  },

  /**
   * 创建工作空间 API 密钥
   */
  async createApiKey(
    workspaceId: string,
    data: CreateWorkspaceApiKeyRequest
  ): Promise<WorkspaceApiKey> {
    const response = await request<ApiResponse<{ api_key: WorkspaceApiKey }>>(
      `/workspaces/${workspaceId}/api-keys`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response.data.api_key;
  },

  /**
   * 轮换工作空间 API 密钥
   */
  async rotateApiKey(
    workspaceId: string,
    keyId: string,
    data: RotateWorkspaceApiKeyRequest
  ): Promise<WorkspaceApiKey> {
    const response = await request<ApiResponse<{ api_key: WorkspaceApiKey }>>(
      `/workspaces/${workspaceId}/api-keys/${keyId}/rotate`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response.data.api_key;
  },

  /**
   * 禁用工作空间 API 密钥
   */
  async revokeApiKey(
    workspaceId: string,
    keyId: string,
    reason?: string
  ): Promise<WorkspaceApiKey> {
    const response = await request<ApiResponse<{ api_key: WorkspaceApiKey }>>(
      `/workspaces/${workspaceId}/api-keys/${keyId}/revoke`,
      {
        method: "POST",
        body: JSON.stringify({ reason }),
      }
    );
    return response.data.api_key;
  },

  /**
   * 删除工作空间 API 密钥
   */
  async deleteApiKey(workspaceId: string, keyId: string): Promise<void> {
    await request<ApiResponse<null>>(
      `/workspaces/${workspaceId}/api-keys/${keyId}`,
      { method: "DELETE" }
    );
  },

  // ===== Workspace 集成方法 =====

  /**
   * 获取工作空间集成列表
   */
  async listIntegrations(workspaceId: string): Promise<WorkspaceIntegration[]> {
    const response = await request<ApiResponse<{ integrations: WorkspaceIntegration[] }>>(
      `/workspaces/${workspaceId}/integrations`
    );
    return response.data?.integrations || [];
  },

  /**
   * 创建 Webhook 集成
   */
  async createWebhook(
    workspaceId: string,
    data: { name: string; config: WebhookConfig }
  ): Promise<WorkspaceIntegration> {
    const response = await request<ApiResponse<{ integration: WorkspaceIntegration }>>(
      `/workspaces/${workspaceId}/integrations/webhooks`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response.data.integration;
  },

  /**
   * 更新集成状态
   */
  async updateIntegration(
    workspaceId: string,
    integrationId: string,
    data: Partial<WorkspaceIntegration>
  ): Promise<WorkspaceIntegration> {
    const response = await request<ApiResponse<{ integration: WorkspaceIntegration }>>(
      `/workspaces/${workspaceId}/integrations/${integrationId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
    return response.data.integration;
  },

  /**
   * 删除集成
   */
  async deleteIntegration(workspaceId: string, integrationId: string): Promise<void> {
    await request<ApiResponse<null>>(
      `/workspaces/${workspaceId}/integrations/${integrationId}`,
      { method: "DELETE" }
    );
  },
};

export default workspaceApi;
