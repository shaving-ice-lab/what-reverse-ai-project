"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Play,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  GitBranch,
  Building2,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  SettingsSection,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { executionRows, executionNodeRows } from "@/lib/mock-data";
import { adminApi } from "@/lib/api/admin";
import { isLocalModeEnabled } from "@/lib/env";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Execution, ExecutionNode, ExecutionStatus } from "@/types/admin";

const STATUS_BADGE_MAP: Record<ExecutionStatus, "success" | "warning" | "info" | "error"> = {
  success: "success",
  running: "info",
  pending: "warning",
  failed: "error",
  cancelled: "warning",
  timeout: "error",
};

const STATUS_LABELS: Record<ExecutionStatus, string> = {
  success: "Success",
  running: "Running",
  pending: "Pending",
  failed: "Failed",
  cancelled: "Cancelled",
  timeout: "Timeout",
};

const STATUS_ICONS: Record<ExecutionStatus, React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4 text-success" />,
  running: <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />,
  pending: <Clock className="w-4 h-4 text-warning" />,
  failed: <XCircle className="w-4 h-4 text-error-default" />,
  cancelled: <XCircle className="w-4 h-4 text-warning" />,
  timeout: <AlertTriangle className="w-4 h-4 text-error-default" />,
};

const TRIGGER_LABELS: Record<string, string> = {
  webhook: "Webhook",
  schedule: "Scheduled",
  event: "Event Trigger",
  api: "API Call",
  manual: "Manual",
};

