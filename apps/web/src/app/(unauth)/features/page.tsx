"use client";

/**
 * 功能介绍页面 - Manus 风格
 */

import Link from "next/link";
import {
  Bot,
  GitBranch,
  Puzzle,
  Layers,
  Shield,
  Globe,
  Zap,
  Clock,
  Users,
  Code,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Play,
  Workflow,
  Database,
  Cloud,
  Lock,
  Settings,
  BarChart3,
  MessageSquare,
  Repeat,
  Terminal,
  Webhook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { cn } from "@/lib/utils";

// 核心功能
const coreFeatures = [
  {
    icon: Bot,
    title: "智能 AI Agent",
    description: "基于 GPT-4、Claude 3 等顶级大语言模型的智能代理，能够理解复杂需求并自动执行多步骤任务。",
    highlights: ["自然语言交互", "上下文理解", "自主决策执行"],
    color: "primary",
  },
  {
    icon: GitBranch,
    title: "可视化工作流编辑器",
    description: "直观的拖拽式编辑器，让您无需编写代码即可构建复杂的自动化流程。",
    highlights: ["拖拽式操作", "实时预览", "版本控制"],
    color: "#3B82F6",
  },
  {
    icon: Puzzle,
    title: "100+ 集成服务",
    description: "与主流 SaaS 服务、数据库、API 无缝集成，打通您的所有工作工具。",
    highlights: ["一键连接", "OAuth 认证", "自定义集成"],
    color: "#8B5CF6",
  },
  {
    icon: Layers,
    title: "模板市场",
    description: "数千个经过验证的工作流模板，覆盖各行业场景，一键部署即可使用。",
    highlights: ["社区贡献", "官方认证", "持续更新"],
    color: "#F59E0B",
  },
  {
    icon: Shield,
    title: "企业级安全",
    description: "SOC 2 Type II 认证，端到端加密，完善的权限管理和审计日志。",
    highlights: ["数据加密", "角色权限", "审计日志"],
    color: "#EF4444",
  },
  {
    icon: Globe,
    title: "全球部署",
    description: "多区域数据中心部署，确保低延迟访问和 99.99% 的服务可用性。",
    highlights: ["多区域部署", "自动扩缩容", "灾备恢复"],
    color: "#10B981",
  },
];

// 高级功能
const advancedFeatures = [
  {
    icon: Repeat,
    title: "Multi-Agent 协作",
    description: "多个 AI Agent 协同工作，处理复杂的多步骤任务",
  },
  {
    icon: Terminal,
    title: "自定义代码节点",
    description: "使用 JavaScript/Python 创建自定义逻辑节点",
  },
  {
    icon: Webhook,
    title: "Webhook 触发器",
    description: "灵活的 Webhook 支持，轻松对接外部系统",
  },
  {
    icon: Database,
    title: "数据转换",
    description: "强大的数据映射和转换能力，处理任意格式数据",
  },
  {
    icon: BarChart3,
    title: "执行分析",
    description: "详细的执行日志和性能分析，优化工作流效率",
  },
  {
    icon: Clock,
    title: "定时调度",
    description: "灵活的 Cron 表达式支持，精确控制执行时间",
  },
  {
    icon: Users,
    title: "团队协作",
    description: "多人实时协作编辑，共享工作流和模板",
  },
  {
    icon: Lock,
    title: "敏感数据保护",
    description: "凭证加密存储，支持环境变量和密钥管理",
  },
];

// AI 能力
const aiCapabilities = [
  {
    title: "自然语言处理",
    description: "理解并处理各种语言任务，包括文本分析、情感分析、实体提取等",
    icon: MessageSquare,
  },
  {
    title: "智能决策",
    description: "根据上下文自动做出决策，选择最优的执行路径",
    icon: Sparkles,
  },
  {
    title: "代码生成",
    description: "自动生成代码片段，帮助开发者提高效率",
    icon: Code,
  },
  {
    title: "数据分析",
    description: "智能分析数据模式，生成洞察报告",
    icon: BarChart3,
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            强大功能，无限可能
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6">
            为现代团队打造的
            <br />
            <span className="text-primary">AI 自动化平台</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            AgentFlow 提供一站式自动化解决方案，从简单的任务自动化到复杂的企业级工作流，
            满足您的一切需求。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 rounded-full">
                免费开始使用
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="h-12 px-8 rounded-full">
                <Play className="mr-2 h-4 w-4" />
                观看演示
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              核心功能
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              强大而灵活的功能组合，助您构建任何自动化场景
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature) => (
              <div
                key={feature.title}
                className={cn(
                  "group p-6 rounded-2xl",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5",
                  "transition-all duration-300"
                )}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${feature.color}15` }}
                >
                  <feature.icon className="w-7 h-7" style={{ color: feature.color }} />
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {feature.description}
                </p>

                <ul className="space-y-2">
                  {feature.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Capabilities */}
      <section className="py-20 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
                <Bot className="h-3.5 w-3.5" />
                AI 驱动
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                强大的 AI 能力
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                内置先进的人工智能能力，让您的工作流更加智能和高效。
                支持多种大语言模型，包括 GPT-4、Claude 3、通义千问等。
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {aiCapabilities.map((capability) => (
                  <div key={capability.title} className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <capability.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">{capability.title}</h4>
                      <p className="text-sm text-muted-foreground">{capability.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual */}
            <div className="relative">
              <div className="rounded-2xl border border-border bg-card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">AI Agent</h4>
                    <p className="text-sm text-muted-foreground">正在处理任务...</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="text-sm text-muted-foreground mb-2">输入</p>
                    <p className="text-foreground">"分析这份销售报告，找出关键趋势"</p>
                  </div>
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-sm text-primary mb-2">AI 输出</p>
                    <p className="text-foreground text-sm">
                      根据分析，本季度销售额增长 23%，主要由新产品线贡献。
                      建议重点关注北方区域的增长潜力...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              更多高级功能
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              满足专业用户和企业级需求的高级特性
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {advancedFeatures.map((feature) => (
              <div
                key={feature.title}
                className={cn(
                  "p-5 rounded-xl",
                  "bg-card border border-border",
                  "hover:border-primary/30",
                  "transition-all duration-300"
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-muted/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            准备好体验了吗？
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            免费开始使用 AgentFlow，探索 AI 自动化的无限可能
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 rounded-full">
                免费开始使用
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="h-12 px-8 rounded-full">
                查看定价
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2026 AgentFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
