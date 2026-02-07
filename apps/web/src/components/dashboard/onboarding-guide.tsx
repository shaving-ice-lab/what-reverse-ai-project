"use client";

/**
 * newGuideWizardComponent
 * 
 * timesSign InGuideFlow, HighlightkeyFeaturesRegion, StepTutorial
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
 X,
 ChevronRight,
 ChevronLeft,
 Sparkles,
 Rocket,
 Target,
 Layers,
 Zap,
 CheckCircle2,
 Play,
 BookOpen,
} from "lucide-react";

interface OnboardingStep {
 id: string;
 title: string;
 description: string;
 icon: React.ElementType;
 targetSelector?: string;
 position?: "top" | "bottom" | "left" | "right" | "center";
 action?: {
 label: string;
 href?: string;
 onClick?: () => void;
 };
}

const onboardingSteps: OnboardingStep[] = [
 {
 id: "welcome",
 title: "WelcomeUsage AgentFlow! 🎉",
 description: "WewillHelpyouQuickPlatform'sCoreFeatures, needminnowcanStartCreateyou's#1 AI Workflow.",
 icon: Rocket,
 position: "center",
 },
 {
 id: "stats",
 title: "DataOverview",
 description: "thisinShowcaseyou'sWorkflowRunStatus, Success RateandExecuteTimeetckeyMetrics.letyouAnytimeMasterSystemRunSituation.",
 icon: Target,
 targetSelector: "[data-onboarding='stats']",
 position: "bottom",
 },
 {
 id: "quick-actions",
 title: "QuickStart",
 description: "ViathisEntry, youcanwithQuickCreatenewWorkflow, BrowseTemplate GalleryorViewDocument.",
 icon: Zap,
 targetSelector: "[data-onboarding='quick-actions']",
 position: "bottom",
 },
 {
 id: "workflows",
 title: "RecentWorkflow",
 description: "atthisinViewandManageyouRecentUsage'sWorkflow, canwithDirectRun, EditorCopyit.",
 icon: Layers,
 targetSelector: "[data-onboarding='workflows']",
 position: "top",
 },
 {
 id: "complete",
 title: "Preparethen!",
 description: "Great!youalreadycurrentFeatures.atcanwithStartCreateyou's#1 AI Workflow.",
 icon: CheckCircle2,
 position: "center",
 action: {
 label: "CreateI's#1Workflow",
 href: "/dashboard/workflows/new",
 },
 },
];

interface OnboardingGuideProps {
 isOpen: boolean;
 onClose: () => void;
 onComplete?: () => void;
}

export function OnboardingGuide({ isOpen, onClose, onComplete }: OnboardingGuideProps) {
 const [currentStep, setCurrentStep] = useState(0);
 const [highlightPosition, setHighlightPosition] = useState<{
 top: number;
 left: number;
 width: number;
 height: number;
 } | null>(null);

 const step = onboardingSteps[currentStep];
 const isFirstStep = currentStep === 0;
 const isLastStep = currentStep === onboardingSteps.length - 1;

 // CalculateTargetElement
 const updateHighlightPosition = useCallback(() => {
 if (!step.targetSelector) {
 setHighlightPosition(null);
 return;
 }

 const target = document.querySelector(step.targetSelector);
 if (target) {
 const rect = target.getBoundingClientRect();
 setHighlightPosition({
 top: rect.top - 8,
 left: rect.left - 8,
 width: rect.width + 16,
 height: rect.height + 16,
 });
 }
 }, [step.targetSelector]);

 useEffect(() => {
 if (isOpen) {
 updateHighlightPosition();
 window.addEventListener("resize", updateHighlightPosition);
 window.addEventListener("scroll", updateHighlightPosition);
 }

 return () => {
 window.removeEventListener("resize", updateHighlightPosition);
 window.removeEventListener("scroll", updateHighlightPosition);
 };
 }, [isOpen, currentStep, updateHighlightPosition]);

 // keyNavigation
 useEffect(() => {
 if (!isOpen) return;

 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key === "Escape") {
 onClose();
 } else if (e.key === "ArrowRight" && !isLastStep) {
 setCurrentStep((prev) => prev + 1);
 } else if (e.key === "ArrowLeft" && !isFirstStep) {
 setCurrentStep((prev) => prev - 1);
 }
 };

 window.addEventListener("keydown", handleKeyDown);
 return () => window.removeEventListener("keydown", handleKeyDown);
 }, [isOpen, isFirstStep, isLastStep, onClose]);

 const handleNext = () => {
 if (isLastStep) {
 onComplete?.();
 onClose();
 } else {
 setCurrentStep((prev) => prev + 1);
 }
 };

 const handlePrev = () => {
 if (!isFirstStep) {
 setCurrentStep((prev) => prev - 1);
 }
 };

 const handleSkip = () => {
 onClose();
 };

 if (!isOpen) return null;

 const Icon = step.icon;

 // CalculateTooltip
 const getTooltipStyle = () => {
 if (step.position === "center" || !highlightPosition) {
 return {
 top: "50%",
 left: "50%",
 transform: "translate(-50%, -50%)",
 };
 }

 const padding = 20;
 const tooltipWidth = 400;
 const tooltipHeight = 250;

 switch (step.position) {
 case "top":
 return {
 top: highlightPosition.top - tooltipHeight - padding,
 left: highlightPosition.left + highlightPosition.width / 2,
 transform: "translateX(-50%)",
 };
 case "bottom":
 return {
 top: highlightPosition.top + highlightPosition.height + padding,
 left: highlightPosition.left + highlightPosition.width / 2,
 transform: "translateX(-50%)",
 };
 case "left":
 return {
 top: highlightPosition.top + highlightPosition.height / 2,
 left: highlightPosition.left - tooltipWidth - padding,
 transform: "translateY(-50%)",
 };
 case "right":
 return {
 top: highlightPosition.top + highlightPosition.height / 2,
 left: highlightPosition.left + highlightPosition.width + padding,
 transform: "translateY(-50%)",
 };
 default:
 return {};
 }
 };

 return (
 <div className="fixed inset-0 z-[100]">
 {/* BackgroundMask - EnhancedBlurEffect */}
 <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleSkip} />

 {/* HighlightRegion - EnhancedEdgeEffect */}
 {highlightPosition && (
 <div
 className="absolute rounded-2xl transition-all duration-300 ease-out"
 style={{
 top: highlightPosition.top,
 left: highlightPosition.left,
 width: highlightPosition.width,
 height: highlightPosition.height,
 boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 30px rgba(62, 207, 142, 0.3)",
 border: "2px solid hsl(var(--primary))",
 }}
 >
 {/* Decoration */}
 <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-primary rounded-tl-lg" />
 <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-primary rounded-tr-lg" />
 <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-primary rounded-bl-lg" />
 <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-primary rounded-br-lg" />
 </div>
 )}

 {/* Tooltip - EnhancedvisualEffect */}
 <div
 className={cn(
 "absolute w-[420px] bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden",
 "animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5"
 )}
 style={getTooltipStyle()}
 >
 {/* TopGradientDecoration */}
 <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
 
 {/* Header */}
 <div className="flex items-center justify-between p-5 border-b border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-violet-500/5">
 <div className="flex items-center gap-4">
 <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 shadow-lg shadow-primary/10">
 <Icon className="w-6 h-6 text-primary" />
 </div>
 <div>
 <h3 className="font-bold text-foreground text-lg">{step.title}</h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 Step <span className="text-primary font-medium">{currentStep + 1}</span> / {onboardingSteps.length}
 </p>
 </div>
 </div>
 <button
 onClick={handleSkip}
 className="p-2 rounded-xl hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground group"
 >
 <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
 </button>
 </div>

 {/* Content */}
 <div className="p-6">
 <p className="text-sm text-muted-foreground leading-relaxed">
 {step.description}
 </p>

 {step.action && (
 <div className="mt-6">
 {step.action.href ? (
 <a href={step.action.href}>
 <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 h-11">
 <Play className="w-4 h-4 mr-2" />
 {step.action.label}
 </Button>
 </a>
 ) : (
 <Button
 className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 h-11"
 onClick={step.action.onClick}
 >
 <Play className="w-4 h-4 mr-2" />
 {step.action.label}
 </Button>
 )}
 </div>
 )}
 </div>

 {/* StepIndicator - Enhanced */}
 <div className="flex items-center justify-center gap-2 py-4 border-t border-border/50">
 {onboardingSteps.map((s, index) => (
 <button
 key={index}
 onClick={() => setCurrentStep(index)}
 className={cn(
 "h-2 rounded-full transition-all duration-300",
 index === currentStep
 ? "w-8 bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/30"
 : index < currentStep
 ? "w-2 bg-primary/60 hover:bg-primary/80"
 : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
 )}
 title={s.title}
 />
 ))}
 </div>

 {/* FooterNavigation - Enhanced */}
 <div className="flex items-center justify-between p-4 border-t border-border/50 bg-gradient-to-r from-muted/30 via-transparent to-muted/30">
 <Button
 variant="ghost"
 onClick={handlePrev}
 disabled={isFirstStep}
 className="text-muted-foreground hover:text-foreground disabled:opacity-30"
 >
 <ChevronLeft className="w-4 h-4 mr-1" />
 Previous
 </Button>

 <div className="flex items-center gap-3">
 <Button 
 variant="ghost" 
 onClick={handleSkip} 
 className="text-muted-foreground hover:text-foreground text-sm"
 >
 SkipGuide
 </Button>
 <Button 
 onClick={handleNext} 
 className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20"
 >
 {isLastStep ? "Done": "Next"}
 {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
 </Button>
 </div>
 </div>
 
 {/* FooterGradientDecoration */}
 <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
 </div>

 {/* HelpTip - Enhanced */}
 <div className="fixed bottom-6 left-6 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-card/50 backdrop-blur-sm ring-1 ring-border text-sm text-foreground/70">
 <div className="flex items-center gap-1.5">
 <kbd className="px-2 py-1 rounded-md bg-muted font-mono text-xs ring-1 ring-border">←</kbd>
 <kbd className="px-2 py-1 rounded-md bg-muted font-mono text-xs ring-1 ring-border">→</kbd>
 <span className="ml-1">Navigation</span>
 </div>
 <div className="w-px h-4 bg-border" />
 <div className="flex items-center gap-1.5">
 <kbd className="px-2 py-1 rounded-md bg-muted font-mono text-xs ring-1 ring-border">ESC</kbd>
 <span className="ml-1">Exit</span>
 </div>
 </div>

 {/* HelpLink - Enhanced */}
 <a
 href="/docs/getting-started"
 className="fixed bottom-6 right-6 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary/10 to-violet-500/10 backdrop-blur-sm ring-1 ring-primary/20 text-foreground hover:ring-primary/40 transition-all duration-200 text-sm group"
 >
 <BookOpen className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
 <span>ViewCompleteDocument</span>
 <ChevronRight className="w-4 h-4 text-primary/70 group-hover:translate-x-0.5 transition-transform" />
 </a>
 </div>
 );
}

// Independent'sTriggerButtonComponent - Enhanced
interface OnboardingTriggerProps {
 onClick: () => void;
 className?: string;
}

export function OnboardingTrigger({ onClick, className }: OnboardingTriggerProps) {
 return (
 <button
 onClick={onClick}
 className={cn(
 "relative flex items-center gap-2 px-3 py-2 rounded-xl overflow-hidden group",
 "bg-gradient-to-r from-primary/10 via-violet-500/5 to-primary/10",
 "border border-primary/20 hover:border-primary/40",
 "text-sm text-muted-foreground hover:text-foreground",
 "transition-all duration-300 hover:shadow-lg hover:shadow-primary/10",
 className
 )}
 >
 {/* BackgroundAnimationLight Effect */}
 <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />
 
 <Sparkles className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-200" />
 <span className="relative font-medium">newGuide</span>
 
 {/* Right sidesmallhead */}
 <ChevronRight className="w-3.5 h-3.5 text-primary/50 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
 </button>
 );
}
