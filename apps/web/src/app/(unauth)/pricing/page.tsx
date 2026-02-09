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

// Pricing Plan
const plans = [
 {
 name: "Free",
 description: "For individual users and small projects",
 price: { monthly: 0, yearly: 0 },
 features: [
 { name: "5 Workflows", included: true },
 { name: "1,000 executions/month", included: true },
 { name: "Basic AI Model", included: true },
 { name: "Community Support", included: true },
 { name: "7-day execution history", included: true },
 { name: "Team Collaboration", included: false },
 { name: "Custom Domain", included: false },
 { name: "Priority Support", included: false },
 ],
 cta: "Get Started Free",
 href: "/register",
 popular: false,
 },
 {
 name: "Professional",
 description: "For professional users and growing teams",
 price: { monthly: 99, yearly: 79 },
 features: [
 { name: "Unlimited Workflows", included: true },
 { name: "50,000 executions/month", included: true },
 { name: "Advanced AI Model", included: true },
 { name: "Email Support", included: true },
 { name: "30-day execution history", included: true },
 { name: "Team Collaboration (5 members)", included: true },
 { name: "Custom Domain", included: true },
 { name: "Priority Support", included: false },
 ],
 cta: "Start Free Trial",
 href: "/register?plan=pro",
 popular: true,
 },
 {
 name: "Team",
 description: "For teams and businesses",
 price: { monthly: 299, yearly: 249 },
 features: [
 { name: "Unlimited Workflows", included: true },
 { name: "200,000 executions/month", included: true },
 { name: "All AI Models", included: true },
 { name: "Priority Support", included: true },
 { name: "1-year execution history", included: true },
 { name: "Team Collaboration (20 members)", included: true },
 { name: "Custom Domain", included: true },
 { name: "SSO Sign In", included: true },
 ],
 cta: "Start Free Trial",
 href: "/register?plan=team",
 popular: false,
 },
 {
 name: "Enterprise",
 description: "For large enterprises with custom requirements",
 price: { monthly: null, yearly: null },
 features: [
 { name: "Unlimited Workflows", included: true },
 { name: "Unlimited Executions", included: true },
 { name: "All AI Models", included: true },
 { name: "Dedicated Customer Success Manager", included: true },
 { name: "Unlimited Execution History", included: true },
 { name: "Unlimited Team Members", included: true },
 { name: "Private Deployment", included: true },
 { name: "SLA Assurance", included: true },
 ],
 cta: "Contact Sales",
 href: "/contact?type=enterprise",
 popular: false,
 },
];

// FAQ
const faqs = [
 {
 question: "Can I try paid plans for free?",
 answer: "Yes! Both the Professional and Team plans offer a 14-day free trial with no credit card required.",
 },
 {
 question: "How do I upgrade or downgrade my plan?",
 answer: "You can upgrade or downgrade your plan at any time in your Account Settings. Upgrades take effect immediately, while downgrades take effect at the end of the current billing cycle.",
 },
 {
 question: "What payment methods are supported?",
 answer: "We support credit cards, Alipay, WeChat Pay, and bank transfers for enterprise customers.",
 },
 {
 question: "Are there education or nonprofit discounts?",
 answer: "Yes! We offer a 50% discount for educational institutions and a 30% discount for nonprofits. Please contact us for details.",
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
 <span>Simple, Transparent Pricing</span>
 </div>

 <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]">
 Choose the Right Plan for You
 </h1>

 <p className="text-lg text-foreground-light max-w-2xl mx-auto mb-10 leading-relaxed">
 Start with the free plan and upgrade anytime. All paid plans include a 14-day free trial.
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
 Monthly
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
 Yearly
 <span className="ml-1.5 text-[11px] text-brand-500">Save 20%</span>
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
 Most Popular
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
 <span className="text-foreground-lighter text-[13px]">/month</span>
 {billingCycle === "yearly" && plan.price.yearly > 0 && (
 <div className="text-[11px] text-brand-500 mt-1">
 Save ¥{(plan.price.monthly - plan.price.yearly) * 12}/year
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
 Still have questions?
 </h2>
 <p className="text-foreground-light mb-8">
 Contact our sales team for custom plans and enterprise solutions
 </p>
 <Link href="/contact">
 <Button className="h-12 px-8 rounded-full text-[15px] border-border/50 bg-surface-200/50 text-foreground hover:bg-surface-300/50">
 Contact Sales
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </Link>
 </div>
 </section>

 <SiteFooter />
 </div>
 );
}
