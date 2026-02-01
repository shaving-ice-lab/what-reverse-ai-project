"use client";

/**
 * 同步状态指示器组件
 *
 * 功能：
 * - 显示同步状态（同步中/已同步/有冲突/错误）
 * - 手动同步触发
 * - 自动同步配置
 * - 冲突数量提示
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

// ========== 类型定义 ==========

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
  /** 同步状态 */
  status?: SyncStatus | null;
  /** 是否启用自动同步 */
  autoSyncEnabled?: boolean;
  /** 自动同步间隔（分钟） */
  autoSyncInterval?: number;
  /** 手动同步回调 */
  onSync?: () => Promise<void>;
  /** 自动同步切换回调 */
  onAutoSyncToggle?: (enabled: boolean) => void;
  /** 查看冲突回调 */
  onViewConflicts?: () => void;
  /** 打开设置回调 */
  onOpenSettings?: () => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否在 Tauri 环境 */
  isTauri?: boolean;
  /** 自定义类名 */
  className?: string;
}

// 状态配置
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
    label: "待同步",
  },
  syncing: {
    icon: RefreshCw,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    label: "同步中",
  },
  synced: {
    icon: CheckCircle2,
    color: "text-primary",
    bgColor: "bg-primary/10",
    label: "已同步",
  },
  conflict: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    label: "有冲突",
  },
  error: {
    icon: CloudOff,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    label: "同步失败",
  },
  offline: {
    icon: WifiOff,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    label: "离线",
  },
};

// 格式化时间
const formatTime = (dateStr?: string): string => {
  if (!dateStr) return "从未同步";
  
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return "刚刚";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  
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
  
  // 监听在线状态
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
  
  // 自动同步
  useEffect(() => {
    if (!autoSyncEnabled || !onSync || !isOnline) return;
    
    const interval = setInterval(() => {
      if (!isSyncing) {
        handleSync();
      }
    }, autoSyncInterval * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [autoSyncEnabled, autoSyncInterval, isOnline, isSyncing, onSync]);
  
  // 处理手动同步
  const handleSync = useCallback(async () => {
    if (isSyncing || !onSync) return;
    
    setIsSyncing(true);
    try {
      await onSync();
      toast.success("同步完成");
    } catch (error) {
      toast.error("同步失败", {
        description: error instanceof Error ? error.message : "请重试",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, onSync]);
  
  // 确定当前状态
  const currentState: SyncState = !isOnline
    ? "offline"
    : isSyncing
    ? "syncing"
    : status?.syncState || "idle";
  
  const config = STATE_CONFIG[currentState];
  const Icon = config.icon;
  
  // 非 Tauri 环境显示简化版本
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
              <span className={cn("text-xs", config.color)}>云端</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>数据自动保存到云端</p>
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
        {/* 状态头部 */}
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
                离线
              </Badge>
            )}
          </div>
          
          {/* 统计信息 */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-muted">
              <p className="text-lg font-semibold text-foreground">
                {status?.totalSyncedItems || 0}
              </p>
              <p className="text-[10px] text-muted-foreground">已同步</p>
            </div>
            <div className="p-2 rounded-lg bg-muted">
              <p className="text-lg font-semibold text-foreground">
                {status?.pendingChanges || 0}
              </p>
              <p className="text-[10px] text-muted-foreground">待同步</p>
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
              <p className="text-[10px] text-muted-foreground">冲突</p>
            </div>
          </div>
        </div>
        
        {/* 冲突提示 */}
        {status?.conflictsCount && status.conflictsCount > 0 && (
          <div className="px-4 py-3 border-b border-border bg-amber-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-amber-400">
                  有 {status.conflictsCount} 个冲突需要解决
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
                查看
              </Button>
            </div>
          </div>
        )}
        
        {/* 操作按钮 */}
        <div className="p-4 space-y-3">
          {/* 手动同步 */}
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isSyncing || !isOnline}
            onClick={handleSync}
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                同步中...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                立即同步
              </>
            )}
          </Button>
          
          {/* 自动同步开关 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">自动同步</span>
              {autoSyncEnabled && (
                <span className="text-[10px] text-muted-foreground">
                  每 {autoSyncInterval} 分钟
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
        
        {/* 底部设置 */}
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
            同步设置
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default SyncIndicator;
