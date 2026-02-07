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
    throw new Error("SLA Overrides must be a JSON object");
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
      toast.success("Support channel created");
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin", "support", "channels"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Creation failed");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; input: Parameters<typeof adminApi.support.channels.update>[1] }) =>
      adminApi.support.channels.update(payload.id, payload.input),
    onSuccess: async () => {
      toast.success("Support channel updated");
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin", "support", "channels"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Update failed");
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
      toast.error("Key and Name are required");
      return;
    }

    let slaOverrides: Record<string, number> = {};
    try {
      slaOverrides = parseSlaOverrides(draft.slaOverridesJson);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to parse SLA Overrides");
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
        toast.success("Support channel created (local mode)");
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
      toast.success("Support channel updated (local mode)");
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

  return (
    <PageContainer>
      <PageHeader
        title="Support Channels"
        description="Configure channel entry points, contact info, and SLA rules."
        icon={<LifeBuoy className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => channelsQuery.refetch()} disabled={localMode}>
              Refresh
            </Button>
            <Button size="sm" onClick={openCreate} disabled={!canManage && !localMode}>
              <Plus className="w-4 h-4" />
              New Channel
            </Button>
          </div>
        }
      />

      <SettingsSection title="Channel List" description="Used for ticket source identification and notification template routing.">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="Search channel name / key / contact"
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
              <TableHead>Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>SLA</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {channelsQuery.isPending && !localMode ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-[12px] text-foreground-muted">
                  Loading...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-[12px] text-foreground-muted">
                  {channelsQuery.error && !localMode ? "Failed to load. Please check API or permission settings." : "No channels configured"}
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
                      {channel.enabled ? "Enabled" : "Disabled"}
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
          <DialogHeader
            icon={<Settings2 className="w-5 h-5" />}
            iconVariant={editing ? "info" : "success"}
          >
            <DialogTitle>{editing ? "Edit Channel" : "New Channel"}</DialogTitle>
            <DialogDescription>
              Channels are used to distinguish ticket sources and serve as a routing dimension for notification templates.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <FormRow label="Key" required description="Use a short key (e.g. email/dashboard/system).">
              <Input
                value={draft.key}
                onChange={(e) => setDraft((prev) => ({ ...prev, key: e.target.value }))}
                placeholder="system"
              />
            </FormRow>

            <FormRow label="Name" required>
              <Input
                value={draft.name}
                onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="System Channel"
              />
            </FormRow>

            <FormRow label="Description">
              <Input
                value={draft.description}
                onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Internal channel for system alerts and default notifications"
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
              <FormRow label="Sort Order" description="Lower numbers appear first.">
                <Input
                  type="number"
                  value={String(draft.sortOrder)}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))
                  }
                />
              </FormRow>

              <FormRow label="Status">
                <div
                  className={cn(
                    "h-10 rounded-md border border-border bg-surface-100 px-3 flex items-center justify-between"
                  )}
                >
                  <div className="text-[12px] text-foreground-light">
                    {draft.enabled ? "Enabled" : "Disabled"}
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
              description='Optional. Example: { "first_response_minutes": 60, "resolve_minutes": 2880 }'
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
              Cancel
            </Button>
            <Button
              onClick={submitDraft}
              loading={isBusy}
              loadingText={editing ? "Saving..." : "Creating..."}
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

