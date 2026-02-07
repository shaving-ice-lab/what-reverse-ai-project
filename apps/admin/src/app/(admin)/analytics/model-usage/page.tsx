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
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
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
        title="Model Usage Analytics"
        description="View call volume, token consumption, and cost estimates per model."
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
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              Export Report
            </Button>
          </div>
        }
      />

      <div className="page-grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          icon={<Zap className="w-4 h-4" />}
          title="Total Calls"
          value={totals.total_calls.toLocaleString()}
          subtitle={PERIOD_LABELS[period]}
        />
        <StatsCard
          icon={<TrendingUp className="w-4 h-4" />}
          title="Total Token Consumption"
          value={formatTokens(totals.total_tokens)}
          subtitle="Input + Output"
        />
        <StatsCard
          icon={<Coins className="w-4 h-4" />}
          title="Estimated Cost"
          value={`$${totals.cost_estimate.toFixed(2)}`}
          subtitle="Based on official pricing"
        />
        <StatsCard
          icon={<BarChart3 className="w-4 h-4" />}
          title="Active Models"
          value={rows.length.toString()}
          subtitle="With call records"
        />
      </div>

      <SettingsSection
        title="Model Details"
        description="Detailed usage and cost distribution per model"
      >
        {usageQuery.isPending && !localMode ? (
          <div className="py-10 text-center text-[12px] text-foreground-muted">
            Loading...
          </div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-[12px] text-foreground-muted">
            No usage data available
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Calls</TableHead>
                  <TableHead className="text-right">Input Tokens</TableHead>
                  <TableHead className="text-right">Output Tokens</TableHead>
                  <TableHead className="text-right">Total Tokens</TableHead>
                  <TableHead className="text-right">Est. Cost</TableHead>
                  <TableHead className="text-right">Share</TableHead>
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
              <div className="text-[12px] font-medium text-foreground mb-3">Usage Distribution</div>
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
        title="Cost Optimization Tips"
        description="Optimization suggestions based on usage data"
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface-75">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success/10">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <div>
              <div className="text-[12px] font-medium text-foreground">
                Consider using smaller models
              </div>
              <div className="text-[11px] text-foreground-muted mt-1">
                For simple tasks, using GPT-3.5-turbo instead of GPT-4 can save ~90% in costs.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface-75">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-warning/10">
              <Coins className="w-4 h-4 text-warning" />
            </div>
            <div>
              <div className="text-[12px] font-medium text-foreground">
                Enable response caching
              </div>
              <div className="text-[11px] text-foreground-muted mt-1">
                Enabling caching for repeated queries can reduce API calls by 20-40%.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-surface-75">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-500/10">
              <Zap className="w-4 h-4 text-brand-500" />
            </div>
            <div>
              <div className="text-[12px] font-medium text-foreground">
                Optimize prompt length
              </div>
              <div className="text-[11px] text-foreground-muted mt-1">
                Streamlining system prompts and context can effectively reduce input token consumption.
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>
    </PageContainer>
  );
}
