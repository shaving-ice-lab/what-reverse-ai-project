"use client";

/**
 * Help CenterPage - LobeHub Style
 */

import { useState } from "react";
import Link from "next/link";
import {
 Search,
 HelpCircle,
 BookOpen,
 LifeBuoy,
 Zap,
 Users,
 Settings,
 Shield,
 CreditCard,
 ArrowRight,
 ExternalLink,
 Mail,
 Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// HelpCategory
const categories = [
 {
 icon: Zap,
 title: "Getting StartedGuide",
 description: "QuickStartUsage AgentFlow",
 href: "/docs/getting-started",
 articles: 12,
 },
 {
 icon: BookOpen,
 title: "WorkflowManage",
 description: "Create, EditandRunWorkflow",
 href: "/docs/guide/workflows",
 articles: 25,
 },
 {
 icon: Settings,
 title: "IntegrationandConnect",
 description: "ConnectThird-partyServiceand API",
 href: "/docs/integrations",
 articles: 45,
 },
 {
 icon: Users,
 title: "TeamCollaboration",
 description: "ManageTeamMemberandPermission",
 href: "/docs/guide/team",
 articles: 8,
 },
 {
 icon: CreditCard,
 title: "BillingandSubscription",
 description: "Billing, InvoiceandSubscriptionManage",
 href: "/docs/billing",
 articles: 10,
 },
 {
 icon: Shield,
 title: "SecurityandPrivacy",
 description: "AccountSecurityandDataProtect",
 href: "/docs/security",
 articles: 15,
 },
];

// Help CenterDirectory
const helpDirectory = [
 {
 title: "Getting StartedandOverview",
 description: "from 0 to 1 onandMasterCoreConcept",
 links: [
 { title: "QuickStart", href: "/docs/getting-started" },
 { title: "FeaturesOverview", href: "/docs" },
 { title: "FAQ FAQ", href: "/faq" },
 ],
 },
 {
 title: "Fault",
 description: "RunandIntegrationIssue",
 links: [
 { title: "FaultGuide", href: "/help/troubleshooting" },
 { title: "RuntimeEntryDescription", href: "/docs" },
 { title: "AccessPolicyandRate Limiting", href: "/docs" },
 ],
 },
 {
 title: "SupportandCollaboration",
 description: "FetchSupportandTeamCollaborationmethod",
 links: [
 { title: "SubmitTicket", href: "/support" },
 { title: "Contact Us", href: "/contact" },
 { title: "CommunityDiscussion", href: "/community" },
 ],
 },
 {
 title: "SecurityandCompliance",
 description: "Security, PrivacyandOperationsAssurance",
 links: [
 { title: "Securitycenter", href: "/security" },
 { title: "Privacy Policy", href: "/privacy" },
 { title: "Terms of Service", href: "/terms" },
 ],
 },
];

// PopularArticle
const popularArticles = [
 { title: "ifwhatCreate#1Workflow", views: 12500, href: "/docs/guide/first-workflow" },
 { title: "Connect Slack SendNotifications", views: 8900, href: "/docs/integrations/slack" },
 { title: "SettingsScheduledTrigger", views: 7600, href: "/docs/guide/triggers" },
 { title: "InviteTeamMember", views: 5400, href: "/docs/guide/team" },
 { title: "Settings Webhook Trigger", views: 4800, href: "/docs/integrations/webhook" },
 { title: "FaultGuide", views: 4200, href: "/help/troubleshooting" },
];

// Contactmethod
const contactMethods = [
 {
 icon: LifeBuoy,
 title: "SubmitTicket",
 description: "SLA TrackandProcessProgresscanvisual",
 action: "SubmitTicket",
 href: "/support",
 },
 {
 icon: Mail,
 title: "SendEmail",
 description: "support@agentflow.ai",
 action: "SendEmail",
 href: "mailto:support@agentflow.ai",
 },
 {
 icon: Users,
 title: "CommunityForum",
 description: "andotherheUserExchange",
 action: "AccessCommunity",
 href: "/community",
 },
];

export default function HelpPage() {
 const [searchQuery, setSearchQuery] = useState("");

 return (
 <div className="min-h-screen bg-background">
 <SiteHeader />

 {/* Hero */}
 <section className="relative pt-32 sm:pt-40 pb-16 overflow-hidden">
 <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

 <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
 <div className="lobe-badge mb-8">
 <HelpCircle className="h-3.5 w-3.5" />
 <span>Help Center</span>
 </div>

 <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]">
 Help Center
 </h1>
 <p className="text-lg text-foreground-light max-w-2xl mx-auto mb-10 leading-relaxed">
 SearchFAQResolve, orBrowsedownmethodCategory
 </p>

 {/* Search */}
 <div className="max-w-xl mx-auto relative">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-lighter" />
 <Input
 placeholder="SearchHelpArticle..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-12 h-12 rounded-full bg-surface-100/50 border-border/30 text-foreground placeholder:text-foreground-lighter"
 />
 </div>
 </div>
 </section>

 {/* Categories */}
 <section className="py-24 sm:py-32">
 <div className="max-w-5xl mx-auto px-6">
 <div className="lobe-section-header">
 <h2>HelpCategory</h2>
 <p>byThemeQuicktoyouneedneed'sHelp</p>
 </div>

 <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {categories.map((category) => (
 <Link
 key={category.title}
 href={category.href}
 className={cn(
 "p-6 rounded-2xl group",
 "bg-surface-100/30 border border-border/30",
 "hover:bg-surface-100/60 hover:border-border/60",
 "transition-all duration-300"
 )}
 >
 <div className="w-12 h-12 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
 <category.icon className="w-6 h-6 text-foreground-light" />
 </div>
 <h3 className="text-[15px] font-semibold text-foreground mb-1 group-hover:text-brand-500 transition-colors">
 {category.title}
 </h3>
 <p className="text-[13px] text-foreground-lighter mb-2 leading-relaxed">
 {category.description}
 </p>
 <span className="text-[12px] text-brand-500">{category.articles} Article</span>
 </Link>
 ))}
 </div>
 </div>
 </section>

 {/* Directory */}
 <section className="py-24 sm:py-32 bg-gradient-section">
 <div className="max-w-5xl mx-auto px-6">
 <div className="lobe-section-header">
 <h2>Help CenterDirectory</h2>
 <p>byThemeBrowseComplete'sHelpMaterials</p>
 </div>

 <div className="grid md:grid-cols-2 gap-4">
 {helpDirectory.map((section) => (
 <div
 key={section.title}
 className={cn(
 "p-6 rounded-2xl",
 "bg-surface-100/30 border border-border/30"
 )}
 >
 <h3 className="text-[15px] font-semibold text-foreground mb-1">{section.title}</h3>
 <p className="text-[12px] text-foreground-lighter mb-4">
 {section.description}
 </p>
 <ul className="space-y-2">
 {section.links.map((link) => (
 <li key={link.href}>
 <Link
 href={link.href}
 className="flex items-center gap-2 text-[13px] text-foreground-lighter hover:text-foreground transition-colors"
 >
 <ExternalLink className="w-4 h-4" />
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
 <h2>PopularArticle</h2>
 <p>mostWelcome'sHelpArticle</p>
 </div>

 <div className="space-y-2">
 {popularArticles.map((article) => (
 <Link
 key={article.title}
 href={article.href}
 className={cn(
 "block p-5 rounded-xl group",
 "bg-surface-100/30 border border-border/30",
 "hover:bg-surface-100/60 hover:border-border/60",
 "transition-all duration-300"
 )}
 >
 <div className="flex items-center justify-between">
 <span className="text-[14px] text-foreground group-hover:text-brand-500 transition-colors">
 {article.title}
 </span>
 <div className="flex items-center gap-3">
 <span className="text-[11px] text-foreground-lighter">
 {article.views.toLocaleString()} timesView
 </span>
 <ArrowRight className="w-4 h-4 text-foreground-lighter group-hover:text-foreground-light transition-colors" />
 </div>
 </div>
 </Link>
 ))}
 </div>
 </div>
 </section>

 {/* Quick Links */}
 <section className="py-24 sm:py-32 bg-gradient-section">
 <div className="max-w-5xl mx-auto px-6">
 <div className="lobe-section-header">
 <h2>QuickLink</h2>
 <p>useResourceEntry</p>
 </div>

 <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
 {[
 { title: "API Document", href: "/docs/api", icon: "📚" },
 { title: "VideoTutorial", href: "/docs/tutorials", icon: "🎬" },
 { title: "FAQ Resolve", href: "/faq", icon: "❓" },
 { title: "Change Log", href: "/whats-new", icon: "📝" },
 ].map((link) => (
 <Link
 key={link.title}
 href={link.href}
 className={cn(
 "p-5 rounded-2xl text-center group",
 "bg-surface-100/30 border border-border/30",
 "hover:bg-surface-100/60 hover:border-border/60",
 "transition-all duration-300"
 )}
 >
 <span className="text-2xl mb-3 block">{link.icon}</span>
 <span className="text-[14px] text-foreground group-hover:text-brand-500 transition-colors">
 {link.title}
 </span>
 </Link>
 ))}
 </div>
 </div>
 </section>

 {/* Contact */}
 <section className="py-24 sm:py-32">
 <div className="max-w-4xl mx-auto px-6 text-center">
 <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">
 NotoAnswer?
 </h2>
 <p className="text-foreground-light mb-10">
 Contact Us'sSupportTeamFetchHelp
 </p>
 <div className="grid sm:grid-cols-3 gap-4">
 {contactMethods.map((method) => (
 <a
 key={method.title}
 href={method.href}
 className={cn(
 "p-6 rounded-2xl text-center group",
 "bg-surface-100/30 border border-border/30",
 "hover:bg-surface-100/60 hover:border-border/60",
 "transition-all duration-300"
 )}
 >
 <div className="w-12 h-12 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform duration-300">
 <method.icon className="w-6 h-6 text-foreground-light" />
 </div>
 <h3 className="text-[15px] font-semibold text-foreground mb-1">
 {method.title}
 </h3>
 <p className="text-[12px] text-foreground-lighter mb-3">
 {method.description}
 </p>
 <span className="text-[13px] text-brand-500 font-medium">
 {method.action} →
 </span>
 </a>
 ))}
 </div>
 </div>
 </section>

 <SiteFooter />
 </div>
 );
}
