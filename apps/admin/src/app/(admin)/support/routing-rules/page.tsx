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
      toast.success("Routing rule created");
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin", "support", "routingRules"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Creation failed"),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; input: Parameters<typeof adminApi.support.routingRules.update>[1] }) =>
      adminApi.support.routingRules.update(payload.id, payload.input),
    onSuccess: async () => {
      toast.success("Routing rule updated");
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin", "support", "routingRules"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Update failed"),
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
      toast.error("Rule name is required");
      return;
    }
    const assigneeValue = draft.assigneeValue.trim();
    if (!assigneeValue) {
      toast.error("Please specify an assignment target");
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
        toast.success("Routing rule created (local mode)");
        setDialogOpen(false);
        return;
      }
      setLocalRules((prev) =>
        prev.map((r) => (r.id === editing.id ? { ...r, ...input, updated_at: now } : r))
      );
      toast.success("Routing rule updated (local mode)");
      setDialogOpen(false);
      return;
    }

    if (!canManage) {
      toast.error("You do not have permission to perform this action");
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
        title="Routing Rules"
        description="Configure automatic ticket assignment rules (priority/category/channel/keyword)."
        icon={<Route className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => rulesQuery.refetch()}
              disabled={localMode}
            >
              Refresh
            </Button>
            <Button size="sm" onClick={openCreate} disabled={!canManage && !localMode}>
              <Plus className="w-4 h-4" />
              New Rule
            </Button>
          </div>
        }
      />

      <SettingsSection title="Rule List" description="Matched by sort_order ascending; the first match is applied.">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="Search rule name"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">Include disabled</span>
            <Switch checked={includeDisabled} onCheckedChange={setIncludeDisabled} />
          </div>
          <Badge variant="outline" size="sm">
            {rows.length} total
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
              <TableHead>Rule</TableHead>
              <TableHead>Match Criteria</TableHead>
              <TableHead>Assignment Target</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rulesQuery.isPending && !localMode ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-[12px] text-foreground-muted">
                  Loading...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-[12px] text-foreground-muted">
                  {rulesQuery.error && !localMode ? "Failed to load. Please check API or permission settings." : "No rules"}
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
                      {rule.enabled ? "Enabled" : "Disabled"}
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
                      Edit
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
            <DialogTitle>{editing ? "Edit Routing Rule" : "New Routing Rule"}</DialogTitle>
            <DialogDescription>Empty values mean unrestricted (matches any).</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <FormRow label="Rule Name" required>
              <Input
                value={draft.name}
                onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Route urgent tickets to VIP queue"
              />
            </FormRow>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FormRow label="Status">
                <div className={cn("h-10 rounded-md border border-border bg-surface-100 px-3 flex items-center justify-between")}>
                  <div className="text-[12px] text-foreground-light">{draft.enabled ? "Enabled" : "Disabled"}</div>
                  <Switch
                    checked={draft.enabled}
                    onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, enabled: checked }))}
                  />
                </div>
              </FormRow>
              <FormRow label="Sort Order">
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

            <SettingsSection title="Assignment Target" description="Supports user/team/queue assignment modes.">
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

                <FormRow label="Assignee Value" required description="user=User ID; team/queue=corresponding ID.">
                  {draft.assigneeType === "team" ? (
                    <select
                      value={draft.assigneeValue}
                      onChange={(e) => setDraft((prev) => ({ ...prev, assigneeValue: e.target.value }))}
                      className="h-10 w-full rounded-md border border-border bg-surface-100 px-3 text-[12px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                    >
                      <option value="">Select a team...</option>
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
                      <option value="">Select a queue...</option>
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
                      placeholder="User UUID"
                    />
                  )}
                </FormRow>
              </div>

              {!localMode ? (
                <div className="mt-3 text-[11px] text-foreground-muted">
                  <span className="font-mono">team/queue</span> options come from live configuration. If the list is empty, please create entries in Support Teams / Support Queues first.
                </div>
              ) : null}
            </SettingsSection>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isBusy}>
              Cancel
            </Button>
            <Button
              onClick={submitDraft}
              loading={isBusy}
              loadingText="Saving..."
              disabled={(!canManage && !localMode) || isBusy}
            >
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

