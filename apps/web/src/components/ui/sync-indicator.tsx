"use client";

/**
 * SyncStatusIndicatorComponent
 *
 * Features: 
 * - DisplaySyncStatus(Sync/alreadySync/hasConflict/Error)
 * - ManualSyncTrigger
 * - AutoSyncConfig
 * - ConflictCountTip
 */

import { useState, useEffect, useCallback } from "react";
import {
 Cloud,
 CloudOff,
 RefreshCw,
 AlertTriangle,
 CheckCircle2,
 Loader2,
 Settings2,
 ChevronDown,
 Wifi,
 WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
 Popover,
 PopoverContent,
 PopoverTrigger,
} from "@/components/ui/popover";
import {
 Tooltip,
 TooltipContent,
 TooltipProvider,
 TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ========== TypeDefinition ==========

export type SyncState = "idle" | "syncing" | "synced" | "conflict" | "error" | "offline";

export interface SyncStatus {
 deviceId: string;
 lastSyncAt?: string;
 pendingChanges: number;
 conflictsCount: number;
 totalSyncedItems: number;
 syncState: SyncState;
}

export interface SyncIndicatorProps {
 /** SyncStatus */
 status?: SyncStatus | null;
 /** isnoEnableAutoSync */
 autoSyncEnabled?: boolean;
 /** AutoSyncbetween(min) */
 autoSyncInterval?: number;
 /** ManualSyncCallback */
 onSync?: () => Promise<void>;
 /** AutoSyncSwitchCallback */
 onAutoSyncToggle?: (enabled: boolean) => void;
 /** ViewConflictCallback */
 onViewConflicts?: () => void;
 /** OpenSettingsCallback */
 onOpenSettings?: () => void;
 /** isnoDisable */
 disabled?: boolean;
 /** isnoat Tauri Environment */
 isTauri?: boolean;
 /** CustomClass Name */
 className?: string;
}

// StatusConfig
const STATE_CONFIG: Record<SyncState, {
 icon: typeof Cloud;
 color: string;
 bgColor: string;
 label: string;
}> = {
 idle: {
 icon: Cloud,
 color: "text-muted-foreground",
 bgColor: "bg-muted",
 label: "pendingSync",
 },
 syncing: {
 icon: RefreshCw,
 color: "text-blue-400",
 bgColor: "bg-blue-500/10",
 label: "Sync",
 },
 synced: {
 icon: CheckCircle2,
 color: "text-primary",
 bgColor: "bg-primary/10",
 label: "alreadySync",
 },
 conflict: {
 icon: AlertTriangle,
 color: "text-amber-400",
 bgColor: "bg-amber-500/10",
 label: "hasConflict",
 },
 error: {
 icon: CloudOff,
 color: "text-red-400",
 bgColor: "bg-red-500/10",
 label: "SyncFailed",
 },
 offline: {
 icon: WifiOff,
 color: "text-muted-foreground",
 bgColor: "bg-muted",
 label: "Offline",
 },
};

// FormatTime
const formatTime = (dateStr?: string): string => {
 if (!dateStr) return "fromnot yetSync";
 
 const date = new Date(dateStr);
 const now = new Date();
 const diff = now.getTime() - date.getTime();
 
 if (diff < 60000) return "Just now";
 if (diff < 3600000) return `${Math.floor(diff / 60000)} minbefore`;
 if (diff < 86400000) return `${Math.floor(diff / 3600000)} hbefore`;
 
 return date.toLocaleDateString("zh-CN", {
 month: "short",
 day: "numeric",
 hour: "2-digit",
 minute: "2-digit",
 });
};

export function SyncIndicator({
 status,
 autoSyncEnabled = false,
 autoSyncInterval = 5,
 onSync,
 onAutoSyncToggle,
 onViewConflicts,
 onOpenSettings,
 disabled = false,
 isTauri = false,
 className,
}: SyncIndicatorProps) {
 const [isSyncing, setIsSyncing] = useState(false);
 const [isOpen, setIsOpen] = useState(false);
 const [isOnline, setIsOnline] = useState(true);
 
 // ListenOnlineStatus
 useEffect(() => {
 const handleOnline = () => setIsOnline(true);
 const handleOffline = () => setIsOnline(false);
 
 window.addEventListener("online", handleOnline);
 window.addEventListener("offline", handleOffline);
 setIsOnline(navigator.onLine);
 
 return () => {
 window.removeEventListener("online", handleOnline);
 window.removeEventListener("offline", handleOffline);
 };
 }, []);
 
 // AutoSync
 useEffect(() => {
 if (!autoSyncEnabled || !onSync || !isOnline) return;
 
 const interval = setInterval(() => {
 if (!isSyncing) {
 handleSync();
 }
 }, autoSyncInterval * 60 * 1000);
 
 return () => clearInterval(interval);
 }, [autoSyncEnabled, autoSyncInterval, isOnline, isSyncing, onSync]);
 
 // ProcessManualSync
 const handleSync = useCallback(async () => {
 if (isSyncing || !onSync) return;
 
 setIsSyncing(true);
 try {
 await onSync();
 toast.success("SyncDone");
 } catch (error) {
 toast.error("SyncFailed", {
 description: error instanceof Error ? error.message: "PleaseRetry",
 });
 } finally {
 setIsSyncing(false);
 }
 }, [isSyncing, onSync]);
 
 // OKCurrentStatus
 const currentState: SyncState = !isOnline
 ? "offline"
 : isSyncing
 ? "syncing"
 : status?.syncState || "idle";
 
 const config = STATE_CONFIG[currentState];
 const Icon = config.icon;
 
 // Tauri EnvironmentDisplayVersion
 if (!isTauri) {
 return (
 <TooltipProvider>
 <Tooltip>
 <TooltipTrigger asChild>
 <div
 className={cn(
 "flex items-center gap-1.5 px-2 py-1 rounded-md",
 config.bgColor,
 className
 )}
 >
 <Cloud className={cn("w-3.5 h-3.5", config.color)} />
 <span className={cn("text-xs", config.color)}>Cloud</span>
 </div>
 </TooltipTrigger>
 <TooltipContent>
 <p>DataAutoSavetoCloud</p>
 </TooltipContent>
 </Tooltip>
 </TooltipProvider>
 );
 }
 
 return (
 <Popover open={isOpen} onOpenChange={setIsOpen}>
 <PopoverTrigger asChild>
 <Button
 variant="ghost"
 size="sm"
 disabled={disabled}
 className={cn(
 "h-8 px-2 gap-1.5",
 config.bgColor,
 "hover:bg-opacity-20",
 className
 )}
 >
 <Icon
 className={cn(
 "w-4 h-4",
 config.color,
 currentState === "syncing" && "animate-spin"
 )}
 />
 <span className={cn("text-xs hidden sm:inline", config.color)}>
 {config.label}
 </span>
 {status?.conflictsCount && status.conflictsCount > 0 && (
 <Badge
 variant="secondary"
 className="h-4 min-w-4 px-1 text-[10px] bg-amber-500/20 text-amber-400"
 >
 {status.conflictsCount}
 </Badge>
 )}
 <ChevronDown className={cn("w-3 h-3", config.color)} />
 </Button>
 </PopoverTrigger>
 
 <PopoverContent
 align="end"
 className="w-72 p-0 bg-card border-border"
 >
 {/* StatusHeader */}
 <div className="p-4 border-b border-border">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2">
 <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.bgColor)}>
 <Icon className={cn("w-4 h-4", config.color, currentState === "syncing" && "animate-spin")} />
 </div>
 <div>
 <p className="text-sm font-medium text-foreground">{config.label}</p>
 <p className="text-xs text-muted-foreground">
 {formatTime(status?.lastSyncAt)}
 </p>
 </div>
 </div>
 {!isOnline && (
 <Badge variant="secondary" className="bg-muted text-muted-foreground">
 <WifiOff className="w-3 h-3 mr-1" />
 Offline
 </Badge>
 )}
 </div>
 
 {/* StatisticsInfo */}
 <div className="grid grid-cols-3 gap-2 text-center">
 <div className="p-2 rounded-lg bg-muted">
 <p className="text-lg font-semibold text-foreground">
 {status?.totalSyncedItems || 0}
 </p>
 <p className="text-[10px] text-muted-foreground">alreadySync</p>
 </div>
 <div className="p-2 rounded-lg bg-muted">
 <p className="text-lg font-semibold text-foreground">
 {status?.pendingChanges || 0}
 </p>
 <p className="text-[10px] text-muted-foreground">pendingSync</p>
 </div>
 <div className="p-2 rounded-lg bg-muted">
 <p className={cn(
 "text-lg font-semibold",
 status?.conflictsCount && status.conflictsCount > 0
 ? "text-amber-400"
 : "text-foreground"
 )}>
 {status?.conflictsCount || 0}
 </p>
 <p className="text-[10px] text-muted-foreground">Conflict</p>
 </div>
 </div>
 </div>
 
 {/* ConflictTip */}
 {status?.conflictsCount && status.conflictsCount > 0 && (
 <div className="px-4 py-3 border-b border-border bg-amber-500/5">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <AlertTriangle className="w-4 h-4 text-amber-400" />
 <span className="text-sm text-amber-400">
 has {status.conflictsCount} ConflictneedneedResolve
 </span>
 </div>
 <Button
 variant="ghost"
 size="sm"
 className="h-7 text-xs text-amber-400 hover:text-amber-300"
 onClick={() => {
 setIsOpen(false);
 onViewConflicts?.();
 }}
 >
 View
 </Button>
 </div>
 </div>
 )}
 
 {/* ActionButton */}
 <div className="p-4 space-y-3">
 {/* ManualSync */}
 <Button
 className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
 disabled={isSyncing || !isOnline}
 onClick={handleSync}
 >
 {isSyncing ? (
 <>
 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
 Sync...
 </>
 ) : (
 <>
 <RefreshCw className="w-4 h-4 mr-2" />
 NowSync
 </>
 )}
 </Button>
 
 {/* AutoSyncToggle */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Cloud className="w-4 h-4 text-muted-foreground" />
 <span className="text-sm text-foreground">AutoSync</span>
 {autoSyncEnabled && (
 <span className="text-[10px] text-muted-foreground">
 each {autoSyncInterval} min
 </span>
 )}
 </div>
 <Switch
 checked={autoSyncEnabled}
 onCheckedChange={onAutoSyncToggle}
 disabled={!isOnline}
 />
 </div>
 </div>
 
 {/* FooterSettings */}
 <div className="px-4 py-3 border-t border-border">
 <Button
 variant="ghost"
 size="sm"
 className="w-full justify-start text-muted-foreground hover:text-foreground"
 onClick={() => {
 setIsOpen(false);
 onOpenSettings?.();
 }}
 >
 <Settings2 className="w-4 h-4 mr-2" />
 SyncSettings
 </Button>
 </div>
 </PopoverContent>
 </Popover>
 );
}

export default SyncIndicator;
