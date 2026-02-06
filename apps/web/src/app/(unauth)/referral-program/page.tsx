"use client";

/**
 * 推荐计划页面 - LobeHub 风格设计
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

// 推荐奖励
const rewards = [
  {
    icon: Gift,
    title: "推荐成功奖励",
    description: "每成功推荐一位付费用户，您将获得该用户首年订阅金额的 20% 作为奖励",
    highlight: "20% 佣金",
  },
  {
    icon: Sparkles,
    title: "被推荐者优惠",
    description: "被推荐的新用户将获得首月订阅 50% 折扣",
    highlight: "50% 折扣",
  },
  {
    icon: TrendingUp,
    title: "累积奖励",
    description: "推荐越多，等级越高，解锁更多专属权益",
    highlight: "无上限",
  },
];

// 推荐等级
const tiers = [
  {
    name: "新手推荐官",
    requirement: "1-5 人",
    benefits: ["20% 佣金", "专属推荐链接"],
  },
  {
    name: "银牌推荐官",
    requirement: "6-20 人",
    benefits: ["25% 佣金", "优先客户支持", "专属 Discord 频道"],
  },
  {
    name: "金牌推荐官",
    requirement: "21-50 人",
    benefits: ["30% 佣金", "专属客户经理", "提前体验新功能"],
  },
  {
    name: "钻石推荐官",
    requirement: "50+ 人",
    benefits: ["35% 佣金", "年度合作伙伴峰会邀请", "联合营销机会"],
  },
];

// 常见问题
const faqs = [
  {
    question: "如何开始推荐？",
    answer: "注册账户后，在设置页面获取您的专属推荐链接。分享给朋友，当他们通过您的链接注册并订阅付费版本，您即可获得奖励。",
  },
  {
    question: "奖励如何发放？",
    answer: "奖励将在被推荐用户完成首次付款后 30 天内发放到您的账户余额。您可以选择提现或用于抵扣订阅费用。",
  },
  {
    question: "推荐链接有效期多久？",
    answer: "推荐链接永久有效。被推荐用户首次访问后 90 天内注册并订阅，都会计入您的推荐。",
  },
  {
    question: "可以推荐给公司或团队吗？",
    answer: "可以！无论个人用户还是企业团队，只要通过您的推荐链接订阅，您都能获得相应奖励。企业订阅的奖励金额更高。",
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
            推荐计划
          </div>

          <h1 className="text-[15px] sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-6">
            邀请好友，
            <span className="text-[#4e8fff]">赚取奖励</span>
          </h1>

          <p className="text-[13px] text-foreground-light max-w-2xl mx-auto mb-10">
            分享 AgentFlow 给您的朋友和同事，每成功推荐一位付费用户，
            即可获得丰厚的现金奖励
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
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    复制
                  </>
                )}
              </Button>
            </div>
            <p className="text-[12px] text-foreground-lighter mt-3">
              <Link href="/login" className="text-[#4e8fff] hover:underline">登录</Link>{" "}
              获取您的专属推荐链接
            </p>
          </div>

          {/* Share Buttons */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className="text-[12px] text-foreground-lighter">分享到：</span>
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
            <h2 className="lobe-section-header mb-4">推荐奖励</h2>
            <p className="text-[13px] text-foreground-light">简单三步，轻松赚取奖励</p>
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
            <h2 className="lobe-section-header mb-4">推荐等级</h2>
            <p className="text-[13px] text-foreground-light">推荐越多，奖励越丰厚</p>
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
                <p className="text-[13px] text-foreground-light mb-4">成功推荐 {tier.requirement}</p>
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
            <h2 className="lobe-section-header mb-4">如何运作</h2>
          </div>

          <div className="space-y-6">
            {[
              { step: 1, title: "获取推荐链接", description: "登录账户，在设置页面找到您的专属推荐链接" },
              { step: 2, title: "分享给好友", description: "通过社交媒体、邮件或任何方式分享您的链接" },
              { step: 3, title: "好友注册订阅", description: "好友通过您的链接注册并订阅付费版" },
              { step: 4, title: "获得奖励", description: "奖励将自动计入您的账户，可提现或抵扣订阅" },
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
            <h2 className="lobe-section-header mb-4">常见问题</h2>
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
          <h2 className="text-[15px] sm:text-2xl font-bold text-foreground mb-4">开始赚取奖励</h2>
          <p className="text-[13px] text-foreground-light mb-8 max-w-md mx-auto">
            立即注册，获取您的专属推荐链接，开始邀请好友
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button className="h-12 px-8 rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium">
                免费注册
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/faq">
              <Button variant="outline" className="h-12 px-8 rounded-full border-border/50 text-foreground-light">
                了解更多
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
