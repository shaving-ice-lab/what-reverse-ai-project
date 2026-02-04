"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AlertTriangle, RefreshCcw, Search } from "lucide-react";
import {
  EmptyState,
  PageContainer,
  PageHeader,
  SettingsSection,
  StatsCard,
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
import { systemApi } from "@/lib/api/system";
import { isLocalModeEnabled } from "@/lib/env";
import { errorCodeDefinitions as errorCodeMocks } from "@/lib/mock-data";
import type { ErrorCodeDefinition } from "@/types/system";

const getStatusVariant = (status?: number) => {
  if (!status) return "outline";
  if (status >= 500) return "error";
  if (status >= 400) return "warning";
  return "info";
};

export default function SystemErrorCodesPage() {
  const localMode = isLocalModeEnabled();
  const [keyword, setKeyword] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  const codesQuery = useQuery({
    queryKey: ["system", "error-codes"],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => systemApi.getErrorCodes(),
  });

  const codes: ErrorCodeDefinition[] = localMode
    ? (errorCodeMocks as ErrorCodeDefinition[])
    : codesQuery.data || [];

  const moduleOptions = useMemo(() => {
    const set = new Set<string>();
    codes.forEach((code) => {
      if (code.module) set.add(code.module);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [codes]);

  const filtered = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return codes.filter((item) => {
      const matchModule = moduleFilter === "all" || item.module === moduleFilter;
      if (!matchModule) return false;
      if (!query) return true;
      return (
        item.code.toLowerCase().includes(query) ||
        item.module.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    });
  }, [codes, keyword, moduleFilter]);

  const stats = useMemo(() => {
    const total = codes.length;
    const serverErrors = codes.filter((item) => item.http_status >= 500).length;
    const clientErrors = codes.filter(
      (item) => item.http_status >= 400 && item.http_status < 500
    ).length;
    return { total, serverErrors, clientErrors };
  }, [codes]);

  const isLoading = !localMode && codesQuery.isPending;

  return (
    <PageContainer>
      <PageHeader
        title="错误码清单"
        description="汇总系统错误码与含义，支持检索与筛选。"
        icon={<AlertTriangle className="w-4 h-4" />}
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCcw className="w-4 h-4" />}
            onClick={() => {
              if (!localMode) codesQuery.refetch();
            }}
            loading={!localMode && codesQuery.isFetching}
            loadingText="刷新中..."
          >
            刷新
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        <StatsCard title="错误码总数" value={stats.total} subtitle="已录入定义" />
        <StatsCard title="4xx 错误" value={stats.clientErrors} subtitle="客户端类" />
        <StatsCard title="5xx 错误" value={stats.serverErrors} subtitle="服务端类" />
      </div>

      <SettingsSection title="错误码列表" description="按模块或关键词过滤。">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative w-full max-w-[240px]">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索错误码或描述"
              className="pl-8"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">模块</span>
            <select
              value={moduleFilter}
              onChange={(event) => setModuleFilter(event.target.value)}
              className="h-8 rounded-md border border-border bg-surface-100 px-2 text-[12px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="all">全部模块</option>
              {moduleOptions.map((module) => (
                <option key={module} value={module}>
                  {module}
                </option>
              ))}
            </select>
          </div>
          <Badge variant="outline" size="sm">
            共 {filtered.length} 条
          </Badge>
        </div>

        {isLoading ? (
          <div className="text-[12px] text-foreground-muted">正在加载...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="暂无错误码"
            description="没有匹配到错误码记录。"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>错误码</TableHead>
                <TableHead>模块</TableHead>
                <TableHead>HTTP</TableHead>
                <TableHead>说明</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.code}>
                  <TableCell className="text-[12px] font-medium text-foreground">
                    {item.code}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" size="sm">
                      {item.module}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(item.http_status)} size="sm">
                      {item.http_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-light">
                    {item.description}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SettingsSection>
    </PageContainer>
  );
}
