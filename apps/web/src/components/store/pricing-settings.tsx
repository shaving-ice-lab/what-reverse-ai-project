"use client";

/**
 * Pricing Settings Component
 * 
 * Supports Free, Paid, and Subscription pricing types
 */

import { useState } from "react";
import {
 Gift,
 CreditCard,
 Repeat,
 AlertCircle,
 Info,
 DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PricingType } from "@/types/agent";

// Pricing Option Config
const pricingOptions: Array<{
 id: PricingType;
 label: string;
 description: string;
 icon: typeof Gift;
 badge?: string;
}> = [
 {
 id: "free",
 label: "Free",
 description: "Free for all users, great for promotion and outreach",
 icon: Gift,
 badge: "Recommended",
 },
 {
 id: "paid",
label: "One-Time Purchase",
    description: "Users pay once for permanent access",
 icon: CreditCard,
 },
 {
 id: "subscription",
 label: "Subscription",
 description: "Users subscribe monthly or yearly for access",
 icon: Repeat,
 },
];

// Subscription Period Options
const subscriptionPeriods = [
  { id: "monthly", label: "Monthly", suffix: "/month" },
  { id: "yearly", label: "Yearly", suffix: "/year", discount: "17%" },
];

interface PricingSettingsProps {
  // Current value
 pricingType: PricingType;
 price: number | null;
 
 // Callback
 onPricingTypeChange: (type: PricingType) => void;
 onPriceChange: (price: number | null) => void;
 
 // style
 className?: string;
}

