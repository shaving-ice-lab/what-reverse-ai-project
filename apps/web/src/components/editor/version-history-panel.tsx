"use client";

import { useState, useEffect } from "react";
import { History, RotateCcw, GitCompare, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
 Sheet,
 SheetContent,
 SheetHeader,
 SheetTitle,
 SheetTrigger,
} from "@/components/ui/sheet";
import { versionApi, type WorkflowVersion } from "@/lib/api/version";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VersionHistoryPanelProps {
 workflowId: string;
 currentVersion: number;
 onRestore?: (version: WorkflowVersion) => void;
}

export function VersionHistoryPanel({
 workflowId,
 currentVersion,
 onRestore,
}: VersionHistoryPanelProps) {
 const [open, setOpen] = useState(false);
 const [versions, setVersions] = useState<WorkflowVersion[]>([]);
 const [loading, setLoading] = useState(false);
 const [selectedVersions, setSelectedVersions] = useState<number[]>([]);

  // Load version history
 const loadVersions = async () => {
 setLoading(true);
 try {
 const response = await versionApi.list(workflowId, { page: 1, page_size: 50 });
 setVersions(response.data.versions);
 } catch (error) {
 toast.error("Failed to load version history");
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 if (open) {
 loadVersions();
 }
 }, [open, workflowId]);

  // Restore version
 const handleRestore = async (version: WorkflowVersion) => {
 if (version.version === currentVersion) {
 toast.info("This is already the current version");
 return;
 }

 if (!confirm(`Are you sure you want to restore to version ${version.version}? The current version will be saved as a new version.`)) {
 return;
 }

 try {
 await versionApi.restore(workflowId, version.version, `Restored to version ${version.version}`);
 toast.success("Version restored successfully");
 onRestore?.(version);
 setOpen(false);
 } catch (error) {
      toast.error("Failed to restore. Please try again.");
 }
 };

  // Select version to proceed for comparison
 const toggleVersionSelect = (version: number) => {
 setSelectedVersions((prev) => {
 if (prev.includes(version)) {
 return prev.filter((v) => v !== version);
 }
 if (prev.length >= 2) {
 return [prev[1], version];
 }
 return [...prev, version];
 });
 };

  // Get change type badges
 const getChangeTypeBadge = (type: string) => {
 const config = {
 create: { label: "Create", variant: "default" as const },
 update: { label: "Update", variant: "secondary" as const },
 restore: { label: "Restore", variant: "outline" as const },
 manual: { label: "Snapshot", variant: "outline" as const },
 };
 const { label, variant } = config[type as keyof typeof config] || config.update;
 return <Badge variant={variant}>{label}</Badge>;
 };

  // Process version comparison
 const handleCompare = async () => {
 if (selectedVersions.length !== 2) return;

 try {
 const v1 = Math.min(...selectedVersions);
 const v2 = Math.max(...selectedVersions);
 const response = await versionApi.compare(workflowId, v1, v2);
 const diff = response.data.diff;

      // Display comparison result summary
 toast.success(
 `Version comparison complete: ${diff.summary.nodes_change_count} node changes, ${diff.summary.edges_change_count} connection changes`
 );
 } catch (error) {
      toast.error("Failed to compare versions.");
 }
 };

 return (
 <Sheet open={open} onOpenChange={setOpen}>
 <SheetTrigger asChild>
 <Button variant="ghost" size="sm" className="gap-2">
 <History className="w-4 h-4" />
 Version History
 </Button>
 </SheetTrigger>
 <SheetContent className="w-[400px] sm:w-[540px]">
 <SheetHeader>
 <SheetTitle className="flex items-center justify-between">
 <span className="flex items-center gap-2">
 <History className="w-5 h-5" />
 Version History
 </span>
 {selectedVersions.length === 2 && (
 <Button
 size="sm"
 variant="outline"
 onClick={handleCompare}
 >
 <GitCompare className="w-4 h-4 mr-2" />
 Select versions to compare
 </Button>
 )}
 </SheetTitle>
 </SheetHeader>

 <ScrollArea className="h-[calc(100vh-120px)] mt-4">
 {loading ? (
 <div className="flex items-center justify-center py-12">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
 </div>
 ) : versions.length === 0 ? (
 <div className="text-center py-12 text-foreground-muted">
 No version history
 </div>
 ) : (
 <div className="space-y-2 pr-4">
 {versions.map((version, index) => (
 <div
 key={version.id}
 className={cn(
 "relative p-3 rounded-lg border transition-colors cursor-pointer",
 version.version === currentVersion
 ? "border-brand-500/40 bg-brand-200/30"
 : "hover:bg-surface-200/60",
 selectedVersions.includes(version.version) && "ring-2 ring-brand-500"
 )}
 onClick={() => toggleVersionSelect(version.version)}
 >
              {/* Timeline Connector */}
 {index < versions.length - 1 && (
 <div className="absolute left-6 top-12 w-0.5 h-[calc(100%-24px)] bg-border" />
 )}

 <div className="flex items-start gap-3">
              {/* Version Number Dot */}
 <div
 className={cn(
 "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
 version.version === currentVersion
 ? "bg-brand-500 text-background"
 : "bg-surface-200"
 )}
 >
 v{version.version}
 </div>

 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 {getChangeTypeBadge(version.change_type)}
 {version.version === currentVersion && (
 <Badge variant="default" className="bg-brand-500">
 Current
 </Badge>
 )}
 </div>

 <p className="text-sm truncate">
 {version.change_log || `Version ${version.version}`}
 </p>

 <div className="flex items-center gap-4 mt-2 text-xs text-foreground-muted">
 <span className="flex items-center gap-1">
 <Clock className="w-3 h-3" />
 {formatDistanceToNow(new Date(version.created_at), {
 addSuffix: true,
 locale: zhCN,
 })}
 </span>
                    <span>{version.node_count} Nodes</span>
                    <span>{version.edge_count} Connections</span>
 </div>

 {version.creator && (
 <div className="flex items-center gap-2 mt-2">
 <Avatar className="w-5 h-5">
 <AvatarImage src={version.creator.avatar_url} />
 <AvatarFallback>
 {version.creator.username[0].toUpperCase()}
 </AvatarFallback>
 </Avatar>
 <span className="text-xs text-foreground-muted">
 {version.creator.username}
 </span>
 </div>
 )}
 </div>

              {/* Restore Button */}
 {version.version !== currentVersion && (
 <Button
 size="sm"
 variant="ghost"
 className="shrink-0"
 onClick={(e) => {
 e.stopPropagation();
 handleRestore(version);
 }}
 >
 <RotateCcw className="w-4 h-4 mr-1" />
 Restore
 </Button>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </ScrollArea>
 </SheetContent>
 </Sheet>
 );
}
