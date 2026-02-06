"use client";

/**
 * 首页 - AgentFlow 落地页
 * LobeHub 风格：深色主题、大留白、渐变装饰、现代排版
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Workflow,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  Sparkles,
  Bot,
  GitBranch,
  Layers,
  CheckCircle,
  Star,
  Users,
  Code,
  Puzzle,
  MessageSquare,
  Rocket,
  Settings,
  Database,
  ChevronDown,
  Building2,
  ShoppingCart,
  GraduationCap,
  HeartPulse,
  Plus,
  Minus,
  TrendingUp,
  Github,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

// 核心功能
const features = [
  {
    icon: Bot,
    title: "智能 AI Agent",
    description: "基于大语言模型的智能代理，自动理解需求并执行复杂任务",
  },
  {
    icon: GitBranch,
    title: "可视化工作流",
    description: "拖拽式编辑器，轻松构建和管理自动化工作流",
  },
  {
    icon: Puzzle,
    title: "丰富的集成",
    description: "支持 100+ 主流服务和 API 的无缝集成",
  },
  {
    icon: Layers,
    title: "模板市场",
    description: "数千个经过验证的工作流模板，一键部署即可使用",
  },
  {
    icon: Shield,
    title: "企业级安全",
    description: "SOC 2 认证，端到端加密，完善的权限管理",
  },
  {
    icon: Globe,
    title: "全球部署",
    description: "多区域部署，低延迟访问，99.99% 可用性保障",
  },
];

// 数据统计
const stats = [
  { value: "50,000+", label: "活跃用户" },
  { value: "1M+", label: "工作流执行" },
  { value: "99.99%", label: "服务可用性" },
  { value: "100+", label: "集成服务" },
];

// 工作流程步骤
const workflowSteps = [
  {
    step: 1,
    title: "描述需求",
    description: "用自然语言告诉 AI 你想要实现什么",
    icon: MessageSquare,
  },
  {
    step: 2,
    title: "AI 生成工作流",
    description: "智能助手自动设计工作流架构",
    icon: Bot,
  },
  {
    step: 3,
    title: "可视化调整",
    description: "通过拖拽编辑器微调和优化流程",
    icon: Settings,
  },
  {
    step: 4,
    title: "一键部署",
    description: "部署到云端，自动触发执行",
    icon: Rocket,
  },
];

// 客户评价
const testimonials = [
  {
    content: "AgentFlow 彻底改变了我们的工作方式。以前需要整个团队一周完成的数据处理任务，现在只需要几分钟。",
    author: "张明",
    role: "技术总监",
    company: "科技创新公司",
    avatar: "Z",
  },
  {
    content: "可视化编辑器太棒了，即使没有编程背景的同事也能快速上手创建自动化流程。",
    author: "李华",
    role: "产品经理",
    company: "电商平台",
    avatar: "L",
  },
  {
    content: "AI Agent 的智能程度超出预期，它能理解我们的业务逻辑并给出优化建议。",
    author: "王芳",
    role: "运营负责人",
    company: "金融科技",
    avatar: "W",
  },
  {
    content: "模板市场里有大量现成的工作流，直接用就能满足 80% 的需求，非常方便。",
    author: "陈伟",
    role: "创始人",
    company: "初创公司",
    avatar: "C",
  },
  {
    content: "企业级的安全保障让我们放心地将核心业务流程迁移到 AgentFlow 上。",
    author: "赵丽",
    role: "安全主管",
    company: "大型企业",
    avatar: "ZL",
  },
  {
    content: "客户支持团队响应很快，任何问题都能在 24 小时内得到解决。",
    author: "孙强",
    role: "IT 经理",
    company: "制造业",
    avatar: "S",
  },
];

// 合作伙伴/客户
const partners = [
  { name: "TechCorp", logo: "TC" },
  { name: "InnovateLabs", logo: "IL" },
  { name: "DataFlow", logo: "DF" },
  { name: "CloudNine", logo: "C9" },
  { name: "AIVentures", logo: "AV" },
  { name: "SmartSystems", logo: "SS" },
  { name: "FutureTech", logo: "FT" },
  { name: "DigitalWave", logo: "DW" },
];

// 用例场景
const useCases = [
  {
    icon: ShoppingCart,
    title: "电商运营",
    description: "自动化订单处理、库存管理、客户通知",
    metrics: "效率提升 300%",
  },
  {
    icon: Building2,
    title: "企业办公",
    description: "审批流程、日程安排、报告生成",
    metrics: "节省 40 小时/周",
  },
  {
    icon: TrendingUp,
    title: "营销自动化",
    description: "多渠道内容发布、数据分析、线索跟进",
    metrics: "转化率提升 150%",
  },
  {
    icon: HeartPulse,
    title: "医疗健康",
    description: "预约管理、患者跟踪、数据归档",
    metrics: "处理量提升 200%",
  },
  {
    icon: GraduationCap,
    title: "教育培训",
    description: "课程管理、学员通知、证书发放",
    metrics: "管理效率提升 250%",
  },
  {
    icon: Shield,
    title: "金融服务",
    description: "风控审核、报表生成、合规检查",
    metrics: "风险降低 60%",
  },
];

// FAQ 数据
const faqs = [
  {
    question: "AgentFlow 适合什么规模的企业使用？",
    answer: "AgentFlow 适合各种规模的企业使用。从个人创业者到大型企业，我们提供灵活的方案。免费版本适合个人和小团队入门，企业版本则提供更多高级功能、更大的使用量和专属支持服务。",
  },
  {
    question: "需要编程知识才能使用吗？",
    answer: "完全不需要！AgentFlow 的可视化编辑器让任何人都能通过拖拽方式创建工作流。同时，我们的 AI 助手可以根据自然语言描述自动生成工作流。",
  },
  {
    question: "数据安全如何保障？",
    answer: "我们非常重视数据安全。AgentFlow 通过了 SOC 2 Type II 认证，所有数据传输都采用 TLS 1.3 加密，静态数据使用 AES-256 加密。",
  },
  {
    question: "可以与现有系统集成吗？",
    answer: "当然可以！AgentFlow 支持 100+ 主流服务的原生集成，包括 Slack、企业微信、钉钉、Notion、飞书、GitHub 等。同时支持通过 Webhook 和 API 与任何自定义系统集成。",
  },
  {
    question: "免费试用有什么限制？",
    answer: "免费试用期为 14 天，期间可以使用所有专业版功能，无需绑定信用卡。试用结束后，你可以选择继续使用免费版，或升级到付费版本。",
  },
  {
    question: "如何获取技术支持？",
    answer: "我们提供多种支持渠道：在线文档和教程、社区论坛、邮件支持（24小时内响应）。付费用户还可以获得优先技术支持，企业版用户更有专属客户经理。",
  },
];

// 集成服务图标
const integrations = [
  "OpenAI", "Claude", "Slack", "飞书", "GitHub", "Notion",
  "Shopify", "Stripe", "MySQL", "PostgreSQL", "Redis", "AWS",
];

// 支持的模型
const aiModels = [
  { name: "OpenAI", label: "GPT-4" },
  { name: "Anthropic", label: "Claude" },
  { name: "Google", label: "Gemini" },
  { name: "Meta", label: "LLaMA" },
  { name: "Mistral", label: "Mistral" },
  { name: "Ollama", label: "Ollama" },
];

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  useEffect(() => {
    setIsLoaded(true);
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % workflowSteps.length);
    }, 3000);
    return () => clearInterval(stepInterval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <SiteHeader />

      {/* ============================================
          HERO SECTION - LobeHub 风格
          ============================================ */}
      <section className="relative pt-32 sm:pt-40 lg:pt-48 pb-20 sm:pb-28 overflow-hidden">
        {/* 渐变背景装饰 */}
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial pointer-events-none opacity-60" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          {/* News Badge */}
          <Link
            href="/blog"
            className={cn(
              "inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-10",
              "bg-surface-200/60 border border-border/50",
              "text-[13px] text-foreground-light",
              "hover:bg-surface-300/60 transition-all duration-300",
              "transition-all duration-700",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-500 text-[11px] font-medium">
              News
            </span>
            <span>AI Agent 2.0 全新发布 — 更智能、更强大</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          {/* 主标题 */}
          <h1
            className={cn(
              "text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]",
              "transition-all duration-700 delay-100",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <span className="text-foreground">Built for you</span>
            <br />
            <span className="gradient-text-brand">the Super Individual</span>
          </h1>

          {/* 副标题 */}
          <p
            className={cn(
              "text-lg sm:text-xl text-foreground-light max-w-2xl mx-auto mb-10 leading-relaxed",
              "transition-all duration-700 delay-200",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            在 AgentFlow 中将你的 AI 团队汇聚一处：根据个性化需求灵活定制智能 Agent 功能，
            解决问题，提升生产力，探索未来工作模式
          </p>

          {/* CTA 按钮 */}
          <div
            className={cn(
              "flex flex-col sm:flex-row items-center justify-center gap-4",
              "transition-all duration-700 delay-300",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <Link href="/register">
              <Button
                className={cn(
                  "h-12 px-8 rounded-full text-[15px] font-medium",
                  "bg-foreground text-background",
                  "hover:bg-foreground/90",
                  "transition-all duration-200",
                  "shadow-lg shadow-white/5"
                )}
              >
                开始使用
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <a
              href="https://github.com/agentflow"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "h-12 px-8 rounded-full text-[15px] font-medium",
                "bg-surface-200/50 border border-border/50 text-foreground",
                "hover:bg-surface-300/50 hover:border-border-strong",
                "transition-all duration-200",
                "inline-flex items-center gap-2"
              )}
            >
              <Github className="w-4 h-4" />
              GitHub
              <span className="text-foreground-lighter text-[13px]">15K+</span>
            </a>
          </div>
        </div>
      </section>

      {/* ============================================
          概览标签卡片 - LobeHub 风格
          ============================================ */}
      <section className="relative py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-6">
          {/* 模型支持横幅 */}
          <div className="flex items-center justify-center gap-2 mb-16 flex-wrap">
            <span className="text-[13px] text-foreground-lighter mr-2">Powered by</span>
            {aiModels.map((model) => (
              <div
                key={model.name}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-100/50 border border-border/30 text-[12px] text-foreground-light"
              >
                <div className="w-4 h-4 rounded-full bg-surface-300 flex items-center justify-center text-[8px] font-bold">
                  {model.name[0]}
                </div>
                {model.label}
              </div>
            ))}
          </div>

          {/* 数据统计 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-foreground-lighter">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* 功能卡片网格 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className={cn(
                    "group relative p-6 rounded-2xl",
                    "bg-surface-100/30 border border-border/30",
                    "hover:bg-surface-100/60 hover:border-border/60",
                    "transition-all duration-300"
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                    <Icon className="w-5 h-5 text-foreground-light" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-[13px] text-foreground-lighter leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================
          工作流程 - LobeHub 风格
          ============================================ */}
      <section className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="lobe-section-header">
            <div className="lobe-badge mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>工作流程</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              从构思到上线，<span className="gradient-text-brand">只需四步</span>
            </h2>
            <p className="text-lg text-foreground-light leading-relaxed">
              无需编程知识，用自然语言描述需求，AI 帮你完成一切
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === activeStep;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={cn(
                    "relative p-6 rounded-2xl text-left transition-all duration-500",
                    isActive
                      ? "bg-surface-200/80 border border-border/60 shadow-lg shadow-black/20"
                      : "bg-surface-100/20 border border-transparent hover:bg-surface-100/40 hover:border-border/20"
                  )}
                >
                  {/* 步骤编号 */}
                  <div className={cn(
                    "text-[11px] font-medium uppercase tracking-widest mb-4 transition-colors duration-300",
                    isActive ? "text-brand-500" : "text-foreground-muted"
                  )}>
                    Step {step.step}
                  </div>
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300",
                    isActive ? "bg-foreground text-background" : "bg-surface-200/80 text-foreground-light"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-[13px] text-foreground-lighter leading-relaxed">{step.description}</p>

                  {/* 进度条 */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface-300/50 rounded-full overflow-hidden">
                      <div className="h-full bg-foreground/60 animate-[progressBar_3s_linear]" style={{ width: '100%' }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================
          使用场景 - LobeHub 风格
          ============================================ */}
      <section className="py-24 sm:py-32 bg-gradient-section">
        <div className="max-w-6xl mx-auto px-6">
          <div className="lobe-section-header">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              解放个体潜能
            </h2>
            <p className="text-lg text-foreground-light leading-relaxed">
              从工具到伙伴，在各行各业释放 AI 自动化的力量
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {useCases.map((useCase, idx) => {
              const Icon = useCase.icon;
              return (
                <div
                  key={idx}
                  className={cn(
                    "group p-6 rounded-2xl",
                    "bg-surface-100/30 border border-border/30",
                    "hover:bg-surface-100/60 hover:border-border/60",
                    "transition-all duration-300"
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-foreground-light" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-foreground mb-1">{useCase.title}</h3>
                  <p className="text-[13px] text-foreground-lighter mb-3 leading-relaxed">{useCase.description}</p>
                  <div className="text-[12px] font-medium text-brand-500">{useCase.metrics}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================
          集成服务 - LobeHub 模型滚动风格
          ============================================ */}
      <section className="py-24 sm:py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="lobe-section-header">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              100+ 集成，<span className="gradient-text-brand">无缝连接</span>
            </h2>
            <p className="text-lg text-foreground-light leading-relaxed">
              与你正在使用的工具无缝集成
            </p>
          </div>
        </div>

        {/* 滚动Logo墙 */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          <div className="flex animate-scroll">
            {[...integrations, ...integrations].map((name, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-center gap-3 px-6 py-4 mx-3 rounded-xl shrink-0",
                  "bg-surface-100/30 border border-border/20"
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-surface-200 flex items-center justify-center text-[11px] font-bold text-foreground-lighter">
                  {name[0]}
                </div>
                <span className="text-[13px] text-foreground-light whitespace-nowrap">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          用户评价 - LobeHub 风格
          ============================================ */}
      <section className="py-24 sm:py-32 bg-gradient-section">
        <div className="max-w-6xl mx-auto px-6">
          <div className="lobe-section-header">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              用户驱动的分享型社区
            </h2>
            <p className="text-lg text-foreground-light leading-relaxed">
              来自全球用户的真实反馈
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-6 rounded-2xl",
                  "bg-surface-100/30 border border-border/30",
                  "hover:bg-surface-100/50 hover:border-border/50",
                  "transition-all duration-300"
                )}
              >
                <p className="text-[14px] text-foreground-light leading-relaxed mb-5">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-surface-300 flex items-center justify-center text-[12px] font-bold text-foreground-light">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-foreground">{testimonial.author}</div>
                    <div className="text-[12px] text-foreground-lighter">
                      {testimonial.role} · {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          信任品牌 - LobeHub 风格
          ============================================ */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[13px] text-foreground-muted text-center mb-10 uppercase tracking-widest font-medium">
            深受全球优秀团队信赖
          </p>
          <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap">
            {partners.map((partner) => (
              <div
                key={partner.name}
                className="text-foreground-muted hover:text-foreground-lighter transition-colors duration-200"
              >
                <span className="text-lg font-semibold tracking-tight">{partner.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          FAQ - LobeHub 风格
          ============================================ */}
      <section className="py-24 sm:py-32">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">常见问题</h2>
            <p className="text-foreground-light">
              若没有回答到您想了解的问题，欢迎{" "}
              <Link href="/contact" className="text-foreground hover:underline underline-offset-4">
                联系我们
              </Link>
            </p>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={cn(
                  "rounded-xl border transition-all duration-200",
                  openFAQ === idx
                    ? "border-border/60 bg-surface-100/30"
                    : "border-transparent hover:bg-surface-100/20"
                )}
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="text-[15px] font-medium text-foreground pr-4">{faq.question}</span>
                  <div className={cn(
                    "shrink-0 w-6 h-6 rounded-full bg-surface-200/80 flex items-center justify-center transition-transform duration-200",
                    openFAQ === idx && "rotate-45"
                  )}>
                    <Plus className="w-3.5 h-3.5 text-foreground-light" />
                  </div>
                </button>
                {openFAQ === idx && (
                  <div className="px-6 pb-5">
                    <p className="text-[14px] text-foreground-lighter leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 mt-10">
            <Link href="/support" className="text-[13px] text-foreground-lighter hover:text-foreground-light transition-colors">
              社区支持
            </Link>
            <Link href="/contact" className="text-[13px] text-foreground-lighter hover:text-foreground-light transition-colors">
              邮件支持
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================
          底部 CTA - LobeHub 风格
          ============================================ */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        {/* 背景渐变 */}
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            AgentFlow
          </h2>
          <p className="text-xl sm:text-2xl text-foreground-light mb-4 font-medium">
            给自己一个更聪明的大脑
          </p>
          <p className="text-foreground-lighter mb-10 max-w-lg mx-auto">
            开启大脑集群，激发思维火花。你的智能 Agent，一直都在。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button className="h-12 px-8 rounded-full text-[15px] font-medium bg-foreground text-background hover:bg-foreground/90 transition-all duration-200">
                免费体验
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <a
              href="https://github.com/agentflow"
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-8 rounded-full text-[15px] font-medium bg-surface-200/50 border border-border/50 text-foreground hover:bg-surface-300/50 transition-all duration-200 inline-flex items-center gap-2"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
