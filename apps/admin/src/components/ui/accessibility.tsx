"use client";

import { useCallback, useEffect, useState, type ReactNode, type ElementType } from "react";
import { cn } from "@/lib/utils";

// ============================================
// Skip Link (for screen readers)
// ============================================

interface SkipLinkProps {
  href?: string;
  children?: ReactNode;
}

export function SkipLink({ href = "#main-content", children = "Skip to main content" }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-brand-500 focus:text-white focus:rounded-lg focus:outline-none"
    >
      {children}
    </a>
  );
}

// ============================================
// Live Region for announcements
// ============================================

interface LiveRegionProps {
  message: string;
  assertive?: boolean;
}

export function LiveRegion({ message, assertive = false }: LiveRegionProps) {
  return (
    <div
      role={assertive ? "alert" : "status"}
      aria-live={assertive ? "assertive" : "polite"}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// ============================================
// Hook for announcements
// ============================================

export function useAnnounce() {
  const [message, setMessage] = useState("");

  const announce = useCallback((text: string, delay = 100) => {
    // Clear first to ensure re-announcement
    setMessage("");
    setTimeout(() => setMessage(text), delay);
  }, []);

  return { message, announce };
}

// ============================================
// Focus Trap
// ============================================

interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
  initialFocus?: string;
  returnFocus?: boolean;
}

export function FocusTrap({
  children,
  active = true,
  initialFocus,
  returnFocus = true,
}: FocusTrapProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active || !container) return;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Store previously focused element
    const previouslyFocused = document.activeElement as HTMLElement;

    // Set initial focus
    if (initialFocus) {
      const target = container.querySelector<HTMLElement>(initialFocus);
      target?.focus();
    } else {
      firstElement?.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      if (returnFocus) {
        previouslyFocused?.focus();
      }
    };
  }, [active, container, initialFocus, returnFocus]);

  return <div ref={setContainer}>{children}</div>;
}

// ============================================
// Visually Hidden
// ============================================

interface VisuallyHiddenProps {
  children: ReactNode;
  as?: ElementType;
}

export function VisuallyHidden({ children, as: Component = "span" }: VisuallyHiddenProps) {
  return <Component className="sr-only">{children}</Component>;
}

// ============================================
// Reduce Motion Hook
// ============================================

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return reducedMotion;
}

// ============================================
// High Contrast Mode Hook
// ============================================

export function useHighContrast(): boolean {
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(forced-colors: active)");
    setHighContrast(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setHighContrast(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return highContrast;
}

// ============================================
// Focus Visible
// ============================================

export function useFocusVisible(): boolean {
  const [focusVisible, setFocusVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        setFocusVisible(true);
      }
    };

    const handleMouseDown = () => {
      setFocusVisible(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  return focusVisible;
}

// ============================================
// Accessible Icon
// ============================================

interface AccessibleIconProps {
  icon: ReactNode;
  label: string;
  className?: string;
}

export function AccessibleIcon({ icon, label, className }: AccessibleIconProps) {
  return (
    <span className={cn("inline-flex items-center", className)} role="img" aria-label={label}>
      <span aria-hidden="true">{icon}</span>
      <VisuallyHidden>{label}</VisuallyHidden>
    </span>
  );
}

// ============================================
// Loading Indicator with ARIA
// ============================================

interface LoadingIndicatorProps {
  loading: boolean;
  label?: string;
  children: ReactNode;
}

export function LoadingIndicator({
  loading,
  label = "Loading",
  children,
}: LoadingIndicatorProps) {
  return (
    <div
      aria-busy={loading}
      aria-live="polite"
    >
      {loading && <VisuallyHidden>{label}</VisuallyHidden>}
      {children}
    </div>
  );
}

// ============================================
// Progress with ARIA
// ============================================

interface AccessibleProgressProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}

export function AccessibleProgress({
  value,
  max = 100,
  label,
  className,
}: AccessibleProgressProps) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cn("relative h-2 bg-background-hover rounded-full overflow-hidden", className)}
    >
      <div
        className="absolute inset-y-0 left-0 bg-brand-500 transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
      {label && <VisuallyHidden>{`${label}: ${percentage}%`}</VisuallyHidden>}
    </div>
  );
}

// ============================================
// Roving Tab Index
// ============================================

interface RovingTabIndexProps<T> {
  items: T[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  renderItem: (item: T, index: number, isSelected: boolean, tabIndex: number) => ReactNode;
  orientation?: "horizontal" | "vertical";
  loop?: boolean;
  className?: string;
}

export function RovingTabIndex<T>({
  items,
  selectedIndex,
  onSelect,
  renderItem,
  orientation = "horizontal",
  loop = true,
  className,
}: RovingTabIndexProps<T>) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const nextKey = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
    const prevKey = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";

    let newIndex = selectedIndex;

    switch (e.key) {
      case nextKey:
        e.preventDefault();
        newIndex = selectedIndex + 1;
        if (newIndex >= items.length) {
          newIndex = loop ? 0 : items.length - 1;
        }
        break;
      case prevKey:
        e.preventDefault();
        newIndex = selectedIndex - 1;
        if (newIndex < 0) {
          newIndex = loop ? items.length - 1 : 0;
        }
        break;
      case "Home":
        e.preventDefault();
        newIndex = 0;
        break;
      case "End":
        e.preventDefault();
        newIndex = items.length - 1;
        break;
    }

    if (newIndex !== selectedIndex) {
      onSelect(newIndex);
    }
  };

  return (
    <div
      role="listbox"
      aria-orientation={orientation}
      onKeyDown={handleKeyDown}
      className={className}
    >
      {items.map((item, index) =>
        renderItem(item, index, index === selectedIndex, index === selectedIndex ? 0 : -1)
      )}
    </div>
  );
}
