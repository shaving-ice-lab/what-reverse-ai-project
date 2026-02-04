"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  GitBranch,
  History,
  Pause,
  Play,
  RefreshCw,
  Timer,
  TrendingUp,
  XCircle,
} from "lucide-react";
import {
  FormRow,
  PageContainer,
  PageHeader,
  SettingsSection,
  StatsCard,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi } from "@/lib/api/admin";
import { isLocalModeEnabled } from "@/lib/env";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";
import { workflowRows, executionRows } from "@/lib/mock-data";
import type { Execution, Workflow, WorkflowVersion } from "@/types/admin";

const STATUS_LABELS: Record<string, string> = {
  active: "活跃",
  draft: "草稿",
  archived: "已归档",
  suspended: "已暂停",
  published: "已发布",
};

const STATUS_VARIANTS: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  active: "success",
  draft: "warning",
  archived: "secondary",
  suspended: "destructive",
  published: "success",
};

const EXECUTION_STATUS_LABELS: Record<string, string> = {
  pending: "排队中",
  running: "执行中",
  completed: "已完成",
  failed: "失败",
  cancelled: "已取消",
  timeout: "超时",
};

const EXECUTION_STATUS_VARIANTS: Record<string, "success" | "warning" | "secondary" | "destructive" | "info"> = {
  pending: "warning",
  running: "info",
  completed: "success",
  failed: "destructive",
  cancelled: "secondary",
  timeout: "destructive",
};

function getParamId(params: ReturnType<typeof useParams>) {
  const raw = (params as Record<string, string | string[] | undefined>)?.id;
  if (!raw) return "";
  return Array.isArray(raw) ? raw[0] : raw;
}

// Mock data for timing analysis
const mockTimingAnalysis = {
  workflow_id: "wf-1",
  total_executions: 1250,
  avg_duration_ms: 3450,
  p50_duration_ms: 2800,
  p95_duration_ms: 8500,
  p99_duration_ms: 15000,
  min_duration_ms: 450,
  max_duration_ms: 45000,
  node_timings: [
    { node_id: "node-1", node_type: "http_request", avg_duration_ms: 1200, execution_count: 1250 },
    { node_id: "node-2", node_type: "llm_call", avg_duration_ms: 1800, execution_count: 1248 },
    { node_id: "node-3", node_type: "json_transform", avg_duration_ms: 150, execution_count: 1250 },
    { node_id: "node-4", node_type: "condition", avg_duration_ms: 50, execution_count: 1250 },
  ],
};

// Mock data for failure distribution
const mockFailureDistribution = {
  workflow_id: "wf-1",
  total_failures: 45,
  failure_rate: 3.6,
  distribution: [
    { reason: "HTTP 超时", count: 18, percentage: 40, sample_execution_id: "exec-f1" },
    { reason: "LLM 响应格式错误", count: 12, percentage: 26.7, sample_execution_id: "exec-f2" },
    { reason: "输入验证失败", count: 8, percentage: 17.8, sample_execution_id: "exec-f3" },
    { reason: "API 限流", count: 5, percentage: 11.1, sample_execution_id: "exec-f4" },
    { reason: "内部错误", count: 2, percentage: 4.4, sample_execution_id: "exec-f5" },
  ],
  recent_failures: [
    { id: "exec-rf1", error_message: "HTTP request timeout after 30s", node_id: "node-1", occurred_at: "2026-02-03T07:45:00Z" },
    { id: "exec-rf2", error_message: "Invalid JSON response from LLM", node_id: "node-2", occurred_at: "2026-02-03T06:30:00Z" },
    { id: "exec-rf3", error_message: "Required field 'email' is missing", node_id: "node-1", occurred_at: "2026-02-03T05:15:00Z" },
  ],
};

// Mock execution queue
const mockExecutionQueue = [
  { id: "q-1", workflow_id: "wf-1", workflow_name: "Customer Onboarding", status: "running", queued_at: "2026-02-03T08:00:00Z", started_at: "2026-02-03T08:00:05Z", priority: 10 },
  { id: "q-2", workflow_id: "wf-1", workflow_name: "Customer Onboarding", status: "pending", queued_at: "2026-02-03T08:00:10Z", started_at: null, priority: 5 },
  { id: "q-3", workflow_id: "wf-1", workflow_name: "Customer Onboarding", status: "pending", queued_at: "2026-02-03T08:00:15Z", started_at: null, priority: 5 },
];

