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
        appRuntimeEnabled: true,
        domainEnabled: true,
      };

  const isRefreshing = healthQuery.isFetching || featuresQuery.isFetching;

  return (
    <PageContainer>
      <PageHeader
        title="系统健康"
        description="监控关键服务可用性与性能指标。"
        icon={<Server className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              loading={isRefreshing}
              loadingText="刷新中..."
              leftIcon={<RefreshCcw className="w-4 h-4" />}
              onClick={() => {
                healthQuery.refetch();
                featuresQuery.refetch();
              }}
              disabled={localMode}
            >
              刷新状态
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/system/deployment">查看部署信息</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/system/features">管理开关</Link>
            </Button>
          </div>
        }
      />

      <SettingsSection title="核心服务" description="关键链路服务状态概览。">
        {healthQuery.isPending && !localMode ? (
          <div className="text-[12px] text-foreground-muted">正在加载...</div>
        ) : healthItems.length === 0 ? (
          <div className="text-[12px] text-foreground-muted">暂无健康数据</div>
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
                  ? "正常"
                  : item.status === "down"
                  ? "故障"
                  : "注意";
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
        title="功能开关"
        description="当前环境启用的系统能力。"
      >
        <div className="space-y-1">
          <FormRow
            label="Workspace 功能"
            description="工作空间创建与成员管理"
          >
            <Badge variant={featureFlags.workspaceEnabled ? "success" : "secondary"} size="sm">
              {featureFlags.workspaceEnabled ? "启用" : "关闭"}
            </Badge>
          </FormRow>
          <FormRow
            label="App Runtime"
            description="应用运行时与在线执行入口"
          >
            <Badge variant={featureFlags.appRuntimeEnabled ? "success" : "secondary"} size="sm">
              {featureFlags.appRuntimeEnabled ? "启用" : "关闭"}
            </Badge>
          </FormRow>
          <FormRow
            label="Domain 绑定"
            description="自定义域名与证书管理"
          >
            <Badge variant={featureFlags.domainEnabled ? "success" : "secondary"} size="sm">
              {featureFlags.domainEnabled ? "启用" : "关闭"}
            </Badge>
          </FormRow>
          <div className="text-[11px] text-foreground-muted flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            当前展示为只读视图，可前往功能开关页调整。
          </div>
        </div>
      </SettingsSection>
    </PageContainer>
  );
}
