"use client";

import { useState, useEffect } from "react";

/**
 * 媒体查询 Hook
 * 用于响应式设计
 */

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    // 初始值
    setMatches(mediaQuery.matches);

    // 监听变化
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    
    return () => {
      mediaQuery.removeEventListener("change", handler);
    };
  }, [query]);

  return matches;
}

// 预设断点
export const breakpoints = {
  sm: "(min-width: 640px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
  xl: "(min-width: 1280px)",
  "2xl": "(min-width: 1536px)",
};

// 预设 hooks
export function useIsMobile(): boolean {
  return !useMediaQuery(breakpoints.md);
}

export function useIsTablet(): boolean {
  const isMd = useMediaQuery(breakpoints.md);
  const isLg = useMediaQuery(breakpoints.lg);
  return isMd && !isLg;
}

export function useIsDesktop(): boolean {
  return useMediaQuery(breakpoints.lg);
}

// 方向检测
export function useIsPortrait(): boolean {
  return useMediaQuery("(orientation: portrait)");
}

export function useIsLandscape(): boolean {
  return useMediaQuery("(orientation: landscape)");
}

// 触摸设备检测
export function useIsTouchDevice(): boolean {
  return useMediaQuery("(hover: none) and (pointer: coarse)");
}
