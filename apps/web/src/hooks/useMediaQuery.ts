"use client";

import { useState, useEffect } from "react";

/**
 * MediaQuery Hook
 * Used forResponseDesign
 */

export function useMediaQuery(query: string): boolean {
 const [matches, setMatches] = useState(false);

 useEffect(() => {
 const mediaQuery = window.matchMedia(query);
 
 // Initialvalue
 setMatches(mediaQuery.matches);

 // Listen
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

// PresetBreakpoint
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

// methodDetect
export function useIsPortrait(): boolean {
 return useMediaQuery("(orientation: portrait)");
}

export function useIsLandscape(): boolean {
 return useMediaQuery("(orientation: landscape)");
}

// TouchDeviceDetect
export function useIsTouchDevice(): boolean {
 return useMediaQuery("(hover: none) and (pointer: coarse)");
}
