"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw, Undo2, Download, Bug, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * 编辑器专用错误边界组件 - 极简风格
 */

interface EditorErrorBoundaryProps {
  children: ReactNode;
  workflowId?: string;
  onRecovery?: () => void;
  onExportData?: () => { nodes: unknown[]; edges: unknown[] } | null;
}

interface EditorErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  recoveryAttempts: number;
}

const MAX_RECOVERY_ATTEMPTS = 3;

const getRecoveryKey = (workflowId?: string) => 
  `agentflow_recovery_${workflowId || "new"}`;

export class EditorErrorBoundary extends Component<
  EditorErrorBoundaryProps,
  EditorErrorBoundaryState
> {
  constructor(props: EditorErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempts: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<EditorErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("[EditorErrorBoundary] Error caught:", error, errorInfo);
    this.saveRecoveryData();
    this.reportError(error, errorInfo);
  }

  saveRecoveryData = () => {
    try {
      const { onExportData, workflowId } = this.props;
      if (onExportData) {
        const data = onExportData();
        if (data) {
          localStorage.setItem(
            getRecoveryKey(workflowId),
            JSON.stringify({
              data,
              timestamp: Date.now(),
              error: this.state.error?.message,
            })
          );
        }
      }
    } catch (e) {
      console.error("[EditorErrorBoundary] Failed to save recovery data:", e);
    }
  };

  reportError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      workflowId: this.props.workflowId,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    };
    
    if (process.env.NODE_ENV === "development") {
      console.error("[EditorErrorBoundary] Error Report:", errorReport);
    }
  };

  handleRetry = () => {
    const { recoveryAttempts } = this.state;
    
    if (recoveryAttempts < MAX_RECOVERY_ATTEMPTS) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        recoveryAttempts: recoveryAttempts + 1,
      });
      this.props.onRecovery?.();
    } else {
      alert("多次恢复尝试失败，建议刷新页面。您的数据已自动保存。");
    }
  };

  handleExportData = () => {
    try {
      const recoveryKey = getRecoveryKey(this.props.workflowId);
      const savedData = localStorage.getItem(recoveryKey);
      
      if (savedData) {
        const parsed = JSON.parse(savedData);
        const blob = new Blob([JSON.stringify(parsed.data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `workflow_recovery_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert("没有找到可恢复的数据");
      }
    } catch (e) {
      console.error("[EditorErrorBoundary] Export failed:", e);
      alert("导出失败");
    }
  };

  handleReset = () => {
    if (confirm("确定要重置编辑器吗？这将清除所有未保存的更改。")) {
      localStorage.removeItem(getRecoveryKey(this.props.workflowId));
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, recoveryAttempts } = this.state;
      const canRetry = recoveryAttempts < MAX_RECOVERY_ATTEMPTS;

      return (
        <div className="h-full flex flex-col items-center justify-center p-8 bg-background-studio">
          <div className="w-full max-w-md p-6 rounded-lg border border-border bg-surface-100">
            <div className="flex justify-center mb-6">
              <div className={cn(
                "w-16 h-16 rounded-lg flex items-center justify-center",
                "bg-destructive-200"
              )}>
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>

            <h2 className="text-lg font-semibold mb-2 text-center">编辑器遇到了问题</h2>
            <p className="text-sm text-foreground-muted text-center mb-4">
              您的工作数据已自动保存
            </p>

            <div className="flex items-center gap-2 p-3 rounded-md bg-brand-200 mb-4">
              <Shield className="h-4 w-4 text-brand-500 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-brand-500">数据已保护</p>
              </div>
            </div>

            {recoveryAttempts > 0 && (
              <div className="flex items-center justify-center p-2 rounded-md bg-warning-200 mb-4">
                <span className="text-xs font-medium text-warning">
                  已尝试恢复 {recoveryAttempts}/{MAX_RECOVERY_ATTEMPTS} 次
                </span>
              </div>
            )}

            <div className="space-y-2">
              {canRetry && (
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  尝试恢复
                </Button>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={this.handleExportData} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  导出数据
                </Button>
                <Button 
                  onClick={this.handleReset} 
                  variant="outline"
                  className="text-destructive"
                >
                  <Undo2 className="mr-2 h-4 w-4" />
                  重置
                </Button>
              </div>
            </div>

            {process.env.NODE_ENV === "development" && error && (
              <details className="mt-4">
                <summary className="cursor-pointer text-xs text-foreground-muted hover:text-foreground flex items-center gap-1">
                  <Bug className="h-3.5 w-3.5" />
                  查看详情
                </summary>
                <div className="mt-2 p-3 rounded-md bg-surface-200 overflow-auto max-h-40">
                  <p className="font-mono text-xs text-destructive mb-2 break-all">
                    {error.toString()}
                  </p>
                  {errorInfo?.componentStack && (
                    <pre className="text-[10px] text-foreground-muted whitespace-pre-wrap break-all">
                      {errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function safeNodeOperation<T>(
  operation: () => T,
  fallback: T,
  errorMessage = "节点操作失败"
): T {
  try {
    return operation();
  } catch (error) {
    console.error(`[SafeNodeOperation] ${errorMessage}:`, error);
    return fallback;
  }
}

export async function safeAsyncOperation<T>(
  operation: () => Promise<T>,
  fallback: T,
  errorMessage = "异步操作失败"
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`[SafeAsyncOperation] ${errorMessage}:`, error);
    return fallback;
  }
}

export function useAutoSave(
  data: { nodes: unknown[]; edges: unknown[] },
  workflowId: string | undefined,
  interval = 30000
) {
  const saveKey = getRecoveryKey(workflowId);

  if (typeof window !== "undefined") {
    const save = () => {
      try {
        localStorage.setItem(
          saveKey,
          JSON.stringify({
            data,
            timestamp: Date.now(),
            autoSave: true,
          })
        );
      } catch (e) {
        console.error("[AutoSave] Failed:", e);
      }
    };

    const scheduleAutoSave = () => {
      if ("requestIdleCallback" in window) {
        (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(save);
      } else {
        setTimeout(save, 0);
      }
    };

    const timerId = setInterval(scheduleAutoSave, interval);
    
    const handleBeforeUnload = () => save();
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(timerId);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }
  
  return () => {};
}

export function hasRecoveryData(workflowId?: string): boolean {
  try {
    const data = localStorage.getItem(getRecoveryKey(workflowId));
    return !!data;
  } catch {
    return false;
  }
}

export function getRecoveryData(workflowId?: string): {
  data: { nodes: unknown[]; edges: unknown[] };
  timestamp: number;
} | null {
  try {
    const saved = localStorage.getItem(getRecoveryKey(workflowId));
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("[RecoveryData] Failed to get:", e);
  }
  return null;
}

export function clearRecoveryData(workflowId?: string): void {
  try {
    localStorage.removeItem(getRecoveryKey(workflowId));
  } catch (e) {
    console.error("[RecoveryData] Failed to clear:", e);
  }
}
