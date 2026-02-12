/**
 * TypeDefinitionExportEntry
 */

export * from './system'

// ===== useType =====

export interface PagedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ListParams {
  page?: number
  pageSize?: number
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
}

// ===== API Response =====

export interface ApiResponse<T = unknown> {
  code: string
  message: string
  data?: T
  meta?: {
    total?: number
    page?: number
    page_size?: number
  }
  trace_id?: string
  request_id?: string
  error_code?: string
  error_message?: string
  details?: unknown
}

export interface ApiError {
  code: string
  message: string
  details?: unknown
  trace_id?: string
  request_id?: string
}

// ===== WebSocket Message =====

export interface WebSocketMessage<T = unknown> {
  type: string
  payload: T
  timestamp: string
}
