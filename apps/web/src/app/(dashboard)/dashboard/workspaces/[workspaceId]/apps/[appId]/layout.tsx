"use client";

import { useMemo } from "react";
import { useParams, usePathname } from "next/navigation";
import { AppGuard } from "@/components/permissions/app-guard";
import type { WorkspacePermission } from "@/lib/permissions";

const resolveRequiredPermissions = (pathname: string): WorkspacePermission[] => {
  if (pathname.includes("/publish")) return ["app_publish"];
  if (pathname.includes("/domains")) return ["app_publish"];
  if (pathname.includes("/builder")) return ["app_edit"];
  if (pathname.includes("/versions")) return ["app_edit"];
  if (pathname.includes("/monitoring")) return ["app_view_metrics"];
  return ["app_view_metrics"];
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const workspaceId = Array.isArray(params?.workspaceId)
    ? params.workspaceId[0]
    : (params?.workspaceId as string | undefined);
  const appId = Array.isArray(params?.appId) ? params.appId[0] : (params?.appId as string | undefined);

  const requiredPermissions = useMemo(
    () => resolveRequiredPermissions(pathname),
    [pathname]
  );

  if (!workspaceId || !appId) {
    return <>{children}</>;
  }

  return (
    <AppGuard
      workspaceId={workspaceId}
      appId={appId}
      requiredPermissions={requiredPermissions}
    >
      {children}
    </AppGuard>
  );
}
