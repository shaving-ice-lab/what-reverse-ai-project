"use client";

/**
 * Getting StartedGuidePage - LobeHub Style
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

// LearnPath
const learningPaths = [
 {
 id: "beginner",
 title: "user",
 description: "fromStartLearn AgentFlow",
 duration: "1-2 h",
 level: "Getting Started",
 steps: [
 { title: "currentConcept", href: "/docs/concepts" },
 { title: "Create#1Workflow", href: "/docs/quickstart" },
 { title: "UsageTemplateQuickon", href: "/templates" },
 { title: "LearnNodeConfig", href: "/docs/guide/nodes" },
 ],
 },
 {
 id: "intermediate",
 title: "AdvancedUser",
 description: "enterLearnAdvancedFeatures",
 duration: "3-5 h",
 level: "",
 steps: [
 { title: "AI Agent Integration", href: "/docs/guide/ai-agent" },
 { title: "ConditionBranchandLoop", href: "/docs/guide/conditional" },
 { title: "ErrorProcess", href: "/docs/guide/error-handling" },
 { title: "VariableandExpression", href: "/docs/guide/variables" },
 ],
 },
 {
 id: "developer",
 title: "Developers",
 description: "API IntegrationandCustomDevelopment",
 duration: "5-8 h",
 level: "Advanced",
 steps: [
 { title: "API Document", href: "/docs/api" },
 { title: "SDK UsageGuide", href: "/docs/sdk" },
 { title: "CustomNodeDevelopment", href: "/docs/advanced/custom-nodes" },
 { title: "Webhook Integration", href: "/docs/integrations/webhook" },
 ],
 },
];

// CoreConcept
const coreConcepts = [
 {
 icon: Zap,
 title: "Workflow (Workflow)",
 description: "multipleNodegroup'sAutomationFlow, canwithProcessData, CallService, ExecuteLogic",
 },
 {
 icon: Layers,
 title: "Node (Node)",
 description: "Workflow'scurrentgroup, eachNodeExecuteSpecific'sTask",
 },
 {
 icon: Play,
 title: "Trigger (Trigger)",
 description: "LaunchWorkflowExecute'sCondition, ifScheduled, Webhook, ManualTriggeretc",
 },
 {
 icon: Code,
 title: "Expression (Expression)",
 description: "Used foratNodebetweenPassDataandProceedDynamicCalculate'sSyntax(SupportTemplateandVariable)",
 },
];

// RecommendedResource
const resources = [
 {
 icon: Video,
 title: "VideoTutorial",
 description: "FollowVideo1Learn",
 href: "/learn/courses",
 badge: "Recommended",
 },
 {
 icon: FileText,
 title: "UsageGuide",
 description: "Detailed'sFeaturesDescriptionDocument",
 href: "/docs",
 },
 {
 icon: Users,
 title: "CommunityDiscussion",
 description: "andotherheUserExchangeExperience",
 href: "/community",
 },
 {
 icon: HelpCircle,
 title: "FAQ",
 description: "QuicktoAnswer",
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
 Document
 </Link>
 <ChevronRight className="w-3.5 h-3.5" />
 <span className="text-foreground">Getting StartedGuide</span>
 </nav>

 <div className="text-center max-w-3xl mx-auto">
 <div className="lobe-badge mb-8">
 <BookOpen className="h-3.5 w-3.5" />
 <span>Getting StartedGuide</span>
 </div>

 <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]">
 WelcomeUsage AgentFlow
 </h1>

 <p className="text-lg text-foreground-light mb-10 leading-relaxed">
 NoneyouisuserstillisExperienceRich'sDevelopers, thisGuideallwillHelpyouQuickMaster AgentFlow
 andStartBuildlarge's AI Workflow
 </p>

 <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
 <Link href="/docs/quickstart">
 <Button className="h-12 px-8 rounded-full text-[15px] font-medium bg-foreground text-background hover:bg-foreground/90">
 <Rocket className="mr-2 w-4 h-4" />
 5 minQuickStart
 </Button>
 </Link>
 <Link href="/learn/courses">
 <Button variant="outline" className="h-12 px-8 rounded-full text-[15px] border-border/50 hover:bg-surface-200/50">
 <Video className="mr-2 w-4 h-4" />
 seeVideoTutorial
 </Button>
 </Link>
 </div>
 </div>
 </div>
 </section>

 {/* LearnPath */}
 <section className="py-24 sm:py-32 bg-gradient-section">
 <div className="max-w-6xl mx-auto px-6">
 <div className="lobe-section-header">
 <h2>Selectyou'sLearnPath</h2>
 <p>Based onyou'sExperienceHorizontalSelectmostSuitable'sLearnPath</p>
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
 StartLearn
 <ArrowRight className="ml-2 w-4 h-4" />
 </Button>
 </Link>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* CoreConcept */}
 <section className="py-24 sm:py-32">
 <div className="max-w-6xl mx-auto px-6">
 <div className="lobe-section-header">
 <h2>CoreConcept</h2>
 <p> AgentFlow 'scurrentConcept, asafterLearndownBasic</p>
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
 moremultipleConcept
 <ArrowRight className="ml-2 w-4 h-4" />
 </Button>
 </Link>
 </div>
 </div>
 </section>

 {/* RecommendedResource */}
 <section className="py-24 sm:py-32 bg-gradient-section">
 <div className="max-w-6xl mx-auto px-6">
 <div className="lobe-section-header">
 <h2>RecommendedResource</h2>
 <p>moremultipleLearnMaterialsyouQuickGrowth</p>
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
 PrepareStart??
 </h2>
 <p className="text-foreground-light mb-10 max-w-md mx-auto">
 NowCreateyou's#1 AI Workflow, ExperienceAutomation'slargepower
 </p>
 <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
 <Link href="/register">
 <Button className="h-12 px-8 rounded-full text-[15px] font-medium bg-foreground text-background hover:bg-foreground/90">
 FreeSign Up
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </Link>
 <Link href="/docs/quickstart">
 <Button variant="outline" className="h-12 px-8 rounded-full text-[15px] border-border/50 hover:bg-surface-200/50">
 ViewQuickStart
 </Button>
 </Link>
 </div>
 </div>
 </section>

 <SiteFooter />
 </div>
 );
}
