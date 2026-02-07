"use client";

import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { RefreshCcw, Server, SlidersHorizontal } from "lucide-react";
import {
  FormRow,
  PageContainer,
  PageHeader,
  SettingsSection,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { systemApi } from "@/lib/api/system";
import { isLocalModeEnabled } from "@/lib/env";
import { featureFlags as featureFlagsMock, systemHealth } from "@/lib/mock-data";

export default function SystemHealthPage() {
  const localMode = isLocalModeEnabled();

  const healthQuery = useQuery({
    queryKey: ["system", "health"],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => systemApi.getHealth(),
  });

  const featuresQuery = useQuery({
    queryKey: ["system", "features"],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => systemApi.getFeatures(),
  });

  const healthItems = useMemo(() => {
    if (localMode) {
      return systemHealth.map((item) => ({
        name: item.label,
        status: item.status === "healthy" ? "healthy" : "degraded",
        detail: item.detail,
      }));
    }
    return (healthQuery.data || []).map((item) => ({
      name: item.name,
      status: item.status,
      detail: item.latency_ms ? `Latency ${item.latency_ms}ms` : "-",
    }));
  }, [healthQuery.data, localMode]);

  const featureFlags = localMode
    ? featureFlagsMock
    : featuresQuery.data || {
        workspaceEnabled: true,
        workspaceRuntimeEnabled: true,
        domainEnabled: true,
      };

  const isRefreshing = healthQuery.isFetching || featuresQuery.isFetching;

  return (
    <PageContainer>
      <PageHeader
        title="System Health"
        description="Monitor critical service availability and performance metrics."
        icon={<Server className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              loading={isRefreshing}
              loadingText="Refreshing..."
              leftIcon={<RefreshCcw className="w-4 h-4" />}
              onClick={() => {
                healthQuery.refetch();
                featuresQuery.refetch();
              }}
              disabled={localMode}
            >
              Refresh Status
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/system/deployment">View Deployment</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/system/features">Manage Flags</Link>
            </Button>
          </div>
        }
      />

      <SettingsSection title="Core Services" description="Overview of critical service statuses.">
        {healthQuery.isPending && !localMode ? (
          <div className="text-[12px] text-foreground-muted">Loading...</div>
        ) : healthItems.length === 0 ? (
          <div className="text-[12px] text-foreground-muted">No health data available</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {healthItems.map((item) => {
              const variant =
                item.status === "healthy"
                  ? "success"
                  : item.status === "down"
                  ? "error"
                  : "warning";
              const label =
                item.status === "healthy"
                  ? "Healthy"
                  : item.status === "down"
                  ? "Down"
                  : "Warning";
              return (
                <div
                  key={item.name}
                  className="rounded-lg border border-border bg-surface-75 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[12px] font-medium text-foreground">
                      {item.name}
                    </div>
                    <Badge variant={variant} size="sm">
                      {label}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-foreground-light mt-1">
                    {item.detail}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SettingsSection>

      <SettingsSection
        title="Feature Flags"
        description="System capabilities enabled in the current environment."
      >
        <div className="space-y-1">
          <FormRow
            label="Workspace Features"
            description="Workspace creation and member management"
          >
            <Badge variant={featureFlags.workspaceEnabled ? "success" : "secondary"} size="sm">
              {featureFlags.workspaceEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </FormRow>
          <FormRow
            label="Workspace Runtime"
            description="Application runtime and online execution endpoint"
          >
            <Badge variant={featureFlags.workspaceRuntimeEnabled ? "success" : "secondary"} size="sm">
              {featureFlags.workspaceRuntimeEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </FormRow>
          <FormRow
            label="Domain Binding"
            description="Custom domain and certificate management"
          >
            <Badge variant={featureFlags.domainEnabled ? "success" : "secondary"} size="sm">
              {featureFlags.domainEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </FormRow>
          <div className="text-[11px] text-foreground-muted flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            This is a read-only view. Go to the Feature Flags page to make changes.
          </div>
        </div>
      </SettingsSection>
    </PageContainer>
  );
}
