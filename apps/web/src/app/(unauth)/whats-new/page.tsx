"use client";

/**
 * 更新日志页面
 */

import Link from "next/link";
import {
  Sparkles,
  Zap,
  Bug,
  ArrowRight,
  Calendar,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { cn } from "@/lib/utils";

// 更新日志
const releases = [
  {
    version: "2.1.0",
    date: "2026-01-28",
    title: "AI Agent 2.0 发布",
    description: "全新的 AI 引擎，支持多个 Agent 协同工作",
    changes: [
      { type: "feature", text: "全新 AI Agent 2.0 引擎" },
      { type: "feature", text: "多 Agent 协作模式" },
      { type: "feature", text: "更智能的上下文理解" },
      { type: "improvement", text: "执行性能提升 30%" },
      { type: "fix", text: "修复工作流导出问题" },
    ],
  },
  {
    version: "2.0.5",
    date: "2026-01-15",
    title: "安全性更新",
    description: "重要的安全性改进和 Bug 修复",
    changes: [
      { type: "feature", text: "新增 MFA 多因素认证" },
      { type: "improvement", text: "API 密钥管理优化" },
      { type: "fix", text: "修复会话超时问题" },
      { type: "fix", text: "修复数据导出格式错误" },
    ],
  },
  {
    version: "2.0.4",
    date: "2026-01-08",
    title: "集成更新",
    description: "新增多个第三方服务集成",
    changes: [
      { type: "feature", text: "新增飞书集成" },
      { type: "feature", text: "新增钉钉集成" },
      { type: "feature", text: "新增 Notion 数据库同步" },
      { type: "improvement", text: "Slack 集成优化" },
    ],
  },
  {
    version: "2.0.3",
    date: "2026-01-01",
    title: "性能优化",
    description: "大幅提升工作流执行性能",
    changes: [
      { type: "improvement", text: "工作流执行速度提升 50%" },
      { type: "improvement", text: "编辑器加载速度优化" },
      { type: "fix", text: "修复并行节点执行问题" },
      { type: "fix", text: "修复定时触发器精度问题" },
    ],
  },
];

const typeConfig = {
  feature: { label: "新功能", color: "text-green-500", bg: "bg-green-500/10" },
  improvement: { label: "优化", color: "text-blue-500", bg: "bg-blue-500/10" },
  fix: { label: "修复", color: "text-orange-500", bg: "bg-orange-500/10" },
};

export default function WhatsNewPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            产品更新
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-6">
            更新日志
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            了解 AgentFlow 的最新功能、改进和修复
          </p>
        </div>
      </section>

      {/* Releases */}
      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-8">
            {releases.map((release) => (
              <div
                key={release.version}
                className="p-6 rounded-2xl bg-card border border-border"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-mono font-medium">
                    v{release.version}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {release.date}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {release.title}
                </h2>
                <p className="text-muted-foreground mb-4">
                  {release.description}
                </p>

                {/* Changes */}
                <div className="space-y-2">
                  {release.changes.map((change, index) => {
                    const config = typeConfig[change.type as keyof typeof typeConfig];
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <span className={cn("px-2 py-0.5 rounded text-xs font-medium", config.bg, config.color)}>
                          {config.label}
                        </span>
                        <span className="text-sm text-foreground">{change.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe */}
      <section className="py-16 px-6 bg-muted/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            订阅更新通知
          </h2>
          <p className="text-muted-foreground mb-6">
            第一时间获取产品更新信息
          </p>
          <Link href="/newsletter">
            <Button size="lg" className="rounded-full">
              订阅通讯
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
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
