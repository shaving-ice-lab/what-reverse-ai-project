/**
 * System Related Type Definition
 */

/**
 * System Health Status
 */
export interface SystemHealth {
  /** Service Name */
  name: string
  /** Status: healthy, degraded, down */
  status: 'healthy' | 'degraded' | 'down'
  /** Latency (ms) */
  latency_ms: number
  /** Icon */
  icon?: string
}

/**
 * System Announcement
 */
export interface Announcement {
  /** Announcement ID */
  id: string
  /** Title */
  title: string
  /** Description */
  description: string
  /** Type: feature, improvement, notice, warning */
  type: 'feature' | 'improvement' | 'notice' | 'warning'
  /** Whether already read */
  is_read?: boolean
  /** Created At */
  created_at: string
}

/**
 * Formatted System Health Status (Used for Frontend Display)
 */
export interface FormattedSystemHealth {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  latency: string
  icon: React.ComponentType<{ className?: string }>
}
