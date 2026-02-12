import { request } from './shared'

export interface RLSPolicy {
  id: string
  workspace_id: string
  table_name: string
  column: string
  match_field: string
  operation: string
  enabled: boolean
  description: string
  created_at: string
  updated_at: string
}

export const workspaceRLSApi = {
  async createPolicy(
    workspaceId: string,
    data: {
      table_name: string
      column: string
      match_field?: string
      operation?: string
      description?: string
    }
  ): Promise<RLSPolicy> {
    return request<RLSPolicy>(`/workspaces/${workspaceId}/database/rls-policies`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async listPolicies(workspaceId: string): Promise<RLSPolicy[]> {
    const result = await request<RLSPolicy[]>(`/workspaces/${workspaceId}/database/rls-policies`)
    return result || []
  },

  async updatePolicy(
    workspaceId: string,
    policyId: string,
    data: {
      enabled?: boolean
      column?: string
      match_field?: string
      operation?: string
      description?: string
    }
  ): Promise<RLSPolicy> {
    return request<RLSPolicy>(`/workspaces/${workspaceId}/database/rls-policies/${policyId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async deletePolicy(workspaceId: string, policyId: string): Promise<void> {
    await request(`/workspaces/${workspaceId}/database/rls-policies/${policyId}`, {
      method: 'DELETE',
    })
  },
}
