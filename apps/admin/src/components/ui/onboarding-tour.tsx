"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

export interface TourStep {
  id: string;
  target: string; // CSS selector
  title: string;
  content: ReactNode;
  placement?: "top" | "bottom" | "left" | "right";
  spotlightPadding?: number;
  disableOverlay?: boolean;
  onEnter?: () => void;
  onExit?: () => void;
}

export interface Tour {
  id: string;
  name: string;
  steps: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
}

interface TourContextValue {
  activeTour: Tour | null;
  currentStep: number;
  startTour: (tour: Tour) => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  isStepActive: (stepId: string) => boolean;
}

// ============================================
// Context
// ============================================

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within TourProvider");
  }
  return context;
}

// ============================================
// Provider
// ============================================

const COMPLETED_TOURS_KEY = "admin-completed-tours";

interface TourProviderProps {
  children: ReactNode;
}

export function TourProvider({ children }: TourProviderProps) {
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const startTour = useCallback((tour: Tour) => {
    setActiveTour(tour);
    setCurrentStep(0);
    tour.steps[0]?.onEnter?.();
  }, []);

  const endTour = useCallback(() => {
    if (activeTour) {
      activeTour.steps[currentStep]?.onExit?.();
      
      // Mark tour as completed
      try {
        const completed = JSON.parse(
          localStorage.getItem(COMPLETED_TOURS_KEY) || "[]"
        ) as string[];
        if (!completed.includes(activeTour.id)) {
          completed.push(activeTour.id);
          localStorage.setItem(COMPLETED_TOURS_KEY, JSON.stringify(completed));
        }
      } catch (e) {
        console.error("Failed to save tour completion:", e);
      }

      activeTour.onComplete?.();
    }
    setActiveTour(null);
    setCurrentStep(0);
  }, [activeTour, currentStep]);

  const skipTour = useCallback(() => {
    if (activeTour) {
      activeTour.steps[currentStep]?.onExit?.();
      activeTour.onSkip?.();
    }
    setActiveTour(null);
    setCurrentStep(0);
  }, [activeTour, currentStep]);

  const nextStep = useCallback(() => {
    if (!activeTour) return;

    activeTour.steps[currentStep]?.onExit?.();

    if (currentStep < activeTour.steps.length - 1) {
      const nextIndex = currentStep + 1;
      setCurrentStep(nextIndex);
      activeTour.steps[nextIndex]?.onEnter?.();
    } else {
      endTour();
    }
  }, [activeTour, currentStep, endTour]);

  const prevStep = useCallback(() => {
    if (!activeTour || currentStep === 0) return;

    activeTour.steps[currentStep]?.onExit?.();
    const prevIndex = currentStep - 1;
    setCurrentStep(prevIndex);
    activeTour.steps[prevIndex]?.onEnter?.();
  }, [activeTour, currentStep]);

  const goToStep = useCallback(
    (index: number) => {
      if (!activeTour || index < 0 || index >= activeTour.steps.length) return;

      activeTour.steps[currentStep]?.onExit?.();
      setCurrentStep(index);
      activeTour.steps[index]?.onEnter?.();
    },
    [activeTour, currentStep]
  );

  const isStepActive = useCallback(
    (stepId: string) => {
      if (!activeTour) return false;
      return activeTour.steps[currentStep]?.id === stepId;
    },
    [activeTour, currentStep]
  );

  return (
    <TourContext.Provider
      value={{
        activeTour,
        currentStep,
        startTour,
        endTour,
        nextStep,
        prevStep,
        goToStep,
        isStepActive,
      }}
    >
      {children}
      {activeTour && (
        <TourOverlay
          step={activeTour.steps[currentStep]}
          stepIndex={currentStep}
          totalSteps={activeTour.steps.length}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipTour}
        />
      )}
    </TourContext.Provider>
  );
}

// ============================================
// Tour Overlay
// ============================================

interface TourOverlayProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

