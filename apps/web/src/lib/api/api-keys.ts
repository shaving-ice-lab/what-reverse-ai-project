/**
 * API Key Service
 */

import type { ApiKey, ApiKeyProvider, ApiKeyTestResult, CreateApiKeyRequest } from '@/types/api-key'
import { request } from './shared'

/**
 * API Key Service (for backend endpoint /api/v1/users/me/api-keys)
 */
interface ApiResponse<T> {
  code: string
  message: string
  data: T
  meta?: Record<string, unknown>
}

type BackendApiKey = {
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

type BackendTestResult = {
  valid: boolean
  provider: string
  message: string
}

const API_KEYS_BASE = '/users/me/api-keys'

function splitKeyPreview(preview?: string | null) {
  const value = (preview ?? '').trim()
  if (!value) return { keyPrefix: '***', keySuffix: '' }

  // Compatible with "sk-abc...wxyz" format
  if (value.includes('...')) {
    const [prefix, suffix] = value.split('...')
    return {
      keyPrefix: prefix || '***',
      keySuffix: suffix || '',
    }
  }

  // Current backend default is "***" + last 4 characters
  if (value.startsWith('***')) {
    return {
      keyPrefix: '***',
      keySuffix: value.slice(3),
    }
  }

  if (value.length <= 4) return { keyPrefix: '***', keySuffix: value }

  return {
    keyPrefix: value.slice(0, 3),
    keySuffix: value.slice(-4),
  }
}

function toUiApiKey(item: BackendApiKey): ApiKey {
  const { keyPrefix, keySuffix } = splitKeyPreview(item.key_preview)
  const createdAt = item.created_at || new Date().toISOString()
  const updatedAt = item.last_rotated_at || createdAt
  const status = item.is_active ? 'active' : 'revoked'
  return {
    id: item.id,
    name: item.name,
    provider: item.provider as ApiKeyProvider,
    keyPrefix,
    keySuffix,
    status,
    lastUsedAt: item.last_used_at || undefined,
    createdAt,
    updatedAt,
  }
}

function toUiTestResult(result: BackendTestResult): ApiKeyTestResult {
  return {
    valid: Boolean(result?.valid),
    provider: result?.provider as ApiKeyProvider,
    message: result?.message || (result?.valid ? 'Key format is valid' : 'Key format is invalid'),
  }
}

export const apiKeysApi = {
  /**
   * FetchKeyList
   */
  async list(): Promise<ApiKey[]> {
    const response = await request<ApiResponse<BackendApiKey[]>>(API_KEYS_BASE)
    const items = Array.isArray(response.data) ? response.data : []
    return items.map(toUiApiKey)
  },

  /**
   * CreateKey
   */
  async create(data: CreateApiKeyRequest): Promise<ApiKey> {
    const response = await request<ApiResponse<BackendApiKey>>(API_KEYS_BASE, {
      method: 'POST',
      body: JSON.stringify({
        provider: data.provider,
        name: data.name,
        key: data.key,
        scopes: data.scopes || [],
      }),
    })
    return toUiApiKey(response.data)
  },

  /**
   * RotationKey
   */
  async rotate(
    id: string,
    data: { key: string; name?: string; scopes?: string[] }
  ): Promise<ApiKey> {
    const response = await request<ApiResponse<BackendApiKey>>(`${API_KEYS_BASE}/${id}/rotate`, {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        key: data.key,
        scopes: data.scopes || [],
      }),
    })
    return toUiApiKey(response.data)
  },

  /**
   * UndoKey
   */
  async revoke(id: string, reason = ''): Promise<ApiKey> {
    const response = await request<ApiResponse<BackendApiKey>>(`${API_KEYS_BASE}/${id}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
    return toUiApiKey(response.data)
  },

  /**
   * DeleteKey
   */
  async delete(id: string): Promise<void> {
    await request<ApiResponse<{ message: string }>>(`${API_KEYS_BASE}/${id}`, {
      method: 'DELETE',
    })
  },

  /**
   * Test Saved Key (Service backend decrypts and validates)
   */
  async test(id: string): Promise<ApiKeyTestResult> {
    const response = await request<ApiResponse<BackendTestResult>>(`${API_KEYS_BASE}/${id}/test`, {
      method: 'POST',
    })
    return toUiTestResult(response.data)
  },

  /**
   * TestKeyvalue(SavebeforeValidate)
   */
  async testValue(provider: ApiKeyProvider, key: string): Promise<ApiKeyTestResult> {
    const response = await request<ApiResponse<BackendTestResult>>(`${API_KEYS_BASE}/test`, {
      method: 'POST',
      body: JSON.stringify({ provider, key }),
    })
    return toUiTestResult(response.data)
  },
}
