"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
 Play,
 Zap,
 Bot,
 Database,
 Mail,
 FileText,
 Globe,
 Users,
 CheckCircle,
 Clock,
} from "lucide-react";

// Activity Type
const activityTypes = [
 { type: "workflow_run", icon: Play, color: "text-emerald-500", bg: "bg-emerald-500/10" },
 { type: "ai_request", icon: Bot, color: "text-violet-500", bg: "bg-violet-500/10" },
 { type: "data_process", icon: Database, color: "text-blue-500", bg: "bg-blue-500/10" },
 { type: "email_sent", icon: Mail, color: "text-pink-500", bg: "bg-pink-500/10" },
 { type: "document", icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10" },
 { type: "api_call", icon: Globe, color: "text-cyan-500", bg: "bg-cyan-500/10" },
];

// Mock Usernames
const mockUsers = [
 "", "Li Na", "Wang Qiang", "Liu Fang", "Chen Ming", "Yang Yang", "Zhao Min", "Huang Lei",
 "weeks", "Wu Liang", "Zheng Shuang", "Sun Tao", "User123", "DevTeam", "DataBot",
];

// Mock
const mockLocations = [
 "Beijing", "on", "Shenzhen", "Hangzhou", "Guangzhou", "all", "Wuhan", "Nanjing",
 "Xi'an", "Tokyo", "new", "Silicon Valley", "London", "Sydney",
];

// Mock Activity Descriptions
const mockActivities = [
 "Run \"Smart Support\" workflow",
 "Process 1,234 data records",
 "Call GPT-4 to generate content",
 "Send 56 marketing emails",
 "Create new automation flow",
 "Sync Notion database",
 "Data clean task done",
 "Trigger webhook event",
 "Scheduled task executed",
 "Analytics report exported",
];

export interface Activity {
 id: string;
 type: string;
 user: string;
 location: string;
 description: string;
 timestamp: Date;
}

function generateActivity(): Activity {
 const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
 return {
 id: Math.random().toString(36).substring(7),
 type: type.type,
 user: mockUsers[Math.floor(Math.random() * mockUsers.length)],
 location: mockLocations[Math.floor(Math.random() * mockLocations.length)],
 description: mockActivities[Math.floor(Math.random() * mockActivities.length)],
 timestamp: new Date(),
 };
}

export interface LiveActivityFeedProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum display count */
  maxItems?: number;
  /** New activity generation interval (ms) */
 interval?: number;
 /** Whether to display location */
 showLocation?: boolean;
 /** Whether to auto-generate activity */
 autoGenerate?: boolean;
 /** Compact */
 compact?: boolean;
}