function TourOverlay({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: TourOverlayProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  // Find and track target element
  useEffect(() => {
    const updatePosition = () => {
      const target = document.querySelector(step.target);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);

        // Calculate tooltip position
        const padding = step.spotlightPadding || 8;
        const tooltipWidth = 320;
        const tooltipHeight = 200; // Approximate

        let top = 0;
        let left = 0;

        switch (step.placement || "bottom") {
          case "top":
            top = rect.top - tooltipHeight - padding - 12;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case "bottom":
            top = rect.bottom + padding + 12;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case "left":
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.left - tooltipWidth - padding - 12;
            break;
          case "right":
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.right + padding + 12;
            break;
        }

        // Keep tooltip in viewport
        top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));
        left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));

        setTooltipPosition({ top, left });
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [step]);

  if (!targetRect) return null;

  const padding = step.spotlightPadding || 8;

  return createPortal(
    <div className="fixed inset-0 z-[200]">
      {/* Overlay with spotlight cutout */}
      {!step.disableOverlay && (
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: "none" }}
        >
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - padding}
                y={targetRect.top - padding}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
                rx={8}
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#spotlight-mask)"
          />
        </svg>
      )}

      {/* Spotlight border */}
      <div
        className="absolute border-2 border-brand-500 rounded-lg pointer-events-none"
        style={{
          top: targetRect.top - padding,
          left: targetRect.left - padding,
          width: targetRect.width + padding * 2,
          height: targetRect.height + padding * 2,
          boxShadow: "0 0 0 4px rgba(var(--brand-500), 0.2)",
        }}
      />

      {/* Tooltip */}
      <div
        className="absolute w-[320px] bg-background-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span className="text-xs font-medium text-foreground-muted">
              Step {stepIndex + 1} of {totalSteps}
            </span>
          </div>
          <button
            onClick={onSkip}
            className="p-1 hover:bg-background-hover rounded transition-colors"
          >
            <X className="w-4 h-4 text-foreground-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-4">
          <h4 className="text-base font-semibold text-foreground mb-2">
            {step.title}
          </h4>
          <div className="text-sm text-foreground-muted">{step.content}</div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  i === stepIndex ? "bg-brand-500" : "bg-border"
                )}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <Button variant="ghost" size="sm" onClick={onPrev}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
            )}
            <Button size="sm" onClick={onNext}>
              {stepIndex === totalSteps - 1 ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Finish
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ============================================
// Helper to check if tour is completed
// ============================================

export function isTourCompleted(tourId: string): boolean {
  try {
    const completed = JSON.parse(
      localStorage.getItem(COMPLETED_TOURS_KEY) || "[]"
    ) as string[];
    return completed.includes(tourId);
  } catch {
    return false;
  }
}

export function resetTourCompletion(tourId?: string): void {
  try {
    if (tourId) {
      const completed = JSON.parse(
        localStorage.getItem(COMPLETED_TOURS_KEY) || "[]"
      ) as string[];
      const filtered = completed.filter((id) => id !== tourId);
      localStorage.setItem(COMPLETED_TOURS_KEY, JSON.stringify(filtered));
    } else {
      localStorage.removeItem(COMPLETED_TOURS_KEY);
    }
  } catch (e) {
    console.error("Failed to reset tour completion:", e);
  }
}

// ============================================
// Predefined Tours
// ============================================

export const adminDashboardTour: Tour = {
  id: "admin-dashboard-intro",
  name: "Admin Console Getting Started",
  steps: [
    {
      id: "welcome",
      target: '[data-tour="sidebar"]',
      title: "Welcome to Admin Console",
      content: (
        <p>
          This is the AgentFlow admin console where you can manage users, workspaces, apps, and all other resources.
        </p>
      ),
      placement: "right",
    },
    {
      id: "search",
      target: '[data-tour="global-search"]',
      title: "Global Search",
      content: (
        <p>
          Use <kbd className="px-1 py-0.5 bg-background-hover rounded">⌘K</kbd> to quickly search for users, workspaces, tickets, and any other resources.
        </p>
      ),
      placement: "bottom",
    },
    {
      id: "users",
      target: '[data-tour="nav-users"]',
      title: "User Management",
      content: (
        <p>
          Manage all users here, including viewing user information, adjusting roles and statuses.
        </p>
      ),
      placement: "right",
    },
    {
      id: "support",
      target: '[data-tour="nav-support"]',
      title: "Support Center",
      content: (
        <p>
          Handle user-submitted support tickets and track SLA status.
        </p>
      ),
      placement: "right",
    },
    {
      id: "system",
      target: '[data-tour="nav-system"]',
      title: "System Governance",
      content: (
        <p>
          Monitor system health, manage feature flags, and perform operations.
        </p>
      ),
      placement: "right",
    },
  ],
  onComplete: () => {
    console.log("Admin dashboard tour completed");
  },
};
