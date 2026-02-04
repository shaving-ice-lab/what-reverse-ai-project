/**
 * Admin 端认证相关类型
 * 与后端 JSON 字段保持一致（snake_case）
 */
 
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** 过期秒数（后端当前为 15min=900s） */
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
 