export default function WorkflowDetailPage() {
  const localMode = isLocalModeEnabled();
  const params = useParams();
  const workflowId = getParamId(params);
  const queryClient = useQueryClient();

  // Dialog states
  const [replayOpen, setReplayOpen] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState<string | null>(null);
  const [adjustPriorityOpen, setAdjustPriorityOpen] = useState<string | null>(null);

  // Form states
  const [cancelReason, setCancelReason] = useState("");
  const [newPriority, setNewPriority] = useState(5);

  // View states
  const [timingDays, setTimingDays] = useState(7);
  const [failureDays, setFailureDays] = useState(7);

  const workflowQuery = useQuery({
    queryKey: ["admin", "workflows", "detail", workflowId],
    enabled: Boolean(workflowId) && !localMode,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const data = await adminApi.workflows.get(workflowId);
      return data;
    },
  });

  const localWorkflow = useMemo<Workflow | null>(() => {
    if (!localMode) return null;
    const rows = workflowRows as unknown as Workflow[];
    return rows.find((row) => row.id === workflowId) || null;
  }, [localMode, workflowId]);

  const workflowDetail = localMode ? null : workflowQuery.data || null;
  const workflow = localMode ? localWorkflow : workflowDetail?.workflow || null;

  const versions = useMemo(
    () => (localMode ? [] : workflowDetail?.versions || []),
    [workflowDetail?.versions, localMode]
  );

  const recentExecutions = useMemo(() => {
    if (!localMode) return workflowDetail?.recent_executions || [];
    return (executionRows as unknown as Execution[]).filter((item) => item.workflow_id === workflowId).slice(0, 10);
  }, [localMode, workflowDetail?.recent_executions, workflowId]);

  const timingAnalysisQuery = useQuery({
    queryKey: ["admin", "workflows", "timing-analysis", workflowId, timingDays],
    enabled: Boolean(workflowId) && !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.workflows.getExecutionTimingAnalysis(workflowId, { days: timingDays }),
  });

  const failureDistributionQuery = useQuery({
    queryKey: ["admin", "workflows", "failure-distribution", workflowId, failureDays],
    enabled: Boolean(workflowId) && !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.workflows.getFailureDistribution(workflowId, { days: failureDays }),
  });

  const queueQuery = useQuery({
    queryKey: ["admin", "workflows", "queue", workflowId],
    enabled: Boolean(workflowId) && !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.workflows.getExecutionQueue({}),
  });

  const timingAnalysis = localMode ? mockTimingAnalysis : timingAnalysisQuery.data;
  const failureDistribution = localMode ? mockFailureDistribution : failureDistributionQuery.data;
  const queueItems = useMemo(() => {
    if (localMode) return mockExecutionQueue;
    const items = queueQuery.data?.items || [];
    return items.filter((item) => item.workflow_id === workflowId);
  }, [localMode, queueQuery.data?.items, workflowId]);

  // Mutations
  const replayMutation = useMutation({
    mutationFn: (executionId: string) => adminApi.executions.replay(executionId),
    onSuccess: (data) => {
      toast.success(`回放执行已创建: ${data.new_execution_id}`);
      setReplayOpen(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "workflows"] });
    },
    onError: () => toast.error("回放失败"),
  });

  const cancelMutation = useMutation({
    mutationFn: (executionId: string) => adminApi.executions.cancel(executionId, { reason: cancelReason }),
    onSuccess: () => {
      toast.success("执行已取消");
      setCancelOpen(null);
      setCancelReason("");
      queryClient.invalidateQueries({ queryKey: ["admin", "workflows"] });
    },
    onError: () => toast.error("取消失败"),
  });

  const adjustPriorityMutation = useMutation({
    mutationFn: (executionId: string) => adminApi.executions.adjustPriority(executionId, { priority: newPriority }),
    onSuccess: () => {
      toast.success("优先级已调整");
      setAdjustPriorityOpen(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "workflows"] });
    },
    onError: () => toast.error("调整失败"),
  });

  if (!workflowId) {
    return (
      <PageContainer>
        <PageHeader title="工作流详情" description="无效的工作流 ID" icon={<GitBranch className="w-4 h-4" />} />
      </PageContainer>
    );
  }

  const statusLabel = workflow?.status ? STATUS_LABELS[workflow.status] || workflow.status : "-";
  const statusVariant = workflow?.status ? STATUS_VARIANTS[workflow.status] || "warning" : "warning";

  return (
    <PageContainer>
      <PageHeader
        title={workflow?.name || "工作流详情"}
        description={
          workflow
            ? `${workflow.id}`
            : localMode
            ? "未找到对应的本地工作流数据"
            : "正在加载工作流数据..."
        }
        icon={<GitBranch className="w-4 h-4" />}
        backHref="/workflows"
        backLabel="返回工作流列表"
        badge={
          workflow ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant} size="sm">
                {statusLabel}
              </Badge>
              <Badge variant="outline" size="sm">
                v{workflow.version || 1}
              </Badge>
            </div>
          ) : null
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              暂停工作流
            </Button>
            <Button size="sm" disabled>
              运行工作流
            </Button>
          </div>
        }
      />

      {/* Dialogs */}
      <ConfirmDialog
        open={Boolean(replayOpen)}
        onOpenChange={(open) => !open && setReplayOpen(null)}
        title="回放执行"
        description="使用相同输入重新执行该工作流。"
        confirmLabel="开始回放"
        onConfirm={() => replayOpen && replayMutation.mutate(replayOpen)}
        isLoading={replayMutation.isPending}
      />

      <ConfirmDialog
        open={Boolean(cancelOpen)}
        onOpenChange={(open) => !open && setCancelOpen(null)}
        title="取消执行"
        description="确认要取消此执行吗？"
        confirmLabel="确认取消"
        onConfirm={() => cancelOpen && cancelMutation.mutate(cancelOpen)}
        isLoading={cancelMutation.isPending}
        variant="warning"
      >
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-[12px] text-foreground">取消原因</label>
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="请输入取消原因..."
            />
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(adjustPriorityOpen)}
        onOpenChange={(open) => !open && setAdjustPriorityOpen(null)}
        title="调整优先级"
        description="调整执行在队列中的优先级。"
        confirmLabel="保存"
        onConfirm={() => adjustPriorityOpen && adjustPriorityMutation.mutate(adjustPriorityOpen)}
        isLoading={adjustPriorityMutation.isPending}
      >
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-[12px] text-foreground">优先级（1-10，数字越大优先级越高）</label>
            <Input
              type="number"
              min={1}
              max={10}
              value={newPriority}
              onChange={(e) => setNewPriority(parseInt(e.target.value) || 5)}
            />
          </div>
        </div>
      </ConfirmDialog>

      <div className="page-grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        <SettingsSection title="基础信息" description="工作流配置与元数据。">
          {!workflow ? (
            <div className="text-[12px] text-foreground-muted">
              {workflowQuery.isPending && !localMode ? "正在加载..." : "暂无工作流数据"}
            </div>
          ) : (
            <div className="space-y-1">
              <FormRow label="工作流 ID" description="系统唯一标识">
                <div className="text-[12px] text-foreground">{workflow.id}</div>
              </FormRow>
              <FormRow label="所属 Workspace" description="工作流归属工作空间">
                <Link
                  href={`/workspaces/${workflow.workspace_id}`}
                  className="text-[12px] text-foreground hover:text-brand-500 transition-colors"
                >
                  {workflow.workspace?.name || workflow.workspace_id}
                </Link>
              </FormRow>
              <FormRow label="状态" description="当前运行状态">
                <Badge variant={statusVariant} size="sm">
                  {statusLabel}
                </Badge>
              </FormRow>
              <FormRow label="版本" description="当前版本号">
                <div className="text-[12px] text-foreground-light">v{workflow.version || 1}</div>
              </FormRow>
              <FormRow label="节点数" description="工作流节点数量">
                <div className="text-[12px] text-foreground-light">{workflow.nodes_count || 0}</div>
              </FormRow>
              <FormRow label="创建时间" description="工作流创建时间">
                <div className="text-[12px] text-foreground-light">
                  {workflow.created_at ? formatDate(workflow.created_at) : "-"}
                </div>
              </FormRow>
            </div>
          )}
        </SettingsSection>

        {/* Execution Timing Analysis */}
        <SettingsSection
          title="执行耗时分析"
          description={`最近 ${timingDays} 天的执行性能统计。`}
          icon={<Timer className="w-4 h-4" />}
          footer={
            <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
              <span>时间范围</span>
              <select
                value={timingDays}
                onChange={(e) => setTimingDays(parseInt(e.target.value))}
                className="h-6 rounded border border-border bg-surface-100 px-2 text-[11px]"
              >
                <option value={7}>7 天</option>
                <option value={14}>14 天</option>
                <option value={30}>30 天</option>
              </select>
            </div>
          }
        >
          {timingAnalysisQuery.isPending && !localMode ? (
            <div className="text-[12px] text-foreground-muted">正在加载...</div>
          ) : timingAnalysisQuery.error && !localMode ? (
            <div className="text-[12px] text-foreground-muted">加载失败，请检查 API 或权限配置</div>
          ) : timingAnalysis ? (
            <div className="space-y-4">
              <div className="page-grid grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  title="总执行数"
                  value={timingAnalysis.total_executions.toLocaleString()}
                  subtitle="次执行"
                />
                <StatsCard
                  title="平均耗时"
                  value={`${(timingAnalysis.avg_duration_ms / 1000).toFixed(2)}s`}
                  subtitle="秒/次"
                />
                <StatsCard
                  title="P95 耗时"
                  value={`${(timingAnalysis.p95_duration_ms / 1000).toFixed(2)}s`}
                  subtitle="95% 分位"
                />
                <StatsCard
                  title="P99 耗时"
                  value={`${(timingAnalysis.p99_duration_ms / 1000).toFixed(2)}s`}
                  subtitle="99% 分位"
                />
              </div>

              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="text-[12px] font-medium text-foreground mb-3">节点耗时分布</div>
                {timingAnalysis.node_timings.length === 0 ? (
                  <div className="text-[12px] text-foreground-muted">暂无节点耗时数据</div>
                ) : (
                  <div className="space-y-2">
                    {timingAnalysis.node_timings.map((node) => {
                      const percent = timingAnalysis.avg_duration_ms
                        ? (node.avg_duration_ms / timingAnalysis.avg_duration_ms) * 100
                        : 0;
                      return (
                        <div key={node.node_id} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" size="sm">
                                {node.node_type}
                              </Badge>
                              <span className="text-foreground-muted">{node.node_id}</span>
                            </div>
                            <span className="text-foreground">{node.avg_duration_ms}ms</span>
                          </div>
                          <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-500 rounded-full"
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-[12px] text-foreground-muted">暂无耗时分析数据</div>
          )}
        </SettingsSection>
      </div>

      {/* Failure Distribution */}
      <SettingsSection
        title="执行失败原因分布"
        description={`最近 ${failureDays} 天的失败统计与诊断。`}
        icon={<AlertTriangle className="w-4 h-4" />}
        footer={
          <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
            <span>时间范围</span>
            <select
              value={failureDays}
              onChange={(e) => setFailureDays(parseInt(e.target.value))}
              className="h-6 rounded border border-border bg-surface-100 px-2 text-[11px]"
            >
              <option value={7}>7 天</option>
              <option value={14}>14 天</option>
              <option value={30}>30 天</option>
            </select>
          </div>
        }
      >
        {failureDistributionQuery.isPending && !localMode ? (
          <div className="text-[12px] text-foreground-muted">正在加载...</div>
        ) : failureDistributionQuery.error && !localMode ? (
          <div className="text-[12px] text-foreground-muted">加载失败，请检查 API 或权限配置</div>
        ) : failureDistribution ? (
          <div className="space-y-4">
            <div className="page-grid grid-cols-2 lg:grid-cols-3">
              <StatsCard
                title="总失败数"
                value={failureDistribution.total_failures.toString()}
                subtitle="次失败"
              />
              <StatsCard
                title="失败率"
                value={`${failureDistribution.failure_rate}%`}
                subtitle="失败/总执行"
              />
              <StatsCard
                title="故障类型"
                value={failureDistribution.distribution.length.toString()}
                subtitle="种失败原因"
              />
            </div>

            <div className="page-grid grid-cols-1 lg:grid-cols-2">
              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="text-[12px] font-medium text-foreground mb-3">失败原因分布</div>
                {failureDistribution.distribution.length === 0 ? (
                  <div className="text-[12px] text-foreground-muted">暂无失败原因数据</div>
                ) : (
                  <div className="space-y-2">
                    {failureDistribution.distribution.map((item) => (
                      <div key={item.reason} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-foreground-light">{item.reason}</span>
                          <span className="text-foreground">
                            {item.count} ({item.percentage}%)
                          </span>
                        </div>
                        <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-destructive-400 rounded-full"
                            style={{ width: `${Math.min(item.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="text-[12px] font-medium text-foreground mb-3">最近失败</div>
                {failureDistribution.recent_failures.length === 0 ? (
                  <div className="text-[12px] text-foreground-muted">暂无失败样本</div>
                ) : (
                  <div className="space-y-3">
                    {failureDistribution.recent_failures.map((failure) => (
                      <div
                        key={failure.id}
                        className="flex items-start justify-between gap-4 text-[11px]"
                      >
                        <div className="min-w-0">
                          <div className="text-foreground font-medium truncate">{failure.error_message}</div>
                          <div className="text-foreground-muted mt-0.5">
                            节点: {failure.node_id}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-foreground-muted">
                            {formatRelativeTime(failure.occurred_at)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplayOpen(failure.id)}
                          >
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-[12px] text-foreground-muted">暂无失败分析数据</div>
        )}
      </SettingsSection>

      {/* Execution Queue */}
      <SettingsSection
        title="运行队列"
        description="当前排队和执行中的任务。"
        icon={<Activity className="w-4 h-4" />}
      >
        {queueQuery.isPending && !localMode ? (
          <div className="text-[12px] text-foreground-muted">正在加载...</div>
        ) : queueQuery.error && !localMode ? (
          <div className="text-[12px] text-foreground-muted">加载失败，请检查 API 或权限配置</div>
        ) : queueItems.length === 0 ? (
          <div className="text-[12px] text-foreground-muted">当前无排队任务</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>执行 ID</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>优先级</TableHead>
                <TableHead>入队时间</TableHead>
                <TableHead>开始时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queueItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-[12px] font-medium text-foreground">
                    {item.id}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={EXECUTION_STATUS_VARIANTS[item.status] || "secondary"}
                      size="sm"
                    >
                      {EXECUTION_STATUS_LABELS[item.status] || item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.priority >= 8 ? "warning" : "outline"} size="sm">
                      P{item.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {formatRelativeTime(item.queued_at)}
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {item.started_at ? formatRelativeTime(item.started_at) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {item.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setNewPriority(item.priority);
                              setAdjustPriorityOpen(item.id);
                            }}
                          >
                            调整优先级
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCancelOpen(item.id)}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                      {item.status === "running" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCancelOpen(item.id)}
                        >
                          <Pause className="w-3.5 h-3.5 mr-1" />
                          取消
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SettingsSection>

      {/* Recent Executions */}
      <SettingsSection
        title="最近执行"
        description="最近的工作流执行记录。"
        icon={<History className="w-4 h-4" />}
      >
        {recentExecutions.length === 0 ? (
          <div className="text-[12px] text-foreground-muted">暂无执行记录</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>执行 ID</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>触发方式</TableHead>
                <TableHead>耗时</TableHead>
                <TableHead>时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentExecutions.map((execution) => (
                <TableRow key={execution.id}>
                  <TableCell>
                    <Link
                      href={`/executions/${execution.id}`}
                      className="text-[12px] font-medium text-foreground hover:text-brand-500 transition-colors"
                    >
                      {execution.id}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={EXECUTION_STATUS_VARIANTS[execution.status] || "secondary"}
                      size="sm"
                    >
                      {EXECUTION_STATUS_LABELS[execution.status] || execution.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-light">
                    {execution.trigger_type || "-"}
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-light">
                    {execution.duration_ms ? `${(execution.duration_ms / 1000).toFixed(2)}s` : "-"}
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {formatRelativeTime(execution.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplayOpen(execution.id)}
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1" />
                        回放
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SettingsSection>

      {/* Version History */}
      <SettingsSection
        title="版本历史"
        description="工作流版本变更记录。"
        icon={<BarChart3 className="w-4 h-4" />}
      >
        {versions.length === 0 ? (
          <div className="text-[12px] text-foreground-muted">暂无版本记录</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>版本</TableHead>
                <TableHead>变更说明</TableHead>
                <TableHead>发布时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map((version) => (
                <TableRow key={version.id}>
                  <TableCell className="text-[12px] font-medium text-foreground">
                    v{version.version}
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-light max-w-[300px] truncate">
                    {version.changelog || "-"}
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {formatDate(version.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SettingsSection>
    </PageContainer>
  );
}
