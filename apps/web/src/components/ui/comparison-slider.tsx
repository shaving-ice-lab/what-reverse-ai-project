"use client";

/**
 * ComparisonSlider - Before/After Comparison Slider Component
 * 
 * Used to showcase a comparison between traditional methods vs AgentFlow
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
  title: "Traditional Development",
  icon: Code,
  accent: "border-red-500/50",
  points: [
    { text: "Need to write a lot of code", positive: false },
    { text: "Manual error handling and retry logic", positive: false },
    { text: "Ongoing maintenance and debugging", positive: false },
    { text: "Weeks of development and iteration", positive: false },
    { text: "No visual monitoring", positive: false },
  ],
  codeExample: `// Traditional method: requires a lot of boilerplate code
async function processOrder(order) {
  try {
    // Validate order
    const validated = await validateOrder(order);
    if (!validated) throw new Error('Invalid');
    
    // Process payment
    const payment = await processPayment(order);
    if (!payment.success) {
      // Manual retry logic
      for (let i = 0; i < 3; i++) {
        await delay(1000 * i);
        payment = await processPayment(order);
        if (payment.success) break;
      }
    }
    
    // Send notifications
    await sendEmail(order.email);
    await sendSMS(order.phone);
    
    // Update inventory...
    // Update database...
    // Record logs...
  } catch (error) {
    // Error handling...
  }
}`,
};

const afterData: ComparisonItem = {
 title: "AgentFlow method",
 icon: Workflow,
 accent: "border-primary/50",
 points: [
 { text: "Visual drag & drop workflow builder", positive: true },
    { text: "Built-in retry, timeout, and error handling", positive: true },
    { text: "Real-time monitoring and debug tools", positive: true },
    { text: "Deploy in minutes, iterate quickly", positive: true },
 { text: "Complete execution logs and analytics", positive: true },
 ],
 codeExample: `// AgentFlow method: CleanConfig
const workflow = new AgentFlow({
 name: "Order process flow",
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

// Auto error handling, retries, monitoring, and logging`,
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
    {/* Title Area */}
 <div className="flex items-center justify-center gap-4 mb-8">
 <div className="flex items-center gap-2 text-muted-foreground">
 <Clock className="w-5 h-5" />
 <span className="font-medium">Traditional development</span>
 </div>
 <div className="w-px h-6 bg-border" />
 <div className="flex items-center gap-2 text-primary">
 <Zap className="w-5 h-5" />
 <span className="font-medium">AgentFlow</span>
 </div>
 </div>

      {/* Comparison Slider */}
 <div
 ref={containerRef}
 className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-border bg-card cursor-ew-resize select-none"
 onMouseMove={handleMouseMove}
 onMouseUp={handleMouseUp}
 onMouseLeave={handleMouseUp}
 onTouchMove={handleTouchMove}
 onTouchEnd={handleMouseUp}
 >
        {/* Before Content (Traditional method) */}
 <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent">
 <div className="absolute inset-0 p-6 md:p-8">
 <div className="flex items-center gap-3 mb-4">
 <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
 <beforeData.icon className="w-5 h-5 text-red-400" />
 </div>
 <h3 className="text-lg font-semibold text-red-400">{beforeData.title}</h3>
 </div>
 
 <div className="grid md:grid-cols-2 gap-4">
            {/* Issues */}
 <div className="space-y-2">
 {beforeData.points.map((point, i) => (
 <div key={i} className="flex items-start gap-2 text-sm">
 <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
 <span className="text-muted-foreground">{point.text}</span>
 </div>
 ))}
 </div>
 
            {/* Code Example */}
 <div className="hidden md:block">
 <div className="bg-primary-foreground rounded-lg p-4 text-xs font-mono overflow-hidden max-h-[200px]">
 <pre className="text-red-300/70 whitespace-pre-wrap">{beforeData.codeExample}</pre>
 </div>
 </div>
 </div>
 </div>
 </div>

        {/* After Content (AgentFlow) - Overlaid on top, clipped via clip-path */}
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
            {/* Advantages */}
 <div className="space-y-2">
 {afterData.points.map((point, i) => (
 <div key={i} className="flex items-start gap-2 text-sm">
 <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
 <span className="text-foreground">{point.text}</span>
 </div>
 ))}
 </div>
 
            {/* Code Example */}
 <div className="hidden md:block">
 <div className="bg-primary-foreground rounded-lg p-4 text-xs font-mono overflow-hidden max-h-[200px]">
 <pre className="text-primary/80 whitespace-pre-wrap">{afterData.codeExample}</pre>
 </div>
 </div>
 </div>
 </div>
 </div>

          {/* Slider Handle */}
 <div
 className="absolute top-0 bottom-0 w-1 bg-white/50 cursor-ew-resize z-10"
 style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
 onMouseDown={handleMouseDown}
 onTouchStart={handleMouseDown}
 >
          {/* Handle Button */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
 <div className="flex gap-0.5">
 <div className="w-1 h-4 bg-gray-400 rounded-full" />
 <div className="w-1 h-4 bg-gray-400 rounded-full" />
 </div>
 </div>
 </div>
 </div>

      {/* Tip */}
      <p className="text-center text-sm text-muted-foreground mt-4">
        ← Drag slider to compare →
 </p>
 </div>
 );
}

export default ComparisonSlider;
