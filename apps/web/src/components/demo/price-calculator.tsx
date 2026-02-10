'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  Calculator,
  Zap,
  Users,
  Database,
  Bot,
  ChevronDown,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// Price Config
const pricingConfig = {
  basePrice: {
    starter: 0,
    pro: 49,
    enterprise: 199,
  },
  perWorkflow: {
    starter: 0,
    pro: 2,
    enterprise: 1,
  },
  perExecution: {
    starter: 0.01,
    pro: 0.005,
    enterprise: 0.002,
  },
  aiTokenRate: {
    starter: 0.00015,
    pro: 0.0001,
    enterprise: 0.00005,
  },
  storagePerGB: {
    starter: 0.5,
    pro: 0.3,
    enterprise: 0.1,
  },
}

// Preset Usage Scenarios
const usagePresets = [
  {
    name: 'Individual Developer',
    workflows: 5,
    executions: 1000,
    aiTokens: 100000,
    storage: 1,
    icon: Zap,
  },
  {
    name: 'Small Team',
    workflows: 20,
    executions: 10000,
    aiTokens: 500000,
    storage: 10,
    icon: Users,
  },
  {
    name: 'Enterprise',
    workflows: 50,
    executions: 100000,
    aiTokens: 2000000,
    storage: 50,
    icon: Database,
  },
  {
    name: 'Large Enterprise',
    workflows: 200,
    executions: 1000000,
    aiTokens: 10000000,
    storage: 200,
    icon: Bot,
  },
]

export interface PriceCalculatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Default Plan */
  defaultPlan?: 'starter' | 'pro' | 'enterprise'
  /** Whether to show presets */
  showPresets?: boolean
  /** Whether to show detailed breakdown */
  showBreakdown?: boolean
}

