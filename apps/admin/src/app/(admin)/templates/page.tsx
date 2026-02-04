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
  all: "全部状态",
  draft: "草稿",
  published: "已发布",
  featured: "精选",
  archived: "已归档",
};

const STATUS_BADGE_MAP: Record<TemplateStatus, "success" | "warning" | "info" | "error"> = {
  draft: "info",
  published: "success",
  featured: "warning",
  archived: "error",
};

const CATEGORY_LABELS: Record<string, string> = {
  product: "产品",
  marketing: "营销",
  communication: "沟通",
  analytics: "分析",
  other: "其他",
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
      if (!selectedTemplate) throw new Error("请选择模板");

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
      toast.success("状态已更新");
      queryClient.invalidateQueries({ queryKey: ["admin", "templates"] });
      setManageOpen(false);
      setConfirmStatusOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "更新状态失败");
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
      toast.success(template.is_featured ? "已取消精选" : "已设为精选");
      queryClient.invalidateQueries({ queryKey: ["admin", "templates"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "操作失败");
    },
  });

  return (
    <PageContainer>
      <PageHeader
        title="模板管理"
        description="管理公开与精选模板库。"
        icon={<FileText className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              导出列表
            </Button>
          </div>
        }
      />

      <SettingsSection
        title="模板列表"
        description="支持按名称、状态、分类筛选。"
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="搜索名称或 Slug"
              leftIcon={<Search className="w-3.5 h-3.5" />}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">状态</span>
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
            共 {total} 条
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>模板</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>可见性</TableHead>
              <TableHead>使用次数</TableHead>
              <TableHead>评分</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templatesQuery.isPending && !localMode ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  正在加载...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  {templatesQuery.error && !localMode
                    ? "加载失败，请检查 API 或权限配置"
                    : "暂无匹配模板"}
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
                          <span className="text-[11px] text-success">公开</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-foreground-muted" />
                          <span className="text-[11px] text-foreground-muted">私有</span>
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
                        title={tmpl.is_featured ? "取消精选" : "设为精选"}
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
            <DialogTitle>模板管理</DialogTitle>
            <DialogDescription>
              {selectedTemplate?.name || "管理模板状态"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {selectedTemplate && (
              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="grid gap-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">状态</span>
                    <Badge variant={STATUS_BADGE_MAP[selectedTemplate.status]} size="sm">
                      {STATUS_LABELS[selectedTemplate.status]}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">分类</span>
                    <span className="text-foreground">
                      {CATEGORY_LABELS[selectedTemplate.category] || selectedTemplate.category}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">使用次数</span>
                    <span className="text-foreground">
                      {selectedTemplate.use_count.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">精选</span>
                    <span className="text-foreground">
                      {selectedTemplate.is_featured ? "是" : "否"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-border bg-surface-75 p-4">
              <div className="text-[12px] font-medium text-foreground mb-3">状态管理</div>
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
                    placeholder="原因（可选）"
                    className={cn(
                      "w-full rounded-md border border-border bg-surface-100 px-3 py-2",
                      "text-[12px] text-foreground placeholder:text-foreground-muted",
                      "focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                    )}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setManageOpen(false)}>
                      取消
                    </Button>
                    <Button
                      variant={statusDraft === "archived" ? "warning" : "default"}
                      size="sm"
                      disabled={!canEdit}
                      onClick={() => setConfirmStatusOpen(true)}
                    >
                      提交变更
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
            ? "确认归档该模板？"
            : "确认更新状态？"
        }
        description={
          statusDraft === "archived"
            ? "归档后模板将不再显示于公开列表。"
            : "确认更新模板状态。"
        }
        confirmText="确认"
        cancelText="取消"
        loading={updateStatusMutation.isPending}
        onConfirm={() => updateStatusMutation.mutate()}
      />
    </PageContainer>
  );
}
