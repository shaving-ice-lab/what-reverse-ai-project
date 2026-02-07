"use client";

import { useState } from "react";
import Link from "next/link";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Eye,
  XCircle,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  SettingsSection,
  StatsCard,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { formatDate, formatRelativeTime } from "@/lib/utils";

// Mock data
const mockAnomalies = [
  {
    id: "anom-1",
    type: "overcharge",
    workspace_id: "ws-101",
    workspace_name: "Acme Corp",
    description: "API call billing exceeded expectations",
    amount: 1250.00,
    expected_amount: 850.00,
    severity: "high",
    status: "pending",
    detected_at: "2026-02-03T06:00:00Z",
    resolved_at: null,
  },
  {
    id: "anom-2",
    type: "duplicate",
    workspace_id: "ws-102",
    workspace_name: "TechStart Inc",
    description: "Duplicate charge",
    amount: 99.00,
    expected_amount: 0,
    severity: "medium",
    status: "pending",
    detected_at: "2026-02-02T14:30:00Z",
    resolved_at: null,
  },
  {
    id: "anom-3",
    type: "undercharge",
    workspace_id: "ws-103",
    workspace_name: "Design Studio",
    description: "Discount calculation error caused undercharge",
    amount: 45.00,
    expected_amount: 89.00,
    severity: "low",
    status: "resolved",
    detected_at: "2026-02-01T10:00:00Z",
    resolved_at: "2026-02-01T15:30:00Z",
  },
];

const STATUS_OPTIONS = ["all", "pending", "resolved", "dismissed"] as const;
const STATUS_LABELS: Record<string, string> = {
  all: "All",
  pending: "Pending",
  resolved: "Corrected",
  dismissed: "Dismissed",
};

const SEVERITY_OPTIONS = ["all", "high", "medium", "low"] as const;
const SEVERITY_LABELS: Record<string, string> = {
  all: "All",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const SEVERITY_VARIANTS: Record<string, "destructive" | "warning" | "secondary"> = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
};

const TYPE_LABELS: Record<string, string> = {
  overcharge: "Overcharge",
  undercharge: "Undercharge",
  duplicate: "Duplicate",
  missing: "Missing",
};

type Anomaly = (typeof mockAnomalies)[number];

