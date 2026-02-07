/**
 * AuthenticationRelatedTypeDefinition
 */

// UserInfo
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

// UserRole
export type UserRole = "user" | "admin" | "creator";

// Sign InRequest
export interface LoginRequest {
 email: string;
 password: string;
 remember?: boolean;
}

// Sign InResponse
export interface LoginResponse {
 success: boolean;
 user: User;
 tokens: AuthTokens;
}

// Sign UpRequest
export interface RegisterRequest {
 email: string;
 password: string;
 username: string;
}

// Sign UpResponse
export interface RegisterResponse {
 success: boolean;
 message: string;
 user: {
 id: string;
 email: string;
 };
}

// AuthenticationToken
export interface AuthTokens {
 accessToken: string;
 refreshToken: string;
 expiresIn: number;
}

// AuthenticationStatus
export interface AuthState {
 user: User | null;
 tokens: AuthTokens | null;
 isAuthenticated: boolean;
 isLoading: boolean;
 error: string | null;
}

// RefreshTokenRequest
export interface RefreshTokenRequest {
 refreshToken: string;
}

// RefreshTokenResponse
export interface RefreshTokenResponse {
 success: boolean;
 tokens: AuthTokens;
}

// PasswordResetRequest
export interface ForgotPasswordRequest {
 email: string;
}

// PasswordResetResponse
export interface ResetPasswordRequest {
 token: string;
 password: string;
}

// OAuth Provider
export type OAuthProvider = "github" | "google";

// UserPreferences
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

// UpdateUserMaterials
export interface UpdateProfileRequest {
 username?: string;
 displayName?: string;
 bio?: string;
 avatar?: string;
 preferences?: UserPreferences;
}

// EditPassword
export interface ChangePasswordRequest {
 currentPassword: string;
 newPassword: string;
}
