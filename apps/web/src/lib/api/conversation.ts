/**
 * Conversation API Service
 */

import type {
  Conversation,
  Message,
  ConversationFolder,
  CreateConversationRequest,
  UpdateConversationRequest,
  ListConversationsParams,
  AddMessageRequest,
  ListMessagesParams,
  BatchStarRequest,
  BatchArchiveRequest,
  BatchMoveRequest,
  BatchOperationRequest,
  ConversationListResponse,
  MessageListResponse,
  ConversationFolderListResponse,
  BatchOperationResponse,
  CreateConversationFolderRequest,
  UpdateConversationFolderRequest,
} from '@/types/conversation'

import { request, API_BASE_URL } from './shared'

/** API envelope returned by the backend */
interface ApiResponse<T> {
  code: string
  message: string
  data: T
}

/**
 * Conversation API
 */
export const conversationApi = {
  /**
   * FetchConversationList
   */
  async list(params?: ListConversationsParams): Promise<ConversationListResponse> {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // will camelCase Convertas snake_case
          const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
          searchParams.set(snakeKey, String(value))
        }
      })
    }

    const query = searchParams.toString()
    const response = await request<ApiResponse<ConversationListResponse>>(
      `${API_BASE_URL}/conversations${query ? `?${query}` : ''}`
    )

    return response.data
  },

  /**
   * CreateConversation
   */
  async create(data: CreateConversationRequest): Promise<Conversation> {
    const response = await request<ApiResponse<{ conversation: Conversation }>>(
      `${API_BASE_URL}/conversations`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: data.workspaceId,
          title: data.title,
          model: data.model,
          system_prompt: data.systemPrompt,
          folder_id: data.folderId,
          tags: data.tags,
        }),
      }
    )

    return response.data.conversation
  },

  /**
   * FetchConversationDetails
   */
  async get(
    id: string,
    options?: { messageLimit?: number; workspaceId?: string }
  ): Promise<Conversation> {
    const searchParams = new URLSearchParams()
    if (options?.messageLimit) {
      searchParams.set('message_limit', String(options.messageLimit))
    }
    if (options?.workspaceId) {
      searchParams.set('workspace_id', options.workspaceId)
    }
    const params = searchParams.toString()
    const response = await request<ApiResponse<{ conversation: Conversation }>>(
      `${API_BASE_URL}/conversations/${id}${params ? `?${params}` : ''}`
    )

    return response.data.conversation
  },

  /**
   * UpdateConversation
   */
  async update(id: string, data: UpdateConversationRequest): Promise<Conversation> {
    const response = await request<ApiResponse<{ conversation: Conversation }>>(
      `${API_BASE_URL}/conversations/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          model: data.model,
          system_prompt: data.systemPrompt,
          folder_id: data.folderId,
        }),
      }
    )

    return response.data.conversation
  },

  /**
   * DeleteConversation
   */
  async delete(id: string): Promise<void> {
    await request<ApiResponse<{ success: boolean }>>(`${API_BASE_URL}/conversations/${id}`, { method: 'DELETE' })
  },

  /**
   * CopyConversation
   */
  async duplicate(id: string): Promise<Conversation> {
    const response = await request<ApiResponse<{ conversation: Conversation }>>(
      `${API_BASE_URL}/conversations/${id}/duplicate`,
      { method: 'POST' }
    )

    return response.data.conversation
  },

  /**
   * SettingsFavoriteStatus
   */
  async setStarred(id: string, starred: boolean): Promise<void> {
    await request<ApiResponse<{ success: boolean }>>(`${API_BASE_URL}/conversations/${id}/starred`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: starred }),
    })
  },

  /**
   * SettingsPinStatus
   */
  async setPinned(id: string, pinned: boolean): Promise<void> {
    await request<ApiResponse<{ success: boolean }>>(`${API_BASE_URL}/conversations/${id}/pinned`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: pinned }),
    })
  },

  /**
   * SettingsArchiveStatus
   */
  async setArchived(id: string, archived: boolean): Promise<void> {
    await request<ApiResponse<{ success: boolean }>>(`${API_BASE_URL}/conversations/${id}/archived`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: archived }),
    })
  },

  /**
   * SettingsTags
   */
  async setTags(id: string, tags: string[]): Promise<void> {
    await request<ApiResponse<{ success: boolean }>>(`${API_BASE_URL}/conversations/${id}/tags`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    })
  },

  /**
   * BatchFavorite
   */
  async batchStar(data: BatchStarRequest): Promise<BatchOperationResponse> {
    const response = await request<ApiResponse<BatchOperationResponse>>(`${API_BASE_URL}/conversations/batch/star`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.data
  },

  /**
   * BatchArchive
   */
  async batchArchive(data: BatchArchiveRequest): Promise<BatchOperationResponse> {
    const response = await request<ApiResponse<BatchOperationResponse>>(`${API_BASE_URL}/conversations/batch/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.data
  },

  /**
   * BatchDelete
   */
  async batchDelete(data: BatchOperationRequest): Promise<BatchOperationResponse> {
    const response = await request<ApiResponse<BatchOperationResponse>>(`${API_BASE_URL}/conversations/batch/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.data
  },

  /**
   * BatchMovetoFolder
   */
  async batchMove(data: BatchMoveRequest): Promise<BatchOperationResponse> {
    const response = await request<ApiResponse<BatchOperationResponse>>(`${API_BASE_URL}/conversations/batch/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: data.ids,
        folder_id: data.folderId,
      }),
    })
    return response.data
  },

  /**
   * FetchMessageList
   */
  async listMessages(
    conversationId: string,
    params?: ListMessagesParams
  ): Promise<MessageListResponse> {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
          searchParams.set(snakeKey, String(value))
        }
      })
    }

    const query = searchParams.toString()
    const response = await request<ApiResponse<MessageListResponse>>(
      `${API_BASE_URL}/conversations/${conversationId}/messages${query ? `?${query}` : ''}`
    )
    return response.data
  },

  /**
   * AddMessage
   */
  async addMessage(conversationId: string, data: AddMessageRequest): Promise<Message> {
    const response = await request<ApiResponse<{ message: Message }>>(
      `${API_BASE_URL}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: data.role,
          content: data.content,
          model: data.model,
          token_usage: data.tokenUsage,
          prompt_tokens: data.promptTokens,
          completion_tokens: data.completionTokens,
          parent_id: data.parentId,
        }),
      }
    )

    return response.data.message
  },

  /**
   * UpdateMessage
   */
  async updateMessage(
    conversationId: string,
    messageId: string,
    content: string
  ): Promise<Message> {
    const response = await request<ApiResponse<{ success: boolean; message: Message }>>(
      `${API_BASE_URL}/conversations/${conversationId}/messages/${messageId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      }
    )
    return response.data.message
  },

  /**
   * UpdateMessageFeedback(Like//Favorite)
   */
  async updateMessageFeedback(
    conversationId: string,
    messageId: string,
    feedback: { liked?: boolean; disliked?: boolean; bookmarked?: boolean }
  ): Promise<Message> {
    const response = await request<ApiResponse<{ success: boolean; message: Message }>>(
      `${API_BASE_URL}/conversations/${conversationId}/messages/${messageId}/feedback`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback),
      }
    )
    return response.data.message
  },

  /**
   * DeleteMessage
   */
  async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    await request<ApiResponse<{ success: boolean }>>(
      `${API_BASE_URL}/conversations/${conversationId}/messages/${messageId}`,
      { method: 'DELETE' }
    )
  },

  /**
   * AI Chat(Streaming)- AutoSaveMessage
   */
  async chat(
    conversationId: string,
    message: string,
    options?: { model?: string; systemPrompt?: string; workspaceId?: string }
  ): Promise<{
    userMessage: Message
    aiMessage: Message
    suggestions?: string[]
  }> {
    const query = options?.workspaceId ? `?workspace_id=${options.workspaceId}` : ''
    const envelope = await request<ApiResponse<{
      user_message: { id: string; content: string; created_at: string }
      ai_message: { message_id: string; content: string; model: string }
      suggestions?: string[]
    }>>(`${API_BASE_URL}/conversations/${conversationId}/chat${query}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        model: options?.model,
        system_prompt: options?.systemPrompt,
      }),
    })

    const response = envelope.data

    return {
      userMessage: {
        id: response.user_message.id,
        conversationId,
        role: 'user',
        content: response.user_message.content,
        tokenUsage: 0,
        promptTokens: 0,
        completionTokens: 0,
        createdAt: response.user_message.created_at,
        updatedAt: response.user_message.created_at,
      },
      aiMessage: {
        id: response.ai_message.message_id,
        conversationId,
        role: 'assistant',
        content: response.ai_message.content,
        model: response.ai_message.model,
        tokenUsage: 0,
        promptTokens: 0,
        completionTokens: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      suggestions: response.suggestions,
    }
  },

  /**
   * ExportConversation
   * @param format - ExportFormat: json | markdown
   */
  async export(conversationId: string, format: 'json' | 'markdown' = 'json'): Promise<Blob> {
    const { getStoredTokens } = await import('./shared')
    const tokens = getStoredTokens()

    const response = await fetch(
      `${API_BASE_URL}/conversations/${conversationId}/export?format=${format}`,
      {
        headers: {
          ...(tokens?.accessToken && {
            Authorization: `Bearer ${tokens.accessToken}`,
          }),
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to export: ${response.statusText}`)
    }

    return response.blob()
  },

  /**
   * CreateShareLink
   */
  async share(
    conversationId: string,
    options?: { expiresInDays?: number; isPublic?: boolean }
  ): Promise<{
    shareUrl: string
    shareToken: string
    expiresAt?: string
    isPublic: boolean
  }> {
    const envelope = await request<ApiResponse<{
      share_url: string
      share_token: string
      expires_at?: string
      is_public: boolean
    }>>(`${API_BASE_URL}/conversations/${conversationId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expires_in_days: options?.expiresInDays || 0,
        is_public: options?.isPublic ?? true,
      }),
    })

    const response = envelope.data

    return {
      shareUrl: response.share_url,
      shareToken: response.share_token,
      expiresAt: response.expires_at,
      isPublic: response.is_public,
    }
  },

  /**
   * FetchConversationStatistics
   */
  async getStatistics(): Promise<ConversationStatistics> {
    const response = await request<ApiResponse<ConversationStatistics>>(`${API_BASE_URL}/conversations/statistics`)
    return response.data
  },

  /**
   * ImportConversation
   */
  async importConversation(data: ImportConversationRequest): Promise<{
    success: boolean
    conversation: Conversation
    importedCount: number
    totalMessages: number
  }> {
    const envelope = await request<ApiResponse<{
      success: boolean
      conversation: Conversation
      imported_count: number
      total_messages: number
    }>>(`${API_BASE_URL}/conversations/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspace_id: data.workspaceId,
        title: data.title,
        model: data.model,
        system_prompt: data.systemPrompt,
        folder_id: data.folderId,
        messages: data.messages.map((m) => ({
          role: m.role,
          content: m.content,
          model: m.model,
          created_at: m.createdAt,
        })),
      }),
    })

    const response = envelope.data

    return {
      success: response.success,
      conversation: response.conversation,
      importedCount: response.imported_count,
      totalMessages: response.total_messages,
    }
  },
}

