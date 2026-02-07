"use client";

/**
 * RatingDistributionComponent
 * 
 * Showcase Agent 'sRatingDistribution
 */

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingDistributionProps {
 distribution: {
 1: number;
 2: number;
 3: number;
 4: number;
 5: number;
 };
 avgRating: number;
 totalReviews: number;
 className?: string;
}

export function RatingDistribution({
 distribution,
 avgRating,
 totalReviews,
 className,
}: RatingDistributionProps) {
 const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
 
 // CalculateeachRating'sPercentage
 const getPercentage = (count: number) => {
 if (total === 0) return 0;
 return (count / total) * 100;
 };

 return (
 <div className={cn("space-y-4", className)}>
 {/* totalRating */}
 <div className="flex items-center gap-4">
 <div className="text-center">
 <div className="text-4xl font-bold text-foreground">{avgRating.toFixed(1)}</div>
 <div className="flex items-center justify-center gap-0.5 mt-1">
 {Array.from({ length: 5 }).map((_, i) => (
 <Star
 key={i}
 className={cn(
 "w-4 h-4",
 i < Math.round(avgRating)
 ? "fill-yellow-500 text-yellow-500"
 : "text-muted-foreground"
 )}
 />
 ))}
 </div>
 <div className="text-sm text-muted-foreground mt-1">
 {totalReviews} Reviews
 </div>
 </div>

 {/* Distribution */}
 <div className="flex-1 space-y-2">
 {[5, 4, 3, 2, 1].map((rating) => {
 const count = distribution[rating as keyof typeof distribution];
 const percentage = getPercentage(count);

 return (
 <div key={rating} className="flex items-center gap-2">
 <div className="flex items-center gap-1 w-8 shrink-0">
 <span className="text-sm text-muted-foreground">{rating}</span>
 <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
 </div>
 <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
 <div
 className={cn(
 "h-full rounded-full transition-all duration-500",
 rating >= 4
 ? "bg-primary"
 : rating === 3
 ? "bg-yellow-500"
 : "bg-orange-500"
 )}
 style={{ width: `${percentage}%` }}
 />
 </div>
 <span className="text-xs text-muted-foreground w-10 text-right">
 {count}
 </span>
 </div>
 );
 })}
 </div>
 </div>
 </div>
 );
}
