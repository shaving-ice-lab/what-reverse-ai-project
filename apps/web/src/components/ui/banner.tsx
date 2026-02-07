"use client";

/**
 * NotificationsBannerComponent
 * Used forDisplaySystemAnnouncement, Info, Warningetc
 */

import { useState, ReactNode } from "react";
import Link from "next/link";
import {
 X,
 Info,
 AlertTriangle,
 CheckCircle,
 XCircle,
 Megaphone,
 Sparkles,
 ArrowRight,
 Bell,
 Gift,
 Zap,
 LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

// ============================================
// BasicBanner
// ============================================

interface BannerProps {
 variant?: "info" | "success" | "warning" | "error" | "announcement" | "promo";
 icon?: LucideIcon;
 title?: string;
 description?: string;
 action?: {
 label: string;
 href?: string;
 onClick?: () => void;
 };
 dismissible?: boolean;
 onDismiss?: () => void;
 className?: string;
 children?: ReactNode;
}

const variantConfig = {
 info: {
 icon: Info,
 bg: "bg-blue-500/10 border-blue-500/20",
 iconColor: "text-blue-500",
 textColor: "text-blue-700 dark:text-blue-300",
 },
 success: {
 icon: CheckCircle,
 bg: "bg-emerald-500/10 border-emerald-500/20",
 iconColor: "text-emerald-500",
 textColor: "text-emerald-700 dark:text-emerald-300",
 },
 warning: {
 icon: AlertTriangle,
 bg: "bg-amber-500/10 border-amber-500/20",
 iconColor: "text-amber-500",
 textColor: "text-amber-700 dark:text-amber-300",
 },
 error: {
 icon: XCircle,
 bg: "bg-red-500/10 border-red-500/20",
 iconColor: "text-red-500",
 textColor: "text-red-700 dark:text-red-300",
 },
 announcement: {
 icon: Megaphone,
 bg: "bg-purple-500/10 border-purple-500/20",
 iconColor: "text-purple-500",
 textColor: "text-purple-700 dark:text-purple-300",
 },
 promo: {
 icon: Gift,
 bg: "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20",
 iconColor: "text-amber-500",
 textColor: "text-amber-700 dark:text-amber-300",
 },
};

export function Banner({
 variant = "info",
 icon,
 title,
 description,
 action,
 dismissible = true,
 onDismiss,
 className,
 children,
}: BannerProps) {
 const [isDismissed, setIsDismissed] = useState(false);
 const config = variantConfig[variant];
 const Icon = icon || config.icon;

 const handleDismiss = () => {
 setIsDismissed(true);
 onDismiss?.();
 };

 if (isDismissed) return null;

 return (
 <div
 className={cn(
 "relative flex items-center gap-4 px-4 py-3 rounded-xl border",
 config.bg,
 className
 )}
 >
 <Icon className={cn("w-5 h-5 shrink-0", config.iconColor)} />

 <div className="flex-1 min-w-0">
 {title && (
 <p className={cn("font-medium", config.textColor)}>{title}</p>
 )}
 {description && (
 <p className={cn("text-sm opacity-80", config.textColor)}>
 {description}
 </p>
 )}
 {children}
 </div>

 {action && (
 action.href ? (
 <Link href={action.href}>
 <Button variant="ghost" size="sm" className={config.textColor}>
 {action.label}
 <ArrowRight className="w-4 h-4 ml-1" />
 </Button>
 </Link>
 ) : (
 <Button
 variant="ghost"
 size="sm"
 className={config.textColor}
 onClick={action.onClick}
 >
 {action.label}
 <ArrowRight className="w-4 h-4 ml-1" />
 </Button>
 )
 )}

 {dismissible && (
 <button
 onClick={handleDismiss}
 className={cn(
 "p-1 rounded-lg transition-colors",
 "hover:bg-muted/50",
 config.textColor,
 "opacity-60 hover:opacity-100"
 )}
 >
 <X className="w-4 h-4" />
 </button>
 )}
 </div>
 );
}

// ============================================
// TopallBanner
// ============================================

interface TopBannerProps {
 variant?: "info" | "success" | "warning" | "error" | "promo";
 message: string;
 action?: {
 label: string;
 href?: string;
 onClick?: () => void;
 };
 dismissible?: boolean;
 onDismiss?: () => void;
}

const topBannerConfig = {
 info: "bg-blue-600 text-white",
 success: "bg-emerald-600 text-white",
 warning: "bg-amber-500 text-black",
 error: "bg-red-600 text-white",
 promo: "bg-gradient-to-r from-purple-600 to-pink-600 text-white",
};

export function TopBanner({
 variant = "info",
 message,
 action,
 dismissible = true,
 onDismiss,
}: TopBannerProps) {
 const [isDismissed, setIsDismissed] = useState(false);

 const handleDismiss = () => {
 setIsDismissed(true);
 onDismiss?.();
 };

 if (isDismissed) return null;

 return (
 <div className={cn("px-4 py-2 text-center text-sm", topBannerConfig[variant])}>
 <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
 <span>{message}</span>
 {action && (
 action.href ? (
 <Link
 href={action.href}
 className="font-medium underline underline-offset-2 hover:no-underline"
 >
 {action.label} →
 </Link>
 ) : (
 <button
 onClick={action.onClick}
 className="font-medium underline underline-offset-2 hover:no-underline"
 >
 {action.label} →
 </button>
 )
 )}
 {dismissible && (
 <button
 onClick={handleDismiss}
 className="absolute right-4 p-1 rounded hover:bg-white/10 transition-colors"
 >
 <X className="w-4 h-4" />
 </button>
 )}
 </div>
 </div>
 );
}

// ============================================
// FeaturesIntroductionBanner
// ============================================

interface FeatureBannerProps {
 icon?: LucideIcon;
 title: string;
 description: string;
 features?: string[];
 action?: {
 label: string;
 href?: string;
 onClick?: () => void;
 };
 secondaryAction?: {
 label: string;
 href?: string;
 onClick?: () => void;
 };
 gradient?: string;
 dismissible?: boolean;
 onDismiss?: () => void;
 className?: string;
}

export function FeatureBanner({
 icon: Icon = Sparkles,
 title,
 description,
 features,
 action,
 secondaryAction,
 gradient = "from-purple-600 to-blue-600",
 dismissible = true,
 onDismiss,
 className,
}: FeatureBannerProps) {
 const [isDismissed, setIsDismissed] = useState(false);

 const handleDismiss = () => {
 setIsDismissed(true);
 onDismiss?.();
 };

 if (isDismissed) return null;

 return (
 <div
 className={cn(
 "relative overflow-hidden rounded-2xl p-6",
 `bg-gradient-to-r ${gradient}`,
 className
 )}
 >
 {/* BackgroundDecoration */}
 <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

 <div className="relative flex items-start gap-4">
 <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
 <Icon className="w-6 h-6 text-white" />
 </div>

 <div className="flex-1 min-w-0">
 <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
 <p className="text-white/80 text-sm mb-4">{description}</p>

 {features && features.length > 0 && (
 <ul className="flex flex-wrap gap-3 mb-4">
 {features.map((feature, index) => (
 <li
 key={index}
 className="flex items-center gap-1.5 text-sm text-white/90"
 >
 <CheckCircle className="w-4 h-4 text-emerald-300" />
 {feature}
 </li>
 ))}
 </ul>
 )}

 <div className="flex items-center gap-3">
 {action && (
 action.href ? (
 <Link href={action.href}>
 <Button className="bg-white text-purple-700 hover:bg-white/90">
 {action.label}
 <ArrowRight className="w-4 h-4 ml-2" />
 </Button>
 </Link>
 ) : (
 <Button
 className="bg-white text-purple-700 hover:bg-white/90"
 onClick={action.onClick}
 >
 {action.label}
 <ArrowRight className="w-4 h-4 ml-2" />
 </Button>
 )
 )}
 {secondaryAction && (
 secondaryAction.href ? (
 <Link href={secondaryAction.href}>
 <Button variant="ghost" className="text-white hover:bg-white/10">
 {secondaryAction.label}
 </Button>
 </Link>
 ) : (
 <Button
 variant="ghost"
 className="text-white hover:bg-white/10"
 onClick={secondaryAction.onClick}
 >
 {secondaryAction.label}
 </Button>
 )
 )}
 </div>
 </div>

 {dismissible && (
 <button
 onClick={handleDismiss}
 className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 )}
 </div>
 </div>
 );
}

// ============================================
// Cookie AgreeBanner
// ============================================

interface CookieBannerProps {
 onAccept?: () => void;
 onDecline?: () => void;
 onCustomize?: () => void;
}

export function CookieBanner({
 onAccept,
 onDecline,
 onCustomize,
}: CookieBannerProps) {
 const [isDismissed, setIsDismissed] = useState(false);

 if (isDismissed) return null;

 return (
 <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t border-border shadow-lg">
 <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4">
 <div className="flex-1 text-center md:text-left">
 <p className="text-sm text-foreground">
 WeUsage Cookie comeImproveyou'sBrowseExperience, ProvidePersonalizationContentandAnalyticsWebsite.
 ContinueUsagecurrentWebsitenowRepresentyouAgreeWeUsage Cookie.
 </p>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 {onCustomize && (
 <Button variant="ghost" size="sm" onClick={onCustomize}>
 Custom
 </Button>
 )}
 {onDecline && (
 <Button
 variant="outline"
 size="sm"
 onClick={() => {
 onDecline();
 setIsDismissed(true);
 }}
 >
 Deny
 </Button>
 )}
 <Button
 size="sm"
 onClick={() => {
 onAccept?.();
 setIsDismissed(true);
 }}
 >
 Acceptallsection
 </Button>
 </div>
 </div>
 </div>
 );
}

// ============================================
// MaintainBanner
// ============================================

interface MaintenanceBannerProps {
 scheduledTime?: string;
 duration?: string;
 message?: string;
}

export function MaintenanceBanner({
 scheduledTime,
 duration,
 message,
}: MaintenanceBannerProps) {
 return (
 <Banner
 variant="warning"
 icon={AlertTriangle}
 title="SystemMaintainNotifications"
 description={
 message ||
 `Systemwillat ${scheduledTime || "nowwill"} ProceedMaintain${duration ? `, EstimatedContinuous ${duration}`: ""}.atthisbetween, PartialFeaturescancanNoneUsage.`
 }
 dismissible={false}
 />
 );
}

// ============================================
// UpgradeBanner
// ============================================

interface UpgradeBannerProps {
 planName?: string;
 discount?: string;
 expiresIn?: string;
 onUpgrade?: () => void;
 href?: string;
}

export function UpgradeBanner({
 planName = "Pro",
 discount,
 expiresIn,
 onUpgrade,
 href = "/billing",
}: UpgradeBannerProps) {
 return (
 <FeatureBanner
 icon={Zap}
 title={`Upgradeto ${planName} Plan${discount ? ` - ${discount} Discount`: ""}`}
 description={`UnlockmoremultipleAdvancedFeatures, ImproveWorkrate${expiresIn ? `.DiscountCountdowntime: ${expiresIn}`: ""}`}
 features={["NonelimitWorkflow", "PrioritySupport", "AdvancedAnalytics", "TeamCollaboration"]}
 action={{
 label: "NowUpgrade",
 href,
 onClick: onUpgrade,
 }}
 secondaryAction={{
 label: "Details",
 href: "/pricing",
 }}
 gradient="from-amber-500 to-orange-600"
 />
 );
}
