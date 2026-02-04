"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Settings2, UserPlus, UsersRound } from "lucide-react";
import {
  FormRow,
  PageContainer,
  PageHeader,
  SettingsSection,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
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
  supportQueueMembers as supportQueueMembersMock,
  supportQueues as supportQueuesMock,
  userRows,
} from "@/lib/mock-data";
import { isLocalModeEnabled } from "@/lib/env";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { SupportQueue, SupportQueueMember } from "@/types/admin";

type QueueDraft = {
  name: string;
  description: string;
  enabled: boolean;
};

type MemberDraft = {
  userId: string;
  sortOrder: number;
};

function safeUuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function toQueueDraft(queue?: SupportQueue | null): QueueDraft {
  return {
    name: queue?.name || "",
    description: queue?.description || "",
    enabled: queue?.enabled ?? true,
  };
}

function toMemberDraft(): MemberDraft {
  return { userId: "", sortOrder: 0 };
}

export default function SupportQueuesPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();
  const { hasCapability } = useAdminCapabilities();
  const canManage = hasCapability("support.manage");

  const [search, setSearch] = useState("");
  const [includeDisabled, setIncludeDisabled] = useState(false);

  const [localQueues, setLocalQueues] = useState<SupportQueue[]>(
    () => supportQueuesMock as unknown as SupportQueue[]
  );
  const [localMembers, setLocalMembers] = useState<SupportQueueMember[]>(
    () => supportQueueMembersMock as unknown as SupportQueueMember[]
  );

  const queuesQuery = useQuery({
    queryKey: ["admin", "support", "queues", { includeDisabled }],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.support.queues.list({ include_disabled: includeDisabled }),
  });

  const rows = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const source = localMode ? localQueues : queuesQuery.data?.queues || [];
    return source
      .filter((q) => (includeDisabled ? true : q.enabled))
      .filter((q) => (!normalized ? true : q.name.toLowerCase().includes(normalized)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [includeDisabled, localMode, localQueues, queuesQuery.data?.queues, search]);

  const userMap = useMemo(() => {
    const map = new Map<string, { email?: string; display_name?: string }>();
    (userRows as unknown as Array<{ id: string; email?: string; display_name?: string }>).forEach((u) =>
      map.set(u.id, u)
    );
    return map;
  }, []);

  const resolveUserLabel = (userId: string) => {
    const user = userMap.get(userId);
    if (!user) return userId;
    return user.email || user.display_name || userId;
  };

  const [queueDialogOpen, setQueueDialogOpen] = useState(false);
  const [editingQueue, setEditingQueue] = useState<SupportQueue | null>(null);
  const [queueDraft, setQueueDraft] = useState<QueueDraft>(() => toQueueDraft(null));

  const [membersOpen, setMembersOpen] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState<SupportQueue | null>(null);
  const [memberDraft, setMemberDraft] = useState<MemberDraft>(() => toMemberDraft());
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<{ userId: string } | null>(null);

  const membersQuery = useQuery({
    queryKey: ["admin", "support", "queues", selectedQueue?.id, "members"],
    enabled: !localMode && membersOpen && Boolean(selectedQueue?.id),
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.support.queues.members.list(selectedQueue!.id),
  });

  const localQueueMembers = useMemo(() => {
    if (!selectedQueue) return [];
    return localMembers
      .filter((m) => m.queue_id === selectedQueue.id)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [localMembers, selectedQueue]);

  const memberRows = localMode ? localQueueMembers : membersQuery.data?.members || [];

  const createQueueMutation = useMutation({
    mutationFn: (input: { name: string; description?: string | null; enabled?: boolean }) =>
      adminApi.support.queues.create(input),
    onSuccess: async () => {
      toast.success("已创建队列");
      setQueueDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin", "support", "queues"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "创建失败"),
  });

  const updateQueueMutation = useMutation({
    mutationFn: (payload: { id: string; input: { name?: string; description?: string | null; enabled?: boolean } }) =>
      adminApi.support.queues.update(payload.id, payload.input),
    onSuccess: async () => {
      toast.success("已更新队列");
      setQueueDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin", "support", "queues"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "更新失败"),
  });

  const addMemberMutation = useMutation({
    mutationFn: (payload: { queueId: string; input: { user_id: string; sort_order?: number } }) =>
      adminApi.support.queues.members.add(payload.queueId, payload.input),
    onSuccess: async () => {
      toast.success("已添加成员");
      setMemberDraft(toMemberDraft());
      await queryClient.invalidateQueries({
        queryKey: ["admin", "support", "queues", selectedQueue?.id, "members"],
      });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "添加成员失败"),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (payload: { queueId: string; userId: string }) =>
      adminApi.support.queues.members.remove(payload.queueId, payload.userId),
    onSuccess: async () => {
      toast.success("已移除成员");
      await queryClient.invalidateQueries({
        queryKey: ["admin", "support", "queues", selectedQueue?.id, "members"],
      });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "移除失败"),
  });

  const openCreateQueue = () => {
    setEditingQueue(null);
    setQueueDraft(toQueueDraft(null));
    setQueueDialogOpen(true);
  };

  const openEditQueue = (queue: SupportQueue) => {
    setEditingQueue(queue);
    setQueueDraft(toQueueDraft(queue));
    setQueueDialogOpen(true);
  };

  const submitQueueDraft = async () => {
    const name = queueDraft.name.trim();
    if (!name) {
      toast.error("队列名称为必填项");
      return;
    }
    const input = {
      name,
      description: queueDraft.description.trim() || null,
      enabled: queueDraft.enabled,
    };

    if (localMode) {
      const now = new Date().toISOString();
      if (!editingQueue) {
        const next: SupportQueue = {
          id: safeUuid(),
          name: input.name,
          description: input.description,
          enabled: Boolean(input.enabled),
          created_at: now,
          updated_at: now,
        };
        setLocalQueues((prev) => [next, ...prev]);
        toast.success("已创建队列（本地模式）");
        setQueueDialogOpen(false);
        return;
      }
      setLocalQueues((prev) =>
        prev.map((q) => (q.id === editingQueue.id ? { ...q, ...input, updated_at: now } : q))
      );
      toast.success("已更新队列（本地模式）");
      setQueueDialogOpen(false);
      return;
    }

    if (!canManage) {
      toast.error("无权限执行该操作");
      return;
    }
    if (!editingQueue) {
      await createQueueMutation.mutateAsync(input);
      return;
    }
    await updateQueueMutation.mutateAsync({ id: editingQueue.id, input });
  };

  const openMembers = (queue: SupportQueue) => {
    setSelectedQueue(queue);
    setMembersOpen(true);
  };

  const addMember = async () => {
    if (!selectedQueue) return;
    const userId = memberDraft.userId.trim();
    if (!userId) {
      toast.error("请填写用户 ID");
      return;
    }
    const input = {
      user_id: userId,
      sort_order: Number.isFinite(memberDraft.sortOrder) ? memberDraft.sortOrder : 0,
    };

    if (localMode) {
      const now = new Date().toISOString();
      const next: SupportQueueMember = {
        id: safeUuid(),
        queue_id: selectedQueue.id,
        user_id: input.user_id,
        sort_order: input.sort_order,
        created_at: now,
      };
      setLocalMembers((prev) => [next, ...prev]);
      toast.success("已添加成员（本地模式）");
      setMemberDraft(toMemberDraft());
      return;
    }

    if (!canManage) {
      toast.error("无权限执行该操作");
      return;
    }
    await addMemberMutation.mutateAsync({ queueId: selectedQueue.id, input });
  };

  const requestRemove = (userId: string) => {
    setPendingRemove({ userId });
    setRemoveConfirmOpen(true);
  };

  const confirmRemove = async () => {
    if (!selectedQueue || !pendingRemove) return;
    const userId = pendingRemove.userId;
    setPendingRemove(null);

    if (localMode) {
      setLocalMembers((prev) => prev.filter((m) => !(m.queue_id === selectedQueue.id && m.user_id === userId)));
      toast.success("已移除成员（本地模式）");
      return;
    }

    if (!canManage) {
      toast.error("无权限执行该操作");
      return;
    }
    await removeMemberMutation.mutateAsync({ queueId: selectedQueue.id, userId });
  };

  const isBusy =
    createQueueMutation.isPending ||
    updateQueueMutation.isPending ||
    addMemberMutation.isPending ||
    removeMemberMutation.isPending;

  return (
    <PageContainer>
      <PageHeader
        title="支持队列"
        description="管理支持队列与成员，用于工单路由与通知汇聚。"
        icon={<UsersRound className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => queuesQuery.refetch()} disabled={localMode}>
              刷新
            </Button>
            <Button size="sm" onClick={openCreateQueue} disabled={!canManage && !localMode}>
              <Plus className="w-4 h-4" />
              新建队列
            </Button>
          </div>
        }
      />

      <SettingsSection title="队列列表" description="队列可用于工单自动分派（assignee_type=queue）。">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="搜索队列名称"
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
              <TableHead>队列</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queuesQuery.isPending && !localMode ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-[12px] text-foreground-muted">
                  正在加载...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-[12px] text-foreground-muted">
                  {queuesQuery.error && !localMode ? "加载失败，请检查 API 或权限配置" : "暂无队列"}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((queue) => (
                <TableRow key={queue.id}>
                  <TableCell>
                    <div className="text-[12px] font-medium text-foreground">{queue.name}</div>
                    <div className="text-[11px] text-foreground-muted">
                      {queue.description || <span className="font-mono">{queue.id}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={queue.enabled ? "success" : "secondary"} size="sm">
                      {queue.enabled ? "启用" : "停用"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {queue.updated_at ? formatRelativeTime(queue.updated_at) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openMembers(queue)} disabled={isBusy}>
                        成员
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditQueue(queue)}
                        disabled={(!canManage && !localMode) || isBusy}
                      >
                        <Settings2 className="w-4 h-4" />
                        编辑
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SettingsSection>

      <Dialog open={queueDialogOpen} onOpenChange={setQueueDialogOpen}>
        <DialogContent>
          <DialogHeader icon={<UsersRound className="w-5 h-5" />} iconVariant={editingQueue ? "info" : "success"}>
            <DialogTitle>{editingQueue ? "编辑队列" : "新建队列"}</DialogTitle>
            <DialogDescription>队列用于工单路由与批量通知。</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <FormRow label="名称" required>
              <Input
                value={queueDraft.name}
                onChange={(e) => setQueueDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="VIP Queue"
              />
            </FormRow>
            <FormRow label="描述">
              <Input
                value={queueDraft.description}
                onChange={(e) => setQueueDraft((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="企业客户与高优先级工单队列"
              />
            </FormRow>
            <FormRow label="状态">
              <div
                className={cn(
                  "h-10 rounded-md border border-border bg-surface-100 px-3 flex items-center justify-between"
                )}
              >
                <div className="text-[12px] text-foreground-light">{queueDraft.enabled ? "启用" : "停用"}</div>
                <Switch
                  checked={queueDraft.enabled}
                  onCheckedChange={(checked) => setQueueDraft((prev) => ({ ...prev, enabled: checked }))}
                />
              </div>
            </FormRow>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setQueueDialogOpen(false)} disabled={isBusy}>
              取消
            </Button>
            <Button
              onClick={submitQueueDraft}
              loading={createQueueMutation.isPending || updateQueueMutation.isPending}
              loadingText="保存中..."
              disabled={(!canManage && !localMode) || isBusy}
            >
              {editingQueue ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent size="2xl">
          <DialogHeader icon={<UserPlus className="w-5 h-5" />} iconVariant="info">
            <DialogTitle>队列成员</DialogTitle>
            <DialogDescription>
              {selectedQueue ? (
                <>
                  {selectedQueue.name} · <span className="font-mono">{selectedQueue.id}</span>
                </>
              ) : (
                "请选择队列"
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedQueue ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-surface-100 p-4">
                <div className="text-[12px] font-medium text-foreground mb-3">添加成员</div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <FormRow label="用户 ID" required>
                    <Input
                      value={memberDraft.userId}
                      onChange={(e) => setMemberDraft((prev) => ({ ...prev, userId: e.target.value }))}
                      placeholder="uuid"
                    />
                  </FormRow>
                  <FormRow label="排序">
                    <Input
                      type="number"
                      value={String(memberDraft.sortOrder)}
                      onChange={(e) =>
                        setMemberDraft((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))
                      }
                    />
                  </FormRow>
                </div>
                <div className="mt-3 flex items-center justify-end">
                  <Button
                    size="sm"
                    onClick={addMember}
                    disabled={(!canManage && !localMode) || isBusy}
                    loading={addMemberMutation.isPending}
                    loadingText="添加中..."
                  >
                    <UserPlus className="w-4 h-4" />
                    添加
                  </Button>
                </div>
              </div>

              <SettingsSection title="成员列表" description="assignee_type=queue 会解析成员列表作为通知接收者。">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>用户</TableHead>
                      <TableHead>排序</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {membersQuery.isPending && !localMode ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-10 text-center text-[12px] text-foreground-muted">
                          正在加载...
                        </TableCell>
                      </TableRow>
                    ) : memberRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-10 text-center text-[12px] text-foreground-muted">
                          {membersQuery.error && !localMode ? "加载失败" : "暂无成员"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      memberRows.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell>
                            <div className="text-[12px] font-medium text-foreground">
                              {resolveUserLabel(m.user_id)}
                            </div>
                            <div className="text-[11px] text-foreground-muted font-mono">{m.user_id}</div>
                          </TableCell>
                          <TableCell className="text-[12px] text-foreground-muted">{m.sort_order}</TableCell>
                          <TableCell className="text-[12px] text-foreground-muted">
                            {m.created_at ? formatRelativeTime(m.created_at) : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => requestRemove(m.user_id)}
                              disabled={(!canManage && !localMode) || isBusy}
                            >
                              移除
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </SettingsSection>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={removeConfirmOpen}
        onOpenChange={setRemoveConfirmOpen}
        type="warning"
        title="确认移除成员？"
        description="该成员将不再接收该队列的工单通知。"
        confirmText="移除"
        cancelText="取消"
        loading={removeMemberMutation.isPending}
        onConfirm={() => void confirmRemove()}
      />
    </PageContainer>
  );
}

