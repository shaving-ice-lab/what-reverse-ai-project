"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  GitBranch,
  History,
  Play,
  RefreshCcw,
  RotateCcw,
  Settings2,
  Shield,
  XCircle,
} from "lucide-react";
import {
  EmptyState,
  PageContainer,
  PageHeader,
  SettingsSection,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { opsApi } from "@/lib/api/ops";
import { isLocalModeEnabled } from "@/lib/env";
import { opsChangeRows } from "@/lib/mock-data";
import { formatRelativeTime } from "@/lib/utils";
import type { ChangeStatus, ChangeType, OpsChange } from "@/types/ops";

const CHANGE_TYPE_OPTIONS: { value: ChangeType | ""; label: string }[] = [
  { value: "", label: "全部类型" },
  { value: "config", label: "配置变更" },
  { value: "feature_flag", label: "功能开关" },
  { value: "secret", label: "密钥轮换" },
  { value: "deployment", label: "部署变更" },
  { value: "scaling", label: "扩缩容" },
  { value: "maintenance", label: "维护操作" },
];

const CHANGE_STATUS_OPTIONS: { value: ChangeStatus | ""; label: string }[] = [
  { value: "", label: "全部状态" },
  { value: "pending", label: "待审批" },
  { value: "approved", label: "已批准" },
  { value: "rejected", label: "已拒绝" },
  { value: "applied", label: "已应用" },
  { value: "rolled_back", label: "已回滚" },
];

const CHANGE_TYPE_CONFIG: Record<ChangeType, { label: string; icon: React.ReactNode }> = {
  config: { label: "配置变更", icon: <Settings2 className="w-3.5 h-3.5" /> },
  feature_flag: { label: "功能开关", icon: <GitBranch className="w-3.5 h-3.5" /> },
  secret: { label: "密钥轮换", icon: <Shield className="w-3.5 h-3.5" /> },
  deployment: { label: "部署变更", icon: <Play className="w-3.5 h-3.5" /> },
  scaling: { label: "扩缩容", icon: <History className="w-3.5 h-3.5" /> },
  maintenance: { label: "维护操作", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
};

const CHANGE_STATUS_CONFIG: Record<
  ChangeStatus,
  { label: string; variant: "secondary" | "info" | "success" | "error" | "warning" }
> = {
  pending: { label: "待审批", variant: "warning" },
  approved: { label: "已批准", variant: "info" },
  rejected: { label: "已拒绝", variant: "error" },
  applied: { label: "已应用", variant: "success" },
  rolled_back: { label: "已回滚", variant: "secondary" },
};

const RISK_LEVEL_CONFIG: Record<
  string,
  { label: string; variant: "secondary" | "info" | "warning" | "error" }
> = {
  low: { label: "低", variant: "secondary" },
  medium: { label: "中", variant: "info" },
  high: { label: "高", variant: "warning" },
  critical: { label: "严重", variant: "error" },
};

const PAGE_SIZES = [10, 20, 50];

export default function OpsChangesPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();

  const [typeFilter, setTypeFilter] = useState<ChangeType | "">("");
  const [statusFilter, setStatusFilter] = useState<ChangeStatus | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"approve" | "reject" | "apply" | "rollback" | null>(null);
  const [selectedChange, setSelectedChange] = useState<OpsChange | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter, pageSize]);

  const listQuery = useQuery({
    queryKey: ["ops", "changes", typeFilter, statusFilter, page, pageSize],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () =>
      opsApi.listChanges({
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        page,
        page_size: pageSize,
      }),
  });

  // Filter mock data for local mode
  const mockChanges = opsChangeRows.filter((change) => {
    if (typeFilter && change.type !== typeFilter) return false;
    if (statusFilter && change.status !== statusFilter) return false;
    return true;
  }) as OpsChange[];

  const changes = localMode ? mockChanges : listQuery.data?.changes || [];
  const canPrev = page > 1;
  const canNext = changes.length === pageSize;

  // Mutations
  const approveMutation = useMutation({
    mutationFn: async (change: OpsChange) => opsApi.approveChange(change.id),
    onSuccess: () => {
      toast.success("变更已批准");
      queryClient.invalidateQueries({ queryKey: ["ops", "changes"] });
      setDialogOpen(false);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "批准失败"),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ change, reason }: { change: OpsChange; reason: string }) =>
      opsApi.rejectChange(change.id, reason),
    onSuccess: () => {
      toast.success("变更已拒绝");
      queryClient.invalidateQueries({ queryKey: ["ops", "changes"] });
      setDialogOpen(false);
      setRejectReason("");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "拒绝失败"),
  });

  const applyMutation = useMutation({
    mutationFn: async (change: OpsChange) => opsApi.applyChange(change.id),
    onSuccess: () => {
      toast.success("变更已应用");
      queryClient.invalidateQueries({ queryKey: ["ops", "changes"] });
      setDialogOpen(false);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "应用失败"),
  });

  const rollbackMutation = useMutation({
    mutationFn: async ({ change, reason }: { change: OpsChange; reason: string }) =>
      opsApi.rollbackChange(change.id, reason),
    onSuccess: () => {
      toast.success("变更已回滚");
      queryClient.invalidateQueries({ queryKey: ["ops", "changes"] });
      setDialogOpen(false);
      setRejectReason("");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "回滚失败"),
  });

  const openDialog = (change: OpsChange, type: "approve" | "reject" | "apply" | "rollback") => {
    setSelectedChange(change);
    setDialogType(type);
    setRejectReason("");
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedChange || !dialogType) return;
    switch (dialogType) {
      case "approve":
        approveMutation.mutate(selectedChange);
        break;
      case "reject":
        if (!rejectReason.trim()) {
          toast.error("请填写拒绝原因");
          return;
        }
        rejectMutation.mutate({ change: selectedChange, reason: rejectReason });
        break;
      case "apply":
        applyMutation.mutate(selectedChange);
        break;
      case "rollback":
        if (!rejectReason.trim()) {
          toast.error("请填写回滚原因");
          return;
        }
        rollbackMutation.mutate({ change: selectedChange, reason: rejectReason });
        break;
    }
  };

  const isLoading =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    applyMutation.isPending ||
    rollbackMutation.isPending;

  return (
    <PageContainer>
      <PageHeader
        title="运维变更记录"
        description="查看和审批运维变更请求。"
        icon={<FileText className="w-4 h-4" />}
        actions={
          <Button
            variant="outline"
            size="sm"
            loading={listQuery.isFetching}
            loadingText="刷新中..."
            leftIcon={<RefreshCcw className="w-4 h-4" />}
            onClick={() => listQuery.refetch()}
            disabled={localMode}
          >
            刷新
          </Button>
        }
      />

      <SettingsSection title="变更列表" description="审批与追踪运维变更。">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">类型</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ChangeType | "")}
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              {CHANGE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">状态</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ChangeStatus | "")}
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              {CHANGE_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">每页</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <Badge variant="outline" size="sm">
            共 {changes.length} 条
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!canPrev}
            >
              上一页
            </Button>
            <Badge variant="secondary" size="sm">
              第 {page} 页
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!canNext}
            >
              下一页
            </Button>
          </div>
        </div>

        {listQuery.isPending && !localMode ? (
          <div className="text-[12px] text-foreground-muted">正在加载...</div>
        ) : changes.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-5 h-5" />}
            title="暂无变更记录"
            description="当前没有符合条件的变更记录。"
          />
        ) : (
          <div className="space-y-3">
            {changes.map((change) => {
              const typeConfig = CHANGE_TYPE_CONFIG[change.type];
              const statusConfig = CHANGE_STATUS_CONFIG[change.status];
              const riskConfig = RISK_LEVEL_CONFIG[change.risk_level];
              const isExpanded = expandedId === change.id;
              const canApprove = change.status === "pending";
              const canApply = change.status === "approved";
              const canRollback = change.status === "applied";

              return (
                <div
                  key={change.id}
                  className="rounded-lg border border-border bg-surface-75 overflow-hidden"
                >
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-100 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : change.id)}
                  >
                    <div className="shrink-0 text-foreground-muted">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="shrink-0 text-foreground-light">{typeConfig.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium text-foreground">
                          {change.title}
                        </span>
                        <Badge variant={statusConfig.variant} size="sm">
                          {statusConfig.label}
                        </Badge>
                        <Badge variant={riskConfig.variant} size="sm">
                          风险: {riskConfig.label}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-foreground-muted mt-0.5">
                        {change.requester_email} · {formatRelativeTime(change.created_at)}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {canApprove && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              openDialog(change, "approve");
                            }}
                            disabled={localMode}
                          >
                            批准
                          </Button>
                          <Button
                            variant="destructive-outline"
                            size="sm"
                            leftIcon={<XCircle className="w-3.5 h-3.5" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              openDialog(change, "reject");
                            }}
                            disabled={localMode}
                          >
                            拒绝
                          </Button>
                        </>
                      )}
                      {canApply && (
                        <Button
                          variant="default"
                          size="sm"
                          leftIcon={<Play className="w-3.5 h-3.5" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            openDialog(change, "apply");
                          }}
                          disabled={localMode}
                        >
                          应用
                        </Button>
                      )}
                      {canRollback && (
                        <Button
                          variant="destructive-outline"
                          size="sm"
                          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            openDialog(change, "rollback");
                          }}
                          disabled={localMode}
                        >
                          回滚
                        </Button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border p-4 bg-surface-50 space-y-4">
                      <div>
                        <div className="text-[11px] text-foreground-muted mb-1">描述</div>
                        <div className="text-[12px] text-foreground-light">{change.description}</div>
                      </div>

                      <div>
                        <div className="text-[11px] text-foreground-muted mb-2">变更内容</div>
                        <div className="rounded-md border border-border bg-surface-100 overflow-hidden">
                          <table className="w-full text-[11px]">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left px-3 py-2 text-foreground-muted font-medium">
                                  字段
                                </th>
                                <th className="text-left px-3 py-2 text-foreground-muted font-medium">
                                  原值
                                </th>
                                <th className="text-left px-3 py-2 text-foreground-muted font-medium">
                                  新值
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {change.changes.map((c, idx) => (
                                <tr key={idx} className="border-b border-border last:border-0">
                                  <td className="px-3 py-2 font-mono text-foreground">{c.field}</td>
                                  <td className="px-3 py-2 font-mono text-destructive-400">
                                    {c.old_value || "-"}
                                  </td>
                                  <td className="px-3 py-2 font-mono text-brand-400">
                                    {c.new_value || "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {change.rollback_plan && (
                        <div>
                          <div className="text-[11px] text-foreground-muted mb-1">回滚计划</div>
                          <div className="text-[12px] text-foreground-light whitespace-pre-wrap font-mono bg-surface-100 rounded-md p-3 border border-border">
                            {change.rollback_plan}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-4 text-[11px] text-foreground-muted">
                        {change.approved_by && (
                          <div>
                            审批人: <span className="text-foreground-light">{change.approver_email}</span>
                            {change.approved_at && (
                              <span className="ml-1">({formatRelativeTime(change.approved_at)})</span>
                            )}
                          </div>
                        )}
                        {change.applied_by && (
                          <div>
                            执行人: <span className="text-foreground-light">{change.applier_email}</span>
                            {change.applied_at && (
                              <span className="ml-1">({formatRelativeTime(change.applied_at)})</span>
                            )}
                          </div>
                        )}
                        {change.rolled_back_at && (
                          <div>
                            回滚时间: <span className="text-foreground-light">{formatRelativeTime(change.rolled_back_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SettingsSection>

      <AlertDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={dialogType === "approve" || dialogType === "apply" ? "info" : "warning"}
        title={
          dialogType === "approve"
            ? "确认批准该变更？"
            : dialogType === "reject"
            ? "确认拒绝该变更？"
            : dialogType === "apply"
            ? "确认应用该变更？"
            : "确认回滚该变更？"
        }
        description={
          <div className="space-y-3">
            <div>{selectedChange?.title}</div>
            {(dialogType === "reject" || dialogType === "rollback") && (
              <div>
                <Input
                  placeholder={dialogType === "reject" ? "请填写拒绝原因" : "请填写回滚原因"}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mt-2"
                />
              </div>
            )}
          </div>
        }
        confirmText={
          dialogType === "approve"
            ? "批准"
            : dialogType === "reject"
            ? "拒绝"
            : dialogType === "apply"
            ? "应用"
            : "回滚"
        }
        cancelText="取消"
        loading={isLoading}
        onConfirm={handleConfirm}
      />
    </PageContainer>
  );
}
