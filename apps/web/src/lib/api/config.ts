/**
 * Configcenter API Service
 */

import { request } from './shared'

interface ApiResponse<T> {
  code: string
  message: string
  data: T
}

export interface ConfigItem {
  id: string
  scope_type: 'user' | 'workspace'
  scope_id?: string
  key: string
  value?: string
  value_masked?: string
  value_preview?: string
  value_type: 'string' | 'json' | 'bool' | 'number'
  is_secret: boolean
  is_active: boolean
  description?: string
  updated_by?: string
  created_at: string
  updated_at: string
}

export interface ConfigItemListParams {
  scope_type?: 'user' | 'workspace'
  scope_id?: string
  key?: string
  include_inactive?: boolean
  include_secret?: boolean
}

export interface UpsertConfigItemRequest {
  scope_type?: 'user' | 'workspace'
  scope_id?: string
  key: string
  value: string
  value_type?: 'string' | 'json' | 'bool' | 'number'
  is_secret?: boolean
  description?: string
}

export const configApi = {
  async list(params?: ConfigItemListParams): Promise<ConfigItem[]> {
    const search = new URLSearchParams()
    if (params?.scope_type) search.set('scope_type', params.scope_type)
    if (params?.scope_id) search.set('scope_id', params.scope_id)
    if (params?.key) search.set('key', params.key)
    if (params?.include_inactive) search.set('include_inactive', 'true')
    if (params?.include_secret) search.set('include_secret', 'true')
    const query = search.toString()
    const response = await request<ApiResponse<ConfigItem[]>>(
      `/config/items${query ? `?${query}` : ''}`
    )
    return response.data || []
  },

  async upsert(data: UpsertConfigItemRequest): Promise<ConfigItem> {
    const response = await request<ApiResponse<ConfigItem>>('/config/items', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.data
  },

  async disable(id: string): Promise<ConfigItem> {
    const response = await request<ApiResponse<ConfigItem>>(`/config/items/${id}`, {
      method: 'DELETE',
    })
    return response.data
  },
}
