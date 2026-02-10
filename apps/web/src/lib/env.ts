/**
 * Frontend environment configuration
 * Centralize API/WS endpoints and environment profile.
 */

export type AppEnvironment = 'local' | 'development' | 'staging' | 'production'

const DEFAULT_API_BASE_URL = 'http://localhost:8080/api/v1'
const DEFAULT_WS_BASE_URL = 'ws://localhost:8080/ws'

const ENV_ALIASES: Record<string, AppEnvironment> = {
  local: 'local',
  dev: 'development',
  development: 'development',
  staging: 'staging',
  stage: 'staging',
  prod: 'production',
  production: 'production',
}

const resolveAppEnv = (): AppEnvironment => {
  const raw = (process.env.NEXT_PUBLIC_APP_ENV ||
    process.env.NEXT_PUBLIC_ENV ||
    process.env.NODE_ENV ||
    'development') as string
  const normalized = raw.toLowerCase()
  return ENV_ALIASES[normalized] || 'development'
}

const APP_ENV = resolveAppEnv()

const ENV_SUFFIX: Record<AppEnvironment, string> = {
  local: 'LOCAL',
  development: 'DEV',
  staging: 'STAGING',
  production: 'PROD',
}

const resolveApiBaseUrl = () => {
  const explicit = process.env.NEXT_PUBLIC_API_URL
  if (explicit) return explicit
  const envKey = ENV_SUFFIX[APP_ENV]
  const envValue = process.env[`NEXT_PUBLIC_API_URL_${envKey}`]
  return envValue || DEFAULT_API_BASE_URL
}

const resolveWsBaseUrl = () => {
  const explicit = process.env.NEXT_PUBLIC_WS_URL
  if (explicit) return explicit
  const envKey = ENV_SUFFIX[APP_ENV]
  const envValue = process.env[`NEXT_PUBLIC_WS_URL_${envKey}`]
  return envValue || DEFAULT_WS_BASE_URL
}

const resolveRuntimeBaseUrl = () => {
  const explicit = process.env.NEXT_PUBLIC_RUNTIME_BASE_URL
  if (explicit) return explicit
  return resolveApiBaseUrl().replace(/\/api\/v1\/?$/, '')
}

export const ENV_CONFIG = {
  appEnv: APP_ENV,
  apiBaseUrl: resolveApiBaseUrl(),
  wsBaseUrl: resolveWsBaseUrl(),
  runtimeBaseUrl: resolveRuntimeBaseUrl(),
}

export const getApiBaseUrl = () => ENV_CONFIG.apiBaseUrl
export const getWsBaseUrl = () => ENV_CONFIG.wsBaseUrl
export const getRuntimeBaseUrl = () => ENV_CONFIG.runtimeBaseUrl
export const getAppEnv = () => ENV_CONFIG.appEnv
