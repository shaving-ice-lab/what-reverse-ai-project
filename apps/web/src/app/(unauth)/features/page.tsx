"use client";

/**
 * 功能介绍页面 - LobeHub 风格
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
  Database,
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
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// 核心功能
const coreFeatures = [
  {
    icon: Bot,
    title: "智能 AI Agent",
    description: "基于 GPT-4、Claude 3 等顶级大语言模型的智能代理，能够理解复杂需求并自动执行多步骤任务。",
    highlights: ["自然语言交互", "上下文理解", "自主决策执行"],
  },
  {
    icon: GitBranch,
    title: "可视化工作流编辑器",
    description: "直观的拖拽式编辑器，让您无需编写代码即可构建复杂的自动化流程。",
    highlights: ["拖拽式操作", "实时预览", "版本控制"],
  },
  {
    icon: Puzzle,
    title: "100+ 集成服务",
    description: "与主流 SaaS 服务、数据库、API 无缝集成，打通您的所有工作工具。",
    highlights: ["一键连接", "OAuth 认证", "自定义集成"],
  },
  {
    icon: Layers,
    title: "模板市场",
    description: "数千个经过验证的工作流模板，覆盖各行业场景，一键部署即可使用。",
    highlights: ["社区贡献", "官方认证", "持续更新"],
  },
  {
    icon: Shield,
    title: "企业级安全",
    description: "SOC 2 Type II 认证，端到端加密，完善的权限管理和审计日志。",
    highlights: ["数据加密", "角色权限", "审计日志"],
  },
  {
    icon: Globe,
    title: "全球部署",
    description: "多区域数据中心部署，确保低延迟访问和 99.99% 的服务可用性。",
    highlights: ["多区域部署", "自动扩缩容", "灾备恢复"],
  },
];

// 高级功能
const advancedFeatures = [
  { icon: Repeat, title: "Multi-Agent 协作", description: "多个 AI Agent 协同工作，处理复杂的多步骤任务" },
  { icon: Terminal, title: "自定义代码节点", description: "使用 JavaScript/Python 创建自定义逻辑节点" },
  { icon: Webhook, title: "Webhook 触发器", description: "灵活的 Webhook 支持，轻松对接外部系统" },
  { icon: Database, title: "数据转换", description: "强大的数据映射和转换能力，处理任意格式数据" },
  { icon: BarChart3, title: "执行分析", description: "详细的执行日志和性能分析，优化工作流效率" },
  { icon: Clock, title: "定时调度", description: "灵活的 Cron 表达式支持，精确控制执行时间" },
  { icon: Users, title: "团队协作", description: "多人实时协作编辑，共享工作流和模板" },
  { icon: Lock, title: "敏感数据保护", description: "凭证加密存储，支持环境变量和密钥管理" },
];

// AI 能力
const aiCapabilities = [
  { title: "自然语言处理", description: "理解并处理各种语言任务，包括文本分析、情感分析、实体提取等", icon: MessageSquare },
  { title: "智能决策", description: "根据上下文自动做出决策，选择最优的执行路径", icon: Sparkles },
  { title: "代码生成", description: "自动生成代码片段，帮助开发者提高效率", icon: Code },
  { title: "数据分析", description: "智能分析数据模式，生成洞察报告", icon: BarChart3 },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative pt-32 sm:pt-40 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="lobe-badge mb-8">
            <Sparkles className="h-3.5 w-3.5" />
            <span>强大功能，无限可能</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]">
            为现代团队打造的
            <br />
            <span className="gradient-text-brand">AI 自动化平台</span>
          </h1>

          <p className="text-lg text-foreground-light max-w-2xl mx-auto mb-10 leading-relaxed">
            AgentFlow 提供一站式自动化解决方案，从简单的任务自动化到复杂的企业级工作流，满足您的一切需求。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button className="h-12 px-8 rounded-full text-[15px] font-medium bg-foreground text-background hover:bg-foreground/90">
                免费开始使用
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" className="h-12 px-8 rounded-full text-[15px] border-border/50 hover:bg-surface-200/50">
                观看演示
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="lobe-section-header">
            <h2>核心功能</h2>
            <p>强大而灵活的功能组合，助您构建任何自动化场景</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coreFeatures.map((feature) => (
              <div
                key={feature.title}
                className={cn(
                  "group p-6 rounded-2xl",
                  "bg-surface-100/30 border border-border/30",
                  "hover:bg-surface-100/60 hover:border-border/60",
                  "transition-all duration-300"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                  <feature.icon className="w-5 h-5 text-foreground-light" />
                </div>

                <h3 className="text-[15px] font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-[13px] text-foreground-lighter mb-4 leading-relaxed">{feature.description}</p>

                <ul className="space-y-2">
                  {feature.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-center gap-2 text-[12px] text-foreground-lighter">
                      <CheckCircle className="w-3.5 h-3.5 text-foreground-light" />
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
      <section className="py-24 sm:py-32 bg-gradient-section">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="lobe-badge mb-6">
                <Bot className="h-3.5 w-3.5" />
                <span>AI 驱动</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4">
                强大的 AI 能力
              </h2>
              <p className="text-foreground-light mb-8 leading-relaxed">
                内置先进的人工智能能力，让您的工作流更加智能和高效。支持多种大语言模型，包括 GPT-4、Claude 3、通义千问等。
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                {aiCapabilities.map((capability) => (
                  <div key={capability.title} className="flex items-start gap-3 p-4 rounded-xl bg-surface-100/30 border border-border/30">
                    <div className="w-9 h-9 rounded-lg bg-surface-200/80 flex items-center justify-center shrink-0">
                      <capability.icon className="w-4 h-4 text-foreground-light" />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-medium text-foreground mb-1">{capability.title}</h4>
                      <p className="text-[12px] text-foreground-lighter leading-relaxed">{capability.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Demo Visual */}
            <div className="relative">
              <div className="rounded-2xl border border-border/30 bg-surface-100/30 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-surface-200/80 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-foreground-light" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-semibold text-foreground">AI Agent</h4>
                    <p className="text-[12px] text-foreground-lighter">正在处理任务...</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-surface-200/30 border border-border/20">
                    <p className="text-[11px] text-foreground-lighter mb-2 uppercase tracking-widest font-medium">输入</p>
                    <p className="text-[14px] text-foreground">&quot;分析这份销售报告，找出关键趋势&quot;</p>
                  </div>
                  <div className="p-4 rounded-xl bg-brand-200/30 border border-brand-300/30">
                    <p className="text-[11px] text-brand-500 mb-2 uppercase tracking-widest font-medium">AI 输出</p>
                    <p className="text-[13px] text-foreground-light leading-relaxed">
                      根据分析，本季度销售额增长 23%，主要由新产品线贡献。建议重点关注北方区域的增长潜力...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="lobe-section-header">
            <h2>更多高级功能</h2>
            <p>满足专业用户和企业级需求的高级特性</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {advancedFeatures.map((feature) => (
              <div
                key={feature.title}
                className={cn(
                  "p-5 rounded-2xl",
                  "bg-surface-100/30 border border-border/30",
                  "hover:bg-surface-100/60 hover:border-border/60",
                  "transition-all duration-300"
                )}
              >
                <div className="w-9 h-9 rounded-lg bg-surface-200/80 flex items-center justify-center mb-4">
                  <feature.icon className="w-4 h-4 text-foreground-light" />
                </div>
                <h3 className="text-[14px] font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-[12px] text-foreground-lighter leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4">
            准备好体验了吗？
          </h2>
          <p className="text-foreground-light mb-10">
            免费开始使用 AgentFlow，探索 AI 自动化的无限可能
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button className="h-12 px-8 rounded-full text-[15px] font-medium bg-foreground text-background hover:bg-foreground/90">
                免费开始使用
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" className="h-12 px-8 rounded-full text-[15px] border-border/50 hover:bg-surface-200/50">
                查看定价
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
