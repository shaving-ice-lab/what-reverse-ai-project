/**
 * API client core
 * Shared request / error / retry / auth handling.
 */

import { getApiBaseUrl } from "@/lib/env";
import { logger, getTraceHeaders, createRequestContext, setTraceId, setRequestId } from "@/lib/logger";

export const API_BASE_URL = getApiBaseUrl();

// ===== Types =====

export interface ApiResponse<T = unknown> {
  code: string;
  message: string;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    page_size?: number;
  };
  trace_id?: string;
  request_id?: string;
  error_code?: string;
  error_message?: string;
  details?: unknown;
}

export interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  timeout?: number;
  retry?: number;
  retryDelayMs?: number;
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;
  traceId?: string;
  requestId?: string;

  constructor(
    message: string,
    code: string,
    status: number,
    details?: unknown,
    traceId?: string,
    requestId?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.traceId = traceId;
    this.requestId = requestId;
  }
}

// ===== Token management =====

let cachedAccessToken: string | null = null;
let cachedRefreshToken: string | null = null;

export function getStoredTokens(): { accessToken?: string; refreshToken?: string } | null {
  if (typeof window === "undefined") return null;

  try {
    const authStorage = localStorage.getItem("auth-storage");
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed?.state?.tokens || null;
    }
  } catch {
    // ignore
  }
  return null;
}

export function setTokens(access: string, refresh: string) {
  cachedAccessToken = access;
  cachedRefreshToken = refresh;
}

export function clearTokens() {
  cachedAccessToken = null;
  cachedRefreshToken = null;
}

export function getAccessToken(): string | null {
  if (cachedAccessToken) return cachedAccessToken;
  const tokens = getStoredTokens();
  if (tokens?.accessToken) {
    cachedAccessToken = tokens.accessToken;
    cachedRefreshToken = tokens.refreshToken || null;
    return cachedAccessToken;
  }
  return null;
}

export function getRefreshToken(): string | null {
  if (cachedRefreshToken) return cachedRefreshToken;
  const tokens = getStoredTokens();
  if (tokens?.refreshToken) {
    cachedRefreshToken = tokens.refreshToken;
    return cachedRefreshToken;
  }
  return null;
}

// ===== Helpers =====

const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_RETRY_DELAY = 300;

function buildQueryString(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return "";

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });

  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

function resolveUrl(endpoint: string): string {
  const trimmed = endpoint.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const base = API_BASE_URL.replace(/\/$/, "");
  if (trimmed.startsWith(base)) return trimmed;
  if (trimmed.startsWith("/")) return `${base}${trimmed}`;
  return `${base}/${trimmed}`;
}

function appendQuery(url: string, params?: Record<string, string | number | boolean | undefined>): string {
  const qs = buildQueryString(params);
  if (!qs) return url;
  return url.includes("?") ? `${url}&${qs.slice(1)}` : `${url}${qs}`;
}

function extractErrorInfo(payload: Partial<ApiResponse<unknown>> | undefined) {
  const fallback: Record<string, unknown> = (payload as Record<string, unknown>) || {};
  const error = fallback.error as Record<string, unknown> | undefined;
  const data = fallback.data as Record<string, unknown> | undefined;
  const message =
    (fallback.error_message as string) ||
    payload?.message ||
    (error?.message as string) ||
    "Request failed";
  const code =
    (fallback.error_code as string) ||
    payload?.code ||
    (error?.code as string) ||
    "REQUEST_FAILED";
  const details = fallback.details ?? data?.details ?? error?.details;
  return {
    message: String(message),
    code: String(code),
    details,
    traceId: payload?.trace_id,
    requestId: payload?.request_id,
  };
}

function isSuccessPayload(payload: Partial<ApiResponse<unknown>> | undefined): boolean {
  if (!payload) return false;
  if (typeof payload.code === "string") return payload.code === "OK";
  if (typeof (payload as Record<string, unknown>)?.success === "boolean") {
    return Boolean((payload as Record<string, unknown>).success);
  }
  return true;
}

function unwrapData<T>(payload: ApiResponse<T> | T): T {
  if (payload && typeof (payload as ApiResponse<T>).code === "string") {
    return (payload as ApiResponse<T>).data as T;
  }
  if (payload && Object.prototype.hasOwnProperty.call(payload as Record<string, unknown>, "data")) {
    return (payload as ApiResponse<T>).data as T;
  }
  return payload as T;
}

async function refreshAccessToken(): Promise<boolean> {
  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: currentRefreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return false;
    }

    const data: ApiResponse<{ access_token: string; refresh_token: string }> =
      await response.json().catch(() => ({} as ApiResponse<{ access_token: string; refresh_token: string }>));

    if (response.ok && isSuccessPayload(data) && data.data) {
      setTokens(data.data.access_token, data.data.refresh_token);
      return true;
    }

    clearTokens();
    return false;
  } catch {
    clearTokens();
    return false;
  }
}

function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return new ApiError("Request timed out", "TIMEOUT", 408);
    }
    return new ApiError(error.message, "NETWORK_ERROR", 0);
  }

  return new ApiError("Unknown error", "UNKNOWN_ERROR", 0);
}