export function PricingSettings({
 pricingType,
 price,
 onPricingTypeChange,
 onPriceChange,
 className,
}: PricingSettingsProps) {
 const [subscriptionPeriod, setSubscriptionPeriod] = useState<"monthly" | "yearly">("monthly");
 const [priceInput, setPriceInput] = useState(price?.toString() || "");

  // Process price input
  const handlePriceInputChange = (value: string) => {
    // Allow numbers and decimal points
 const cleanValue = value.replace(/[^0-9.]/g, "");
 setPriceInput(cleanValue);
 
 const numValue = parseFloat(cleanValue);
 if (!isNaN(numValue) && numValue >= 0) {
 onPriceChange(numValue);
 } else if (cleanValue === "") {
 onPriceChange(null);
 }
 };

  // Process pricing type change
 const handlePricingTypeChange = (type: PricingType) => {
 onPricingTypeChange(type);
 if (type === "free") {
 onPriceChange(null);
 setPriceInput("");
 }
 };

  // Preset price options
 const presetPrices = pricingType === "subscription"
 ? subscriptionPeriod === "monthly"
 ? [9.9, 19.9, 29.9, 49.9]
 : [99, 199, 299, 499]
 : [9.9, 19.9, 49.9, 99];

  // Platform fee
 const platformFee = 0.2; // 20%
 const estimatedEarnings = price ? price * (1 - platformFee) : 0;

 return (
 <div className={cn("space-y-6", className)}>
 {/* Pricing Select */}
 <div>
 <label className="block text-sm font-medium text-foreground mb-3">
 Pricing <span className="text-destructive">*</span>
 </label>
 
 <div className="grid gap-3">
 {pricingOptions.map((option) => {
 const Icon = option.icon;
 const isSelected = pricingType === option.id;

 return (
 <button
 key={option.id}
 type="button"
 onClick={() => handlePricingTypeChange(option.id)}
 className={cn(
 "relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left",
 isSelected
 ? "border-primary bg-primary/5"
 : "border-border bg-background hover:border-primary/30"
 )}
 >
 {/* Select Indicator */}
 <div className={cn(
 "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
 isSelected
 ? "border-primary bg-primary"
 : "border-muted-foreground/30"
 )}>
 {isSelected && (
 <div className="w-2 h-2 rounded-full bg-white" />
 )}
 </div>

 {/* Icon */}
 <div className={cn(
 "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
 isSelected ? "bg-primary/20" : "bg-surface-200"
 )}>
 <Icon className={cn(
 "w-5 h-5",
 isSelected ? "text-primary" : "text-foreground-light"
 )} />
 </div>

 {/* Content */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <span className={cn(
 "font-medium",
 isSelected ? "text-foreground" : "text-foreground"
 )}>
 {option.label}
 </span>
 {option.badge && (
 <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
 {option.badge}
 </span>
 )}
 </div>
 <p className="text-sm text-foreground-light mt-1">
 {option.description}
 </p>
 </div>
 </button>
 );
 })}
 </div>
 </div>

 {/* Subscription Period Select */}
 {pricingType === "subscription" && (
 <div>
 <label className="block text-sm font-medium text-foreground mb-3">
Subscription Period
          </label>
 
 <div className="flex gap-3">
 {subscriptionPeriods.map((period) => (
 <button
 key={period.id}
 type="button"
 onClick={() => setSubscriptionPeriod(period.id as "monthly" | "yearly")}
 className={cn(
 "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all",
 subscriptionPeriod === period.id
 ? "border-primary bg-primary/5"
 : "border-border hover:border-primary/30"
 )}
 >
 <span className={cn(
 "font-medium",
 subscriptionPeriod === period.id ? "text-foreground" : "text-foreground-light"
 )}>
 {period.label}
 </span>
 {period.discount && (
 <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium">
 {period.discount}
 </span>
 )}
 </button>
 ))}
 </div>
 </div>
 )}

      {/* Price Input */}
      {pricingType !== "free" && (
 <div>
 <label className="block text-sm font-medium text-foreground mb-3">
 Price <span className="text-destructive">*</span>
 </label>

          {/* Price Input Field */}
          <div className="relative">
 <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
 <span className="text-lg font-medium text-foreground-light"></span>
 </div>
 <input
 type="text"
 value={priceInput}
 onChange={(e) => handlePriceInputChange(e.target.value)}
 placeholder="0.00"
 className={cn(
 "w-full pl-10 pr-20 py-4 text-2xl font-semibold rounded-xl border-2 bg-background transition-colors",
 "focus:outline-none focus:border-primary",
 "border-border"
 )}
 />
 <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
 <span className="text-foreground-light">
 {pricingType === "subscription"
 ? subscriptionPeriods.find((p) => p.id === subscriptionPeriod)?.suffix
 : ""}
 </span>
 </div>
 </div>

 {/* Preset Prices */}
 <div className="flex flex-wrap gap-2 mt-3">
 {presetPrices.map((preset) => (
 <button
 key={preset}
 type="button"
 onClick={() => {
 setPriceInput(preset.toString());
 onPriceChange(preset);
 }}
 className={cn(
 "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
 price === preset
 ? "bg-primary/10 text-primary"
 : "bg-surface-200 text-foreground-light hover:bg-primary/10 hover:text-primary"
 )}
 >
 {preset}
 </button>
 ))}
 </div>

 {/* Revenue Estimate */}
 {price && price > 0 && (
 <div className="mt-4 p-4 rounded-xl bg-surface-200/50 border border-border">
 <div className="flex items-center gap-2 text-sm text-foreground-light mb-2">
 <Info className="w-4 h-4" />
 <span>Revenue Estimate</span>
 </div>
 <div className="grid grid-cols-3 gap-4">
 <div>
 <div className="text-xs text-foreground-light"></div>
 <div className="text-lg font-semibold text-foreground">
 {price.toFixed(2)}
 </div>
 </div>
 <div>
 <div className="text-xs text-foreground-light">Platform Fee (20%)</div>
 <div className="text-lg font-semibold text-orange-500">
 -{(price * platformFee).toFixed(2)}
 </div>
 </div>
 <div>
 <div className="text-xs text-foreground-light">Your Revenue</div>
 <div className="text-lg font-semibold text-primary">
 {estimatedEarnings.toFixed(2)}
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 )}

 {/* Free Tier Tip */}
 {pricingType === "free" && (
 <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
 <div className="flex items-start gap-3">
 <Gift className="w-5 h-5 text-primary shrink-0 mt-0.5" />
 <div>
 <div className="font-medium text-foreground">Free</div>
 <p className="text-sm text-foreground-light mt-1">
Free agents get more exposure and usage, making them great for collecting user feedback.
                You can switch to paid pricing at any time.
 </p>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
