"use client";

/**
 * 关于我们页面 - LobeHub 风格
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Target,
  Sparkles,
  Globe,
  ArrowRight,
  Building,
  Heart,
  Rocket,
  MapPin,
  Linkedin,
  Twitter,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// 公司里程碑
const milestones = [
  { year: "2023", event: "AgentFlow 正式成立" },
  { year: "2023", event: "获得种子轮融资" },
  { year: "2024", event: "产品正式发布" },
  { year: "2024", event: "用户突破 10,000" },
  { year: "2025", event: "获得 A 轮融资" },
  { year: "2025", event: "用户突破 50,000" },
  { year: "2026", event: "AI Agent 2.0 发布" },
];

// 核心价值观
const values = [
  { icon: Target, title: "使命驱动", description: "我们致力于让每个人都能轻松使用 AI 自动化，释放创造力。" },
  { icon: Heart, title: "用户至上", description: "用户的成功是我们最大的成就，我们始终倾听用户声音。" },
  { icon: Sparkles, title: "追求卓越", description: "在产品、技术和服务上追求极致，不断超越用户期望。" },
  { icon: Globe, title: "开放协作", description: "拥抱开源精神，与社区共同成长，共创更好的产品。" },
];

// 团队成员
const team = [
  { name: "张明", role: "CEO & 联合创始人", bio: "连续创业者，前阿里云产品总监，10+ 年企业服务经验", social: { linkedin: "#", twitter: "#" } },
  { name: "李华", role: "CTO & 联合创始人", bio: "前字节跳动技术专家，AI/ML 领域专家，开源社区活跃贡献者", social: { linkedin: "#", twitter: "#" } },
  { name: "王芳", role: "CPO", bio: "前腾讯产品负责人，专注企业级产品设计，用户体验专家", social: { linkedin: "#" } },
  { name: "陈伟", role: "VP of Engineering", bio: "前美团技术总监，分布式系统专家，技术架构师", social: { linkedin: "#" } },
];

// 投资方
const investors = [
  { name: "红杉资本" },
  { name: "高瓴创投" },
  { name: "源码资本" },
  { name: "经纬创投" },
];

// 数据统计
const stats = [
  { value: "50K+", label: "活跃用户" },
  { value: "100+", label: "企业客户" },
  { value: "50+", label: "团队成员" },
  { value: "3", label: "全球办公室" },
];

export default function AboutPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative pt-32 sm:pt-40 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className={cn(
            "lobe-badge mb-8 transition-all duration-500",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <Building className="h-3.5 w-3.5" />
            <span>About Us</span>
          </div>

          <h1 className={cn(
            "text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]",
            "transition-all duration-700 delay-100",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            Making AI automation
            <br />
            <span className="gradient-text-brand">accessible to everyone</span>
          </h1>

          <p className={cn(
            "text-lg text-foreground-light max-w-2xl mx-auto leading-relaxed",
            "transition-all duration-700 delay-200",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            AgentFlow 成立于 2023 年，致力于让每个人都能轻松使用 AI 自动化技术，释放人类的创造力
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-6 rounded-2xl bg-surface-100/30 border border-border/30">
                <div className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-1">{stat.value}</div>
                <div className="text-[13px] text-foreground-lighter">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 sm:py-32 bg-gradient-section">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="lobe-badge mb-6">
                <Target className="w-3.5 h-3.5" />
                <span>Our Vision</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-6 leading-tight">
                Less structure,
                <br />
                more intelligence.
              </h2>
              <p className="text-foreground-light mb-4 leading-relaxed">
                我们相信，未来每个人都将拥有自己的 AI 助手，帮助处理日常工作中的重复性任务。
                AgentFlow 致力于打造最易用的 AI 工作流平台。
              </p>
              <p className="text-foreground-light leading-relaxed">
                通过可视化的工作流编辑器和智能 AI Agent，我们帮助用户快速构建自动化流程。
                无需编程知识，即可实现复杂的业务自动化。
              </p>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-full max-w-sm aspect-square bg-surface-100/30 rounded-3xl border border-border/30 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
                <Rocket className="w-20 h-20 text-foreground-muted" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="lobe-section-header">
            <h2>核心价值观</h2>
            <p>这些价值观指导我们的每一个决策</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {values.map((value) => (
              <div
                key={value.title}
                className={cn(
                  "p-6 rounded-2xl",
                  "bg-surface-100/30 border border-border/30",
                  "hover:bg-surface-100/60 hover:border-border/60",
                  "transition-all duration-300"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center mb-4">
                  <value.icon className="w-5 h-5 text-foreground-light" />
                </div>
                <h3 className="text-[14px] font-semibold text-foreground mb-2">{value.title}</h3>
                <p className="text-[12px] text-foreground-lighter leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 sm:py-32 bg-gradient-section">
        <div className="max-w-4xl mx-auto px-6">
          <div className="lobe-section-header">
            <h2>发展历程</h2>
            <p>Our journey</p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/30 -translate-x-1/2 hidden md:block" />
            <div className="space-y-6">
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className={cn(
                    "relative flex items-center gap-6",
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  )}
                >
                  <div className={cn("flex-1", index % 2 === 0 ? "md:text-right" : "md:text-left")}>
                    <div className="inline-block p-4 rounded-xl bg-surface-100/30 border border-border/30 hover:border-border/60 transition-colors">
                      <div className="text-[11px] text-brand-500 font-medium mb-1 uppercase tracking-widest">{milestone.year}</div>
                      <div className="text-foreground text-[14px] font-medium">{milestone.event}</div>
                    </div>
                  </div>
                  <div className="hidden md:flex w-3 h-3 rounded-full bg-foreground/60 shrink-0 z-10" />
                  <div className="flex-1 hidden md:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="lobe-section-header">
            <h2>核心团队</h2>
            <p>来自全球顶尖科技公司的优秀人才</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {team.map((member) => (
              <div
                key={member.name}
                className={cn(
                  "p-6 rounded-2xl text-center",
                  "bg-surface-100/30 border border-border/30",
                  "hover:bg-surface-100/60 hover:border-border/60",
                  "transition-all duration-300 group"
                )}
              >
                <div className="w-16 h-16 rounded-2xl bg-surface-200/50 border border-border/30 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-foreground-muted group-hover:text-foreground-lighter transition-colors" />
                </div>
                <h3 className="text-[14px] font-semibold text-foreground mb-0.5">{member.name}</h3>
                <div className="text-[12px] text-brand-500 mb-2">{member.role}</div>
                <p className="text-[11px] text-foreground-lighter mb-4 leading-relaxed">{member.bio}</p>
                <div className="flex items-center justify-center gap-2">
                  {member.social.linkedin && (
                    <a href={member.social.linkedin} className="w-7 h-7 rounded-lg bg-surface-200/50 flex items-center justify-center text-foreground-muted hover:text-foreground-light transition-all">
                      <Linkedin className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {member.social.twitter && (
                    <a href={member.social.twitter} className="w-7 h-7 rounded-lg bg-surface-200/50 flex items-center justify-center text-foreground-muted hover:text-foreground-light transition-all">
                      <Twitter className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investors */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[13px] text-foreground-muted uppercase tracking-widest font-medium mb-8">
            投资方
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {investors.map((investor) => (
              <div key={investor.name} className="px-6 py-3 rounded-full bg-surface-100/30 border border-border/30">
                <span className="text-foreground-lighter text-[14px] font-medium">{investor.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Offices */}
      <section className="py-24 sm:py-32">
        <div className="max-w-4xl mx-auto px-6">
          <div className="lobe-section-header">
            <h2>全球办公室</h2>
            <p>Our locations</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { city: "北京", address: "朝阳区望京 SOHO T1", type: "总部" },
              { city: "上海", address: "浦东新区陆家嘴", type: "分部" },
              { city: "深圳", address: "南山区科技园", type: "分部" },
            ].map((office) => (
              <div key={office.city} className="p-5 rounded-2xl bg-surface-100/30 border border-border/30 hover:border-border/60 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-surface-200/80 flex items-center justify-center">
                    <MapPin className="w-3.5 h-3.5 text-foreground-light" />
                  </div>
                  <span className="font-semibold text-foreground text-[14px]">{office.city}</span>
                  {office.type === "总部" && (
                    <span className="px-2 py-0.5 rounded-full bg-surface-200/80 text-foreground-lighter text-[10px] font-medium">HQ</span>
                  )}
                </div>
                <p className="text-[12px] text-foreground-lighter">{office.address}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <div className="max-w-2xl mx-auto px-6 text-center relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-foreground flex items-center justify-center mx-auto mb-6">
            <Zap className="w-5 h-5 text-background" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">Join our journey</h2>
          <p className="text-foreground-light mb-10">我们正在寻找优秀的人才，一起创造自动化的未来</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/careers">
              <Button className="h-12 px-8 bg-foreground hover:bg-foreground/90 text-background font-medium rounded-full">
                查看开放职位
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="h-12 px-8 rounded-full border-border/50 hover:bg-surface-200/50">
                联系我们
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
