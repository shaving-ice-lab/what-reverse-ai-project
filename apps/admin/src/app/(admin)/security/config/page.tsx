"use client";

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Settings2,
  Search,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
  MoreHorizontal,
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
import { configItemRows, userRows } from "@/lib/mock-data";
import { adminApi } from "@/lib/api/admin";
import { isLocalModeEnabled } from "@/lib/env";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { ConfigItem } from "@/types/admin";
import { usePermission } from "@/hooks/usePermission";

const CATEGORY_OPTIONS = ["all", "system", "billing", "ai", "integrations"] as const;
const CATEGORY_LABELS: Record<(typeof CATEGORY_OPTIONS)[number], string> = {
  all: "All Categories",
  system: "System",
  billing: "Billing",
  ai: "AI",
  integrations: "Integrations",
};

const VALUE_TYPE_LABELS: Record<string, string> = {
  string: "String",
  number: "Number",
  boolean: "Boolean",
  json: "JSON",
};

export default function ConfigPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canManage = hasPermission("config.write");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showSecrets, setShowSecrets] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Local state for mock data
  const [localConfigs, setLocalConfigs] = useState(() =>
    configItemRows.map((cfg) => ({
      ...cfg,
      updater: cfg.updated_by ? userRows.find((u) => u.id === cfg.updated_by) || null : null,
    })) as unknown as ConfigItem[]
  );

  const configParams = useMemo(
    () => ({
      category: categoryFilter === "all" ? undefined : categoryFilter,
      include_secrets: showSecrets || undefined,
      page,
      page_size: pageSize,
    }),
    [categoryFilter, page, pageSize, showSecrets]
  );

  const configsQuery = useQuery({
    queryKey: ["admin", "config", configParams],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.security.config.list(configParams),
  });

  const configSource = localMode ? localConfigs : configsQuery.data?.items || [];

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmActionOpen, setConfirmActionOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<ConfigItem | null>(null);
  const [editValue, setEditValue] = useState("");
  const [reasonDraft, setReasonDraft] = useState("");

  useEffect(() => {
    setPage(1);
  }, [categoryFilter, search, showSecrets]);

  // Filtering logic
  const filteredConfigs = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return configSource.filter((cfg) => {
      const matchesSearch =
        !normalized ||
        cfg.key.toLowerCase().includes(normalized) ||
        cfg.description?.toLowerCase().includes(normalized);
      const matchesCategory = categoryFilter === "all" || cfg.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [categoryFilter, configSource, search]);

  const total =
    localMode || Boolean(search.trim())
      ? filteredConfigs.length
      : configsQuery.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagedData = localMode ? filteredConfigs.slice((page - 1) * pageSize, page * pageSize) : filteredConfigs;

  // Mutations
  const updateConfigMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConfig) throw new Error("Please select a config item");
      if (!editValue.trim()) throw new Error("Value cannot be empty");

      if (localMode) {
        const next = localConfigs.map((cfg) =>
          cfg.id === selectedConfig.id
            ? {
                ...cfg,
                value: editValue,
                updated_at: new Date().toISOString(),
                updated_by: userRows[0].id,
                updater: userRows[0] || null,
              }
            : cfg
        ) as unknown as ConfigItem[];
        setLocalConfigs(next);
        return { config: next.find((cfg) => cfg.id === selectedConfig.id)! };
      }

      return adminApi.security.config.update(selectedConfig.id, {
        value: editValue,
        reason: reasonDraft,
      });
    },
    onSuccess: () => {
      toast.success("Configuration updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "config"] });
      setEditModalOpen(false);
      setConfirmActionOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Update failed");
    },
  });

  const getMaskedValue = (cfg: ConfigItem) => {
    if (cfg.is_secret && !showSecrets) {
      return "••••••••••••";
    }
    return cfg.value;
  };

  return (
    <PageContainer>
      <PageHeader
        title="Configuration Center"
        description="Manage system configuration parameters and sensitive settings."
        icon={<Settings2 className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSecrets(!showSecrets)}
            >
              {showSecrets ? (
                <EyeOff className="w-3.5 h-3.5 mr-1" />
              ) : (
                <Eye className="w-3.5 h-3.5 mr-1" />
              )}
              {showSecrets ? "Hide Sensitive Values" : "Show Sensitive Values"}
            </Button>
          </div>
        }
      />

      <SettingsSection
        title="Configuration Items"
        description="System runtime parameters and third-party integration settings."
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="Search config key or description"
              leftIcon={<Search className="w-3.5 h-3.5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
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
            {total} total
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Updated At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configsQuery.isPending && !localMode ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-[12px] text-foreground-muted">
                  Loading...
                </TableCell>
              </TableRow>
            ) : pagedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-[12px] text-foreground-muted">
                  {configsQuery.error && !localMode
                    ? "Failed to load. Please check API or permission settings."
                    : "No configuration items found"}
                </TableCell>
              </TableRow>
            ) : (
              pagedData.map((cfg) => (
                <TableRow key={cfg.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-[12px] font-mono text-foreground">
                        {cfg.key}
                      </span>
                      {cfg.is_secret && (
                        <Lock className="w-3 h-3 text-warning-default" />
                      )}
                    </div>
                    {cfg.description && (
                      <div className="text-[11px] text-foreground-muted mt-0.5">
                        {cfg.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-[11px] font-mono text-foreground-light bg-surface-100 px-1.5 py-0.5 rounded max-w-[200px] truncate block">
                      {getMaskedValue(cfg)}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" size="sm">
                      {VALUE_TYPE_LABELS[cfg.value_type] || cfg.value_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-[12px] text-foreground-light">
                      {CATEGORY_LABELS[cfg.category as keyof typeof CATEGORY_LABELS] || cfg.category || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {formatRelativeTime(cfg.updated_at)}
                    {cfg.updater && (
                      <div className="text-[11px] text-foreground-muted">
                        by {cfg.updater.email}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedConfig(cfg);
                        setEditValue(cfg.is_secret && !showSecrets ? "" : cfg.value);
                        setReasonDraft("");
                        setEditModalOpen(true);
                      }}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
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

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent size="lg">
          <DialogHeader icon={<Settings2 className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>Edit Configuration</DialogTitle>
            <DialogDescription>
              {selectedConfig?.key}
            </DialogDescription>
          </DialogHeader>

          {selectedConfig && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="grid gap-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Type</span>
                    <Badge variant="outline" size="sm">
                      {VALUE_TYPE_LABELS[selectedConfig.value_type]}
                    </Badge>
                  </div>
                  {selectedConfig.description && (
                    <div>
                      <span className="text-foreground-muted">Description</span>
                      <div className="text-foreground mt-1">{selectedConfig.description}</div>
                    </div>
                  )}
                </div>
              </div>

              {selectedConfig.is_secret && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-warning-default/10 border border-warning-default/20">
                  <AlertCircle className="w-4 h-4 text-warning-default shrink-0 mt-0.5" />
                  <div className="text-[12px] text-foreground-light">
                    This is a sensitive configuration item. Please ensure the value is correct after modification, as incorrect values may cause system failures.
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="text-[12px] font-medium text-foreground mb-3">New Value</div>
                {selectedConfig.value_type === "boolean" ? (
                  <select
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full h-9 rounded-md border border-border bg-surface-100 px-3 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : selectedConfig.value_type === "json" ? (
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={4}
                    placeholder="Enter value in JSON format"
                    className={cn(
                      "w-full rounded-md border border-border bg-surface-100 px-3 py-2 font-mono",
                      "text-[12px] text-foreground placeholder:text-foreground-muted",
                      "focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                    )}
                  />
                ) : (
                  <Input
                    inputSize="sm"
                    type={selectedConfig.value_type === "number" ? "number" : "text"}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder={selectedConfig.is_secret ? "Enter new value" : `Current value: ${selectedConfig.value}`}
                  />
                )}

                <div className="mt-4 text-[12px] font-medium text-foreground mb-2">Change Reason</div>
                <textarea
                  value={reasonDraft}
                  onChange={(e) => setReasonDraft(e.target.value)}
                  rows={2}
                  placeholder="Enter change reason (optional)"
                  className={cn(
                    "w-full rounded-md border border-border bg-surface-100 px-3 py-2",
                    "text-[12px] text-foreground placeholder:text-foreground-muted",
                    "focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
                  )}
                />

                <div className="flex items-center justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={!canManage || !editValue.trim()}
                    onClick={() => setConfirmActionOpen(true)}
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter />
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <AlertDialog
        open={confirmActionOpen}
        onOpenChange={setConfirmActionOpen}
        type="warning"
        title="Confirm Configuration Change?"
        description={`Update the value of "${selectedConfig?.key}" to the new value. This action will be recorded in the audit log.`}
        confirmText="Confirm Change"
        cancelText="Cancel"
        loading={updateConfigMutation.isPending}
        onConfirm={() => {
          updateConfigMutation.mutate();
        }}
      />
    </PageContainer>
  );
}
