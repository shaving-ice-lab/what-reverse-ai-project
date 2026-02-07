"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  MessageSquare,
  Search,
  Archive,
  MoreHorizontal,
  User,
  Building2,
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
import { conversationRows } from "@/lib/mock-data";
import { adminApi } from "@/lib/api/admin";
import { isLocalModeEnabled } from "@/lib/env";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Conversation, ConversationStatus } from "@/types/admin";
import { usePermission } from "@/hooks/usePermission";

const STATUS_OPTIONS = ["all", "active", "archived", "deleted"] as const;
const STATUS_LABELS: Record<(typeof STATUS_OPTIONS)[number], string> = {
  all: "All Statuses",
  active: "Active",
  archived: "Archived",
  deleted: "Deleted",
};

const STATUS_BADGE_MAP: Record<ConversationStatus, "success" | "warning" | "info" | "error"> = {
  active: "success",
  archived: "warning",
  deleted: "error",
};

export default function ConversationsPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canManage = hasPermission("conversations.manage");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [localConversations, setLocalConversations] = useState<Conversation[]>(
    () => conversationRows as unknown as Conversation[]
  );

  const apiParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: statusFilter === "all" ? "" : statusFilter,
      page,
      page_size: pageSize,
    }),
    [page, pageSize, search, statusFilter]
  );

  const conversationsQuery = useQuery({
    queryKey: ["admin", "conversations", apiParams],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.conversations.list(apiParams),
  });

  const filteredLocalConversations = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return localConversations.filter((conv) => {
      const matchesSearch =
        !normalized ||
        conv.title?.toLowerCase().includes(normalized) ||
        conv.id.toLowerCase().includes(normalized) ||
        conv.user?.email?.toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === "all" || conv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [localConversations, search, statusFilter]);

  const localTotal = filteredLocalConversations.length;
  const localTotalPages = Math.max(1, Math.ceil(localTotal / pageSize));
  const localPagedConversations = filteredLocalConversations.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const rows = localMode ? localPagedConversations : conversationsQuery.data?.items || [];
  const total = localMode ? localTotal : conversationsQuery.data?.total || 0;
  const totalPages = localMode ? localTotalPages : Math.max(1, Math.ceil(total / pageSize));

  const [manageOpen, setManageOpen] = useState(false);
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [statusDraft, setStatusDraft] = useState<ConversationStatus>("active");
  const [reasonDraft, setReasonDraft] = useState("");

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConversation) throw new Error("Please select a conversation");

      if (localMode) {
        const next = localConversations.map((conv) =>
          conv.id === selectedConversation.id ? { ...conv, status: statusDraft } : conv
        );
        setLocalConversations(next);
        return { conversation: { ...selectedConversation, status: statusDraft } as Conversation };
      }

      return adminApi.conversations.updateStatus(selectedConversation.id, {
        status: statusDraft,
        reason: reasonDraft,
      });
    },
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "conversations"] });
      setManageOpen(false);
      setConfirmArchiveOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Conversation Management"
        description="View and manage all AI conversation records."
        icon={<MessageSquare className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Export List
            </Button>
          </div>
        }
      />

      <SettingsSection
        title="Conversation List"
        description="Filter by title, user, or status."
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="Search by title, ID, or user email"
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
          <Badge variant="outline" size="sm">
            {total} total
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Conversation</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Workspace</TableHead>
              <TableHead>Messages</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversationsQuery.isPending && !localMode ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  {conversationsQuery.error && !localMode
                    ? "Failed to load. Please check API or permission configuration."
                    : "No matching conversations"}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((conv) => (
                <TableRow key={conv.id}>
                  <TableCell>
                    <div className="text-[12px] font-medium text-foreground">
                      {conv.title || "Untitled Conversation"}
                    </div>
                    <div className="text-[11px] text-foreground-muted font-mono">
                      {conv.id.slice(0, 16)}...
                    </div>
                  </TableCell>
                  <TableCell>
                    {conv.user ? (
                      <Link
                        href={`/users/${conv.user.id}`}
                        className="text-[12px] text-foreground hover:text-brand-500 transition-colors"
                      >
                        {conv.user.email}
                      </Link>
                    ) : (
                      <span className="text-[12px] text-foreground-muted">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {conv.workspace ? (
                      <Link
                        href={`/workspaces/${conv.workspace.id}`}
                        className="text-[12px] text-foreground hover:text-brand-500 transition-colors"
                      >
                        {conv.workspace.name}
                      </Link>
                    ) : (
                      <span className="text-[12px] text-foreground-muted">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-light">
                    {conv.message_count}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" size="sm">
                      {conv.model || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_MAP[conv.status]} size="sm">
                      {STATUS_LABELS[conv.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {conv.last_message_at ? formatRelativeTime(conv.last_message_at) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedConversation(conv);
                        setStatusDraft(conv.status);
                        setReasonDraft("");
                        setManageOpen(true);
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
          <DialogHeader icon={<MessageSquare className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>Conversation Management</DialogTitle>
            <DialogDescription>
              {selectedConversation?.title || "Untitled Conversation"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {selectedConversation && (
              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="grid gap-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Status</span>
                    <Badge variant={STATUS_BADGE_MAP[selectedConversation.status]} size="sm">
                      {STATUS_LABELS[selectedConversation.status]}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Messages</span>
                    <span className="text-foreground">{selectedConversation.message_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Model</span>
                    <span className="text-foreground">{selectedConversation.model || "-"}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-border bg-surface-75 p-4">
              <div className="text-[12px] font-medium text-foreground mb-3">Status Management</div>
              <div className="grid gap-2 sm:grid-cols-[160px_1fr] items-start">
                <select
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value as ConversationStatus)}
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
                    rows={2}
                    placeholder="Reason (optional)"
                    className={cn(
                      "w-full rounded-md border border-border bg-surface-100 px-3 py-2",
                      "text-[12px] text-foreground placeholder:text-foreground-muted",
                      "focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                    )}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setManageOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant={statusDraft === "deleted" ? "warning" : "default"}
                      size="sm"
                      disabled={!canManage}
                      onClick={() => setConfirmArchiveOpen(true)}
                    >
                      Submit Changes
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
        open={confirmArchiveOpen}
        onOpenChange={setConfirmArchiveOpen}
        type={statusDraft === "deleted" ? "warning" : "info"}
        title={
          statusDraft === "deleted"
            ? "Confirm delete this conversation?"
            : statusDraft === "archived"
            ? "Confirm archive this conversation?"
            : "Confirm status update?"
        }
        description={
          statusDraft === "deleted"
            ? "Data will be removed after deletion. This action cannot be undone."
            : "Confirm conversation status update."
        }
        confirmText="Confirm"
        cancelText="Cancel"
        loading={updateStatusMutation.isPending}
        onConfirm={() => updateStatusMutation.mutate()}
      />
    </PageContainer>
  );
}
