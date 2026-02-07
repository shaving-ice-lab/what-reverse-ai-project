"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Activity, Search, Settings2 } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { appRows } from "@/lib/mock-data";
import { adminApi } from "@/lib/api/admin";
import { useAdminCapabilities } from "@/contexts/admin-capabilities";
import { isLocalModeEnabled } from "@/lib/env";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { App } from "@/types/admin";

const STATUS_OPTIONS = ["all", "published", "draft", "deprecated", "archived", "suspended"] as const;
const STATUS_LABELS: Record<(typeof STATUS_OPTIONS)[number], string> = {
  all: "All Statuses",
  published: "Published",
  draft: "Draft",
  deprecated: "Deprecated",
  archived: "Archived",
  suspended: "Suspended",
};

export default function AppsPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();
  const { hasCapability } = useAdminCapabilities();
  const canManage = hasCapability("apps.manage");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [workspaceFilter, setWorkspaceFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [localApps, setLocalApps] = useState<App[]>(() => appRows as unknown as App[]);

  const apiParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: statusFilter === "all" ? "" : statusFilter,
      workspace_id: workspaceFilter === "all" ? "" : workspaceFilter,
      owner_id: ownerFilter === "all" ? "" : ownerFilter,
      page,
      page_size: pageSize,
    }),
    [ownerFilter, page, pageSize, search, statusFilter, workspaceFilter]
  );

  const appsQuery = useQuery({
    queryKey: ["admin", "apps", apiParams],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.apps.list(apiParams),
  });

  const workspaceOptions = useMemo(() => {
    const rows = localMode ? localApps : appsQuery.data?.items || [];
    const entries = new Map<string, string>();
    rows.forEach((app) => {
      const id = app.workspace_id;
      const label = app.workspace?.name || id;
      if (id && !entries.has(id)) entries.set(id, label);
    });
    return ["all", ...Array.from(entries.keys())];
  }, [appsQuery.data?.items, localApps, localMode]);

  const workspaceLabelMap = useMemo(() => {
    const rows = localMode ? localApps : appsQuery.data?.items || [];
    const map = new Map<string, string>();
    rows.forEach((app) => {
      const id = app.workspace_id;
      const label = app.workspace?.name || id;
      if (id && !map.has(id)) map.set(id, label);
    });
    return map;
  }, [appsQuery.data?.items, localApps, localMode]);

  const ownerOptions = useMemo(() => {
    const rows = localMode ? localApps : appsQuery.data?.items || [];
    const entries = new Map<string, string>();
    rows.forEach((app) => {
      const id = app.owner_user_id;
      const label = app.owner?.email || id;
      if (id && !entries.has(id)) entries.set(id, label);
    });
    return ["all", ...Array.from(entries.keys())];
  }, [appsQuery.data?.items, localApps, localMode]);

  const ownerLabelMap = useMemo(() => {
    const rows = localMode ? localApps : appsQuery.data?.items || [];
    const map = new Map<string, string>();
    rows.forEach((app) => {
      const id = app.owner_user_id;
      const label = app.owner?.email || id;
      if (id && !map.has(id)) map.set(id, label);
    });
    return map;
  }, [appsQuery.data?.items, localApps, localMode]);

  const filteredApps = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const source = localApps;
    return source.filter((app) => {
      const matchesSearch =
        !normalized ||
        app.name.toLowerCase().includes(normalized) ||
        app.id.toLowerCase().includes(normalized) ||
        app.slug?.toLowerCase?.().includes(normalized) ||
        app.workspace?.name?.toLowerCase?.().includes(normalized) ||
        app.owner?.email?.toLowerCase?.().includes(normalized);
      const matchesStatus = statusFilter === "all" || app.status === statusFilter;
      const matchesWorkspace = workspaceFilter === "all" || app.workspace_id === workspaceFilter;
      const matchesOwner = ownerFilter === "all" || app.owner_user_id === ownerFilter;
      return matchesSearch && matchesStatus && matchesWorkspace && matchesOwner;
    });
  }, [localApps, ownerFilter, search, statusFilter, workspaceFilter]);

  const localTotal = filteredApps.length;
  const localTotalPages = Math.max(1, Math.ceil(localTotal / pageSize));
  const localPagedApps = filteredApps.slice((page - 1) * pageSize, page * pageSize);

  const rows = localMode ? localPagedApps : appsQuery.data?.items || [];
  const total = localMode ? localTotal : appsQuery.data?.total || 0;
  const totalPages = localMode ? localTotalPages : Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, workspaceFilter, ownerFilter, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const [manageOpen, setManageOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [statusDraft, setStatusDraft] = useState<string>("draft");
  const [reasonDraft, setReasonDraft] = useState("");

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!selectedApp) throw new Error("Please select an app");
      const reason = reasonDraft.trim();
      if (["deprecated", "archived", "suspended"].includes(statusDraft) && !reason) {
        throw new Error("A reason is required for sensitive status changes");
      }

      if (localMode) {
        const next = localApps.map((app) =>
          app.id === selectedApp.id
            ? {
                ...app,
                status: statusDraft,
                status_reason: reason || null,
                status_updated_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : app
        );
        setLocalApps(next);
        return { app: { ...selectedApp, status: statusDraft } as App };
      }

      return adminApi.apps.updateStatus(selectedApp.id, {
        status: statusDraft,
        reason,
      });
    },
    onSuccess: () => {
      toast.success("App status updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "apps"] });
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
        title="App Management"
        description="View app status, workspace ownership, and version overview."
        icon={<Activity className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Batch Unpublish
            </Button>
            <Button size="sm">Create App</Button>
          </div>
        }
      />

      <SettingsSection title="App List" description="Filter by status and workspace.">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="Search app name"
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
            <span className="text-[11px] text-foreground-muted">Workspace</span>
            <select
              value={workspaceFilter}
              onChange={(event) => setWorkspaceFilter(event.target.value)}
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              {workspaceOptions.map((workspace) => (
                <option key={workspace} value={workspace}>
                  {workspace === "all"
                    ? "All Workspaces"
                    : workspaceLabelMap.get(workspace) || workspace}
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
          <Badge variant="outline" size="sm">
            {total} total
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>App</TableHead>
              <TableHead>Workspace</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appsQuery.isPending && !localMode ? (
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
                  {appsQuery.error && !localMode
                    ? "Failed to load. Check API or permission settings."
                    : "No matching apps"}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <Link
                      href={`/apps/${app.id}`}
                      className="text-[12px] font-medium text-foreground hover:text-brand-500 transition-colors"
                    >
                      {app.name}
                    </Link>
                    <div className="text-[11px] text-foreground-muted">{app.id}</div>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-light">
                    <div>{app.workspace?.name || app.workspace_id}</div>
                    <div className="text-[11px] text-foreground-muted">
                      {app.owner?.email || app.owner_user_id}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        app.status === "published"
                          ? "success"
                          : app.status === "draft"
                          ? "warning"
                          : app.status === "archived"
                          ? "secondary"
                          : "destructive"
                      }
                      size="sm"
                    >
                      {STATUS_LABELS[(app.status as typeof STATUS_OPTIONS[number]) || "all"] ||
                        app.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {app.updated_at ? formatRelativeTime(app.updated_at) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!canManage}
                      onClick={() => {
                        setSelectedApp(app);
                        setStatusDraft(app.status || "draft");
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
            <DialogTitle>App Management</DialogTitle>
            <DialogDescription>
              {selectedApp ? (
                <span className="text-foreground-light">
                  {selectedApp.name}{" "}
                  <span className="text-foreground-muted">({selectedApp.id})</span>
                </span>
              ) : (
                "Adjust app status."
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
                    placeholder="Reason (required for deprecate/archive/suspend)"
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
                      variant={["archived"].includes(statusDraft) ? "warning" : "default"}
                      size="sm"
                      onClick={() => setConfirmOpen(true)}
                      disabled={!canManage || updateStatusMutation.isPending}
                    >
                      Submit Status Change
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        type={["deprecated", "archived", "suspended"].includes(statusDraft) ? "warning" : "info"}
        title="Confirm status change?"
        description={`Update app status to: ${statusDraft}. Reason: ${reasonDraft.trim() || "(not provided)"}`}
        confirmText="Confirm"
        cancelText="Cancel"
        loading={updateStatusMutation.isPending}
        onConfirm={() => updateStatusMutation.mutate()}
      />
    </PageContainer>
  );
}
