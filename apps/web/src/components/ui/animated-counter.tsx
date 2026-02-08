"use client";

/**
 * AnimatedCounter - Animated number counter component
 * 
 * Provides multiple types of number animation effects:
 * - Smooth transition
 * - Spring effect
 * - Digit scroll wheel
 * - Format support (thousands, percentage, currency, etc.)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
 value: number;
  duration?: number; // Animation duration (ms)
  delay?: number; // Delay before starting
 className?: string;
 format?: "number" | "percentage" | "currency" | "compact";
 prefix?: string;
 suffix?: string;
 decimals?: number;
 easing?: "linear" | "easeOut" | "easeInOut" | "spring";
 onComplete?: () => void;
}

// Easing functions
const easingFunctions = {
 linear: (t: number) => t,
 easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
 easeInOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
 spring: (t: number) => {
 const c4 = (2 * Math.PI) / 3;
 return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
 },
};

// Format number for display
const formatNumber = (
 value: number,
 format: AnimatedCounterProps["format"],
 decimals: number,
 prefix: string,
 suffix: string
): string => {
 let formatted: string;
 
 switch (format) {
 case "percentage":
 formatted = `${value.toFixed(decimals)}%`;
 break;
 case "currency":
 formatted = new Intl.NumberFormat("zh-CN", {
 style: "currency",
 currency: "CNY",
 minimumFractionDigits: decimals,
 maximumFractionDigits: decimals,
 }).format(value);
 break;
 case "compact":
 if (value >= 1000000) {
 formatted = `${(value / 1000000).toFixed(1)}M`;
 } else if (value >= 1000) {
 formatted = `${(value / 1000).toFixed(1)}K`;
 } else {
 formatted = value.toFixed(decimals);
 }
 break;
 default:
 formatted = new Intl.NumberFormat("zh-CN", {
 minimumFractionDigits: decimals,
 maximumFractionDigits: decimals,
 }).format(value);
 }
 
 return `${prefix}${formatted}${suffix}`;
};

export function AnimatedCounter({
 value,
 duration = 1000,
 delay = 0,
 className,
 format = "number",
 prefix = "",
 suffix = "",
 decimals = 0,
 easing = "easeOut",
 onComplete,
}: AnimatedCounterProps) {
 const [displayValue, setDisplayValue] = useState(0);
 const previousValue = useRef(0);
 const animationRef = useRef<number>();
 const startTimeRef = useRef<number>();
 
 useEffect(() => {
 const startValue = previousValue.current;
 const endValue = value;
 const easingFn = easingFunctions[easing];
 
 const animate = (timestamp: number) => {
 if (!startTimeRef.current) {
 startTimeRef.current = timestamp + delay;
 }
 
 const elapsed = timestamp - startTimeRef.current;
 
 if (elapsed < 0) {
 animationRef.current = requestAnimationFrame(animate);
 return;
 }
 
 const progress = Math.min(elapsed / duration, 1);
 const easedProgress = easingFn(progress);
 const currentValue = startValue + (endValue - startValue) * easedProgress;
 
 setDisplayValue(currentValue);
 
 if (progress < 1) {
 animationRef.current = requestAnimationFrame(animate);
 } else {
 previousValue.current = endValue;
 onComplete?.();
 }
 };
 
 startTimeRef.current = undefined;
 animationRef.current = requestAnimationFrame(animate);
 
 return () => {
 if (animationRef.current) {
 cancelAnimationFrame(animationRef.current);
 }
 };
 }, [value, duration, delay, easing, onComplete]);
 
 return (
 <span className={cn("tabular-nums", className)}>
 {formatNumber(displayValue, format, decimals, prefix, suffix)}
 </span>
 );
}

/**
 * RollingCounter - Scrolling digit animation
 * 
 * Each digit scrolls independently for a rolling effect
 */
interface RollingCounterProps {
 value: number;
 className?: string;
 digitClassName?: string;
 duration?: number;
}

export function RollingCounter({
 value,
 className,
 digitClassName,
 duration = 1000,
}: RollingCounterProps) {
 const digits = String(Math.floor(value)).split("");
 
 return (
 <span className={cn("inline-flex overflow-hidden", className)}>
 {digits.map((digit, index) => (
 <RollingDigit
 key={`${index}-${digits.length}`}
 digit={parseInt(digit)}
 className={digitClassName}
 duration={duration}
 delay={index * 100}
 />
 ))}
 </span>
 );
}

interface RollingDigitProps {
 digit: number;
 className?: string;
 duration: number;
 delay: number;
}

