/**
 * CustomNode API Service
 */

import type {
  CustomNode,
  CustomNodeDetail,
  CustomNodeListParams,
  CustomNodeListResponse,
  CustomNodeDetailResponse,
  CustomNodeReview,
} from '@/types/custom-node'
import { request } from './shared'

/**
 * CustomNode API
 */
export const customNodeApi = {
  /**
   * Fetch node list
   */
  async list(params?: CustomNodeListParams): Promise<CustomNodeListResponse> {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value))
        }
      })
    }

    const query = searchParams.toString()
    return request<CustomNodeListResponse>(`/nodes${query ? `?${query}` : ''}`)
  },

  /**
   * Fetch popular nodes
   */
  async getPopular(): Promise<CustomNodeListResponse> {
    return request<CustomNodeListResponse>('/nodes/popular')
  },

  /**
   * Fetch the latest nodes
   */
  async getNewest(): Promise<CustomNodeListResponse> {
    return request<CustomNodeListResponse>('/nodes/newest')
  },

  /**
   * Fetch node details
   */
  async getBySlug(slug: string): Promise<CustomNodeDetailResponse> {
    return request<CustomNodeDetailResponse>(`/nodes/${slug}`)
  },

  /**
   * Fetch node details (by ID)
   */
  async getById(id: string): Promise<CustomNodeDetailResponse> {
    return request<CustomNodeDetailResponse>(`/nodes/id/${id}`)
  },

  /**
   * Install node
   */
  async install(id: string): Promise<{ success: boolean; data: { version: string } }> {
    return request(`/nodes/${id}/install`, {
      method: 'POST',
    })
  },

  /**
   * Uninstall node
   */
  async uninstall(id: string): Promise<{ success: boolean }> {
    return request(`/nodes/${id}/uninstall`, {
      method: 'POST',
    })
  },

  /**
   * Update node
   */
  async update(id: string): Promise<{ success: boolean; data: { version: string } }> {
    return request(`/nodes/${id}/update`, {
      method: 'POST',
    })
  },

  /**
   * Star/unstar node
   */
  async star(id: string): Promise<{ success: boolean; data: { isStarred: boolean } }> {
    return request(`/nodes/${id}/star`, {
      method: 'POST',
    })
  },

  /**
   * Fetch node reviews list
   */
  async getReviews(
    id: string,
    params?: { page?: number; pageSize?: number }
  ): Promise<{
    success: boolean
    data: CustomNodeReview[]
    meta: { total: number; page: number; pageSize: number }
  }> {
    const searchParams = new URLSearchParams()

    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize))

    const query = searchParams.toString()
    return request(`/nodes/${id}/reviews${query ? `?${query}` : ''}`)
  },

  /**
   * Fetch installed nodes
   */
  async getInstalled(): Promise<CustomNodeListResponse> {
    return request<CustomNodeListResponse>('/nodes/installed')
  },

  /**
   * Fetch category list
   */
  async getCategories(): Promise<{
    success: boolean
    data: {
      categories: Array<{
        id: string
        name: string
        icon: string
        count: number
      }>
    }
  }> {
    return request('/nodes/categories')
  },

  /**
   * Fetch featured nodes
   */
  async getFeatured(limit: number = 6): Promise<{
    success: boolean
    data: { nodes: CustomNode[] }
  }> {
    return request(`/nodes/featured?limit=${limit}`)
  },

  /**
   * Create node
   */
  async create(data: {
    name: string
    slug?: string
    displayName: string
    description: string
    longDescription?: string
    category: string
    tags?: string[]
    repositoryUrl?: string
    documentationUrl?: string
    homepageUrl?: string
    inputs?: Array<{
      name: string
      type: string
      description?: string
      required?: boolean
    }>
    outputs?: Array<{
      name: string
      type: string
      description?: string
    }>
    version: string
    changelog?: string
  }): Promise<{ success: boolean; data: CustomNodeDetail }> {
    return request('/nodes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Update node
   */
  async updateNode(
    id: string,
    data: Partial<{
      displayName: string
      description: string
      longDescription: string
      category: string
      tags: string[]
      repositoryUrl: string
      documentationUrl: string
      homepageUrl: string
    }>
  ): Promise<{ success: boolean; data: CustomNodeDetail }> {
    return request(`/nodes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  /**
   * Delete node
   */
  async deleteNode(id: string): Promise<{ success: boolean }> {
    return request(`/nodes/${id}`, {
      method: 'DELETE',
    })
  },

  /**
   * Save draft
   */
  async saveDraft(id: string, data: any): Promise<{ success: boolean; data: CustomNodeDetail }> {
    return request(`/nodes/${id}/draft`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /**
   * Submit for review
   */
  async submit(id: string): Promise<{ success: boolean; data: CustomNodeDetail }> {
    return request(`/nodes/${id}/submit`, {
      method: 'POST',
    })
  },

  /**
   * Create new version
   */
  async createVersion(
    nodeId: string,
    data: {
      version: string
      changelog: string
      packageUrl?: string
      inputs?: Array<{
        name: string
        type: string
        description?: string
        required?: boolean
      }>
      outputs?: Array<{
        name: string
        type: string
        description?: string
      }>
    }
  ): Promise<{ success: boolean; data: { version: string } }> {
    return request(`/nodes/${nodeId}/versions`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Submit a review
   */
  async createReview(
    nodeId: string,
    data: {
      rating: number
      title?: string
      content: string
    }
  ): Promise<{ success: boolean; data: CustomNodeReview }> {
    return request(`/nodes/${nodeId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Fetch user's installed nodes
   */
  async getMyInstalled(): Promise<CustomNodeListResponse> {
    return request('/nodes/my/installed')
  },

  /**
   * Fetch user's created nodes
   */
  async getMyNodes(): Promise<CustomNodeListResponse> {
    return request('/nodes/my/created')
  },

  /**
   * Fetch user's starred nodes
   */
  async getMyStarred(): Promise<CustomNodeListResponse> {
    return request('/nodes/my/starred')
  },
}

// Node category interface
export interface NodeCategory {
  id: string
  name: string
  icon: string
  count: number
}
