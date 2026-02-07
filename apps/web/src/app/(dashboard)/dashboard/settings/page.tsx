"use client";

/**
 * PreferencesPage - Supabase Style(Support/Theme)
 */

import React, { useState, useEffect, useCallback } from "react";
import { 
 Moon, 
 Sun, 
 CheckCircle2, 
 AlertCircle, 
 Monitor,
 BarChart3,
 Link2,
 Download,
 Trash2,
 AlertTriangle,
 Github,
 Slack,
 Mail,
 Database,
 Key,
 RefreshCw,
 X,
 Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import { useTheme } from "next-themes";
import { userApi } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import type { UserPreferences } from "@/types/auth";
import { cn } from "@/lib/utils";

// Toggle Row Component - Supabase Style
function ToggleRow({
 label,
 description,
 checked,
 onCheckedChange,
}: {
 label: string;
 description: string;
 checked: boolean;
 onCheckedChange: (checked: boolean) => void;
}) {
 return (
 <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
 <div>
 <div className="text-sm font-medium text-foreground">{label}</div>
 <div className="text-[13px] text-foreground-light mt-0.5">{description}</div>
 </div>
 <Switch checked={checked} onCheckedChange={onCheckedChange} />
 </div>
 );
}

// SettingsCardComponent - Supabase Style
function SettingsSection({
 title,
 description,
 children,
 footer,
}: {
 title: string;
 description?: string;
 children: React.ReactNode;
 footer?: React.ReactNode;
}) {
 return (
 <div className="page-panel overflow-hidden mb-6">
 {/* Header */}
 <div className="page-panel-header">
 <h2 className="page-panel-title">{title}</h2>
 {description && <p className="page-panel-description mt-1">{description}</p>}
 </div>
 {/* Content */}
 <div className="p-6">{children}</div>
 {/* FooterAction */}
 {footer && (
 <div className="px-6 py-4 border-t border-border bg-surface-200/60 flex justify-end">
 {footer}
 </div>
 )}
 </div>
 );
}

// UsageStatisticsData
const usageStats = [
 { label: "API Call", value: "12,580", limit: "100,000", percentage: 12.5 },
 { label: "StorageEmptybetween", value: "256 MB", limit: "1 GB", percentage: 25 },
 { label: "WorkflowExecute", value: "3,847", limit: "50,000", percentage: 7.7 },
 { label: "TeamMember", value: "3", limit: "5", percentage: 60 },
];

// Connect'sService
const connectedServices = [
 { id: "github", name: "GitHub", icon: Github, connected: true, lastSync: "2 hbefore" },
 { id: "slack", name: "Slack", icon: Slack, connected: true, lastSync: "Just now" },
 { id: "email", name: "Email (SMTP)", icon: Mail, connected: false, lastSync: null },
 { id: "database", name: "PostgreSQL", icon: Database, connected: true, lastSync: "5 minbefore" },
];

export default function PreferencesPage() {
 const { theme, setTheme } = useTheme();
 const { user, setUser } = useAuthStore();
 
 // PreferencesStatus
 const [language, setLanguage] = useState("zh-CN");
 const [notifications, setNotifications] = useState({
 workflowComplete: true,
 workflowError: true,
 systemUpdates: false,
 weeklyDigest: false,
 });
 const [performance, setPerformance] = useState({
 autoSave: true,
 animations: true,
 compactMode: false,
 });

 const [isLoading, setIsLoading] = useState(false);
 const [isLoadingData, setIsLoadingData] = useState(true);
 const [success, setSuccess] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
 const [hasChanges, setHasChanges] = useState(false);

 // LoadUserPreferences
 const loadPreferences = useCallback(async () => {
 setIsLoadingData(true);
 try {
 const userData = await userApi.getCurrentUser();
 
 // UpdateLocalStatus
 if (userData.preferences) {
 const prefs = userData.preferences;
 
 if (prefs.theme) {
 setTheme(prefs.theme);
 }
 if (prefs.language) {
 setLanguage(prefs.language);
 }
 if (prefs.notifications) {
 setNotifications(prev => ({ ...prev, ...prefs.notifications }));
 }
 if (prefs.performance) {
 setPerformance(prev => ({ ...prev, ...prefs.performance }));
 }
 }
 
 // Update store 'sUserData
 setUser(userData);
 } catch (err) {
 console.error("LoadPreferencesFailed:", err);
 } finally {
 setIsLoadingData(false);
 }
 }, [setTheme, setUser]);

 // InitialLoad
 useEffect(() => {
 loadPreferences();
 }, [loadPreferences]);

 // TrackChange
 useEffect(() => {
 setHasChanges(true);
 }, [language, notifications, performance]);

 const handleSave = async () => {
 setIsLoading(true);
 setError(null);
 setSuccess(false);

 try {
 const preferences: UserPreferences = {
 theme: theme as "light" | "dark" | "system",
 language,
 notifications,
 performance,
 };
 
 // SavetoService
 const updatedUser = await userApi.updateProfile({ preferences });
 
 // Update store
 setUser(updatedUser);
 
 setSuccess(true);
 setHasChanges(false);
 setTimeout(() => setSuccess(false), 3000);
 } catch (err) {
 setError(err instanceof Error ? err.message: "SaveFailed");
 } finally {
 setIsLoading(false);
 }
 };
 
 const handleCancel = () => {
 // re-newLoadUserPreference
 loadPreferences();
 setHasChanges(false);
 };

 // InitialLoadStatus
 if (isLoadingData) {
 return (
 <PageContainer>
 <div className="space-y-6">
 <div className="mb-6 space-y-2">
 <div className="h-4 w-24 bg-surface-200 rounded animate-pulse" />
 <div className="h-7 w-32 bg-surface-200 rounded animate-pulse" />
 <div className="h-4 w-64 bg-surface-200 rounded animate-pulse" />
 </div>
 {Array.from({ length: 3 }).map((_, i) => (
 <div key={i} className="page-panel overflow-hidden">
 <div className="page-panel-header">
 <div className="h-4 w-24 bg-surface-200 rounded animate-pulse" />
 </div>
 <div className="p-6 space-y-4">
 {Array.from({ length: 3 }).map((_, j) => (
 <div key={j} className="h-12 bg-surface-200 rounded animate-pulse" />
 ))}
 </div>
 </div>
 ))}
 </div>
 </PageContainer>
 );
 }

 return (
 <PageContainer>
 <div className="space-y-6">
 <PageHeader
 eyebrow="Settings"
 title="useSettings"
 description="Configoutside, NotificationsandcanOption"
 actions={(
 <div className="flex items-center gap-3">
 <Button
 variant="ghost"
 className="text-foreground-light hover:text-foreground"
 onClick={handleCancel}
 disabled={isLoading || !hasChanges}
 >
 Cancel
 </Button>
 <Button
 onClick={handleSave}
 disabled={isLoading || !hasChanges}
 className="bg-brand-500 hover:bg-brand-500/90 text-background font-medium transition-all duration-200"
 >
 {isLoading ? (
 <>
 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
 Saving...
 </>
 ) : (
 "SaveChange"
 )}
 </Button>
 </div>
 )}
 />

 <div className="page-divider" />

 {/* outsideSettings */}
 <SettingsSection title="outside" description="CustomApp'svisualEffect">
 <div className="space-y-5">
 {/* ThemeSelect */}
 <div>
 <label className="text-sm font-medium text-foreground mb-3 block">
 Theme
 </label>
 <div className="page-grid grid-cols-3 gap-3 max-w-md">
 {[
 { value: "light", label: "Light", icon: Sun },
 { value: "dark", label: "Dark", icon: Moon },
 { value: "system", label: "System", icon: Monitor },
 ].map((option) => (
 <button
 key={option.value}
 onClick={() => setTheme(option.value)}
 className={cn(
 "flex flex-col items-center gap-2 p-4 rounded-md border transition-all",
 theme === option.value
 ? "border-brand-500 bg-brand-200"
 : "border-border hover:border-border-strong hover:bg-surface-200"
 )}
 >
 <option.icon className={cn(
 "w-4 h-4",
 theme === option.value ? "text-brand-500" : "text-foreground-muted"
 )} />
 <span className={cn(
 "text-sm font-medium",
 theme === option.value ? "text-brand-500" : "text-foreground-light"
 )}>
 {option.label}
 </span>
 </button>
 ))}
 </div>
 </div>

 {/* LanguageSelect */}
 <div>
 <label className="text-sm font-medium text-foreground mb-2 block">
 Language
 </label>
 <Select value={language} onValueChange={setLanguage}>
 <SelectTrigger className="w-full max-w-[240px]">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="zh-CN"></SelectItem>
 <SelectItem value="zh-TW"></SelectItem>
 <SelectItem value="en">English</SelectItem>
 <SelectItem value="ja">daycurrent</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>
 </SettingsSection>

 {/* Notification Settings */}
 <SettingsSection title="Notifications" description="ManageyouHopeto'sNotificationsType">
 <ToggleRow
 label="WorkflowDone"
 description="WorkflowRunDonetimeSendNotifications"
 checked={notifications.workflowComplete}
 onCheckedChange={(checked) =>
 setNotifications((prev) => ({ ...prev, workflowComplete: checked }))
 }
 />
 <ToggleRow
 label="WorkflowError"
 description="WorkflowRuntimeSendNotifications"
 checked={notifications.workflowError}
 onCheckedChange={(checked) =>
 setNotifications((prev) => ({ ...prev, workflowError: checked }))
 }
 />
 <ToggleRow
 label="SystemUpdate"
 description="ReceiveSystemUpdateandnewFeaturesNotifications"
 checked={notifications.systemUpdates}
 onCheckedChange={(checked) =>
 setNotifications((prev) => ({ ...prev, systemUpdates: checked }))
 }
 />
 <ToggleRow
 label="eachweeksReport"
 description="eachweeksSendUsageSituationSummary"
 checked={notifications.weeklyDigest}
 onCheckedChange={(checked) =>
 setNotifications((prev) => ({ ...prev, weeklyDigest: checked }))
 }
 />
 </SettingsSection>

 {/* canSettings */}
 <SettingsSection title="can" description="optimalAppcanandExperience">
 <ToggleRow
 label="AutoSave"
 description="AutoSaveyou'sWorkflowChange"
 checked={performance.autoSave}
 onCheckedChange={(checked) =>
 setPerformance((prev) => ({ ...prev, autoSave: checked }))
 }
 />
 <ToggleRow
 label="faceAnimation"
 description="EnablefacepastAnimationEffect"
 checked={performance.animations}
 onCheckedChange={(checked) =>
 setPerformance((prev) => ({ ...prev, animations: checked }))
 }
 />
 <ToggleRow
 label="Compact"
 description="UsagemoreCompact'sfaceLayout"
 checked={performance.compactMode}
 onCheckedChange={(checked) =>
 setPerformance((prev) => ({ ...prev, compactMode: checked }))
 }
 />
 </SettingsSection>

 {/* UsageStatistics */}
 <SettingsSection title="UsageStatistics" description="Viewyou'sAccountUsageSituation">
 <div className="page-grid grid-cols-1 sm:grid-cols-2 gap-4">
 {usageStats.map((stat) => (
 <div key={stat.label} className="p-4 rounded-md bg-surface-100/60 border border-border">
 <div className="flex items-center justify-between mb-2">
 <span className="text-[13px] text-foreground-light">{stat.label}</span>
 <span className="text-sm font-medium text-foreground">
 {stat.value} / {stat.limit}
 </span>
 </div>
 <div className="h-1.5 bg-surface-300 rounded-full overflow-hidden">
 <div 
 className={cn(
 "h-full rounded-full transition-all",
 stat.percentage > 80 ? "bg-warning-200" : "bg-brand-500"
 )}
 style={{ width: `${stat.percentage}%` }}
 />
 </div>
 <p className="text-xs text-foreground-muted mt-2">
 alreadyUsage {stat.percentage.toFixed(1)}%
 </p>
 </div>
 ))}
 </div>
 <div className="mt-4 flex items-center gap-2">
 <BarChart3 className="w-4 h-4 text-foreground-muted" />
 <span className="text-[13px] text-foreground-light">
 DataUpdateat {new Date().toLocaleString()}
 </span>
 </div>
 </SettingsSection>

 {/* Connect'sService */}
 <SettingsSection title="Connect'sService" description="Manageyou'sThird-partyServiceIntegration">
 <div className="space-y-3">
 {connectedServices.map((service) => (
 <div 
 key={service.id}
 className="flex items-center justify-between p-4 rounded-md bg-surface-100/60 border border-border"
 >
 <div className="flex items-center gap-3">
 <div className={cn(
 "w-9 h-9 rounded-md flex items-center justify-center",
 service.connected ? "bg-brand-200" : "bg-surface-200"
 )}>
 <service.icon className={cn(
 "w-4 h-4",
 service.connected ? "text-brand-500" : "text-foreground-muted"
 )} />
 </div>
 <div>
 <p className="text-sm font-medium text-foreground">{service.name}</p>
 <p className="text-xs text-foreground-muted">
 {service.connected 
 ? `mostafterSync: ${service.lastSync}` 
: "Disconnected"}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {service.connected ? (
 <>
 <Button variant="ghost" size="sm" className="h-8 text-foreground-light hover:text-foreground">
 <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
 Sync
 </Button>
 <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive">
 <X className="w-3.5 h-3.5 mr-1.5" />
 
 </Button>
 </>
 ) : (
 <Button variant="outline" size="sm" className="h-8 border-border text-foreground-light hover:text-foreground">
 <Link2 className="w-3.5 h-3.5 mr-1.5" />
 Connect
 </Button>
 )}
 </div>
 </div>
 ))}
 </div>
 <Button variant="outline" className="mt-4 border-border text-foreground-light hover:text-foreground">
 <Link2 className="w-4 h-4 mr-2" />
 Addnew'sIntegration
 </Button>
 </SettingsSection>

 {/* DataExport */}
 <SettingsSection title="DataExport" description="Exportyou'sDataandConfig">
 <div className="page-grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="p-4 rounded-md border border-border bg-surface-100/60 hover:border-brand-400 transition-colors cursor-pointer">
 <div className="flex items-center gap-3 mb-2">
 <div className="w-10 h-10 rounded-md bg-brand-200 flex items-center justify-center">
 <Download className="w-5 h-5 text-brand-500" />
 </div>
 <div>
 <p className="text-sm font-medium text-foreground">ExportWorkflow</p>
 <p className="text-xs text-foreground-muted">JSON Format</p>
 </div>
 </div>
 <Button variant="outline" size="sm" className="w-full mt-2 border-border text-foreground-light hover:bg-surface-200 hover:text-foreground">
 Download
 </Button>
 </div>
 <div className="p-4 rounded-md border border-border bg-surface-100/60 hover:border-brand-400 transition-colors cursor-pointer">
 <div className="flex items-center gap-3 mb-2">
 <div className="w-10 h-10 rounded-md bg-surface-200 flex items-center justify-center">
 <Database className="w-5 h-5 text-foreground-light" />
 </div>
 <div>
 <p className="text-sm font-medium text-foreground">ExportExecuteLogs</p>
 <p className="text-xs text-foreground-muted">CSV Format</p>
 </div>
 </div>
 <Button variant="outline" size="sm" className="w-full mt-2 border-border text-foreground-light hover:bg-surface-200 hover:text-foreground">
 Download
 </Button>
 </div>
 <div className="p-4 rounded-md border border-border bg-surface-100/60 hover:border-brand-400 transition-colors cursor-pointer">
 <div className="flex items-center gap-3 mb-2">
 <div className="w-10 h-10 rounded-md bg-surface-200 flex items-center justify-center">
 <Key className="w-5 h-5 text-foreground-light" />
 </div>
 <div>
 <p className="text-sm font-medium text-foreground">Export API Key</p>
 <p className="text-xs text-foreground-muted">EncryptBackup</p>
 </div>
 </div>
 <Button variant="outline" size="sm" className="w-full mt-2 border-border text-foreground-light hover:bg-surface-200 hover:text-foreground">
 Download
 </Button>
 </div>
 <div className="p-4 rounded-md border border-border bg-surface-100/60 hover:border-brand-400 transition-colors cursor-pointer">
 <div className="flex items-center gap-3 mb-2">
 <div className="w-10 h-10 rounded-md bg-warning-200 flex items-center justify-center">
 <BarChart3 className="w-5 h-5 text-warning" />
 </div>
 <div>
 <p className="text-sm font-medium text-foreground">ExportUsageReport</p>
 <p className="text-xs text-foreground-muted">PDF Format</p>
 </div>
 </div>
 <Button variant="outline" size="sm" className="w-full mt-2 border-border text-foreground-light hover:bg-surface-200 hover:text-foreground">
 Download
 </Button>
 </div>
 </div>
 </SettingsSection>

 {/* DangerActionRegion */}
 <SettingsSection title="DangerAction" description="withdownActionnotcan, PleaseCautionAction">
 <div className="space-y-4">
 <div className="p-4 rounded-md border border-warning/30 bg-warning-200">
 <div className="flex items-start justify-between">
 <div className="flex items-start gap-3">
 <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
 <div>
 <p className="text-sm font-medium text-foreground">ClearAllWorkflow</p>
 <p className="text-xs text-foreground-light mt-1">
 DeleteAllWorkflowandotherExecuteHistory, thisActionNoneUndo
 </p>
 </div>
 </div>
 <Button variant="outline" size="sm" className="text-warning border-warning/30 hover:bg-warning-200/20">
 Clear
 </Button>
 </div>
 </div>
 
 <div className="p-4 rounded-md border border-destructive/30 bg-destructive-200">
 <div className="flex items-start justify-between">
 <div className="flex items-start gap-3">
 <Trash2 className="w-5 h-5 text-destructive mt-0.5" />
 <div>
 <p className="text-sm font-medium text-foreground">DeleteAccount</p>
 <p className="text-xs text-foreground-light mt-1">
 PermanentDeleteyou'sAccountandAllData, thisActionNoneUndo
 </p>
 </div>
 </div>
 <Button 
 variant="outline" 
 size="sm" 
 className="text-destructive border-destructive/30 hover:bg-destructive-200/20"
 onClick={() => setShowDeleteConfirm(true)}
 >
 DeleteAccount
 </Button>
 </div>
 </div>
 </div>
 </SettingsSection>

 {/* DeleteConfirmModal */}
 {showDeleteConfirm && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
 <div className="w-full max-w-md bg-surface-100 border border-border rounded-md p-6">
 <div className="flex items-center gap-3 mb-4">
 <div className="w-12 h-12 rounded-md bg-destructive-200 flex items-center justify-center">
 <AlertTriangle className="w-6 h-6 text-destructive" />
 </div>
 <div>
 <h3 className="font-semibold text-foreground">ConfirmDeleteAccount</h3>
 <p className="text-sm text-foreground-light">thisActionNoneUndo</p>
 </div>
 </div>
 <p className="text-sm text-foreground-light mb-6">
 DeleteAccountafter, you'sAllWorkflow, ExecuteHistory, API KeyandotherheDatawillbyPermanentDelete, NoneRestore.
 </p>
 <div className="flex justify-end gap-3">
 <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="border-border text-foreground-light hover:bg-surface-200 hover:text-foreground">
 Cancel
 </Button>
 <Button className="bg-destructive hover:bg-destructive/90 text-background">
 ConfirmDelete
 </Button>
 </div>
 </div>
 </div>
 )}

 {/* TipInfo */}
 {error && (
 <div className="flex items-center gap-2 p-4 rounded-md bg-destructive-200 border border-destructive/30 text-destructive text-sm">
 <AlertCircle className="h-4 w-4 shrink-0" />
 {error}
 </div>
 )}
 {success && (
 <div className="flex items-center gap-2 p-4 rounded-md bg-brand-200 border border-brand-400 text-brand-500 text-sm">
 <CheckCircle2 className="h-4 w-4 shrink-0" />
 SettingsSaved
 </div>
 )}

 </div>
 </PageContainer>
 );
}
