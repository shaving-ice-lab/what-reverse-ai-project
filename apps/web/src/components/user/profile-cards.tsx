"use client";

/**
 * 用户资料卡片组件集合
 * 展示用户信息的可复用组件
 */

import { ReactNode } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Link2,
  Settings,
  Crown,
  Shield,
  Star,
  Award,
  Zap,
  Bot,
  MessageSquare,
  TrendingUp,
  ExternalLink,
  MoreHorizontal,
  Edit3,
  LogOut,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// ============================================
// 用户资料卡片（完整版）
// ============================================

interface UserProfileCardProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    role?: string;
    bio?: string;
    location?: string;
    website?: string;
    joinedAt: string;
    stats?: {
      workflows?: number;
      agents?: number;
      conversations?: number;
    };
  };
  showStats?: boolean;
  showActions?: boolean;
  onEdit?: () => void;
  onLogout?: () => void;
  className?: string;
}

export function UserProfileCard({
  user,
  showStats = true,
  showActions = true,
  onEdit,
  onLogout,
  className,
}: UserProfileCardProps) {
  const getRoleBadge = () => {
    switch (user.role) {
      case "admin":
        return { label: "管理员", icon: Shield, color: "text-purple-500", bg: "bg-purple-500/10" };
      case "pro":
        return { label: "专业版", icon: Crown, color: "text-amber-500", bg: "bg-amber-500/10" };
      case "enterprise":
        return { label: "企业版", icon: Star, color: "text-blue-500", bg: "bg-blue-500/10" };
      default:
        return { label: "免费版", icon: User, color: "text-muted-foreground", bg: "bg-muted/50" };
    }
  };

  const roleBadge = getRoleBadge();
  const RoleIcon = roleBadge.icon;

  return (
    <div className={cn("p-6 rounded-2xl bg-card border border-border", className)}>
      {/* 头部 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user.avatar || undefined} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {user.name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">{user.name}</h2>
              <Badge variant="secondary" className={cn(roleBadge.bg, roleBadge.color)}>
                <RoleIcon className="w-3 h-3 mr-1" />
                {roleBadge.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={onEdit}>
                <Edit3 className="w-4 h-4 mr-2" />
                编辑资料
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  设置
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* 简介 */}
      {user.bio && (
        <p className="text-sm text-muted-foreground mb-4">{user.bio}</p>
      )}

      {/* 元信息 */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
        {user.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {user.location}
          </span>
        )}
        {user.website && (
          <a
            href={user.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <Link2 className="w-4 h-4" />
            网站
          </a>
        )}
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {user.joinedAt} 加入
        </span>
      </div>

      {/* 统计数据 */}
      {showStats && user.stats && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {user.stats.workflows || 0}
            </p>
            <p className="text-xs text-muted-foreground">工作流</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {user.stats.agents || 0}
            </p>
            <p className="text-xs text-muted-foreground">Agent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {user.stats.conversations || 0}
            </p>
            <p className="text-xs text-muted-foreground">对话</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// 迷你用户卡片
// ============================================

interface MiniUserCardProps {
  user: {
    name: string;
    email?: string;
    avatar?: string | null;
    role?: string;
  };
  showRole?: boolean;
  onClick?: () => void;
  className?: string;
}

export function MiniUserCard({
  user,
  showRole = false,
  onClick,
  className,
}: MiniUserCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl",
        onClick && "cursor-pointer hover:bg-muted/50 transition-colors",
        className
      )}
    >
      <Avatar className="w-10 h-10">
        <AvatarImage src={user.avatar || undefined} alt={user.name} />
        <AvatarFallback className="bg-primary/10 text-primary text-sm">
          {user.name.slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{user.name}</p>
        {user.email && (
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        )}
      </div>
      {showRole && user.role && (
        <Badge variant="secondary" className="shrink-0">
          {user.role}
        </Badge>
      )}
    </div>
  );
}

// ============================================
// 用户头像组（多人展示）
// ============================================

interface AvatarGroupProps {
  users: {
    name: string;
    avatar?: string | null;
  }[];
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AvatarGroup({
  users,
  max = 4,
  size = "md",
  className,
}: AvatarGroupProps) {
  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  const sizeClasses = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm",
  };

  const offsetClasses = {
    sm: "-ml-2",
    md: "-ml-3",
    lg: "-ml-4",
  };

  return (
    <div className={cn("flex items-center", className)}>
      {visibleUsers.map((user, index) => (
        <Avatar
          key={index}
          className={cn(
            sizeClasses[size],
            index > 0 && offsetClasses[size],
            "border-2 border-background"
          )}
        >
          <AvatarImage src={user.avatar || undefined} alt={user.name} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {user.name.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            sizeClasses[size],
            offsetClasses[size],
            "rounded-full bg-muted border-2 border-background flex items-center justify-center text-muted-foreground font-medium"
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

// ============================================
// 用户活动卡片
// ============================================

interface UserActivityCardProps {
  user: {
    name: string;
    avatar?: string | null;
  };
  activity: {
    type: "workflow" | "agent" | "conversation" | "achievement";
    title: string;
    description?: string;
    time: string;
  };
  className?: string;
}

export function UserActivityCard({
  user,
  activity,
  className,
}: UserActivityCardProps) {
  const activityConfig = {
    workflow: { icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
    agent: { icon: Bot, color: "text-purple-500", bg: "bg-purple-500/10" },
    conversation: { icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10" },
    achievement: { icon: Award, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  };

  const config = activityConfig[activity.type];
  const ActivityIcon = config.icon;

  return (
    <div className={cn("flex items-start gap-3 p-4 rounded-xl bg-card border border-border", className)}>
      <Avatar className="w-10 h-10 shrink-0">
        <AvatarImage src={user.avatar || undefined} alt={user.name} />
        <AvatarFallback className="bg-primary/10 text-primary">
          {user.name.slice(0, 2)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-foreground">{user.name}</span>
          <Badge variant="secondary" className={cn(config.bg, config.color, "text-xs")}>
            <ActivityIcon className="w-3 h-3 mr-1" />
            {activity.type === "workflow" && "工作流"}
            {activity.type === "agent" && "Agent"}
            {activity.type === "conversation" && "对话"}
            {activity.type === "achievement" && "成就"}
          </Badge>
        </div>
        <p className="text-sm text-foreground mb-1">{activity.title}</p>
        {activity.description && (
          <p className="text-xs text-muted-foreground">{activity.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">{activity.time}</p>
      </div>
    </div>
  );
}

// ============================================
// 用户排行卡片
// ============================================

interface UserRankCardProps {
  rank: number;
  user: {
    name: string;
    avatar?: string | null;
  };
  score: number;
  scoreLabel?: string;
  highlight?: boolean;
  className?: string;
}

export function UserRankCard({
  rank,
  user,
  score,
  scoreLabel = "积分",
  highlight = false,
  className,
}: UserRankCardProps) {
  const getRankStyle = () => {
    if (rank === 1) return { bg: "bg-amber-500", text: "text-white" };
    if (rank === 2) return { bg: "bg-gray-400", text: "text-white" };
    if (rank === 3) return { bg: "bg-orange-600", text: "text-white" };
    return { bg: "bg-muted", text: "text-muted-foreground" };
  };

  const rankStyle = getRankStyle();

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border transition-all",
        highlight
          ? "bg-primary/5 border-primary/20"
          : "bg-card border-border hover:border-primary/20",
        className
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
          rankStyle.bg,
          rankStyle.text
        )}
      >
        {rank}
      </div>

      <Avatar className="w-10 h-10">
        <AvatarImage src={user.avatar || undefined} alt={user.name} />
        <AvatarFallback className="bg-primary/10 text-primary">
          {user.name.slice(0, 2)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{user.name}</p>
      </div>

      <div className="text-right">
        <p className="font-bold text-foreground">{score.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">{scoreLabel}</p>
      </div>
    </div>
  );
}
