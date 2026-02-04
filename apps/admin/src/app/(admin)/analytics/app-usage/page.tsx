"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AppWindow,
  Search,
  DollarSign,
  Zap,
  Users,
  RefreshCcw,
  TrendingUp,
  AlertCircle,
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
import { appUsageRows } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { AppUsageMetric } from "@/types/admin";

const PERIOD_OPTIONS = ["2026-02", "2026-01", "2025-12"] as const;

export default function AppUsagePage() {
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<string>(PERIOD_OPTIONS[0]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Local state for mock data
  const [localMetrics] = useState(() =>
    appUsageRows.map((m) => ({
      ...m,
    })) as unknown as AppUsageMetric[]
  );

  // Filter
  const filteredMetrics = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return localMetrics.filter((m) => {
      const matchesSearch =
        !normalized ||
        m.app_name?.toLowerCase().includes(normalized) ||
        m.workspace_name?.toLowerCase().includes(normalized) ||
        m.app_id.toLowerCase().includes(normalized);
      return matchesSearch;
    });
  }, [localMetrics, search]);

  const total = filteredMetrics.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagedData = filteredMetrics.slice((page - 1) * pageSize, page * pageSize);

  // Aggregated stats
  const totalRuns = localMetrics.reduce((sum, m) => sum + m.total_runs, 0);
  const totalCost = localMetrics.reduce((sum, m) => sum + m.cost_estimate, 0);
  const totalTokens = localMetrics.reduce((sum, m) => sum + m.total_tokens_used, 0);
  const totalFailedRuns = localMetrics.reduce((sum, m) => sum + m.failed_runs, 0);
  const errorRate = totalRuns > 0 ? ((totalFailedRuns / totalRuns) * 100).toFixed(2) : "0.00";

  // Top apps by cost
  const topAppsByCost = [...localMetrics].sort((a, b) => b.cost_estimate - a.cost_estimate).slice(0, 5);

  return (
    <PageContainer>
      <PageHeader
        title="应用用量与成本"
        description="追踪各应用的运行次数、Token 消耗与成本归因。"
        icon={<AppWindow className="w-4 h-4" />}
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
          icon={<Zap className="w-4 h-4" />}
          title="总运行次数"
          value={totalRuns.toLocaleString()}
          subtitle="所有应用合计"
        />
        <StatsCard
          icon={<DollarSign className="w-4 h-4" />}
          title="总成本"
          value={`$${totalCost.toFixed(2)}`}
          subtitle="Token 消耗成本"
        />
        <StatsCard
          icon={<TrendingUp className="w-4 h-4" />}
          title="总 Token 使用"
          value={(totalTokens / 1000000).toFixed(2) + "M"}
          subtitle="百万 Token"
        />
        <StatsCard
          icon={<AlertCircle className="w-4 h-4" />}
          title="错误率"
          value={`${errorRate}%`}
          subtitle={`${totalFailedRuns.toLocaleString()} 次失败`}
          trend={parseFloat(errorRate) > 3 ? { value: parseFloat(errorRate), isPositive: false } : undefined}
        />
      </div>

      <div className="page-grid grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
        <SettingsSection
          title="应用用量明细"
          description="各应用的运行次数、成本与 Token 消耗。"
        >
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="w-[260px]">
              <Input
                variant="search"
                inputSize="sm"
                placeholder="搜索应用或 Workspace"
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
                <TableHead>应用</TableHead>
                <TableHead>Workspace</TableHead>
                <TableHead className="text-right">运行次数</TableHead>
                <TableHead className="text-right">成功率</TableHead>
                <TableHead className="text-right">Token 用量</TableHead>
                <TableHead className="text-right">成本</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-[12px] text-foreground-muted">
                    暂无用量数据
                  </TableCell>
                </TableRow>
              ) : (
                pagedData.map((m) => {
                  const successRate = m.total_runs > 0
                    ? ((m.successful_runs / m.total_runs) * 100).toFixed(1)
                    : "0.0";
                  return (
                    <TableRow key={m.app_id}>
                      <TableCell>
                        <Link
                          href={`/apps/${m.app_id}`}
                          className="text-[12px] font-medium text-foreground hover:text-brand-500"
                        >
                          {m.app_name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {m.workspace_id ? (
                          <Link
                            href={`/workspaces/${m.workspace_id}`}
                            className="text-[12px] text-foreground-light hover:text-brand-500"
                          >
                            {m.workspace_name}
                          </Link>
                        ) : (
                          <span className="text-[12px] text-foreground-muted">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-[12px] text-foreground">
                        {m.total_runs.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "text-[12px]",
                          parseFloat(successRate) >= 95 ? "text-success-default" : 
                          parseFloat(successRate) >= 90 ? "text-foreground" : "text-error-default"
                        )}>
                          {successRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-[12px] text-foreground-light">
                        {(m.total_tokens_used / 1000).toFixed(0)}K
                      </TableCell>
                      <TableCell className="text-right text-[12px] font-medium text-foreground">
                        ${m.cost_estimate.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })
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
          title="成本 Top 5"
          description="本月成本最高的应用。"
        >
          <div className="space-y-3">
            {topAppsByCost.map((app, index) => {
              const percent = totalCost > 0 ? ((app.cost_estimate / totalCost) * 100).toFixed(0) : 0;
              return (
                <div
                  key={app.app_id}
                  className="flex items-center justify-between rounded-md border border-border bg-surface-75 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium",
                      index === 0 ? "bg-brand-500/20 text-brand-500" :
                      index === 1 ? "bg-warning-default/20 text-warning-default" :
                      "bg-surface-200 text-foreground-muted"
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <Link
                        href={`/apps/${app.app_id}`}
                        className="text-[12px] font-medium text-foreground hover:text-brand-500"
                      >
                        {app.app_name}
                      </Link>
                      <div className="text-[11px] text-foreground-muted">
                        {app.workspace_name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-medium text-foreground">
                      ${app.cost_estimate.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-foreground-muted">
                      {percent}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 rounded-md bg-surface-100 border border-border">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-foreground-muted">活跃用户总数</span>
              <span className="font-medium text-foreground">
                {localMetrics.reduce((sum, m) => sum + m.unique_users, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-[12px] mt-2">
              <span className="text-foreground-muted">峰值并发</span>
              <span className="font-medium text-foreground">
                {Math.max(...localMetrics.map(m => m.peak_concurrent_users)).toLocaleString()}
              </span>
            </div>
          </div>
        </SettingsSection>
      </div>
    </PageContainer>
  );
}
