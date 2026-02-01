"use client";

import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Server,
  Database,
  Cloud,
  Cpu,
  Shield,
  Zap,
  Globe,
  Lock,
  Layers,
  Network,
  HardDrive,
  Monitor,
  Smartphone,
  ArrowRight,
  ArrowDown,
  CheckCircle,
} from "lucide-react";

// 架构层级
const architectureLayers = [
  {
    id: "client",
    name: "客户端层",
    description: "多平台客户端访问，提供统一的用户体验",
    icon: Monitor,
    color: "#3B82F6",
    components: [
      { name: "Web 应用", desc: "React + Next.js 构建的现代化 Web 界面" },
      { name: "桌面应用", desc: "Electron 跨平台桌面客户端" },
      { name: "移动应用", desc: "React Native 移动端支持" },
      { name: "CLI 工具", desc: "命令行工具，适合自动化场景" },
    ],
  },
  {
    id: "gateway",
    name: "API 网关层",
    description: "统一的 API 入口，负责认证、限流和路由",
    icon: Globe,
    color: "#8B5CF6",
    components: [
      { name: "负载均衡", desc: "智能流量分发，支持灰度发布" },
      { name: "认证中心", desc: "OAuth 2.0 / JWT 身份验证" },
      { name: "限流熔断", desc: "保护后端服务免受过载" },
      { name: "API 版本管理", desc: "平滑的 API 版本迁移" },
    ],
  },
  {
    id: "service",
    name: "服务层",
    description: "核心业务逻辑，采用微服务架构",
    icon: Cpu,
    color: "#10B981",
    components: [
      { name: "工作流引擎", desc: "高性能工作流执行和调度" },
      { name: "AI 服务", desc: "多模型适配和智能路由" },
      { name: "数据处理", desc: "ETL 和实时数据管道" },
      { name: "通知服务", desc: "多渠道消息推送" },
    ],
  },
  {
    id: "data",
    name: "数据层",
    description: "高可用数据存储，支持多种存储引擎",
    icon: Database,
    color: "#F59E0B",
    components: [
      { name: "PostgreSQL", desc: "关系型数据，ACID 事务支持" },
      { name: "Redis", desc: "缓存和实时会话管理" },
      { name: "S3/OSS", desc: "对象存储，文件和媒体" },
      { name: "Elasticsearch", desc: "全文检索和日志分析" },
    ],
  },
  {
    id: "infra",
    name: "基础设施层",
    description: "云原生基础设施，支持多云部署",
    icon: Cloud,
    color: "#EC4899",
    components: [
      { name: "Kubernetes", desc: "容器编排和自动伸缩" },
      { name: "监控告警", desc: "Prometheus + Grafana 可观测性" },
      { name: "日志系统", desc: "ELK Stack 集中日志" },
      { name: "CI/CD", desc: "GitOps 持续部署" },
    ],
  },
];

export interface InteractiveArchitectureProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 默认展开的层 */
  defaultExpanded?: string;
  /** 是否显示连接动画 */
  showConnections?: boolean;
  /** 布局方向 */
  layout?: "vertical" | "horizontal";
}

