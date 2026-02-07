"use client";

import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Clock,
  Edit,
  FileText,
  History,
  Settings,
} from "lucide-react";
import {
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
import { adminApi } from "@/lib/api/admin";
import { isLocalModeEnabled } from "@/lib/env";
import { formatDate, formatRelativeTime } from "@/lib/utils";

interface Rule {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Mock data
const mockRules: Rule[] = [
  {
    id: "rule-1",
    name: "API Call Billing",
    type: "usage",
    config: { rate_per_call: 0.001, free_tier: 1000 },
    enabled: true,
    created_at: "2025-06-01T00:00:00Z",
    updated_at: "2026-01-15T10:00:00Z",
  },
  {
    id: "rule-2",
    name: "Storage Billing",
    type: "storage",
    config: { rate_per_gb: 0.02, included_gb: 10 },
    enabled: true,
    created_at: "2025-06-01T00:00:00Z",
    updated_at: "2026-01-10T08:00:00Z",
  },
  {
    id: "rule-3",
    name: "Workflow Execution Billing",
    type: "execution",
    config: { rate_per_execution: 0.01, batch_discount: 0.1 },
    enabled: true,
    created_at: "2025-06-01T00:00:00Z",
    updated_at: "2025-12-20T14:00:00Z",
  },
  {
    id: "rule-4",
    name: "LLM Token Billing",
    type: "llm",
    config: { rate_per_1k_tokens: 0.03, model_multipliers: { "gpt-4": 3, "gpt-3.5-turbo": 1 } },
    enabled: true,
    created_at: "2025-08-01T00:00:00Z",
    updated_at: "2026-02-01T09:00:00Z",
  },
];

const mockChangeHistory = [
  {
    id: "ch-1",
    rule_id: "rule-4",
    rule_name: "LLM Token Billing",
    change_type: "update",
    old_value: { rate_per_1k_tokens: 0.02 },
    new_value: { rate_per_1k_tokens: 0.03 },
    changed_by: "admin@agentflow.ai",
    reason: "Adjusted GPT-4 pricing to match costs",
    created_at: "2026-02-01T09:00:00Z",
  },
  {
    id: "ch-2",
    rule_id: "rule-1",
    rule_name: "API Call Billing",
    change_type: "update",
    old_value: { free_tier: 500 },
    new_value: { free_tier: 1000 },
    changed_by: "admin@agentflow.ai",
    reason: "Expanded free tier allowance",
    created_at: "2026-01-15T10:00:00Z",
  },
  {
    id: "ch-3",
    rule_id: "rule-2",
    rule_name: "Storage Billing",
    change_type: "update",
    old_value: { rate_per_gb: 0.025 },
    new_value: { rate_per_gb: 0.02 },
    changed_by: "finance@agentflow.ai",
    reason: "Reduced storage cost",
    created_at: "2026-01-10T08:00:00Z",
  },
];

const TYPE_LABELS: Record<string, string> = {
  usage: "Usage Billing",
  storage: "Storage Billing",
  execution: "Execution Billing",
  llm: "LLM Billing",
};

export default function BillingRulesPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState<Rule | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editConfig, setEditConfig] = useState("");

  const [localRules, setLocalRules] = useState(mockRules);
  const [localHistory] = useState(mockChangeHistory);

  const rulesQuery = useQuery({
    queryKey: ["admin", "billing", "rules"],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.billing.rules.list(),
  });

  const historyQuery = useQuery({
    queryKey: ["admin", "billing", "rules", "history"],
    enabled: !localMode && historyOpen,
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.billing.rules.getChangeHistory(),
  });

  const rules = localMode ? localRules : rulesQuery.data?.items || [];
  const history = localMode ? localHistory : historyQuery.data?.items || [];

  const updateRuleMutation = useMutation({
    mutationFn: async () => {
      if (!editOpen) throw new Error("No rule selected");
      let parsedConfig;
      try {
        parsedConfig = JSON.parse(editConfig);
      } catch {
        throw new Error("Invalid configuration format");
      }
      if (localMode) {
        setLocalRules((prev) =>
          prev.map((rule) =>
            rule.id === editOpen.id
              ? { ...rule, config: parsedConfig, updated_at: new Date().toISOString() }
              : rule
          )
        );
        return { success: true };
      }
      return adminApi.billing.rules.update(editOpen.id, { config: parsedConfig });
    },
    onSuccess: () => {
      toast.success("Rule updated");
      setEditOpen(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "billing", "rules"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Update failed"),
  });

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ ruleId, enabled }: { ruleId: string; enabled: boolean }) => {
      if (localMode) {
        setLocalRules((prev) =>
          prev.map((rule) => (rule.id === ruleId ? { ...rule, enabled } : rule))
        );
        return { success: true };
      }
      return adminApi.billing.rules.update(ruleId, { enabled });
    },
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "billing", "rules"] });
    },
    onError: () => toast.error("Update failed"),
  });

  const openEditDialog = (rule: Rule) => {
    setEditOpen(rule);
    setEditConfig(JSON.stringify(rule.config, null, 2));
  };

  return (
    <PageContainer>
      <PageHeader
        title="Billing Rules Management"
        description="Manage billing rule configurations and change auditing."
        icon={<Settings className="w-4 h-4" />}
        backHref="/billing"
        backLabel="Back to Billing Overview"
        actions={
          <Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)}>
            <History className="w-3.5 h-3.5 mr-1" />
            Change History
          </Button>
        }
      />

      <SettingsSection
        title="Billing Rules"
        description="Currently active billing rule configurations."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rule Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Configuration</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rulesQuery.isPending && !localMode ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : rules.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  {rulesQuery.error && !localMode
                    ? "Failed to load. Please check API or permission settings."
                    : "No billing rules"}
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="text-[12px] font-medium text-foreground">
                    {rule.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" size="sm">
                      {TYPE_LABELS[rule.type] || rule.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[11px] text-foreground-light font-mono max-w-[200px] truncate">
                    {JSON.stringify(rule.config)}
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {formatRelativeTime(rule.updated_at)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={rule.enabled ? "success" : "secondary"} size="sm">
                      {rule.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(enabled) =>
                          toggleRuleMutation.mutate({ ruleId: rule.id, enabled })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(rule)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SettingsSection>

      {/* Edit Dialog */}
      <Dialog open={Boolean(editOpen)} onOpenChange={(open) => !open && setEditOpen(null)}>
        <DialogContent size="lg">
          <DialogHeader icon={<FileText className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>Edit Billing Rule</DialogTitle>
            <DialogDescription>
              {editOpen && (
                <span className="text-foreground-light">{editOpen.name}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[12px] text-foreground">Rule Configuration (JSON)</label>
              <textarea
                value={editConfig}
                onChange={(e) => setEditConfig(e.target.value)}
                rows={8}
                className="w-full rounded-md border border-border bg-surface-100 px-3 py-2 text-[12px] text-foreground font-mono placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-brand-500/30"
              />
              <p className="text-[11px] text-foreground-muted">
                Please ensure the configuration format is correct. Changes will take effect immediately.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateRuleMutation.mutate()}
              loading={updateRuleMutation.isPending}
              loadingText="Saving..."
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent size="xl">
          <DialogHeader icon={<History className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>Rule Change History</DialogTitle>
            <DialogDescription>
              Change records and audit log for billing rules.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Change Type</TableHead>
                  <TableHead>Changes</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyQuery.isPending && !localMode ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-[12px] text-foreground-muted"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : history.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-[12px] text-foreground-muted"
                    >
                      {historyQuery.error && !localMode
                        ? "Failed to load. Please check API or permission settings."
                        : "No change records"}
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-[12px] font-medium text-foreground">
                        {item.rule_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="info" size="sm">
                          {item.change_type === "update" ? "Update" : item.change_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[11px] text-foreground-light max-w-[200px]">
                        <div className="space-y-1">
                          {item.old_value && (
                            <div className="text-destructive-400 line-through">
                              {JSON.stringify(item.old_value)}
                            </div>
                          )}
                          <div className="text-brand-500">
                            {JSON.stringify(item.new_value)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[12px] text-foreground-light max-w-[150px] truncate">
                        {item.reason}
                      </TableCell>
                      <TableCell className="text-[12px] text-foreground-muted">
                        {item.changed_by}
                      </TableCell>
                      <TableCell className="text-[12px] text-foreground-muted">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(item.created_at)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button onClick={() => setHistoryOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
