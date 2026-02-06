"use client";

/**
 * Newsletter 订阅页面 - LobeHub 风格暗色设计
 */

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Bell,
  BookOpen,
  TrendingUp,
  Gift,
  Users,
  Calendar,
  Star,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// 订阅内容类型
const contentTypes = [
  {
    id: "all",
    title: "全部更新",
    description: "接收所有类型的更新",
    icon: Bell,
    default: true,
  },
  {
    id: "product",
    title: "产品更新",
    description: "新功能发布和改进",
    icon: Sparkles,
    default: true,
  },
  {
    id: "blog",
    title: "博客文章",
    description: "技术分享和最佳实践",
    icon: BookOpen,
    default: true,
  },
  {
    id: "tips",
    title: "使用技巧",
    description: "提升效率的小技巧",
    icon: Zap,
    default: false,
  },
];

// Newsletter 亮点
const highlights = [
  {
    icon: Calendar,
    title: "每周精选",
    description: "每周五发送，不会打扰你的工作节奏",
  },
  {
    icon: Star,
    title: "独家内容",
    description: "订阅者专属的深度文章和资源",
  },
  {
    icon: Gift,
    title: "专属优惠",
    description: "订阅者可获得产品折扣和早期体验资格",
  },
  {
    icon: Users,
    title: "社区精华",
    description: "汇集社区最佳实践和案例分享",
  },
];

// 过往文章示例
const pastIssues = [
  {
    title: "AI Agent 2.0 深度解析",
    date: "2026-01-25",
    readTime: "5 分钟",
    category: "产品更新",
  },
  {
    title: "2026 年工作流自动化趋势",
    date: "2026-01-18",
    readTime: "8 分钟",
    category: "行业洞察",
  },
  {
    title: "5 个让你效率翻倍的工作流模板",
    date: "2026-01-11",
    readTime: "6 分钟",
    category: "使用技巧",
  },
  {
    title: "如何用 AgentFlow 构建智能客服",
    date: "2026-01-04",
    readTime: "10 分钟",
    category: "实战教程",
  },
];

// 订阅者数据
const stats = [
  { value: "50,000+", label: "订阅者" },
  { value: "48%", label: "平均打开率" },
  { value: "200+", label: "期内文章" },
  { value: "4.9/5", label: "读者评分" },
];

