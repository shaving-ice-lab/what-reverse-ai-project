"use client";

/**
 * Pricing Card Component
 * Used for showcasing subscription plans and pricing info
 */

import { ReactNode } from "react";
import {
 Check,
 X,
 Star,
 Crown,
 Zap,
 Sparkles,
 ArrowRight,
 LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Badge } from "./badge";

// ============================================
// PriceCard
// ============================================

interface PricingFeature {
 text: string;
 included: boolean;
 highlight?: boolean;
}

interface PricingCardProps {
 name: string;
 description?: string;
 price: number | string;
 originalPrice?: number;
 period?: string;
 features: PricingFeature[];
 popular?: boolean;
 current?: boolean;
 icon?: LucideIcon;
 iconColor?: string;
 iconBg?: string;
 buttonText?: string;
 buttonVariant?: "default" | "outline" | "ghost";
 onSelect?: () => void;
 className?: string;
}

export function PricingCard({
 name,
 description,
 price,
 originalPrice,
 period = "/month",
 features,
 popular,
 current,
 icon: Icon = Zap,
 iconColor = "text-primary",
 iconBg = "bg-primary/10",
 buttonText = "Select this Plan",
 buttonVariant = "default",
 onSelect,
 className,
}: PricingCardProps) {
 return (
 <div
 className={cn(
 "relative flex flex-col p-6 rounded-2xl border transition-all",
 popular
 ? "bg-card border-primary shadow-lg shadow-primary/10 ring-1 ring-primary"
 : current
 ? "bg-primary/5 border-primary/30"
 : "bg-card border-border hover:border-primary/30",
 className
 )}
 >
 {/* Popular badge */}
 {popular && (
 <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
 <Star className="w-3 h-3 mr-1 fill-current" />
 Most Popular
 </Badge>
 )}

 {/* Current plan badge */}
 {current && (
 <Badge
 variant="secondary"
 className="absolute -top-3 left-1/2 -translate-x-1/2"
 >
 Current Plan
 </Badge>
 )}

 {/* Header */}
 <div className="flex items-center gap-3 mb-4">
 <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBg)}>
 <Icon className={cn("w-5 h-5", iconColor)} />
 </div>
 <div>
 <h3 className="font-semibold text-foreground">{name}</h3>
 {description && (
 <p className="text-xs text-muted-foreground">{description}</p>
 )}
 </div>
 </div>

 {/* Price */}
 <div className="mb-6">
 <div className="flex items-baseline gap-1">
 {typeof price === "number" ? (
 <>
 <span className="text-3xl font-bold text-foreground">¥{price}</span>
 <span className="text-muted-foreground">{period}</span>
 </>
 ) : (
 <span className="text-3xl font-bold text-foreground">{price}</span>
 )}
 </div>
 {originalPrice && (
 <p className="text-sm text-muted-foreground line-through">
 ¥{originalPrice}{period}
 </p>
 )}
 </div>

 {/* Features list */}
 <ul className="flex-1 space-y-3 mb-6">
 {features.map((feature, index) => (
 <li
 key={index}
 className={cn(
 "flex items-start gap-2 text-sm",
 !feature.included && "opacity-50"
 )}
 >
 {feature.included ? (
 <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
 ) : (
 <X className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
 )}
 <span
 className={cn(
 feature.included ? "text-foreground" : "text-muted-foreground",
 feature.highlight && "font-medium text-primary"
 )}
 >
 {feature.text}
 </span>
 </li>
 ))}
 </ul>

 {/* Button */}
 <Button
 variant={popular ? "default" : buttonVariant}
 className={cn(
 "w-full",
 popular && "bg-primary hover:bg-primary/90"
 )}
 disabled={current}
 onClick={onSelect}
 >
 {current ? "Current Plan" : buttonText}
 </Button>
 </div>
 );
}

// ============================================
// PriceSwitch
// ============================================

interface PricingToggleProps {
 isYearly: boolean;
 onToggle: (isYearly: boolean) => void;
 monthlyLabel?: string;
 yearlyLabel?: string;
 discount?: string;
 className?: string;
}

export function PricingToggle({
 isYearly,
 onToggle,
 monthlyLabel = "Monthly",
 yearlyLabel = "Yearly",
 discount = "Save 20%",
 className,
}: PricingToggleProps) {
 return (
 <div className={cn("flex items-center justify-center gap-3", className)}>
 <button
 onClick={() => onToggle(false)}
 className={cn(
 "px-4 py-2 rounded-lg text-sm font-medium transition-all",
 !isYearly
 ? "bg-primary text-primary-foreground"
 : "text-muted-foreground hover:text-foreground"
 )}
 >
 {monthlyLabel}
 </button>
 <button
 onClick={() => onToggle(true)}
 className={cn(
 "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
 isYearly
 ? "bg-primary text-primary-foreground"
 : "text-muted-foreground hover:text-foreground"
 )}
 >
 {yearlyLabel}
 {discount && (
 <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500">
 {discount}
 </Badge>
 )}
 </button>
 </div>
 );
}

