'use client'

/**
 * UpgradePlanPage - Supabase Style
 * Covers billing cycles, plan comparison, Enterprise plan, and FAQ
 */

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageContainer, PageHeader } from '@/components/dashboard/page-layout'
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
} from 'lucide-react'

// Plan configuration
const plans = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    priceYearly: 0,
    features: [
      { name: '1,000 API calls / month', included: true },
      { name: '5 Workflows', included: true },
      { name: '3 AI Agents', included: true },
      { name: '1 GB Storage', included: true },
      { name: 'Basic Model Access', included: true },
      { name: 'Community Support', included: true },
      { name: 'Advanced Model Access', included: false },
      { name: 'Priority Support', included: false },
      { name: 'Team Collaboration', included: false },
      { name: 'API Access', included: false },
    ],
    popular: false,
    current: true,
  },
  {
    id: 'pro',
    name: 'Professional',
    description: 'Suitable for professionals and small teams',
    price: 99,
    priceYearly: 79,
    features: [
      { name: '50,000 API calls / month', included: true },
      { name: 'Unlimited Workflows', included: true },
      { name: 'Unlimited AI Agents', included: true },
      { name: '20 GB Storage', included: true },
      { name: 'GPT-4, Claude & other Advanced Models', included: true },
      { name: 'Priority Support', included: true },
      { name: '5-person Team Collaboration', included: true },
      { name: 'Full API Access', included: true },
      { name: 'Custom Branding', included: false },
      { name: 'Dedicated Account Manager', included: false },
    ],
    popular: true,
    current: false,
  },
  {
    id: 'team',
    name: 'Team',
    description: 'Suitable for large teams',
    price: 299,
    priceYearly: 249,
    features: [
      { name: '200,000 API calls / month', included: true },
      { name: 'Unlimited Workflows', included: true },
      { name: 'Unlimited AI Agents', included: true },
      { name: '100 GB Storage', included: true },
      { name: 'All Advanced Models', included: true },
      { name: '24/7 Dedicated Support', included: true },
      { name: 'Unlimited Team Members', included: true },
      { name: 'Advanced API Features', included: true },
      { name: 'Custom Branding', included: true },
      { name: 'Dedicated Account Manager', included: true },
    ],
    popular: false,
    current: false,
  },
]

// Enterprise features
const enterpriseFeatures = [
  'Unlimited API Calls',
  'Private Deployment',
  'Custom Model Training',
  'SLA Guarantee',
  'Dedicated Technical Support',
  'Custom Feature Development',
]

// FAQ
const faqs = [
  {
    question: 'Can I upgrade or downgrade anytime?',
    answer:
      'Yes, you can upgrade or downgrade your plan anytime. Upgrades take effect immediately. Downgrades take effect at the end of the current billing cycle.',
  },
  {
    question: 'What happens after exceeding my quota?',
    answer:
      "After exceeding quota, service won't stop immediately. We'll notify you and give you time to upgrade or wait until the next quota reset.",
  },
  {
    question: 'Which payment methods are supported?',
    answer:
      'We support Visa, Mastercard, PayPal, and WeChat Pay. Enterprise plans also support invoicing and annual contracts.',
  },
  {
    question: 'Is there a refund policy?',
    answer:
      "14-day no-questions-asked refund. If you're not satisfied, request a full refund within 14 days of purchase.",
  },
]

