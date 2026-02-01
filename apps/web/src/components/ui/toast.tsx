"use client";

import { createContext, useContext, useCallback, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  X,
  Loader2,
  type LucideIcon,
} from "lucide-react";

/**
 * Toast 通知组件 - 增强版
 * 
 * 支持：
 * - 多种位置
 * - 进度条
 * - 自定义图标
 * - 动作按钮
 * - 堆叠动画
 */

export type ToastType = "success" | "error" | "warning" | "info" | "loading" | "default";
export type ToastPosition = "top-right" | "top-left" | "top-center" | "bottom-right" | "bottom-left" | "bottom-center";

export interface ToastConfig {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  showProgress?: boolean;
  closable?: boolean;
  onClose?: () => void;
}

// 类型配置
const typeConfig: Record<ToastType, { icon: LucideIcon; className: string; iconColor: string; progressColor: string }> = {
  success: {
    icon: CheckCircle2,
    className: "border-l-primary bg-card",
    iconColor: "text-brand-500",
    progressColor: "bg-brand-500",
  },
  error: {
    icon: XCircle,
    className: "border-l-red-500 bg-card",
    iconColor: "text-red-500",
    progressColor: "bg-red-500",
  },
  warning: {
    icon: AlertCircle,
    className: "border-l-amber-500 bg-card",
    iconColor: "text-amber-500",
    progressColor: "bg-amber-500",
  },
  info: {
    icon: Info,
    className: "border-l-blue-500 bg-card",
    iconColor: "text-blue-500",
    progressColor: "bg-blue-500",
  },
  loading: {
    icon: Loader2,
    className: "border-l-primary bg-card",
    iconColor: "text-brand-500",
    progressColor: "bg-brand-500",
  },
  default: {
    icon: Info,
    className: "border-l-border bg-card",
    iconColor: "text-foreground-light",
    progressColor: "bg-surface-200",
  },
};

// Context
interface ToastContextValue {
  toasts: ToastConfig[];
  position: ToastPosition;
  setPosition: (position: ToastPosition) => void;
  addToast: (config: Omit<ToastConfig, "id">) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, config: Partial<Omit<ToastConfig, "id">>) => void;
  success: (title: string, description?: string, options?: Partial<ToastConfig>) => string;
  error: (title: string, description?: string, options?: Partial<ToastConfig>) => string;
  warning: (title: string, description?: string, options?: Partial<ToastConfig>) => string;
  info: (title: string, description?: string, options?: Partial<ToastConfig>) => string;
  loading: (title: string, description?: string, options?: Partial<ToastConfig>) => string;
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => Promise<T>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastProviderProps {
  children: React.ReactNode;
  defaultPosition?: ToastPosition;
  maxToasts?: number;
}