export default function NewsletterPage() {
  const [email, setEmail] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    contentTypes.filter(t => t.default).map(t => t.id)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const toggleContentType = (id: string) => {
    if (id === "all") {
      if (selectedTypes.includes("all")) {
        setSelectedTypes([]);
      } else {
        setSelectedTypes(contentTypes.map(t => t.id));
      }
    } else {
      if (selectedTypes.includes(id)) {
        setSelectedTypes(prev => prev.filter(t => t !== id && t !== "all"));
      } else {
        const newSelected = [...selectedTypes.filter(t => t !== "all"), id];
        if (newSelected.length === contentTypes.length - 1) {
          newSelected.push("all");
        }
        setSelectedTypes(newSelected);
      }
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="pt-32 sm:pt-40 pb-16 px-6">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle className="w-10 h-10 text-brand" />
            </div>
            <h1 className="text-[20px] font-semibold text-foreground mb-4">
              订阅成功！
            </h1>
            <p className="text-[13px] text-foreground-light mb-4">
              感谢您的订阅！我们已向 <span className="text-foreground font-medium">{email}</span> 发送了一封确认邮件。
            </p>
            <p className="text-[12px] text-foreground-lighter mb-8">
              请检查您的邮箱（包括垃圾邮件文件夹），点击确认链接完成订阅。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button variant="outline" className="rounded-full border-border/30">
                  返回首页
                </Button>
              </Link>
              <Link href="/blog">
                <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90">
                  浏览博客
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-12 px-6 bg-gradient-hero">
        <div className="max-w-4xl mx-auto text-center">
          <div className="lobe-badge mb-8">
            <Mail className="h-4 w-4" />
            Newsletter
          </div>
          <h1 className="text-[32px] sm:text-[40px] lg:text-[48px] font-semibold text-foreground leading-tight tracking-tight mb-6">
            保持
            <span className="text-brand">
              {" "}最新动态
            </span>
          </h1>
          <p className="text-[15px] text-foreground-light max-w-2xl mx-auto mb-8">
            订阅我们的 Newsletter，获取产品更新、技术文章、使用技巧和行业洞察
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto mb-12">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-[22px] font-semibold text-foreground">{stat.value}</div>
                <div className="text-[12px] text-foreground-lighter">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription Form */}
      <section className="py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="p-8 rounded-2xl bg-surface-100/30 border border-border/30">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-[13px] font-medium text-foreground mb-2">
                  邮箱地址
                </label>
                <div className="flex gap-3">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 h-12 bg-background border-border/30 rounded-full text-foreground placeholder:text-foreground-lighter"
                    placeholder="your@email.com"
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting || !email}
                    className="h-12 px-6 rounded-full bg-foreground text-background font-semibold hover:bg-foreground/90"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                    ) : (
                      <>
                        订阅
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Content Type Selection */}
              <div>
                <label className="block text-[13px] font-medium text-foreground mb-3">
                  订阅内容（可多选）
                </label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {contentTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => toggleContentType(type.id)}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-xl border transition-all text-left",
                        selectedTypes.includes(type.id)
                          ? "bg-brand/10 border-brand/30"
                          : "bg-background border-border/30 hover:border-brand/20"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        selectedTypes.includes(type.id) ? "bg-brand/20" : "bg-surface-200/50"
                      )}>
                        <type.icon className={cn(
                          "w-5 h-5",
                          selectedTypes.includes(type.id) ? "text-brand" : "text-foreground-lighter"
                        )} />
                      </div>
                      <div>
                        <h4 className="text-[13px] font-medium text-foreground">{type.title}</h4>
                        <p className="text-[11px] text-foreground-lighter">{type.description}</p>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-auto",
                        selectedTypes.includes(type.id)
                          ? "border-brand bg-brand"
                          : "border-border/50"
                      )}>
                        {selectedTypes.includes(type.id) && (
                          <CheckCircle className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Privacy Note */}
              <p className="text-[11px] text-foreground-lighter text-center">
                订阅即表示您同意我们的{" "}
                <Link href="/privacy" className="text-brand hover:underline">
                  隐私政策
                </Link>
                。您可以随时取消订阅。
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16 px-6 bg-gradient-section">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[20px] font-semibold text-foreground mb-4">
              订阅者专属福利
            </h2>
            <p className="text-[13px] text-foreground-light">
              成为订阅者，享受更多专属内容和福利
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((item) => (
              <div
                key={item.title}
                className={cn(
                  "p-6 rounded-2xl text-center",
                  "bg-surface-100/30 border border-border/30",
                  "hover:border-brand/30",
                  "transition-all duration-300"
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-brand" />
                </div>
                <h3 className="text-[14px] font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-[12px] text-foreground-light">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Past Issues */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[20px] font-semibold text-foreground mb-4">
              往期精选
            </h2>
            <p className="text-[13px] text-foreground-light">
              看看我们最近发布的一些内容
            </p>
          </div>

          <div className="space-y-4">
            {pastIssues.map((issue, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center justify-between p-5 rounded-2xl",
                  "bg-surface-100/30 border border-border/30",
                  "hover:border-brand/30",
                  "transition-all duration-200 group cursor-pointer"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-medium text-foreground group-hover:text-brand transition-colors">
                      {issue.title}
                    </h4>
                    <div className="flex items-center gap-3 text-[12px] text-foreground-lighter mt-1">
                      <span>{issue.date}</span>
                      <span>·</span>
                      <span>{issue.readTime}</span>
                      <span>·</span>
                      <span className="text-brand">{issue.category}</span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-foreground-lighter group-hover:text-brand group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/blog">
              <Button variant="outline" className="rounded-full border-border/30">
                查看更多文章
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-gradient-section">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl bg-surface-100/30 border border-border/30 p-8 sm:p-12 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(78,143,255,0.08),transparent_50%)]" />
            <div className="relative z-10">
              <Mail className="w-12 h-12 text-brand/60 mx-auto mb-4" />
              <h2 className="text-[22px] sm:text-[26px] font-semibold text-foreground mb-4">
                别错过任何更新
              </h2>
              <p className="text-[13px] text-foreground-light mb-8 max-w-lg mx-auto">
                加入 50,000+ 订阅者，每周获取最新的产品资讯和实用技巧
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  className="h-12 bg-surface-100/50 border-border/30 text-foreground placeholder:text-foreground-lighter rounded-full"
                />
                <Button className="h-12 px-6 rounded-full bg-foreground text-background font-medium hover:bg-foreground/90 shrink-0">
                  立即订阅
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
