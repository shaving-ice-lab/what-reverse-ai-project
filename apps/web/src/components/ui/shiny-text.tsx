"use client";

/**
 * ShinyText - Character Component
 * 
 * Provide multiple type characters: 
 * - Past effect
 * - Gradient character
 * - Character effect
 */

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ShinyTextProps {
 children: ReactNode;
 className?: string;
 shimmerColor?: string;
 shimmerWidth?: number;
 animationDuration?: number;
 as?: "span" | "h1" | "h2" | "h3" | "h4" | "p";
}

/**
 * ShinyText - Past character
 */
export function ShinyText({
 children,
 className,
 shimmerColor = "rgba(255, 255, 255, 0.8)",
 shimmerWidth = 100,
 animationDuration = 3,
 as: Component = "span",
}: ShinyTextProps) {
 return (
 <Component
 className={cn(
 "relative inline-block bg-clip-text",
 className
 )}
 style={{
 "--shimmer-color": shimmerColor,
 "--shimmer-width": `${shimmerWidth}px`,
 "--animation-duration": `${animationDuration}s`,
 } as React.CSSProperties}
 >
 {children}
 <span
 className="absolute inset-0 animate-shimmer pointer-events-none"
 style={{
 background: `linear-gradient(
 90deg,
 transparent 0%,
 transparent calc(50% - var(--shimmer-width) / 2),
 var(--shimmer-color) 50%,
 transparent calc(50% + var(--shimmer-width) / 2),
 transparent 100%
 )`,
 backgroundSize: "200% 100%",
 WebkitBackgroundClip: "text",
 backgroundClip: "text",
 WebkitTextFillColor: "transparent",
 animationDuration: "var(--animation-duration)",
 }}
 />
 
 <style jsx>{`
 @keyframes shimmer {
 0% {
 background-position: 200% 0;
 }
 100% {
 background-position: -200% 0;
 }
 }
 .animate-shimmer {
 animation: shimmer linear infinite;
 }
 `}</style>
 </Component>
 );
}

/**
 * GradientText - Gradient character
 */
interface GradientTextProps {
 children: ReactNode;
 className?: string;
 gradient?: string;
 animate?: boolean;
 animationDuration?: number;
 as?: "span" | "h1" | "h2" | "h3" | "h4" | "p";
}

// PresetGradient
export const textGradients = {
 primary: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.9) 100%)",
 rainbow: "linear-gradient(90deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7)",
 sunset: "linear-gradient(90deg, #FF6B6B, #FF8E53, #FFC837)",
 ocean: "linear-gradient(90deg, #667eea, #764ba2)",
 aurora: "linear-gradient(90deg, #00C9FF, #92FE9D)",
 fire: "linear-gradient(90deg, #FF4B2B, #FF416C)",
 emerald: "linear-gradient(90deg, hsl(var(--primary)), #10B981, #059669)",
 gold: "linear-gradient(90deg, #FFD700, #FFA500, #FFD700)",
};

export function GradientText({
 children,
 className,
 gradient = textGradients.primary,
 animate = false,
 animationDuration = 3,
 as: Component = "span",
}: GradientTextProps) {
 return (
 <Component
 className={cn(
 "bg-clip-text text-transparent",
 animate && "animate-gradient-text",
 className
 )}
 style={{
 background: gradient,
 backgroundSize: animate ? "200% auto" : "100% auto",
 WebkitBackgroundClip: "text",
 backgroundClip: "text",
 animationDuration: animate ? `${animationDuration}s` : undefined,
 }}
 >
 {children}
 
 {animate && (
 <style jsx>{`
 @keyframes gradient-text {
 0%, 100% {
 background-position: 0% center;
 }
 50% {
 background-position: 100% center;
 }
 }
 .animate-gradient-text {
 animation: gradient-text ease infinite;
 }
 `}</style>
 )}
 </Component>
 );
}

/**
 * GlitchText - Fault character effect
 */
interface GlitchTextProps {
 children: string;
 className?: string;
 glitchColor1?: string;
 glitchColor2?: string;
 as?: "span" | "h1" | "h2" | "h3" | "h4" | "p";
}

