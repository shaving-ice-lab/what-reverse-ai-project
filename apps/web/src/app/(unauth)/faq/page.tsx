"use client";

/**
 * FAQPage - LobeHub Style
 */

import { useState } from "react";
import Link from "next/link";
import {
 HelpCircle,
 Search,
 Plus,
 Zap,
 CreditCard,
 Shield,
 Settings,
 Users,
 MessageSquare,
 AlertTriangle,
 ArrowRight,
 Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// FAQ Category
const categories = [
 { id: "all", name: "All", icon: HelpCircle },
 { id: "getting-started", name: "Getting Started", icon: Zap },
 { id: "billing", name: "Billing & Subscription", icon: CreditCard },
 { id: "security", name: "Security & Privacy", icon: Shield },
 { id: "technical", name: "Technical Issues", icon: Settings },
 { id: "troubleshooting", name: "Troubleshooting", icon: AlertTriangle },
];

// FAQ Data
const faqs = [
 {
 category: "getting-started",
 question: "What is AgentFlow?",
 answer: "AgentFlow is an AI-driven workflow automation platform that helps users quickly build, deploy, and manage automated workflows through a visual editor and smart AI agents. No programming required — you can implement complex business automation right away.",
 },
 {
 category: "getting-started",
 question: "How do I start using AgentFlow?",
 answer: "Getting started is easy: 1. Sign up for a free account; 2. Choose a template from the Template Marketplace or create a workflow from scratch; 3. Use the visual editor to configure workflow nodes; 4. Set trigger conditions and activate your workflow. We also provide detailed documentation and video tutorials to help you get started quickly.",
 },
 {
 category: "getting-started",
 question: "Do I need programming skills?",
 answer: "Not at all. AgentFlow provides a visual drag-and-drop editor so you can create complex workflows without writing any code. However, if you have programming experience, you can use our API and SDK for more advanced customization.",
 },
 {
 category: "billing",
 question: "Can I try it for free?",
 answer: "Yes! Both the Professional and Team plans offer a 14-day free trial with no credit card required. During the trial you can experience all paid features. After the trial ends, you can choose to subscribe to a paid plan or downgrade to the free version.",
 },
 {
 category: "billing",
 question: "What payment methods do you support?",
 answer: "We support multiple payment methods: credit cards (Visa, MasterCard, American Express), Alipay, WeChat Pay, and bank transfers (for enterprise customers). All payments are processed through secure third-party payment platforms.",
 },
 {
 category: "billing",
 question: "How do I cancel my subscription?",
 answer: "You can cancel your subscription at any time with no cancellation fees. After cancellation, your paid features will remain active until the end of the current billing cycle, and your account will automatically downgrade to the free plan. Your data will be retained — if you need it deleted, please contact us.",
 },
 {
 category: "security",
 question: "How is data security ensured?",
 answer: "Data security is our top priority. We implement multiple security measures: all data transfers use TLS encryption, sensitive data is stored with AES-256 encryption, SOC 2 Type II certification, GDPR compliance, regular security audits and penetration testing, and strict internal access controls.",
 },
 {
 category: "security",
 question: "Where is data stored?",
 answer: "Our data centers are located in China, using Alibaba Cloud and Tencent Cloud infrastructure. For enterprise customers with special compliance requirements, we offer private deployment options where data can be stored on your own servers.",
 },
 {
 category: "technical",
 question: "What integrations are supported?",
 answer: "We support 100+ integrations with major services, including: Messaging (Slack, Feishu, DingTalk, WeChat), Project Management (Notion, Asana, Jira, Linear), Development Tools (GitHub, GitLab, Vercel), Databases (MySQL, PostgreSQL, MongoDB), AI Services (OpenAI, Anthropic, Qwen). We also support custom Webhook and API integrations.",
 },
 {
 category: "technical",
 question: "Are there API rate limits?",
 answer: "Yes, each plan has different API rate limits: Free plan — 100 requests/min, Professional — 500 requests/min, Team — 2,000 requests/min, Enterprise — custom limits. If you need higher limits, please contact our sales team.",
 },
 {
 category: "troubleshooting",
 question: "What should I do when a workflow execution fails?",
 answer: "We recommend first checking the execution log for the failed node and error details, confirming that input parameters are not missing or in an invalid format, and then checking the target app's access policies and quotas. If needed, try reducing concurrency or enabling retry to shorten recovery time.",
 },
 {
 category: "troubleshooting",
 question: "Why isn't my Webhook receiving event callbacks?",
 answer: "Please confirm your Webhook URL is accessible and not blocked by a firewall, verify that the signing key and event type are correctly configured, and try using a test event to trigger it. You can also check the logs for callback failure reasons.",
 },
 {
 category: "troubleshooting",
 question: "How do I handle rate limiting or timeout errors?",
 answer: "First check whether your request rate exceeds your current plan's quota. If needed, adjust your rate limit policy or upgrade your plan. You can also reduce concurrency or enable automatic retry to handle timeout issues.",
 },
 {
 category: "troubleshooting",
 question: "How do I submit a ticket and track the response SLA?",
 answer: "Go to the Support Center to submit a ticket. The system will automatically assign a priority tier and corresponding response SLA. You can view the estimated response time and current status directly in your ticket.",
 },
];

export default function FAQPage() {
 const [searchQuery, setSearchQuery] = useState("");
 const [activeCategory, setActiveCategory] = useState("all");
 const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

 const filteredFaqs = faqs.filter((faq) => {
 const matchesSearch =
 faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
 faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
 const matchesCategory =
 activeCategory === "all" || faq.category === activeCategory;
 return matchesSearch && matchesCategory;
 });

 return (
 <div className="min-h-screen bg-background">
 <SiteHeader />

 {/* Hero */}
 <section className="relative pt-32 sm:pt-40 pb-16 overflow-hidden">
 <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

 <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
 <div className="lobe-badge mb-8">
 <HelpCircle className="h-3.5 w-3.5" />
 <span>FAQ</span>
 </div>

 <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]">
 FAQ
 </h1>
 <p className="text-lg text-foreground-light max-w-2xl mx-auto mb-10 leading-relaxed">
 Quickly find the answers you need
 </p>

 {/* Search */}
 <div className="max-w-xl mx-auto relative">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-lighter" />
 <Input
 placeholder="Search questions..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-12 h-12 rounded-full bg-surface-100/50 border-border/30 text-foreground placeholder:text-foreground-lighter"
 />
 </div>
 </div>
 </section>

 {/* Categories */}
 <section className="py-8 px-6">
 <div className="max-w-3xl mx-auto">
 <div className="flex flex-wrap justify-center gap-2">
 {categories.map((category) => (
 <button
 key={category.id}
 onClick={() => setActiveCategory(category.id)}
 className={cn(
 "flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-200",
 activeCategory === category.id
 ? "bg-foreground text-background"
 : "bg-surface-100/50 border border-border/30 text-foreground-lighter hover:text-foreground hover:border-border/60"
 )}
 >
 <category.icon className="w-4 h-4" />
 {category.name}
 </button>
 ))}
 </div>
 </div>
 </section>

 {/* FAQ List */}
 <section className="py-16 sm:py-24 px-6">
 <div className="max-w-3xl mx-auto">
 {filteredFaqs.length === 0 ? (
 <div className="text-center py-16">
 <HelpCircle className="w-12 h-12 text-foreground-lighter mx-auto mb-4" />
 <h3 className="text-[15px] font-medium text-foreground mb-2">
 No matching questions found
 </h3>
 <p className="text-[13px] text-foreground-lighter">
 Try searching with different keywords
 </p>
 </div>
 ) : (
 <div className="space-y-2">
 {filteredFaqs.map((faq, index) => (
 <div
 key={index}
 className={cn(
 "rounded-xl border transition-all duration-200",
 expandedIndex === index
 ? "border-border/60 bg-surface-100/30"
 : "border-transparent hover:bg-surface-100/20"
 )}
 >
 <button
 onClick={() =>
 setExpandedIndex(expandedIndex === index ? null : index)
 }
 className="w-full flex items-center justify-between px-6 py-5 text-left"
 >
 <span className="text-[15px] font-medium text-foreground pr-4">
 {faq.question}
 </span>
 <div className={cn(
 "shrink-0 w-6 h-6 rounded-full bg-surface-200/80 flex items-center justify-center transition-transform duration-200",
 expandedIndex === index && "rotate-45"
 )}>
 <Plus className="w-3.5 h-3.5 text-foreground-light" />
 </div>
 </button>
 {expandedIndex === index && (
 <div className="px-6 pb-5">
 <p className="text-[14px] text-foreground-lighter leading-relaxed">
 {faq.answer}
 </p>
 </div>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 </section>

 {/* Help CTA */}
 <section className="relative py-24 sm:py-32 overflow-hidden">
 <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
 <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
 <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">
 Still have questions?
 </h2>
 <p className="text-foreground-light mb-8">
 Contact our support team for help
 </p>
 <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
 <Link href="/contact">
 <Button className="h-12 px-8 rounded-full text-[15px] font-medium bg-foreground text-background hover:bg-foreground/90">
 <MessageSquare className="w-4 h-4 mr-2" />
 Contact Support
 </Button>
 </Link>
 <Link href="/docs">
 <Button variant="outline" className="h-12 px-8 rounded-full text-[15px] border-border/50 hover:bg-surface-200/50">
 View Documentation
 </Button>
 </Link>
 </div>
 </div>
 </section>

 <SiteFooter />
 </div>
 );
}
