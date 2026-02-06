"use client";

/**
 * 集成概览页面 - LobeHub 风格
 */

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Search,
  Plug,
  Globe,
  Database,
  Cloud,
  MessageSquare,
  Mail,
  Calendar,
  FileText,
  Code,
  Webhook,
  GitBranch,
  Box,
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

// 集成分类
const categories = [
  { id: "all", name: "全部", icon: Box },
  { id: "communication", name: "通讯", icon: MessageSquare },
  { id: "development", name: "开发", icon: Code },
  { id: "productivity", name: "效率", icon: Zap },
  { id: "storage", name: "存储", icon: Database },
  { id: "custom", name: "自定义", icon: Webhook },
];

// 集成列表
const integrations = [
  {
    id: "slack",
    name: "Slack",
    description: "发送消息、创建频道、处理交互式消息",
    category: "communication",
    icon: "🔔",
    color: "#4A154B",
    popular: true,
    docs: "/docs/integrations/slack",
    features: ["消息通知", "Slash 命令", "交互式审批"],
  },
  {
    id: "github",
    name: "GitHub",
    description: "自动化代码审查、Issue 管理、部署流程",
    category: "development",
    icon: "🐙",
    color: "#24292e",
    popular: true,
    docs: "/docs/integrations/github",
    features: ["Webhook 触发", "PR 管理", "Actions 集成"],
  },
  {
    id: "webhook",
    name: "Webhook",
    description: "接收和发送 HTTP 请求，连接任意外部服务",
    category: "custom",
    icon: "🔗",
    color: "#4e8fff",
    popular: true,
    docs: "/docs/integrations/webhook",
    features: ["自定义端点", "请求验证", "响应映射"],
  },
  {
    id: "notion",
    name: "Notion",
    description: "同步数据库、创建页面、管理内容",
    category: "productivity",
    icon: "📝",
    color: "#ffffff",
    popular: false,
    docs: "/docs/integrations/notion",
    features: ["数据库同步", "页面创建", "内容更新"],
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    description: "读取和写入电子表格数据",
    category: "productivity",
    icon: "📊",
    color: "#0F9D58",
    popular: false,
    docs: "/docs/integrations/google-sheets",
    features: ["数据读取", "批量写入", "公式计算"],
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "发送邮件、处理收件、自动回复",
    category: "communication",
    icon: "📧",
    color: "#EA4335",
    popular: false,
    docs: "/docs/integrations/gmail",
    features: ["发送邮件", "收件触发", "附件处理"],
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    description: "执行 SQL 查询、管理数据库",
    category: "storage",
    icon: "🐘",
    color: "#336791",
    popular: false,
    docs: "/docs/integrations/postgresql",
    features: ["SQL 查询", "事务支持", "连接管理"],
  },
  {
    id: "mongodb",
    name: "MongoDB",
    description: "文档数据库操作、聚合查询",
    category: "storage",
    icon: "🍃",
    color: "#47A248",
    popular: false,
    docs: "/docs/integrations/mongodb",
    features: ["CRUD 操作", "聚合管道", "搜索引管理"],
  },
  {
    id: "aws-s3",
    name: "AWS S3",
    description: "文件上传、下载、管理云存储",
    category: "storage",
    icon: "☁️",
    color: "#FF9900",
    popular: false,
    docs: "/docs/integrations/aws-s3",
    features: ["文件上传", "预签名 URL", "生命周期"],
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT 模型调用、文本生成、嵌入向量",
    category: "development",
    icon: "🤖",
    color: "#10A37F",
    popular: true,
    docs: "/docs/integrations/openai",
    features: ["Chat 完成", "函数调用", "向量嵌入"],
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "支付处理、订阅管理、发票生成",
    category: "productivity",
    icon: "💳",
    color: "#635BFF",
    popular: false,
    docs: "/docs/integrations/stripe",
    features: ["支付处理", "Webhook", "订阅管理"],
  },
  {
    id: "twilio",
    name: "Twilio",
    description: "发送短信、语音通话、WhatsApp 消息",
    category: "communication",
    icon: "📱",
    color: "#F22F46",
    popular: false,
    docs: "/docs/integrations/twilio",
    features: ["短信发送", "语音通话", "WhatsApp"],
  },
];

