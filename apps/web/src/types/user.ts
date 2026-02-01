/**
 * 用户相关类型定义
 */

// ===== 用户实体 =====

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  
  // OAuth 关联
  githubId: string | null;
  googleId: string | null;
  
  // 统计
  workflowCount: number;
  agentCount: number;
  followerCount: number;
  followingCount: number;
  
  // 订阅
  plan: UserPlan;
  planExpiresAt: string | null;
  
  // 设置
  settings: UserSettings;
  
  // 时间
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export type UserPlan = "free" | "pro" | "enterprise";

export interface UserSettings {
  theme: "light" | "dark" | "system";
  language: "zh-CN" | "en-US";
  defaultModel: string;
  notifications: {
    email: boolean;
    browser: boolean;
    executionComplete: boolean;
    executionFailed: boolean;
    weeklyDigest: boolean;
  };
  privacy: {
    showActivity: boolean;
    showWorkflows: boolean;
  };
}

// ===== API 密钥 =====

export interface ApiKey {
  id: string;
  userId: string;
  provider: ApiKeyProvider;
  name: string;
  keyPreview: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ApiKeyProvider =
  | "openai"
  | "anthropic"
  | "google"
  | "azure"
  | "ollama"
  | "custom";

// ===== 认证相关 =====

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ===== 用户操作 =====

export interface UpdateUserRequest {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  settings?: Partial<UserSettings>;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface CreateApiKeyRequest {
  provider: ApiKeyProvider;
  name: string;
  key: string;
}
