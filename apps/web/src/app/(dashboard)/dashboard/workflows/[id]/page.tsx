"use client";

/**
 * 工作流详情页面
 *
 * Supabase 风格：简约、专业、功能丰富
 */

import { useState } from "react";
import Link from "next/link";
import {
  GitBranch,
  ArrowLeft,
  Play,
  Pause,
  Copy,
  Check,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  RefreshCw,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

import { PageContainer } from "@/components/dashboard/page-layout";
import { TabNav } from "@/components/dashboard/supabase-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// 模拟工作流数据

const mockWorkflow = {
  id: "wf-001",

  name: "每日数据同步",

  description: "每天自动同步数据库数据到数据仓库，并生成报告发送到指定邮箱",

  status: "active" as const,

  trigger: "定时触发",

  schedule: "每天 08:00",

  createdAt: "2026-01-10",

  updatedAt: "2026-01-28",

  version: "1.3.0",

  nodes: 8,

  tags: ["数据同步", "自动化", "报告"],

  stats: {
    totalExecutions: 245,

    successRate: 98.4,

    avgDuration: "2m 35s",

    lastRun: "今天 08:00",

    nextRun: "明天 08:00",

  },
};

// 模拟执行记录

const mockExecutions = [

  {
    id: "exec-001",

    status: "success",

    startTime: "2026-01-30 08:00:00",

    duration: "2m 28s",

    trigger: "定时触发",

  },

  {
    id: "exec-002",

    status: "success",

    startTime: "2026-01-29 08:00:00",

    duration: "2m 45s",

    trigger: "定时触发",

  },

  {
    id: "exec-003",

    status: "failed",

    startTime: "2026-01-28 08:00:00",

    duration: "1m 12s",

    trigger: "定时触发",

    error: "数据库连接超时",

  },

  {
    id: "exec-004",

    status: "success",

    startTime: "2026-01-27 08:00:00",

    duration: "2m 31s",

    trigger: "定时触发",

  },

  {
    id: "exec-005",

    status: "success",

    startTime: "2026-01-26 08:00:00",

    duration: "2m 38s",

    trigger: "手动触发",

  },

];

// 模拟节点配置

const mockNodes = [

  { id: 1, type: "trigger", name: "定时触发器", status: "active" },

  { id: 2, type: "database", name: "读取数据库", status: "active" },

  { id: 3, type: "transform", name: "数据转换", status: "active" },

  { id: 4, type: "filter", name: "过滤条件", status: "active" },

  { id: 5, type: "aggregate", name: "数据聚合", status: "active" },

  { id: 6, type: "database", name: "写入数据仓库", status: "active" },

  { id: 7, type: "report", name: "生成报告", status: "active" },

  { id: 8, type: "email", name: "发送邮件", status: "active" },

];

export default function WorkflowDetailPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "executions" | "settings">("overview");

  const [isRunning, setIsRunning] = useState(true);

  const [copied, setCopied] = useState(false);

  const [isExecuting, setIsExecuting] = useState(false);

  const workflow = mockWorkflow;

  const overviewStats = [
    {
      label: "总执行次数",
      value: workflow.stats.totalExecutions.toLocaleString(),
      icon: Activity,
    },
    {
      label: "成功率",
      value: `${workflow.stats.successRate}%`,
      icon: CheckCircle,
    },
    {
      label: "平均耗时",
      value: workflow.stats.avgDuration,
      icon: Clock,
    },
    {
      label: "下次执行",
      value: workflow.stats.nextRun,
      icon: Calendar,
    },
  ];

  const runtimeMeta = [
    { label: "触发方式", value: workflow.trigger },
    { label: "执行计划", value: workflow.schedule },
    { label: "最近运行", value: workflow.stats.lastRun },
    { label: "下次运行", value: workflow.stats.nextRun },
  ];

  const baseMeta = [
    { label: "版本", value: `v${workflow.version}` },
    { label: "节点数量", value: `${workflow.nodes} 个` },
    { label: "创建时间", value: workflow.createdAt },
    { label: "更新时间", value: workflow.updatedAt },
  ];

  const tabs = [
    { label: "概览", value: "overview" },
    { label: "执行记录", value: "executions" },
    { label: "设置", value: "settings" },
  ];

  // 复制工作流 ID

  const copyId = () => {
    navigator.clipboard.writeText(workflow.id);

    setCopied(true);

    setTimeout(() => setCopied(false), 2000);

  };

  // 切换运行状态

  const toggleRunning = () => {
    setIsRunning(!isRunning);

  };

  // 手动执行

  const executeWorkflow = async () => {
    setIsExecuting(true);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsExecuting(false);

  };

  // 状态图标

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "success":

        return <CheckCircle className="w-4 h-4 text-brand-500" />;

      case "failed":

        return <XCircle className="w-4 h-4 text-destructive" />;

      case "running":

        return <RefreshCw className="w-4 h-4 text-brand-400 animate-spin" />;

      default:

        return <Clock className="w-4 h-4 text-foreground-muted" />;

    }

  };

  return (
    <PageContainer fullWidth>

      {/* Header */}

      <header className="border-b border-border bg-background-studio">

        <div className="py-4">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div className="flex items-center gap-4">

              <Link

                href="/dashboard/workflows"

                className="flex items-center gap-2 text-[13px] text-foreground-light hover:text-foreground transition-colors"

              >

                <ArrowLeft className="w-4 h-4" />

                返回

              </Link>

              <div className="h-8 w-px bg-border" />

              <div className="flex items-center gap-3">

                <div className="w-9 h-9 rounded-md bg-brand-200/80 border border-brand-400/30 flex items-center justify-center">

                  <GitBranch className="w-4 h-4 text-brand-500" />

                </div>

                <div>
                  <p className="page-caption">Workflows</p>
                  <div className="flex items-center gap-2 flex-wrap">

                    <h1 className="text-section-title text-foreground">{workflow.name}</h1>

                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border",
                        isRunning
                          ? "bg-brand-200 text-brand-500 border-brand-400/40"
                          : "bg-surface-200 text-foreground-muted border-border"
                      )}
                    >
                      {isRunning ? "运行中" : "已暂停"}
                    </span>

                  </div>

                  <div className="flex items-center gap-2 text-xs text-foreground-muted">

                    <span>ID: {workflow.id}</span>

                    <button onClick={copyId} className="hover:text-foreground">

                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}

                    </button>

                    <span className="hidden sm:inline">· v{workflow.version}</span>
                    <span className="hidden sm:inline">· 更新 {workflow.updatedAt}</span>

                  </div>

                </div>

              </div>

            </div>

            <div className="flex items-center gap-2">

            <Button

              size="sm"

              onClick={executeWorkflow}

              disabled={isExecuting || !isRunning}

              className="bg-brand-500 text-background hover:bg-brand-600"

            >

              {isExecuting ? (
                <>

                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />

                  执行中...

                </>

              ) : (
                <>

                  <Play className="w-4 h-4 mr-2" />

                  手动执行

                </>

              )}

            </Button>

            <Button

              variant="outline"

              size="sm"

              onClick={toggleRunning}

              className={cn(
                "border",
                isRunning

                  ? "text-brand-500 border-brand-400/30 hover:bg-brand-200/30"

                  : "text-foreground-light border-border hover:bg-surface-200"

              )}

            >

              {isRunning ? (
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

            </Button>

            <Link href={`/editor/${workflow.id}`}>

              <Button variant="outline" size="sm" className="border border-border text-foreground-light hover:bg-surface-200">

                <Edit className="w-4 h-4 mr-2" />

                编辑

              </Button>

            </Link>

            <Button variant="outline" size="sm" className="border border-border text-foreground-light hover:bg-surface-200">

              <MoreVertical className="w-4 h-4" />

            </Button>

          </div>

        </div>

      </header>

      {/* Tabs */}

      <div className="bg-background-studio">
        <TabNav
          tabs={tabs}
          activeTab={activeTab}
          onChange={(value) => setActiveTab(value as typeof activeTab)}
        />
      </div>

      {/* Content */}

      <div className="page-section p-6">

        {/* Overview Tab */}

        {activeTab === "overview" && (
          <div className="space-y-8">

            {/* Status Banner */}

            <div className={cn(
              "page-panel",
              isRunning ? "border-brand-400/30 bg-brand-200/20" : ""
            )}>

              <div className="page-panel-header flex flex-wrap items-center justify-between gap-3">

                <div className="flex items-center gap-3">

                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full",

                    isRunning ? "bg-brand-500 animate-pulse-soft" : "bg-foreground-muted"

                  )} />

                  <div>
                    <span className="text-[13px] font-medium text-foreground">

                      {isRunning ? "运行中" : "已暂停"}

                    </span>

                    <span className="block text-xs text-foreground-muted">
                       {workflow.trigger} · {workflow.schedule}
                    </span>
                  </div>

                </div>

                <div className="flex items-center gap-4 text-xs text-foreground-muted">

                  <span>
                    版本: <span className="text-foreground">v{workflow.version}</span>
                  </span>

                  <span>
                    更新于: <span className="text-foreground">{workflow.updatedAt}</span>
                  </span>

                </div>

              </div>

            </div>

            {/* Description */}

            <div className="page-panel">

              <div className="page-panel-header">
                <div className="page-panel-title">工作流描述</div>
                <div className="page-panel-description">摘要与标签</div>
              </div>

              <div className="p-6">

                <p className="text-[13px] text-foreground-light">{workflow.description}</p>

                <div className="flex flex-wrap gap-2 mt-4">

                  {workflow.tags.map((tag) => (
                    <span

                      key={tag}

                      className="px-2.5 py-1 rounded-md bg-surface-200 text-xs text-foreground-muted"

                    >

                      {tag}

                    </span>

                  ))}

                </div>

              </div>

            </div>

            {/* Stats Grid */}

            <div className="page-grid sm:grid-cols-2 lg:grid-cols-4">
              {overviewStats.map((stat) => (
                <div key={stat.label} className="page-panel p-5">
                  <stat.icon className="w-4 h-4 text-brand-500 mb-3" />
                  <div className="text-stat-number text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs text-foreground-muted">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Workflow Nodes */}

            <div className="page-panel">

              <div className="page-panel-header flex items-center justify-between">

                <div>
                  <div className="page-panel-title">工作流节点</div>
                  <div className="page-panel-description">共 {mockNodes.length} 个节点</div>
                </div>

                <Link href={`/editor/${workflow.id}`}>

                  <Button variant="outline" size="sm" className="border border-border text-foreground-light hover:bg-surface-200">

                    <Edit className="w-4 h-4 mr-2" />

                    编辑工作流

                  </Button>

                </Link>

              </div>

              <div className="p-6">
                <div className="flex items-center gap-2 overflow-x-auto pb-4">

                {mockNodes.map((node, index) => (
                  <div key={node.id} className="flex items-center">

                    <div className="p-3 rounded-md bg-surface-200 border border-border min-w-[140px]">

                      <div className="text-xs text-foreground-muted mb-1">

                        {node.type}

                      </div>

                      <div className="text-[13px] font-medium text-foreground">

                        {node.name}

                      </div>

                    </div>

                    {index < mockNodes.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-foreground-muted mx-1 shrink-0" />

                    )}

                  </div>

                ))}

              </div>
              </div>
            </div>

            </div>

            {/* Recent Executions */}

            <div className="page-panel">

              <div className="page-panel-header flex items-center justify-between">

                <div>
                  <div className="page-panel-title">最近执行</div>
                  <div className="page-panel-description">最近 3 次运行记录</div>
                </div>

                <Button variant="ghost" size="sm" onClick={() => setActiveTab("executions")} className="text-foreground-light">

                  查看全部

                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />

                </Button>

              </div>

              <div className="p-6 space-y-3">

                {mockExecutions.slice(0, 3).map((exec) => (
                  <div

                    key={exec.id}

                    className="p-4 rounded-md bg-surface-100/60 border border-border hover:border-border-strong hover:bg-surface-100 transition-supabase cursor-pointer"

                  >

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-3">

                        <StatusIcon status={exec.status} />

                        <div>

                          <span className="text-[13px] font-medium text-foreground">

                            {exec.startTime}

                          </span>

                          <span className="text-xs text-foreground-muted ml-2">

                             {exec.trigger}

                          </span>

                        </div>

                      </div>

                      <div className="flex items-center gap-4 text-xs">

                        <span className="text-foreground-muted">

                          耗时: <span className="text-foreground">{exec.duration}</span>

                        </span>

                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-xs font-medium",

                          exec.status === "success"

                            ? "bg-brand-200 text-brand-500"

                            : exec.status === "failed"

                            ? "bg-destructive-200 text-destructive"

                            : "bg-brand-200 text-brand-400"

                        )}>

                          {exec.status === "success" ? "成功" : exec.status === "failed" ? "失败" : "运行中"}

                        </span>

                      </div>

                    </div>

                    {exec.error && (
                      <div className="mt-2 p-2 rounded-md bg-destructive-200 text-xs text-destructive">

                        <AlertCircle className="w-4 h-4 inline-block mr-1" />

                        {exec.error}

                      </div>

                    )}

                  </div>

                ))}

              </div>

            </div>

            <div className="page-grid sm:grid-cols-2">
              <div className="page-panel">
                <div className="page-panel-header">
                  <div className="page-panel-title">运行配置</div>
                  <div className="page-panel-description">触发与执行节奏</div>
                </div>
                <div className="p-4 space-y-3 text-xs">
                  {runtimeMeta.map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-foreground-muted">{item.label}</span>
                      <span className="text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="page-panel">
                <div className="page-panel-header">
                  <div className="page-panel-title">基础信息</div>
                  <div className="page-panel-description">版本与规模</div>
                </div>
                <div className="p-4 space-y-3 text-xs">
                  {baseMeta.map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-foreground-muted">{item.label}</span>
                      <span className="text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        )}

        {/* Executions Tab */}

        {activeTab === "executions" && (
          <div className="page-panel overflow-hidden">

            <div className="page-panel-header flex items-center justify-between">

              <div>
                <div className="page-panel-title">执行记录</div>
                <div className="page-panel-description">所有历史运行记录</div>
              </div>

              <div className="flex items-center gap-2">

                <select className="h-9 px-3 rounded-md bg-surface-100 border border-border text-xs text-foreground focus:border-brand-500 focus:outline-none">

                  <option value="all">全部状态</option>

                  <option value="success">成功</option>

                  <option value="failed">失败</option>

                </select>

                <Button variant="outline" size="sm" className="border border-border text-foreground-light hover:bg-surface-200">

                  <RefreshCw className="w-4 h-4" />

                </Button>

              </div>

            </div>

            <div className="border-t border-border overflow-hidden">

              <table className="w-full">

                <thead className="bg-surface-200">

                  <tr>

                    <th className="px-4 py-3 text-left text-table-header">状态</th>

                    <th className="px-4 py-3 text-left text-table-header">开始时间</th>

                    <th className="px-4 py-3 text-left text-table-header">耗时</th>

                    <th className="px-4 py-3 text-left text-table-header">触发方式</th>

                    <th className="px-4 py-3 text-right text-table-header">操作</th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-border">

                  {mockExecutions.map((exec) => (
                    <tr key={exec.id} className="hover:bg-surface-100/70 transition-colors">

                      <td className="px-4 py-3">

                        <div className="flex items-center gap-2">

                          <StatusIcon status={exec.status} />

                          <span className={cn(
                            "text-xs",

                            exec.status === "success"

                              ? "text-brand-500"

                              : exec.status === "failed"

                              ? "text-destructive"

                              : "text-brand-400"

                          )}>

                            {exec.status === "success" ? "成功" : exec.status === "failed" ? "失败" : "运行中"}

                          </span>

                        </div>

                      </td>

                      <td className="px-4 py-3 text-xs text-foreground">{exec.startTime}</td>

                      <td className="px-4 py-3 text-xs text-foreground-muted">{exec.duration}</td>

                      <td className="px-4 py-3 text-xs text-foreground-muted">{exec.trigger}</td>

                      <td className="px-4 py-3 text-right">

                        <Button variant="ghost" size="sm" className="text-foreground-light">

                          查看日志

                          <ExternalLink className="w-3 h-3 ml-1" />

                        </Button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        )}

        {/* Settings Tab */}

        {activeTab === "settings" && (
          <div className="space-y-8">

            <div className="page-panel">

              <div className="page-panel-header">
                <div className="page-panel-title">基本信息</div>
                <div className="page-panel-description">更新工作流名称与描述</div>
              </div>

              <div className="p-6 space-y-4">

                <div>

                  <label className="block text-[13px] font-medium text-foreground mb-2">

                    工作流名称

                  </label>

                  <Input value={workflow.name} className="h-9 bg-surface-100 border border-border text-foreground" />

                </div>

                <div>

                  <label className="block text-[13px] font-medium text-foreground mb-2">

                    描述

                  </label>

                  <textarea

                    value={workflow.description}

                    rows={3}

                    className="w-full px-4 py-3 rounded-md bg-surface-100 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none text-[13px]"

                  />

                </div>

              </div>

            </div>

            <div className="page-panel">

              <div className="page-panel-header">
                <div className="page-panel-title">触发配置</div>
                <div className="page-panel-description">配置触发类型与执行时间</div>
              </div>

              <div className="p-6 page-grid sm:grid-cols-2">

                <div>

                  <label className="block text-[13px] font-medium text-foreground mb-2">

                    触发类型

                  </label>

                  <select className="w-full h-9 px-4 rounded-md bg-surface-100 border border-border text-[13px] text-foreground focus:border-brand-500 focus:outline-none">

                    <option value="schedule">定时触发</option>

                    <option value="webhook">Webhook</option>

                    <option value="manual">手动触发</option>

                  </select>

                </div>

                <div>

                  <label className="block text-[13px] font-medium text-foreground mb-2">

                    执行时间

                  </label>

                  <Input value="08:00" type="time" className="h-9 bg-surface-100 border border-border text-foreground" />

                </div>

              </div>

            </div>

            <div className="page-panel">

              <div className="page-panel-header">
                <div className="page-panel-title">高级设置</div>
                <div className="page-panel-description">失败重试与超时策略</div>
              </div>

              <div className="p-6 space-y-4">

                <div className="flex items-center justify-between p-4 rounded-md bg-surface-100 border border-border">

                  <div>

                    <div className="text-[13px] font-medium text-foreground">失败重试</div>

                    <div className="text-xs text-foreground-muted">执行失败时自动重试</div>

                  </div>

                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-border bg-surface-100 text-brand-500"
                  />

                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-md bg-surface-100 border border-border">

                  <div>

                    <div className="text-[13px] font-medium text-foreground">执行超时</div>

                    <div className="text-xs text-foreground-muted">超过指定时间自动终止</div>

                  </div>

                  <div className="flex items-center gap-2">
                    <Input value="30" type="number" className="w-24 h-9 bg-surface-100 border border-border text-foreground" />
                    <span className="text-xs text-foreground-muted">分钟</span>
                  </div>

                </div>

              </div>

            </div>

            <div className="page-panel border-destructive/30 bg-destructive-200/60">

              <div className="page-panel-header">
                <div className="text-sm font-semibold text-destructive">危险操作</div>
                <div className="text-xs text-foreground-light">
                  删除工作流后将无法恢复，所有执行记录也将被删除。
                </div>
              </div>

              <div className="p-6">
                <Button variant="outline" className="text-destructive border border-destructive/30 hover:bg-destructive-200">

                  <Trash2 className="w-4 h-4 mr-2" />

                  删除工作流

                </Button>
              </div>

            </div>

            <div className="flex justify-end gap-4">

              <Button variant="outline" className="border border-border text-foreground-light hover:bg-surface-200">取消</Button>

              <Button className="bg-brand-500 hover:bg-brand-600 text-background">保存更改</Button>

            </div>

          </div>

        )}

      </div>

    </PageContainer>

  );
}

