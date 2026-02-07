"use client";

/**
 * ComparisonSlider - Before/After forcompareSliderComponent
 * 
 * Used forShowcaseTraditionalmethod vs AgentFlow 'sforcompareEffect
 */

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Code, Workflow, Clock, Zap, CheckCircle2, XCircle } from "lucide-react";

interface ComparisonItem {
 title: string;
 points: Array<{
 text: string;
 positive: boolean;
 }>;
 codeExample?: string;
 icon: React.ElementType;
 accent: string;
}

const beforeData: ComparisonItem = {
 title: "TraditionalDevelopmentmethod",
 icon: Code,
 accent: "border-red-500/50",
 points: [
 { text: "needneedWritelargere-Code", positive: false },
 { text: "ManualProcessErrorandRetryLogic", positive: false },
 { text: "withMaintainandDebug", positive: false },
 { text: "Developmentweeks, Iteration", positive: false },
 { text: "canvisualMonitor", positive: false },
 ],
 codeExample: `// Traditionalmethod: needneedlargestyleCode
async function processOrder(order) {
 try {
 // VerifyOrder
 const validated = await validateOrder(order);
 if (!validated) throw new Error('Invalid');
 
 // ProcessPayment
 const payment = await processPayment(order);
 if (!payment.success) {
 // ManualRetryLogic
 for (let i = 0; i < 3; i++) {
 await delay(1000 * i);
 payment = await processPayment(order);
 if (payment.success) break;
 }
 }
 
 // SendNotifications
 await sendEmail(order.email);
 await sendSMS(order.phone);
 
 // UpdateInventory...
 // UpdateDatabase...
 // RecordLogs...
 } catch (error) {
 // ErrorProcess...
 }
}`,
};

const afterData: ComparisonItem = {
 title: "AgentFlow method",
 icon: Workflow,
 accent: "border-primary/50",
 points: [
 { text: "canvisualDrag & DropBuildWorkflow", positive: true },
 { text: "inRetry, Timeout, ErrorProcess", positive: true },
 { text: "Real-timeMonitorandDebugTool", positive: true },
 { text: "minDeploy, QuickIteration", positive: true },
 { text: "Complete'sExecuteLogsandAnalytics", positive: true },
 ],
 codeExample: `// AgentFlow method: CleanConfig
const workflow = new AgentFlow({
 name: "OrderProcessFlow",
 nodes: [
 { type: "trigger", event: "order.created" },
 { type: "validate", schema: orderSchema },
 { type: "payment", retry: 3, backoff: "exponential" },
 { type: "parallel", nodes: [
 { type: "email", template: "order_confirm" },
 { type: "sms", template: "order_notify" }
 ]},
 { type: "inventory", action: "decrease" },
 { type: "database", action: "update" }
 ]
});

// AutoProcessError, Retry, Monitor, Logs`,
};

export function ComparisonSlider() {
 const [sliderPosition, setSliderPosition] = useState(50);
 const containerRef = useRef<HTMLDivElement>(null);
 const isDragging = useRef(false);

 const handleMouseDown = useCallback(() => {
 isDragging.current = true;
 }, []);

 const handleMouseUp = useCallback(() => {
 isDragging.current = false;
 }, []);

 const handleMouseMove = useCallback((e: React.MouseEvent) => {
 if (!isDragging.current || !containerRef.current) return;

 const rect = containerRef.current.getBoundingClientRect();
 const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
 const percentage = (x / rect.width) * 100;
 setSliderPosition(percentage);
 }, []);

 const handleTouchMove = useCallback((e: React.TouchEvent) => {
 if (!containerRef.current) return;

 const rect = containerRef.current.getBoundingClientRect();
 const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
 const percentage = (x / rect.width) * 100;
 setSliderPosition(percentage);
 }, []);

 return (
 <div className="w-full">
 {/* TitleRegion */}
 <div className="flex items-center justify-center gap-4 mb-8">
 <div className="flex items-center gap-2 text-muted-foreground">
 <Clock className="w-5 h-5" />
 <span className="font-medium">TraditionalDevelopment</span>
 </div>
 <div className="w-px h-6 bg-border" />
 <div className="flex items-center gap-2 text-primary">
 <Zap className="w-5 h-5" />
 <span className="font-medium">AgentFlow</span>
 </div>
 </div>

 {/* forcompareSlider */}
 <div
 ref={containerRef}
 className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-border bg-card cursor-ew-resize select-none"
 onMouseMove={handleMouseMove}
 onMouseUp={handleMouseUp}
 onMouseLeave={handleMouseUp}
 onTouchMove={handleTouchMove}
 onTouchEnd={handleMouseUp}
 >
 {/* Before Content (Traditionalmethod) */}
 <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent">
 <div className="absolute inset-0 p-6 md:p-8">
 <div className="flex items-center gap-3 mb-4">
 <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
 <beforeData.icon className="w-5 h-5 text-red-400" />
 </div>
 <h3 className="text-lg font-semibold text-red-400">{beforeData.title}</h3>
 </div>
 
 <div className="grid md:grid-cols-2 gap-4">
 {/* IssueList */}
 <div className="space-y-2">
 {beforeData.points.map((point, i) => (
 <div key={i} className="flex items-start gap-2 text-sm">
 <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
 <span className="text-muted-foreground">{point.text}</span>
 </div>
 ))}
 </div>
 
 {/* CodeExample */}
 <div className="hidden md:block">
 <div className="bg-primary-foreground rounded-lg p-4 text-xs font-mono overflow-hidden max-h-[200px]">
 <pre className="text-red-300/70 whitespace-pre-wrap">{beforeData.codeExample}</pre>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* After Content (AgentFlow) - Coverageatonface, Via clip-pathControlDisplayRegion */}
 <div
 className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"
 style={{
 clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`,
 }}
 >
 <div className="absolute inset-0 p-6 md:p-8">
 <div className="flex items-center gap-3 mb-4">
 <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
 <afterData.icon className="w-5 h-5 text-primary" />
 </div>
 <h3 className="text-lg font-semibold text-primary">{afterData.title}</h3>
 </div>
 
 <div className="grid md:grid-cols-2 gap-4">
 {/* optimalList */}
 <div className="space-y-2">
 {afterData.points.map((point, i) => (
 <div key={i} className="flex items-start gap-2 text-sm">
 <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
 <span className="text-foreground">{point.text}</span>
 </div>
 ))}
 </div>
 
 {/* CodeExample */}
 <div className="hidden md:block">
 <div className="bg-primary-foreground rounded-lg p-4 text-xs font-mono overflow-hidden max-h-[200px]">
 <pre className="text-primary/80 whitespace-pre-wrap">{afterData.codeExample}</pre>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* SliderHandle */}
 <div
 className="absolute top-0 bottom-0 w-1 bg-white/50 cursor-ew-resize z-10"
 style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
 onMouseDown={handleMouseDown}
 onTouchStart={handleMouseDown}
 >
 {/* HandleButton */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
 <div className="flex gap-0.5">
 <div className="w-1 h-4 bg-gray-400 rounded-full" />
 <div className="w-1 h-4 bg-gray-400 rounded-full" />
 </div>
 </div>
 </div>
 </div>

 {/* Tipchar */}
 <p className="text-center text-sm text-muted-foreground mt-4">
 ← DragSliderforcompareEffect →
 </p>
 </div>
 );
}

export default ComparisonSlider;
