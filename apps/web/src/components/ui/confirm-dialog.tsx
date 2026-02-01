"use client";

/**
 * 确认对话框组件
 * 用于危险操作、重要决策的二次确认
 */

import { ReactNode, useState } from "react";
import {
  AlertTriangle,
  Trash2,
  LogOut,
  XCircle,
  CheckCircle,
  Info,
  HelpCircle,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

// ============================================
// 确认对话框
// ============================================

type DialogVariant = "danger" | "warning" | "info" | "success";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  icon?: LucideIcon;
  isLoading?: boolean;
  children?: ReactNode;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "确认",
  cancelText = "取消",
  variant = "danger",
  icon,
  isLoading = false,
  children,
}: ConfirmDialogProps) {
  const getVariantConfig = () => {
    switch (variant) {
      case "danger":
        return {
          icon: AlertTriangle,
          iconBg: "bg-red-500/10",
          iconColor: "text-red-500",
          buttonClass: "bg-red-500 hover:bg-red-600 text-white",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          iconBg: "bg-amber-500/10",
          iconColor: "text-amber-500",
          buttonClass: "bg-amber-500 hover:bg-amber-600 text-white",
        };
      case "info":
        return {
          icon: Info,
          iconBg: "bg-blue-500/10",
          iconColor: "text-blue-500",
          buttonClass: "bg-blue-500 hover:bg-blue-600 text-white",
        };
      case "success":
        return {
          icon: CheckCircle,
          iconBg: "bg-emerald-500/10",
          iconColor: "text-emerald-500",
          buttonClass: "bg-emerald-500 hover:bg-emerald-600 text-white",
        };
    }
  };

  const config = getVariantConfig();
  const Icon = icon || config.icon;

  if (!isOpen) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* 对话框 */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 rounded-2xl bg-card border border-border shadow-2xl z-50">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
              config.iconBg
            )}
          >
            <Icon className={cn("w-6 h-6", config.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>

        {children && <div className="mt-4">{children}</div>}

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            className={config.buttonClass}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "处理中..." : confirmText}
          </Button>
        </div>
      </div>
    </>
  );
}

// ============================================
// 删除确认对话框
// ============================================

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  itemName: string;
  itemType?: string;
  isLoading?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = "项目",
  isLoading = false,
}: DeleteConfirmDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`删除${itemType}`}
      description={`确定要删除「${itemName}」吗？此操作无法撤销。`}
      confirmText="删除"
      cancelText="取消"
      variant="danger"
      icon={Trash2}
      isLoading={isLoading}
    />
  );
}

// ============================================
// 退出确认对话框
// ============================================

interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export function LogoutConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: LogoutConfirmDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="退出登录"
      description="确定要退出当前账号吗？"
      confirmText="退出"
      cancelText="取消"
      variant="warning"
      icon={LogOut}
      isLoading={isLoading}
    />
  );
}

// ============================================
// 输入确认对话框
// ============================================

interface InputConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void | Promise<void>;
  title: string;
  description?: string;
  placeholder?: string;
  confirmText?: string;
  confirmValue?: string;
  variant?: DialogVariant;
  isLoading?: boolean;
}

export function InputConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  placeholder = "请输入确认文字",
  confirmText = "确认",
  confirmValue,
  variant = "danger",
  isLoading = false,
}: InputConfirmDialogProps) {
  const [inputValue, setInputValue] = useState("");

  const handleConfirm = () => {
    onConfirm(inputValue);
  };

  const isConfirmDisabled = confirmValue
    ? inputValue !== confirmValue
    : !inputValue.trim();

  if (!isOpen) return null;

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setInputValue("");
      }}
      onConfirm={handleConfirm}
      title={title}
      description={description}
      confirmText={confirmText}
      variant={variant}
      isLoading={isLoading || isConfirmDisabled}
    >
      <div className="mt-4">
        {confirmValue && (
          <p className="text-sm text-muted-foreground mb-2">
            请输入 <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-foreground">{confirmValue}</code> 以确认
          </p>
        )}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="w-full h-10 px-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>
    </ConfirmDialog>
  );
}

// ============================================
// 使用钩子
// ============================================

interface UseConfirmDialogOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
}

export function useConfirmDialog(options: UseConfirmDialogOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = (): Promise<boolean> => {
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
    });
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      resolvePromise?.(true);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const handleClose = () => {
    resolvePromise?.(false);
    setIsOpen(false);
  };

  const DialogComponent = () => (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      isLoading={isLoading}
      {...options}
    />
  );

  return {
    confirm,
    Dialog: DialogComponent,
  };
}
