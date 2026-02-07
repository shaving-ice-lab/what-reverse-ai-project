"use client";

/**
 * Notification SettingsPage
 * Supabase Style: Minimal, Professional
 */

import { useState } from "react";
import {
 Bell,
 Mail,
 MessageSquare,
 Smartphone,
 Zap,
 AlertTriangle,
 CheckCircle,
 Clock,
 Users,
 CreditCard,
 Shield,
 Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";

// NotificationsType
interface NotificationSetting {
 id: string;
 title: string;
 description: string;
 email: boolean;
 push: boolean;
 inApp: boolean;
}

// NotificationsCategory
const notificationCategories = [
 {
 id: "workflow",
 title: "WorkflowNotifications",
 icon: Zap,
 description: "andWorkflowExecuteRelated'sNotifications",
 settings: [
 {
 id: "workflow_complete",
 title: "WorkflowDone",
 description: "WorkflowExecuteDonetimeNotifications",
 email: true,
 push: true,
 inApp: true,
 },
 {
 id: "workflow_failed",
 title: "WorkflowFailed",
 description: "WorkflowExecuteFailedtimeNotifications",
 email: true,
 push: true,
 inApp: true,
 },
 {
 id: "workflow_scheduled",
 title: "ScheduledTaskReminder",
 description: "ScheduledWorkflowExecutebeforeReminder",
 email: false,
 push: true,
 inApp: true,
 },
 ],
 },
 {
 id: "team",
 title: "TeamCollaboration",
 icon: Users,
 description: "TeamMemberandCollaborationRelatedNotifications",
 settings: [
 {
 id: "team_invite",
 title: "TeamInvite",
 description: "toTeamInvitetimeNotifications",
 email: true,
 push: true,
 inApp: true,
 },
 {
 id: "team_mention",
 title: "@and",
 description: "atCommentorDiscussionbyandtimeNotifications",
 email: true,
 push: true,
 inApp: true,
 },
 {
 id: "workflow_shared",
 title: "WorkflowShare",
 description: "haspersonandyouShareWorkflowtimeNotifications",
 email: false,
 push: true,
 inApp: true,
 },
 ],
 },
 {
 id: "system",
 title: "SystemNotifications",
 icon: Bell,
 description: "SystemStatusandMaintainRelatedNotifications",
 settings: [
 {
 id: "system_maintenance",
 title: "PlanMaintain",
 description: "SystemPlanMaintainbeforeNotifications",
 email: true,
 push: false,
 inApp: true,
 },
 {
 id: "system_incident",
 title: "SystemFault",
 description: "OccurSystemFaulttimeNotifications",
 email: true,
 push: true,
 inApp: true,
 },
 {
 id: "feature_update",
 title: "FeaturesUpdate",
 description: "newFeaturesPublishtimeNotifications",
 email: true,
 push: false,
 inApp: true,
 },
 ],
 },
 {
 id: "billing",
 title: "BillingNotifications",
 icon: CreditCard,
 description: "SubscriptionandBillingRelatedNotifications",
 settings: [
 {
 id: "billing_invoice",
 title: "BillingGenerate",
 description: "newBillingGeneratetimeNotifications",
 email: true,
 push: false,
 inApp: true,
 },
 {
 id: "billing_payment",
 title: "PaymentConfirm",
 description: "PaymentSuccesstimeNotifications",
 email: true,
 push: false,
 inApp: true,
 },
 {
 id: "billing_quota",
 title: "QuotaWarning",
 description: "UsageQuotaonlimittimeNotifications",
 email: true,
 push: true,
 inApp: true,
 },
 ],
 },
 {
 id: "security",
 title: "SecurityNotifications",
 icon: Shield,
 description: "AccountSecurityRelatedNotifications",
 settings: [
 {
 id: "security_login",
 title: "newDeviceSign In",
 description: "fromnewDeviceSign IntimeNotifications",
 email: true,
 push: true,
 inApp: true,
 },
 {
 id: "security_password",
 title: "PasswordChange",
 description: "PasswordChangetimeNotifications",
 email: true,
 push: false,
 inApp: true,
 },
 {
 id: "security_api_key",
 title: "API Key Activity",
 description: "API Key CreateorUsagetimeNotifications",
 email: false,
 push: false,
 inApp: true,
 },
 ],
 },
];

// ToggleComponent
function Toggle({
 checked,
 onChange,
 disabled,
}: {
 checked: boolean;
 onChange: (checked: boolean) => void;
 disabled?: boolean;
}) {
 return (
 <button
 type="button"
 onClick={() => !disabled && onChange(!checked)}
 className={cn(
 "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
 checked ? "bg-brand-500" : "bg-surface-200",
 disabled && "opacity-50 cursor-not-allowed"
 )}
 disabled={disabled}
 >
 <span
 className={cn(
 "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-sm transition-transform",
 checked ? "translate-x-[18px]" : "translate-x-[2px]"
 )}
 />
 </button>
 );
}

export default function NotificationsSettingsPage() {
 const [settings, setSettings] = useState(notificationCategories);
 const [isSaving, setIsSaving] = useState(false);
 const [saved, setSaved] = useState(false);

 // UpdateSettings
 const updateSetting = (
 categoryId: string,
 settingId: string,
 field: "email" | "push" | "inApp",
 value: boolean
 ) => {
 setSettings((prev) =>
 prev.map((category) => {
 if (category.id !== categoryId) return category;
 return {
 ...category,
 settings: category.settings.map((setting) => {
 if (setting.id !== settingId) return setting;
 return { ...setting, [field]: value };
 }),
 };
 })
 );
 setSaved(false);
 };

 // SwitchCategory
 const toggleCategory = (
 categoryId: string,
 field: "email" | "push" | "inApp",
 value: boolean
 ) => {
 setSettings((prev) =>
 prev.map((category) => {
 if (category.id !== categoryId) return category;
 return {
 ...category,
 settings: category.settings.map((setting) => ({
 ...setting,
 [field]: value,
 })),
 };
 })
 );
 setSaved(false);
 };

 // SaveSettings
 const handleSave = async () => {
 setIsSaving(true);
 await new Promise((resolve) => setTimeout(resolve, 1000));
 setIsSaving(false);
 setSaved(true);
 setTimeout(() => setSaved(false), 3000);
 };

 return (
 <PageContainer>
 <div className="space-y-6">
 <PageHeader
 eyebrow="Settings"
 title="Notification Settings"
 description="ManageyouReceiveNotifications'smethodandrate"
 actions={(
 <Button
 onClick={handleSave}
 size="sm"
 className="bg-brand-500 hover:bg-brand-600 text-background"
 disabled={isSaving}
 >
 {isSaving ? (
 <>
 <Clock className="mr-2 w-4 h-4 animate-spin" />
 Saving...
 </>
 ) : saved ? (
 <>
 <CheckCircle className="mr-2 w-4 h-4" />
 Saved
 </>
 ) : (
 <>
 <Save className="mr-2 w-4 h-4" />
 SaveChange
 </>
 )}
 </Button>
 )}
 />

 {/* NotificationsChannelDescription */}
 <div className="page-section">
 <div className="page-grid sm:grid-cols-2 lg:grid-cols-3">
 <div className="page-panel p-4">
 <div className="flex items-center gap-3 mb-2">
 <div className="w-8 h-8 rounded-md bg-brand-200 flex items-center justify-center">
 <Mail className="w-4 h-4 text-brand-500" />
 </div>
 <span className="text-[13px] font-medium text-foreground">Email</span>
 </div>
 <p className="text-xs text-foreground-muted">
 ViaEmailReceivere-needNotifications
 </p>
 </div>
 <div className="page-panel p-4">
 <div className="flex items-center gap-3 mb-2">
 <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center">
 <Smartphone className="w-4 h-4 text-foreground-light" />
 </div>
 <span className="text-[13px] font-medium text-foreground">Push</span>
 </div>
 <p className="text-xs text-foreground-muted">
 BrowseorMoveendpointPush Notifications
 </p>
 </div>
 <div className="page-panel p-4">
 <div className="flex items-center gap-3 mb-2">
 <div className="w-8 h-8 rounded-md bg-brand-200 flex items-center justify-center">
 <Bell className="w-4 h-4 text-brand-500" />
 </div>
 <span className="text-[13px] font-medium text-foreground">Appin</span>
 </div>
 <p className="text-xs text-foreground-muted">
 atAgentFlow AppinDisplayNotifications
 </p>
 </div>
 </div>
 </div>

 {/* Notification SettingsList */}
 <div className="page-section">
 <div className="space-y-5">
 {settings.map((category) => {
 // CheckisnoAllSettingsallalreadyEnable
 const allEmailEnabled = category.settings.every((s) => s.email);
 const allPushEnabled = category.settings.every((s) => s.push);
 const allInAppEnabled = category.settings.every((s) => s.inApp);

 return (
 <div key={category.id} className="page-panel overflow-hidden">
 {/* CategoryHeader */}
 <div className="page-panel-header">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center">
 <category.icon className="w-4 h-4 text-foreground-muted" />
 </div>
 <div>
 <h3 className="page-panel-title">{category.title}</h3>
 <p className="page-panel-description mt-1">
 {category.description}
 </p>
 </div>
 </div>
 <div className="flex flex-wrap items-center gap-4">
 <div className="flex items-center gap-2">
 <span className="text-[11px] text-foreground-muted w-8 text-center">
 Email
 </span>
 <Toggle
 checked={allEmailEnabled}
 onChange={(v) =>
 toggleCategory(category.id, "email", v)
 }
 />
 </div>
 <div className="flex items-center gap-2">
 <span className="text-[11px] text-foreground-muted w-8 text-center">
 Push
 </span>
 <Toggle
 checked={allPushEnabled}
 onChange={(v) =>
 toggleCategory(category.id, "push", v)
 }
 />
 </div>
 <div className="flex items-center gap-2">
 <span className="text-[11px] text-foreground-muted w-8 text-center">
 Appin
 </span>
 <Toggle
 checked={allInAppEnabled}
 onChange={(v) =>
 toggleCategory(category.id, "inApp", v)
 }
 />
 </div>
 </div>
 </div>
 </div>

 {/* SettingsList */}
 <div className="divide-y divide-border">
 {category.settings.map((setting) => (
 <div
 key={setting.id}
 className="px-6 py-4 flex items-center justify-between hover:bg-surface-200/60 transition-colors"
 >
 <div className="flex-1 pr-8">
 <h4 className="text-[13px] font-medium text-foreground">
 {setting.title}
 </h4>
 <p className="text-xs text-foreground-muted mt-0.5">
 {setting.description}
 </p>
 </div>
 <div className="flex items-center gap-6">
 <div className="w-16 flex justify-center">
 <Toggle
 checked={setting.email}
 onChange={(v) =>
 updateSetting(category.id, setting.id, "email", v)
 }
 />
 </div>
 <div className="w-16 flex justify-center">
 <Toggle
 checked={setting.push}
 onChange={(v) =>
 updateSetting(category.id, setting.id, "push", v)
 }
 />
 </div>
 <div className="w-16 flex justify-center">
 <Toggle
 checked={setting.inApp}
 onChange={(v) =>
 updateSetting(category.id, setting.id, "inApp", v)
 }
 />
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* allSettings */}
 <div className="page-section">
 <div className="page-panel">
 <div className="page-panel-header">
 <h3 className="page-panel-title">allSettings</h3>
 <p className="page-panel-description mt-1">1ControlNotificationsRhythm</p>
 </div>
 <div className="p-6 space-y-4">
 <div className="flex items-center justify-between">
 <div>
 <h4 className="text-[13px] font-medium text-foreground">
 
 </h4>
 <p className="text-xs text-foreground-muted">
 atSpecifyTimeinPauseAllPush Notifications
 </p>
 </div>
 <Toggle checked={false} onChange={() => {}} />
 </div>
 <div className="flex items-center justify-between">
 <div>
 <h4 className="text-[13px] font-medium text-foreground">
 eachdaySummary
 </h4>
 <p className="text-xs text-foreground-muted">
 willUrgentNotificationstotalaseachdayEmailSummary
 </p>
 </div>
 <Toggle checked={true} onChange={() => {}} />
 </div>
 </div>
 </div>
 </div>
 </div>
 </PageContainer>
 );
}
