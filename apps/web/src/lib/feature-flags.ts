/**
 * Feature flags
 * - ENV: NEXT_PUBLIC_ENABLE_LOCAL_MODE / NEXT_PUBLIC_ENABLE_ANALYTICS
 * - ENV: NEXT_PUBLIC_FEATURE_FLAGS (JSON or comma list)
 * - localStorage override: feature_flags_overrides
 */

export type FeatureFlagKey = 'local_mode' | 'analytics'

const DEFAULT_FLAGS: Record<FeatureFlagKey, boolean> = {
  local_mode: process.env.NEXT_PUBLIC_ENABLE_LOCAL_MODE === 'true',
  analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
}

const STORAGE_KEY = 'feature_flags_overrides'

const parseFlagValue = (value: string | boolean | number | undefined) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value > 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true
    if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false
  }
  return undefined
}

const parseFeatureFlagsEnv = (): Record<string, boolean> => {
  const raw = process.env.NEXT_PUBLIC_FEATURE_FLAGS
  if (!raw) return {}

  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.reduce<Record<string, boolean>>((acc, flag) => {
        if (typeof flag === 'string') acc[flag] = true
        return acc
      }, {})
    }
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed).reduce<Record<string, boolean>>((acc, [key, value]) => {
        const normalized = parseFlagValue(value as string | boolean | number | undefined)
        if (normalized !== undefined) acc[key] = normalized
        return acc
      }, {})
    }
  } catch {
    return raw.split(',').reduce<Record<string, boolean>>((acc, item) => {
      const key = item.trim()
      if (key) acc[key] = true
      return acc
    }, {})
  }

  return {}
}

const readOverrides = (): Record<string, boolean> => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed).reduce<Record<string, boolean>>((acc, [key, value]) => {
        const normalized = parseFlagValue(value as string | boolean | number | undefined)
        if (normalized !== undefined) acc[key] = normalized
        return acc
      }, {})
    }
  } catch {
    // ignore
  }
  return {}
}

export const getFeatureFlags = (): Record<string, boolean> => {
  return {
    ...DEFAULT_FLAGS,
    ...parseFeatureFlagsEnv(),
    ...readOverrides(),
  }
}

export const isFeatureEnabled = (flag: FeatureFlagKey | string): boolean => {
  return Boolean(getFeatureFlags()[flag])
}

export const setFeatureFlagOverride = (flag: FeatureFlagKey | string, enabled: boolean) => {
  if (typeof window === 'undefined') return
  const overrides = readOverrides()
  overrides[flag] = enabled
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
}

export const clearFeatureFlagOverrides = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
