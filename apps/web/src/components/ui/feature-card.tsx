"use client";

/**
 * FeatureCard - Manus StyleFeaturesCardComponent
 * 
 * Used forHome, TemplateStoreetcPageShowcaseFeatures/Template
 */

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ColorPreset
export type FeatureCardColor = 
 | "violet" 
 | "blue" 
 | "emerald" 
 | "pink" 
 | "orange" 
 | "cyan" 
 | "amber" 
 | "rose" 
 | "indigo" 
 | "teal" 
 | "purple" 
 | "sky"
 | "green"
 | "red"
 | "yellow";

const colorStyles: Record<FeatureCardColor, { card: string; icon: string; iconBg: string }> = {
 violet: {
 card: "from-violet-500/20 to-violet-600/5 border-violet-500/20 hover:border-violet-500/50",
 icon: "text-violet-500",
 iconBg: "bg-violet-500/10",
 },
 blue: {
 card: "from-blue-500/20 to-blue-600/5 border-blue-500/20 hover:border-blue-500/50",
 icon: "text-blue-500",
 iconBg: "bg-blue-500/10",
 },
 emerald: {
 card: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 hover:border-emerald-500/50",
 icon: "text-emerald-500",
 iconBg: "bg-emerald-500/10",
 },
 pink: {
 card: "from-pink-500/20 to-pink-600/5 border-pink-500/20 hover:border-pink-500/50",
 icon: "text-pink-500",
 iconBg: "bg-pink-500/10",
 },
 orange: {
 card: "from-orange-500/20 to-orange-600/5 border-orange-500/20 hover:border-orange-500/50",
 icon: "text-orange-500",
 iconBg: "bg-orange-500/10",
 },
 cyan: {
 card: "from-cyan-500/20 to-cyan-600/5 border-cyan-500/20 hover:border-cyan-500/50",
 icon: "text-cyan-500",
 iconBg: "bg-cyan-500/10",
 },
 amber: {
 card: "from-amber-500/20 to-amber-600/5 border-amber-500/20 hover:border-amber-500/50",
 icon: "text-amber-500",
 iconBg: "bg-amber-500/10",
 },
 rose: {
 card: "from-rose-500/20 to-rose-600/5 border-rose-500/20 hover:border-rose-500/50",
 icon: "text-rose-500",
 iconBg: "bg-rose-500/10",
 },
 indigo: {
 card: "from-indigo-500/20 to-indigo-600/5 border-indigo-500/20 hover:border-indigo-500/50",
 icon: "text-indigo-500",
 iconBg: "bg-indigo-500/10",
 },
 teal: {
 card: "from-teal-500/20 to-teal-600/5 border-teal-500/20 hover:border-teal-500/50",
 icon: "text-teal-500",
 iconBg: "bg-teal-500/10",
 },
 purple: {
 card: "from-purple-500/20 to-purple-600/5 border-purple-500/20 hover:border-purple-500/50",
 icon: "text-purple-500",
 iconBg: "bg-purple-500/10",
 },
 sky: {
 card: "from-sky-500/20 to-sky-600/5 border-sky-500/20 hover:border-sky-500/50",
 icon: "text-sky-500",
 iconBg: "bg-sky-500/10",
 },
 green: {
 card: "from-green-500/20 to-green-600/5 border-green-500/20 hover:border-green-500/50",
 icon: "text-green-500",
 iconBg: "bg-green-500/10",
 },
 red: {
 card: "from-red-500/20 to-red-600/5 border-red-500/20 hover:border-red-500/50",
 icon: "text-red-500",
 iconBg: "bg-red-500/10",
 },
 yellow: {
 card: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/20 hover:border-yellow-500/50",
 icon: "text-yellow-500",
 iconBg: "bg-yellow-500/10",
 },
};

export interface FeatureCardProps {
 /** Title */
 title: string;
 /** Description */
 description: string;
 /** IconComponent */
 icon?: LucideIcon;
 /** CustomIconElement */
 iconElement?: React.ReactNode;
 /** PreviewImage */
 image?: string;
 /** LinkAddress */
 href?: string;
 /** ColorTheme */
 color?: FeatureCardColor;
 /** ClickCallback */
 onClick?: () => void;
 /** External className */
 className?: string;
 /** Variant */
 variant?: "default" | "compact" | "large";
 /** Tags */
 tags?: string[];
 /** isnoDisplayhead */
 showArrow?: boolean;
}

