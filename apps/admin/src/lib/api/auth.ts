/**
 * Admin console auth API
 * Uses the same backend auth endpoints as apps/web.
 */

import type { LoginRequest, User } from "@/types/auth";
import { api } from "@/lib/api";

export interface LoginResult {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export const authApi = {
  async login(payload: LoginRequest): Promise<LoginResult> {
    const data = await api.post<{
      user: User;
      access_token: string;
      refresh_token: string;
    }>("/auth/login", payload);

    return {
      user: data.user,
      tokens: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: 900,
      },
    };
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const data = await api.post<{ access_token: string; refresh_token: string }>(
      "/auth/refresh",
      { refresh_token: refreshToken }
    );

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: 900,
    };
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },
};

export const userApi = {
  async getCurrentUser(): Promise<User> {
    return api.get<User>("/users/me");
  },
};

