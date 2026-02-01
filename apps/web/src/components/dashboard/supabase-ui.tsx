"use client";

/**
 * Supabase Dashboard 风格通用组件
 * 包含：PageHeader, SecondarySidebar, EmptyState, TabNav, Badge 等
 */

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronRight, ExternalLink, LucideIcon } from "lucide-react";

// ==================== PageHeader ====================
interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: {
    text: string;
    variant?: "default" | "success" | "warning" | "beta";
  };
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  breadcrumbs,
}: PageHeaderProps) {
  const badgeVariants = {
    default: "bg-surface-200 text-foreground-light",
    success: "bg-brand-500 text-background",
    warning: "bg-warning text-background",
    beta: "bg-brand-500/20 text-brand-500",
  };

  return (
    <div className="mb-5 space-y-3">
      {/* 面包屑 */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground-light">{crumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* 标题行 */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="page-title">{title}</h1>
            {badge && (
              <span
                className={cn(
                  "px-2 py-0.5 text-[10px] font-medium rounded",
                  badgeVariants[badge.variant || "default"]
                )}
              >
                {badge.text}
              </span>
            )}
          </div>
          {description && <p className="page-description max-w-2xl">{description}</p>}
        </div>
        {actions && <div className="page-toolbar">{actions}</div>}
      </div>
    </div>
  );
}

// ==================== SecondarySidebar ====================
interface SidebarGroup {
  title?: string;
  items: SidebarItem[];
}

interface SidebarItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  badge?: {
    text: string;
    variant?: "default" | "beta" | "new" | "coming-soon";
  };
  external?: boolean;
  disabled?: boolean;
}

interface SecondarySidebarProps {
  title: string;
  groups: SidebarGroup[];
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
}

export function SecondarySidebar({
  title,
  groups,
  headerContent,
  footerContent,
}: SecondarySidebarProps) {
  const pathname = usePathname();

  const badgeVariants = {
    default: "bg-surface-200 text-foreground-muted",
    beta: "bg-brand-500/20 text-brand-500",
    new: "bg-brand-500 text-background",
    "coming-soon": "bg-surface-300 text-foreground-muted",
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside className="w-[220px] shrink-0 border-r border-border bg-background-studio overflow-y-auto">
      {/* 标题 */}
      <div className="sticky top-0 bg-background-studio z-10">
        <div className="px-4 py-3 border-b border-border bg-surface-75/60">
          <h2 className="text-[12px] font-medium text-foreground">{title}</h2>
        </div>
        {headerContent && (
          <div className="px-3 py-3 border-b border-border">{headerContent}</div>
        )}
      </div>

      {/* 菜单分组 */}
      <div className="p-3 space-y-4">
        {groups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {group.title && (
              <div className="px-2 py-2 page-caption">
                {group.title}
              </div>
            )}
            <nav className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                if (item.disabled) {
                  return (
                    <div
                      key={item.href}
                      className="flex items-center gap-2.5 px-2 py-2 rounded-md text-[13px] text-foreground-muted cursor-not-allowed opacity-50"
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            "px-1.5 py-0.5 text-[10px] font-medium rounded",
                            badgeVariants[item.badge.variant || "default"]
                          )}
                        >
                          {item.badge.text}
                        </span>
                      )}
                    </div>
                  );
                }

                return (
                  <Link key={item.href} href={item.href} target={item.external ? "_blank" : undefined}>
                    <div
                      className={cn(
                        "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[12px] transition-colors relative",
                        active
                          ? "bg-surface-200 text-foreground before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-[2px] before:rounded-full before:bg-brand-500"
                          : "text-foreground-light hover:bg-surface-100 hover:text-foreground"
                      )}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            "px-1.5 py-0.5 text-[10px] font-medium rounded",
                            badgeVariants[item.badge.variant || "default"]
                          )}
                        >
                          {item.badge.text}
                        </span>
                      )}
                      {item.external && (
                        <ExternalLink className="w-3.5 h-3.5 text-foreground-muted" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* 底部内容 */}
      {footerContent && (
        <div className="sticky bottom-0 bg-background-studio border-t border-border p-3">
          {footerContent}
        </div>
      )}
    </aside>
  );
}

