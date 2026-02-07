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
 { id: "all", name: "allsection", icon: HelpCircle },
 { id: "getting-started", name: "Getting StartedUsage", icon: Zap },
 { id: "billing", name: "BillingandSubscription", icon: CreditCard },
 { id: "security", name: "SecurityandPrivacy", icon: Shield },
 { id: "technical", name: "TechnologyIssue", icon: Settings },
 { id: "troubleshooting", name: "Fault", icon: AlertTriangle },
];

// FAQ Data
const faqs = [
 {
 category: "getting-started",
 question: "Whatis AgentFlow?",
 answer: "AgentFlow is1 AI Driven'sWorkflowAutomationPlatform, HelpUserViacanvisualEditandSmart AI Agent QuickBuild, DeployandManageAutomationWorkflow.NoneneedProgramming, nowcanImplementComplex'sBusinessAutomation.",
 },
 {
 category: "getting-started",
 question: "ifwhatStartUsage AgentFlow?",
 answer: "StartUsageVerySimple: 1. Sign UpFreeAccount; 2. atTemplateMarketplaceSelect1Template, orfromStartCreateWorkflow; 3. UsagecanvisualEditConfigWorkflowNode; 4. SettingsTriggerConditionandActivateWorkflow.WestillProvideDetailed'sDocumentandVideoTutorialHelpyouQuickon.",
 },
 {
 category: "getting-started",
 question: "needneedProgramming??",
 answer: "notneedneed.AgentFlow Providecanvisual'sDrag & DropEdit, NoneneedWritewhatCodenowcanCreateComplex'sWorkflow., ifresultyouhasProgrammingBackground, canwithUsageWe's API and SDK ProceedmoreAdvanced'sCustomize.",
 },
 {
 category: "billing",
 question: "canwithFreeuse??",
 answer: "is's!ProfessionalversionandTeamversionallProvide 14 daysFreeuse, NoneneedBinduse.usebetweenyoucanwithExperienceAllPaidFeatures.useEndafter, youcanwithSelectSubscriptionPaidVersionorDowngradetoFreeversion.",
 },
 {
 category: "billing",
 question: "SupportWhichPaymentmethod?",
 answer: "WeSupportmultipletypePaymentmethod: use(Visa, MasterCard, American Express), Payment, WeChatPayment, Enterprisefor(EnterpriseCustomer).AllPaymentViaSecurity'sThird-partyPaymentPlatformProcess.",
 },
 {
 category: "billing",
 question: "ifwhatUnsubscribe?",
 answer: "youcanwithAnytimeUnsubscribe, NoneneedPaymentwhatCancelCost.Cancelafter, you'sPaidFeatureswillatCurrentBillingweeksEndafterStop, AccountwillAutoDowngradetoFreeVersion.you'sDatawillbyRetain, ifneedDeletePleaseContact Us.",
 },
 {
 category: "security",
 question: "DataSecurityifwhatAssurance?",
 answer: "DataSecurityisWe'sneedTask.WemultipleSecurityMeasure: AllDataTransferUsage TLS Encrypt, SensitiveDataUsage AES-256 EncryptStorage, SOC 2 Type II Authentication, GDPR Compliance, PeriodicSecurityAuditandPenetrationTest, Strict'sInternalAccessControl.",
 },
 {
 category: "security",
 question: "DataStorageatin?",
 answer: "We'sDatacenteratin, UsageinandTencent Cloud'sBasicInfrastructure.forathasSpecialComplianceneed'sEnterpriseCustomer, WeProvidePrivateDeployOption, DatacanwithStorageatyouSelf'sServiceon.",
 },
 {
 category: "technical",
 question: "SupportWhichIntegration?",
 answer: "WeSupport 100+ mainService'sIntegration, Include: Newsletter(Slack, Feishu, DingTalk, WeChat), itemManage(Notion, Asana, Jira, Linear), DevelopmentTool(GitHub, GitLab, Vercel), Database(MySQL, PostgreSQL, MongoDB), AI Service(OpenAI, Anthropic, Tongyi1000).stillSupportCustom Webhook and API Integration.",
 },
 {
 category: "technical",
 question: "has API Limit??",
 answer: "is's, notVersionhasnot's API Limit: Freeversion 100 times/min, Professionalversion 500 times/min, Teamversion 2000 times/min, EnterpriseCustomLimit.ifresultyouneedneedmore'sLimit, PleaseContact Us'sSalesTeam.",
 },
 {
 category: "troubleshooting",
 question: "WorkflowExecuteFailedifwhatQuick?",
 answer: "SuggestionfirstViewExecuteRecord'sFailedNodeandErrorInfo, ConfirmInputParameterisnoMissingorInvalid format, againCheckTargetApp'sAccessPolicyandQuota.needtimeReduceConcurrencyorEnableRetrywithShortenRestoreTime.",
 },
 {
 category: "troubleshooting",
 question: "Webhook nottoEventCallback?",
 answer: "Please confirm Webhook URL canAccessandnot yetbyFirewallIntercept, forBioKeyandEventTypeisnoMatch, againUsageTestEventTrigger.alsocanatLogsViewCallbackFailedReason.",
 },
 {
 category: "troubleshooting",
 question: "RuntimeTipRate LimitingorTimeoutifwhatProcess?",
 answer: "PriorityCheckAccessrateisnoExceedCurrentPlanQuota, needtimeAdjust rate_limit PolicyorUpgradePlan.timecanfewConcurrencyorEnableRetrycomeTimeout.",
 },
 {
 category: "troubleshooting",
 question: "ifwhatSubmitTicketandTrackResponse SLA?",
 answer: "EnterSupportcenterSubmitTicket, SystemwillAutoTierandtoResponse SLA.youcanwithatTicketViewEstimatedResponse TimeandCurrentStatus.",
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
 Quicktoyouneedneed'sAnswer
 </p>

 {/* Search */}
 <div className="max-w-xl mx-auto relative">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-lighter" />
 <Input
 placeholder="SearchIssue..."
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
 NotoRelatedIssue
 </h3>
 <p className="text-[13px] text-foreground-lighter">
 TryUsageotherheKeywordsSearch
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
 stillhasotherheIssue?
 </h2>
 <p className="text-foreground-light mb-8">
 Contact Us'sSupportTeamFetchHelp
 </p>
 <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
 <Link href="/contact">
 <Button className="h-12 px-8 rounded-full text-[15px] font-medium bg-foreground text-background hover:bg-foreground/90">
 <MessageSquare className="w-4 h-4 mr-2" />
 ContactSupport
 </Button>
 </Link>
 <Link href="/docs">
 <Button variant="outline" className="h-12 px-8 rounded-full text-[15px] border-border/50 hover:bg-surface-200/50">
 ViewDocument
 </Button>
 </Link>
 </div>
 </div>
 </section>

 <SiteFooter />
 </div>
 );
}
