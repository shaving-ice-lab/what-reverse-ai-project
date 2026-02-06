"use client";

/**
 * 开发者页面 - LobeHub 风格
 */

import { useState } from "react";
import Link from "next/link";
import {
  Code,
  Book,
  Terminal,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  Copy,
  Check,
  Github,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// 快速开始代码
const quickStartCode = `import { AgentFlow } from '@agentflow/sdk';

// 初始化客户端
const client = new AgentFlow({
  apiKey: process.env.AGENTFLOW_API_KEY
});

// 执行工作流
const result = await client.workflows.run({
  workflowId: 'wf_123456',
  inputs: { message: 'Hello, World!' }
});

console.log(result);`;

// SDK 列表
const sdks = [
  { name: "JavaScript", icon: "🟨", status: "stable", version: "2.0.0" },
  { name: "Python", icon: "🐍", status: "stable", version: "2.0.0" },
  { name: "Go", icon: "🔵", status: "stable", version: "1.5.0" },
  { name: "Java", icon: "☕", status: "beta", version: "0.9.0" },
];

// API 端点
const apiEndpoints = [
  { method: "GET", path: "/v1/workflows", description: "获取工作流列表" },
  { method: "POST", path: "/v1/workflows", description: "创建工作流" },
  { method: "POST", path: "/v1/workflows/:id/run", description: "执行工作流" },
  { method: "GET", path: "/v1/executions/:id", description: "获取执行状态" },
];

// 资源
const resources = [
  {
    icon: Book,
    title: "API 文档",
    description: "完整的 RESTful API 参考文档",
    href: "/docs/api",
  },
  {
    icon: Terminal,
    title: "SDK 指南",
    description: "各语言 SDK 的使用指南",
    href: "/docs/sdk",
  },
  {
    icon: Code,
    title: "示例代码",
    description: "各种场景的代码示例",
    href: "/docs/examples",
  },
  {
    icon: Github,
    title: "GitHub",
    description: "开源项目和示例仓库",
    href: "https://github.com/agentflow",
  },
];

// 特性
const features = [
  {
    icon: Zap,
    title: "高性能",
    description: "毫秒级响应，支持高并发调用",
  },
  {
    icon: Shield,
    title: "安全可靠",
    description: "API Key 认证，数据加密传输",
  },
  {
    icon: Globe,
    title: "全面开放",
    description: "工作流、执行记录、分析数据全面开放",
  },
];

export default function DevelopersPage() {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(quickStartCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative pt-32 sm:pt-40 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10 px-6">
          <div className="lobe-badge mb-8">
            <Code className="h-3.5 w-3.5" />
            <span>开发者平台</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]">
            构建下一代
            <br />
            <span className="gradient-text-brand">自动化应用</span>
          </h1>

          <p className="text-lg text-foreground-light max-w-2xl mx-auto mb-10 leading-relaxed">
            强大的 API、丰富的 SDK、完善的文档，帮助您快速集成 AgentFlow
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/docs/api">
              <Button size="lg" className="rounded-full bg-foreground hover:bg-foreground/90 text-background h-12 px-8">
                查看 API 文档
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="https://github.com/agentflow" target="_blank">
              <Button size="lg" variant="outline" className="rounded-full border-border/50 hover:bg-surface-200/50 h-12 px-8">
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-24 sm:py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="lobe-section-header">
            <h2>快速开始</h2>
            <p>Get started in minutes</p>
          </div>
          <div className="rounded-2xl border border-border/30 overflow-hidden bg-surface-100/30">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-surface-200/30">
              <span className="text-[13px] text-foreground-lighter">JavaScript</span>
              <button
                onClick={copyCode}
                className="flex items-center gap-1 text-[13px] text-foreground-lighter hover:text-foreground transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    复制
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-[13px]">
              <code className="text-foreground-light">{quickStartCode}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* SDKs */}
      <section className="py-20 px-6 bg-gradient-section">
        <div className="max-w-4xl mx-auto">
          <div className="lobe-section-header">
            <h2>官方 SDK</h2>
            <p>Official SDKs for your favorite language</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {sdks.map((sdk) => (
              <div
                key={sdk.name}
                className={cn(
                  "p-5 rounded-2xl text-center",
                  "bg-surface-100/30 border border-border/30",
                  "hover:bg-surface-100/60 hover:border-border/60",
                  "transition-all duration-300"
                )}
              >
                <span className="text-3xl mb-3 block">{sdk.icon}</span>
                <h3 className="text-[14px] font-semibold text-foreground mb-1">{sdk.name}</h3>
                <p className="text-[11px] text-foreground-muted mb-2">v{sdk.version}</p>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[11px] font-medium",
                    sdk.status === "stable"
                      ? "bg-surface-200/80 text-foreground-lighter"
                      : "bg-yellow-500/10 text-yellow-500"
                  )}
                >
                  {sdk.status === "stable" ? "稳定版" : "Beta"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Reference */}
      <section className="py-24 sm:py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="lobe-section-header">
            <h2>API 端点预览</h2>
            <p>RESTful API reference</p>
          </div>
          <div className="rounded-2xl border border-border/30 overflow-hidden bg-surface-100/30">
            {apiEndpoints.map((endpoint, index) => (
              <div
                key={endpoint.path}
                className={cn(
                  "flex items-center gap-4 px-4 py-3",
                  index !== apiEndpoints.length - 1 && "border-b border-border/30"
                )}
              >
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-[11px] font-medium",
                    endpoint.method === "GET"
                      ? "bg-blue-500/10 text-blue-400"
                      : "bg-green-500/10 text-green-400"
                  )}
                >
                  {endpoint.method}
                </span>
                <code className="text-[13px] text-foreground">
                  {endpoint.path}
                </code>
                <span className="text-[13px] text-foreground-lighter ml-auto">
                  {endpoint.description}
                </span>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/docs/api">
              <Button variant="outline" className="rounded-full border-border/50 hover:bg-surface-200/50">
                查看完整 API 参考
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-gradient-section">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={cn(
                  "p-6 rounded-2xl text-center",
                  "bg-surface-100/30 border border-border/30",
                  "hover:bg-surface-100/60 hover:border-border/60",
                  "transition-all duration-300"
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-foreground-light" />
                </div>
                <h3 className="text-[14px] font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-[12px] text-foreground-lighter">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-24 sm:py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="lobe-section-header">
            <h2>开发资源</h2>
            <p>Developer resources</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {resources.map((resource) => (
              <Link
                key={resource.title}
                href={resource.href}
                target={resource.href.startsWith("http") ? "_blank" : undefined}
                className={cn(
                  "flex items-center gap-4 p-5 rounded-2xl",
                  "bg-surface-100/30 border border-border/30",
                  "hover:bg-surface-100/60 hover:border-border/60",
                  "transition-all duration-300 group"
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <resource.icon className="w-6 h-6 text-foreground-light" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-foreground group-hover:text-foreground transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-[12px] text-foreground-lighter">
                    {resource.description}
                  </p>
                </div>
                {resource.href.startsWith("http") && (
                  <ExternalLink className="w-4 h-4 text-foreground-muted ml-auto" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <div className="max-w-2xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">
            加入开发者社区
          </h2>
          <p className="text-foreground-light mb-10">
            与其他开发者交流，获取技术支持
          </p>
          <Link href="/community">
            <Button size="lg" className="rounded-full bg-foreground hover:bg-foreground/90 text-background h-12 px-8">
              加入社区
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