export function ToastProvider({ 
  children, 
  defaultPosition = "bottom-right",
  maxToasts = 5,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastConfig[]>([]);
  const [position, setPosition] = useState<ToastPosition>(defaultPosition);

  const addToast = useCallback((config: Omit<ToastConfig, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastConfig = {
      ...config,
      id,
      duration: config.type === "loading" ? 0 : (config.duration ?? 4000),
      closable: config.closable ?? true,
      showProgress: config.showProgress ?? (config.type !== "loading"),
    };
    setToasts((prev) => {
      const updated = [...prev, newToast];
      // 限制最大数量
      if (updated.length > maxToasts) {
        return updated.slice(-maxToasts);
      }
      return updated;
    });
    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateToast = useCallback((id: string, config: Partial<Omit<ToastConfig, "id">>) => {
    setToasts((prev) => 
      prev.map((t) => (t.id === id ? { ...t, ...config } : t))
    );
  }, []);

  const success = useCallback(
    (title: string, description?: string, options?: Partial<ToastConfig>) =>
      addToast({ type: "success", title, description, ...options }),
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string, options?: Partial<ToastConfig>) =>
      addToast({ type: "error", title, description, ...options }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, description?: string, options?: Partial<ToastConfig>) =>
      addToast({ type: "warning", title, description, ...options }),
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string, options?: Partial<ToastConfig>) =>
      addToast({ type: "info", title, description, ...options }),
    [addToast]
  );

  const loading = useCallback(
    (title: string, description?: string, options?: Partial<ToastConfig>) =>
      addToast({ type: "loading", title, description, duration: 0, closable: false, ...options }),
    [addToast]
  );

  const promise = useCallback(
    async <T,>(
      promiseOrFn: Promise<T>,
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: Error) => string);
      }
    ): Promise<T> => {
      const id = addToast({
        type: "loading",
        title: messages.loading,
        duration: 0,
        closable: false,
      });

      try {
        const result = await promiseOrFn;
        updateToast(id, {
          type: "success",
          title: typeof messages.success === "function" ? messages.success(result) : messages.success,
          duration: 4000,
          closable: true,
          showProgress: true,
        });
        return result;
      } catch (err) {
        updateToast(id, {
          type: "error",
          title: typeof messages.error === "function" ? messages.error(err as Error) : messages.error,
          duration: 4000,
          closable: true,
          showProgress: true,
        });
        throw err;
      }
    },
    [addToast, updateToast]
  );

  return (
    <ToastContext.Provider
      value={{ 
        toasts, 
        position, 
        setPosition, 
        addToast, 
        removeToast, 
        updateToast,
        success, 
        error, 
        warning, 
        info,
        loading,
        promise,
      }}
    >
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer() {
  const { toasts, removeToast, position } = useToast();

  const positionStyles: Record<ToastPosition, string> = {
    "top-right": "top-4 right-4 items-end",
    "top-left": "top-4 left-4 items-start",
    "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
    "bottom-right": "bottom-4 right-4 items-end",
    "bottom-left": "bottom-4 left-4 items-start",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
  };

  const isTop = position.startsWith("top");

  return (
    <div 
      className={cn(
        "fixed z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none",
        positionStyles[position]
      )}
    >
      {(isTop ? toasts : [...toasts].reverse()).map((toast, index) => (
        <ToastItem 
          key={toast.id} 
          toast={toast} 
          onDismiss={removeToast}
          index={index}
          position={position}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: ToastConfig;
  onDismiss: (id: string) => void;
  index: number;
  position: ToastPosition;
}

function ToastItem({ toast, onDismiss, index, position }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const progressRef = useRef<NodeJS.Timeout>();
  const config = typeConfig[toast.type];
  const Icon = toast.icon ? () => <>{toast.icon}</> : config.icon;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // 进度条和自动关闭
  useEffect(() => {
    if (toast.duration && toast.duration > 0 && !isPaused) {
      const interval = 50;
      const step = (interval / toast.duration) * 100;
      
      progressRef.current = setInterval(() => {
        setProgress((prev) => {
          const next = prev - step;
          if (next <= 0) {
            handleDismiss();
            return 0;
          }
          return next;
        });
      }, interval);

      return () => {
        if (progressRef.current) {
          clearInterval(progressRef.current);
        }
      };
    }
  }, [toast.duration, isPaused]);

  const handleDismiss = () => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
    }
    setIsLeaving(true);
    toast.onClose?.();
    setTimeout(() => onDismiss(toast.id), 200);
  };

  // 位置动画方向
  const isLeft = position.includes("left");
  const isCenter = position.includes("center");
  const translateClass = isCenter 
    ? (isLeaving ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100")
    : isLeft
      ? (isLeaving ? "-translate-x-4 opacity-0" : "translate-x-0 opacity-100")
      : (isLeaving ? "translate-x-4 opacity-0" : "translate-x-0 opacity-100");

  const enterClass = isCenter 
    ? "-translate-y-2 opacity-0"
    : isLeft
      ? "-translate-x-4 opacity-0"
      : "translate-x-4 opacity-0";

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={cn(
        "pointer-events-auto flex flex-col w-full overflow-hidden",
        "rounded-lg border border-border shadow-lg",
        "transition-all duration-200 ease-out",
        config.className,
        "border-l-4",
        isVisible ? translateClass : enterClass,
      )}
      style={{
        transform: isVisible && !isLeaving ? `scale(${1 - index * 0.02})` : undefined,
      }}
    >
      <div className="flex items-start gap-3 p-4">
        {/* 图标 */}
        <div className={cn(
          "shrink-0 mt-0.5",
          config.iconColor,
          toast.type === "loading" && "animate-spin"
        )}>
          <Icon className="h-5 w-5" />
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{toast.title}</p>
          {toast.description && (
            <p className="text-sm text-foreground-light mt-1 leading-relaxed">{toast.description}</p>
          )}
          
          {/* 操作按钮 */}
          {(toast.action || toast.secondaryAction) && (
            <div className="flex items-center gap-2 mt-3">
              {toast.action && (
                <button
                  onClick={() => {
                    toast.action?.onClick();
                    handleDismiss();
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium",
                    "bg-brand-500 text-primary-foreground",
                    "hover:bg-brand-500/90 transition-colors"
                  )}
                >
                  {toast.action.label}
                </button>
              )}
              {toast.secondaryAction && (
                <button
                  onClick={() => {
                    toast.secondaryAction?.onClick();
                    handleDismiss();
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium",
                    "text-foreground-light hover:text-foreground",
                    "hover:bg-surface-200 transition-colors"
                  )}
                >
                  {toast.secondaryAction.label}
                </button>
              )}
            </div>
          )}
        </div>

        {/* 关闭按钮 */}
        {toast.closable !== false && (
          <button
            onClick={handleDismiss}
            className="shrink-0 p-1 rounded-md transition-colors text-foreground-light hover:text-foreground hover:bg-surface-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 进度条 */}
      {toast.showProgress && toast.duration && toast.duration > 0 && (
        <div className="h-1 bg-surface-200/50">
          <div 
            className={cn("h-full transition-all duration-50", config.progressColor)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// 全局 Toast 实例
let globalToastContext: ToastContextValue | null = null;

export function setGlobalToast(context: ToastContextValue | null) {
  globalToastContext = context;
}

export const toast = {
  success: (title: string, description?: string, options?: Partial<ToastConfig>) => {
    return globalToastContext?.success(title, description, options);
  },
  error: (title: string, description?: string, options?: Partial<ToastConfig>) => {
    return globalToastContext?.error(title, description, options);
  },
  warning: (title: string, description?: string, options?: Partial<ToastConfig>) => {
    return globalToastContext?.warning(title, description, options);
  },
  info: (title: string, description?: string, options?: Partial<ToastConfig>) => {
    return globalToastContext?.info(title, description, options);
  },
  loading: (title: string, description?: string, options?: Partial<ToastConfig>) => {
    return globalToastContext?.loading(title, description, options);
  },
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return globalToastContext?.promise(promise, messages);
  },
  dismiss: (id: string) => {
    globalToastContext?.removeToast(id);
  },
  update: (id: string, config: Partial<Omit<ToastConfig, "id">>) => {
    globalToastContext?.updateToast(id, config);
  },
};

/**
 * ToastInitializer - 初始化全局 toast
 * 放在 ToastProvider 内部使用
 */
export function ToastInitializer() {
  const context = useToast();
  
  useEffect(() => {
    setGlobalToast(context);
    return () => setGlobalToast(null);
  }, [context]);
  
  return null;
}
