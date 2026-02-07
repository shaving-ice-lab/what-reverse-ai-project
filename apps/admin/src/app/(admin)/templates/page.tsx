"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FileText,
  Search,
  Star,
  StarOff,
  MoreHorizontal,
  Globe,
  Lock,
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
import { templateRows } from "@/lib/mock-data";
import { adminApi } from "@/lib/api/admin";
import { isLocalModeEnabled } from "@/lib/env";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Template, TemplateStatus } from "@/types/admin";
import { usePermission } from "@/hooks/usePermission";

const STATUS_OPTIONS = ["all", "draft", "published", "featured", "archived"] as const;
const STATUS_LABELS: Record<(typeof STATUS_OPTIONS)[number], string> = {
  all: "All Statuses",
  draft: "Draft",
  published: "Published",
  featured: "Featured",
  archived: "Archived",
};

const STATUS_BADGE_MAP: Record<TemplateStatus, "success" | "warning" | "info" | "error"> = {
  draft: "info",
  published: "success",
  featured: "warning",
  archived: "error",
};

const CATEGORY_LABELS: Record<string, string> = {
  product: "Product",
  marketing: "Marketing",
  communication: "Communication",
  analytics: "Analytics",
  other: "Other",
};

export default function TemplatesPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canEdit = hasPermission("templates.write");
  const canApprove = hasPermission("templates.approve");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [localTemplates, setLocalTemplates] = useState<Template[]>(
    () => templateRows as unknown as Template[]
  );

  const apiParams = useMemo<{
    search?: string;
    status?: "" | TemplateStatus;
    page?: number;
    page_size?: number;
  }>(
    () => ({
      search: search.trim() || undefined,
      status: statusFilter === "all" ? "" : (statusFilter as TemplateStatus),
      page,
      page_size: pageSize,
    }),
    [page, pageSize, search, statusFilter]
  );

  const templatesQuery = useQuery({
    queryKey: ["admin", "templates", apiParams],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.templates.list(apiParams),
  });

  const filteredLocalTemplates = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return localTemplates.filter((tmpl) => {
      const matchesSearch =
        !normalized ||
        tmpl.name.toLowerCase().includes(normalized) ||
        tmpl.slug.toLowerCase().includes(normalized) ||
        tmpl.id.toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === "all" || tmpl.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [localTemplates, search, statusFilter]);

  const localTotal = filteredLocalTemplates.length;
  const localTotalPages = Math.max(1, Math.ceil(localTotal / pageSize));
  const localPagedTemplates = filteredLocalTemplates.slice((page - 1) * pageSize, page * pageSize);

  const rows = localMode ? localPagedTemplates : templatesQuery.data?.items || [];
  const total = localMode ? localTotal : templatesQuery.data?.total || 0;
  const totalPages = localMode ? localTotalPages : Math.max(1, Math.ceil(total / pageSize));

  const [manageOpen, setManageOpen] = useState(false);
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [statusDraft, setStatusDraft] = useState<TemplateStatus>("draft");
  const [reasonDraft, setReasonDraft] = useState("");

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate) throw new Error("Please select a template");

      if (localMode) {
        const next = localTemplates.map((tmpl) =>
          tmpl.id === selectedTemplate.id ? { ...tmpl, status: statusDraft } : tmpl
        );
        setLocalTemplates(next);
        return { template: { ...selectedTemplate, status: statusDraft } as Template };
      }

      return adminApi.templates.updateStatus(selectedTemplate.id, {
        status: statusDraft,
        reason: reasonDraft,
      });
    },
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "templates"] });
      setManageOpen(false);
      setConfirmStatusOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async (template: Template) => {
      if (localMode) {
        const next = localTemplates.map((tmpl) =>
          tmpl.id === template.id ? { ...tmpl, is_featured: !tmpl.is_featured } : tmpl
        );
        setLocalTemplates(next);
        return { template: { ...template, is_featured: !template.is_featured } as Template };
      }

      return adminApi.templates.setFeatured(template.id, {
        is_featured: !template.is_featured,
      });
    },
    onSuccess: (_, template) => {
      toast.success(template.is_featured ? "Removed from featured" : "Set as featured");
      queryClient.invalidateQueries({ queryKey: ["admin", "templates"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Operation failed");
    },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Template Management"
        description="Manage public and featured template library."
        icon={<FileText className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Export List
            </Button>
          </div>
        }
      />

      <SettingsSection
        title="Template List"
        description="Filter by name, status, and category."
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="Search name or slug"
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
              <TableHead>Template</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Usage Count</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templatesQuery.isPending && !localMode ? (
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
                  {templatesQuery.error && !localMode
                    ? "Failed to load. Check API or permission settings."
                    : "No matching templates"}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((tmpl) => (
                <TableRow key={tmpl.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {tmpl.is_featured && (
                        <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                      )}
                      <div>
                        <div className="text-[12px] font-medium text-foreground">{tmpl.name}</div>
                        <div className="text-[11px] text-foreground-muted">{tmpl.slug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" size="sm">
                      {CATEGORY_LABELS[tmpl.category] || tmpl.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {tmpl.is_public ? (
                        <>
                          <Globe className="w-3.5 h-3.5 text-success" />
                          <span className="text-[11px] text-success">Public</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-foreground-muted" />
                          <span className="text-[11px] text-foreground-muted">Private</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-light">
                    {tmpl.use_count.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-light">
                    {tmpl.rating ? `${tmpl.rating.toFixed(1)} ⭐` : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_MAP[tmpl.status]} size="sm">
                      {STATUS_LABELS[tmpl.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {formatRelativeTime(tmpl.updated_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!canApprove}
                        onClick={() => toggleFeaturedMutation.mutate(tmpl)}
                        title={tmpl.is_featured ? "Remove from featured" : "Set as featured"}
                      >
                        {tmpl.is_featured ? (
                          <StarOff className="w-4 h-4" />
                        ) : (
                          <Star className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!canEdit}
                        onClick={() => {
                          setSelectedTemplate(tmpl);
                          setStatusDraft(tmpl.status);
                          setReasonDraft("");
                          setManageOpen(true);
                        }}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
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

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent size="lg">
          <DialogHeader icon={<FileText className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>Template Management</DialogTitle>
            <DialogDescription>
              {selectedTemplate?.name || "Manage template status"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {selectedTemplate && (
              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="grid gap-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Status</span>
                    <Badge variant={STATUS_BADGE_MAP[selectedTemplate.status]} size="sm">
                      {STATUS_LABELS[selectedTemplate.status]}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Category</span>
                    <span className="text-foreground">
                      {CATEGORY_LABELS[selectedTemplate.category] || selectedTemplate.category}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Usage Count</span>
                    <span className="text-foreground">
                      {selectedTemplate.use_count.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Featured</span>
                    <span className="text-foreground">
                      {selectedTemplate.is_featured ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-border bg-surface-75 p-4">
              <div className="text-[12px] font-medium text-foreground mb-3">Status Management</div>
              <div className="grid gap-2 sm:grid-cols-[160px_1fr] items-start">
                <select
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value as TemplateStatus)}
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
                      variant={statusDraft === "archived" ? "warning" : "default"}
                      size="sm"
                      disabled={!canEdit}
                      onClick={() => setConfirmStatusOpen(true)}
                    >
                      Submit Change
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
        type={statusDraft === "archived" ? "warning" : "info"}
        title={
          statusDraft === "archived"
            ? "Confirm archive this template?"
            : "Confirm status update?"
        }
        description={
          statusDraft === "archived"
            ? "Once archived, the template will no longer appear in the public list."
            : "Confirm updating the template status."
        }
        confirmText="Confirm"
        cancelText="Cancel"
        loading={updateStatusMutation.isPending}
        onConfirm={() => updateStatusMutation.mutate()}
      />
    </PageContainer>
  );
}
