/**
 * Workspace API Service
 * Workspace management related interfaces
 */

import { request, API_BASE_URL, type ApiResponse } from './shared'

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
  settings?: Record<string, unknown>
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

  // Computed / legacy compatibility
  access_policy?: WorkspaceAccessPolicy
}

// Retain App type as alias for Workspace for compatibility
export type App = Workspace

// Workspace version (app version)
export interface WorkspaceVersion {
  id: string
  workspace_id: string
  version: string
  changelog?: string
  ui_schema?: Record<string, unknown>
  db_schema?: Record<string, unknown>
  config_json?: Record<string, unknown>
  created_by?: string
  created_at: string
}

// Retain AppVersion type for compatibility
export type AppVersion = WorkspaceVersion

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role_id: string
  status: 'active' | 'pending' | 'suspended'
  invited_by?: string
  joined_at?: string
  created_at: string
  updated_at: string
  // Nested objects from GORM Preload
  user?: {
    id: string
    username: string
    email: string
    avatar_url?: string
    display_name?: string
  }
  role?: {
    id: string
    name: string
    permissions?: Record<string, boolean>
    is_system?: boolean
  }
}

export interface WorkspaceRole {
  id: string
  workspace_id: string
  name: string
  permissions: Record<string, boolean>
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

// ===== API Response Types =====

interface ListResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

// ===== Backend Response Types =====

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
    // No dedicated by-slug endpoint — fetch all workspaces and match by slug
    const workspaces = await workspaceApi.list()
    const match = workspaces.find((w) => w.slug === slug)
    if (!match) {
      throw new Error(`Workspace with slug "${slug}" not found`)
    }
    return match
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
   * Delete workspace
   */
  async delete(id: string): Promise<void> {
    await request<ApiResponse<null>>(`/workspaces/${id}`, {
      method: 'DELETE',
    })
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
   * Get workspace quota usage
   */
  async getQuota(_workspaceId: string): Promise<WorkspaceQuota> {
    // Billing endpoint not implemented yet — return default quota
    return {
      plan: 'free',
      requests: { used: 0, limit: 1000 },
      tokens: { used: 0, limit: 100000 },
      storage: { used: 0, limit: 1 },
      bandwidth: { used: 0, limit: 10 },
      apps: { used: 0, limit: 3 },
    }
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
export interface AppVersionDiffChange {
  from: unknown
  to: unknown
}

export interface AppVersionDiff {
  from_version: string
  to_version: string
  from_id?: string
  to_id?: string
  changes: Record<string, AppVersionDiffChange>
  summary?: string
}

// ===== appApi Compatibility Layer =====
// Workspace = App, appApi methods map to workspaceApi or directly call workspace endpoints

export const appApi = {
  /**
   * Get app (workspace) details
   */
  async get(id: string): Promise<Workspace> {
    return workspaceApi.get(id)
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
  ): Promise<AppVersionDiff> {
    const response = await request<ApiResponse<AppVersionDiff>>(
      `/workspaces/${id}/versions/compare?from=${fromVersionId}&to=${toVersionId}`
    )
    return response.data as AppVersionDiff
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
   * Update UI schema
   */
  async updateUISchema(
    id: string,
    data: { ui_schema: Record<string, unknown> }
  ): Promise<WorkspaceVersion> {
    const response = await request<ApiResponse<any>>(`/workspaces/${id}/versions`, {
      method: 'POST',
      body: JSON.stringify({
        ui_schema: data.ui_schema,
        changelog: 'UI schema update',
      }),
    })
    const payload = response.data as any
    return (payload?.version as WorkspaceVersion) ?? (payload as WorkspaceVersion)
  },

  /**
   * Update config_json (pages config) by creating a new version
   */
  async updateConfigJSON(
    id: string,
    data: { config_json: Record<string, unknown> }
  ): Promise<WorkspaceVersion> {
    const response = await request<ApiResponse<any>>(`/workspaces/${id}/versions`, {
      method: 'POST',
      body: JSON.stringify({
        config_json: data.config_json,
        changelog: 'Pages config update',
      }),
    })
    const payload = response.data as any
    return (payload?.version as WorkspaceVersion) ?? (payload as WorkspaceVersion)
  },

}

export default workspaceApi
