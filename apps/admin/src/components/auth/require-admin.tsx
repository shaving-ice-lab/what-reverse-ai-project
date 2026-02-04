"use client";

import { Suspense, useEffect, useMemo, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShieldAlert } from "lucide-react";
import { AdminCapabilitiesProvider } from "@/contexts/admin-capabilities";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import type { AdminCapability } from "@/types/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function FullPageLoading({ label = "正在加载..." }: { label?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-studio">
      <div className="flex flex-col items-center gap-3">
        <div
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-lg",
            "bg-surface-200 border border-border"
          )}
        >
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
        <div className="text-center">
          <p className="text-[12px] text-foreground-light">{label}</p>
        </div>
      </div>
    </div>
  );
}

function buildLoginUrl(pathname: string, search: string) {
  const redirect = `${pathname}${search || ""}`;
  return `/login?redirect=${encodeURIComponent(redirect || "/")}`;
}

function RequireAdminInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const search = useMemo(() => {
    const qs = searchParams?.toString();
    return qs ? `?${qs}` : "";
  }, [searchParams]);

  const {
    isAuthenticated,
    isLoading: authLoading,
    isInitialized,
    initialize,
    logout,
  } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isInitialized || authLoading) return;
    if (!isAuthenticated) {
      router.replace(buildLoginUrl(pathname, search));
    }
  }, [authLoading, isAuthenticated, isInitialized, pathname, router, search]);

  const capabilitiesQuery = useQuery({
    queryKey: ["admin", "capabilities"],
    enabled: isInitialized && isAuthenticated,
    retry: false,
    queryFn: () => api.get<{ capabilities: AdminCapability[] }>("/admin/capabilities"),
  });

  useEffect(() => {
    const error = capabilitiesQuery.error;
    if (!error) return;
    if (!(error instanceof ApiError)) return;

    if (error.status === 401) {
      router.replace(buildLoginUrl(pathname, search));
      return;
    }
    if (error.status === 403) {
      router.replace("/403");
    }
  }, [capabilitiesQuery.error, pathname, router, search]);

  if (!isInitialized || authLoading) {
    return <FullPageLoading label="正在初始化认证..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (capabilitiesQuery.isPending) {
    return <FullPageLoading label="正在验证管理员权限..." />;
  }

  if (capabilitiesQuery.error) {
    const error =
      capabilitiesQuery.error instanceof ApiError
        ? capabilitiesQuery.error
        : null;
    const errorTitle = error
      ? `${error.code} (${error.status || 0})`
      : "UNKNOWN_ERROR";
    const traceInfo = error?.traceId || error?.requestId;

    return (
      <div className="min-h-screen bg-background-studio flex items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-xl border border-border bg-surface-100 p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive-200 flex items-center justify-center border border-destructive/20">
              <ShieldAlert className="w-5 h-5 text-destructive" />
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-foreground">
                管理员权限校验失败
              </div>
              <div className="mt-1 text-[12px] text-foreground-light">
                {error?.message || "无法获取管理员能力清单，请稍后重试。"}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" size="sm">
                  {errorTitle}
                </Badge>
                {traceInfo && (
                  <Badge variant="outline" size="sm">
                    trace: {traceInfo}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => capabilitiesQuery.refetch()}
            >
              重试
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                await logout();
                router.replace("/login");
              }}
            >
              退出登录
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const capabilities = capabilitiesQuery.data?.capabilities || [];

  return (
    <AdminCapabilitiesProvider capabilities={capabilities}>
      {children}
    </AdminCapabilitiesProvider>
  );
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<FullPageLoading label="正在验证访问权限..." />}>
      <RequireAdminInner>{children}</RequireAdminInner>
    </Suspense>
  );
}

