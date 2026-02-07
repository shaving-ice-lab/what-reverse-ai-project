"use client";

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Key,
  Search,
  RotateCcw,
  XCircle,
  Shield,
  Clock,
  AlertTriangle,
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
import { secretRows, userRows } from "@/lib/mock-data";
import { adminApi } from "@/lib/api/admin";
import { isLocalModeEnabled } from "@/lib/env";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Secret } from "@/types/admin";
import { usePermission } from "@/hooks/usePermission";

const SCOPE_OPTIONS = ["all", "system", "workspace", "app"] as const;
const SCOPE_LABELS: Record<(typeof SCOPE_OPTIONS)[number], string> = {
  all: "All Scopes",
  system: "System",
  workspace: "Workspace",
  app: "App",
};

const STATUS_OPTIONS = ["all", "active", "rotated", "disabled"] as const;
const STATUS_LABELS: Record<(typeof STATUS_OPTIONS)[number], string> = {
  all: "All Statuses",
  active: "Active",
  rotated: "Rotated",
  disabled: "Disabled",
};

const STATUS_BADGE: Record<string, "success" | "warning" | "error"> = {
  active: "success",
  rotated: "warning",
  disabled: "error",
};

export default function SecretsPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canManage = hasPermission("secrets.write");

  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Local state for mock data
  const [localSecrets, setLocalSecrets] = useState(() =>
    secretRows.map((sec) => ({
      ...sec,
      creator: sec.created_by ? userRows.find((u) => u.id === sec.created_by) || null : null,
    })) as unknown as Secret[]
  );

  const secretParams = useMemo(
    () => ({
      scope: scopeFilter === "all" ? undefined : scopeFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
      page,
      page_size: pageSize,
    }),
    [page, pageSize, scopeFilter, statusFilter]
  );

  const secretsQuery = useQuery({
    queryKey: ["admin", "secrets", secretParams],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.security.secrets.list(secretParams),
  });

  const secretSource = localMode ? localSecrets : secretsQuery.data?.items || [];

  // Modals
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [confirmActionOpen, setConfirmActionOpen] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);
  const [actionType, setActionType] = useState<"rotate" | "disable">("rotate");
  const [reasonDraft, setReasonDraft] = useState("");

  useEffect(() => {
    setPage(1);
  }, [scopeFilter, search, statusFilter]);

  // Filtering logic
  const filteredSecrets = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return secretSource.filter((sec) => {
      const matchesSearch =
        !normalized ||
        sec.name.toLowerCase().includes(normalized) ||
        sec.key_prefix.toLowerCase().includes(normalized);
      const matchesScope = scopeFilter === "all" || sec.scope === scopeFilter;
      const matchesStatus = statusFilter === "all" || sec.status === statusFilter;
      return matchesSearch && matchesScope && matchesStatus;
    });
  }, [scopeFilter, search, secretSource, statusFilter]);

  const total =
    localMode || Boolean(search.trim())
      ? filteredSecrets.length
      : secretsQuery.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagedData = localMode ? filteredSecrets.slice((page - 1) * pageSize, page * pageSize) : filteredSecrets;

  // Stats
  const statsSource = localMode ? localSecrets : secretSource;
  const activeSecrets = statsSource.filter((s) => s.status === "active").length;
  const rotatedSecrets = statsSource.filter((s) => s.status === "rotated").length;
  const expiringSecrets = statsSource.filter((s) => {
    if (!s.expires_at || s.status !== "active") return false;
    const expiresAt = new Date(s.expires_at);
    const now = new Date();
    const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry <= 30;
  }).length;

  // Mutations
  const rotateSecretMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSecret) throw new Error("Please select a secret");

      if (localMode) {
        const next = localSecrets.map((sec) =>
          sec.id === selectedSecret.id
            ? {
                ...sec,
                status: "rotated" as const,
                updated_at: new Date().toISOString(),
              }
            : sec
        ) as unknown as Secret[];
        setLocalSecrets(next);
        return { secret: next.find((sec) => sec.id === selectedSecret.id)! };
      }

      return adminApi.security.secrets.rotate(selectedSecret.id, { reason: reasonDraft });
    },
    onSuccess: () => {
      toast.success("Secret rotated");
      queryClient.invalidateQueries({ queryKey: ["admin", "secrets"] });
      setDetailModalOpen(false);
      setConfirmActionOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Rotation failed");
    },
  });

  const disableSecretMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSecret) throw new Error("Please select a secret");

      if (localMode) {
        const next = localSecrets.map((sec) =>
          sec.id === selectedSecret.id
            ? {
                ...sec,
                status: "disabled" as const,
                updated_at: new Date().toISOString(),
              }
            : sec
        ) as unknown as Secret[];
        setLocalSecrets(next);
        return { secret: next.find((sec) => sec.id === selectedSecret.id)! };
      }

      return adminApi.security.secrets.disable(selectedSecret.id, { reason: reasonDraft });
    },
    onSuccess: () => {
      toast.success("Secret disabled");
      queryClient.invalidateQueries({ queryKey: ["admin", "secrets"] });
      setDetailModalOpen(false);
      setConfirmActionOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Disable failed");
    },
  });

  const isExpiringSoon = (secret: Secret) => {
    if (!secret.expires_at || secret.status !== "active") return false;
    const expiresAt = new Date(secret.expires_at);
    const now = new Date();
    const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry <= 30;
  };

  return (
    <PageContainer>
      <PageHeader
        title="Secrets Management"
        description="Manage system secrets, API keys, and encryption credentials."
        icon={<Key className="w-4 h-4" />}
      />

      <div className="page-grid grid-cols-1 sm:grid-cols-3">
        <StatsCard
          icon={<Shield className="w-4 h-4" />}
          title="Active Secrets"
          value={activeSecrets.toString()}
          subtitle="in use"
        />
        <StatsCard
          icon={<RotateCcw className="w-4 h-4" />}
          title="Rotated"
          value={rotatedSecrets.toString()}
          subtitle="pending cleanup"
        />
        <StatsCard
          icon={<Clock className="w-4 h-4" />}
          title="Expiring Soon"
          value={expiringSecrets.toString()}
          subtitle="within 30 days"
          trend={expiringSecrets > 0 ? { value: expiringSecrets, isPositive: false } : undefined}
        />
      </div>

      <SettingsSection
        title="Secrets List"
        description="View and manage all system secrets."
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="Search secret name or prefix"
              leftIcon={<Search className="w-3.5 h-3.5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">Scope</span>
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value)}
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              {SCOPE_OPTIONS.map((scope) => (
                <option key={scope} value={scope}>
                  {SCOPE_LABELS[scope]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          <Badge variant="outline" size="sm">
            {total} total
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key Prefix</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Expires At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {secretsQuery.isPending && !localMode ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-[12px] text-foreground-muted">
                  Loading...
                </TableCell>
              </TableRow>
            ) : pagedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-[12px] text-foreground-muted">
                  {secretsQuery.error && !localMode
                    ? "Failed to load. Please check API or permission settings."
                    : "No secrets found"}
                </TableCell>
              </TableRow>
            ) : (
              pagedData.map((sec) => (
                <TableRow key={sec.id}>
                  <TableCell>
                    <div className="text-[12px] font-medium text-foreground">
                      {sec.name}
                    </div>
                    {sec.description && (
                      <div className="text-[11px] text-foreground-muted mt-0.5 max-w-[200px] truncate">
                        {sec.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-[11px] font-mono text-foreground-light bg-surface-100 px-1.5 py-0.5 rounded">
                      {sec.key_prefix}***
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" size="sm">
                      {SCOPE_LABELS[sec.scope as keyof typeof SCOPE_LABELS] || sec.scope}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[sec.status] || "info"} size="sm">
                      {STATUS_LABELS[sec.status as keyof typeof STATUS_LABELS] || sec.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {sec.last_used_at ? formatRelativeTime(sec.last_used_at) : "Never used"}
                  </TableCell>
                  <TableCell>
                    {sec.expires_at ? (
                      <div className="flex items-center gap-1">
                        {isExpiringSoon(sec) && (
                          <AlertTriangle className="w-3 h-3 text-warning-default" />
                        )}
                        <span
                          className={cn(
                            "text-[12px]",
                            isExpiringSoon(sec) ? "text-warning-default" : "text-foreground-muted"
                          )}
                        >
                          {new Date(sec.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[12px] text-foreground-muted">Never expires</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {sec.status === "active" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSecret(sec);
                              setActionType("rotate");
                              setReasonDraft("");
                              setDetailModalOpen(true);
                            }}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSecret(sec);
                              setActionType("disable");
                              setReasonDraft("");
                              setDetailModalOpen(true);
                            }}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
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
          <DialogHeader
            icon={actionType === "rotate" ? <RotateCcw className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            iconVariant={actionType === "rotate" ? "warning" : "error"}
          >
            <DialogTitle>
              {actionType === "rotate" ? "Rotate Secret" : "Disable Secret"}
            </DialogTitle>
            <DialogDescription>
              {selectedSecret?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedSecret && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="grid gap-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Key Prefix</span>
                    <code className="font-mono text-foreground">{selectedSecret.key_prefix}***</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Scope</span>
                    <Badge variant="outline" size="sm">
                      {SCOPE_LABELS[selectedSecret.scope as keyof typeof SCOPE_LABELS]}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Status</span>
                    <Badge variant={STATUS_BADGE[selectedSecret.status]} size="sm">
                      {STATUS_LABELS[selectedSecret.status as keyof typeof STATUS_LABELS]}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Last Used</span>
                    <span className="text-foreground">
                      {selectedSecret.last_used_at ? formatRelativeTime(selectedSecret.last_used_at) : "Never used"}
                    </span>
                  </div>
                </div>
              </div>

              <div className={cn(
                "flex items-start gap-2 p-3 rounded-md border",
                actionType === "rotate"
                  ? "bg-warning-default/10 border-warning-default/20"
                  : "bg-error-default/10 border-error-default/20"
              )}>
                <AlertTriangle className={cn(
                  "w-4 h-4 shrink-0 mt-0.5",
                  actionType === "rotate" ? "text-warning-default" : "text-error-default"
                )} />
                <div className="text-[12px] text-foreground-light">
                  {actionType === "rotate"
                    ? "Rotating will generate a new secret value and mark the old one as rotated. Ensure all services using this secret have updated their configuration."
                    : "Disabling this secret will reject all requests using it. This action is irreversible."}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="text-[12px] font-medium text-foreground mb-3">Reason</div>
                <textarea
                  value={reasonDraft}
                  onChange={(e) => setReasonDraft(e.target.value)}
                  rows={2}
                  placeholder="Enter reason for this action"
                  className={cn(
                    "w-full rounded-md border border-border bg-surface-100 px-3 py-2",
                    "text-[12px] text-foreground placeholder:text-foreground-muted",
                    "focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                  )}
                />

                <div className="flex items-center justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDetailModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant={actionType === "disable" ? "destructive" : "default"}
                    size="sm"
                    disabled={!canManage}
                    onClick={() => setConfirmActionOpen(true)}
                  >
                    {actionType === "rotate" ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        Confirm Rotation
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Confirm Disable
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter />
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <AlertDialog
        open={confirmActionOpen}
        onOpenChange={setConfirmActionOpen}
        type={actionType === "rotate" ? "warning" : "error"}
        title={actionType === "rotate" ? "Confirm Secret Rotation?" : "Confirm Secret Disable?"}
        description={
          actionType === "rotate"
            ? "After rotation, the old secret will no longer be valid. Ensure all related service configurations have been updated."
            : "After disabling, this secret will be permanently invalidated. All requests using it will be rejected."
        }
        confirmText="Confirm"
        cancelText="Cancel"
        loading={rotateSecretMutation.isPending || disableSecretMutation.isPending}
        onConfirm={() => {
          if (actionType === "rotate") {
            rotateSecretMutation.mutate();
          } else {
            disableSecretMutation.mutate();
          }
        }}
      />
    </PageContainer>
  );
}
