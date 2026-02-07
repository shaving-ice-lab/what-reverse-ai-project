"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CreditCard,
  Search,
  DollarSign,
  ArrowUpRight,
  RotateCcw,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Download,
  Wallet,
  TrendingUp,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  SettingsSection,
  StatsCard,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FullPagination } from "@/components/ui/pagination";
import {
  AlertDialog,
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
import {
  invoiceRows,
  earningRows,
  withdrawalRows,
  refundRows,
  workspaceRows,
  userRows,
} from "@/lib/mock-data";
import { adminApi } from "@/lib/api/admin";
import { isLocalModeEnabled } from "@/lib/env";
import { cn, formatRelativeTime } from "@/lib/utils";
import type {
  Invoice,
  InvoiceStatus,
  Withdrawal,
  WithdrawalStatus,
  Refund,
  RefundStatus,
} from "@/types/admin";
import { usePermission } from "@/hooks/usePermission";

type TabKey = "invoices" | "withdrawals" | "refunds";

interface BillingDashboardProps {
  initialTab?: TabKey;
}

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "invoices", label: "Invoices", icon: <FileText className="w-4 h-4" /> },
  { key: "withdrawals", label: "Withdrawals", icon: <Wallet className="w-4 h-4" /> },
  { key: "refunds", label: "Refund Requests", icon: <RotateCcw className="w-4 h-4" /> },
];

const TAB_ROUTES: Record<TabKey, string> = {
  invoices: "/billing/invoices",
  withdrawals: "/billing/withdrawals",
  refunds: "/billing/refunds",
};

const INVOICE_STATUS_OPTIONS = ["all", "draft", "pending", "paid", "failed", "refunded", "cancelled"] as const;
const INVOICE_STATUS_LABELS: Record<(typeof INVOICE_STATUS_OPTIONS)[number], string> = {
  all: "All",
  draft: "Draft",
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
  cancelled: "Cancelled",
};
const INVOICE_STATUS_BADGE: Record<InvoiceStatus, "success" | "warning" | "info" | "error"> = {
  draft: "info",
  pending: "warning",
  paid: "success",
  failed: "error",
  refunded: "warning",
  cancelled: "error",
};

const WITHDRAWAL_STATUS_OPTIONS = ["all", "pending", "processing", "completed", "rejected", "cancelled"] as const;
const WITHDRAWAL_STATUS_LABELS: Record<(typeof WITHDRAWAL_STATUS_OPTIONS)[number], string> = {
  all: "All",
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};
const WITHDRAWAL_STATUS_BADGE: Record<WithdrawalStatus, "success" | "warning" | "info" | "error"> = {
  pending: "warning",
  processing: "info",
  completed: "success",
  rejected: "error",
  cancelled: "error",
};

const REFUND_STATUS_OPTIONS = ["all", "pending", "approved", "rejected", "processed", "failed"] as const;
const REFUND_STATUS_LABELS: Record<(typeof REFUND_STATUS_OPTIONS)[number], string> = {
  all: "All",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  processed: "Processed",
  failed: "Failed",
};
const REFUND_STATUS_BADGE: Record<RefundStatus, "success" | "warning" | "info" | "error"> = {
  pending: "warning",
  approved: "info",
  rejected: "error",
  processed: "success",
  failed: "error",
};

