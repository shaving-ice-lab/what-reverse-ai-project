"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, Search, Settings2 } from "lucide-react";
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
  AlertDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { workspaceRows } from "@/lib/mock-data";
import { adminApi } from "@/lib/api/admin";
import { useAdminCapabilities } from "@/contexts/admin-capabilities";
import { isLocalModeEnabled } from "@/lib/env";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Workspace } from "@/types/admin";

const STATUS_OPTIONS = ["all", "active", "suspended", "cold_storage", "deleted"] as const;
const STATUS_LABELS: Record<(typeof STATUS_OPTIONS)[number], string> = {
  all: "All Statuses",
  active: "Active",
  suspended: "Suspended",
  cold_storage: "Cold Storage",
  deleted: "Deleted",
};

export default function WorkspacesPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();
  const { hasCapability } = useAdminCapabilities();
  const canManage = hasCapability("workspaces.manage");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [localWorkspaces, setLocalWorkspaces] = useState<Workspace[]>(() => workspaceRows as unknown as Workspace[]);

  const apiParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: statusFilter === "all" ? "" : statusFilter,
      owner_id: ownerFilter === "all" ? "" : ownerFilter,
      include_deleted: includeDeleted,
      page,
      page_size: pageSize,
    }),
    [includeDeleted, ownerFilter, page, pageSize, search, statusFilter]
  );

  const workspacesQuery = useQuery({
    queryKey: ["admin", "workspaces", apiParams],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.workspaces.list(apiParams),
  });

  const ownerOptions = useMemo(() => {
    const rows = localMode ? localWorkspaces : workspacesQuery.data?.items || [];
    const entries = new Map<string, string>();
    rows.forEach((ws) => {
      const ownerId = ws.owner_user_id;
      const label = ws.owner?.email || ownerId;
      if (ownerId && !entries.has(ownerId)) entries.set(ownerId, label);
    });
    return ["all", ...Array.from(entries.keys())];
  }, [localMode, localWorkspaces, workspacesQuery.data?.items]);

  const ownerLabelMap = useMemo(() => {
    const rows = localMode ? localWorkspaces : workspacesQuery.data?.items || [];
    const map = new Map<string, string>();
    rows.forEach((ws) => {
      const ownerId = ws.owner_user_id;
      const label = ws.owner?.email || ownerId;
      if (ownerId && !map.has(ownerId)) map.set(ownerId, label);
    });
    return map;
  }, [localMode, localWorkspaces, workspacesQuery.data?.items]);

  const filteredWorkspaces = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const source = localWorkspaces;
    return source.filter((workspace) => {
      const matchesSearch =
        !normalized ||
        workspace.name.toLowerCase().includes(normalized) ||
        workspace.id.toLowerCase().includes(normalized) ||
        workspace.slug?.toLowerCase?.().includes(normalized) ||
        workspace.owner?.email?.toLowerCase?.().includes(normalized);
      const matchesStatus = statusFilter === "all" || workspace.status === statusFilter;
      const matchesOwner = ownerFilter === "all" || workspace.owner_user_id === ownerFilter;
      return matchesSearch && matchesStatus && matchesOwner;
    });
  }, [localWorkspaces, ownerFilter, search, statusFilter]);

  const localTotal = filteredWorkspaces.length;
  const localTotalPages = Math.max(1, Math.ceil(localTotal / pageSize));
  const localPagedWorkspaces = filteredWorkspaces.slice((page - 1) * pageSize, page * pageSize);

  const rows = localMode ? localPagedWorkspaces : workspacesQuery.data?.items || [];
  const total = localMode ? localTotal : workspacesQuery.data?.total || 0;
  const totalPages = localMode ? localTotalPages : Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, ownerFilter, includeDeleted, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const [manageOpen, setManageOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [statusDraft, setStatusDraft] = useState<string>("active");
  const [reasonDraft, setReasonDraft] = useState("");

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!selectedWorkspace) throw new Error("Please select a workspace");
      const reason = reasonDraft.trim();
      if (["suspended", "deleted", "cold_storage"].includes(statusDraft) && !reason) {
        throw new Error("A reason is required for sensitive status changes");
      }

      if (localMode) {
        const next = localWorkspaces.map((ws) =>
          ws.id === selectedWorkspace.id
            ? {
                ...ws,
                status: statusDraft,
                status_reason: reason || null,
                status_updated_at: new Date().toISOString(),
              }
            : ws
        );
        setLocalWorkspaces(next);
        return { workspace: { ...selectedWorkspace, status: statusDraft } as Workspace };
      }

      return adminApi.workspaces.updateStatus(selectedWorkspace.id, {
        status: statusDraft,
        reason,
      });
    },
    onSuccess: () => {
      toast.success("Workspace status updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "workspaces"] });
      setManageOpen(false);
      setConfirmOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Update failed");
    },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Workspace Management"
        description="View workspace status, plans, and member count."
        icon={<Building2 className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Export List
            </Button>
            <Button size="sm">Create Workspace</Button>
          </div>
        }
      />

      <SettingsSection title="Workspace List" description="Filter by owner and status.">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="Search workspace"
              leftIcon={<Search className="w-3.5 h-3.5" />}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">Status</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as (typeof STATUS_OPTIONS)[number])
              }
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">Owner</span>
            <select
              value={ownerFilter}
              onChange={(event) => setOwnerFilter(event.target.value)}
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              {ownerOptions.map((owner) => (
                <option key={owner} value={owner}>
                  {owner === "all" ? "All Owners" : ownerLabelMap.get(owner) || owner}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">Include Deleted</span>
            <Switch checked={includeDeleted} onCheckedChange={setIncludeDeleted} />
          </div>
          <Badge variant="outline" size="sm">
            {total} total
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workspace</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workspacesQuery.isPending && !localMode ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  {workspacesQuery.error && !localMode
                    ? "Failed to load. Check API or permission settings."
                    : "No matching workspaces"}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((workspace) => (
                <TableRow key={workspace.id}>
                  <TableCell>
                    <Link
                      href={`/workspaces/${workspace.id}`}
                      className="text-[12px] font-medium text-foreground hover:text-brand-500 transition-colors"
                    >
                      {workspace.name}
                    </Link>
                    <div className="text-[11px] text-foreground-muted">{workspace.id}</div>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-light">
                    <div className="text-[12px] text-foreground-light">
                      {workspace.owner?.email || workspace.owner_user_id}
                    </div>
                    <div className="text-[11px] text-foreground-muted">
                      {workspace.slug}
                    </div>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-light">
                    {workspace.plan}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        workspace.status === "active"
                          ? "success"
                          : workspace.status === "deleted"
                          ? "destructive"
                          : workspace.status === "cold_storage"
                          ? "secondary"
                          : "warning"
                      }
                      size="sm"
                    >
                      {STATUS_LABELS[(workspace.status as typeof STATUS_OPTIONS[number]) || "all"] ||
                        workspace.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!canManage}
                      onClick={() => {
                        setSelectedWorkspace(workspace);
                        setStatusDraft(workspace.status || "active");
                        setReasonDraft("");
                        setManageOpen(true);
                      }}
                    >
                      <Settings2 className="w-4 h-4" />
                      Manage
                    </Button>
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

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent size="lg">
          <DialogHeader icon={<Settings2 className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>Workspace Management</DialogTitle>
            <DialogDescription>
              {selectedWorkspace ? (
                <span className="text-foreground-light">
                  {selectedWorkspace.name}{" "}
                  <span className="text-foreground-muted">({selectedWorkspace.id})</span>
                </span>
              ) : (
                "Adjust workspace status."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-surface-75 p-4">
              <div className="text-[12px] font-medium text-foreground mb-3">
                Status
              </div>

              <div className="grid gap-2 sm:grid-cols-[220px_1fr] items-start">
                <select
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value)}
                  className="h-8 rounded-md border border-border bg-surface-100 px-2 text-[12px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                >
                  {STATUS_OPTIONS.filter((s) => s !== "all").map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>

                <div className="space-y-2">
                  <textarea
                    value={reasonDraft}
                    onChange={(e) => setReasonDraft(e.target.value)}
                    rows={3}
                    placeholder="Reason (required for suspend/delete/cold storage)"
                    className={cn(
                      "w-full rounded-md border border-border bg-surface-100 px-3 py-2",
                      "text-[12px] text-foreground placeholder:text-foreground-muted",
                      "focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                    )}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setManageOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant={["deleted"].includes(statusDraft) ? "destructive-fill" : "default"}
                      size="sm"
                      onClick={() => setConfirmOpen(true)}
                      disabled={!canManage || updateStatusMutation.isPending}
                    >
                      Submit Status Change
                    </Button>
                  </div>
                </div>
              </div>

              {selectedWorkspace?.status_updated_at ? (
                <div className="mt-3 text-[11px] text-foreground-muted">
                  Last changed: {formatRelativeTime(selectedWorkspace.status_updated_at)}
                </div>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        type={["deleted"].includes(statusDraft) ? "error" : "warning"}
        title="Confirm status change?"
        description={`Update workspace status to: ${statusDraft}. Reason: ${reasonDraft.trim() || "(not provided)"}`}
        confirmText="Confirm"
        cancelText="Cancel"
        loading={updateStatusMutation.isPending}
        onConfirm={() => updateStatusMutation.mutate()}
      />
    </PageContainer>
  );
}
