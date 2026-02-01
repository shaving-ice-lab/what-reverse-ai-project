"use client";

/**
 * 认证状态管理
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, AuthTokens, LoginRequest, RegisterRequest } from "@/types/auth";
import { authApi, userApi } from "@/lib/api/auth";

interface AuthState {
  // 状态
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // 操作
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  setUser: (user: User) => void;
  updateUser: (user: Partial<User>) => void;
  clearError: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,
      
      // 初始化 (从 localStorage 恢复状态)
      initialize: async () => {
        const { tokens, isInitialized } = get();
        
        if (isInitialized) return;
        
        set({ isLoading: true });
        
        try {
          if (tokens?.accessToken) {
            // 尝试获取当前用户信息
            const user = await userApi.getCurrentUser();
            set({
              user,
              isAuthenticated: true,
              isInitialized: true,
              isLoading: false,
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
            });
          }
        } catch (error) {
          // Token 可能已过期，尝试刷新
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
            // 刷新失败，清除状态
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
      
      // 登录
      login: async (data: LoginRequest) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.login(data);
          
          set({
            user: response.user,
            tokens: response.tokens,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          });
          // Zustand persist 会自动将 tokens 保存到 localStorage
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "登录失败",
          });
          throw error;
        }
      },
      
      // 注册
      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null });
        
        try {
          await authApi.register(data);
          set({ isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "注册失败",
          });
          throw error;
        }
      },
      
      // 登出
      logout: async () => {
        set({ isLoading: true });
        
        try {
          await authApi.logout();
        } catch {
          // 即使 API 调用失败也清除本地状态
        }
        
        // 清除状态（重置 isInitialized 以便下次可以重新初始化）
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: false,
        });
        // Zustand persist 会自动将 tokens: null 保存到 localStorage
      },
      
      // 刷新 Token
      refreshToken: async () => {
        const { tokens } = get();
        
        if (!tokens?.refreshToken) {
          throw new Error("No refresh token");
        }
        
        try {
          const response = await authApi.refreshToken(tokens.refreshToken);
          
          set({
            tokens: response.tokens,
          });
          // Zustand persist 会自动更新 localStorage
        } catch (error) {
          // 刷新失败，登出用户
          await get().logout();
          throw error;
        }
      },
      
      // 获取当前用户
      fetchCurrentUser: async () => {
        set({ isLoading: true });
        
        try {
          const user = await userApi.getCurrentUser();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "获取用户信息失败",
          });
          throw error;
        }
      },
      
      // 设置用户信息 (完全替换)
      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },
      
      // 更新用户信息 (部分更新)
      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },
      
      // 清除错误
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
