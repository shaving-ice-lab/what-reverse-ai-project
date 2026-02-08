"use client";

/**
 * DocumentHome - LobeHub Style
 */

import Link from "next/link";
import {
 BookOpen,
 Code,
 Rocket,
 Puzzle,
 Settings,
 Shield,
 FileText,
 Video,
 MessageSquare,
 Search,
 ArrowRight,
 Zap,
 Users,
 Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// Quick Getting Started
const quickLinks = [
 {
 icon: Rocket,
 title: "5-Minute Quick Start",
 description: "Create your first workflow from scratch",
 href: "/docs/getting-started",
 },
 {
 icon: BookOpen,
    title: "Core Concepts",
    description: "Workflows, nodes, triggers, and other core concepts",
 href: "/docs/concepts",
 },
 {
 icon: Video,
    title: "Video Tutorials",
    description: "Quickly master usage tips through video tutorials",
 href: "/docs/tutorials",
 },
];

// Document Categories
const categories = [
 {
    title: "User Guide",
    icon: BookOpen,
    description: "Learn how to use AgentFlow",
    links: [
      { title: "Create Workflows", href: "/docs/guide/workflows" },
      { title: "Using AI Agents", href: "/docs/guide/agents" },
      { title: "Set Up Triggers", href: "/docs/guide/triggers" },
      { title: "Data Processing", href: "/docs/guide/data" },
    ],
 },
 {
    title: "Integration Guide",
    icon: Puzzle,
    description: "Connect third-party services",
    links: [
      { title: "Slack Integration", href: "/docs/integrations/slack" },
      { title: "GitHub Integration", href: "/docs/integrations/github" },
      { title: "Database Connection", href: "/docs/integrations/database" },
      { title: "Custom Webhook", href: "/docs/integrations/webhook" },
    ],
 },
 {
 title: "API Reference",
 icon: Code,
    description: "Complete API documentation",
 links: [
 { title: "REST API", href: "/docs/api/rest" },
 { title: "Workflow API", href: "/docs/api/workflows" },
 { title: "Agent API", href: "/docs/api/agents" },
 { title: "Webhook API", href: "/docs/api/webhooks" },
 ],
 },
 {
    title: "Advanced Topics",
    icon: Settings,
    description: "Explore advanced features",
    links: [
      { title: "Custom Nodes", href: "/docs/advanced/custom-nodes" },
      { title: "Performance Optimization", href: "/docs/advanced/performance" },
      { title: "Error Handling", href: "/docs/advanced/error-handling" },
      { title: "Self-Hosted Deployment", href: "/docs/advanced/self-hosted" },
    ],
 },
];

// Popular Articles
const popularArticles = [
  { title: "How to Create Your First AI Workflow", href: "/docs/guide/first-workflow" },
  { title: "Integration Configuration Guide", href: "/docs/integrations/guide" },
  { title: "Workflow Performance Optimization Tips", href: "/docs/advanced/performance" },
  { title: "API Authentication and Authorization", href: "/docs/api/authentication" },
];

export default function DocsPage() {
 return (
 <div className="min-h-screen bg-background">
 <SiteHeader />

 {/* Hero */}
 <section className="relative pt-32 sm:pt-40 pb-16 overflow-hidden">
 <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

 <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
 <div className="lobe-badge mb-8">
 <BookOpen className="h-3.5 w-3.5" />
            <span>Documentation</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]">
            Documentation Center
          </h1>
          <p className="text-lg text-foreground-light max-w-2xl mx-auto mb-10 leading-relaxed">
            From beginner to expert, find all the resources you need here
 </p>

 {/* Search */}
 <div className="max-w-xl mx-auto relative">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-lighter" />
 <Input
 placeholder="Search documentation..."
 className="pl-12 h-12 rounded-full bg-surface-100/50 border-border/30 text-foreground placeholder:text-foreground-lighter"
 />
 </div>
 </div>
 </section>

 {/* Quick Links */}
 <section className="py-24 sm:py-32">
 <div className="max-w-5xl mx-auto px-6">
 <div className="lobe-section-header">
              <h2>Quick Start</h2>
              <p>The fastest way to start using AgentFlow</p>
 </div>

 <div className="grid md:grid-cols-3 gap-4">
 {quickLinks.map((link) => (
 <Link
 key={link.title}
 href={link.href}
 className={cn(
 "group p-6 rounded-2xl",
 "bg-surface-100/30 border border-border/30",
 "hover:bg-surface-100/60 hover:border-border/60",
 "transition-all duration-300"
 )}
 >
 <div className="w-10 h-10 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
 <link.icon className="w-5 h-5 text-foreground-light" />
 </div>
 <h3 className="text-[15px] font-semibold text-foreground mb-2 group-hover:text-brand-500 transition-colors">
 {link.title}
 </h3>
 <p className="text-[13px] text-foreground-lighter leading-relaxed">
 {link.description}
 </p>
 </Link>
 ))}
 </div>
 </div>
 </section>

 {/* Categories */}
 <section className="py-24 sm:py-32 bg-gradient-section">
 <div className="max-w-5xl mx-auto px-6">
 <div className="lobe-section-header">
              <h2>Documentation Categories</h2>
              <p>Browse complete documentation by topic</p>
 </div>

 <div className="grid md:grid-cols-2 gap-4">
 {categories.map((category) => (
 <div
 key={category.title}
 className={cn(
 "p-6 rounded-2xl",
 "bg-surface-100/30 border border-border/30",
 "hover:bg-surface-100/60 hover:border-border/60",
 "transition-all duration-300"
 )}
 >
 <div className="flex items-center gap-3 mb-4">
 <div className="w-10 h-10 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center">
 <category.icon className="w-5 h-5 text-foreground-light" />
 </div>
 <div>
 <h3 className="text-[15px] font-semibold text-foreground">
 {category.title}
 </h3>
 <p className="text-[12px] text-foreground-lighter">
 {category.description}
 </p>
 </div>
 </div>
 <ul className="space-y-2">
 {category.links.map((link) => (
 <li key={link.title}>
 <Link
 href={link.href}
 className="flex items-center gap-2 text-[13px] text-foreground-lighter hover:text-foreground transition-colors"
 >
 <FileText className="w-4 h-4" />
 {link.title}
 </Link>
 </li>
 ))}
 </ul>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Popular Articles */}
 <section className="py-24 sm:py-32">
 <div className="max-w-5xl mx-auto px-6">
 <div className="lobe-section-header">
              <h2>Popular Articles</h2>
              <p>Most popular documentation content</p>
 </div>

 <div className="grid sm:grid-cols-2 gap-4">
 {popularArticles.map((article) => (
 <Link
 key={article.title}
 href={article.href}
 className={cn(
 "p-5 rounded-2xl group",
 "bg-surface-100/30 border border-border/30",
 "hover:bg-surface-100/60 hover:border-border/60",
 "transition-all duration-300"
 )}
 >
 <div className="flex items-center justify-between">
 <span className="text-[14px] text-foreground group-hover:text-brand-500 transition-colors">
 {article.title}
 </span>
 <ArrowRight className="w-4 h-4 text-foreground-lighter group-hover:text-foreground-light transition-colors" />
 </div>
 </Link>
 ))}
 </div>
 </div>
 </section>

 {/* Help CTA */}
 <section className="relative py-24 sm:py-32 overflow-hidden">
 <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
 <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
 <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">
            Need More Help?
          </h2>
          <p className="text-foreground-light mb-8">
            Join our community or contact the support team
 </p>
 <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
 <Link href="/community">
 <Button variant="outline" className="h-12 px-8 rounded-full text-[15px] border-border/50 hover:bg-surface-200/50">
 <Users className="w-4 h-4 mr-2" />
              Join Community
 </Button>
 </Link>
 <Link href="/contact">
 <Button variant="outline" className="h-12 px-8 rounded-full text-[15px] border-border/50 hover:bg-surface-200/50">
 <MessageSquare className="w-4 h-4 mr-2" />
              Contact Support
 </Button>
 </Link>
 </div>
 </div>
 </section>

 <SiteFooter />
 </div>
 );
}
