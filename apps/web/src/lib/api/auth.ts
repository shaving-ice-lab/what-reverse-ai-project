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
} from "@/types/auth";

import { request, API_BASE_URL } from "./shared";

// afterendpointResponseFormat(snake_case)
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
 * Authentication API
 */
export const authApi = {
 /**
 * UserSign In
 */
 async login(data: LoginRequest): Promise<LoginResponse> {
 const response = await request<BackendAuthResponse>("/auth/login", {
 method: "POST",
 body: JSON.stringify(data),
 });
 
 // ConvertafterendpointResponseFormatasbeforeendpointExpect'sFormat
 return {
 success: response.success,
 user: response.data.user,
 tokens: {
 accessToken: response.data.access_token,
 refreshToken: response.data.refresh_token,
 expiresIn: 900, // 15 min = 900 s
 },
 };
 },

 /**
 * UserSign Up
 */
 async register(data: RegisterRequest): Promise<RegisterResponse> {
 const response = await request<BackendAuthResponse>("/auth/register", {
 method: "POST",
 body: JSON.stringify(data),
 });
 
 return {
 success: response.success,
 message: "Sign UpSuccess",
 user: {
 id: response.data.user.id,
 email: response.data.user.email,
 },
 };
 },

 /**
 * RefreshToken
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
 * Sign Out
 */
 async logout(): Promise<void> {
 return request<void>("/auth/logout", {
 method: "POST",
 });
 },

 /**
 * Forgot Password
 */
 async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
 return request<{ message: string }>("/auth/forgot-password", {
 method: "POST",
 body: JSON.stringify(data),
 });
 },

 /**
 * Reset Password
 */
 async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
 return request<{ message: string }>("/auth/reset-password", {
 method: "POST",
 body: JSON.stringify(data),
 });
 },

 /**
 * VerifyEmail
 */
 async verifyEmail(token: string): Promise<{ message: string }> {
 return request<{ message: string }>(`/auth/verify-email?token=${token}`, {
 method: "GET",
 });
 },

 /**
 * re-VerifyEmail
 */
 async resendVerification(): Promise<{ message: string }> {
 return request<{ message: string }>("/auth/resend-verification", {
 method: "POST",
 });
 },

 /**
 * OAuth Sign In
 */
 getOAuthUrl(provider: OAuthProvider): string {
 return `${API_BASE_URL}/auth/oauth/${provider}`;
 },
};

/**
 * User API
 */
export const userApi = {
 /**
 * FetchCurrentUser
 */
 async getCurrentUser(): Promise<User> {
 const response = await request<BackendUserResponse>("/users/me");
 return response.data;
 },

 /**
 * UpdateUserMaterials
 */
 async updateProfile(data: UpdateProfileRequest): Promise<User> {
 return request<User>("/users/me", {
 method: "PATCH",
 body: JSON.stringify(data),
 });
 },

 /**
 * EditPassword
 */
 async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
 return request<{ message: string }>("/users/me/password", {
 method: "PUT",
 body: JSON.stringify(data),
 });
 },

 /**
 * UploadAvatar
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
 throw new Error(data.error?.message || "UploadFailed");
 }
 
 return data;
 },
};
