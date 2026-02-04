"use client";

import { ReactNode, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckSquare,
  ChevronDown,
  Download,
  Loader2,
  MoreHorizontal,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { cn } from "@/lib/utils";

// ============================================
// Batch Selection Context
// ============================================

export interface BatchSelectionState<T = string> {
  selectedIds: Set<T>;
  isAllSelected: boolean;
  selectAll: () => void;
  deselectAll: () => void;
  toggleSelection: (id: T) => void;
  isSelected: (id: T) => boolean;
  selectedCount: number;
}

export function useBatchSelection<T = string>(
  allIds: T[]
): BatchSelectionState<T> {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set());

  const isAllSelected = allIds.length > 0 && selectedIds.size === allIds.length;

  const selectAll = () => setSelectedIds(new Set(allIds));
  const deselectAll = () => setSelectedIds(new Set());

  const toggleSelection = (id: T) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isSelected = (id: T) => selectedIds.has(id);

  return {
    selectedIds,
    isAllSelected,
    selectAll,
    deselectAll,
    toggleSelection,
    isSelected,
    selectedCount: selectedIds.size,
  };
}

// ============================================
// Batch Action Bar
// ============================================

export interface BatchAction {
  id: string;
  label: string;
  icon?: ReactNode;
  variant?: "default" | "destructive" | "warning";
  onClick: (selectedIds: string[]) => void | Promise<void>;
  requireConfirm?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
}

interface BatchActionBarProps {
  selectedCount: number;
  totalCount: number;
  actions: BatchAction[];
  onDeselectAll: () => void;
  selectedIds: Set<string>;
  className?: string;
}

export function BatchActionBar({
  selectedCount,
  totalCount,
  actions,
  onDeselectAll,
  selectedIds,
  className,
}: BatchActionBarProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<BatchAction | null>(null);

  if (selectedCount === 0) return null;

  const handleAction = async (action: BatchAction) => {
    if (action.requireConfirm) {
      setConfirmAction(action);
      return;
    }

    await executeAction(action);
  };

  const executeAction = async (action: BatchAction) => {
    setLoading(action.id);
    try {
      await action.onClick(Array.from(selectedIds));
    } finally {
      setLoading(null);
      setConfirmAction(null);
    }
  };

  return (
    <>
      <div
        className={cn(
          "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
          "flex items-center gap-3 px-4 py-2.5 rounded-xl",
          "bg-background-surface border border-border shadow-xl",
          "animate-in slide-in-from-bottom-4 duration-200",
          className
        )}
      >
        {/* Selection Info */}
        <div className="flex items-center gap-2 pr-3 border-r border-border">
          <div className="w-6 h-6 rounded bg-brand-500/10 flex items-center justify-center">
            <Check className="w-4 h-4 text-brand-500" />
          </div>
          <span className="text-sm text-foreground">
            已选择{" "}
            <span className="font-semibold text-brand-500">{selectedCount}</span>
            /{totalCount} 项
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {actions.slice(0, 3).map((action) => (
            <Button
              key={action.id}
              variant={action.variant === "destructive" ? "destructive" : "outline"}
              size="sm"
              disabled={loading !== null}
              onClick={() => handleAction(action)}
              className={cn(
                action.variant === "warning" &&
                  "border-warning/50 text-warning hover:bg-warning/10"
              )}
            >
              {loading === action.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                action.icon
              )}
              {action.label}
            </Button>
          ))}

          {actions.length > 3 && (
            <BatchActionDropdown
              actions={actions.slice(3)}
              onAction={handleAction}
              disabled={loading !== null}
            />
          )}
        </div>

        {/* Clear Selection */}
        <button
          onClick={onDeselectAll}
          className="p-1.5 hover:bg-background-hover rounded-md text-foreground-muted hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <BatchConfirmDialog
          open={true}
          onOpenChange={(open) => !open && setConfirmAction(null)}
          title={confirmAction.confirmTitle || "确认操作"}
          message={
            confirmAction.confirmMessage ||
            `确定要对 ${selectedCount} 个项目执行此操作吗？`
          }
          variant={confirmAction.variant}
          onConfirm={() => executeAction(confirmAction)}
          loading={loading === confirmAction.id}
        />
      )}
    </>
  );
}

// ============================================
// Batch Action Dropdown
// ============================================

interface BatchActionDropdownProps {
  actions: BatchAction[];
  onAction: (action: BatchAction) => void;
  disabled?: boolean;
}

function BatchActionDropdown({
  actions,
  onAction,
  disabled,
}: BatchActionDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => setOpen(!open)}
      >
        <MoreHorizontal className="w-4 h-4" />
        更多
        <ChevronDown className="w-3 h-3 ml-1" />
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-full mb-1 right-0 z-50 min-w-[160px] py-1 bg-background-surface border border-border rounded-lg shadow-lg">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => {
                  setOpen(false);
                  onAction(action);
                }}
                className={cn(
                  "w-full px-3 py-2 flex items-center gap-2 text-sm text-left hover:bg-background-hover transition-colors",
                  action.variant === "destructive" && "text-destructive",
                  action.variant === "warning" && "text-warning"
                )}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// Batch Confirm Dialog
// ============================================

interface BatchConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  variant?: "default" | "destructive" | "warning";
  onConfirm: () => void;
  loading?: boolean;
}

function BatchConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  variant = "default",
  onConfirm,
  loading,
}: BatchConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {variant === "destructive" && (
              <AlertTriangle className="w-5 h-5 text-destructive" />
            )}
            {variant === "warning" && (
              <AlertTriangle className="w-5 h-5 text-warning" />
            )}
            {title}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-foreground-muted py-4">{message}</p>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            loading={loading}
            loadingText="处理中..."
          >
            确认
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Checkbox Components for Tables
// ============================================

interface SelectAllCheckboxProps {
  isAllSelected: boolean;
  isPartiallySelected?: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function SelectAllCheckbox({
  isAllSelected,
  isPartiallySelected,
  onToggle,
  disabled,
}: SelectAllCheckboxProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "w-4 h-4 rounded border flex items-center justify-center transition-colors",
        isAllSelected || isPartiallySelected
          ? "bg-brand-500 border-brand-500"
          : "border-border hover:border-foreground-muted",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      aria-label={isAllSelected ? "取消全选" : "全选"}
    >
      {isAllSelected && <Check className="w-3 h-3 text-white" />}
      {isPartiallySelected && !isAllSelected && (
        <div className="w-2 h-0.5 bg-white rounded" />
      )}
    </button>
  );
}

interface RowCheckboxProps {
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function RowCheckbox({ isSelected, onToggle, disabled }: RowCheckboxProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      disabled={disabled}
      className={cn(
        "w-4 h-4 rounded border flex items-center justify-center transition-colors",
        isSelected
          ? "bg-brand-500 border-brand-500"
          : "border-border hover:border-foreground-muted",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      aria-label={isSelected ? "取消选择" : "选择"}
    >
      {isSelected && <Check className="w-3 h-3 text-white" />}
    </button>
  );
}
