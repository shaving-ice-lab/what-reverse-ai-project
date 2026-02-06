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
        throw new Error("未检测到变更");
      }
      if (localMode) {
        return source;
      }
      return systemApi.updateFeatures(patch);
    },
    onSuccess: () => {
      toast.success("功能开关已更新");
      setDirty(false);
      if (!localMode) {
        queryClient.invalidateQueries({ queryKey: ["system", "features"] });
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "更新失败");
    },
  });

  const isLoading = !localMode && featuresQuery.isPending;
  const hasChanges = Object.keys(buildPatch()).length > 0;

  return (
    <PageContainer>
      <PageHeader
        title="功能开关"
        description="集中管理系统级功能开关。"
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
              loadingText="刷新中..."
            >
              刷新
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/system/health">查看健康</Link>
            </Button>
            <Button
              size="sm"
              loading={updateMutation.isPending}
              loadingText="保存中..."
              disabled={!hasChanges || isLoading}
              onClick={() => updateMutation.mutate()}
            >
              保存更改
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        <StatsCard title="已启用" value={stats.enabledCount} subtitle="当前环境" />
        <StatsCard title="已关闭" value={stats.disabledCount} subtitle="需人工开启" />
        <StatsCard title="开关总数" value={stats.total} subtitle="系统级配置" />
      </div>

      <SettingsSection title="开关配置" description="修改后需保存，立即对路由生效。">
        {isLoading ? (
          <div className="text-[12px] text-foreground-muted">正在加载...</div>
        ) : (
          <div className="space-y-1">
            <ToggleRow
              label="Workspace 功能"
              description="工作空间创建与成员管理"
              checked={draft.workspaceEnabled}
              onCheckedChange={(checked) => {
                setDirty(true);
                setDraft((prev) => ({ ...prev, workspaceEnabled: checked }));
              }}
            />
            <ToggleRow
              label="App Runtime"
              description="应用运行时与在线执行入口"
              checked={draft.workspaceRuntimeEnabled}
              onCheckedChange={(checked) => {
                setDirty(true);
                setDraft((prev) => ({ ...prev, workspaceRuntimeEnabled: checked }));
              }}
            />
            <ToggleRow
              label="Domain 绑定"
              description="自定义域名与证书管理"
              checked={draft.domainEnabled}
              onCheckedChange={(checked) => {
                setDirty(true);
                setDraft((prev) => ({ ...prev, domainEnabled: checked }));
              }}
            />
            <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
              <Badge variant={hasChanges ? "warning" : "secondary"} size="sm">
                {hasChanges ? "待保存" : "已同步"}
              </Badge>
              变更会影响运行时与管理路由的可用性。
            </div>
          </div>
        )}
      </SettingsSection>
    </PageContainer>
  );
}
