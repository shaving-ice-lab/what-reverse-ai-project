"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw, Home, Bug, XCircle } from "lucide-react";
import { Button } from "./button";

/**
 * Error Boundary Component - Minimalist Style
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

 <h2 className="text-xl font-semibold mb-2 text-center">Something Went Wrong</h2>
 <p className="text-[var(--color-muted-foreground)] text-center mb-6 max-w-md text-sm">
 {error?.message || "Something went wrong. Try refreshing or go back home."}
 </p>

 <div className="flex items-center gap-2 mb-6">
 {onRetry && (
 <Button onClick={onRetry}>
 <RefreshCw className="mr-2 h-4 w-4" />
 Retry
 </Button>
 )}
 {onGoHome && (
 <Button onClick={onGoHome} variant="outline">
 <Home className="mr-2 h-4 w-4" />
 Back Home
 </Button>
 )}
 </div>

 {showDetails && error && (
 <details className="w-full max-w-2xl">
 <summary className="cursor-pointer text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] flex items-center gap-2">
 <Bug className="h-4 w-4" />
 View Error Details
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
 message: "An unknown error occurred",
 };
}

const errorMessages: Record<string, string> = {
 UNAUTHORIZED: "Please sign in first",
 FORBIDDEN: "You don't have permission for this action",
 NOT_FOUND: "The requested resource does not exist",
  VALIDATION_ERROR: "Failed to validate input",
 RATE_LIMITED: "Too many requests, please try again later",
 SERVER_ERROR: "Server error, please try again later",
 NETWORK_ERROR: "Network error. Check your connection.",
 TIMEOUT: "Request timed out, please try again later",
};

export function getErrorMessage(error: unknown): string {
 const apiError = parseApiError(error);
 return errorMessages[apiError.code] || apiError.message;
}

export function createApiError(code: string, message?: string): ApiError {
 return {
 code,
 message: message || errorMessages[code] || "An error occurred",
 };
}
