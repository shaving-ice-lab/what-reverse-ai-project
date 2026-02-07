"use client";

import { ReactNode } from "react";
import {
  AlertCircle,
  AlertTriangle,
  FileQuestion,
  Inbox,
  Loader2,
  RefreshCw,
  SearchX,
  ServerOff,
  WifiOff,
} from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

// ============================================
// Loading State
// ============================================

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  size = "md",
  className,
}: LoadingStateProps) {
  const sizeConfig = {
    sm: { spinner: "w-5 h-5", text: "text-xs", padding: "py-4" },
    md: { spinner: "w-8 h-8", text: "text-sm", padding: "py-8" },
    lg: { spinner: "w-12 h-12", text: "text-base", padding: "py-12" },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        config.padding,
        className
      )}
    >
      <Loader2
        className={cn(
          "text-brand-500 animate-spin mb-3",
          config.spinner
        )}
      />
      <p className={cn("text-foreground-muted", config.text)}>{message}</p>
    </div>
  );
}

// ============================================
// Empty State
// ============================================

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-background-hover flex items-center justify-center mb-4">
        {icon || <Inbox className="w-6 h-6 text-foreground-muted" />}
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-foreground-muted max-w-[300px] mb-4">
          {description}
        </p>
      )}
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.icon}
          {action.label}
        </Button>
      )}
    </div>
  );
}

// ============================================
// No Results State (Search)
// ============================================

interface NoResultsStateProps {
  query?: string;
  suggestions?: string[];
  onClear?: () => void;
  className?: string;
}

export function NoResultsState({
  query,
  suggestions,
  onClear,
  className,
}: NoResultsStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-background-hover flex items-center justify-center mb-4">
        <SearchX className="w-6 h-6 text-foreground-muted" />
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">
        No results found
      </h3>
      {query && (
        <p className="text-xs text-foreground-muted mb-2">
          No matches found for "<span className="text-foreground">{query}</span>"
        </p>
      )}
      {suggestions && suggestions.length > 0 && (
        <div className="text-xs text-foreground-muted mb-4">
          <p className="mb-1">Suggestions:</p>
          <ul className="list-disc list-inside">
            {suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {onClear && (
        <Button variant="outline" size="sm" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  );
}

// ============================================
// Error State
// ============================================

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Failed to load",
  message,
  error,
  onRetry,
  className,
}: ErrorStateProps) {
  const errorMessage =
    message ||
    (error instanceof Error ? error.message : error) ||
    "An unknown error occurred. Please try again later.";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-destructive" />
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
      <p className="text-xs text-foreground-muted max-w-[300px] mb-4">
        {errorMessage}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}

// ============================================
// Network Error State
// ============================================

interface NetworkErrorStateProps {
  onRetry?: () => void;
  className?: string;
}

export function NetworkErrorState({ onRetry, className }: NetworkErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mb-4">
        <WifiOff className="w-6 h-6 text-warning" />
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">Network connection failed</h3>
      <p className="text-xs text-foreground-muted max-w-[300px] mb-4">
        Please check your network connection and try again
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}

// ============================================
// Server Error State
// ============================================

interface ServerErrorStateProps {
  statusCode?: number;
  onRetry?: () => void;
  className?: string;
}

export function ServerErrorState({
  statusCode,
  onRetry,
  className,
}: ServerErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <ServerOff className="w-6 h-6 text-destructive" />
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">
        Server error {statusCode && `(${statusCode})`}
      </h3>
      <p className="text-xs text-foreground-muted max-w-[300px] mb-4">
        Service temporarily unavailable. Please try again later
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}

// ============================================
// Not Found State
// ============================================

interface NotFoundStateProps {
  title?: string;
  message?: string;
  onBack?: () => void;
  className?: string;
}

export function NotFoundState({
  title = "Resource not found",
  message = "The resource you are looking for does not exist or has been deleted",
  onBack,
  className,
}: NotFoundStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-background-hover flex items-center justify-center mb-4">
        <FileQuestion className="w-6 h-6 text-foreground-muted" />
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
      <p className="text-xs text-foreground-muted max-w-[300px] mb-4">
        {message}
      </p>
      {onBack && (
        <Button variant="outline" size="sm" onClick={onBack}>
          Go back
        </Button>
      )}
    </div>
  );
}

// ============================================
// Warning State
// ============================================

interface WarningStateProps {
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function WarningState({
  title,
  message,
  action,
  className,
}: WarningStateProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20",
        className
      )}
    >
      <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        {message && (
          <p className="text-xs text-foreground-muted mt-0.5">{message}</p>
        )}
        {action && (
          <Button
            variant="ghost"
            size="sm"
            onClick={action.onClick}
            className="mt-2 h-7 px-2 text-warning hover:text-warning"
          >
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================
// Skeleton Components
// ============================================

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-background-hover rounded",
        className
      )}
    />
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 border-b border-border">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-4 border border-border rounded-lg">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="p-4 border border-border rounded-lg">
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-8 w-24 mb-1" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}
