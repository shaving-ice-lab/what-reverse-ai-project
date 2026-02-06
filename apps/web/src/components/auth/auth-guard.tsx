"use client";

/**
 * 路由保护组件 - 极简风格
 */

import type { ReactNode } from "react";
import { Suspense, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireGuest?: boolean;
  redirectTo?: string;
}

function AuthGuardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-lg",
            "bg-[var(--color-muted)]"
          )}
        >
          <Loader2 className="h-6 w-6 animate-spin text-[var(--color-foreground)]" />
        </div>
        <div className="text-center">
          <p className="text-[var(--color-muted-foreground)] text-sm">正在加载...</p>
        </div>
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[var(--color-muted-foreground)] animate-pulse"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AuthGuardInner({
  children,
  requireAuth = false,
  requireGuest = false,
  redirectTo,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const redirectParam = searchParams?.get("redirect") || "";
  const { isAuthenticated, isLoading, isInitialized, initialize } = useAuthStore();
  
  useEffect(() => {
    initialize();
  }, [initialize]);
  
  useEffect(() => {
    if (!isInitialized || isLoading) return;
    
    if (requireAuth && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (requireGuest && isAuthenticated) {
      const target = redirectTo || redirectParam || "/dashboard";
      if (target !== pathname) {
        router.push(target);
      }
    }
  }, [
    isAuthenticated,
    isInitialized,
    isLoading,
    requireAuth,
    requireGuest,
    pathname,
    redirectTo,
    redirectParam,
    router,
  ]);
  
  if (!isInitialized || isLoading) {
    return <AuthGuardLoading />;
  }
  
  if (requireAuth && !isAuthenticated) {
    return null;
  }
  
  if (requireGuest && isAuthenticated) {
    return null;
  }
  
  return <>{children}</>;
}

export function AuthGuard({
  children,
  requireAuth = false,
  requireGuest = false,
  redirectTo,
}: AuthGuardProps) {
  return (
    <Suspense fallback={<AuthGuardLoading />}>
      <AuthGuardInner
        requireAuth={requireAuth}
        requireGuest={requireGuest}
        redirectTo={redirectTo}
      >
        {children}
      </AuthGuardInner>
    </Suspense>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  return <AuthGuard requireAuth>{children}</AuthGuard>;
}

export function RequireGuest({ 
  children,
  redirectTo = "/dashboard",
}: { 
  children: React.ReactNode;
  redirectTo?: string;
}) {
  return (
    <AuthGuard requireGuest redirectTo={redirectTo}>
      {children}
    </AuthGuard>
  );
}
