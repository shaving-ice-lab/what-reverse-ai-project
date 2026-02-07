"use client";

/**
 * WorkflowVersion HistoryComponent
 *
 * Features: 
 * - AutoVersionCreate
 * - VersionListView
 * - Versionforcompare
 * - VersionRollback
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import {
 History,
 Clock,
 GitBranch,
 GitCompare,
 RotateCcw,
 ChevronDown,
 ChevronRight,
 Check,
 X,
 Eye,
 Copy,
 Trash2,
 MoreHorizontal,
 Plus,
 Minus,
 AlertCircle,
 Save,
 Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
 Tooltip,
 TooltipContent,
 TooltipProvider,
 TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

// ========== TypeDefinition ==========

export interface WorkflowVersion {
 id: string;
 versionNumber: number;
 name?: string;
 description?: string;
 createdAt: Date;
 createdBy?: string;
 isAutoSave: boolean;
 isCurrent: boolean;
 isTagged?: boolean;
 tagName?: string;
 changes?: VersionChanges;
 workflowSnapshot: string; // JSON Snapshot
}

export interface VersionChanges {
 nodesAdded: number;
 nodesRemoved: number;
 nodesModified: number;
 edgesAdded: number;
 edgesRemoved: number;
}

export interface WorkflowVersionHistoryProps {
 /** Workflow ID */
 workflowId: string;
 /** VersionList */
 versions: WorkflowVersion[];
 /** Current Version */
 currentVersionId?: string;
 /** CreateVersionCallback */
 onCreateVersion?: (name?: string, description?: string) => Promise<void>;
 /** RestoreVersionCallback */
 onRestoreVersion?: (versionId: string) => Promise<void>;
 /** PreviewVersionCallback */
 onPreviewVersion?: (versionId: string) => void;
 /** DeleteVersionCallback */
 onDeleteVersion?: (versionId: string) => Promise<void>;
 /** AddTagsCallback */
 onTagVersion?: (versionId: string, tagName: string) => Promise<void>;
 /** FetchVersionforcompareCallback */
 onCompareVersions?: (versionA: string, versionB: string) => Promise<VersionDiff>;
 /** isnoLoading */
 isLoading?: boolean;
 /** CustomClass Name */
 className?: string;
}

export interface VersionDiff {
 nodesAdded: NodeDiffItem[];
 nodesRemoved: NodeDiffItem[];
 nodesModified: NodeDiffItem[];
 edgesAdded: EdgeDiffItem[];
 edgesRemoved: EdgeDiffItem[];
}

interface NodeDiffItem {
 id: string;
 type: string;
 label?: string;
 changes?: string[];
}

interface EdgeDiffItem {
 id: string;
 sourceId: string;
 targetId: string;
}

// FormatTime
const formatTime = (date: Date): string => {
 const now = new Date();
 const diff = now.getTime() - date.getTime();

 if (diff < 60000) return "Just now";
 if (diff < 3600000) return `${Math.floor(diff / 60000)} minbefore`;
 if (diff < 86400000) return `${Math.floor(diff / 3600000)} hbefore`;
 if (diff < 604800000) return `${Math.floor(diff / 86400000)} daysbefore`;

 return date.toLocaleDateString("zh-CN", {
 month: "short",
 day: "numeric",
 hour: "2-digit",
 minute: "2-digit",
 });
};

// ========== VersionComponent ==========

interface VersionItemProps {
 version: WorkflowVersion;
 isSelected: boolean;
 compareMode: boolean;
 isCompareA: boolean;
 isCompareB: boolean;
 onSelect: () => void;
 onRestore: () => void;
 onPreview: () => void;
 onDelete: () => void;
 onTag: () => void;
 onCompareSelect: () => void;
}

