"use client";

/**
 * Getting Started Guide & Danger Action Prompts
 * For guiding users through first-time operations or confirming dangerous actions
 */

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle,
  ExternalLink,
  HelpCircle,
  Info,
  Lightbulb,
  Rocket,
  Shield,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

// ============================================
// Getting Started Guide Component
// ============================================

interface GettingStartedStep {
  id: string;
  title: string;
  description?: string;
  completed?: boolean;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

interface GettingStartedGuideProps {
  title: string;
  description?: string;
  steps: GettingStartedStep[];
  onSkip?: () => void;
  skipLabel?: string;
  completedMessage?: string;
  className?: string;
}

export function GettingStartedGuide({
  title,
  description,
  steps,
  onSkip,
  skipLabel = "Skip guide",
  completedMessage = "All steps completed!",
  className,
}: GettingStartedGuideProps) {
  const completedCount = steps.filter((s) => s.completed).length;
  const allCompleted = completedCount === steps.length;

  return (
    <div
      className={cn(
        "bg-surface-100 border border-border rounded-lg overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-surface-75/70">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-200 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-brand-500" />
            </div>
            <div>
              <h3 className="text-[14px] font-medium text-foreground">{title}</h3>
              {description && (
                <p className="text-[12px] text-foreground-light mt-0.5">
                  {description}
                </p>
              )}
            </div>
          </div>
          {onSkip && !allCompleted && (
            <Button variant="ghost" size="sm" onClick={onSkip}>
              {skipLabel}
            </Button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-surface-300 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-300"
              style={{ width: `${(completedCount / steps.length) * 100}%` }}
            />
          </div>
          <span className="text-[11px] text-foreground-muted">
            {completedCount}/{steps.length}
          </span>
        </div>
      </div>

      {/* Step list */}
      <div className="divide-y divide-border">
        {allCompleted ? (
          <div className="px-5 py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-success-200 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <p className="text-[13px] font-medium text-foreground">
              {completedMessage}
            </p>
          </div>
        ) : (
          steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "px-5 py-4 flex items-start gap-4",
                step.completed && "opacity-60"
              )}
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0",
                  step.completed
                    ? "bg-success-200 text-success"
                    : "bg-surface-200 text-foreground-muted"
                )}
              >
                {step.completed ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4
                  className={cn(
                    "text-[13px] font-medium",
                    step.completed
                      ? "text-foreground-light line-through"
                      : "text-foreground"
                  )}
                >
                  {step.title}
                </h4>
                {step.description && (
                  <p className="text-[12px] text-foreground-muted mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>
              {step.action && !step.completed && (
                step.action.href ? (
                  <Link href={step.action.href}>
                    <Button variant="outline" size="sm">
                      {step.action.label}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={step.action.onClick}
                  >
                    {step.action.label}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================
// Feature Introduction Cards
// ============================================

interface FeatureCard {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

interface FeatureIntroProps {
  title: string;
  description?: string;
  features: FeatureCard[];
  className?: string;
}

export function FeatureIntro({
  title,
  description,
  features,
  className,
}: FeatureIntroProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-[14px] font-medium text-foreground">{title}</h3>
        {description && (
          <p className="text-[12px] text-foreground-light mt-1">{description}</p>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.id}
            className="p-4 bg-surface-100 border border-border rounded-lg hover:border-border-strong transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-200/50 flex items-center justify-center mb-3">
              <div className="text-brand-500">{feature.icon}</div>
            </div>
            <h4 className="text-[13px] font-medium text-foreground mb-1">
              {feature.title}
            </h4>
            <p className="text-[12px] text-foreground-muted mb-3">
              {feature.description}
            </p>
            {feature.action && (
              feature.action.href ? (
                <Link
                  href={feature.action.href}
                  className="inline-flex items-center gap-1 text-[11px] text-brand-500 hover:text-brand-600 transition-colors"
                >
                  {feature.action.label}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              ) : (
                <button
                  onClick={feature.action.onClick}
                  className="inline-flex items-center gap-1 text-[11px] text-brand-500 hover:text-brand-600 transition-colors"
                >
                  {feature.action.label}
                  <ArrowRight className="w-3 h-3" />
                </button>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Danger Confirmation Dialog
// ============================================

interface DangerConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** Text to type for confirmation */
  confirmText?: string;
  /** Confirm button text */
  confirmLabel?: string;
  /** Cancel button text */
  cancelLabel?: string;
  /** Confirm action */
  onConfirm: () => void;
  /** Whether processing */
  loading?: boolean;
  /** Warning list */
  warnings?: string[];
  className?: string;
}

export function DangerConfirm({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  confirmLabel = "Confirm Delete",
  cancelLabel = "Cancel",
  onConfirm,
  loading = false,
  warnings = [],
  className,
}: DangerConfirmProps) {
  const [inputValue, setInputValue] = React.useState("");
  const canConfirm = confirmText ? inputValue === confirmText : true;

  React.useEffect(() => {
    if (!open) setInputValue("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => !loading && onOpenChange(false)}
      />

      {/* Dialog */}
      <div
        className={cn(
          "relative bg-surface-100 border border-destructive/30 rounded-lg shadow-xl w-full max-w-md mx-4",
          "animate-scale-in",
          className
        )}
      >
        {/* Header */}
        <div className="p-5 border-b border-border">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-foreground">
                {title}
              </h3>
              <p className="text-[13px] text-foreground-light mt-1">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Warning list */}
          {warnings.length > 0 && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <h4 className="text-[12px] font-medium text-destructive mb-2">
                Please note the following impacts:
              </h4>
              <ul className="space-y-1">
                {warnings.map((warning, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-[12px] text-foreground-light"
                  >
                    <XCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Confirmation input */}
          {confirmText && (
            <div>
              <label className="block text-[12px] text-foreground-light mb-2">
                Type <code className="px-1 py-0.5 bg-surface-200 rounded text-destructive">{confirmText}</code> to confirm:
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={confirmText}
                className={cn(
                  "w-full h-9 px-3 rounded-md border bg-surface-100",
                  "text-[13px] text-foreground placeholder:text-foreground-muted",
                  "focus:outline-none focus:ring-2 focus:ring-destructive/30",
                  inputValue === confirmText
                    ? "border-destructive"
                    : "border-border"
                )}
                disabled={loading}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 pt-0 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="destructive-fill"
            size="sm"
            onClick={onConfirm}
            disabled={!canConfirm || loading}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Warning Banner
// ============================================

interface WarningBannerProps {
  type?: "info" | "warning" | "error" | "success";
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const BANNER_STYLES = {
  info: {
    bg: "bg-brand-200/50",
    border: "border-brand-500/30",
    icon: Info,
    iconColor: "text-brand-500",
  },
  warning: {
    bg: "bg-warning-200/50",
    border: "border-warning/30",
    icon: AlertTriangle,
    iconColor: "text-warning",
  },
  error: {
    bg: "bg-destructive-200/50",
    border: "border-destructive/30",
    icon: AlertCircle,
    iconColor: "text-destructive",
  },
  success: {
    bg: "bg-success-200/50",
    border: "border-success/30",
    icon: CheckCircle,
    iconColor: "text-success",
  },
};

export function WarningBanner({
  type = "warning",
  title,
  description,
  action,
  dismissible = false,
  onDismiss,
  className,
}: WarningBannerProps) {
  const style = BANNER_STYLES[type];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border",
        style.bg,
        style.border,
        className
      )}
    >
      <Icon className={cn("w-5 h-5 shrink-0", style.iconColor)} />
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-medium text-foreground">{title}</h4>
        {description && (
          <p className="text-[12px] text-foreground-light mt-0.5">
            {description}
          </p>
        )}
        {action && (
          <Button
            variant="ghost"
            size="sm"
            onClick={action.onClick}
            className="mt-2 h-7 px-2"
          >
            {action.label}
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="text-foreground-muted hover:text-foreground transition-colors"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ============================================
// Action Tip Card
// ============================================

interface ActionTipProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  variant?: "default" | "highlight";
  className?: string;
}

export function ActionTip({
  icon,
  title,
  description,
  action,
  variant = "default",
  className,
}: ActionTipProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border",
        variant === "highlight"
          ? "bg-brand-200/30 border-brand-500/20"
          : "bg-surface-100 border-border",
        className
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
          variant === "highlight" ? "bg-brand-200" : "bg-surface-200"
        )}
      >
        {icon || (
          <Lightbulb
            className={cn(
              "w-4 h-4",
              variant === "highlight" ? "text-brand-500" : "text-foreground-muted"
            )}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-medium text-foreground">{title}</h4>
        <p className="text-[12px] text-foreground-muted mt-0.5">{description}</p>
        {action && (
          action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center gap-1 mt-2 text-[11px] text-brand-500 hover:text-brand-600 transition-colors"
            >
              {action.label}
              <ArrowRight className="w-3 h-3" />
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-1 mt-2 text-[11px] text-brand-500 hover:text-brand-600 transition-colors"
            >
              {action.label}
              <ArrowRight className="w-3 h-3" />
            </button>
          )
        )}
      </div>
    </div>
  );
}

// ============================================
// Help Links Component
// ============================================

interface HelpLink {
  label: string;
  href: string;
  external?: boolean;
}

interface HelpLinksProps {
  title?: string;
  links: HelpLink[];
  className?: string;
}

export function HelpLinks({
  title = "Related Help",
  links,
  className,
}: HelpLinksProps) {
  return (
    <div
      className={cn(
        "p-4 bg-surface-100 border border-border rounded-lg",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-4 h-4 text-foreground-muted" />
        <h4 className="text-[12px] font-medium text-foreground-light">{title}</h4>
      </div>
      <ul className="space-y-2">
        {links.map((link, index) => (
          <li key={index}>
            <Link
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-1.5 text-[12px] text-brand-500 hover:text-brand-600 transition-colors"
            >
              {link.label}
              {link.external && <ExternalLink className="w-3 h-3" />}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================
// Required Reason Input Component
// ============================================

interface RequiredReasonInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  minLength?: number;
  maxLength?: number;
  error?: string;
  className?: string;
}

export function RequiredReasonInput({
  value,
  onChange,
  placeholder = "Enter operation reason (required)",
  label = "Reason for Action",
  minLength = 10,
  maxLength = 500,
  error,
  className,
}: RequiredReasonInputProps) {
  const isValid = value.trim().length >= minLength;

  return (
    <div className={cn("space-y-2", className)}>
      <label className="flex items-center gap-1 text-[12px] font-medium text-foreground">
        {label}
        <span className="text-destructive">*</span>
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={maxLength}
        className={cn(
          "w-full px-3 py-2 rounded-md border bg-surface-100",
          "text-[12px] text-foreground placeholder:text-foreground-muted",
          "focus:outline-none focus:ring-2 focus:ring-brand-500/30",
          "resize-none",
          error || (!isValid && value.length > 0)
            ? "border-destructive"
            : "border-border focus:border-brand-500"
        )}
      />
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-[11px]",
            error ? "text-destructive" : "text-foreground-muted"
          )}
        >
          {error || (value.length > 0 && !isValid && `At least ${minLength} characters required`)}
        </span>
        <span className="text-[11px] text-foreground-muted">
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
}

// ============================================
// Exports
// ============================================

export type {
  GettingStartedStep,
  GettingStartedGuideProps,
  FeatureCard,
  FeatureIntroProps,
  DangerConfirmProps,
  WarningBannerProps,
  ActionTipProps,
  HelpLink,
  HelpLinksProps,
  RequiredReasonInputProps,
};
