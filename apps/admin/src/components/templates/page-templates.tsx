"use client";

/**
 * Admin page templates
 * List page / Detail page / Edit page standard templates
 */

import * as React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Download,
  Filter,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FullPagination } from "@/components/ui/pagination";
import {
  LoadingState,
  EmptyState,
  ErrorState,
} from "@/components/ui/data-states";
import {
  PageContainer,
  PageHeader,
  SettingsSection,
} from "@/components/dashboard/page-layout";

// ============================================
// List Page Template
// ============================================

interface ListPageFilter {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

interface ListPageTemplateProps {
  // Page info
  title: string;
  description?: string;
  icon?: React.ReactNode;
  // Data state
  loading?: boolean;
  error?: Error | string | null;
  // Search
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  // Filters
  filters?: ListPageFilter[];
  // Pagination
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  // Action buttons
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    href?: string;
    disabled?: boolean;
  };
  secondaryActions?: {
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    href?: string;
    disabled?: boolean;
  }[];
  // Batch actions
  batchActions?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    danger?: boolean;
    disabled?: boolean;
  }[];
  selectedCount?: number;
  onClearSelection?: () => void;
  // Refresh
  onRefresh?: () => void;
  // Export
  onExport?: () => void;
  // Empty state
  emptyState?: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: {
      label: string;
      onClick?: () => void;
      href?: string;
    };
  };
  // Content
  children: React.ReactNode;
  // Extra toolbar content
  toolbarExtra?: React.ReactNode;
  className?: string;
}

export function ListPageTemplate({
  title,
  description,
  icon,
  loading = false,
  error = null,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  filters = [],
  page = 1,
  pageSize = 10,
  total = 0,
  totalPages = 1,
  onPageChange,
  onPageSizeChange,
  primaryAction,
  secondaryActions = [],
  batchActions = [],
  selectedCount = 0,
  onClearSelection,
  onRefresh,
  onExport,
  emptyState,
  children,
  toolbarExtra,
  className,
}: ListPageTemplateProps) {
  const hasSelection = selectedCount > 0;

  return (
    <PageContainer className={className}>
      <PageHeader
        title={title}
        description={description}
        icon={icon}
        actions={
          <div className="flex items-center gap-2">
            {secondaryActions.map((action, index) =>
              action.href ? (
                <Link key={index} href={action.href}>
                  <Button variant="outline" size="sm" disabled={action.disabled}>
                    {action.icon}
                    {action.label}
                  </Button>
                </Link>
              ) : (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {action.icon}
                  {action.label}
                </Button>
              )
            )}
            {primaryAction &&
              (primaryAction.href ? (
                <Link href={primaryAction.href}>
                  <Button size="sm" disabled={primaryAction.disabled}>
                    {primaryAction.icon || <Plus className="w-4 h-4" />}
                    {primaryAction.label}
                  </Button>
                </Link>
              ) : (
                <Button
                  size="sm"
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.disabled}
                >
                  {primaryAction.icon || <Plus className="w-4 h-4" />}
                  {primaryAction.label}
                </Button>
              ))}
          </div>
        }
      />

      <SettingsSection
        title="Data List"
        description={`${total} records total`}
        footer={
          hasSelection && batchActions.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-foreground-muted">
                {selectedCount} items selected
              </span>
              <Button variant="ghost" size="sm" onClick={onClearSelection}>
                Clear selection
              </Button>
              {batchActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.danger ? "destructive" : "outline"}
                  size="sm"
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          ) : undefined
        }
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search box */}
            {onSearchChange && (
              <div className="w-[240px]">
                <Input
                  variant="search"
                  inputSize="sm"
                  placeholder={searchPlaceholder}
                  leftIcon={<Search className="w-3.5 h-3.5" />}
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
            )}
            {/* Filters */}
            {filters.map((filter) => (
              <div key={filter.id} className="flex items-center gap-1.5">
                <span className="text-[11px] text-foreground-muted">
                  {filter.label}
                </span>
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                >
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            {/* Total badge */}
            <Badge variant="outline" size="sm">
              {total} total
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {toolbarExtra}
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onRefresh}
                disabled={loading}
                aria-label="Refresh"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>
            )}
            {onExport && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onExport}
                aria-label="Export"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Content area */}
        {error ? (
          <ErrorState
            title="Failed to load"
            error={error}
            onRetry={onRefresh}
          />
        ) : loading ? (
          <LoadingState message="Loading data..." />
        ) : total === 0 && emptyState ? (
          <EmptyState
            icon={emptyState.icon}
            title={emptyState.title}
            description={emptyState.description}
            action={
              emptyState.action
                ? {
                    label: emptyState.action.label,
                    onClick: emptyState.action.onClick || (() => {}),
                  }
                : undefined
            }
          />
        ) : (
          children
        )}

        {/* Pagination */}
        {total > 0 && onPageChange && (
          <div className="mt-4">
            <FullPagination
              page={page}
              totalPages={totalPages}
              pageSize={pageSize}
              total={total}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              showInput={false}
              size="sm"
              variant="outline"
            />
          </div>
        )}
      </SettingsSection>
    </PageContainer>
  );
}

