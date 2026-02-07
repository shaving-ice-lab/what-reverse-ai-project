"use client";

/**
 * PricingPage - LobeHub Style
 */

import { useState } from "react";
import Link from "next/link";
import {
 Check,
 X,
 Sparkles,
 ArrowRight,
 Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// PricingPlan
const plans = [
 {
 name: "Freeversion",
 description: "SuitablepersonUserandsmallitem",
 price: { monthly: 0, yearly: 0 },
 features: [
 { name: "5 Workflow", included: true },
 { name: "1,000 times/monthsExecute", included: true },
 { name: "Basic AI Model", included: true },
 { name: "CommunitySupport", included: true },
 { name: "7 daysExecuteHistory", included: true },
 { name: "TeamCollaboration", included: false },
 { name: "Custom Domain", included: false },
 { name: "PrioritySupport", included: false },
 ],
 cta: "FreeStart",
 href: "/register",
 popular: false,
 },
 {
 name: "Professionalversion",
 description: "SuitableProfessionalUserandGrowthTeam",
 price: { monthly: 99, yearly: 79 },
 features: [
 { name: "NonelimitWorkflow", included: true },
 { name: "50,000 times/monthsExecute", included: true },
 { name: "Advanced AI Model", included: true },
 { name: "EmailSupport", included: true },
 { name: "30 daysExecuteHistory", included: true },
 { name: "TeamCollaboration(5person)", included: true },
 { name: "Custom Domain", included: true },
 { name: "PrioritySupport", included: false },
 ],
 cta: "Startuse",
 href: "/register?plan=pro",
 popular: true,
 },
 {
 name: "Teamversion",
 description: "SuitableTeamandEnterprise",
 price: { monthly: 299, yearly: 249 },
 features: [
 { name: "NonelimitWorkflow", included: true },
 { name: "200,000 times/monthsExecute", included: true },
 { name: "allsection AI Model", included: true },
 { name: "PrioritySupport", included: true },
 { name: "1 yearsExecuteHistory", included: true },
 { name: "TeamCollaboration(20person)", included: true },
 { name: "Custom Domain", included: true },
 { name: "SSO Sign In", included: true },
 ],
 cta: "Startuse",
 href: "/register?plan=team",
 popular: false,
 },
 {
 name: "Enterprise",
 description: "SuitablelargeEnterpriseandCustomizeRequirements",
 price: { monthly: null, yearly: null },
 features: [
 { name: "NonelimitWorkflow", included: true },
 { name: "NonelimitExecutetimescount", included: true },
 { name: "allsection AI Model", included: true },
 { name: "ExclusiveCustomerSuccessManager", included: true },
 { name: "NonelimitExecuteHistory", included: true },
 { name: "NonelimitTeamMember", included: true },
 { name: "PrivateDeploy", included: true },
 { name: "SLA Assurance", included: true },
 ],
 cta: "ContactSales",
 href: "/contact?type=enterprise",
 popular: false,
 },
];

// FAQ
const faqs = [
 {
 question: "canwithFreeusePaidVersion??",
 answer: "is's, ProfessionalversionandTeamversionallProvide 14 daysFreeuse, NoneneedBinduse.",
 },
 {
 question: "ifwhatUpgradeorDowngradePlan?",
 answer: "youcanwithAnytimeatAccountSettingsUpgradeorDowngradePlan.UpgradeNowTake Effect, DowngradewillatCurrentBillingweeksEndafterTake Effect.",
 },
 {
 question: "SupportWhichPaymentmethod?",
 answer: "WeSupportuse, Payment, WeChatPayment, EnterpriseCustomerstillcanwithSelectfor.",
 },
 {
 question: "hasEducationorOrganizationDiscount??",
 answer: "is's, WeasEducationProvide 50% Discount, OrganizationcanEnjoy 30% Discount.PleaseContact UsFetchDetails.",
 },
];

export default function PricingPage() {
 const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
 const [openFAQ, setOpenFAQ] = useState<number | null>(null);

 return (
 <div className="min-h-screen bg-background">
 <SiteHeader />

 {/* Hero */}
 <section className="relative pt-32 sm:pt-40 pb-16 overflow-hidden">
 <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

 <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
 <div className="lobe-badge mb-8">
 <Sparkles className="h-3.5 w-3.5" />
 <span>SimpleTransparent'sPricing</span>
 </div>

 <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]">
 SelectSuitableyou'sPlan
 </h1>

 <p className="text-lg text-foreground-light max-w-2xl mx-auto mb-10 leading-relaxed">
 fromFreeversionStart, AnytimeUpgrade.AllPaidVersionallProvide 14 daysFreeuse.
 </p>

 {/* Billing Toggle */}
 <div className="inline-flex items-center gap-1 p-1 rounded-full bg-surface-100/50 border border-border/30">
 <button
 onClick={() => setBillingCycle("monthly")}
 className={cn(
 "px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-200",
 billingCycle === "monthly"
 ? "bg-foreground text-background"
 : "text-foreground-lighter hover:text-foreground-light"
 )}
 >
 months
 </button>
 <button
 onClick={() => setBillingCycle("yearly")}
 className={cn(
 "px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-200",
 billingCycle === "yearly"
 ? "bg-foreground text-background"
 : "text-foreground-lighter hover:text-foreground-light"
 )}
 >
 years
 <span className="ml-1.5 text-[11px] text-brand-500"> 20%</span>
 </button>
 </div>
 </div>
 </section>

 {/* Pricing Cards */}
 <section className="py-12 sm:py-16">
 <div className="max-w-6xl mx-auto px-6">
 <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
 {plans.map((plan) => (
 <div
 key={plan.name}
 className={cn(
 "relative p-6 rounded-2xl transition-all duration-300",
 plan.popular
 ? "bg-surface-100/60 border-2 border-foreground/20 shadow-lg shadow-white/5"
 : "bg-surface-100/30 border border-border/30 hover:border-border/60"
 )}
 >
 {plan.popular && (
 <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-foreground text-background text-[11px] font-medium">
 mostWelcome
 </div>
 )}

 <h3 className="text-[16px] font-semibold text-foreground mb-1">{plan.name}</h3>
 <p className="text-[12px] text-foreground-lighter mb-5">{plan.description}</p>

 <div className="mb-6">
 {plan.price.monthly !== null ? (
 <>
 <span className="text-3xl font-bold text-foreground tracking-tight">
 ¥{billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly}
 </span>
 <span className="text-foreground-lighter text-[13px]">/months</span>
 {billingCycle === "yearly" && plan.price.yearly > 0 && (
 <div className="text-[11px] text-brand-500 mt-1">
 yearsSave ¥{(plan.price.monthly - plan.price.yearly) * 12}
 </div>
 )}
 </>
 ) : (
 <span className="text-2xl font-bold text-foreground">Contact Us</span>
 )}
 </div>

 <Link href={plan.href} className="block mb-6">
 <Button
 className={cn(
 "w-full rounded-full h-10 text-[13px] font-medium transition-all duration-200",
 plan.popular
 ? "bg-foreground text-background hover:bg-foreground/90"
 : "bg-surface-200/50 text-foreground border border-border/30 hover:bg-surface-300/50"
 )}
 >
 {plan.cta}
 </Button>
 </Link>

 <ul className="space-y-2.5">
 {plan.features.map((feature) => (
 <li key={feature.name} className="flex items-center gap-2.5 text-[13px]">
 {feature.included ? (
 <Check className="w-3.5 h-3.5 text-foreground-light shrink-0" />
 ) : (
 <X className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
 )}
 <span className={feature.included ? "text-foreground-light" : "text-foreground-muted"}>
 {feature.name}
 </span>
 </li>
 ))}
 </ul>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* FAQ */}
 <section className="py-24 sm:py-32">
 <div className="max-w-3xl mx-auto px-6">
 <div className="text-center mb-16">
 <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">FAQ</h2>
 </div>
 <div className="space-y-2">
 {faqs.map((faq, idx) => (
 <div
 key={idx}
 className={cn(
 "rounded-xl border transition-all duration-200",
 openFAQ === idx
 ? "border-border/60 bg-surface-100/30"
 : "border-transparent hover:bg-surface-100/20"
 )}
 >
 <button
 onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
 className="w-full flex items-center justify-between px-6 py-5 text-left"
 >
 <span className="text-[15px] font-medium text-foreground pr-4">{faq.question}</span>
 <div className={cn(
 "shrink-0 w-6 h-6 rounded-full bg-surface-200/80 flex items-center justify-center transition-transform duration-200",
 openFAQ === idx && "rotate-45"
 )}>
 <Plus className="w-3.5 h-3.5 text-foreground-light" />
 </div>
 </button>
 {openFAQ === idx && (
 <div className="px-6 pb-5">
 <p className="text-[14px] text-foreground-lighter leading-relaxed">{faq.answer}</p>
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* CTA */}
 <section className="relative py-24 sm:py-32 overflow-hidden">
 <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
 <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
 <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">
 stillhasotherheIssue?
 </h2>
 <p className="text-foreground-light mb-8">
 Contact Us'sSalesTeam, FetchCustomizePlanandEnterprise-gradeResolvePlan
 </p>
 <Link href="/contact">
 <Button className="h-12 px-8 rounded-full text-[15px] border-border/50 bg-surface-200/50 text-foreground hover:bg-surface-300/50">
 ContactSales
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </Link>
 </div>
 </section>

 <SiteFooter />
 </div>
 );
}
