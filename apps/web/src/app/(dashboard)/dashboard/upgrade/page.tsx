"use client";

/**
 * 升级套餐页面 - Supabase 风格
 * 覆盖计费周期、套餐对比、企业方案与 FAQ
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import {
  ArrowRight,
  Check,
  Clock,
  Crown,
  CreditCard,
  Gift,
  HelpCircle,
  Shield,
  Sparkles,
  X,
} from "lucide-react";

// 套餐配置
const plans = [
  {
    id: "free",
    name: "免费版",
    description: "适合个人尝试和学习",
    price: 0,
    priceYearly: 0,
    features: [
      { name: "1,000 次 API 调用/月", included: true },
      { name: "5 个工作流", included: true },
      { name: "3 个 AI Agent", included: true },
      { name: "1 GB 存储空间", included: true },
      { name: "基础模型访问", included: true },
      { name: "社区支持", included: true },
      { name: "高级模型访问", included: false },
      { name: "优先客服支持", included: false },
      { name: "团队协作", included: false },
      { name: "API 访问", included: false },
    ],
    popular: false,
    current: true,
  },
  {
    id: "pro",
    name: "专业版",
    description: "适合专业用户和小团队",
    price: 99,
    priceYearly: 79,
    features: [
      { name: "50,000 次 API 调用/月", included: true },
      { name: "无限工作流", included: true },
      { name: "无限 AI Agent", included: true },
      { name: "20 GB 存储空间", included: true },
      { name: "GPT-4, Claude 等高级模型", included: true },
      { name: "优先客服支持", included: true },
      { name: "5 人团队协作", included: true },
      { name: "API 完整访问", included: true },
      { name: "自定义品牌", included: false },
      { name: "专属客户经理", included: false },
    ],
    popular: true,
    current: false,
  },
  {
    id: "team",
    name: "团队版",
    description: "适合中大型团队",
    price: 299,
    priceYearly: 249,
    features: [
      { name: "200,000 次 API 调用/月", included: true },
      { name: "无限工作流", included: true },
      { name: "无限 AI Agent", included: true },
      { name: "100 GB 存储空间", included: true },
      { name: "所有高级模型", included: true },
      { name: "24/7 专属支持", included: true },
      { name: "无限团队成员", included: true },
      { name: "高级 API 功能", included: true },
      { name: "自定义品牌", included: true },
      { name: "专属客户经理", included: true },
    ],
    popular: false,
    current: false,
  },
];

// 企业版特性
const enterpriseFeatures = [
  "无限 API 调用",
  "私有化部署",
  "自定义模型训练",
  "SLA 保障",
  "专属技术支持",
  "定制功能开发",
];

// FAQ
const faqs = [
  {
    question: "可以随时升级或降级吗？",
    answer: "是的，您可以随时升级套餐，升级后立即生效。降级将在当前计费周期结束后生效。",
  },
  {
    question: "超出配额后会怎样？",
    answer: "超出配额后，服务不会立即停止。我们会通知您并提供临时额度，您可以选择升级套餐或等待下月配额重置。",
  },
  {
    question: "支持哪些支付方式？",
    answer: "我们支持信用卡、借记卡、支付宝、微信支付。企业版还支持对公转账和年付合同。",
  },
  {
    question: "有退款政策吗？",
    answer: "提供 14 天无理由退款保证。如果您对服务不满意，可以在购买后 14 天内申请全额退款。",
  },
];

export default function UpgradePage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const isYearly = billingCycle === "yearly";

  return (
    <PageContainer className="space-y-8">
      <PageHeader
        eyebrow="Billing"
        title="选择适合您的套餐"
        description="统一的账单与权限管理，按需升级并支持随时切换。"
        icon={<Crown className="w-4 h-4" />}
        actions={
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <div
              role="tablist"
              aria-label="计费周期"
              className="inline-flex items-center rounded-md border border-border bg-surface-100 p-1"
            >
              <button
                role="tab"
                aria-selected={billingCycle === "monthly"}
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[12px] font-medium transition-all",
                  billingCycle === "monthly"
                    ? "bg-surface-200 text-foreground shadow-sm"
                    : "text-foreground-light hover:text-foreground"
                )}
              >
                月付
              </button>
              <button
                role="tab"
                aria-selected={billingCycle === "yearly"}
                onClick={() => setBillingCycle("yearly")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[12px] font-medium transition-all flex items-center gap-2",
                  billingCycle === "yearly"
                    ? "bg-surface-200 text-foreground shadow-sm"
                    : "text-foreground-light hover:text-foreground"
                )}
              >
                年付
                <Badge variant="primary" size="xs">
                  省 20%
                </Badge>
              </button>
            </div>
            <div className="text-[11px] text-foreground-muted">
              年付可随时切换，自动续费前提醒
            </div>
          </div>
        }
      />

      <div className="page-panel p-4 md:p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="text-[12px] text-foreground-light">当前计费周期</div>
          <div className="text-sm font-medium text-foreground">
            {isYearly ? "年付计划（节省 20%）" : "月付计划"}
          </div>
          <p className="text-[11px] text-foreground-muted">
            下次扣费日：2026-03-01 · 可随时更改
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm">
            管理付款方式
          </Button>
          <Button variant="secondary" size="sm">
            查看发票
          </Button>
        </div>
      </div>

      <div className="page-grid md:grid-cols-3">
        {plans.map((plan) => {
          const price = plan.price === 0 ? "免费" : `¥${isYearly ? plan.priceYearly : plan.price}`;
          const yearlySavings =
            plan.price > 0 ? (plan.price - plan.priceYearly) * 12 : 0;

          return (
            <Card
              key={plan.id}
              variant={plan.popular ? "accent" : "default"}
              hover="border"
              className={cn(
                "relative overflow-hidden",
                plan.popular && "ring-1 ring-brand-500/20"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-4">
                  <Badge variant="solid-primary" size="sm">
                    最受欢迎
                  </Badge>
                </div>
              )}
              {plan.current && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="secondary" size="sm">
                    当前套餐
                  </Badge>
                </div>
              )}
              <CardHeader bordered>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle size="lg">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-semibold text-foreground">{price}</div>
                    <div className="text-[11px] text-foreground-muted">
                      {plan.price > 0 ? "/ 月" : "永久免费"}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isYearly && plan.price > 0 && (
                  <div className="rounded-md border border-border bg-surface-75/80 px-3 py-2 text-[11px] text-foreground-light">
                    年付合计 ¥{plan.priceYearly * 12}，节省 ¥{yearlySavings}
                  </div>
                )}
                <div className="space-y-2">
                  {plan.features.map((feature) => (
                    <div key={feature.name} className="flex items-center gap-2">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-brand-500 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-foreground-muted shrink-0" />
                      )}
                      <span
                        className={cn(
                          "text-[12px]",
                          feature.included ? "text-foreground" : "text-foreground-muted"
                        )}
                      >
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter bordered align="between">
                <span className="text-[11px] text-foreground-muted">
                  {plan.price === 0 ? "无需信用卡" : "支持随时取消"}
                </span>
                <Button
                  size="sm"
                  variant={plan.current ? "secondary" : plan.popular ? "default" : "outline"}
                  disabled={plan.current}
                  rightIcon={!plan.current && plan.id !== "free" ? <ArrowRight className="w-3.5 h-3.5" /> : undefined}
                >
                  {plan.current ? "当前套餐" : plan.id === "free" ? "降级到免费版" : "立即升级"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Card variant="panel" className="border-brand-400/40 bg-brand-200/50">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-brand-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-background" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">企业版</div>
                  <p className="text-[12px] text-foreground-light">
                    为大型团队与合规场景提供专属方案
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {enterpriseFeatures.map((feature) => (
                  <Badge
                    key={feature}
                    variant="secondary"
                    size="sm"
                    className="bg-brand-200/60 text-brand-500 border-brand-400/30"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button size="lg" className="bg-brand-500 hover:bg-brand-600 text-background">
                联系销售
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" size="sm">
                预约演示
              </Button>
              <p className="text-[11px] text-foreground-muted text-center">
                1 个工作日内回复
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="page-panel border-warning/30 bg-warning-200/60 p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="w-10 h-10 rounded-md bg-warning/20 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-warning" />
          </div>
          <div className="flex-1">
            <div className="text-[12px] font-medium text-foreground">限时优惠</div>
            <p className="text-[12px] text-foreground-light">
              使用优惠码{" "}
              <code className="px-2 py-0.5 rounded-md bg-warning/20 text-warning font-mono">
                NEWYEAR2026
              </code>{" "}
              首年额外享 9 折优惠
            </p>
          </div>
          <Badge variant="warning" size="sm">
            <Clock className="w-3 h-3 mr-1" />
            剩余 3 天
          </Badge>
        </div>
      </div>

      <div className="page-section">
        <div className="text-center space-y-2">
          <div className="page-caption">FAQ</div>
          <h2 className="text-lg font-semibold text-foreground">常见问题</h2>
        </div>
        <div className="max-w-2xl mx-auto space-y-2">
          {faqs.map((faq, index) => (
            <Card key={faq.question} variant="panel" className="overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface-200 transition-supabase"
              >
                <span className="text-[13px] font-medium text-foreground">{faq.question}</span>
                <HelpCircle
                  className={cn(
                    "w-4 h-4 text-foreground-muted transition-transform",
                    expandedFaq === index && "rotate-180"
                  )}
                />
              </button>
              {expandedFaq === index && (
                <div className="px-4 pb-4">
                  <p className="text-[12px] text-foreground-light">{faq.answer}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      <div className="page-grid md:grid-cols-3 text-center">
        <Card variant="default" padding="sm">
          <div className="p-1">
            <Shield className="w-6 h-6 text-brand-500 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-foreground mb-1">安全支付</h3>
            <p className="text-[12px] text-foreground-light">256 位 SSL 加密保护</p>
          </div>
        </Card>
        <Card variant="default" padding="sm">
          <div className="p-1">
            <Clock className="w-6 h-6 text-brand-500 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-foreground mb-1">14 天退款</h3>
            <p className="text-[12px] text-foreground-light">无理由全额退款保证</p>
          </div>
        </Card>
        <Card variant="default" padding="sm">
          <div className="p-1">
            <CreditCard className="w-6 h-6 text-brand-500 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-foreground mb-1">灵活付款</h3>
            <p className="text-[12px] text-foreground-light">支持多种支付方式</p>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}

