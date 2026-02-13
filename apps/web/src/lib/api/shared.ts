/**
 * Shared API helpers
 * All API modules should use this file.
 */

import {
  API_BASE_URL,
  getStoredTokens,
  getAccessToken,
  refreshAccessToken,
  clearTokens,
  requestRaw,
  type RequestConfig,
  type ApiResponse,
} from './client'

export {
  API_BASE_URL,
  getStoredTokens,
  getAccessToken,
  refreshAccessToken,
  clearTokens,
  type RequestConfig,
  type ApiResponse,
}

/**
 * Common request wrapper used by api modules.
 * Returns raw payload (unwrapped).
 */
export async function request<T>(endpoint: string, options: RequestConfig = {}): Promise<T> {
  return requestRaw<T>(endpoint, options)
}