// ==================== EmptyState ====================
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const ActionIcon = action?.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      <div className="w-14 h-14 rounded-lg bg-surface-200 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-foreground-muted" />
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
      <p className="text-[13px] text-foreground-muted max-w-sm mb-4">
        {description}
      </p>
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brand-500 text-background text-[13px] font-medium hover:bg-brand-600 transition-colors"
          >
            {ActionIcon && <ActionIcon className="w-4 h-4" />}
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brand-500 text-background text-[13px] font-medium hover:bg-brand-600 transition-colors"
          >
            {ActionIcon && <ActionIcon className="w-4 h-4" />}
            {action.label}
          </button>
        )
      )}
    </div>
  );
}

// ==================== TabNav ====================
interface TabItem {
  label: string;
  value: string;
  count?: number;
}

interface TabNavProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TabNav({ tabs, activeTab, onChange, className }: TabNavProps) {
  return (
    <div className={cn("flex items-center gap-6 border-b border-border", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "relative pb-2.5 text-[12px] font-medium transition-colors",
            activeTab === tab.value
              ? "text-foreground"
              : "text-foreground-muted hover:text-foreground-light"
          )}
        >
          <span className="flex items-center gap-2">
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.5 text-[10px] rounded",
                  activeTab === tab.value
                    ? "bg-foreground text-background"
                    : "bg-surface-200 text-foreground-muted"
                )}
              >
                {tab.count}
              </span>
            )}
          </span>
          {activeTab === tab.value && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500" />
          )}
        </button>
      ))}
    </div>
  );
}

// ==================== Card ====================
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  className,
  hover = false,
  padding = "md",
}: CardProps) {
  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-5",
  };

  return (
    <div
      className={cn(
        "bg-surface-100 border border-border rounded-lg",
        hover && "hover:border-border-strong transition-colors",
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

// ==================== SettingsSection ====================
interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function SettingsSection({
  title,
  description,
  children,
  footer,
  className,
}: SettingsSectionProps) {
  return (
    <div
      className={cn("page-panel overflow-hidden", className)}
    >
      {/* 头部 */}
      <div className="page-panel-header">
        <h3 className="page-panel-title">{title}</h3>
        {description && (
          <p className="page-panel-description mt-1">{description}</p>
        )}
      </div>
      {/* 内容 */}
      <div className="p-5">{children}</div>
      {/* 底部 */}
      {footer && (
        <div className="px-5 py-4 bg-surface-75 border-t border-border flex justify-end gap-2">
          {footer}
        </div>
      )}
    </div>
  );
}

// ==================== SearchInput ====================
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-1.5 rounded-md bg-surface-100 border border-border text-[12px] text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
      />
    </div>
  );
}

// ==================== Badge ====================
interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "destructive" | "beta" | "official";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "sm",
  className,
}: BadgeProps) {
  const variants = {
    default: "bg-surface-200 text-foreground-light",
    success: "bg-brand-500 text-background",
    warning: "bg-warning text-background",
    destructive: "bg-destructive text-background",
    beta: "bg-brand-500/20 text-brand-500",
    official: "bg-surface-300 text-foreground-muted",
  };

  const sizes = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2 py-1 text-[11px]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

// ==================== ToolbarButton ====================
interface ToolbarButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "primary";
  icon?: LucideIcon;
  disabled?: boolean;
  className?: string;
}

export function ToolbarButton({
  children,
  onClick,
  variant = "default",
  icon: Icon,
  disabled = false,
  className,
}: ToolbarButtonProps) {
  const variants = {
    default:
      "bg-surface-100 border border-border text-foreground-light hover:text-foreground hover:border-border-strong",
    primary: "bg-brand-500 text-background hover:bg-brand-600",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors",
        variants[variant],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}

// ==================== StatCard ====================
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  chart?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  chart,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("", className)}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center">
              <Icon className="w-4 h-4 text-foreground-muted" />
            </div>
          )}
          <span className="text-[13px] font-medium text-foreground">{title}</span>
        </div>
      </div>
      
      <div className="mb-2">
        <div className="flex items-end gap-2">
          <span className="text-[1.5rem] font-semibold text-foreground">{value}</span>
          {trend && (
            <span
              className={cn(
                "text-[11px] font-medium pb-1",
                trend.value > 0 ? "text-brand-500" : trend.value < 0 ? "text-destructive" : "text-foreground-muted"
              )}
            >
              {trend.value > 0 ? "+" : ""}
              {trend.value}%
              {trend.label && <span className="text-foreground-muted ml-1">{trend.label}</span>}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-[12px] text-foreground-muted mt-0.5">{subtitle}</p>
        )}
      </div>

      {chart && <div className="mt-3">{chart}</div>}
    </Card>
  );
}