export function InteractiveArchitecture({
  defaultExpanded,
  showConnections = true,
  layout = "vertical",
  className,
  ...props
}: InteractiveArchitectureProps) {
  const [activeLayer, setActiveLayer] = useState<string | null>(defaultExpanded || null);
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);

  return (
    <div className={cn("relative", className)} {...props}>
      {/* 架构图 */}
      <div className={cn(
        "space-y-3",
        layout === "horizontal" && "flex gap-4 space-y-0"
      )}>
        {architectureLayers.map((layer, index) => {
          const Icon = layer.icon;
          const isActive = activeLayer === layer.id;

          return (
            <div key={layer.id} className={cn(
              layout === "horizontal" && "flex-1"
            )}>
              {/* 层级卡片 */}
              <div
                className={cn(
                  "relative rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden",
                  isActive
                    ? "bg-card border-primary/50 shadow-lg"
                    : "bg-card/50 border-border/50 hover:border-border hover:bg-card"
                )}
                onClick={() => setActiveLayer(isActive ? null : layer.id)}
              >
                {/* 顶部渐变 */}
                <div 
                  className="absolute inset-x-0 top-0 h-1 opacity-80"
                  style={{ backgroundColor: layer.color }}
                />

                {/* 层级头部 */}
                <div className="p-4 flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${layer.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: layer.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground">{layer.name}</h4>
                    <p className="text-sm text-muted-foreground truncate">{layer.description}</p>
                  </div>
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-transform",
                    isActive && "rotate-180"
                  )}>
                    <ArrowDown className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                {/* 展开的组件列表 */}
                {isActive && (
                  <div className="px-4 pb-4 space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <div className="grid sm:grid-cols-2 gap-2">
                      {layer.components.map((component) => (
                        <div
                          key={component.name}
                          className={cn(
                            "p-3 rounded-lg transition-all duration-200",
                            "bg-muted/50 hover:bg-muted",
                            hoveredComponent === component.name && "ring-1 ring-primary/50"
                          )}
                          onMouseEnter={() => setHoveredComponent(component.name)}
                          onMouseLeave={() => setHoveredComponent(null)}
                        >
                          <div className="flex items-start gap-2">
                            <CheckCircle 
                              className="w-4 h-4 shrink-0 mt-0.5" 
                              style={{ color: layer.color }} 
                            />
                            <div>
                              <p className="text-sm font-medium text-foreground">{component.name}</p>
                              <p className="text-xs text-muted-foreground">{component.desc}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 连接线 */}
              {showConnections && index < architectureLayers.length - 1 && layout === "vertical" && (
                <div className="flex justify-center py-1">
                  <div className="w-0.5 h-4 bg-gradient-to-b from-border to-transparent" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 图例 */}
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        {architectureLayers.map((layer) => (
          <div 
            key={layer.id}
            className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            onClick={() => setActiveLayer(activeLayer === layer.id ? null : layer.id)}
          >
            <div 
              className="w-3 h-3 rounded"
              style={{ backgroundColor: layer.color }}
            />
            {layer.name}
          </div>
        ))}
      </div>
    </div>
  );
}

// 性能对比组件
const performanceMetrics = [
  { 
    metric: "平均响应时间", 
    agentflow: 45, 
    traditional: 380, 
    unit: "ms",
    improvement: "8x 更快"
  },
  { 
    metric: "并发处理能力", 
    agentflow: 10000, 
    traditional: 500, 
    unit: "req/s",
    improvement: "20x 更强"
  },
  { 
    metric: "内存占用", 
    agentflow: 256, 
    traditional: 1024, 
    unit: "MB",
    improvement: "75% 更少"
  },
  { 
    metric: "启动时间", 
    agentflow: 2, 
    traditional: 15, 
    unit: "s",
    improvement: "7x 更快"
  },
];

export interface PerformanceComparisonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 是否启用动画 */
  animated?: boolean;
}

export function PerformanceComparison({
  animated = true,
  className,
  ...props
}: PerformanceComparisonProps) {
  const [isVisible, setIsVisible] = useState(!animated);

  React.useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [animated]);

  return (
    <div className={cn("space-y-6", className)} {...props}>
      {performanceMetrics.map((item, index) => {
        const agentflowPercent = (item.agentflow / Math.max(item.agentflow, item.traditional)) * 100;
        const traditionalPercent = (item.traditional / Math.max(item.agentflow, item.traditional)) * 100;
        const isAgentflowBetter = item.agentflow < item.traditional || 
          (item.metric === "并发处理能力" && item.agentflow > item.traditional);

        return (
          <div 
            key={item.metric}
            className="space-y-3"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(20px)",
              transition: `all 0.5s ease-out ${index * 0.1}s`
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{item.metric}</span>
              <span className="text-xs font-medium text-primary">{item.improvement}</span>
            </div>
            
            {/* AgentFlow 条 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-primary font-medium">AgentFlow</span>
                <span className="text-muted-foreground">{item.agentflow} {item.unit}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/90 rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: isVisible 
                      ? `${isAgentflowBetter ? agentflowPercent : traditionalPercent}%` 
                      : "0%" 
                  }}
                />
              </div>
            </div>

            {/* 传统方案条 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">传统方案</span>
                <span className="text-muted-foreground">{item.traditional} {item.unit}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-gray-400 to-gray-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: isVisible 
                      ? `${isAgentflowBetter ? traditionalPercent : agentflowPercent}%` 
                      : "0%" 
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
