"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BarChart3,
  Bell,
  Calendar,
  CheckSquare,
  Clock,
  Edit,
  FileDown,
  Mail,
  Plus,
  Square,
  Trash2,
  Webhook,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  SettingsSection,
  StatsCard,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ConfirmDialog,
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
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";

// Mock data
interface Subscription {
  id: string;
  name: string;
  metric_keys: string[];
  frequency: string;
  delivery_method: string;
  recipients: string[];
  enabled: boolean;
  last_sent_at: string | null;
  created_at: string;
}

const mockSubscriptions: Subscription[] = [
  {
    id: "sub-1",
    name: "Daily Active Users Report",
    metric_keys: ["dau", "mau", "user_retention"],
    frequency: "daily",
    delivery_method: "email",
    recipients: ["admin@agentflow.ai", "analytics@agentflow.ai"],
    enabled: true,
    last_sent_at: "2026-02-03T06:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "sub-2",
    name: "Weekly Revenue Summary",
    metric_keys: ["revenue", "mrr", "churn_rate"],
    frequency: "weekly",
    delivery_method: "email",
    recipients: ["finance@agentflow.ai"],
    enabled: true,
    last_sent_at: "2026-02-02T09:00:00Z",
    created_at: "2026-01-05T00:00:00Z",
  },
  {
    id: "sub-3",
    name: "API Performance Alert",
    metric_keys: ["api_latency", "error_rate", "throughput"],
    frequency: "daily",
    delivery_method: "webhook",
    recipients: ["https://slack.example.com/hooks/metrics"],
    enabled: false,
    last_sent_at: "2026-01-30T06:00:00Z",
    created_at: "2026-01-10T00:00:00Z",
  },
];

const mockAvailableMetrics = [
  { key: "dau", name: "Daily Active Users", category: "Users", description: "Number of daily active users" },
  { key: "mau", name: "Monthly Active Users", category: "Users", description: "Number of monthly active users" },
  { key: "user_retention", name: "User Retention Rate", category: "Users", description: "User retention percentage" },
  { key: "revenue", name: "Revenue", category: "Finance", description: "Total revenue amount" },
  { key: "mrr", name: "Monthly Recurring Revenue", category: "Finance", description: "MRR amount" },
  { key: "churn_rate", name: "Churn Rate", category: "Finance", description: "User churn percentage" },
  { key: "api_latency", name: "API Latency", category: "Performance", description: "Average API response time" },
  { key: "error_rate", name: "Error Rate", category: "Performance", description: "Request error percentage" },
  { key: "throughput", name: "Throughput", category: "Performance", description: "Requests per second" },
  { key: "executions", name: "Executions", category: "Usage", description: "Workflow execution count" },
  { key: "conversations", name: "Conversations", category: "Usage", description: "Conversation session count" },
  { key: "storage_used", name: "Storage Used", category: "Usage", description: "Used storage space" },
];

const mockExportJobs = [
  { id: "exp-1", metric_keys: ["dau", "mau"], start_date: "2026-01-01", end_date: "2026-01-31", format: "csv", status: "completed", created_at: "2026-02-01T10:00:00Z" },
  { id: "exp-2", metric_keys: ["revenue", "mrr"], start_date: "2025-12-01", end_date: "2025-12-31", format: "json", status: "completed", created_at: "2026-01-02T09:00:00Z" },
];

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

type Metric = (typeof mockAvailableMetrics)[number];

