"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  Box,
  CheckCircle,
  RefreshCw,
  Search,
  Shield,
  XCircle,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  SettingsSection,
  StatsCard,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi } from "@/lib/api/admin";
import { isLocalModeEnabled } from "@/lib/env";
import { formatRelativeTime } from "@/lib/utils";

// Mock data
const mockScanResults = {
  summary: {
    total_dependencies: 847,
    vulnerable: 12,
    outdated: 45,
    last_scan: "2026-02-03T06:00:00Z",
  },
  items: [
    {
      id: "vuln-1",
      package_name: "lodash",
      current_version: "4.17.20",
      recommended_version: "4.17.21",
      severity: "high",
      cve_ids: ["CVE-2021-23337"],
      description: "Prototype pollution vulnerability",
      fix_available: true,
    },
    {
      id: "vuln-2",
      package_name: "axios",
      current_version: "0.21.1",
      recommended_version: "1.6.0",
      severity: "medium",
      cve_ids: ["CVE-2021-3749"],
      description: "Regular expression denial of service",
      fix_available: true,
    },
    {
      id: "vuln-3",
      package_name: "node-fetch",
      current_version: "2.6.1",
      recommended_version: "2.6.7",
      severity: "medium",
      cve_ids: ["CVE-2022-0235"],
      description: "Exposure of sensitive information",
      fix_available: true,
    },
    {
      id: "vuln-4",
      package_name: "tar",
      current_version: "6.1.0",
      recommended_version: "6.1.11",
      severity: "high",
      cve_ids: ["CVE-2021-37701", "CVE-2021-37712"],
      description: "Arbitrary file creation/overwrite",
      fix_available: true,
    },
    {
      id: "vuln-5",
      package_name: "minimist",
      current_version: "1.2.5",
      recommended_version: "1.2.8",
      severity: "low",
      cve_ids: ["CVE-2021-44906"],
      description: "Prototype pollution",
      fix_available: true,
    },
  ],
  total: 5,
};

const SEVERITY_OPTIONS = ["all", "critical", "high", "medium", "low"] as const;
const SEVERITY_LABELS: Record<string, string> = {
  all: "全部",
  critical: "严重",
  high: "高",
  medium: "中",
  low: "低",
};

const SEVERITY_VARIANTS: Record<string, "destructive" | "warning" | "secondary" | "info"> = {
  critical: "destructive",
  high: "destructive",
  medium: "warning",
  low: "secondary",
};

type Vulnerability = (typeof mockScanResults.items)[number];

