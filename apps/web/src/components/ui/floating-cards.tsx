"use client";

import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface FloatingCardItem {
 id: string;
 title: string;
 description: string;
 icon: LucideIcon;
 color?: string;
 stats?: string;
}

export interface FloatingCapabilityCardsProps extends React.HTMLAttributes<HTMLDivElement> {
 items: FloatingCardItem[];
 /** Layout method */
 layout?: "horizontal" | "grid" | "orbital";
}

export function FloatingCapabilityCards({
 items,
 layout = "horizontal",
 className,
 ...props
}: FloatingCapabilityCardsProps) {
 const [hoveredId, setHoveredId] = useState<string | null>(null);

 return (
 <div
 className={cn(
 "relative",
 layout === "horizontal" && "flex flex-wrap justify-center gap-4",
 layout === "grid" && "grid grid-cols-2 md:grid-cols-4 gap-4",
 layout === "orbital" && "relative h-[400px]",
 className
 )}
 {...props}
 >
 {items.map((item, index) => {
 const Icon = item.icon;
 const isHovered = hoveredId === item.id;
 
 // Calculate orbit layout
 const orbitalStyle = layout === "orbital" ? {
 position: "absolute" as const,
 left: `${50 + 35 * Math.cos((index * 2 * Math.PI) / items.length)}%`,
 top: `${50 + 35 * Math.sin((index * 2 * Math.PI) / items.length)}%`,
 transform: "translate(-50%, -50%)",
 animationDelay: `${index * 0.5}s`,
 } : {};

 return (
 <div
 key={item.id}
 className={cn(
 "group relative",
 layout === "orbital" && "animate-float-gentle"
 )}
 style={orbitalStyle}
 onMouseEnter={() => setHoveredId(item.id)}
 onMouseLeave={() => setHoveredId(null)}
 >
 {/* Main Card */}
 <div
 className={cn(
 "relative p-5 rounded-2xl cursor-pointer",
 "bg-card/80 backdrop-blur-sm border border-border/50",
 "transition-all duration-500 ease-out",
 "hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10",
 isHovered && "scale-105 -translate-y-2",
 layout !== "orbital" && "w-[180px]"
 )}
 style={{
 transform: isHovered 
 ? "perspective(1000px) rotateX(-5deg) rotateY(5deg) translateY(-8px) scale(1.05)"
 : "perspective(1000px) rotateX(0) rotateY(0)",
 transformStyle: "preserve-3d",
 }}
 >
 {/* GlowEffect */}
 <div 
 className={cn(
 "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500",
 isHovered && "opacity-100"
 )}
 style={{
 background: `radial-gradient(circle at 50% 0%, ${item.color || 'hsl(var(--primary))'}20 0%, transparent 50%)`,
 }}
 />

 {/* Icon */}
 <div
 className={cn(
 "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
 "transition-all duration-300",
 isHovered ? "scale-110" : ""
 )}
 style={{
 backgroundColor: `${item.color || 'hsl(var(--primary))'}15`,
 }}
 >
 <Icon 
 className="w-6 h-6 transition-all duration-300"
 style={{ color: item.color || 'hsl(var(--primary))' }}
 />
 </div>

 {/* Title */}
 <h4 className="font-semibold text-foreground mb-1 transition-colors">
 {item.title}
 </h4>

 {/* Description */}
 <p className="text-xs text-muted-foreground line-clamp-2">
 {item.description}
 </p>

 {/* Statistics */}
 {item.stats && (
 <div 
 className={cn(
 "mt-3 pt-3 border-t border-border/50",
 "text-xs font-medium transition-colors",
 )}
 style={{ color: item.color || 'hsl(var(--primary))' }}
 >
 {item.stats}
 </div>
 )}

 {/* Floating light points */}
 {isHovered && (
 <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-ping" />
 )}
 </div>
 </div>
 );
 })}

 <style jsx>{`
 @keyframes float-gentle {
 0%, 100% {
 transform: translate(-50%, -50%) translateY(0);
 }
 50% {
 transform: translate(-50%, -50%) translateY(-10px);
 }
 }
 .animate-float-gentle {
 animation: float-gentle 4s ease-in-out infinite;
 }
 `}</style>
 </div>
 );
}

// 3D Floating Card
export interface FloatingCard3DProps extends React.HTMLAttributes<HTMLDivElement> {
 children: React.ReactNode;
 /** 3D effect intensity */
 intensity?: number;
 /** Whether to enable glow */
 glow?: boolean;
 glowColor?: string;
}

export function FloatingCard3D({
 children,
 intensity = 15,
 glow = true,
 glowColor = "hsl(var(--primary))",
 className,
 ...props
}: FloatingCard3DProps) {
 const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0 });
 const [isHovered, setIsHovered] = useState(false);

 const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
 const rect = e.currentTarget.getBoundingClientRect();
 const x = e.clientX - rect.left;
 const y = e.clientY - rect.top;
 const centerX = rect.width / 2;
 const centerY = rect.height / 2;

 const rotateX = ((y - centerY) / centerY) * -intensity;
 const rotateY = ((x - centerX) / centerX) * intensity;

 setTransform({ rotateX, rotateY });
 };

 const handleMouseLeave = () => {
 setTransform({ rotateX: 0, rotateY: 0 });
 setIsHovered(false);
 };

 return (
 <div
 className={cn(
 "relative transition-transform duration-200 ease-out",
 className
 )}
 style={{
 transform: `perspective(1000px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg)`,
 transformStyle: "preserve-3d",
 }}
 onMouseMove={handleMouseMove}
 onMouseEnter={() => setIsHovered(true)}
 onMouseLeave={handleMouseLeave}
 {...props}
 >
 {/* GlowEffect */}
 {glow && isHovered && (
 <div
 className="absolute -inset-4 rounded-3xl blur-2xl opacity-30 transition-opacity duration-300 -z-10"
 style={{
 background: `radial-gradient(circle at 50% 50%, ${glowColor}, transparent 70%)`,
 }}
 />
 )}
 {children}
 </div>
 );
}

// Hero Section Capability Badge
export interface CapabilityBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
 icon: LucideIcon;
 label: string;
 value?: string;
 color?: string;
 animated?: boolean;
}

export function CapabilityBadge({
 icon: Icon,
 label,
 value,
 color = "hsl(var(--primary))",
 animated = true,
 className,
 ...props
}: CapabilityBadgeProps) {
 return (
 <div
 className={cn(
 "inline-flex items-center gap-2 px-4 py-2 rounded-xl",
 "bg-card/80 backdrop-blur-sm border border-border/50",
 "hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5",
 "transition-all duration-300 cursor-default",
 animated && "animate-fade-in-up",
 className
 )}
 {...props}
 >
 <div
 className="w-8 h-8 rounded-lg flex items-center justify-center"
 style={{ backgroundColor: `${color}15` }}
 >
 <Icon className="w-4 h-4" style={{ color }} />
 </div>
 <div className="text-left">
 <p className="text-xs text-muted-foreground">{label}</p>
 {value && (
 <p className="text-sm font-semibold text-foreground">{value}</p>
 )}
 </div>
 </div>
 );
}
