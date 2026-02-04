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
  success: "成功",
  running: "运行中",
  pending: "待执行",
  failed: "失败",
  cancelled: "已取消",
  timeout: "超时",
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
  schedule: "定时任务",
  event: "事件触发",
  api: "API 调用",
  manual: "手动执行",
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
        <div className="py-20 text-center text-[12px] text-foreground-muted">正在加载...</div>
      </PageContainer>
    );
  }

  if (!execution) {
    return (
      <PageContainer>
        <div className="py-20 text-center text-[12px] text-foreground-muted">
          执行记录不存在或无权访问
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="执行详情"
        description={`执行 ID: ${execution.id}`}
        icon={<Play className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/executions">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                返回列表
              </Link>
            </Button>
            {execution.workflow && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/workflows/${execution.workflow.id}`}>
                  <GitBranch className="w-3.5 h-3.5 mr-1" />
                  查看工作流
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <div className="page-grid grid-cols-1 lg:grid-cols-2">
        <SettingsSection title="执行信息" description="基本状态与耗时" compact>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md border border-border bg-surface-75 px-3 py-2">
              <div className="text-[12px] text-foreground-muted">状态</div>
              <Badge variant={STATUS_BADGE_MAP[execution.status]} size="sm">
                {STATUS_LABELS[execution.status]}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-surface-75 px-3 py-2">
              <div className="text-[12px] text-foreground-muted">触发方式</div>
              <Badge variant="outline" size="sm">
                {TRIGGER_LABELS[execution.trigger_type] || execution.trigger_type}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-surface-75 px-3 py-2">
              <div className="text-[12px] text-foreground-muted">版本</div>
              <div className="text-[12px] text-foreground">v{execution.version}</div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-surface-75 px-3 py-2">
              <div className="text-[12px] text-foreground-muted">耗时</div>
              <div className="text-[12px] text-foreground">
                {execution.duration_ms ? `${execution.duration_ms}ms` : "-"}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-surface-75 px-3 py-2">
              <div className="text-[12px] text-foreground-muted">重试次数</div>
              <div className="text-[12px] text-foreground">{execution.retries || 0}</div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-surface-75 px-3 py-2">
              <div className="text-[12px] text-foreground-muted">开始时间</div>
              <div className="text-[12px] text-foreground">
                {execution.started_at ? new Date(execution.started_at).toLocaleString() : "-"}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-surface-75 px-3 py-2">
              <div className="text-[12px] text-foreground-muted">结束时间</div>
              <div className="text-[12px] text-foreground">
                {execution.completed_at ? new Date(execution.completed_at).toLocaleString() : "-"}
              </div>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title="关联信息" description="工作流与 Workspace" compact>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md border border-border bg-surface-75 px-3 py-2">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-foreground-muted" />
                <div className="text-[12px] text-foreground-muted">工作流</div>
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
                <span className="text-[12px] font-medium">错误信息</span>
              </div>
              <div className="text-[12px] text-foreground-light">{execution.error_message}</div>
              {execution.error_code && (
                <div className="mt-1 text-[11px] text-foreground-muted">
                  错误码: <code>{execution.error_code}</code>
                </div>
              )}
            </div>
          )}

          {execution.trigger_data && Object.keys(execution.trigger_data).length > 0 && (
            <div className="mt-4">
              <div className="text-[12px] font-medium text-foreground mb-2">触发数据</div>
              <pre className="p-3 rounded-lg bg-surface-100 border border-border text-[11px] text-foreground-light overflow-auto max-h-[200px]">
                {JSON.stringify(execution.trigger_data, null, 2)}
              </pre>
            </div>
          )}
        </SettingsSection>
      </div>

      <SettingsSection
        title="节点执行轨迹"
        description="各节点执行状态与耗时"
      >
        {nodes.length === 0 ? (
          <div className="py-10 text-center text-[12px] text-foreground-muted">
            暂无节点执行记录
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
                      节点 ID: {node.node_id}
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
