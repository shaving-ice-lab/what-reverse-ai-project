"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Search,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Eye,
  RefreshCcw,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  SettingsSection,
  StatsCard,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FullPagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { workspaceBehaviorRows, workspaceRows } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { WorkspaceBehaviorMetric } from "@/types/admin";

const PERIOD_OPTIONS = ["2026-02", "2026-01", "2025-12"] as const;

export default function WorkspaceBehaviorPage() {
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<string>(PERIOD_OPTIONS[0]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Local state for mock data
  const [localMetrics] = useState(() =>
    workspaceBehaviorRows.map((m) => ({
      ...m,
    })) as unknown as WorkspaceBehaviorMetric[]
  );

  // Filter
  const filteredMetrics = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return localMetrics.filter((m) => {
      const matchesSearch =
        !normalized ||
        m.workspace_name?.toLowerCase().includes(normalized) ||
        m.workspace_id.toLowerCase().includes(normalized);
      return matchesSearch;
    });
  }, [localMetrics, search]);

  const total = filteredMetrics.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagedData = filteredMetrics.slice((page - 1) * pageSize, page * pageSize);

  // Aggregated stats
  const totalDAU = localMetrics.reduce((sum, m) => sum + m.daily_active_users, 0);
  const totalMAU = localMetrics.reduce((sum, m) => sum + m.monthly_active_users, 0);
  const avgSessionDuration = localMetrics.length > 0
    ? (localMetrics.reduce((sum, m) => sum + m.avg_session_duration_min, 0) / localMetrics.length).toFixed(1)
    : "0";
  const avgRetention7d = localMetrics.length > 0
    ? (localMetrics.reduce((sum, m) => sum + m.retention_rate_7d, 0) / localMetrics.length).toFixed(1)
    : "0";

  const getTrendIcon = (value: number, threshold: number, inverse = false) => {
    const isGood = inverse ? value < threshold : value > threshold;
    return isGood ? (
      <TrendingUp className="w-3 h-3 text-success-default" />
    ) : (
      <TrendingDown className="w-3 h-3 text-error-default" />
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title="Workspace 行为分析"
        description="追踪各 Workspace 的用户活跃度、留存率与功能使用情况。"
        icon={<Activity className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="h-8 rounded-md border border-border bg-surface-100 px-3 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              {PERIOD_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm">
              <RefreshCcw className="w-3.5 h-3.5 mr-1" />
              刷新
            </Button>
          </div>
        }
      />

      <div className="page-grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          icon={<Users className="w-4 h-4" />}
          title="日活用户 (DAU)"
          value={totalDAU.toLocaleString()}
          subtitle="所有 Workspace 合计"
        />
        <StatsCard
          icon={<Users className="w-4 h-4" />}
          title="月活用户 (MAU)"
          value={totalMAU.toLocaleString()}
          subtitle="所有 Workspace 合计"
        />
        <StatsCard
          icon={<Clock className="w-4 h-4" />}
          title="平均会话时长"
          value={`${avgSessionDuration} 分钟`}
          subtitle="跨 Workspace 平均"
        />
        <StatsCard
          icon={<TrendingUp className="w-4 h-4" />}
          title="7 日留存率"
          value={`${avgRetention7d}%`}
          subtitle="跨 Workspace 平均"
        />
      </div>

      <SettingsSection
        title="Workspace 行为指标"
        description="各 Workspace 的用户活跃度与留存数据明细。"
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="搜索 Workspace 名称"
              leftIcon={<Search className="w-3.5 h-3.5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Badge variant="outline" size="sm">
            共 {total} 条
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workspace</TableHead>
              <TableHead className="text-right">DAU</TableHead>
              <TableHead className="text-right">WAU</TableHead>
              <TableHead className="text-right">MAU</TableHead>
              <TableHead className="text-right">会话数</TableHead>
              <TableHead className="text-right">平均时长</TableHead>
              <TableHead className="text-right">7日留存</TableHead>
              <TableHead className="text-right">30日留存</TableHead>
              <TableHead className="text-right">流失率</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-[12px] text-foreground-muted">
                  暂无行为数据
                </TableCell>
              </TableRow>
            ) : (
              pagedData.map((m) => (
                <TableRow key={m.workspace_id}>
                  <TableCell>
                    <Link
                      href={`/workspaces/${m.workspace_id}`}
                      className="text-[12px] font-medium text-foreground hover:text-brand-500"
                    >
                      {m.workspace_name || m.workspace_id.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right text-[12px] text-foreground">
                    {m.daily_active_users.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-[12px] text-foreground">
                    {m.weekly_active_users.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-[12px] text-foreground">
                    {m.monthly_active_users.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-[12px] text-foreground-light">
                    {m.total_sessions.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-[12px] text-foreground-light">
                    {m.avg_session_duration_min.toFixed(1)} 分
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {getTrendIcon(m.retention_rate_7d, 70)}
                      <span className={cn(
                        "text-[12px]",
                        m.retention_rate_7d >= 70 ? "text-success-default" : "text-foreground-light"
                      )}>
                        {m.retention_rate_7d.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {getTrendIcon(m.retention_rate_30d, 50)}
                      <span className={cn(
                        "text-[12px]",
                        m.retention_rate_30d >= 50 ? "text-success-default" : "text-foreground-light"
                      )}>
                        {m.retention_rate_30d.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {getTrendIcon(m.churn_rate, 5, true)}
                      <span className={cn(
                        "text-[12px]",
                        m.churn_rate <= 5 ? "text-success-default" : "text-error-default"
                      )}>
                        {m.churn_rate.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="mt-4">
          <FullPagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            showInput={false}
            size="sm"
            variant="outline"
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="功能使用分布"
        description="各 Workspace 的主要功能使用情况。"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {pagedData.slice(0, 4).map((m) => (
            <div
              key={m.workspace_id}
              className="rounded-lg border border-border bg-surface-75 p-4"
            >
              <div className="text-[12px] font-medium text-foreground mb-3">
                {m.workspace_name}
              </div>
              <div className="space-y-2">
                {Object.entries(m.feature_usage).map(([feature, count]) => {
                  const total = Object.values(m.feature_usage).reduce((a, b) => a + b, 0);
                  const percent = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
                  return (
                    <div key={feature} className="flex items-center justify-between">
                      <span className="text-[11px] text-foreground-muted capitalize">
                        {feature}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-surface-200 overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-foreground-light w-8 text-right">
                          {percent}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>
    </PageContainer>
  );
}
