"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Shield,
  Search,
  Clock,
  Check,
  X,
  AlertTriangle,
  User,
  FileText,
  Filter,
  Eye,
  ChevronRight,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  SettingsSection,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FullPagination } from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { cn, formatRelativeTime } from "@/lib/utils";
import { AUDIT_ACTION_LABELS, type AuditAction } from "@/lib/audit";

// ===== Types =====

type ApprovalStatus = "pending" | "approved" | "rejected" | "expired" | "cancelled";

interface ApprovalRequest {
  id: string;
  action: AuditAction;
  target_type: string;
  target_id: string;
  target_name?: string;
  requester_id: string;
  requester_email: string;
  reason: string;
  metadata?: Record<string, unknown>;
  status: ApprovalStatus;
  approver_id?: string;
  approver_email?: string;
  approved_at?: string;
  rejection_reason?: string;
  expires_at: string;
  created_at: string;
}

// ===== Mock Data =====

const mockApprovals: ApprovalRequest[] = [
  {
    id: "apr_001",
    action: "admin.user.delete",
    target_type: "user",
    target_id: "u_test_001",
    target_name: "test_user@example.com",
    requester_id: "u_admin_001",
    requester_email: "admin@agentflow.ai",
    reason: "用户请求注销账号，已完成数据备份",
    status: "pending",
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "apr_002",
    action: "admin.billing.refund_process",
    target_type: "refund",
    target_id: "ref_001",
    target_name: "订单 #ORD-2024-001",
    requester_id: "u_finance_001",
    requester_email: "finance@agentflow.ai",
    reason: "客户投诉服务质量问题，经核实确认",
    metadata: { amount: 299.00, currency: "USD" },
    status: "pending",
    expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "apr_003",
    action: "admin.workspace.delete",
    target_type: "workspace",
    target_id: "ws_old_001",
    target_name: "test-workspace",
    requester_id: "u_ops_001",
    requester_email: "ops@agentflow.ai",
    reason: "测试工作空间，已无使用需求",
    status: "approved",
    approver_id: "u_admin_001",
    approver_email: "admin@agentflow.ai",
    approved_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "apr_004",
    action: "admin.earnings.withdrawal_process",
    target_type: "withdrawal",
    target_id: "wd_001",
    target_name: "提现申请 #WD-2024-001",
    requester_id: "u_finance_001",
    requester_email: "finance@agentflow.ai",
    reason: "创作者提现申请，金额：$1,500.00",
    metadata: { amount: 1500.00, currency: "USD", user_email: "creator@example.com" },
    status: "rejected",
    approver_id: "u_admin_001",
    approver_email: "admin@agentflow.ai",
    approved_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    rejection_reason: "账户存在异常交易记录，需进一步核实",
    expires_at: new Date(Date.now() + 19 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "apr_005",
    action: "admin.permission.role_assign",
    target_type: "user",
    target_id: "u_new_admin",
    target_name: "new_admin@agentflow.ai",
    requester_id: "u_admin_001",
    requester_email: "admin@agentflow.ai",
    reason: "新员工入职，需要授予运维管理员权限",
    metadata: { new_role: "ops" },
    status: "expired",
    expires_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
];

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; variant: "success" | "warning" | "error" | "outline" }> = {
  pending: { label: "待审批", variant: "warning" },
  approved: { label: "已通过", variant: "success" },
  rejected: { label: "已拒绝", variant: "error" },
  expired: { label: "已过期", variant: "outline" },
  cancelled: { label: "已取消", variant: "outline" },
};

export default function ApprovalsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);

  // Approve/Reject modal
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [actionReason, setActionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Filtering
  const filteredApprovals = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return mockApprovals.filter((approval) => {
      const matchesSearch =
        !normalized ||
        approval.requester_email.toLowerCase().includes(normalized) ||
        approval.target_name?.toLowerCase().includes(normalized) ||
        approval.reason.toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === "all" || approval.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const total = filteredApprovals.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagedData = filteredApprovals.slice((page - 1) * pageSize, page * pageSize);

  const handleOpenAction = (approval: ApprovalRequest, type: "approve" | "reject") => {
    setSelectedApproval(approval);
    setActionType(type);
    setActionReason("");
    setActionModalOpen(true);
  };

  const handleProcessAction = async () => {
    if (!selectedApproval) return;
    if (actionType === "reject" && !actionReason.trim()) return;
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsProcessing(false);
    setActionModalOpen(false);
    setSelectedApproval(null);
  };

  // Stats
  const pendingCount = mockApprovals.filter((a) => a.status === "pending").length;
  const approvedCount = mockApprovals.filter((a) => a.status === "approved").length;
  const rejectedCount = mockApprovals.filter((a) => a.status === "rejected").length;

  return (
    <PageContainer>
      <PageHeader
        title="敏感操作审批"
        description="审批高风险管理操作，确保安全合规。"
        icon={<Shield className="w-4 h-4" />}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning-500" />
            </div>
            <div>
              <div className="text-[11px] text-foreground-muted">待审批</div>
              <div className="text-[20px] font-semibold text-foreground">{pendingCount}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-500/10 flex items-center justify-center">
              <Check className="w-5 h-5 text-success-500" />
            </div>
            <div>
              <div className="text-[11px] text-foreground-muted">已通过</div>
              <div className="text-[20px] font-semibold text-foreground">{approvedCount}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <X className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <div className="text-[11px] text-foreground-muted">已拒绝</div>
              <div className="text-[20px] font-semibold text-foreground">{rejectedCount}</div>
            </div>
          </div>
        </Card>
      </div>

      <SettingsSection
        title="审批请求"
        description="所有需要审批的高风险操作请求。"
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="搜索申请人或目标"
              leftIcon={<Search className="w-3.5 h-3.5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-foreground-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ApprovalStatus | "all")}
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="all">全部状态</option>
              <option value="pending">待审批</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
              <option value="expired">已过期</option>
            </select>
          </div>
          <Badge variant="outline" size="sm">
            共 {total} 条
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>操作类型</TableHead>
              <TableHead>目标</TableHead>
              <TableHead>申请人</TableHead>
              <TableHead>申请时间</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-[12px] text-foreground-muted">
                  暂无审批请求
                </TableCell>
              </TableRow>
            ) : (
              pagedData.map((approval) => {
                const statusConfig = STATUS_CONFIG[approval.status];
                return (
                  <TableRow key={approval.id}>
                    <TableCell>
                      <Badge variant="info" size="sm">
                        {AUDIT_ACTION_LABELS[approval.action] || approval.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-[12px] text-foreground">
                          {approval.target_name || approval.target_id}
                        </div>
                        <div className="text-[11px] text-foreground-muted">
                          {approval.target_type}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-surface-200 flex items-center justify-center">
                          <User className="w-3 h-3 text-foreground-muted" />
                        </div>
                        <span className="text-[12px] text-foreground">
                          {approval.requester_email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-foreground-muted" />
                        <span className="text-[12px] text-foreground-light">
                          {formatRelativeTime(approval.created_at)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant} size="sm">
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedApproval(approval);
                            setDetailModalOpen(true);
                          }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {approval.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-success-600"
                              onClick={() => handleOpenAction(approval, "approve")}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleOpenAction(approval, "reject")}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <div className="mt-4">
          <FullPagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            showInput={false}
            size="sm"
            variant="outline"
          />
        </div>
      </SettingsSection>

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent size="lg">
          <DialogHeader icon={<FileText className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>审批详情</DialogTitle>
            <DialogDescription>
              {selectedApproval?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedApproval && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="grid gap-3 text-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">操作类型</span>
                    <Badge variant="info" size="sm">
                      {AUDIT_ACTION_LABELS[selectedApproval.action] || selectedApproval.action}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">目标</span>
                    <span className="text-foreground">
                      {selectedApproval.target_name || selectedApproval.target_id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">申请人</span>
                    <span className="text-foreground">{selectedApproval.requester_email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">申请时间</span>
                    <span className="text-foreground">
                      {new Date(selectedApproval.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">过期时间</span>
                    <span className="text-foreground">
                      {new Date(selectedApproval.expires_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">状态</span>
                    <Badge variant={STATUS_CONFIG[selectedApproval.status].variant} size="sm">
                      {STATUS_CONFIG[selectedApproval.status].label}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="text-[12px] font-medium text-foreground mb-2">申请原因</div>
                <div className="text-[12px] text-foreground-light">
                  {selectedApproval.reason}
                </div>
              </div>

              {selectedApproval.metadata && Object.keys(selectedApproval.metadata).length > 0 && (
                <div className="rounded-lg border border-border bg-surface-75 p-4">
                  <div className="text-[12px] font-medium text-foreground mb-2">附加信息</div>
                  <pre className="text-[11px] font-mono text-foreground-light bg-surface-100 p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedApproval.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {selectedApproval.approver_email && (
                <div className="rounded-lg border border-border bg-surface-75 p-4">
                  <div className="text-[12px] font-medium text-foreground mb-2">审批信息</div>
                  <div className="grid gap-2 text-[12px]">
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">审批人</span>
                      <span className="text-foreground">{selectedApproval.approver_email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">审批时间</span>
                      <span className="text-foreground">
                        {selectedApproval.approved_at
                          ? new Date(selectedApproval.approved_at).toLocaleString()
                          : "-"}
                      </span>
                    </div>
                    {selectedApproval.rejection_reason && (
                      <div className="pt-2 border-t border-border">
                        <div className="text-foreground-muted mb-1">拒绝原因</div>
                        <div className="text-foreground">{selectedApproval.rejection_reason}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedApproval?.status === "pending" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDetailModalOpen(false);
                    handleOpenAction(selectedApproval, "reject");
                  }}
                >
                  拒绝
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setDetailModalOpen(false);
                    handleOpenAction(selectedApproval, "approve");
                  }}
                >
                  通过
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve/Reject Modal */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent>
          <DialogHeader
            icon={actionType === "approve" ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
            iconVariant={actionType === "approve" ? "success" : "error"}
          >
            <DialogTitle>
              {actionType === "approve" ? "通过审批" : "拒绝审批"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "确认通过此审批请求，操作将被执行。"
                : "确认拒绝此审批请求，请说明原因。"}
            </DialogDescription>
          </DialogHeader>

          {selectedApproval && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="grid gap-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">操作类型</span>
                    <span className="text-foreground">
                      {AUDIT_ACTION_LABELS[selectedApproval.action] || selectedApproval.action}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">目标</span>
                    <span className="text-foreground">
                      {selectedApproval.target_name || selectedApproval.target_id}
                    </span>
                  </div>
                </div>
              </div>

              {actionType === "approve" && (
                <div className="rounded-lg border border-warning-500/30 bg-warning-500/5 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning-500 mt-0.5" />
                    <div className="text-[12px] text-foreground">
                      通过后操作将立即执行，请确认已审核相关信息。
                    </div>
                  </div>
                </div>
              )}

              {actionType === "reject" && (
                <div>
                  <label className="text-[12px] font-medium text-foreground mb-1.5 block">
                    拒绝原因 <span className="text-destructive">*</span>
                  </label>
                  <Input
                    inputSize="sm"
                    placeholder="请输入拒绝原因"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActionModalOpen(false)}>
              取消
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              size="sm"
              disabled={(actionType === "reject" && !actionReason.trim()) || isProcessing}
              onClick={handleProcessAction}
            >
              {isProcessing
                ? "处理中..."
                : actionType === "approve"
                ? "确认通过"
                : "确认拒绝"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