export function FeatureCard({
 title,
 description", icon: Icon,
 iconElement,
 image,
 href,
 color = "violet",
 onClick,
 className,
 variant = "default",
 tags,
 showArrow = true,
}: FeatureCardProps) {
 const styles = colorStyles[color];

 const content = (
 <div
 className={cn(
 "group relative rounded-xl border transition-all duration-300",
 "bg-gradient-to-br",
 styles.card,
 "hover:shadow-lg hover:-translate-y-0.5",
 variant === "compact" ? "p-4" : variant === "large" ? "p-6" : "p-5",
 className
 )}
 >
 {/* PreviewImage */}
 {image && variant === "large" && (
 <div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden bg-muted">
 <Image
 src={image}
 alt={title}
 fill
 className="object-cover transition-transform duration-300 group-hover:scale-105"
 />
 </div>
 )}

 {/* Icon */}
 {(Icon || iconElement) && (
 <div
 className={cn(
 "flex items-center justify-center rounded-lg",
 styles.iconBg,
 "bg-background/50 backdrop-blur-sm",
 variant === "compact" ? "w-8 h-8 mb-3" : "w-10 h-10 mb-4"
 )}
 >
 {iconElement || (Icon && <Icon className={cn(
 styles.icon,
 variant === "compact" ? "h-4 w-4" : "h-5 w-5"
 )} />)}
 </div>
 )}

 {/* Title */}
 <h3
 className={cn(
 "font-semibold text-foreground group-hover:text-primary transition-colors",
 variant === "compact" ? "text-sm mb-1" : variant === "large" ? "text-lg mb-2" : "text-base mb-2"
 )}
 >
 {title}
 </h3>

 {/* Description */}
 <p
 className={cn(
 "text-muted-foreground",
 variant === "compact" ? "text-xs line-clamp-1" : "text-sm line-clamp-2"
 )}
 >
 {description}
 </p>

 {/* Tags */}
 {tags && tags.length > 0 && (
 <div className="flex flex-wrap gap-1.5 mt-3">
 {tags.map((tag) => (
 <span
 key={tag}
 className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground"
 >
 {tag}
 </span>
 ))}
 </div>
 )}

 {/* head */}
 {showArrow && (
 <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
 <ArrowRight className="h-4 w-4 text-muted-foreground" />
 </div>
 )}
 </div>
 );

 // ifresulthasLink, Wrapperas Link
 if (href) {
 return (
 <Link href={href} className="block">
 {content}
 </Link>
 );
 }

 // ifresulthasClickEvent, Wrapperas button
 if (onClick) {
 return (
 <button type="button" onClick={onClick} className="block w-full text-left">
 {content}
 </button>
 );
 }

 return content;
}

/**
 * FeatureCardSkeleton - FeaturesCardSkeleton
 */
export function FeatureCardSkeleton({ 
 variant = "default" 
}: { 
 variant?: "default" | "compact" | "large" 
}) {
 return (
 <div
 className={cn(
 "rounded-xl border border-border/50 bg-muted/30",
 variant === "compact" ? "p-4" : variant === "large" ? "p-6" : "p-5"
 )}
 >
 {/* ImageSkeleton */}
 {variant === "large" && (
 <div className="w-full h-40 mb-4 rounded-lg bg-muted animate-pulse" />
 )}

 {/* IconSkeleton */}
 <div
 className={cn(
 "rounded-lg bg-muted animate-pulse",
 variant === "compact" ? "w-8 h-8 mb-3" : "w-10 h-10 mb-4"
 )}
 />

 {/* TitleSkeleton */}
 <div
 className={cn(
 "rounded bg-muted animate-pulse",
 variant === "compact" ? "h-4 w-24 mb-2" : "h-5 w-32 mb-3"
 )}
 />

 {/* DescriptionSkeleton */}
 <div className="space-y-2">
 <div className="h-3 w-full rounded bg-muted animate-pulse" />
 {variant !== "compact" && (
 <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
 )}
 </div>
 </div>
 );
}

/**
 * FeatureCardGrid - FeaturesCardGrid
 */
export function FeatureCardGrid({
 children,
 columns = 4,
 className,
}: {
 children: React.ReactNode;
 columns?: 2 | 3 | 4;
 className?: string;
}) {
 const gridCols = {
 2: "grid-cols-1 sm:grid-cols-2",
 3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
 4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
 };

 return (
 <div className={cn("grid gap-4 sm:gap-5", gridCols[columns], className)}>
 {children}
 </div>
 );
}

export default FeatureCard;
