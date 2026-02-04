/**
 * System API client for Admin console.
 */

import { api } from "@/lib/api";
import type {
  DeploymentInfo,
  ErrorCodeDefinition,
  FeatureFlags,
  SystemHealth,
  CapacityOverview,
  CapacityMetric,
  CapacityAlert,
  QuotaRule,
} from "@/types/system";

type FeatureFlagsRaw = {
  workspace_enabled?: boolean;
  app_runtime_enabled?: boolean;
  domain_enabled?: boolean;
  WorkspaceEnabled?: boolean;
  AppRuntimeEnabled?: boolean;
  DomainEnabled?: boolean;
};

const normalizeFeatureFlags = (raw?: FeatureFlagsRaw | null): FeatureFlags => ({
  workspaceEnabled: Boolean(raw?.workspace_enabled ?? raw?.WorkspaceEnabled),
  appRuntimeEnabled: Boolean(raw?.app_runtime_enabled ?? raw?.AppRuntimeEnabled),
  domainEnabled: Boolean(raw?.domain_enabled ?? raw?.DomainEnabled),
});

type DeploymentRaw = {
  region?: string;
  primary_region?: string;
  regions?: string[];
  region_base_urls?: Record<string, string>;
  Region?: string;
  PrimaryRegion?: string;
  Regions?: string[];
  RegionBaseURLs?: Record<string, string>;
};

const normalizeDeployment = (raw?: DeploymentRaw | null): DeploymentInfo => ({
  region: String(raw?.region ?? raw?.Region ?? ""),
  primary_region: String(raw?.primary_region ?? raw?.PrimaryRegion ?? ""),
  regions: (raw?.regions ?? raw?.Regions ?? []) as string[],
  region_base_urls: (raw?.region_base_urls ?? raw?.RegionBaseURLs ?? {}) as Record<
    string,
    string
  >,
});

export const systemApi = {
  getHealth() {
    return api.get<SystemHealth[]>("/system/health");
  },

  async getFeatures(): Promise<FeatureFlags> {
    const data = await api.get<{ features?: FeatureFlagsRaw }>("/system/features");
    return normalizeFeatureFlags(data.features);
  },

  async updateFeatures(input: {
    workspace_enabled?: boolean;
    app_runtime_enabled?: boolean;
    domain_enabled?: boolean;
  }): Promise<FeatureFlags> {
    const data = await api.patch<{ features?: FeatureFlagsRaw }>("/admin/system/features", input);
    return normalizeFeatureFlags(data.features);
  },

  async getDeployment(): Promise<DeploymentInfo> {
    const data = await api.get<{ deployment?: DeploymentRaw }>("/system/deployment");
    return normalizeDeployment(data.deployment);
  },

  async getErrorCodes(): Promise<ErrorCodeDefinition[]> {
    const data = await api.get<{ codes?: ErrorCodeDefinition[] }>("/system/error-codes");
    return data.codes || [];
  },

  // Capacity & Quota APIs
  async getCapacityOverview(): Promise<CapacityOverview> {
    return api.get<CapacityOverview>("/admin/system/capacity");
  },

  async getCapacityMetrics(): Promise<CapacityMetric[]> {
    const data = await api.get<{ metrics: CapacityMetric[] }>("/admin/system/capacity/metrics");
    return data.metrics || [];
  },

  async getCapacityAlerts(): Promise<CapacityAlert[]> {
    const data = await api.get<{ alerts: CapacityAlert[] }>("/admin/system/capacity/alerts");
    return data.alerts || [];
  },

  async acknowledgeAlert(alertId: string): Promise<CapacityAlert> {
    return api.post<CapacityAlert>(`/admin/system/capacity/alerts/${alertId}/acknowledge`);
  },

  async getQuotaRules(): Promise<QuotaRule[]> {
    const data = await api.get<{ rules: QuotaRule[] }>("/admin/system/capacity/rules");
    return data.rules || [];
  },

  async updateQuotaRule(ruleId: string, input: Partial<QuotaRule>): Promise<QuotaRule> {
    return api.patch<QuotaRule>(`/admin/system/capacity/rules/${ruleId}`, input);
  },

  async createQuotaRule(input: Omit<QuotaRule, "id" | "created_at" | "updated_at">): Promise<QuotaRule> {
    return api.post<QuotaRule>("/admin/system/capacity/rules", input);
  },
};
