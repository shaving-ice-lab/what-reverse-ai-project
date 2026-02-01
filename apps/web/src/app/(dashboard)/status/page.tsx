"use client";

/**
 * 系统状态页面
 * 显示各服务的运行状态和健康检查
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Server,
  Database,
  Globe,
  Cpu,
  HardDrive,
  Wifi,
  RefreshCw,
  ExternalLink,
  Bell,
  Calendar,
  TrendingUp,
  Zap,
  Bot,
  MessageSquare,
  Cloud,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";

// 服务状态配置
const statusConfig = {
  operational: {
    label: "正常运行",
    color: "text-brand-500",
    bg: "bg-brand-500",
    bgLight: "bg-brand-200/70",
    badgeVariant: "success",
    badgeClassName: "border-brand-500/30",
  },
  degraded: {
    label: "性能下降",
    color: "text-warning",
    bg: "bg-warning",
    bgLight: "bg-warning-200/70",
    badgeVariant: "warning",
    badgeClassName: "border-warning/40",
  },
  partial: {
    label: "部分中断",
    color: "text-warning",
    bg: "bg-warning",
    bgLight: "bg-warning-200/70",
    badgeVariant: "warning",
    badgeClassName: "border-warning/40",
  },
  major: {
    label: "重大故障",
    color: "text-destructive",
    bg: "bg-destructive",
    bgLight: "bg-destructive-200/70",
    badgeVariant: "destructive",
    badgeClassName: "border-destructive/40",
  },
  maintenance: {
    label: "维护中",
    color: "text-foreground-light",
    bg: "bg-surface-200",
    bgLight: "bg-surface-200",
    badgeVariant: "secondary",
    badgeClassName: "border-border",
  },
};

// 服务列表
const services = [
  {
    id: "api",
    name: "API 服务",
    description: "核心 API 接口服务",
    icon: Server,
    status: "operational",
    uptime: 99.98,
    responseTime: 45,
    lastChecked: "1 分钟前",
  },
  {
    id: "ai-engine",
    name: "AI 引擎",
    description: "AI 模型推理服务",
    icon: Cpu,
    status: "operational",
    uptime: 99.95,
    responseTime: 120,
    lastChecked: "1 分钟前",
  },
  {
    id: "workflow",
    name: "工作流引擎",
    description: "工作流执行和调度",
    icon: Zap,
    status: "operational",
    uptime: 99.99,
    responseTime: 35,
    lastChecked: "1 分钟前",
  },
  {
    id: "database",
    name: "数据库",
    description: "主数据库集群",
    icon: Database,
    status: "operational",
    uptime: 99.99,
    responseTime: 12,
    lastChecked: "1 分钟前",
  },
  {
    id: "storage",
    name: "文件存储",
    description: "对象存储服务",
    icon: HardDrive,
    status: "degraded",
    uptime: 99.85,
    responseTime: 180,
    lastChecked: "1 分钟前",
    issue: "上传速度略有下降",
  },
  {
    id: "cdn",
    name: "CDN",
    description: "内容分发网络",
    icon: Globe,
    status: "operational",
    uptime: 99.97,
    responseTime: 25,
    lastChecked: "1 分钟前",
  },
  {
    id: "websocket",
    name: "WebSocket",
    description: "实时通信服务",
    icon: Wifi,
    status: "operational",
    uptime: 99.92,
    responseTime: 15,
    lastChecked: "1 分钟前",
  },
  {
    id: "auth",
    name: "认证服务",
    description: "用户认证和授权",
    icon: Shield,
    status: "operational",
    uptime: 99.99,
    responseTime: 28,
    lastChecked: "1 分钟前",
  },
];

// 最近事件
const recentIncidents = [
  {
    id: "1",
    title: "文件存储服务性能下降",
    status: "investigating",
    severity: "minor",
    startTime: "2026-01-31T09:30:00Z",
    updates: [
      { time: "10:15", message: "已定位问题，正在进行修复" },
      { time: "09:45", message: "工程师正在调查中" },
      { time: "09:30", message: "检测到文件上传速度下降" },
    ],
  },
  {
    id: "2",
    title: "计划维护：数据库升级",
    status: "scheduled",
    severity: "maintenance",
    startTime: "2026-02-01T02:00:00Z",
    endTime: "2026-02-01T04:00:00Z",
    updates: [
      { time: "预告", message: "将进行数据库版本升级，预计影响 2 小时" },
    ],
  },
];

// 历史可用性数据（最近90天）
const uptimeHistory = Array.from({ length: 90 }, (_, i) => ({
  date: new Date(Date.now() - (89 - i) * 24 * 60 * 60 * 1000),
  status: Math.random() > 0.05 ? "operational" : Math.random() > 0.5 ? "degraded" : "partial",
}));

export default function StatusPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated(new Date());
    }, 1000);
  };

  // 自动刷新
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // 计算整体状态
  const overallStatus = services.every((s) => s.status === "operational")
    ? "operational"
    : services.some((s) => s.status === "major")
    ? "major"
    : services.some((s) => s.status === "partial")
    ? "partial"
    : "degraded";

  const overallConfig = statusConfig[overallStatus];
  const avgUptime = (services.reduce((sum, s) => sum + s.uptime, 0) / services.length).toFixed(2);

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="系统状态"
          description="实时监控所有服务的运行状态与健康检查"
          actions={(
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                leftIcon={<RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />}
              >
                刷新
              </Button>
              <Button variant="outline" size="sm" leftIcon={<Bell className="w-4 h-4" />}>
                订阅通知
              </Button>
            </div>
          )}
        >
          <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              更新于 {lastUpdated.toLocaleTimeString("zh-CN")}
            </span>
            <Badge
              variant={overallConfig.badgeVariant}
              size="xs"
              className={cn("text-xs", overallConfig.badgeClassName)}
            >
              {overallConfig.label}
            </Badge>
            <span className="inline-flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" />
              监控 {services.length} 个服务
            </span>
          </div>
        </PageHeader>

        <div className="page-divider" />

          {/* 状态概览 */}
          <section className="page-grid lg:grid-cols-[2fr_1fr]">
            <div className="page-panel">
              <div className="page-panel-header flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="page-panel-title">整体状态</p>
                  <p className="page-panel-description">
                    {overallStatus === "operational" ? "所有系统运行正常" : "系统存在异常"}
                  </p>
                </div>
                <Badge
                  variant={overallConfig.badgeVariant}
                  size="sm"
                  className={cn("text-xs", overallConfig.badgeClassName)}
                >
                  {overallConfig.label}
                </Badge>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className={cn("h-12 w-12 rounded-md flex items-center justify-center", overallConfig.bgLight)}>
                      {overallStatus === "operational" ? (
                        <CheckCircle2 className={cn("w-6 h-6", overallConfig.color)} />
                      ) : overallStatus === "degraded" ? (
                        <AlertTriangle className={cn("w-6 h-6", overallConfig.color)} />
                      ) : (
                        <XCircle className={cn("w-6 h-6", overallConfig.color)} />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">系统健康</p>
                      <p className="text-[13px] text-foreground-light">
                        已监控 {services.length} 个核心服务
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-6 text-right">
                    <div>
                      <p className="text-xs text-foreground-muted">30 天平均可用性</p>
                      <p className="text-2xl font-semibold text-foreground">{avgUptime}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground-muted">活跃事件</p>
                      <p className="text-2xl font-semibold text-foreground">{recentIncidents.length}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Progress value={Number(avgUptime)} className="h-2 bg-surface-200" />
                  <div className="flex items-center justify-between text-xs text-foreground-muted">
                    <span>最近 30 天</span>
                    <span className="text-foreground">{avgUptime}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="page-panel">
              <div className="page-panel-header">
                <p className="page-panel-title">监控摘要</p>
                <p className="page-panel-description">最新刷新与订阅概览</p>
              </div>
              <div className="p-5 space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-foreground-muted">刷新时间</span>
                  <span className="font-mono text-foreground">
                    {lastUpdated.toLocaleTimeString("zh-CN")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground-muted">监控服务</span>
                  <span className="text-foreground">{services.length} 个</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground-muted">通知订阅</span>
                  <Badge variant="secondary" size="sm" className="bg-surface-200 text-foreground-light">
                    未订阅
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground-muted">状态视图</span>
                  <span className="text-foreground">全局</span>
                </div>
              </div>
            </div>
          </section>

          {/* 90 天可用性历史 */}
          <section className="page-panel">
            <div className="page-panel-header flex items-center justify-between gap-3">
              <div>
                <p className="page-panel-title">可用性历史</p>
                <p className="page-panel-description">过去 90 天状态概览</p>
              </div>
              <span className="text-[13px] text-foreground-light">
                整体可用性 99.95%
              </span>
            </div>
            <div className="p-5">
              <div className="flex gap-0.5">
                {uptimeHistory.map((day, index) => {
                  const config = statusConfig[day.status as keyof typeof statusConfig];
                  return (
                    <div
                      key={index}
                      className={cn("flex-1 h-6 rounded-sm", config.bg)}
                      title={`${day.date.toLocaleDateString("zh-CN")}: ${config.label}`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-foreground-muted">
                <span>90 天前</span>
                <div className="flex items-center gap-4">
                  {Object.entries(statusConfig).slice(0, 3).map(([key, config]) => (
                    <span key={key} className="flex items-center gap-1">
                      <span className={cn("w-3 h-3 rounded-sm", config.bg)} />
                      {config.label}
                    </span>
                  ))}
                </div>
                <span>今天</span>
              </div>
            </div>
          </section>

          {/* 服务列表 */}
          <section className="page-panel">
            <div className="page-panel-header flex items-center justify-between gap-3">
              <div>
                <p className="page-panel-title">服务状态</p>
                <p className="page-panel-description">关键服务运行情况</p>
              </div>
              <Button variant="outline" size="sm" className="border-border text-foreground-light hover:text-foreground">
                <Download className="w-4 h-4 mr-2" />
                导出报告
              </Button>
            </div>
            <div className="divide-y divide-border">
              {services.map((service) => {
                const config = statusConfig[service.status as keyof typeof statusConfig];
                const Icon = service.icon;

                return (
                  <div key={service.id} className="px-5 py-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-3">
                        <div className={cn("p-2.5 rounded-md", config.bgLight)}>
                          <Icon className={cn("w-4 h-4", config.color)} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-foreground">{service.name}</h4>
                            <Badge
                              variant={config.badgeVariant}
                              size="sm"
                              className={cn("text-xs", config.badgeClassName)}
                            >
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-[13px] text-foreground-light">
                            {service.issue || service.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-6 text-xs text-foreground-muted">
                        <div>
                          <p>可用性</p>
                          <p className="text-sm font-medium text-foreground">{service.uptime}%</p>
                        </div>
                        <div>
                          <p>响应时间</p>
                          <p className="text-sm font-medium text-foreground">{service.responseTime}ms</p>
                        </div>
                        <div>
                          <p>检查时间</p>
                          <p className="text-sm font-medium text-foreground">{service.lastChecked}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 最近事件 */}
          <section className="page-panel">
            <div className="page-panel-header flex items-center justify-between gap-3">
              <div>
                <p className="page-panel-title">最近事件</p>
                <p className="page-panel-description">最新维护与告警记录</p>
              </div>
              <Button variant="ghost" size="sm" className="text-foreground-light hover:text-foreground">
                查看历史 <ExternalLink className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="p-5">
              {recentIncidents.length === 0 ? (
                <div className="p-8 rounded-md bg-surface-100 border border-border text-center">
                  <CheckCircle2 className="w-10 h-10 text-brand-500 mx-auto mb-4" />
                  <p className="text-foreground text-sm font-medium">没有活跃的事件</p>
                  <p className="text-[13px] text-foreground-light">所有系统运行正常</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentIncidents.map((incident) => {
                    const statusVariant =
                      incident.status === "scheduled"
                        ? "secondary"
                        : incident.status === "investigating"
                        ? "warning"
                        : "success";
                    return (
                      <div
                        key={incident.id}
                        className="p-5 rounded-md border border-border bg-surface-100"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {incident.severity === "maintenance" ? (
                                <Clock className="w-4 h-4 text-foreground-light" />
                              ) : (
                                <AlertTriangle
                                  className={cn(
                                    "w-4 h-4",
                                    incident.severity === "minor"
                                      ? "text-warning"
                                      : "text-destructive"
                                  )}
                                />
                              )}
                              <h4 className="text-sm font-medium text-foreground">{incident.title}</h4>
                            </div>
                            <p className="text-[13px] text-foreground-light">
                              {incident.status === "scheduled"
                                ? `计划时间：${new Date(incident.startTime).toLocaleString("zh-CN")}`
                                : `开始于 ${new Date(incident.startTime).toLocaleString("zh-CN")}`}
                            </p>
                          </div>
                          <Badge
                            variant={statusVariant}
                            size="sm"
                            className={cn(
                              statusVariant === "secondary" && "bg-surface-200 text-foreground-light",
                              statusVariant === "warning" && "border-warning/40",
                              statusVariant === "success" && "border-brand-500/30"
                            )}
                          >
                            {incident.status === "scheduled"
                              ? "已计划"
                              : incident.status === "investigating"
                              ? "调查中"
                              : "已解决"}
                          </Badge>
                        </div>

                        <div className="space-y-2 pl-7">
                          {incident.updates.map((update, index) => (
                            <div key={index} className="flex items-start gap-3 text-[13px]">
                              <span className="text-foreground-muted font-mono shrink-0 w-12">
                                {update.time}
                              </span>
                              <span className="text-foreground">{update.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* 订阅提示 */}
          <section className="page-panel border border-brand-400/30 bg-brand-200/40">
            <div className="page-panel-header">
              <p className="page-panel-title">订阅状态更新</p>
              <p className="page-panel-description">
                接收系统状态变更和维护计划的实时通知
              </p>
            </div>
            <div className="px-6 pb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="text-[13px] text-foreground-light">
                支持邮件、Webhook 等多种通知通道
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="border-border text-foreground-light hover:text-foreground">
                  邮件订阅
                </Button>
                <Button size="sm" className="bg-brand-500 hover:bg-brand-600 text-background">
                  Webhook 订阅
                </Button>
              </div>
            </div>
          </section>
      </div>
    </PageContainer>
  );
}
