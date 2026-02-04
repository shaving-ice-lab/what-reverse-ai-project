"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bot,
  Edit,
  Settings,
  Sparkles,
  Zap,
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
import { cn } from "@/lib/utils";

// Mock data
const mockStrategies = [
  {
    id: "strat-1",
    model: "gpt-4",
    system_prompt: "你是一个专业的AI助手，提供准确、有帮助的回答。",
    temperature: 0.7,
    max_tokens: 4096,
    rate_limit: 60,
    cost_limit_per_day: 100,
    enabled: true,
  },
  {
    id: "strat-2",
    model: "gpt-4-turbo",
    system_prompt: "你是一个高效的AI助手，快速回答用户问题。",
    temperature: 0.5,
    max_tokens: 8192,
    rate_limit: 100,
    cost_limit_per_day: 200,
    enabled: true,
  },
  {
    id: "strat-3",
    model: "gpt-3.5-turbo",
    system_prompt: "你是一个友好的AI助手。",
    temperature: 0.8,
    max_tokens: 2048,
    rate_limit: 200,
    cost_limit_per_day: 50,
    enabled: true,
  },
  {
    id: "strat-4",
    model: "claude-3-opus",
    system_prompt: "你是Claude，一个有帮助、无害、诚实的AI助手。",
    temperature: 0.7,
    max_tokens: 4096,
    rate_limit: 30,
    cost_limit_per_day: 150,
    enabled: false,
  },
  {
    id: "strat-5",
    model: "claude-3-sonnet",
    system_prompt: "你是Claude，一个有帮助、无害、诚实的AI助手。",
    temperature: 0.6,
    max_tokens: 4096,
    rate_limit: 60,
    cost_limit_per_day: 80,
    enabled: true,
  },
];

type Strategy = (typeof mockStrategies)[number];

