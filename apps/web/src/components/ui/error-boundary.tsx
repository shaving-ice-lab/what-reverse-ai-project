"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw, Home, Bug, XCircle } from "lucide-react";
import { Button } from "./button";

/**
 * 错误边界组件 - 极简风格
 */

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
          showDetails={this.props.showDetails}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo?: ErrorInfo | null;
  onRetry?: () => void;
  onGoHome?: () => void;
  showDetails?: boolean;
  className?: string;
}

export function ErrorFallback({
  error,
  errorInfo,
  onRetry,
  onGoHome,
  showDetails = false,
  className,
}: ErrorFallbackProps) {
  return (
    <div
      className={cn(
        "min-h-[400px] flex flex-col items-center justify-center p-8",
        className
      )}
    >
      <div className={cn(
        "w-16 h-16 rounded-lg flex items-center justify-center mb-6",
        "bg-[var(--color-destructive-muted)]"
      )}>
        <AlertTriangle className="h-8 w-8 text-[var(--color-destructive)]" />
      </div>

      <h2 className="text-xl font-semibold mb-2 text-center">出错了</h2>
      <p className="text-[var(--color-muted-foreground)] text-center mb-6 max-w-md text-sm">
        {error?.message || "应用程序遇到了一个错误，请尝试刷新页面或返回首页"}
      </p>

      <div className="flex items-center gap-2 mb-6">
        {onRetry && (
          <Button onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            重试
          </Button>
        )}
        {onGoHome && (
          <Button onClick={onGoHome} variant="outline">
            <Home className="mr-2 h-4 w-4" />
            返回首页
          </Button>
        )}
      </div>

      {showDetails && error && (
        <details className="w-full max-w-2xl">
          <summary className="cursor-pointer text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] flex items-center gap-2">
            <Bug className="h-4 w-4" />
            查看错误详情
          </summary>
          <div className="mt-3 p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]">
            <div className="flex items-start gap-2 mb-3">
              <XCircle className="h-4 w-4 text-[var(--color-destructive)] shrink-0 mt-0.5" />
              <p className="font-mono text-sm text-[var(--color-destructive)] break-all">
                {error.toString()}
              </p>
            </div>
            {errorInfo?.componentStack && (
              <pre className="text-xs text-[var(--color-muted-foreground)] whitespace-pre-wrap p-3 rounded-md bg-[var(--color-background)]">
                {errorInfo.componentStack}
              </pre>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export function parseApiError(error: unknown): ApiError {
  if (typeof error === "object" && error !== null && "code" in error && "message" in error) {
    return error as ApiError;
  }

  if (error instanceof Error) {
    return {
      code: "UNKNOWN_ERROR",
      message: error.message,
    };
  }

  if (typeof error === "string") {
    return {
      code: "UNKNOWN_ERROR",
      message: error,
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "发生了未知错误",
  };
}

const errorMessages: Record<string, string> = {
  UNAUTHORIZED: "请先登录",
  FORBIDDEN: "没有权限执行此操作",
  NOT_FOUND: "请求的资源不存在",
  VALIDATION_ERROR: "输入数据验证失败",
  RATE_LIMITED: "请求过于频繁，请稍后再试",
  SERVER_ERROR: "服务器错误，请稍后再试",
  NETWORK_ERROR: "网络连接失败，请检查网络",
  TIMEOUT: "请求超时，请稍后再试",
};

export function getErrorMessage(error: unknown): string {
  const apiError = parseApiError(error);
  return errorMessages[apiError.code] || apiError.message;
}

export function createApiError(code: string, message?: string): ApiError {
  return {
    code,
    message: message || errorMessages[code] || "发生错误",
  };
}
