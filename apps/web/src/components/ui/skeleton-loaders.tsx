"use client";

/**
 * 骨架屏加载组件集合
 * 用于页面加载状态的占位展示
 */

import { cn } from "@/lib/utils";

// ============================================
// 基础骨架元素
// ============================================

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
    />
  );
}

// ============================================
// 文本骨架
// ============================================

interface TextSkeletonProps {
  lines?: number;
  className?: string;
}

export function TextSkeleton({ lines = 3, className }: TextSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

// ============================================
// 卡片骨架
// ============================================

interface CardSkeletonProps {
  hasImage?: boolean;
  hasFooter?: boolean;
  className?: string;
}

export function CardSkeleton({
  hasImage = false,
  hasFooter = false,
  className,
}: CardSkeletonProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
      {hasImage && (
        <Skeleton className="w-full h-40 mb-4 rounded-lg" />
      )}
      <Skeleton className="h-5 w-3/4 mb-3" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      {hasFooter && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      )}
    </div>
  );
}

// ============================================
// 列表项骨架
// ============================================

interface ListItemSkeletonProps {
  hasAvatar?: boolean;
  hasActions?: boolean;
  className?: string;
}

export function ListItemSkeleton({
  hasAvatar = true,
  hasActions = false,
  className,
}: ListItemSkeletonProps) {
  return (
    <div className={cn("flex items-center gap-4 p-4", className)}>
      {hasAvatar && (
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
      )}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      {hasActions && (
        <Skeleton className="w-8 h-8 rounded-md shrink-0" />
      )}
    </div>
  );
}

// ============================================
// 表格骨架
// ============================================

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  hasHeader?: boolean;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  hasHeader = true,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("rounded-xl border border-border overflow-hidden", className)}>
      {hasHeader && (
        <div className="flex items-center gap-4 p-4 border-b border-border bg-muted/30">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn("h-4", i === 0 ? "w-1/4" : "w-1/6")}
            />
          ))}
        </div>
      )}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 p-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={cn("h-4", colIndex === 0 ? "w-1/4" : "w-1/6")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// 统计卡片骨架
// ============================================

interface StatCardSkeletonProps {
  className?: string;
}

export function StatCardSkeleton({ className }: StatCardSkeletonProps) {
  return (
    <div className={cn("p-5 rounded-xl border border-border bg-card", className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="w-12 h-5 rounded-full" />
      </div>
      <Skeleton className="h-8 w-20 mb-1" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

// ============================================
// 个人资料骨架
// ============================================

interface ProfileSkeletonProps {
  className?: string;
}

export function ProfileSkeleton({ className }: ProfileSkeletonProps) {
  return (
    <div className={cn("p-6 rounded-xl border border-border bg-card", className)}>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

// ============================================
// 聊天消息骨架
// ============================================

interface ChatMessageSkeletonProps {
  isUser?: boolean;
  className?: string;
}

export function ChatMessageSkeleton({
  isUser = false,
  className,
}: ChatMessageSkeletonProps) {
  return (
    <div
      className={cn(
        "flex gap-3",
        isUser && "flex-row-reverse",
        className
      )}
    >
      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      <div
        className={cn(
          "space-y-2 max-w-[70%]",
          isUser && "items-end"
        )}
      >
        <Skeleton className={cn("h-4 w-48", isUser && "ml-auto")} />
        <Skeleton className={cn("h-4 w-36", isUser && "ml-auto")} />
        <Skeleton className={cn("h-4 w-24", isUser && "ml-auto")} />
      </div>
    </div>
  );
}

// ============================================
// 导航骨架
// ============================================

interface NavSkeletonProps {
  items?: number;
  className?: string;
}

export function NavSkeleton({ items = 5, className }: NavSkeletonProps) {
  return (
    <div className={cn("space-y-2 p-4", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}

// ============================================
// 页面骨架（组合）
// ============================================

interface PageSkeletonProps {
  className?: string;
}

export function PageSkeleton({ className }: PageSkeletonProps) {
  return (
    <div className={cn("space-y-6 p-6", className)}>
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* 主内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TableSkeleton rows={5} columns={4} />
        </div>
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton hasFooter />
        </div>
      </div>
    </div>
  );
}

// ============================================
// Dashboard 骨架
// ============================================

interface DashboardSkeletonProps {
  className?: string;
}

export function DashboardSkeleton({ className }: DashboardSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* 欢迎区域 */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl border border-border bg-card">
            <Skeleton className="w-10 h-10 rounded-lg mb-3" />
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>

      {/* 主内容 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <ListItemSkeleton key={i} hasAvatar hasActions />
          ))}
        </div>
        <div>
          <CardSkeleton hasImage />
        </div>
      </div>
    </div>
  );
}
