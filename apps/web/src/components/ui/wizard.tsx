"use client";

/**
 * Wizard/Step Component
 * Used for guiding users through multiple step flows
 */

import { useState, ReactNode, createContext, useContext } from "react";
import {
 Check,
 ChevronLeft,
 ChevronRight,
 Circle,
 Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

// ============================================
// TypeDefinition
// ============================================

export interface WizardStep {
 id: string;
 title: string;
 description?: string;
 icon?: ReactNode;
 content: ReactNode;
 isOptional?: boolean;
 validate?: () => boolean | Promise<boolean>;
}

interface WizardContextValue {
 currentStep: number;
 steps: WizardStep[];
 goToStep: (step: number) => void;
 nextStep: () => void;
 prevStep: () => void;
 isFirstStep: boolean;
 isLastStep: boolean;
 isStepCompleted: (stepIndex: number) => boolean;
 completedSteps: Set<number>;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizard() {
 const context = useContext(WizardContext);
 if (!context) {
 throw new Error("useWizard must be used within a Wizard");
 }
 return context;
}

// ============================================
// main Wizard Component
// ============================================

interface WizardProps {
 steps: WizardStep[];
 initialStep?: number;
 onComplete?: () => void;
 onStepChange?: (step: number) => void;
 showProgress?: boolean;
 allowSkip?: boolean;
 className?: string;
 children?: ReactNode;
}

export function Wizard({
 steps,
 initialStep = 0,
 onComplete,
 onStepChange,
 showProgress = true,
 allowSkip = false,
 className,
 children,
}: WizardProps) {
 const [currentStep, setCurrentStep] = useState(initialStep);
 const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
 const [isValidating, setIsValidating] = useState(false);

 const isFirstStep = currentStep === 0;
 const isLastStep = currentStep === steps.length - 1;

 const goToStep = (step: number) => {
 if (step >= 0 && step < steps.length) {
 setCurrentStep(step);
 onStepChange?.(step);
 }
 };

 const nextStep = async () => {
 const currentStepData = steps[currentStep];

 if (currentStepData.validate) {
 setIsValidating(true);
 const isValid = await currentStepData.validate();
 setIsValidating(false);

 if (!isValid) return;
 }

 setCompletedSteps((prev) => new Set(prev).add(currentStep));

 if (isLastStep) {
 onComplete?.();
 } else {
 goToStep(currentStep + 1);
 }
 };

 const prevStep = () => {
 if (!isFirstStep) {
 goToStep(currentStep - 1);
 }
 };

 const isStepCompleted = (stepIndex: number) => completedSteps.has(stepIndex);

 const contextValue: WizardContextValue = {
 currentStep,
 steps,
 goToStep,
 nextStep,
 prevStep,
 isFirstStep,
 isLastStep,
 isStepCompleted,
 completedSteps,
 };

 const currentStepData = steps[currentStep];

 return (
 <WizardContext.Provider value={contextValue}>
 <div className={cn("w-full", className)}>
 {/* ProgressIndicator */}
 {showProgress && (
 <WizardProgress steps={steps} currentStep={currentStep} />
 )}

 {/* StepContent */}
 <div className="mt-8">
 {children || currentStepData.content}
 </div>

 {/* NavigationButton */}
 <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
 <Button
 variant="outline"
 onClick={prevStep}
 disabled={isFirstStep}
 >
 <ChevronLeft className="w-4 h-4 mr-2" />
 Previous
 </Button>

 <div className="flex items-center gap-2">
 {allowSkip && currentStepData.isOptional && !isLastStep && (
 <Button variant="ghost" onClick={() => goToStep(currentStep + 1)}>
 Skip
 </Button>
 )}
 <Button onClick={nextStep} disabled={isValidating}>
 {isValidating ? (
 <>
 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
 Verifying...
 </>
 ) : isLastStep ? (
 "Done"
 ) : (
 <>
 Next
 <ChevronRight className="w-4 h-4 ml-2" />
 </>
 )}
 </Button>
 </div>
 </div>
 </div>
 </WizardContext.Provider>
 );
}

// ============================================
// ProgressIndicator
// ============================================

interface WizardProgressProps {
 steps: WizardStep[];
 currentStep: number;
 variant?: "default" | "simple" | "dots";
 className?: string;
}

export function WizardProgress({
 steps,
 currentStep,
 variant = "default",
 className,
}: WizardProgressProps) {
 if (variant === "dots") {
 return (
 <div className={cn("flex items-center justify-center gap-2", className)}>
 {steps.map((_, index) => (
 <span
 key={index}
 className={cn(
 "w-2.5 h-2.5 rounded-full transition-all",
 index === currentStep
 ? "w-8 bg-primary"
 : index < currentStep
 ? "bg-primary"
 : "bg-surface-200"
 )}
 />
 ))}
 </div>
 );
 }

 if (variant === "simple") {
 const progress = ((currentStep + 1) / steps.length) * 100;
 return (
 <div className={cn("space-y-2", className)}>
 <div className="flex items-center justify-between text-sm">
 <span className="text-foreground font-medium">
 Step {currentStep + 1} / {steps.length}
 </span>
 <span className="text-foreground-light">
 {steps[currentStep].title}
 </span>
 </div>
 <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
 <div
 className="h-full bg-primary rounded-full transition-all duration-300"
 style={{ width: `${progress}%` }}
 />
 </div>
 </div>
 );
 }

 return (
 <div className={cn("flex items-center", className)}>
 {steps.map((step, index) => (
 <div key={step.id} className="flex items-center flex-1 last:flex-none">
 {/* StepCircle */}
 <div className="flex flex-col items-center">
 <div
 className={cn(
 "w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all",
 index < currentStep
 ? "bg-primary text-primary-foreground"
 : index === currentStep
 ? "bg-primary text-primary-foreground ring-4 ring-brand-500/20"
 : "bg-surface-200 text-foreground-light"
 )}
 >
 {index < currentStep ? (
 <Check className="w-5 h-5" />
 ) : step.icon ? (
 step.icon
 ) : (
 index + 1
 )}
 </div>
 <div className="mt-2 text-center">
 <p
 className={cn(
 "text-sm font-medium",
 index <= currentStep ? "text-foreground" : "text-foreground-light"
 )}
 >
 {step.title}
 </p>
 {step.description && (
 <p className="text-xs text-foreground-light mt-0.5 max-w-[120px]">
 {step.description}
 </p>
 )}
 </div>
 </div>

 {/* Connectline */}
 {index < steps.length - 1 && (
 <div
 className={cn(
 "flex-1 h-0.5 mx-4",
 index < currentStep ? "bg-primary" : "bg-surface-200"
 )}
 />
 )}
 </div>
 ))}
 </div>
 );
}

// ============================================
// VerticalWizard
// ============================================

interface VerticalWizardProps {
 steps: WizardStep[];
 currentStep: number;
 onStepClick?: (step: number) => void;
 allowNavigation?: boolean;
 className?: string;
}

export function VerticalWizard({
 steps,
 currentStep,
 onStepClick,
 allowNavigation = false,
 className,
}: VerticalWizardProps) {
 return (
 <div className={cn("space-y-4", className)}>
 {steps.map((step, index) => {
 const isActive = index === currentStep;
 const isCompleted = index < currentStep;
 const isClickable = allowNavigation && (isCompleted || index === currentStep + 1);

 return (
 <div
 key={step.id}
 className={cn(
 "flex gap-4",
 isClickable && "cursor-pointer"
 )}
 onClick={() => isClickable && onStepClick?.(index)}
 >
 {/* Left sideIndicator */}
 <div className="flex flex-col items-center">
 <div
 className={cn(
 "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
 isCompleted
 ? "bg-primary text-primary-foreground"
 : isActive
 ? "bg-primary text-primary-foreground ring-4 ring-brand-500/20"
 : "bg-surface-200 text-foreground-light"
 )}
 >
 {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
 </div>
 {index < steps.length - 1 && (
 <div
 className={cn(
 "w-0.5 flex-1 min-h-[24px] mt-2",
 isCompleted ? "bg-primary" : "bg-surface-200"
 )}
 />
 )}
 </div>

 {/* Content */}
 <div className="flex-1 pb-4">
 <h4
 className={cn(
 "font-medium",
 isActive ? "text-foreground" : "text-foreground-light"
 )}
 >
 {step.title}
 {step.isOptional && (
 <span className="text-xs text-foreground-light ml-2">(Optional)</span>
 )}
 </h4>
 {step.description && (
 <p className="text-sm text-foreground-light mt-1">
 {step.description}
 </p>
 )}
 {isActive && (
 <div className="mt-4 p-4 rounded-lg bg-card border border-border">
 {step.content}
 </div>
 )}
 </div>
 </div>
 );
 })}
 </div>
 );
}

// ============================================
// StepCard
// ============================================

interface StepCardProps {
 stepNumber: number;
 title: string;
 description?: string;
 isActive?: boolean;
 isCompleted?: boolean;
 onClick?: () => void;
 children?: ReactNode;
 className?: string;
}

export function StepCard({
 stepNumber,
 title,
 description,
 isActive = false,
 isCompleted = false,
 onClick,
 children,
 className,
}: StepCardProps) {
 return (
 <div
 className={cn(
 "p-4 rounded-xl border transition-all",
 isActive
 ? "border-primary bg-primary/5"
 : isCompleted
 ? "border-emerald-500/30 bg-emerald-500/5"
 : "border-border bg-card",
 onClick && "cursor-pointer hover:border-primary/50",
 className
 )}
 onClick={onClick}
 >
 <div className="flex items-start gap-4">
 <div
 className={cn(
 "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0",
 isCompleted
 ? "bg-emerald-500 text-white"
 : isActive
 ? "bg-primary text-primary-foreground"
 : "bg-surface-200 text-foreground-light"
 )}
 >
 {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
 </div>
 <div className="flex-1 min-w-0">
 <h4 className="font-medium text-foreground">{title}</h4>
 {description && (
 <p className="text-sm text-foreground-light mt-1">{description}</p>
 )}
 {children && <div className="mt-3">{children}</div>}
 </div>
 </div>
 </div>
 );
}
