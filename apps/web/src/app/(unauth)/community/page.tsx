"use client";

/**
 * CommunityPage - LobeHub Style
 */

import Link from "next/link";
import {
 Users,
 MessageSquare,
 Star,
 Heart,
 Github,
 Twitter,
 Calendar,
 ArrowRight,
 ExternalLink,
 Trophy,
 Code,
 BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// Community Statistics
const stats = [
 { icon: Users, value: "50K+", label: "Community Members" },
 { icon: Star, value: "1,000+", label: "Open Source Contributors" },
 { icon: MessageSquare, value: "10K+", label: "Discussions" },
 { icon: Heart, value: "5K+", label: "Shared Workflows" },
];

// Community Platforms
const platforms = [
 {
 icon: Github,
 name: "GitHub",
 description: "Participate in open source development",
 href: "https://github.com/agentflow",
 cta: "View Code",
 },
 {
 icon: MessageSquare,
 name: "Discord",
 description: "Join the real-time discussion community",
 href: "#",
 cta: "Join Discord",
 },
 {
 icon: Twitter,
 name: "Twitter",
 description: "Get the latest news and updates",
 href: "#",
 cta: "Follow Us",
 },
];

// Events
const events = [
 {
 title: "AgentFlow Monthly Sharing Session",
 date: "Third week of every month",
 description: "Community members share best practices and usage tips",
 type: "Online",
 },
 {
 title: "Developer Workshop",
 date: "Quarterly",
 description: "Learn advanced features and API development in depth",
 type: "In-Person",
 },
 {
 title: "Hackathon",
 date: "Annually",
 description: "48 hours of creative innovation and collaboration",
 type: "Online + In-Person",
 },
];

// Contributors
const contributors = [
 { name: "", avatar: "", contributions: 156, badge: "Core Maintainer" },
 { name: "Li Hua", avatar: "", contributions: 98, badge: "Top Contributor" },
 { name: "Wang Fang", avatar: "", contributions: 67, badge: "Active Member" },
 { name: "Chen Wei", avatar: "", contributions: 45, badge: "Active Member" },
];

// Resources
const resources = [
 {
 icon: BookOpen,
 title: "Community Tutorials",
 description: "Practical tutorials written by community members",
 href: "/docs/tutorials",
 },
 {
 icon: Code,
 title: "Example Code",
 description: "Open source workflow examples and templates",
 href: "/templates",
 },
 {
 icon: Trophy,
 title: "Contribution Guide",
 description: "Learn how to contribute to the project",
 href: "/docs/contributing",
 },
];

export default function CommunityPage() {
 return (
 <div className="min-h-screen bg-background">
 <SiteHeader />

 {/* Hero */}
 <section className="relative pt-32 sm:pt-40 pb-20 overflow-hidden">
 <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
 
 <div className="max-w-4xl mx-auto text-center relative z-10 px-6">
 <div className="lobe-badge mb-8">
 <Users className="h-3.5 w-3.5" />
 <span>Join Our Community</span>
 </div>

 <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]">
 AgentFlow Community
 </h1>

 <p className="text-lg text-foreground-light max-w-2xl mx-auto mb-10 leading-relaxed">
 Learn, share, and grow with 50,000+ developers and automation users
 </p>

 <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
 <Button size="lg" className="rounded-full bg-foreground hover:bg-foreground/90 text-background h-12 px-8">
 Join Discord
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 <Link href="https://github.com/agentflow" target="_blank">
 <Button size="lg" variant="outline" className="rounded-full border-border/50 hover:bg-surface-200/50 h-12 px-8">
 <Github className="mr-2 h-4 w-4" />
 GitHub
 </Button>
 </Link>
 </div>
 </div>
 </section>

 {/* Stats */}
 <section className="py-16 px-6">
 <div className="max-w-4xl mx-auto">
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {stats.map((stat) => (
 <div
 key={stat.label}
 className="text-center p-6 rounded-2xl bg-surface-100/30 border border-border/30"
 >
 <stat.icon className="w-8 h-8 text-foreground-light mx-auto mb-3" />
 <div className="text-2xl font-bold text-foreground mb-1">
 {stat.value}
 </div>
 <div className="text-[13px] text-foreground-lighter">{stat.label}</div>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Platforms */}
 <section className="py-20 px-6 bg-gradient-section">
 <div className="max-w-4xl mx-auto">
 <div className="lobe-section-header">
 <h2>Community Platforms</h2>
 <p>Join our community platforms</p>
 </div>
 <div className="grid md:grid-cols-3 gap-6">
 {platforms.map((platform) => (
 <a
 key={platform.name}
 href={platform.href}
 target="_blank"
 rel="noopener noreferrer"
 className={cn(
 "p-6 rounded-2xl text-center",
 "bg-surface-100/30 border border-border/30",
 "hover:bg-surface-100/60 hover:border-border/60",
 "transition-all duration-300 group"
 )}
 >
 <div className="w-14 h-14 rounded-2xl bg-surface-200/80 border border-border/30 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
 <platform.icon className="w-7 h-7 text-foreground-light" />
 </div>
 <h3 className="text-[14px] font-semibold text-foreground mb-2">
 {platform.name}
 </h3>
 <p className="text-[12px] text-foreground-lighter mb-4">
 {platform.description}
 </p>
 <span className="inline-flex items-center gap-1 text-[13px] text-brand-500 font-medium">
 {platform.cta}
 <ExternalLink className="w-3.5 h-3.5" />
 </span>
 </a>
 ))}
 </div>
 </div>
 </section>

 {/* Events */}
 <section className="py-24 sm:py-32 px-6">
 <div className="max-w-4xl mx-auto">
 <div className="lobe-section-header">
 <h2>Community Events</h2>
 <p>Connect with the community in person and online</p>
 </div>
 <div className="space-y-4">
 {events.map((event) => (
 <div
 key={event.title}
 className="p-6 rounded-2xl bg-surface-100/30 border border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-100/60 hover:border-border/60 transition-all duration-300"
 >
 <div className="flex items-start gap-4">
 <div className="w-12 h-12 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center shrink-0">
 <Calendar className="w-6 h-6 text-foreground-light" />
 </div>
 <div>
 <h3 className="text-[14px] font-semibold text-foreground mb-1">
 {event.title}
 </h3>
 <p className="text-[12px] text-foreground-lighter mb-1">
 {event.description}
 </p>
 <div className="flex items-center gap-3 text-[11px] text-foreground-muted">
 <span>{event.date}</span>
 <span className="px-2 py-0.5 rounded-full bg-surface-200/50 text-foreground-lighter">
 {event.type}
 </span>
 </div>
 </div>
 </div>
 <Button variant="outline" size="sm" className="shrink-0 rounded-full border-border/50 hover:bg-surface-200/50">
 Learn More
 </Button>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Contributors */}
 <section className="py-20 px-6 bg-gradient-section">
 <div className="max-w-4xl mx-auto">
 <div className="lobe-section-header">
 <h2>Top Contributors</h2>
 <p>Thank you to our amazing contributors</p>
 </div>
 <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
 {contributors.map((contributor) => (
 <div
 key={contributor.name}
 className={cn(
 "p-5 rounded-2xl text-center",
 "bg-surface-100/30 border border-border/30",
 "hover:bg-surface-100/60 hover:border-border/60",
 "transition-all duration-300"
 )}
 >
 <div className="w-14 h-14 rounded-full bg-surface-200/50 border border-border/30 flex items-center justify-center mx-auto mb-3 text-xl font-bold text-foreground-light">
 {contributor.avatar}
 </div>
 <h3 className="text-[14px] font-semibold text-foreground mb-1">
 {contributor.name}
 </h3>
 <div className="text-[11px] text-brand-500 mb-2">{contributor.badge}</div>
 <div className="text-[12px] text-foreground-lighter">
 {contributor.contributions} contributions
 </div>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Resources */}
 <section className="py-24 sm:py-32 px-6">
 <div className="max-w-4xl mx-auto">
 <div className="lobe-section-header">
 <h2>Community Resources</h2>
 <p>Helpful materials from the community</p>
 </div>
 <div className="grid md:grid-cols-3 gap-6">
 {resources.map((resource) => (
 <Link
 key={resource.title}
 href={resource.href}
 className={cn(
 "p-6 rounded-2xl",
 "bg-surface-100/30 border border-border/30",
 "hover:bg-surface-100/60 hover:border-border/60",
 "transition-all duration-300 group"
 )}
 >
 <div className="w-12 h-12 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
 <resource.icon className="w-6 h-6 text-foreground-light" />
 </div>
 <h3 className="text-[14px] font-semibold text-foreground mb-2 group-hover:text-foreground transition-colors">
 {resource.title}
 </h3>
 <p className="text-[12px] text-foreground-lighter">
 {resource.description}
 </p>
 </Link>
 ))}
 </div>
 </div>
 </section>

 {/* CTA */}
 <section className="relative py-24 sm:py-32 overflow-hidden">
 <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
 <div className="max-w-2xl mx-auto px-6 text-center relative z-10">
 <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">
 Start Your Community Journey
 </h2>
 <p className="text-foreground-light mb-10">
 Join us and build the future of automation with developers worldwide
 </p>
 <Button size="lg" className="rounded-full bg-foreground hover:bg-foreground/90 text-background h-12 px-8">
 Join the Community
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </div>
 </section>

 <SiteFooter />
 </div>
 );
}
