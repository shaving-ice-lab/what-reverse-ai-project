"use client";

/**
 * Authentication State Management
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
 // Initial state
 user: null,
 tokens: null,
 isAuthenticated: false,
 isLoading: false,
 isInitialized: false,
 error: null,
 
 // Initialize (restore state from localStorage)
 initialize: async () => {
 const { tokens, isInitialized } = get();
 
 if (isInitialized) return;
 
 set({ isLoading: true });
 
 try {
 if (tokens?.accessToken) {
 // Try to fetch current user info
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
 // Token may have expired, try refreshing
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
 // Refresh failed, clear state
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
 
 // Sign in
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
 // Zustand persist will automatically save tokens to localStorage
 } catch (error) {
 set({
 isLoading: false,
      error: error instanceof Error ? error.message : "Failed to sign in",
 });
 throw error;
 }
 },
 
 // Sign up
 register: async (data: RegisterRequest) => {
 set({ isLoading: true, error: null });
 
 try {
 await authApi.register(data);
 set({ isLoading: false });
 } catch (error) {
 set({
 isLoading: false,
      error: error instanceof Error ? error.message : "Failed to sign up",
 });
 throw error;
 }
 },
 
 // Sign out
 logout: async () => {
 set({ isLoading: true });
 
 try {
 await authApi.logout();
 } catch {
 // Even if API call fails, still clear local state
 }
 
 // Clear state (reset isInitialized so it can be re-initialized next time)
 set({
 user: null,
 tokens: null,
 isAuthenticated: false,
 isLoading: false,
 isInitialized: false,
 });
 // Zustand persist will automatically save tokens: null to localStorage
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
 // Zustand persist will automatically update localStorage
 } catch (error) {
 // Refresh failed, sign out user
 await get().logout();
 throw error;
 }
 },
 
 // Fetch current user
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
 error: error instanceof Error ? error.message : "Failed to fetch user info",
 });
 throw error;
 }
 },
 
 // Set user info (full replacement)
 setUser: (user: User) => {
 set({ user, isAuthenticated: true });
 },
 
 // Update user info (partial update)
 updateUser: (userData: Partial<User>) => {
 const { user } = get();
 if (user) {
 set({ user: { ...user, ...userData } });
 }
 },
 
 // Clear error
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
