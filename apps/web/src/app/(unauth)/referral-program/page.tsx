"use client";

/**
 * Referral Program Page - LobeHub Style Design
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

// Referral Rewards
const rewards = [
 {
 icon: Gift,
 title: "Successful Referral Reward",
 description: "For each successfully referred paid user, you'll earn 20% of their annual subscription amount as a reward",
 highlight: "20% Commission",
 },
 {
 icon: Sparkles,
 title: "Referred User Discount",
 description: "New users referred by you will receive a 50% discount on their first month",
 highlight: "50% Discount",
 },
 {
 icon: TrendingUp,
 title: "Tiered Rewards",
 description: "The more you refer, the more exclusive benefits you unlock",
 highlight: "No limit",
 },
];

// Referral Tiers
const tiers = [
 {
 name: "New Referrer",
 requirement: "1-5 referrals",
 benefits: ["20% Commission", "Exclusive Referral Link"],
 },
 {
 name: "Bronze Referrer",
 requirement: "6-20 referrals",
 benefits: ["25% Commission", "Priority Customer Support", "Exclusive Discord Channel"],
 },
 {
 name: "Silver Referrer",
 requirement: "21-50 referrals",
 benefits: ["30% Commission", "Dedicated Account Manager", "Early Access to New Features"],
 },
 {
 name: "Gold Referrer",
 requirement: "50+ referrals",
 benefits: ["35% Commission", "Annual Partner Event Invite", "Joint Marketing Opportunities"],
 },
];

// FAQ
const faqs = [
 {
    question: "How do I get started with referrals?",
    answer: "After signing up, get your exclusive referral link from the Settings page. Share it with others — when they sign up and subscribe to a paid plan through your link, you'll earn rewards.",
 },
 {
    question: "How are rewards distributed?",
    answer: "Rewards are distributed to your account balance 30 days after the referred user completes their first payment. You can choose to withdraw them or use them toward subscription costs.",
 },
 {
    question: "How long is the referral link valid?",
    answer: "Referral links are permanently valid. If a referred user signs up and subscribes within 90 days of their first visit, it will count as your referral.",
 },
 {
    question: "Can I refer companies or teams?",
    answer: "Yes! Whether they're individual users or enterprise teams, as long as they subscribe through your referral link, you'll earn the corresponding rewards. Enterprise subscriptions come with higher reward amounts.",
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
 Invite Friends,{" "}
 <span className="text-[#4e8fff]">Earn Rewards</span>
 </h1>

 <p className="text-[13px] text-foreground-light max-w-2xl mx-auto mb-10">
            Share AgentFlow with your friends and colleagues. For each successfully referred paid user, 
            you'll earn cash rewards
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
 Copied
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
            <Link href="/login" className="text-[#4e8fff] hover:underline">Sign in</Link>{" "}
            to get your exclusive referral link
 </p>
 </div>

 {/* Share Buttons */}
 <div className="flex items-center justify-center gap-4 mt-8">
 <span className="text-[12px] text-foreground-lighter">Share: </span>
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
 <h2 className="lobe-section-header mb-4">Referral Rewards</h2>
 <p className="text-[13px] text-foreground-light">3 simple steps to easily earn rewards</p>
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
 <h2 className="lobe-section-header mb-4">Referral Tiers</h2>
 <p className="text-[13px] text-foreground-light">The more you refer, the more you earn</p>
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
 <p className="text-[13px] text-foreground-light mb-4">Successfully referred {tier.requirement}</p>
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
 <h2 className="lobe-section-header mb-4">How It Works</h2>
 </div>

 <div className="space-y-6">
 {[
            { step: 1, title: "Get Referral Link", description: "Sign in to your account and get your exclusive referral link from the Settings page" },
            { step: 2, title: "Share with Friends", description: "Share your link via social media, email, or any other method" },
            { step: 3, title: "Friends Sign Up & Subscribe", description: "Friends sign up and subscribe to a paid plan through your link" },
            { step: 4, title: "Earn Rewards", description: "Rewards are automatically added to your account — withdraw or use for subscriptions" },
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
 <h2 className="text-[15px] sm:text-2xl font-bold text-foreground mb-4">Start Earning Rewards</h2>
 <p className="text-[13px] text-foreground-light mb-8 max-w-md mx-auto">
            Sign up now, get your exclusive referral link, and start inviting friends
 </p>
 <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
 <Link href="/register">
 <Button className="h-12 px-8 rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium">
 Sign Up Free
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </Link>
 <Link href="/faq">
 <Button variant="outline" className="h-12 px-8 rounded-full border-border/50 text-foreground-light">
 Learn More
 </Button>
 </Link>
 </div>
 </div>
 </section>

 <SiteFooter />
 </div>
 );
}
