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
    reason: "User requested account deletion, data backup completed",
    status: "pending",
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "apr_002",
    action: "admin.billing.refund_process",
    target_type: "refund",
    target_id: "ref_001",
    target_name: "Order #ORD-2024-001",
    requester_id: "u_finance_001",
    requester_email: "finance@agentflow.ai",
    reason: "Customer complaint about service quality, verified and confirmed",
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
    reason: "Test workspace, no longer needed",
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
    target_name: "Withdrawal Request #WD-2024-001",
    requester_id: "u_finance_001",
    requester_email: "finance@agentflow.ai",
    reason: "Creator withdrawal request, amount: $1,500.00",
    metadata: { amount: 1500.00, currency: "USD", user_email: "creator@example.com" },
    status: "rejected",
    approver_id: "u_admin_001",
    approver_email: "admin@agentflow.ai",
    approved_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    rejection_reason: "Account has suspicious transaction records, further verification needed",
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
    reason: "New employee onboarding, needs ops admin permissions",
    metadata: { new_role: "ops" },
    status: "expired",
    expires_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
];

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; variant: "success" | "warning" | "error" | "outline" }> = {
  pending: { label: "Pending", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "error" },
  expired: { label: "Expired", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "outline" },
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
        title="Sensitive Action Approvals"
        description="Approve high-risk admin operations to ensure security and compliance."
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
              <div className="text-[11px] text-foreground-muted">Pending</div>
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
              <div className="text-[11px] text-foreground-muted">Approved</div>
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
              <div className="text-[11px] text-foreground-muted">Rejected</div>
              <div className="text-[20px] font-semibold text-foreground">{rejectedCount}</div>
            </div>
          </div>
        </Card>
      </div>

      <SettingsSection
        title="Approval Requests"
        description="All high-risk operation requests requiring approval."
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="Search requester or target"
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
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <Badge variant="outline" size="sm">
            {total} total
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action Type</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Requested At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-[12px] text-foreground-muted">
                  No approval requests found
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
            <DialogTitle>Approval Details</DialogTitle>
            <DialogDescription>
              {selectedApproval?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedApproval && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="grid gap-3 text-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">Action Type</span>
                    <Badge variant="info" size="sm">
                      {AUDIT_ACTION_LABELS[selectedApproval.action] || selectedApproval.action}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">Target</span>
                    <span className="text-foreground">
                      {selectedApproval.target_name || selectedApproval.target_id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">Requester</span>
                    <span className="text-foreground">{selectedApproval.requester_email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">Requested At</span>
                    <span className="text-foreground">
                      {new Date(selectedApproval.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">Expires At</span>
                    <span className="text-foreground">
                      {new Date(selectedApproval.expires_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">Status</span>
                    <Badge variant={STATUS_CONFIG[selectedApproval.status].variant} size="sm">
                      {STATUS_CONFIG[selectedApproval.status].label}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="text-[12px] font-medium text-foreground mb-2">Request Reason</div>
                <div className="text-[12px] text-foreground-light">
                  {selectedApproval.reason}
                </div>
              </div>

              {selectedApproval.metadata && Object.keys(selectedApproval.metadata).length > 0 && (
                <div className="rounded-lg border border-border bg-surface-75 p-4">
                  <div className="text-[12px] font-medium text-foreground mb-2">Additional Information</div>
                  <pre className="text-[11px] font-mono text-foreground-light bg-surface-100 p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedApproval.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {selectedApproval.approver_email && (
                <div className="rounded-lg border border-border bg-surface-75 p-4">
                  <div className="text-[12px] font-medium text-foreground mb-2">Approval Information</div>
                  <div className="grid gap-2 text-[12px]">
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Approver</span>
                      <span className="text-foreground">{selectedApproval.approver_email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Approved At</span>
                      <span className="text-foreground">
                        {selectedApproval.approved_at
                          ? new Date(selectedApproval.approved_at).toLocaleString()
                          : "-"}
                      </span>
                    </div>
                    {selectedApproval.rejection_reason && (
                      <div className="pt-2 border-t border-border">
                        <div className="text-foreground-muted mb-1">Rejection Reason</div>
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
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setDetailModalOpen(false);
                    handleOpenAction(selectedApproval, "approve");
                  }}
                >
                  Approve
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
              {actionType === "approve" ? "Approve Request" : "Reject Request"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Confirm approval of this request. The action will be executed."
                : "Confirm rejection of this request. Please provide a reason."}
            </DialogDescription>
          </DialogHeader>

          {selectedApproval && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="grid gap-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Action Type</span>
                    <span className="text-foreground">
                      {AUDIT_ACTION_LABELS[selectedApproval.action] || selectedApproval.action}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Target</span>
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
                      The action will be executed immediately upon approval. Please confirm you have reviewed the relevant information.
                    </div>
                  </div>
                </div>
              )}

              {actionType === "reject" && (
                <div>
                  <label className="text-[12px] font-medium text-foreground mb-1.5 block">
                    Rejection Reason <span className="text-destructive">*</span>
                  </label>
                  <Input
                    inputSize="sm"
                    placeholder="Enter rejection reason"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              size="sm"
              disabled={(actionType === "reject" && !actionReason.trim()) || isProcessing}
              onClick={handleProcessAction}
            >
              {isProcessing
                ? "Processing..."
                : actionType === "approve"
                ? "Confirm Approval"
                : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
