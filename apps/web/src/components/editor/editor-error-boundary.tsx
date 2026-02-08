"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw, Undo2, Download, Bug, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Editor Error Boundary Component - Minimalist Style
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
 alert("Multiple recovery attempts failed. Please refresh the page. Your data has been auto-saved.");
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
 alert("Unable to restore data.");
 }
 } catch (e) {
 console.error("[EditorErrorBoundary] Export failed:", e);
 alert("Export failed.");
 }
 };

 handleReset = () => {
 if (confirm("Reset editor? This will clear all unsaved changes.")) {
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

 <h2 className="text-lg font-semibold mb-2 text-center">Editor Error</h2>
 <p className="text-sm text-foreground-muted text-center mb-4">
 Your work has been auto-saved
 </p>

 <div className="flex items-center gap-2 p-3 rounded-md bg-brand-200 mb-4">
 <Shield className="h-4 w-4 text-brand-500 shrink-0" />
 <div className="text-sm">
 <p className="font-medium text-brand-500">Data is protected</p>
 </div>
 </div>

 {recoveryAttempts > 0 && (
 <div className="flex items-center justify-center p-2 rounded-md bg-warning-200 mb-4">
 <span className="text-xs font-medium text-warning">
 Restore attempted {recoveryAttempts}/{MAX_RECOVERY_ATTEMPTS} times
 </span>
 </div>
 )}

 <div className="space-y-2">
 {canRetry && (
 <Button onClick={this.handleRetry} className="w-full">
 <RefreshCw className="mr-2 h-4 w-4" />
                  Try Restore
                </Button>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={this.handleExportData} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
 <Button 
 onClick={this.handleReset} 
 variant="outline"
 className="text-destructive"
 >
 <Undo2 className="mr-2 h-4 w-4" />
 Reset
 </Button>
 </div>
 </div>

 {process.env.NODE_ENV === "development" && error && (
 <details className="mt-4">
 <summary className="cursor-pointer text-xs text-foreground-muted hover:text-foreground flex items-center gap-1">
 <Bug className="h-3.5 w-3.5" />
                  View Details
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
 errorMessage = "Node operation failed"
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
 errorMessage = "Async operation failed"
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
