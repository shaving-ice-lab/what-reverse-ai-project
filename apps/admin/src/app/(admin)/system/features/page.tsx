"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCcw, SlidersHorizontal } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  SettingsSection,
  StatsCard,
  ToggleRow,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { systemApi } from "@/lib/api/system";
import { isLocalModeEnabled } from "@/lib/env";
import { featureFlags as featureFlagsMock } from "@/lib/mock-data";
import type { FeatureFlags } from "@/types/system";

const DEFAULT_FLAGS: FeatureFlags = {
  workspaceEnabled: true,
  workspaceRuntimeEnabled: true,
  domainEnabled: true,
};

export default function SystemFeaturesPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();

  const featuresQuery = useQuery({
    queryKey: ["system", "features"],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => systemApi.getFeatures(),
  });

  const source = localMode
    ? (featureFlagsMock as FeatureFlags)
    : featuresQuery.data || DEFAULT_FLAGS;

  const [draft, setDraft] = useState<FeatureFlags>(source);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) {
      setDraft(source);
    }
  }, [dirty, source]);

  const stats = useMemo(() => {
    const values = Object.values(draft);
    const enabledCount = values.filter(Boolean).length;
    const disabledCount = values.length - enabledCount;
    return { enabledCount, disabledCount, total: values.length };
  }, [draft]);

  const buildPatch = () => {
    const patch: {
      workspace_enabled?: boolean;
      workspace_runtime_enabled?: boolean;
      domain_enabled?: boolean;
    } = {};
    if (draft.workspaceEnabled !== source.workspaceEnabled) {
      patch.workspace_enabled = draft.workspaceEnabled;
    }
    if (draft.workspaceRuntimeEnabled !== source.workspaceRuntimeEnabled) {
      patch.workspace_runtime_enabled = draft.workspaceRuntimeEnabled;
    }
    if (draft.domainEnabled !== source.domainEnabled) {
      patch.domain_enabled = draft.domainEnabled;
    }
    return patch;
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const patch = buildPatch();
      if (Object.keys(patch).length === 0) {
        throw new Error("No changes detected");
      }
      if (localMode) {
        return source;
      }
      return systemApi.updateFeatures(patch);
    },
    onSuccess: () => {
      toast.success("Feature flags updated");
      setDirty(false);
      if (!localMode) {
        queryClient.invalidateQueries({ queryKey: ["system", "features"] });
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Update failed");
    },
  });

  const isLoading = !localMode && featuresQuery.isPending;
  const hasChanges = Object.keys(buildPatch()).length > 0;

  return (
    <PageContainer>
      <PageHeader
        title="Feature Flags"
        description="Centralized management of system-level feature flags."
        icon={<SlidersHorizontal className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCcw className="w-4 h-4" />}
              onClick={() => {
                if (!localMode) featuresQuery.refetch();
              }}
              loading={!localMode && featuresQuery.isFetching}
              loadingText="Refreshing..."
            >
              Refresh
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/system/health">View Health</Link>
            </Button>
            <Button
              size="sm"
              loading={updateMutation.isPending}
              loadingText="Saving..."
              disabled={!hasChanges || isLoading}
              onClick={() => updateMutation.mutate()}
            >
              Save Changes
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        <StatsCard title="Enabled" value={stats.enabledCount} subtitle="Current environment" />
        <StatsCard title="Disabled" value={stats.disabledCount} subtitle="Requires manual activation" />
        <StatsCard title="Total Flags" value={stats.total} subtitle="System-level config" />
      </div>

      <SettingsSection title="Flag Configuration" description="Changes require saving and take effect on routes immediately.">
        {isLoading ? (
          <div className="text-[12px] text-foreground-muted">Loading...</div>
        ) : (
          <div className="space-y-1">
            <ToggleRow
              label="Workspace Features"
              description="Workspace creation and member management"
              checked={draft.workspaceEnabled}
              onCheckedChange={(checked) => {
                setDirty(true);
                setDraft((prev) => ({ ...prev, workspaceEnabled: checked }));
              }}
            />
            <ToggleRow
              label="App Runtime"
              description="Application runtime and online execution endpoint"
              checked={draft.workspaceRuntimeEnabled}
              onCheckedChange={(checked) => {
                setDirty(true);
                setDraft((prev) => ({ ...prev, workspaceRuntimeEnabled: checked }));
              }}
            />
            <ToggleRow
              label="Domain Binding"
              description="Custom domain and certificate management"
              checked={draft.domainEnabled}
              onCheckedChange={(checked) => {
                setDirty(true);
                setDraft((prev) => ({ ...prev, domainEnabled: checked }));
              }}
            />
            <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
              <Badge variant={hasChanges ? "warning" : "secondary"} size="sm">
                {hasChanges ? "Unsaved" : "Synced"}
              </Badge>
              Changes will affect the availability of runtime and management routes.
            </div>
          </div>
        )}
      </SettingsSection>
    </PageContainer>
  );
}
