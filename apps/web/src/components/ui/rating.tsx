"use client";

/**
 * Rating and Feedback Component
 * Supports star ratings, likes, feedback, and more
 */

import { useState } from "react";
import {
 Star,
 ThumbsUp,
 ThumbsDown,
 Heart,
 Smile,
 Meh,
 Frown,
 MessageSquare,
 Send,
 Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Textarea } from "./textarea";

// ============================================
// Star Rating
// ============================================

interface StarRatingProps {
 value: number;
 onChange?: (value: number) => void;
 max?: number;
 size?: "sm" | "md" | "lg";
 readonly?: boolean;
 showValue?: boolean;
 className?: string;
}

export function StarRating({
 value,
 onChange,
 max = 5,
 size = "md",
 readonly = false,
 showValue = false,
 className,
}: StarRatingProps) {
 const [hoverValue, setHoverValue] = useState<number | null>(null);

 const displayValue = hoverValue ?? value;

 const sizeClasses = {
 sm: "w-4 h-4",
 md: "w-5 h-5",
 lg: "w-6 h-6",
 };

 const gapClasses = {
 sm: "gap-0.5",
 md: "gap-1",
 lg: "gap-1.5",
 };

 return (
 <div className={cn("flex items-center", gapClasses[size], className)}>
 {Array.from({ length: max }).map((_, index) => {
 const starValue = index + 1;
 const isFilled = starValue <= displayValue;
 const isHalf = starValue - 0.5 === displayValue;

 return (
 <button
 key={index}
 type="button"
 disabled={readonly}
 onClick={() => onChange?.(starValue)}
 onMouseEnter={() => !readonly && setHoverValue(starValue)}
 onMouseLeave={() => setHoverValue(null)}
 className={cn(
 "transition-transform",
 !readonly && "hover:scale-110 cursor-pointer",
 readonly && "cursor-default"
 )}
 >
 <Star
 className={cn(
 sizeClasses[size],
 isFilled
 ? "text-amber-500 fill-amber-500"
 : "text-muted-foreground"
 )}
 />
 </button>
 );
 })}
 {showValue && (
 <span className="text-sm text-muted-foreground ml-2">
 {value.toFixed(1)}
 </span>
 )}
 </div>
 );
}

// ============================================
// Like / Dislike
// ============================================

interface ThumbsRatingProps {
 likes?: number;
 dislikes?: number;
 userVote?: "like" | "dislike" | null;
 onVote?: (vote: "like" | "dislike" | null) => void;
 showCounts?: boolean;
 className?: string;
}

export function ThumbsRating({
 likes = 0,
 dislikes = 0,
 userVote = null,
 onVote,
 showCounts = true,
 className,
}: ThumbsRatingProps) {
 const handleVote = (vote: "like" | "dislike") => {
 if (userVote === vote) {
 onVote?.(null);
 } else {
 onVote?.(vote);
 }
 };

 return (
 <div className={cn("flex items-center gap-2", className)}>
 <button
 type="button"
 onClick={() => handleVote("like")}
 className={cn(
 "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all",
 userVote === "like"
 ? "bg-emerald-500/10 text-emerald-500"
 : "bg-muted text-muted-foreground hover:text-foreground"
 )}
 >
 <ThumbsUp className={cn("w-4 h-4", userVote === "like" && "fill-current")} />
 {showCounts && <span className="text-sm">{likes + (userVote === "like" ? 1 : 0)}</span>}
 </button>
 <button
 type="button"
 onClick={() => handleVote("dislike")}
 className={cn(
 "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all",
 userVote === "dislike"
 ? "bg-red-500/10 text-red-500"
 : "bg-muted text-muted-foreground hover:text-foreground"
 )}
 >
 <ThumbsDown className={cn("w-4 h-4", userVote === "dislike" && "fill-current")} />
 {showCounts && <span className="text-sm">{dislikes + (userVote === "dislike" ? 1 : 0)}</span>}
 </button>
 </div>
 );
}

// ============================================
// Favorite
// ============================================

interface HeartButtonProps {
 liked?: boolean;
 count?: number;
 onChange?: (liked: boolean) => void;
 showCount?: boolean;
 size?: "sm" | "md" | "lg";
 className?: string;
}

export function HeartButton({
 liked = false,
 count = 0,
 onChange,
 showCount = false,
 size = "md",
 className,
}: HeartButtonProps) {
 const [isAnimating, setIsAnimating] = useState(false);

 const handleClick = () => {
 setIsAnimating(true);
 onChange?.(!liked);
 setTimeout(() => setIsAnimating(false), 300);
 };

 const sizeClasses = {
 sm: "w-4 h-4",
 md: "w-5 h-5",
 lg: "w-6 h-6",
 };

 return (
 <button
 type="button"
 onClick={handleClick}
 className={cn(
 "flex items-center gap-1.5 transition-transform",
 isAnimating && "scale-125",
 className
 )}
 >
 <Heart
 className={cn(
 sizeClasses[size],
 liked ? "text-red-500 fill-red-500" : "text-muted-foreground",
 "transition-colors"
 )}
 />
 {showCount && (
 <span className="text-sm text-muted-foreground">
 {count + (liked ? 1 : 0)}
 </span>
 )}
 </button>
 );
}

// ============================================
// EmojiRating
// ============================================

interface EmojiRatingProps {
 value?: "positive" | "neutral" | "negative" | null;
 onChange?: (value: "positive" | "neutral" | "negative") => void;
 showLabels?: boolean;
 className?: string;
}