function RollingDigit({ digit, className, duration, delay }: RollingDigitProps) {
 const [currentDigit, setCurrentDigit] = useState(0);
 
 useEffect(() => {
 const timeout = setTimeout(() => {
 setCurrentDigit(digit);
 }, delay);
 
 return () => clearTimeout(timeout);
 }, [digit, delay]);
 
 return (
 <span 
 className={cn(
 "relative inline-block h-[1em] overflow-hidden",
 className
 )}
 >
 <span
 className="absolute inset-x-0 flex flex-col items-center transition-transform"
 style={{
 transform: `translateY(${-currentDigit * 100}%)`,
 transitionDuration: `${duration}ms`,
 transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
 }}
 >
 {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
 <span key={n} className="h-[1em] leading-none">
 {n}
 </span>
 ))}
 </span>
 {/* Placeholder to maintain width */}
 <span className="invisible">0</span>
 </span>
 );
}

/**
 * CountUpOnView - Triggers count animation when entering viewport
 */
interface CountUpOnViewProps extends Omit<AnimatedCounterProps, "delay"> {
 threshold?: number;
 triggerOnce?: boolean;
}

export function CountUpOnView({
 threshold = 0.5,
 triggerOnce = true,
 ...props
}: CountUpOnViewProps) {
 const [isVisible, setIsVisible] = useState(false);
 const ref = useRef<HTMLSpanElement>(null);
 
 useEffect(() => {
 const observer = new IntersectionObserver(
 ([entry]) => {
 if (entry.isIntersecting) {
 setIsVisible(true);
 if (triggerOnce) {
 observer.disconnect();
 }
 } else if (!triggerOnce) {
 setIsVisible(false);
 }
 },
 { threshold }
 );
 
 if (ref.current) {
 observer.observe(ref.current);
 }
 
 return () => observer.disconnect();
 }, [threshold, triggerOnce]);
 
 return (
 <span ref={ref}>
 <AnimatedCounter {...props} value={isVisible ? props.value : 0} />
 </span>
 );
}

/**
 * TrendCounter - Counter with trend indicator
 */
interface TrendCounterProps extends AnimatedCounterProps {
 previousValue?: number;
 showTrend?: boolean;
 trendClassName?: string;
}

export function TrendCounter({
 value,
 previousValue = 0,
 showTrend = true,
 trendClassName,
 ...props
}: TrendCounterProps) {
 const trend = value - previousValue;
 const trendPercentage = previousValue !== 0 ? ((trend / previousValue) * 100).toFixed(1) : "0";
 const isPositive = trend > 0;
 const isNegative = trend < 0;
 
 return (
 <span className="inline-flex items-center gap-2">
 <AnimatedCounter value={value} {...props} />
 {showTrend && trend !== 0 && (
 <span
 className={cn(
 "inline-flex items-center text-xs font-medium",
 isPositive && "text-emerald-500",
 isNegative && "text-red-500",
 trendClassName
 )}
 >
 <span className={cn(
 "inline-block transition-transform",
 isPositive && "-rotate-45",
 isNegative && "rotate-45"
 )}>
 →
 </span>
 {isPositive && "+"}
 {trendPercentage}%
 </span>
 )}
 </span>
 );
}

/**
 * ProgressCounter - Counter with progress bar
 */
interface ProgressCounterProps {
 value: number;
 max?: number;
 className?: string;
 barClassName?: string;
 showPercentage?: boolean;
 duration?: number;
}

export function ProgressCounter({
 value,
 max = 100,
 className,
 barClassName,
 showPercentage = true,
 duration = 1000,
}: ProgressCounterProps) {
 const [progress, setProgress] = useState(0);
 const percentage = Math.min((value / max) * 100, 100);
 
 useEffect(() => {
 const timeout = setTimeout(() => {
 setProgress(percentage);
 }, 100);
 return () => clearTimeout(timeout);
 }, [percentage]);
 
 return (
 <div className={cn("space-y-2", className)}>
 {showPercentage && (
 <div className="flex justify-between text-sm">
 <AnimatedCounter value={value} duration={duration} />
 <span className="text-muted-foreground">/ {max}</span>
 </div>
 )}
 <div className="h-2 bg-muted rounded-full overflow-hidden">
 <div
 className={cn(
 "h-full bg-primary rounded-full transition-all",
 barClassName
 )}
 style={{
 width: `${progress}%`,
 transitionDuration: `${duration}ms`,
 transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
 }}
 />
 </div>
 </div>
 );
}

export default AnimatedCounter;
