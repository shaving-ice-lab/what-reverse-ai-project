"use client";

/**
 * FaultGuide - LobeHub Style
 */

import Link from "next/link";
import {
 AlertTriangle,
 CheckCircle2,
 CloudOff,
 FileText,
 Shield,
 Wrench,
 Sparkles,
 ArrowRight,
 Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

const quickChecks = [
 "ConfirmCurrentAccountisnohasforshould Workspace Permission",
 "Check API Key orConnectCredentialsisnoExpired/byRevoke",
 "ViewExecuteLogsisnoatTimeoutorRate LimitingTip",
 "forTriggerand Webhook ConfigisnobyDisable",
];

const troubleshootingSections = [
 {
 icon: Wrench,
 title: "WorkflowExecuteFailed",
 description: "NodeExecuteException, InputnotCompleteorInsufficient permissionsCause'sFailed",
 steps: [
 "atExecuteRecordViewFailedNodeandErrorInfo",
 "ConfirmInputParameterisnoMissingorInvalid format",
 "CheckTargetApp'sAccessPolicyandQuota",
 "needtimeReduceConcurrencyorEnableRetry",
 ],
 },
 {
 icon: CloudOff,
 title: "Webhook NoTrigger",
 description: "Third-partyEventnot yetcanTriggerorCallbackFailed",
 steps: [
 "Check Webhook URL isnocanAccess",
 "ConfirmCallbackBioKeyandEventType",
 "ViewLogsisnobyFirewallorRate LimitingIntercept",
 "TryuseTestEventre-newTrigger",
 ],
 },
 {
 icon: Shield,
 title: "PermissionandSecurityBlock",
 description: "MemberRoleorSecurityPolicyCauseActionlimit",
 steps: [
 "ConfirmMemberisnoas owner/admin Role",
 "Check Workspace 'sAccessPolicyandSecurity Settings",
 "Verify OAuth/SSO ConfigisnoExpire",
 "ifandSensitiveData, PleasePrepareAudit Log",
 ],
 },
 {
 icon: AlertTriangle,
 title: "RuntimeRate LimitingandFailed",
 description: "RequestpastorRuntimeExceptionCauseUnavailable",
 steps: [
 "ViewAccessStatisticsandRate LimitingEvent",
 "CheckisnotoPlanQuotavalue",
 " rate_limit orUpgradePlan",
 "needtimeSwitchuseModelor",
 ],
 },
];

const nextActions = [
 {
 title: "FAQ FAQ",
 description: "IssueQuickResolve",
 href: "/faq",
 },
 {
 title: "Help CenterDirectory",
 description: "byThemeBrowseCompleteDocument",
 href: "/help",
 },
 {
 title: "SubmitTicket",
 description: "FetchSupportTeamHelp",
 href: "/support",
 },
];

export default function TroubleshootingPage() {
 return (
 <div className="min-h-screen bg-background">
 <SiteHeader />

 {/* Hero */}
 <section className="relative pt-32 sm:pt-40 pb-16 overflow-hidden">
 <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

 <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
 <div className="lobe-badge mb-8">
 <Wrench className="h-3.5 w-3.5" />
 <span>Fault</span>
 </div>

 <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]">
 FaultGuide
 </h1>
 <p className="text-lg text-foreground-light max-w-2xl mx-auto mb-10 leading-relaxed">
 byStepQuickIssue, ShortenRestoreTime.
 </p>

 <div className="max-w-xl mx-auto relative">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-lighter" />
 <Input
 placeholder="SearchFaultkeychar..."
 className="pl-12 h-12 rounded-full bg-surface-100/50 border-border/30 text-foreground placeholder:text-foreground-lighter"
 />
 </div>
 </div>
 </section>

 {/* Quick Checks */}
 <section className="py-24 sm:py-32">
 <div className="max-w-5xl mx-auto px-6">
 <div className="flex items-center gap-2 mb-6">
 <CheckCircle2 className="w-5 h-5 text-brand-500" />
 <h2 className="text-[15px] font-semibold text-foreground">QuickChecklist</h2>
 </div>
 <div className="grid sm:grid-cols-2 gap-4">
 {quickChecks.map((item) => (
 <div
 key={item}
 className={cn(
 "p-4 rounded-2xl",
 "bg-surface-100/30 border border-border/30"
 )}
 >
 <div className="flex items-start gap-2 text-[13px] text-foreground-lighter">
 <span className="mt-0.5 text-brand-500">•</span>
 <span>{item}</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Troubleshooting Sections */}
 <section className="py-24 sm:py-32 bg-gradient-section">
 <div className="max-w-5xl mx-auto px-6">
 <div className="lobe-section-header">
 <h2>CommonScenario</h2>
 <p>byScenarioQuickandResolveIssue</p>
 </div>

 <div className="grid lg:grid-cols-2 gap-4">
 {troubleshootingSections.map((section) => (
 <div
 key={section.title}
 className={cn(
 "p-6 rounded-2xl",
 "bg-surface-100/30 border border-border/30",
 "hover:bg-surface-100/60 hover:border-border/60",
 "transition-all duration-300"
 )}
 >
 <div className="flex items-center gap-3 mb-4">
 <div className="w-10 h-10 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center">
 <section.icon className="w-5 h-5 text-foreground-light" />
 </div>
 <div>
 <h3 className="text-[15px] font-semibold text-foreground">{section.title}</h3>
 <p className="text-[12px] text-foreground-lighter">{section.description}</p>
 </div>
 </div>
 <ul className="space-y-2 text-[13px] text-foreground-lighter">
 {section.steps.map((step) => (
 <li key={step} className="flex items-start gap-2">
 <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-500/60 shrink-0" />
 <span>{step}</span>
 </li>
 ))}
 </ul>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Next Actions */}
 <section className="py-24 sm:py-32">
 <div className="max-w-5xl mx-auto px-6">
 <div className="flex items-center gap-2 mb-6">
 <FileText className="w-5 h-5 text-brand-500" />
 <h2 className="text-[15px] font-semibold text-foreground">Nextrow</h2>
 </div>

 <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {nextActions.map((item) => (
 <Link
 key={item.title}
 href={item.href}
 className={cn(
 "p-5 rounded-2xl group",
 "bg-surface-100/30 border border-border/30",
 "hover:bg-surface-100/60 hover:border-border/60",
 "transition-all duration-300"
 )}
 >
 <h3 className="text-[15px] font-semibold text-foreground mb-1 group-hover:text-brand-500 transition-colors">
 {item.title}
 </h3>
 <p className="text-[13px] text-foreground-lighter">{item.description}</p>
 </Link>
 ))}
 </div>

 <div className="mt-10 flex flex-wrap gap-3">
 <Link href="/support">
 <Button className="h-10 px-6 rounded-full text-[13px] font-medium bg-foreground text-background hover:bg-foreground/90">
 SubmitTicket
 </Button>
 </Link>
 <Link href="/help">
 <Button variant="outline" className="h-10 px-6 rounded-full text-[13px] border-border/50 hover:bg-surface-200/50">
 BackHelp Center
 </Button>
 </Link>
 </div>
 </div>
 </section>

 <SiteFooter />
 </div>
 );
}
