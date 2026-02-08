"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AppGuard } from "@/components/permissions/app-guard";
import { WorkspaceGuard } from "@/components/permissions/workspace-guard";
import { ExceptionState } from "@/components/ui/empty-state";
import { ApiError } from "@/lib/api";
import { appApi, type App } from "@/lib/api/workspace";
import type { WorkspacePermission } from "@/lib/permissions";

type GuardStatus = "loading" | "ready" | "not_found" | "forbidden" | "error";

const LAST_WORKSPACE_STORAGE_KEY = "last_workspace_id";

const resolveRequiredPermissions = (pathname: string): WorkspacePermission[] => {
 if (pathname.includes("/publish")) return ["workspace_publish"];
 if (pathname.includes("/domains")) return ["workspace_publish"];
 if (pathname.includes("/builder")) return ["workspace_edit"];
 if (pathname.includes("/versions")) return ["workspace_edit"];
 if (pathname.includes("/monitoring")) return ["workspace_view_metrics"];
 return ["workspace_view_metrics"];
};

// Workspace = App: app id is workspace ID
const resolveAppWorkspaceId = (app?: App | null) =>
 app?.id || null;

export default function AppLayout({ children }: { children: React.ReactNode }) {
 const params = useParams();
 const pathname = usePathname();
 const appId = Array.isArray(params?.appId) ? params.appId[0] : (params?.appId as string | undefined);
 const [workspaceId, setWorkspaceId] = useState<string | null>(null);
 const [status, setStatus] = useState<GuardStatus>("loading");

 const requiredPermissions = useMemo(
 () => resolveRequiredPermissions(pathname),
 [pathname]
 );

 useEffect(() => {
 if (!appId) {
 setStatus("not_found");
 setWorkspaceId(null);
 return;
 }

 let cancelled = false;
 const loadApp = async () => {
 setStatus("loading");
 try {
 const workspace = await appApi.get(appId);
 if (cancelled) return;
 const nextWorkspaceId = resolveAppWorkspaceId(workspace);
 if (!nextWorkspaceId) {
 setStatus("error");
 setWorkspaceId(null);
 return;
 }
 setWorkspaceId(nextWorkspaceId);
 setStatus("ready");
 } catch (error) {
 if (cancelled) return;
 if (error instanceof ApiError) {
 if (error.status === 404) {
 setStatus("not_found");
 return;
 }
 if (error.status === 403) {
 setStatus("forbidden");
 return;
 }
 }
 setStatus("error");
 }
 };

 loadApp();
 return () => {
 cancelled = true;
 };
 }, [appId]);

 useEffect(() => {
 if (!appId || typeof window === "undefined") return;
 localStorage.setItem(LAST_WORKSPACE_STORAGE_KEY, appId);
 }, [appId]);

 if (status === "loading") {
 return (
 <div className="min-h-[60vh] flex items-center justify-center">
 <div className="flex items-center gap-2 text-sm text-foreground-muted">
 <Loader2 className="h-4 w-4 animate-spin" />
 Loading app...
 </div>
 </div>
 );
 }

 if (status !== "ready" || !workspaceId || !appId) {
 const message =
 status === "not_found"
 ? "App does not exist"
 : status === "forbidden"
 ? "No access to app"
: "Failed to load app info";
 return (
 <ExceptionState
 variant={status === "not_found" ? "not_found" : status === "forbidden" ? "permission" : "error"}
 title={message}
 description="Please confirm the app exists and you have access."
 action={{ label: "Back to app list", href: "/dashboard/apps" }}
 />
 );
 }

 return (
 <WorkspaceGuard workspaceId={workspaceId}>
 <AppGuard appId={appId} requiredPermissions={requiredPermissions}>
 {children}
 </AppGuard>
 </WorkspaceGuard>
 );
}
