"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LazyWorkflowEditor } from "@/components/editor";
import { appApi, workflowApi, type App } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";

type SaveStatus = "saved" | "saving" | "unsaved" | "error";

interface AppEditorState {
 isLoading: boolean;
 error: string | null;
 app: App | null;
 workflowId: string | null;
 workflowData: {
 id?: string;
 name: string;
 description?: string;
 nodes: unknown[];
 edges: unknown[];
 variables?: Record<string, unknown>;
 version?: number;
 } | null;
 saveStatus: SaveStatus;
 lastSavedAt: Date | null;
 isOnline: boolean;
 executionStatus: "idle" | "running" | "completed" | "failed";
}

export default function AppEditorPage({
 params,
}: {
 params: Promise<{ id: string }>;
}) {
 const { id } = use(params);
 const router = useRouter();
 const [state, setState] = useState<AppEditorState>({
 isLoading: true,
 error: null,
 app: null,
 workflowId: null,
 workflowData: null,
 saveStatus: "saved",
 lastSavedAt: null,
 isOnline: true,
 executionStatus: "idle",
 });

 useEffect(() => {
 const handleOnline = () => setState((s) => ({ ...s, isOnline: true }));
 const handleOffline = () => setState((s) => ({ ...s, isOnline: false }));
 window.addEventListener("online", handleOnline);
 window.addEventListener("offline", handleOffline);
 return () => {
 window.removeEventListener("online", handleOnline);
 window.removeEventListener("offline", handleOffline);
 };
 }, []);

 useEffect(() => {
 let mounted = true;
 const load = async () => {
 setState((s) => ({ ...s, isLoading: true, error: null }));
 try {
 const app = await appApi.get(id);
 const workflowId = app.current_version?.workflow_id || null;

 if (!workflowId) {
 if (!mounted) return;
 setState((s) => ({
 ...s,
 app,
 workflowId: null,
 workflowData: null,
 isLoading: false,
 error: "Current app is not bound; edit workflow version first.",
 }));
 return;
 }

 const workflow = await workflowApi.get(workflowId);

 if (!mounted) return;
 setState((s) => ({
 ...s,
 app,
 workflowId,
 isLoading: false,
 workflowData: {
 id: workflow.data.id,
 name: workflow.data.name,
 description: workflow.data.description || "",
 nodes: workflow.data.definition?.nodes || [],
 edges: workflow.data.definition?.edges || [],
 variables: workflow.data.variables || {},
 version: workflow.data.version,
 },
 lastSavedAt: workflow.data.updatedAt ? new Date(workflow.data.updatedAt) : null,
 }));
 } catch (err) {
 if (!mounted) return;
 setState((s) => ({
 ...s,
 isLoading: false,
    error: err instanceof Error ? err.message: "Failed to Load App",
 }));
 }
 };

 load();
 return () => {
 mounted = false;
 };
 }, [id]);

 const handleSave = useCallback(async () => {
 if (!state.workflowData || !state.workflowId) return;
 setState((s) => ({ ...s, saveStatus: "saving" }));
 try {
 await workflowApi.update(state.workflowId, {
 name: state.workflowData.name,
 description: state.workflowData.description,
 definition: {
 nodes: state.workflowData.nodes,
 edges: state.workflowData.edges,
 },
 variables: state.workflowData.variables,
 });
 setState((s) => ({
 ...s,
 saveStatus: "saved",
 lastSavedAt: new Date(),
 }));
 } catch (err) {
 setState((s) => ({ ...s, saveStatus: "error" }));
 console.error("Save failed:", err);
 }
 }, [state.workflowData, state.workflowId]);

 const handleExecute = useCallback(async () => {
 if (!state.workflowId) return;
 setState((s) => ({ ...s, executionStatus: "running" }));
 try {
 await workflowApi.execute(state.workflowId, {});
 setState((s) => ({ ...s, executionStatus: "completed" }));
 setTimeout(() => {
 setState((s) => ({ ...s, executionStatus: "idle" }));
 }, 3000);
 } catch (err) {
 setState((s) => ({ ...s, executionStatus: "failed" }));
 console.error("Execution failed:", err);
 }
 }, [state.workflowId]);

 const statusLabel = state.app?.status || "unknown";

 return (
 <div className="h-full flex flex-col bg-background-studio">
 <div className="border-b border-border bg-background px-6 py-4">
 <div className="flex items-center justify-between gap-6">
 <div className="flex items-start gap-4">
 <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/apps")}>
 <ArrowLeft className="h-4 w-4" />
 </Button>
 <div>
 <div className="text-xs text-foreground-muted">App Editor</div>
 <div className="flex items-center gap-2">
 <h1 className="text-lg font-semibold text-foreground">
 {state.app?.name || "Loading..."}
 </h1>
 <Badge variant="secondary" size="xs">
 {statusLabel}
 </Badge>
 {state.app?.workspace?.name && (
 <Badge variant="outline" size="xs">
 {state.app.workspace.name}
 </Badge>
 )}
 </div>
 <div className="text-xs text-foreground-muted">
 {state.app?.description || "Bind current version workflow and enter edit mode"}
 </div>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Button variant="secondary" size="sm" asChild>
 <Link href="/dashboard/apps">Back Workbench</Link>
 </Button>
 </div>
 </div>
 </div>

 <div className="flex-1 min-h-0">
 {state.isLoading ? (
 <div className="h-full flex items-center justify-center text-sm text-foreground-muted">
 <Loader2 className="h-4 w-4 animate-spin mr-2" />
 Loading App Edit...
 </div>
 ) : state.error ? (
 <div className="h-full flex flex-col items-center justify-center text-center px-6">
 <div className="w-10 h-10 rounded-full bg-surface-200 flex items-center justify-center mb-3">
 <AlertCircle className="h-5 w-5 text-foreground-light" />
 </div>
 <div className="text-sm font-medium text-foreground">No open editor</div>
 <div className="text-xs text-foreground-muted mt-1">{state.error}</div>
 </div>
 ) : state.workflowData ? (
 <LazyWorkflowEditor
 workflowId={state.workflowId || undefined}
 workflowVersion={state.workflowData.version}
 initialData={{
 name: state.workflowData.name,
 nodes: state.workflowData.nodes,
 edges: state.workflowData.edges,
 }}
 saveStatus={state.saveStatus}
 lastSavedAt={state.lastSavedAt}
 isOnline={state.isOnline}
 executionStatus={state.executionStatus}
 onSave={handleSave}
 onExecute={handleExecute}
 />
 ) : (
 <div className="h-full flex items-center justify-center text-sm text-foreground-muted">
 No workflow version to edit
 </div>
 )}
 </div>
 </div>
 );
}
