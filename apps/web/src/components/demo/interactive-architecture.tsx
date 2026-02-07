"use client";

import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
 Server,
 Database,
 Cloud,
 Cpu,
 Shield,
 Zap,
 Globe,
 Lock,
 Layers,
 Network,
 HardDrive,
 Monitor,
 Smartphone,
 ArrowRight,
 ArrowDown,
 CheckCircle,
} from "lucide-react";

export interface ArchitectureLayer {
 id: string;
 name: string;
 description: string;
 icon: React.ElementType;
 color: string;
 components: Array<{ name: string; desc: string }>;
}

// ArchitectureHierarchy
const defaultArchitectureLayers: ArchitectureLayer[] = [
 {
 id: "client",
 name: "Customerendpoint",
 description: "multiplePlatformCustomerendpointAccess, Provide1'sUserExperience",
 icon: Monitor,
 color: "#3B82F6",
 components: [
 { name: "Web App", desc: "React + Next.js Build'sModern Web face" },
 { name: "faceApp", desc: "Electron PlatformfaceCustomerendpoint" },
 { name: "MoveApp", desc: "React Native MoveendpointSupport" },
 { name: "CLI Tool", desc: "CommandrowTool, SuitableAutomationScenario" },
 ],
 },
 {
 id: "gateway",
 name: "API ",
 description: "1's API Entry, ResponsibleAuthentication, Rate LimitingandRoute",
 icon: Globe,
 color: "#8B5CF6",
 components: [
 { name: "Load Balancing", desc: "SmartDistribute, SupportGrayscalePublish" },
 { name: "Authenticationcenter", desc: "OAuth 2.0 / JWT Verify" },
 { name: "Rate LimitingCircuit Break", desc: "ProtectafterendpointServicepast" },
 { name: "API VersionManage", desc: "Smooth's API VersionMigration" },
 ],
 },
 {
 id: "service",
 name: "Service",
 description: "CoreBusinessLogic, useServiceArchitecture",
 icon: Cpu,
 color: "#10B981",
 components: [
 { name: "WorkflowEngine", desc: "canWorkflowExecuteandSchedule" },
 { name: "AI Service", desc: "multipleModelAdaptandSmartRoute" },
 { name: "DataProcess", desc: "ETL andReal-timeDataPipeline" },
 { name: "NotificationsService", desc: "multipleChannelMessagePush" },
 ],
 },
 {
 id: "data",
 name: "Data",
 description: "AvailableDataStorage, SupportmultipletypeStorageEngine",
 icon: Database,
 color: "#F59E0B",
 components: [
 { name: "PostgreSQL", desc: "Data, ACID Support" },
 { name: "Redis", desc: "CacheandReal-timewillManage" },
 { name: "S3/OSS", desc: "forStorage, FileandMedia" },
 { name: "Elasticsearch", desc: "allSearchandLogsAnalytics" },
 ],
 },
 {
 id: "infra",
 name: "BasicInfrastructure",
 description: "NativeBasicInfrastructure, SupportmultipleDeploy",
 icon: Cloud,
 color: "#EC4899",
 components: [
 { name: "Kubernetes", desc: "OrchestrateandAutoScale" },
 { name: "MonitorAlert", desc: "Prometheus + Grafana can" },
 { name: "LogsSystem", desc: "ELK Stack Logs" },
 { name: "CI/CD", desc: "GitOps ContinuousDeploy" },
 ],
 },
];

export interface InteractiveArchitectureProps extends React.HTMLAttributes<HTMLDivElement> {
 /** DefaultExpand's */
 defaultExpanded?: string;
 /** isnoDisplayConnectAnimation */
 showConnections?: boolean;
 /** Layoutmethod */
 layout?: "vertical" | "horizontal";
 /** CustomArchitectureHierarchy */
 layers?: ArchitectureLayer[];
}

