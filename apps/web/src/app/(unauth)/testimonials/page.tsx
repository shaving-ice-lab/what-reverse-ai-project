"use client";

/**
 * CustomerReviewsPage - LobeHub StyleDesign
 */

import Link from "next/link";
import {
 Star,
 ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// CustomerReviews
const testimonials = [
 {
 quote: "AgentFlow HelpWewillSupportResponse Timefrom 30 minShortento 2 min, CustomerSatisfactionImprove 45%.",
 author: "total",
 role: "Supporttotal",
 company: "largeE-commercePlatform",
 industry: "E-commerce",
 avatar: "",
 rating: 5,
 },
 {
 quote: "Automation'sRisk ControlFlowletWecanReal-timeResponseMarketplace, RiskResponseSpeedImprove 10 .",
 author: "Manager Li",
 role: "Risk",
 company: "Finance",
 industry: "Finance",
 avatar: "",
 rating: 5,
 },
 {
 quote: "Via AgentFlow ERP, MES and WMS System, shouldrateImprove 150%.",
 author: "total",
 role: "shouldtotal",
 company: "ManufacturingEnterprise",
 industry: "Manufacturing",
 avatar: "",
 rating: 5,
 },
 {
 quote: "asDevelopers, AgentFlow 's API DesignVeryoptimal, IntegrationExperience1.",
 author: "Engineer Chen",
 role: "allStack",
 company: "Company",
 industry: "",
 avatar: "",
 rating: 5,
 },
 {
 quote: "SaleslineAutoRatingFeaturesHelpWe'sSalesTeamrateImprove 200%.",
 author: "total",
 role: "Sales VP",
 company: " SaaS Company",
 industry: "SaaS",
 avatar: "",
 rating: 5,
 },
 {
 quote: "'sAppointmentandFlowallsectionAutomationafter, userSatisfactionImprove.",
 author: "weeksmain",
 role: "Infomain",
 company: "3",
 industry: "Healthcare",
 avatar: "weeks",
 rating: 5,
 },
];

// StatisticsData
const stats = [
 { value: "98%", label: "CustomerSatisfaction" },
 { value: "500+", label: "EnterpriseCustomer" },
 { value: "50K+", label: "Active Users" },
 { value: "4.9", label: "AverageRating" },
];

export default function TestimonialsPage() {
 return (
 <div className="min-h-screen bg-background">
 <SiteHeader />

 {/* Hero */}
 <section className="pt-32 sm:pt-40 pb-16 px-6 bg-gradient-hero">
 <div className="max-w-4xl mx-auto text-center">
 <div className="lobe-badge mb-8">
 <Star className="h-4 w-4 fill-current" />
 Customerif
 </div>

 <h1 className="text-[15px] sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-6">
 heallatuseAgentFlow
 </h1>

 <p className="text-[13px] text-foreground-light max-w-2xl mx-auto">
 comeIndustryfirstEnterprise'sRealReviews
 </p>
 </div>
 </section>

 {/* Stats */}
 <section className="py-12 px-6">
 <div className="max-w-4xl mx-auto">
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {stats.map((stat) => (
 <div
 key={stat.label}
 className="text-center p-6 rounded-2xl bg-surface-100/30 border border-border/30"
 >
 <div className="text-3xl font-bold text-[#4e8fff] mb-1">{stat.value}</div>
 <div className="text-[12px] text-foreground-lighter">{stat.label}</div>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Testimonials */}
 <section className="py-12 px-6 bg-gradient-section">
 <div className="max-w-5xl mx-auto">
 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
 {testimonials.map((item, index) => (
 <div
 key={index}
 className={cn(
 "p-6 rounded-2xl",
 "bg-surface-100/30 border border-border/30",
 "hover:border-[#4e8fff]/30 hover:shadow-lg",
 "transition-all duration-300"
 )}
 >
 {/* Rating */}
 <div className="flex gap-1 mb-4">
 {[...Array(item.rating)].map((_, i) => (
 <Star
 key={i}
 className="w-4 h-4 text-yellow-500 fill-yellow-500"
 />
 ))}
 </div>

 {/* Quote */}
 <p className="text-[13px] text-foreground mb-6 leading-relaxed">
 &ldquo;{item.quote}&rdquo;
 </p>

 {/* Author */}
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-[#4e8fff]/10 flex items-center justify-center text-[#4e8fff] font-medium">
 {item.avatar}
 </div>
 <div>
 <div className="font-medium text-foreground text-[13px]">{item.author}</div>
 <div className="text-[11px] text-foreground-lighter">
 {item.role} · {item.company}
 </div>
 </div>
 </div>

 {/* Industry Tag */}
 <div className="mt-4 pt-4 border-t border-border/30">
 <span className="px-2 py-0.5 rounded-full bg-[#4e8fff]/10 text-[#4e8fff] text-[11px]">
 {item.industry}
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* CTA */}
 <section className="py-16 px-6">
 <div className="max-w-4xl mx-auto text-center">
 <h2 className="text-[15px] sm:text-2xl font-bold text-foreground mb-4">Joinhe'srow</h2>
 <p className="text-[13px] text-foreground-light mb-6">
 StartUsage AgentFlow, Experience AI Automation'slargepower
 </p>
 <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
 <Link href="/register">
 <Button size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90">
 FreeStartUsage
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </Link>
 <Link href="/case-studies">
 <Button size="lg" variant="outline" className="rounded-full border-border/50 text-foreground-light hover:text-foreground">
 ViewCase StudiesDetails
 </Button>
 </Link>
 </div>
 </div>
 </section>

 <SiteFooter />
 </div>
 );
}
