"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  AlertTriangle,
  Bug,
  CheckCircle2,
  Download,
  FileDown,
  FileText,
  Info,
  Loader2,
  RefreshCcw,
  Search,
  Skull,
  XCircle,
} from "lucide-react";
import {
  EmptyState,
  PageContainer,
  PageHeader,
  SettingsSection,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { opsApi } from "@/lib/api/ops";
import { isLocalModeEnabled } from "@/lib/env";
import { logDownloadRows, systemLogRows } from "@/lib/mock-data";
import { formatRelativeTime, truncate } from "@/lib/utils";
import type { LogLevel, LogSource, SystemLog, LogDownloadRequest, JobStatus } from "@/types/ops";

const LOG_LEVEL_OPTIONS: { value: LogLevel | ""; label: string }[] = [
  { value: "", label: "全部级别" },
  { value: "debug", label: "Debug" },
  { value: "info", label: "Info" },
  { value: "warn", label: "Warn" },
  { value: "error", label: "Error" },
  { value: "fatal", label: "Fatal" },
];

const LOG_SOURCE_OPTIONS: { value: LogSource | ""; label: string }[] = [
  { value: "", label: "全部来源" },
  { value: "api", label: "API" },
  { value: "worker", label: "Worker" },
  { value: "scheduler", label: "Scheduler" },
  { value: "webhook", label: "Webhook" },
  { value: "runtime", label: "Runtime" },
  { value: "db", label: "Database" },
];

const PAGE_SIZES = [20, 50, 100];

const LOG_LEVEL_CONFIG: Record<
  LogLevel,
  { label: string; variant: "secondary" | "info" | "warning" | "error"; icon: React.ReactNode }
> = {
  debug: { label: "DEBUG", variant: "secondary", icon: <Bug className="w-3 h-3" /> },
  info: { label: "INFO", variant: "info", icon: <Info className="w-3 h-3" /> },
  warn: { label: "WARN", variant: "warning", icon: <AlertTriangle className="w-3 h-3" /> },
  error: { label: "ERROR", variant: "error", icon: <AlertCircle className="w-3 h-3" /> },
  fatal: { label: "FATAL", variant: "error", icon: <Skull className="w-3 h-3" /> },
};

const DOWNLOAD_STATUS_CONFIG: Record<
  JobStatus,
  { label: string; variant: "secondary" | "info" | "success" | "error" | "warning" }
> = {
  pending: { label: "排队中", variant: "secondary" },
  running: { label: "生成中", variant: "info" },
  completed: { label: "已完成", variant: "success" },
  failed: { label: "失败", variant: "error" },
  cancelled: { label: "已取消", variant: "warning" },
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatTimestamp = (ts: string): string => {
  const date = new Date(ts);
  return date.toLocaleString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
};

export default function OpsLogsPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();

  const [levelFilter, setLevelFilter] = useState<LogLevel | "">("");
  const [sourceFilter, setSourceFilter] = useState<LogSource | "">("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  useEffect(() => {
    setPage(1);
  }, [levelFilter, sourceFilter, searchTerm, pageSize]);

  // Logs query
  const logsQuery = useQuery({
    queryKey: ["ops", "logs", levelFilter, sourceFilter, searchTerm, page, pageSize],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () =>
      opsApi.listLogs({
        level: levelFilter ? [levelFilter] : undefined,
        source: sourceFilter ? [sourceFilter] : undefined,
        search: searchTerm || undefined,
        page,
        page_size: pageSize,
      }),
  });

  // Downloads query
  const downloadsQuery = useQuery({
    queryKey: ["ops", "log-downloads"],
    enabled: !localMode,
    queryFn: () => opsApi.listLogDownloads(),
  });

  // Filter mock data for local mode
  const mockLogs = systemLogRows.filter((log) => {
    if (levelFilter && log.level !== levelFilter) return false;
    if (sourceFilter && log.source !== sourceFilter) return false;
    if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  }) as SystemLog[];

  const logs = localMode ? mockLogs : logsQuery.data?.logs || [];
  const downloads = localMode ? (logDownloadRows as LogDownloadRequest[]) : downloadsQuery.data || [];
  const canPrev = page > 1;
  const canNext = logs.length === pageSize;

  // Create download mutation
  const createDownloadMutation = useMutation({
    mutationFn: async () => {
      const name = `日志导出 - ${new Date().toLocaleDateString("zh-CN")}`;
      return opsApi.createLogDownload({
        name,
        level: levelFilter ? [levelFilter] : undefined,
        source: sourceFilter ? [sourceFilter] : undefined,
        search: searchTerm || undefined,
      });
    },
    onSuccess: () => {
      toast.success("日志导出任务已创建");
      queryClient.invalidateQueries({ queryKey: ["ops", "log-downloads"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "创建导出任务失败");
    },
  });

  return (
    <PageContainer>
      <PageHeader
        title="系统日志"
        description="查看系统日志并下载日志归档。"
        icon={<FileText className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileDown className="w-4 h-4" />}
              onClick={() => createDownloadMutation.mutate()}
              loading={createDownloadMutation.isPending}
              disabled={localMode}
            >
              导出日志
            </Button>
            <Button
              variant="outline"
              size="sm"
              loading={logsQuery.isFetching}
              loadingText="刷新中..."
              leftIcon={<RefreshCcw className="w-4 h-4" />}
              onClick={() => {
                logsQuery.refetch();
                downloadsQuery.refetch();
              }}
              disabled={localMode}
            >
              刷新
            </Button>
          </div>
        }
      />

      {/* Download history section */}
      {downloads.length > 0 && (
        <SettingsSection title="导出历史" description="最近的日志导出任务。">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {downloads.slice(0, 6).map((dl) => {
              const statusConfig = DOWNLOAD_STATUS_CONFIG[dl.status];
              return (
                <div
                  key={dl.id}
                  className="rounded-lg border border-border bg-surface-75 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[12px] font-medium text-foreground truncate">
                      {dl.name}
                    </div>
                    <Badge variant={statusConfig.variant} size="sm">
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-foreground-muted mt-1">
                    {formatRelativeTime(dl.created_at)}
                    {dl.file_size_bytes !== undefined && (
                      <span className="ml-2">{formatBytes(dl.file_size_bytes)}</span>
                    )}
                  </div>
                  {dl.status === "completed" && dl.file_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                      asChild
                    >
                      <a href={dl.file_url} target="_blank" rel="noopener noreferrer">
                        下载
                      </a>
                    </Button>
                  )}
                  {dl.status === "running" && (
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-brand-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      正在生成...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SettingsSection>
      )}

      {/* Logs section */}
      <SettingsSection title="日志查询" description="实时查看系统日志记录。">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">级别</span>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as LogLevel | "")}
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              {LOG_LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">来源</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as LogSource | "")}
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              {LOG_SOURCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
            <Input
              type="text"
              placeholder="搜索日志..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-7 w-48 pl-7 text-[11px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">每页</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <Badge variant="outline" size="sm">
            共 {logs.length} 条
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!canPrev}
            >
              上一页
            </Button>
            <Badge variant="secondary" size="sm">
              第 {page} 页
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!canNext}
            >
              下一页
            </Button>
          </div>
        </div>

        {logsQuery.isPending && !localMode ? (
          <div className="text-[12px] text-foreground-muted">正在加载...</div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-5 h-5" />}
            title="暂无日志"
            description="当前没有符合条件的日志记录。"
          />
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">时间</TableHead>
                  <TableHead className="w-[70px]">级别</TableHead>
                  <TableHead className="w-[80px]">来源</TableHead>
                  <TableHead className="w-[120px]">服务</TableHead>
                  <TableHead>消息</TableHead>
                  <TableHead className="w-[100px]">Trace ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const levelConfig = LOG_LEVEL_CONFIG[log.level];
                  return (
                    <TableRow key={log.id} className="font-mono text-[11px]">
                      <TableCell className="text-foreground-muted">
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={levelConfig.variant} size="sm" className="gap-1 font-mono">
                          {levelConfig.icon}
                          {levelConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground-light uppercase">
                        {log.source}
                      </TableCell>
                      <TableCell className="text-foreground-light">
                        {log.service}
                      </TableCell>
                      <TableCell className="text-foreground max-w-[400px]">
                        <span title={log.message}>{truncate(log.message, 80)}</span>
                      </TableCell>
                      <TableCell className="text-foreground-muted">
                        {log.trace_id ? truncate(log.trace_id, 12) : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </SettingsSection>
    </PageContainer>
  );
}
