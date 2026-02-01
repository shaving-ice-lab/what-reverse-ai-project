/**
 * 共享的 API 工具函数
 * 所有 API 模块应使用此文件中的函数来获取认证 token
 */

// API 基础 URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

/**
 * 从 Zustand persist 存储（auth-storage）获取 tokens
 * 这是统一的 token 存储位置
 */
export function getStoredTokens(): { accessToken?: string; refreshToken?: string } | null {
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

/**
 * 通用请求函数 - 供各 API 模块使用
 */
export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  
  // 从统一的存储位置获取 token
  const tokens = getStoredTokens();
  if (tokens?.accessToken) {
    headers["Authorization"] = `Bearer ${tokens.accessToken}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || "请求失败");
  }
  
  return data;
}
