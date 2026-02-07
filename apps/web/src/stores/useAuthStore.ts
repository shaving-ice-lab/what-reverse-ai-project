"use client";

/**
 * AuthenticationStatusManage
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, AuthTokens, LoginRequest, RegisterRequest } from "@/types/auth";
import { authApi, userApi } from "@/lib/api/auth";

interface AuthState {
 // Status
 user: User | null;
 tokens: AuthTokens | null;
 isAuthenticated: boolean;
 isLoading: boolean;
 isInitialized: boolean;
 error: string | null;
 
 // Action
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
 // InitialStatus
 user: null,
 tokens: null,
 isAuthenticated: false,
 isLoading: false,
 isInitialized: false,
 error: null,
 
 // Initial (from localStorage RestoreStatus)
 initialize: async () => {
 const { tokens, isInitialized } = get();
 
 if (isInitialized) return;
 
 set({ isLoading: true });
 
 try {
 if (tokens?.accessToken) {
 // TryFetchCurrentUserInfo
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
 // Token cancanExpired, TryRefresh
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
 // RefreshFailed, ClearStatus
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
 
 // Sign In
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
 // Zustand persist willAutowill tokens Saveto localStorage
 } catch (error) {
 set({
 isLoading: false,
 error: error instanceof Error ? error.message: "Sign InFailed",
 });
 throw error;
 }
 },
 
 // Sign Up
 register: async (data: RegisterRequest) => {
 set({ isLoading: true, error: null });
 
 try {
 await authApi.register(data);
 set({ isLoading: false });
 } catch (error) {
 set({
 isLoading: false,
 error: error instanceof Error ? error.message: "Sign UpFailed",
 });
 throw error;
 }
 },
 
 // Sign Out
 logout: async () => {
 set({ isLoading: true });
 
 try {
 await authApi.logout();
 } catch {
 // nowmake API CallFailedalsoClearLocalStatus
 }
 
 // ClearStatus(Reset isInitialized withdowntimescanwithre-newInitial)
 set({
 user: null,
 tokens: null,
 isAuthenticated: false,
 isLoading: false,
 isInitialized: false,
 });
 // Zustand persist willAutowill tokens: null Saveto localStorage
 },
 
 // Refresh Token
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
 // Zustand persist willAutoUpdate localStorage
 } catch (error) {
 // RefreshFailed, Sign OutUser
 await get().logout();
 throw error;
 }
 },
 
 // FetchCurrentUser
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
 error: error instanceof Error ? error.message: "FetchUserInfoFailed",
 });
 throw error;
 }
 },
 
 // SettingsUserInfo (completeallReplace)
 setUser: (user: User) => {
 set({ user, isAuthenticated: true });
 },
 
 // UpdateUserInfo (PartialUpdate)
 updateUser: (userData: Partial<User>) => {
 const { user } = get();
 if (user) {
 set({ user: { ...user, ...userData } });
 }
 },
 
 // ClearError
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
