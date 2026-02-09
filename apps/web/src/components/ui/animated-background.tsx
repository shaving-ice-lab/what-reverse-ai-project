"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AnimatedBackgroundProps
 extends React.HTMLAttributes<HTMLDivElement> {
  /** Background variant */
  variant?: "mesh" | "gradient" | "dots" | "grid" | "aurora" | "waves" | "particles" | "glow-lines" | "cyber-grid";
  /** Whether to enable animation */
  animated?: boolean;
  /** Animation speed */
  speed?: "slow" | "normal" | "fast";
  /** Opacity */
  opacity?: number;
  /** Whether to use fixed background */
  fixed?: boolean;
  /** Main hue */
  primaryColor?: string;
  /** Secondary hue */
  secondaryColor?: string;
  /** Whether to display noise texture */
  showNoise?: boolean;
}

const AnimatedBackground = React.forwardRef<
 HTMLDivElement,
 AnimatedBackgroundProps
>(
 (
 {
 className,
 variant = "mesh",
 animated = true,
 speed = "slow",
 opacity = 1,
 fixed = false,
 primaryColor = "oklch(0.65 0.18 260)",
 secondaryColor = "oklch(0.7 0.15 200)",
 showNoise = true,
 children,
 ...props
 },
 ref
 ) => {
 const speedClass = {
 slow: "animate-[rotate-gradient_20s_ease_infinite]",
 normal: "animate-[rotate-gradient_10s_ease_infinite]",
 fast: "animate-[rotate-gradient_5s_ease_infinite]",
 };

 const floatSpeed = {
 slow: "[animation-duration:20s]",
 normal: "[animation-duration:10s]",
 fast: "[animation-duration:5s]",
 };

 return (
 <div
 ref={ref}
 className={cn("relative overflow-hidden", className)}
 {...props}
 >
 {/* Background */}
 <div
 className={cn(
 "absolute inset-0 -z-10",
 fixed && "fixed"
 )}
 style={{ opacity }}
 >
 {variant === "mesh" && (
 <div className="absolute inset-0 gradient-mesh" />
 )}

 {variant === "gradient" && (
 <div
 className={cn(
 "absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20",
 animated && speedClass[speed]
 )}
 style={{ backgroundSize: "400% 400%" }}
 />
 )}

 {variant === "dots" && (
 <div
 className="absolute inset-0"
 style={{
 backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-border) 1px, transparent 0)`,
 backgroundSize: "40px 40px",
 }}
 />
 )}

 {variant === "grid" && (
 <div
 className="absolute inset-0"
 style={{
 backgroundImage: `
 linear-gradient(var(--color-border) 1px, transparent 1px),
 linear-gradient(90deg, var(--color-border) 1px, transparent 1px)
 `,
 backgroundSize: "60px 60px",
 }}
 />
 )}

 {variant === "aurora" && (
 <>
 <div
 className={cn(
 "absolute -top-1/2 -left-1/2 w-full h-full rounded-full opacity-30 blur-3xl",
 animated && "animate-float-slow",
 floatSpeed[speed]
 )}
 style={{
 background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)`,
 }}
 />
 <div
 className={cn(
 "absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full opacity-20 blur-3xl",
 animated && "animate-float-slow [animation-delay:3s]",
 floatSpeed[speed]
 )}
 style={{
 background: `radial-gradient(circle, ${secondaryColor} 0%, transparent 70%)`,
 }}
 />
 <div
 className={cn(
 "absolute top-1/4 right-1/4 w-1/2 h-1/2 rounded-full opacity-25 blur-3xl",
 animated && "animate-float [animation-delay:1.5s]",
 floatSpeed[speed]
 )}
 style={{
 background: "radial-gradient(circle, oklch(0.7 0.12 300) 0%, transparent 70%)",
 }}
 />
 </>
 )}

 {/* Add: WaveBackground */}
 {variant === "waves" && (
 <div className="absolute inset-0">
 <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
 <defs>
 <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
 <stop offset="0%" stopColor={primaryColor} stopOpacity="0.15" />
 <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.05" />
 </linearGradient>
 </defs>
 <path
 d="M0,100 C150,200 350,0 500,100 C650,200 850,0 1000,100 L1000,300 L0,300 Z"
 fill="url(#wave-gradient)"
 className={cn(animated && "animate-[wave_15s_ease-in-out_infinite]")}
 style={{ transformOrigin: "center" }}
 />
 <path
 d="M0,150 C200,50 300,250 500,150 C700,50 800,250 1000,150 L1000,300 L0,300 Z"
 fill="url(#wave-gradient)"
 className={cn(animated && "animate-[wave_12s_ease-in-out_infinite_reverse]")}
 style={{ transformOrigin: "center", opacity: 0.6 }}
 />
 </svg>
 </div>
 )}

 {/* Add: ParticleEffect */}
 {variant === "particles" && (
 <div className="absolute inset-0">
 {[...Array(20)].map((_, i) => (
 <div
 key={i}
 className={cn(
 "absolute rounded-full",
 animated && "animate-float"
 )}
 style={{
 width: Math.random() * 6 + 2,
 height: Math.random() * 6 + 2,
 left: `${Math.random() * 100}%`,
 top: `${Math.random() * 100}%`,
 background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)`,
 boxShadow: `0 0 ${Math.random() * 10 + 5}px ${primaryColor}`,
 animationDelay: `${Math.random() * 5}s`,
 animationDuration: `${Math.random() * 10 + 10}s`,
 opacity: Math.random() * 0.5 + 0.3,
 }}
 />
 ))}
 </div>
 )}

 {/* Add: Glowline */}
 {variant === "glow-lines" && (
 <div className="absolute inset-0 overflow-hidden">
 {[...Array(5)].map((_, i) => (
 <div
 key={i}
 className={cn(
 "absolute h-[1px] w-[200%]",
 animated && "animate-[slide-left_8s_linear_infinite]"
 )}
 style={{
 top: `${20 + i * 15}%`,
 left: "-100%",
 background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)`,
 boxShadow: `0 0 20px ${primaryColor}, 0 0 40px ${primaryColor}`,
 animationDelay: `${i * 1.5}s`,
 opacity: 0.4 - i * 0.05,
 }}
 />
 ))}
 </div>
 )}

 {/* Add: Grid */}
 {variant === "cyber-grid" && (
 <div className="absolute inset-0">
 {/* visualGrid */}
 <div
 className="absolute inset-0"
 style={{
 backgroundImage: `
 linear-gradient(${primaryColor}20 1px, transparent 1px),
 linear-gradient(90deg, ${primaryColor}20 1px, transparent 1px)
 `,
 backgroundSize: "50px 50px",
 transform: "perspective(500px) rotateX(60deg)",
 transformOrigin: "center top",
 }}
 />
 {/* lineGlow */}
 <div 
 className="absolute bottom-0 left-0 right-0 h-1/3"
 style={{
 background: `linear-gradient(to top, ${primaryColor}30, transparent)`,
 }}
 />
 {/* ScanlineEffect */}
 {animated && (
 <div
 className="absolute inset-0 animate-[scan_4s_linear_infinite]"
 style={{
 background: `linear-gradient(to bottom, transparent, ${primaryColor}10 50%, transparent)`,
 backgroundSize: "100% 200%",
 }}
 />
 )}
 </div>
 )}
 </div>

 {/* NoiseTextureOverlay */}
 {showNoise && (
 <div
 className="absolute inset-0 -z-10 opacity-[0.015] pointer-events-none"
 style={{
 backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
 }}
 />
 )}

 {/* Content */}
 <div className="relative z-10">{children}</div>
 </div>
 );
 }
);
AnimatedBackground.displayName = "AnimatedBackground";

