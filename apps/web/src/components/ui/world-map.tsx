"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// City(forat'sPercentage)
const cities = [
 { name: "Beijing", x: 77, y: 35, users: 1245, active: true },
 { name: "on", x: 79, y: 42, users: 987, active: true },
 { name: "Shenzhen", x: 76, y: 52, users: 756, active: true },
 { name: "Hangzhou", x: 79, y: 43, users: 534, active: false },
 { name: "Tokyo", x: 85, y: 38, users: 423, active: true },
 { name: "new", x: 74, y: 62, users: 312, active: false },
 { name: "Silicon Valley", x: 12, y: 38, users: 678, active: true },
 { name: "New York", x: 25, y: 36, users: 456, active: false },
 { name: "London", x: 48, y: 30, users: 345, active: true },
 { name: "Sydney", x: 88, y: 75, users: 234, active: false },
 { name: "Berlin", x: 52, y: 29, users: 189, active: false },
 { name: "multiplemultiple", x: 22, y: 33, users: 167, active: true },
];

export interface WorldMapProps extends React.HTMLAttributes<HTMLDivElement> {
 /** isnoDisplayCityTags */
 showLabels?: boolean;
 /** isnoDisplayPulseAnimation */
 showPulse?: boolean;
 /** Height */
 height?: number;
}

export function WorldMap({
 showLabels = false,
 showPulse = true,
 height = 200,
 className,
 ...props
}: WorldMapProps) {
 const [activeCities, setActiveCities] = useState(cities);
 const [hoveredCity, setHoveredCity] = useState<string | null>(null);

 // RandomUpdateActiveStatus
 useEffect(() => {
 const timer = setInterval(() => {
 setActiveCities((prev) =>
 prev.map((city) => ({
 ...city,
 active: Math.random() > 0.3,
 users: city.users + Math.floor(Math.random() * 10) - 5,
 }))
 );
 }, 3000);

 return () => clearInterval(timer);
 }, []);

 return (
 <div
 className={cn("relative overflow-hidden rounded-xl", className)}
 style={{ height }}
 {...props}
 >
 {/* BackgroundOutline ('sSVG) */}
 <svg
 viewBox="0 0 100 50"
 className="absolute inset-0 w-full h-full"
 preserveAspectRatio="xMidYMid slice"
 >
 <defs>
 <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
 <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
 <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
 </linearGradient>
 </defs>
 
 {/* 'slargeOutline */}
 <g fill="url(#mapGradient)" stroke="hsl(var(--primary))" strokeWidth="0.2" strokeOpacity="0.3">
 {/* North America */}
 <path d="M5,15 Q15,12 25,15 T35,20 Q30,28 20,30 Q10,28 5,20 Z" />
 {/* South America */}
 <path d="M22,32 Q28,35 25,45 Q20,50 18,42 Q17,35 22,32 Z" />
 {/* Europe */}
 <path d="M45,15 Q55,12 58,18 Q56,25 48,25 Q44,22 45,15 Z" />
 {/* Africa */}
 <path d="M48,28 Q55,25 58,35 Q55,48 48,45 Q45,38 48,28 Z" />
 {/* Asia */}
 <path d="M60,12 Q75,8 85,15 Q88,25 80,30 Q70,35 65,28 Q58,22 60,12 Z" />
 {/* Oceania */}
 <path d="M82,38 Q90,36 92,42 Q90,48 84,48 Q80,45 82,38 Z" />
 </g>

 {/* Connectline */}
 <g stroke="hsl(var(--primary))" strokeWidth="0.1" strokeOpacity="0.2" fill="none">
 <path d="M12,19 Q30,5 48,15" className="animate-pulse" />
 <path d="M48,15 Q65,10 77,17" className="animate-pulse" style={{ animationDelay: "0.5s" }} />
 <path d="M25,18 Q40,30 77,20" className="animate-pulse" style={{ animationDelay: "1s" }} />
 </g>
 </svg>

 {/* City */}
 {activeCities.map((city, index) => (
 <div
 key={city.name}
 className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
 style={{
 left: `${city.x}%`,
 top: `${city.y}%`,
 }}
 onMouseEnter={() => setHoveredCity(city.name)}
 onMouseLeave={() => setHoveredCity(null)}
 >
 {/* PulseEffect */}
 {showPulse && city.active && (
 <div
 className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"
 style={{
 animation: `ping 2s cubic-bezier(0, 0, 0.2, 1) infinite`,
 animationDelay: `${index * 0.3}s`,
 }}
 >
 <div className="w-full h-full rounded-full bg-primary/30" />
 </div>
 )}

 {/* City */}
 <div
 className={cn(
 "w-2 h-2 rounded-full transition-all duration-300 cursor-pointer",
 city.active
 ? "bg-primary shadow-lg shadow-primary/50"
 : "bg-muted-foreground/50"
 )}
 />

 {/* HoverTip */}
 {hoveredCity === city.name && (
 <div
 className={cn(
 "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10",
 "px-2 py-1 rounded-md",
 "bg-card border border-border shadow-lg",
 "text-xs whitespace-nowrap",
 "animate-fade-in"
 )}
 >
 <p className="font-medium text-foreground">{city.name}</p>
 <p className="text-muted-foreground">{city.users.toLocaleString()} User</p>
 </div>
 )}

 {/* Tags */}
 {showLabels && (
 <span className="absolute left-3 top-0 text-[10px] text-muted-foreground whitespace-nowrap">
 {city.name}
 </span>
 )}
 </div>
 ))}

 {/* StatisticsInfo */}
 <div className="absolute bottom-2 left-2 text-xs text-muted-foreground">
 <span className="flex items-center gap-1">
 <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
 {activeCities.filter((c) => c.active).length} ActiveRegion
 </span>
 </div>

 <style jsx>{`
 @keyframes ping {
 75%, 100% {
 transform: scale(2);
 opacity: 0;
 }
 }
 @keyframes fade-in {
 from {
 opacity: 0;
 transform: translate(-50%, 4px);
 }
 to {
 opacity: 1;
 transform: translate(-50%, 0);
 }
 }
 .animate-fade-in {
 animation: fade-in 0.2s ease-out;
 }
 `}</style>
 </div>
 );
}

// version: onlyDisplay'sDistribution
export function SimpleWorldMap({
 className,
 ...props
}: React.HTMLAttributes<HTMLDivElement>) {
 return (
 <div
 className={cn(
 "relative h-32 rounded-xl overflow-hidden",
 "bg-gradient-to-br from-primary/5 to-transparent",
 className
 )}
 {...props}
 >
 {/* 'sDistribution */}
 {[
 { x: 15, y: 40 },
 { x: 25, y: 35 },
 { x: 50, y: 30 },
 { x: 55, y: 45 },
 { x: 75, y: 35 },
 { x: 80, y: 45 },
 { x: 85, y: 40 },
 { x: 88, y: 70 },
 ].map((point, i) => (
 <div
 key={i}
 className="absolute w-1.5 h-1.5 rounded-full bg-primary"
 style={{
 left: `${point.x}%`,
 top: `${point.y}%`,
 animation: `pulse 2s ease-in-out infinite`,
 animationDelay: `${i * 0.25}s`,
 }}
 />
 ))}

 <style jsx>{`
 @keyframes pulse {
 0%, 100% {
 opacity: 0.4;
 transform: scale(1);
 }
 50% {
 opacity: 1;
 transform: scale(1.5);
 }
 }
 `}</style>
 </div>
 );
}
