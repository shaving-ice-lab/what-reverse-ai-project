/**
 * Admin Authentication Related Types
 * Aligned with backend JSON fields (snake_case)
 */
 
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Expiration in seconds (backend currently 15min=900s) */
  expiresIn?: number;
}
 
export interface LoginRequest {
  email: string;
  password: string;
}
 
export interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  email_verified?: boolean;
  settings?: Record<string, unknown>;
  role: string;
  status: string;
  status_reason?: string | null;
  status_updated_at?: string | null;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string | null;
}
 
