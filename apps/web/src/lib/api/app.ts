/**
 * App API 服务
 * 应用管理相关接口
 */

import { request, API_BASE_URL } from "./shared";

// ===== 类型定义 =====

export interface App {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  status: "draft" | "published" | "deprecated" | "archived";
  current_version_id?: string;
  pricing_type?: "free" | "paid" | "subscription";
  price?: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  deleted_at?: string;
  // 关联数据
  current_version?: AppVersion;
  access_policy?: AppAccessPolicy;
}

export interface AppVersion {
  id: string;
  app_id: string;
  version: string;
  changelog?: string;
  workflow_id?: string;
  ui_schema?: Record<string, unknown>;
  db_schema?: Record<string, unknown>;
  config_json?: Record<string, unknown>;
  created_by?: string;
  created_at: string;
}

export interface AppVersionDiff {
  from: {
    id: string;
    version: string;
    workflow_id?: string;
    created_at: string;
  };
  to: {
    id: string;
    version: string;
    workflow_id?: string;
    created_at: string;
  };
  changed_fields: string[];
}

export interface AppAccessPolicy {
  id: string;
  app_id: string;
  access_mode: "private" | "public_auth" | "public_anonymous";
  rate_limit_json?: {
    per_minute?: number;
    per_hour?: number;
    per_day?: number;
  };
  allowed_origins?: string[];
  require_captcha?: boolean;
  updated_by?: string;
  updated_at: string;
  created_at: string;
}

