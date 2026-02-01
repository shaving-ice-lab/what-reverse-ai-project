"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// 城市位置（相对于地图的百分比位置）
const cities = [
  { name: "北京", x: 77, y: 35, users: 1245, active: true },
  { name: "上海", x: 79, y: 42, users: 987, active: true },
  { name: "深圳", x: 76, y: 52, users: 756, active: true },
  { name: "杭州", x: 79, y: 43, users: 534, active: false },
  { name: "东京", x: 85, y: 38, users: 423, active: true },
  { name: "新加坡", x: 74, y: 62, users: 312, active: false },
  { name: "硅谷", x: 12, y: 38, users: 678, active: true },
  { name: "纽约", x: 25, y: 36, users: 456, active: false },
  { name: "伦敦", x: 48, y: 30, users: 345, active: true },
  { name: "悉尼", x: 88, y: 75, users: 234, active: false },
  { name: "柏林", x: 52, y: 29, users: 189, active: false },
  { name: "多伦多", x: 22, y: 33, users: 167, active: true },
];

export interface WorldMapProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 是否显示城市标签 */
  showLabels?: boolean;
  /** 是否显示脉冲动画 */
  showPulse?: boolean;
  /** 高度 */
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

  // 随机更新活跃状态
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
      {/* 背景地图轮廓 (简化的世界地图SVG) */}
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
        
        {/* 简化的大陆轮廓 */}
        <g fill="url(#mapGradient)" stroke="hsl(var(--primary))" strokeWidth="0.2" strokeOpacity="0.3">
          {/* 北美 */}
          <path d="M5,15 Q15,12 25,15 T35,20 Q30,28 20,30 Q10,28 5,20 Z" />
          {/* 南美 */}
          <path d="M22,32 Q28,35 25,45 Q20,50 18,42 Q17,35 22,32 Z" />
          {/* 欧洲 */}
          <path d="M45,15 Q55,12 58,18 Q56,25 48,25 Q44,22 45,15 Z" />
          {/* 非洲 */}
          <path d="M48,28 Q55,25 58,35 Q55,48 48,45 Q45,38 48,28 Z" />
          {/* 亚洲 */}
          <path d="M60,12 Q75,8 85,15 Q88,25 80,30 Q70,35 65,28 Q58,22 60,12 Z" />
          {/* 澳洲 */}
          <path d="M82,38 Q90,36 92,42 Q90,48 84,48 Q80,45 82,38 Z" />
        </g>

        {/* 连接线 */}
        <g stroke="hsl(var(--primary))" strokeWidth="0.1" strokeOpacity="0.2" fill="none">
          <path d="M12,19 Q30,5 48,15" className="animate-pulse" />
          <path d="M48,15 Q65,10 77,17" className="animate-pulse" style={{ animationDelay: "0.5s" }} />
          <path d="M25,18 Q40,30 77,20" className="animate-pulse" style={{ animationDelay: "1s" }} />
        </g>
      </svg>

      {/* 城市点 */}
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
          {/* 脉冲效果 */}
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

          {/* 城市点 */}
          <div
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300 cursor-pointer",
              city.active
                ? "bg-primary shadow-lg shadow-primary/50"
                : "bg-muted-foreground/50"
            )}
          />

          {/* 悬停提示 */}
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
              <p className="text-muted-foreground">{city.users.toLocaleString()} 用户</p>
            </div>
          )}

          {/* 标签 */}
          {showLabels && (
            <span className="absolute left-3 top-0 text-[10px] text-muted-foreground whitespace-nowrap">
              {city.name}
            </span>
          )}
        </div>
      ))}

      {/* 统计信息 */}
      <div className="absolute bottom-2 left-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          {activeCities.filter((c) => c.active).length} 个活跃区域
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

// 简化版：仅显示点的分布
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
      {/* 简化的点分布 */}
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
