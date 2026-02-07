"use client";

/**
 * NotificationscenterComponent
 * 
 * SystemNotifications, ExecuteAlert, UpdateReminder
 * Usage WebSocket ReceiveReal-timeNotifications
 */

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
 Bell,
 BellOff,
 Check,
 CheckCheck,
 AlertTriangle,
 Info,
 Sparkles,
 X,
 Settings,
 ChevronDown,
 Filter,
 Wifi,
 WifiOff,
} from "lucide-react";
import { useWebSocketContext, type Notification as WSNotification } from "@/contexts/WebSocketContext";

type NotificationType = "alert" | "info" | "update" | "success";

interface Notification {
 id: string;
 type: NotificationType;
 title: string;
 message: string;
 time: Date;
 read: boolean;
 actionUrl?: string;
 actionLabel?: string;
}

// DefaultSystemNotifications(atNoReal-timeNotificationstimeDisplay)
const defaultNotifications: Notification[] = [
 {
 id: "welcome",
 type: "info",
 title: "WelcomeUsage AgentFlow",
 message: "thisinwillDisplayWorkflowExecuteStatusandSystemNotifications",
 time: new Date(),
 read: false,
 },
];

interface NotificationCenterProps {
 className?: string;
 compact?: boolean;
}

export function NotificationCenter({ className, compact = false }: NotificationCenterProps) {
 const router = useRouter();
 
 // TryUsage WebSocket Context(cancanDoes not exist)
 let wsContext: ReturnType<typeof useWebSocketContext> | null = null;
 try {
 wsContext = useWebSocketContext();
 } catch (e) {
 // WebSocket ContextUnavailable, UsageDefaultData
 }
 
 const [localNotifications, setLocalNotifications] = useState<Notification[]>(defaultNotifications);
 const [filter, setFilter] = useState<NotificationType | "all">("all");
 const [showDropdown, setShowDropdown] = useState(false);
 const [isMuted, setIsMuted] = useState(false);

 // Convert WebSocket NotificationsasLocalNotificationsFormat
 const convertWSNotification = (n: WSNotification): Notification => {
 let type: NotificationType = "info";
 if (n.type === "error") type = "alert";
 else if (n.type === "success") type = "success";
 else if (n.type === "warning") type = "alert";
 
 return {
 id: n.id,
 type,
 title: n.title,
 message: n.message,
 time: n.timestamp,
 read: n.read,
 actionUrl: n.executionId ? `/executions/${n.executionId}` : undefined,
 actionLabel: n.executionId ? "ViewExecuteDetails": undefined,
 };
 };

 // and WebSocket NotificationsandLocalNotifications
 const notifications = useMemo(() => {
 if (wsContext?.notifications && wsContext.notifications.length > 0) {
 return wsContext.notifications.map(convertWSNotification);
 }
 return localNotifications;
 }, [wsContext?.notifications, localNotifications]);

 const filteredNotifications = useMemo(() => {
 if (filter === "all") return notifications;
 return notifications.filter((n) => n.type === filter);
 }, [notifications, filter]);

 const unreadCount = wsContext?.unreadCount ?? notifications.filter((n) => !n.read).length;
 const isConnected = wsContext?.isConnected ?? false;

 const markAsRead = (id: string) => {
 if (wsContext) {
 wsContext.markAsRead(id);
 } else {
 setLocalNotifications((prev) =>
 prev.map((n) => (n.id === id ? { ...n, read: true } : n))
 );
 }
 };

 const markAllAsRead = () => {
 if (wsContext) {
 wsContext.markAllAsRead();
 } else {
 setLocalNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
 }
 };

 const removeNotification = (id: string) => {
 setLocalNotifications((prev) => prev.filter((n) => n.id !== id));
 };

 const handleNotificationClick = (notification: Notification) => {
 markAsRead(notification.id);
 if (notification.actionUrl) {
 router.push(notification.actionUrl);
 }
 };

 const getTypeIcon = (type: NotificationType) => {
 switch (type) {
 case "alert":
 return <AlertTriangle className="w-4 h-4 text-red-500" />;
 case "info":
 return <Info className="w-4 h-4 text-blue-500" />;
 case "update":
 return <Sparkles className="w-4 h-4 text-purple-500" />;
 case "success":
 return <Check className="w-4 h-4 text-primary" />;
 }
 };

 const getTypeLabel = (type: NotificationType) => {
 switch (type) {
 case "alert":
 return "Alert";
 case "info":
 return "Notifications";
 case "update":
 return "Update";
 case "success":
 return "Success";
 }
 };

 const formatTime = (date: Date) => {
 const now = new Date();
 const diff = now.getTime() - date.getTime();
 const minutes = Math.floor(diff / 60000);
 const hours = Math.floor(diff / 3600000);
 const days = Math.floor(diff / 86400000);

 if (minutes < 1) return "Just now";
 if (minutes < 60) return `${minutes} minbefore`;
 if (hours < 24) return `${hours} hbefore`;
 return `${days} daysbefore`;
 };

 return (
 <Card className={cn("border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden hover:border-rose-500/20 transition-colors duration-300", className)}>
 {/* Header */}
 <div className="flex items-center justify-between p-4 border-b border-border/50">
 <div className="flex items-center gap-3">
 <div className="relative p-2 rounded-xl bg-rose-500/10 ring-1 ring-rose-500/20">
 {isMuted ? (
 <BellOff className="w-5 h-5 text-foreground-light" />
 ) : (
 <Bell className="w-5 h-5 text-rose-500" />
 )}
 {unreadCount > 0 && !isMuted && (
 <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold ring-2 ring-card animate-pulse">
 {unreadCount > 9 ? "9+" : unreadCount}
 </span>
 )}
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h3 className="font-bold text-foreground">Notificationscenter</h3>
 {wsContext && (
 <span className={cn(
 "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] ring-1",
 isConnected 
 ? "bg-primary/10 text-primary ring-primary/20" 
 : "bg-red-500/10 text-red-500 ring-red-500/20"
 )}>
 {isConnected ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
 </span>
 )}
 </div>
 <p className="text-xs text-foreground-light">
 {unreadCount > 0 ? `${unreadCount} not yetread`: "allsectionalreadyread"}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2">
 {/* Filter - Enhanced */}
 <div className="relative">
 <button
 onClick={() => setShowDropdown(!showDropdown)}
 className={cn(
 "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm text-foreground-light",
 "bg-muted/50 hover:bg-surface-200 hover:text-foreground transition-all duration-200",
 "ring-1 ring-transparent hover:ring-border/50"
 )}
 >
 <Filter className="w-3.5 h-3.5" />
 <span className="text-xs font-medium">
 {filter === "all" ? "allsection": getTypeLabel(filter as NotificationType)}
 </span>
 <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", showDropdown && "rotate-180")} />
 </button>

 {showDropdown && (
 <div className="absolute right-0 top-full mt-2 bg-popover/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-2xl overflow-hidden z-10 min-w-[140px] ring-1 ring-white/5">
 {(["all", "alert", "info", "update", "success"] as const).map((type, index) => (
 <button
 key={type}
 onClick={() => {
 setFilter(type);
 setShowDropdown(false);
 }}
 className={cn(
 "flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-left transition-all duration-200",
 filter === type 
 ? "bg-primary/10 text-primary" 
 : "text-foreground-light hover:text-foreground hover:bg-muted/50"
 )}
 style={{
 animationDelay: `${index * 30}ms`,
 animation: 'fadeInUp 200ms ease-out both'
 }}
 >
 {type !== "all" && (
 <span className="scale-90">{getTypeIcon(type as NotificationType)}</span>
 )}
 {type === "all" && <span className="w-4 h-4 flex items-center justify-center text-xs">●</span>}
 <span className="font-medium">{type === "all" ? "allsection": getTypeLabel(type as NotificationType)}</span>
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Mute - Enhanced */}
 <button
 onClick={() => setIsMuted(!isMuted)}
 className={cn(
 "p-2 rounded-xl transition-all duration-200",
 isMuted 
 ? "bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20" 
 : "text-foreground-light hover:text-foreground hover:bg-muted/50"
 )}
 title={isMuted ? "CancelMute": "MuteNotifications"}
 >
 {isMuted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
 </button>

 {/* allsectionalreadyread - Enhanced */}
 {unreadCount > 0 && (
 <button
 onClick={markAllAsRead}
 className="p-2 rounded-xl text-foreground-light hover:text-primary hover:bg-primary/10 transition-all duration-200"
 title="allsectionMarkasalreadyread"
 >
 <CheckCheck className="w-4 h-4" />
 </button>
 )}
 </div>
 </div>

 {/* NotificationsList */}
 <div className={cn("overflow-auto", compact ? "max-h-64" : "max-h-96")}>
 {filteredNotifications.length === 0 ? (
 <div className="py-12 text-center">
 <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
 <Bell className="w-8 h-8 text-foreground-light/30" />
 </div>
 <p className="text-sm text-foreground-light">NoneNotifications</p>
 <p className="text-xs text-foreground-light/60 mt-1">SystemMessagewillDisplayatthisin</p>
 </div>
 ) : (
 filteredNotifications.map((notification, index) => (
 <div
 key={notification.id}
 className={cn(
 "p-4 border-b border-border/30 last:border-0 transition-all duration-200 group cursor-pointer",
 !notification.read 
 ? "bg-gradient-to-r from-blue-500/5 to-transparent hover:from-blue-500/10" 
 : "hover:bg-muted/30"
 )}
 onClick={() => handleNotificationClick(notification)}
 style={{
 animationDelay: `${index * 50}ms`,
 animation: 'fadeInUp 300ms ease-out both'
 }}
 >
 <div className="flex items-start gap-3">
 <div className={cn(
 "shrink-0 mt-0.5 p-1.5 rounded-lg transition-all duration-200",
 notification.type === "alert" && "bg-red-500/10",
 notification.type === "info" && "bg-blue-500/10",
 notification.type === "update" && "bg-purple-500/10",
 notification.type === "success" && "bg-primary/10"
 )}>
 {getTypeIcon(notification.type)}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
 {notification.title}
 </h4>
 {!notification.read && (
 <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 ring-4 ring-blue-500/20 animate-pulse" />
 )}
 </div>
 <p className="text-xs text-foreground-light mb-2 line-clamp-2">
 {notification.message}
 </p>
 <div className="flex items-center justify-between">
 <span className="text-[10px] text-foreground-light/60 px-1.5 py-0.5 rounded-full bg-muted/50">
 {formatTime(notification.time)}
 </span>
 {notification.actionUrl && (
 <a
 href={notification.actionUrl}
 className="text-xs text-primary hover:underline font-medium"
 onClick={(e) => e.stopPropagation()}
 >
 {notification.actionLabel || "ViewDetails"}
 </a>
 )}
 </div>
 </div>
 <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
 {!notification.read && (
 <button
 onClick={(e) => {
 e.stopPropagation();
 markAsRead(notification.id);
 }}
 className="p-1.5 rounded-lg hover:bg-surface-200 transition-colors text-foreground-light hover:text-primary"
 title="Markasalreadyread"
 >
 <Check className="w-3.5 h-3.5" />
 </button>
 )}
 <button
 onClick={(e) => {
 e.stopPropagation();
 removeNotification(notification.id);
 }}
 className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-foreground-light hover:text-red-500"
 title="Delete"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 </div>
 ))
 )}
 </div>

 {/* Footer - Enhanced */}
 {!compact && filteredNotifications.length > 0 && (
 <div className="p-4 border-t border-border/50 bg-gradient-to-r from-muted/30 via-transparent to-muted/30">
 <div className="flex items-center justify-between text-xs text-foreground-light">
 <span className="flex items-center gap-2">
 <Bell className="w-3 h-3" />
 {filteredNotifications.length} Notifications
 {unreadCount > 0 && (
 <span className="px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-medium">
 {unreadCount} not yetread
 </span>
 )}
 </span>
 <a 
 href="/dashboard/settings/notifications" 
 className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:text-foreground hover:bg-muted/50 transition-all duration-200 group"
 >
 <Settings className="w-3 h-3 group-hover:rotate-90 transition-transform duration-300" />
 <span>Notification Settings</span>
 </a>
 </div>
 </div>
 )}
 </Card>
 );
}
