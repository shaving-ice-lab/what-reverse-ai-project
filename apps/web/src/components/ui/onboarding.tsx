"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import {
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  Sparkles,
  MousePointer,
  Layers,
  Settings,
  Play,
} from "lucide-react";

/**
 * 新用户引导教程组件 - 极简风格
 */

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface OnboardingContextValue {
  isActive: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  startTour: (steps: OnboardingStep[]) => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  skipTour: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

interface OnboardingProviderProps {
  children: React.ReactNode;
  storageKey?: string;
}

export function OnboardingProvider({
  children,
  storageKey = "agentflow-onboarding",
}: OnboardingProviderProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);

  const startTour = useCallback((newSteps: OnboardingStep[]) => {
    setSteps(newSteps);
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const endTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    setSteps([]);
    if (storageKey) {
      localStorage.setItem(storageKey, "completed");
    }
  }, [storageKey]);

  const skipTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    setSteps([]);
    if (storageKey) {
      localStorage.setItem(storageKey, "skipped");
    }
  }, [storageKey]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      endTour();
    }
  }, [currentStep, steps.length, endTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStep(index);
    }
  }, [steps.length]);

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        currentStep,
        steps,
        startTour,
        endTour,
        nextStep,
        prevStep,
        goToStep,
        skipTour,
      }}
    >
      {children}
      {isActive && <OnboardingOverlay />}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}

function OnboardingOverlay() {
  const { steps, currentStep, nextStep, prevStep, skipTour, goToStep } = useOnboarding();
  const step = steps[currentStep];
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (step?.target) {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
  }, [step]);

  if (!step) return null;

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const isCentered = !step.target || !targetRect;

  const getTooltipPosition = () => {
    if (isCentered || !targetRect) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const padding = 16;
    const tooltipWidth = 340;
    const tooltipHeight = 200;

    switch (step.position || "bottom") {
      case "top":
        return {
          top: targetRect.top - tooltipHeight - padding,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        };
      case "bottom":
        return {
          top: targetRect.bottom + padding,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        };
      case "left":
        return {
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          left: targetRect.left - tooltipWidth - padding,
        };
      case "right":
        return {
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          left: targetRect.right + padding,
        };
      default:
        return {
          top: targetRect.bottom + padding,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        };
    }
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/50" onClick={skipTour} />

      {targetRect && (
        <div
          className="absolute bg-transparent pointer-events-none ring-2 ring-[var(--color-foreground)] rounded-lg"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      <div
        className={cn(
          "absolute w-[340px] p-5",
          "bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-lg",
          isCentered && "animate-in fade-in zoom-in-95"
        )}
        style={getTooltipPosition()}
      >
        <button
          onClick={skipTour}
          className="absolute top-3 right-3 p-1 rounded-md hover:bg-[var(--color-accent)]"
        >
          <X className="h-4 w-4 text-[var(--color-muted-foreground)]" />
        </button>

        {step.icon && (
          <div className="flex items-center justify-center w-10 h-10 mb-4 rounded-md bg-[var(--color-muted)]">
            {step.icon}
          </div>
        )}

        <h3 className="text-base font-semibold mb-1.5">{step.title}</h3>
        <p className="text-sm text-[var(--color-muted-foreground)] mb-4">{step.description}</p>

        {step.action && (
          <Button variant="outline" size="sm" className="mb-4" onClick={step.action.onClick}>
            {step.action.label}
          </Button>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-1.5">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => goToStep(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === currentStep
                    ? "bg-[var(--color-foreground)]"
                    : index < currentStep
                    ? "bg-[var(--color-muted-foreground)]"
                    : "bg-[var(--color-muted)]"
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <Button variant="ghost" size="sm" onClick={prevStep}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                上一步
              </Button>
            )}
            <Button size="sm" onClick={nextStep}>
              {isLastStep ? (
                <>
                  完成
                  <Check className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  下一步
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const editorOnboardingSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "欢迎使用 AgentFlow",
    description: "快速了解如何创建您的第一个工作流",
    position: "center",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    id: "node-panel",
    title: "节点面板",
    description: "从左侧面板选择节点类型，拖拽到画布上添加节点",
    target: "[data-testid='node-panel']",
    position: "right",
    icon: <Layers className="h-5 w-5" />,
  },
  {
    id: "canvas",
    title: "画布区域",
    description: "拖动节点、连接它们、按住空格键拖动可以平移画布",
    target: "[data-testid='editor-canvas']",
    position: "center",
    icon: <MousePointer className="h-5 w-5" />,
  },
  {
    id: "config-panel",
    title: "配置面板",
    description: "选中节点后，在右侧面板中配置节点参数",
    target: "[data-testid='config-panel']",
    position: "left",
    icon: <Settings className="h-5 w-5" />,
  },
  {
    id: "run",
    title: "运行工作流",
    description: "点击运行按钮执行工作流，实时查看执行状态",
    target: "[data-testid='run-button']",
    position: "bottom",
    icon: <Play className="h-5 w-5" />,
  },
  {
    id: "complete",
    title: "准备就绪",
    description: "开始创建您的第一个工作流，按 ? 键查看快捷键",
    position: "center",
    icon: <Check className="h-5 w-5" />,
  },
];

export function useAutoStartOnboarding(storageKey = "agentflow-onboarding") {
  const { startTour, isActive } = useOnboarding();

  useEffect(() => {
    const status = localStorage.getItem(storageKey);
    if (!status && !isActive) {
      const timer = setTimeout(() => {
        startTour(editorOnboardingSteps);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [storageKey, startTour, isActive]);
}

interface StartTourButtonProps {
  steps?: OnboardingStep[];
  className?: string;
}

export function StartTourButton({
  steps = editorOnboardingSteps,
  className,
}: StartTourButtonProps) {
  const { startTour } = useOnboarding();

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("gap-2", className)}
      onClick={() => startTour(steps)}
    >
      <Sparkles className="h-4 w-4" />
      开始教程
    </Button>
  );
}
