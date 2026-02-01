"use client";

/**
 * Roadmap - 产品路线图时间线组件
 * 
 * 展示产品发展历程和未来计划
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Rocket,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Zap,
  Shield,
  Globe,
  Brain,
  Boxes,
  Users,
} from "lucide-react";

type RoadmapStatus = "completed" | "in-progress" | "planned";

interface RoadmapItem {
  id: string;
  quarter: string;
  year: string;
  title: string;
  description: string;
  status: RoadmapStatus;
  icon: React.ElementType;
  features: string[];
  highlight?: boolean;
}

const roadmapData: RoadmapItem[] = [
  {
    id: "q1-2024",
    quarter: "Q1",
    year: "2024",
    title: "平台基础发布",
    description: "核心工作流引擎和可视化编辑器正式上线",
    status: "completed",
    icon: Rocket,
    features: [
      "可视化工作流编辑器",
      "20+ 核心节点类型",
      "基础 AI 模型集成",
      "实时执行监控",
    ],
  },
  {
    id: "q2-2024",
    quarter: "Q2",
    year: "2024",
    title: "企业级功能",
    description: "引入团队协作和企业安全特性",
    status: "completed",
    icon: Shield,
    features: [
      "团队工作空间",
      "RBAC 权限控制",
      "审计日志",
      "SSO 单点登录",
    ],
  },
  {
    id: "q3-2024",
    quarter: "Q3",
    year: "2024",
    title: "AI 能力增强",
    description: "深度集成多种大语言模型，智能工作流优化",
    status: "completed",
    icon: Brain,
    features: [
      "GPT-4, Claude, Gemini 集成",
      "AI 驱动的工作流建议",
      "智能错误诊断",
      "自然语言创建工作流",
    ],
  },
  {
    id: "q4-2024",
    quarter: "Q4",
    year: "2024",
    title: "全球化部署",
    description: "多区域部署支持，更低延迟体验",
    status: "in-progress",
    icon: Globe,
    features: [
      "亚太、欧洲、美洲节点",
      "智能路由选择",
      "数据本地化存储",
      "多语言界面支持",
    ],
    highlight: true,
  },
  {
    id: "q1-2025",
    quarter: "Q1",
    year: "2025",
    title: "生态系统扩展",
    description: "开放插件市场，打造开发者生态",
    status: "planned",
    icon: Boxes,
    features: [
      "插件/扩展市场",
      "第三方开发者 SDK",
      "自定义节点开发",
      "模板创作者计划",
    ],
  },
  {
    id: "q2-2025",
    quarter: "Q2",
    year: "2025",
    title: "Agent 智能体",
    description: "下一代自主 AI Agent 工作流",
    status: "planned",
    icon: Sparkles,
    features: [
      "自主决策 Agent",
      "多 Agent 协作",
      "长期记忆系统",
      "自我优化能力",
    ],
  },
];

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    color: "text-primary",
    bgColor: "bg-primary",
    borderColor: "border-primary",
    label: "已完成",
  },
  "in-progress": {
    icon: Clock,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400",
    borderColor: "border-yellow-400",
    label: "进行中",
  },
  planned: {
    icon: Circle,
    color: "text-muted-foreground",
    bgColor: "bg-muted-foreground",
    borderColor: "border-muted-foreground",
    label: "计划中",
  },
};

export function Roadmap() {
  const [expandedItem, setExpandedItem] = useState<string | null>("q4-2024");

  return (
    <div className="w-full">
      {/* 图例 */}
      <div className="flex items-center justify-center gap-6 mb-8">
        {Object.entries(statusConfig).map(([key, config]) => (
          <div key={key} className="flex items-center gap-2">
            <config.icon className={cn("w-4 h-4", config.color)} />
            <span className="text-sm text-muted-foreground">{config.label}</span>
          </div>
        ))}
      </div>

      {/* 时间线 */}
      <div className="relative">
        {/* 中央连接线 */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2 hidden md:block" />

        <div className="space-y-4">
          {roadmapData.map((item, index) => {
            const config = statusConfig[item.status];
            const isLeft = index % 2 === 0;
            const isExpanded = expandedItem === item.id;

            return (
              <div
                key={item.id}
                className={cn(
                  "relative grid md:grid-cols-2 gap-4 md:gap-8",
                  !isLeft && "md:direction-rtl"
                )}
              >
                {/* 时间标签 (移动端显示在卡片内) */}
                <div
                  className={cn(
                    "hidden md:flex items-center gap-2",
                    isLeft ? "justify-end" : "justify-start md:direction-ltr"
                  )}
                >
                  <div
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium",
                      "bg-card border border-border"
                    )}
                  >
                    {item.quarter} {item.year}
                  </div>
                </div>

                {/* 中心节点 (桌面端) */}
                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center">
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border-4 bg-background",
                      config.borderColor,
                      item.highlight && "ring-4 ring-yellow-400/30"
                    )}
                  />
                </div>

                {/* 内容卡片 */}
                <div
                  className={cn(
                    isLeft ? "md:col-start-2" : "md:col-start-1 md:direction-ltr"
                  )}
                >
                  <div
                    className={cn(
                      "p-5 rounded-2xl border transition-all duration-300 cursor-pointer",
                      "bg-card/50 backdrop-blur-sm",
                      "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
                      item.highlight && "border-yellow-400/50 bg-yellow-400/5",
                      isExpanded && "border-primary/50"
                    )}
                    onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                  >
                    {/* 移动端时间标签 */}
                    <div className="md:hidden flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                        {item.quarter} {item.year}
                      </span>
                      <span className={cn("text-xs font-medium", config.color)}>
                        {config.label}
                      </span>
                    </div>

                    <div className="flex items-start gap-4">
                      {/* 图标 */}
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                          "bg-gradient-to-br",
                          item.status === "completed"
                            ? "from-primary/20 to-primary/5"
                            : item.status === "in-progress"
                            ? "from-yellow-400/20 to-yellow-400/5"
                            : "from-muted-foreground/20 to-muted-foreground/5"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "w-6 h-6",
                            item.status === "completed"
                              ? "text-primary"
                              : item.status === "in-progress"
                              ? "text-yellow-400"
                              : "text-muted-foreground"
                          )}
                        />
                      </div>

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground">{item.title}</h4>
                          {item.highlight && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-400/20 text-yellow-400 rounded-full">
                              当前阶段
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.description}
                        </p>

                        {/* 展开按钮 */}
                        <button className="flex items-center gap-1 text-xs text-primary hover:underline">
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3 h-3" />
                              收起详情
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3" />
                              查看详情
                            </>
                          )}
                        </button>

                        {/* 展开内容 */}
                        <div
                          className={cn(
                            "overflow-hidden transition-all duration-300",
                            isExpanded ? "max-h-[200px] mt-4" : "max-h-0"
                          )}
                        >
                          <div className="grid grid-cols-2 gap-2">
                            {item.features.map((feature, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 text-sm"
                              >
                                <Zap className="w-3 h-3 text-primary shrink-0" />
                                <span className="text-muted-foreground">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部 CTA */}
      <div className="mt-12 text-center">
        <p className="text-muted-foreground mb-4">
          想了解更多产品计划？
        </p>
        <a
          href="/changelog"
          className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
        >
          <Sparkles className="w-4 h-4" />
          查看完整更新日志
        </a>
      </div>
    </div>
  );
}

export default Roadmap;