export default function ModelStrategiesPage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);

  // Form states
  const [formSystemPrompt, setFormSystemPrompt] = useState("");
  const [formTemperature, setFormTemperature] = useState(0.7);
  const [formMaxTokens, setFormMaxTokens] = useState(4096);
  const [formRateLimit, setFormRateLimit] = useState(60);
  const [formCostLimit, setFormCostLimit] = useState(100);

  const [localStrategies, setLocalStrategies] = useState(mockStrategies);

  const strategiesQuery = useQuery({
    queryKey: ["admin", "conversations", "model-strategies"],
    enabled: !localMode,
    queryFn: () => adminApi.conversations.getModelStrategies(),
  });

  const strategies = localMode ? localStrategies : strategiesQuery.data?.strategies || [];

  const openEditDialog = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    setFormSystemPrompt(strategy.system_prompt);
    setFormTemperature(strategy.temperature);
    setFormMaxTokens(strategy.max_tokens);
    setFormRateLimit(strategy.rate_limit);
    setFormCostLimit(strategy.cost_limit_per_day);
    setEditOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStrategy) throw new Error("No strategy selected");

      const input = {
        system_prompt: formSystemPrompt,
        temperature: formTemperature,
        max_tokens: formMaxTokens,
        rate_limit: formRateLimit,
        cost_limit_per_day: formCostLimit,
      };

      if (localMode) {
        setLocalStrategies((prev) =>
          prev.map((s) => (s.id === selectedStrategy.id ? { ...s, ...input } : s))
        );
        return { success: true };
      }

      return adminApi.conversations.updateModelStrategy(selectedStrategy.id, input);
    },
    onSuccess: () => {
      toast.success("策略已更新");
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "conversations", "model-strategies"] });
    },
    onError: () => toast.error("保存失败"),
  });

  const toggleEnabledMutation = useMutation({
    mutationFn: async ({ strategyId, enabled }: { strategyId: string; enabled: boolean }) => {
      if (localMode) {
        setLocalStrategies((prev) =>
          prev.map((s) => (s.id === strategyId ? { ...s, enabled } : s))
        );
        return { success: true };
      }
      return adminApi.conversations.updateModelStrategy(strategyId, { enabled });
    },
    onSuccess: () => {
      toast.success("状态已更新");
      queryClient.invalidateQueries({ queryKey: ["admin", "conversations", "model-strategies"] });
    },
    onError: () => toast.error("更新失败"),
  });

  const enabledCount = strategies.filter((s) => s.enabled).length;
  const totalCostLimit = strategies.filter((s) => s.enabled).reduce((sum, s) => sum + s.cost_limit_per_day, 0);

  return (
    <PageContainer>
      <PageHeader
        title="模型提示词与策略管理"
        description="配置 AI 模型的系统提示词、参数和使用限制。"
        icon={<Bot className="w-4 h-4" />}
        backHref="/conversations"
        backLabel="返回对话列表"
      />

      <div className="page-grid grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="已配置模型"
          value={strategies.length.toString()}
          subtitle="个模型"
        />
        <StatsCard
          title="已启用"
          value={enabledCount.toString()}
          subtitle="个模型"
        />
        <StatsCard
          title="日成本上限"
          value={`$${totalCostLimit}`}
          subtitle="总预算"
        />
        <StatsCard
          title="总速率限制"
          value={strategies.filter((s) => s.enabled).reduce((sum, s) => sum + s.rate_limit, 0).toString()}
          subtitle="请求/分钟"
        />
      </div>

      <SettingsSection
        title="模型策略配置"
        description="为每个 AI 模型配置独立的参数和限制。"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>模型</TableHead>
              <TableHead>系统提示词</TableHead>
              <TableHead>参数</TableHead>
              <TableHead>限制</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {strategies.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  暂无模型配置
                </TableCell>
              </TableRow>
            ) : (
              strategies.map((strategy) => (
                <TableRow key={strategy.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Sparkles className={cn(
                        "w-4 h-4",
                        strategy.enabled ? "text-brand-500" : "text-foreground-muted"
                      )} />
                      <div className="text-[12px] font-medium text-foreground">
                        {strategy.model}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-[12px] text-foreground-light max-w-[200px] truncate">
                      {strategy.system_prompt}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-[11px] text-foreground-light space-y-0.5">
                      <div>Temp: {strategy.temperature}</div>
                      <div>Max: {strategy.max_tokens}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-[11px] text-foreground-light space-y-0.5">
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {strategy.rate_limit}/min
                      </div>
                      <div>${strategy.cost_limit_per_day}/day</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={strategy.enabled ? "success" : "secondary"} size="sm">
                      {strategy.enabled ? "已启用" : "已禁用"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Switch
                        checked={strategy.enabled}
                        onCheckedChange={(enabled) =>
                          toggleEnabledMutation.mutate({ strategyId: strategy.id, enabled })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(strategy)}
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
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent size="lg">
          <DialogHeader icon={<Settings className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>编辑模型策略</DialogTitle>
            <DialogDescription>
              {selectedStrategy?.model && (
                <span className="text-foreground-light">配置 {selectedStrategy.model} 的参数和限制。</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[12px] text-foreground">系统提示词</label>
              <textarea
                value={formSystemPrompt}
                onChange={(e) => setFormSystemPrompt(e.target.value)}
                rows={4}
                placeholder="输入系统提示词..."
                className="w-full rounded-md border border-border bg-surface-100 px-3 py-2 text-[12px] text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-brand-500/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[12px] text-foreground">Temperature</label>
                <Input
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={formTemperature}
                  onChange={(e) => setFormTemperature(parseFloat(e.target.value) || 0.7)}
                />
                <p className="text-[11px] text-foreground-muted">控制输出的随机性 (0-2)</p>
              </div>
              <div className="space-y-1">
                <label className="text-[12px] text-foreground">Max Tokens</label>
                <Input
                  type="number"
                  min={256}
                  max={128000}
                  value={formMaxTokens}
                  onChange={(e) => setFormMaxTokens(parseInt(e.target.value) || 4096)}
                />
                <p className="text-[11px] text-foreground-muted">单次响应的最大 token 数</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[12px] text-foreground">速率限制 (请求/分钟)</label>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={formRateLimit}
                  onChange={(e) => setFormRateLimit(parseInt(e.target.value) || 60)}
                />
                <p className="text-[11px] text-foreground-muted">每分钟最大请求数</p>
              </div>
              <div className="space-y-1">
                <label className="text-[12px] text-foreground">日成本上限 ($)</label>
                <Input
                  type="number"
                  min={0}
                  max={10000}
                  value={formCostLimit}
                  onChange={(e) => setFormCostLimit(parseInt(e.target.value) || 100)}
                />
                <p className="text-[11px] text-foreground-muted">每日 API 调用成本上限</p>
              </div>
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
    </PageContainer>
  );
}
