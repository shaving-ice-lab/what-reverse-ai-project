"use client";

/**
 * 客户支持中心页面 - Manus 风格
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Clock,
  FileText,
  Inbox,
  LifeBuoy,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Shield,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/site-header";
import { cn } from "@/lib/utils";
import { ApiError, supportApi, type SupportSLA, type SupportTicket } from "@/lib/api";

const supportQuickLinks = [
  {
    icon: LifeBuoy,
    title: "帮助中心",
    description: "浏览帮助目录与热门文章",
    href: "/help",
  },
  {
    icon: FileText,
    title: "FAQ 常见问题",
    description: "快速定位高频问题答案",
    href: "/faq",
  },
  {
    icon: Wrench,
    title: "故障自助指南",
    description: "按步骤排查运行异常",
    href: "/help/troubleshooting",
  },
  {
    icon: MessageSquare,
    title: "联系支持",
    description: "更多沟通方式与支持渠道",
    href: "/contact",
  },
];

const supportCategories = [
  { id: "general", label: "一般咨询" },
  { id: "technical", label: "技术问题" },
  { id: "billing", label: "计费与配额" },
  { id: "account", label: "账号与权限" },
  { id: "security", label: "安全与合规" },
  { id: "bug", label: "Bug 报告" },
  { id: "feature", label: "功能建议" },
];

const supportPriorities = [
  { id: "critical", label: "紧急阻塞" },
  { id: "high", label: "高优先级" },
  { id: "normal", label: "一般问题" },
  { id: "low", label: "低优先级" },
];

const fallbackSLA: SupportSLA = {
  key: "customer_support_sla",
  title: "客户支持响应 SLA",
  targets: [
    {
      priority: "critical",
      first_response_minutes: 60,
      first_response_target: "1 小时内响应",
      update_cadence: "每 4 小时更新",
      update_cadence_minutes: 240,
      resolution_target: "24 小时内提供缓解方案",
      resolution_minutes: 1440,
      applies_to: ["生产阻塞", "安全事件", "大规模不可用"],
    },
    {
      priority: "high",
      first_response_minutes: 240,
      first_response_target: "4 小时内响应",
      update_cadence: "每日更新",
      update_cadence_minutes: 1440,
      resolution_target: "3 个工作日内给出处理计划",
      resolution_minutes: 4320,
      applies_to: ["关键功能异常", "支付/配额问题"],
    },
    {
      priority: "normal",
      first_response_minutes: 1440,
      first_response_target: "1 个工作日内响应",
      update_cadence: "每 3 个工作日更新",
      update_cadence_minutes: 4320,
      resolution_target: "7 个工作日内闭环或给出替代方案",
      resolution_minutes: 10080,
      applies_to: ["功能使用问题", "集成咨询"],
    },
    {
      priority: "low",
      first_response_minutes: 4320,
      first_response_target: "3 个工作日内响应",
      update_cadence: "按需更新",
      update_cadence_minutes: 0,
      resolution_target: "进入产品迭代排期",
      resolution_minutes: 0,
      applies_to: ["建议反馈", "体验优化"],
    },
  ],
  notes: [
    "响应 SLA 以首次响应为准，处理进度将按优先级更新。",
    "提供 workspace/app 信息与日志截图可加速排查。",
  ],
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    description: "",
    category: "general",
    priority: "normal",
    workspaceId: "",
    appId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [sla, setSla] = useState<SupportSLA | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [channels, setChannels] = useState<
    { key: string; name: string; description?: string; contact?: string }[]
  >([]);

  useEffect(() => {
    let active = true;
    supportApi
      .getSLA()
      .then((res) => {
        if (active) setSla(res.sla);
      })
      .catch(() => {
        if (active) setSla(null);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    supportApi
      .getChannels()
      .then((res) => {
        if (!active) return;
        setChannels(res.channels ?? []);
      })
      .catch(() => {
        if (!active) return;
        setChannels([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const activeSLA = useMemo(() => sla ?? fallbackSLA, [sla]);

  const channelIconMap: Record<string, typeof LifeBuoy> = {
    email: Mail,
    mail: Mail,
    chat: MessageSquare,
    live_chat: MessageSquare,
    phone: Phone,
    hotline: Phone,
    default: LifeBuoy,
  };

  const channelCards = useMemo(() => {
    if (channels.length === 0) {
      return [
        {
          key: "email",
          name: "邮件支持",
          description: "support@agentflow.ai",
          contact: "support@agentflow.ai",
        },
        {
          key: "chat",
          name: "在线客服",
          description: "工作时间 9:00-18:00",
          contact: "在线聊天",
        },
        {
          key: "phone",
          name: "电话咨询",
          description: "400-888-8888",
          contact: "400-888-8888",
        },
      ];
    }
    return channels.map((channel) => ({
      key: channel.key,
      name: channel.name,
      description: channel.description || channel.contact || "支持渠道",
      contact: channel.contact,
    }));
  }, [channels]);

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      subject: "",
      description: "",
      category: "general",
      priority: "normal",
      workspaceId: "",
      appId: "",
    });
    setCaptchaToken("");
    setCaptchaRequired(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setCaptchaRequired(false);

    try {
      const locale =
        typeof window !== "undefined"
          ? Intl.DateTimeFormat().resolvedOptions().locale || navigator.language
          : "zh-CN";
      const payload = {
        requester_name: formData.name || undefined,
        requester_email: formData.email,
        subject: formData.subject,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        channel: "web",
        workspace_id: formData.workspaceId || undefined,
        app_id: formData.appId || undefined,
        metadata: { locale },
        captcha_token: captchaToken || undefined,
      };
      const response = await supportApi.createTicket(payload);
      setTicket(response.ticket);
      setSla(response.sla ?? sla);
      resetForm();
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
        if (
          error.code === "CAPTCHA_REQUIRED" ||
          error.code === "CAPTCHA_INVALID" ||
          error.code === "SUPPORT_TICKET_RATE_LIMITED"
        ) {
          setCaptchaRequired(true);
        }
      } else {
        setSubmitError("提交失败，请稍后重试");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 to-transparent" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs mb-4">
            <LifeBuoy className="w-4 h-4" />
            客户成功与支持中心
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-5">
            让问题更快闭环
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            从自助排查到工单跟进，我们为每一位用户提供清晰、可追踪的支持路径。
          </p>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {supportQuickLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className={cn(
                  "p-5 rounded-2xl",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-lg",
                  "transition-all duration-300 group"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <link.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {link.title}
                </h3>
                <p className="text-sm text-muted-foreground">{link.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Channels */}
      <section className="py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <LifeBuoy className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">支持渠道</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {channelCards.map((channel) => {
              const Icon = channelIconMap[channel.key] || channelIconMap.default;
              return (
                <div
                  key={channel.key}
                  className={cn(
                    "p-5 rounded-2xl",
                    "bg-card border border-border",
                    "hover:border-primary/30 hover:shadow-lg",
                    "transition-all duration-300"
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{channel.name}</h3>
                  <p className="text-sm text-muted-foreground">{channel.description}</p>
                  {channel.contact && (
                    <p className="text-xs text-muted-foreground mt-2">{channel.contact}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Ticket & SLA */}
      <section className="py-12 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[minmax(0,1fr)_360px] gap-8">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">提交工单</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  填写关键信息，系统将自动分级并计算响应 SLA。
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                <BadgeCheck className="w-4 h-4 text-primary" />
                已支持 SLA 跟踪
              </div>
            </div>

            {ticket ? (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">工单已提交</h3>
                    <p className="text-sm text-muted-foreground">
                      参考编号：<span className="text-foreground font-medium">{ticket.reference}</span>
                    </p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="text-xs text-muted-foreground mb-1">预计响应截止</div>
                    <div className="text-foreground font-medium">
                      {formatDateTime(ticket.sla_response_due_at)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="text-xs text-muted-foreground mb-1">当前状态</div>
                    <div className="text-foreground font-medium">{ticket.status}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setTicket(null)}
                    className="rounded-full"
                  >
                    提交新工单
                  </Button>
                  <Link href="/help">
                    <Button className="rounded-full">继续自助排查</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      联系人姓名
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="您的姓名（选填）"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      联系邮箱 *
                    </label>
                    <Input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      问题分类
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground"
                    >
                      {supportCategories.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      优先级
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground"
                    >
                      {supportPriorities.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Workspace ID（可选）
                    </label>
                    <Input
                      value={formData.workspaceId}
                      onChange={(e) => setFormData({ ...formData, workspaceId: e.target.value })}
                      placeholder="用于快速定位环境"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      App ID（可选）
                    </label>
                    <Input
                      value={formData.appId}
                      onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
                      placeholder="如涉及具体应用"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    问题标题 *
                  </label>
                  <Input
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="请简要描述遇到的问题"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    详细描述 *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={6}
                    placeholder="包括复现步骤、错误提示、期望结果等"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground resize-none"
                  />
                </div>

                {captchaRequired && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      验证码 Token
                    </label>
                    <Input
                      value={captchaToken}
                      onChange={(e) => setCaptchaToken(e.target.value)}
                      placeholder="如启用验证码，请粘贴 token"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      若提示频繁请求，请完成验证码并重新提交。
                    </p>
                  </div>
                )}

                {submitError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {submitError}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    我们会对敏感信息进行脱敏处理
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="rounded-full">
                    {isSubmitting ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        提交中...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        提交工单
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Inbox className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">响应 SLA</h3>
              </div>
              <div className="space-y-4">
                {activeSLA.targets.map((target) => (
                  <div key={target.priority} className="rounded-xl border border-border bg-background p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">
                        {supportPriorities.find((item) => item.id === target.priority)?.label || target.priority}
                      </span>
                      <span className="text-muted-foreground">{target.first_response_target}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      更新频率：{target.update_cadence}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      目标：{target.resolution_target}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3 text-xs">
                      {target.applies_to.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 rounded-full bg-muted text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {activeSLA.notes?.length ? (
                <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                  {activeSLA.notes.map((note) => (
                    <div key={note} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-primary mt-0.5" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">处理流程</h3>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>1. 自动分级并创建工单编号</li>
                <li>2. 支持团队首次响应并同步 SLA 时间</li>
                <li>3. 按优先级更新处理进展</li>
                <li>4. 结果回执与闭环确认</li>
              </ul>
            </div>
          </div>
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
