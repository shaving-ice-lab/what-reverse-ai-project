"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";

// 价格配置
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
};

// 预设使用场景
const usagePresets = [
  {
    name: "个人开发者",
    workflows: 5,
    executions: 1000,
    aiTokens: 100000,
    storage: 1,
    icon: Zap,
  },
  {
    name: "小型团队",
    workflows: 20,
    executions: 10000,
    aiTokens: 500000,
    storage: 10,
    icon: Users,
  },
  {
    name: "中型企业",
    workflows: 50,
    executions: 100000,
    aiTokens: 2000000,
    storage: 50,
    icon: Database,
  },
  {
    name: "大型企业",
    workflows: 200,
    executions: 1000000,
    aiTokens: 10000000,
    storage: 200,
    icon: Bot,
  },
];

export interface PriceCalculatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 默认套餐 */
  defaultPlan?: "starter" | "pro" | "enterprise";
  /** 是否显示预设 */
  showPresets?: boolean;
  /** 是否显示详细分解 */
  showBreakdown?: boolean;
}

export function PriceCalculator({
  defaultPlan = "pro",
  showPresets = true,
  showBreakdown = true,
  className,
  ...props
}: PriceCalculatorProps) {
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "pro" | "enterprise">(defaultPlan);
  const [workflows, setWorkflows] = useState(20);
  const [executions, setExecutions] = useState(10000);
  const [aiTokens, setAiTokens] = useState(500000);
  const [storage, setStorage] = useState(10);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [animatedPrice, setAnimatedPrice] = useState(0);

  // 计算价格
  const calculatePrice = () => {
    const config = pricingConfig;
    const plan = selectedPlan;
    
    let total = config.basePrice[plan];
    
    // 工作流费用（超出免费额度后）
    const freeWorkflows = plan === "starter" ? 3 : plan === "pro" ? 20 : 100;
    const extraWorkflows = Math.max(0, workflows - freeWorkflows);
    total += extraWorkflows * config.perWorkflow[plan];
    
    // 执行费用（超出免费额度后）
    const freeExecutions = plan === "starter" ? 100 : plan === "pro" ? 10000 : 100000;
    const extraExecutions = Math.max(0, executions - freeExecutions);
    total += extraExecutions * config.perExecution[plan];
    
    // AI Token 费用
    const freeTokens = plan === "starter" ? 10000 : plan === "pro" ? 100000 : 1000000;
    const extraTokens = Math.max(0, aiTokens - freeTokens);
    total += extraTokens * config.aiTokenRate[plan];
    
    // 存储费用
    const freeStorage = plan === "starter" ? 1 : plan === "pro" ? 10 : 100;
    const extraStorage = Math.max(0, storage - freeStorage);
    total += extraStorage * config.storagePerGB[plan];
    
    // 年付折扣
    if (billingCycle === "yearly") {
      total *= 0.8; // 20% 折扣
    }
    
    return Math.round(total * 100) / 100;
  };

  const totalPrice = calculatePrice();

  // 价格动画
  useEffect(() => {
    const duration = 500;
    const startTime = Date.now();
    const startValue = animatedPrice;
    const endValue = totalPrice;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * easeOut;
      
      setAnimatedPrice(Math.round(current * 100) / 100);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [totalPrice]);

  const applyPreset = (preset: typeof usagePresets[0]) => {
    setWorkflows(preset.workflows);
    setExecutions(preset.executions);
    setAiTokens(preset.aiTokens);
    setStorage(preset.storage);
  };

  return (
    <div className={cn("", className)} {...props}>
      {/* 预设场景 */}
      {showPresets && (
        <div className="mb-8">
          <h4 className="text-sm font-medium text-foreground mb-4">选择使用场景</h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {usagePresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className={cn(
                  "p-4 rounded-xl border transition-all text-left",
                  "hover:border-primary/50 hover:bg-primary/5",
                  workflows === preset.workflows && executions === preset.executions
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card"
                )}
              >
                <preset.icon className={cn(
                  "w-5 h-5 mb-2",
                  workflows === preset.workflows && executions === preset.executions
                    ? "text-primary"
                    : "text-muted-foreground"
                )} />
                <p className="text-sm font-medium text-foreground">{preset.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* 参数调整 */}
        <div className="space-y-6">
          {/* 套餐选择 */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-3">选择套餐</label>
            <div className="grid grid-cols-3 gap-2">
              {(["starter", "pro", "enterprise"] as const).map((plan) => (
                <button
                  key={plan}
                  onClick={() => setSelectedPlan(plan)}
                  className={cn(
                    "py-2.5 px-4 rounded-xl text-sm font-medium transition-all",
                    selectedPlan === plan
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {plan === "starter" ? "免费版" : plan === "pro" ? "专业版" : "企业版"}
                </button>
              ))}
            </div>
          </div>

          {/* 工作流数量 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">工作流数量</label>
              <span className="text-sm text-primary font-medium">{workflows} 个</span>
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

          {/* 月执行次数 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">月执行次数</label>
              <span className="text-sm text-primary font-medium">{executions.toLocaleString()} 次</span>
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
              <label className="text-sm font-medium text-foreground">AI Token 用量</label>
              <span className="text-sm text-primary font-medium">{(aiTokens / 1000).toFixed(0)}K</span>
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

          {/* 存储空间 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">存储空间</label>
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

        {/* 价格显示 */}
        <div className="bg-card border border-border rounded-2xl p-6">
          {/* 付款周期 */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                billingCycle === "monthly"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              月付
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all relative",
                billingCycle === "yearly"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              年付
              <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded text-[10px] bg-orange-500 text-white font-bold">
                -20%
              </span>
            </button>
          </div>

          {/* 价格 */}
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-foreground mb-2">
              <span className="text-2xl align-top">$</span>
              {animatedPrice.toFixed(2)}
              <span className="text-lg font-normal text-muted-foreground">/{billingCycle === "monthly" ? "月" : "年"}</span>
            </div>
            {billingCycle === "yearly" && (
              <p className="text-sm text-emerald-500">
                <Sparkles className="w-4 h-4 inline mr-1" />
                每年节省 ${(totalPrice / 0.8 - totalPrice).toFixed(2)}
              </p>
            )}
          </div>

          {/* 费用分解 */}
          {showBreakdown && (
            <div className="space-y-3 mb-6 py-4 border-y border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">基础套餐</span>
                <span className="text-foreground">${pricingConfig.basePrice[selectedPlan]}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">额外工作流</span>
                <span className="text-foreground">
                  ${(Math.max(0, workflows - (selectedPlan === "starter" ? 3 : selectedPlan === "pro" ? 20 : 100)) * pricingConfig.perWorkflow[selectedPlan]).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">执行费用</span>
                <span className="text-foreground">
                  ~${(Math.max(0, executions - (selectedPlan === "starter" ? 100 : selectedPlan === "pro" ? 10000 : 100000)) * pricingConfig.perExecution[selectedPlan]).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">AI Token</span>
                <span className="text-foreground">
                  ~${(Math.max(0, aiTokens - (selectedPlan === "starter" ? 10000 : selectedPlan === "pro" ? 100000 : 1000000)) * pricingConfig.aiTokenRate[selectedPlan]).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">存储空间</span>
                <span className="text-foreground">
                  ~${(Math.max(0, storage - (selectedPlan === "starter" ? 1 : selectedPlan === "pro" ? 10 : 100)) * pricingConfig.storagePerGB[selectedPlan]).toFixed(2)}
                </span>
              </div>
              {billingCycle === "yearly" && (
                <div className="flex justify-between text-sm text-emerald-500">
                  <span>年付折扣 (-20%)</span>
                  <span>-${(totalPrice / 0.8 * 0.2).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 text-base">
            {selectedPlan === "starter" ? "免费开始" : "立即订阅"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-3">
            {selectedPlan === "starter" 
              ? "无需信用卡，即刻开始"
              : "支持随时取消，14天无理由退款"}
          </p>
        </div>
      </div>
    </div>
  );
}
