"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LifeBuoy, Plus, Settings2 } from "lucide-react";
import {
  FormRow,
  PageContainer,
  PageHeader,
  SettingsSection,
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminCapabilities } from "@/contexts/admin-capabilities";
import { adminApi } from "@/lib/api/admin";
import { supportChannels as supportChannelsMock } from "@/lib/mock-data";
import { isLocalModeEnabled } from "@/lib/env";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { SupportChannel } from "@/types/admin";

type ChannelDraft = {
  key: string;
  name: string;
  description: string;
  contact: string;
  enabled: boolean;
  sortOrder: number;
  slaOverridesJson: string;
};

function safeUuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function toDraft(channel?: SupportChannel | null): ChannelDraft {
  const sla = channel?.sla_overrides || {};
  return {
    key: channel?.key || "",
    name: channel?.name || "",
    description: channel?.description || "",
    contact: channel?.contact || "",
    enabled: channel?.enabled ?? true,
    sortOrder: channel?.sort_order ?? 0,
    slaOverridesJson: JSON.stringify(sla, null, 2),
  };
}

function parseSlaOverrides(raw: string): Record<string, number> {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  const parsed = JSON.parse(trimmed) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("SLA Overrides 必须是 JSON 对象");
  }
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof v === "number" && Number.isFinite(v)) {
      out[k] = v;
      continue;
    }
    const maybe = Number(v);
    if (Number.isFinite(maybe)) {
      out[k] = maybe;
    }
  }
  return out;
}