export function GlitchText({
 children,
 className,
 glitchColor1 = "#00ffff",
 glitchColor2 = "#ff00ff",
 as: Component = "span",
}: GlitchTextProps) {
 return (
 <Component
 className={cn("relative inline-block", className)}
 style={{
 "--glitch-color-1": glitchColor1,
 "--glitch-color-2": glitchColor2,
 } as React.CSSProperties}
 >
 <span className="relative z-10">{children}</span>
 <span
 className="absolute top-0 left-0 opacity-70 animate-glitch-1"
 style={{ color: glitchColor1, clipPath: "polygon(0 0, 100% 0, 100% 45%, 0 45%)" }}
 aria-hidden
 >
 {children}
 </span>
 <span
 className="absolute top-0 left-0 opacity-70 animate-glitch-2"
 style={{ color: glitchColor2, clipPath: "polygon(0 55%, 100% 55%, 100% 100%, 0 100%)" }}
 aria-hidden
 >
 {children}
 </span>
 
 <style jsx>{`
 @keyframes glitch-1 {
 0%, 100% {
 transform: translate(0);
 }
 20% {
 transform: translate(-2px, 2px);
 }
 40% {
 transform: translate(-2px, -2px);
 }
 60% {
 transform: translate(2px, 2px);
 }
 80% {
 transform: translate(2px, -2px);
 }
 }
 @keyframes glitch-2 {
 0%, 100% {
 transform: translate(0);
 }
 20% {
 transform: translate(2px, -2px);
 }
 40% {
 transform: translate(2px, 2px);
 }
 60% {
 transform: translate(-2px, -2px);
 }
 80% {
 transform: translate(-2px, 2px);
 }
 }
 .animate-glitch-1 {
 animation: glitch-1 2s infinite linear;
 }
 .animate-glitch-2 {
 animation: glitch-2 2s infinite linear;
 animation-delay: 0.1s;
 }
 `}</style>
 </Component>
 );
}

/**
 * BlurText - Blur enter character
 */
interface BlurTextProps {
 children: string;
 className?: string;
 delay?: number;
 staggerDelay?: number;
 as?: "span" | "h1" | "h2" | "h3" | "h4" | "p";
}

export function BlurText({
 children,
 className,
 delay = 0,
 staggerDelay = 0.05,
 as: Component = "span",
}: BlurTextProps) {
 const words = children.split("");

 return (
 <Component className={cn("inline-block", className)}>
 {words.map((word, i) => (
 <span
 key={i}
 className="inline-block animate-blur-in"
 style={{
 animationDelay: `${delay + i * staggerDelay}s`,
 }}
 >
 {word}
 {i < words.length - 1 && <span>&nbsp;</span>}
 </span>
 ))}
 
 <style jsx>{`
 @keyframes blur-in {
 0% {
 opacity: 0;
 filter: blur(10px);
 transform: translateY(10px);
 }
 100% {
 opacity: 1;
 filter: blur(0);
 transform: translateY(0);
 }
 }
 .animate-blur-in {
 opacity: 0;
 animation: blur-in 0.6s ease forwards;
 }
 `}</style>
 </Component>
 );
}

/**
 * HighlightText - Highlight character
 * 
 * Background highlight animation effect
 */
interface HighlightTextProps {
 children: ReactNode;
 className?: string;
 highlightColor?: string;
 animate?: boolean;
 animationDelay?: number;
}

export function HighlightText({
 children,
 className,
 highlightColor = "rgba(62, 207, 142, 0.3)",
 animate = true,
 animationDelay = 0,
}: HighlightTextProps) {
 return (
 <span
 className={cn(
 "relative inline-block",
 className
 )}
 >
 <span className="relative z-10">{children}</span>
 <span
 className={cn(
 "absolute bottom-0 left-0 h-[40%] w-0",
 animate && "animate-highlight"
 )}
 style={{
 backgroundColor: highlightColor,
 animationDelay: `${animationDelay}s`,
 }}
 />
 
 <style jsx>{`
 @keyframes highlight {
 0% {
 width: 0;
 }
 100% {
 width: 100%;
 }
 }
 .animate-highlight {
 animation: highlight 0.6s ease forwards;
 }
 `}</style>
 </span>
 );
}

export default ShinyText;
