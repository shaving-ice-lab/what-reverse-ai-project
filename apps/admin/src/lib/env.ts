/**
 * Admin frontend environment configuration
 * Centralize API/WS endpoints and environment profile.
 */

import { z } from "zod";

export type AppEnvironment = "local" | "development" | "staging" | "production";

const ENV_ALIASES: Record<string, AppEnvironment> = {
  local: "local",
  dev: "development",
  development: "development",
  staging: "staging",
  stage: "staging",
  prod: "production",
  production: "production",
};

const resolveAppEnv = (): AppEnvironment => {
  const raw = (process.env.NEXT_PUBLIC_APP_ENV ||
    process.env.NEXT_PUBLIC_ENV ||
    process.env.NODE_ENV ||
    "development") as string;
  const normalized = raw.toLowerCase();
  return ENV_ALIASES[normalized] || "development";
};

const APP_ENV = resolveAppEnv();

const ENV_SUFFIX: Record<AppEnvironment, string> = {
  local: "LOCAL",
  development: "DEV",
  staging: "STAGING",
  production: "PROD",
};

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_URL_DEV: z.string().url().optional(),
  NEXT_PUBLIC_API_URL_STAGING: z.string().url().optional(),
  NEXT_PUBLIC_API_URL_PROD: z.string().url().optional(),
  NEXT_PUBLIC_WS_URL: z.string().optional(),
  NEXT_PUBLIC_WS_URL_DEV: z.string().optional(),
  NEXT_PUBLIC_WS_URL_STAGING: z.string().optional(),
  NEXT_PUBLIC_WS_URL_PROD: z.string().optional(),
  NEXT_PUBLIC_RUNTIME_BASE_URL: z.string().optional(),
  NEXT_PUBLIC_ENABLE_LOCAL_MODE: z.string().optional(),
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.string().optional(),
  NEXT_PUBLIC_FEATURE_FLAGS: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues.map((issue) => issue.message).join("; ");
  throw new Error(`Admin env validation failed: ${issues}`);
}

const resolveRequired = (label: string, value?: string) => {
  if (!value) {
    throw new Error(`Admin env missing ${label}. Please set it in apps/admin/.env`);
  }
  return value;
};

const resolveApiBaseUrl = () => {
  const explicit = parsedEnv.data.NEXT_PUBLIC_API_URL;
  if (explicit) return explicit;
  const envKey = ENV_SUFFIX[APP_ENV];
  const apiKey = `NEXT_PUBLIC_API_URL_${envKey}` as keyof typeof parsedEnv.data;
  const envValue = parsedEnv.data[apiKey];
  return resolveRequired(`NEXT_PUBLIC_API_URL_${envKey}`, envValue);
};

const resolveWsBaseUrl = () => {
  const explicit = parsedEnv.data.NEXT_PUBLIC_WS_URL;
  if (explicit) return explicit;
  const envKey = ENV_SUFFIX[APP_ENV];
  const wsKey = `NEXT_PUBLIC_WS_URL_${envKey}` as keyof typeof parsedEnv.data;
  const envValue = parsedEnv.data[wsKey];
  return resolveRequired(`NEXT_PUBLIC_WS_URL_${envKey}`, envValue);
};

const resolveRuntimeBaseUrl = () => {
  const explicit = parsedEnv.data.NEXT_PUBLIC_RUNTIME_BASE_URL;
  if (explicit) return explicit;
  return resolveApiBaseUrl().replace(/\/api\/v1\/?$/, "");
};

export const ENV_CONFIG = {
  appEnv: APP_ENV,
  apiBaseUrl: resolveApiBaseUrl(),
  wsBaseUrl: resolveWsBaseUrl(),
  runtimeBaseUrl: resolveRuntimeBaseUrl(),
};

export const getApiBaseUrl = () => ENV_CONFIG.apiBaseUrl;
export const getWsBaseUrl = () => ENV_CONFIG.wsBaseUrl;
export const getRuntimeBaseUrl = () => ENV_CONFIG.runtimeBaseUrl;
export const getAppEnv = () => ENV_CONFIG.appEnv;

export const isLocalModeEnabled = () => {
  const raw = (process.env.NEXT_PUBLIC_ENABLE_LOCAL_MODE || "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
};
