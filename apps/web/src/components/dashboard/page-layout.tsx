"use client";

/**
 * Dashboard 页面布局组件 - Supabase 风格
 * 统一的页面头部、内容区域、侧边栏布局
 */

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

// ===== 页面容器 =====
interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /** 是否全宽（无内边距） */
  fullWidth?: boolean;
}

export function PageContainer({ children, className, fullWidth = false }: PageContainerProps) {
  return (
    <div className={cn(
      "dashboard-page min-h-full text-foreground",
      !fullWidth && "space-y-5",
      className
    )}>
      <div className={cn(
        !fullWidth && "max-w-[1280px] mx-auto w-full"
      )}>
        {children}
      </div>
    </div>
  );
}

// ===== 页面头部 =====
interface PageHeaderProps {
  /** 页面标题 */
  title: string;
  /** 眉题/分类 */
  eyebrow?: string;
  /** 标题图标 */
  icon?: React.ReactNode;
  /** 页面描述 */
  description?: string;
  /** 面包屑或返回链接 */
  backHref?: string;
  backLabel?: string;
  /** 标题旁徽章/标签 */
  badge?: React.ReactNode;
  /** 右侧操作区 */
  actions?: React.ReactNode;
  /** 子元素（标签页等） */
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  eyebrow,
  icon,
  description, 
  backHref, 
  backLabel = "返回",
  badge,
  actions,
  children,
  className 
}: PageHeaderProps) {
  return (
    <div className={cn("mb-5 space-y-3", className)}>
      {/* 返回链接 */}
      {backHref && (
        <Link 
          href={backHref} 
          className="inline-flex items-center gap-1.5 text-[12px] text-foreground-light hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {backLabel}
        </Link>
      )}
      
      {/* 标题行 */}
      <div className="page-header">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            {icon && (
              <div className="w-8 h-8 rounded-md bg-surface-200 border border-border flex items-center justify-center text-foreground-light">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {eyebrow && <div className="page-caption mb-1">{eyebrow}</div>}
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="page-title">{title}</h1>
                {badge && <div className="shrink-0">{badge}</div>}
              </div>
              {description && <p className="page-description max-w-2xl">{description}</p>}
            </div>
          </div>
        </div>
        {actions && <div className="page-toolbar shrink-0">{actions}</div>}
      </div>
      
      {/* 子内容（标签页等） */}
      {children && (
        <div className="mt-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ===== 设置/表单区块 =====
interface SettingsSectionProps {
  /** 区块标题 */
  title: string;
  /** 区块描述 */
  description?: string;
  /** 内容 */
  children: React.ReactNode;
  /** 底部操作栏 */
  footer?: React.ReactNode;
  /** 是否紧凑模式 */
  compact?: boolean;
  className?: string;
}

export function SettingsSection({ 
  title, 
  description, 
  children, 
  footer,
  compact = false,
  className 
}: SettingsSectionProps) {
  return (
    <div className={cn(
      "page-panel overflow-hidden",
      className
    )}>
      {/* 头部 */}
      <div className={cn(
        "page-panel-header",
        compact ? "px-4 py-3" : "px-5 py-4"
      )}>
        <h2 className={cn(
          "page-panel-title",
          compact ? "text-[12px]" : "text-[13px]"
        )}>
          {title}
        </h2>
        {description && (
          <p className={cn(
            "page-panel-description mt-1",
            compact ? "text-[11px]" : "text-[12px]"
          )}>
            {description}
          </p>
        )}
      </div>
      
      {/* 内容 */}
      <div className={cn(compact ? "p-4" : "p-5")}>
        {children}
      </div>
      
      {/* 底部操作栏 */}
      {footer && (
        <div className={cn(
          "border-t border-border bg-surface-75 flex justify-end",
          compact ? "px-4 py-3" : "px-5 py-4"
        )}>
          {footer}
        </div>
      )}
    </div>
  );
}

// ===== 表单行（Supabase 风格：左标签+描述，右控件） =====
interface FormRowProps {
  /** 标签 */
  label: string;
  /** 描述 */
  description?: string;
  /** 控件 */
  children: React.ReactNode;
  /** 是否必填 */
  required?: boolean;
  /** 是否有错误 */
  error?: string;
  /** 是否水平布局（默认是） */
  horizontal?: boolean;
  className?: string;
}

export function FormRow({ 
  label, 
  description, 
  children, 
  required,
  error,
  horizontal = true,
  className 
}: FormRowProps) {
  return (
    <div className={cn(
      "py-4 border-b border-border last:border-b-0",
      horizontal && "grid grid-cols-2 gap-8 items-start",
      className
    )}>
      {/* 左侧：标签和描述 */}
      <div>
        <label className="text-[12px] font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        {description && (
          <p className="text-[12px] text-foreground-light mt-1">
            {description}
          </p>
        )}
      </div>
      
      {/* 右侧：控件 */}
      <div className="space-y-1.5">
        {children}
        {error && (
          <p className="text-[12px] text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}

// ===== Toggle 行（开关设置） =====
interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function ToggleRow({ 
  label, 
  description, 
  checked, 
  onCheckedChange,
  disabled,
  className 
}: ToggleRowProps) {
  return (
    <div className={cn(
      "flex items-center justify-between py-4 border-b border-border last:border-b-0",
      className
    )}>
      <div>
        <div className="text-[12px] font-medium text-foreground">{label}</div>
        {description && (
          <div className="text-[12px] text-foreground-light mt-0.5">{description}</div>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}

// 导入 Switch 组件
import { Switch } from "@/components/ui/switch";

// ===== 空状态 =====
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-6 text-center",
      className
    )}>
      {icon && (
        <div className="w-12 h-12 rounded-full bg-surface-200 flex items-center justify-center mb-4">
          <div className="text-foreground-light">
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-sm font-medium text-foreground mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-[13px] text-foreground-light max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">
          {action.href ? (
            <Link href={action.href}>
              <Button>{action.label}</Button>
            </Link>
          ) : (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}
    </div>
  );
}

// ===== 分类头部（大写灰色小标题） =====
interface CategoryHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CategoryHeader({ children, className }: CategoryHeaderProps) {
  return (
    <div className={cn(
      "page-caption mb-2",
      className
    )}>
      {children}
    </div>
  );
}

// ===== 统计卡片 =====
interface StatsCardProps {
  icon?: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({ 
  icon, 
  title, 
  value, 
  subtitle,
  trend,
  className 
}: StatsCardProps) {
  return (
    <div className={cn(
      "bg-surface-100 border border-border rounded-lg p-4",
      className
    )}>
      <div className="flex items-center gap-2 mb-2">
        {icon && (
          <div className="text-foreground-light">
            {icon}
          </div>
        )}
        <span className="text-sm text-foreground-light">{title}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-semibold text-foreground">
          {value}
        </span>
        {trend && (
          <span className={cn(
            "text-sm font-medium",
            trend.isPositive ? "text-brand-500" : "text-destructive"
          )}>
            {trend.isPositive ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-sm text-foreground-light mt-1">{subtitle}</p>
      )}
    </div>
  );
}

// ===== 带侧边栏的页面布局 =====
interface PageWithSidebarProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  sidebarTitle?: string;
  sidebarWidth?: "narrow" | "default" | "wide";
  className?: string;
}

export function PageWithSidebar({ 
  sidebar, 
  children, 
  sidebarTitle,
  sidebarWidth = "default",
  className 
}: PageWithSidebarProps) {
  const widthClass = {
    narrow: "w-[200px]",
    default: "w-[220px]",
    wide: "w-[240px]",
  };

  return (
    <div className={cn("flex h-full", className)}>
      {/* 侧边栏 */}
      <div className={cn(
        "shrink-0 border-r border-border bg-background-studio overflow-y-auto",
        widthClass[sidebarWidth]
      )}>
        {sidebarTitle && (
          <div className="px-4 py-3 border-b border-border bg-surface-75/60">
            <h2 className="text-[12px] font-medium text-foreground">{sidebarTitle}</h2>
          </div>
        )}
        <div className="p-3">
          {sidebar}
        </div>
      </div>
      
      {/* 主内容 */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {children}
      </div>
    </div>
  );
}

// ===== 侧边栏导航项 =====
interface SidebarNavItemProps {
  href: string;
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  badge?: string;
  external?: boolean;
}

export function SidebarNavItem({ 
  href, 
  label, 
  icon, 
  active,
  badge,
  external 
}: SidebarNavItemProps) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(
        "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[12px] transition-colors relative",
        active 
          ? "bg-surface-200 text-foreground before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-[2px] before:rounded-full before:bg-brand-500"
          : "text-foreground-light hover:text-foreground hover:bg-surface-200"
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-brand-500 text-background">
          {badge}
        </span>
      )}
      {external && (
        <span className="text-foreground-muted">↗</span>
      )}
    </Link>
  );
}

// ===== 侧边栏分组 =====
interface SidebarNavGroupProps {
  title?: string;
  children: React.ReactNode;
}

export function SidebarNavGroup({ title, children }: SidebarNavGroupProps) {
  return (
    <div className="mb-4">
      {title && (
        <CategoryHeader className="px-3 mb-1.5">{title}</CategoryHeader>
      )}
      <div className="space-y-0.5">
        {children}
      </div>
    </div>
  );
}
