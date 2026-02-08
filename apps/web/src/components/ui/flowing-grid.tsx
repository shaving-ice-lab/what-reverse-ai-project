"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface FlowingGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Grid cell size */
  cellSize?: number;
  /** Line color */
  lineColor?: string;
  /** Dot color */
  dotColor?: string;
  /** Glow color */
  glowColor?: string;
  /** Whether to display dots */
  showDots?: boolean;
  /** Whether to display pulse effect */
  showPulse?: boolean;
  /** Animation speed */
  speed?: "slow" | "normal" | "fast";
  /** Opacity */
  opacity?: number;
}

export function FlowingGrid({
 cellSize = 50,
 lineColor = "rgba(62, 207, 142, 0.1)",
 dotColor = "rgba(62, 207, 142, 0.3)",
 glowColor = "hsl(var(--primary))",
 showDots = true,
 showPulse = true,
 speed = "normal",
 opacity = 1,
 className,
 ...props
}: FlowingGridProps) {
 const containerRef = useRef<HTMLDivElement>(null);
 const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
 const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

 useEffect(() => {
 const updateDimensions = () => {
 if (containerRef.current) {
 setDimensions({
 width: containerRef.current.offsetWidth,
 height: containerRef.current.offsetHeight,
 });
 }
 };

 updateDimensions();
 window.addEventListener("resize", updateDimensions);
 return () => window.removeEventListener("resize", updateDimensions);
 }, []);

 const handleMouseMove = (e: React.MouseEvent) => {
 if (containerRef.current) {
 const rect = containerRef.current.getBoundingClientRect();
 setMousePos({
 x: e.clientX - rect.left,
 y: e.clientY - rect.top,
 });
 }
 };

 const handleMouseLeave = () => {
 setMousePos({ x: -1000, y: -1000 });
 };

 const cols = Math.ceil(dimensions.width / cellSize) + 1;
 const rows = Math.ceil(dimensions.height / cellSize) + 1;

 const speedDuration = {
 slow: "4s",
 normal: "2s",
 fast: "1s",
 };

 return (
 <div
 ref={containerRef}
 className={cn("absolute inset-0 overflow-hidden", className)}
 onMouseMove={handleMouseMove}
 onMouseLeave={handleMouseLeave}
 style={{ opacity }}
 {...props}
 >
 {/* Grid Lines */}
 <svg
 className="absolute inset-0 w-full h-full"
 xmlns="http://www.w3.org/2000/svg"
 >
 <defs>
 {/* Glow */}
 <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
 <feGaussianBlur stdDeviation="2" result="coloredBlur" />
 <feMerge>
 <feMergeNode in="coloredBlur" />
 <feMergeNode in="SourceGraphic" />
 </feMerge>
 </filter>
 
 {/* FlowGradient */}
 <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
 <stop offset="0%" stopColor={glowColor} stopOpacity="0">
 <animate
 attributeName="offset"
 values="-0.5;1.5"
 dur={speedDuration[speed]}
 repeatCount="indefinite"
 />
 </stop>
 <stop offset="50%" stopColor={glowColor} stopOpacity="0.8">
 <animate
 attributeName="offset"
 values="0;2"
 dur={speedDuration[speed]}
 repeatCount="indefinite"
 />
 </stop>
 <stop offset="100%" stopColor={glowColor} stopOpacity="0">
 <animate
 attributeName="offset"
 values="0.5;2.5"
 dur={speedDuration[speed]}
 repeatCount="indefinite"
 />
 </stop>
 </linearGradient>

 {/* VerticalFlowGradient */}
 <linearGradient id="flowGradientV" x1="0%" y1="0%" x2="0%" y2="100%">
 <stop offset="0%" stopColor={glowColor} stopOpacity="0">
 <animate
 attributeName="offset"
 values="-0.5;1.5"
 dur={speedDuration[speed]}
 repeatCount="indefinite"
 />
 </stop>
 <stop offset="50%" stopColor={glowColor} stopOpacity="0.6">
 <animate
 attributeName="offset"
 values="0;2"
 dur={speedDuration[speed]}
 repeatCount="indefinite"
 />
 </stop>
 <stop offset="100%" stopColor={glowColor} stopOpacity="0">
 <animate
 attributeName="offset"
 values="0.5;2.5"
 dur={speedDuration[speed]}
 repeatCount="indefinite"
 />
 </stop>
 </linearGradient>
 </defs>

 {/* Horizontalline */}
 {Array.from({ length: rows }).map((_, i) => (
 <g key={`h-${i}`}>
 {/* Basicline */}
 <line
 x1="0"
 y1={i * cellSize}
 x2={dimensions.width}
 y2={i * cellSize}
 stroke={lineColor}
 strokeWidth="1"
 />
 {/* Flowline(Partialrow) */}
 {i % 3 === 0 && (
 <line
 x1="0"
 y1={i * cellSize}
 x2={dimensions.width}
 y2={i * cellSize}
 stroke="url(#flowGradient)"
 strokeWidth="1.5"
 style={{ animationDelay: `${i * 0.2}s` }}
 />
 )}
 </g>
 ))}

 {/* Verticalline */}
 {Array.from({ length: cols }).map((_, i) => (
 <g key={`v-${i}`}>
 {/* Basicline */}
 <line
 x1={i * cellSize}
 y1="0"
 x2={i * cellSize}
 y2={dimensions.height}
 stroke={lineColor}
 strokeWidth="1"
 />
 {/* Flowline(Partial) */}
 {i % 4 === 0 && (
 <line
 x1={i * cellSize}
 y1="0"
 x2={i * cellSize}
 y2={dimensions.height}
 stroke="url(#flowGradientV)"
 strokeWidth="1.5"
 style={{ animationDelay: `${i * 0.15}s` }}
 />
 )}
 </g>
 ))}

 {/* */}
 {showDots &&
 Array.from({ length: rows }).map((_, row) =>
 Array.from({ length: cols }).map((_, col) => {
 const x = col * cellSize;
 const y = row * cellSize;
 const distance = Math.sqrt(
 Math.pow(mousePos.x - x, 2) + Math.pow(mousePos.y - y, 2)
 );
 const isNearMouse = distance < 100;
 const dotScale = isNearMouse ? 1.5 : 1;
 const dotOpacity = isNearMouse ? 0.8 : 0.3;

 return (
 <circle
 key={`dot-${row}-${col}`}
 cx={x}
 cy={y}
 r={2 * dotScale}
 fill={isNearMouse ? glowColor : dotColor}
 opacity={dotOpacity}
 style={{
 transition: "all 0.3s ease-out",
 filter: isNearMouse ? "url(#glow)" : "none",
 }}
 />
 );
 })
 )}
 </svg>

 {/* PulseEffect */}
 {showPulse && (
 <div className="absolute inset-0 pointer-events-none overflow-hidden">
 {[0, 1, 2].map((i) => (
 <div
 key={i}
 className="absolute rounded-full border border-primary/20"
 style={{
 width: "200%",
 height: "200%",
 left: "-50%",
 top: "-50%",
 animation: `pulse-wave 8s ease-out infinite`,
 animationDelay: `${i * 2.5}s`,
 }}
 />
 ))}
 </div>
 )}

 {/* MouseFollowHalo */}
 {mousePos.x > 0 && mousePos.y > 0 && (
 <div
 className="absolute pointer-events-none transition-all duration-300 ease-out"
 style={{
 left: mousePos.x - 100,
 top: mousePos.y - 100,
 width: 200,
 height: 200,
 background: `radial-gradient(circle, ${glowColor}15 0%, transparent 70%)`,
 borderRadius: "50%",
 }}
 />
 )}

 <style jsx>{`
 @keyframes pulse-wave {
 0% {
 transform: scale(0);
 opacity: 0.5;
 }
 100% {
 transform: scale(1);
 opacity: 0;
 }
 }
 `}</style>
 </div>
 );
}