export default function ExecutionDetailPage() {
  const params = useParams();
  const executionId = params.id as string;
  const localMode = isLocalModeEnabled();

  const executionQuery = useQuery({
    queryKey: ["admin", "execution", executionId],
    enabled: !localMode,
    queryFn: () => adminApi.executions.get(executionId),
  });

  const localExecution = useMemo(() => {
    return executionRows.find((ex) => ex.id === executionId) as unknown as Execution | undefined;
  }, [executionId]);

  const localNodes = useMemo(() => {
    return executionNodeRows.filter((node) => node.execution_id === executionId) as unknown as ExecutionNode[];
  }, [executionId]);

  const execution = localMode ? localExecution : executionQuery.data?.execution;
  const nodes = localMode ? localNodes : executionQuery.data?.nodes || [];

  if (executionQuery.isPending && !localMode) {
    return (
      <PageContainer>
        <div className="py-20 text-center text-[12px] text-foreground-muted">Loading...</div>
      </PageContainer>
    );
  }

  if (!execution) {
    return (
      <PageContainer>
        <div className="py-20 text-center text-[12px] text-foreground-muted">
          Execution record not found or access denied
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Execution Details"
        description={`Execution ID: ${execution.id}`}
        icon={<Play className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/executions">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back to List
              </Link>
            </Button>
            {execution.workflow && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/workflows/${execution.workflow.id}`}>
                  <GitBranch className="w-3.5 h-3.5 mr-1" />
                  View Workflow
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <div className="page-grid grid-cols-1 lg:grid-cols-2">
        <SettingsSection title="Execution Info" description="Basic status and duration" compact>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md border border-border bg-surface-75 px-3 py-2">
              <div className="text-[12px] text-foreground-muted">Status</div>
              <Badge variant={STATUS_BADGE_MAP[execution.status]} size="sm">
                {STATUS_LABELS[execution.status]}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-surface-75 px-3 py-2">
              <div className="text-[12px] text-foreground-muted">Trigger</div>
              <Badge variant="outline" size="sm">
                {TRIGGER_LABELS[execution.trigger_type] || execution.trigger_type}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-surface-75 px-3 py-2">
              <div className="text-[12px] text-foreground-muted">Version</div>
              <div className="text-[12px] text-foreground">v{execution.version}</div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-surface-75 px-3 py-2">
              <div className="text-[12px] text-foreground-muted">Duration</div>
              <div className="text-[12px] text-foreground">
                {execution.duration_ms ? `${execution.duration_ms}ms` : "-"}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-surface-75 px-3 py-2">
              <div className="text-[12px] text-foreground-muted">Retries</div>
              <div className="text-[12px] text-foreground">{execution.retries || 0}</div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-surface-75 px-3 py-2">
              <div className="text-[12px] text-foreground-muted">Start Time</div>
              <div className="text-[12px] text-foreground">
                {execution.started_at ? new Date(execution.started_at).toLocaleString() : "-"}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-surface-75 px-3 py-2">
              <div className="text-[12px] text-foreground-muted">End Time</div>
              <div className="text-[12px] text-foreground">
                {execution.completed_at ? new Date(execution.completed_at).toLocaleString() : "-"}
              </div>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title="Related Info" description="Workflow and workspace" compact>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md border border-border bg-surface-75 px-3 py-2">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-foreground-muted" />
                <div className="text-[12px] text-foreground-muted">Workflow</div>
              </div>
              {execution.workflow ? (
                <Link
                  href={`/workflows/${execution.workflow.id}`}
                  className="text-[12px] text-brand-500 hover:underline"
                >
                  {execution.workflow.name}
                </Link>
              ) : (
                <div className="text-[12px] text-foreground-muted">-</div>
              )}
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-surface-75 px-3 py-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-foreground-muted" />
                <div className="text-[12px] text-foreground-muted">Workspace</div>
              </div>
              {execution.workspace ? (
                <Link
                  href={`/workspaces/${execution.workspace.id}`}
                  className="text-[12px] text-brand-500 hover:underline"
                >
                  {execution.workspace.name}
                </Link>
              ) : (
                <div className="text-[12px] text-foreground-muted">-</div>
              )}
            </div>
          </div>

          {execution.error_message && (
            <div className="mt-4 p-3 rounded-lg bg-error-default/10 border border-error-default/20">
              <div className="flex items-center gap-2 text-error-default mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[12px] font-medium">Error Message</span>
              </div>
              <div className="text-[12px] text-foreground-light">{execution.error_message}</div>
              {execution.error_code && (
                <div className="mt-1 text-[11px] text-foreground-muted">
                  Error Code: <code>{execution.error_code}</code>
                </div>
              )}
            </div>
          )}

          {execution.trigger_data && Object.keys(execution.trigger_data).length > 0 && (
            <div className="mt-4">
              <div className="text-[12px] font-medium text-foreground mb-2">Trigger Data</div>
              <pre className="p-3 rounded-lg bg-surface-100 border border-border text-[11px] text-foreground-light overflow-auto max-h-[200px]">
                {JSON.stringify(execution.trigger_data, null, 2)}
              </pre>
            </div>
          )}
        </SettingsSection>
      </div>

      <SettingsSection
        title="Node Execution Trace"
        description="Execution status and duration for each node"
      >
        {nodes.length === 0 ? (
          <div className="py-10 text-center text-[12px] text-foreground-muted">
            No node execution records
          </div>
        ) : (
          <div className="space-y-2">
            {nodes
              .sort((a, b) => a.sequence - b.sequence)
              .map((node, index) => (
                <div
                  key={node.id}
                  className={cn(
                    "flex items-start gap-4 p-3 rounded-lg border",
                    node.status === "failed"
                      ? "border-error-default/30 bg-error-default/5"
                      : "border-border bg-surface-75"
                  )}
                >
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border border-border bg-surface-100">
                      {STATUS_ICONS[node.status]}
                    </div>
                    {index < nodes.length - 1 && (
                      <div className="w-px h-8 bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium text-foreground">
                          {node.node_name}
                        </span>
                        <Badge variant="outline" size="sm">
                          {node.node_type}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-foreground-muted">
                        {node.duration_ms ? `${node.duration_ms}ms` : "-"}
                      </div>
                    </div>
                    <div className="text-[11px] text-foreground-muted">
                      Node ID: {node.node_id}
                    </div>
                    {node.error_message && (
                      <div className="mt-2 p-2 rounded bg-error-default/10 text-[11px] text-error-default">
                        {node.error_message}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </SettingsSection>
    </PageContainer>
  );
}
