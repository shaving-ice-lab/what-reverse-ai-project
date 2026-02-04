"use client";

/**
 * Admin 端认证状态管理
 * - 复用后端 /auth/login /auth/refresh /auth/logout
 * - 复用 localStorage key: auth-storage（与 apps/web 对齐）
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthTokens, LoginRequest, User } from "@/types/auth";
import { authApi, userApi } from "@/lib/api/auth";
import { clearTokens, setTokens } from "@/lib/api";

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,

      initialize: async () => {
        const { tokens, isInitialized } = get();
        if (isInitialized) return;

        set({ isLoading: true });

        try {
          if (tokens?.accessToken) {
            setTokens(tokens.accessToken, tokens.refreshToken);
            const user = await userApi.getCurrentUser();
            set({
              user,
              isAuthenticated: true,
              isInitialized: true,
              isLoading: false,
            });
            return;
          }

          set({
            isInitialized: true,
            isLoading: false,
          });
        } catch {
          try {
            await get().refreshToken();
            const user = await userApi.getCurrentUser();
            set({
              user,
              isAuthenticated: true,
              isInitialized: true,
              isLoading: false,
            });
          } catch {
            clearTokens();
            set({
              user: null,
              tokens: null,
              isAuthenticated: false,
              isInitialized: true,
              isLoading: false,
            });
          }
        }
      },

      login: async (data: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(data);
          setTokens(response.tokens.accessToken, response.tokens.refreshToken);
          set({
            user: response.user,
            tokens: response.tokens,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "登录失败",
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } catch {
          // ignore
        } finally {
          clearTokens();
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: false,
          });
        }
      },

      refreshToken: async () => {
        const { tokens } = get();
        if (!tokens?.refreshToken) {
          throw new Error("No refresh token");
        }

        try {
          const next = await authApi.refreshToken(tokens.refreshToken);
          setTokens(next.accessToken, next.refreshToken);
          set({
            tokens: next,
          });
        } catch (error) {
          await get().logout();
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tokens: state.tokens,
      }),
    }
  )
);

