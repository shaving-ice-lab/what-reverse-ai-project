/**
 * System related types for Admin console.
 */

export interface SystemHealth {
  name: string;
  status: "healthy" | "degraded" | "down" | string;
  latency_ms: number;
  icon?: string;
}

export interface FeatureFlags {
  workspaceEnabled: boolean;
  workspaceRuntimeEnabled: boolean;
  domainEnabled: boolean;
}

export interface DeploymentInfo {
  region: string;
  primary_region: string;
  regions: string[];
  region_base_urls: Record<string, string>;
}

export interface ErrorCodeDefinition {
  code: string;
  http_status: number;
  module: string;
  description: string;
}

/**
 * System capacity and quota types
 */
export type ResourceType = "cpu" | "memory" | "storage" | "database" | "api_calls" | "executions" | "bandwidth";
export type AlertSeverity = "info" | "warning" | "critical";

export interface CapacityMetric {
  id: string;
  resource: ResourceType;
  name: string;
  current_value: number;
  max_value: number;
  unit: string;
  utilization_percent: number;
  trend: "stable" | "increasing" | "decreasing";
  trend_percent?: number;
  last_updated: string;
}

export interface CapacityAlert {
  id: string;
  resource: ResourceType;
  name: string;
  severity: AlertSeverity;
  message: string;
  threshold_percent: number;
  current_percent: number;
  triggered_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
}

export interface QuotaRule {
  id: string;
  resource: ResourceType;
  name: string;
  description?: string;
  threshold_warning: number;
  threshold_critical: number;
  notification_channels: string[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CapacityOverview {
  metrics: CapacityMetric[];
  alerts: CapacityAlert[];
  rules: QuotaRule[];
}
