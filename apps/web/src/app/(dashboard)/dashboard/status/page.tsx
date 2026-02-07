"use client";

/**
 * SystemStatusPage
 * DisplayService'sRunStatusandHealthCheck
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import {
 planApi,
 type MetricsDictionary,
 type TrackingEventPlan,
 type IncidentDrillPlanSet,
 type IncidentOwnerTable,
 type PostmortemTemplate,
 type ErrorBudgetPolicyTable,
 type SyntheticMonitoringPlan,
 type OnCallSLOTable,
 type StabilityPlan,
} from "@/lib/api/plan";
import {
 Activity,
 CheckCircle2,
 XCircle,
 AlertTriangle,
 Clock,
 Server,
 Database,
 Globe,
 Cpu,
 HardDrive,
 Wifi,
 RefreshCw,
 ExternalLink,
 Bell,
 Calendar,
 TrendingUp,
 Zap,
 Bot,
 MessageSquare,
 Cloud,
 Shield,
 Gauge,
 Radar,
 PhoneCall,
 ShieldCheck,
 ArrowUpRight,
 ArrowDownRight,
 Minus,
} from "lucide-react";

// ServiceStatusConfig
const statusConfig = {
 operational: {
 label: "NormalRun",
 color: "text-brand-500",
 bg: "bg-brand-500",
 bgLight: "bg-brand-200/70",
 badgeVariant: "success",
 badgeClassName: "border-brand-500/30",
 },
 degraded: {
 label: "canDecline",
 color: "text-warning",
 bg: "bg-warning",
 bgLight: "bg-warning-200/70",
 badgeVariant: "warning",
 badgeClassName: "border-warning/40",
 },
 partial: {
 label: "Partial",
 color: "text-warning",
 bg: "bg-warning",
 bgLight: "bg-warning-200/70",
 badgeVariant: "warning",
 badgeClassName: "border-warning/40",
 },
 major: {
 label: "re-largeFault",
 color: "text-destructive",
 bg: "bg-destructive",
 bgLight: "bg-destructive-200/70",
 badgeVariant: "destructive",
 badgeClassName: "border-destructive/40",
 },
 maintenance: {
 label: "Maintain",
 color: "text-foreground-light",
 bg: "bg-surface-200",
 bgLight: "bg-surface-200",
 badgeVariant: "secondary",
 badgeClassName: "border-border",
 },
};

// ServiceList
const services = [
 {
 id: "api",
 name: "API Service",
 description: "Core API InterfaceService",
 icon: Server,
 status: "operational",
 uptime: 99.98,
 responseTime: 45,
 lastChecked: "1 minbefore",
 },
 {
 id: "ai-engine",
 name: "AI Engine",
 description: "AI ModelInferenceService",
 icon: Cpu,
 status: "operational",
 uptime: 99.95,
 responseTime: 120,
 lastChecked: "1 minbefore",
 },
 {
 id: "workflow",
 name: "WorkflowEngine",
 description: "WorkflowExecuteandSchedule",
 icon: Zap,
 status: "operational",
 uptime: 99.99,
 responseTime: 35,
 lastChecked: "1 minbefore",
 },
 {
 id: "database",
 name: "Database",
 description: "mainDatabaseCluster",
 icon: Database,
 status: "operational",
 uptime: 99.99,
 responseTime: 12,
 lastChecked: "1 minbefore",
 },
 {
 id: "storage",
 name: "FileStorage",
 description: "forStorageService",
 icon: HardDrive,
 status: "degraded",
 uptime: 99.85,
 responseTime: 180,
 lastChecked: "1 minbefore",
 issue: "UploadSpeedhasDecline",
 },
 {
 id: "cdn",
 name: "CDN",
 description: "ContentDistributeNetwork",
 icon: Globe,
 status: "operational",
 uptime: 99.97,
 responseTime: 25,
 lastChecked: "1 minbefore",
 },
 {
 id: "websocket",
 name: "WebSocket",
 description: "Real-timeCommunicationService",
 icon: Wifi,
 status: "operational",
 uptime: 99.92,
 responseTime: 15,
 lastChecked: "1 minbefore",
 },
 {
 id: "auth",
 name: "AuthenticationService",
 description: "UserAuthenticationandAuthorize",
 icon: Shield,
 status: "operational",
 uptime: 99.99,
 responseTime: 28,
 lastChecked: "1 minbefore",
 },
];

// RecentEvent
const recentIncidents = [
 {
 id: "1",
 title: "FileStorageServicecanDecline",
 status: "investigating",
 severity: "minor",
 startTime: "2026-01-31T09:30:00Z",
 updates: [
 { time: "10:15", message: "alreadyIssue, currentlyatProceedFix" },
 { time: "09:45", message: "currentlyat" },
 { time: "09:30", message: "DetecttoFileUploadSpeedDecline" },
 ],
 },
 {
 id: "2",
 title: "PlanMaintain: DatabaseUpgrade",
 status: "scheduled",
 severity: "maintenance",
 startTime: "2026-02-01T02:00:00Z",
 endTime: "2026-02-01T04:00:00Z",
 updates: [
 { time: "Preview", message: "willProceedDatabaseVersionUpgrade, EstimatedImpact 2 h" },
 ],
 },
];

// HistoryAvailableData(Recent90days)
const uptimeHistory = Array.from({ length: 90 }, (_, i) => ({
 date: new Date(Date.now() - (89 - i) * 24 * 60 * 60 * 1000),
 status: Math.random() > 0.05 ? "operational" : Math.random() > 0.5 ? "degraded" : "partial",
}));

export default function StatusPage() {
 const [isRefreshing, setIsRefreshing] = useState(false);
 const [lastUpdated, setLastUpdated] = useState(new Date());
 const [incidentPlans, setIncidentPlans] = useState<IncidentDrillPlanSet | null>(null);
 const [incidentOwners, setIncidentOwners] = useState<IncidentOwnerTable | null>(null);
 const [postmortemTemplate, setPostmortemTemplate] = useState<PostmortemTemplate | null>(null);
 const [errorBudgetPolicy, setErrorBudgetPolicy] = useState<ErrorBudgetPolicyTable | null>(null);
 const [syntheticPlan, setSyntheticPlan] = useState<SyntheticMonitoringPlan | null>(null);
 const [oncallSLO, setOncallSLO] = useState<OnCallSLOTable | null>(null);
 const [stabilityPlan, setStabilityPlan] = useState<StabilityPlan | null>(null);
 const [planLoading, setPlanLoading] = useState(true);
 const [planError, setPlanError] = useState<string | null>(null);
 const [metricsDictionary, setMetricsDictionary] = useState<MetricsDictionary | null>(null);
 const [frontendTrackingPlan, setFrontendTrackingPlan] = useState<TrackingEventPlan | null>(null);
 const [backendTrackingPlan, setBackendTrackingPlan] = useState<TrackingEventPlan | null>(null);
 const [observabilityLoading, setObservabilityLoading] = useState(true);
 const [observabilityError, setObservabilityError] = useState<string | null>(null);

 const handleRefresh = () => {
 setIsRefreshing(true);
 setTimeout(() => {
 setIsRefreshing(false);
 setLastUpdated(new Date());
 }, 1000);
 };

 // AutoRefresh
 useEffect(() => {
 const interval = setInterval(() => {
 setLastUpdated(new Date());
 }, 60000);
 return () => clearInterval(interval);
 }, []);

 useEffect(() => {
 let isActive = true;
 const loadPlanData = async () => {
 try {
 setPlanLoading(true);
 setPlanError(null);
 const [drills, owners, template, errorBudget, synthetic, oncall, stability] = await Promise.all([
 planApi.getIncidentDrillPlans(),
 planApi.getIncidentOwnerTable(),
 planApi.getPostmortemTemplate(),
 planApi.getErrorBudgetPolicy(),
 planApi.getSyntheticMonitoringPlan(),
 planApi.getOnCallSLOTable(),
 planApi.getStabilityPlan(),
 ]);
 if (!isActive) return;
 setIncidentPlans(drills);
 setIncidentOwners(owners);
 setPostmortemTemplate(template);
 setErrorBudgetPolicy(errorBudget);
 setSyntheticPlan(synthetic);
 setOncallSLO(oncall);
 setStabilityPlan(stability);
 } catch (error) {
 if (!isActive) return;
 console.error("Failed to load plan data:", error);
 setPlanError("PlanningFailed to load data, Please try again laterRetry.");
 } finally {
 if (isActive) setPlanLoading(false);
 }
 };

 loadPlanData();
 return () => {
 isActive = false;
 };
 }, []);

 useEffect(() => {
 let isActive = true;
 const loadObservabilityPlans = async () => {
 try {
 setObservabilityLoading(true);
 setObservabilityError(null);
 const [dictionary, frontend, backend] = await Promise.all([
 planApi.getMetricsDictionary(),
 planApi.getFrontendTrackingPlan(),
 planApi.getBackendTrackingPlan(),
 ]);
 if (!isActive) return;
 setMetricsDictionary(dictionary);
 setFrontendTrackingPlan(frontend);
 setBackendTrackingPlan(backend);
 } catch (error) {
 if (!isActive) return;
 console.error("Failed to load observability plan data:", error);
 setObservabilityError("MonitorMetricsandTrackingPlanLoadFailed, Please try again laterRetry.");
 } finally {
 if (isActive) setObservabilityLoading(false);
 }
 };

 loadObservabilityPlans();
 return () => {
 isActive = false;
 };
 }, []);

 // CalculateOverallStatus
 const overallStatus = services.every((s) => s.status === "operational")
 ? "operational"
 : services.some((s) => s.status === "major")
 ? "major"
 : services.some((s) => s.status === "partial")
 ? "partial"
 : "degraded";

 const overallConfig = statusConfig[overallStatus];
 const avgUptime = (services.reduce((sum, s) => sum + s.uptime, 0) / services.length).toFixed(2);

 return (
 <PageContainer>
 <div className="space-y-6">
 <PageHeader
 title="SystemStatus"
 description="Real-timeMonitorAllService'sRunStatusandHealthCheck"
 actions={(
 <div className="flex flex-wrap items-center gap-2">
 <Button
 variant="ghost"
 size="sm"
 onClick={handleRefresh}
 leftIcon={<RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />}
 >
 Refresh
 </Button>
 <Button variant="outline" size="sm" leftIcon={<Bell className="w-4 h-4" />}>
 SubscriptionNotifications
 </Button>
 </div>
 )}
 >
 <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
 <span className="inline-flex items-center gap-1.5">
 <Clock className="w-3.5 h-3.5" />
 Updateat {lastUpdated.toLocaleTimeString("zh-CN")}
 </span>
 <Badge
 variant={overallConfig.badgeVariant}
 size="xs"
 className={cn("text-xs", overallConfig.badgeClassName)}
 >
 {overallConfig.label}
 </Badge>
 <span className="inline-flex items-center gap-1.5">
 <Server className="w-3.5 h-3.5" />
 Monitor {services.length} Service
 </span>
 </div>
 </PageHeader>

 <div className="page-divider" />

 {/* StatusOverview */}
 <section className="page-grid lg:grid-cols-[2fr_1fr]">
 <div className="page-panel">
 <div className="page-panel-header flex flex-wrap items-center justify-between gap-3">
 <div>
 <p className="page-panel-title">OverallStatus</p>
 <p className="page-panel-description">
 {overallStatus === "operational" ? "AllSystemRunNormal": "SystematException"}
 </p>
 </div>
 <Badge
 variant={overallConfig.badgeVariant}
 size="sm"
 className={cn("text-xs", overallConfig.badgeClassName)}
 >
 {overallConfig.label}
 </Badge>
 </div>
 <div className="p-5 space-y-4">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
 <div className="flex items-start gap-4">
 <div className={cn("h-12 w-12 rounded-md flex items-center justify-center", overallConfig.bgLight)}>
 {overallStatus === "operational" ? (
 <CheckCircle2 className={cn("w-6 h-6", overallConfig.color)} />
 ) : overallStatus === "degraded" ? (
 <AlertTriangle className={cn("w-6 h-6", overallConfig.color)} />
 ) : (
 <XCircle className={cn("w-6 h-6", overallConfig.color)} />
 )}
 </div>
 <div className="space-y-1">
 <p className="text-sm font-medium text-foreground">SystemHealth</p>
 <p className="text-[13px] text-foreground-light">
 alreadyMonitor {services.length} CoreService
 </p>
 </div>
 </div>
 <div className="flex flex-wrap gap-6 text-right">
 <div>
 <p className="text-xs text-foreground-muted">30 daysAverageAvailable</p>
 <p className="text-2xl font-semibold text-foreground">{avgUptime}%</p>
 </div>
 <div>
 <p className="text-xs text-foreground-muted">ActiveEvent</p>
 <p className="text-2xl font-semibold text-foreground">{recentIncidents.length}</p>
 </div>
 </div>
 </div>
 <div className="space-y-2">
 <Progress value={Number(avgUptime)} className="h-2 bg-surface-200" />
 <div className="flex items-center justify-between text-xs text-foreground-muted">
 <span>Recent 30 days</span>
 <span className="text-foreground">{avgUptime}%</span>
 </div>
 </div>
 </div>
 </div>

 <div className="page-panel">
 <div className="page-panel-header">
 <p className="page-panel-title">MonitorSummary</p>
 <p className="page-panel-description">mostnewRefreshandSubscriptionOverview</p>
 </div>
 <div className="p-5 space-y-4 text-sm">
 <div className="flex items-center justify-between">
 <span className="text-foreground-muted">RefreshTime</span>
 <span className="font-mono text-foreground">
 {lastUpdated.toLocaleTimeString("zh-CN")}
 </span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-foreground-muted">MonitorService</span>
 <span className="text-foreground">{services.length} </span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-foreground-muted">NotificationsSubscription</span>
 <Badge variant="secondary" size="sm" className="bg-surface-200 text-foreground-light">
 not yetSubscription
 </Badge>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-foreground-muted">StatusView</span>
 <span className="text-foreground">all</span>
 </div>
 </div>
 </div>
 </section>

 {/* 90 daysAvailableHistory */}
 <section className="page-panel">
 <div className="page-panel-header flex items-center justify-between gap-3">
 <div>
 <p className="page-panel-title">AvailableHistory</p>
 <p className="page-panel-description">Past 90 daysStatusOverview</p>
 </div>
 <span className="text-[13px] text-foreground-light">
 OverallAvailable 99.95%
 </span>
 </div>
 <div className="p-5">
 <div className="flex gap-0.5">
 {uptimeHistory.map((day, index) => {
 const config = statusConfig[day.status as keyof typeof statusConfig];
 return (
 <div
 key={index}
 className={cn("flex-1 h-6 rounded-sm", config.bg)}
 title={`${day.date.toLocaleDateString("zh-CN")}: ${config.label}`}
 />
 );
 })}
 </div>
 <div className="flex items-center justify-between mt-2 text-xs text-foreground-muted">
 <span>90 daysbefore</span>
 <div className="flex items-center gap-4">
 {Object.entries(statusConfig).slice(0, 3).map(([key, config]) => (
 <span key={key} className="flex items-center gap-1">
 <span className={cn("w-3 h-3 rounded-sm", config.bg)} />
 {config.label}
 </span>
 ))}
 </div>
 <span>Today</span>
 </div>
 </div>
 </section>

 {/* ServiceList */}
 <section className="page-panel">
 <div className="page-panel-header flex items-center justify-between gap-3">
 <div>
 <p className="page-panel-title">ServiceStatus</p>
 <p className="page-panel-description">keyServiceRunSituation</p>
 </div>
 <Button variant="outline" size="sm" className="border-border text-foreground-light hover:text-foreground">
 <Download className="w-4 h-4 mr-2" />
 ExportReport
 </Button>
 </div>
 <div className="divide-y divide-border">
 {services.map((service) => {
 const config = statusConfig[service.status as keyof typeof statusConfig];
 const Icon = service.icon;

 return (
 <div key={service.id} className="px-5 py-4">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
 <div className="flex items-start gap-3">
 <div className={cn("p-2.5 rounded-md", config.bgLight)}>
 <Icon className={cn("w-4 h-4", config.color)} />
 </div>
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <h4 className="text-sm font-medium text-foreground">{service.name}</h4>
 <Badge
 variant={config.badgeVariant}
 size="sm"
 className={cn("text-xs", config.badgeClassName)}
 >
 {config.label}
 </Badge>
 </div>
 <p className="text-[13px] text-foreground-light">
 {service.issue || service.description}
 </p>
 </div>
 </div>

 <div className="flex flex-wrap gap-6 text-xs text-foreground-muted">
 <div>
 <p>Available</p>
 <p className="text-sm font-medium text-foreground">{service.uptime}%</p>
 </div>
 <div>
 <p>Response Time</p>
 <p className="text-sm font-medium text-foreground">{service.responseTime}ms</p>
 </div>
 <div>
 <p>CheckTime</p>
 <p className="text-sm font-medium text-foreground">{service.lastChecked}</p>
 </div>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </section>

 {/* RecentEvent */}
 <section className="page-panel">
 <div className="page-panel-header flex items-center justify-between gap-3">
 <div>
 <p className="page-panel-title">RecentEvent</p>
 <p className="page-panel-description">mostnewMaintainandAlertRecord</p>
 </div>
 <Button variant="ghost" size="sm" className="text-foreground-light hover:text-foreground">
 ViewHistory <ExternalLink className="w-4 h-4 ml-1" />
 </Button>
 </div>

 <div className="p-5">
 {recentIncidents.length === 0 ? (
 <div className="p-8 rounded-md bg-surface-100 border border-border text-center">
 <CheckCircle2 className="w-10 h-10 text-brand-500 mx-auto mb-4" />
 <p className="text-foreground text-sm font-medium">NoActive'sEvent</p>
 <p className="text-[13px] text-foreground-light">AllSystemRunNormal</p>
 </div>
 ) : (
 <div className="space-y-4">
 {recentIncidents.map((incident) => {
 const statusVariant =
 incident.status === "scheduled"
 ? "secondary"
 : incident.status === "investigating"
 ? "warning"
 : "success";
 return (
 <div
 key={incident.id}
 className="p-5 rounded-md border border-border bg-surface-100"
 >
 <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
 <div>
 <div className="flex items-center gap-2 mb-1">
 {incident.severity === "maintenance" ? (
 <Clock className="w-4 h-4 text-foreground-light" />
 ) : (
 <AlertTriangle
 className={cn(
 "w-4 h-4",
 incident.severity === "minor"
 ? "text-warning"
 : "text-destructive"
 )}
 />
 )}
 <h4 className="text-sm font-medium text-foreground">{incident.title}</h4>
 </div>
 <p className="text-[13px] text-foreground-light">
 {incident.status === "scheduled"
 ? `PlanTime: ${new Date(incident.startTime).toLocaleString("zh-CN")}`
: `Startat ${new Date(incident.startTime).toLocaleString("zh-CN")}`}
 </p>
 </div>
 <Badge
 variant={statusVariant}
 size="sm"
 className={cn(
 statusVariant === "secondary" && "bg-surface-200 text-foreground-light",
 statusVariant === "warning" && "border-warning/40",
 statusVariant === "success" && "border-brand-500/30"
 )}
 >
 {incident.status === "scheduled"
 ? "alreadyPlan"
 : incident.status === "investigating"
 ? ""
: "alreadyResolve"}
 </Badge>
 </div>

 <div className="space-y-2 pl-7">
 {incident.updates.map((update, index) => (
 <div key={index} className="flex items-start gap-3 text-[13px]">
 <span className="text-foreground-muted font-mono shrink-0 w-12">
 {update.time}
 </span>
 <span className="text-foreground">{update.message}</span>
 </div>
 ))}
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </section>

 {/* FaultDrillandshouldContingency */}
 <section className="page-panel">
 <div className="page-panel-header flex items-center justify-between gap-3">
 <div>
 <p className="page-panel-title">FaultDrillandshouldContingency</p>
 <p className="page-panel-description">DrillChecklist, ResponsibilityandTemplate</p>
 </div>
 <Badge variant="outline" size="sm" className="border-border text-foreground-light">
 Playbook
 </Badge>
 </div>
 <div className="p-5 space-y-4">
 {planLoading ? (
 <div className="rounded-lg border border-border bg-surface-100 px-4 py-3 text-xs text-foreground-light">
 LoadingDrillandContingencyData...
 </div>
 ) : planError ? (
 <div className="rounded-lg border border-destructive/50 bg-destructive-200/40 px-4 py-3 text-xs text-destructive">
 {planError}
 </div>
 ) : (
 <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
 <div className="rounded-lg border border-border bg-surface-100 p-4 space-y-3">
 <div className="flex items-center justify-between gap-2">
 <div className="flex items-center gap-2 text-sm text-foreground">
 <Calendar className="w-4 h-4 text-foreground-light" />
 {incidentPlans?.title || "keyFaultDrillPlan"}
 </div>
 <Badge variant="outline" size="sm" className="border-border text-foreground-light">
 {incidentPlans?.drills?.length ?? 0} 
 </Badge>
 </div>
 <p className="text-[12px] text-foreground-light">
 {incidentPlans?.summary || "NoneDrillPlan."}
 </p>
 <div className="space-y-3">
 {(incidentPlans?.drills || []).map((drill) => (
 <div
 key={drill.key}
 className="rounded-md border border-border bg-background-200 p-3 space-y-2"
 >
 <div className="flex items-center justify-between gap-2">
 <div className="text-[13px] text-foreground font-medium">{drill.title}</div>
 <Badge variant="secondary" size="sm" className="text-[10px]">
 {drill.severity}
 </Badge>
 </div>
 <div className="text-[11px] text-foreground-light">times: {drill.frequency}</div>
 <div className="text-[11px] text-foreground-light">
 Scenario: {drill.scenarios.map((scenario) => scenario.title).join(" / ")}
 </div>
 <div className="text-[11px] text-foreground-light">
 Owner: {drill.owners.join(" / ")}
 </div>
 <ul className="list-disc pl-4 text-[11px] text-foreground-light">
 {drill.objectives.slice(0, 2).map((objective) => (
 <li key={objective}>{objective}</li>
 ))}
 </ul>
 </div>
 ))}
 {(incidentPlans?.drills || []).length === 0 && (
 <div className="rounded-md border border-dashed border-border p-3 text-[11px] text-foreground-light">
 NoneDrillitem.
 </div>
 )}
 </div>
 {(incidentPlans?.notes || []).length > 0 && (
 <div className="rounded-md border border-border bg-background-200 p-3 text-[11px] text-foreground-light">
 {incidentPlans?.notes?.[0]}
 </div>
 )}
 </div>

 <div className="rounded-lg border border-border bg-surface-100 p-4 space-y-3">
 <div className="flex items-center gap-2 text-sm text-foreground">
 <Shield className="w-4 h-4 text-foreground-light" />
 {incidentOwners?.title || "shouldResponseandRollbackResponsibility"}
 </div>
 <p className="text-[12px] text-foreground-light">
 {incidentOwners?.summary || "NoneResponsibilitypersonConfig."}
 </p>
 <div className="space-y-3">
 {(incidentOwners?.roles || []).map((role) => (
 <div
 key={role.role}
 className="rounded-md border border-border bg-background-200 p-3 space-y-2"
 >
 <div className="text-[13px] text-foreground font-medium">{role.role}</div>
 <div className="text-[11px] text-foreground-light">
 mainOwner: {role.primary} · Backup: {role.backup}
 </div>
 <ul className="list-disc pl-4 text-[11px] text-foreground-light">
 {role.responsibilities.map((item) => (
 <li key={item}>{item}</li>
 ))}
 </ul>
 </div>
 ))}
 {(incidentOwners?.roles || []).length === 0 && (
 <div className="rounded-md border border-dashed border-border p-3 text-[11px] text-foreground-light">
 NoneRoleConfig.
 </div>
 )}
 </div>
 {(incidentOwners?.escalation || []).length > 0 && (
 <div className="rounded-md border border-border bg-background-200 p-3 space-y-1">
 <div className="text-[11px] text-foreground-light">UpgradePath</div>
 {(incidentOwners?.escalation || []).map((item) => (
 <div key={item.level} className="text-[11px] text-foreground">
 {item.level} · {item.condition} · {item.action}
 </div>
 ))}
 </div>
 )}
 </div>

 <div className="rounded-lg border border-border bg-surface-100 p-4 space-y-3">
 <div className="flex items-center gap-2 text-sm text-foreground">
 <MessageSquare className="w-4 h-4 text-foreground-light" />
 {postmortemTemplate?.title || "Template"}
 </div>
 <p className="text-[12px] text-foreground-light">
 {postmortemTemplate?.summary || "NoneTemplate."}
 </p>
 <div className="space-y-3">
 {(postmortemTemplate?.sections || []).map((section) => (
 <div
 key={section.key}
 className="rounded-md border border-border bg-background-200 p-3 space-y-2"
 >
 <div className="text-[13px] text-foreground font-medium">{section.title}</div>
 <ul className="list-disc pl-4 text-[11px] text-foreground-light">
 {section.questions.slice(0, 2).map((question) => (
 <li key={question}>{question}</li>
 ))}
 </ul>
 {section.questions.length > 2 && (
 <div className="text-[10px] text-foreground-light">
 stillhas {section.questions.length - 2} Issuenot yetShowcase
 </div>
 )}
 </div>
 ))}
 {(postmortemTemplate?.sections || []).length === 0 && (
 <div className="rounded-md border border-dashed border-border p-3 text-[11px] text-foreground-light">
 NoneTemplateitem.
 </div>
 )}
 </div>
 {(postmortemTemplate?.checklist || []).length > 0 && (
 <div className="rounded-md border border-border bg-background-200 p-3 space-y-2">
 <div className="text-[11px] text-foreground-light">Checklist</div>
 <ul className="list-disc pl-4 text-[11px] text-foreground-light">
 {postmortemTemplate?.checklist?.map((item) => (
 <li key={item}>{item}</li>
 ))}
 </ul>
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 </section>

 {/* MonitorMetricscharandTrackingPlan */}
 <section className="page-panel">
 <div className="page-panel-header flex items-center justify-between gap-3">
 <div>
 <p className="page-panel-title">MonitorMetricscharandTrackingPlan</p>
 <p className="page-panel-description">Prometheus MetricsandbeforeafterendpointTrackingEventDefinition</p>
 </div>
 <Badge variant="outline" size="sm" className="border-border text-foreground-light">
 Observability
 </Badge>
 </div>
 <div className="p-5 space-y-4">
 {observabilityLoading ? (
 <div className="rounded-lg border border-border bg-surface-100 px-4 py-3 text-xs text-foreground-light">
 LoadingMonitorMetricsandTrackingPlan...
 </div>
 ) : observabilityError ? (
 <div className="rounded-lg border border-destructive/50 bg-destructive-200/40 px-4 py-3 text-xs text-destructive">
 {observabilityError}
 </div>
 ) : (
 <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr_1fr] gap-4">
 <div className="rounded-lg border border-border bg-surface-100 p-4 space-y-3">
 <div className="flex items-center justify-between gap-2">
 <div className="flex items-center gap-2 text-sm text-foreground">
 <TrendingUp className="w-4 h-4 text-foreground-light" />
 {metricsDictionary?.title || "Metricschar"}
 </div>
 <Badge variant="outline" size="sm" className="border-border text-foreground-light">
 {metricsDictionary?.metrics?.length ?? 0} 
 </Badge>
 </div>
 <p className="text-[12px] text-foreground-light">
 {metricsDictionary?.summary || "NoneMetricscharDescription."}
 </p>
 <div className="rounded-md border border-border bg-background-200/40 max-h-[360px] overflow-y-auto divide-y divide-border">
 {(metricsDictionary?.metrics || []).map((metric) => (
 <div key={metric.name} className="px-3 py-2 space-y-1">
 <div className="flex items-center justify-between gap-2">
 <div className="text-[12px] font-mono text-foreground">{metric.name}</div>
 <Badge variant="outline" size="sm" className="text-[10px] border-border text-foreground-light">
 {metric.type}
 </Badge>
 </div>
 <div className="text-[11px] text-foreground-light">{metric.description}</div>
 <div className="text-[10px] text-foreground-light">
 Tags: {metric.labels?.length ? metric.labels.join(", ") : "-"}
 {metric.unit ? ` · ${metric.unit}` : ""}
 </div>
 {metric.buckets && metric.buckets.length > 0 && (
 <div className="text-[10px] text-foreground-light">
 Buckets: {metric.buckets.join(", ")}
 </div>
 )}
 </div>
 ))}
 {(metricsDictionary?.metrics || []).length === 0 && (
 <div className="px-3 py-3 text-[11px] text-foreground-light">
 NoneMetricsitem.
 </div>
 )}
 </div>
 {(metricsDictionary?.notes || []).length > 0 && (
 <div className="rounded-md border border-border bg-background-200 p-3 text-[11px] text-foreground-light">
 {metricsDictionary?.notes?.[0]}
 </div>
 )}
 </div>

 <div className="rounded-lg border border-border bg-surface-100 p-4 space-y-3">
 <div className="flex items-center justify-between gap-2">
 <div className="flex items-center gap-2 text-sm text-foreground">
 <Zap className="w-4 h-4 text-foreground-light" />
 {frontendTrackingPlan?.title || "beforeendpointTrackingEvent"}
 </div>
 <Badge variant="outline" size="sm" className="border-border text-foreground-light">
 {frontendTrackingPlan?.events?.length ?? 0} 
 </Badge>
 </div>
 <p className="text-[12px] text-foreground-light">
 {frontendTrackingPlan?.summary || "NonebeforeendpointTrackingDescription."}
 </p>
 <div className="rounded-md border border-border bg-background-200/40 max-h-[360px] overflow-y-auto divide-y divide-border">
 {(frontendTrackingPlan?.events || []).map((event) => (
 <div key={event.key} className="px-3 py-2 space-y-1">
 <div className="flex items-center justify-between gap-2">
 <div className="text-[12px] text-foreground font-medium">{event.event}</div>
 <Badge variant="secondary" size="sm" className="text-[10px]">
 {event.category}
 </Badge>
 </div>
 <div className="text-[11px] text-foreground-light">{event.description}</div>
 <div className="text-[10px] text-foreground-light">Trigger: {event.trigger}</div>
 <div className="text-[10px] text-foreground-light">
 : {event.properties.join(", ")}
 </div>
 </div>
 ))}
 {(frontendTrackingPlan?.events || []).length === 0 && (
 <div className="px-3 py-3 text-[11px] text-foreground-light">
 NonebeforeendpointTrackingEvent.
 </div>
 )}
 </div>
 {(frontendTrackingPlan?.notes || []).length > 0 && (
 <div className="rounded-md border border-border bg-background-200 p-3 text-[11px] text-foreground-light">
 {frontendTrackingPlan?.notes?.[0]}
 </div>
 )}
 </div>

 <div className="rounded-lg border border-border bg-surface-100 p-4 space-y-3">
 <div className="flex items-center justify-between gap-2">
 <div className="flex items-center gap-2 text-sm text-foreground">
 <Server className="w-4 h-4 text-foreground-light" />
 {backendTrackingPlan?.title || "afterendpointTrackingEvent"}
 </div>
 <Badge variant="outline" size="sm" className="border-border text-foreground-light">
 {backendTrackingPlan?.events?.length ?? 0} 
 </Badge>
 </div>
 <p className="text-[12px] text-foreground-light">
 {backendTrackingPlan?.summary || "NoneafterendpointTrackingDescription."}
 </p>
 <div className="rounded-md border border-border bg-background-200/40 max-h-[360px] overflow-y-auto divide-y divide-border">
 {(backendTrackingPlan?.events || []).map((event) => (
 <div key={event.key} className="px-3 py-2 space-y-1">
 <div className="flex items-center justify-between gap-2">
 <div className="text-[12px] text-foreground font-medium">{event.event}</div>
 <Badge variant="secondary" size="sm" className="text-[10px]">
 {event.category}
 </Badge>
 </div>
 <div className="text-[11px] text-foreground-light">{event.description}</div>
 <div className="text-[10px] text-foreground-light">Trigger: {event.trigger}</div>
 <div className="text-[10px] text-foreground-light">
 : {event.properties.join(", ")}
 </div>
 </div>
 ))}
 {(backendTrackingPlan?.events || []).length === 0 && (
 <div className="px-3 py-3 text-[11px] text-foreground-light">
 NoneafterendpointTrackingEvent.
 </div>
 )}
 </div>
 {(backendTrackingPlan?.notes || []).length > 0 && (
 <div className="rounded-md border border-border bg-background-200 p-3 text-[11px] text-foreground-light">
 {backendTrackingPlan?.notes?.[0]}
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 </section>

 {/* AvailableandErrorBudget(SRE) */}
 <section className="page-panel">
 <div className="page-panel-header flex items-center justify-between gap-3">
 <div>
 <p className="page-panel-title">AvailableandErrorBudget(SRE)</p>
 <p className="page-panel-description">ErrorBudget, ComposeMonitor, valueSLO andStable</p>
 </div>
 <Badge variant="outline" size="sm" className="border-border text-foreground-light">
 SRE
 </Badge>
 </div>
 <div className="p-5 space-y-4">
 {planLoading ? (
 <div className="rounded-lg border border-border bg-surface-100 px-4 py-3 text-xs text-foreground-light">
 Loading SRE PlanningData...
 </div>
 ) : planError ? (
 <div className="rounded-lg border border-destructive/50 bg-destructive-200/40 px-4 py-3 text-xs text-destructive">
 {planError}
 </div>
 ) : (
 <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
 <div className="rounded-lg border border-border bg-surface-100 p-4 space-y-3">
 <div className="flex items-center justify-between gap-2">
 <div className="flex items-center gap-2 text-sm text-foreground">
 <Gauge className="w-4 h-4 text-foreground-light" />
 {errorBudgetPolicy?.title || "Error Budget Rule"}
 </div>
 <Badge variant="outline" size="sm" className="border-border text-foreground-light">
 {errorBudgetPolicy?.rules?.length ?? 0} 
 </Badge>
 </div>
 <p className="text-[12px] text-foreground-light">
 {errorBudgetPolicy?.summary || "NoneErrorBudgetRule."}
 </p>
 <div className="space-y-2">
 {(errorBudgetPolicy?.rules || []).slice(0, 3).map((rule) => (
 <div
 key={rule.key}
 className="rounded-md border border-border bg-background-200 p-3 space-y-1"
 >
 <div className="flex items-center justify-between gap-2">
 <span className="text-[12px] text-foreground font-medium">{rule.title}</span>
 <Badge variant="secondary" size="sm" className="text-[10px]">
 {rule.slo}
 </Badge>
 </div>
 <div className="text-[11px] text-foreground-light">
 Budget {rule.budget} · Window {rule.window}
 </div>
 </div>
 ))}
 {(errorBudgetPolicy?.rules || []).length === 0 && (
 <div className="rounded-md border border-dashed border-border p-3 text-[11px] text-foreground-light">
 NoneRuleitem.
 </div>
 )}
 </div>
 </div>

 <div className="rounded-lg border border-border bg-surface-100 p-4 space-y-3">
 <div className="flex items-center justify-between gap-2">
 <div className="flex items-center gap-2 text-sm text-foreground">
 <Radar className="w-4 h-4 text-foreground-light" />
 {syntheticPlan?.title || "ComposeMonitorPlan"}
 </div>
 <Badge variant="outline" size="sm" className="border-border text-foreground-light">
 {syntheticPlan?.probes?.length ?? 0} 
 </Badge>
 </div>
 <p className="text-[12px] text-foreground-light">
 {syntheticPlan?.summary || "NoneComposeMonitorConfig."}
 </p>
 <div className="space-y-2">
 {(syntheticPlan?.probes || []).slice(0, 3).map((probe) => (
 <div
 key={probe.key}
 className="rounded-md border border-border bg-background-200 p-3 space-y-1"
 >
 <div className="text-[12px] text-foreground font-medium">{probe.name}</div>
 <div className="text-[11px] text-foreground-light">
 {probe.method} {probe.target}
 </div>
 <div className="text-[11px] text-foreground-light">
 times {probe.frequency} · Region {probe.locations.join(" / ")}
 </div>
 </div>
 ))}
 {(syntheticPlan?.probes || []).length === 0 && (
 <div className="rounded-md border border-dashed border-border p-3 text-[11px] text-foreground-light">
 Noneitem.
 </div>
 )}
 </div>
 </div>

 <div className="rounded-lg border border-border bg-surface-100 p-4 space-y-3">
 <div className="flex items-center gap-2 text-sm text-foreground">
 <PhoneCall className="w-4 h-4 text-foreground-light" />
 {oncallSLO?.title || "valueandResponse SLO"}
 </div>
 <p className="text-[12px] text-foreground-light">
 {oncallSLO?.summary || "Nonevalue SLO Config."}
 </p>
 <div className="space-y-2">
 {(oncallSLO?.targets || []).map((target) => (
 <div
 key={target.severity}
 className="rounded-md border border-border bg-background-200 p-3"
 >
 <div className="flex items-center justify-between gap-2">
 <span className="text-[12px] text-foreground font-medium">{target.severity}</span>
 <span className="text-[10px] text-foreground-light">{target.coverage}</span>
 </div>
 <div className="text-[11px] text-foreground-light mt-1">
 Confirm {target.ack_target} · {target.mitigate_target}
 </div>
 </div>
 ))}
 {(oncallSLO?.targets || []).length === 0 && (
 <div className="rounded-md border border-dashed border-border p-3 text-[11px] text-foreground-light">
 NoneResponseTarget.
 </div>
 )}
 </div>
 </div>

 <div className="rounded-lg border border-border bg-surface-100 p-4 space-y-3">
 <div className="flex items-center gap-2 text-sm text-foreground">
 <ShieldCheck className="w-4 h-4 text-foreground-light" />
 {stabilityPlan?.title || "Stable"}
 </div>
 <p className="text-[12px] text-foreground-light">
 {stabilityPlan?.summary || "NoneStablePlan."}
 </p>
 <div className="space-y-2">
 {(stabilityPlan?.tracks || []).slice(0, 3).map((track) => (
 <div
 key={track.key}
 className="rounded-md border border-border bg-background-200 p-3 space-y-1"
 >
 <div className="text-[12px] text-foreground font-medium">{track.title}</div>
 <div className="text-[11px] text-foreground-light">times: {track.cadence}</div>
 <div className="text-[11px] text-foreground-light">
 Owner: {track.owners.join(" / ")}
 </div>
 </div>
 ))}
 {(stabilityPlan?.tracks || []).length === 0 && (
 <div className="rounded-md border border-dashed border-border p-3 text-[11px] text-foreground-light">
 Noneitem.
 </div>
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 </section>

 {/* SubscriptionTip */}
 <section className="page-panel border border-brand-400/30 bg-brand-200/40">
 <div className="page-panel-header">
 <p className="page-panel-title">SubscriptionStatusUpdate</p>
 <p className="page-panel-description">
 ReceiveSystemStatusChangeandMaintainPlan'sReal-timeNotifications
 </p>
 </div>
 <div className="px-6 pb-6 flex flex-wrap items-center justify-between gap-4">
 <div className="text-[13px] text-foreground-light">
 SupportEmail, Webhook etcmultipletypeNotificationsChannel
 </div>
 <div className="flex items-center gap-2">
 <Button variant="outline" size="sm" className="border-border text-foreground-light hover:text-foreground">
 EmailSubscription
 </Button>
 <Button size="sm" className="bg-brand-500 hover:bg-brand-600 text-background">
 Webhook Subscription
 </Button>
 </div>
 </div>
 </section>
 </div>
 </PageContainer>
 );
}
