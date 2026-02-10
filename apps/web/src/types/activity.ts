/**
 * User Activity Related Type Definition
 */

/**
 * User Activity Record
 */
export interface UserActivity {
  /** Activity ID */
  id: string
  /** Action Type */
  action: string
  /** Related Entity Type */
  entity_type?: string
  /** Related Entity ID */
  entity_id?: string
  /** Device Information */
  device?: string
  /** IP Address */
  ip?: string
  /** Location */
  location?: string
  /** Created At */
  created_at: string
}

/**
 * Formatted Activity Record (Used for Frontend Display)
 */
export interface FormattedActivity {
  id: string
  action: string
  target?: string
  device: string
  time: string
}
