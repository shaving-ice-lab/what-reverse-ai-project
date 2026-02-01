"use client";

/**
 * API 密钥管理页面 - Supabase 风格（支持亮/暗主题）
 */

import React, { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Key,
  Trash2,
  Copy,
  Plus,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Zap,
  DollarSign,
  Activity,
  RefreshCw,
  PlayCircle,
  Loader2,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { AddApiKeyDialog } from "@/components/settings/add-api-key-dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import { apiKeysApi } from "@/lib/api";
import {
  PROVIDER_CONFIGS,
  type ApiKey,
  type ApiKeyStatus,
} from "@/types/api-key";
import { cn } from "@/lib/utils";

// 状态文本映射
const statusLabels: Record<ApiKeyStatus, string> = {
  active: "正常",
  expired: "已过期",
  revoked: "已撤销",
};

// 默认每日使用统计 (过去7天)
const defaultDailyUsage = [
  { day: "周一", calls: 0, tokens: 0, cost: 0 },
  { day: "周二", calls: 0, tokens: 0, cost: 0 },
  { day: "周三", calls: 0, tokens: 0, cost: 0 },
  { day: "周四", calls: 0, tokens: 0, cost: 0 },
  { day: "周五", calls: 0, tokens: 0, cost: 0 },
  { day: "周六", calls: 0, tokens: 0, cost: 0 },
  { day: "周日", calls: 0, tokens: 0, cost: 0 },
];

// 设置卡片组件 - 支持主题
function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="page-panel overflow-hidden mb-6">
      <div className="page-panel-header">
        <h2 className="page-panel-title">{title}</h2>
        {description && <p className="page-panel-description mt-1">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [dailyUsage] = useState(defaultDailyUsage);
  const { confirm, ConfirmDialog } = useConfirmDialog();

  // 计算统计数据
  const stats = {
    totalCalls: apiKeys.reduce((sum, k) => sum + (k.usageCount || 0), 0),
    totalTokens: apiKeys.reduce((sum, k) => sum + (k.totalTokens || 0), 0),
    totalCost: apiKeys.reduce((sum, k) => sum + (k.totalCost || 0), 0),
    avgResponseTime: 1.2, // 默认值
  };

  // 加载密钥列表
  const loadApiKeys = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiKeysApi.list();
      setApiKeys(response.apiKeys || []);
    } catch (err) {
      console.error("Failed to load API keys:", err);
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  // 测试密钥
  const handleTestKey = async (apiKey: ApiKey) => {
    setTestingId(apiKey.id);
    setTestResults((prev) => {
      const newResults = { ...prev };
      delete newResults[apiKey.id];
      return newResults;
    });
    
    try {
      const result = await apiKeysApi.test(apiKey.id);
      setTestResults((prev) => ({
        ...prev,
        [apiKey.id]: {
          success: result.valid,
          message: result.valid 
            ? `密钥验证成功 (响应时间: ${result.responseTime}ms)` 
            : result.error || "密钥验证失败",
        },
      }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [apiKey.id]: {
          success: false,
          message: err instanceof Error ? err.message : "测试失败，请稍后重试",
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  // 刷新统计
  const handleRefreshStats = async (id: string) => {
    try {
      const { apiKey } = await apiKeysApi.refreshStats(id);
      setApiKeys(prev => prev.map(k => k.id === id ? apiKey : k));
    } catch (err) {
      console.error("刷新统计失败:", err);
    }
  };

  // 计算柱状图最大高度
  const maxCalls = Math.max(...dailyUsage.map((d) => d.calls), 1);

  // 删除密钥
  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "删除密钥",
      description: "删除后，使用此密钥的工作流将无法执行。此操作无法撤销。",
      confirmText: "删除",
      cancelText: "取消",
      variant: "destructive",
    });

    if (confirmed) {
      try {
        await apiKeysApi.delete(id);
        setApiKeys((prev) => prev.filter((k) => k.id !== id));
      } catch (err) {
        console.error("删除失败:", err);
        setError(err instanceof Error ? err.message : "删除失败");
      }
    }
  };

  // 复制密钥前缀
  const handleCopyPrefix = (key: ApiKey) => {
    navigator.clipboard.writeText(`${key.keyPrefix}...${key.keySuffix}`);
    setCopiedId(key.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <ConfirmDialog />

        <div className="space-y-3">
          <PageHeader
            eyebrow="Settings"
            title="API 密钥"
            description="管理您的 AI 服务 API 访问密钥"
            className="mb-0"
            actions={(
              <Button
                variant="outline"
                size="sm"
                onClick={loadApiKeys}
                disabled={isLoading}
                className="border-border text-foreground-light"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                刷新
              </Button>
            )}
          />
        </div>

        <div className="page-divider" />
      
      {/* 错误提示 */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-surface-200 border border-border text-foreground text-[13px] mb-6">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 text-xs"
            onClick={() => setError(null)}
          >
            关闭
          </Button>
        </div>
      )}

      {/* 安全提示 */}
      <div className="flex items-start gap-3 p-4 rounded-md bg-surface-100 border border-border text-[13px]">
        <AlertCircle className="h-4 w-4 text-foreground-muted mt-0.5 shrink-0" />
        <div className="text-foreground-light">
          API 密钥使用 AES-256 加密存储，仅在执行工作流时解密使用。请妥善保管您的密钥。
        </div>
      </div>

      {/* 使用统计卡片 */}
      <div className="page-grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-100 border border-border rounded-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-md bg-brand-200 flex items-center justify-center">
              <Zap className="h-4 w-4 text-brand-500" />
            </div>
          </div>
          <p className="text-xl font-semibold text-foreground">{stats.totalCalls.toLocaleString()}</p>
          <p className="text-xs text-foreground-muted mt-1">本周调用次数</p>
        </div>
        <div className="bg-surface-100 border border-border rounded-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-md bg-brand-200 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-brand-500" />
            </div>
          </div>
          <p className="text-xl font-semibold text-foreground">{(stats.totalTokens / 1000).toFixed(0)}K</p>
          <p className="text-xs text-foreground-muted mt-1">Token 消耗</p>
        </div>
        <div className="bg-surface-100 border border-border rounded-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-md bg-brand-200 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-brand-500" />
            </div>
          </div>
          <p className="text-xl font-semibold text-foreground">${stats.totalCost.toFixed(2)}</p>
          <p className="text-xs text-foreground-muted mt-1">本周花费</p>
        </div>
        <div className="bg-surface-100 border border-border rounded-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center">
              <Activity className="h-4 w-4 text-foreground-light" />
            </div>
          </div>
          <p className="text-xl font-semibold text-foreground">{stats.avgResponseTime}s</p>
          <p className="text-xs text-foreground-muted mt-1">平均响应时间</p>
        </div>
      </div>

      {/* 使用趋势图表 */}
      <SettingsSection
        title="使用趋势"
        description="过去 7 天的 API 调用统计"
      >
        <div className="flex items-end justify-between gap-2 h-32 mb-4">
          {dailyUsage.map((day, index) => {
            const height = (day.calls / maxCalls) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-brand-500 rounded-t-md transition-all duration-300 hover:bg-brand-600 cursor-pointer relative group"
                  style={{ height: `${height}%`, minHeight: "8px" }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-100 border border-border rounded-md px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {day.calls} 次调用
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-foreground-muted border-t border-border pt-2">
          {dailyUsage.map((day, index) => (
            <span key={index} className="flex-1 text-center">{day.day}</span>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-brand-500" />
              <span className="text-xs text-foreground-muted">API 调用次数</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-foreground-light">
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
            查看详细报告
          </Button>
        </div>
      </SettingsSection>

      {/* 密钥列表 */}
      <SettingsSection
        title="已添加的密钥"
        description="查看和管理您添加的 API 密钥"
      >
        {isLoading ? (
          // 加载骨架
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-surface-100/60 border border-border rounded-md px-4 py-3"
              >
                <div className="w-9 h-9 rounded-md bg-surface-200 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-200 rounded animate-pulse w-1/4" />
                  <div className="h-3 bg-surface-200 rounded animate-pulse w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : apiKeys.length === 0 ? (
          // 空状态
          <div className="text-center py-12">
            <div className="w-14 h-14 mx-auto mb-4 rounded-md bg-surface-200 flex items-center justify-center">
              <Key className="h-6 w-6 text-foreground-muted" />
            </div>
            <h3 className="text-sm font-medium text-foreground mb-1">
              暂无 API 密钥
            </h3>
            <p className="text-[13px] text-foreground-light mb-6">
              添加 API 密钥以使用 LLM 节点
            </p>
            <AddApiKeyDialog
              trigger={
                <Button className="bg-brand-500 hover:bg-brand-600 text-background">
                  <Plus className="h-4 w-4 mr-1.5" />
                  添加密钥
                </Button>
              }
              onSuccess={loadApiKeys}
            />
          </div>
        ) : (
          // 密钥列表
          <div className="space-y-3">
            {apiKeys.map((apiKey) => {
              const provider = PROVIDER_CONFIGS[apiKey.provider];
              const testResult = testResults[apiKey.id];
              const isTesting = testingId === apiKey.id;

              return (
                <div
                  key={apiKey.id}
                  className="bg-surface-100/60 border border-border rounded-md transition-all duration-200 hover:border-border-strong"
                >
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-md bg-surface-100 flex items-center justify-center text-sm"
                        style={{ color: provider?.color || "var(--foreground-muted)" }}
                      >
                        {provider?.icon || <Key className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-foreground">
                            {apiKey.name}
                          </span>
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              apiKey.status === "active" && "bg-brand-200 text-brand-500",
                              apiKey.status === "expired" && "bg-surface-200 text-foreground-light",
                              apiKey.status === "revoked" && "bg-surface-200 text-foreground-muted"
                            )}
                          >
                            {statusLabels[apiKey.status]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-foreground-muted mt-0.5">
                          <code className="font-mono">
                            {apiKey.keyPrefix}...{apiKey.keySuffix}
                          </code>
                          {apiKey.usageCount !== undefined && (
                            <span>{apiKey.usageCount.toLocaleString()} 次调用</span>
                          )}
                          {apiKey.lastUsedAt && (
                            <span className="hidden sm:inline">
                              {formatDistanceToNow(new Date(apiKey.lastUsedAt), {
                                addSuffix: true,
                                locale: zhCN,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {apiKey.totalCost !== undefined && (
                        <span className="text-[13px] font-medium text-foreground mr-2 hidden sm:block">
                          ${apiKey.totalCost.toFixed(2)}
                        </span>
                      )}
                      {/* 测试按钮 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-foreground-muted hover:text-foreground"
                        onClick={() => handleTestKey(apiKey)}
                        disabled={isTesting}
                      >
                        {isTesting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            测试中
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-3.5 h-3.5 mr-1.5" />
                            测试
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-foreground-muted hover:text-foreground"
                        onClick={() => handleCopyPrefix(apiKey)}
                      >
                        {copiedId === apiKey.id ? (
                          <CheckCircle2 className="w-4 h-4 text-brand-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-foreground-muted hover:text-foreground hover:bg-surface-200"
                        onClick={() => handleDelete(apiKey.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* 测试结果 */}
                  {testResult && (
                    <div className={cn(
                      "px-4 py-2 border-t border-border text-xs flex items-center gap-2",
                      testResult.success 
                        ? "bg-brand-200 text-brand-500" 
                        : "bg-surface-200 text-foreground-light"
                    )}>
                      {testResult.success ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5" />
                      )}
                      {testResult.message}
                    </div>
                  )}

                  {/* 使用量进度条 (仅对活跃密钥显示) */}
                  {apiKey.status === "active" && apiKey.totalTokens && (
                    <div className="px-4 py-2 border-t border-border">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-foreground-muted">本月用量</span>
                        <span className="text-foreground font-medium">
                          {((apiKey.totalTokens || 0) / 10000).toFixed(1)}万 / 100万 tokens
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(((apiKey.totalTokens || 0) / 1000000) * 100, 100)} 
                        className="h-1.5"
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* 添加按钮 */}
            <AddApiKeyDialog
              trigger={
                <button className="w-full mt-4 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-md text-[13px] text-foreground-muted hover:border-brand-400 hover:text-foreground hover:bg-brand-200 transition-all duration-200 cursor-pointer">
                  <Plus className="w-4 h-4" />
                  添加 API 密钥
                </button>
              }
              onSuccess={loadApiKeys}
            />
          </div>
        )}
      </SettingsSection>

      {/* 支持的提供商 */}
      <SettingsSection
        title="支持的提供商"
        description="我们支持以下 AI 服务提供商"
      >
        <div className="page-grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.values(PROVIDER_CONFIGS).map((provider) => (
            <div
              key={provider.id}
              className="flex items-center gap-2 p-3 rounded-md bg-surface-100/60 border border-border"
            >
              <span style={{ color: provider.color }}>{provider.icon}</span>
              <span className="text-[13px] text-foreground">{provider.name}</span>
            </div>
          ))}
        </div>
      </SettingsSection>
      </div>
    </PageContainer>
  );
}
