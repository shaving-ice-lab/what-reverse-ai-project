"use client";

/**
 * Case StudiesPage - LobeHub StyleDesign
 */

import Link from "next/link";
import {
 ArrowRight,
 Quote,
 Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// Case StudiesData
const caseStudies = [
 {
 id: "1",
 company: "largeE-commercePlatform",
 industry: "E-commerce",
 logo: "🛒",
 title: "SmartSupportAutomationSystem",
 description: "ViaDeploy AI Driven'sSmartSupportSystem, willCustomerResponse Timefrom 30 minShortento 2 min, SupportrateImprove 300%.",
 results: [
 { metric: "Response Time", value: "-93%", description: "from 30 minto 2 min" },
 { metric: "Supportrate", value: "+300%", description: "ProcesscanpowerImprove 3 " },
 { metric: "CustomerSatisfaction", value: "+45%", description: "NPS Improve" },
 ],
 quote: "AgentFlow HelpWeChangeSupportOperations, atWe'ssmallTeamcanwithProcessPast 5 'sCustomerConsulting.",
 author: "Supporttotal",
 featured: true,
 },
 {
 id: "2",
 company: "Finance",
 industry: "Finance",
 logo: "🏦",
 title: "AutomationRisk ControlFlow",
 description: "ImplementRiskMonitorandWarning'sallAutomation, Risk ControlResponseSpeedImprove 10 , largeReducepersonReviewCost.",
 results: [
 { metric: "ResponseSpeed", value: "10x", description: "Real-timeRiskWarning" },
 { metric: "ReviewCost", value: "-60%", description: "fewpersonenter" },
 { metric: "Accuraterate", value: "99.5%", description: "AI AuxiliaryDecision" },
 ],
 quote: "Automation'sRisk ControlFlowletWecanReal-timeResponseMarketplace, thisatFinanceIndustryisre-need's.",
 author: "Risk",
 featured: true,
 },
 {
 id: "3",
 company: "ManufacturingEnterprise",
 industry: "Manufacturing",
 logo: "🏭",
 title: "shouldAutomationManage",
 description: " ERP, MES and WMS System, ImplementshouldallFlowAutomation, InventoryweeksrateImprove 40%.",
 results: [
 { metric: "shouldrate", value: "+150%", description: "endpointtoendpointAutomation" },
 { metric: "Inventoryweeks", value: "+40%", description: "SmartInventoryManage" },
 { metric: "OperationsCost", value: "-35%", description: "fewpersonAction" },
 ],
 quote: "AgentFlow HelpWeSystem'sData, currentlyImplementshould'scountchar.",
 author: "shouldtotal",
 featured: false,
 },
 {
 id: "4",
 company: " SaaS Company",
 industry: "",
 logo: "💻",
 title: "SaleslineAutomation",
 description: "AutomationSaleslineRatingandAllocate, SalesTeamrateImprove 200%, Conversion RateImprove 35%.",
 results: [
 { metric: "Salesrate", value: "+200%", description: "AutomationlineProcess" },
 { metric: "Conversion Rate", value: "+35%", description: "Customer" },
 { metric: "Response Time", value: "-80%", description: "QuickFollow up" },
 ],
 quote: "atWe'sSalesTeamcanwithFocusatvalueCustomer, andnotisTimeOnlineFilteron.",
 author: "Sales VP",
 featured: false,
 },
];

export default function CaseStudiesPage() {
 return (
 <div className="min-h-screen bg-background">
 <SiteHeader />

 {/* Hero */}
 <section className="pt-32 sm:pt-40 pb-16 px-6 bg-gradient-hero">
 <div className="max-w-4xl mx-auto text-center">
 <div className="lobe-badge mb-8">
 <Sparkles className="h-4 w-4" />
 RealCustomerCase Studies
 </div>

 <h1 className="text-[15px] sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-6">
 CustomerCase Studies
 </h1>

 <p className="text-[13px] text-foreground-light max-w-2xl mx-auto">
 IndustryfirstEnterpriseifwhatUsage AgentFlow ImplementBusinessAutomation, Improverate
 </p>
 </div>
 </section>

 {/* Featured Cases */}
 <section className="py-12 px-6">
 <div className="max-w-5xl mx-auto">
 <h2 className="lobe-section-header mb-8">FeaturedCase Studies</h2>
 <div className="grid md:grid-cols-2 gap-6">
 {caseStudies
 .filter((c) => c.featured)
 .map((study) => (
 <div
 key={study.id}
 className={cn(
 "p-6 rounded-2xl",
 "bg-surface-100/30 border border-border/30",
 "hover:border-[#4e8fff]/30 hover:shadow-lg",
 "transition-all duration-300"
 )}
 >
 <div className="flex items-center gap-3 mb-4">
 <div className="w-12 h-12 rounded-xl bg-surface-100/50 flex items-center justify-center text-2xl">
 {study.logo}
 </div>
 <div>
 <h3 className="font-semibold text-foreground">
 {study.company}
 </h3>
 <span className="text-[11px] text-[#4e8fff]">{study.industry}</span>
 </div>
 </div>

 <h4 className="text-[15px] font-medium text-foreground mb-2">
 {study.title}
 </h4>
 <p className="text-[13px] text-foreground-light mb-4">
 {study.description}
 </p>

 <div className="grid grid-cols-3 gap-4 mb-4">
 {study.results.map((result) => (
 <div key={result.metric}>
 <div className="text-xl font-bold text-[#4e8fff]">
 {result.value}
 </div>
 <div className="text-[11px] text-foreground-lighter">
 {result.metric}
 </div>
 </div>
 ))}
 </div>

 <div className="p-4 rounded-xl bg-surface-100/50 mb-4">
 <Quote className="w-4 h-4 text-[#4e8fff] mb-2" />
 <p className="text-[13px] text-foreground-light italic mb-2">
 &ldquo;{study.quote}&rdquo;
 </p>
 <p className="text-[11px] text-foreground">— {study.author}</p>
 </div>

 <Link href={`/case-studies/${study.id}`}>
 <Button variant="outline" className="w-full rounded-full border-border/50 text-foreground-light">
 ViewDetails
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </Link>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* All Cases */}
 <section className="py-12 px-6 bg-gradient-section">
 <div className="max-w-5xl mx-auto">
 <h2 className="lobe-section-header mb-8">AllCase Studies</h2>
 <div className="space-y-4">
 {caseStudies.map((study) => (
 <Link
 key={study.id}
 href={`/case-studies/${study.id}`}
 className={cn(
 "block p-6 rounded-2xl",
 "bg-surface-100/30 border border-border/30",
 "hover:border-[#4e8fff]/30",
 "transition-all duration-300 group"
 )}
 >
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-surface-100/50 flex items-center justify-center text-2xl shrink-0">
 {study.logo}
 </div>
 <div>
 <div className="flex items-center gap-2 mb-1">
 <h3 className="font-semibold text-foreground group-hover:text-[#4e8fff] transition-colors">
 {study.company}
 </h3>
 <span className="px-2 py-0.5 rounded-full bg-[#4e8fff]/10 text-[#4e8fff] text-[11px]">
 {study.industry}
 </span>
 </div>
 <p className="text-[13px] text-foreground-light">
 {study.title}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-4">
 {study.results.slice(0, 2).map((result) => (
 <div key={result.metric} className="text-center">
 <div className="text-lg font-bold text-[#4e8fff]">
 {result.value}
 </div>
 <div className="text-[11px] text-foreground-lighter">
 {result.metric}
 </div>
 </div>
 ))}
 <ArrowRight className="w-5 h-5 text-foreground-lighter group-hover:text-[#4e8fff] transition-colors" />
 </div>
 </div>
 </Link>
 ))}
 </div>
 </div>
 </section>

 {/* CTA */}
 <section className="py-16 px-6">
 <div className="max-w-4xl mx-auto text-center">
 <h2 className="text-[15px] sm:text-2xl font-bold text-foreground mb-4">
 wantasdown1SuccessCase Studies?
 </h2>
 <p className="text-[13px] text-foreground-light mb-6">
 Contact Us, AgentFlow ifwhatHelpyou'sBusinessImplementAutomation
 </p>
 <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
 <Link href="/demo">
 <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90">
 AppointmentDemo
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </Link>
 <Link href="/contact">
 <Button size="lg" variant="outline" className="rounded-full border-border/50 text-foreground-light hover:text-foreground">
 ContactSales
 </Button>
 </Link>
 </div>
 </div>
 </section>

 <SiteFooter />
 </div>
 );
}