export default function SupplyChainPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();

  const [severityFilter, setSeverityFilter] = useState<(typeof SEVERITY_OPTIONS)[number]>("all");
  const [search, setSearch] = useState("");
  const [dismissOpen, setDismissOpen] = useState<Vulnerability | null>(null);
  const [dismissReason, setDismissReason] = useState("");

  const scanQuery = useQuery({
    queryKey: ["admin", "security", "supply-chain", severityFilter],
    enabled: !localMode,
    queryFn: () =>
      adminApi.security.supplyChain.getScanResults({
        severity: severityFilter === "all" ? undefined : severityFilter,
      }),
  });

  const scanResults = localMode ? mockScanResults : scanQuery.data || mockScanResults;

  const filteredItems = scanResults.items.filter((item) => {
    const matchesSeverity = severityFilter === "all" || item.severity === severityFilter;
    const matchesSearch =
      !search ||
      item.package_name.toLowerCase().includes(search.toLowerCase()) ||
      item.cve_ids.some((cve) => cve.toLowerCase().includes(search.toLowerCase()));
    return matchesSeverity && matchesSearch;
  });

  const triggerScanMutation = useMutation({
    mutationFn: () => {
      if (localMode) {
        return Promise.resolve({ job_id: "scan-123", status: "running" });
      }
      return adminApi.security.supplyChain.triggerScan();
    },
    onSuccess: () => {
      toast.success("扫描已启动");
      queryClient.invalidateQueries({ queryKey: ["admin", "security", "supply-chain"] });
    },
    onError: () => toast.error("启动扫描失败"),
  });

  const dismissMutation = useMutation({
    mutationFn: async () => {
      if (!dismissOpen) throw new Error("No vulnerability selected");
      if (localMode) {
        return { success: true };
      }
      return adminApi.security.supplyChain.dismissVulnerability(dismissOpen.id, {
        reason: dismissReason,
      });
    },
    onSuccess: () => {
      toast.success("漏洞已忽略");
      setDismissOpen(null);
      setDismissReason("");
      queryClient.invalidateQueries({ queryKey: ["admin", "security", "supply-chain"] });
    },
    onError: () => toast.error("操作失败"),
  });

  const highSeverityCount = scanResults.items.filter((item) => item.severity === "high" || item.severity === "critical").length;

  return (
    <PageContainer>
      <PageHeader
        title="供应链扫描"
        description="检测和管理依赖项中的安全漏洞。"
        icon={<Box className="w-4 h-4" />}
        backHref="/security"
        backLabel="返回安全概览"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerScanMutation.mutate()}
            loading={triggerScanMutation.isPending}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            重新扫描
          </Button>
        }
      />

      <div className="page-grid grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="总依赖项"
          value={scanResults.summary.total_dependencies.toString()}
          subtitle="个包"
        />
        <StatsCard
          title="漏洞数"
          value={scanResults.summary.vulnerable.toString()}
          subtitle="个漏洞"
          trend={
            scanResults.summary.vulnerable > 0
              ? { value: scanResults.summary.vulnerable, isPositive: false }
              : undefined
          }
        />
        <StatsCard
          title="高危漏洞"
          value={highSeverityCount.toString()}
          subtitle="需立即处理"
        />
        <StatsCard
          title="最近扫描"
          value={formatRelativeTime(scanResults.summary.last_scan)}
          subtitle="上次更新"
        />
      </div>

      <SettingsSection
        title="漏洞列表"
        description="检测到的依赖项安全漏洞。"
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="搜索包名或 CVE"
              leftIcon={<Search className="w-3.5 h-3.5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">严重性</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as typeof severityFilter)}
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30"
            >
              {SEVERITY_OPTIONS.map((severity) => (
                <option key={severity} value={severity}>
                  {SEVERITY_LABELS[severity]}
                </option>
              ))}
            </select>
          </div>
          <Badge variant="outline" size="sm">
            共 {filteredItems.length} 个漏洞
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>包名</TableHead>
              <TableHead>当前版本</TableHead>
              <TableHead>推荐版本</TableHead>
              <TableHead>CVE</TableHead>
              <TableHead>严重性</TableHead>
              <TableHead>描述</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="w-8 h-8 text-brand-500" />
                    <span>未检测到漏洞</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((vuln) => (
                <TableRow key={vuln.id}>
                  <TableCell className="text-[12px] font-medium text-foreground">
                    {vuln.package_name}
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-light font-mono">
                    {vuln.current_version}
                  </TableCell>
                  <TableCell className="text-[12px] text-brand-500 font-mono">
                    {vuln.recommended_version}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {vuln.cve_ids.map((cve) => (
                        <Badge key={cve} variant="outline" size="sm">
                          {cve}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={SEVERITY_VARIANTS[vuln.severity]} size="sm">
                      {SEVERITY_LABELS[vuln.severity]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-light max-w-[200px] truncate">
                    {vuln.description}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {vuln.fix_available && (
                        <Button variant="ghost" size="sm" disabled>
                          升级
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDismissOpen(vuln);
                          setDismissReason("");
                        }}
                      >
                        忽略
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SettingsSection>

      {/* Dismiss Dialog */}
      <ConfirmDialog
        open={Boolean(dismissOpen)}
        onOpenChange={(open) => !open && setDismissOpen(null)}
        title="忽略漏洞"
        description={`确认要忽略 ${dismissOpen?.package_name} 的漏洞吗？`}
        confirmLabel="确认忽略"
        onConfirm={() => dismissMutation.mutate()}
        isLoading={dismissMutation.isPending}
        variant="warning"
      >
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-[12px] text-foreground">忽略原因（必填）</label>
            <Input
              value={dismissReason}
              onChange={(e) => setDismissReason(e.target.value)}
              placeholder="请输入忽略原因..."
            />
          </div>
        </div>
      </ConfirmDialog>
    </PageContainer>
  );
}
