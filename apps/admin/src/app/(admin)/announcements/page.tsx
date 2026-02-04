"use client";

import { useEffect, useMemo, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, Plus, RefreshCcw } from "lucide-react";
import {
  FormRow,
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
  AlertDialog,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FullPagination } from "@/components/ui/pagination";
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
import {
  announcements as announcementsMock,
  systemNotificationPreviewContext,
  systemNotificationTemplates,
} from "@/lib/mock-data";
import { deepClone, formatDate, formatRelativeTime } from "@/lib/utils";
import type { Announcement } from "@/types/announcement";

const TYPE_OPTIONS = [
  { value: "all", label: "全部类型" },
  { value: "feature", label: "新功能" },
  { value: "improvement", label: "优化" },
  { value: "notice", label: "公告" },
  { value: "warning", label: "警告" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "全部状态" },
  { value: "active", label: "已发布" },
  { value: "inactive", label: "已下线" },
];

const typeBadgeVariant: Record<string, "info" | "warning" | "success" | "error" | "secondary"> = {
  feature: "success",
  improvement: "info",
  notice: "secondary",
  warning: "warning",
};

type NotificationChannel = "email" | "slack" | "in_app" | "sms";

type SystemNotificationTemplate = {
  id: string;
  name: string;
  channel: NotificationChannel;
  locale: string;
  enabled: boolean;
  title: string;
  content: string;
  variables: string[];
};

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  email: "Email",
  slack: "Slack",
  in_app: "In-App",
  sms: "SMS",
};

const CHANNEL_BADGE: Record<NotificationChannel, "info" | "warning" | "success" | "secondary"> = {
  email: "info",
  slack: "warning",
  in_app: "success",
  sms: "secondary",
};

const renderTemplate = (template: string, context: Record<string, string>) =>
  template.replace(/{{\s*([^}]+)\s*}}/g, (_, key) => context[key.trim()] ?? `{{${key}}}`);

const isZeroTime = (value?: string | null) =>
  !value || value.startsWith("0001-01-01") || value.startsWith("0000-00-00");

const getReadRate = (item: Announcement) => {
  if (typeof item.read_rate === "number") return item.read_rate;
  if (
    typeof item.read_count === "number" &&
    typeof item.total_users === "number" &&
    item.total_users > 0
  ) {
    return (item.read_count / item.total_users) * 100;
  }
  return 0;
};

const toIsoString = (value: string) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
};

