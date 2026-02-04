"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LifeBuoy, Plus, Route, Settings2 } from "lucide-react";
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
import {
  supportAssignmentRules as supportAssignmentRulesMock,
  supportChannels as supportChannelsMock,
  supportQueues as supportQueuesMock,
  supportTeams as supportTeamsMock,
} from "@/lib/mock-data";
import { isLocalModeEnabled } from "@/lib/env";
import { cn, formatRelativeTime } from "@/lib/utils";
import type {
  SupportAssignmentRule,
  SupportChannel,
  SupportQueue,
  SupportTeam,
} from "@/types/admin";

type RuleDraft = {
  name: string;
  enabled: boolean;
  sortOrder: number;
  priority: string;
  category: string;
  channel: string;
  keyword: string;
  assigneeType: "user" | "team" | "queue";
  assigneeValue: string;
};

function safeUuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function toDraft(rule?: SupportAssignmentRule | null): RuleDraft {
  const rawType = (rule?.assignee_type || "team").toLowerCase();
  const assigneeType =
    rawType === "user" || rawType === "queue" || rawType === "team" ? (rawType as RuleDraft["assigneeType"]) : "team";

  return {
    name: rule?.name || "",
    enabled: rule?.enabled ?? true,
    sortOrder: rule?.sort_order ?? 0,
    priority: rule?.priority || "",
    category: rule?.category || "",
    channel: rule?.channel || "",
    keyword: rule?.keyword || "",
    assigneeType,
    assigneeValue: rule?.assignee_value || "",
  };
}

const PRIORITY_OPTIONS = ["", "low", "medium", "high", "urgent"] as const;
const ASSIGNEE_TYPE_OPTIONS = ["user", "team", "queue"] as const;

