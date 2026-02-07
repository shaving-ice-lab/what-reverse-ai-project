"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LazyWorkflowEditor } from "@/components/editor";
import { workflowApi } from "@/lib/api";
import {
 Loader2,
 AlertCircle,
 ArrowLeft,
 RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * WorkflowEditPage
 * Supabase Style: Minimal, Clear, Professional
 *
 * UsageLoadEditImplementCodeSplit, 
 * fewInitialLoadTime
 *
 * Features: 
 * - WorkflowDataLoad
 * - AutoSaveStatus
 * - CollaborationEditIndicator
 * - ExecuteStatusFeedback
 */

type SaveStatus = "saved" | "saving" | "unsaved" | "error";

interface EditorState {
 isLoading: boolean;
 error: string | null;
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
 collaborators: Array<{ id: string; name: string; avatar?: string; cursor?: { x: number; y: number } }>;
 executionStatus: "idle" | "running" | "completed" | "failed";
}

export default function EditorPage({
 params,
}: {
 params: Promise<{ id: string }>;
}) {
 const { id } = use(params);
 const router = useRouter();
 
 // DetermineisCreatestillisEdit
 const isNew = id === "new";

 // EditStatus
 const [state, setState] = useState<EditorState>({
 isLoading: !isNew,
 error: null,
 workflowData: isNew ? {
 name: "not yetNamingWorkflow",
 description: "",
 nodes: [],
 edges: [],
 variables: {},
 } : null,
 saveStatus: isNew ? "unsaved" : "saved",
 lastSavedAt: null,
 isOnline: true,
 collaborators: [],
 executionStatus: "idle",
 });

 // ListenOnlineStatus
 useEffect(() => {
 const handleOnline = () => setState(s => ({ ...s, isOnline: true }));
 const handleOffline = () => setState(s => ({ ...s, isOnline: false }));
 
 window.addEventListener("online", handleOnline);
 window.addEventListener("offline", handleOffline);
 
 return () => {
 window.removeEventListener("online", handleOnline);
 window.removeEventListener("offline", handleOffline);
 };
 }, []);

 // LoadWorkflowData
 useEffect(() => {
 if (isNew) return;

 const loadWorkflow = async () => {
 setState(s => ({ ...s, isLoading: true, error: null }));
 
 try {
 const workflow = await workflowApi.get(id);
 
 setState(s => ({
 ...s,
 isLoading: false,
 workflowData: {
 id: workflow.id,
 name: workflow.name,
 description: workflow.description || "",
 nodes: workflow.definition?.nodes || [],
 edges: workflow.definition?.edges || [],
 variables: workflow.variables || {},
 version: workflow.version,
 },
 lastSavedAt: new Date(workflow.updatedAt),
 }));
 } catch (err) {
 setState(s => ({
 ...s,
 isLoading: false,
 error: err instanceof Error ? err.message: "LoadWorkflowFailed",
 }));
 }
 };

 loadWorkflow();
 }, [id, isNew]);

 // SaveWorkflow
 const handleSave = useCallback(async () => {
 if (!state.workflowData) return;
 
 setState(s => ({ ...s, saveStatus: "saving" }));
 
 try {
 if (isNew) {
 // CreatenewWorkflow
 const created = await workflowApi.create({
 name: state.workflowData.name,
 description: state.workflowData.description,
 definition: {
 nodes: state.workflowData.nodes,
 edges: state.workflowData.edges,
 },
 variables: state.workflowData.variables,
 });
 
 // NavigatetoEditPage
 router.replace(`/editor/${created.id}`);
 } else {
 // UpdateExistingWorkflow
 await workflowApi.update(id, {
 name: state.workflowData.name,
 description: state.workflowData.description,
 definition: {
 nodes: state.workflowData.nodes,
 edges: state.workflowData.edges,
 },
 variables: state.workflowData.variables,
 });
 }
 
 setState(s => ({
 ...s,
 saveStatus: "saved",
 lastSavedAt: new Date(),
 }));
 } catch (err) {
 setState(s => ({
 ...s,
 saveStatus: "error",
 }));
 console.error("SaveFailed:", err);
 }
 }, [state.workflowData, isNew, id, router]);

 // ExecuteWorkflow
 const handleExecute = useCallback(async () => {
 if (isNew || !state.workflowData?.id) return;
 
 setState(s => ({ ...s, executionStatus: "running" }));
 
 try {
 await workflowApi.execute(id, {});
 setState(s => ({ ...s, executionStatus: "completed" }));
 
 // 3safterResetStatus
 setTimeout(() => {
 setState(s => ({ ...s, executionStatus: "idle" }));
 }, 3000);
 } catch (err) {
 setState(s => ({ ...s, executionStatus: "failed" }));
 console.error("ExecuteFailed:", err);
 }
 }, [isNew, state.workflowData?.id, id]);

 // RetryLoad
 const handleRetry = () => {
 if (!isNew) {
 setState(s => ({ ...s, isLoading: true, error: null }));
 // Triggerre-newLoad
 window.location.reload();
 }
 };

 // LoadStatus - Supabase Style
 if (state.isLoading) {
 return (
 <div className="h-full flex items-center justify-center bg-background-studio">
 <div className="page-panel px-6 py-5 flex items-center gap-4">
 <div className="h-10 w-10 rounded-md bg-surface-200 flex items-center justify-center">
 <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
 </div>
 <div>
 <h3 className="text-sm font-medium text-foreground">LoadingWorkflow</h3>
 <p className="text-xs text-foreground-muted mt-1">PrepareEditResource...</p>
 </div>
 </div>
 </div>
 );
 }

 // ErrorStatus - Supabase Style
 if (state.error) {
 return (
 <div className="h-full flex items-center justify-center bg-background-studio">
 <div className="page-panel px-6 py-5 flex flex-col items-center gap-4 max-w-md">
 <div className="h-10 w-10 rounded-md bg-surface-200 flex items-center justify-center">
 <AlertCircle className="h-5 w-5 text-foreground-light" />
 </div>
 <div className="text-center">
 <h3 className="text-sm font-medium text-foreground">LoadFailed</h3>
 <p className="text-xs text-foreground-muted mt-1">{state.error}</p>
 </div>
 <div className="flex items-center gap-2">
 <Button variant="outline" size="sm" onClick={() => router.back()}>
 <ArrowLeft className="h-4 w-4 mr-1.5" />
 Back
 </Button>
 <Button size="sm" onClick={handleRetry}>
 <RefreshCw className="h-4 w-4 mr-1.5" />
 Retry
 </Button>
 </div>
 </div>
 </div>
 );
 }

 // PrepareInitialData
 const initialData = state.workflowData ? {
 name: state.workflowData.name,
 nodes: state.workflowData.nodes,
 edges: state.workflowData.edges,
 } : {
 name: "not yetNamingWorkflow",
 nodes: [],
 edges: [],
 };

 return (
 <div className="h-full bg-background-studio">
 <LazyWorkflowEditor
 workflowId={id}
 initialData={initialData}
 workflowVersion={state.workflowData?.version}
 saveStatus={state.saveStatus}
 lastSavedAt={state.lastSavedAt}
 isOnline={state.isOnline}
 collaborators={state.collaborators}
 executionStatus={state.executionStatus}
 onSave={handleSave}
 onExecute={handleExecute}
 />
 </div>
 );
}
