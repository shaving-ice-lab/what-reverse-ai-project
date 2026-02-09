"use client";

/**
 * App Version History Page - Supabase Style
 * Version List / Comparison / Rollback / Changelog
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
 current: { label: "Current", color: "text-brand-500", bgColor: "bg-brand-200" },
 history: { label: "History", color: "text-foreground-muted", bgColor: "bg-surface-200" },
 ahead: { label: "Restorable", color: "text-warning", bgColor: "bg-warning-200" },
};

const timeRangeOptions = [
 { value: "all", label: "All Time" },
 { value: "7d", label: "7 days" },
 { value: "30d", label: "30 days" },
 { value: "90d", label: "90 days" },
 { value: "180d", label: "180 days" },
];

const sortOptions = [
  { value: "created_desc", label: "Created At (new→old)" },
  { value: "created_asc", label: "Created At (old→new)" },
  { value: "version_desc", label: "Version Number (new→old)" },
  { value: "version_asc", label: "Version Number (old→new)" },
];

function AppNav({
 appId,
 activeTab,
}: {
 appId: string;
 activeTab: string;
}) {
 const navItems = [
 { id: "overview", label: "Overview", href: `/dashboard/app/${appId}` },
 { id: "builder", label: "Build", href: `/dashboard/app/${appId}/builder` },
 { id: "publish", label: "Publish Settings", href: `/dashboard/app/${appId}/publish` },
 { id: "versions", label: "Version History", href: `/dashboard/app/${appId}/versions` },
 { id: "monitoring", label: "Monitor", href: `/dashboard/app/${appId}/monitoring` },
 { id: "domains", label: "Domain", href: `/dashboard/app/${appId}/domains` },
 ];

 return (
 <SidebarNavGroup title="App">
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
 setCompareError("Please select different versions to compare.");
 return;
 }
 try {
 setIsComparing(true);
 setCompareError(null);
 const diff = await appApi.compareVersions(appId, compareFrom, compareTo);
 setVersionDiff(diff);
 } catch (error) {
 console.error("Failed to compare versions:", error);
      setCompareError("Failed to compare versions. Please try again later.");
 } finally {
 setIsComparing(false);
 }
 };

 const handleRollback = async (versionId: string) => {
 if (!confirm("Are you sure you want to rollback to this version? This will overwrite the current live version.")) return;
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
 if (!confirm("Are you sure you want to restore to this version? This will overwrite the current live version.")) return;
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

 const resolveCreator = (version: AppVersion) => version.created_by || "System";

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
 sidebarTitle={app?.name || "App"}
 sidebar={<AppNav appId={appId} activeTab="versions" />}
 >
 <PageContainer>
 <PageHeader
 title="Version History"
 eyebrow={app?.name}
 description="View version changes, compare diffs, and perform rollbacks."
 backHref={`/dashboard/app/${appId}`}
 backLabel="Back to App Overview"
 actions={
 <Button variant="outline" size="sm" onClick={loadData}>
 <RefreshCw className="w-4 h-4 mr-1.5" />
 Refresh
 </Button>
 }
 badge={
 app?.current_version?.version ? (
 <Badge variant="secondary" className="text-[10px]">
 Current {app.current_version.version}
 </Badge>
 ) : null
 }
 />

 <SettingsSection
 title="Version Comparison"
 description="Select two versions to compare differences"
 compact
 >
 <div className="grid md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
 <Select value={compareFrom} onValueChange={setCompareFrom}>
 <SelectTrigger className="h-9 bg-surface-75 border-border">
 <SelectValue placeholder="Select version A" />
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
 <SelectValue placeholder="Select version B" />
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
 {isComparing ? "Comparing...": "Start Comparison"}
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
 <Badge variant="secondary">No Differences</Badge>
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
title="Version List"
            description="View changelogs, filter versions, and perform rollback/restore."
 compact
 >
 <div className="flex flex-wrap items-center gap-3 mb-4">
 <Select value={statusFilter} onValueChange={setStatusFilter}>
 <SelectTrigger className="w-[130px] h-9 bg-surface-75 border-border">
 <SelectValue placeholder="Status filter" />
 </SelectTrigger>
 <SelectContent className="bg-surface-100 border-border">
 <SelectItem value="all">All Statuses</SelectItem>
 <SelectItem value="current">Current</SelectItem>
 <SelectItem value="history">History</SelectItem>
 <SelectItem value="ahead">Restorable</SelectItem>
 </SelectContent>
 </Select>
 <Select value={timeRangeFilter} onValueChange={setTimeRangeFilter}>
 <SelectTrigger className="w-[130px] h-9 bg-surface-75 border-border">
 <SelectValue placeholder="Time range" />
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
 <SelectValue placeholder="Creator" />
 </SelectTrigger>
 <SelectContent className="bg-surface-100 border-border">
 <SelectItem value="all">All Creators</SelectItem>
 {creatorOptions.map((creator) => (
 <SelectItem key={creator} value={creator}>
 {creator}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 <Select value={sortKey} onValueChange={setSortKey}>
 <SelectTrigger className="w-[180px] h-9 bg-surface-75 border-border">
 <SelectValue placeholder="Sort" />
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
 No version records match the filter criteria.
 </div>
 ) : (
 <div className="rounded-md border border-border overflow-hidden">
 <div className="grid grid-cols-[1.1fr_0.9fr_1fr_1.2fr_1.8fr_1.6fr] gap-3 px-4 py-2.5 border-b border-border bg-surface-75 text-[11px] font-medium text-foreground-muted uppercase tracking-wider">
 <span>Version Number</span>
 <span>Status</span>
 <span>Creator</span>
 <span>Created At</span>
 <span>Notes</span>
 <span className="text-right">Action</span>
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
 Current
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
 {version.changelog || "No changelog description."}
 </div>
 <div className="flex items-center justify-end gap-2">
 <Button
 variant="ghost"
 size="sm"
 onClick={() => handleViewVersion(version.id)}
 >
 View
 </Button>
 <Button
 variant="ghost"
 size="sm"
onClick={() => handlePresetCompare(version.id)}
                  >
                    Compare
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
 Rollback
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
 Restore
 </Button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </SettingsSection>

 <SettingsSection
title="Version Details"
            description="Select a version to view creation info and change summary."
 compact
 >
 {!activeVersion ? (
 <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
 <History className="w-3.5 h-3.5" />
 No versions to view.
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
 Current
 </Badge>
 )}
 </div>
 <div className="grid md:grid-cols-3 gap-3">
 <div className="rounded-md border border-border bg-surface-75 px-3 py-2">
 <div className="text-[10px] uppercase tracking-wider text-foreground-muted">
 Creator
 </div>
 <div className="mt-1 text-[12px] text-foreground">
 {resolveCreator(activeVersion)}
 </div>
 </div>
 <div className="rounded-md border border-border bg-surface-75 px-3 py-2">
 <div className="text-[10px] uppercase tracking-wider text-foreground-muted">
 Created At
 </div>
 <div className="mt-1 text-[12px] text-foreground">
 {formatDate(activeVersion.created_at)}
 </div>
 </div>
 <div className="rounded-md border border-border bg-surface-75 px-3 py-2">
 <div className="text-[10px] uppercase tracking-wider text-foreground-muted">
 Version Notes
 </div>
 <div className="mt-1 text-[12px] text-foreground">
 {activeVersion.changelog || "No changelog description."}
 </div>
 </div>
 </div>
 <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
 <History className="w-3.5 h-3.5" />
 Version records and rollbacks will sync to Run Monitor and Audit Log.
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
