"use client";

/**
 * Use Cases Page - LobeHub StyleDesign
 */

import Link from "next/link";
import { Layers, ArrowRight, MessageSquare, FileText, RefreshCw, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const useCases = [
 {
 icon: MessageSquare,
 title: "SmartSupport",
 description: "7x24 AutoReply, Knowledge BaseSearch, Smartperson.",
 },
 {
 icon: FileText,
 title: "ContentGenerateandPublish",
 description: "BatchGenerateCopy, SEO optimal, ReviewandPublishFlowAutomation.",
 },
 {
 icon: RefreshCw,
 title: "DataSync",
 description: "SystembetweenDatafor, Sync, ExceptionAlertandRetry.",
 },
 {
 icon: BarChart3,
 title: "OperationsAutomation",
 description: "lineDistribute, Email/IM Notifications, seetotalandweeksReport.",
 },
];

export default function UseCasesPage() {
 return (
 <div className="min-h-screen bg-background">
 <SiteHeader />

 {/* Hero */}
 <section className="pt-32 sm:pt-40 pb-16 px-6 bg-gradient-hero">
 <div className="max-w-5xl mx-auto text-center">
 <div className="lobe-badge mb-8">
 <Layers className="h-4 w-4" />
 Solutions
 </div>
 <h1 className="text-[15px] sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-6">
 UsageScenario
 </h1>
 <p className="text-[13px] text-foreground-light max-w-2xl mx-auto">
 WecurrentlyatOrganizemoreComplete'sIndustryBest PracticesandTemplateExample.CurrentPagefirstProvide1canBrowse'sScenarioOverview.
 </p>
 </div>
 </section>

 {/* Use Cases Grid */}
 <main className="max-w-5xl mx-auto px-6 py-16">
 <div className="grid sm:grid-cols-2 gap-6">
 {useCases.map((item) => (
 <div key={item.title} className="p-6 rounded-2xl bg-surface-100/30 border border-border/30 hover:border-[#4e8fff]/30 transition-all duration-300">
 <div className="w-10 h-10 rounded-xl bg-[#4e8fff]/10 flex items-center justify-center mb-4">
 <item.icon className="w-5 h-5 text-[#4e8fff]" />
 </div>
 <h2 className="text-[15px] font-semibold text-foreground mb-2">{item.title}</h2>
 <p className="text-[13px] text-foreground-light">
 {item.description}
 </p>
 </div>
 ))}
 </div>

 <div className="flex flex-wrap items-center gap-3 mt-10">
 <Link href="/templates">
 <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90">
 BrowseTemplate
 <ArrowRight className="ml-2 w-4 h-4" />
 </Button>
 </Link>
 <Link href="/contact">
 <Button variant="outline" className="rounded-full border-border/50 text-foreground-light hover:text-foreground">
 Contact Us
 </Button>
 </Link>
 </div>
 </main>

 <SiteFooter />
 </div>
 );
}