// version: CSSGridAnimation
export interface SimpleFlowingGridProps extends React.HTMLAttributes<HTMLDivElement> {
 cellSize?: number;
 color?: string;
}

export function SimpleFlowingGrid({
 cellSize = 40,
 color = "hsl(var(--primary))",
 className,
 ...props
}: SimpleFlowingGridProps) {
 return (
 <div className={cn("absolute inset-0 overflow-hidden", className)} {...props}>
 <div
 className="absolute inset-0"
 style={{
 backgroundImage: `
 linear-gradient(${color}10 1px, transparent 1px),
 linear-gradient(90deg, ${color}10 1px, transparent 1px)
 `,
 backgroundSize: `${cellSize}px ${cellSize}px`,
 }}
 />
 
 {/* HorizontalFlowline */}
 <div
 className="absolute inset-0"
 style={{
 backgroundImage: `linear-gradient(90deg, transparent, ${color}30, transparent)`,
 backgroundSize: "200% 100%",
 animation: "flow-horizontal 4s linear infinite",
 }}
 />
 
 {/* VerticalFlowline */}
 <div
 className="absolute inset-0"
 style={{
 backgroundImage: `linear-gradient(180deg, transparent, ${color}20, transparent)`,
 backgroundSize: "100% 200%",
 animation: "flow-vertical 6s linear infinite",
 }}
 />
 
 {/* centerHalo */}
 <div
 className="absolute inset-0"
 style={{
 background: `radial-gradient(ellipse at 50% 30%, ${color}15 0%, transparent 50%)`,
 }}
 />

 <style jsx>{`
 @keyframes flow-horizontal {
 0% {
 background-position: -100% 0;
 }
 100% {
 background-position: 100% 0;
 }
 }
 @keyframes flow-vertical {
 0% {
 background-position: 0 -100%;
 }
 100% {
 background-position: 0 100%;
 }
 }
 `}</style>
 </div>
 );
}