function VersionItem({
 version,
 isSelected,
 compareMode,
 isCompareA,
 isCompareB,
 onSelect,
 onRestore,
 onPreview,
 onDelete,
 onTag,
 onCompareSelect,
}: VersionItemProps) {
 return (
 <div
 className={cn(
 "relative p-3 rounded-lg border transition-all cursor-pointer",
 isSelected
 ? "bg-brand-200/40 border-brand-500/40"
 : "bg-surface-100/60 border-border/50 hover:border-border",
 compareMode && (isCompareA || isCompareB) && "ring-2",
 isCompareA && "ring-brand-500",
 isCompareB && "ring-warning/60"
 )}
 onClick={compareMode ? onCompareSelect : onSelect}
 >
 {/* forcompareMark */}
 {compareMode && (isCompareA || isCompareB) && (
 <div
 className={cn(
 "absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-background",
 isCompareA ? "bg-brand-500" : "bg-warning"
 )}
 >
 {isCompareA ? "A" : "B"}
 </div>
 )}

 <div className="flex items-start justify-between gap-2">
 <div className="flex-1 min-w-0">
 {/* Version NumberandTags */}
 <div className="flex items-center gap-2">
 <span className="text-sm font-medium text-foreground">
 v{version.versionNumber}
 </span>
 {version.isCurrent && (
 <Badge
 variant="secondary"
 className="text-[10px] bg-brand-200/60 text-brand-500"
 >
 Current
 </Badge>
 )}
 {version.isAutoSave && (
 <Badge
 variant="secondary"
 className="text-[10px] bg-surface-200 text-foreground-muted"
 >
 Auto
 </Badge>
 )}
 {version.isTagged && version.tagName && (
 <Badge
 variant="secondary"
 className="text-[10px] bg-warning-200 text-warning"
 >
 <Tag className="w-2.5 h-2.5 mr-1" />
 {version.tagName}
 </Badge>
 )}
 </div>

 {/* Name */}
 {version.name && (
 <p className="text-sm text-foreground mt-1 truncate">{version.name}</p>
 )}

 {/* TimeandChangeInfo */}
 <div className="flex items-center gap-3 mt-1.5 text-xs text-foreground-muted">
 <span className="flex items-center gap-1">
 <Clock className="w-3 h-3" />
 {formatTime(version.createdAt)}
 </span>
 {version.changes && (
 <span className="flex items-center gap-1.5">
 {version.changes.nodesAdded > 0 && (
 <span className="text-brand-500">
 +{version.changes.nodesAdded}
 </span>
 )}
 {version.changes.nodesRemoved > 0 && (
 <span className="text-destructive">
 -{version.changes.nodesRemoved}
 </span>
 )}
 {version.changes.nodesModified > 0 && (
 <span className="text-warning">
 ~{version.changes.nodesModified}
 </span>
 )}
 </span>
 )}
 </div>
 </div>

 {/* ActionButton */}
 {!compareMode && (
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button
 className="p-1 rounded hover:bg-surface-200 transition-colors"
 onClick={(e) => e.stopPropagation()}
 >
 <MoreHorizontal className="w-4 h-4 text-foreground-muted" />
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent
 align="end"
 className="w-40 bg-surface-100 border-border"
 >
 <DropdownMenuItem
 onClick={(e) => {
 e.stopPropagation();
 onPreview();
 }}
 className="text-foreground focus:bg-surface-200"
 >
 <Eye className="w-4 h-4 mr-2" />
 Preview
 </DropdownMenuItem>
 {!version.isCurrent && (
 <DropdownMenuItem
 onClick={(e) => {
 e.stopPropagation();
 onRestore();
 }}
 className="text-foreground focus:bg-surface-200"
 >
 <RotateCcw className="w-4 h-4 mr-2" />
 Restore
 </DropdownMenuItem>
 )}
 <DropdownMenuItem
 onClick={(e) => {
 e.stopPropagation();
 onTag();
 }}
 className="text-foreground focus:bg-surface-200"
 >
 <Tag className="w-4 h-4 mr-2" />
 AddTags
 </DropdownMenuItem>
 {!version.isCurrent && (
 <DropdownMenuItem
 onClick={(e) => {
 e.stopPropagation();
 onDelete();
 }}
 className="text-destructive focus:bg-surface-200"
 >
 <Trash2 className="w-4 h-4 mr-2" />
 Delete
 </DropdownMenuItem>
 )}
 </DropdownMenuContent>
 </DropdownMenu>
 )}
 </div>
 </div>
 );
}

