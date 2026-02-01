"use client";

/**
 * 入门指南页面

 * Manus 风格：简约、专业、引导性强
 */

import Link from "next/link";
import {
  BookOpen,

  ChevronRight,

  ArrowRight,

  Play,

  Zap,

  Layers,

  Code,

  Settings,

  Users,

  CheckCircle,

  Rocket,

  Video,

  FileText,

  HelpCircle,

  Star,

  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// 学习路径

const learningPaths = [

  {
    id: "beginner",

    title: "初学?", description: "从零开始学?AgentFlow",

    duration: "1-2 小时",

    level: "入门",

    color: "primary",

    steps: [

      { title: "了解基本概念", href: "/docs/concepts" },

      { title: "创建第一个工作流", href: "/docs/quickstart" },

      { title: "使用模板快速上?", href: "/templates" },

      { title: "学习节点配置", href: "/docs/guide/nodes" },

    ],

  },

  {
    id: "intermediate",

    title: "进阶用户",

    description: "深入学习高级功能",

    duration: "3-5 小时",

    level: "中级",

    color: "#3B82F6",

    steps: [

      { title: "AI Agent 集成", href: "/docs/guide/ai-agent" },

      { title: "条件分支和循?", href: "/docs/guide/conditional" },

      { title: "错误处理", href: "/docs/guide/error-handling" },

      { title: "变量和表达式", href: "/docs/guide/variables" },

    ],

  },

  {
    id: "developer",

    title: "开发?", description: "API 集成和自定义开始", duration: "5-8 小时",

    level: "高级",

    color: "#8B5CF6",

    steps: [

      { title: "API 文档", href: "/docs/api" },

      { title: "SDK 使用指南", href: "/docs/sdk" },

      { title: "自定义节点开始", href: "/docs/advanced/custom-nodes" },

      { title: "Webhook 集成", href: "/docs/integrations/webhook" },

    ],

  },

];

// 核心概念

const coreConcepts = [

  {
    icon: Zap", title: "工作?(Workflow)",

    description: "由多个节点组成的自动化流程，可以处理数据、调用服务、执行逻辑",

  },

  {
    icon: Layers,

    title: "节点 (Node)",

    description: "工作流的基本组成单元，每个节点执行特定的任务",

  },

  {
    icon: Play,

    title: "触发?(Trigger)",

    description: "启动工作流执行的条件，如定时、Webhook、手动触发等",

  },

  {
    icon: Code,

    title: "表达式(Expression)",

    description: "用于在节点间传递数据和进行动态计?,

  },

];

// 推荐资源

const resources = [

  {
    icon: Video", title: "视频教程",

    description: "跟随视频一步步学习",

    href: "/learn/courses",

    badge: "推荐",

  },

  {
    icon: FileText,

    title: "使用指南",

    description: "详细的功能说明文档", href: "/docs",

  },

  {
    icon: Users,

    title: "社区讨论",

    description: "与其他用户交流经?", href: "/community",

  },

  {
    icon: HelpCircle,

    title: "常见问题",

    description: "快速找到答?", href: "/faq",

  },

];

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* 背景效果 */}

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">

        <div

          className="absolute top-[-10%] left-[30%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"

          style={{
            background: "radial-gradient(circle, rgba(62,207,142,0.4) 0%, transparent 70%)",

          }}

        />

      </div>

      <SiteHeader />

      {/* Hero Section */}

      <section className="pt-16 sm:pt-24 pb-12 px-6">

        <div className="max-w-6xl mx-auto">

          {/* Breadcrumb */}

          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">

            <Link href="/docs" className="hover:text-foreground transition-colors">

              文档

            </Link>

            <ChevronRight className="w-4 h-4" />

            <span className="text-foreground">入门指南</span>

          </nav>

          <div className="text-center max-w-3xl mx-auto">

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-6">

              <BookOpen className="h-4 w-4" />

              入门指南

            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-6">

              欢迎使用 AgentFlow

            </h1>

            <p className="text-lg text-muted-foreground mb-8">

              无论您是初学者还是经验丰富的开发者，这份指南都将帮助您快速掌?AgentFlow 

              并开始构建强大的 AI 工作流            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">

              <Link href="/docs/quickstart">

                <Button className="bg-primary hover:bg-primary/90">

                  <Rocket className="mr-2 w-4 h-4" />

                  5 分钟快速开始                </Button>

              </Link>

              <Link href="/learn/courses">

                <Button variant="outline">

                  <Video className="mr-2 w-4 h-4" />

                  观看视频教程

                </Button>

              </Link>

            </div>

          </div>

        </div>

      </section>

      {/* 学习路径 */}

      <section className="py-16 px-6 bg-muted/20">

        <div className="max-w-6xl mx-auto">

          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">

            选择您的学习路径

          </h2>

          <p className="text-muted-foreground mb-8 text-center">

            根据您的经验水平选择最适合的学习路径          </p>

          <div className="grid md:grid-cols-3 gap-6">

            {learningPaths.map((path) => (
              <div

                key={path.id}

                className={cn(
                  "p-6 rounded-xl",

                  "bg-card border border-border",

                  "hover:border-primary/30 hover:shadow-lg",

                  "transition-all"

                )}

              >

                <div className="flex items-center gap-3 mb-4">

                  <div

                    className="w-10 h-10 rounded-lg flex items-center justify-center"

                    style={{ backgroundColor: `${path.color}15` }}

                  >

                    <Star className="w-5 h-5" style={{ color: path.color }} />

                  </div>

                  <div>

                    <h3 className="font-semibold text-foreground">{path.title}</h3>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">

                      <Clock className="w-3 h-3" />

                      {path.duration}

                      <span className="px-1.5 py-0.5 rounded bg-muted">

                        {path.level}

                      </span>

                    </div>

                  </div>

                </div>

                <p className="text-sm text-muted-foreground mb-4">

                  {path.description}

                </p>

                <ul className="space-y-2 mb-6">

                  {path.steps.map((step, index) => (
                    <li key={step.title}>

                      <Link

                        href={step.href}

                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"

                      >

                        <span

                          className="w-5 h-5 rounded-full flex items-center justify-center text-xs"

                          style={{ 

                            backgroundColor: `${path.color}15`,

                            color: path.color 

                          }}

                        >

                          {index + 1}

                        </span>

                        {step.title}

                      </Link>

                    </li>

                  ))}

                </ul>

                <Link href={`/learn/path/${path.id}`}>

                  <Button 

                    variant="outline" 

                    className="w-full"

                    style={{ 

                      borderColor: `${path.color}30`,

                      color: path.color 

                    }}

                  >

                    开始学?                    <ArrowRight className="ml-2 w-4 h-4" />

                  </Button>

                </Link>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* 核心概念 */}

      <section className="py-16 px-6">

        <div className="max-w-6xl mx-auto">

          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">

            核心概念

          </h2>

          <p className="text-muted-foreground mb-8 text-center">

            了解 AgentFlow 的基本概念，为后续学习打下基础

          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {coreConcepts.map((concept) => (
              <div

                key={concept.title}

                className="p-5 rounded-xl bg-card border border-border"

              >

                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">

                  <concept.icon className="w-5 h-5 text-primary" />

                </div>

                <h3 className="font-semibold text-foreground mb-2">

                  {concept.title}

                </h3>

                <p className="text-sm text-muted-foreground">

                  {concept.description}

                </p>

              </div>

            ))}

          </div>

          <div className="text-center mt-8">

            <Link href="/docs/concepts">

              <Button variant="outline">

                了解更多概念

                <ArrowRight className="ml-2 w-4 h-4" />

              </Button>

            </Link>

          </div>

        </div>

      </section>

      {/* 推荐资源 */}

      <section className="py-16 px-6 bg-muted/20">

        <div className="max-w-6xl mx-auto">

          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">

            推荐资源

          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {resources.map((resource) => (
              <Link

                key={resource.title}

                href={resource.href}

                className={cn(
                  "group flex items-start gap-4 p-5 rounded-xl",

                  "bg-card border border-border",

                  "hover:border-primary/30",

                  "transition-all"

                )}

              >

                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">

                  <resource.icon className="w-5 h-5 text-muted-foreground" />

                </div>

                <div className="flex-1">

                  <div className="flex items-center gap-2">

                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">

                      {resource.title}

                    </h3>

                    {resource.badge && (
                      <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs">

                        {resource.badge}

                      </span>

                    )}

                  </div>

                  <p className="text-sm text-muted-foreground">

                    {resource.description}

                  </p>

                </div>

              </Link>

            ))}

          </div>

        </div>

      </section>

      {/* 下一?CTA */}

      <section className="py-16 px-6">

        <div className="max-w-4xl mx-auto">

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#2a6348] p-8 sm:p-12 text-center">

            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />

            <div className="relative z-10">

              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">

                <Rocket className="w-8 h-8 text-white" />

              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">

                准备好开始了吗？

              </h2>

              <p className="text-white/80 mb-8 max-w-md mx-auto">

                立即创建您的第一?AI 工作流，体验自动化的强大力量

              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">

                <Link href="/register">

                  <Button className="h-12 px-8 bg-white hover:bg-white/90 text-primary-foreground font-medium rounded-xl">

                    免费注册

                    <ArrowRight className="ml-2 h-4 w-4" />

                  </Button>

                </Link>

                <Link href="/docs/quickstart">

                  <Button

                    variant="outline"

                    className="h-12 px-8 border-white/30 text-white hover:bg-white/10 rounded-xl"

                  >

                    查看快速开始                  </Button>

                </Link>

              </div>

            </div>

          </div>

        </div>

      </section>

      <SiteFooter />

    </div>

  );
}

