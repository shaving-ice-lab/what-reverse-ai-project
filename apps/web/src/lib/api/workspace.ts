/**
 * Workspace API Service
 * Workspace management related interfaces
 */

import { request, API_BASE_URL } from './shared'

// ===== Type Definitions =====

export interface Workspace {
  id: string
  owner_user_id: string
  name: string
  slug: string
  icon?: string
  description?: string
  status: 'active' | 'suspended' | 'deleted'
  plan: 'free' | 'pro' | 'enterprise'
  region?: string
  settings_json?: Record<string, unknown>
  created_at: string
  updated_at: string
  deleted_at?: string

  // App related fields (workspace is the app)
  app_status: 'draft' | 'published' | 'deprecated' | 'archived'
  current_version_id?: string
  pricing_type?: 'free' | 'paid' | 'subscription'
  price?: number
  published_at?: string

  // Access policy fields (app access policy)
  access_mode: 'private' | 'public_auth' | 'public_anonymous'
  data_classification?: string
  rate_limit_json?: Record<string, unknown>
  allowed_origins?: string[]
  require_captcha?: boolean

  // Associated data
  current_version?: WorkspaceVersion
}

// Retain App type as alias for Workspace for compatibility
export type App = Workspace

// Workspace version (app version)
export interface WorkspaceVersion {
  id: string
  workspace_id: string
  version: string
  changelog?: string
  workflow_id?: string
  ui_schema?: Record<string, unknown>
  db_schema?: Record<string, unknown>
  config_json?: Record<string, unknown>
  created_by?: string
  created_at: string
}

// Retain AppVersion type for compatibility
export type AppVersion = WorkspaceVersion

// Workspace domain (app domain)
export interface WorkspaceDomain {
  id: string
  workspace_id: string
  domain: string
  status: 'pending' | 'verifying' | 'verified' | 'active' | 'failed' | 'blocked'
  blocked_at?: string
  blocked_reason?: string
  domain_expires_at?: string
  domain_expiry_notified_at?: string
  verification_token?: string
  verified_at?: string
  ssl_status?: 'pending' | 'issuing' | 'issued' | 'failed' | 'expired'
  ssl_issued_at?: string
  ssl_expires_at?: string
  ssl_expiry_notified_at?: string
  created_at: string
  updated_at: string
}

// Retain AppDomain type for compatibility
export type AppDomain = WorkspaceDomain

// Domain verification info
export interface DomainVerificationInfo {
  txt_name: string
  txt_value: string
  cname_target: string
}

// Workspace domain binding result
export interface WorkspaceDomainBindingResult {
  domain: WorkspaceDomain
  verification?: DomainVerificationInfo
  verified?: boolean
  method?: string
}

// Workspace execution record
export interface WorkspaceExecution {
  id: string
  workspace_id: string
  workflow_id: string
  session_id?: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  inputs?: Record<string, unknown>
  outputs?: Record<string, unknown>
  error_message?: string
  duration_ms?: number
  started_at?: string
  completed_at?: string
  created_at: string
}

// Workspace metrics
export interface WorkspaceMetrics {
  total_executions: number
  success_count: number
  failure_count: number
  success_rate: number
  avg_duration_ms: number
  total_tokens: number
  executions_by_day: Array<{ date: string; count: number }>
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role_id: string
  role_name: string
  status: 'active' | 'pending' | 'suspended'
  invited_by?: string
  joined_at?: string
  created_at: string
  updated_at: string
  // User info (joined from backend)
  user?: {
    id: string
    username: string
    email: string
    avatar?: string
  }
}