export interface AppDomain {
  id: string;
  app_id: string;
  domain: string;
  status: "pending" | "verifying" | "verified" | "active" | "failed" | "blocked";
  blocked_at?: string;
  blocked_reason?: string;
  domain_expires_at?: string;
  domain_expiry_notified_at?: string;
  verification_token?: string;
  verified_at?: string;
  ssl_status?: "pending" | "issuing" | "issued" | "failed" | "expired";
  ssl_issued_at?: string;
  ssl_expires_at?: string;
  ssl_expiry_notified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DomainVerificationInfo {
  txt_name: string;
  txt_value: string;
  cname_target: string;
}

export interface AppDomainBindingResult {
  domain: AppDomain;
  verification?: DomainVerificationInfo;
  verified?: boolean;
  method?: string;
}

export interface AppExecution {
  id: string;
  app_id: string;
  workflow_id: string;
  session_id?: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  error_message?: string;
  duration_ms?: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface AppMetrics {
  total_executions: number;
  success_count: number;
  failure_count: number;
  success_rate: number;
  avg_duration_ms: number;
  total_tokens: number;
  executions_by_day: Array<{ date: string; count: number }>;
}

// ===== 请求类型 =====

export interface CreateAppRequest {
  workspace_id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface CreateAppFromWorkflowRequest {
  workspace_id: string;
  workflow_id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface CreateAppFromAIRequest {
  workspace_id: string;
  prompt: string;
  name?: string;
}

export interface UpdateAppRequest {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
}

export interface CreateVersionRequest {
  changelog?: string;
  workflow_id?: string;
  ui_schema?: Record<string, unknown>;
  db_schema?: Record<string, unknown>;
  config_json?: Record<string, unknown>;
  source?: string;
}

export interface UpdateAccessPolicyRequest {
  access_mode?: "private" | "public_auth" | "public_anonymous";
  rate_limit_json?: {
    per_minute?: number;
    per_hour?: number;
    per_day?: number;
  };
  allowed_origins?: string[];
  require_captcha?: boolean;
}

export interface UpdateUISchemaRequest {
  ui_schema: Record<string, unknown>;
}

export interface BindDomainRequest {
  domain: string;
}

export interface ListAppsParams {
  workspace_id?: string;
  status?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  order?: "asc" | "desc";
}

export interface ListExecutionsParams {
  status?: string;
  page?: number;
  page_size?: number;
  start_date?: string;
  end_date?: string;
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

// ===== App API =====

export const appApi = {
  // ===== App CRUD =====

  /**
   * 获取应用列表
   */
  async list(params?: ListAppsParams): Promise<{ items: App[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.set(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    const response = await request<ApiResponse<ListResponse<App>>>(
      `/apps${query ? `?${query}` : ""}`
    );
    return {
      items: response.data?.items || [],
      total: response.data?.total || 0,
    };
  },

  /**
   * 获取单个应用详情
   */
  async get(id: string): Promise<App> {
    const response = await request<ApiResponse<App>>(`/apps/${id}`);
    return response.data;
  },

  /**
   * 创建应用
   */
  async create(data: CreateAppRequest): Promise<App> {
    const response = await request<ApiResponse<App>>("/apps", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * 从工作流创建应用
   */
  async createFromWorkflow(data: CreateAppFromWorkflowRequest): Promise<App> {
    const response = await request<ApiResponse<App>>("/apps/from-workflow", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * AI 生成应用
   */
  async createFromAI(data: CreateAppFromAIRequest): Promise<App> {
    const response = await request<ApiResponse<App>>("/apps/from-ai", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * 更新应用
   */
  async update(id: string, data: UpdateAppRequest): Promise<App> {
    const response = await request<ApiResponse<App>>(`/apps/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * 更新 UI Schema
   */
  async updateUISchema(appId: string, data: UpdateUISchemaRequest): Promise<AppVersion> {
    const response = await request<ApiResponse<AppVersion>>(`/apps/${appId}/ui-schema`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * 删除应用（归档）
   */
  async delete(id: string): Promise<void> {
    await request<ApiResponse<null>>(`/apps/${id}`, {
      method: "DELETE",
    });
  },

  // ===== 版本管理 =====

  /**
   * 获取应用版本列表
   */
  async getVersions(appId: string, params?: { page?: number; page_size?: number }): Promise<{
    items: AppVersion[];
    total: number;
    page: number;
    page_size: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.page_size) searchParams.set("page_size", String(params.page_size));
    const query = searchParams.toString();
    const response = await request<ApiResponse<ListResponse<AppVersion>>>(
      `/apps/${appId}/versions${query ? `?${query}` : ""}`
    );
    return {
      items: response.data?.items || [],
      total: response.data?.total || 0,
      page: response.data?.page || 1,
      page_size: response.data?.page_size || 20,
    };
  },

  /**
   * 创建新版本
   */
  async createVersion(appId: string, data: CreateVersionRequest): Promise<AppVersion> {
    const response = await request<ApiResponse<AppVersion>>(
      `/apps/${appId}/versions`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response.data;
  },

  /**
   * 对比应用版本
   */
  async compareVersions(appId: string, fromId: string, toId: string): Promise<AppVersionDiff> {
    const response = await request<ApiResponse<{ diff: AppVersionDiff }>>(
      `/apps/${appId}/versions/compare?from=${fromId}&to=${toId}`
    );
    return response.data.diff;
  },

  /**
   * 发布应用
   */
  async publish(appId: string): Promise<App> {
    const response = await request<ApiResponse<App>>(`/apps/${appId}/publish`, {
      method: "POST",
    });
    return response.data;
  },

  /**
   * 回滚到指定版本
   */
  async rollback(appId: string, versionId: string): Promise<App> {
    const response = await request<ApiResponse<App>>(`/apps/${appId}/rollback`, {
      method: "POST",
      body: JSON.stringify({ version_id: versionId }),
    });
    return response.data;
  },

  /**
   * 下线应用
   */
  async deprecate(appId: string): Promise<App> {
    const response = await request<ApiResponse<App>>(`/apps/${appId}/deprecate`, {
      method: "POST",
    });
    return response.data;
  },

  /**
   * 归档应用
   */
  async archive(appId: string): Promise<App> {
    const response = await request<ApiResponse<App>>(`/apps/${appId}/archive`, {
      method: "POST",
    });
    return response.data;
  },

  // ===== 访问策略 =====

  /**
   * 获取访问策略
   */
  async getAccessPolicy(appId: string): Promise<AppAccessPolicy> {
    const response = await request<ApiResponse<AppAccessPolicy>>(
      `/apps/${appId}/access-policy`
    );
    return response.data;
  },

  /**
   * 更新访问策略
   */
  async updateAccessPolicy(
    appId: string,
    data: UpdateAccessPolicyRequest
  ): Promise<AppAccessPolicy> {
    const response = await request<ApiResponse<AppAccessPolicy>>(
      `/apps/${appId}/access-policy`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
    return response.data;
  },

  // ===== 域名管理 =====

  /**
   * 获取应用域名列表
   */
  async getDomains(appId: string): Promise<AppDomain[]> {
    const response = await request<ApiResponse<ListResponse<AppDomain> | { domains: AppDomain[] } | AppDomain[]>>(
      `/apps/${appId}/domains`
    );
    const payload = response.data as unknown;
    if (Array.isArray((payload as ListResponse<AppDomain>)?.items)) {
      return (payload as ListResponse<AppDomain>).items;
    }
    if (Array.isArray((payload as { domains: AppDomain[] })?.domains)) {
      return (payload as { domains: AppDomain[] }).domains;
    }
    if (Array.isArray(payload)) {
      return payload as AppDomain[];
    }
    return [];
  },

  /**
   * 绑定域名
   */
  async bindDomain(appId: string, data: BindDomainRequest): Promise<AppDomainBindingResult> {
    const response = await request<ApiResponse<AppDomainBindingResult | { domain: AppDomain; verification?: DomainVerificationInfo } | AppDomain>>(
      `/apps/${appId}/domains`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    const payload = response.data as any;
    if (payload?.domain) {
      return {
        domain: payload.domain,
        verification: payload.verification,
        verified: payload.verified,
        method: payload.method,
      };
    }
    return { domain: payload as AppDomain };
  },

  /**
   * 验证域名
   */
  async verifyDomain(appId: string, domainId: string): Promise<AppDomainBindingResult> {
    const response = await request<ApiResponse<AppDomainBindingResult | { domain: AppDomain; verification?: DomainVerificationInfo } | AppDomain>>(
      `/apps/${appId}/domains/${domainId}/verify`,
      {
        method: "POST",
      }
    );
    const payload = response.data as any;
    if (payload?.domain) {
      return {
        domain: payload.domain,
        verification: payload.verification,
        verified: payload.verified,
        method: payload.method,
      };
    }
    return { domain: payload as AppDomain };
  },

  /**
   * 更新域名到期时间
   */
  async updateDomainExpiry(appId: string, domainId: string, domainExpiresAt?: string | null): Promise<AppDomain> {
    const response = await request<ApiResponse<{ domain: AppDomain } | AppDomain>>(
      `/apps/${appId}/domains/${domainId}/expiry`,
      {
        method: "PATCH",
        body: JSON.stringify({ domain_expires_at: domainExpiresAt ?? null }),
      }
    );
    const payload = response.data as any;
    return payload?.domain ?? (payload as AppDomain);
  },

  /**
   * 封禁域名
   */
  async blockDomain(appId: string, domainId: string, reason?: string): Promise<AppDomain> {
    const response = await request<ApiResponse<{ domain: AppDomain } | AppDomain>>(
      `/apps/${appId}/domains/${domainId}/block`,
      {
        method: "POST",
        body: JSON.stringify({ reason }),
      }
    );
    const payload = response.data as any;
    return payload?.domain ?? (payload as AppDomain);
  },

  /**
   * 解封域名
   */
  async unblockDomain(appId: string, domainId: string): Promise<AppDomain> {
    const response = await request<ApiResponse<{ domain: AppDomain } | AppDomain>>(
      `/apps/${appId}/domains/${domainId}/unblock`,
      {
        method: "POST",
      }
    );
    const payload = response.data as any;
    return payload?.domain ?? (payload as AppDomain);
  },

  /**
   * 删除域名绑定
   */
  async deleteDomain(appId: string, domainId: string): Promise<void> {
    await request<ApiResponse<null>>(`/apps/${appId}/domains/${domainId}`, {
      method: "DELETE",
    });
  },

  // ===== 执行记录 =====

  /**
   * 获取应用执行记录列表
   */
  async getExecutions(
    appId: string,
    params?: ListExecutionsParams
  ): Promise<{ items: AppExecution[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.set(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    const response = await request<ApiResponse<ListResponse<AppExecution>>>(
      `/apps/${appId}/executions${query ? `?${query}` : ""}`
    );
    return {
      items: response.data?.items || [],
      total: response.data?.total || 0,
    };
  },

  /**
   * 取消执行
   */
  async cancelExecution(executionId: string): Promise<void> {
    await request<ApiResponse<{ message?: string }>>(`/executions/${executionId}/cancel`, {
      method: "POST",
    });
  },

  /**
   * 获取应用指标
   */
  async getMetrics(appId: string, days?: number): Promise<AppMetrics> {
    const query = days ? `?days=${days}` : "";
    const response = await request<ApiResponse<AppMetrics>>(
      `/apps/${appId}/metrics${query}`
    );
    return response.data;
  },
};

export default appApi;
