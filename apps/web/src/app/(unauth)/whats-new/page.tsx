"use client";

/**
 * Change LogPage - LobeHub StyleDesign
 */

import Link from "next/link";
import {
 Sparkles,
 ArrowRight,
 Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// Change Log
const releases = [
 {
 version: "2.1.0",
 date: "2026-01-28",
 title: "AI Agent 2.0 Publish",
 description: "allnew's AI Engine, Supportmultiple Agent Work",
 changes: [
 { type: "feature", text: "allnew AI Agent 2.0 Engine" },
 { type: "feature", text: "multiple Agent Collaboration" },
 { type: "feature", text: "moreSmart'sContextUnderstand" },
 { type: "improvement", text: "ExecutecanImprove 30%" },
 { type: "fix", text: "FixWorkflowExportIssue" },
 ],
 },
 {
 version: "2.0.5",
 date: "2026-01-15",
 title: "SecurityUpdate",
 description: "re-need'sSecurityImproveand Bug Fix",
 changes: [
 { type: "feature", text: "Add MFA multipleAuthentication" },
 { type: "improvement", text: "API KeyManageoptimal" },
 { type: "fix", text: "FixwillTimeoutIssue" },
 { type: "fix", text: "FixDataExportFormatError" },
 ],
 },
 {
 version: "2.0.4",
 date: "2026-01-08",
 title: "IntegrationUpdate",
 description: "AddmultipleThird-partyServiceIntegration",
 changes: [
 { type: "feature", text: "AddFeishuIntegration" },
 { type: "feature", text: "AddDingTalkIntegration" },
 { type: "feature", text: "Add Notion DatabaseSync" },
 { type: "improvement", text: "Slack Integrationoptimal" },
 ],
 },
 {
 version: "2.0.3",
 date: "2026-01-01",
 title: "canoptimal",
 description: "largeImproveWorkflowExecutecan",
 changes: [
 { type: "improvement", text: "WorkflowExecuteSpeedImprove 50%" },
 { type: "improvement", text: "EditLoadSpeedoptimal" },
 { type: "fix", text: "FixandrowNodeExecuteIssue" },
 { type: "fix", text: "FixScheduledTriggerPrecisionIssue" },
 ],
 },
];

const typeConfig = {
 feature: { label: "newFeatures", color: "text-emerald-400", bg: "bg-emerald-400/10" },
 improvement: { label: "optimal", color: "text-[#4e8fff]", bg: "bg-[#4e8fff]/10" },
 fix: { label: "Fix", color: "text-orange-400", bg: "bg-orange-400/10" },
};

export default function WhatsNewPage() {
 return (
 <div className="min-h-screen bg-background">
 <SiteHeader />

 {/* Hero */}
 <section className="pt-32 sm:pt-40 pb-16 px-6 bg-gradient-hero">
 <div className="max-w-4xl mx-auto text-center">
 <div className="lobe-badge mb-8">
 <Sparkles className="h-4 w-4" />
 ProductUpdate
 </div>

 <h1 className="text-[15px] sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-6">
 Change Log
 </h1>

 <p className="text-[13px] text-foreground-light max-w-2xl mx-auto">
 AgentFlow 'smostnewFeatures, ImproveandFix
 </p>
 </div>
 </section>

 {/* Releases */}
 <section className="py-12 px-6">
 <div className="max-w-3xl mx-auto">
 <div className="space-y-8">
 {releases.map((release) => (
 <div
 key={release.version}
 className="p-6 rounded-2xl bg-surface-100/30 border border-border/30"
 >
 {/* Header */}
 <div className="flex flex-wrap items-center gap-3 mb-4">
 <span className="px-3 py-1 rounded-full bg-[#4e8fff]/10 text-[#4e8fff] text-[12px] font-medium">
 v{release.version}
 </span>
 <span className="flex items-center gap-1 text-[12px] text-foreground-lighter">
 <Calendar className="w-4 h-4" />
 {release.date}
 </span>
 </div>

 {/* Title */}
 <h2 className="text-[15px] font-bold text-foreground mb-2">
 {release.title}
 </h2>
 <p className="text-[13px] text-foreground-light mb-4">
 {release.description}
 </p>

 {/* Changes */}
 <div className="space-y-2">
 {release.changes.map((change, index) => {
 const config = typeConfig[change.type as keyof typeof typeConfig];
 return (
 <div key={index} className="flex items-center gap-3">
 <span className={cn("px-2 py-0.5 rounded text-[11px] font-medium", config.bg, config.color)}>
 {config.label}
 </span>
 <span className="text-[13px] text-foreground">{change.text}</span>
 </div>
 );
 })}
 </div>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Subscribe */}
 <section className="py-16 px-6 bg-gradient-section">
 <div className="max-w-4xl mx-auto text-center">
 <h2 className="text-[15px] sm:text-2xl font-bold text-foreground mb-4">SubscriptionUpdateNotifications</h2>
 <p className="text-[13px] text-foreground-light mb-6">#1TimeFetchProductUpdateInfo</p>
 <Link href="/newsletter">
 <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90">
 SubscriptionNewsletter
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </Link>
 </div>
 </section>

 <SiteFooter />
 </div>
 );
}