export interface WorkspaceRole {
  id: string
  workspace_id: string
  name: string
  permissions_json: Record<string, boolean>
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface WorkspaceQuota {
  plan: string
  requests: { used: number; limit: number }
  tokens: { used: number; limit: number }
  storage: { used: number; limit: number }
  bandwidth: { used: number; limit: number }
  apps: { used: number; limit: number }
}

export type LogArchiveStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type LogArchiveType = 'execution_logs' | 'audit_logs'

export interface LogArchiveJob {
  id: string
  workspace_id: string
  status: LogArchiveStatus
  archive_type: LogArchiveType
  range_start?: string
  range_end?: string
  file_name?: string
  file_size?: number
  error?: string
  created_at: string
  started_at?: string
  completed_at?: string
  expires_at?: string
  download_url?: string
}

export interface LogArchiveRequest {
  archive_type: LogArchiveType
  range_start?: string
  range_end?: string
}

export interface LogArchiveListParams {
  archive_type?: LogArchiveType
}

export interface LogArchiveReplayParams {
  dataset?: string
  from?: string
  to?: string
  limit?: number
  offset?: number
  execution_id?: string
  workflow_id?: string
  user_id?: string
  node_id?: string
  node_type?: string
  status?: string
  action?: string
  actor_user_id?: string
  target_type?: string
  target_id?: string
}

export interface LogArchiveReplayResult {
  records: Record<string, unknown>[]
  next_offset?: number
}

export interface CreateWorkspaceRequest {
  name: string
  slug?: string
  icon?: string
  plan?: 'free' | 'pro' | 'enterprise'
  region?: string
}

export interface UpdateWorkspaceRequest {
  name?: string
  slug?: string
  icon?: string
  plan?: 'free' | 'pro' | 'enterprise'
}

export interface InviteMemberRequest {
  email: string
  role: string
}

export interface UpdateMemberRoleRequest {
  role_id: string
}

// ===== Workspace API Key Types =====

export interface WorkspaceApiKey {
  id: string
  workspace_id: string
  user_id: string
  provider: string
  name: string
  key_preview?: string
  scopes: string[]
  is_active: boolean
  last_used_at?: string
  last_rotated_at?: string
  revoked_at?: string
  revoked_reason?: string
  created_at: string
  updated_at: string
}

export interface CreateWorkspaceApiKeyRequest {
  provider: string
  name: string
  key: string
  scopes?: string[]
}

export interface RotateWorkspaceApiKeyRequest {
  name?: string
  key: string
  scopes?: string[]
}

// ===== Workspace Integration Types =====

export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending'
export type IntegrationType = 'webhook' | 'oauth' | 'connector'

export interface WorkspaceIntegration {
  id: string
  workspace_id: string
  type: IntegrationType
  provider: string
  name: string
  status: IntegrationStatus
  config_json?: Record<string, unknown>
  last_sync_at?: string
  error_message?: string
  created_at: string
  updated_at: string
}

export interface WebhookConfig {
  url: string
  secret?: string
  events: string[]
  is_active: boolean
}

export interface OAuthConnection {
  provider: string
  scopes: string[]
  access_token_preview?: string
  refresh_token_preview?: string
  expires_at?: string
}

export interface ConnectorConfig {
  connector_type: string
  endpoint?: string
  credentials_preview?: string
}

// ===== API Response Types =====

interface ApiResponse<T> {
  code: string
  message: string
  data: T
}

interface ListResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

// ===== Backend Response Types (for already implemented user/webhook APIs) =====

type BackendUserApiKey = {
  id: string
  provider: string
  name: string
  key_preview?: string | null
  scopes?: string[] | null
  is_active?: boolean
  last_used_at?: string | null
  last_rotated_at?: string | null
  revoked_at?: string | null
  revoked_reason?: string | null
  created_at?: string
}

type BackendWebhookEndpoint = {
  id: string
  name: string
  url: string
  events: string[]
  signing_enabled: boolean
  secret_preview?: string | null
  is_active: boolean
  last_triggered_at?: string | null
  created_at: string
  updated_at: string
}

function toWorkspaceApiKey(workspaceId: string, item: BackendUserApiKey): WorkspaceApiKey {
  const createdAt = item.created_at || new Date().toISOString()
  const updatedAt = item.last_rotated_at || createdAt
  return {
    id: item.id,
    workspace_id: workspaceId,
    user_id: '',
    provider: item.provider,
    name: item.name,
    key_preview: item.key_preview ?? undefined,
    scopes: item.scopes ?? [],
    is_active: Boolean(item.is_active ?? true),
    last_used_at: item.last_used_at ?? undefined,
    last_rotated_at: item.last_rotated_at ?? undefined,
    revoked_at: item.revoked_at ?? undefined,
    revoked_reason: item.revoked_reason ?? undefined,
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

function toWebhookIntegration(
  workspaceId: string,
  endpoint: BackendWebhookEndpoint
): WorkspaceIntegration {
  const lastSync = endpoint.last_triggered_at || endpoint.updated_at
  return {
    id: endpoint.id,
    workspace_id: workspaceId,
    type: 'webhook',
    provider: 'webhook',
    name: endpoint.name,
    status: endpoint.is_active ? 'connected' : 'disconnected',
    config_json: {
      url: endpoint.url,
      events: endpoint.events,
      signing_enabled: endpoint.signing_enabled,
      secret_preview: endpoint.secret_preview ?? undefined,
      is_active: endpoint.is_active,
    },
    last_sync_at: lastSync,
    created_at: endpoint.created_at,
    updated_at: endpoint.updated_at,
  }
}

// ===== Workspace API =====

export const workspaceApi = {
  /**
   * Get user's workspace list
   */
  async list(): Promise<Workspace[]> {
    const response =
      await request<
        ApiResponse<ListResponse<Workspace> | { workspaces?: Workspace[] } | Workspace[]>
      >('/workspaces')
    const payload = response.data as any
    if (Array.isArray(payload?.items)) return payload.items as Workspace[]
    if (Array.isArray(payload?.workspaces)) return payload.workspaces as Workspace[]
    if (Array.isArray(payload)) return payload as Workspace[]
    return []
  },

  /**
   * Get workspace details
   */
  async get(id: string): Promise<Workspace> {
    const response = await request<ApiResponse<{ workspace: Workspace } | Workspace>>(
      `/workspaces/${id}`
    )
    const payload = response.data as any
    return (payload?.workspace as Workspace) ?? (payload as Workspace)
  },

  /**
   * Get workspace by slug
   */
  async getBySlug(slug: string): Promise<Workspace> {
    const response = await request<ApiResponse<{ workspace: Workspace } | Workspace>>(
      `/workspaces/by-slug/${slug}`
    )
    const payload = response.data as any
    return (payload?.workspace as Workspace) ?? (payload as Workspace)
  },

  /**
   * Create workspace
   */
  async create(data: CreateWorkspaceRequest): Promise<Workspace> {
    const response = await request<ApiResponse<{ workspace: Workspace } | Workspace>>(
      '/workspaces',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )
    const payload = response.data as any
    return (payload?.workspace as Workspace) ?? (payload as Workspace)
  },

  /**
   * Update workspace
   */
  async update(id: string, data: UpdateWorkspaceRequest): Promise<Workspace> {
    const response = await request<ApiResponse<{ workspace: Workspace } | Workspace>>(
      `/workspaces/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    )
    const payload = response.data as any
    return (payload?.workspace as Workspace) ?? (payload as Workspace)
  },

  /**
   * Get workspace member list
   */
  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const response = await request<
      ApiResponse<
        ListResponse<WorkspaceMember> | { members?: WorkspaceMember[] } | WorkspaceMember[]
      >
    >(`/workspaces/${workspaceId}/members`)
    const payload = response.data as any
    if (Array.isArray(payload?.items)) return payload.items as WorkspaceMember[]
    if (Array.isArray(payload?.members)) return payload.members as WorkspaceMember[]
    if (Array.isArray(payload)) return payload as WorkspaceMember[]
    return []
  },

  /**
   * Invite member
   */
  async inviteMember(workspaceId: string, data: InviteMemberRequest): Promise<WorkspaceMember> {
    const response = await request<ApiResponse<{ member: WorkspaceMember } | WorkspaceMember>>(
      `/workspaces/${workspaceId}/members`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )
    const payload = response.data as any
    return (payload?.member as WorkspaceMember) ?? (payload as WorkspaceMember)
  },

  /**
   * Update member role
   */
  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    data: UpdateMemberRoleRequest
  ): Promise<WorkspaceMember> {
    const response = await request<ApiResponse<{ member: WorkspaceMember } | WorkspaceMember>>(
      `/workspaces/${workspaceId}/members/${memberId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    )
    const payload = response.data as any
    return (payload?.member as WorkspaceMember) ?? (payload as WorkspaceMember)
  },

  /**
   * Remove member
   */
  async removeMember(workspaceId: string, memberId: string): Promise<void> {
    await request<ApiResponse<null>>(`/workspaces/${workspaceId}/members/${memberId}`, {
      method: 'DELETE',
    })
  },

  /**
   * Get workspace role list
   */
  async getRoles(workspaceId: string): Promise<WorkspaceRole[]> {
    const response = await request<ApiResponse<ListResponse<WorkspaceRole>>>(
      `/workspaces/${workspaceId}/roles`
    )
    return response.data?.items || []
  },

  /**
   * Get workspace quota usage
   */
  async getQuota(workspaceId: string): Promise<WorkspaceQuota> {
    const response = await request<ApiResponse<WorkspaceQuota>>(
      `/billing/workspaces/${workspaceId}/quota`
    )
    return response.data
  },

  /**
   * Create log archive task
   */
  async requestLogArchive(workspaceId: string, data: LogArchiveRequest): Promise<LogArchiveJob> {
    const response = await request<ApiResponse<{ archive: LogArchiveJob }>>(
      `/workspaces/${workspaceId}/log-archives`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )
    return response.data.archive
  },

  /**
   * Get log archive task list
   */
  async listLogArchives(
    workspaceId: string,
    params?: LogArchiveListParams
  ): Promise<LogArchiveJob[]> {
    const search = new URLSearchParams()
    if (params?.archive_type) {
      search.set('archive_type', params.archive_type)
    }
    const query = search.toString()
    const response = await request<ApiResponse<{ archives: LogArchiveJob[] }>>(
      `/workspaces/${workspaceId}/log-archives${query ? `?${query}` : ''}`
    )
    return response.data?.archives || []
  },

  /**
   * Get log archive task details
   */
  async getLogArchive(workspaceId: string, archiveId: string): Promise<LogArchiveJob> {
    const response = await request<ApiResponse<{ archive: LogArchiveJob }>>(
      `/workspaces/${workspaceId}/log-archives/${archiveId}`
    )
    return response.data.archive
  },

  /**
   * Download log archive
   */
  async downloadLogArchive(workspaceId: string, archiveId: string): Promise<Blob> {
    const { getStoredTokens } = await import('./shared')
    const tokens = getStoredTokens()
    const response = await fetch(
      `${API_BASE_URL}/workspaces/${workspaceId}/log-archives/${archiveId}/download`,
      {
        headers: {
          ...(tokens?.accessToken && {
            Authorization: `Bearer ${tokens.accessToken}`,
          }),
        },
      }
    )
    if (!response.ok) {
      throw new Error(`Failed to download archive: ${response.statusText}`)
    }
    return response.blob()
  },

  /**
   * Replay archive
   */
  async replayLogArchive(
    workspaceId: string,
    archiveId: string,
    params?: LogArchiveReplayParams
  ): Promise<LogArchiveReplayResult> {
    const search = new URLSearchParams()
    if (params?.dataset) search.set('dataset', params.dataset)
    if (params?.from) search.set('from', params.from)
    if (params?.to) search.set('to', params.to)
    if (params?.limit) search.set('limit', String(params.limit))
    if (params?.offset) search.set('offset', String(params.offset))
    if (params?.execution_id) search.set('execution_id', params.execution_id)
    if (params?.workflow_id) search.set('workflow_id', params.workflow_id)
    if (params?.user_id) search.set('user_id', params.user_id)
    if (params?.node_id) search.set('node_id', params.node_id)
    if (params?.node_type) search.set('node_type', params.node_type)
    if (params?.status) search.set('status', params.status)
    if (params?.action) search.set('action', params.action)
    if (params?.actor_user_id) search.set('actor_user_id', params.actor_user_id)
    if (params?.target_type) search.set('target_type', params.target_type)
    if (params?.target_id) search.set('target_id', params.target_id)
    const query = search.toString()
    const response = await request<ApiResponse<LogArchiveReplayResult>>(
      `/workspaces/${workspaceId}/log-archives/${archiveId}/replay${query ? `?${query}` : ''}`
    )
    return response.data
  },

  /**
   * Delete log archive
   */
  async deleteLogArchive(workspaceId: string, archiveId: string): Promise<void> {
    await request<ApiResponse<null>>(`/workspaces/${workspaceId}/log-archives/${archiveId}`, {
      method: 'DELETE',
    })
  },

  // ===== Workspace API Key Methods =====

  /**
   * Get workspace API key list
   */
  async listApiKeys(workspaceId: string): Promise<WorkspaceApiKey[]> {
    // Backend currently implements user-level API keys: GET /users/me/api-keys
    const response =
      await request<ApiResponse<BackendUserApiKey[] | { items?: BackendUserApiKey[] }>>(
        `/users/me/api-keys`
      )
    const payload: any = response.data as any
    const items: BackendUserApiKey[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.items)
        ? payload.items
        : []
    return items.map((item) => toWorkspaceApiKey(workspaceId, item))
  },

  /**
   * Create workspace API key
   */
  async createApiKey(
    workspaceId: string,
    data: CreateWorkspaceApiKeyRequest
  ): Promise<WorkspaceApiKey> {
    // Maps to backend: POST /users/me/api-keys
    const response = await request<
      ApiResponse<BackendUserApiKey | { api_key?: BackendUserApiKey }>
    >(`/users/me/api-keys`, {
      method: 'POST',
      body: JSON.stringify({
        provider: data.provider,
        name: data.name,
        key: data.key,
        scopes: data.scopes || [],
      }),
    })
    const payload: any = response.data as any
    const item: BackendUserApiKey =
      (payload?.api_key as BackendUserApiKey) ?? (payload as BackendUserApiKey)
    return toWorkspaceApiKey(workspaceId, item)
  },

  /**
   * Rotate workspace API key
   */
  async rotateApiKey(
    workspaceId: string,
    keyId: string,
    data: RotateWorkspaceApiKeyRequest
  ): Promise<WorkspaceApiKey> {
    const response = await request<
      ApiResponse<BackendUserApiKey | { api_key?: BackendUserApiKey }>
    >(`/users/me/api-keys/${keyId}/rotate`, {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        key: data.key,
        scopes: data.scopes || [],
      }),
    })
    const payload: any = response.data as any
    const item: BackendUserApiKey =
      (payload?.api_key as BackendUserApiKey) ?? (payload as BackendUserApiKey)
    return toWorkspaceApiKey(workspaceId, item)
  },

  /**
   * Revoke workspace API key
   */
  async revokeApiKey(
    workspaceId: string,
    keyId: string,
    reason?: string
  ): Promise<WorkspaceApiKey> {
    const response = await request<
      ApiResponse<BackendUserApiKey | { api_key?: BackendUserApiKey }>
    >(`/users/me/api-keys/${keyId}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
    const payload: any = response.data as any
    const item: BackendUserApiKey =
      (payload?.api_key as BackendUserApiKey) ?? (payload as BackendUserApiKey)
    return toWorkspaceApiKey(workspaceId, item)
  },

  /**
   * Delete workspace API key
   */
  async deleteApiKey(_workspaceId: string, keyId: string): Promise<void> {
    await request<ApiResponse<{ message?: string }>>(`/users/me/api-keys/${keyId}`, {
      method: 'DELETE',
    })
  },

  // ===== Workspace Integration Methods =====

  /**
   * Get workspace integration list
   */
  async listIntegrations(workspaceId: string): Promise<WorkspaceIntegration[]> {
    // Currently backend implements webhooks (default workspace): GET /webhooks
    const response =
      await request<
        ApiResponse<BackendWebhookEndpoint[] | { webhooks?: BackendWebhookEndpoint[] }>
      >(`/webhooks`)
    const payload: any = response.data as any
    const endpoints: BackendWebhookEndpoint[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.webhooks)
        ? payload.webhooks
        : []
    return endpoints.map((endpoint) => toWebhookIntegration(workspaceId, endpoint))
  },

  /**
   * Create webhook integration
   */
  async createWebhook(
    workspaceId: string,
    data: { name: string; config: WebhookConfig }
  ): Promise<WorkspaceIntegration> {
    const secret = data.config.secret?.trim()
    const signingEnabled = Boolean(secret)
    const response = await request<
      ApiResponse<{ webhook?: BackendWebhookEndpoint } | BackendWebhookEndpoint>
    >(`/webhooks`, {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        url: data.config.url,
        events: data.config.events,
        secret: secret || undefined,
        signing_enabled: signingEnabled,
        is_active: data.config.is_active,
      }),
    })
    const payload: any = response.data as any
    const endpoint: BackendWebhookEndpoint =
      (payload?.webhook as BackendWebhookEndpoint) ?? (payload as BackendWebhookEndpoint)
    return toWebhookIntegration(workspaceId, endpoint)
  },

  /**
   * Update integration
   */
  async updateIntegration(
    workspaceId: string,
    integrationId: string,
    data: Partial<WorkspaceIntegration>
  ): Promise<WorkspaceIntegration> {
    // Currently only supports webhook: PATCH /webhooks/:id
    const config: any = (data?.config_json as any) || {}
    const body: Record<string, unknown> = {}
    if (typeof data?.name === 'string') body.name = data.name
    if (typeof config?.url === 'string') body.url = config.url
    if (Array.isArray(config?.events)) body.events = config.events
    if (typeof config?.secret === 'string' && config.secret.trim()) {
      body.secret = config.secret.trim()
      body.signing_enabled = true
    } else if (typeof config?.signing_enabled === 'boolean') {
      body.signing_enabled = config.signing_enabled
    }
    if (typeof config?.is_active === 'boolean') {
      body.is_active = config.is_active
    } else if (typeof data?.status === 'string') {
      if (data.status === 'connected') body.is_active = true
      if (data.status === 'disconnected') body.is_active = false
    }

    const response = await request<
      ApiResponse<{ webhook?: BackendWebhookEndpoint } | BackendWebhookEndpoint>
    >(`/webhooks/${integrationId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    const payload: any = response.data as any
    const endpoint: BackendWebhookEndpoint =
      (payload?.webhook as BackendWebhookEndpoint) ?? (payload as BackendWebhookEndpoint)
    return toWebhookIntegration(workspaceId, endpoint)
  },

  /**
   * Delete integration
   */
  async deleteIntegration(_workspaceId: string, integrationId: string): Promise<void> {
    await request<ApiResponse<{ message?: string }>>(`/webhooks/${integrationId}`, {
      method: 'DELETE',
    })
  },
}

// ===== App Access Policy Types (backward compatible) =====

export interface AppAccessPolicy {
  access_mode: Workspace['access_mode']
  data_classification?: string
  rate_limit_json?: Record<string, unknown>
  allowed_origins?: string[]
  require_captcha?: boolean
}

// Retain WorkspaceAccessPolicy alias for compatibility
export type WorkspaceAccessPolicy = AppAccessPolicy

// Version comparison result
export interface AppVersionDiff {
  from_version: string
  to_version: string
  changes: Record<string, unknown>
  summary?: string
}

// App metrics (compatible alias)
export type AppMetrics = WorkspaceMetrics

// App execution record (compatible alias)
export type AppExecution = WorkspaceExecution

// ===== appApi Compatibility Layer =====
// Workspace = App, appApi methods map to workspaceApi or directly call workspace endpoints

export const appApi = {
  /**
   * Get app list (now workspace list, optionally filtered by workspace_id)
   */
  async list(params?: {
    workspace_id?: string
    page?: number
    pageSize?: number
  }): Promise<{ items: Workspace[]; total: number }> {
    const search = new URLSearchParams()
    if (params?.workspace_id) search.set('workspace_id', params.workspace_id)
    if (params?.page) search.set('page', String(params.page))
    if (params?.pageSize) search.set('page_size', String(params.pageSize))
    const query = search.toString()
    const response = await request<ApiResponse<any>>(`/workspaces${query ? `?${query}` : ''}`)
    const payload = response.data as any
    const items: Workspace[] = Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.workspaces)
        ? payload.workspaces
        : Array.isArray(payload)
          ? payload
          : []
    return { items, total: payload?.total ?? items.length }
  },

  /**
   * Get app (workspace) details
   */
  async get(id: string): Promise<Workspace> {
    return workspaceApi.get(id)
  },

  /**
   * Create app (now creates workspace)
   */
  async create(data: {
    name: string
    slug?: string
    description?: string
    workspace_id?: string
  }): Promise<Workspace> {
    return workspaceApi.create({
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      icon: undefined,
      region: undefined,
    })
  },

  /**
   * Publish app (workspace)
   */
  async publish(id: string): Promise<Workspace> {
    const response = await request<ApiResponse<any>>(`/workspaces/${id}/publish`, {
      method: 'POST',
    })
    const payload = response.data as any
    return (payload?.workspace as Workspace) ?? (payload as Workspace)
  },

  /**
   * Deprecate app
   */
  async deprecate(id: string): Promise<Workspace> {
    const response = await request<ApiResponse<any>>(`/workspaces/${id}/deprecate`, {
      method: 'POST',
    })
    const payload = response.data as any
    return (payload?.workspace as Workspace) ?? (payload as Workspace)
  },

  /**
   * Archive app
   */
  async archive(id: string): Promise<Workspace> {
    const response = await request<ApiResponse<any>>(`/workspaces/${id}/archive`, {
      method: 'POST',
    })
    const payload = response.data as any
    return (payload?.workspace as Workspace) ?? (payload as Workspace)
  },

  /**
   * Rollback version
   */
  async rollback(id: string, versionId: string): Promise<Workspace> {
    const response = await request<ApiResponse<any>>(`/workspaces/${id}/rollback`, {
      method: 'POST',
      body: JSON.stringify({ version_id: versionId }),
    })
    const payload = response.data as any
    return (payload?.workspace as Workspace) ?? (payload as Workspace)
  },

  /**
   * Get version list
   */
  async getVersions(
    id: string,
    params?: { page?: number; page_size?: number }
  ): Promise<{ items: WorkspaceVersion[]; total: number }> {
    const search = new URLSearchParams()
    if (params?.page) search.set('page', String(params.page))
    if (params?.page_size) search.set('page_size', String(params.page_size))
    const query = search.toString()
    const response = await request<ApiResponse<any>>(
      `/workspaces/${id}/versions${query ? `?${query}` : ''}`
    )
    const payload = response.data as any
    const items: WorkspaceVersion[] = Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.versions)
        ? payload.versions
        : Array.isArray(payload)
          ? payload
          : []
    return { items, total: payload?.total ?? items.length }
  },

  /**
   * Compare versions
   */
  async compareVersions(
    id: string,
    fromVersionId: string,
    toVersionId: string
  ): Promise<Record<string, unknown>> {
    const response = await request<ApiResponse<any>>(
      `/workspaces/${id}/versions/compare?from=${fromVersionId}&to=${toVersionId}`
    )
    return response.data
  },

  /**
   * Get access policy
   */
  async getAccessPolicy(id: string): Promise<AppAccessPolicy> {
    const response = await request<ApiResponse<any>>(`/workspaces/${id}/access-policy`)
    const payload = response.data as any
    return (payload?.policy as AppAccessPolicy) ?? (payload as AppAccessPolicy)
  },

  /**
   * Update access policy
   */
  async updateAccessPolicy(id: string, data: Partial<AppAccessPolicy>): Promise<AppAccessPolicy> {
    const response = await request<ApiResponse<any>>(`/workspaces/${id}/access-policy`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    const payload = response.data as any
    return (payload?.policy as AppAccessPolicy) ?? (payload as AppAccessPolicy)
  },

  /**
   * Get domain list
   */
  async getDomains(id: string): Promise<WorkspaceDomain[]> {
    const response = await request<ApiResponse<any>>(`/workspaces/${id}/domains`)
    const payload = response.data as any
    return Array.isArray(payload?.domains)
      ? payload.domains
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload)
          ? payload
          : []
  },

  /**
   * Bind domain
   */
  async bindDomain(id: string, data: { domain: string }): Promise<WorkspaceDomainBindingResult> {
    const response = await request<ApiResponse<any>>(`/workspaces/${id}/domains`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.data as WorkspaceDomainBindingResult
  },

  /**
   * Verify domain
   */
  async verifyDomain(id: string, domainId: string): Promise<WorkspaceDomain> {
    const response = await request<ApiResponse<any>>(
      `/workspaces/${id}/domains/${domainId}/verify`,
      { method: 'POST' }
    )
    const payload = response.data as any
    return (payload?.domain as WorkspaceDomain) ?? (payload as WorkspaceDomain)
  },

  /**
   * Delete domain
   */
  async deleteDomain(id: string, domainId: string): Promise<void> {
    await request<ApiResponse<null>>(`/workspaces/${id}/domains/${domainId}`, { method: 'DELETE' })
  },

  /**
   * Update UI schema
   */
  async updateUISchema(
    id: string,
    data: { ui_schema: Record<string, unknown> }
  ): Promise<WorkspaceVersion> {
    const response = await request<ApiResponse<any>>(`/workspaces/${id}/ui-schema`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    const payload = response.data as any
    return (payload?.version as WorkspaceVersion) ?? (payload as WorkspaceVersion)
  },

  /**
   * Get execution list
   */
  async getExecutions(
    id: string,
    params?: { page?: number; page_size?: number; status?: string }
  ): Promise<{ items: WorkspaceExecution[]; total: number }> {
    const search = new URLSearchParams()
    if (params?.page) search.set('page', String(params.page))
    if (params?.page_size) search.set('page_size', String(params.page_size))
    if (params?.status) search.set('status', params.status)
    const query = search.toString()
    const response = await request<ApiResponse<any>>(
      `/workspaces/${id}/executions${query ? `?${query}` : ''}`
    )
    const payload = response.data as any
    const items = Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload)
        ? payload
        : []
    return { items, total: payload?.total ?? items.length }
  },

  /**
   * Get metrics
   */
  async getMetrics(id: string, params?: { days?: number }): Promise<WorkspaceMetrics> {
    const search = new URLSearchParams()
    if (params?.days) search.set('days', String(params.days))
    const query = search.toString()
    const response = await request<ApiResponse<any>>(
      `/workspaces/${id}/metrics${query ? `?${query}` : ''}`
    )
    return response.data as WorkspaceMetrics
  },

  /**
   * Cancel execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    await request<ApiResponse<null>>(`/executions/${executionId}/cancel`, { method: 'POST' })
  },

  /**
   * Update public page SEO info
   */
  async updatePublicSEO(
    id: string,
    data: { title?: string; description?: string; keywords?: string[] }
  ): Promise<Workspace> {
    const response = await request<ApiResponse<any>>(`/workspaces/${id}/seo`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    const payload = response.data as any
    return (payload?.workspace as Workspace) ?? (payload as Workspace)
  },
}

export default workspaceApi
