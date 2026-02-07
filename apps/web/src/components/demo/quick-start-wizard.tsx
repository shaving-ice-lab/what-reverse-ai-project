"use client";

import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
 CheckCircle,
 Circle,
 ArrowRight,
 ArrowLeft,
 Copy,
 Check,
 Terminal,
 Rocket,
 Settings,
 Play,
 ExternalLink,
 Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// QuickGetting StartedStep
const quickStartSteps = [
 {
 id: 1,
 title: "Install CLI",
 description: "Usage npm or yarn Install AgentFlow CLI Tool",
 code: "npm install -g @agentflow/cli",
 altCode: "yarn global add @agentflow/cli",
 tip: "RecommendedUsage Node.js 18+ Version",
 },
 {
 id: 2,
 title: "Sign InAccount",
 description: "Usage CLI Sign Inyou's AgentFlow Account",
 code: "agentflow login",
 tip: "timesUsagewillAutoOpenBrowseProceedAuthentication",
 },
 {
 id: 3,
 title: "Createitem",
 description: "Initial1new'sWorkflowitem",
 code: "agentflow init my-workflow",
 tip: "thiswillCreate1ContainsBasicConfig'sitemDirectory",
 },
 {
 id: 4,
 title: "EditWorkflow",
 description: "OpenEditDesignyou'sWorkflow",
 code: "cd my-workflow && agentflow dev",
 tip: "thiswillLaunchLocalDevelopmentServiceandcanvisualEdit",
 },
 {
 id: 5,
 title: "Deployonline",
 description: "willWorkflowDeploytoCloud",
 code: "agentflow deploy",
 tip: "Deployafterwillto1canCall's API Endpoint",
 },
];

export interface QuickStartWizardProps extends React.HTMLAttributes<HTMLDivElement> {
 /** isnoDisplayStepNavigation */
 showNavigation?: boolean;
 /** isnoCompact */
 compact?: boolean;
 /** Doneafter'sCallback */
 onComplete?: () => void;
}

export function QuickStartWizard({
 showNavigation = true,
 compact = false,
 onComplete,
 className,
 ...props
}: QuickStartWizardProps) {
 const [currentStep, setCurrentStep] = useState(1);
 const [completedSteps, setCompletedSteps] = useState<number[]>([]);
 const [copiedCode, setCopiedCode] = useState<string | null>(null);

 const handleCopyCode = async (code: string) => {
 await navigator.clipboard.writeText(code);
 setCopiedCode(code);
 setTimeout(() => setCopiedCode(null), 2000);
 };

 const handleStepComplete = () => {
 if (!completedSteps.includes(currentStep)) {
 setCompletedSteps([...completedSteps, currentStep]);
 }
 if (currentStep < quickStartSteps.length) {
 setCurrentStep(currentStep + 1);
 } else {
 onComplete?.();
 }
 };

 const handlePrevStep = () => {
 if (currentStep > 1) {
 setCurrentStep(currentStep - 1);
 }
 };

 const currentStepData = quickStartSteps.find((s) => s.id === currentStep);

 return (
 <div className={cn("", className)} {...props}>
 {/* Progress Bar */}
 <div className="mb-8">
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm font-medium text-foreground">
 Step {currentStep} / {quickStartSteps.length}
 </span>
 <span className="text-sm text-muted-foreground">
 {Math.round((completedSteps.length / quickStartSteps.length) * 100)}% Done
 </span>
 </div>
 <div className="h-2 bg-muted rounded-full overflow-hidden">
 <div
 className="h-full bg-gradient-to-r from-primary to-primary/90 rounded-full transition-all duration-500"
 style={{ width: `${(currentStep / quickStartSteps.length) * 100}%` }}
 />
 </div>
 </div>

 {/* StepIndicator */}
 <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
 {quickStartSteps.map((step, index) => {
 const isCompleted = completedSteps.includes(step.id);
 const isCurrent = currentStep === step.id;
 
 return (
 <React.Fragment key={step.id}>
 <button
 onClick={() => setCurrentStep(step.id)}
 className={cn(
 "flex items-center gap-2 px-3 py-2 rounded-lg transition-all shrink-0",
 isCurrent && "bg-primary/10 text-primary",
 !isCurrent && isCompleted && "text-primary",
 !isCurrent && !isCompleted && "text-muted-foreground hover:text-foreground"
 )}
 >
 {isCompleted ? (
 <CheckCircle className="w-5 h-5" />
 ) : (
 <Circle className={cn(
 "w-5 h-5",
 isCurrent && "fill-primary/20"
 )} />
 )}
 <span className={cn(
 "text-sm font-medium",
 compact && "hidden sm:inline"
 )}>
 {step.title}
 </span>
 </button>
 
 {index < quickStartSteps.length - 1 && (
 <div className={cn(
 "flex-1 h-0.5 mx-2 rounded",
 index < currentStep - 1 ? "bg-primary" : "bg-muted"
 )} />
 )}
 </React.Fragment>
 );
 })}
 </div>

 {/* CurrentStepContent */}
 {currentStepData && (
 <div className="bg-card border border-border rounded-2xl p-6 mb-6">
 <div className="flex items-start gap-4 mb-6">
 <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
 <Terminal className="w-6 h-6 text-primary" />
 </div>
 <div>
 <h3 className="text-xl font-semibold text-foreground mb-1">
 {currentStepData.title}
 </h3>
 <p className="text-muted-foreground">
 {currentStepData.description}
 </p>
 </div>
 </div>

 {/* Codeblock */}
 <div className="bg-background rounded-xl overflow-hidden mb-4">
 <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border/50">
 <span className="text-xs text-muted-foreground">Terminal</span>
 <button
 onClick={() => handleCopyCode(currentStepData.code)}
 className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
 >
 {copiedCode === currentStepData.code ? (
 <Check className="w-4 h-4 text-emerald-400" />
 ) : (
 <Copy className="w-4 h-4" />
 )}
 </button>
 </div>
 <div className="p-4">
 <code className="text-sm font-mono text-emerald-400">
 $ {currentStepData.code}
 </code>
 </div>
 </div>

 {/* AlternativeCommand */}
 {currentStepData.altCode && (
 <div className="flex items-center gap-2 mb-4">
 <span className="text-xs text-muted-foreground">oruserUsage yarn:</span>
 <code className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
 {currentStepData.altCode}
 </code>
 </div>
 )}

 {/* Tip */}
 <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
 <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
 <p className="text-sm text-muted-foreground">{currentStepData.tip}</p>
 </div>
 </div>
 )}

 {/* NavigationButton */}
 {showNavigation && (
 <div className="flex items-center justify-between">
 <Button
 variant="outline"
 onClick={handlePrevStep}
 disabled={currentStep === 1}
 className="rounded-xl"
 >
 <ArrowLeft className="w-4 h-4 mr-2" />
 Previous
 </Button>

 <Button
 onClick={handleStepComplete}
 className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
 >
 {currentStep === quickStartSteps.length ? (
 <>
 <Rocket className="w-4 h-4 mr-2" />
 Done
 </>
 ) : (
 <>
 Next
 <ArrowRight className="w-4 h-4 ml-2" />
 </>
 )}
 </Button>
 </div>
 )}
 </div>
 );
}

