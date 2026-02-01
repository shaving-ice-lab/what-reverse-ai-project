"use client";

/**
 * 定价页面 - Manus 风格
 */

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  X,
  Sparkles,
  ArrowRight,
  Zap,
  Shield,
  Users,
  Building,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
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

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            简单透明的定价
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6">
            选择适合您的方案
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            从免费版开始，随时升级。所有付费版本都提供 14 天免费试用。
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1.5 rounded-full bg-muted">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                billingCycle === "monthly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              月付
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                billingCycle === "yearly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              年付
              <span className="ml-1.5 text-xs text-primary">省 20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative p-6 rounded-2xl",
                  "bg-card border",
                  plan.popular
                    ? "border-primary shadow-lg shadow-primary/10"
                    : "border-border"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    最受欢迎
                  </div>
                )}

                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description}
                </p>

                <div className="mb-6">
                  {plan.price.monthly !== null ? (
                    <>
                      <span className="text-3xl font-bold text-foreground">
                        ¥{billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly}
                      </span>
                      <span className="text-muted-foreground">/月</span>
                      {billingCycle === "yearly" && plan.price.yearly > 0 && (
                        <div className="text-xs text-primary mt-1">
                          年付节省 ¥{(plan.price.monthly - plan.price.yearly) * 12}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-foreground">联系我们</span>
                  )}
                </div>

                <Link href={plan.href}>
                  <Button
                    className={cn(
                      "w-full mb-6",
                      plan.popular
                        ? "bg-primary hover:bg-primary/90"
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    )}
                  >
                    {plan.cta}
                  </Button>
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-center gap-2 text-sm">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-primary shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                      )}
                      <span className={feature.included ? "text-foreground" : "text-muted-foreground"}>
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
      <section className="py-16 px-6 bg-muted/20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">
            常见问题
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="p-5 rounded-xl bg-card border border-border"
              >
                <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  {faq.question}
                </h3>
                <p className="text-sm text-muted-foreground pl-6">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            还有其他问题？
          </h2>
          <p className="text-muted-foreground mb-6">
            联系我们的销售团队，获取定制方案和企业级解决方案
          </p>
          <Link href="/contact">
            <Button size="lg" variant="outline" className="rounded-full">
              联系销售
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2026 AgentFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
