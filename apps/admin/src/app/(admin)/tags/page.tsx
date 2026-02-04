"use client";

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Tag as TagIcon,
  Search,
  Plus,
  Pencil,
  Trash2,
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
import { tagRows } from "@/lib/mock-data";
import { adminApi } from "@/lib/api/admin";
import { isLocalModeEnabled } from "@/lib/env";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Tag } from "@/types/admin";
import { usePermission } from "@/hooks/usePermission";

const CATEGORY_OPTIONS = ["all", "type", "industry", "tier"] as const;
const CATEGORY_LABELS: Record<(typeof CATEGORY_OPTIONS)[number], string> = {
  all: "全部分类",
  type: "类型",
  industry: "行业",
  tier: "层级",
};

export default function TagsPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canManage = hasPermission("templates.write");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<(typeof CATEGORY_OPTIONS)[number]>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [localTags, setLocalTags] = useState<Tag[]>(() => tagRows as unknown as Tag[]);

  const apiParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      category: categoryFilter === "all" ? undefined : categoryFilter,
      page,
      page_size: pageSize,
    }),
    [page, pageSize, search, categoryFilter]
  );

  const tagsQuery = useQuery({
    queryKey: ["admin", "tags", apiParams],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.tags.list(apiParams),
  });

  const filteredLocalTags = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return localTags.filter((tag) => {
      const matchesSearch =
        !normalized ||
        tag.name.toLowerCase().includes(normalized) ||
        tag.slug.toLowerCase().includes(normalized);
      const matchesCategory = categoryFilter === "all" || tag.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [localTags, search, categoryFilter]);

  const localTotal = filteredLocalTags.length;
  const localTotalPages = Math.max(1, Math.ceil(localTotal / pageSize));
  const localPagedTags = filteredLocalTags.slice((page - 1) * pageSize, page * pageSize);

  const rows = localMode ? localPagedTags : tagsQuery.data?.items || [];
  const total = localMode ? localTotal : tagsQuery.data?.total || 0;
  const totalPages = localMode ? localTotalPages : Math.max(1, Math.ceil(total / pageSize));

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [isNew, setIsNew] = useState(false);

  const [nameDraft, setNameDraft] = useState("");
  const [slugDraft, setSlugDraft] = useState("");
  const [categoryDraft, setCategoryDraft] = useState("type");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [colorDraft, setColorDraft] = useState("#3B82F6");

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const openNewTag = () => {
    setIsNew(true);
    setSelectedTag(null);
    setNameDraft("");
    setSlugDraft("");
    setCategoryDraft("type");
    setDescriptionDraft("");
    setColorDraft("#3B82F6");
    setEditOpen(true);
  };

  const openEditTag = (tag: Tag) => {
    setIsNew(false);
    setSelectedTag(tag);
    setNameDraft(tag.name);
    setSlugDraft(tag.slug);
    setCategoryDraft(tag.category || "type");
    setDescriptionDraft(tag.description || "");
    setColorDraft(tag.color || "#3B82F6");
    setEditOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!nameDraft.trim()) throw new Error("请填写标签名称");
      if (!slugDraft.trim()) throw new Error("请填写标签 Slug");

      if (localMode) {
        const newTag: Tag = {
          id: `tag-${Date.now()}`,
          name: nameDraft.trim(),
          slug: slugDraft.trim(),
          category: categoryDraft,
          description: descriptionDraft.trim() || null,
          color: colorDraft,
          use_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setLocalTags((prev) => [newTag, ...prev]);
        return { tag: newTag };
      }

      return adminApi.tags.create({
        name: nameDraft.trim(),
        slug: slugDraft.trim(),
        category: categoryDraft,
        description: descriptionDraft.trim() || undefined,
        color: colorDraft,
      });
    },
    onSuccess: () => {
      toast.success("标签已创建");
      queryClient.invalidateQueries({ queryKey: ["admin", "tags"] });
      setEditOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "创建失败");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTag) throw new Error("请选择标签");
      if (!nameDraft.trim()) throw new Error("请填写标签名称");

      if (localMode) {
        const next = localTags.map((tag) =>
          tag.id === selectedTag.id
            ? {
                ...tag,
                name: nameDraft.trim(),
                slug: slugDraft.trim(),
                category: categoryDraft,
                description: descriptionDraft.trim() || null,
                color: colorDraft,
                updated_at: new Date().toISOString(),
              }
            : tag
        );
        setLocalTags(next);
        return { tag: { ...selectedTag, name: nameDraft.trim() } };
      }

      return adminApi.tags.update(selectedTag.id, {
        name: nameDraft.trim(),
        slug: slugDraft.trim(),
        category: categoryDraft,
        description: descriptionDraft.trim() || undefined,
        color: colorDraft,
      });
    },
    onSuccess: () => {
      toast.success("标签已更新");
      queryClient.invalidateQueries({ queryKey: ["admin", "tags"] });
      setEditOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "更新失败");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTag) throw new Error("请选择标签");

      if (localMode) {
        setLocalTags((prev) => prev.filter((tag) => tag.id !== selectedTag.id));
        return {};
      }

      return adminApi.tags.delete(selectedTag.id);
    },
    onSuccess: () => {
      toast.success("标签已删除");
      queryClient.invalidateQueries({ queryKey: ["admin", "tags"] });
      setConfirmDeleteOpen(false);
      setEditOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "删除失败");
    },
  });

  return (
    <PageContainer>
      <PageHeader
        title="标签管理"
        description="管理模板与内容的标签体系。"
        icon={<TagIcon className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" disabled={!canManage} onClick={openNewTag}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              新建标签
            </Button>
          </div>
        }
      />

      <SettingsSection
        title="标签列表"
        description="支持按名称、分类筛选。"
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
            <span className="text-[11px] text-foreground-muted">分类</span>
            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value as (typeof CATEGORY_OPTIONS)[number])
              }
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
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
              <TableHead>标签</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>使用次数</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tagsQuery.isPending && !localMode ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  正在加载...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  {tagsQuery.error && !localMode
                    ? "加载失败，请检查 API 或权限配置"
                    : "暂无匹配标签"}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color || "#3B82F6" }}
                      />
                      <span className="text-[12px] font-medium text-foreground">{tag.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted font-mono">
                    {tag.slug}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" size="sm">
                      {CATEGORY_LABELS[tag.category as keyof typeof CATEGORY_LABELS] || tag.category || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-light">
                    {tag.use_count.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {formatRelativeTime(tag.updated_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!canManage}
                        onClick={() => openEditTag(tag)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!canManage}
                        onClick={() => {
                          setSelectedTag(tag);
                          setConfirmDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-error-default" />
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent size="lg">
          <DialogHeader icon={<TagIcon className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>{isNew ? "新建标签" : "编辑标签"}</DialogTitle>
            <DialogDescription>
              {isNew ? "创建新的标签用于分类模板与内容" : `编辑标签: ${selectedTag?.name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[12px] text-foreground-muted mb-1 block">名称 *</label>
                <Input
                  inputSize="sm"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  placeholder="标签名称"
                />
              </div>
              <div>
                <label className="text-[12px] text-foreground-muted mb-1 block">Slug *</label>
                <Input
                  inputSize="sm"
                  value={slugDraft}
                  onChange={(e) => setSlugDraft(e.target.value)}
                  placeholder="tag-slug"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[12px] text-foreground-muted mb-1 block">分类</label>
                <select
                  value={categoryDraft}
                  onChange={(e) => setCategoryDraft(e.target.value)}
                  className="w-full h-8 rounded-md border border-border bg-surface-100 px-2 text-[12px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                >
                  {CATEGORY_OPTIONS.filter((c) => c !== "all").map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[12px] text-foreground-muted mb-1 block">颜色</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colorDraft}
                    onChange={(e) => setColorDraft(e.target.value)}
                    className="w-8 h-8 rounded border border-border cursor-pointer"
                  />
                  <Input
                    inputSize="sm"
                    value={colorDraft}
                    onChange={(e) => setColorDraft(e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[12px] text-foreground-muted mb-1 block">描述</label>
              <textarea
                value={descriptionDraft}
                onChange={(e) => setDescriptionDraft(e.target.value)}
                rows={2}
                placeholder="标签描述（可选）"
                className={cn(
                  "w-full rounded-md border border-border bg-surface-100 px-3 py-2",
                  "text-[12px] text-foreground placeholder:text-foreground-muted",
                  "focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                )}
              />
            </div>
          </div>

          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              {!isNew && selectedTag && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="text-error-default"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  删除
                </Button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>
                  取消
                </Button>
                <Button
                  size="sm"
                  loading={isNew ? createMutation.isPending : updateMutation.isPending}
                  loadingText="保存中..."
                  onClick={() => (isNew ? createMutation.mutate() : updateMutation.mutate())}
                >
                  {isNew ? "创建" : "保存"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        type="warning"
        title="确认删除该标签？"
        description={`删除后标签 "${selectedTag?.name}" 将被移除，此操作不可恢复。`}
        confirmText="确认删除"
        cancelText="取消"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </PageContainer>
  );
}
