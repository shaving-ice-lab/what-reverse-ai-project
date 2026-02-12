import { getApiBaseUrl } from '@/lib/env'
import { getStoredTokens } from './shared'

export interface StorageObject {
  id: string
  workspace_id: string
  owner_id?: string | null
  file_name: string
  mime_type: string
  file_size: number
  storage_path: string
  public_url: string
  prefix: string
  created_at: string
  updated_at: string
}

function authHeaders(): Record<string, string> {
  const tokens = getStoredTokens()
  const headers: Record<string, string> = {}
  if (tokens?.accessToken) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`
  }
  return headers
}

export const workspaceStorageApi = {
  async upload(workspaceId: string, file: File, prefix?: string): Promise<StorageObject> {
    const formData = new FormData()
    formData.append('file', file)
    if (prefix) formData.append('prefix', prefix)

    const res = await fetch(`${getApiBaseUrl()}/workspaces/${workspaceId}/storage/upload`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    })
    const payload = await res.json()
    if (!res.ok) throw new Error(payload?.message || 'Upload failed')
    return payload?.data as StorageObject
  },

  async list(
    workspaceId: string,
    prefix?: string,
    page = 1,
    pageSize = 50
  ): Promise<{ items: StorageObject[]; total: number }> {
    const params = new URLSearchParams()
    if (prefix) params.set('prefix', prefix)
    params.set('page', String(page))
    params.set('page_size', String(pageSize))
    const qs = params.toString()

    const res = await fetch(`${getApiBaseUrl()}/workspaces/${workspaceId}/storage?${qs}`, {
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    })
    const payload = await res.json()
    if (!res.ok) throw new Error(payload?.message || 'List failed')
    return payload?.data as { items: StorageObject[]; total: number }
  },

  async getObject(workspaceId: string, objectId: string): Promise<StorageObject> {
    const res = await fetch(`${getApiBaseUrl()}/workspaces/${workspaceId}/storage/${objectId}`, {
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    })
    const payload = await res.json()
    if (!res.ok) throw new Error(payload?.message || 'Get failed')
    return payload?.data as StorageObject
  },

  async deleteObject(workspaceId: string, objectId: string): Promise<void> {
    const res = await fetch(`${getApiBaseUrl()}/workspaces/${workspaceId}/storage/${objectId}`, {
      method: 'DELETE',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    })
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}))
      throw new Error((payload as any)?.message || 'Delete failed')
    }
  },

  getPublicUrl(objectId: string): string {
    return `/storage/files/${objectId}`
  },
}