// ImportConversationRequestType
export interface ImportConversationRequest {
  workspaceId: string
  title: string
  model?: string
  systemPrompt?: string
  folderId?: string
  messages: {
    role: 'user' | 'assistant' | 'system'
    content: string
    model?: string
    createdAt?: string
  }[]
}

// ConversationStatisticsType
export interface ConversationStatistics {
  totalConversations: number
  totalMessages: number
  totalTokenUsage: number
  starredConversations: number
  archivedConversations: number
  averageMessagesPerConversation: number
  modelUsage: Record<string, number>
  dailyStats: { date: string; conversations: number; messages: number }[]
}

/**
 * ConversationFolder API
 */
export const conversationFolderApi = {
  /**
   * FetchFolderList
   */
  async list(): Promise<ConversationFolderListResponse> {
    const response = await request<ApiResponse<ConversationFolderListResponse>>(`${API_BASE_URL}/conversation-folders`)
    return response.data
  },

  /**
   * CreateFolder
   */
  async create(data: CreateConversationFolderRequest): Promise<ConversationFolder> {
    const response = await request<ApiResponse<{ folder: ConversationFolder }>>(
      `${API_BASE_URL}/conversation-folders`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          icon: data.icon,
          color: data.color,
          parent_id: data.parentId,
        }),
      }
    )

    return response.data.folder
  },

  /**
   * FetchFolderDetails
   */
  async get(id: string): Promise<ConversationFolder> {
    const response = await request<ApiResponse<{ folder: ConversationFolder }>>(
      `${API_BASE_URL}/conversation-folders/${id}`
    )

    return response.data.folder
  },

  /**
   * UpdateFolder
   */
  async update(id: string, data: UpdateConversationFolderRequest): Promise<ConversationFolder> {
    const response = await request<ApiResponse<{ folder: ConversationFolder }>>(
      `${API_BASE_URL}/conversation-folders/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          icon: data.icon,
          color: data.color,
          sort_order: data.sortOrder,
        }),
      }
    )

    return response.data.folder
  },

  /**
   * DeleteFolder
   */
  async delete(id: string): Promise<void> {
    await request<ApiResponse<{ success: boolean }>>(`${API_BASE_URL}/conversation-folders/${id}`, {
      method: 'DELETE',
    })
  },
}