export default function UpgradePage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const isYearly = billingCycle === 'yearly'

  return (
    <PageContainer className="space-y-8">
      <PageHeader
        eyebrow="Billing"
        title="Select a plan that fits you"
        description="Manage billing and permissions; upgrade anytime and switch plans when needed."
        icon={<Crown className="w-4 h-4" />}
        actions={
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <div
              role="tablist"
              aria-label="Billing cycle"
              className="inline-flex items-center rounded-md border border-border bg-surface-100 p-1"
            >
              <button
                role="tab"
                aria-selected={billingCycle === 'monthly'}
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-[12px] font-medium transition-all',
                  billingCycle === 'monthly'
                    ? 'bg-surface-200 text-foreground shadow-sm'
                    : 'text-foreground-light hover:text-foreground'
                )}
              >
                Monthly
              </button>
              <button
                role="tab"
                aria-selected={billingCycle === 'yearly'}
                onClick={() => setBillingCycle('yearly')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-[12px] font-medium transition-all flex items-center gap-2',
                  billingCycle === 'yearly'
                    ? 'bg-surface-200 text-foreground shadow-sm'
                    : 'text-foreground-light hover:text-foreground'
                )}
              >
                Yearly
                <Badge variant="primary" size="xs">
                  20%
                </Badge>
              </button>
            </div>
            <div className="text-[11px] text-foreground-muted">
              Switch anytime; auto-renewal reminder before charge
            </div>
          </div>
        }
      />

      <div className="page-panel p-4 md:p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="text-[12px] text-foreground-light">Current billing cycle</div>
          <div className="text-sm font-medium text-foreground">
            {isYearly ? 'Yearly plan (Save 20%)' : 'Monthly plan'}
          </div>
          <p className="text-[11px] text-foreground-muted">
            Next renewal: 2026-03-01 · Change anytime
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm">
            Manage payment method
          </Button>
          <Button variant="secondary" size="sm">
            View invoices
          </Button>
        </div>
      </div>

      <div className="page-grid md:grid-cols-3">
        {plans.map((plan) => {
          const price = plan.price === 0 ? 'Free' : `¥${isYearly ? plan.priceYearly : plan.price}`
          const yearlySavings = plan.price > 0 ? (plan.price - plan.priceYearly) * 12 : 0

          return (
            <Card
              key={plan.id}
              variant={plan.popular ? 'accent' : 'default'}
              hover="border"
              className={cn('relative overflow-hidden', plan.popular && 'ring-1 ring-brand-500/20')}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-4">
                  <Badge variant="solid-primary" size="sm">
                    Most popular
                  </Badge>
                </div>
              )}
              {plan.current && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="secondary" size="sm">
                    Current plan
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
                      {plan.price > 0 ? '/ month' : 'Free forever'}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isYearly && plan.price > 0 && (
                  <div className="rounded-md border border-border bg-surface-75/80 px-3 py-2 text-[11px] text-foreground-light">
                    Annual total ¥{plan.priceYearly * 12}, save ¥{yearlySavings}
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
                          'text-[12px]',
                          feature.included ? 'text-foreground' : 'text-foreground-muted'
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
                  {plan.price === 0 ? 'No payment required' : 'Cancel anytime'}
                </span>
                <Button
                  size="sm"
                  variant={plan.current ? 'secondary' : plan.popular ? 'default' : 'outline'}
                  disabled={plan.current}
                  rightIcon={
                    !plan.current && plan.id !== 'free' ? (
                      <ArrowRight className="w-3.5 h-3.5" />
                    ) : undefined
                  }
                >
                  {plan.current
                    ? 'Current plan'
                    : plan.id === 'free'
                      ? 'Downgrade to free'
                      : 'Upgrade now'}
                </Button>
              </CardFooter>
            </Card>
          )
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
                  <div className="text-sm font-semibold text-foreground">Enterprise</div>
                  <p className="text-[12px] text-foreground-light">
                    Exclusive plans for large teams and compliance scenarios
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
                Contact Sales
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" size="sm">
                Schedule a Demo
              </Button>
              <p className="text-[11px] text-foreground-muted text-center">
                Response within 1 business day
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
            <div className="text-[12px] font-medium text-foreground">Limited-Time Discount</div>
            <p className="text-[12px] text-foreground-light">
              Use discount code{' '}
              <code className="px-2 py-0.5 rounded-md bg-warning/20 text-warning font-mono">
                NEWYEAR2026
              </code>{' '}
              for 10% off annual plans
            </p>
          </div>
          <Badge variant="warning" size="sm">
            <Clock className="w-3 h-3 mr-1" />3 days remaining
          </Badge>
        </div>
      </div>

      <div className="page-section">
        <div className="text-center space-y-2">
          <div className="page-caption">FAQ</div>
          <h2 className="text-lg font-semibold text-foreground">FAQ</h2>
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
                    'w-4 h-4 text-foreground-muted transition-transform',
                    expandedFaq === index && 'rotate-180'
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
            <h3 className="text-sm font-medium text-foreground mb-1">Secure payment</h3>
            <p className="text-[12px] text-foreground-light">256-bit SSL encryption</p>
          </div>
        </Card>
        <Card variant="default" padding="sm">
          <div className="p-1">
            <Clock className="w-6 h-6 text-brand-500 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-foreground mb-1">14-day refund</h3>
            <p className="text-[12px] text-foreground-light">No questions asked refund guarantee</p>
          </div>
        </Card>
        <Card variant="default" padding="sm">
          <div className="p-1">
            <CreditCard className="w-6 h-6 text-brand-500 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-foreground mb-1">Flexible payment</h3>
            <p className="text-[12px] text-foreground-light">
              Support for multiple payment methods
            </p>
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
