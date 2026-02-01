"use client";

/**
 * Newsletter 订阅页面

 * 

 * Manus 风格设计
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

    description: "技术分享和最佳实?", icon: BookOpen,

    default: true,

  },

  {
    id: "tips",

    title: "使用技?", description: "提升效率的小技?", icon: Zap,

    default: false,

  },

];

// Newsletter 亮点

const highlights = [

  {
    icon: Calendar", title: "每周精?", description: "每周五发送，不会打扰你的工作?,

  },

  {
    icon: Star", title: "独家内容",

    description: "订阅者专属的深度文章和资源,

  },

  {
    icon: Gift", title: "专属优惠",

    description: "订阅者可获得产品折扣和早期体?,

  },

  {
    icon: Users", title: "社区精华",

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
    title: "2026 年工作流自动化趋?", date: "2026-01-18",

    readTime: "8 分钟",

    category: "行业洞察",

  },

  {
    title: "5 个让你效率翻倍的工作流模板", date: "2026-01-11",

    readTime: "6 分钟",

    category: "使用技?,

  },

  {
    title: "如何?AgentFlow 构建智能客服",

    date: "2026-01-04",

    readTime: "10 分钟",

    category: "实战教程",

  },

];

// 订阅者数?const stats = [

  { value: "50,000+", label: "订阅? },

  { value: "48%", label: "平均打开始 },

  { value: "200+", label: "期内? },

  { value: "4.9/5", label: "读者评? },

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

    // 模拟提交

    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);

    setIsSubmitted(true);

  };

  const toggleContentType = (id: string) => {
    if (id === "all") {
      // 如果选择"全部"，选中所有选项

      if (selectedTypes.includes("all")) {
        setSelectedTypes([]);

      } else {
        setSelectedTypes(contentTypes.map(t => t.id));

      }

    } else {
      // 切换单个选项

      if (selectedTypes.includes(id)) {
        setSelectedTypes(prev => prev.filter(t => t !== id && t !== "all"));

      } else {
        const newSelected = [...selectedTypes.filter(t => t !== "all"), id];

        // 如果所有非"全部"的选项都被选中，自动选中"全部"

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

        <div className="pt-32 pb-16 px-6">

          <div className="max-w-md mx-auto text-center">

            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 animate-bounce">

              <CheckCircle className="w-10 h-10 text-primary" />

            </div>

            <h1 className="text-2xl font-bold text-foreground mb-4">

              订阅成功！?            </h1>

            <p className="text-muted-foreground mb-4">

              感谢您的订阅！我们已?<span className="text-foreground font-medium">{email}</span> 发送了一封确认邮件?            </p>

            <p className="text-sm text-muted-foreground mb-8">

              请检查您的邮箱（包括垃圾邮件文件夹），点击确认链接完成订阅?            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">

              <Link href="/">

                <Button variant="outline" className="rounded-xl">

                  返回首页

                </Button>

              </Link>

              <Link href="/blog">

                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">

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

      {/* 背景效果 */}

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">

        <div 

          className="absolute top-[-10%] left-[30%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"

          style={{ background: 'radial-gradient(circle, rgba(62,207,142,0.4) 0%, transparent 70%)' }}

        />

      </div>

      <SiteHeader />

      {/* Hero Section */}

      <section className="pt-16 sm:pt-24 pb-12 px-6">

        <div className="max-w-4xl mx-auto text-center">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-8">

            <Mail className="h-4 w-4" />

            Newsletter

          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight mb-6">

            保持

            <span className="bg-gradient-to-r from-primary to-primary/90 bg-clip-text text-transparent">

              {" "}最新动效            </span>

          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">

            订阅我们?Newsletter，获取产品更新、技术文章、使用技巧和行业洞察

          </p>

          {/* Stats */}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto mb-12">

            {stats.map((stat) => (
              <div key={stat.label} className="text-center">

                <div className="text-2xl font-bold text-foreground">{stat.value}</div>

                <div className="text-sm text-muted-foreground">{stat.label}</div>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* 订阅表单 */}

      <section className="py-12 px-6">

        <div className="max-w-2xl mx-auto">

          <div className="p-8 rounded-2xl bg-card border border-border">

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* 邮箱输入 */}

              <div>

                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">

                  邮箱地址

                </label>

                <div className="flex gap-3">

                  <Input

                    id="email"

                    type="email"

                    value={email}

                    onChange={(e) => setEmail(e.target.value)}

                    required

                    className="flex-1 h-12 bg-background border-border rounded-xl"

                    placeholder="your@email.com"

                  />

                  <Button

                    type="submit"

                    disabled={isSubmitting || !email}

                    className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"

                  >

                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-[#171717]/30 border-t-[#171717] rounded-full animate-spin" />

                    ) : (
                      <>

                        订阅

                        <ArrowRight className="ml-2 w-4 h-4" />

                      </>

                    )}

                  </Button>

                </div>

              </div>

              {/* 内容类型选择 */}

              <div>

                <label className="block text-sm font-medium text-foreground mb-3">

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

                          ? "bg-primary/10 border-primary"

                          : "bg-background border-border hover:border-primary/50"

                      )}

                    >

                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",

                        selectedTypes.includes(type.id) ? "bg-primary/20" : "bg-muted"

                      )}>

                        <type.icon className={cn(
                          "w-5 h-5",

                          selectedTypes.includes(type.id) ? "text-primary" : "text-muted-foreground"

                        )} />

                      </div>

                      <div>

                        <h4 className="font-medium text-foreground">{type.title}</h4>

                        <p className="text-xs text-muted-foreground">{type.description}</p>

                      </div>

                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-auto",

                        selectedTypes.includes(type.id)

                          ? "border-primary bg-primary"

                          : "border-border"

                      )}>

                        {selectedTypes.includes(type.id) && (
                          <CheckCircle className="w-3 h-3 text-primary-foreground" />

                        )}

                      </div>

                    </button>

                  ))}

                </div>

              </div>

              {/* 隐私说明 */}

              <p className="text-xs text-muted-foreground text-center">

                订阅即表示您同意我们的{" "}

                <Link href="/privacy" className="text-primary hover:underline">

                  隐私政策

                </Link>

                。您可以随时取消订阅?              </p>

            </form>

          </div>

        </div>

      </section>

      {/* Highlights */}

      <section className="py-16 px-6 bg-muted/20">

        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-12">

            <h2 className="text-2xl font-bold text-foreground mb-4">

              订阅者专属福?            </h2>

            <p className="text-muted-foreground">

              成为订阅者，享受更多专属内容和福?            </p>

          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {highlights.map((item) => (
              <div

                key={item.title}

                className={cn(
                  "p-6 rounded-xl text-center",

                  "bg-card border border-border",

                  "hover:border-primary/30 hover:shadow-lg",

                  "transition-all duration-300"

                )}

              >

                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">

                  <item.icon className="w-6 h-6 text-primary" />

                </div>

                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>

                <p className="text-sm text-muted-foreground">{item.description}</p>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* 过往文章 */}

      <section className="py-16 px-6">

        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-12">

            <h2 className="text-2xl font-bold text-foreground mb-4">

              往期精?            </h2>

            <p className="text-muted-foreground">

              看看我们最近发布的一些内?            </p>

          </div>

          <div className="space-y-4">

            {pastIssues.map((issue, index) => (
              <div

                key={index}

                className={cn(
                  "flex items-center justify-between p-5 rounded-xl",

                  "bg-card border border-border",

                  "hover:border-primary/30 hover:shadow-md",

                  "transition-all duration-200 group cursor-pointer"

                )}

              >

                <div className="flex items-center gap-4">

                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">

                    <BookOpen className="w-5 h-5 text-primary" />

                  </div>

                  <div>

                    <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">

                      {issue.title}

                    </h4>

                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">

                      <span>{issue.date}</span>

                      <span>?/span>

                      <span>{issue.readTime}</span>

                      <span>?/span>

                      <span className="text-primary">{issue.category}</span>

                    </div>

                  </div>

                </div>

                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />

              </div>

            ))}

          </div>

          <div className="text-center mt-8">

            <Link href="/blog">

              <Button variant="outline" className="rounded-xl">

                查看更多文章

                <ArrowRight className="ml-2 w-4 h-4" />

              </Button>

            </Link>

          </div>

        </div>

      </section>

      {/* CTA */}

      <section className="py-16 px-6 bg-muted/20">

        <div className="max-w-4xl mx-auto">

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#2a6348] p-8 sm:p-12 text-center">

            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />

            <div className="relative z-10">

              <Mail className="w-12 h-12 text-white/80 mx-auto mb-4" />

              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">

                别错过任何更?              </h2>

              <p className="text-white/80 mb-8 max-w-lg mx-auto">

                加入 50,000+ 订阅者，每周获取最新的产品资讯和实用技?              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">

                <Input

                  type="email"

                  placeholder="your@email.com"

                  className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl"

                />

                <Button className="h-12 px-6 bg-white hover:bg-white/90 text-primary-foreground font-medium rounded-xl shrink-0">

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