function BillingDashboard({ initialTab = "invoices" }: BillingDashboardProps) {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canApproveWithdrawals = hasPermission("earnings.approve");
  const canApproveRefunds = hasPermission("billing.approve");

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Local state for mock data
  const [localInvoices] = useState(() =>
    invoiceRows.map((inv) => ({
      ...inv,
      workspace: workspaceRows.find((ws) => ws.id === inv.workspace_id) || null,
    })) as unknown as Invoice[]
  );
  const [localWithdrawals, setLocalWithdrawals] = useState(() =>
    withdrawalRows.map((wd) => ({
      ...wd,
      user: userRows.find((u) => u.id === wd.user_id) || null,
      processor: wd.processed_by ? userRows.find((u) => u.id === wd.processed_by) || null : null,
    })) as unknown as Withdrawal[]
  );
  const [localRefunds, setLocalRefunds] = useState(() =>
    refundRows.map((rf) => ({
      ...rf,
      workspace: workspaceRows.find((ws) => ws.id === rf.workspace_id) || null,
      requester: rf.requester_user_id ? userRows.find((u) => u.id === rf.requester_user_id) || null : null,
      processor: rf.processed_by ? userRows.find((u) => u.id === rf.processed_by) || null : null,
    })) as unknown as Refund[]
  );

  const invoiceParams = useMemo<{
    status?: "" | InvoiceStatus;
    search?: string;
    page?: number;
    page_size?: number;
  }>(
    () => ({
      status: statusFilter === "all" ? "" : (statusFilter as InvoiceStatus),
      search: search.trim() || undefined,
      page,
      page_size: pageSize,
    }),
    [page, pageSize, search, statusFilter]
  );

  const withdrawalParams = useMemo<{
    status?: "" | WithdrawalStatus;
    page?: number;
    page_size?: number;
  }>(
    () => ({
      status: statusFilter === "all" ? "" : (statusFilter as WithdrawalStatus),
      page,
      page_size: pageSize,
    }),
    [page, pageSize, statusFilter]
  );

  const refundParams = useMemo<{
    status?: "" | RefundStatus;
    page?: number;
    page_size?: number;
  }>(
    () => ({
      status: statusFilter === "all" ? "" : (statusFilter as RefundStatus),
      page,
      page_size: pageSize,
    }),
    [page, pageSize, statusFilter]
  );

  const invoicesQuery = useQuery({
    queryKey: ["admin", "billing", "invoices", invoiceParams],
    enabled: !localMode && activeTab === "invoices",
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.billing.invoices.list(invoiceParams),
  });

  const withdrawalsQuery = useQuery({
    queryKey: ["admin", "billing", "withdrawals", withdrawalParams],
    enabled: !localMode && activeTab === "withdrawals",
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.billing.withdrawals.list(withdrawalParams),
  });

  const refundsQuery = useQuery({
    queryKey: ["admin", "billing", "refunds", refundParams],
    enabled: !localMode && activeTab === "refunds",
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.billing.refunds.list(refundParams),
  });

  const invoiceSource = localMode ? localInvoices : invoicesQuery.data?.items || [];
  const withdrawalSource = localMode ? localWithdrawals : withdrawalsQuery.data?.items || [];
  const refundSource = localMode ? localRefunds : refundsQuery.data?.items || [];

  // Modals
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [confirmActionOpen, setConfirmActionOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [reasonDraft, setReasonDraft] = useState("");

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setPage(1);
    setStatusFilter("all");
    setSearch("");
  }, [activeTab]);

  const isSearchActive = Boolean(search.trim());

  // Filtering logic
  const filteredInvoices = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return invoiceSource.filter((inv) => {
      const matchesSearch =
        !normalized ||
        inv.invoice_number.toLowerCase().includes(normalized) ||
        inv.workspace?.name?.toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoiceSource, search, statusFilter]);

  const filteredWithdrawals = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return withdrawalSource.filter((wd) => {
      const matchesSearch =
        !normalized ||
        wd.id.toLowerCase().includes(normalized) ||
        wd.user?.email?.toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === "all" || wd.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, withdrawalSource]);

  const filteredRefunds = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return refundSource.filter((rf) => {
      const matchesSearch =
        !normalized ||
        rf.id.toLowerCase().includes(normalized) ||
        rf.workspace?.name?.toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === "all" || rf.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [refundSource, search, statusFilter]);

  const invoiceTotal =
    localMode || isSearchActive ? filteredInvoices.length : invoicesQuery.data?.total || 0;
  const withdrawalTotal =
    localMode || isSearchActive ? filteredWithdrawals.length : withdrawalsQuery.data?.total || 0;
  const refundTotal =
    localMode || isSearchActive ? filteredRefunds.length : refundsQuery.data?.total || 0;

  const currentData =
    activeTab === "invoices"
      ? filteredInvoices
      : activeTab === "withdrawals"
      ? filteredWithdrawals
      : filteredRefunds;
  const total =
    activeTab === "invoices"
      ? invoiceTotal
      : activeTab === "withdrawals"
      ? withdrawalTotal
      : refundTotal;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagedData = localMode ? currentData.slice((page - 1) * pageSize, page * pageSize) : currentData;

  // Stats
  const invoiceStatsSource = localMode ? localInvoices : invoiceSource;
  const withdrawalStatsSource = localMode ? localWithdrawals : withdrawalSource;
  const refundStatsSource = localMode ? localRefunds : refundSource;

  const pendingWithdrawals = withdrawalStatsSource.filter((wd) => wd.status === "pending").length;
  const pendingRefunds = refundStatsSource.filter((rf) => rf.status === "pending").length;
  const totalRevenue = invoiceStatsSource
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.total, 0);
  const totalWithdrawn = withdrawalStatsSource
    .filter((wd) => wd.status === "completed")
    .reduce((sum, wd) => sum + wd.amount, 0);

  // Mutations
  const processWithdrawalMutation = useMutation({
    mutationFn: async () => {
      if (!selectedWithdrawal) throw new Error("Please select a withdrawal request");
      if (actionType === "reject" && !reasonDraft.trim()) throw new Error("A reason is required when rejecting");

      if (localMode) {
        const next = localWithdrawals.map((wd) =>
          wd.id === selectedWithdrawal.id
            ? {
                ...wd,
                status: actionType === "approve" ? "completed" : "rejected",
                processed_at: new Date().toISOString(),
                processed_by: userRows[0].id,
                rejection_reason: actionType === "reject" ? reasonDraft : null,
                transaction_id: actionType === "approve" ? `TXN-${Date.now()}` : null,
              }
            : wd
        ) as unknown as Withdrawal[];
        setLocalWithdrawals(next);
        return { withdrawal: next.find((wd) => wd.id === selectedWithdrawal.id)! };
      }

      await adminApi.billing.withdrawals.process(selectedWithdrawal.id, {
        action: actionType,
        reason: reasonDraft,
      });
      return { withdrawal: selectedWithdrawal };
    },
    onSuccess: () => {
      toast.success(actionType === "approve" ? "Withdrawal approved" : "Withdrawal rejected");
      queryClient.invalidateQueries({ queryKey: ["admin", "billing"] });
      setWithdrawalModalOpen(false);
      setConfirmActionOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Processing failed");
    },
  });

  const processRefundMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRefund) throw new Error("Please select a refund request");
      if (actionType === "reject" && !reasonDraft.trim()) throw new Error("A reason is required when rejecting");

      if (localMode) {
        const next = localRefunds.map((rf) =>
          rf.id === selectedRefund.id
            ? {
                ...rf,
                status: actionType === "approve" ? "processed" : "rejected",
                processed_at: new Date().toISOString(),
                processed_by: userRows[0].id,
                rejection_reason: actionType === "reject" ? reasonDraft : null,
              }
            : rf
        ) as unknown as Refund[];
        setLocalRefunds(next);
        return { refund: next.find((rf) => rf.id === selectedRefund.id)! };
      }

      return adminApi.billing.refunds.process(selectedRefund.id, {
        action: actionType,
        reason: reasonDraft,
      });
    },
    onSuccess: () => {
      toast.success(actionType === "approve" ? "Refund approved" : "Refund rejected");
      queryClient.invalidateQueries({ queryKey: ["admin", "billing"] });
      setRefundModalOpen(false);
      setConfirmActionOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Processing failed");
    },
  });

  const getStatusOptions = () => {
    if (activeTab === "invoices") return INVOICE_STATUS_OPTIONS;
    if (activeTab === "withdrawals") return WITHDRAWAL_STATUS_OPTIONS;
    return REFUND_STATUS_OPTIONS;
  };

  const getStatusLabels = () => {
    if (activeTab === "invoices") return INVOICE_STATUS_LABELS;
    if (activeTab === "withdrawals") return WITHDRAWAL_STATUS_LABELS;
    return REFUND_STATUS_LABELS;
  };

  return (
    <PageContainer>
      <PageHeader
        title="Billing & Earnings"
        description="Manage invoices, withdrawal requests, and refund processing."
        icon={<CreditCard className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-3.5 h-3.5 mr-1" />
              Export Report
            </Button>
          </div>
        }
      />

      <div className="page-grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          icon={<TrendingUp className="w-4 h-4" />}
          title="Monthly Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          subtitle="Paid invoices"
        />
        <StatsCard
          icon={<Wallet className="w-4 h-4" />}
          title="Withdrawn"
          value={`$${totalWithdrawn.toFixed(2)}`}
          subtitle="Total withdrawn amount"
        />
        <StatsCard
          icon={<ArrowUpRight className="w-4 h-4" />}
          title="Pending Withdrawals"
          value={pendingWithdrawals.toString()}
          subtitle="Requires review"
          trend={pendingWithdrawals > 0 ? { value: pendingWithdrawals, isPositive: false } : undefined}
        />
        <StatsCard
          icon={<RotateCcw className="w-4 h-4" />}
          title="Pending Refunds"
          value={pendingRefunds.toString()}
          subtitle="Requires review"
          trend={pendingRefunds > 0 ? { value: pendingRefunds, isPositive: false } : undefined}
        />
      </div>

      <SettingsSection
        title="Billing Management"
        description="View invoices, process withdrawals and refund requests."
      >
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4 border-b border-border">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={TAB_ROUTES[tab.key]}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-[12px] font-medium transition-colors border-b-2 -mb-px",
                activeTab === tab.key
                  ? "text-brand-500 border-brand-500"
                  : "text-foreground-muted border-transparent hover:text-foreground"
              )}
            >
              {tab.icon}
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder={
                activeTab === "invoices"
                  ? "Search invoice number or workspace"
                  : activeTab === "withdrawals"
                  ? "Search ID or user email"
                  : "Search ID or workspace"
              }
              leftIcon={<Search className="w-3.5 h-3.5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              {getStatusOptions().map((status) => (
                <option key={status} value={status}>
                  {getStatusLabels()[status as keyof ReturnType<typeof getStatusLabels>]}
                </option>
              ))}
            </select>
          </div>
          <Badge variant="outline" size="sm">
            {total} total
          </Badge>
        </div>

        {/* Invoices Table */}
        {activeTab === "invoices" && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice No.</TableHead>
                <TableHead>Workspace</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Billing Period</TableHead>
                <TableHead>Paid At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoicesQuery.isPending && !localMode ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-[12px] text-foreground-muted">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : pagedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-[12px] text-foreground-muted">
                    {invoicesQuery.error && !localMode
                      ? "Failed to load. Please check API or permission settings."
                      : "No invoice data"}
                  </TableCell>
                </TableRow>
              ) : (
                (pagedData as Invoice[]).map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="text-[12px] font-medium text-foreground">
                      {inv.invoice_number}
                    </TableCell>
                    <TableCell>
                      {inv.workspace ? (
                        <Link
                          href={`/workspaces/${inv.workspace.id}`}
                          className="text-[12px] text-foreground hover:text-brand-500"
                        >
                          {inv.workspace.name}
                        </Link>
                      ) : (
                        <span className="text-[12px] text-foreground-muted">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[12px] text-foreground">
                      ${inv.total.toFixed(2)} {inv.currency}
                    </TableCell>
                    <TableCell>
                      <Badge variant={INVOICE_STATUS_BADGE[inv.status]} size="sm">
                        {INVOICE_STATUS_LABELS[inv.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[12px] text-foreground-muted">
                      {new Date(inv.period_start).toLocaleDateString()} -{" "}
                      {new Date(inv.period_end).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-[12px] text-foreground-muted">
                      {inv.paid_at ? formatRelativeTime(inv.paid_at) : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {/* Withdrawals Table */}
        {activeTab === "withdrawals" && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawalsQuery.isPending && !localMode ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-[12px] text-foreground-muted">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : pagedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-[12px] text-foreground-muted">
                    {withdrawalsQuery.error && !localMode
                      ? "Failed to load. Please check API or permission settings."
                      : "No withdrawal requests"}
                  </TableCell>
                </TableRow>
              ) : (
                (pagedData as Withdrawal[]).map((wd) => (
                  <TableRow key={wd.id}>
                    <TableCell>
                      {wd.user ? (
                        <Link
                          href={`/users/${wd.user.id}`}
                          className="text-[12px] text-foreground hover:text-brand-500"
                        >
                          {wd.user.email}
                        </Link>
                      ) : (
                        <span className="text-[12px] text-foreground-muted">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[12px] font-medium text-foreground">
                      ${wd.amount.toFixed(2)} {wd.currency}
                    </TableCell>
                    <TableCell className="text-[12px] text-foreground-light">
                      {wd.payment_method === "bank_transfer"
                        ? "Bank Transfer"
                        : wd.payment_method === "paypal"
                        ? "PayPal"
                        : wd.payment_method}
                    </TableCell>
                    <TableCell>
                      <Badge variant={WITHDRAWAL_STATUS_BADGE[wd.status]} size="sm">
                        {WITHDRAWAL_STATUS_LABELS[wd.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[12px] text-foreground-muted">
                      {formatRelativeTime(wd.requested_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedWithdrawal(wd);
                          setReasonDraft("");
                          setWithdrawalModalOpen(true);
                        }}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {/* Refunds Table */}
        {activeTab === "refunds" && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workspace</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refundsQuery.isPending && !localMode ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-[12px] text-foreground-muted">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : pagedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-[12px] text-foreground-muted">
                    {refundsQuery.error && !localMode
                      ? "Failed to load. Please check API or permission settings."
                      : "No refund requests"}
                  </TableCell>
                </TableRow>
              ) : (
                (pagedData as Refund[]).map((rf) => (
                  <TableRow key={rf.id}>
                    <TableCell>
                      {rf.workspace ? (
                        <Link
                          href={`/workspaces/${rf.workspace.id}`}
                          className="text-[12px] text-foreground hover:text-brand-500"
                        >
                          {rf.workspace.name}
                        </Link>
                      ) : (
                        <span className="text-[12px] text-foreground-muted">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[12px] font-medium text-foreground">
                      ${rf.amount.toFixed(2)} {rf.currency}
                    </TableCell>
                    <TableCell className="text-[12px] text-foreground-light max-w-[200px] truncate">
                      {rf.reason}
                    </TableCell>
                    <TableCell>
                      <Badge variant={REFUND_STATUS_BADGE[rf.status]} size="sm">
                        {REFUND_STATUS_LABELS[rf.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[12px] text-foreground-muted">
                      {formatRelativeTime(rf.requested_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRefund(rf);
                          setReasonDraft("");
                          setRefundModalOpen(true);
                        }}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

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

      {/* Withdrawal Modal */}
      <Dialog open={withdrawalModalOpen} onOpenChange={setWithdrawalModalOpen}>
        <DialogContent size="lg">
          <DialogHeader icon={<Wallet className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>Withdrawal Request Details</DialogTitle>
            <DialogDescription>
              {selectedWithdrawal?.user?.email || "Withdrawal Request"}
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="grid gap-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Amount</span>
                    <span className="text-foreground font-medium">
                      ${selectedWithdrawal.amount.toFixed(2)} {selectedWithdrawal.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Status</span>
                    <Badge variant={WITHDRAWAL_STATUS_BADGE[selectedWithdrawal.status]} size="sm">
                      {WITHDRAWAL_STATUS_LABELS[selectedWithdrawal.status]}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Payment Method</span>
                    <span className="text-foreground">
                      {selectedWithdrawal.payment_method === "bank_transfer" ? "Bank Transfer" : "PayPal"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Requested At</span>
                    <span className="text-foreground">
                      {new Date(selectedWithdrawal.requested_at).toLocaleString()}
                    </span>
                  </div>
                  {selectedWithdrawal.rejection_reason && (
                    <div className="mt-2 p-2 rounded bg-error-default/10 border border-error-default/20">
                      <div className="text-[11px] text-error-default font-medium">Rejection Reason</div>
                      <div className="text-[11px] text-foreground-light mt-1">
                        {selectedWithdrawal.rejection_reason}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedWithdrawal.status === "pending" && (
                <div className="rounded-lg border border-border bg-surface-75 p-4">
                  <div className="text-[12px] font-medium text-foreground mb-3">Process Withdrawal</div>
                  <textarea
                    value={reasonDraft}
                    onChange={(e) => setReasonDraft(e.target.value)}
                    rows={2}
                    placeholder="Processing notes (required when rejecting)"
                    className={cn(
                      "w-full rounded-md border border-border bg-surface-100 px-3 py-2 mb-3",
                      "text-[12px] text-foreground placeholder:text-foreground-muted",
                      "focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                    )}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!canApproveWithdrawals}
                      onClick={() => {
                        setActionType("reject");
                        setConfirmActionOpen(true);
                      }}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      disabled={!canApproveWithdrawals}
                      onClick={() => {
                        setActionType("approve");
                        setConfirmActionOpen(true);
                      }}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter />
        </DialogContent>
      </Dialog>

      {/* Refund Modal */}
      <Dialog open={refundModalOpen} onOpenChange={setRefundModalOpen}>
        <DialogContent size="lg">
          <DialogHeader icon={<RotateCcw className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>Refund Request Details</DialogTitle>
            <DialogDescription>
              {selectedRefund?.workspace?.name || "Refund Request"}
            </DialogDescription>
          </DialogHeader>

          {selectedRefund && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="grid gap-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Amount</span>
                    <span className="text-foreground font-medium">
                      ${selectedRefund.amount.toFixed(2)} {selectedRefund.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Status</span>
                    <Badge variant={REFUND_STATUS_BADGE[selectedRefund.status]} size="sm">
                      {REFUND_STATUS_LABELS[selectedRefund.status]}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Requested At</span>
                    <span className="text-foreground">
                      {new Date(selectedRefund.requested_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-foreground-muted">Refund Reason</span>
                    <div className="text-foreground mt-1">{selectedRefund.reason}</div>
                  </div>
                  {selectedRefund.rejection_reason && (
                    <div className="mt-2 p-2 rounded bg-error-default/10 border border-error-default/20">
                      <div className="text-[11px] text-error-default font-medium">Rejection Reason</div>
                      <div className="text-[11px] text-foreground-light mt-1">
                        {selectedRefund.rejection_reason}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedRefund.status === "pending" && (
                <div className="rounded-lg border border-border bg-surface-75 p-4">
                  <div className="text-[12px] font-medium text-foreground mb-3">Process Refund</div>
                  <textarea
                    value={reasonDraft}
                    onChange={(e) => setReasonDraft(e.target.value)}
                    rows={2}
                    placeholder="Processing notes (required when rejecting)"
                    className={cn(
                      "w-full rounded-md border border-border bg-surface-100 px-3 py-2 mb-3",
                      "text-[12px] text-foreground placeholder:text-foreground-muted",
                      "focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                    )}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!canApproveRefunds}
                      onClick={() => {
                        setActionType("reject");
                        setConfirmActionOpen(true);
                      }}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      disabled={!canApproveRefunds}
                      onClick={() => {
                        setActionType("approve");
                        setConfirmActionOpen(true);
                      }}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter />
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <AlertDialog
        open={confirmActionOpen}
        onOpenChange={setConfirmActionOpen}
        type={actionType === "approve" ? "info" : "warning"}
        title={actionType === "approve" ? "Confirm Approval?" : "Confirm Rejection?"}
        description={
          actionType === "approve"
            ? "Once approved, this request will be processed immediately."
            : `Rejection reason: ${reasonDraft.trim() || "(not provided)"}`
        }
        confirmText="Confirm"
        cancelText="Cancel"
        loading={processWithdrawalMutation.isPending || processRefundMutation.isPending}
        onConfirm={() => {
          if (selectedWithdrawal && withdrawalModalOpen) {
            processWithdrawalMutation.mutate();
          } else if (selectedRefund && refundModalOpen) {
            processRefundMutation.mutate();
          }
        }}
      />
    </PageContainer>
  );
}

export default BillingDashboard;
