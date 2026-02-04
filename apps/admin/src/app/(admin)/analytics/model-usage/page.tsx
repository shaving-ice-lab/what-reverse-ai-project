"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  TrendingUp,
  Coins,
  Zap,
  RefreshCw,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  SettingsSection,
  StatsCard,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { modelUsageRows } from "@/lib/mock-data";
import { adminApi } from "@/lib/api/admin";
import { isLocalModeEnabled } from "@/lib/env";
import type { ModelUsage } from "@/types/admin";

const PERIOD_OPTIONS = ["7d", "30d", "90d"] as const;
const PERIOD_LABELS: Record<(typeof PERIOD_OPTIONS)[number], string> = {
  "7d": "近 7 天",
  "30d": "近 30 天",
  "90d": "近 90 天",
};

export default function ModelUsagePage() {
  const localMode = isLocalModeEnabled();

  const [period, setPeriod] = useState<(typeof PERIOD_OPTIONS)[number]>("7d");

  const usageQuery = useQuery({
    queryKey: ["admin", "analytics", "model-usage", period],
    enabled: !localMode,
    queryFn: () => adminApi.analytics.modelUsage({ period }),
  });

  const localUsage = useMemo(() => {
    return modelUsageRows as unknown as ModelUsage[];
  }, []);

  const rows = localMode ? localUsage : usageQuery.data?.items || [];

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => ({
        total_calls: acc.total_calls + row.total_calls,
        total_tokens: acc.total_tokens + row.total_tokens,
        cost_estimate: acc.cost_estimate + (row.cost_estimate || 0),
      }),
      { total_calls: 0, total_tokens: 0, cost_estimate: 0 }
    );
  }, [rows]);

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toString();
  };

  return (
    <PageContainer>
      <PageHeader
        title="模型用量分析"
        description="查看各模型的调用量、Token 消耗与成本估算。"
        icon={<BarChart3 className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as (typeof PERIOD_OPTIONS)[number])}
              className="h-8 rounded-md border border-border bg-surface-100 px-2 text-[12px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              {PERIOD_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {PERIOD_LABELS[p]}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => usageQuery.refetch()}
              disabled={usageQuery.isFetching}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${usageQuery.isFetching ? "animate-spin" : ""}`} />
              刷新
            </Button>
            <Button variant="outline" size="sm">
              导出报表
            </Button>
          </div>
        }
      />

      <div className="page-grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          icon={<Zap className="w-4 h-4" />}
          title="总调用次数"
          value={totals.total_calls.toLocaleString()}
          subtitle={PERIOD_LABELS[period]}
        />
        <StatsCard
          icon={<TrendingUp className="w-4 h-4" />}
          title="总 Token 消耗"
          value={formatTokens(totals.total_tokens)}
          subtitle="输入 + 输出"
        />
        <StatsCard
          icon={<Coins className="w-4 h-4" />}
          title="预估成本"
          value={`$${totals.cost_estimate.toFixed(2)}`}
          subtitle="基于官方定价"
        />
        <StatsCard
          icon={<BarChart3 className="w-4 h-4" />}
          title="活跃模型"
          value={rows.length.toString()}
          subtitle="有调用记录"
        />
      </div>

      <SettingsSection
        title="模型明细"
        description="各模型的详细用量与成本分布"
      >
        {usageQuery.isPending && !localMode ? (
          <div className="py-10 text-center text-[12px] text-foreground-muted">
            正在加载...
          </div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-[12px] text-foreground-muted">
            暂无用量数据
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>模型</TableHead>
                  <TableHead className="text-right">调用次数</TableHead>
                  <TableHead className="text-right">输入 Tokens</TableHead>
                  <TableHead className="text-right">输出 Tokens</TableHead>
                  <TableHead className="text-right">总 Tokens</TableHead>
                  <TableHead className="text-right">预估成本</TableHead>
                  <TableHead className="text-right">占比</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const callPercentage = totals.total_calls > 0
                    ? ((row.total_calls / totals.total_calls) * 100).toFixed(1)
                    : "0";
                  return (
                    <TableRow key={row.model}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" size="sm">
                            {row.model}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-[12px] text-foreground">
                        {row.total_calls.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-[12px] text-foreground-light">
                        {formatTokens(row.input_tokens)}
                      </TableCell>
                      <TableCell className="text-right text-[12px] text-foreground-light">
                        {formatTokens(row.output_tokens)}
                      </TableCell>
                      <TableCell className="text-right text-[12px] text-foreground">
                        {formatTokens(row.total_tokens)}
                      </TableCell>
                      <TableCell className="text-right text-[12px] text-foreground">
                        ${row.cost_estimate?.toFixed(2) || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-surface-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-500 rounded-full"
                              style={{ width: `${callPercentage}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-foreground-muted w-10 text-right">
                            {callPercentage}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="mt-6 p-4 rounded-lg border border-border bg-surface-75">
              <div className="text-[12px] font-medium text-foreground mb-3">用量分布</div>
              <div className="flex flex-wrap gap-4">
                {rows.map((row) => {
                  const percentage = totals.total_tokens > 0
                    ? ((row.total_tokens / totals.total_tokens) * 100).toFixed(1)
                    : "0";
                  return (
                    <div key={row.model} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-brand-500" />
                      <span className="text-[11px] text-foreground">{row.model}</span>
                      <span className="text-[11px] text-foreground-muted">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </SettingsSection>

      <SettingsSection
        title="成本优化建议"
        description="基于用量数据的优化建议"
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface-75">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success/10">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <div>
              <div className="text-[12px] font-medium text-foreground">
                考虑使用更小的模型
              </div>
              <div className="text-[11px] text-foreground-muted mt-1">
                对于简单任务，使用 GPT-3.5-turbo 替代 GPT-4 可节省约 90% 成本。
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface-75">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-warning/10">
              <Coins className="w-4 h-4 text-warning" />
            </div>
            <div>
              <div className="text-[12px] font-medium text-foreground">
                启用响应缓存
              </div>
              <div className="text-[11px] text-foreground-muted mt-1">
                对于重复查询启用缓存可减少 20-40% 的 API 调用。
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface-75">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-500/10">
              <Zap className="w-4 h-4 text-brand-500" />
            </div>
            <div>
              <div className="text-[12px] font-medium text-foreground">
                优化 Prompt 长度
              </div>
              <div className="text-[11px] text-foreground-muted mt-1">
                精简系统提示词和上下文可有效减少输入 Token 消耗。
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>
    </PageContainer>
  );
}