// ============================================
// Detail Page Template
// ============================================

interface DetailSection {
  id: string;
  title: string;
  description?: string;
  content: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

interface DetailPageTemplateProps {
  // Page info
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  // Back navigation
  backHref?: string;
  backLabel?: string;
  // Data state
  loading?: boolean;
  error?: Error | string | null;
  notFound?: boolean;
  // Action buttons
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    href?: string;
    disabled?: boolean;
    loading?: boolean;
    variant?: "default" | "destructive" | "warning";
  };
  secondaryActions?: {
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    href?: string;
    disabled?: boolean;
  }[];
  moreActions?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    danger?: boolean;
    disabled?: boolean;
  }[];
  // Detail sections
  sections?: DetailSection[];
  // Sidebar
  sidebar?: React.ReactNode;
  sidebarWidth?: "narrow" | "default" | "wide";
  // Tabs
  tabs?: {
    id: string;
    label: string;
    badge?: string | number;
  }[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  // Refresh
  onRefresh?: () => void;
  // Content
  children?: React.ReactNode;
  className?: string;
}

export function DetailPageTemplate({
  title,
  subtitle,
  description,
  icon,
  badge,
  backHref,
  backLabel = "Back",
  loading = false,
  error = null,
  notFound = false,
  primaryAction,
  secondaryActions = [],
  moreActions = [],
  sections = [],
  sidebar,
  sidebarWidth = "default",
  tabs,
  activeTab,
  onTabChange,
  onRefresh,
  children,
  className,
}: DetailPageTemplateProps) {
  const [moreMenuOpen, setMoreMenuOpen] = React.useState(false);

  const widthClass = {
    narrow: "w-[240px]",
    default: "w-[280px]",
    wide: "w-[320px]",
  };

  // Error state
  if (error) {
    return (
      <PageContainer>
        <div className="py-12">
          <ErrorState title="Failed to load" error={error} onRetry={onRefresh} />
        </div>
      </PageContainer>
    );
  }

  // Not found state
  if (notFound) {
    return (
      <PageContainer>
        <div className="py-12">
          <EmptyState
            title="Resource not found"
            description="The resource you are looking for does not exist or has been deleted"
            action={
              backHref
                ? { label: backLabel, onClick: () => window.history.back() }
                : undefined
            }
          />
        </div>
      </PageContainer>
    );
  }

  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <div className="py-12">
          <LoadingState message="Loading..." />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className={className}>
      {/* Header */}
      <PageHeader
        title={title}
        description={description}
        icon={icon}
        badge={badge}
        backHref={backHref}
        backLabel={backLabel}
        actions={
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onRefresh}
                aria-label="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
            {secondaryActions.map((action, index) =>
              action.href ? (
                <Link key={index} href={action.href}>
                  <Button variant="outline" size="sm" disabled={action.disabled}>
                    {action.icon}
                    {action.label}
                  </Button>
                </Link>
              ) : (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {action.icon}
                  {action.label}
                </Button>
              )
            )}
            {moreActions.length > 0 && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
                {moreMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0"
                      onClick={() => setMoreMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-50 bg-surface-100 border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
                      {moreActions.map((action, index) => (
                        <button
                          key={index}
                          className={cn(
                            "w-full px-3 py-1.5 text-[11px] text-left hover:bg-surface-200 transition-colors flex items-center gap-2",
                            action.disabled && "opacity-50 cursor-not-allowed",
                            action.danger && "text-destructive hover:bg-destructive-200"
                          )}
                          disabled={action.disabled}
                          onClick={() => {
                            if (!action.disabled) {
                              action.onClick();
                              setMoreMenuOpen(false);
                            }
                          }}
                        >
                          {action.icon}
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            {primaryAction &&
              (primaryAction.href ? (
                <Link href={primaryAction.href}>
                  <Button
                    variant={primaryAction.variant || "default"}
                    size="sm"
                    disabled={primaryAction.disabled}
                  >
                    {primaryAction.icon}
                    {primaryAction.label}
                  </Button>
                </Link>
              ) : (
                <Button
                  variant={primaryAction.variant || "default"}
                  size="sm"
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.disabled}
                  loading={primaryAction.loading}
                >
                  {primaryAction.icon}
                  {primaryAction.label}
                </Button>
              ))}
          </div>
        }
      >
        {/* Tabs */}
        {tabs && tabs.length > 0 && (
          <div className="flex items-center gap-1 border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={cn(
                  "px-4 py-2 text-[12px] font-medium transition-colors relative",
                  activeTab === tab.id
                    ? "text-foreground"
                    : "text-foreground-muted hover:text-foreground"
                )}
                onClick={() => onTabChange?.(tab.id)}
              >
                {tab.label}
                {tab.badge !== undefined && (
                  <Badge variant="outline" size="sm" className="ml-1.5">
                    {tab.badge}
                  </Badge>
                )}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500" />
                )}
              </button>
            ))}
          </div>
        )}
      </PageHeader>

      {/* Content area */}
      <div className={cn("flex gap-6", sidebar && "items-start")}>
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          {sections.map((section) => (
            <SettingsSection
              key={section.id}
              title={section.title}
              description={section.description}
            >
              {section.content}
            </SettingsSection>
          ))}
          {children}
        </div>

        {/* Sidebar */}
        {sidebar && (
          <div className={cn("shrink-0", widthClass[sidebarWidth])}>
            {sidebar}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

// ============================================
// Edit Page Template
// ============================================

interface FormField {
  id: string;
  label: string;
  description?: string;
  required?: boolean;
  error?: string;
  content: React.ReactNode;
}

interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

interface EditPageTemplateProps {
  // Page info
  title: string;
  description?: string;
  icon?: React.ReactNode;
  // Back navigation
  backHref?: string;
  backLabel?: string;
  // Data state
  loading?: boolean;
  saving?: boolean;
  // Form sections
  sections?: FormSection[];
  // Action buttons
  onSave?: () => void;
  onCancel?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  saveDisabled?: boolean;
  // Danger zone
  dangerZone?: {
    title: string;
    description: string;
    actions: {
      label: string;
      onClick: () => void;
      loading?: boolean;
    }[];
  };
  // Content
  children?: React.ReactNode;
  // Footer extra content
  footer?: React.ReactNode;
  className?: string;
}

export function EditPageTemplate({
  title,
  description,
  icon,
  backHref,
  backLabel = "Back",
  loading = false,
  saving = false,
  sections = [],
  onSave,
  onCancel,
  saveLabel = "Save",
  cancelLabel = "Cancel",
  saveDisabled = false,
  dangerZone,
  children,
  footer,
  className,
}: EditPageTemplateProps) {
  if (loading) {
    return (
      <PageContainer>
        <div className="py-12">
          <LoadingState message="Loading..." />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className={className}>
      {/* Header */}
      <PageHeader
        title={title}
        description={description}
        icon={icon}
        backHref={backHref}
        backLabel={backLabel}
        actions={
          <div className="flex items-center gap-2">
            {onCancel && (
              <Button variant="outline" size="sm" onClick={onCancel}>
                {cancelLabel}
              </Button>
            )}
            {onSave && (
              <Button
                size="sm"
                onClick={onSave}
                disabled={saveDisabled}
                loading={saving}
                loadingText="Saving..."
              >
                {saveLabel}
              </Button>
            )}
          </div>
        }
      />

      {/* Form sections */}
      <div className="space-y-6">
        {sections.map((section) => (
          <SettingsSection
            key={section.id}
            title={section.title}
            description={section.description}
          >
            <div className="space-y-0">
              {section.fields.map((field) => (
                <div
                  key={field.id}
                  className="grid grid-cols-[200px_1fr] gap-8 py-4 border-b border-border last:border-b-0"
                >
                  <div>
                    <label className="text-[12px] font-medium text-foreground">
                      {field.label}
                      {field.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </label>
                    {field.description && (
                      <p className="text-[11px] text-foreground-muted mt-1">
                        {field.description}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {field.content}
                    {field.error && (
                      <p className="text-[11px] text-destructive">{field.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SettingsSection>
        ))}

        {children}

        {/* Danger zone */}
        {dangerZone && (
          <SettingsSection
            title={dangerZone.title}
            description={dangerZone.description}
          >
            <div className="flex items-center gap-3">
              {dangerZone.actions.map((action, index) => (
                <Button
                  key={index}
                  variant="destructive"
                  size="sm"
                  onClick={action.onClick}
                  loading={action.loading}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </SettingsSection>
        )}
      </div>

      {/* Bottom action bar (sticky) */}
      {(onSave || footer) && (
        <div className="sticky bottom-0 mt-6 -mx-6 px-6 py-4 bg-background-studio border-t border-border">
          <div className="flex items-center justify-between">
            {footer || <div />}
            <div className="flex items-center gap-2">
              {onCancel && (
                <Button variant="outline" size="sm" onClick={onCancel}>
                  {cancelLabel}
                </Button>
              )}
              {onSave && (
                <Button
                  size="sm"
                  onClick={onSave}
                  disabled={saveDisabled}
                  loading={saving}
                  loadingText="Saving..."
                >
                  {saveLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

// ============================================
// Exports
// ============================================

export type {
  ListPageFilter,
  ListPageTemplateProps,
  DetailSection,
  DetailPageTemplateProps,
  FormField,
  FormSection,
  EditPageTemplateProps,
};
