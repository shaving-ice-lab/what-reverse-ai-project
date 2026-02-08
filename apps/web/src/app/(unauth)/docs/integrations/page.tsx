"use client";

/**
 * IntegrationOverviewPage - LobeHub Style
 */

import { useState } from "react";
import Link from "next/link";
import {
 ChevronRight,
 Search,
 Plug,
 Globe,
 Database,
 Cloud,
 MessageSquare,
 Mail,
 Calendar,
 FileText,
 Code,
 Webhook,
 GitBranch,
 Box,
 Zap,
 CheckCircle,
 ArrowRight,
 Star,
 ExternalLink,
 Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

// Integration Categories
const categories = [
  { id: "all", name: "All", icon: Box },
  { id: "communication", name: "Communication", icon: MessageSquare },
  { id: "development", name: "Development", icon: Code },
  { id: "productivity", name: "Productivity", icon: Zap },
  { id: "storage", name: "Storage", icon: Database },
  { id: "custom", name: "Custom", icon: Webhook },
];

// Integration List
const integrations = [
 {
 id: "slack",
 name: "Slack",
    description: "Send messages, create channels, and handle interactive messages",
 category: "communication",
 icon: "🔔",
 color: "#4A154B",
 popular: true,
 docs: "/docs/integrations/slack",
    features: ["Message Notifications", "Slash Command", "Interactive Approval"],
 },
 {
 id: "github",
 name: "GitHub",
    description: "Automate code reviews, manage issues, and streamline deployment",
 category: "development",
 icon: "🐙",
 color: "#24292e",
 popular: true,
 docs: "/docs/integrations/github",
    features: ["Webhook Trigger", "PR Management", "Actions Integration"],
 },
 {
 id: "webhook",
 name: "Webhook",
 description: "Send and receive HTTP requests to connect with external services",
 category: "custom",
 icon: "🔗",
 color: "#4e8fff",
 popular: true,
 docs: "/docs/integrations/webhook",
    features: ["Custom Endpoint", "Request Verification", "Response Mapping"],
 },
 {
 id: "notion",
 name: "Notion",
    description: "Sync databases, create pages, and manage content",
 category: "productivity",
 icon: "📝",
 color: "#ffffff",
 popular: false,
 docs: "/docs/integrations/notion",
    features: ["Database Sync", "Page Creation", "Content Updates"],
 },
 {
 id: "google-sheets",
 name: "Google Sheets",
    description: "Read and write spreadsheet data",
 category: "productivity",
 icon: "📊",
 color: "#0F9D58",
 popular: false,
 docs: "/docs/integrations/google-sheets",
    features: ["Data Reading", "Batch Writing", "Formulas"],
 },
 {
 id: "gmail",
 name: "Gmail",
    description: "Send emails, process inbox, and set up auto-replies",
 category: "communication",
 icon: "📧",
 color: "#EA4335",
 popular: false,
 docs: "/docs/integrations/gmail",
    features: ["Send Email", "Inbox Trigger", "Attachment Processing"],
 },
 {
 id: "postgresql",
 name: "PostgreSQL",
    description: "Execute SQL queries and manage databases",
 category: "storage",
 icon: "🐘",
 color: "#336791",
 popular: false,
 docs: "/docs/integrations/postgresql",
    features: ["SQL Query", "Transactions", "Connection Management"],
 },
 {
 id: "mongodb",
 name: "MongoDB",
    description: "Document database operations and aggregate queries",
 category: "storage",
 icon: "🍃",
 color: "#47A248",
 popular: false,
 docs: "/docs/integrations/mongodb",
    features: ["CRUD Operations", "Aggregation Pipeline", "Index Management"],
 },
 {
 id: "aws-s3",
 name: "AWS S3",
    description: "Upload, download, and manage file storage",
 category: "storage",
 icon: "☁️",
 color: "#FF9900",
 popular: false,
 docs: "/docs/integrations/aws-s3",
    features: ["File Upload", "Presigned URLs", "Lifecycle Policies"],
 },
 {
 id: "openai",
 name: "OpenAI",
    description: "GPT model calls, text generation, and embedding vectors",
 category: "development",
 icon: "🤖",
 color: "#10A37F",
 popular: true,
 docs: "/docs/integrations/openai",
    features: ["Chat Completion", "Function Calling", "Vector Embedding"],
 },
 {
 id: "stripe",
 name: "Stripe",
    description: "Process payments, manage subscriptions, and generate invoices",
 category: "productivity",
 icon: "💳",
 color: "#635BFF",
 popular: false,
 docs: "/docs/integrations/stripe",
    features: ["Payment Processing", "Webhook", "Subscription Management"],
 },
 {
 id: "twilio",
 name: "Twilio",
    description: "Send SMS, voice calls, and WhatsApp messages",
 category: "communication",
 icon: "📱",
 color: "#F22F46",
 popular: false,
 docs: "/docs/integrations/twilio",
    features: ["SMS Sending", "Voice Calls", "WhatsApp"],
 },
];

export default function IntegrationsPage() {
 const [searchQuery, setSearchQuery] = useState("");
 const [selectedCategory, setSelectedCategory] = useState("all");

 // Filter Integrations
 const filteredIntegrations = integrations.filter((integration) => {
 const matchesSearch =
 integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 integration.description.toLowerCase().includes(searchQuery.toLowerCase());
 const matchesCategory =
 selectedCategory === "all" || integration.category === selectedCategory;
 return matchesSearch && matchesCategory;
 });

 const popularIntegrations = integrations.filter((i) => i.popular);

 return (
 <div className="min-h-screen bg-background">
 <SiteHeader />

 {/* Hero */}
 <section className="relative pt-32 sm:pt-40 pb-16 overflow-hidden">
 <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

 <div className="relative max-w-5xl mx-auto px-6">
 {/* Breadcrumb */}
 <nav className="flex items-center gap-2 text-[13px] text-foreground-lighter mb-8">
 <Link href="/docs" className="hover:text-foreground transition-colors">
 Docs
 </Link>
 <ChevronRight className="w-3.5 h-3.5" />
 <span className="text-foreground">Integrations</span>
 </nav>

 <div className="text-center max-w-3xl mx-auto">
 <div className="lobe-badge mb-8">
 <Plug className="h-3.5 w-3.5" />
            <span>Integration Center</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]">
            Integration Center
 </h1>

 <p className="text-lg text-foreground-light mb-10 leading-relaxed">
 Connect your tools and services to build powerful automation workflows
 </p>

 {/* Search */}
 <div className="relative max-w-xl mx-auto">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-lighter" />
 <Input
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search integrations..."
 className="h-12 pl-12 rounded-full bg-surface-100/50 border-border/30 text-foreground placeholder:text-foreground-lighter"
 />
 </div>

 {/* Stats */}
 <div className="flex items-center justify-center gap-8 mt-10">
 <div className="text-center">
 <div className="text-2xl font-bold text-foreground">{integrations.length}+</div>
              <div className="text-[12px] text-foreground-lighter">Integration Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">50k+</div>
              <div className="text-[12px] text-foreground-lighter">Active Connections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">99.9%</div>
              <div className="text-[12px] text-foreground-lighter">Availability</div>
 </div>
 </div>
 </div>
 </div>
 </section>

 <div className="max-w-6xl mx-auto px-6 py-16">
 {/* Popular Integrations */}
 <section className="mb-16">
 <h2 className="text-[15px] font-semibold text-foreground mb-6 flex items-center gap-2">
 <Star className="w-4 h-4 text-yellow-500" />
            Popular Integrations
 </h2>
 <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {popularIntegrations.map((integration) => (
 <Link
 key={integration.id}
 href={integration.docs}
 className={cn(
 "p-5 rounded-2xl group",
 "bg-surface-100/30 border border-border/30",
 "hover:bg-surface-100/60 hover:border-border/60",
 "transition-all duration-300"
 )}
 >
 <div className="flex items-center gap-3 mb-3">
 <div className="w-10 h-10 rounded-lg bg-surface-200/80 flex items-center justify-center text-xl">
 {integration.icon}
 </div>
 <div>
 <h3 className="text-[14px] font-semibold text-foreground group-hover:text-brand-500 transition-colors">
 {integration.name}
 </h3>
 </div>
 </div>
 <p className="text-[12px] text-foreground-lighter mb-3 leading-relaxed">
 {integration.description}
 </p>
 <div className="flex flex-wrap gap-1">
 {integration.features.slice(0, 2).map((feature) => (
 <span
 key={feature}
 className="px-2 py-0.5 rounded text-[11px] bg-surface-200/80 text-foreground-lighter"
 >
 {feature}
 </span>
 ))}
 </div>
 </Link>
 ))}
 </div>
 </section>

 {/* Category Filter */}
 <div className="flex flex-wrap gap-2 mb-6">
 {categories.map((category) => (
 <button
 key={category.id}
 onClick={() => setSelectedCategory(category.id)}
 className={cn(
 "flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-200",
 selectedCategory === category.id
 ? "bg-foreground text-background"
 : "bg-surface-100/50 border border-border/30 text-foreground-lighter hover:text-foreground hover:border-border/60"
 )}
 >
 <category.icon className="w-4 h-4" />
 {category.name}
 </button>
 ))}
 </div>

 {/* All Integrations */}
 <section>
 <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {filteredIntegrations.map((integration) => (
 <Link
 key={integration.id}
 href={integration.docs}
 className={cn(
 "p-5 rounded-2xl group",
 "bg-surface-100/30 border border-border/30",
 "hover:bg-surface-100/60 hover:border-border/60",
 "transition-all duration-300"
 )}
 >
 <div className="flex items-start gap-4">
 <div className="w-12 h-12 rounded-xl bg-surface-200/80 flex items-center justify-center text-2xl shrink-0">
 {integration.icon}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <h3 className="text-[14px] font-semibold text-foreground group-hover:text-brand-500 transition-colors">
 {integration.name}
 </h3>
 {integration.popular && (
 <Star className="w-3 h-3 text-yellow-500 fill-current" />
 )}
 </div>
 <p className="text-[12px] text-foreground-lighter mb-3 leading-relaxed">
 {integration.description}
 </p>
 <div className="flex flex-wrap gap-1">
 {integration.features.map((feature) => (
 <span
 key={feature}
 className="px-2 py-0.5 rounded text-[11px] bg-surface-200/80 text-foreground-lighter"
 >
 {feature}
 </span>
 ))}
 </div>
 </div>
 </div>
 </Link>
 ))}
 </div>

 {filteredIntegrations.length === 0 && (
 <div className="text-center py-16">
                <p className="text-foreground-lighter">No matching integrations found</p>
 </div>
 )}
 </section>

 {/* Custom Integration CTA */}
 <section className="mt-16">
 <div className={cn(
 "p-8 rounded-2xl",
 "bg-surface-100/30 border border-border/30"
 )}>
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
 <div className="flex items-start gap-4">
 <div className="w-14 h-14 rounded-xl bg-surface-200/80 border border-border/30 flex items-center justify-center shrink-0">
 <Webhook className="w-7 h-7 text-foreground-light" />
 </div>
 <div>
                  <h3 className="text-[15px] font-semibold text-foreground mb-2">
                    Can't find the integration you need?
                  </h3>
                  <p className="text-[13px] text-foreground-lighter max-w-lg leading-relaxed">
                    Use Custom Webhook or HTTP Request nodes to connect any API-supported service, 
                    or let us know what integration you need
 </p>
 </div>
 </div>
 <div className="flex flex-col sm:flex-row gap-3">
 <Link href="/docs/integrations/custom">
 <Button className="rounded-full text-[13px] font-medium bg-foreground text-background hover:bg-foreground/90">
 <Code className="w-4 h-4 mr-2" />
                    Create Custom Integration
 </Button>
 </Link>
 <Link href="/community/feature-requests">
 <Button variant="outline" className="rounded-full text-[13px] border-border/50 hover:bg-surface-200/50">
 <MessageSquare className="w-4 h-4 mr-2" />
                    Request New Integration
 </Button>
 </Link>
 </div>
 </div>
 </div>
 </section>
 </div>

 <SiteFooter />
 </div>
 );
}
