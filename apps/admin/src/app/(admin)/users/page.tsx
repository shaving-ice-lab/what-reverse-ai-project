"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckSquare, Search, Square, UserCog, Users } from "lucide-react";
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
  ConfirmDialog,
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
import { userRows } from "@/lib/mock-data";
import { adminApi } from "@/lib/api/admin";
import { isLocalModeEnabled } from "@/lib/env";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { AdminUserRole, AdminUserStatus } from "@/types/admin";
import type { User } from "@/types/auth";
import { useAdminCapabilities } from "@/contexts/admin-capabilities";

const ROLE_OPTIONS = ["all", "admin", "creator", "user"] as const;
const ROLE_LABELS: Record<(typeof ROLE_OPTIONS)[number], string> = {
  all: "All Roles",
  admin: "Admin",
  creator: "Creator",
  user: "User",
};

const STATUS_OPTIONS = ["all", "active", "suspended"] as const;
const STATUS_LABELS: Record<(typeof STATUS_OPTIONS)[number], string> = {
  all: "All Statuses",
  active: "Active",
  suspended: "Suspended",
};

export default function UsersPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();
  const { hasCapability } = useAdminCapabilities();
  const canManage = hasCapability("users.manage");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<(typeof ROLE_OPTIONS)[number]>("all");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [localUsers, setLocalUsers] = useState<User[]>(() => userRows as unknown as User[]);

  // Batch selection state
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [batchStatusOpen, setBatchStatusOpen] = useState(false);
  const [batchRoleOpen, setBatchRoleOpen] = useState(false);
  const [batchStatusDraft, setBatchStatusDraft] = useState<AdminUserStatus>("suspended");
  const [batchRoleDraft, setBatchRoleDraft] = useState<AdminUserRole>("user");
  const [batchReasonDraft, setBatchReasonDraft] = useState("");

  const apiParams = useMemo<{
    search?: string;
    role?: "" | AdminUserRole;
    status?: "" | AdminUserStatus;
    page?: number;
    page_size?: number;
  }>(
    () => ({
      search: search.trim() || undefined,
      role: roleFilter === "all" ? "" : (roleFilter as AdminUserRole),
      status: statusFilter === "all" ? "" : (statusFilter as AdminUserStatus),
      page,
      page_size: pageSize,
    }),
    [page, pageSize, roleFilter, search, statusFilter]
  );

  const usersQuery = useQuery({
    queryKey: ["admin", "users", apiParams],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.users.list(apiParams),
  });

  const filteredLocalUsers = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return localUsers.filter((user) => {
      const matchesSearch =
        !normalized ||
        user.email.toLowerCase().includes(normalized) ||
        user.id.toLowerCase().includes(normalized) ||
        user.username?.toLowerCase?.().includes(normalized);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [localUsers, roleFilter, search, statusFilter]);

  const localTotal = filteredLocalUsers.length;
  const localTotalPages = Math.max(1, Math.ceil(localTotal / pageSize));
  const localPagedUsers = filteredLocalUsers.slice((page - 1) * pageSize, page * pageSize);

  const rows = localMode ? localPagedUsers : usersQuery.data?.items || [];
  const total = localMode ? localTotal : usersQuery.data?.total || 0;
  const totalPages = localMode ? localTotalPages : Math.max(1, Math.ceil(total / pageSize));

  const [manageOpen, setManageOpen] = useState(false);
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleDraft, setRoleDraft] = useState<AdminUserRole>("user");
  const [statusDraft, setStatusDraft] = useState<AdminUserStatus>("active");
  const [reasonDraft, setReasonDraft] = useState("");

  useEffect(() => {
    setPage(1);
    setSelectedUserIds(new Set());
  }, [search, roleFilter, statusFilter, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Batch selection helpers
  const allRowsSelected = rows.length > 0 && rows.every((user) => selectedUserIds.has(user.id));
  const someRowsSelected = rows.some((user) => selectedUserIds.has(user.id));

  const toggleSelectAll = () => {
    if (allRowsSelected) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(rows.map((user) => user.id)));
    }
  };

  const toggleSelectUser = (userId: string) => {
    const newSet = new Set(selectedUserIds);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedUserIds(newSet);
  };

  const selectedUsers = useMemo(() => {
    return rows.filter((user) => selectedUserIds.has(user.id));
  }, [rows, selectedUserIds]);

  const updateRoleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) throw new Error("Please select a user");
      if (localMode) {
        const next = localUsers.map((u) =>
          u.id === selectedUser.id ? { ...u, role: roleDraft } : u
        );
        setLocalUsers(next);
        return { user: { ...selectedUser, role: roleDraft } as User };
      }
      return adminApi.users.updateRole(selectedUser.id, { role: roleDraft });
    },
    onSuccess: () => {
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setManageOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) throw new Error("Please select a user");
      const reason = reasonDraft.trim();
      if (statusDraft === "suspended" && !reason) {
        throw new Error("A reason is required when suspending a user");
      }

      if (localMode) {
        const next = localUsers.map((u) =>
          u.id === selectedUser.id
            ? {
                ...u,
                status: statusDraft,
                status_reason: reason || null,
                status_updated_at: new Date().toISOString(),
              }
            : u
        );
        setLocalUsers(next);
        return {
          user: {
            ...selectedUser,
            status: statusDraft,
            status_reason: reason || null,
            status_updated_at: new Date().toISOString(),
          } as User,
        };
      }

      return adminApi.users.updateStatus(selectedUser.id, {
        status: statusDraft,
        reason,
      });
    },
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setManageOpen(false);
      setConfirmStatusOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    },
  });

  // Batch mutations
  const batchUpdateStatusMutation = useMutation({
    mutationFn: async () => {
      const userIds = Array.from(selectedUserIds);
      if (userIds.length === 0) throw new Error("Please select users");
      const reason = batchReasonDraft.trim();
      if (batchStatusDraft === "suspended" && !reason) {
        throw new Error("A reason is required when batch suspending users");
      }

      if (localMode) {
        const next = localUsers.map((u) =>
          userIds.includes(u.id)
            ? {
                ...u,
                status: batchStatusDraft,
                status_reason: reason || null,
                status_updated_at: new Date().toISOString(),
              }
            : u
        );
        setLocalUsers(next);
        return { updated: userIds.length, failed: [] };
      }

      return adminApi.users.batchUpdateStatus({
        user_ids: userIds,
        status: batchStatusDraft,
        reason,
      });
    },
    onSuccess: (data) => {
      const count = data?.updated || selectedUserIds.size;
      toast.success(`Batch ${batchStatusDraft === "suspended" ? "suspended" : "restored"} ${count} users`);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setBatchStatusOpen(false);
      setSelectedUserIds(new Set());
      setBatchReasonDraft("");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Batch status update failed");
    },
  });

  const batchUpdateRoleMutation = useMutation({
    mutationFn: async () => {
      const userIds = Array.from(selectedUserIds);
      if (userIds.length === 0) throw new Error("Please select users");

      if (localMode) {
        const next = localUsers.map((u) =>
          userIds.includes(u.id)
            ? { ...u, role: batchRoleDraft }
            : u
        );
        setLocalUsers(next);
        return { updated: userIds.length, failed: [] };
      }

      return adminApi.users.batchUpdateRole({
        user_ids: userIds,
        role: batchRoleDraft,
      });
    },
    onSuccess: (data) => {
      const count = data?.updated || selectedUserIds.size;
      toast.success(`Batch updated ${count} users' role to ${ROLE_LABELS[batchRoleDraft]}`);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setBatchRoleOpen(false);
      setSelectedUserIds(new Set());
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Batch role update failed");
    },
  });

  return (
    <PageContainer>
      <PageHeader
        title="User Management"
        description="View user status, roles, and recent activity."
        icon={<Users className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Export Users
            </Button>
            <Button size="sm" disabled>
              Add Admin
            </Button>
          </div>
        }
      />

      <SettingsSection
        title="User List"
        description="Filter by email, role, and status."
        footer={
          selectedUserIds.size > 0 ? (
            <div className="flex items-center gap-2">
              <Badge variant="info" size="sm">
                {selectedUserIds.size} users selected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBatchStatusDraft("suspended");
                  setBatchStatusOpen(true);
                }}
              >
                Batch Suspend
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBatchStatusDraft("active");
                  setBatchStatusOpen(true);
                }}
              >
                Batch Restore
              </Button>
              <Button
                size="sm"
                onClick={() => setBatchRoleOpen(true)}
              >
                Assign Role
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUserIds(new Set())}
              >
                Deselect
              </Button>
            </div>
          ) : (
            <div className="text-[12px] text-foreground-muted">
              Select users for batch operations
            </div>
          )
        }
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="Search email or ID"
              leftIcon={<Search className="w-3.5 h-3.5" />}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">Role</span>
            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as (typeof ROLE_OPTIONS)[number])
              }
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
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
          <Badge variant="outline" size="sm">
            {total} total
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="p-1 rounded hover:bg-surface-200 transition-colors"
                  aria-label={allRowsSelected ? "Deselect All" : "Select All"}
                >
                  {allRowsSelected ? (
                    <CheckSquare className="w-4 h-4 text-brand-500" />
                  ) : someRowsSelected ? (
                    <CheckSquare className="w-4 h-4 text-foreground-muted" />
                  ) : (
                    <Square className="w-4 h-4 text-foreground-muted" />
                  )}
                </button>
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersQuery.isPending && !localMode ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  {usersQuery.error && !localMode
                    ? "Failed to load. Check API or permission settings."
                    : "No matching users"}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((user) => (
                <TableRow
                  key={user.id}
                  className={cn(
                    selectedUserIds.has(user.id) && "bg-brand-500/5"
                  )}
                >
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => toggleSelectUser(user.id)}
                      className="p-1 rounded hover:bg-surface-200 transition-colors"
                      aria-label={selectedUserIds.has(user.id) ? "Deselect" : "Select"}
                    >
                      {selectedUserIds.has(user.id) ? (
                        <CheckSquare className="w-4 h-4 text-brand-500" />
                      ) : (
                        <Square className="w-4 h-4 text-foreground-muted" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/users/${user.id}`}
                      className="text-[12px] font-medium text-foreground hover:text-brand-500 transition-colors"
                    >
                      {user.email}
                    </Link>
                    <div className="text-[11px] text-foreground-muted">{user.id}</div>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-light">
                    {user.role}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.status === "active" ? "success" : "warning"}
                      size="sm"
                    >
                      {user.status === "active" ? "Active" : "Suspended"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {user.last_login_at ? formatRelativeTime(user.last_login_at) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!canManage}
                      onClick={() => {
                        setSelectedUser(user);
                        setRoleDraft((user.role as AdminUserRole) || "user");
                        setStatusDraft((user.status as AdminUserStatus) || "active");
                        setReasonDraft("");
                        setManageOpen(true);
                      }}
                    >
                      <UserCog className="w-4 h-4" />
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

      {/* Single User Manage Dialog */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent size="lg">
          <DialogHeader icon={<UserCog className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>User Management</DialogTitle>
            <DialogDescription>
              {selectedUser?.email ? (
                <span className="text-foreground-light">
                  {selectedUser.email}{" "}
                  <span className="text-foreground-muted">({selectedUser.id})</span>
                </span>
              ) : (
                "Adjust user role and status."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="rounded-lg border border-border bg-surface-75 p-4">
              <div className="text-[12px] font-medium text-foreground mb-3">
                Role
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={roleDraft}
                  onChange={(e) => setRoleDraft(e.target.value as AdminUserRole)}
                  className="h-8 rounded-md border border-border bg-surface-100 px-2 text-[12px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                >
                  {ROLE_OPTIONS.filter((r) => r !== "all").map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  loading={updateRoleMutation.isPending}
                  loadingText="Updating..."
                  onClick={() => updateRoleMutation.mutate()}
                >
                  Update Role
                </Button>
              </div>
              <div className="mt-2 text-[11px] text-foreground-muted">
                Backend currently allows: <code>user</code> / <code>admin</code> / <code>creator</code>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-surface-75 p-4">
              <div className="text-[12px] font-medium text-foreground mb-3">
                Status
              </div>
              <div className="grid gap-2 sm:grid-cols-[160px_1fr] items-start">
                <select
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value as AdminUserStatus)}
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
                    placeholder="Reason (required for suspension)"
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
                      variant={statusDraft === "suspended" ? "warning" : "default"}
                      size="sm"
                      onClick={() => setConfirmStatusOpen(true)}
                      disabled={updateStatusMutation.isPending}
                    >
                      Submit Status Change
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmStatusOpen}
        onOpenChange={setConfirmStatusOpen}
        type={statusDraft === "suspended" ? "warning" : "info"}
        title={statusDraft === "suspended" ? "Confirm suspend this user?" : "Confirm restore this user?"}
        description={
          statusDraft === "suspended"
            ? `The user will be suspended. Reason: ${reasonDraft.trim() || "(not provided)"}`
            : "The user will be restored to active status."
        }
        confirmText="Confirm"
        cancelText="Cancel"
        loading={updateStatusMutation.isPending}
        onConfirm={() => updateStatusMutation.mutate()}
      />

      {/* Batch Status Dialog */}
      <ConfirmDialog
        open={batchStatusOpen}
        onOpenChange={setBatchStatusOpen}
        title={`Batch ${batchStatusDraft === "suspended" ? "Suspend" : "Restore"} Users`}
        description={`This will ${batchStatusDraft === "suspended" ? "suspend" : "restore"} ${selectedUserIds.size} selected users.`}
        confirmLabel={`Confirm ${batchStatusDraft === "suspended" ? "Suspend" : "Restore"}`}
        onConfirm={() => batchUpdateStatusMutation.mutate()}
        isLoading={batchUpdateStatusMutation.isPending}
        variant={batchStatusDraft === "suspended" ? "warning" : "default"}
      >
        <div className="space-y-4 py-2">
          <div className="text-[12px] text-foreground-muted">
            Selected users:
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1 rounded-lg border border-border bg-surface-75 p-3">
            {selectedUsers.map((user) => (
              <div key={user.id} className="text-[11px] text-foreground-light">
                {user.email}
              </div>
            ))}
          </div>
          {batchStatusDraft === "suspended" && (
            <div className="space-y-1">
              <label className="text-[12px] text-foreground">Suspension Reason (required)</label>
              <Input
                value={batchReasonDraft}
                onChange={(e) => setBatchReasonDraft(e.target.value)}
                placeholder="Enter reason for batch suspension..."
              />
            </div>
          )}
        </div>
      </ConfirmDialog>

      {/* Batch Role Dialog */}
      <ConfirmDialog
        open={batchRoleOpen}
        onOpenChange={setBatchRoleOpen}
        title="Batch Assign Role"
        description={`This will change the role for ${selectedUserIds.size} selected users.`}
        confirmLabel="Confirm Assignment"
        onConfirm={() => batchUpdateRoleMutation.mutate()}
        isLoading={batchUpdateRoleMutation.isPending}
      >
        <div className="space-y-4 py-2">
          <div className="text-[12px] text-foreground-muted">
            Selected users:
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1 rounded-lg border border-border bg-surface-75 p-3">
            {selectedUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between text-[11px]">
                <span className="text-foreground-light">{user.email}</span>
                <Badge variant="outline" size="sm">{user.role}</Badge>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <label className="text-[12px] text-foreground">Target Role</label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.filter((r) => r !== "all").map((role) => (
                <Button
                  key={role}
                  type="button"
                  variant={batchRoleDraft === role ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBatchRoleDraft(role as AdminUserRole)}
                >
                  {ROLE_LABELS[role]}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </ConfirmDialog>
    </PageContainer>
  );
}
