"use client";

/**
 * Webhook 管理页面 - Supabase 风格
 * 管理 Webhook 端点和事件订阅
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Webhook,
  Plus,
  Search,
  Copy,
  Check,
  MoreHorizontal,
  Settings,
  Trash2,
  RefreshCw,
  Play,
  Pause,
  Eye,
  EyeOff,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Code,
  ExternalLink,
  ChevronDown,
  Filter,
  ArrowRight,
  Shield,
  Key,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Webhook 数据
const webhooks = [
  {
    id: "wh-1",
    name: "工作流完成通知",
    url: "https://api.example.com/webhooks/workflow-complete",
    events: ["workflow.completed", "workflow.failed"],
    status: "active",
    createdAt: "2026-01-15",
    lastTriggered: "10 分钟前",
    successRate: 98.5,
    totalDeliveries: 1234,
    recentDeliveries: [
      { status: "success", time: "10 分钟前" },
      { status: "success", time: "1 小时前" },
      { status: "failed", time: "2 小时前" },
      { status: "success", time: "3 小时前" },
      { status: "success", time: "5 小时前" },
    ],
  },
  {
    id: "wh-2",
    name: "Agent 对话回调",
    url: "https://api.example.com/webhooks/agent-conversation",
    events: ["agent.conversation.started", "agent.conversation.ended"],
    status: "active",
    createdAt: "2026-01-20",
    lastTriggered: "30 分钟前",
    successRate: 100,
    totalDeliveries: 567,
    recentDeliveries: [
      { status: "success", time: "30 分钟前" },
      { status: "success", time: "1 小时前" },
      { status: "success", time: "2 小时前" },
    ],
  },
  {
    id: "wh-3",
    name: "团队成员变更",
    url: "https://slack.com/api/webhooks/team-changes",
    events: ["team.member.added", "team.member.removed"],
    status: "paused",
    createdAt: "2026-01-10",
    lastTriggered: "2 天前",
    successRate: 95.2,
    totalDeliveries: 89,
    recentDeliveries: [
      { status: "success", time: "2 天前" },
      { status: "failed", time: "3 天前" },
    ],
  },
  {
    id: "wh-4",
    name: "计费事件",
    url: "https://billing.example.com/webhooks/events",
    events: ["billing.subscription.created", "billing.payment.success", "billing.payment.failed"],
    status: "active",
    createdAt: "2026-01-05",
    lastTriggered: "昨天",
    successRate: 100,
    totalDeliveries: 45,
    recentDeliveries: [
      { status: "success", time: "昨天" },
      { status: "success", time: "3 天前" },
    ],
  },
];

// 可订阅的事件
const availableEvents = [
  { group: "工作流", events: ["workflow.created", "workflow.updated", "workflow.deleted", "workflow.completed", "workflow.failed", "workflow.started"] },
  { group: "Agent", events: ["agent.created", "agent.updated", "agent.deleted", "agent.conversation.started", "agent.conversation.ended"] },
  { group: "团队", events: ["team.member.added", "team.member.removed", "team.member.role.changed"] },
  { group: "计费", events: ["billing.subscription.created", "billing.subscription.cancelled", "billing.payment.success", "billing.payment.failed"] },
  { group: "文件", events: ["file.uploaded", "file.deleted", "file.shared"] },
];

// 状态配置
const statusConfig = {
  active: { label: "活跃", color: "text-brand-500", bg: "bg-brand-200", dot: "bg-brand-500" },
  paused: { label: "已暂停", color: "text-foreground-light", bg: "bg-surface-200", dot: "bg-warning" },
  error: { label: "错误", color: "text-destructive", bg: "bg-destructive-200", dot: "bg-destructive" },
};

export default function WebhooksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 复制 URL
  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 筛选
  const filteredWebhooks = webhooks.filter(
    (wh) =>
      wh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wh.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = webhooks.filter((wh) => wh.status === "active").length;

  return (
    <div className="min-h-full bg-background-studio">
      {/* 页面头部 */}
      <div className="border-b border-border bg-background-studio/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center">
                <Webhook className="w-4 h-4 text-foreground-light" />
              </div>
              <div>
                <p className="page-caption">Integrations</p>
                <h1 className="text-page-title text-foreground">Webhook 管理</h1>
                <p className="text-description">配置事件订阅和回调端点</p>
              </div>
            </div>

            <Button
              className="bg-brand-500 hover:bg-brand-600 text-background"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              创建 Webhook
            </Button>
          </div>

          {/* 统计卡片 */}
          <div className="page-grid grid-cols-2 md:grid-cols-4">
            <div className="page-panel p-4">
              <p className="text-[13px] text-foreground-light mb-1">总端点</p>
              <p className="text-xl font-semibold text-foreground">{webhooks.length}</p>
            </div>
            <div className="page-panel p-4">
              <p className="text-[13px] text-foreground-light mb-1">活跃</p>
              <p className="text-xl font-semibold text-brand-500">{activeCount}</p>
            </div>
            <div className="page-panel p-4">
              <p className="text-[13px] text-foreground-light mb-1">今日触发</p>
              <p className="text-xl font-semibold text-foreground">156</p>
            </div>
            <div className="page-panel p-4">
              <p className="text-[13px] text-foreground-light mb-1">成功率</p>
              <p className="text-xl font-semibold text-foreground">98.7%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <div className="page-divider" />
        {/* 搜索 */}
        <div className="page-panel p-4 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <Input
              placeholder="搜索 Webhook..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-surface-200 border-border text-foreground placeholder:text-foreground-muted focus:border-brand-400"
            />
          </div>
        </div>

        {/* Webhook 列表 */}
        {filteredWebhooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-md bg-surface-200 flex items-center justify-center mb-4">
              <Webhook className="w-6 h-6 text-foreground-muted" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-2">没有 Webhook</h3>
            <p className="text-[13px] text-foreground-light mb-4">创建 Webhook 以接收事件通知</p>
            <Button onClick={() => setShowCreateModal(true)} className="bg-brand-500 hover:bg-brand-600 text-background">
              <Plus className="w-4 h-4 mr-1" />
              创建第一个 Webhook
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWebhooks.map((webhook) => {
              const status = statusConfig[webhook.status as keyof typeof statusConfig];

              return (
                <div
                  key={webhook.id}
                  className="p-5 rounded-md bg-surface-100 border border-border hover:border-border-strong transition-supabase"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full", status.dot)} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-foreground">{webhook.name}</h3>
                          <Badge variant="secondary" className={cn("text-xs", status.bg, status.color)}>
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-foreground-muted mt-0.5">
                          创建于 {webhook.createdAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedWebhook(selectedWebhook === webhook.id ? null : webhook.id)}
                        className="border-border text-foreground-light"
                      >
                        {selectedWebhook === webhook.id ? "收起" : "详情"}
                        <ChevronDown className={cn(
                          "w-4 h-4 ml-1 transition-transform",
                          selectedWebhook === webhook.id && "rotate-180"
                        )} />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="border-border text-foreground-light">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Settings className="w-4 h-4 mr-2" />
                            编辑配置
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Play className="w-4 h-4 mr-2" />
                            测试发送
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            {webhook.status === "active" ? (
                              <>
                                <Pause className="w-4 h-4 mr-2" />
                                暂停
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                启用
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* URL */}
                  <div className="flex items-center gap-2 p-3 rounded-md bg-surface-200 mb-4">
                    <Code className="w-4 h-4 text-foreground-muted shrink-0" />
                    <code className="flex-1 text-[13px] text-foreground truncate font-mono">
                      {webhook.url}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(webhook.id, webhook.url)}
                      className="text-foreground-light hover:text-foreground"
                    >
                      {copiedId === webhook.id ? (
                        <Check className="w-4 h-4 text-brand-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* 事件标签 */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {webhook.events.map((event) => (
                      <Badge key={event} variant="secondary" className="text-xs font-mono bg-surface-200 text-foreground-light">
                        {event}
                      </Badge>
                    ))}
                  </div>

                  {/* 统计信息 */}
                  <div className="flex items-center gap-6 text-[13px] text-foreground-light">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      最后触发: {webhook.lastTriggered}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-brand-500" />
                      成功率: {webhook.successRate}%
                    </span>
                    <span>
                      总投递: {webhook.totalDeliveries.toLocaleString()} 次
                    </span>
                  </div>

                  {/* 展开详情 */}
                  {selectedWebhook === webhook.id && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <h4 className="text-[13px] font-medium text-foreground mb-3">最近投递记录</h4>
                      <div className="space-y-2">
                        {webhook.recentDeliveries.map((delivery, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-2 rounded-md bg-surface-75"
                          >
                            {delivery.status === "success" ? (
                              <CheckCircle2 className="w-4 h-4 text-brand-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-destructive" />
                            )}
                            <span className={cn(
                              "text-[13px]",
                              delivery.status === "success" ? "text-brand-500" : "text-destructive"
                            )}>
                              {delivery.status === "success" ? "成功" : "失败"}
                            </span>
                            <span className="text-[13px] text-foreground-muted">{delivery.time}</span>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" className="mt-3 border-border text-foreground-light">
                        查看全部日志
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 文档链接 */}
        <div className="mt-8 p-5 rounded-md bg-surface-75 border border-border">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-md bg-brand-200 flex items-center justify-center shrink-0">
              <Code className="w-4 h-4 text-brand-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-foreground mb-1">Webhook 开发指南</h3>
              <p className="text-[13px] text-foreground-light mb-3">
                了解如何配置和处理 Webhook 事件，包括签名验证、重试机制等
              </p>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" className="border-border text-foreground-light">
                  <Code className="w-4 h-4 mr-1" />
                  查看文档
                </Button>
                <Button variant="outline" size="sm" className="border-border text-foreground-light">
                  <Shield className="w-4 h-4 mr-1" />
                  安全最佳实践
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 创建 Webhook 模态框 */}
      {showCreateModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto bg-surface-100 rounded-md border border-border z-50 max-h-[80vh] overflow-auto">
            <div className="p-5 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">创建 Webhook</h2>
              <p className="text-[13px] text-foreground-light">配置新的事件订阅端点</p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-foreground mb-2">
                  名称
                </label>
                <Input placeholder="例如：工作流完成通知" className="h-9 bg-surface-200 border-border" />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-foreground mb-2">
                  端点 URL
                </label>
                <Input placeholder="https://your-server.com/webhook" className="h-9 bg-surface-200 border-border" />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-foreground mb-2">
                  订阅事件
                </label>
                <div className="space-y-4 max-h-48 overflow-auto p-3 rounded-md bg-surface-200">
                  {availableEvents.map((group) => (
                    <div key={group.group}>
                      <p className="text-xs font-medium text-foreground-muted mb-2">{group.group}</p>
                      <div className="space-y-2">
                        {group.events.map((event) => (
                          <label key={event} className="flex items-center gap-2">
                            <Checkbox />
                            <span className="text-[13px] font-mono text-foreground">{event}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-foreground mb-2">
                  Secret（可选）
                </label>
                <div className="flex gap-2">
                  <Input type="password" placeholder="用于签名验证" className="flex-1 h-9 bg-surface-200 border-border" />
                  <Button variant="outline" className="border-border text-foreground-light">
                    <Key className="w-4 h-4 mr-1" />
                    生成
                  </Button>
                </div>
                <p className="text-xs text-foreground-muted mt-1">
                  用于验证 Webhook 请求的签名
                </p>
              </div>
            </div>

            <div className="p-5 border-t border-border flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="border-border text-foreground-light">
                取消
              </Button>
              <Button className="bg-brand-500 hover:bg-brand-600 text-background">
                创建 Webhook
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
