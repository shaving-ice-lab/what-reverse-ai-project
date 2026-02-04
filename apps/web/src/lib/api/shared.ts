/**
 * Shared API helpers
 * All API modules should use this file.
 */

import { API_BASE_URL, getStoredTokens, requestRaw, type RequestConfig } from "./client";

export { API_BASE_URL, getStoredTokens, type RequestConfig };

/**
 * Common request wrapper used by api modules.
 * Returns raw payload (unwrapped).
 */
export async function request<T>(
  endpoint: string,
  options: RequestConfig = {}
): Promise<T> {
  return requestRaw<T>(endpoint, options);
}
