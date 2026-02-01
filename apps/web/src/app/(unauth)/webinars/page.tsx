"use client";

/**
 * 网络研讨会页面- 在线直播课程和回? * 

 * Manus 风格设计
 */

import { useState } from "react";
import Link from "next/link";
import {
  Video,

  Calendar,

  Clock,

  Users,

  Play,

  ArrowRight,

  Bell,

  CheckCircle,

  Star,

  Filter,

  Search,

  BookOpen,

  Zap,

  Shield,

  Code,

  Building2,

  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// 研讨会分支type WebinarCategory = "all" | "beginner" | "advanced" | "enterprise" | "developer";

const categories: { id: WebinarCategory; label: string; icon: typeof BookOpen }[] = [

  { id: "all", label: "全部", icon: Sparkles },

  { id: "beginner", label: "入门", icon: BookOpen },

  { id: "advanced", label: "进阶", icon: Zap },

  { id: "enterprise", label: "企业", icon: Building2 },

  { id: "developer", label: "开发?", icon: Code },

];

// 即将举行的研讨会

const upcomingWebinars = [

  {
    id: "w1",

    title: "AgentFlow 入门?0 分钟构建你的第一?AI 工作?", description: "从零开始学?AgentFlow，了解核心概念，动手创建一个实用的自动化工作流", date: "2026-02-05",

    time: "19:00",

    duration: "60 分钟",

    speaker: {
      name: "李明",

      title: "产品经理",

      avatar: "LM",

    },

    category: "beginner",

    registrations: 328,

    isFeatured: true,

  },

  {
    id: "w2",

    title: "高级技巧：构建复杂的多 Agent 协作系统",

    description: "深入学习?Agent 架构，掌?Agent 间通信、任务编排和错误处理的高级技巧?", date: "2026-02-12",

    time: "20:00",

    duration: "90 分钟",

    speaker: {
      name: "张工",

      title: "技术专?,

      avatar: "ZG",

    },

    category: "advanced",

    registrations: 186,

    isFeatured: true,

  },

  {
    id: "w3",

    title: "企业级部署：安全合规与最佳实?", description: "面向企业 IT 团队，详解私有化部署、SSO 集成、审计日志等企业级功能?", date: "2026-02-19",

    time: "14:00",

    duration: "75 分钟",

    speaker: {
      name: "王?", title: "解决方案架构?,

      avatar: "WZ",

    },

    category: "enterprise",

    registrations: 124,

    isFeatured: false,

  },

  {
    id: "w4",

    title: "API 深度解析：构建自定义集成",

    description: "详细讲解 AgentFlow API，学习如何构建自定义集成和扩展功能?", date: "2026-02-26",

    time: "19:30",

    duration: "90 分钟",

    speaker: {
      name: "陈工",

      title: "开发者布道师",

      avatar: "CG",

    },

    category: "developer",

    registrations: 98,

    isFeatured: false,

  },

];

// 往期研讨会回放

const pastWebinars = [

  {
    id: "pw1",

    title: "2025 年度回顾：AgentFlow 的一?", date: "2025-12-28",

    duration: "45 分钟",

    views: 2856,

    rating: 4.9,

    category: "beginner",

    thumbnail: "🎉",

  },

  {
    id: "pw2",

    title: "实战案例：电商客服自动化全流?", date: "2025-12-15",

    duration: "75 分钟",

    views: 1923,

    rating: 4.8,

    category: "advanced",

  },

  {
    id: "pw3",

    title: "?Zapier 迁移动AgentFlow",

    date: "2025-12-01",

    duration: "60 分钟",

    views: 1456,

    rating: 4.7,

    category: "beginner",

  },

  {
    id: "pw4",

    title: "企业安全白皮书解?", date: "2025-11-20",

    duration: "50 分钟",

    views: 876,

    rating: 4.9,

    category: "enterprise",

  },

  {
    id: "pw5",

    title: "SDK 新特性详情v2.0",

    date: "2025-11-08",

    duration: "80 分钟",

    views: 1234,

    rating: 4.6,

    category: "developer",

  },

  {
    id: "pw6",

    title: "AI Agent 设计模式",

    date: "2025-10-25",

    duration: "90 分钟",

    views: 2145,

    rating: 4.9,

    category: "advanced",

  },

];

// 演讲者数?const featuredSpeakers = [

  { name: "李明", title: "产品经理", talks: 12, avatar: "LM" },

  { name: "张工", title: "技术专?, talks: 8, avatar: "ZG" },

  { name: "王?", title: "解决方案架构?, talks: 6, avatar: "WZ" },

  { name: "陈工", title: "开发者布道师", talks: 10, avatar: "CG" },

];

export default function WebinarsPage() {
  const [selectedCategory, setSelectedCategory] = useState<WebinarCategory>("all");

  const [searchQuery, setSearchQuery] = useState("");

  const [email, setEmail] = useState("");

  const [subscribed, setSubscribed] = useState(false);

  const filteredUpcoming = upcomingWebinars.filter(
    (w) => selectedCategory === "all" || w.category === selectedCategory

  );

  const filteredPast = pastWebinars.filter(
    (w) => selectedCategory === "all" || w.category === selectedCategory

  );

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();

    if (email) {
      setSubscribed(true);

    }

  };

  return (
    <div className="min-h-screen bg-background">

      {/* 背景效果 */}

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">

        <div

          className="absolute top-[-10%] right-[20%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"

          style={{
            background: "radial-gradient(circle, rgba(62,207,142,0.4) 0%, transparent 70%)",

          }}

        />

      </div>

      <SiteHeader />

      {/* Hero Section */}

      <section className="pt-16 sm:pt-24 pb-12 px-6">

        <div className="max-w-6xl mx-auto text-center">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-8">

            <Video className="h-4 w-4" />

            网络研讨会          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight mb-6">

            在线学习

            <br />

            <span className="bg-gradient-to-r from-primary to-primary/90 bg-clip-text text-transparent">

              AgentFlow

            </span>

          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">

            参加免费的在线研讨会，向专家学习，掌?AI 工作流自动化的核心技?          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">

            <Link href="#upcoming">

              <Button className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl">

                查看即将举行

                <ArrowRight className="ml-2 w-4 h-4" />

              </Button>

            </Link>

            <Link href="#recordings">

              <Button variant="outline" className="h-12 px-8 rounded-xl">

                <Play className="mr-2 w-4 h-4" />

                观看回放

              </Button>

            </Link>

          </div>

        </div>

      </section>

      {/* Stats */}

      <section className="py-12 px-6 bg-muted/20">

        <div className="max-w-6xl mx-auto">

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="text-center p-6 rounded-xl bg-card border border-border">

              <div className="text-3xl font-bold text-foreground mb-1">100+</div>

              <div className="text-sm text-muted-foreground">研讨会场?/div>

            </div>

            <div className="text-center p-6 rounded-xl bg-card border border-border">

              <div className="text-3xl font-bold text-foreground mb-1">50,000+</div>

              <div className="text-sm text-muted-foreground">累计观看</div>

            </div>

            <div className="text-center p-6 rounded-xl bg-card border border-border">

              <div className="text-3xl font-bold text-foreground mb-1">4.8</div>

              <div className="text-sm text-muted-foreground">平均评分</div>

            </div>

            <div className="text-center p-6 rounded-xl bg-card border border-border">

              <div className="text-3xl font-bold text-foreground mb-1">20+</div>

              <div className="text-sm text-muted-foreground">专家讲师</div>

            </div>

          </div>

        </div>

      </section>

      {/* Category Filter */}

      <section className="py-8 px-6">

        <div className="max-w-6xl mx-auto">

          <div className="flex flex-wrap items-center justify-center gap-2">

            {categories.map((cat) => (
              <button

                key={cat.id}

                onClick={() => setSelectedCategory(cat.id)}

                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",

                  selectedCategory === cat.id

                    ? "bg-primary text-primary-foreground"

                    : "bg-card border border-border text-muted-foreground hover:text-foreground"

                )}

              >

                <cat.icon className="w-4 h-4" />

                {cat.label}

              </button>

            ))}

          </div>

        </div>

      </section>

      {/* Upcoming Webinars */}

      <section id="upcoming" className="py-16 px-6">

        <div className="max-w-6xl mx-auto">

          <div className="flex items-center gap-2 mb-8">

            <Calendar className="w-5 h-5 text-primary" />

            <h2 className="text-2xl font-bold text-foreground">即将举行</h2>

          </div>

          {filteredUpcoming.length > 0 ? (
            <div className="space-y-6">

              {filteredUpcoming.map((webinar) => (
                <div

                  key={webinar.id}

                  className={cn(
                    "p-6 rounded-xl",

                    "bg-card border",

                    webinar.isFeatured ? "border-primary/30" : "border-border",

                    "hover:shadow-lg transition-all"

                  )}

                >

                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">

                    {/* 日期 */}

                    <div className="lg:w-24 shrink-0">

                      <div className="w-20 h-20 lg:w-full lg:h-24 rounded-xl bg-primary/10 flex flex-col items-center justify-center">

                        <span className="text-3xl font-bold text-primary">

                          {new Date(webinar.date).getDate()}

                        </span>

                        <span className="text-sm text-primary">

                          {new Date(webinar.date).toLocaleDateString("zh-CN", { month: "short" })}

                        </span>

                      </div>

                    </div>

                    {/* 内容 */}

                    <div className="flex-1">

                      <div className="flex flex-wrap items-center gap-2 mb-2">

                        {webinar.isFeatured && (
                          <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">

                            精?                          </span>

                        )}

                        <span className="px-2 py-1 rounded-full bg-muted text-xs text-muted-foreground">

                          {categories.find(c => c.id === webinar.category)?.label}

                        </span>

                      </div>

                      <h3 className="text-xl font-semibold text-foreground mb-2">

                        {webinar.title}

                      </h3>

                      <p className="text-muted-foreground mb-4">

                        {webinar.description}

                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">

                        <span className="flex items-center gap-1">

                          <Clock className="w-4 h-4" />

                          {webinar.time} · {webinar.duration}

                        </span>

                        <span className="flex items-center gap-1">

                          <Users className="w-4 h-4" />

                          {webinar.registrations} 人已报名

                        </span>

                      </div>

                      {/* 演讲?*/}

                      <div className="flex items-center gap-3">

                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">

                          {webinar.speaker.avatar}

                        </div>

                        <div>

                          <p className="text-sm font-medium text-foreground">{webinar.speaker.name}</p>

                          <p className="text-xs text-muted-foreground">{webinar.speaker.title}</p>

                        </div>

                      </div>

                    </div>

                    {/* 按钮 */}

                    <div className="lg:w-40 shrink-0 flex flex-col gap-2">

                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">

                        立即报名

                      </Button>

                      <Button variant="outline" className="w-full rounded-xl">

                        <Bell className="w-4 h-4 mr-2" />

                        设置提醒

                      </Button>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          ) : (
            <div className="text-center py-12">

              <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />

              <p className="text-muted-foreground">该分类暂无即将举行的研讨会/p>

            </div>

          )}

        </div>

      </section>

      {/* Past Recordings */}

      <section id="recordings" className="py-16 px-6 bg-muted/20">

        <div className="max-w-6xl mx-auto">

          <div className="flex items-center justify-between mb-8">

            <div className="flex items-center gap-2">

              <Play className="w-5 h-5 text-primary" />

              <h2 className="text-2xl font-bold text-foreground">往期回?/h2>

            </div>

            <Button variant="outline" className="rounded-xl">

              查看全部

              <ArrowRight className="ml-2 w-4 h-4" />

            </Button>

          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {filteredPast.map((webinar) => (
              <Link key={webinar.id} href={`/webinars/${webinar.id}`}>

                <div

                  className={cn(
                    "p-5 rounded-xl h-full",

                    "bg-card border border-border",

                    "hover:border-primary/30 hover:shadow-lg",

                    "transition-all group"

                  )}

                >

                  {/* 缩略?*/}

                  <div className="h-32 rounded-lg bg-muted/50 flex items-center justify-center mb-4 relative overflow-hidden">

                    <div className="text-4xl">{webinar.thumbnail || "🎬"}</div>

                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">

                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">

                        <Play className="w-5 h-5 text-primary-foreground ml-1" />

                      </div>

                    </div>

                  </div>

                  <div className="flex items-center gap-2 mb-2">

                    <span className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">

                      {categories.find(c => c.id === webinar.category)?.label}

                    </span>

                    <span className="text-xs text-muted-foreground">{webinar.date}</span>

                  </div>

                  <h4 className="font-medium text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">

                    {webinar.title}

                  </h4>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">

                    <span className="flex items-center gap-1">

                      <Clock className="w-3 h-3" />

                      {webinar.duration}

                    </span>

                    <span className="flex items-center gap-1">

                      <Users className="w-3 h-3" />

                      {webinar.views.toLocaleString()} 次观?                    </span>

                    <span className="flex items-center gap-1">

                      <Star className="w-3 h-3 text-yellow-500" />

                      {webinar.rating}

                    </span>

                  </div>

                </div>

              </Link>

            ))}

          </div>

        </div>

      </section>

      {/* Featured Speakers */}

      <section className="py-16 px-6">

        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-12">

            <h2 className="text-2xl font-bold text-foreground mb-4">特邀讲师</h2>

            <p className="text-muted-foreground">向行业专家学?/p>

          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">

            {featuredSpeakers.map((speaker) => (
              <div

                key={speaker.name}

                className="text-center p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"

              >

                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-xl font-bold text-primary">

                  {speaker.avatar}

                </div>

                <h4 className="font-medium text-foreground">{speaker.name}</h4>

                <p className="text-sm text-muted-foreground mb-2">{speaker.title}</p>

                <p className="text-xs text-primary">{speaker.talks} 场研讨会</p>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* Subscribe */}

      <section className="py-16 px-6 bg-muted/20">

        <div className="max-w-4xl mx-auto">

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#2a6348] p-8 sm:p-12 text-center">

            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />

            <div className="relative z-10">

              {subscribed ? (
                <>

                  <CheckCircle className="w-12 h-12 text-white mx-auto mb-4" />

                  <h2 className="text-2xl font-bold text-white mb-4">订阅成功?/h2>

                  <p className="text-white/80">我们会在有新研讨会时通知您?/p>

                </>

              ) : (
                <>

                  <Bell className="w-12 h-12 text-white/80 mx-auto mb-4" />

                  <h2 className="text-2xl font-bold text-white mb-4">

                    不错过任何研讨会

                  </h2>

                  <p className="text-white/80 mb-8 max-w-md mx-auto">

                    订阅获取最新研讨会通知和独家学习资源                  </p>

                  <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">

                    <Input

                      type="email"

                      value={email}

                      onChange={(e) => setEmail(e.target.value)}

                      placeholder="your@email.com"

                      required

                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl"

                    />

                    <Button

                      type="submit"

                      className="h-12 px-6 bg-white hover:bg-white/90 text-primary-foreground font-medium rounded-xl shrink-0"

                    >

                      订阅

                    </Button>

                  </form>

                </>

              )}

            </div>

          </div>

        </div>

      </section>

      <SiteFooter />

    </div>

  );
}