export default function MetricsSubscriptionsPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState<string | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formMetricKeys, setFormMetricKeys] = useState<string[]>([]);
  const [formFrequency, setFormFrequency] = useState<"daily" | "weekly" | "monthly">("daily");
  const [formDeliveryMethod, setFormDeliveryMethod] = useState<"email" | "webhook">("email");
  const [formRecipients, setFormRecipients] = useState("");

  // Export form states
  const [exportMetricKeys, setExportMetricKeys] = useState<string[]>([]);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [exportGranularity, setExportGranularity] = useState<"hourly" | "daily" | "weekly">("daily");

  const [localSubscriptions, setLocalSubscriptions] = useState(mockSubscriptions);

  const subscriptionsQuery = useQuery({
    queryKey: ["admin", "analytics", "subscriptions"],
    enabled: !localMode,
    queryFn: () => adminApi.metricsSubscriptions.list(),
  });

  const subscriptions = localMode ? localSubscriptions : subscriptionsQuery.data?.items || [];

  const openCreateDialog = () => {
    setSelectedSubscription(null);
    setFormName("");
    setFormMetricKeys([]);
    setFormFrequency("daily");
    setFormDeliveryMethod("email");
    setFormRecipients("");
    setEditOpen(true);
  };

  const openEditDialog = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setFormName(subscription.name);
    setFormMetricKeys(subscription.metric_keys);
    setFormFrequency(subscription.frequency as "daily" | "weekly" | "monthly");
    setFormDeliveryMethod(subscription.delivery_method as "email" | "webhook");
    setFormRecipients(subscription.recipients.join(", "));
    setEditOpen(true);
  };

  const toggleMetricKey = (key: string, list: string[], setList: (keys: string[]) => void) => {
    if (list.includes(key)) {
      setList(list.filter((k) => k !== key));
    } else {
      setList([...list, key]);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const recipients = formRecipients.split(",").map((r) => r.trim()).filter(Boolean);
      const input = {
        name: formName,
        metric_keys: formMetricKeys,
        frequency: formFrequency,
        delivery_method: formDeliveryMethod,
        recipients,
      };

      if (localMode) {
        if (selectedSubscription) {
          setLocalSubscriptions((prev) =>
            prev.map((s) => (s.id === selectedSubscription.id ? { ...s, ...input } : s))
          );
        } else {
          setLocalSubscriptions((prev) => [
            ...prev,
            {
              id: `sub-${Date.now()}`,
              ...input,
              enabled: true,
              last_sent_at: null,
              created_at: new Date().toISOString(),
            },
          ]);
        }
        return { subscription: { id: selectedSubscription?.id || "new", name: formName } };
      }

      if (selectedSubscription) {
        return adminApi.metricsSubscriptions.update(selectedSubscription.id, input);
      }
      return adminApi.metricsSubscriptions.create(input);
    },
    onSuccess: () => {
      toast.success(selectedSubscription ? "Subscription updated" : "Subscription created");
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "analytics", "subscriptions"] });
    },
    onError: () => toast.error("Save failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      if (localMode) {
        setLocalSubscriptions((prev) => prev.filter((s) => s.id !== subscriptionId));
        return { success: true };
      }
      return adminApi.metricsSubscriptions.delete(subscriptionId);
    },
    onSuccess: () => {
      toast.success("Subscription deleted");
      setDeleteOpen(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "analytics", "subscriptions"] });
    },
    onError: () => toast.error("Delete failed"),
  });

  const toggleEnabledMutation = useMutation({
    mutationFn: async ({ subscriptionId, enabled }: { subscriptionId: string; enabled: boolean }) => {
      if (localMode) {
        setLocalSubscriptions((prev) =>
          prev.map((s) => (s.id === subscriptionId ? { ...s, enabled } : s))
        );
        return { success: true };
      }
      return adminApi.metricsSubscriptions.update(subscriptionId, { enabled });
    },
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "analytics", "subscriptions"] });
    },
    onError: () => toast.error("Update failed"),
  });

  const exportMutation = useMutation({
    mutationFn: () => {
      if (localMode) {
        return Promise.resolve({ job_id: "exp-new", status: "running" });
      }
      return adminApi.metricsSubscriptions.exportMetrics({
        metric_keys: exportMetricKeys,
        start_date: exportStartDate,
        end_date: exportEndDate,
        format: exportFormat,
        granularity: exportGranularity,
      });
    },
    onSuccess: () => {
      toast.success("Export job created");
      setExportOpen(false);
    },
    onError: () => toast.error("Failed to create export job"),
  });

  const enabledCount = subscriptions.filter((s) => s.enabled).length;

  return (
    <PageContainer>
      <PageHeader
        title="Metrics Subscriptions & Export"
        description="Subscribe to key metric reports and export data on demand."
        icon={<BarChart3 className="w-4 h-4" />}
        backHref="/analytics"
        backLabel="Back to Analytics"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
              <FileDown className="w-3.5 h-3.5 mr-1" />
              Export Metrics
            </Button>
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Subscription
            </Button>
          </div>
        }
      />

      <div className="page-grid grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Active Subscriptions"
          value={enabledCount.toString()}
          subtitle="subscriptions"
        />
        <StatsCard
          title="Available Metrics"
          value={mockAvailableMetrics.length.toString()}
          subtitle="metrics"
        />
        <StatsCard
          title="Sent Today"
          value="12"
          subtitle="reports"
        />
        <StatsCard
          title="Exports This Month"
          value={mockExportJobs.length.toString()}
          subtitle="exports"
        />
      </div>

      <SettingsSection
        title="Subscription List"
        description="Configured metric report subscriptions."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subscription Name</TableHead>
              <TableHead>Metrics</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead>Last Sent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  No subscriptions
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell className="text-[12px] font-medium text-foreground">
                    {subscription.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                      {subscription.metric_keys.slice(0, 2).map((key) => (
                        <Badge key={key} variant="outline" size="sm">
                          {mockAvailableMetrics.find((m) => m.key === key)?.name || key}
                        </Badge>
                      ))}
                      {subscription.metric_keys.length > 2 && (
                        <Badge variant="secondary" size="sm">
                          +{subscription.metric_keys.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" size="sm">
                      {FREQUENCY_LABELS[subscription.frequency]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-[12px] text-foreground-light">
                      {subscription.delivery_method === "email" ? (
                        <Mail className="w-3.5 h-3.5" />
                      ) : (
                        <Webhook className="w-3.5 h-3.5" />
                      )}
                      {subscription.delivery_method === "email" ? "Email" : "Webhook"}
                    </div>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {subscription.last_sent_at ? formatRelativeTime(subscription.last_sent_at) : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={subscription.enabled ? "success" : "secondary"} size="sm">
                      {subscription.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Switch
                        checked={subscription.enabled}
                        onCheckedChange={(enabled) =>
                          toggleEnabledMutation.mutate({ subscriptionId: subscription.id, enabled })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(subscription)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteOpen(subscription.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SettingsSection>

      {/* Edit/Create Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent size="lg">
          <DialogHeader icon={<Bell className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>{selectedSubscription ? "Edit Subscription" : "New Subscription"}</DialogTitle>
            <DialogDescription>
              Configure metric report subscription settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            <div className="space-y-1">
              <label className="text-[12px] text-foreground">Subscription Name</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter subscription name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[12px] text-foreground">Select Metrics</label>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-2 rounded-lg border border-border bg-surface-75">
                {mockAvailableMetrics.map((metric) => (
                  <button
                    key={metric.key}
                    type="button"
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md text-left transition-colors",
                      formMetricKeys.includes(metric.key)
                        ? "bg-brand-500/10 border border-brand-500/30"
                        : "hover:bg-surface-200"
                    )}
                    onClick={() => toggleMetricKey(metric.key, formMetricKeys, setFormMetricKeys)}
                  >
                    {formMetricKeys.includes(metric.key) ? (
                      <CheckSquare className="w-4 h-4 text-brand-500" />
                    ) : (
                      <Square className="w-4 h-4 text-foreground-muted" />
                    )}
                    <div>
                      <div className="text-[12px] text-foreground">{metric.name}</div>
                      <div className="text-[11px] text-foreground-muted">{metric.category}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[12px] text-foreground">Frequency</label>
                <div className="flex gap-2">
                  {(["daily", "weekly", "monthly"] as const).map((freq) => (
                    <Button
                      key={freq}
                      type="button"
                      variant={formFrequency === freq ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormFrequency(freq)}
                    >
                      {FREQUENCY_LABELS[freq]}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[12px] text-foreground">Delivery Method</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formDeliveryMethod === "email" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormDeliveryMethod("email")}
                  >
                    <Mail className="w-3.5 h-3.5 mr-1" />
                    Email
                  </Button>
                  <Button
                    type="button"
                    variant={formDeliveryMethod === "webhook" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormDeliveryMethod("webhook")}
                  >
                    <Webhook className="w-3.5 h-3.5 mr-1" />
                    Webhook
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[12px] text-foreground">
                {formDeliveryMethod === "email" ? "Recipient Emails" : "Webhook URL"}
              </label>
              <Input
                value={formRecipients}
                onChange={(e) => setFormRecipients(e.target.value)}
                placeholder={formDeliveryMethod === "email" ? "Separate multiple emails with commas" : "Enter Webhook URL"}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
              loadingText="Saving..."
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent size="lg">
          <DialogHeader icon={<FileDown className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>Export Metrics Data</DialogTitle>
            <DialogDescription>
              Select metrics, time range, and export format.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            <div className="space-y-2">
              <label className="text-[12px] text-foreground">Select Metrics</label>
              <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto p-2 rounded-lg border border-border bg-surface-75">
                {mockAvailableMetrics.map((metric) => (
                  <button
                    key={metric.key}
                    type="button"
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md text-left transition-colors",
                      exportMetricKeys.includes(metric.key)
                        ? "bg-brand-500/10 border border-brand-500/30"
                        : "hover:bg-surface-200"
                    )}
                    onClick={() => toggleMetricKey(metric.key, exportMetricKeys, setExportMetricKeys)}
                  >
                    {exportMetricKeys.includes(metric.key) ? (
                      <CheckSquare className="w-4 h-4 text-brand-500" />
                    ) : (
                      <Square className="w-4 h-4 text-foreground-muted" />
                    )}
                    <div className="text-[12px] text-foreground">{metric.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[12px] text-foreground">Start Date</label>
                <Input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[12px] text-foreground">End Date</label>
                <Input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[12px] text-foreground">Export Format</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={exportFormat === "csv" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setExportFormat("csv")}
                  >
                    CSV
                  </Button>
                  <Button
                    type="button"
                    variant={exportFormat === "json" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setExportFormat("json")}
                  >
                    JSON
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[12px] text-foreground">Granularity</label>
                <div className="flex gap-2">
                  {(["hourly", "daily", "weekly"] as const).map((gran) => (
                    <Button
                      key={gran}
                      type="button"
                      variant={exportGranularity === gran ? "default" : "outline"}
                      size="sm"
                      onClick={() => setExportGranularity(gran)}
                    >
                      {gran === "hourly" ? "Hourly" : gran === "daily" ? "Daily" : "Weekly"}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => exportMutation.mutate()}
              loading={exportMutation.isPending}
              loadingText="Creating..."
            >
              Start Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteOpen)}
        onOpenChange={(open) => !open && setDeleteOpen(null)}
        title="Delete Subscription"
        description="Are you sure you want to delete this subscription? This action cannot be undone."
        confirmLabel="Confirm Delete"
        onConfirm={() => deleteOpen && deleteMutation.mutate(deleteOpen)}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </PageContainer>
  );
}
