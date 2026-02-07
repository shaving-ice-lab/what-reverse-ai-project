"use client";

/**
 * Roadmap - ProductRoadmapTimelineComponent
 * 
 * ShowcaseProductDevelopmentandnot yetcomePlan
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
 title: "PlatformBasicPublish",
 description: "CoreWorkflowEngineandcanvisualEditcurrentlyonline",
 status: "completed",
 icon: Rocket,
 features: [
 "canvisualWorkflowEdit",
 "20+ CoreNodeType",
 "Basic AI ModelIntegration",
 "Real-timeExecuteMonitor",
 ],
 },
 {
 id: "q2-2024",
 quarter: "Q2",
 year: "2024",
 title: "Enterprise-gradeFeatures",
 description: "enterTeamCollaborationandEnterpriseSecurity",
 status: "completed",
 icon: Shield,
 features: [
 "TeamWorkspace",
 "RBAC PermissionControl",
 "Audit Log",
 "SSO Sign In",
 ],
 },
 {
 id: "q3-2024",
 quarter: "Q3",
 year: "2024",
 title: "AI canpowerEnhanced",
 description: "DepthIntegrationmultipletypelargeLanguageModel, SmartWorkflowoptimal",
 status: "completed",
 icon: Brain,
 features: [
 "GPT-4, Claude, Gemini Integration",
 "AI Driven'sWorkflowSuggestion",
 "SmartErrorDiagnose",
 "NaturalLanguageCreateWorkflow",
 ],
 },
 {
 id: "q4-2024",
 quarter: "Q4",
 year: "2024",
 title: "allDeploy",
 description: "multipleRegionDeploySupport, moreLatencyExperience",
 status: "in-progress",
 icon: Globe,
 features: [
 "Asia Pacific, Europe, Node",
 "SmartRouteSelect",
 "DataLocalStorage",
 "multipleLanguagefaceSupport",
 ],
 highlight: true,
 },
 {
 id: "q1-2025",
 quarter: "Q1",
 year: "2025",
 title: "EcosystemSystemExtend",
 description: "OpenPluginMarketplace, BuildDevelopersEcosystem",
 status: "planned",
 icon: Boxes,
 features: [
 "Plugin/ExtendMarketplace",
 "Third-partyDevelopers SDK",
 "CustomNodeDevelopment",
 "TemplateCreativeuserPlan",
 ],
 },
 {
 id: "q2-2025",
 quarter: "Q2",
 year: "2025",
 title: "Agent Agent",
 description: "down1main AI Agent Workflow",
 status: "planned",
 icon: Sparkles,
 features: [
 "mainDecision Agent",
 "multiple Agent Collaboration",
 "MemorySystem",
 "Ioptimalcanpower",
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
 label: "Plan",
 },
};

export function Roadmap() {
 const [expandedItem, setExpandedItem] = useState<string | null>("q4-2024");

 return (
 <div className="w-full">
 {/* example */}
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
 {/* Connectline */}
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
 {/* TimeTags (MoveendpointDisplayatCardin) */}
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

 {/* centerNode (faceendpoint) */}
 <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center">
 <div
 className={cn(
 "w-4 h-4 rounded-full border-4 bg-background",
 config.borderColor,
 item.highlight && "ring-4 ring-yellow-400/30"
 )}
 />
 </div>

 {/* ContentCard */}
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
 {/* MoveendpointTimeTags */}
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
 CurrentPhase
 </span>
 )}
 </div>
 <p className="text-sm text-muted-foreground mb-2">
 {item.description}
 </p>

 {/* ExpandButton */}
 <button className="flex items-center gap-1 text-xs text-primary hover:underline">
 {isExpanded ? (
 <>
 <ChevronUp className="w-3 h-3" />
 CollapseDetails
 </>
 ) : (
 <>
 <ChevronDown className="w-3 h-3" />
 ViewDetails
 </>
 )}
 </button>

 {/* ExpandContent */}
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
 wantmoremultipleProductPlan?
 </p>
 <a
 href="/changelog"
 className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
 >
 <Sparkles className="w-4 h-4" />
 ViewCompleteChange Log
 </a>
 </div>
 </div>
 );
}

export default Roadmap;
