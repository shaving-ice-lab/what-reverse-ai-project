/**
 * Login Device Related Type Definition
 */

/**
 * Login Device
 */
export interface LoginDevice {
 /** Device/Session ID */
 id: string;
 /** Device Type: desktop, mobile, tablet */
 type: "desktop" | "mobile" | "tablet";
 /** Device Name */
 name: string;
 /** Browser */
 browser: string;
 /** Location */
 location: string;
 /** IP Address (Partially Hidden) */
 ip: string;
 /** Whether this is the current device */
 is_current: boolean;
 /** Last Activity Time */
 last_active: string;
}

/**
 * Formatted Device Information (Used for Frontend Display)
 */
export interface FormattedDevice extends LoginDevice {
 lastActiveFormatted: string;
}