export default function SupportRoutingRulesPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();
  const { hasCapability } = useAdminCapabilities();
  const canManage = hasCapability("support.manage");

  const [search, setSearch] = useState("");
  const [includeDisabled, setIncludeDisabled] = useState(false);

  const [localRules, setLocalRules] = useState<SupportAssignmentRule[]>(
    () => supportAssignmentRulesMock as unknown as SupportAssignmentRule[]
  );
  const [localChannels] = useState<SupportChannel[]>(
    () => supportChannelsMock as unknown as SupportChannel[]
  );
  const [localTeams] = useState<SupportTeam[]>(
    () => supportTeamsMock as unknown as SupportTeam[]
  );
  const [localQueues] = useState<SupportQueue[]>(
    () => supportQueuesMock as unknown as SupportQueue[]
  );

  const rulesQuery = useQuery({
    queryKey: ["admin", "support", "routingRules", { includeDisabled }],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.support.routingRules.list({ include_disabled: includeDisabled }),
  });

  const channelsQuery = useQuery({
    queryKey: ["admin", "support", "channels", { includeDisabled: true }],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.support.channels.list({ include_disabled: true }),
  });

  const teamsQuery = useQuery({
    queryKey: ["admin", "support", "teams", { includeDisabled: true }],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.support.teams.list({ include_disabled: true }),
  });

  const queuesQuery = useQuery({
    queryKey: ["admin", "support", "queues", { includeDisabled: true }],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.support.queues.list({ include_disabled: true }),
  });

  const channels = useMemo(() => {
    return localMode ? localChannels : channelsQuery.data?.channels || [];
  }, [channelsQuery.data?.channels, localChannels, localMode]);

  const teams = useMemo(() => {
    return localMode ? localTeams : teamsQuery.data?.teams || [];
  }, [localMode, localTeams, teamsQuery.data?.teams]);

  const queues = useMemo(() => {
    return localMode ? localQueues : queuesQuery.data?.queues || [];
  }, [localMode, localQueues, queuesQuery.data?.queues]);

  const channelOptions = useMemo(() => {
    const enabled = channels.filter((c) => c.enabled);
    return enabled.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [channels]);

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const queueMap = useMemo(() => new Map(queues.map((q) => [q.id, q])), [queues]);

  const rows = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const source = localMode ? localRules : rulesQuery.data?.rules || [];
    return source
      .filter((r) => (includeDisabled ? true : r.enabled))
      .filter((r) => (!normalized ? true : r.name.toLowerCase().includes(normalized)))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [includeDisabled, localMode, localRules, rulesQuery.data?.rules, search]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SupportAssignmentRule | null>(null);
  const [draft, setDraft] = useState<RuleDraft>(() => toDraft(null));

  const createMutation = useMutation({
    mutationFn: (input: Parameters<typeof adminApi.support.routingRules.create>[0]) =>
      adminApi.support.routingRules.create(input),
    onSuccess: async () => {
      toast.success("已创建路由规则");
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin", "support", "routingRules"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "创建失败"),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; input: Parameters<typeof adminApi.support.routingRules.update>[1] }) =>
      adminApi.support.routingRules.update(payload.id, payload.input),
    onSuccess: async () => {
      toast.success("已更新路由规则");
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin", "support", "routingRules"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "更新失败"),
  });

  const openCreate = () => {
    setEditing(null);
    setDraft(toDraft(null));
    setDialogOpen(true);
  };

  const openEdit = (rule: SupportAssignmentRule) => {
    setEditing(rule);
    setDraft(toDraft(rule));
    setDialogOpen(true);
  };

  const submitDraft = async () => {
    const name = draft.name.trim();
    if (!name) {
      toast.error("规则名称为必填项");
      return;
    }
    const assigneeValue = draft.assigneeValue.trim();
    if (!assigneeValue) {
      toast.error("请填写分派目标");
      return;
    }

    const input = {
      name,
      priority: draft.priority.trim(),
      category: draft.category.trim(),
      channel: draft.channel.trim(),
      keyword: draft.keyword.trim(),
      assignee_type: draft.assigneeType,
      assignee_value: assigneeValue,
      enabled: draft.enabled,
      sort_order: Number.isFinite(draft.sortOrder) ? draft.sortOrder : 0,
    };

    if (localMode) {
      const now = new Date().toISOString();
      if (!editing) {
        const next: SupportAssignmentRule = {
          id: safeUuid(),
          created_at: now,
          updated_at: now,
          ...input,
        };
        setLocalRules((prev) => [next, ...prev]);
        toast.success("已创建路由规则（本地模式）");
        setDialogOpen(false);
        return;
      }
      setLocalRules((prev) =>
        prev.map((r) => (r.id === editing.id ? { ...r, ...input, updated_at: now } : r))
      );
      toast.success("已更新路由规则（本地模式）");
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

  const renderAssignee = (rule: SupportAssignmentRule) => {
    const type = (rule.assignee_type || "").toLowerCase();
    if (type === "team") {
      return teamMap.get(rule.assignee_value)?.name || `team:${rule.assignee_value}`;
    }
    if (type === "queue") {
      return queueMap.get(rule.assignee_value)?.name || `queue:${rule.assignee_value}`;
    }
    if (type === "user") {
      return `user:${rule.assignee_value}`;
    }
    return `${rule.assignee_type}:${rule.assignee_value}`;
  };

  return (
    <PageContainer>
      <PageHeader
        title="路由规则"
        description="配置工单自动分派规则（priority/category/channel/keyword）。"
        icon={<Route className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => rulesQuery.refetch()}
              disabled={localMode}
            >
              刷新
            </Button>
            <Button size="sm" onClick={openCreate} disabled={!canManage && !localMode}>
              <Plus className="w-4 h-4" />
              新建规则
            </Button>
          </div>
        }
      />

      <SettingsSection title="规则列表" description="按 sort_order 从小到大匹配；第一个命中即应用。">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="搜索规则名称"
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
              <TableHead>规则</TableHead>
              <TableHead>匹配条件</TableHead>
              <TableHead>分派目标</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rulesQuery.isPending && !localMode ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-[12px] text-foreground-muted">
                  正在加载...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-[12px] text-foreground-muted">
                  {rulesQuery.error && !localMode ? "加载失败，请检查 API 或权限配置" : "暂无规则"}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <div className="text-[12px] font-medium text-foreground">{rule.name}</div>
                    <div className="text-[11px] text-foreground-muted">
                      <span className="font-mono">sort:{rule.sort_order ?? 0}</span>
                      <span className="ml-2 font-mono">{rule.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" size="sm">
                        pri:{rule.priority || "*"}
                      </Badge>
                      <Badge variant="outline" size="sm">
                        cat:{rule.category || "*"}
                      </Badge>
                      <Badge variant="outline" size="sm">
                        ch:{rule.channel || "*"}
                      </Badge>
                      <Badge variant="outline" size="sm">
                        kw:{rule.keyword || "*"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {renderAssignee(rule)}
                    <div className="text-[11px] text-foreground-muted">
                      {rule.updated_at ? formatRelativeTime(rule.updated_at) : "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rule.enabled ? "success" : "secondary"} size="sm">
                      {rule.enabled ? "启用" : "停用"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(rule)}
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
          <DialogHeader icon={<LifeBuoy className="w-5 h-5" />} iconVariant={editing ? "info" : "success"}>
            <DialogTitle>{editing ? "编辑路由规则" : "新建路由规则"}</DialogTitle>
            <DialogDescription>空值表示“不限定”（匹配任意）。</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <FormRow label="规则名称" required>
              <Input
                value={draft.name}
                onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="紧急工单进入 VIP 队列"
              />
            </FormRow>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FormRow label="状态">
                <div className={cn("h-10 rounded-md border border-border bg-surface-100 px-3 flex items-center justify-between")}>
                  <div className="text-[12px] text-foreground-light">{draft.enabled ? "启用" : "停用"}</div>
                  <Switch
                    checked={draft.enabled}
                    onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, enabled: checked }))}
                  />
                </div>
              </FormRow>
              <FormRow label="排序">
                <Input
                  type="number"
                  value={String(draft.sortOrder)}
                  onChange={(e) => setDraft((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
                />
              </FormRow>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FormRow label="Priority">
                <select
                  value={draft.priority}
                  onChange={(e) => setDraft((prev) => ({ ...prev, priority: e.target.value }))}
                  className="h-10 w-full rounded-md border border-border bg-surface-100 px-3 text-[12px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p || "*"} value={p}>
                      {p || "*"}
                    </option>
                  ))}
                </select>
              </FormRow>
              <FormRow label="Category">
                <Input
                  value={draft.category}
                  onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="ops / billing / usage"
                />
              </FormRow>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FormRow label="Channel">
                <select
                  value={draft.channel}
                  onChange={(e) => setDraft((prev) => ({ ...prev, channel: e.target.value }))}
                  className="h-10 w-full rounded-md border border-border bg-surface-100 px-3 text-[12px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                >
                  <option value="">*</option>
                  {channelOptions.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.name} ({c.key})
                    </option>
                  ))}
                </select>
              </FormRow>
              <FormRow label="Keyword">
                <Input
                  value={draft.keyword}
                  onChange={(e) => setDraft((prev) => ({ ...prev, keyword: e.target.value }))}
                  placeholder="webhook / refund / error"
                />
              </FormRow>
            </div>

            <SettingsSection title="分派目标" description="支持 user/team/queue 三种模式。">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FormRow label="Assignee Type" required>
                  <select
                    value={draft.assigneeType}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        assigneeType: e.target.value as RuleDraft["assigneeType"],
                        assigneeValue: "",
                      }))
                    }
                    className="h-10 w-full rounded-md border border-border bg-surface-100 px-3 text-[12px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                  >
                    {ASSIGNEE_TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </FormRow>

                <FormRow label="Assignee Value" required description="user=用户ID；team/queue=对应ID。">
                  {draft.assigneeType === "team" ? (
                    <select
                      value={draft.assigneeValue}
                      onChange={(e) => setDraft((prev) => ({ ...prev, assigneeValue: e.target.value }))}
                      className="h-10 w-full rounded-md border border-border bg-surface-100 px-3 text-[12px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                    >
                      <option value="">请选择团队…</option>
                      {teams
                        .filter((t) => t.enabled)
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                    </select>
                  ) : draft.assigneeType === "queue" ? (
                    <select
                      value={draft.assigneeValue}
                      onChange={(e) => setDraft((prev) => ({ ...prev, assigneeValue: e.target.value }))}
                      className="h-10 w-full rounded-md border border-border bg-surface-100 px-3 text-[12px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                    >
                      <option value="">请选择队列…</option>
                      {queues
                        .filter((q) => q.enabled)
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((q) => (
                          <option key={q.id} value={q.id}>
                            {q.name}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <Input
                      value={draft.assigneeValue}
                      onChange={(e) => setDraft((prev) => ({ ...prev, assigneeValue: e.target.value }))}
                      placeholder="用户 UUID"
                    />
                  )}
                </FormRow>
              </div>

              {!localMode ? (
                <div className="mt-3 text-[11px] text-foreground-muted">
                  <span className="font-mono">team/queue</span> 选项来自实时配置；如列表为空，请先在“支持团队/支持队列”中创建。
                </div>
              ) : null}
            </SettingsSection>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isBusy}>
              取消
            </Button>
            <Button
              onClick={submitDraft}
              loading={isBusy}
              loadingText="保存中..."
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