// ========== VersionforcompareComponent ==========

interface VersionDiffViewProps {
 diff: VersionDiff | null;
 isLoading: boolean;
}

function VersionDiffView({ diff, isLoading }: VersionDiffViewProps) {
 if (isLoading) {
 return (
 <div className="flex items-center justify-center py-8 text-foreground-muted">
 <div className="animate-spin w-5 h-5 border-2 border-foreground-muted border-t-transparent rounded-full" />
 </div>
 );
 }

 if (!diff) {
 return (
 <div className="flex flex-col items-center justify-center py-8 text-foreground-muted">
 <GitCompare className="w-8 h-8 mb-2 opacity-50" />
 <p className="text-sm">SelectVersionProceedforcompare</p>
 </div>
 );
 }

 const totalChanges =
 diff.nodesAdded.length +
 diff.nodesRemoved.length +
 diff.nodesModified.length +
 diff.edgesAdded.length +
 diff.edgesRemoved.length;

 if (totalChanges === 0) {
 return (
 <div className="flex flex-col items-center justify-center py-8 text-foreground-muted">
 <Check className="w-8 h-8 mb-2 text-brand-500" />
 <p className="text-sm">VersioncompleteallSame</p>
 </div>
 );
 }

 return (
 <div className="space-y-4">
 {/* AddNode */}
 {diff.nodesAdded.length > 0 && (
 <div>
 <div className="flex items-center gap-2 mb-2">
 <Plus className="w-4 h-4 text-brand-500" />
 <span className="text-sm font-medium text-brand-500">
 AddNode ({diff.nodesAdded.length})
 </span>
 </div>
 <div className="space-y-1 pl-6">
 {diff.nodesAdded.map((node) => (
 <div
 key={node.id}
 className="text-xs text-foreground-muted flex items-center gap-2"
 >
 <span className="text-foreground-muted/70">{node.type}</span>
 <span>{node.label || node.id}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* DeleteNode */}
 {diff.nodesRemoved.length > 0 && (
 <div>
 <div className="flex items-center gap-2 mb-2">
 <Minus className="w-4 h-4 text-destructive" />
 <span className="text-sm font-medium text-destructive">
 DeleteNode ({diff.nodesRemoved.length})
 </span>
 </div>
 <div className="space-y-1 pl-6">
 {diff.nodesRemoved.map((node) => (
 <div
 key={node.id}
 className="text-xs text-foreground-muted flex items-center gap-2 line-through"
 >
 <span className="text-foreground-muted/70">{node.type}</span>
 <span>{node.label || node.id}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* EditNode */}
 {diff.nodesModified.length > 0 && (
 <div>
 <div className="flex items-center gap-2 mb-2">
 <GitBranch className="w-4 h-4 text-warning" />
 <span className="text-sm font-medium text-warning">
 EditNode ({diff.nodesModified.length})
 </span>
 </div>
 <div className="space-y-1 pl-6">
 {diff.nodesModified.map((node) => (
 <div key={node.id} className="text-xs text-foreground-muted">
 <div className="flex items-center gap-2">
 <span className="text-foreground-muted/70">{node.type}</span>
 <span>{node.label || node.id}</span>
 </div>
 {node.changes && node.changes.length > 0 && (
 <ul className="mt-1 ml-4 text-[10px] text-foreground-muted/70">
 {node.changes.map((change, i) => (
 <li key={i}>• {change}</li>
 ))}
 </ul>
 )}
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}

// ========== mainComponent ==========

export function WorkflowVersionHistory({
 workflowId,
 versions,
 currentVersionId,
 onCreateVersion,
 onRestoreVersion,
 onPreviewVersion,
 onDeleteVersion,
 onTagVersion,
 onCompareVersions,
 isLoading = false,
 className,
}: WorkflowVersionHistoryProps) {
 const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
 const [compareMode, setCompareMode] = useState(false);
 const [compareVersionA, setCompareVersionA] = useState<string | null>(null);
 const [compareVersionB, setCompareVersionB] = useState<string | null>(null);
 const [diff, setDiff] = useState<VersionDiff | null>(null);
 const [isDiffLoading, setIsDiffLoading] = useState(false);

 const [showCreateDialog, setShowCreateDialog] = useState(false);
 const [showTagDialog, setShowTagDialog] = useState(false);
 const [tagVersionId, setTagVersionId] = useState<string | null>(null);
 const [newVersionName, setNewVersionName] = useState("");
 const [newTagName, setNewTagName] = useState("");

 // SortVersion(mostnewatbefore)
 const sortedVersions = useMemo(
 () => [...versions].sort((a, b) => b.versionNumber - a.versionNumber),
 [versions]
 );

 // ProcessforcompareSelect
 const handleCompareSelect = useCallback((versionId: string) => {
 if (!compareVersionA) {
 setCompareVersionA(versionId);
 } else if (!compareVersionB && versionId !== compareVersionA) {
 setCompareVersionB(versionId);
 } else {
 // re-newSelect
 setCompareVersionA(versionId);
 setCompareVersionB(null);
 setDiff(null);
 }
 }, [compareVersionA, compareVersionB]);

 // Executeforcompare
 useEffect(() => {
 if (compareVersionA && compareVersionB && onCompareVersions) {
 setIsDiffLoading(true);
 onCompareVersions(compareVersionA, compareVersionB)
 .then(setDiff)
.catch(() => toast.error("forcompareFailed"))
 .finally(() => setIsDiffLoading(false));
 }
 }, [compareVersionA, compareVersionB, onCompareVersions]);

 // Exitforcompare
 const exitCompareMode = useCallback(() => {
 setCompareMode(false);
 setCompareVersionA(null);
 setCompareVersionB(null);
 setDiff(null);
 }, []);

 // CreateVersion
 const handleCreateVersion = useCallback(async () => {
 if (!onCreateVersion) return;

 try {
 await onCreateVersion(newVersionName || undefined);
 toast.success("VersionalreadyCreate");
 setShowCreateDialog(false);
 setNewVersionName("");
 } catch {
 toast.error("CreateFailed");
 }
 }, [newVersionName, onCreateVersion]);

 // RestoreVersion
 const handleRestore = useCallback(async (versionId: string) => {
 if (!onRestoreVersion) return;

 try {
 await onRestoreVersion(versionId);
 toast.success("VersionalreadyRestore");
 } catch {
 toast.error("RestoreFailed");
 }
 }, [onRestoreVersion]);

 // AddTags
 const handleAddTag = useCallback(async () => {
 if (!onTagVersion || !tagVersionId || !newTagName.trim()) return;

 try {
 await onTagVersion(tagVersionId, newTagName.trim());
 toast.success("TagsalreadyAdd");
 setShowTagDialog(false);
 setTagVersionId(null);
 setNewTagName("");
 } catch {
 toast.error("AddFailed");
 }
 }, [tagVersionId, newTagName, onTagVersion]);

 return (
 <div className={cn("flex flex-col h-full", className)}>
 {/* Header */}
 <div className="shrink-0 p-4 border-b border-border">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2">
 <History className="w-4 h-4 text-foreground-muted" />
 <h3 className="text-sm font-medium text-foreground">Version History</h3>
 <Badge variant="secondary" className="text-[10px] bg-surface-200">
 {versions.length}
 </Badge>
 </div>

 <div className="flex items-center gap-2">
 {compareMode ? (
 <Button
 variant="ghost"
 size="sm"
 className="h-7 text-xs"
 onClick={exitCompareMode}
 >
 <X className="w-3.5 h-3.5 mr-1" />
 Exitforcompare
 </Button>
 ) : (
 <TooltipProvider>
 <Tooltip>
 <TooltipTrigger asChild>
 <Button
 variant="ghost"
 size="sm"
 className="h-7 w-7 p-0"
 onClick={() => setCompareMode(true)}
 >
 <GitCompare className="w-4 h-4 text-foreground-muted" />
 </Button>
 </TooltipTrigger>
 <TooltipContent>Versionforcompare</TooltipContent>
 </Tooltip>
 </TooltipProvider>
 )}

 <Button
 size="sm"
 className="h-7 text-xs bg-brand-500 hover:bg-brand-600 text-background"
 onClick={() => setShowCreateDialog(true)}
 >
 <Save className="w-3.5 h-3.5 mr-1" />
 SaveVersion
 </Button>
 </div>
 </div>

 {/* forcompareTip */}
 {compareMode && (
 <div className="p-2 rounded-lg bg-brand-200/60 text-xs text-brand-500">
 {!compareVersionA
 ? "Select#1Version (A)"
 : !compareVersionB
 ? "Select#2Version (B)"
: "forcompareResult"}
 </div>
 )}
 </div>

 {/* ContentRegion */}
 <div className="flex-1 overflow-hidden flex">
 {/* VersionList */}
 <ScrollArea className={cn("flex-1", compareMode && compareVersionA && compareVersionB && "w-1/2")}>
 <div className="p-4 space-y-2">
 {sortedVersions.map((version) => (
 <VersionItem
 key={version.id}
 version={version}
 isSelected={selectedVersionId === version.id}
 compareMode={compareMode}
 isCompareA={compareVersionA === version.id}
 isCompareB={compareVersionB === version.id}
 onSelect={() => setSelectedVersionId(version.id)}
 onRestore={() => handleRestore(version.id)}
 onPreview={() => onPreviewVersion?.(version.id)}
 onDelete={() => onDeleteVersion?.(version.id)}
 onTag={() => {
 setTagVersionId(version.id);
 setShowTagDialog(true);
 }}
 onCompareSelect={() => handleCompareSelect(version.id)}
 />
 ))}

 {versions.length === 0 && (
 <div className="flex flex-col items-center justify-center py-12 text-foreground-muted">
 <History className="w-10 h-10 mb-3 opacity-50" />
 <p className="text-sm">NoneVersion History</p>
 <p className="text-xs mt-1">SaveVersionwithStartRecord</p>
 </div>
 )}
 </div>
 </ScrollArea>

 {/* forcompareResult */}
 {compareMode && compareVersionA && compareVersionB && (
 <div className="w-1/2 border-l border-border">
 <ScrollArea className="h-full">
 <div className="p-4">
 <h4 className="text-sm font-medium text-foreground mb-4">
 forcompareResult
 </h4>
 <VersionDiffView diff={diff} isLoading={isDiffLoading} />
 </div>
 </ScrollArea>
 </div>
 )}
 </div>

 {/* CreateVersionDialog */}
 <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
 <DialogContent className="bg-surface-100 border-border">
 <DialogHeader>
 <DialogTitle className="text-foreground">SaveVersion</DialogTitle>
 <DialogDescription className="text-foreground-muted">
 CreateCurrentWorkflow'sVersionSnapshot
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-4">
 <Input
 placeholder="VersionName(Optional)"
 value={newVersionName}
 onChange={(e) => setNewVersionName(e.target.value)}
 className="bg-surface-100 border-border"
 />
 </div>
 <DialogFooter>
 <Button
 variant="ghost"
 onClick={() => setShowCreateDialog(false)}
 >
 Cancel
 </Button>
 <Button
 className="bg-brand-500 hover:bg-brand-600 text-background"
 onClick={handleCreateVersion}
 >
 Save
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* AddTagsDialog */}
 <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
 <DialogContent className="bg-surface-100 border-border">
 <DialogHeader>
 <DialogTitle className="text-foreground">AddTags</DialogTitle>
 <DialogDescription className="text-foreground-muted">
 asthisVersionAdd1atIdentify'sTags
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-4">
 <Input
 placeholder="TagsName, if v1.0, stable"
 value={newTagName}
 onChange={(e) => setNewTagName(e.target.value)}
 className="bg-surface-100 border-border"
 />
 </div>
 <DialogFooter>
 <Button
 variant="ghost"
 onClick={() => setShowTagDialog(false)}
 >
 Cancel
 </Button>
 <Button
 className="bg-brand-500 hover:bg-brand-600 text-background"
 onClick={handleAddTag}
 disabled={!newTagName.trim()}
 >
 Add
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 );
}

export default WorkflowVersionHistory;