export function PriceCalculator({
  defaultPlan = 'pro',
  showPresets = true,
  showBreakdown = true,
  className,
  ...props
}: PriceCalculatorProps) {
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'enterprise'>(defaultPlan)
  const [workflows, setWorkflows] = useState(20)
  const [executions, setExecutions] = useState(10000)
  const [aiTokens, setAiTokens] = useState(500000)
  const [storage, setStorage] = useState(10)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [animatedPrice, setAnimatedPrice] = useState(0)

  // Calculate Price
  const calculatePrice = () => {
    const config = pricingConfig
    const plan = selectedPlan

    let total = config.basePrice[plan]

    // Workflow Cost (after exceeding free quota)
    const freeWorkflows = plan === 'starter' ? 3 : plan === 'pro' ? 20 : 100
    const extraWorkflows = Math.max(0, workflows - freeWorkflows)
    total += extraWorkflows * config.perWorkflow[plan]

    // Execution Cost (after exceeding free quota)
    const freeExecutions = plan === 'starter' ? 100 : plan === 'pro' ? 10000 : 100000
    const extraExecutions = Math.max(0, executions - freeExecutions)
    total += extraExecutions * config.perExecution[plan]

    // AI Token Cost
    const freeTokens = plan === 'starter' ? 10000 : plan === 'pro' ? 100000 : 1000000
    const extraTokens = Math.max(0, aiTokens - freeTokens)
    total += extraTokens * config.aiTokenRate[plan]

    // Storage cost
    const freeStorage = plan === 'starter' ? 1 : plan === 'pro' ? 10 : 100
    const extraStorage = Math.max(0, storage - freeStorage)
    total += extraStorage * config.storagePerGB[plan]

    // Yearly Discount
    if (billingCycle === 'yearly') {
      total *= 0.8 // 20% Discount
    }

    return Math.round(total * 100) / 100
  }

  const totalPrice = calculatePrice()

  // Price Animation
  useEffect(() => {
    const duration = 500
    const startTime = Date.now()
    const startValue = animatedPrice
    const endValue = totalPrice

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (endValue - startValue) * easeOut

      setAnimatedPrice(Math.round(current * 100) / 100)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [totalPrice])

  const applyPreset = (preset: (typeof usagePresets)[0]) => {
    setWorkflows(preset.workflows)
    setExecutions(preset.executions)
    setAiTokens(preset.aiTokens)
    setStorage(preset.storage)
  }

  return (
    <div className={cn('', className)} {...props}>
      {/* Preset Scenarios */}
      {showPresets && (
        <div className="mb-8">
          <h4 className="text-sm font-medium text-foreground mb-4">Select Usage Scenario</h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {usagePresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className={cn(
                  'p-4 rounded-xl border transition-all text-left',
                  'hover:border-primary/50 hover:bg-primary/5',
                  workflows === preset.workflows && executions === preset.executions
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card'
                )}
              >
                <preset.icon
                  className={cn(
                    'w-5 h-5 mb-2',
                    workflows === preset.workflows && executions === preset.executions
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                />
                <p className="text-sm font-medium text-foreground">{preset.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Parameter Adjustment */}
        <div className="space-y-6">
          {/* Plan Selection */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-3">Select Plan</label>
            <div className="grid grid-cols-3 gap-2">
              {(['starter', 'pro', 'enterprise'] as const).map((plan) => (
                <button
                  key={plan}
                  onClick={() => setSelectedPlan(plan)}
                  className={cn(
                    'py-2.5 px-4 rounded-xl text-sm font-medium transition-all',
                    selectedPlan === plan
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {plan === 'starter' ? 'Free' : plan === 'pro' ? 'Professional' : 'Enterprise'}
                </button>
              ))}
            </div>
          </div>

          {/* Workflow Count */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">Workflow Count</label>
              <span className="text-sm text-primary font-medium">{workflows} </span>
            </div>
            <input
              type="range"
              min="1"
              max="500"
              value={workflows}
              onChange={(e) => setWorkflows(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1</span>
              <span>500</span>
            </div>
          </div>

          {/* Monthly Executions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">Monthly Executions</label>
              <span className="text-sm text-primary font-medium">
                {executions.toLocaleString()} times
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="1000000"
              step="100"
              value={executions}
              onChange={(e) => setExecutions(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>100</span>
              <span>1M</span>
            </div>
          </div>

          {/* AI Token */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">AI Token Usage</label>
              <span className="text-sm text-primary font-medium">
                {(aiTokens / 1000).toFixed(0)}K
              </span>
            </div>
            <input
              type="range"
              min="10000"
              max="10000000"
              step="10000"
              value={aiTokens}
              onChange={(e) => setAiTokens(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>10K</span>
              <span>10M</span>
            </div>
          </div>

          {/* Storage Space */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">Storage Space</label>
              <span className="text-sm text-primary font-medium">{storage} GB</span>
            </div>
            <input
              type="range"
              min="1"
              max="500"
              value={storage}
              onChange={(e) => setStorage(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1 GB</span>
              <span>500 GB</span>
            </div>
          </div>
        </div>

        {/* Price Display */}
        <div className="bg-card border border-border rounded-2xl p-6">
          {/* Billing Cycle */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                billingCycle === 'monthly'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all relative',
                billingCycle === 'yearly'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Yearly
              <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded text-[10px] bg-orange-500 text-white font-bold">
                -20%
              </span>
            </button>
          </div>

          {/* Price */}
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-foreground mb-2">
              <span className="text-2xl align-top">$</span>
              {animatedPrice.toFixed(2)}
              <span className="text-lg font-normal text-muted-foreground">
                /{billingCycle === 'monthly' ? 'mo' : 'yr'}
              </span>
            </div>
            {billingCycle === 'yearly' && (
              <p className="text-sm text-emerald-500">
                <Sparkles className="w-4 h-4 inline mr-1" />
                Save ${(totalPrice / 0.8 - totalPrice).toFixed(2)} per year
              </p>
            )}
          </div>

          {/* Cost Breakdown */}
          {showBreakdown && (
            <div className="space-y-3 mb-6 py-4 border-y border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base Plan</span>
                <span className="text-foreground">${pricingConfig.basePrice[selectedPlan]}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Extra Workflows</span>
                <span className="text-foreground">
                  $
                  {(
                    Math.max(
                      0,
                      workflows -
                        (selectedPlan === 'starter' ? 3 : selectedPlan === 'pro' ? 20 : 100)
                    ) * pricingConfig.perWorkflow[selectedPlan]
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Execution Cost</span>
                <span className="text-foreground">
                  ~$
                  {(
                    Math.max(
                      0,
                      executions -
                        (selectedPlan === 'starter' ? 100 : selectedPlan === 'pro' ? 10000 : 100000)
                    ) * pricingConfig.perExecution[selectedPlan]
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">AI Token</span>
                <span className="text-foreground">
                  ~$
                  {(
                    Math.max(
                      0,
                      aiTokens -
                        (selectedPlan === 'starter'
                          ? 10000
                          : selectedPlan === 'pro'
                            ? 100000
                            : 1000000)
                    ) * pricingConfig.aiTokenRate[selectedPlan]
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Storage Space</span>
                <span className="text-foreground">
                  ~$
                  {(
                    Math.max(
                      0,
                      storage - (selectedPlan === 'starter' ? 1 : selectedPlan === 'pro' ? 10 : 100)
                    ) * pricingConfig.storagePerGB[selectedPlan]
                  ).toFixed(2)}
                </span>
              </div>
              {billingCycle === 'yearly' && (
                <div className="flex justify-between text-sm text-emerald-500">
                  <span>Yearly Discount (-20%)</span>
                  <span>-${((totalPrice / 0.8) * 0.2).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 text-base">
            {selectedPlan === 'starter' ? 'Get Started Free' : 'Subscribe Now'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-3">
            {selectedPlan === 'starter'
              ? 'No credit card required. Start now.'
              : 'Cancel anytime. 14-day money-back guarantee.'}
          </p>
        </div>
      </div>
    </div>
  )
}
