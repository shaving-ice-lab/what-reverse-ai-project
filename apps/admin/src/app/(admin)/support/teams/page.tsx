"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LifeBuoy, Plus, Settings2, Users2, UserPlus } from "lucide-react";
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
  supportTeamMembers as supportTeamMembersMock,
  supportTeams as supportTeamsMock,
  userRows,
} from "@/lib/mock-data";
import { isLocalModeEnabled } from "@/lib/env";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { SupportTeam, SupportTeamMember } from "@/types/admin";

type TeamDraft = {
  name: string;
  description: string;
  enabled: boolean;
};

type MemberDraft = {
  userId: string;
  role: string;
  sortOrder: number;
};

function safeUuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function toTeamDraft(team?: SupportTeam | null): TeamDraft {
  return {
    name: team?.name || "",
    description: team?.description || "",
    enabled: team?.enabled ?? true,
  };
}

function toMemberDraft(): MemberDraft {
  return { userId: "", role: "", sortOrder: 0 };
}

export default function SupportTeamsPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();
  const { hasCapability } = useAdminCapabilities();
  const canManage = hasCapability("support.manage");

  const [search, setSearch] = useState("");
  const [includeDisabled, setIncludeDisabled] = useState(false);

  const [localTeams, setLocalTeams] = useState<SupportTeam[]>(
    () => supportTeamsMock as unknown as SupportTeam[]
  );
  const [localMembers, setLocalMembers] = useState<SupportTeamMember[]>(
    () => supportTeamMembersMock as unknown as SupportTeamMember[]
  );

  const teamsQuery = useQuery({
    queryKey: ["admin", "support", "teams", { includeDisabled }],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.support.teams.list({ include_disabled: includeDisabled }),
  });

  const rows = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const source = localMode ? localTeams : teamsQuery.data?.teams || [];
    return source
      .filter((team) => (includeDisabled ? true : team.enabled))
      .filter((team) => (!normalized ? true : team.name.toLowerCase().includes(normalized)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [includeDisabled, localMode, localTeams, search, teamsQuery.data?.teams]);

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

  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<SupportTeam | null>(null);
  const [teamDraft, setTeamDraft] = useState<TeamDraft>(() => toTeamDraft(null));

  const [membersOpen, setMembersOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<SupportTeam | null>(null);
  const [memberDraft, setMemberDraft] = useState<MemberDraft>(() => toMemberDraft());
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<{ userId: string } | null>(null);

  const membersQuery = useQuery({
    queryKey: ["admin", "support", "teams", selectedTeam?.id, "members"],
    enabled: !localMode && membersOpen && Boolean(selectedTeam?.id),
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.support.teams.members.list(selectedTeam!.id),
  });

  const localTeamMembers = useMemo(() => {
    if (!selectedTeam) return [];
    return localMembers.filter((m) => m.team_id === selectedTeam.id).sort((a, b) => a.sort_order - b.sort_order);
  }, [localMembers, selectedTeam]);

  const memberRows = localMode ? localTeamMembers : membersQuery.data?.members || [];

  const createTeamMutation = useMutation({
    mutationFn: (input: { name: string; description?: string | null; enabled?: boolean }) =>
      adminApi.support.teams.create(input),
    onSuccess: async () => {
      toast.success("Team created");
      setTeamDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin", "support", "teams"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Creation failed"),
  });

  const updateTeamMutation = useMutation({
    mutationFn: (payload: { id: string; input: { name?: string; description?: string | null; enabled?: boolean } }) =>
      adminApi.support.teams.update(payload.id, payload.input),
    onSuccess: async () => {
      toast.success("Team updated");
      setTeamDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin", "support", "teams"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Update failed"),
  });

  const addMemberMutation = useMutation({
    mutationFn: (payload: { teamId: string; input: { user_id: string; role?: string | null; sort_order?: number } }) =>
      adminApi.support.teams.members.add(payload.teamId, payload.input),
    onSuccess: async () => {
      toast.success("Member added");
      setMemberDraft(toMemberDraft());
      await queryClient.invalidateQueries({
        queryKey: ["admin", "support", "teams", selectedTeam?.id, "members"],
      });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to add member"),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (payload: { teamId: string; userId: string }) =>
      adminApi.support.teams.members.remove(payload.teamId, payload.userId),
    onSuccess: async () => {
      toast.success("Member removed");
      await queryClient.invalidateQueries({
        queryKey: ["admin", "support", "teams", selectedTeam?.id, "members"],
      });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Removal failed"),
  });

  const openCreateTeam = () => {
    setEditingTeam(null);
    setTeamDraft(toTeamDraft(null));
    setTeamDialogOpen(true);
  };

  const openEditTeam = (team: SupportTeam) => {
    setEditingTeam(team);
    setTeamDraft(toTeamDraft(team));
    setTeamDialogOpen(true);
  };

  const submitTeamDraft = async () => {
    const name = teamDraft.name.trim();
    if (!name) {
      toast.error("Team name is required");
      return;
    }
    const input = {
      name,
      description: teamDraft.description.trim() || null,
      enabled: teamDraft.enabled,
    };

    if (localMode) {
      const now = new Date().toISOString();
      if (!editingTeam) {
        const next: SupportTeam = {
          id: safeUuid(),
          name: input.name,
          description: input.description,
          enabled: Boolean(input.enabled),
          created_at: now,
          updated_at: now,
        };
        setLocalTeams((prev) => [next, ...prev]);
        toast.success("Team created (local mode)");
        setTeamDialogOpen(false);
        return;
      }
      setLocalTeams((prev) =>
        prev.map((t) =>
          t.id === editingTeam.id
            ? { ...t, ...input, updated_at: now }
            : t
        )
      );
      toast.success("Team updated (local mode)");
      setTeamDialogOpen(false);
      return;
    }

    if (!canManage) {
      toast.error("You do not have permission to perform this action");
      return;
    }

    if (!editingTeam) {
      await createTeamMutation.mutateAsync(input);
      return;
    }
    await updateTeamMutation.mutateAsync({ id: editingTeam.id, input });
  };

  const openMembers = (team: SupportTeam) => {
    setSelectedTeam(team);
    setMembersOpen(true);
  };

  const addMember = async () => {
    if (!selectedTeam) return;
    const userId = memberDraft.userId.trim();
    if (!userId) {
      toast.error("Please enter a User ID");
      return;
    }

    const input = {
      user_id: userId,
      role: memberDraft.role.trim() || null,
      sort_order: Number.isFinite(memberDraft.sortOrder) ? memberDraft.sortOrder : 0,
    };

    if (localMode) {
      const now = new Date().toISOString();
      const next: SupportTeamMember = {
        id: safeUuid(),
        team_id: selectedTeam.id,
        user_id: input.user_id,
        role: input.role,
        sort_order: input.sort_order,
        created_at: now,
      };
      setLocalMembers((prev) => [next, ...prev]);
      toast.success("Member added (local mode)");
      setMemberDraft(toMemberDraft());
      return;
    }

    if (!canManage) {
      toast.error("You do not have permission to perform this action");
      return;
    }

    await addMemberMutation.mutateAsync({ teamId: selectedTeam.id, input });
  };

  const requestRemove = (userId: string) => {
    setPendingRemove({ userId });
    setRemoveConfirmOpen(true);
  };

  const confirmRemove = async () => {
    if (!selectedTeam || !pendingRemove) return;
    const userId = pendingRemove.userId;
    setPendingRemove(null);

    if (localMode) {
      setLocalMembers((prev) => prev.filter((m) => !(m.team_id === selectedTeam.id && m.user_id === userId)));
      toast.success("Member removed (local mode)");
      return;
    }

    if (!canManage) {
      toast.error("You do not have permission to perform this action");
      return;
    }
    await removeMemberMutation.mutateAsync({ teamId: selectedTeam.id, userId });
  };

  const isBusy =
    createTeamMutation.isPending ||
    updateTeamMutation.isPending ||
    addMemberMutation.isPending ||
    removeMemberMutation.isPending;

  return (
    <PageContainer>
      <PageHeader
        title="Support Teams"
        description="Manage support teams and member assignments for ticket routing and notification distribution."
        icon={<Users2 className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => teamsQuery.refetch()} disabled={localMode}>
              Refresh
            </Button>
            <Button size="sm" onClick={openCreateTeam} disabled={!canManage && !localMode}>
              <Plus className="w-4 h-4" />
              New Team
            </Button>
          </div>
        }
      />

      <SettingsSection title="Team List" description="Teams can be used for automatic ticket assignment (assignee_type=team).">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="Search team name"
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
              <TableHead>Team</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamsQuery.isPending && !localMode ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-[12px] text-foreground-muted">
                  Loading...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-[12px] text-foreground-muted">
                  {teamsQuery.error && !localMode ? "Failed to load. Please check API or permission settings." : "No teams"}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>
                    <div className="text-[12px] font-medium text-foreground">{team.name}</div>
                    <div className="text-[11px] text-foreground-muted">
                      {team.description || <span className="font-mono">{team.id}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={team.enabled ? "success" : "secondary"} size="sm">
                      {team.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {team.updated_at ? formatRelativeTime(team.updated_at) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openMembers(team)} disabled={isBusy}>
                        <LifeBuoy className="w-4 h-4" />
                        Members
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditTeam(team)}
                        disabled={(!canManage && !localMode) || isBusy}
                      >
                        <Settings2 className="w-4 h-4" />
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SettingsSection>

      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent>
          <DialogHeader icon={<Users2 className="w-5 h-5" />} iconVariant={editingTeam ? "info" : "success"}>
            <DialogTitle>{editingTeam ? "Edit Team" : "New Team"}</DialogTitle>
            <DialogDescription>Teams are used for ticket routing and on-call scheduling.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <FormRow label="Name" required>
              <Input
                value={teamDraft.name}
                onChange={(e) => setTeamDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Support L1"
              />
            </FormRow>
            <FormRow label="Description">
              <Input
                value={teamDraft.description}
                onChange={(e) => setTeamDraft((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Front-line support and common issue handling"
              />
            </FormRow>
            <FormRow label="Status">
              <div
                className={cn(
                  "h-10 rounded-md border border-border bg-surface-100 px-3 flex items-center justify-between"
                )}
              >
                <div className="text-[12px] text-foreground-light">{teamDraft.enabled ? "Enabled" : "Disabled"}</div>
                <Switch
                  checked={teamDraft.enabled}
                  onCheckedChange={(checked) => setTeamDraft((prev) => ({ ...prev, enabled: checked }))}
                />
              </div>
            </FormRow>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTeamDialogOpen(false)} disabled={isBusy}>
              Cancel
            </Button>
            <Button
              onClick={submitTeamDraft}
              loading={createTeamMutation.isPending || updateTeamMutation.isPending}
              loadingText="Saving..."
              disabled={(!canManage && !localMode) || isBusy}
            >
              {editingTeam ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent size="2xl">
          <DialogHeader icon={<UserPlus className="w-5 h-5" />} iconVariant="info">
            <DialogTitle>Team Members</DialogTitle>
            <DialogDescription>
              {selectedTeam ? (
                <>
                  {selectedTeam.name} · <span className="font-mono">{selectedTeam.id}</span>
                </>
              ) : (
                "Please select a team"
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedTeam ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-surface-100 p-4">
                <div className="text-[12px] font-medium text-foreground mb-3">Add Member</div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <FormRow label="User ID" required>
                    <Input
                      value={memberDraft.userId}
                      onChange={(e) => setMemberDraft((prev) => ({ ...prev, userId: e.target.value }))}
                      placeholder="uuid"
                    />
                  </FormRow>
                  <FormRow label="Role (optional)">
                    <Input
                      value={memberDraft.role}
                      onChange={(e) => setMemberDraft((prev) => ({ ...prev, role: e.target.value }))}
                      placeholder="primary / oncall"
                    />
                  </FormRow>
                  <FormRow label="Sort Order">
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
                    loadingText="Adding..."
                  >
                    <UserPlus className="w-4 h-4" />
                    Add
                  </Button>
                </div>
              </div>

              <SettingsSection
                title="Member List"
                description="assignee_type=team resolves the member list as notification recipients."
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Sort Order</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {membersQuery.isPending && !localMode ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-[12px] text-foreground-muted">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : memberRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-[12px] text-foreground-muted">
                          {membersQuery.error && !localMode ? "Load failed" : "No members"}
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
                          <TableCell className="text-[12px] text-foreground-muted">
                            {m.role || "-"}
                          </TableCell>
                          <TableCell className="text-[12px] text-foreground-muted">
                            {m.sort_order}
                          </TableCell>
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
                              Remove
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
        title="Confirm member removal?"
        description="This member will no longer receive ticket notifications for this team."
        confirmText="Remove"
        cancelText="Cancel"
        loading={removeMemberMutation.isPending}
        onConfirm={() => void confirmRemove()}
      />
    </PageContainer>
  );
}

