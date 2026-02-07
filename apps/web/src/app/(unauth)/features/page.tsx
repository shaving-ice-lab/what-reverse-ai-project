"use client";

/**
 * FeaturesIntroductionPage - LobeHub Style
 */

import Link from "next/link";
import {
 Bot,
 GitBranch,
 Puzzle,
 Layers,
 Shield,
 Globe,
 Zap,
 Clock,
 Users,
 Code,
 Sparkles,
 ArrowRight,
 CheckCircle,
 Database,
 Lock,
 Settings,
 BarChart3,
 MessageSquare,
 Repeat,
 Terminal,
 Webhook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// CoreFeatures
const coreFeatures = [
 {
 icon: Bot,
 title: "Smart AI Agent",
 description: "Based on GPT-4, Claude 3 etclargeLanguageModel'sSmartAgent, canUnderstandComplexRequirementsandAutoExecutemultipleStepTask.",
 highlights: ["NaturalLanguageInteractive", "ContextUnderstand", "mainDecisionExecute"],
 },
 {
 icon: GitBranch,
 title: "canvisualWorkflowEdit",
 description: "'sDrag & DropEdit, letyouNoneneedWriteCodenowcanBuildComplex'sAutomationFlow.",
 highlights: ["Drag & DropAction", "Real-timePreview", "VersionControl"],
 },
 {
 icon: Puzzle,
 title: "100+ IntegrationService",
 description: "andmain SaaS Service, Database, API NoneIntegration, you'sAllWorkTool.",
 highlights: ["1keyConnect", "OAuth Authentication", "CustomIntegration"],
 },
 {
 icon: Layers,
 title: "TemplateMarketplace",
 description: "count1000pastVerify'sWorkflowTemplate, CoverageIndustryScenario, 1keyDeploynowcanUsage.",
 highlights: ["CommunityContribution", "methodAuthentication", "ContinuousUpdate"],
 },
 {
 icon: Shield,
 title: "Enterprise-gradeSecurity",
 description: "SOC 2 Type II Authentication, endpointtoendpointEncrypt, Improve'sPermissionManageandAudit Log.",
 highlights: ["DataEncrypt", "RolePermission", "Audit Log"],
 },
 {
 icon: Globe,
 title: "allDeploy",
 description: "multipleRegionDatacenterDeploy, EnsureLatencyAccessand 99.99% 'sServiceAvailable.",
 highlights: ["multipleRegionDeploy", "Auto", "Restore"],
 },
];

// AdvancedFeatures
const advancedFeatures = [
 { icon: Repeat, title: "Multi-Agent Collaboration", description: "multiple AI Agent Work, ProcessComplex'smultipleStepTask" },
 { icon: Terminal, title: "CustomCodeNode", description: "Usage JavaScript/Python CreateCustomLogicNode" },
 { icon: Webhook, title: "Webhook Trigger", description: "Flexible's Webhook Support, EasyforoutsidesectionSystem" },
 { icon: Database, title: "DataConvert", description: "large'sDataMappingandConvertcanpower, ProcessFormatData" },
 { icon: BarChart3, title: "ExecuteAnalytics", description: "Detailed'sExecuteLogsandcanAnalytics, optimalWorkflowrate" },
 { icon: Clock, title: "ScheduledSchedule", description: "Flexible's Cron ExpressionSupport, PreciseControlExecuteTime" },
 { icon: Users, title: "TeamCollaboration", description: "multiplepersonReal-timeCollaborationEdit, ShareWorkflowandTemplate" },
 { icon: Lock, title: "SensitiveDataProtect", description: "CredentialsEncryptStorage, SupportEnvironmentVariableandKeyManage" },
];

// AI canpower
const aiCapabilities = [
 { title: "NaturalLanguageProcess", description: "UnderstandandProcesstypeLanguageTask, IncludeTextAnalytics, SentimentAnalytics, EntityExtractetc", icon: MessageSquare },
 { title: "SmartDecision", description: "Based onContextAutodoDecision, Selectmostoptimal'sExecutePath", icon: Sparkles },
 { title: "CodeGenerate", description: "AutoGenerateCodeFragment, HelpDevelopersEfficientrate", icon: Code },
 { title: "DataAnalytics", description: "SmartAnalyticsData, GenerateInsightsReport", icon: BarChart3 },
];

export default function FeaturesPage() {
 return (
 <div className="min-h-screen bg-background">
 <SiteHeader />

 {/* Hero Section */}
 <section className="relative pt-32 sm:pt-40 pb-20 overflow-hidden">
 <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

 <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
 <div className="lobe-badge mb-8">
 <Sparkles className="h-3.5 w-3.5" />
 <span>largeFeatures, Nonelimitcancan</span>
 </div>

 <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]">
 asModernTeamBuild's
 <br />
 <span className="gradient-text-brand">AI AutomationPlatform</span>
 </h1>

 <p className="text-lg text-foreground-light max-w-2xl mx-auto mb-10 leading-relaxed">
 AgentFlow Provide1AutomationResolvePlan, fromSimple'sTaskAutomationtoComplex'sEnterprise-gradeWorkflow, Satisfyyou's1Requirements.
 </p>

 <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
 <Link href="/register">
 <Button className="h-12 px-8 rounded-full text-[15px] font-medium bg-foreground text-background hover:bg-foreground/90">
 FreeStartUsage
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </Link>
 <Link href="/demo">
 <Button variant="outline" className="h-12 px-8 rounded-full text-[15px] border-border/50 hover:bg-surface-200/50">
 seeDemo
 </Button>
 </Link>
 </div>
 </div>
 </section>

 {/* Core Features */}
 <section className="py-24 sm:py-32">
 <div className="max-w-6xl mx-auto px-6">
 <div className="lobe-section-header">
 <h2>CoreFeatures</h2>
 <p>largeandFlexible'sFeaturesgroup, youBuildwhatAutomationScenario</p>
 </div>

 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
 {coreFeatures.map((feature) => (
 <div
 key={feature.title}
 className={cn(
 "group p-6 rounded-2xl",
 "bg-surface-100/30 border border-border/30",
 "hover:bg-surface-100/60 hover:border-border/60",
 "transition-all duration-300"
 )}
 >
 <div className="w-10 h-10 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
 <feature.icon className="w-5 h-5 text-foreground-light" />
 </div>

 <h3 className="text-[15px] font-semibold text-foreground mb-2">{feature.title}</h3>
 <p className="text-[13px] text-foreground-lighter mb-4 leading-relaxed">{feature.description}</p>

 <ul className="space-y-2">
 {feature.highlights.map((highlight) => (
 <li key={highlight} className="flex items-center gap-2 text-[12px] text-foreground-lighter">
 <CheckCircle className="w-3.5 h-3.5 text-foreground-light" />
 {highlight}
 </li>
 ))}
 </ul>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* AI Capabilities */}
 <section className="py-24 sm:py-32 bg-gradient-section">
 <div className="max-w-6xl mx-auto px-6">
 <div className="grid lg:grid-cols-2 gap-16 items-center">
 <div>
 <div className="lobe-badge mb-6">
 <Bot className="h-3.5 w-3.5" />
 <span>AI Driven</span>
 </div>
 <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4">
 large's AI canpower
 </h2>
 <p className="text-foreground-light mb-8 leading-relaxed">
 infirst'spersonSmartcanpower, letyou'sWorkflowmoreSmartandEfficient.SupportmultipletypelargeLanguageModel, Include GPT-4, Claude 3, Tongyi1000etc.
 </p>

 <div className="grid sm:grid-cols-2 gap-3">
 {aiCapabilities.map((capability) => (
 <div key={capability.title} className="flex items-start gap-3 p-4 rounded-xl bg-surface-100/30 border border-border/30">
 <div className="w-9 h-9 rounded-lg bg-surface-200/80 flex items-center justify-center shrink-0">
 <capability.icon className="w-4 h-4 text-foreground-light" />
 </div>
 <div>
 <h4 className="text-[13px] font-medium text-foreground mb-1">{capability.title}</h4>
 <p className="text-[12px] text-foreground-lighter leading-relaxed">{capability.description}</p>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* AI Demo Visual */}
 <div className="relative">
 <div className="rounded-2xl border border-border/30 bg-surface-100/30 p-8">
 <div className="flex items-center gap-3 mb-6">
 <div className="w-10 h-10 rounded-xl bg-surface-200/80 flex items-center justify-center">
 <Bot className="w-5 h-5 text-foreground-light" />
 </div>
 <div>
 <h4 className="text-[14px] font-semibold text-foreground">AI Agent</h4>
 <p className="text-[12px] text-foreground-lighter">ProcessingTask...</p>
 </div>
 </div>

 <div className="space-y-4">
 <div className="p-4 rounded-xl bg-surface-200/30 border border-border/20">
 <p className="text-[11px] text-foreground-lighter mb-2 uppercase tracking-widest font-medium">Input</p>
 <p className="text-[14px] text-foreground">&quot;AnalyticsthisSalesReport, keyTrend&quot;</p>
 </div>
 <div className="p-4 rounded-xl bg-brand-200/30 border border-brand-300/30">
 <p className="text-[11px] text-brand-500 mb-2 uppercase tracking-widest font-medium">AI Output</p>
 <p className="text-[13px] text-foreground-light leading-relaxed">
 Based onAnalytics, currentQuarterSalesGrowth 23%, mainneednewProductlineContribution.Suggestionre-FollowmethodRegion'sGrowthpower...
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </section>

 {/* Advanced Features */}
 <section className="py-24 sm:py-32">
 <div className="max-w-6xl mx-auto px-6">
 <div className="lobe-section-header">
 <h2>moremultipleAdvancedFeatures</h2>
 <p>SatisfyProfessionalUserandEnterprise-gradeRequirements'sAdvanced</p>
 </div>

 <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {advancedFeatures.map((feature) => (
 <div
 key={feature.title}
 className={cn(
 "p-5 rounded-2xl",
 "bg-surface-100/30 border border-border/30",
 "hover:bg-surface-100/60 hover:border-border/60",
 "transition-all duration-300"
 )}
 >
 <div className="w-9 h-9 rounded-lg bg-surface-200/80 flex items-center justify-center mb-4">
 <feature.icon className="w-4 h-4 text-foreground-light" />
 </div>
 <h3 className="text-[14px] font-semibold text-foreground mb-2">{feature.title}</h3>
 <p className="text-[12px] text-foreground-lighter leading-relaxed">{feature.description}</p>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* CTA Section */}
 <section className="relative py-24 sm:py-32 overflow-hidden">
 <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
 <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
 <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4">
 PrepareExperience??
 </h2>
 <p className="text-foreground-light mb-10">
 FreeStartUsage AgentFlow, Explore AI Automation'sNonelimitcancan
 </p>
 <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
 <Link href="/register">
 <Button className="h-12 px-8 rounded-full text-[15px] font-medium bg-foreground text-background hover:bg-foreground/90">
 FreeStartUsage
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </Link>
 <Link href="/pricing">
 <Button variant="outline" className="h-12 px-8 rounded-full text-[15px] border-border/50 hover:bg-surface-200/50">
 ViewPricing
 </Button>
 </Link>
 </div>
 </div>
 </section>

 <SiteFooter />
 </div>
 );
}
