/**
 * Authentication API Service
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
} from '@/types/auth'

import { request, API_BASE_URL } from './shared'
import { getStoredTokens } from './client'

// Backend response format (snake_case)
interface BackendAuthResponse {
  success: boolean
  data: {
    access_token: string
    refresh_token: string
    user: User
  }
}

interface BackendRefreshResponse {
  success: boolean
  data: {
    access_token: string
    refresh_token: string
  }
}

interface BackendUserResponse {
  success: boolean
  data: User
}

/**
 * Authentication API
 */
export const authApi = {
  /**
   * User sign in
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await request<BackendAuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    // Convert backend response format to frontend-friendly format
    return {
      success: response.success,
      user: response.data.user,
      tokens: {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: 900, // 15 min = 900 s
      },
    }
  },

  /**
   * User sign up
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await request<BackendAuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    return {
      success: response.success,
      message: 'Registration successful',
      user: {
        id: response.data.user.id,
        email: response.data.user.email,
      },
    }
  },

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await request<BackendRefreshResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    return {
      success: true,
      tokens: {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: 900,
      },
    }
  },

  /**
   * Sign out
   */
  async logout(): Promise<void> {
    return request<void>('/auth/logout', {
      method: 'POST',
    })
  },

  /**
   * Forgot password
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    return request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Reset password
   */
  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    return request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    return request<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
  },

  /**
   * Resend verification email
   */
  async resendVerification(): Promise<{ message: string }> {
    return request<{ message: string }>('/auth/resend-verification', {
      method: 'POST',
    })
  },

  /**
   * OAuth sign in
   */
  getOAuthUrl(provider: OAuthProvider): string {
    return `${API_BASE_URL}/auth/oauth/${provider}`
  },
}

/**
 * User API
 */
export const userApi = {
  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User> {
    const response = await request<BackendUserResponse>('/users/me')
    return response.data
  },

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    return request<User>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    return request<{ message: string }>('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

}
