"use client";

/**
 * CustomerSupportcenterPage - LobeHub Style
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
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";
import { ApiError, supportApi, type SupportSLA, type SupportTicket } from "@/lib/api";

const supportQuickLinks = [
 {
 icon: LifeBuoy,
 title: "Help Center",
 description: "BrowseHelpDirectoryandPopularArticle",
 href: "/help",
 },
 {
 icon: FileText,
 title: "FAQ FAQ",
 description: "QuickIssueAnswer",
 href: "/faq",
 },
 {
 icon: Wrench,
 title: "FaultGuide",
 description: "byStepRunException",
 href: "/help/troubleshooting",
 },
 {
 icon: MessageSquare,
 title: "ContactSupport",
 description: "moremultiplemethodandSupportChannel",
 href: "/contact",
 },
];

const supportCategories = [
 { id: "general", label: "1Consulting" },
 { id: "technical", label: "TechnologyIssue" },
 { id: "billing", label: "BillingandQuota" },
 { id: "account", label: "AccountandPermission" },
 { id: "security", label: "SecurityandCompliance" },
 { id: "bug", label: "Bug Report" },
 { id: "feature", label: "FeaturesSuggestion" },
];

const supportPriorities = [
 { id: "critical", label: "UrgentBlock" },
 { id: "high", label: "Priority" },
 { id: "normal", label: "1Issue" },
 { id: "low", label: "Priority" },
];

const fallbackSLA: SupportSLA = {
 key: "customer_support_sla",
 title: "CustomerSupportResponse SLA",
 targets: [
 {
 priority: "critical",
 first_response_minutes: 60,
 first_response_target: "1 hinResponse",
 update_cadence: "each 4 hUpdate",
 update_cadence_minutes: 240,
 resolution_target: "24 hinProvidePlan",
 resolution_minutes: 1440,
 applies_to: ["ProductionBlock", "SecurityEvent", "largeScaleUnavailable"],
 },
 {
 priority: "high",
 first_response_minutes: 240,
 first_response_target: "4 hinResponse",
 update_cadence: "eachdayUpdate",
 update_cadence_minutes: 1440,
 resolution_target: "3 Business DayintoProcessPlan",
 resolution_minutes: 4320,
 applies_to: ["keyFeaturesException", "Payment/QuotaIssue"],
 },
 {
 priority: "normal",
 first_response_minutes: 1440,
 first_response_target: "1 Business DayinResponse",
 update_cadence: "each 3 Business DayUpdate",
 update_cadence_minutes: 4320,
 resolution_target: "7 Business DayinClosed LooportoAlternativePlan",
 resolution_minutes: 10080,
 applies_to: ["FeaturesUsageIssue", "IntegrationConsulting"],
 },
 {
 priority: "low",
 first_response_minutes: 4320,
 first_response_target: "3 Business DayinResponse",
 update_cadence: "byneedUpdate",
 update_cadence_minutes: 0,
 resolution_target: "EnterProductIteration",
 resolution_minutes: 0,
 applies_to: ["SuggestionFeedback", "Experienceoptimal"],
 },
 ],
 notes: [
 "Response SLA withtimesResponseas, ProcessProgresswillbyPriorityUpdate.",
 "Provide workspace/app InfoandLogsScreenshotcan.",
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
 name: "EmailSupport",
 description: "support@agentflow.ai",
 contact: "support@agentflow.ai",
 },
 {
 key: "chat",
 name: "OnlineSupport",
 description: "WorkTime 9:00-18:00",
 contact: "OnlineChat",
 },
 {
 key: "phone",
 name: "PhoneConsulting",
 description: "400-888-8888",
 contact: "400-888-8888",
 },
 ];
 }
 return channels.map((channel) => ({
 key: channel.key,
 name: channel.name,
 description: channel.description || channel.contact || "SupportChannel",
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
 setSubmitError("SubmitFailed, Please try again laterRetry");
 }
 } finally {
 setIsSubmitting(false);
 }
 };

 return (
 <div className="min-h-screen bg-background">
 <SiteHeader />

 {/* Hero */}
 <section className="relative pt-32 sm:pt-40 pb-20 overflow-hidden">
 <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
 <div className="max-w-5xl mx-auto text-center relative z-10 px-6">
 <div className="lobe-badge mb-8">
 <LifeBuoy className="h-3.5 w-3.5" />
 <span>CustomerSuccessandSupportcenter</span>
 </div>
 <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]">
 letIssuemoreClosed Loop
 </h1>
 <p className="text-lg text-foreground-light max-w-2xl mx-auto leading-relaxed">
 fromtoTicketFollow up, Weaseach1UserProvideClear, canTrack'sSupportPath.
 </p>
 </div>
 </section>

 {/* Quick Links */}
 <section className="py-16 px-6">
 <div className="max-w-6xl mx-auto">
 <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {supportQuickLinks.map((link) => (
 <Link
 key={link.title}
 href={link.href}
 className={cn(
 "p-5 rounded-2xl",
 "bg-surface-100/30 border border-border/30",
 "hover:bg-surface-100/60 hover:border-border/60",
 "transition-all duration-300 group"
 )}
 >
 <div className="w-10 h-10 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
 <link.icon className="w-5 h-5 text-foreground-light" />
 </div>
 <h3 className="text-[14px] font-semibold text-foreground mb-1 group-hover:text-foreground transition-colors">
 {link.title}
 </h3>
 <p className="text-[12px] text-foreground-lighter leading-relaxed">{link.description}</p>
 </Link>
 ))}
 </div>
 </div>
 </section>

 {/* Channels */}
 <section className="py-16 px-6">
 <div className="max-w-6xl mx-auto">
 <div className="flex items-center gap-2 mb-6">
 <LifeBuoy className="w-5 h-5 text-foreground-light" />
 <h2 className="text-xl font-semibold text-foreground">SupportChannel</h2>
 </div>
 <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {channelCards.map((channel) => {
 const Icon = channelIconMap[channel.key] || channelIconMap.default;
 return (
 <div
 key={channel.key}
 className={cn(
 "p-5 rounded-2xl",
 "bg-surface-100/30 border border-border/30",
 "hover:bg-surface-100/60 hover:border-border/60",
 "transition-all duration-300"
 )}
 >
 <div className="w-10 h-10 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center mb-4">
 <Icon className="w-5 h-5 text-foreground-light" />
 </div>
 <h3 className="text-[14px] font-semibold text-foreground mb-1">{channel.name}</h3>
 <p className="text-[12px] text-foreground-lighter">{channel.description}</p>
 {channel.contact && (
 <p className="text-[11px] text-foreground-muted mt-2">{channel.contact}</p>
 )}
 </div>
 );
 })}
 </div>
 </div>
 </section>

 {/* Ticket & SLA */}
 <section className="py-20 px-6 bg-gradient-section">
 <div className="max-w-6xl mx-auto grid lg:grid-cols-[minmax(0,1fr)_360px] gap-8">
 <div className="bg-surface-100/30 border border-border/30 rounded-2xl p-6">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h2 className="text-xl font-semibold text-foreground">SubmitTicket</h2>
 <p className="text-[13px] text-foreground-lighter mt-1">
 Fill inkeyInfo, SystemwillAutoTierandCalculateResponse SLA.
 </p>
 </div>
 <div className="hidden sm:flex items-center gap-2 text-[12px] text-foreground-lighter">
 <BadgeCheck className="w-4 h-4 text-brand-500" />
 alreadySupport SLA Track
 </div>
 </div>

 {ticket ? (
 <div className="rounded-2xl border border-brand-500/30 bg-brand-500/5 p-6">
 <div className="flex items-center gap-3 mb-4">
 <CheckCircle2 className="w-6 h-6 text-brand-500" />
 <div>
 <h3 className="text-lg font-semibold text-foreground">TicketalreadySubmit</h3>
 <p className="text-[13px] text-foreground-lighter">
 ReferenceNumber: <span className="text-foreground font-medium">{ticket.reference}</span>
 </p>
 </div>
 </div>
 <div className="grid sm:grid-cols-2 gap-4 text-sm">
 <div className="rounded-xl border border-border/30 bg-surface-100/30 p-4">
 <div className="text-[11px] text-foreground-muted mb-1">EstimatedResponseDeadline</div>
 <div className="text-foreground font-medium text-[13px]">
 {formatDateTime(ticket.sla_response_due_at)}
 </div>
 </div>
 <div className="rounded-xl border border-border/30 bg-surface-100/30 p-4">
 <div className="text-[11px] text-foreground-muted mb-1">CurrentStatus</div>
 <div className="text-foreground font-medium text-[13px]">{ticket.status}</div>
 </div>
 </div>
 <div className="flex flex-wrap gap-3 mt-6">
 <Button
 variant="outline"
 onClick={() => setTicket(null)}
 className="rounded-full border-border/50 hover:bg-surface-200/50"
 >
 SubmitnewTicket
 </Button>
 <Link href="/help">
 <Button className="rounded-full bg-foreground hover:bg-foreground/90 text-background">Continue</Button>
 </Link>
 </div>
 </div>
 ) : (
 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="grid sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-[13px] font-medium text-foreground mb-2">
 ContactpersonName
 </label>
 <Input
 value={formData.name}
 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
 placeholder="you'sName(select)"
 className="bg-surface-200/50 border-border/30"
 />
 </div>
 <div>
 <label className="block text-[13px] font-medium text-foreground mb-2">
 ContactEmail *
 </label>
 <Input
 required
 type="email"
 value={formData.email}
 onChange={(e) => setFormData({ ...formData, email: e.target.value })}
 placeholder="name@company.com"
 className="bg-surface-200/50 border-border/30"
 />
 </div>
 </div>

 <div className="grid sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-[13px] font-medium text-foreground mb-2">
 IssueCategory
 </label>
 <select
 value={formData.category}
 onChange={(e) => setFormData({ ...formData, category: e.target.value })}
 className="w-full h-10 px-3 rounded-lg bg-surface-200/50 border border-border/30 text-foreground text-[13px]"
 >
 {supportCategories.map((item) => (
 <option key={item.id} value={item.id}>
 {item.label}
 </option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-[13px] font-medium text-foreground mb-2">
 Priority
 </label>
 <select
 value={formData.priority}
 onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
 className="w-full h-10 px-3 rounded-lg bg-surface-200/50 border border-border/30 text-foreground text-[13px]"
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
 <label className="block text-[13px] font-medium text-foreground mb-2">
 Workspace ID(Optional)
 </label>
 <Input
 value={formData.workspaceId}
 onChange={(e) => setFormData({ ...formData, workspaceId: e.target.value })}
 placeholder="Used forQuickEnvironment"
 className="bg-surface-200/50 border-border/30"
 />
 </div>
 <div>
 <label className="block text-[13px] font-medium text-foreground mb-2">
 Workspace ID(Optional)
 </label>
 <Input
 value={formData.workspaceId}
 onChange={(e) => setFormData({ ...formData, workspaceId: e.target.value })}
 placeholder="ifandSpecificWorkspace"
 className="bg-surface-200/50 border-border/30"
 />
 </div>
 </div>

 <div>
 <label className="block text-[13px] font-medium text-foreground mb-2">
 IssueTitle *
 </label>
 <Input
 required
 value={formData.subject}
 onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
 placeholder="PleaseneedDescriptionto'sIssue"
 className="bg-surface-200/50 border-border/30"
 />
 </div>

 <div>
 <label className="block text-[13px] font-medium text-foreground mb-2">
 DetailedDescription *
 </label>
 <textarea
 required
 value={formData.description}
 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
 rows={6}
 placeholder="IncludeStep, ErrorTip, ExpectResultetc"
 className="w-full px-3 py-2 rounded-lg bg-surface-200/50 border border-border/30 text-foreground text-[13px] resize-none"
 />
 </div>

 {captchaRequired && (
 <div>
 <label className="block text-[13px] font-medium text-foreground mb-2">
 Verification Code Token
 </label>
 <Input
 value={captchaToken}
 onChange={(e) => setCaptchaToken(e.target.value)}
 placeholder="ifEnableVerification Code, PleasePaste token"
 className="bg-surface-200/50 border-border/30"
 />
 <p className="text-[11px] text-foreground-muted mt-2">
 TipFrequentRequest, PleaseDoneVerification Codeandre-newSubmit.
 </p>
 </div>
 )}

 {submitError && (
 <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">
 {submitError}
 </div>
 )}

 <div className="flex items-center justify-between">
 <div className="text-[11px] text-foreground-muted flex items-center gap-2">
 <Shield className="w-4 h-4" />
 WewillforSensitiveInfoProceedProcess
 </div>
 <Button type="submit" disabled={isSubmitting} className="rounded-full bg-foreground hover:bg-foreground/90 text-background">
 {isSubmitting ? (
 <>
 <Clock className="w-4 h-4 mr-2 animate-spin" />
 Submit...
 </>
 ) : (
 <>
 <Send className="w-4 h-4 mr-2" />
 SubmitTicket
 </>
 )}
 </Button>
 </div>
 </form>
 )}
 </div>

 <div className="space-y-6">
 <div className="rounded-2xl border border-border/30 bg-surface-100/30 p-6">
 <div className="flex items-center gap-2 mb-4">
 <Inbox className="w-5 h-5 text-foreground-light" />
 <h3 className="text-lg font-semibold text-foreground">Response SLA</h3>
 </div>
 <div className="space-y-4">
 {activeSLA.targets.map((target) => (
 <div key={target.priority} className="rounded-xl border border-border/30 bg-surface-200/30 p-4">
 <div className="flex items-center justify-between text-[13px]">
 <span className="font-medium text-foreground">
 {supportPriorities.find((item) => item.id === target.priority)?.label || target.priority}
 </span>
 <span className="text-foreground-lighter">{target.first_response_target}</span>
 </div>
 <div className="text-[11px] text-foreground-muted mt-2">
 Updaterate: {target.update_cadence}
 </div>
 <div className="text-[11px] text-foreground-muted mt-1">
 Target: {target.resolution_target}
 </div>
 <div className="flex flex-wrap gap-2 mt-3 text-[11px]">
 {target.applies_to.map((tag) => (
 <span
 key={tag}
 className="px-2 py-1 rounded-full bg-surface-200/50 text-foreground-lighter"
 >
 {tag}
 </span>
 ))}
 </div>
 </div>
 ))}
 </div>
 {activeSLA.notes?.length ? (
 <div className="mt-4 space-y-2 text-[11px] text-foreground-muted">
 {activeSLA.notes.map((note) => (
 <div key={note} className="flex items-start gap-2">
 <AlertTriangle className="w-4 h-4 text-foreground-lighter mt-0.5" />
 <span>{note}</span>
 </div>
 ))}
 </div>
 ) : null}
 </div>

 <div className="rounded-2xl border border-border/30 bg-surface-100/30 p-6">
 <div className="flex items-center gap-2 mb-3">
 <CheckCircle2 className="w-5 h-5 text-foreground-light" />
 <h3 className="text-lg font-semibold text-foreground">ProcessFlow</h3>
 </div>
 <ul className="space-y-3 text-[13px] text-foreground-lighter">
 <li>1. AutoTierandCreateTicketNumber</li>
 <li>2. SupportTeamtimesResponseandSync SLA Time</li>
 <li>3. byPriorityUpdateProcess</li>
 <li>4. ResultandClosed LoopConfirm</li>
 </ul>
 </div>
 </div>
 </div>
 </section>

 <SiteFooter />
 </div>
 );
}