export function LiveActivityFeed({
 maxItems = 5,
 interval = 3000,
 showLocation = true,
 autoGenerate = true,
 compact = false,
 className,
 ...props
}: LiveActivityFeedProps) {
 const [activities, setActivities] = useState<Activity[]>([]);
 const [isVisible, setIsVisible] = useState(false);
 const containerRef = useRef<HTMLDivElement>(null);

  // Initial Activities
 useEffect(() => {
 const initial = Array.from({ length: maxItems }, () => generateActivity());
 setActivities(initial);
 
    // Delay display animation
 setTimeout(() => setIsVisible(true), 100);
 }, [maxItems]);

  // Auto-generate new activities
 useEffect(() => {
 if (!autoGenerate) return;

 const timer = setInterval(() => {
 setActivities((prev) => {
 const newActivity = generateActivity();
 return [newActivity, ...prev.slice(0, maxItems - 1)];
 });
 }, interval);

 return () => clearInterval(timer);
 }, [autoGenerate, interval, maxItems]);

 const getActivityConfig = (type: string) => {
 return activityTypes.find((t) => t.type === type) || activityTypes[0];
 };

 const formatTime = (date: Date) => {
 const now = new Date();
 const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
 
    if (diff < 5) return "Just now";
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
 return `${Math.floor(diff / 3600)} hours ago`;
 };

 return (
 <div
 ref={containerRef}
 className={cn(
 "relative overflow-hidden",
 className
 )}
 {...props}
 >
 {/* Title */}
 <div className="flex items-center gap-2 mb-4">
 <div className="relative flex h-2 w-2">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
 <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
 </div>
        <span className="text-sm font-medium text-primary">Real-time Activity</span>
 </div>

      {/* Activity List */}
 <div className="space-y-2">
 {activities.map((activity, index) => {
 const config = getActivityConfig(activity.type);
 const Icon = config.icon;

 return (
 <div
 key={activity.id}
 className={cn(
 "flex items-center gap-3 p-3 rounded-xl",
 "bg-card/50 border border-border/50",
 "transition-all duration-500 ease-out",
 isVisible
 ? "opacity-100 translate-x-0"
 : "opacity-0 -translate-x-4",
 compact && "p-2"
 )}
 style={{
 transitionDelay: `${index * 50}ms`,
 }}
 >
 {/* Icon */}
 <div className={cn(
 "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
 config.bg,
 compact && "w-6 h-6"
 )}>
 <Icon className={cn("w-4 h-4", config.color, compact && "w-3 h-3")} />
 </div>

 {/* Content */}
 <div className="flex-1 min-w-0">
 <p className={cn(
 "text-sm text-foreground truncate",
 compact && "text-xs"
 )}>
 <span className="font-medium">{activity.user}</span>
 <span className="text-muted-foreground"> {activity.description}</span>
 </p>
 {showLocation && !compact && (
 <p className="text-xs text-muted-foreground mt-0.5">
 {activity.location} {formatTime(activity.timestamp)}
 </p>
 )}
 </div>

      {/* Time (Compact) */}
 {compact && (
 <span className="text-xs text-muted-foreground shrink-0">
 {formatTime(activity.timestamp)}
 </span>
 )}
 </div>
 );
 })}
 </div>

    {/* Fade out mask */}
 <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
 </div>
 );
}

// Real-time Run Statistics Badge
export interface LiveStatsBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Initial value */
  initialValue?: number;
  /** Label */
  label?: string;
  /** Increment range per tick */
  incrementRange?: [number, number];
  /** Whether to show pulse animation */
  showPulse?: boolean;
}

export function LiveStatsBadge({
  initialValue = 1234567,
  label = "Workflows Executed",
 incrementRange = [1, 5],
 showPulse = true,
 className,
 ...props
}: LiveStatsBadgeProps) {
 const [value, setValue] = useState(initialValue);

 useEffect(() => {
 const timer = setInterval(() => {
 const increment = Math.floor(
 Math.random() * (incrementRange[1] - incrementRange[0] + 1) + incrementRange[0]
 );
 setValue((prev) => prev + increment);
 }, 1000);

 return () => clearInterval(timer);
 }, [incrementRange]);

 const formatNumber = (num: number) => {
 return num.toLocaleString();
 };

 return (
 <div
 className={cn(
 "inline-flex items-center gap-2 px-4 py-2 rounded-full",
 "bg-card/80 backdrop-blur-sm border border-border/50",
 "text-sm",
 className
 )}
 {...props}
 >
 {showPulse && (
 <div className="relative flex h-2 w-2">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
 <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
 </div>
 )}
 <span className="text-muted-foreground">{label}</span>
 <span className="font-mono font-semibold text-foreground tabular-nums">
 {formatNumber(value)}
 </span>
 </div>
 );
}

// Global Users Distribution Indicator
export interface GlobalUsersIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
 activeUsers?: number;
}

export function GlobalUsersIndicator({
 activeUsers = 2847,
 className,
 ...props
}: GlobalUsersIndicatorProps) {
 const [users, setUsers] = useState(activeUsers);

 useEffect(() => {
 const timer = setInterval(() => {
 setUsers((prev) => {
 const change = Math.floor(Math.random() * 20) - 10;
 return Math.max(0, prev + change);
 });
 }, 5000);

 return () => clearInterval(timer);
 }, []);

 return (
 <div
 className={cn(
 "flex items-center gap-3 px-4 py-3 rounded-xl",
 "bg-card border border-border",
 className
 )}
 {...props}
 >
 <div className="relative">
 <Users className="w-5 h-5 text-primary" />
 <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
 </div>
 <div>
 <p className="text-2xl font-bold text-foreground tabular-nums">
 {users.toLocaleString()}
 </p>
        <p className="text-xs text-muted-foreground">All Online Users</p>
 </div>
 </div>
 );
}
