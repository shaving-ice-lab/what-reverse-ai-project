"use client";

/**
 * 活动页面 - 线上线下活动效Webinar

 * 

 * Manus 风格设计
 */

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,

  MapPin,

  Clock,

  Users,

  Video,

  ArrowRight,

  Calendar,

  Globe,

  Mic,

  Ticket,

  Play,

  CheckCircle,

  Bell,

  ExternalLink,

  Filter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// 活动类型

type EventType = "webinar" | "meetup" | "conference" | "workshop";

// 活动数据

const events = [

  {
    id: "1",

    title: "AgentFlow 2026 年产品发布会",

    type: "conference" as EventType,

    date: "2026-02-15",

    time: "14:00 - 17:00",

    location: "上海世博中心",

    isOnline: false,

    isUpcoming: true,

    attendees: 500,

    description: "年度重磅产品发布，揭?AgentFlow 3.0 全新功能和企业级解决方案例,

    speakers: [

      { name: "张明", role: "CEO" },

      { name: "李华", role: "CTO" },

    ],

    tags: ["产品发布", "企业?],

    registrationUrl: "#",

  },

  {
    id: "2",

    title: "AI Agent 开发实?Workshop",

    type: "workshop" as EventType,

    date: "2026-02-20",

    time: "19:00 - 21:00",

    location: "线上直播",

    isOnline: true,

    isUpcoming: true,

    attendees: 200,

    description: "从零开始构建智?Agent，手把手教你掌握 AgentFlow 核心开发技能?,

    speakers: [

      { name: "王工", role: "高级技术专? },

    ],

    tags: ["实战", "开发?],

    registrationUrl: "#",

  },

  {
    id: "3",

    title: "企业自动化转型线上研讨会",

    type: "webinar" as EventType,

    date: "2026-02-25",

    time: "10:00 - 11:30",

    location: "线上直播",

    isOnline: true,

    isUpcoming: true,

    attendees: 300,

    description: "探讨企业如何利用 AI 工作流实现业务流程自动化，分享成功案例?,

    speakers: [

      { name: "陈?, role: "企业解决方案总监" },

      { name: "?500 ?CIO", role: "嘉宾分享" },

    ],

    tags: ["企业", "案例分享"],

    registrationUrl: "#",

  },

  {
    id: "4",

    title: "北京开发?Meetup",

    type: "meetup" as EventType,

    date: "2026-03-01",

    time: "14:00 - 18:00",

    location: "北京朝阳区科技?,

    isOnline: false,

    isUpcoming: true,

    attendees: 80", description: "与北京地区的开发者面对面交流，分支AI 开发经验和最佳实践?,

    speakers: [

      { name: "社区开发?, role: "技术分支 },

    ],

    tags: ["社区", "技术交?],

    registrationUrl: "#",

  },

];

// 往期活?const pastEvents = [

  {
    id: "p1",

    title: "AgentFlow 101：快速入门指南", type: "webinar" as EventType,

    date: "2026-01-20",

    attendees: 856,

    hasRecording: true,

    recordingUrl: "#",

  },

  {
    id: "p2",

    title: "深圳开发?Meetup",

    type: "meetup" as EventType,

    date: "2026-01-15",

    attendees: 65,

    hasRecording: true,

    recordingUrl: "#",

  },

  {
    id: "p3",

    title: "2025 年度总结 & 2026 规划分享",

    type: "webinar" as EventType,

    date: "2025-12-28",

    attendees: 1200,

    hasRecording: true,

    recordingUrl: "#",

  },

];

// 活动类型配置

const eventTypeConfig: Record<EventType, { label: string; icon: typeof Video; color: string }> = {
  webinar: { label: "线上研讨会", icon: Video, color: "text-blue-500" },

  meetup: { label: "线下聚会", icon: Users, color: "text-green-500" },

  conference: { label: "大型会议", icon: Mic, color: "text-purple-500" },

  workshop: { label: "实战工坊", icon: Play, color: "text-orange-500" },
};

export default function EventsPage() {
  const [selectedType, setSelectedType] = useState<EventType | "all">("all");

  const [email, setEmail] = useState("");

  const [subscribed, setSubscribed] = useState(false);

  const filteredEvents = selectedType === "all"

    ? events

    : events.filter(e => e.type === selectedType);

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

            <CalendarDays className="h-4 w-4" />

            活动中心

          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight mb-6">

            加入我们?            <br />

            <span className="bg-gradient-to-r from-primary to-primary/90 bg-clip-text text-transparent">

              社区活动

            </span>

          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">

            线上线下活动、技术研讨会、开发?Meetup，与全球 AI 爱好者一起学习成?          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">

            <Link href="#upcoming-events">

              <Button className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl">

                查看即将举行的活?                <ArrowRight className="ml-2 w-4 h-4" />

              </Button>

            </Link>

            <Link href="#subscribe">

              <Button variant="outline" className="h-12 px-8 rounded-xl">

                <Bell className="mr-2 w-4 h-4" />

                订阅活动通知

              </Button>

            </Link>

          </div>

        </div>

      </section>

      {/* Event Stats */}

      <section className="py-12 px-6 bg-muted/20">

        <div className="max-w-6xl mx-auto">

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="text-center p-6 rounded-xl bg-card border border-border">

              <div className="text-3xl font-bold text-foreground mb-1">50+</div>

              <div className="text-sm text-muted-foreground">年度活动</div>

            </div>

            <div className="text-center p-6 rounded-xl bg-card border border-border">

              <div className="text-3xl font-bold text-foreground mb-1">10,000+</div>

              <div className="text-sm text-muted-foreground">参与?/div>

            </div>

            <div className="text-center p-6 rounded-xl bg-card border border-border">

              <div className="text-3xl font-bold text-foreground mb-1">20+</div>

              <div className="text-sm text-muted-foreground">城市</div>

            </div>

            <div className="text-center p-6 rounded-xl bg-card border border-border">

              <div className="text-3xl font-bold text-foreground mb-1">100+</div>

              <div className="text-sm text-muted-foreground">演讲嘉宾</div>

            </div>

          </div>

        </div>

      </section>

      {/* Upcoming Events */}

      <section id="upcoming-events" className="py-16 px-6">

        <div className="max-w-6xl mx-auto">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">

            <h2 className="text-2xl font-bold text-foreground">即将举行</h2>

            <div className="flex items-center gap-2">

              <Filter className="w-4 h-4 text-muted-foreground" />

              <div className="flex flex-wrap gap-2">

                {(["all", "webinar", "meetup", "conference", "workshop"] as const).map((type) => (
                  <button

                    key={type}

                    onClick={() => setSelectedType(type)}

                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",

                      selectedType === type

                        ? "bg-primary text-primary-foreground"

                        : "bg-muted text-muted-foreground hover:text-foreground"

                    )}

                  >

                    {type === "all" ? "全部" : eventTypeConfig[type].label}

                  </button>

                ))}

              </div>

            </div>

          </div>

          <div className="space-y-6">

            {filteredEvents.map((event) => {
              const typeConfig = eventTypeConfig[event.type];

              const TypeIcon = typeConfig.icon;

              return (
                <div

                  key={event.id}

                  className={cn(
                    "p-6 rounded-xl",

                    "bg-card border border-border",

                    "hover:border-primary/30 hover:shadow-lg",

                    "transition-all duration-300"

                  )}

                >

                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">

                    {/* 日期卡片 */}

                    <div className="lg:w-24 shrink-0">

                      <div className="w-20 h-20 lg:w-full lg:h-24 rounded-xl bg-primary/10 flex flex-col items-center justify-center">

                        <span className="text-3xl font-bold text-primary">

                          {new Date(event.date).getDate()}

                        </span>

                        <span className="text-sm text-primary">

                          {new Date(event.date).toLocaleDateString("zh-CN", { month: "short" })}

                        </span>

                      </div>

                    </div>

                    {/* 活动信息 */}

                    <div className="flex-1">

                      <div className="flex flex-wrap items-center gap-2 mb-2">

                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",

                          `${typeConfig.color.replace('text-', 'bg-')}/10`,

                          typeConfig.color

                        )}>

                          <TypeIcon className="w-3 h-3" />

                          {typeConfig.label}

                        </span>

                        {event.isOnline && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-xs text-muted-foreground">

                            <Globe className="w-3 h-3" />

                            线上

                          </span>

                        )}

                        {event.tags.map((tag) => (
                          <span

                            key={tag}

                            className="px-2 py-1 rounded-full bg-muted text-xs text-muted-foreground"

                          >

                            {tag}

                          </span>

                        ))}

                      </div>

                      <h3 className="text-xl font-semibold text-foreground mb-2">

                        {event.title}

                      </h3>

                      <p className="text-muted-foreground mb-4">

                        {event.description}

                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">

                        <span className="flex items-center gap-1">

                          <Clock className="w-4 h-4" />

                          {event.time}

                        </span>

                        <span className="flex items-center gap-1">

                          <MapPin className="w-4 h-4" />

                          {event.location}

                        </span>

                        <span className="flex items-center gap-1">

                          <Users className="w-4 h-4" />

                          {event.attendees} 人已报名

                        </span>

                      </div>

                      {/* 嘉宾 */}

                      <div className="flex items-center gap-3 mb-4">

                        <span className="text-sm text-muted-foreground">演讲嘉宾?/span>

                        <div className="flex items-center gap-2">

                          {event.speakers.map((speaker, i) => (
                            <span

                              key={i}

                              className="px-3 py-1 rounded-full bg-muted text-sm text-foreground"

                            >

                              {speaker.name} · {speaker.role}

                            </span>

                          ))}

                        </div>

                      </div>

                    </div>

                    {/* 操作按钮 */}

                    <div className="lg:w-40 shrink-0 flex flex-col gap-2">

                      <a href={event.registrationUrl}>

                        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">

                          <Ticket className="w-4 h-4 mr-2" />

                          立即报名

                        </Button>

                      </a>

                      <Button variant="outline" className="w-full rounded-xl">

                        <Calendar className="w-4 h-4 mr-2" />

                        添加到日志                      </Button>

                    </div>

                  </div>

                </div>

              );

            })}

          </div>

        </div>

      </section>

      {/* Past Events */}

      <section className="py-16 px-6 bg-muted/20">

        <div className="max-w-6xl mx-auto">

          <div className="flex items-center justify-between mb-8">

            <h2 className="text-2xl font-bold text-foreground">往期活动回?/h2>

            <Button variant="outline" className="rounded-xl">

              查看全部

              <ArrowRight className="ml-2 w-4 h-4" />

            </Button>

          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {pastEvents.map((event) => {
              const typeConfig = eventTypeConfig[event.type];

              return (
                <div

                  key={event.id}

                  className={cn(
                    "p-5 rounded-xl",

                    "bg-card border border-border",

                    "hover:border-primary/30",

                    "transition-all duration-300 group"

                  )}

                >

                  <div className="flex items-center gap-2 mb-3">

                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",

                      `${typeConfig.color.replace('text-', 'bg-')}/10`,

                      typeConfig.color

                    )}>

                      {typeConfig.label}

                    </span>

                    <span className="text-xs text-muted-foreground">{event.date}</span>

                  </div>

                  <h4 className="font-medium text-foreground mb-2 group-hover:text-primary transition-colors">

                    {event.title}

                  </h4>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">

                    <Users className="w-4 h-4" />

                    {event.attendees} 人参?                  </div>

                  {event.hasRecording && (
                    <a href={event.recordingUrl}>

                      <Button variant="outline" size="sm" className="w-full rounded-lg">

                        <Play className="w-4 h-4 mr-2" />

                        观看回放

                      </Button>

                    </a>

                  )}

                </div>

              );

            })}

          </div>

        </div>

      </section>

      {/* Subscribe */}

      <section id="subscribe" className="py-16 px-6">

        <div className="max-w-4xl mx-auto">

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#2a6348] p-8 sm:p-12 text-center">

            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />

            <div className="relative z-10">

              {subscribed ? (
                <>

                  <CheckCircle className="w-12 h-12 text-white mx-auto mb-4" />

                  <h2 className="text-2xl font-bold text-white mb-4">

                    订阅成功?                  </h2>

                  <p className="text-white/80 max-w-md mx-auto">

                    感谢订阅！我们会在有新活动时第一时间通知您?                  </p>

                </>

              ) : (
                <>

                  <Bell className="w-12 h-12 text-white/80 mx-auto mb-4" />

                  <h2 className="text-2xl font-bold text-white mb-4">

                    订阅活动通知

                  </h2>

                  <p className="text-white/80 mb-8 max-w-md mx-auto">

                    第一时间获取最新活动信息，不错过任何精彩内?                  </p>

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

      {/* Host Event CTA */}

      <section className="py-16 px-6 bg-muted/20">

        <div className="max-w-4xl mx-auto text-center">

          <h2 className="text-2xl font-bold text-foreground mb-4">

            想要举办 AgentFlow 活动效          </h2>

          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">

            如果您想在您的城市组?AgentFlow Meetup 或技术分享，我们将提供支?          </p>

          <Link href="/contact?type=event">

            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">

              联系我们

              <ExternalLink className="ml-2 w-4 h-4" />

            </Button>

          </Link>

        </div>

      </section>

      <SiteFooter />

    </div>

  );
}

