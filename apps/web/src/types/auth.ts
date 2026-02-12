/**
 * AuthenticationRelatedTypeDefinition
 */

// UserInfo
export interface User {
  id: string
  email: string
  username: string
  display_name?: string
  bio?: string
  avatar_url?: string
  role: UserRole
  email_verified: boolean
  status?: string
  settings?: UserPreferences
  plan?: string
  plan_expires_at?: string
  created_at: string
  updated_at: string
  last_login_at?: string
}

// UserRole
export type UserRole = 'user' | 'admin' | 'creator'

// Sign InRequest
export interface LoginRequest {
  email: string
  password: string
  remember?: boolean
}

// Sign InResponse
export interface LoginResponse {
  success: boolean
  user: User
  tokens: AuthTokens
}

// Sign UpRequest
export interface RegisterRequest {
  email: string
  password: string
  username: string
}

// Sign UpResponse
export interface RegisterResponse {
  success: boolean
  message: string
  user: {
    id: string
    email: string
  }
}

// AuthenticationToken
export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

// AuthenticationStatus
export interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// RefreshTokenRequest
export interface RefreshTokenRequest {
  refreshToken: string
}

// RefreshTokenResponse
export interface RefreshTokenResponse {
  success: boolean
  tokens: AuthTokens
}

// PasswordResetRequest
export interface ForgotPasswordRequest {
  email: string
}

// PasswordResetResponse
export interface ResetPasswordRequest {
  token: string
  password: string
}

// OAuth Provider
export type OAuthProvider = 'github' | 'google' | 'microsoft'

// UserPreferences
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system'
  language?: string
  notifications?: {
    appBuildComplete?: boolean
    appBuildError?: boolean
    systemUpdates?: boolean
    weeklyDigest?: boolean
  }
  performance?: {
    autoSave?: boolean
    animations?: boolean
    compactMode?: boolean
  }
}

// UpdateUserMaterials
export interface UpdateProfileRequest {
  username?: string
  display_name?: string
  bio?: string
  avatar_url?: string
  settings?: UserPreferences
}

// EditPassword
export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}
