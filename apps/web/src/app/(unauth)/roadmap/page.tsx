"use client";

/**
 * ProductRoadmapPage - LobeHub StyleDesign
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

// RoadmapData
const roadmapItems = [
 {
 quarter: "Q1 2026",
 status: "completed",
 items: [
 { title: "AI Agent 2.0", description: "allnew's AI Engine, SupportmultipleModelCollaboration", done: true },
 { title: "canvisualEditUpgrade", description: "moreSmooth'sDrag & DropExperience", done: true },
 { title: "Enterprise-grade SSO", description: "Support SAML and OIDC Authentication", done: true },
 ],
 },
 {
 quarter: "Q2 2026",
 status: "in-progress",
 items: [
 { title: "MoveendpointApp", description: "iOS and Android NativeApp", done: false },
 { title: "AdvancedAnalyticsDashboard", description: "enter'sUsageDataAnalytics", done: false },
 { title: "moremultipleIntegration", description: "Add 50+ Third-partyServiceIntegration", done: false },
 ],
 },
 {
 quarter: "Q3 2026",
 status: "planned",
 items: [
 { title: "AI WorkflowGenerate", description: "NaturalLanguageDescriptionAutoGenerateWorkflow", done: false },
 { title: "TeamCollaborationEnhanced", description: "Real-timeCollaborationEditandComment", done: false },
 { title: "TemplateMarketplace 2.0", description: "moreRich'sTemplateCategoryandSearch", done: false },
 ],
 },
 {
 quarter: "Q4 2026",
 status: "exploring",
 items: [
 { title: "PrivateDeployEnhanced", description: "moreSimple'sDeployFlow", done: false },
 { title: "multipleLanguageSupport", description: "SupportmoremultipleLanguage'sface", done: false },
 { title: "AdvancedAutomation", description: "moreComplex'sConditionandLoopLogic", done: false },
 ],
 },
];

const statusConfig = {
 completed: { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-400/10" },
 "in-progress": { label: "In Progress", color: "text-[#4e8fff]", bg: "bg-[#4e8fff]/10" },
 planned: { label: "Plan", color: "text-blue-400", bg: "bg-blue-400/10" },
 exploring: { label: "Explore", color: "text-purple-400", bg: "bg-purple-400/10" },
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
 ProductPlanning
 </div>

 <h1 className="text-[15px] sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-6">
 ProductRoadmap
 </h1>

 <p className="text-[13px] text-foreground-light max-w-2xl mx-auto">
 WecurrentlyatBuild'sFeatures, withandnot yetcome'sPlan.you'sFeedbackwillHelpWeOKPriority.
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
 <h2 className="text-[15px] sm:text-2xl font-bold text-foreground mb-4">hasFeaturesSuggestion?</h2>
 <p className="text-[13px] text-foreground-light mb-6">
 WeVeryre-visualyou'sFeedback, HelpWeBuildmore'sProduct
 </p>
 <Link href="/contact?type=feature-request">
 <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90">
 SubmitSuggestion
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </Link>
 </div>
 </section>

 <SiteFooter />
 </div>
 );
}
