"use client";

/**
 * Getting Started Guide Page - LobeHub Style
 */

import Link from "next/link";
import {
 BookOpen,
 ChevronRight,
 ArrowRight,
 Play,
 Zap,
 Layers,
 Code,
 Settings,
 Users,
 CheckCircle,
 Rocket,
 Video,
 FileText,
 HelpCircle,
 Star,
 Clock,
 Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// Learning Paths
const learningPaths = [
 {
 id: "beginner",
    title: "Beginner",
    description: "Learn AgentFlow from scratch",
 duration: "1-2 h",
 level: "Getting Started",
 steps: [
      { title: "Core Concepts", href: "/docs/concepts" },
      { title: "Create Your First Workflow", href: "/docs/quickstart" },
      { title: "Quick Start with Templates", href: "/templates" },
      { title: "Learn Node Configuration", href: "/docs/guide/nodes" },
 ],
 },
 {
 id: "intermediate",
    title: "Intermediate User",
    description: "Dive deeper into advanced features",
 duration: "3-5 h",
 level: "",
 steps: [
 { title: "AI Agent Integration", href: "/docs/guide/ai-agent" },
      { title: "Conditional Branches and Loops", href: "/docs/guide/conditional" },
      { title: "Error Handling", href: "/docs/guide/error-handling" },
      { title: "Variables and Expressions", href: "/docs/guide/variables" },
 ],
 },
 {
 id: "developer",
 title: "Developers",
    description: "API integration and custom development",
 duration: "5-8 h",
 level: "Advanced",
 steps: [
      { title: "API Documentation", href: "/docs/api" },
      { title: "SDK Usage Guide", href: "/docs/sdk" },
      { title: "Custom Node Development", href: "/docs/advanced/custom-nodes" },
 { title: "Webhook Integration", href: "/docs/integrations/webhook" },
 ],
 },
];

// Core Concepts
const coreConcepts = [
 {
 icon: Zap,
 title: "Workflow",
    description: "An automation flow composed of multiple nodes that can process data, call services, and execute logic",
 },
 {
 icon: Layers,
 title: "Node",
    description: "The basic building blocks of a workflow — each node performs a specific task",
 },
 {
 icon: Play,
 title: "Trigger",
    description: "Conditions that start workflow execution, such as scheduled, webhook, or manual triggers",
 },
 {
 icon: Code,
 title: "Expression",
    description: "Syntax for passing data between nodes and performing dynamic calculations (supports templates and variables)",
 },
];

// Recommended Resources
const resources = [
 {
 icon: Video,
    title: "Video Tutorials",
    description: "Learn step by step with video guides",
 href: "/learn/courses",
 badge: "Recommended",
 },
 {
 icon: FileText,
    title: "User Guide",
    description: "Detailed feature documentation",
 href: "/docs",
 },
 {
 icon: Users,
    title: "Community Discussion",
    description: "Exchange experiences with other users",
 href: "/community",
 },
 {
 icon: HelpCircle,
 title: "FAQ",
    description: "Quick answers to common questions",
 href: "/faq",
 },
];

export default function GettingStartedPage() {
 return (
 <div className="min-h-screen bg-background">
 <SiteHeader />

 {/* Hero Section */}
 <section className="relative pt-32 sm:pt-40 pb-16 overflow-hidden">
 <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

 <div className="max-w-5xl mx-auto px-6 relative z-10">
 {/* Breadcrumb */}
 <nav className="flex items-center gap-2 text-[13px] text-foreground-lighter mb-8">
 <Link href="/docs" className="hover:text-foreground transition-colors">
 Docs
 </Link>
 <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground">Getting Started Guide</span>
 </nav>

 <div className="text-center max-w-3xl mx-auto">
 <div className="lobe-badge mb-8">
 <BookOpen className="h-3.5 w-3.5" />
            <span>Getting Started Guide</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]">
            Welcome to AgentFlow
          </h1>

          <p className="text-lg text-foreground-light mb-10 leading-relaxed">
            Whether you're a beginner or an experienced developer, this guide will help you quickly master AgentFlow
            and start building powerful AI workflows
 </p>

 <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
 <Link href="/docs/quickstart">
 <Button className="h-12 px-8 rounded-full text-[15px] font-medium bg-foreground text-background hover:bg-foreground/90">
 <Rocket className="mr-2 w-4 h-4" />
            5-Minute Quick Start
 </Button>
 </Link>
 <Link href="/learn/courses">
 <Button variant="outline" className="h-12 px-8 rounded-full text-[15px] border-border/50 hover:bg-surface-200/50">
 <Video className="mr-2 w-4 h-4" />
            Watch Video Tutorials
 </Button>
 </Link>
 </div>
 </div>
 </div>
 </section>

 {/* Learning Paths */}
 <section className="py-24 sm:py-32 bg-gradient-section">
 <div className="max-w-6xl mx-auto px-6">
 <div className="lobe-section-header">
 <h2>Choose Your Learning Path</h2>
 <p>Select the best learning path based on your experience level</p>
 </div>

 <div className="grid md:grid-cols-3 gap-4">
 {learningPaths.map((path) => (
 <div
 key={path.id}
 className={cn(
 "p-6 rounded-2xl",
 "bg-surface-100/30 border border-border/30",
 "hover:bg-surface-100/60 hover:border-border/60",
 "transition-all duration-300"
 )}
 >
 <div className="flex items-center gap-3 mb-4">
 <div className="w-10 h-10 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center">
 <Star className="w-5 h-5 text-foreground-light" />
 </div>
 <div>
 <h3 className="text-[15px] font-semibold text-foreground">{path.title}</h3>
 <div className="flex items-center gap-2 text-[11px] text-foreground-lighter">
 <Clock className="w-3 h-3" />
 {path.duration}
 <span className="px-1.5 py-0.5 rounded bg-surface-200/80 text-foreground-lighter">
 {path.level}
 </span>
 </div>
 </div>
 </div>

 <p className="text-[13px] text-foreground-lighter mb-4 leading-relaxed">
 {path.description}
 </p>

 <ul className="space-y-2 mb-6">
 {path.steps.map((step, index) => (
 <li key={step.title}>
 <Link
 href={step.href}
 className="flex items-center gap-2 text-[13px] text-foreground-lighter hover:text-foreground transition-colors"
 >
 <span className="w-5 h-5 rounded-full bg-surface-200/80 flex items-center justify-center text-[11px] text-foreground-lighter shrink-0">
 {index + 1}
 </span>
 {step.title}
 </Link>
 </li>
 ))}
 </ul>

 <Link href={`/learn/path/${path.id}`}>
 <Button
 variant="outline"
 className="w-full rounded-full text-[13px] border-border/50 hover:bg-surface-200/50"
 >
                  Start Learning
 <ArrowRight className="ml-2 w-4 h-4" />
 </Button>
 </Link>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Core Concepts */}
 <section className="py-24 sm:py-32">
 <div className="max-w-6xl mx-auto px-6">
 <div className="lobe-section-header">
              <h2>Core Concepts</h2>
              <p>Understand AgentFlow's core concepts as a foundation for further learning</p>
 </div>

 <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {coreConcepts.map((concept) => (
 <div
 key={concept.title}
 className={cn(
 "p-5 rounded-2xl",
 "bg-surface-100/30 border border-border/30",
 "hover:bg-surface-100/60 hover:border-border/60",
 "transition-all duration-300"
 )}
 >
 <div className="w-10 h-10 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center mb-4">
 <concept.icon className="w-5 h-5 text-foreground-light" />
 </div>
 <h3 className="text-[14px] font-semibold text-foreground mb-2">
 {concept.title}
 </h3>
 <p className="text-[12px] text-foreground-lighter leading-relaxed">
 {concept.description}
 </p>
 </div>
 ))}
 </div>

 <div className="text-center mt-10">
 <Link href="/docs/concepts">
 <Button variant="outline" className="rounded-full text-[13px] border-border/50 hover:bg-surface-200/50">
                  View All Concepts
 <ArrowRight className="ml-2 w-4 h-4" />
 </Button>
 </Link>
 </div>
 </div>
 </section>

 {/* Recommended Resources */}
 <section className="py-24 sm:py-32 bg-gradient-section">
 <div className="max-w-6xl mx-auto px-6">
 <div className="lobe-section-header">
              <h2>Recommended Resources</h2>
              <p>More learning materials to help you grow quickly</p>
 </div>

 <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {resources.map((resource) => (
 <Link
 key={resource.title}
 href={resource.href}
 className={cn(
 "group flex items-start gap-4 p-5 rounded-2xl",
 "bg-surface-100/30 border border-border/30",
 "hover:bg-surface-100/60 hover:border-border/60",
 "transition-all duration-300"
 )}
 >
 <div className="w-10 h-10 rounded-lg bg-surface-200/80 border border-border/30 flex items-center justify-center shrink-0">
 <resource.icon className="w-5 h-5 text-foreground-light" />
 </div>
 <div className="flex-1">
 <div className="flex items-center gap-2">
 <h3 className="text-[14px] font-medium text-foreground group-hover:text-brand-500 transition-colors">
 {resource.title}
 </h3>
 {resource.badge && (
 <span className="lobe-badge text-[11px]">
 {resource.badge}
 </span>
 )}
 </div>
 <p className="text-[12px] text-foreground-lighter leading-relaxed">
 {resource.description}
 </p>
 </div>
 </Link>
 ))}
 </div>
 </div>
 </section>

 {/* CTA */}
 <section className="relative py-24 sm:py-32 overflow-hidden">
 <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
 <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
 <div className="w-16 h-16 rounded-2xl bg-surface-200/80 border border-border/30 flex items-center justify-center mx-auto mb-6">
 <Rocket className="w-8 h-8 text-foreground-light" />
 </div>
 <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">
            Ready to Get Started?
 </h2>
 <p className="text-foreground-light mb-10 max-w-md mx-auto">
 Create your first AI workflow now and experience the power of automation
 </p>
 <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
 <Link href="/register">
 <Button className="h-12 px-8 rounded-full text-[15px] font-medium bg-foreground text-background hover:bg-foreground/90">
            Sign Up Free
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </Link>
 <Link href="/docs/quickstart">
 <Button variant="outline" className="h-12 px-8 rounded-full text-[15px] border-border/50 hover:bg-surface-200/50">
            View Quick Start
 </Button>
 </Link>
 </div>
 </div>
 </section>

 <SiteFooter />
 </div>
 );
}