// FloatingDecorationElement
export interface FloatingOrbProps extends React.HTMLAttributes<HTMLDivElement> {
 size?: "sm" | "md" | "lg" | "xl";
 color?: string;
 blur?: boolean;
 animated?: boolean;
 intensity?: "subtle" | "normal" | "strong";
}

const FloatingOrb = React.forwardRef<HTMLDivElement, FloatingOrbProps>(
 (
 {
 className,
 size = "md",
 color = "oklch(0.65 0.18 260 / 0.3)",
 blur = true,
 animated = true,
 intensity = "normal",
 style,
 ...props
 },
 ref
 ) => {
 const sizeClasses = {
 sm: "w-32 h-32",
 md: "w-64 h-64",
 lg: "w-96 h-96",
 xl: "w-[32rem] h-[32rem]",
 };

 const intensityOpacity = {
 subtle: 0.15,
 normal: 0.3,
 strong: 0.5,
 };

 return (
 <div
 ref={ref}
 className={cn(
 "absolute rounded-full pointer-events-none",
 sizeClasses[size],
 blur && "blur-3xl",
 animated && "animate-float-slow",
 className
 )}
 style={{
 background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
 opacity: intensityOpacity[intensity],
 ...style,
 }}
 {...props}
 />
 );
 }
);
FloatingOrb.displayName = "FloatingOrb";

// Glow
export interface GlowDotProps extends React.HTMLAttributes<HTMLDivElement> {
 size?: number;
 color?: string;
 animated?: boolean;
 pulseIntensity?: "subtle" | "normal" | "strong";
}

const GlowDot = React.forwardRef<HTMLDivElement, GlowDotProps>(
 (
 {
 className,
 size = 8,
 color = "oklch(0.65 0.18 260)",
 animated = true,
 pulseIntensity = "normal",
 style,
 ...props
 },
 ref
 ) => {
 const glowMultiplier = {
 subtle: 1,
 normal: 2,
 strong: 3,
 };

 return (
 <div
 ref={ref}
 className={cn(
 "absolute rounded-full",
 animated && "animate-glow-pulse",
 className
 )}
 style={{
 width: size,
 height: size,
 backgroundColor: color,
 boxShadow: `0 0 ${size * glowMultiplier[pulseIntensity]}px ${color}, 0 0 ${size * glowMultiplier[pulseIntensity] * 2}px ${color}`,
 ...style,
 }}
 {...props}
 />
 );
 }
);
GlowDot.displayName = "GlowDot";

