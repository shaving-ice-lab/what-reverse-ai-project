/**
 * API 客户端封装
 * 基于 fetch 的统一请求处理
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

// ===== 类型定义 =====

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  timeout?: number;
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// ===== Token 管理 =====
// 统一从 Zustand persist 存储（auth-storage）读取 token

let cachedAccessToken: string | null = null;
let cachedRefreshToken: string | null = null;

/**
 * 从 Zustand persist 存储获取 tokens
 */
function getStoredTokensFromZustand(): { accessToken?: string; refreshToken?: string } | null {
  if (typeof window === "undefined") return null;
  
  try {
    const authStorage = localStorage.getItem("auth-storage");
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed?.state?.tokens || null;
    }
  } catch {
    // 解析失败，返回 null
  }
  return null;
}

export function setTokens(access: string, refresh: string) {
  cachedAccessToken = access;
  cachedRefreshToken = refresh;
  // 注意：实际存储由 Zustand persist 自动处理
  // 这里只更新内存缓存
}

export function clearTokens() {
  cachedAccessToken = null;
  cachedRefreshToken = null;
  // 注意：实际清除由 Zustand persist 自动处理
}

export function getAccessToken(): string | null {
  // 优先使用缓存
  if (cachedAccessToken) return cachedAccessToken;
  
  // 从 Zustand persist 存储读取
  const tokens = getStoredTokensFromZustand();
  if (tokens?.accessToken) {
    cachedAccessToken = tokens.accessToken;
    cachedRefreshToken = tokens.refreshToken || null;
    return cachedAccessToken;
  }
  
  return null;
}

export function getRefreshToken(): string | null {
  // 优先使用缓存
  if (cachedRefreshToken) return cachedRefreshToken;
  
  // 从 Zustand persist 存储读取
  const tokens = getStoredTokensFromZustand();
  if (tokens?.refreshToken) {
    cachedRefreshToken = tokens.refreshToken;
    return cachedRefreshToken;
  }
  
  return null;
}

// ===== 请求工具 =====

/**
 * 构建查询字符串
 */
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

/**
 * Token 刷新
 */
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
    
    const data: ApiResponse<{ access_token: string; refresh_token: string }> = await response.json();
    
    if (data.success && data.data) {
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

/**
 * 核心请求函数
 */
async function request<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { params, timeout = 30000, ...fetchConfig } = config;
  
  // 构建完整 URL
  const url = `${API_BASE_URL}${endpoint}${buildQueryString(params)}`;
  
  // 准备请求头
  const headers = new Headers(fetchConfig.headers);
  
  if (!headers.has("Content-Type") && fetchConfig.body) {
    headers.set("Content-Type", "application/json");
  }
  
  // 添加认证头
  const token = getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  // 创建 AbortController 用于超时
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchConfig,
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // 处理 401 - 尝试刷新 Token
    if (response.status === 401 && token) {
      const refreshed = await refreshAccessToken();
      
      if (refreshed) {
        // 重试请求
        headers.set("Authorization", `Bearer ${getAccessToken()}`);
        const retryResponse = await fetch(url, {
          ...fetchConfig,
          headers,
        });
        
        if (!retryResponse.ok) {
          const errorData: ApiResponse = await retryResponse.json().catch(() => ({}));
          throw new ApiError(
            errorData.error?.message || "请求失败",
            errorData.error?.code || "REQUEST_FAILED",
            retryResponse.status,
            errorData.error?.details
          );
        }
        
        const retryData: ApiResponse<T> = await retryResponse.json();
        
        if (!retryData.success) {
          throw new ApiError(
            retryData.error?.message || "请求失败",
            retryData.error?.code || "REQUEST_FAILED",
            retryResponse.status,
            retryData.error?.details
          );
        }
        
        return retryData.data as T;
      } else {
        // 刷新失败，清除 Token 并抛出错误
        clearTokens();
        throw new ApiError("登录已过期，请重新登录", "TOKEN_EXPIRED", 401);
      }
    }
    
    // 解析响应
    const data: ApiResponse<T> = await response.json();
    
    // 处理错误响应
    if (!response.ok || !data.success) {
      throw new ApiError(
        data.error?.message || "请求失败",
        data.error?.code || "REQUEST_FAILED",
        response.status,
        data.error?.details
      );
    }
    
    return data.data as T;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new ApiError("请求超时", "TIMEOUT", 408);
      }
      throw new ApiError(error.message, "NETWORK_ERROR", 0);
    }
    
    throw new ApiError("未知错误", "UNKNOWN_ERROR", 0);
  }
}

// ===== HTTP 方法 =====

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

// 重新导出所有 API 服务
export * from "./api/index";