export default function SupportChannelsPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();
  const { hasCapability } = useAdminCapabilities();
  const canManage = hasCapability("support.manage");

  const [search, setSearch] = useState("");
  const [includeDisabled, setIncludeDisabled] = useState(false);

  const [localChannels, setLocalChannels] = useState<SupportChannel[]>(
    () => supportChannelsMock as unknown as SupportChannel[]
  );

  const channelsQuery = useQuery({
    queryKey: ["admin", "support", "channels", { includeDisabled }],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.support.channels.list({ include_disabled: includeDisabled }),
  });

  const rows = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const source = localMode ? localChannels : channelsQuery.data?.channels || [];
    return source
      .filter((channel) => (includeDisabled ? true : channel.enabled))
      .filter((channel) => {
        if (!normalized) return true;
        return (
          channel.name.toLowerCase().includes(normalized) ||
          channel.key.toLowerCase().includes(normalized) ||
          (channel.contact || "").toLowerCase().includes(normalized)
        );
      })
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [channelsQuery.data?.channels, includeDisabled, localChannels, localMode, search]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SupportChannel | null>(null);
  const [draft, setDraft] = useState<ChannelDraft>(() => toDraft(null));

  const createMutation = useMutation({
    mutationFn: (input: {
      key: string;
      name: string;
      description?: string | null;
      contact?: string | null;
      enabled?: boolean;
      sort_order?: number;
      sla_overrides?: Record<string, number>;
    }) => adminApi.support.channels.create(input),
    onSuccess: async () => {
      toast.success("已创建支持渠道");
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin", "support", "channels"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "创建失败");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; input: Parameters<typeof adminApi.support.channels.update>[1] }) =>
      adminApi.support.channels.update(payload.id, payload.input),
    onSuccess: async () => {
      toast.success("已更新支持渠道");
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin", "support", "channels"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "更新失败");
    },
  });

  const openCreate = () => {
    setEditing(null);
    setDraft(toDraft(null));
    setDialogOpen(true);
  };

  const openEdit = (channel: SupportChannel) => {
    setEditing(channel);
    setDraft(toDraft(channel));
    setDialogOpen(true);
  };

  const submitDraft = async () => {
    const key = draft.key.trim();
    const name = draft.name.trim();
    if (!key || !name) {
      toast.error("Key 与名称为必填项");
      return;
    }

    let slaOverrides: Record<string, number> = {};
    try {
      slaOverrides = parseSlaOverrides(draft.slaOverridesJson);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "SLA Overrides 解析失败");
      return;
    }

    const input = {
      key,
      name,
      description: draft.description.trim() || null,
      contact: draft.contact.trim() || null,
      enabled: draft.enabled,
      sort_order: Number.isFinite(draft.sortOrder) ? draft.sortOrder : 0,
      sla_overrides: slaOverrides,
    };

    if (localMode) {
      const now = new Date().toISOString();
      if (!editing) {
        const next: SupportChannel = {
          id: safeUuid(),
          created_at: now,
          updated_at: now,
          sort_order: input.sort_order,
          enabled: Boolean(input.enabled),
          key: input.key,
          name: input.name,
          description: input.description,
          contact: input.contact,
          sla_overrides: input.sla_overrides,
        };
        setLocalChannels((prev) => [next, ...prev]);
        toast.success("已创建支持渠道（本地模式）");
        setDialogOpen(false);
        return;
      }

      setLocalChannels((prev) =>
        prev.map((item) =>
          item.id === editing.id
            ? {
                ...item,
                ...input,
                sort_order: input.sort_order,
                updated_at: now,
              }
            : item
        )
      );
      toast.success("已更新支持渠道（本地模式）");
      setDialogOpen(false);
      return;
    }

    if (!canManage) {
      toast.error("无权限执行该操作");
      return;
    }

    if (!editing) {
      await createMutation.mutateAsync(input);
      return;
    }
    await updateMutation.mutateAsync({ id: editing.id, input });
  };

  const isBusy = createMutation.isPending || updateMutation.isPending;

  return (
    <PageContainer>
      <PageHeader
        title="支持渠道"
        description="配置渠道入口、联系信息与 SLA 规则。"
        icon={<LifeBuoy className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => channelsQuery.refetch()} disabled={localMode}>
              刷新
            </Button>
            <Button size="sm" onClick={openCreate} disabled={!canManage && !localMode}>
              <Plus className="w-4 h-4" />
              新建渠道
            </Button>
          </div>
        }
      />

      <SettingsSection title="渠道列表" description="用于工单来源识别与通知模板分流。">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="搜索渠道名称 / key / contact"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">包含已停用</span>
            <Switch checked={includeDisabled} onCheckedChange={setIncludeDisabled} />
          </div>

          <Badge variant="outline" size="sm">
            共 {rows.length} 条
          </Badge>

          {localMode ? (
            <Badge variant="secondary" size="sm">
              Local mode
            </Badge>
          ) : null}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>渠道</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>SLA</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {channelsQuery.isPending && !localMode ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-[12px] text-foreground-muted">
                  正在加载...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-[12px] text-foreground-muted">
                  {channelsQuery.error && !localMode ? "加载失败，请检查 API 或权限配置" : "暂无渠道配置"}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((channel) => (
                <TableRow key={channel.id}>
                  <TableCell>
                    <div className="text-[12px] font-medium text-foreground">
                      {channel.name}
                    </div>
                    <div className="text-[11px] text-foreground-muted">
                      <span className="font-mono">{channel.key}</span>
                      {channel.contact ? (
                        <span className="ml-2">
                          · {channel.contact}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={channel.enabled ? "success" : "secondary"} size="sm">
                      {channel.enabled ? "启用" : "停用"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {channel.sla_overrides && Object.keys(channel.sla_overrides).length > 0 ? (
                      <span className="font-mono">
                        {Object.keys(channel.sla_overrides).length} overrides
                      </span>
                    ) : (
                      "-"
                    )}
                    <div className="text-[11px] text-foreground-muted">
                      sort: {channel.sort_order ?? 0}
                    </div>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {channel.updated_at ? formatRelativeTime(channel.updated_at) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(channel)}
                      disabled={(!canManage && !localMode) || isBusy}
                    >
                      <Settings2 className="w-4 h-4" />
                      编辑
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SettingsSection>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent size="xl">
          <DialogHeader
            icon={<Settings2 className="w-5 h-5" />}
            iconVariant={editing ? "info" : "success"}
          >
            <DialogTitle>{editing ? "编辑渠道" : "新建渠道"}</DialogTitle>
            <DialogDescription>
              渠道用于区分工单来源，并作为通知模板的分流维度。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <FormRow label="Key" required description="建议使用短小英文 key（例如 email/dashboard/system）。">
              <Input
                value={draft.key}
                onChange={(e) => setDraft((prev) => ({ ...prev, key: e.target.value }))}
                placeholder="system"
              />
            </FormRow>

            <FormRow label="名称" required>
              <Input
                value={draft.name}
                onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="系统渠道"
              />
            </FormRow>

            <FormRow label="描述">
              <Input
                value={draft.description}
                onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="用于系统告警与默认通知的内部渠道"
              />
            </FormRow>

            <FormRow label="Contact">
              <Input
                value={draft.contact}
                onChange={(e) => setDraft((prev) => ({ ...prev, contact: e.target.value }))}
                placeholder="support@agentflow.ai / slack:#support"
              />
            </FormRow>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FormRow label="排序" description="数字越小越靠前。">
                <Input
                  type="number"
                  value={String(draft.sortOrder)}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))
                  }
                />
              </FormRow>

              <FormRow label="状态">
                <div
                  className={cn(
                    "h-10 rounded-md border border-border bg-surface-100 px-3 flex items-center justify-between"
                  )}
                >
                  <div className="text-[12px] text-foreground-light">
                    {draft.enabled ? "启用" : "停用"}
                  </div>
                  <Switch
                    checked={draft.enabled}
                    onCheckedChange={(checked) =>
                      setDraft((prev) => ({ ...prev, enabled: checked }))
                    }
                  />
                </div>
              </FormRow>
            </div>

            <FormRow
              label="SLA Overrides (JSON)"
              description='可选。示例：{ "first_response_minutes": 60, "resolve_minutes": 2880 }'
            >
              <textarea
                value={draft.slaOverridesJson}
                onChange={(e) => setDraft((prev) => ({ ...prev, slaOverridesJson: e.target.value }))}
                rows={7}
                className={cn(
                  "w-full rounded-md border border-border bg-surface-100 px-3 py-2",
                  "font-mono text-[11px] text-foreground-light",
                  "focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                )}
                spellCheck={false}
              />
            </FormRow>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isBusy}>
              取消
            </Button>
            <Button
              onClick={submitDraft}
              loading={isBusy}
              loadingText={editing ? "保存中..." : "创建中..."}
              disabled={(!canManage && !localMode) || isBusy}
            >
              {editing ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

