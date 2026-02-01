/**
 * 认证相关类型定义
 */

// 用户信息
export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  role: UserRole;
  emailVerified: boolean;
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

// 用户角色
export type UserRole = "user" | "admin" | "creator";

// 登录请求
export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

// 登录响应
export interface LoginResponse {
  success: boolean;
  user: User;
  tokens: AuthTokens;
}

// 注册请求
export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

// 注册响应
export interface RegisterResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
  };
}

// 认证令牌
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// 认证状态
export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// 刷新令牌请求
export interface RefreshTokenRequest {
  refreshToken: string;
}

// 刷新令牌响应
export interface RefreshTokenResponse {
  success: boolean;
  tokens: AuthTokens;
}

// 密码重置请求
export interface ForgotPasswordRequest {
  email: string;
}

// 密码重置响应
export interface ResetPasswordRequest {
  token: string;
  password: string;
}

// OAuth 提供商
export type OAuthProvider = "github" | "google";

// 用户偏好设置
export interface UserPreferences {
  theme?: "light" | "dark" | "system";
  language?: string;
  notifications?: {
    workflowComplete?: boolean;
    workflowError?: boolean;
    systemUpdates?: boolean;
    weeklyDigest?: boolean;
  };
  performance?: {
    autoSave?: boolean;
    animations?: boolean;
    compactMode?: boolean;
  };
}

// 更新用户资料
export interface UpdateProfileRequest {
  username?: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  preferences?: UserPreferences;
}

// 修改密码
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
