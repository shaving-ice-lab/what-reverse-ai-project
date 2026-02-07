"use client";

/**
 * CountUp - countcharScrollAnimationComponent
 * 
 * Used forShowcaseStatisticsData'sDynamiccountcharEffect
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CountUpProps {
 end: number;
 start?: number;
 duration?: number;
 decimals?: number;
 prefix?: string;
 suffix?: string;
 separator?: string;
 className?: string;
 enableScrollTrigger?: boolean;
}

export function CountUp({
 end,
 start = 0,
 duration = 2000,
 decimals = 0,
 prefix = "",
 suffix = "",
 separator = ",",
 className,
 enableScrollTrigger = true,
}: CountUpProps) {
 const [count, setCount] = useState(start);
 const [hasAnimated, setHasAnimated] = useState(false);
 const ref = useRef<HTMLSpanElement>(null);

 const formatNumber = (num: number) => {
 const fixed = num.toFixed(decimals);
 const parts = fixed.split(".");
 parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
 return parts.join(".");
 };

 useEffect(() => {
 if (!enableScrollTrigger) {
 animate();
 return;
 }

 const observer = new IntersectionObserver(
 (entries) => {
 entries.forEach((entry) => {
 if (entry.isIntersecting && !hasAnimated) {
 animate();
 setHasAnimated(true);
 }
 });
 },
 { threshold: 0.1 }
 );

 if (ref.current) {
 observer.observe(ref.current);
 }

 return () => observer.disconnect();
 }, [hasAnimated, enableScrollTrigger]);

 const animate = () => {
 const startTime = performance.now();
 const startValue = start;
 const endValue = end;

 const step = (currentTime: number) => {
 const elapsed = currentTime - startTime;
 const progress = Math.min(elapsed / duration, 1);
 
 // Easing function (easeOutExpo)
 const easeOutExpo = progress === 1 
 ? 1 
 : 1 - Math.pow(2, -10 * progress);
 
 const currentCount = startValue + (endValue - startValue) * easeOutExpo;
 setCount(currentCount);

 if (progress < 1) {
 requestAnimationFrame(step);
 }
 };

 requestAnimationFrame(step);
 };

 return (
 <span ref={ref} className={cn("tabular-nums", className)}>
 {prefix}
 {formatNumber(count)}
 {suffix}
 </span>
 );
}

export default CountUp;