export default function AnnouncementsPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [localAnnouncements, setLocalAnnouncements] = useState<Announcement[]>(
    () => announcementsMock as Announcement[]
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [nextActiveState, setNextActiveState] = useState<boolean>(false);

  const [titleDraft, setTitleDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [typeDraft, setTypeDraft] = useState("notice");
  const [priorityDraft, setPriorityDraft] = useState("0");
  const [startsAtDraft, setStartsAtDraft] = useState("");
  const [endsAtDraft, setEndsAtDraft] = useState("");
  const [isActiveDraft, setIsActiveDraft] = useState(true);

  const [localTemplates, setLocalTemplates] = useState<SystemNotificationTemplate[]>(() =>
    deepClone(systemNotificationTemplates as SystemNotificationTemplate[])
  );
  const [draftTemplates, setDraftTemplates] = useState<SystemNotificationTemplate[]>(() =>
    deepClone(systemNotificationTemplates as SystemNotificationTemplate[])
  );
  const [templatesDirty, setTemplatesDirty] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    () => (systemNotificationTemplates[0] as SystemNotificationTemplate | undefined)?.id || ""
  );

  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter, pageSize]);

  const isActiveParam =
    statusFilter === "all" ? undefined : statusFilter === "active";
  const includeInactive = statusFilter === "all";

  const listQuery = useQuery({
    queryKey: ["admin", "announcements", typeFilter, statusFilter, page, pageSize],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () =>
      adminApi.announcements.list({
        type: typeFilter === "all" ? "" : typeFilter,
        include_inactive: includeInactive,
        is_active: isActiveParam,
        page,
        page_size: pageSize,
      }),
  });

  const localResult = useMemo(() => {
    const filtered = localAnnouncements.filter((item) => {
      const matchType = typeFilter === "all" || item.type === typeFilter;
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? item.is_active : !item.is_active);
      return matchType && matchStatus;
    });
    const totalItems = filtered.length;
    const startIndex = (page - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);
    return { items, total: totalItems };
  }, [localAnnouncements, page, pageSize, statusFilter, typeFilter]);

  const localTotalUsers = useMemo(() => {
    return localAnnouncements.find((item) => typeof item.total_users === "number")?.total_users || 0;
  }, [localAnnouncements]);

  const announcements = localMode
    ? localResult.items
    : listQuery.data?.items || [];
  const total = localMode ? localResult.total : listQuery.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isLoading = !localMode && listQuery.isPending;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (!selectedTemplateId && draftTemplates.length > 0) {
      setSelectedTemplateId(draftTemplates[0].id);
      return;
    }
    if (selectedTemplateId && !draftTemplates.some((item) => item.id === selectedTemplateId)) {
      setSelectedTemplateId(draftTemplates[0]?.id || "");
    }
  }, [draftTemplates, selectedTemplateId]);

  const selectedTemplate = useMemo(
    () => draftTemplates.find((item) => item.id === selectedTemplateId) || null,
    [draftTemplates, selectedTemplateId]
  );

  const previewContext = systemNotificationPreviewContext as Record<string, string>;
  const previewTitle = selectedTemplate
    ? renderTemplate(selectedTemplate.title, previewContext)
    : "";
  const previewContent = selectedTemplate
    ? renderTemplate(selectedTemplate.content, previewContext)
    : "";

  const createMutation = useMutation({
    mutationFn: async () => {
      const title = titleDraft.trim();
      const description = descriptionDraft.trim();
      if (!title) throw new Error("标题不能为空");
      if (!description) throw new Error("公告内容不能为空");

      const priority = Number(priorityDraft);
      if (Number.isNaN(priority)) {
        throw new Error("优先级必须为数字");
      }

      const startsAt = toIsoString(startsAtDraft);
      const endsAt = toIsoString(endsAtDraft);
      if (startsAt && endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
        throw new Error("结束时间需晚于开始时间");
      }

      if (localMode) {
        const now = new Date().toISOString();
        const totalUsers = localTotalUsers || 1000;
        const newAnnouncement: Announcement = {
          id: `ann-local-${Date.now()}`,
          title,
          description,
          type: typeDraft,
          priority,
          is_active: isActiveDraft,
          read_count: 0,
          total_users: totalUsers,
          starts_at: startsAt || now,
          ends_at: endsAt || null,
          created_at: now,
          updated_at: now,
        };
        setLocalAnnouncements((prev) => [newAnnouncement, ...prev]);
        return { announcement: newAnnouncement };
      }

      return adminApi.announcements.create({
        title,
        description,
        type: typeDraft,
        priority,
        is_active: isActiveDraft,
        starts_at: startsAt,
        ends_at: endsAt,
      });
    },
    onSuccess: () => {
      toast.success("公告已创建");
      if (!localMode) {
        queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
      }
      setCreateOpen(false);
      setTitleDraft("");
      setDescriptionDraft("");
      setTypeDraft("notice");
      setPriorityDraft("0");
      setStartsAtDraft("");
      setEndsAtDraft("");
      setIsActiveDraft(true);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "创建公告失败");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (input: { id: string; is_active: boolean }) => {
      if (localMode) {
        let updated: Announcement | null = null;
        setLocalAnnouncements((prev) =>
          prev.map((item) => {
            if (item.id !== input.id) return item;
            updated = {
              ...item,
              is_active: input.is_active,
              updated_at: new Date().toISOString(),
            };
            return updated;
          })
        );
        return { announcement: updated };
      }
      return adminApi.announcements.update(input.id, { is_active: input.is_active });
    },
    onSuccess: () => {
      toast.success(nextActiveState ? "公告已发布" : "公告已下线");
      if (!localMode) {
        queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
      }
      setConfirmOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "更新公告失败");
    },
  });

  const openToggle = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setNextActiveState(!announcement.is_active);
    setConfirmOpen(true);
  };

  const dateWindow = useMemo(() => {
    return announcements.reduce<Record<string, string>>((acc, item) => {
      const startsAt = isZeroTime(item.starts_at) ? "立即" : formatDate(item.starts_at);
      const endsAt = item.ends_at && !isZeroTime(item.ends_at) ? formatDate(item.ends_at) : "长期";
      acc[item.id] = `${startsAt} · ${endsAt}`;
      return acc;
    }, {});
  }, [announcements]);

  const stats = useMemo(() => {
    const activeCount = announcements.filter((item) => item.is_active).length;
    const totalReads = announcements.reduce((sum, item) => sum + (item.read_count || 0), 0);
    const averageRate =
      announcements.length === 0
        ? 0
        : announcements.reduce((sum, item) => sum + getReadRate(item), 0) / announcements.length;
    const totalUsers =
      announcements.find((item) => typeof item.total_users === "number")?.total_users || 0;
    return { activeCount, totalReads, averageRate, totalUsers };
  }, [announcements]);

  const updateTemplate = (patch: Partial<SystemNotificationTemplate>) => {
    if (!selectedTemplate) return;
    setTemplatesDirty(true);
    setDraftTemplates((prev) =>
      prev.map((item) => (item.id === selectedTemplate.id ? { ...item, ...patch } : item))
    );
  };

  const saveTemplates = () => {
    if (!templatesDirty) {
      toast.message("没有需要保存的变更");
      return;
    }
    if (!localMode) {
      toast.error("通知模板 API 尚未接入");
      return;
    }
    setLocalTemplates(deepClone(draftTemplates));
    setTemplatesDirty(false);
    toast.success("已保存通知模板（本地模式）");
  };

  const resetTemplates = () => {
    setDraftTemplates(deepClone(localTemplates));
    setTemplatesDirty(false);
    toast.message("已重置通知模板");
  };

  const previewRecipient = previewContext["user.email"] || "admin@agentflow.ai";
  const canEditTemplates = localMode;
  const templateChannelLabel = selectedTemplate
    ? CHANNEL_LABELS[selectedTemplate.channel]
    : "未知";
  const templateChannelBadge = selectedTemplate
    ? CHANNEL_BADGE[selectedTemplate.channel]
    : "secondary";

  return (
    <PageContainer>
      <PageHeader
        title="公告管理"
        description="发布平台公告并管理展示周期。"
        icon={<Bell className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCcw className="w-4 h-4" />}
              onClick={() => {
                if (!localMode) listQuery.refetch();
              }}
              loading={!localMode && listQuery.isFetching}
              loadingText="刷新中..."
            >
              刷新
            </Button>
            <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>
              新建公告
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        <StatsCard
          title="当前列表已读"
          value={stats.totalReads}
          subtitle={`已加载 ${announcements.length} 条公告`}
        />
        <StatsCard
          title="平均阅读率"
          value={`${stats.averageRate.toFixed(1)}%`}
          subtitle={stats.totalUsers ? `总用户 ${stats.totalUsers}` : "暂无用户统计"}
        />
        <StatsCard
          title="已发布"
          value={stats.activeCount}
          subtitle={`筛选范围共 ${total} 条`}
        />
      </div>

      <SettingsSection title="公告列表" description="支持按类型与状态筛选。">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">类型</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">状态</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <Badge variant="outline" size="sm">
            共 {total} 条
          </Badge>
        </div>

        {isLoading ? (
          <div className="text-[12px] text-foreground-muted">正在加载...</div>
        ) : announcements.length === 0 ? (
          <div className="text-[12px] text-foreground-muted">暂无公告</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>公告</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>阅读</TableHead>
                <TableHead>生效周期</TableHead>
                <TableHead>优先级</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.map((item) => {
                const readCount = item.read_count || 0;
                const totalUsers = item.total_users || 0;
                const readRate = getReadRate(item);
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="text-[12px] font-medium text-foreground">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-foreground-muted">
                        {item.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeBadgeVariant[item.type] || "secondary"} size="sm">
                        {item.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? "success" : "secondary"} size="sm">
                        {item.is_active ? "已发布" : "已下线"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[12px] text-foreground-light">
                      {totalUsers > 0 ? `${readCount}/${totalUsers} (${readRate.toFixed(1)}%)` : "-"}
                    </TableCell>
                    <TableCell className="text-[12px] text-foreground-light">
                      {dateWindow[item.id]}
                    </TableCell>
                    <TableCell className="text-[12px] text-foreground-light">
                      {item.priority}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant={item.is_active ? "outline" : "default"}
                          size="sm"
                          onClick={() => openToggle(item)}
                        >
                          {item.is_active ? "下线" : "发布"}
                        </Button>
                      </div>
                      <div className="mt-1 text-[11px] text-foreground-muted">
                        更新于 {formatRelativeTime(item.updated_at)}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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

      <SettingsSection
        title="系统通知模板与发送预览"
        description="配置关键通知模板并快速预览实际发送效果。"
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge variant="outline" size="sm">
            {templatesDirty ? "已修改（未保存）" : "已同步"}
          </Badge>
          {localMode ? (
            <Badge variant="secondary" size="sm">
              Local mode
            </Badge>
          ) : (
            <Badge variant="secondary" size="sm">
              只读预览
            </Badge>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            <FormRow label="通知模板" description="选择需要配置的系统通知模板。">
              <select
                value={selectedTemplateId}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
                className="h-8 w-full rounded-md border border-border bg-surface-100 px-2 text-[12px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
              >
                {draftTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} · {CHANNEL_LABELS[template.channel]}
                  </option>
                ))}
              </select>
            </FormRow>

            <FormRow label="通道 / 语言" description="通知投递的默认通道与语言。">
              <div className="flex items-center gap-2">
                <Badge variant={templateChannelBadge} size="sm">
                  {templateChannelLabel}
                </Badge>
                <Badge variant="outline" size="sm">
                  {selectedTemplate?.locale || "-"}
                </Badge>
                <Badge variant={selectedTemplate?.enabled ? "success" : "secondary"} size="sm">
                  {selectedTemplate?.enabled ? "已启用" : "已停用"}
                </Badge>
              </div>
            </FormRow>

            <FormRow label="启用状态" description="关闭后仍保留模板内容，但不会发送。">
              <div className="flex items-center justify-between rounded-md border border-border bg-surface-75 px-3 py-2">
                <span className="text-[12px] text-foreground-light">
                  {selectedTemplate?.enabled ? "已启用" : "已停用"}
                </span>
                <Switch
                  checked={selectedTemplate?.enabled ?? false}
                  onCheckedChange={(checked) => updateTemplate({ enabled: checked })}
                  disabled={!selectedTemplate || !canEditTemplates}
                />
              </div>
            </FormRow>

            <FormRow label="标题模板" description="支持 {{variable}} 变量占位符。">
              <Input
                value={selectedTemplate?.title || ""}
                onChange={(event) => updateTemplate({ title: event.target.value })}
                placeholder="输入通知标题"
                disabled={!selectedTemplate || !canEditTemplates}
              />
            </FormRow>

            <FormRow label="内容模板" description="建议保留关键信息字段。" horizontal={false}>
              <textarea
                value={selectedTemplate?.content || ""}
                onChange={(event) => updateTemplate({ content: event.target.value })}
                rows={6}
                placeholder="输入通知内容..."
                className="w-full rounded-md border border-border bg-surface-100 px-3 py-2 text-[12px] text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                disabled={!selectedTemplate || !canEditTemplates}
              />
            </FormRow>

            <FormRow label="可用变量" description="用于模板渲染的动态字段。">
              <div className="flex flex-wrap items-center gap-2">
                {selectedTemplate?.variables?.length ? (
                  selectedTemplate.variables.map((token) => (
                    <Badge key={token} variant="outline" size="sm">
                      {token}
                    </Badge>
                  ))
                ) : (
                  <span className="text-[11px] text-foreground-muted">暂无变量</span>
                )}
              </div>
            </FormRow>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={resetTemplates} disabled={!canEditTemplates}>
                重置
              </Button>
              <Button size="sm" onClick={saveTemplates} disabled={!canEditTemplates}>
                保存模板
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-surface-75 p-4">
              <div className="text-[11px] text-foreground-muted">预览接收人</div>
              <div className="text-[12px] text-foreground">{previewRecipient}</div>
              <div className="mt-3 text-[11px] text-foreground-muted">预览标题</div>
              <div className="text-[12px] text-foreground">{previewTitle || "-"}</div>
              <div className="mt-3 text-[11px] text-foreground-muted">预览内容</div>
              <div className="text-[12px] text-foreground-light whitespace-pre-wrap">
                {previewContent || "-"}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-surface-75 px-4 py-3">
              <div>
                <div className="text-[12px] font-medium text-foreground">发送预览</div>
                <div className="text-[11px] text-foreground-muted">
                  将当前模板内容发送给预览接收人。
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  if (!selectedTemplate) return;
                  toast.success(`已发送预览至 ${previewRecipient}`);
                }}
                disabled={!selectedTemplate}
              >
                发送预览
              </Button>
            </div>
          </div>
        </div>
      </SettingsSection>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent size="lg">
          <DialogHeader icon={<Bell className="w-5 h-5" />} iconVariant="info">
            <DialogTitle>新建公告</DialogTitle>
            <DialogDescription>发布平台公告并设置展示周期。</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <div className="text-[11px] text-foreground-muted mb-1">标题</div>
              <Input
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                placeholder="例如：新功能上线通知"
              />
            </div>
            <div>
              <div className="text-[11px] text-foreground-muted mb-1">内容</div>
              <textarea
                value={descriptionDraft}
                onChange={(event) => setDescriptionDraft(event.target.value)}
                rows={4}
                placeholder="描述公告内容..."
                className="w-full rounded-md border border-border bg-surface-100 px-3 py-2 text-[12px] text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-[11px] text-foreground-muted mb-1">类型</div>
                <select
                  value={typeDraft}
                  onChange={(event) => setTypeDraft(event.target.value)}
                  className="h-8 w-full rounded-md border border-border bg-surface-100 px-2 text-[12px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                >
                  {TYPE_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-[11px] text-foreground-muted mb-1">优先级</div>
                <Input
                  type="number"
                  value={priorityDraft}
                  onChange={(event) => setPriorityDraft(event.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-[11px] text-foreground-muted mb-1">开始时间</div>
                <Input
                  type="datetime-local"
                  value={startsAtDraft}
                  onChange={(event) => setStartsAtDraft(event.target.value)}
                />
              </div>
              <div>
                <div className="text-[11px] text-foreground-muted mb-1">结束时间</div>
                <Input
                  type="datetime-local"
                  value={endsAtDraft}
                  onChange={(event) => setEndsAtDraft(event.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-surface-75 px-3 py-2">
              <div>
                <div className="text-[12px] font-medium text-foreground">立即发布</div>
                <div className="text-[11px] text-foreground-light">
                  关闭后创建为下线状态
                </div>
              </div>
              <Switch checked={isActiveDraft} onCheckedChange={setIsActiveDraft} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button
              size="sm"
              loading={createMutation.isPending}
              loadingText="创建中..."
              onClick={() => createMutation.mutate()}
            >
              创建公告
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        type={nextActiveState ? "info" : "warning"}
        title={nextActiveState ? "确认发布该公告？" : "确认下线该公告？"}
        description={
          selectedAnnouncement
            ? `${selectedAnnouncement.title} · ${selectedAnnouncement.id}`
            : "请选择公告"
        }
        confirmText={nextActiveState ? "发布" : "下线"}
        cancelText="取消"
        loading={toggleMutation.isPending}
        onConfirm={() => {
          if (!selectedAnnouncement) return;
          toggleMutation.mutate({ id: selectedAnnouncement.id, is_active: nextActiveState });
        }}
      />
    </PageContainer>
  );
}
