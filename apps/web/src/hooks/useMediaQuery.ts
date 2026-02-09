"use client";

import { useState, useEffect } from "react";

/**
 * MediaQuery Hook
 * Used for responsive design
 */

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    // Initial value
    setMatches(mediaQuery.matches);

    // Listen to changes
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

// Preset breakpoint
export const breakpoints = {
 sm: "(min-width: 640px)",
 md: "(min-width: 768px)",
 lg: "(min-width: 1024px)",
 xl: "(min-width: 1280px)",
 "2xl": "(min-width: 1536px)",
};

// Preset hooks
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

// Method detection
export function useIsPortrait(): boolean {
 return useMediaQuery("(orientation: portrait)");
}

export function useIsLandscape(): boolean {
  return useMediaQuery("(orientation: landscape)");
}

// Touch device detection
export function useIsTouchDevice(): boolean {
 return useMediaQuery("(hover: none) and (pointer: coarse)");
}