// Glowline
export interface GlowLineProps extends React.HTMLAttributes<HTMLDivElement> {
 direction?: "horizontal" | "vertical" | "diagonal";
 color?: string;
 animated?: boolean;
 thickness?: number;
 length?: string;
}

const GlowLine = React.forwardRef<HTMLDivElement, GlowLineProps>(
 (
 {
 className,
 direction = "horizontal",
 color = "oklch(0.65 0.18 260)",
 animated = true,
 thickness = 2,
 length = "100%",
 style,
 ...props
 },
 ref
 ) => {
 const directionStyles = {
 horizontal: { width: length, height: thickness },
 vertical: { width: thickness, height: length },
 diagonal: { width: length, height: thickness, transform: "rotate(45deg)" },
 };

 return (
 <div
 ref={ref}
 className={cn(
 "absolute pointer-events-none",
 animated && "animate-pulse",
 className
 )}
 style={{
 ...directionStyles[direction],
 background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
 boxShadow: `0 0 10px ${color}, 0 0 20px ${color}`,
 ...style,
 }}
 {...props}
 />
 );
 }
);
GlowLine.displayName = "GlowLine";

// Pulse
export interface PulseRingProps extends React.HTMLAttributes<HTMLDivElement> {
 size?: number;
 color?: string;
 count?: number;
 duration?: number;
}

const PulseRing = React.forwardRef<HTMLDivElement, PulseRingProps>(
 (
 {
 className,
 size = 100,
 color = "oklch(0.65 0.18 260)",
 count = 3,
 duration = 2,
 style,
 ...props
 },
 ref
 ) => {
 return (
 <div
 ref={ref}
 className={cn("absolute pointer-events-none", className)}
 style={{
 width: size,
 height: size,
 ...style,
 }}
 {...props}
 >
 {[...Array(count)].map((_, i) => (
 <div
 key={i}
 className="absolute inset-0 rounded-full border-2 animate-pulse-ring"
 style={{
 borderColor: color,
 animationDelay: `${(i * duration) / count}s`,
 animationDuration: `${duration}s`,
 }}
 />
 ))}
 </div>
 );
 }
);
PulseRing.displayName = "PulseRing";

// GradientLight Spot
export interface GradientSpotProps extends React.HTMLAttributes<HTMLDivElement> {
 size?: "sm" | "md" | "lg";
 colors?: string[];
 animated?: boolean;
 blur?: number;
}

const GradientSpot = React.forwardRef<HTMLDivElement, GradientSpotProps>(
 (
 {
 className,
 size = "md",
 colors = ["oklch(0.65 0.18 260)", "oklch(0.7 0.15 200)"],
 animated = true,
 blur = 60,
 style,
 ...props
 },
 ref
 ) => {
 const sizeClasses = {
 sm: "w-40 h-40",
 md: "w-80 h-80",
 lg: "w-[30rem] h-[30rem]",
 };

 return (
 <div
 ref={ref}
 className={cn(
 "absolute rounded-full pointer-events-none",
 sizeClasses[size],
 animated && "animate-gradient-shift",
 className
 )}
 style={{
 background: `linear-gradient(135deg, ${colors.join(", ")})`,
 filter: `blur(${blur}px)`,
 opacity: 0.4,
 ...style,
 }}
 {...props}
 />
 );
 }
);
GradientSpot.displayName = "GradientSpot";

// GridLight Effect
export interface GridGlowProps extends React.HTMLAttributes<HTMLDivElement> {
 cellSize?: number;
 color?: string;
 glowIntensity?: number;
}

const GridGlow = React.forwardRef<HTMLDivElement, GridGlowProps>(
 (
 {
 className,
 cellSize = 40,
 color = "oklch(0.65 0.18 260 / 0.1)",
 glowIntensity = 0.5,
 style,
 ...props
 },
 ref
 ) => {
 return (
 <div
 ref={ref}
 className={cn("absolute inset-0 pointer-events-none", className)}
 style={{
 backgroundImage: `
 linear-gradient(${color} 1px, transparent 1px),
 linear-gradient(90deg, ${color} 1px, transparent 1px)
 `,
 backgroundSize: `${cellSize}px ${cellSize}px`,
 ...style,
 }}
 {...props}
 >
 {/* centerHalo */}
 <div
 className="absolute inset-0"
 style={{
 background: `radial-gradient(circle at center, oklch(0.65 0.18 260 / ${glowIntensity}) 0%, transparent 50%)`,
 }}
 />
 </div>
 );
 }
);
GridGlow.displayName = "GridGlow";

export { 
 AnimatedBackground, 
 FloatingOrb, 
 GlowDot, 
 GlowLine, 
 PulseRing, 
 GradientSpot, 
 GridGlow 
};
