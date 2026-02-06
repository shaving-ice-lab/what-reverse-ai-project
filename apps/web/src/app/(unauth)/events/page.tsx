"use client";

/**
 * 活动页面 - LobeHub 风格设计
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
    description: "年度重磅产品发布，解读 AgentFlow 3.0 全新功能与企业级解决方案。",
    speakers: [
      { name: "张明", role: "CEO" },
      { name: "李华", role: "CTO" },
    ],
    tags: ["产品发布", "企业"],
    registrationUrl: "#",
  },
  {
    id: "2",
    title: "AI Agent 开发实战 Workshop",
    type: "workshop" as EventType,
    date: "2026-02-20",
    time: "19:00 - 21:00",
    location: "线上直播",
    isOnline: true,
    isUpcoming: true,
    attendees: 200,
    description: "从零开始构建智能 Agent，手把手掌握 AgentFlow 核心开发技能。",
    speakers: [{ name: "王工", role: "高级技术专家" }],
    tags: ["实战", "开发"],
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
    description: "探讨企业如何利用 AI 工作流实现流程自动化，并分享落地案例。",
    speakers: [
      { name: "陈晨", role: "企业解决方案总监" },
      { name: "某 500 强 CIO", role: "嘉宾分享" },
    ],
    tags: ["企业", "案例分享"],
    registrationUrl: "#",
  },
  {
    id: "4",
    title: "北京开发者 Meetup",
    type: "meetup" as EventType,
    date: "2026-03-01",
    time: "14:00 - 18:00",
    location: "北京 · 朝阳区",
    isOnline: false,
    isUpcoming: true,
    attendees: 80,
    description: "与北京地区开发者线下交流，分享 AI 开发经验与最佳实践。",
    speakers: [{ name: "社区开发者", role: "技术分享" }],
    tags: ["社区", "技术交流"],
    registrationUrl: "#",
  },
];

// 往期活动
const pastEvents = [
  {
    id: "p1",
    title: "AgentFlow 101：快速入门指南",
    type: "webinar" as EventType,
    date: "2026-01-20",
    attendees: 856,
    hasRecording: true,
    recordingUrl: "#",
  },
  {
    id: "p2",
    title: "深圳开发者 Meetup",
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
  webinar: { label: "线上研讨会", icon: Video, color: "text-[#4e8fff]" },
  meetup: { label: "线下聚会", icon: Users, color: "text-emerald-400" },
  conference: { label: "大型会议", icon: Mic, color: "text-purple-400" },
  workshop: { label: "实战工坊", icon: Play, color: "text-orange-400" },
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
      <SiteHeader />

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-16 px-6 bg-gradient-hero">
        <div className="max-w-6xl mx-auto text-center">
          <div className="lobe-badge mb-8">
            <CalendarDays className="h-4 w-4" />
            活动中心
          </div>

          <h1 className="text-[15px] sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight tracking-tight mb-6">
            加入我们的
            <br />
            <span className="text-[#4e8fff]">社区活动</span>
          </h1>

          <p className="text-[13px] text-foreground-light max-w-2xl mx-auto mb-8">
            线上线下活动、技术研讨会、开发者 Meetup，与全球 AI 爱好者一起学习成长
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="#upcoming-events">
              <Button className="h-12 px-8 rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold">
                查看即将举行的活动
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="#subscribe">
              <Button variant="outline" className="h-12 px-8 rounded-full border-border/50 text-foreground-light hover:text-foreground">
                <Bell className="mr-2 w-4 h-4" />
                订阅活动通知
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Event Stats */}
      <section className="py-12 px-6 bg-gradient-section">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: "50+", label: "年度活动" },
              { value: "10,000+", label: "参与人数" },
              { value: "20+", label: "城市" },
              { value: "100+", label: "演讲嘉宾" },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-6 rounded-2xl bg-surface-100/30 border border-border/30">
                <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-[12px] text-foreground-lighter">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section id="upcoming-events" className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h2 className="lobe-section-header">即将举行</h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-foreground-lighter" />
              <div className="flex flex-wrap gap-2">
                {(["all", "webinar", "meetup", "conference", "workshop"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors",
                      selectedType === type
                        ? "bg-foreground text-background"
                        : "bg-surface-100/30 text-foreground-lighter hover:text-foreground"
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
                    "p-6 rounded-2xl",
                    "bg-surface-100/30 border border-border/30",
                    "hover:border-[#4e8fff]/30 hover:shadow-lg",
                    "transition-all duration-300"
                  )}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* 日期卡片 */}
                    <div className="lg:w-24 shrink-0">
                      <div className="w-20 h-20 lg:w-full lg:h-24 rounded-2xl bg-[#4e8fff]/10 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-[#4e8fff]">
                          {new Date(event.date).getDate()}
                        </span>
                        <span className="text-[12px] text-[#4e8fff]">
                          {new Date(event.date).toLocaleDateString("zh-CN", { month: "short" })}
                        </span>
                      </div>
                    </div>

                    {/* 活动信息 */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium",
                          "bg-surface-100/50",
                          typeConfig.color
                        )}>
                          <TypeIcon className="w-3 h-3" />
                          {typeConfig.label}
                        </span>
                        {event.isOnline && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-surface-100/50 text-[11px] text-foreground-lighter">
                            <Globe className="w-3 h-3" />
                            线上
                          </span>
                        )}
                        {event.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 rounded-full bg-surface-100/50 text-[11px] text-foreground-lighter"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <h3 className="text-[15px] font-semibold text-foreground mb-2">
                        {event.title}
                      </h3>

                      <p className="text-[13px] text-foreground-light mb-4">
                        {event.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-[12px] text-foreground-lighter mb-4">
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
                        <span className="text-[12px] text-foreground-lighter">演讲嘉宾</span>
                        <div className="flex items-center gap-2">
                          {event.speakers.map((speaker, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 rounded-full bg-surface-100/50 text-[12px] text-foreground"
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
                        <Button className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90">
                          <Ticket className="w-4 h-4 mr-2" />
                          立即报名
                        </Button>
                      </a>
                      <Button variant="outline" className="w-full rounded-full border-border/50 text-foreground-light">
                        <Calendar className="w-4 h-4 mr-2" />
                        添加到日历
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Past Events */}
      <section className="py-16 px-6 bg-gradient-section">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="lobe-section-header">往期活动回放</h2>
            <Button variant="outline" className="rounded-full border-border/50 text-foreground-light">
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
                    "p-5 rounded-2xl",
                    "bg-surface-100/30 border border-border/30",
                    "hover:border-[#4e8fff]/30",
                    "transition-all duration-300 group"
                  )}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[11px] font-medium",
                      "bg-surface-100/50",
                      typeConfig.color
                    )}>
                      {typeConfig.label}
                    </span>
                    <span className="text-[11px] text-foreground-lighter">{event.date}</span>
                  </div>

                  <h4 className="font-medium text-foreground mb-2 group-hover:text-[#4e8fff] transition-colors">
                    {event.title}
                  </h4>

                  <div className="flex items-center gap-2 text-[12px] text-foreground-lighter mb-4">
                    <Users className="w-4 h-4" />
                    {event.attendees} 人参与
                  </div>

                  {event.hasRecording && (
                    <a href={event.recordingUrl}>
                      <Button variant="outline" size="sm" className="w-full rounded-full border-border/50 text-foreground-light">
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
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#4e8fff] to-[#2563eb] p-8 sm:p-12 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="relative z-10">
              {subscribed ? (
                <>
                  <CheckCircle className="w-12 h-12 text-white mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-4">
                    订阅成功！
                  </h2>
                  <p className="text-white/80 max-w-md mx-auto">
                    感谢订阅！我们会在有新活动时第一时间通知您。
                  </p>
                </>
              ) : (
                <>
                  <Bell className="w-12 h-12 text-white/80 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-4">
                    订阅活动通知
                  </h2>
                  <p className="text-white/80 mb-8 max-w-md mx-auto">
                    第一时间获取最新活动信息，不错过任何精彩内容
                  </p>
                  <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-full"
                    />
                    <Button
                      type="submit"
                      className="h-12 px-6 bg-white hover:bg-white/90 text-[#4e8fff] font-medium rounded-full shrink-0"
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
      <section className="py-16 px-6 bg-gradient-section">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-[15px] sm:text-2xl font-bold text-foreground mb-4">
            想要举办 AgentFlow 活动？
          </h2>
          <p className="text-[13px] text-foreground-light mb-8 max-w-lg mx-auto">
            如果您想在您的城市组织 AgentFlow Meetup 或技术分享，我们将提供支持
          </p>
          <Link href="/contact?type=event">
            <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90">
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
