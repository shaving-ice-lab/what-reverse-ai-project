"use client";

/**
 * 客户评价页面 - LobeHub 风格设计
 */

import Link from "next/link";
import {
  Star,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// 客户评价
const testimonials = [
  {
    quote: "AgentFlow 帮助我们将客服响应时间从 30 分钟缩短到 2 分钟，客户满意度提升了 45%。",
    author: "张总监",
    role: "客服总监",
    company: "某大型电商平台",
    industry: "电商",
    avatar: "张",
    rating: 5,
  },
  {
    quote: "自动化的风控流程让我们能够实时响应市场变化，风险响应速度提升了 10 倍。",
    author: "李经理",
    role: "首席风险官",
    company: "某知名金融机构",
    industry: "金融",
    avatar: "李",
    rating: 5,
  },
  {
    quote: "通过 AgentFlow 打通了 ERP、MES 和 WMS 系统，供应链效率提升了 150%。",
    author: "王总",
    role: "供应链总监",
    company: "某制造企业",
    industry: "制造",
    avatar: "王",
    rating: 5,
  },
  {
    quote: "作为开发者，AgentFlow 的 API 设计非常优雅，集成体验一流。",
    author: "陈工",
    role: "全栈工程师",
    company: "某科技公司",
    industry: "科技",
    avatar: "陈",
    rating: 5,
  },
  {
    quote: "销售线索自动评分功能帮助我们的销售团队效率提升了 200%。",
    author: "赵总",
    role: "销售 VP",
    company: "某 SaaS 公司",
    industry: "SaaS",
    avatar: "赵",
    rating: 5,
  },
  {
    quote: "医院的预约和随访流程全部自动化后，患者满意度显著提升。",
    author: "周主任",
    role: "信息科主任",
    company: "某三甲医院",
    industry: "医疗",
    avatar: "周",
    rating: 5,
  },
];

// 统计数据
const stats = [
  { value: "98%", label: "客户满意度" },
  { value: "500+", label: "企业客户" },
  { value: "50K+", label: "活跃用户" },
  { value: "4.9", label: "平均评分" },
];

export default function TestimonialsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="pt-32 sm:pt-40 pb-16 px-6 bg-gradient-hero">
        <div className="max-w-4xl mx-auto text-center">
          <div className="lobe-badge mb-8">
            <Star className="h-4 w-4 fill-current" />
            客户好评如潮
          </div>

          <h1 className="text-[15px] sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-6">
            他们都在用 AgentFlow
          </h1>

          <p className="text-[13px] text-foreground-light max-w-2xl mx-auto">
            来自各行业领先企业的真实评价
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="text-center p-6 rounded-2xl bg-surface-100/30 border border-border/30"
              >
                <div className="text-3xl font-bold text-[#4e8fff] mb-1">{stat.value}</div>
                <div className="text-[12px] text-foreground-lighter">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 px-6 bg-gradient-section">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "p-6 rounded-2xl",
                  "bg-surface-100/30 border border-border/30",
                  "hover:border-[#4e8fff]/30 hover:shadow-lg",
                  "transition-all duration-300"
                )}
              >
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-yellow-500 fill-yellow-500"
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-[13px] text-foreground mb-6 leading-relaxed">
                  &ldquo;{item.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#4e8fff]/10 flex items-center justify-center text-[#4e8fff] font-medium">
                    {item.avatar}
                  </div>
                  <div>
                    <div className="font-medium text-foreground text-[13px]">{item.author}</div>
                    <div className="text-[11px] text-foreground-lighter">
                      {item.role} · {item.company}
                    </div>
                  </div>
                </div>

                {/* Industry Tag */}
                <div className="mt-4 pt-4 border-t border-border/30">
                  <span className="px-2 py-0.5 rounded-full bg-[#4e8fff]/10 text-[#4e8fff] text-[11px]">
                    {item.industry}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-[15px] sm:text-2xl font-bold text-foreground mb-4">加入他们的行列</h2>
          <p className="text-[13px] text-foreground-light mb-6">
            开始使用 AgentFlow，体验 AI 自动化的强大力量
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90">
                免费开始使用
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/case-studies">
              <Button size="lg" variant="outline" className="rounded-full border-border/50 text-foreground-light hover:text-foreground">
                查看案例详情
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