function shouldRetry(error: ApiError, method: string): boolean {
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) return false;
  if (error.code === "TOKEN_EXPIRED") return false;
  if ([401, 403, 404].includes(error.status)) return false;
  if (error.status === 429 || error.code === "RATE_LIMITED") return false;
  if (error.status >= 500) return true;
  if (error.code === "NETWORK_ERROR" || error.code === "TIMEOUT") return true;
  return false;
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function executeFetch(url: string, fetchConfig: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  if (fetchConfig.signal) {
    if (fetchConfig.signal.aborted) {
      controller.abort();
    } else {
      fetchConfig.signal.addEventListener(
        "abort",
        () => controller.abort(),
        { once: true }
      );
    }
  }

  try {
    return await fetch(url, {
      ...fetchConfig,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function performRequest<T>(
  url: string,
  fetchConfig: RequestInit,
  timeout: number
): Promise<T> {
  // Create request tracing context
  const { traceId, requestId } = createRequestContext();

  const buildHeaders = () => {
    const headers = new Headers(fetchConfig.headers);
    if (!headers.has("Content-Type") && fetchConfig.body) {
      headers.set("Content-Type", "application/json");
    }
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    // Add tracing headers
    const traceHeaders = getTraceHeaders();
    Object.entries(traceHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
    return headers;
  };

  const startTime = performance.now();

  const headers = buildHeaders();
  const method = (fetchConfig.method || "GET").toUpperCase();
  
  logger.debug(`API Request: ${method} ${url}`, {
    traceId,
    requestId,
    module: 'api-client',
    action: 'request_start',
  });

  const response = await executeFetch(url, { ...fetchConfig, headers }, timeout);

  // Update trace IDs from response (if returned by server)
  const serverTraceId = response.headers.get('X-Trace-ID');
  const serverRequestId = response.headers.get('X-Request-ID');
  if (serverTraceId) setTraceId(serverTraceId);
  if (serverRequestId) setRequestId(serverRequestId);

  if (response.status === 401 && headers.has("Authorization")) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      clearTokens();
      throw new ApiError("Session expired, please log in again", "TOKEN_EXPIRED", 401);
    }

    const retryHeaders = buildHeaders();
    const retryResponse = await executeFetch(url, { ...fetchConfig, headers: retryHeaders }, timeout);
    const retryData: ApiResponse<T> =
      await retryResponse.json().catch(() => ({} as ApiResponse<T>));

    if (!retryResponse.ok || !isSuccessPayload(retryData)) {
      const errorInfo = extractErrorInfo(retryData);
      throw new ApiError(
        errorInfo.message,
        errorInfo.code,
        retryResponse.status,
        errorInfo.details,
        errorInfo.traceId,
        errorInfo.requestId
      );
    }

    return retryData as T;
  }

  const data: ApiResponse<T> =
    await response.json().catch(() => ({} as ApiResponse<T>));

  if (!response.ok || !isSuccessPayload(data)) {
    const errorInfo = extractErrorInfo(data);
    const duration = Math.round(performance.now() - startTime);
    
    logger.error(`API Error: ${method} ${url}`, undefined, {
      traceId: errorInfo.traceId || traceId,
      requestId: errorInfo.requestId || requestId,
      module: 'api-client',
      action: 'request_error',
      duration,
      status: response.status,
      errorCode: errorInfo.code,
    });

    throw new ApiError(
      errorInfo.message,
      errorInfo.code,
      response.status,
      errorInfo.details,
      errorInfo.traceId,
      errorInfo.requestId
    );
  }

  const duration = Math.round(performance.now() - startTime);
  logger.debug(`API Response: ${method} ${url}`, {
    traceId: data.trace_id || traceId,
    requestId: data.request_id || requestId,
    module: 'api-client',
    action: 'request_complete',
    duration,
    status: response.status,
  });

  return data as T;
}

export async function requestRaw<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const {
    params,
    timeout = DEFAULT_TIMEOUT,
    retry,
    retryDelayMs = DEFAULT_RETRY_DELAY,
    ...fetchConfig
  } = config;

  const method = (fetchConfig.method || "GET").toUpperCase();
  const maxRetries = typeof retry === "number" ? retry : (["GET", "HEAD", "OPTIONS"].includes(method) ? 1 : 0);

  const baseUrl = resolveUrl(endpoint);
  const url = appendQuery(baseUrl, params);

  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await performRequest<T>(url, fetchConfig, timeout);
    } catch (error) {
      const apiError = normalizeError(error);
      if (attempt >= maxRetries || !shouldRetry(apiError, method)) {
        throw apiError;
      }

      attempt += 1;
      const delayMs = retryDelayMs * Math.pow(2, attempt - 1);
      await delay(delayMs);
    }
  }

  throw new ApiError("Request failed", "REQUEST_FAILED", 0);
}

export async function request<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const payload = await requestRaw<ApiResponse<T> | T>(endpoint, config);
  return unwrapData<T>(payload);
}

// ===== HTTP methods =====

export const api = {
  get<T>(endpoint: string, config?: RequestConfig) {
    return request<T>(endpoint, { ...config, method: "GET" });
  },

  post<T>(endpoint: string, body?: unknown, config?: RequestConfig) {
    return request<T>(endpoint, {
      ...config,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(endpoint: string, body?: unknown, config?: RequestConfig) {
    return request<T>(endpoint, {
      ...config,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(endpoint: string, body?: unknown, config?: RequestConfig) {
    return request<T>(endpoint, {
      ...config,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string, config?: RequestConfig) {
    return request<T>(endpoint, { ...config, method: "DELETE" });
  },
};

export default api;
