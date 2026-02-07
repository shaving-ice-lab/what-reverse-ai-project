"use client";

/**
 * Dashboard Page Layout Components - Supabase Style
 * Unified page header, content area, and sidebar layout
 */

import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
// ===== Page Container =====
interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Whether to use full width (no padding) */
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

// ===== Page Header =====
interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Eyebrow / category */
  eyebrow?: string;
  /** Title icon */
  icon?: React.ReactNode;
  /** Page description */
  description?: string;
  /** Breadcrumb or back link */
  backHref?: string;
  backLabel?: string;
  /** Badge / tag next to title */
  badge?: React.ReactNode;
  /** Right-side action area */
  actions?: React.ReactNode;
  /** Children (tabs, etc.) */
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  eyebrow,
  icon,
  description, 
  backHref, 
  backLabel = "Back",
  badge,
  actions,
  children,
  className 
}: PageHeaderProps) {
  return (
    <div className={cn("mb-5 space-y-3", className)}>
      {/* Back link */}
      {backHref && (
        <Link 
          href={backHref} 
          className="inline-flex items-center gap-1.5 text-[12px] text-foreground-light hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {backLabel}
        </Link>
      )}
      
      {/* Title row */}
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
      
      {/* Child content (tabs, etc.) */}
      {children && (
        <div className="mt-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ===== Settings / Form Section =====
interface SettingsSectionProps {
  /** Section title */
  title: string;
  /** Section description */
  description?: string;
  /** Icon */
  icon?: React.ReactNode;
  /** Content */
  children: React.ReactNode;
  /** Footer action bar */
  footer?: React.ReactNode;
  /** Whether to use compact mode */
  compact?: boolean;
  className?: string;
}

export function SettingsSection({ 
  title, 
  description, 
  icon,
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
      {/* Header */}
      <div className={cn(
        "page-panel-header",
        compact ? "px-4 py-3" : "px-5 py-4"
      )}>
        <div className="flex items-start gap-3">
          {icon && (
            <div className="mt-0.5 w-7 h-7 rounded-md bg-surface-200 border border-border flex items-center justify-center text-foreground-light">
              {icon}
            </div>
          )}
          <div>
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
        </div>
      </div>
      
      {/* Content */}
      <div className={cn(compact ? "p-4" : "p-5")}>
        {children}
      </div>
      
      {/* Footer action bar */}
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

// ===== Form Row (Supabase style: left label + description, right control) =====
interface FormRowProps {
  /** Label */
  label: string;
  /** Description */
  description?: string;
  /** Control */
  children: React.ReactNode;
  /** Whether required */
  required?: boolean;
  /** Error message */
  error?: string;
  /** Whether to use horizontal layout (default: true) */
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
      {/* Left side: label and description */}
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
      
      {/* Right side: control */}
      <div className="space-y-1.5">
        {children}
        {error && (
          <p className="text-[12px] text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}

// ===== Toggle Row (Switch setting) =====
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

// ===== Empty State =====
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

// ===== Category Header (Uppercase gray subtitle) =====
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

// ===== Stats Card =====
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

// ===== Page Layout with Sidebar =====
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
    narrow: "w-[188px]",
    default: "w-[220px]",
    wide: "w-[240px]",
  };

  return (
    <div className={cn("flex h-full overflow-hidden", className)}>
      {/* Sidebar */}
      <div className={cn(
        "shrink-0 border-r border-border bg-background-studio overflow-y-auto",
        widthClass[sidebarWidth]
      )}>
        {sidebarTitle && (
          <div className="px-4 py-3 border-b border-border bg-surface-75/60 sticky top-0 z-10">
            <h2 className="text-[12px] font-medium text-foreground">{sidebarTitle}</h2>
          </div>
        )}
        <div className="p-3">
          {sidebar}
        </div>
      </div>
      
      {/* Main content - uses overflow-y-auto for scrolling */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}

// ===== Sidebar Nav Item =====
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

// ===== Sidebar Nav Group =====
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
