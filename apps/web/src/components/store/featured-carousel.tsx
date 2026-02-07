"use client";

/**
 * FeaturedRecommendedCarouselComponent
 * 
 * ShowcaseFeatured Agent 'sCarousel, SupportAutoPlayandManualSwitch
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
 Star,
 Download,
 ArrowUpRight,
 TrendingUp,
 ChevronLeft,
 ChevronRight,
 FileText,
 BarChart3,
 MessageSquare,
 Users,
 Code2,
 Globe,
 Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Agent, AgentCategory } from "@/types/agent";

// CategoryIconMapping
const categoryIconMap: Record<AgentCategory, typeof MessageSquare> = {
 content: FileText,
 data: BarChart3,
 customer: MessageSquare,
 productivity: Users,
 developer: Code2,
 research: Globe,
 education: FileText,
 finance: BarChart3,
 marketing: TrendingUp,
 other: Sparkles,
};

// Formatcountchar
const formatCount = (num: number): string => {
 if (num >= 10000) return `${(num / 10000).toFixed(1)}10000`;
 if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
 return num.toString();
};

interface FeaturedCarouselProps {
 agents: Agent[];
 autoPlayInterval?: number;
 className?: string;
}

export function FeaturedCarousel({
 agents,
 autoPlayInterval = 5000,
 className,
}: FeaturedCarouselProps) {
 const [currentIndex, setCurrentIndex] = useState(0);
 const [isPaused, setIsPaused] = useState(false);

 const goToNext = useCallback(() => {
 setCurrentIndex((prev) => (prev + 1) % agents.length);
 }, [agents.length]);

 const goToPrev = useCallback(() => {
 setCurrentIndex((prev) => (prev - 1 + agents.length) % agents.length);
 }, [agents.length]);

 const goToIndex = useCallback((index: number) => {
 setCurrentIndex(index);
 }, []);

 // AutoPlay
 useEffect(() => {
 if (isPaused || agents.length <= 1) return;

 const interval = setInterval(goToNext, autoPlayInterval);
 return () => clearInterval(interval);
 }, [isPaused, autoPlayInterval, goToNext, agents.length]);

 if (agents.length === 0) return null;

 const currentAgent = agents[currentIndex];
 const IconComponent = categoryIconMap[currentAgent.category] || Sparkles;

 return (
 <div
 className={cn("relative", className)}
 onMouseEnter={() => setIsPaused(true)}
 onMouseLeave={() => setIsPaused(false)}
 >
 {/* mainCard */}
 <Link href={`/store/${currentAgent.slug}`}>
 <div className="group relative overflow-hidden bg-gradient-to-r from-primary to-[#2a6348] p-6 sm:p-8 rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
 {/* BackgroundDecoration */}
 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
 <div className="absolute -right-20 -top-20 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
 <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />

 <div className="relative z-10">
 <div className="flex items-center gap-2 mb-4">
 <TrendingUp className="w-4 h-4 text-white/70" />
 <span className="text-sm font-medium text-white/70">FeaturedRecommended</span>
 <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-white text-xs">
 {currentIndex + 1} / {agents.length}
 </span>
 </div>

 <div className="flex flex-col sm:flex-row gap-6 items-start">
 <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl shadow-lg">
 {currentAgent.icon || (
 <IconComponent className="w-10 h-10 text-white" strokeWidth={1.5} />
 )}
 </div>

 <div className="flex-1">
 <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2 flex items-center gap-2">
 {currentAgent.name}
 <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
 </h3>
 <p className="text-white/80 mb-4 max-w-xl line-clamp-2">
 {currentAgent.description}
 </p>
 <div className="flex flex-wrap items-center gap-4 sm:gap-5 text-sm">
 <span className="text-white/70">
 {currentAgent.author?.displayName || currentAgent.author?.username || "method"}
 </span>
 <span className="flex items-center gap-1 text-yellow-300">
 <Star className="w-4 h-4 fill-current" />
 {currentAgent.avgRating.toFixed(1)}
 </span>
 <span className="flex items-center gap-1 text-white/70">
 <Download className="w-4 h-4" />
 {formatCount(currentAgent.useCount)}
 </span>
 {currentAgent.pricingType === "free" && (
 <span className="px-2 py-0.5 rounded-lg bg-white/20 text-white text-xs font-medium">
 Free
 </span>
 )}
 </div>
 </div>

 <Button className="h-10 px-5 bg-white hover:bg-white/90 text-primary-foreground font-medium rounded-xl shadow-sm shrink-0 hidden sm:flex">
 NowUsage
 <ArrowUpRight className="ml-1.5 w-4 h-4" />
 </Button>
 </div>
 </div>
 </div>
 </Link>

 {/* NavigationButton */}
 {agents.length > 1 && (
 <>
 <button
 onClick={(e) => {
 e.preventDefault();
 goToPrev();
 }}
 className={cn(
 "absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20",
 "w-8 h-8 sm:w-10 sm:h-10 rounded-full",
 "bg-white/20 backdrop-blur-sm text-white",
 "flex items-center justify-center",
 "hover:bg-white/30 transition-colors",
 "opacity-0 group-hover:opacity-100"
 )}
 >
 <ChevronLeft className="w-5 h-5" />
 </button>
 <button
 onClick={(e) => {
 e.preventDefault();
 goToNext();
 }}
 className={cn(
 "absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20",
 "w-8 h-8 sm:w-10 sm:h-10 rounded-full",
 "bg-white/20 backdrop-blur-sm text-white",
 "flex items-center justify-center",
 "hover:bg-white/30 transition-colors",
 "opacity-0 group-hover:opacity-100"
 )}
 >
 <ChevronRight className="w-5 h-5" />
 </button>
 </>
 )}

 {/* Indicator */}
 {agents.length > 1 && (
 <div className="flex items-center justify-center gap-2 mt-4">
 {agents.map((_, index) => (
 <button
 key={index}
 onClick={() => goToIndex(index)}
 className={cn(
 "h-2 rounded-full transition-all duration-300",
 index === currentIndex
 ? "w-6 bg-primary"
 : "w-2 bg-border hover:bg-muted-foreground"
 )}
 />
 ))}
 </div>
 )}
 </div>
 );
}
