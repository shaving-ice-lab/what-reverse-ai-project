"use client";

/**
 * About Page - LobeHub Style
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
 Users,
 Target,
 Sparkles,
 Globe,
 ArrowRight,
 Building,
 Heart,
 Rocket,
 MapPin,
 Linkedin,
 Twitter,
 Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// Company Milestones
const milestones = [
 { year: "2023", event: "AgentFlow Founded" },
 { year: "2023", event: "Secured Seed Funding" },
 { year: "2024", event: "Product Officially Launched" },
 { year: "2024", event: "Reached 10,000 Users" },
 { year: "2025", event: "Secured Series A Funding" },
 { year: "2025", event: "Reached 50,000 Users" },
 { year: "2026", event: "AI Agent 2.0 Released" },
];

// Core Values
const values = [
 { icon: Target, title: "Mission Driven", description: "We empower everyone to easily use AI automation and unleash their creative potential." },
 { icon: Heart, title: "User First", description: "User success is our greatest achievement. We always put users first." },
 { icon: Sparkles, title: "Relentless Innovation", description: "We constantly exceed user expectations in product, technology, and service." },
 { icon: Globe, title: "Open Collaboration", description: "Open source, growing with the community to build better products together." },
];

// Team Members
const team = [
 { name: "Zhang Lei", role: "CEO & Co-Founder", bio: "Serial entrepreneur, former VP of Product, 10+ years of enterprise service experience", social: { linkedin: "#", twitter: "#" } },
 { name: "Li Hua", role: "CTO & Co-Founder", bio: "Former ByteDance tech expert, AI/ML domain specialist, active open source community contributor", social: { linkedin: "#", twitter: "#" } },
 { name: "Wang Fang", role: "CPO", bio: "Former Tencent product director, focused on enterprise-grade product design, UX expert", social: { linkedin: "#" } },
 { name: "Chen Wei", role: "VP of Engineering", bio: "Former Meituan tech lead, distributed systems expert, technology architect", social: { linkedin: "#" } },
];

// Investors
const investors = [
 { name: "Sequoia Capital China" },
 { name: "Hillhouse Ventures" },
 { name: "Source Code Capital" },
 { name: "Matrix Partners" },
];

// Statistics
const stats = [
 { value: "50K+", label: "Active Users" },
 { value: "100+", label: "Enterprise Customers" },
 { value: "50+", label: "Team Members" },
 { value: "3", label: "Global Offices" },
];

export default function AboutPage() {
 const [isLoaded, setIsLoaded] = useState(false);

 useEffect(() => {
 setIsLoaded(true);
 }, []);

 return (
 <div className="min-h-screen bg-background">
 <SiteHeader />

 {/* Hero Section */}
 <section className="relative pt-32 sm:pt-40 pb-20 overflow-hidden">
 <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

 <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
 <div className={cn(
 "lobe-badge mb-8 transition-all duration-500",
 isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
 )}>
 <Building className="h-3.5 w-3.5" />
 <span>About Us</span>
 </div>

 <h1 className={cn(
 "text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]",
 "transition-all duration-700 delay-100",
 isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
 )}>
 Making AI automation
 <br />
 <span className="gradient-text-brand">accessible to everyone</span>
 </h1>

 <p className={cn(
 "text-lg text-foreground-light max-w-2xl mx-auto leading-relaxed",
 "transition-all duration-700 delay-200",
 isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
 )}>
 Founded in 2023, AgentFlow empowers everyone to easily use AI automation technology and unleash their creative potential
 </p>
 </div>
 </section>

 {/* Stats */}
 <section className="py-16">
 <div className="max-w-4xl mx-auto px-6">
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 {stats.map((stat) => (
 <div key={stat.label} className="text-center p-6 rounded-2xl bg-surface-100/30 border border-border/30">
 <div className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-1">{stat.value}</div>
 <div className="text-[13px] text-foreground-lighter">{stat.label}</div>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Mission */}
 <section className="py-24 sm:py-32 bg-gradient-section">
 <div className="max-w-6xl mx-auto px-6">
 <div className="grid md:grid-cols-2 gap-16 items-center">
 <div>
 <div className="lobe-badge mb-6">
 <Target className="w-3.5 h-3.5" />
 <span>Our Vision</span>
 </div>
 <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-6 leading-tight">
 Less structure,
 <br />
 more intelligence.
 </h2>
 <p className="text-foreground-light mb-4 leading-relaxed">
 We believe everyone will have their own AI assistant to help handle daily repetitive tasks.
 AgentFlow is dedicated to building the most user-friendly AI workflow platform.
 </p>
 <p className="text-foreground-light leading-relaxed">
 With our visual workflow editor and smart AI agents, we help users quickly build automated workflows.
 No programming needed — anyone can implement complex business automation.
 </p>
 </div>
 <div className="flex items-center justify-center">
 <div className="w-full max-w-sm aspect-square bg-surface-100/30 rounded-3xl border border-border/30 flex items-center justify-center relative overflow-hidden">
 <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
 <Rocket className="w-20 h-20 text-foreground-muted" />
 </div>
 </div>
 </div>
 </div>
 </section>

 {/* Values */}
 <section className="py-24 sm:py-32">
 <div className="max-w-6xl mx-auto px-6">
 <div className="lobe-section-header">
 <h2>Core Values</h2>
 <p>These values guide every decision we make</p>
 </div>

 <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {values.map((value) => (
 <div
 key={value.title}
 className={cn(
 "p-6 rounded-2xl",
 "bg-surface-100/30 border border-border/30",
 "hover:bg-surface-100/60 hover:border-border/60",
 "transition-all duration-300"
 )}
 >
 <div className="w-10 h-10 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center mb-4">
 <value.icon className="w-5 h-5 text-foreground-light" />
 </div>
 <h3 className="text-[14px] font-semibold text-foreground mb-2">{value.title}</h3>
 <p className="text-[12px] text-foreground-lighter leading-relaxed">{value.description}</p>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Timeline */}
 <section className="py-24 sm:py-32 bg-gradient-section">
 <div className="max-w-4xl mx-auto px-6">
 <div className="lobe-section-header">
 <h2>Development</h2>
 <p>Our journey</p>
 </div>

 <div className="relative">
 <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/30 -translate-x-1/2 hidden md:block" />
 <div className="space-y-6">
 {milestones.map((milestone, index) => (
 <div
 key={index}
 className={cn(
 "relative flex items-center gap-6",
 index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
 )}
 >
 <div className={cn("flex-1", index % 2 === 0 ? "md:text-right" : "md:text-left")}>
 <div className="inline-block p-4 rounded-xl bg-surface-100/30 border border-border/30 hover:border-border/60 transition-colors">
 <div className="text-[11px] text-brand-500 font-medium mb-1 uppercase tracking-widest">{milestone.year}</div>
 <div className="text-foreground text-[14px] font-medium">{milestone.event}</div>
 </div>
 </div>
 <div className="hidden md:flex w-3 h-3 rounded-full bg-foreground/60 shrink-0 z-10" />
 <div className="flex-1 hidden md:block" />
 </div>
 ))}
 </div>
 </div>
 </div>
 </section>

 {/* Team */}
 <section className="py-24 sm:py-32">
 <div className="max-w-6xl mx-auto px-6">
 <div className="lobe-section-header">
 <h2>Core Team</h2>
 <p>The best talent from leading companies</p>
 </div>

 <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {team.map((member) => (
 <div
 key={member.name}
 className={cn(
 "p-6 rounded-2xl text-center",
 "bg-surface-100/30 border border-border/30",
 "hover:bg-surface-100/60 hover:border-border/60",
 "transition-all duration-300 group"
 )}
 >
 <div className="w-16 h-16 rounded-2xl bg-surface-200/50 border border-border/30 flex items-center justify-center mx-auto mb-4">
 <Users className="w-7 h-7 text-foreground-muted group-hover:text-foreground-lighter transition-colors" />
 </div>
 <h3 className="text-[14px] font-semibold text-foreground mb-0.5">{member.name}</h3>
 <div className="text-[12px] text-brand-500 mb-2">{member.role}</div>
 <p className="text-[11px] text-foreground-lighter mb-4 leading-relaxed">{member.bio}</p>
 <div className="flex items-center justify-center gap-2">
 {member.social.linkedin && (
 <a href={member.social.linkedin} className="w-7 h-7 rounded-lg bg-surface-200/50 flex items-center justify-center text-foreground-muted hover:text-foreground-light transition-all">
 <Linkedin className="w-3.5 h-3.5" />
 </a>
 )}
 {member.social.twitter && (
 <a href={member.social.twitter} className="w-7 h-7 rounded-lg bg-surface-200/50 flex items-center justify-center text-foreground-muted hover:text-foreground-light transition-all">
 <Twitter className="w-3.5 h-3.5" />
 </a>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Investors */}
 <section className="py-16 sm:py-20">
 <div className="max-w-4xl mx-auto px-6 text-center">
 <p className="text-[13px] text-foreground-muted uppercase tracking-widest font-medium mb-8">
 Backed By
 </p>
 <div className="flex flex-wrap items-center justify-center gap-4">
 {investors.map((investor) => (
 <div key={investor.name} className="px-6 py-3 rounded-full bg-surface-100/30 border border-border/30">
 <span className="text-foreground-lighter text-[14px] font-medium">{investor.name}</span>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Offices */}
 <section className="py-24 sm:py-32">
 <div className="max-w-4xl mx-auto px-6">
 <div className="lobe-section-header">
 <h2>Global Offices</h2>
 <p>Our locations</p>
 </div>

 <div className="grid sm:grid-cols-3 gap-4">
 {[
 { city: "Beijing", address: "Zhongguancun SOHO T1", type: "headquarters" },
 { city: "Shanghai", address: "Zhangjiang Hi-Tech Park", type: "branch" },
 { city: "Shenzhen", address: "Nanshan Science & Technology Park", type: "branch" },
 ].map((office) => (
 <div key={office.city} className="p-5 rounded-2xl bg-surface-100/30 border border-border/30 hover:border-border/60 transition-colors">
 <div className="flex items-center gap-2 mb-2">
 <div className="w-7 h-7 rounded-lg bg-surface-200/80 flex items-center justify-center">
 <MapPin className="w-3.5 h-3.5 text-foreground-light" />
 </div>
 <span className="font-semibold text-foreground text-[14px]">{office.city}</span>
 {office.type === "headquarters" && (
 <span className="px-2 py-0.5 rounded-full bg-surface-200/80 text-foreground-lighter text-[10px] font-medium">HQ</span>
 )}
 </div>
 <p className="text-[12px] text-foreground-lighter">{office.address}</p>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* CTA */}
 <section className="relative py-24 sm:py-32 overflow-hidden">
 <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
 <div className="max-w-2xl mx-auto px-6 text-center relative z-10">
 <div className="w-12 h-12 rounded-2xl bg-foreground flex items-center justify-center mx-auto mb-6">
 <Zap className="w-5 h-5 text-background" />
 </div>
 <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">Join our journey</h2>
 <p className="text-foreground-light mb-10">We&apos;re looking for the best talent to shape the future of automation together</p>
 <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
 <Link href="/careers">
 <Button className="h-12 px-8 bg-foreground hover:bg-foreground/90 text-background font-medium rounded-full">
 View Open Positions
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </Link>
 <Link href="/contact">
 <Button variant="outline" className="h-12 px-8 rounded-full border-border/50 hover:bg-surface-200/50">
 Contact Us
 </Button>
 </Link>
 </div>
 </div>
 </section>

 <SiteFooter />
 </div>
 );
}