export default function BillingAnomaliesPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("pending");
  const [severityFilter, setSeverityFilter] = useState<(typeof SEVERITY_OPTIONS)[number]>("all");
  const [resolveOpen, setResolveOpen] = useState<Anomaly | null>(null);
  const [resolveAction, setResolveAction] = useState<"correct" | "dismiss">("correct");
  const [correctionAmount, setCorrectionAmount] = useState<number>(0);
  const [resolveNotes, setResolveNotes] = useState("");

  const [localAnomalies, setLocalAnomalies] = useState(mockAnomalies);

  const anomaliesQuery = useQuery({
    queryKey: ["admin", "billing", "anomalies", statusFilter, severityFilter],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () =>
      adminApi.billing.anomalies.list({
        status: statusFilter === "all" ? undefined : statusFilter,
        severity: severityFilter === "all" ? undefined : severityFilter,
      }),
  });

  const anomaliesSource = localMode ? localAnomalies : anomaliesQuery.data?.items || [];
  const filteredAnomalies = localMode
    ? anomaliesSource.filter(
        (item) =>
          (statusFilter === "all" || item.status === statusFilter) &&
          (severityFilter === "all" || item.severity === severityFilter)
      )
    : anomaliesSource;

  const resolveMutation = useMutation({
    mutationFn: async () => {
      if (!resolveOpen) throw new Error("No anomaly selected");
      if (localMode) {
        setLocalAnomalies((prev) =>
          prev.map((item) =>
            item.id === resolveOpen.id
              ? {
                  ...item,
                  status: resolveAction === "correct" ? "resolved" : "dismissed",
                  resolved_at: new Date().toISOString(),
                }
              : item
          )
        );
        return { success: true };
      }
      return adminApi.billing.anomalies.resolve(resolveOpen.id, {
        action: resolveAction,
        correction_amount: resolveAction === "correct" ? correctionAmount : undefined,
        notes: resolveNotes,
      });
    },
    onSuccess: () => {
      toast.success(resolveAction === "correct" ? "Anomaly corrected" : "Anomaly dismissed");
      setResolveOpen(null);
      setResolveNotes("");
      setCorrectionAmount(0);
      queryClient.invalidateQueries({ queryKey: ["admin", "billing", "anomalies"] });
    },
    onError: () => toast.error("Processing failed"),
  });

  const pendingCount = anomaliesSource.filter((item) => item.status === "pending").length;
  const totalAmount = anomaliesSource
    .filter((item) => item.status === "pending")
    .reduce((sum, item) => sum + Math.abs(item.amount - item.expected_amount), 0);

  return (
    <PageContainer>
      <PageHeader
        title="Billing Anomaly Management"
        description="Detect and resolve billing anomalies."
        icon={<AlertTriangle className="w-4 h-4" />}
        backHref="/billing"
        backLabel="Back to Billing Overview"
      />

      <div className="page-grid grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Pending Anomalies"
          value={pendingCount.toString()}
          subtitle="anomalies"
          trend={pendingCount > 0 ? { value: pendingCount, isPositive: true } : undefined}
        />
        <StatsCard
          title="Amount Involved"
          value={`$${totalAmount.toFixed(2)}`}
          subtitle="Total discrepancy"
        />
        <StatsCard
          title="Detected Today"
          value="8"
          subtitle="anomalies"
        />
        <StatsCard
          title="Corrected This Month"
          value="$2,450"
          subtitle="Corrected amount"
        />
      </div>

      <SettingsSection
        title="Anomaly List"
        description="Detected billing anomaly records."
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">Severity</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as typeof severityFilter)}
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30"
            >
              {SEVERITY_OPTIONS.map((severity) => (
                <option key={severity} value={severity}>
                  {SEVERITY_LABELS[severity]}
                </option>
              ))}
            </select>
          </div>
          <Badge variant="outline" size="sm">
            {filteredAnomalies.length} total
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workspace</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount Discrepancy</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Detected At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {anomaliesQuery.isPending && !localMode ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredAnomalies.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  {anomaliesQuery.error && !localMode
                    ? "Failed to load. Please check API or permission settings."
                    : "No anomaly records"}
                </TableCell>
              </TableRow>
            ) : (
              filteredAnomalies.map((anomaly) => (
                <TableRow key={anomaly.id}>
                  <TableCell>
                    <Link
                      href={`/workspaces/${anomaly.workspace_id}`}
                      className="text-[12px] font-medium text-foreground hover:text-brand-500"
                    >
                      {anomaly.workspace_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" size="sm">
                      {TYPE_LABELS[anomaly.type] || anomaly.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-light max-w-[200px] truncate">
                    {anomaly.description}
                  </TableCell>
                  <TableCell>
                    <div className="text-[12px]">
                      <div className="text-foreground">${anomaly.amount.toFixed(2)}</div>
                      <div className="text-foreground-muted">
                        Expected: ${anomaly.expected_amount.toFixed(2)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={SEVERITY_VARIANTS[anomaly.severity]} size="sm">
                      {SEVERITY_LABELS[anomaly.severity]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        anomaly.status === "pending"
                          ? "warning"
                          : anomaly.status === "resolved"
                          ? "success"
                          : "secondary"
                      }
                      size="sm"
                    >
                      {STATUS_LABELS[anomaly.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {formatRelativeTime(anomaly.detected_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setResolveOpen(anomaly);
                        setResolveAction("correct");
                        setCorrectionAmount(Math.abs(anomaly.amount - anomaly.expected_amount));
                        setResolveNotes("");
                      }}
                      disabled={anomaly.status !== "pending"}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Resolve
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SettingsSection>

      {/* Resolve Dialog */}
      <Dialog open={Boolean(resolveOpen)} onOpenChange={(open) => !open && setResolveOpen(null)}>
        <DialogContent size="lg">
          <DialogHeader icon={<DollarSign className="w-6 h-6" />} iconVariant="warning">
            <DialogTitle>Resolve Billing Anomaly</DialogTitle>
            <DialogDescription>
              {resolveOpen && (
                <span className="text-foreground-light">
                  {resolveOpen.workspace_name} - {resolveOpen.description}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {resolveOpen && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="grid grid-cols-3 gap-4 text-[12px]">
                  <div>
                    <div className="text-foreground-muted">Actual Amount</div>
                    <div className="text-foreground font-medium">${resolveOpen.amount.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-foreground-muted">Expected Amount</div>
                    <div className="text-foreground font-medium">${resolveOpen.expected_amount.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-foreground-muted">Discrepancy</div>
                    <div className="text-destructive-400 font-medium">
                      ${Math.abs(resolveOpen.amount - resolveOpen.expected_amount).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] text-foreground">Resolution Method</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={resolveAction === "correct" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setResolveAction("correct")}
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    Correct
                  </Button>
                  <Button
                    type="button"
                    variant={resolveAction === "dismiss" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setResolveAction("dismiss")}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Dismiss
                  </Button>
                </div>
              </div>

              {resolveAction === "correct" && (
                <div className="space-y-1">
                  <label className="text-[12px] text-foreground">Correction Amount</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={correctionAmount}
                    onChange={(e) => setCorrectionAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[12px] text-foreground">Resolution Notes</label>
                <Input
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Enter resolution notes..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveOpen(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => resolveMutation.mutate()}
              loading={resolveMutation.isPending}
              loadingText="Processing..."
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
