"use client";

/**
 * 定价页面 - LobeHub 风格
 */

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  X,
  Sparkles,
  ArrowRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// 定价方案
const plans = [
  {
    name: "免费版",
    description: "适合个人用户和小型项目",
    price: { monthly: 0, yearly: 0 },
    features: [
      { name: "5 个工作流", included: true },
      { name: "1,000 次/月执行", included: true },
      { name: "基础 AI 模型", included: true },
      { name: "社区支持", included: true },
      { name: "7 天执行历史", included: true },
      { name: "团队协作", included: false },
      { name: "自定义域名", included: false },
      { name: "优先支持", included: false },
    ],
    cta: "免费开始",
    href: "/register",
    popular: false,
  },
  {
    name: "专业版",
    description: "适合专业用户和成长型团队",
    price: { monthly: 99, yearly: 79 },
    features: [
      { name: "无限工作流", included: true },
      { name: "50,000 次/月执行", included: true },
      { name: "高级 AI 模型", included: true },
      { name: "邮件支持", included: true },
      { name: "30 天执行历史", included: true },
      { name: "团队协作（5人）", included: true },
      { name: "自定义域名", included: true },
      { name: "优先支持", included: false },
    ],
    cta: "开始试用",
    href: "/register?plan=pro",
    popular: true,
  },
  {
    name: "团队版",
    description: "适合中型团队和企业",
    price: { monthly: 299, yearly: 249 },
    features: [
      { name: "无限工作流", included: true },
      { name: "200,000 次/月执行", included: true },
      { name: "全部 AI 模型", included: true },
      { name: "优先支持", included: true },
      { name: "1 年执行历史", included: true },
      { name: "团队协作（20人）", included: true },
      { name: "自定义域名", included: true },
      { name: "SSO 登录", included: true },
    ],
    cta: "开始试用",
    href: "/register?plan=team",
    popular: false,
  },
  {
    name: "企业版",
    description: "适合大型企业和定制需求",
    price: { monthly: null, yearly: null },
    features: [
      { name: "无限工作流", included: true },
      { name: "无限执行次数", included: true },
      { name: "全部 AI 模型", included: true },
      { name: "专属客户成功经理", included: true },
      { name: "无限执行历史", included: true },
      { name: "无限团队成员", included: true },
      { name: "私有化部署", included: true },
      { name: "SLA 保障", included: true },
    ],
    cta: "联系销售",
    href: "/contact?type=enterprise",
    popular: false,
  },
];

// FAQ
const faqs = [
  {
    question: "可以免费试用付费版本吗？",
    answer: "是的，专业版和团队版都提供 14 天免费试用，无需绑定信用卡。",
  },
  {
    question: "如何升级或降级套餐？",
    answer: "您可以随时在账户设置中升级或降级套餐。升级立即生效，降级将在当前计费周期结束后生效。",
  },
  {
    question: "支持哪些支付方式？",
    answer: "我们支持信用卡、支付宝、微信支付，企业客户还可以选择对公转账。",
  },
  {
    question: "有教育或非营利组织优惠吗？",
    answer: "是的，我们为教育机构提供 50% 折扣，非营利组织可享受 30% 折扣。请联系我们获取详情。",
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative pt-32 sm:pt-40 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="lobe-badge mb-8">
            <Sparkles className="h-3.5 w-3.5" />
            <span>简单透明的定价</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6 leading-[1.1]">
            选择适合您的方案
          </h1>

          <p className="text-lg text-foreground-light max-w-2xl mx-auto mb-10 leading-relaxed">
            从免费版开始，随时升级。所有付费版本都提供 14 天免费试用。
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-surface-100/50 border border-border/30">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-200",
                billingCycle === "monthly"
                  ? "bg-foreground text-background"
                  : "text-foreground-lighter hover:text-foreground-light"
              )}
            >
              月付
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={cn(
                "px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-200",
                billingCycle === "yearly"
                  ? "bg-foreground text-background"
                  : "text-foreground-lighter hover:text-foreground-light"
              )}
            >
              年付
              <span className="ml-1.5 text-[11px] text-brand-500">省 20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative p-6 rounded-2xl transition-all duration-300",
                  plan.popular
                    ? "bg-surface-100/60 border-2 border-foreground/20 shadow-lg shadow-white/5"
                    : "bg-surface-100/30 border border-border/30 hover:border-border/60"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-foreground text-background text-[11px] font-medium">
                    最受欢迎
                  </div>
                )}

                <h3 className="text-[16px] font-semibold text-foreground mb-1">{plan.name}</h3>
                <p className="text-[12px] text-foreground-lighter mb-5">{plan.description}</p>

                <div className="mb-6">
                  {plan.price.monthly !== null ? (
                    <>
                      <span className="text-3xl font-bold text-foreground tracking-tight">
                        ¥{billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly}
                      </span>
                      <span className="text-foreground-lighter text-[13px]">/月</span>
                      {billingCycle === "yearly" && plan.price.yearly > 0 && (
                        <div className="text-[11px] text-brand-500 mt-1">
                          年付节省 ¥{(plan.price.monthly - plan.price.yearly) * 12}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-foreground">联系我们</span>
                  )}
                </div>

                <Link href={plan.href} className="block mb-6">
                  <Button
                    className={cn(
                      "w-full rounded-full h-10 text-[13px] font-medium transition-all duration-200",
                      plan.popular
                        ? "bg-foreground text-background hover:bg-foreground/90"
                        : "bg-surface-200/50 text-foreground border border-border/30 hover:bg-surface-300/50"
                    )}
                  >
                    {plan.cta}
                  </Button>
                </Link>

                <ul className="space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-center gap-2.5 text-[13px]">
                      {feature.included ? (
                        <Check className="w-3.5 h-3.5 text-foreground-light shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                      )}
                      <span className={feature.included ? "text-foreground-light" : "text-foreground-muted"}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 sm:py-32">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">常见问题</h2>
          </div>
          <div className="space-y-2">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={cn(
                  "rounded-xl border transition-all duration-200",
                  openFAQ === idx
                    ? "border-border/60 bg-surface-100/30"
                    : "border-transparent hover:bg-surface-100/20"
                )}
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="text-[15px] font-medium text-foreground pr-4">{faq.question}</span>
                  <div className={cn(
                    "shrink-0 w-6 h-6 rounded-full bg-surface-200/80 flex items-center justify-center transition-transform duration-200",
                    openFAQ === idx && "rotate-45"
                  )}>
                    <Plus className="w-3.5 h-3.5 text-foreground-light" />
                  </div>
                </button>
                {openFAQ === idx && (
                  <div className="px-6 pb-5">
                    <p className="text-[14px] text-foreground-lighter leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">
            还有其他问题？
          </h2>
          <p className="text-foreground-light mb-8">
            联系我们的销售团队，获取定制方案和企业级解决方案
          </p>
          <Link href="/contact">
            <Button className="h-12 px-8 rounded-full text-[15px] border-border/50 bg-surface-200/50 text-foreground hover:bg-surface-300/50">
              联系销售
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
