"use client";

/**
 * Roadmap - Product Roadmap Timeline Component
 * 
 * Displays product development progress and upcoming plans
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
 Rocket,
 CheckCircle2,
 Circle,
 Clock,
 Sparkles,
 ChevronDown,
 ChevronUp,
 Zap,
 Shield,
 Globe,
 Brain,
 Boxes,
 Users,
} from "lucide-react";

type RoadmapStatus = "completed" | "in-progress" | "planned";

interface RoadmapItem {
 id: string;
 quarter: string;
 year: string;
 title: string;
 description: string;
 status: RoadmapStatus;
 icon: React.ElementType;
 features: string[];
 highlight?: boolean;
}

const roadmapData: RoadmapItem[] = [
 {
 id: "q1-2024",
 quarter: "Q1",
 year: "2024",
 title: "Platform Foundation Launch",
 description: "Core workflow engine and visual editor are now live",
 status: "completed",
 icon: Rocket,
 features: [
 "Visual workflow editor",
 "20+ core node types",
 "Basic AI model integration",
 "Real-time execution monitoring",
 ],
 },
 {
 id: "q2-2024",
 quarter: "Q2",
 year: "2024",
 title: "Enterprise-Grade Features",
 description: "Introducing team collaboration and enterprise security",
 status: "completed",
 icon: Shield,
 features: [
 "Team workspaces",
 "RBAC permission control",
 "Audit logging",
 "SSO sign-in",
 ],
 },
 {
 id: "q3-2024",
 quarter: "Q3",
 year: "2024",
 title: "AI Capabilities Enhanced",
 description: "Deep integration with multiple large language models and smart workflow optimization",
 status: "completed",
 icon: Brain,
 features: [
 "GPT-4, Claude, Gemini Integration",
 "AI-Driven Workflow Suggestions",
 "Smart error diagnostics",
 "Natural language workflow creation",
 ],
 },
 {
 id: "q4-2024",
 quarter: "Q4",
 year: "2024",
 title: "Global Deployment",
 description: "Multi-region deployment support for lower latency experiences",
 status: "in-progress",
 icon: Globe,
 features: [
 "Asia Pacific, Europe, and US nodes",
 "Smart route selection",
 "Local data storage",
 "Multi-language interface support",
 ],
 highlight: true,
 },
 {
 id: "q1-2025",
 quarter: "Q1",
 year: "2025",
 title: "Ecosystem Expansion",
 description: "Open plugin marketplace to build a developer ecosystem",
 status: "planned",
 icon: Boxes,
 features: [
 "Plugin / extension marketplace",
 "Third-party developer SDK",
 "Custom node development",
 "Template creator program",
 ],
 },
 {
 id: "q2-2025",
 quarter: "Q2",
 year: "2025",
 title: "Autonomous Agents",
 description: "Next-generation autonomous AI agent workflows",
 status: "planned",
 icon: Sparkles,
 features: [
 "Autonomous decision agents",
 "Multi-agent collaboration",
 "Memory system",
 "Self-optimizing capabilities",
 ],
 },
];

const statusConfig = {
 completed: {
 icon: CheckCircle2,
 color: "text-primary",
 bgColor: "bg-primary",
 borderColor: "border-primary",
 label: "Completed",
 },
 "in-progress": {
 icon: Clock,
 color: "text-yellow-400",
 bgColor: "bg-yellow-400",
 borderColor: "border-yellow-400",
 label: "In Progress",
 },
 planned: {
 icon: Circle,
 color: "text-muted-foreground",
 bgColor: "bg-muted-foreground",
 borderColor: "border-muted-foreground",
 label: "Planned",
 },
};

export function Roadmap() {
 const [expandedItem, setExpandedItem] = useState<string | null>("q4-2024");

 return (
 <div className="w-full">
 {/* Legend */}
 <div className="flex items-center justify-center gap-6 mb-8">
 {Object.entries(statusConfig).map(([key, config]) => (
 <div key={key} className="flex items-center gap-2">
 <config.icon className={cn("w-4 h-4", config.color)} />
 <span className="text-sm text-muted-foreground">{config.label}</span>
 </div>
 ))}
 </div>

 {/* Timeline */}
 <div className="relative">
 {/* Connector line */}
 <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2 hidden md:block" />

 <div className="space-y-4">
 {roadmapData.map((item, index) => {
 const config = statusConfig[item.status];
 const isLeft = index % 2 === 0;
 const isExpanded = expandedItem === item.id;

 return (
 <div
 key={item.id}
 className={cn(
 "relative grid md:grid-cols-2 gap-4 md:gap-8",
 !isLeft && "md:direction-rtl"
 )}
 >
 {/* Time Tags (displayed on the side of the card on mobile) */}
 <div
 className={cn(
 "hidden md:flex items-center gap-2",
 isLeft ? "justify-end" : "justify-start md:direction-ltr"
 )}
 >
 <div
 className={cn(
 "px-4 py-2 rounded-full text-sm font-medium",
 "bg-card border border-border"
 )}
 >
 {item.quarter} {item.year}
 </div>
 </div>

 {/* Center Node (desktop) */}
 <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center">
 <div
 className={cn(
 "w-4 h-4 rounded-full border-4 bg-background",
 config.borderColor,
 item.highlight && "ring-4 ring-yellow-400/30"
 )}
 />
 </div>

 {/* Content Card */}
 <div
 className={cn(
 isLeft ? "md:col-start-2" : "md:col-start-1 md:direction-ltr"
 )}
 >
 <div
 className={cn(
 "p-5 rounded-2xl border transition-all duration-300 cursor-pointer",
 "bg-card/50 backdrop-blur-sm",
 "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
 item.highlight && "border-yellow-400/50 bg-yellow-400/5",
 isExpanded && "border-primary/50"
 )}
 onClick={() => setExpandedItem(isExpanded ? null : item.id)}
 >
 {/* Mobile Time Tags */}
 <div className="md:hidden flex items-center gap-2 mb-3">
 <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
 {item.quarter} {item.year}
 </span>
 <span className={cn("text-xs font-medium", config.color)}>
 {config.label}
 </span>
 </div>

 <div className="flex items-start gap-4">
 {/* Icon */}
 <div
 className={cn(
 "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
 "bg-gradient-to-br",
 item.status === "completed"
 ? "from-primary/20 to-primary/5"
 : item.status === "in-progress"
 ? "from-yellow-400/20 to-yellow-400/5"
 : "from-muted-foreground/20 to-muted-foreground/5"
 )}
 >
 <item.icon
 className={cn(
 "w-6 h-6",
 item.status === "completed"
 ? "text-primary"
 : item.status === "in-progress"
 ? "text-yellow-400"
 : "text-muted-foreground"
 )}
 />
 </div>

 {/* Content */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <h4 className="font-semibold text-foreground">{item.title}</h4>
 {item.highlight && (
 <span className="px-2 py-0.5 text-xs font-medium bg-yellow-400/20 text-yellow-400 rounded-full">
 Current Phase
 </span>
 )}
 </div>
 <p className="text-sm text-muted-foreground mb-2">
 {item.description}
 </p>

 {/* Expand Button */}
 <button className="flex items-center gap-1 text-xs text-primary hover:underline">
 {isExpanded ? (
 <>
 <ChevronUp className="w-3 h-3" />
 Collapse Details
 </>
 ) : (
 <>
 <ChevronDown className="w-3 h-3" />
 View Details
 </>
 )}
 </button>

 {/* Expanded Content */}
 <div
 className={cn(
 "overflow-hidden transition-all duration-300",
 isExpanded ? "max-h-[200px] mt-4" : "max-h-0"
 )}
 >
 <div className="grid grid-cols-2 gap-2">
 {item.features.map((feature, i) => (
 <div
 key={i}
 className="flex items-center gap-2 text-sm"
 >
 <Zap className="w-3 h-3 text-primary shrink-0" />
 <span className="text-muted-foreground">{feature}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Footer CTA */}
 <div className="mt-12 text-center">
 <p className="text-muted-foreground mb-4">
 Want to see more product plans?
 </p>
 <a
 href="/changelog"
 className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
 >
 <Sparkles className="w-4 h-4" />
 View Complete Changelog
 </a>
 </div>
 </div>
 );
}

export default Roadmap;
