"use client";

import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bell,
  BellOff,
  CheckCircle2,
  Cpu,
  Database,
  HardDrive,
  Info,
  Network,
  RefreshCcw,
  Server,
  Zap,
} from "lucide-react";
import {
  EmptyState,
  FormRow,
  PageContainer,
  PageHeader,
  SettingsSection,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { systemApi } from "@/lib/api/system";
import { isLocalModeEnabled } from "@/lib/env";
import {
  capacityAlertRows,
  capacityMetricRows,
  quotaRuleRows,
} from "@/lib/mock-data";
import { formatRelativeTime } from "@/lib/utils";
import type {
  AlertSeverity,
  CapacityAlert,
  CapacityMetric,
  QuotaRule,
  ResourceType,
} from "@/types/system";

const RESOURCE_ICONS: Record<ResourceType, React.ReactNode> = {
  cpu: <Cpu className="w-4 h-4" />,
  memory: <Server className="w-4 h-4" />,
  storage: <HardDrive className="w-4 h-4" />,
  database: <Database className="w-4 h-4" />,
  api_calls: <Zap className="w-4 h-4" />,
  executions: <Activity className="w-4 h-4" />,
  bandwidth: <Network className="w-4 h-4" />,
};

const SEVERITY_CONFIG: Record<
  AlertSeverity,
  { label: string; variant: "info" | "warning" | "error"; icon: React.ReactNode }
> = {
  info: { label: "提示", variant: "info", icon: <Info className="w-3.5 h-3.5" /> },
  warning: { label: "警告", variant: "warning", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  critical: { label: "严重", variant: "error", icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

const TREND_ICONS = {
  increasing: <ArrowUp className="w-3.5 h-3.5 text-destructive-400" />,
  decreasing: <ArrowDown className="w-3.5 h-3.5 text-brand-400" />,
  stable: <ArrowRight className="w-3.5 h-3.5 text-foreground-muted" />,
};

const getUtilizationColor = (percent: number): string => {
  if (percent >= 90) return "bg-destructive-500";
  if (percent >= 70) return "bg-warning-500";
  return "bg-brand-500";
};

const formatValue = (value: number, unit: string): string => {
  if (unit === "%" || unit === "次" || unit === "连接" || unit === "任务") {
    return value.toLocaleString();
  }
  if (unit === "TB" || unit === "GB" || unit === "Gbps") {
    return value.toFixed(1);
  }
  return value.toString();
};

export default function SystemCapacityPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();

  const metricsQuery = useQuery({
    queryKey: ["system", "capacity", "metrics"],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => systemApi.getCapacityMetrics(),
  });

  const alertsQuery = useQuery({
    queryKey: ["system", "capacity", "alerts"],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => systemApi.getCapacityAlerts(),
  });

  const rulesQuery = useQuery({
    queryKey: ["system", "capacity", "rules"],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => systemApi.getQuotaRules(),
  });

  const metrics = localMode ? (capacityMetricRows as CapacityMetric[]) : metricsQuery.data || [];
  const alerts = localMode
    ? (capacityAlertRows.filter((a) => !a.resolved_at) as CapacityAlert[])
    : (alertsQuery.data || []).filter((a) => !a.resolved_at);
  const rules = localMode ? (quotaRuleRows as QuotaRule[]) : rulesQuery.data || [];

  const acknowledgeMutation = useMutation({
    mutationFn: async (alertId: string) => systemApi.acknowledgeAlert(alertId),
    onSuccess: () => {
      toast.success("告警已确认");
      queryClient.invalidateQueries({ queryKey: ["system", "capacity", "alerts"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "确认失败"),
  });

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ ruleId, enabled }: { ruleId: string; enabled: boolean }) =>
      systemApi.updateQuotaRule(ruleId, { enabled }),
    onSuccess: () => {
      toast.success("规则已更新");
      queryClient.invalidateQueries({ queryKey: ["system", "capacity", "rules"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "更新失败"),
  });

  const isRefreshing = metricsQuery.isFetching || alertsQuery.isFetching || rulesQuery.isFetching;

  return (
    <PageContainer>
      <PageHeader
        title="系统容量与配额"
        description="监控系统资源使用情况与配额预警规则。"
        icon={<Activity className="w-4 h-4" />}
        actions={
          <Button
            variant="outline"
            size="sm"
            loading={isRefreshing}
            loadingText="刷新中..."
            leftIcon={<RefreshCcw className="w-4 h-4" />}
            onClick={() => {
              metricsQuery.refetch();
              alertsQuery.refetch();
              rulesQuery.refetch();
            }}
            disabled={localMode}
          >
            刷新
          </Button>
        }
      />

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <SettingsSection title="活跃告警" description="当前需要关注的容量告警。">
          <div className="space-y-3">
            {alerts.map((alert) => {
              const severityConfig = SEVERITY_CONFIG[alert.severity];
              const resourceIcon = RESOURCE_ICONS[alert.resource];
              const isAcknowledged = !!alert.acknowledged_at;

              return (
                <div
                  key={alert.id}
                  className={`rounded-lg border p-4 ${
                    alert.severity === "critical"
                      ? "border-destructive-500/50 bg-destructive-500/5"
                      : alert.severity === "warning"
                      ? "border-warning-500/50 bg-warning-500/5"
                      : "border-border bg-surface-75"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 text-foreground-light mt-0.5">
                      {resourceIcon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] font-medium text-foreground">
                          {alert.name}
                        </span>
                        <Badge variant={severityConfig.variant} size="sm" className="gap-1">
                          {severityConfig.icon}
                          {severityConfig.label}
                        </Badge>
                        {isAcknowledged && (
                          <Badge variant="secondary" size="sm">
                            已确认
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-foreground-light mb-2">{alert.message}</div>
                      <div className="flex items-center gap-4 text-[11px] text-foreground-muted">
                        <span>
                          阈值: {alert.threshold_percent}% → 当前: {alert.current_percent}%
                        </span>
                        <span>触发于: {formatRelativeTime(alert.triggered_at)}</span>
                        {isAcknowledged && (
                          <span>确认人: {alert.acknowledged_by}</span>
                        )}
                      </div>
                    </div>
                    {!isAcknowledged && (
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        onClick={() => acknowledgeMutation.mutate(alert.id)}
                        loading={acknowledgeMutation.isPending}
                        disabled={localMode}
                      >
                        确认
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </SettingsSection>
      )}

      {/* Capacity Metrics */}
      <SettingsSection title="资源使用概览" description="当前系统资源使用情况。">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {metrics.map((metric) => {
            const icon = RESOURCE_ICONS[metric.resource];
            const trendIcon = TREND_ICONS[metric.trend];
            const barColor = getUtilizationColor(metric.utilization_percent);

            return (
              <div
                key={metric.id}
                className="rounded-lg border border-border bg-surface-75 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="text-foreground-light">{icon}</div>
                    <span className="text-[12px] font-medium text-foreground">{metric.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-foreground-muted">
                    {trendIcon}
                    {metric.trend_percent !== undefined && (
                      <span
                        className={
                          metric.trend === "increasing"
                            ? "text-destructive-400"
                            : metric.trend === "decreasing"
                            ? "text-brand-400"
                            : ""
                        }
                      >
                        {metric.trend_percent > 0 ? "+" : ""}
                        {metric.trend_percent}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-semibold text-foreground">
                      {formatValue(metric.current_value, metric.unit)}
                    </span>
                    <span className="text-[11px] text-foreground-muted">
                      / {formatValue(metric.max_value, metric.unit)} {metric.unit}
                    </span>
                  </div>
                </div>

                <div className="h-2 bg-surface-200 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{ width: `${Math.min(100, metric.utilization_percent)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-foreground-muted">使用率</span>
                  <span
                    className={
                      metric.utilization_percent >= 90
                        ? "text-destructive-400 font-medium"
                        : metric.utilization_percent >= 70
                        ? "text-warning-500 font-medium"
                        : "text-foreground-light"
                    }
                  >
                    {metric.utilization_percent.toFixed(1)}%
                  </span>
                </div>

                <div className="text-[10px] text-foreground-muted mt-1">
                  更新于 {formatRelativeTime(metric.last_updated)}
                </div>
              </div>
            );
          })}
        </div>
      </SettingsSection>

      {/* Quota Rules */}
      <SettingsSection title="预警规则" description="配置资源使用预警阈值与通知渠道。">
        {rules.length === 0 ? (
          <EmptyState
            icon={<Bell className="w-5 h-5" />}
            title="暂无预警规则"
            description="当前没有配置预警规则。"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>规则名称</TableHead>
                <TableHead>资源类型</TableHead>
                <TableHead>警告阈值</TableHead>
                <TableHead>严重阈值</TableHead>
                <TableHead>通知渠道</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">启用</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => {
                const resourceIcon = RESOURCE_ICONS[rule.resource];
                return (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div className="text-[12px] font-medium text-foreground">{rule.name}</div>
                      {rule.description && (
                        <div className="text-[11px] text-foreground-muted">{rule.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-foreground-light">
                        {resourceIcon}
                        <span className="text-[12px]">{rule.resource}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="warning" size="sm">
                        {rule.threshold_warning}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="error" size="sm">
                        {rule.threshold_critical}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {rule.notification_channels.map((channel) => (
                          <Badge key={channel} variant="outline" size="sm">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={rule.enabled ? "success" : "secondary"}
                        size="sm"
                        className="gap-1"
                      >
                        {rule.enabled ? (
                          <>
                            <Bell className="w-3 h-3" />
                            启用
                          </>
                        ) : (
                          <>
                            <BellOff className="w-3 h-3" />
                            禁用
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) =>
                          toggleRuleMutation.mutate({ ruleId: rule.id, enabled: checked })
                        }
                        disabled={localMode || toggleRuleMutation.isPending}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </SettingsSection>
    </PageContainer>
  );
}
