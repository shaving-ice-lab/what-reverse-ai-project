"use client";

/**
 * App 版本历史页 - Supabase 风格
 * 版本列表 / 对比 / 回滚 / 变更记录
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeftRight,
  CheckCircle2,
  History,
  Loader2,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PageContainer,
  PageHeader,
  PageWithSidebar,
  SettingsSection,
  SidebarNavGroup,
  SidebarNavItem,
} from "@/components/dashboard/page-layout";
import {
  appApi,
  type App,
  type AppVersion,
  type AppVersionDiff,
} from "@/lib/api/workspace";
import { workspaceApi, type Workspace } from "@/lib/api/workspace";
import { cn } from "@/lib/utils";

const versionStatusConfig: Record<
  "current" | "history" | "ahead",
  { label: string; color: string; bgColor: string }
> = {
  current: { label: "当前", color: "text-brand-500", bgColor: "bg-brand-200" },
  history: { label: "历史", color: "text-foreground-muted", bgColor: "bg-surface-200" },
  ahead: { label: "可恢复", color: "text-warning", bgColor: "bg-warning-200" },
};

const timeRangeOptions = [
  { value: "all", label: "全部时间" },
  { value: "7d", label: "近 7 天" },
  { value: "30d", label: "近 30 天" },
  { value: "90d", label: "近 90 天" },
  { value: "180d", label: "近 180 天" },
];

const sortOptions = [
  { value: "created_desc", label: "创建时间（新→旧）" },
  { value: "created_asc", label: "创建时间（旧→新）" },
  { value: "version_desc", label: "版本号（新→旧）" },
  { value: "version_asc", label: "版本号（旧→新）" },
];

function AppNav({
  appId,
  activeTab,
}: {
  appId: string;
  activeTab: string;
}) {
  const navItems = [
    { id: "overview", label: "概览", href: `/dashboard/app/${appId}` },
    { id: "builder", label: "构建", href: `/dashboard/app/${appId}/builder` },
    { id: "publish", label: "发布设置", href: `/dashboard/app/${appId}/publish` },
    { id: "versions", label: "版本历史", href: `/dashboard/app/${appId}/versions` },
    { id: "monitoring", label: "监控", href: `/dashboard/app/${appId}/monitoring` },
    { id: "domains", label: "域名", href: `/dashboard/app/${appId}/domains` },
  ];

  return (
    <SidebarNavGroup title="应用">
      {navItems.map((item) => (
        <SidebarNavItem
          key={item.id}
          href={item.href}
          label={item.label}
          active={activeTab === item.id}
        />
      ))}
    </SidebarNavGroup>
  );
}

type VersionsPageProps = {
  workspaceId: string;
  appId: string;
};

export function VersionsPageContent({ workspaceId, appId }: VersionsPageProps) {

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [app, setApp] = useState<App | null>(null);
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isComparing, setIsComparing] = useState(false);
  const [compareFrom, setCompareFrom] = useState("");
  const [compareTo, setCompareTo] = useState("");
  const [versionDiff, setVersionDiff] = useState<AppVersionDiff | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [rollbackId, setRollbackId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeRangeFilter, setTimeRangeFilter] = useState("all");
  const [creatorFilter, setCreatorFilter] = useState("all");
  const [sortKey, setSortKey] = useState("created_desc");
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [workspaceId, appId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [workspaceData, appData, versionsData] = await Promise.all([
        workspaceApi.get(workspaceId),
        appApi.get(appId),
        appApi.getVersions(appId, { page: 1, page_size: 20 }),
      ]);
      setWorkspace(workspaceData);
      setApp(appData);
      setVersions(versionsData.items || []);
      if (versionsData.items?.length >= 2 && (!compareFrom || !compareTo)) {
        setCompareFrom(versionsData.items[0].id);
        setCompareTo(versionsData.items[1].id);
      }
      if (!activeVersionId && versionsData.items?.length) {
        setActiveVersionId(appData.current_version_id || versionsData.items[0].id);
      }
    } catch (error) {
      console.error("Failed to load versions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!compareFrom || !compareTo || compareFrom === compareTo) {
      setCompareError("请选择两个不同版本进行对比");
      return;
    }
    try {
      setIsComparing(true);
      setCompareError(null);
      const diff = await appApi.compareVersions(appId, compareFrom, compareTo);
      setVersionDiff(diff);
    } catch (error) {
      console.error("Failed to compare versions:", error);
      setCompareError("版本对比失败，请稍后重试。");
    } finally {
      setIsComparing(false);
    }
  };

  const handleRollback = async (versionId: string) => {
    if (!confirm("确认回滚到该版本？此操作将覆盖当前线上版本。")) return;
    try {
      setRollbackId(versionId);
      const updated = await appApi.rollback(appId, versionId);
      setApp(updated);
      await loadData();
    } catch (error) {
      console.error("Failed to rollback version:", error);
    } finally {
      setRollbackId(null);
    }
  };

  const handleRestore = async (versionId: string) => {
    if (!confirm("确认恢复到该版本？此操作将覆盖当前线上版本。")) return;
    try {
      setRollbackId(versionId);
      const updated = await appApi.rollback(appId, versionId);
      setApp(updated);
      await loadData();
    } catch (error) {
      console.error("Failed to restore version:", error);
    } finally {
      setRollbackId(null);
    }
  };

  const handleViewVersion = (versionId: string) => {
    setActiveVersionId(versionId);
  };

  const handlePresetCompare = (versionId: string) => {
    const fallbackTarget = versions.find((version) => version.id !== versionId)?.id || "";
    const target = app?.current_version_id && app.current_version_id !== versionId
      ? app.current_version_id
      : fallbackTarget;
    setCompareFrom(versionId);
    setCompareTo(target);
    setVersionDiff(null);
    setCompareError(null);
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const parseTimestamp = (value?: string) => {
    if (!value) return 0;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const resolveCreator = (version: AppVersion) => version.created_by || "系统";

  const currentVersion = versions.find((version) => version.id === app?.current_version_id);
  const currentTimestamp = parseTimestamp(currentVersion?.created_at);

  const resolveStatus = (version: AppVersion) => {
    if (version.id === app?.current_version_id) return "current";
    const versionTimestamp = parseTimestamp(version.created_at);
    if (currentTimestamp && versionTimestamp > currentTimestamp) return "ahead";
    return "history";
  };

  const creatorOptions = Array.from(
    new Set(versions.map((version) => resolveCreator(version)))
  );

  const filteredVersions = versions.filter((version) => {
    const status = resolveStatus(version);
    if (statusFilter !== "all" && statusFilter !== status) return false;
    if (creatorFilter !== "all" && resolveCreator(version) !== creatorFilter) return false;
    const timeRangeDays =
      timeRangeFilter === "7d"
        ? 7
        : timeRangeFilter === "30d"
        ? 30
        : timeRangeFilter === "90d"
        ? 90
        : timeRangeFilter === "180d"
        ? 180
        : null;
    if (timeRangeDays) {
      const timestamp = parseTimestamp(version.created_at);
      if (!timestamp) return false;
      if (Date.now() - timestamp > timeRangeDays * 86400000) return false;
    }
    return true;
  });

  const sortedVersions = [...filteredVersions].sort((a, b) => {
    if (sortKey === "created_asc") {
      return parseTimestamp(a.created_at) - parseTimestamp(b.created_at);
    }
    if (sortKey === "created_desc") {
      return parseTimestamp(b.created_at) - parseTimestamp(a.created_at);
    }
    if (sortKey === "version_asc") {
      return a.version.localeCompare(b.version, "zh-CN", { sensitivity: "base" });
    }
    if (sortKey === "version_desc") {
      return b.version.localeCompare(a.version, "zh-CN", { sensitivity: "base" });
    }
    return 0;
  });

  const activeVersion =
    versions.find((version) => version.id === activeVersionId) ||
    currentVersion ||
    versions[0];

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-foreground-muted" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageWithSidebar
      sidebarWidth="narrow"
      sidebarTitle={app?.name || "应用"}
      sidebar={<AppNav appId={appId} activeTab="versions" />}
    >
      <PageContainer>
        <PageHeader
          title="版本历史"
          eyebrow={app?.name}
          description="查看版本变更、对比差异并执行回滚"
          backHref={`/dashboard/app/${appId}`}
          backLabel="返回应用概览"
          actions={
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-1.5" />
              刷新
            </Button>
          }
          badge={
            app?.current_version?.version ? (
              <Badge variant="secondary" className="text-[10px]">
                当前 {app.current_version.version}
              </Badge>
            ) : null
          }
        />

        <SettingsSection
          title="版本对比"
          description="选择两个版本查看差异字段"
          compact
        >
          <div className="grid md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <Select value={compareFrom} onValueChange={setCompareFrom}>
              <SelectTrigger className="h-9 bg-surface-75 border-border">
                <SelectValue placeholder="选择版本 A" />
              </SelectTrigger>
              <SelectContent className="bg-surface-100 border-border">
                {versions.map((version) => (
                  <SelectItem key={version.id} value={version.id}>
                    {version.version} · {formatDate(version.created_at)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={compareTo} onValueChange={setCompareTo}>
              <SelectTrigger className="h-9 bg-surface-75 border-border">
                <SelectValue placeholder="选择版本 B" />
              </SelectTrigger>
              <SelectContent className="bg-surface-100 border-border">
                {versions.map((version) => (
                  <SelectItem key={version.id} value={version.id}>
                    {version.version} · {formatDate(version.created_at)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleCompare} disabled={isComparing}>
              {isComparing ? "对比中..." : "开始对比"}
            </Button>
          </div>
          {compareError && (
            <div className="mt-3 text-[11px] text-destructive">{compareError}</div>
          )}
          {versionDiff && (
            <div className="mt-3 rounded-md border border-border bg-surface-75 px-3 py-2">
              <div className="text-[11px] text-foreground-muted">
                {versionDiff.from.version} → {versionDiff.to.version}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {versionDiff.changed_fields.length === 0 ? (
                  <Badge variant="secondary">无差异</Badge>
                ) : (
                  versionDiff.changed_fields.map((field) => (
                    <Badge key={field} variant="secondary">
                      {field}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          )}
        </SettingsSection>

        <SettingsSection
          title="版本列表"
          description="查看变更记录、筛选版本并执行回滚/恢复"
          compact
        >
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-9 bg-surface-75 border-border">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent className="bg-surface-100 border-border">
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="current">当前</SelectItem>
                <SelectItem value="history">历史</SelectItem>
                <SelectItem value="ahead">可恢复</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeRangeFilter} onValueChange={setTimeRangeFilter}>
              <SelectTrigger className="w-[130px] h-9 bg-surface-75 border-border">
                <SelectValue placeholder="时间范围" />
              </SelectTrigger>
              <SelectContent className="bg-surface-100 border-border">
                {timeRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={creatorFilter} onValueChange={setCreatorFilter}>
              <SelectTrigger className="w-[140px] h-9 bg-surface-75 border-border">
                <SelectValue placeholder="创建者" />
              </SelectTrigger>
              <SelectContent className="bg-surface-100 border-border">
                <SelectItem value="all">全部创建者</SelectItem>
                {creatorOptions.map((creator) => (
                  <SelectItem key={creator} value={creator}>
                    {creator}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortKey} onValueChange={setSortKey}>
              <SelectTrigger className="w-[180px] h-9 bg-surface-75 border-border">
                <SelectValue placeholder="排序" />
              </SelectTrigger>
              <SelectContent className="bg-surface-100 border-border">
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {sortedVersions.length === 0 ? (
            <div className="py-8 text-center text-[12px] text-foreground-muted">
              暂无符合筛选条件的版本记录。
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <div className="grid grid-cols-[1.1fr_0.9fr_1fr_1.2fr_1.8fr_1.6fr] gap-3 px-4 py-2.5 border-b border-border bg-surface-75 text-[11px] font-medium text-foreground-muted uppercase tracking-wider">
                <span>版本号</span>
                <span>状态</span>
                <span>创建者</span>
                <span>创建时间</span>
                <span>备注</span>
                <span className="text-right">操作</span>
              </div>
              {sortedVersions.map((version) => {
                const status = resolveStatus(version);
                const statusMeta = versionStatusConfig[status];
                const isCurrent = version.id === app?.current_version_id;
                const isAhead = status === "ahead";
                return (
                  <div
                    key={version.id}
                    className={cn(
                      "grid grid-cols-[1.1fr_0.9fr_1fr_1.2fr_1.8fr_1.6fr] gap-3 px-4 py-3 border-b border-border last:border-b-0 text-[12px]",
                      activeVersionId === version.id && "bg-surface-100/80"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {version.version}
                      </Badge>
                      {isCurrent && (
                        <Badge variant="secondary" className="text-[10px] bg-brand-200 text-brand-500">
                          当前
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center">
                      <Badge
                        variant="secondary"
                        className={cn("text-[10px]", statusMeta.bgColor, statusMeta.color)}
                      >
                        {statusMeta.label}
                      </Badge>
                    </div>
                    <div className="flex items-center text-foreground-light">
                      {resolveCreator(version)}
                    </div>
                    <div className="flex items-center text-foreground-light">
                      {formatDate(version.created_at)}
                    </div>
                    <div className="flex items-center text-foreground-muted line-clamp-2">
                      {version.changelog || "暂无变更记录说明"}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewVersion(version.id)}
                      >
                        查看
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePresetCompare(version.id)}
                      >
                        对比
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRollback(version.id)}
                        disabled={isCurrent || rollbackId === version.id || isAhead}
                      >
                        {rollbackId === version.id ? (
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4 mr-1.5" />
                        )}
                        回滚
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(version.id)}
                        disabled={isCurrent || rollbackId === version.id || !isAhead}
                      >
                        {rollbackId === version.id ? (
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4 mr-1.5" />
                        )}
                        恢复
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SettingsSection>

        <SettingsSection
          title="版本说明"
          description="选中版本查看创建信息与变更摘要"
          compact
        >
          {!activeVersion ? (
            <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
              <History className="w-3.5 h-3.5" />
              暂无版本可查看。
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">
                  {activeVersion.version}
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px]",
                    versionStatusConfig[resolveStatus(activeVersion)].bgColor,
                    versionStatusConfig[resolveStatus(activeVersion)].color
                  )}
                >
                  {versionStatusConfig[resolveStatus(activeVersion)].label}
                </Badge>
                {activeVersion.id === app?.current_version_id && (
                  <Badge variant="secondary" className="text-[10px] bg-brand-200 text-brand-500">
                    当前
                  </Badge>
                )}
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <div className="rounded-md border border-border bg-surface-75 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-foreground-muted">
                    创建者
                  </div>
                  <div className="mt-1 text-[12px] text-foreground">
                    {resolveCreator(activeVersion)}
                  </div>
                </div>
                <div className="rounded-md border border-border bg-surface-75 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-foreground-muted">
                    创建时间
                  </div>
                  <div className="mt-1 text-[12px] text-foreground">
                    {formatDate(activeVersion.created_at)}
                  </div>
                </div>
                <div className="rounded-md border border-border bg-surface-75 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-foreground-muted">
                    版本备注
                  </div>
                  <div className="mt-1 text-[12px] text-foreground">
                    {activeVersion.changelog || "暂无变更记录说明"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
                <History className="w-3.5 h-3.5" />
                版本记录与回滚会同步到运行监控与审计日志。
              </div>
            </div>
          )}
        </SettingsSection>
      </PageContainer>
    </PageWithSidebar>
  );
}

export default function VersionsPage() {
  const params = useParams();
  const workspaceId = Array.isArray(params?.workspaceId)
    ? params.workspaceId[0]
    : (params?.workspaceId as string | undefined);
  const appId = Array.isArray(params?.appId) ? params.appId[0] : (params?.appId as string | undefined);

  if (!workspaceId || !appId) {
    return null;
  }

  return <VersionsPageContent workspaceId={workspaceId} appId={appId} />;
}
