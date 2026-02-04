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
    name: "日活跃用户报告",
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
    name: "周收入摘要",
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
    name: "API 性能告警",
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
  { key: "dau", name: "日活跃用户", category: "用户", description: "每日活跃用户数" },
  { key: "mau", name: "月活跃用户", category: "用户", description: "每月活跃用户数" },
  { key: "user_retention", name: "用户留存率", category: "用户", description: "用户留存百分比" },
  { key: "revenue", name: "收入", category: "财务", description: "总收入金额" },
  { key: "mrr", name: "月度经常性收入", category: "财务", description: "MRR 金额" },
  { key: "churn_rate", name: "流失率", category: "财务", description: "用户流失百分比" },
  { key: "api_latency", name: "API 延迟", category: "性能", description: "平均 API 响应时间" },
  { key: "error_rate", name: "错误率", category: "性能", description: "请求错误百分比" },
  { key: "throughput", name: "吞吐量", category: "性能", description: "每秒请求数" },
  { key: "executions", name: "执行数", category: "用量", description: "工作流执行次数" },
  { key: "conversations", name: "对话数", category: "用量", description: "对话会话数" },
  { key: "storage_used", name: "存储使用", category: "用量", description: "已使用存储空间" },
];

const mockExportJobs = [
  { id: "exp-1", metric_keys: ["dau", "mau"], start_date: "2026-01-01", end_date: "2026-01-31", format: "csv", status: "completed", created_at: "2026-02-01T10:00:00Z" },
  { id: "exp-2", metric_keys: ["revenue", "mrr"], start_date: "2025-12-01", end_date: "2025-12-31", format: "json", status: "completed", created_at: "2026-01-02T09:00:00Z" },
];

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "每日",
  weekly: "每周",
  monthly: "每月",
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
      toast.success(selectedSubscription ? "订阅已更新" : "订阅已创建");
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "analytics", "subscriptions"] });
    },
    onError: () => toast.error("保存失败"),
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
      toast.success("订阅已删除");
      setDeleteOpen(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "analytics", "subscriptions"] });
    },
    onError: () => toast.error("删除失败"),
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
      toast.success("状态已更新");
      queryClient.invalidateQueries({ queryKey: ["admin", "analytics", "subscriptions"] });
    },
    onError: () => toast.error("更新失败"),
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
      toast.success("导出任务已创建");
      setExportOpen(false);
    },
    onError: () => toast.error("创建导出任务失败"),
  });

  const enabledCount = subscriptions.filter((s) => s.enabled).length;

  return (
    <PageContainer>
      <PageHeader
        title="指标订阅与导出"
        description="订阅关键指标报告，按需导出数据。"
        icon={<BarChart3 className="w-4 h-4" />}
        backHref="/analytics"
        backLabel="返回分析概览"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
              <FileDown className="w-3.5 h-3.5 mr-1" />
              导出指标
            </Button>
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              新建订阅
            </Button>
          </div>
        }
      />

      <div className="page-grid grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="活跃订阅"
          value={enabledCount.toString()}
          subtitle="个订阅"
        />
        <StatsCard
          title="可用指标"
          value={mockAvailableMetrics.length.toString()}
          subtitle="个指标"
        />
        <StatsCard
          title="今日发送"
          value="12"
          subtitle="封报告"
        />
        <StatsCard
          title="本月导出"
          value={mockExportJobs.length.toString()}
          subtitle="次导出"
        />
      </div>

      <SettingsSection
        title="订阅列表"
        description="已配置的指标报告订阅。"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>订阅名称</TableHead>
              <TableHead>指标</TableHead>
              <TableHead>频率</TableHead>
              <TableHead>发送方式</TableHead>
              <TableHead>最近发送</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  暂无订阅
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
                      {subscription.delivery_method === "email" ? "邮件" : "Webhook"}
                    </div>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {subscription.last_sent_at ? formatRelativeTime(subscription.last_sent_at) : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={subscription.enabled ? "success" : "secondary"} size="sm">
                      {subscription.enabled ? "启用" : "停用"}
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
            <DialogTitle>{selectedSubscription ? "编辑订阅" : "新建订阅"}</DialogTitle>
            <DialogDescription>
              配置指标报告的订阅设置。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            <div className="space-y-1">
              <label className="text-[12px] text-foreground">订阅名称</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="输入订阅名称"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[12px] text-foreground">选择指标</label>
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
                <label className="text-[12px] text-foreground">发送频率</label>
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
                <label className="text-[12px] text-foreground">发送方式</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formDeliveryMethod === "email" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormDeliveryMethod("email")}
                  >
                    <Mail className="w-3.5 h-3.5 mr-1" />
                    邮件
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
                {formDeliveryMethod === "email" ? "收件人邮箱" : "Webhook URL"}
              </label>
              <Input
                value={formRecipients}
                onChange={(e) => setFormRecipients(e.target.value)}
                placeholder={formDeliveryMethod === "email" ? "多个邮箱用逗号分隔" : "输入 Webhook URL"}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              取消
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
              loadingText="保存中..."
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent size="lg">
          <DialogHeader icon={<FileDown className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>导出指标数据</DialogTitle>
            <DialogDescription>
              选择指标、时间范围和导出格式。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            <div className="space-y-2">
              <label className="text-[12px] text-foreground">选择指标</label>
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
                <label className="text-[12px] text-foreground">开始日期</label>
                <Input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[12px] text-foreground">结束日期</label>
                <Input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[12px] text-foreground">导出格式</label>
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
                <label className="text-[12px] text-foreground">数据粒度</label>
                <div className="flex gap-2">
                  {(["hourly", "daily", "weekly"] as const).map((gran) => (
                    <Button
                      key={gran}
                      type="button"
                      variant={exportGranularity === gran ? "default" : "outline"}
                      size="sm"
                      onClick={() => setExportGranularity(gran)}
                    >
                      {gran === "hourly" ? "小时" : gran === "daily" ? "天" : "周"}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              取消
            </Button>
            <Button
              onClick={() => exportMutation.mutate()}
              loading={exportMutation.isPending}
              loadingText="创建中..."
            >
              开始导出
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteOpen)}
        onOpenChange={(open) => !open && setDeleteOpen(null)}
        title="删除订阅"
        description="确认要删除此订阅吗？此操作不可撤销。"
        confirmLabel="确认删除"
        onConfirm={() => deleteOpen && deleteMutation.mutate(deleteOpen)}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </PageContainer>
  );
}
