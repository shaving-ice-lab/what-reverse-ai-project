"use client";

import dynamic from "next/dynamic";
import { Loader2, Workflow, Layers, Zap, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * LoadWorkflowEdit - Minimalist Style
 */

function EditorLoader() {
 return (
 <div className="h-full flex flex-col items-center justify-center bg-background-studio">
 <div className="flex flex-col items-center gap-6 p-8 rounded-lg border border-border bg-surface-100">
 <div className="relative w-16 h-16">
 <div className={cn(
 "w-16 h-16 rounded-lg flex items-center justify-center",
 "bg-surface-200"
 )}>
 <Workflow className="h-7 w-7 text-foreground" />
 </div>
 <div className="absolute -inset-1 rounded-lg border border-border animate-pulse opacity-50" />
 </div>

 <div className="text-center">
 <h3 className="text-base font-medium mb-1 text-foreground">LoadEdit</h3>
 <p className="text-sm text-foreground-light">currentlyatInitialWorkflowCanvas...</p>
 </div>

 <div className="flex items-center gap-2">
 {[
 { icon: Layers, label: "Node" },
 { icon: GitBranch, label: "Connect" },
 { icon: Zap, label: "Execute" },
 ].map((item) => (
 <div
 key={item.label}
 className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-surface-200"
 >
 <item.icon className="h-3.5 w-3.5" />
 <span className="text-xs text-foreground-muted">{item.label}</span>
 </div>
 ))}
 </div>

 <div className="flex items-center gap-2">
 <Loader2 className="h-4 w-4 animate-spin" />
 <span className="text-xs text-foreground-muted">
 timesLoadcancanneedneeds
 </span>
 </div>
 </div>
 </div>
 );
}

const WorkflowEditor = dynamic(
 () => import("./workflow-editor").then((mod) => ({ default: mod.WorkflowEditor })),
 {
 loading: () => <EditorLoader />,
 ssr: false,
 }
);

type SaveStatus = "saved" | "saving" | "unsaved" | "error";

interface LazyWorkflowEditorProps {
 workflowId?: string;
 workflowVersion?: number;
 initialData?: {
 name?: string;
 nodes?: unknown[];
 edges?: unknown[];
 };
 showEmptyState?: boolean;
 // AddStatus
 saveStatus?: SaveStatus;
 lastSavedAt?: Date | null;
 isOnline?: boolean;
 collaborators?: Array<{ id: string; name: string; avatar?: string }>;
 executionStatus?: "idle" | "running" | "completed" | "failed";
 onSave?: () => void;
 onExecute?: () => void;
}

export function LazyWorkflowEditor(props: LazyWorkflowEditorProps) {
 return <WorkflowEditor {...props} />;
}

export type { LazyWorkflowEditorProps, SaveStatus };