export default function IntegrationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // 过滤集成
  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch =
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const popularIntegrations = integrations.filter((i) => i.popular);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative pt-32 sm:pt-40 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[13px] text-foreground-lighter mb-8">
            <Link href="/docs" className="hover:text-foreground transition-colors">
              文档
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground">集成</span>
          </nav>

          <div className="text-center max-w-3xl mx-auto">
            <div className="lobe-badge mb-8">
              <Plug className="h-3.5 w-3.5" />
              <span>集成中心</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]">
              集成中心
            </h1>

            <p className="text-lg text-foreground-light mb-10 leading-relaxed">
              连接你喜爱的工具和服务，构建强大的自动化工作流
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-lighter" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索集成..."
                className="h-12 pl-12 rounded-full bg-surface-100/50 border-border/30 text-foreground placeholder:text-foreground-lighter"
              />
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 mt-10">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{integrations.length}+</div>
                <div className="text-[12px] text-foreground-lighter">集成服务</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">50k+</div>
                <div className="text-[12px] text-foreground-lighter">活跃连接</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">99.9%</div>
                <div className="text-[12px] text-foreground-lighter">可用率</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Popular Integrations */}
        <section className="mb-16">
          <h2 className="text-[15px] font-semibold text-foreground mb-6 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            热门集成
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularIntegrations.map((integration) => (
              <Link
                key={integration.id}
                href={integration.docs}
                className={cn(
                  "p-5 rounded-2xl group",
                  "bg-surface-100/30 border border-border/30",
                  "hover:bg-surface-100/60 hover:border-border/60",
                  "transition-all duration-300"
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-200/80 flex items-center justify-center text-xl">
                    {integration.icon}
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-foreground group-hover:text-brand-500 transition-colors">
                      {integration.name}
                    </h3>
                  </div>
                </div>
                <p className="text-[12px] text-foreground-lighter mb-3 leading-relaxed">
                  {integration.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {integration.features.slice(0, 2).map((feature) => (
                    <span
                      key={feature}
                      className="px-2 py-0.5 rounded text-[11px] bg-surface-200/80 text-foreground-lighter"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-200",
                selectedCategory === category.id
                  ? "bg-foreground text-background"
                  : "bg-surface-100/50 border border-border/30 text-foreground-lighter hover:text-foreground hover:border-border/60"
              )}
            >
              <category.icon className="w-4 h-4" />
              {category.name}
            </button>
          ))}
        </div>

        {/* All Integrations */}
        <section>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIntegrations.map((integration) => (
              <Link
                key={integration.id}
                href={integration.docs}
                className={cn(
                  "p-5 rounded-2xl group",
                  "bg-surface-100/30 border border-border/30",
                  "hover:bg-surface-100/60 hover:border-border/60",
                  "transition-all duration-300"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-200/80 flex items-center justify-center text-2xl shrink-0">
                    {integration.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[14px] font-semibold text-foreground group-hover:text-brand-500 transition-colors">
                        {integration.name}
                      </h3>
                      {integration.popular && (
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      )}
                    </div>
                    <p className="text-[12px] text-foreground-lighter mb-3 leading-relaxed">
                      {integration.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {integration.features.map((feature) => (
                        <span
                          key={feature}
                          className="px-2 py-0.5 rounded text-[11px] bg-surface-200/80 text-foreground-lighter"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filteredIntegrations.length === 0 && (
            <div className="text-center py-16">
              <p className="text-foreground-lighter">没有找到匹配的集成</p>
            </div>
          )}
        </section>

        {/* Custom Integration CTA */}
        <section className="mt-16">
          <div className={cn(
            "p-8 rounded-2xl",
            "bg-surface-100/30 border border-border/30"
          )}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center shrink-0">
                  <Webhook className="w-7 h-7 text-foreground-light" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-foreground mb-2">
                    没有找到需要的集成？
                  </h3>
                  <p className="text-[13px] text-foreground-lighter max-w-lg leading-relaxed">
                    使用自定义 Webhook 或 HTTP 请求节点连接任何支持 API 的服务，
                    或者告诉我们你需要什么集成
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/docs/integrations/custom">
                  <Button className="rounded-full text-[13px] font-medium bg-foreground text-background hover:bg-foreground/90">
                    <Code className="w-4 h-4 mr-2" />
                    创建自定义集成
                  </Button>
                </Link>
                <Link href="/community/feature-requests">
                  <Button variant="outline" className="rounded-full text-[13px] border-border/50 hover:bg-surface-200/50">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    请求新集成
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