// ============================================
// PriceCompare
// ============================================

interface PlanComparisonFeature {
 name: string;
 tooltip?: string;
 values: (string | boolean)[];
}

interface PlanComparisonProps {
 plans: string[];
 features: PlanComparisonFeature[];
 className?: string;
}

export function PlanComparison({
 plans,
 features,
 className,
}: PlanComparisonProps) {
 return (
 <div className={cn("overflow-x-auto", className)}>
 <table className="w-full">
 <thead>
 <tr className="border-b border-border">
 <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
 Features
 </th>
 {plans.map((plan) => (
 <th
 key={plan}
 className="text-center py-4 px-4 text-sm font-semibold text-foreground"
 >
 {plan}
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 {features.map((feature, index) => (
 <tr
 key={index}
 className="border-b border-border hover:bg-muted/50 transition-colors"
 >
 <td className="py-4 px-4 text-sm text-foreground">
 {feature.name}
 </td>
 {feature.values.map((value, idx) => (
 <td key={idx} className="text-center py-4 px-4">
 {typeof value === "boolean" ? (
 value ? (
 <Check className="w-5 h-5 text-emerald-500 mx-auto" />
 ) : (
 <X className="w-5 h-5 text-muted-foreground mx-auto" />
 )
 ) : (
 <span className="text-sm text-foreground">{value}</span>
 )}
 </td>
 ))}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 );
}

// ============================================
// SimplePriceCard
// ============================================

interface SimplePricingCardProps {
 title: string;
 price: number | string;
 period?: string;
 description: string;
 features: string[];
 highlighted?: boolean;
 buttonText?: string;
 onSelect?: () => void;
 className?: string;
}

export function SimplePricingCard({
 title,
 price,
 period = "/month",
 description,
 features,
 highlighted,
 buttonText = "Get Started",
 onSelect,
 className,
}: SimplePricingCardProps) {
 return (
 <div
 className={cn(
 "p-6 rounded-2xl border text-center",
 highlighted
 ? "bg-primary/5 border-primary"
 : "bg-card border-border",
 className
 )}
 >
 <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
 <div className="mb-2">
 {typeof price === "number" ? (
 <>
 <span className="text-4xl font-bold text-foreground">¥{price}</span>
 <span className="text-muted-foreground">{period}</span>
 </>
 ) : (
 <span className="text-4xl font-bold text-foreground">{price}</span>
 )}
 </div>
 <p className="text-sm text-muted-foreground mb-6">{description}</p>
 <ul className="space-y-2 mb-6 text-left">
 {features.map((feature, index) => (
 <li key={index} className="flex items-center gap-2 text-sm">
 <Check className="w-4 h-4 text-emerald-500 shrink-0" />
 <span className="text-foreground">{feature}</span>
 </li>
 ))}
 </ul>
 <Button
 className={cn("w-full", highlighted && "bg-primary hover:bg-primary/90")}
 variant={highlighted ? "default" : "outline"}
 onClick={onSelect}
 >
 {buttonText}
 <ArrowRight className="w-4 h-4 ml-2" />
 </Button>
 </div>
 );
}

// ============================================
// EnterpriseCard
// ============================================

interface EnterprisePricingCardProps {
 title?: string;
 description?: string;
 features: string[];
 contactText?: string;
 onContact?: () => void;
 className?: string;
}

export function EnterprisePricingCard({
 title = "Enterprise",
 description = "Large teams and enterprises can customize their plan.",
 features,
 contactText = "Contact Sales",
 onContact,
 className,
}: EnterprisePricingCardProps) {
 return (
 <div
 className={cn(
 "p-6 rounded-2xl border bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20",
 className
 )}
 >
 <div className="flex items-center gap-3 mb-4">
 <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
 <Crown className="w-5 h-5 text-amber-500" />
 </div>
 <div>
 <h3 className="font-semibold text-foreground">{title}</h3>
 <p className="text-xs text-muted-foreground">{description}</p>
 </div>
 </div>

 <div className="mb-6">
 <span className="text-3xl font-bold text-foreground">Custom Plan</span>
 </div>

 <ul className="space-y-3 mb-6">
 {features.map((feature, index) => (
 <li key={index} className="flex items-start gap-2 text-sm">
 <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
 <span className="text-foreground">{feature}</span>
 </li>
 ))}
 </ul>

 <Button
 className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
 onClick={onContact}
 >
 {contactText}
 <ArrowRight className="w-4 h-4 ml-2" />
 </Button>
 </div>
 );
}
