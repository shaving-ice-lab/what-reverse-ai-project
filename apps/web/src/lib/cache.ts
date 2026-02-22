/**
 * Cache Policy Configuration
 *
 * Cache policies used with TanStack Query
 */

// ===== Cache Time Constants (ms) =====
export const CACHE_TIMES = {
  // Real-time data (no cache)
  INSTANT: 0,
  // Short cache (1 min) - Frequently changing data
  SHORT: 1 * 60 * 1000,
  // Medium cache (5 min) - Default
  MEDIUM: 5 * 60 * 1000,
  // Long cache (30 min) - Infrequently changing data
  LONG: 30 * 60 * 1000,
  // Persistent cache (1 h) - Rarely changing data
  PERSISTENT: 60 * 60 * 1000,
  // Permanent cache - Static data
  FOREVER: Infinity,
}

