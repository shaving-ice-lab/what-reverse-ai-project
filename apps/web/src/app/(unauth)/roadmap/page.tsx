"use client";

/**
 * Product Roadmap Page - LobeHub Style Design
 */

import Link from "next/link";
import {
 Rocket,
 CheckCircle,
 Clock,
 Lightbulb,
 ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// Roadmap Data
const roadmapItems = [
 {
 quarter: "Q1 2026",
 status: "completed",
 items: [
 { title: "AI Agent 2.0", description: "All-new AI engine with multi-model collaboration support", done: true },
 { title: "Visual Editor Upgrade", description: "Smoother drag-and-drop experience", done: true },
 { title: "Enterprise-Grade SSO", description: "Support for SAML and OIDC authentication", done: true },
 ],
 },
 {
 quarter: "Q2 2026",
 status: "in-progress",
 items: [
 { title: "Mobile App", description: "Native iOS and Android apps", done: false },
 { title: "Advanced Analytics Dashboard", description: "In-depth usage data analytics", done: false },
 { title: "More Integrations", description: "Adding 50+ third-party service integrations", done: false },
 ],
 },
 {
 quarter: "Q3 2026",
 status: "planned",
 items: [
 { title: "AI Workflow Generation", description: "Automatically generate workflows from natural language descriptions", done: false },
 { title: "Enhanced Team Collaboration", description: "Real-time collaborative editing and commenting", done: false },
 { title: "Template Marketplace 2.0", description: "Richer template categories and improved search", done: false },
 ],
 },
 {
 quarter: "Q4 2026",
 status: "exploring",
 items: [
 { title: "Enhanced Private Deployment", description: "Simplified deployment process", done: false },
 { title: "Multi-Language Support", description: "Support for more languages in the interface", done: false },
 { title: "Advanced Automation", description: "More complex conditional and loop logic", done: false },
 ],
 },
];

const statusConfig = {
 completed: { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-400/10" },
 "in-progress": { label: "In Progress", color: "text-[#4e8fff]", bg: "bg-[#4e8fff]/10" },
 planned: { label: "Planned", color: "text-blue-400", bg: "bg-blue-400/10" },
 exploring: { label: "Exploring", color: "text-purple-400", bg: "bg-purple-400/10" },
};

export default function RoadmapPage() {
 return (
 <div className="min-h-screen bg-background">
 <SiteHeader />

 {/* Hero */}
 <section className="pt-32 sm:pt-40 pb-16 px-6 bg-gradient-hero">
 <div className="max-w-4xl mx-auto text-center">
 <div className="lobe-badge mb-8">
 <Rocket className="h-4 w-4" />
 Product Roadmap
 </div>

 <h1 className="text-[15px] sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-6">
 Product Roadmap
 </h1>

 <p className="text-[13px] text-foreground-light max-w-2xl mx-auto">
 Features we're currently building, along with our future plans. Your feedback helps us prioritize.
 </p>
 </div>
 </section>

 {/* Roadmap */}
 <section className="py-12 px-6">
 <div className="max-w-4xl mx-auto">
 <div className="space-y-8">
 {roadmapItems.map((quarter) => {
 const config = statusConfig[quarter.status as keyof typeof statusConfig];
 return (
 <div key={quarter.quarter} className="relative">
 {/* Quarter Header */}
 <div className="flex items-center gap-4 mb-4">
 <h2 className="text-[15px] font-bold text-foreground">
 {quarter.quarter}
 </h2>
 <span className={cn("px-3 py-1 rounded-full text-[11px] font-medium", config.bg, config.color)}>
 {config.label}
 </span>
 </div>

 {/* Items */}
 <div className="space-y-3 pl-4 border-l-2 border-border/30">
 {quarter.items.map((item) => (
 <div
 key={item.title}
 className={cn(
 "p-4 rounded-2xl ml-4",
 "bg-surface-100/30 border border-border/30",
 item.done && "border-emerald-400/30"
 )}
 >
 <div className="flex items-start gap-3">
 {item.done ? (
 <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
 ) : (
 <Clock className="w-5 h-5 text-foreground-lighter mt-0.5 shrink-0" />
 )}
 <div>
 <h3 className="font-medium text-foreground mb-1 text-[13px]">
 {item.title}
 </h3>
 <p className="text-[12px] text-foreground-light">
 {item.description}
 </p>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </section>

 {/* Feedback */}
 <section className="py-16 px-6 bg-gradient-section">
 <div className="max-w-4xl mx-auto text-center">
 <Lightbulb className="w-12 h-12 text-[#4e8fff] mx-auto mb-4" />
 <h2 className="text-[15px] sm:text-2xl font-bold text-foreground mb-4">Have a Feature Suggestion?</h2>
 <p className="text-[13px] text-foreground-light mb-6">
 We truly value your feedback — help us build a better product
 </p>
 <Link href="/contact?type=feature-request">
 <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90">
 Submit a Suggestion
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </Link>
 </div>
 </section>

 <SiteFooter />
 </div>
 );
}
