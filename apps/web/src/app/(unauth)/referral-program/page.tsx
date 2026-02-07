"use client";

/**
 * Referral ProgramPage - LobeHub StyleDesign
 */

import { useState } from "react";
import Link from "next/link";
import {
 Gift,
 ArrowRight,
 Copy,
 Check,
 Twitter,
 Linkedin,
 Mail,
 Sparkles,
 Trophy,
 TrendingUp,
 Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// RecommendedRewards
const rewards = [
 {
 icon: Gift,
 title: "RecommendedSuccessRewards",
 description: "eachSuccessRecommended1PaidUser, youwillObtainUseryearsSubscriptionAmount's 20% asRewards",
 highlight: "20% Commission",
 },
 {
 icon: Sparkles,
 title: "byRecommendeduserDiscount",
 description: "byRecommended'snewUserwillObtainmonthsSubscription 50% Discount",
 highlight: "50% Discount",
 },
 {
 icon: TrendingUp,
 title: "Rewards",
 description: "Recommendedmultiple, etc, UnlockmoremultipleExclusiveRights",
 highlight: "Noneonlimit",
 },
];

// Recommendedetc
const tiers = [
 {
 name: "newRecommended",
 requirement: "1-5 person",
 benefits: ["20% Commission", "ExclusiveRecommendedLink"],
 },
 {
 name: "Recommended",
 requirement: "6-20 person",
 benefits: ["25% Commission", "PriorityCustomerSupport", "Exclusive Discord Channel"],
 },
 {
 name: "Recommended",
 requirement: "21-50 person",
 benefits: ["30% Commission", "ExclusiveCustomerManager", "beforeExperiencenewFeatures"],
 },
 {
 name: "Recommended",
 requirement: "50+ person",
 benefits: ["35% Commission", "yearsPartnerswillInvite", "JointMarketingwill"],
 },
];

// FAQ
const faqs = [
 {
 question: "ifwhatStartRecommended?",
 answer: "Sign UpAccountafter, atSettingsPageFetchyou'sExclusiveRecommendedLink.Shareto, heViayou'sLinkSign UpandSubscriptionPaidVersion, younowcanObtainRewards.",
 },
 {
 question: "RewardsifwhatDistribute?",
 answer: "RewardswillatbyRecommendedUserDonetimesPaymentafter 30 daysinDistributetoyou'sAccountBalance.youcanwithSelectWithdraworUsed forSubscriptionCost.",
 },
 {
 question: "RecommendedLinkValidmultiple?",
 answer: "RecommendedLinkPermanentValid.byRecommendedUsertimesAccessafter 90 daysinSign UpandSubscription, allwillenteryou'sRecommended.",
 },
 {
 question: "canwithRecommendedtoCompanyorTeam??",
 answer: "canwith!NonepersonUserstillisEnterpriseTeam, needViayou'sRecommendedLinkSubscription, youallcanObtainshouldRewards.EnterpriseSubscription'sRewardsAmountmore.",
 },
];

export default function ReferralPage() {
 const [copied, setCopied] = useState(false);
 const referralLink = "https://agentflow.ai/r/YOUR_CODE";

 const copyToClipboard = () => {
 navigator.clipboard.writeText(referralLink);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 };

 return (
 <div className="min-h-screen bg-background">
 <SiteHeader />

 {/* Hero Section */}
 <section className="pt-32 sm:pt-40 pb-16 px-6 bg-gradient-hero">
 <div className="max-w-4xl mx-auto text-center">
 <div className="lobe-badge mb-8">
 <Gift className="h-4 w-4" />
 Referral Program
 </div>

 <h1 className="text-[15px] sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-6">
 InviteFriends, 
 <span className="text-[#4e8fff]">EarnRewards</span>
 </h1>

 <p className="text-[13px] text-foreground-light max-w-2xl mx-auto mb-10">
 Share AgentFlow toyou'sandColleague, eachSuccessRecommended1PaidUser, 
 nowcanObtain'sCashRewards
 </p>

 {/* Referral Link */}
 <div className="max-w-md mx-auto">
 <div className="flex gap-2">
 <Input
 value={referralLink}
 readOnly
 className="h-12 bg-surface-100/30 border-border/30 text-center rounded-full"
 />
 <Button
 onClick={copyToClipboard}
 className="h-12 px-6 rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium"
 >
 {copied ? (
 <>
 <Check className="w-4 h-4 mr-2" />
 alreadyCopy
 </>
 ) : (
 <>
 <Copy className="w-4 h-4 mr-2" />
 Copy
 </>
 )}
 </Button>
 </div>
 <p className="text-[12px] text-foreground-lighter mt-3">
 <Link href="/login" className="text-[#4e8fff] hover:underline">Sign In</Link>{""}
 Fetchyou'sExclusiveRecommendedLink
 </p>
 </div>

 {/* Share Buttons */}
 <div className="flex items-center justify-center gap-4 mt-8">
 <span className="text-[12px] text-foreground-lighter">Shareto: </span>
 <div className="flex gap-2">
 <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-border/50">
 <Twitter className="h-4 w-4" />
 </Button>
 <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-border/50">
 <Linkedin className="h-4 w-4" />
 </Button>
 <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-border/50">
 <Mail className="h-4 w-4" />
 </Button>
 </div>
 </div>
 </div>
 </section>

 {/* Rewards */}
 <section className="py-16 px-6 bg-gradient-section">
 <div className="max-w-6xl mx-auto">
 <div className="text-center mb-12">
 <h2 className="lobe-section-header mb-4">RecommendedRewards</h2>
 <p className="text-[13px] text-foreground-light">Simple3, EasyEarnRewards</p>
 </div>

 <div className="grid md:grid-cols-3 gap-6">
 {rewards.map((reward, index) => (
 <div
 key={reward.title}
 className="relative p-6 rounded-2xl bg-surface-100/30 border border-border/30"
 >
 <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-foreground flex items-center justify-center text-background font-bold text-[12px]">
 {index + 1}
 </div>
 <div className="w-12 h-12 rounded-xl bg-[#4e8fff]/10 flex items-center justify-center mb-4">
 <reward.icon className="w-6 h-6 text-[#4e8fff]" />
 </div>
 <h3 className="font-semibold text-foreground mb-2">{reward.title}</h3>
 <p className="text-[13px] text-foreground-light mb-4">{reward.description}</p>
 <span className="inline-block px-3 py-1 rounded-full bg-[#4e8fff]/10 text-[#4e8fff] text-[12px] font-medium">
 {reward.highlight}
 </span>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Tiers */}
 <section className="py-16 px-6">
 <div className="max-w-6xl mx-auto">
 <div className="text-center mb-12">
 <h2 className="lobe-section-header mb-4">Recommendedetc</h2>
 <p className="text-[13px] text-foreground-light">Recommendedmultiple, Rewards</p>
 </div>

 <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
 {tiers.map((tier, index) => (
 <div
 key={tier.name}
 className={cn(
 "p-6 rounded-2xl",
 "bg-surface-100/30 border",
 index === 3 ? "border-[#4e8fff]" : "border-border/30"
 )}
 >
 <div className="flex items-center gap-2 mb-4">
 <Trophy className={cn(
 "w-5 h-5",
 index === 0 && "text-gray-400",
 index === 1 && "text-gray-300",
 index === 2 && "text-yellow-500",
 index === 3 && "text-[#4e8fff]"
 )} />
 <h3 className="font-semibold text-foreground">{tier.name}</h3>
 </div>
 <p className="text-[13px] text-foreground-light mb-4">SuccessRecommended {tier.requirement}</p>
 <ul className="space-y-2">
 {tier.benefits.map((benefit) => (
 <li key={benefit} className="flex items-center gap-2 text-[12px]">
 <Check className="w-4 h-4 text-[#4e8fff]" />
 <span className="text-foreground">{benefit}</span>
 </li>
 ))}
 </ul>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* How It Works */}
 <section className="py-16 px-6 bg-gradient-section">
 <div className="max-w-4xl mx-auto">
 <div className="text-center mb-12">
 <h2 className="lobe-section-header mb-4">ifwhat</h2>
 </div>

 <div className="space-y-6">
 {[
 { step: 1, title: "FetchRecommendedLink", description: "Sign InAccount, atSettingsPagetoyou'sExclusiveRecommendedLink" },
 { step: 2, title: "SharetoFriends", description: "ViaSocial Media, EmailorwhatmethodShareyou'sLink" },
 { step: 3, title: "FriendsSign UpSubscription", description: "FriendsViayou'sLinkSign UpandSubscriptionPaidversion" },
 { step: 4, title: "ObtainRewards", description: "RewardswillAutoenteryou'sAccount, canWithdraworSubscription" },
 ].map((item) => (
 <div
 key={item.step}
 className="flex items-start gap-6 p-5 rounded-2xl bg-surface-100/30 border border-border/30"
 >
 <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center text-background font-bold shrink-0">
 {item.step}
 </div>
 <div>
 <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
 <p className="text-[13px] text-foreground-light">{item.description}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* FAQ */}
 <section className="py-16 px-6">
 <div className="max-w-4xl mx-auto">
 <div className="text-center mb-12">
 <h2 className="lobe-section-header mb-4">FAQ</h2>
 </div>
 <div className="space-y-4">
 {faqs.map((faq) => (
 <div key={faq.question} className="p-5 rounded-2xl bg-surface-100/30 border border-border/30">
 <h3 className="font-semibold text-foreground mb-2">{faq.question}</h3>
 <p className="text-[13px] text-foreground-light">{faq.answer}</p>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* CTA */}
 <section className="py-16 px-6 bg-gradient-section">
 <div className="max-w-4xl mx-auto text-center">
 <Zap className="w-12 h-12 text-[#4e8fff] mx-auto mb-6" />
 <h2 className="text-[15px] sm:text-2xl font-bold text-foreground mb-4">StartEarnRewards</h2>
 <p className="text-[13px] text-foreground-light mb-8 max-w-md mx-auto">
 NowSign Up, Fetchyou'sExclusiveRecommendedLink, StartInviteFriends
 </p>
 <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
 <Link href="/register">
 <Button className="h-12 px-8 rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium">
 FreeSign Up
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </Link>
 <Link href="/faq">
 <Button variant="outline" className="h-12 px-8 rounded-full border-border/50 text-foreground-light">
 moremultiple
 </Button>
 </Link>
 </div>
 </div>
 </section>

 <SiteFooter />
 </div>
 );
}
