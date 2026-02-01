/**
 * 认证 API 服务
 */

import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  User,
  UpdateProfileRequest,
  ChangePasswordRequest,
  OAuthProvider,
} from "@/types/auth";

// API 基础 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

// 获取存储的 token（统一从 Zustand persist 存储读取）
function getStoredTokens(): { accessToken?: string; refreshToken?: string } | null {
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

// 通用请求函数
async function request<T>(
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

// 后端响应格式（snake_case）
interface BackendAuthResponse {
  success: boolean;
  data: {
    access_token: string;
    refresh_token: string;
    user: User;
  };
}

interface BackendRefreshResponse {
  success: boolean;
  data: {
    access_token: string;
    refresh_token: string;
  };
}

interface BackendUserResponse {
  success: boolean;
  data: User;
}

/**
 * 认证 API
 */
export const authApi = {
  /**
   * 用户登录
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await request<BackendAuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    
    // 转换后端响应格式为前端期望的格式
    return {
      success: response.success,
      user: response.data.user,
      tokens: {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: 900, // 15 分钟 = 900 秒
      },
    };
  },

  /**
   * 用户注册
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await request<BackendAuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    
    return {
      success: response.success,
      message: "注册成功",
      user: {
        id: response.data.user.id,
        email: response.data.user.email,
      },
    };
  },

  /**
   * 刷新令牌
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await request<BackendRefreshResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    return {
      tokens: {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: 900,
      },
    };
  },

  /**
   * 登出
   */
  async logout(): Promise<void> {
    return request<void>("/auth/logout", {
      method: "POST",
    });
  },

  /**
   * 忘记密码
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    return request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * 重置密码
   */
  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    return request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * 验证邮箱
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/auth/verify-email?token=${token}`, {
      method: "GET",
    });
  },

  /**
   * 重发验证邮件
   */
  async resendVerification(): Promise<{ message: string }> {
    return request<{ message: string }>("/auth/resend-verification", {
      method: "POST",
    });
  },

  /**
   * OAuth 登录
   */
  getOAuthUrl(provider: OAuthProvider): string {
    return `${API_BASE_URL}/auth/oauth/${provider}`;
  },
};

/**
 * 用户 API
 */
export const userApi = {
  /**
   * 获取当前用户
   */
  async getCurrentUser(): Promise<User> {
    const response = await request<BackendUserResponse>("/users/me");
    return response.data;
  },

  /**
   * 更新用户资料
   */
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    return request<User>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /**
   * 修改密码
   */
  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    return request<{ message: string }>("/users/me/password", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * 上传头像
   */
  async uploadAvatar(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("avatar", file);
    
    const url = `${API_BASE_URL}/users/me/avatar`;
    const tokens = getStoredTokens();
    const headers: Record<string, string> = {};
    
    if (tokens?.accessToken) {
      headers["Authorization"] = `Bearer ${tokens.accessToken}`;
    }
    
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "上传失败");
    }
    
    return data;
  },
};
