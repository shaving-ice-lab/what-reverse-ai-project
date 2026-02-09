"use client";

/**
 * Changelog Page - LobeHub Style Design
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

// Changelog
const releases = [
 {
 version: "2.1.0",
 date: "2026-01-28",
 title: "AI Agent 2.0 Release",
 description: "All-new AI engine with support for multi-agent collaboration",
 changes: [
 { type: "feature", text: "All-new AI Agent 2.0 engine" },
 { type: "feature", text: "Multi-agent collaboration" },
 { type: "feature", text: "Smarter context understanding" },
 { type: "improvement", text: "Execution performance improved by 30%" },
 { type: "fix", text: "Fix workflow export issue" },
 ],
 },
 {
 version: "2.0.5",
 date: "2026-01-15",
 title: "Security Update",
 description: "Security improvements and bug fixes",
 changes: [
 { type: "feature", text: "Add MFA multi-factor authentication" },
 { type: "improvement", text: "API key management optimization" },
 { type: "fix", text: "Fix timeout issue" },
 { type: "fix", text: "Fix data export format error" },
 ],
 },
 {
 version: "2.0.4",
 date: "2026-01-08",
 title: "Integration Update",
 description: "Added multiple third-party service integrations",
 changes: [
 { type: "feature", text: "Add Feishu integration" },
 { type: "feature", text: "Add DingTalk integration" },
 { type: "feature", text: "Add Notion database sync" },
 { type: "improvement", text: "Slack integration optimization" },
 ],
 },
 {
 version: "2.0.3",
 date: "2026-01-01",
 title: "Performance Optimization",
 description: "Significant improvements to workflow execution performance",
 changes: [
 { type: "improvement", text: "Workflow execution speed improved by 50%" },
 { type: "improvement", text: "Editor load speed optimization" },
 { type: "fix", text: "Fix parallel node execution issue" },
 { type: "fix", text: "Fix scheduled trigger precision issue" },
 ],
 },
];

const typeConfig = {
 feature: { label: "New Feature", color: "text-emerald-400", bg: "bg-emerald-400/10" },
 improvement: { label: "Improvement", color: "text-[#4e8fff]", bg: "bg-[#4e8fff]/10" },
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
 Product Updates
 </div>

 <h1 className="text-[15px] sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-6">
 Changelog
 </h1>

 <p className="text-[13px] text-foreground-light max-w-2xl mx-auto">
 AgentFlow's latest features, improvements, and fixes
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
 <h2 className="text-[15px] sm:text-2xl font-bold text-foreground mb-4">Subscription update notifications</h2>
 <p className="text-[13px] text-foreground-light mb-6">Be the first to receive product update notifications</p>
 <Link href="/newsletter">
 <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90">
 Subscribe to Newsletter
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </Link>
 </div>
 </section>

 <SiteFooter />
 </div>
 );
}