export function InteractiveArchitecture({
 defaultExpanded,
 showConnections = true,
 layout = "vertical",
 layers,
 className,
 ...props
}: InteractiveArchitectureProps) {
 const [activeLayer, setActiveLayer] = useState<string | null>(defaultExpanded || null);
 const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);
 const resolvedLayers = layers ?? defaultArchitectureLayers;

 return (
 <div className={cn("relative", className)} {...props}>
 {/* Architecture */}
 <div className={cn(
 "space-y-3",
 layout === "horizontal" && "flex gap-4 space-y-0"
 )}>
 {resolvedLayers.map((layer, index) => {
 const Icon = layer.icon;
 const isActive = activeLayer === layer.id;

 return (
 <div key={layer.id} className={cn(
 layout === "horizontal" && "flex-1"
 )}>
 {/* HierarchyCard */}
 <div
 className={cn(
 "relative rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden",
 isActive
 ? "bg-card border-primary/50 shadow-lg"
 : "bg-card/50 border-border/50 hover:border-border hover:bg-card"
 )}
 onClick={() => setActiveLayer(isActive ? null : layer.id)}
 >
 {/* TopGradient */}
 <div 
 className="absolute inset-x-0 top-0 h-1 opacity-80"
 style={{ backgroundColor: layer.color }}
 />

 {/* HierarchyHeader */}
 <div className="p-4 flex items-center gap-4">
 <div
 className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
 style={{ backgroundColor: `${layer.color}20` }}
 >
 <Icon className="w-6 h-6" style={{ color: layer.color }} />
 </div>
 <div className="flex-1 min-w-0">
 <h4 className="font-semibold text-foreground">{layer.name}</h4>
 <p className="text-sm text-muted-foreground truncate">{layer.description}</p>
 </div>
 <div className={cn(
 "w-6 h-6 rounded-full flex items-center justify-center transition-transform",
 isActive && "rotate-180"
 )}>
 <ArrowDown className="w-4 h-4 text-muted-foreground" />
 </div>
 </div>

 {/* Expand'sComponentList */}
 {isActive && (
 <div className="px-4 pb-4 space-y-2 animate-in slide-in-from-top-2 duration-300">
 <div className="grid sm:grid-cols-2 gap-2">
 {layer.components.map((component) => (
 <div
 key={component.name}
 className={cn(
 "p-3 rounded-lg transition-all duration-200",
 "bg-muted/50 hover:bg-muted",
 hoveredComponent === component.name && "ring-1 ring-primary/50"
 )}
 onMouseEnter={() => setHoveredComponent(component.name)}
 onMouseLeave={() => setHoveredComponent(null)}
 >
 <div className="flex items-start gap-2">
 <CheckCircle 
 className="w-4 h-4 shrink-0 mt-0.5" 
 style={{ color: layer.color }} 
 />
 <div>
 <p className="text-sm font-medium text-foreground">{component.name}</p>
 <p className="text-xs text-muted-foreground">{component.desc}</p>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* Connectline */}
 {showConnections && index < resolvedLayers.length - 1 && layout === "vertical" && (
 <div className="flex justify-center py-1">
 <div className="w-0.5 h-4 bg-gradient-to-b from-border to-transparent" />
 </div>
 )}
 </div>
 );
 })}
 </div>

 {/* example */}
 <div className="mt-8 flex flex-wrap justify-center gap-4">
 {resolvedLayers.map((layer) => (
 <div 
 key={layer.id}
 className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
 onClick={() => setActiveLayer(activeLayer === layer.id ? null : layer.id)}
 >
 <div 
 className="w-3 h-3 rounded"
 style={{ backgroundColor: layer.color }}
 />
 {layer.name}
 </div>
 ))}
 </div>
 </div>
 );
}

// canforcompareComponent
const performanceMetrics = [
 { 
 metric: "AverageResponse Time", 
 agentflow: 45, 
 traditional: 380, 
 unit: "ms",
 improvement: "8x more"
 },
 { 
 metric: "ConcurrencyProcesscanpower", 
 agentflow: 10000, 
 traditional: 500, 
 unit: "req/s",
 improvement: "20x more"
 },
 { 
 metric: "inuse", 
 agentflow: 256, 
 traditional: 1024, 
 unit: "MB",
 improvement: "75% morefew"
 },
 { 
 metric: "LaunchTime", 
 agentflow: 2, 
 traditional: 15, 
 unit: "s",
 improvement: "7x more"
 },
];

export interface PerformanceComparisonProps extends React.HTMLAttributes<HTMLDivElement> {
 /** isnoEnableAnimation */
 animated?: boolean;
}

export function PerformanceComparison({
 animated = true,
 className,
 ...props
}: PerformanceComparisonProps) {
 const [isVisible, setIsVisible] = useState(!animated);

 React.useEffect(() => {
 if (animated) {
 const timer = setTimeout(() => setIsVisible(true), 500);
 return () => clearTimeout(timer);
 }
 }, [animated]);

 return (
 <div className={cn("space-y-6", className)} {...props}>
 {performanceMetrics.map((item, index) => {
 const agentflowPercent = (item.agentflow / Math.max(item.agentflow, item.traditional)) * 100;
 const traditionalPercent = (item.traditional / Math.max(item.agentflow, item.traditional)) * 100;
 const isAgentflowBetter = item.agentflow < item.traditional || 
 (item.metric === "ConcurrencyProcesscanpower" && item.agentflow > item.traditional);

 return (
 <div 
 key={item.metric}
 className="space-y-3"
 style={{
 opacity: isVisible ? 1 : 0,
 transform: isVisible ? "translateY(0)" : "translateY(20px)",
 transition: `all 0.5s ease-out ${index * 0.1}s`
 }}
 >
 <div className="flex items-center justify-between">
 <span className="text-sm font-medium text-foreground">{item.metric}</span>
 <span className="text-xs font-medium text-primary">{item.improvement}</span>
 </div>
 
 {/* AgentFlow */}
 <div className="space-y-1">
 <div className="flex items-center justify-between text-xs">
 <span className="text-primary font-medium">AgentFlow</span>
 <span className="text-muted-foreground">{item.agentflow} {item.unit}</span>
 </div>
 <div className="h-3 bg-muted rounded-full overflow-hidden">
 <div 
 className="h-full bg-gradient-to-r from-primary to-primary/90 rounded-full transition-all duration-1000 ease-out"
 style={{ 
 width: isVisible 
 ? `${isAgentflowBetter ? agentflowPercent : traditionalPercent}%` 
 : "0%" 
 }}
 />
 </div>
 </div>

 {/* TraditionalPlan */}
 <div className="space-y-1">
 <div className="flex items-center justify-between text-xs">
 <span className="text-muted-foreground">TraditionalPlan</span>
 <span className="text-muted-foreground">{item.traditional} {item.unit}</span>
 </div>
 <div className="h-3 bg-muted rounded-full overflow-hidden">
 <div 
 className="h-full bg-gradient-to-r from-gray-400 to-gray-500 rounded-full transition-all duration-1000 ease-out"
 style={{ 
 width: isVisible 
 ? `${isAgentflowBetter ? traditionalPercent : agentflowPercent}%` 
 : "0%" 
 }}
 />
 </div>
 </div>
 </div>
 );
 })}
 </div>
 );
}
