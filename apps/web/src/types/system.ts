/**
 * SystemRelatedTypeDefinition
 */

/**
 * SystemHealthStatus
 */
export interface SystemHealth {
 /** ServiceName */
 name: string;
 /** Status: healthy, degraded, down */
 status: "healthy" | "degraded" | "down";
 /** Latency (s) */
 latency_ms: number;
 /** Icon */
 icon?: string;
}

/**
 * SystemAnnouncement
 */
export interface Announcement {
 /** Announcement ID */
 id: string;
 /** Title */
 title: string;
 /** Description */
 description: string;
 /** Type: feature, improvement, notice, warning */
 type: "feature" | "improvement" | "notice" | "warning";
 /** isnoalreadyread */
 is_read?: boolean;
 /** Created At */
 created_at: string;
}

/**
 * Format'sSystemHealthStatus(Used forbeforeendpointDisplay)
 */
export interface FormattedSystemHealth {
 name: string;
 status: "healthy" | "degraded" | "down";
 latency: string;
 icon: React.ComponentType<{ className?: string }>;
}
