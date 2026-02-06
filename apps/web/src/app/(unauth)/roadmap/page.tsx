"use client";

/**
 * 产品路线图页面 - LobeHub 风格设计
 */

import Link from "next/link";
import {
  Rocket,
  CheckCircle,
  Clock,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// 路线图数据
const roadmapItems = [
  {
    quarter: "Q1 2026",
    status: "completed",
    items: [
      { title: "AI Agent 2.0", description: "全新的 AI 引擎，支持多模型协作", done: true },
      { title: "可视化编辑器升级", description: "更流畅的拖拽体验", done: true },
      { title: "企业级 SSO", description: "支持 SAML 和 OIDC 认证", done: true },
    ],
  },
  {
    quarter: "Q2 2026",
    status: "in-progress",
    items: [
      { title: "移动端应用", description: "iOS 和 Android 原生应用", done: false },
      { title: "高级分析仪表板", description: "深入的使用数据分析", done: false },
      { title: "更多集成", description: "新增 50+ 第三方服务集成", done: false },
    ],
  },
  {
    quarter: "Q3 2026",
    status: "planned",
    items: [
      { title: "AI 工作流生成器", description: "自然语言描述自动生成工作流", done: false },
      { title: "团队协作增强", description: "实时协作编辑和评论", done: false },
      { title: "模板市场 2.0", description: "更丰富的模板分类和搜索", done: false },
    ],
  },
  {
    quarter: "Q4 2026",
    status: "exploring",
    items: [
      { title: "私有化部署增强", description: "更简单的部署流程", done: false },
      { title: "多语言支持", description: "支持更多语言的界面", done: false },
      { title: "高级自动化", description: "更复杂的条件和循环逻辑", done: false },
    ],
  },
];

const statusConfig = {
  completed: { label: "已完成", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  "in-progress": { label: "进行中", color: "text-[#4e8fff]", bg: "bg-[#4e8fff]/10" },
  planned: { label: "计划中", color: "text-blue-400", bg: "bg-blue-400/10" },
  exploring: { label: "探索中", color: "text-purple-400", bg: "bg-purple-400/10" },
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="pt-32 sm:pt-40 pb-16 px-6 bg-gradient-hero">
        <div className="max-w-4xl mx-auto text-center">
          <div className="lobe-badge mb-8">
            <Rocket className="h-4 w-4" />
            产品规划
          </div>

          <h1 className="text-[15px] sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-6">
            产品路线图
          </h1>

          <p className="text-[13px] text-foreground-light max-w-2xl mx-auto">
            了解我们正在构建的功能，以及未来的计划。您的反馈将帮助我们确定优先级。
          </p>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {roadmapItems.map((quarter) => {
              const config = statusConfig[quarter.status as keyof typeof statusConfig];
              return (
                <div key={quarter.quarter} className="relative">
                  {/* Quarter Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <h2 className="text-[15px] font-bold text-foreground">
                      {quarter.quarter}
                    </h2>
                    <span className={cn("px-3 py-1 rounded-full text-[11px] font-medium", config.bg, config.color)}>
                      {config.label}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="space-y-3 pl-4 border-l-2 border-border/30">
                    {quarter.items.map((item) => (
                      <div
                        key={item.title}
                        className={cn(
                          "p-4 rounded-2xl ml-4",
                          "bg-surface-100/30 border border-border/30",
                          item.done && "border-emerald-400/30"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {item.done ? (
                            <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                          ) : (
                            <Clock className="w-5 h-5 text-foreground-lighter mt-0.5 shrink-0" />
                          )}
                          <div>
                            <h3 className="font-medium text-foreground mb-1 text-[13px]">
                              {item.title}
                            </h3>
                            <p className="text-[12px] text-foreground-light">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feedback */}
      <section className="py-16 px-6 bg-gradient-section">
        <div className="max-w-4xl mx-auto text-center">
          <Lightbulb className="w-12 h-12 text-[#4e8fff] mx-auto mb-4" />
          <h2 className="text-[15px] sm:text-2xl font-bold text-foreground mb-4">有功能建议？</h2>
          <p className="text-[13px] text-foreground-light mb-6">
            我们非常重视您的反馈，帮助我们构建更好的产品
          </p>
          <Link href="/contact?type=feature-request">
            <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90">
              提交建议
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