// CodeSandboxComponent
export interface CodeSandboxProps extends React.HTMLAttributes<HTMLDivElement> {
 /** InitialCode */
 initialCode?: string;
 /** Language */
 language?: string;
 /** isnoread */
 readOnly?: boolean;
 /** RunCallback */
 onRun?: (code: string) => void;
}

export function CodeSandbox({
 initialCode = `// TryEditCodeandRun
const workflow = new AgentFlow();

workflow.addNode({
 type: 'llm',
 model: 'gpt-4',
 prompt: 'you, !'
});

const result = await workflow.run();
console.log(result);`,
 language = "typescript",
 readOnly = false,
 onRun,
 className,
 ...props
}: CodeSandboxProps) {
 const [code, setCode] = useState(initialCode);
 const [output, setOutput] = useState("");
 const [isRunning, setIsRunning] = useState(false);

 const handleRun = async () => {
 setIsRunning(true);
 setOutput("");
 
 // MockRun
 await new Promise((resolve) => setTimeout(resolve, 1500));
 
 setOutput(`> ExecuteSuccess
{
 "success": true,
 "output": "you, !thisis AI 'sReply.",
 "tokens": 28,
 "duration": "0.8s"
}`);
 setIsRunning(false);
 onRun?.(code);
 };

 return (
 <div className={cn("rounded-2xl overflow-hidden border border-border", className)} {...props}>
 <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
 <div className="flex items-center gap-2">
 <div className="flex gap-1.5">
 <div className="w-3 h-3 rounded-full bg-red-500/80" />
 <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
 <div className="w-3 h-3 rounded-full bg-green-500/80" />
 </div>
 <span className="text-xs text-muted-foreground ml-2">CodeSandbox</span>
 </div>
 <Button
 size="sm"
 onClick={handleRun}
 disabled={isRunning}
 className="h-7 px-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs rounded-lg"
 >
 {isRunning ? (
 <>Run...</>
 ) : (
 <>
 <Play className="w-3 h-3 mr-1" />
 Run
 </>
 )}
 </Button>
 </div>
 
 <div className="grid lg:grid-cols-2 divide-x divide-border">
 {/* CodeEdit */}
 <div className="bg-background min-h-[300px]">
 <textarea
 value={code}
 onChange={(e) => setCode(e.target.value)}
 readOnly={readOnly}
 className={cn(
 "w-full h-full min-h-[300px] p-4",
 "bg-transparent text-foreground font-mono text-sm",
 "focus:outline-none resize-none",
 readOnly && "cursor-not-allowed opacity-70"
 )}
 spellCheck={false}
 />
 </div>
 
 {/* Output */}
 <div className="bg-background min-h-[300px]">
 <div className="px-4 py-2 border-b border-border/50 bg-card/50">
 <span className="text-xs text-muted-foreground">Output</span>
 </div>
 <pre className="p-4 text-sm font-mono text-emerald-400/90 whitespace-pre-wrap">
 {output || "// ClickRunButtonExecuteCode"}
 </pre>
 </div>
 </div>
 </div>
 );
}
