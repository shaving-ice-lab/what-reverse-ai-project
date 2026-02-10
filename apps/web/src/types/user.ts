/**
 * UserRelatedTypeDefinition
 */

// ===== UserEntity =====

export interface User {
  id: string
  email: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  bio: string | null

  // OAuth Associate
  githubId: string | null
  googleId: string | null

  // Statistics
  workflowCount: number
  agentCount: number
  followerCount: number
  followingCount: number

  // Subscription
  plan: UserPlan
  planExpiresAt: string | null

  // Settings
  settings: UserSettings

  // Time
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
}

export type UserPlan = 'free' | 'pro' | 'enterprise'

export interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  language: 'zh-CN' | 'en-US'
  defaultModel: string
  notifications: {
    email: boolean
    browser: boolean
    executionComplete: boolean
    executionFailed: boolean
    weeklyDigest: boolean
  }
  privacy: {
    showActivity: boolean
    showWorkflows: boolean
  }
}

// ===== API Key =====

export interface ApiKey {
  id: string
  userId: string
  provider: ApiKeyProvider
  name: string
  keyPreview: string
  isActive: boolean
  lastUsedAt: string | null
  createdAt: string
  updatedAt: string
}

export type ApiKeyProvider = 'openai' | 'anthropic' | 'google' | 'azure' | 'ollama' | 'custom'

// ===== AuthenticationRelated =====

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

// ===== UserAction =====

export interface UpdateUserRequest {
  displayName?: string
  bio?: string
  avatarUrl?: string
  settings?: Partial<UserSettings>
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

export interface CreateApiKeyRequest {
  provider: ApiKeyProvider
  name: string
  key: string
}