export function EmojiRating({
 value,
 onChange,
 showLabels = false,
 className,
}: EmojiRatingProps) {
 const options = [
 { id: "positive", icon: Smile, label: "Satisfied", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { id: "neutral", icon: Meh, label: "Neutral", color: "text-amber-500", bg: "bg-amber-500/10" },
    { id: "negative", icon: Frown, label: "Unsatisfied", color: "text-red-500", bg: "bg-red-500/10" },
 ] as const;

 return (
 <div className={cn("flex items-center gap-3", className)}>
 {options.map((option) => {
 const Icon = option.icon;
 const isSelected = value === option.id;

 return (
 <button
 key={option.id}
 type="button"
 onClick={() => onChange?.(option.id)}
 className={cn(
 "flex flex-col items-center gap-1 p-3 rounded-xl transition-all",
 isSelected
 ? cn(option.bg, option.color)
 : "bg-muted text-muted-foreground hover:text-foreground"
 )}
 >
 <Icon className={cn("w-8 h-8", isSelected && "scale-110")} />
 {showLabels && (
 <span className="text-xs font-medium">{option.label}</span>
 )}
 </button>
 );
 })}
 </div>
 );
}

// ============================================
// Rating Display
// ============================================

interface RatingDisplayProps {
 rating: number;
 reviews?: number;
 breakdown?: { stars: number; count: number }[];
 className?: string;
}

export function RatingDisplay({
 rating,
 reviews,
 breakdown,
 className,
}: RatingDisplayProps) {
 const totalReviews = breakdown?.reduce((sum, b) => sum + b.count, 0) || reviews || 0;

 return (
 <div className={cn("flex items-start gap-6", className)}>
 {/* Overall Rating */}
 <div className="text-center">
 <div className="text-4xl font-bold text-foreground">{rating.toFixed(1)}</div>
 <StarRating value={rating} readonly size="sm" />
 {reviews !== undefined && (
 <p className="text-sm text-muted-foreground mt-1">
 {totalReviews.toLocaleString()} Reviews
 </p>
 )}
 </div>

 {/* Rating Distribution */}
 {breakdown && (
 <div className="flex-1 space-y-2">
 {breakdown.sort((a, b) => b.stars - a.stars).map((item) => {
 const percentage = totalReviews > 0 ? (item.count / totalReviews) * 100 : 0;
 return (
 <div key={item.stars} className="flex items-center gap-2">
 <span className="w-4 text-sm text-muted-foreground">{item.stars}</span>
 <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
 <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
 <div
 className="h-full bg-amber-500 rounded-full transition-all"
 style={{ width: `${percentage}%` }}
 />
 </div>
 <span className="w-12 text-sm text-muted-foreground text-right">
 {percentage.toFixed(0)}%
 </span>
 </div>
 );
 })}
 </div>
 )}
 </div>
 );
}

// ============================================
// Feedback Form
// ============================================

interface FeedbackFormProps {
 onSubmit?: (data: { rating: number; feedback: string }) => Promise<void>;
 title?: string;
 placeholder?: string;
 className?: string;
}

export function FeedbackForm({
 onSubmit,
  title = "Your Feedback",
  placeholder = "Please tell us what you think...",
 className,
}: FeedbackFormProps) {
 const [rating, setRating] = useState(0);
 const [feedback, setFeedback] = useState("");
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [isSubmitted, setIsSubmitted] = useState(false);

 const handleSubmit = async () => {
 if (rating === 0) return;
 setIsSubmitting(true);
 try {
 await onSubmit?.({ rating, feedback });
 setIsSubmitted(true);
 } finally {
 setIsSubmitting(false);
 }
 };

 if (isSubmitted) {
 return (
 <div className={cn("text-center py-8", className)}>
 <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
 <ThumbsUp className="w-6 h-6 text-emerald-500" />
 </div>
        <h3 className="font-semibold text-foreground mb-1">Thank You for Your Feedback!</h3>
        <p className="text-sm text-muted-foreground">Your feedback is very important to us</p>
 </div>
 );
 }

 return (
 <div className={cn("space-y-4", className)}>
 <div>
 <label className="block text-sm font-medium text-foreground mb-2">
 {title}
 </label>
 <StarRating value={rating} onChange={setRating} size="lg" />
 </div>

 <div>
 <Textarea
 placeholder={placeholder}
 value={feedback}
 onChange={(e) => setFeedback(e.target.value)}
 rows={4}
 />
 </div>

 <Button
 onClick={handleSubmit}
 disabled={rating === 0 || isSubmitting}
 className="w-full"
 >
 {isSubmitting ? (
 <>
 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
 Submit...
 </>
 ) : (
 <>
 <Send className="w-4 h-4 mr-2" />
            Submit Feedback
 </>
 )}
 </Button>
 </div>
 );
}

// ============================================
// Quick Feedback
// ============================================

interface QuickFeedbackProps {
 question?: string;
 onFeedback?: (isPositive: boolean) => void;
 className?: string;
}

export function QuickFeedback({
  question = "Was this answer helpful?",
 onFeedback,
 className,
}: QuickFeedbackProps) {
 const [submitted, setSubmitted] = useState<boolean | null>(null);

 const handleFeedback = (isPositive: boolean) => {
 setSubmitted(isPositive);
 onFeedback?.(isPositive);
 };

 if (submitted !== null) {
 return (
 <div className={cn("text-sm text-muted-foreground", className)}>
        Thank you for your feedback!
 </div>
 );
 }

 return (
 <div className={cn("flex items-center gap-3 text-sm", className)}>
 <span className="text-muted-foreground">{question}</span>
 <div className="flex items-center gap-1">
 <button
 onClick={() => handleFeedback(true)}
 className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500 transition-colors"
 >
 <ThumbsUp className="w-4 h-4" />
 </button>
 <button
 onClick={() => handleFeedback(false)}
 className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
 >
 <ThumbsDown className="w-4 h-4" />
 </button>
 </div>
 </div>
 );
}
