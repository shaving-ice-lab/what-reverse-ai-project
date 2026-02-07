"use client";

/**
 * Security SettingsPage - Supabase Style
 * Password, Two-stepVerify, Sign InHistoryetc
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import {
 Shield,
 Key,
 Smartphone,
 Monitor,
 Lock,
 Eye,
 EyeOff,
 CheckCircle2,
 AlertTriangle,
 Clock,
 MapPin,
 Globe,
 Trash2,
 ChevronRight,
 RefreshCw,
 Download,
 X,
 QrCode,
 Copy,
 Info,
} from "lucide-react";

// Sign InDevice
const loginDevices = [
 {
 id: "1",
 device: "MacBook Pro",
 browser: "Chrome 120",
 location: "Beijing, ",
 ip: "123.45.67.***",
 lastActive: "Just now",
 isCurrent: true,
 },
 {
 id: "2",
 device: "iPhone 15 Pro",
 browser: "Safari",
 location: "Beijing, ",
 ip: "123.45.67.***",
 lastActive: "1 hbefore",
 isCurrent: false,
 },
 {
 id: "3",
 device: "Windows PC",
 browser: "Firefox 121",
 location: "on, ",
 ip: "98.76.54.***",
 lastActive: "3 daysbefore",
 isCurrent: false,
 },
];

// Sign InHistory
const loginHistory = [
 {
 id: "1",
 time: "2026-01-31 10:30",
 device: "MacBook Pro - Chrome",
 location: "Beijing, ",
 ip: "123.45.67.89",
 status: "success",
 },
 {
 id: "2",
 time: "2026-01-30 15:20",
 device: "iPhone 15 Pro - Safari",
 location: "Beijing, ",
 ip: "123.45.67.90",
 status: "success",
 },
 {
 id: "3",
 time: "2026-01-28 09:15",
 device: "Unknown Device - Chrome",
 location: "Shenzhen, ",
 ip: "111.22.33.44",
 status: "blocked",
 },
 {
 id: "4",
 time: "2026-01-25 14:00",
 device: "Windows PC - Firefox",
 location: "on, ",
 ip: "98.76.54.32",
 status: "success",
 },
];

export default function SecuritySettingsPage() {
 const [showCurrentPassword, setShowCurrentPassword] = useState(false);
 const [showNewPassword, setShowNewPassword] = useState(false);
 const [currentPassword, setCurrentPassword] = useState("");
 const [newPassword, setNewPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [is2FAEnabled, setIs2FAEnabled] = useState(false);
 const [showSetup2FA, setShowSetup2FA] = useState(false);
 const [verificationCode, setVerificationCode] = useState("");

 // PasswordIntensityDetect
 const getPasswordStrength = (password: string) => {
 if (password.length === 0) return { level: 0, label: "", color: "" };
 if (password.length < 6) return { level: 1, label: "", color: "bg-destructive" };
 if (password.length < 10) return { level: 2, label: "", color: "bg-warning" };
 if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
 return { level: 3, label: "", color: "bg-brand-500" };
 }
 return { level: 2, label: "", color: "bg-warning" };
 };

 const passwordStrength = getPasswordStrength(newPassword);

 return (
 <PageContainer>
 <div className="space-y-6">
 <PageHeader
 eyebrow="Settings"
 title="Security Settings"
 description="ManagePassword, Two-stepVerifyandSign InDevice"
 />

 <div className="page-section">
 {/* SecurityStatusOverview */}
 <div className="page-panel bg-brand-200/40 border-brand-400/30">
 <div className="p-4 flex items-center gap-3">
 <CheckCircle2 className="w-5 h-5 text-brand-500" />
 <div>
 <h3 className="text-sm font-medium text-foreground">AccountSecurityStatus</h3>
 <p className="text-[13px] text-foreground-light">
 you'sAccountEnabledcurrentSecurityProtect.SuggestionEnableTwo-stepVerifywithEnhancedSecurity.
 </p>
 </div>
 </div>
 </div>
 </div>

 <div className="page-section">
 {/* EditPassword */}
 <div className="page-panel">
 <div className="page-panel-header">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center">
 <Key className="w-4 h-4 text-foreground-muted" />
 </div>
 <div>
 <h2 className="page-panel-title">EditPassword</h2>
 <p className="page-panel-description mt-1">PeriodicmorePasswordwithProtectAccountSecurity</p>
 </div>
 </div>
 </div>

 <div className="p-6 space-y-4 max-w-md">
 <div>
 <label className="block text-[13px] font-medium text-foreground mb-2">
 Current Password
 </label>
 <div className="relative">
 <Input
 type={showCurrentPassword ? "text" : "password"}
 value={currentPassword}
 onChange={(e) => setCurrentPassword(e.target.value)}
 placeholder="InputCurrent Password"
 className="pr-10 h-9 bg-surface-200 border-border"
 />
 <button
 type="button"
 onClick={() => setShowCurrentPassword(!showCurrentPassword)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
 >
 {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 </div>

 <div>
 <label className="block text-[13px] font-medium text-foreground mb-2">
 New Password
 </label>
 <div className="relative">
 <Input
 type={showNewPassword ? "text" : "password"}
 value={newPassword}
 onChange={(e) => setNewPassword(e.target.value)}
 placeholder="InputNew Password"
 className="pr-10 h-9 bg-surface-200 border-border"
 />
 <button
 type="button"
 onClick={() => setShowNewPassword(!showNewPassword)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
 >
 {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 {newPassword && (
 <div className="mt-2">
 <div className="flex items-center gap-2">
 <div className="flex-1 h-1.5 bg-surface-200 rounded-full overflow-hidden">
 <div
 className={cn("h-full transition-all", passwordStrength.level === 3 ? "bg-brand-500" : passwordStrength.level === 2 ? "bg-warning" : "bg-destructive")}
 style={{ width: `${(passwordStrength.level / 3) * 100}%` }}
 />
 </div>
 <span className={cn("text-xs", passwordStrength.level === 3 ? "text-brand-500" : passwordStrength.level === 2 ? "text-warning" : "text-destructive")}>
 {passwordStrength.label}
 </span>
 </div>
 <p className="text-xs text-foreground-muted mt-1">
 SuggestionUsage 10+ Character, ContainsSizecharandcountchar
 </p>
 </div>
 )}
 </div>

 <div>
 <label className="block text-[13px] font-medium text-foreground mb-2">
 ConfirmNew Password
 </label>
 <Input
 type="password"
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 placeholder="againtimesInputNew Password"
 className="h-9 bg-surface-200 border-border"
 />
 {confirmPassword && newPassword !== confirmPassword && (
 <p className="text-xs text-destructive mt-1">timesInput'sPasswordnot1</p>
 )}
 </div>

 <Button
 className="bg-brand-500 hover:bg-brand-600 text-background"
 disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
 >
 <Lock className="w-4 h-4 mr-2" />
 moreNew Password
 </Button>
 </div>
 </div>

 {/* Two-stepVerify */}
 <div className="page-panel">
 <div className="page-panel-header">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center">
 <Smartphone className="w-4 h-4 text-foreground-muted" />
 </div>
 <div>
 <h2 className="page-panel-title">Two-stepVerify (2FA)</h2>
 <p className="page-panel-description mt-1">UsageVerifyAppEnhancedAccountSecurity</p>
 </div>
 </div>
 <Badge
 variant={is2FAEnabled ? "default" : "secondary"}
 className={is2FAEnabled ? "bg-brand-500 text-background" : "bg-surface-200 text-foreground-light"}
 >
 {is2FAEnabled ? "Enabled": "not yetEnable"}
 </Badge>
 </div>
 </div>

 <div className="p-6">
 {!is2FAEnabled && !showSetup2FA && (
 <div className="p-4 rounded-md bg-warning-200 border border-warning/20 mb-4">
 <div className="flex items-start gap-3">
 <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
 <div>
 <p className="text-[13px] text-foreground">
 Two-stepVerifycanwithasyou'sAccountProvideoutside'sSecurityProtect
 </p>
 <p className="text-xs text-foreground-muted mt-1">
 nowmakePassword, alsoneedneedVerification CodeonlycanSign In
 </p>
 </div>
 </div>
 </div>
 )}

 {!is2FAEnabled && !showSetup2FA && (
 <Button onClick={() => setShowSetup2FA(true)} className="bg-brand-500 hover:bg-brand-600 text-background">
 <Shield className="w-4 h-4 mr-2" />
 EnableTwo-stepVerify
 </Button>
 )}

 {showSetup2FA && (
 <div className="space-y-4">
 <div className="p-4 rounded-md bg-surface-100/60">
 <h3 className="text-[13px] font-medium text-foreground mb-2">SettingsStep</h3>
 <ol className="list-decimal list-inside space-y-2 text-[13px] text-foreground-light">
 <li>DownloadVerifyApp(if Google Authenticator, Authy)</li>
 <li>Scandownmethod2R CodeorManualInputKey</li>
 <li>InputAppDisplay's 6 Verification Code</li>
 </ol>
 </div>

 <div className="flex items-center gap-6">
 <div className="w-32 h-32 bg-surface-200/60 rounded-md flex items-center justify-center border border-border">
 <QrCode className="w-24 h-24 text-foreground" />
 </div>
 <div>
 <p className="text-[13px] text-foreground-light mb-2">orManualInputKey: </p>
 <div className="flex items-center gap-2">
 <code className="px-3 py-2 bg-surface-200 rounded-md font-mono text-sm">
 ABCD-EFGH-IJKL-MNOP
 </code>
 <Button variant="outline" size="icon" className="border-border">
 <Copy className="w-4 h-4" />
 </Button>
 </div>
 </div>
 </div>

 <div className="max-w-xs">
 <label className="block text-[13px] font-medium text-foreground mb-2">
 InputVerification Code
 </label>
 <Input
 value={verificationCode}
 onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
 placeholder="000000"
 className="text-center text-lg tracking-widest font-mono h-10 bg-surface-200 border-border"
 maxLength={6}
 />
 </div>

 <div className="flex gap-2">
 <Button
 className="bg-brand-500 hover:bg-brand-600 text-background"
 disabled={verificationCode.length !== 6}
 onClick={() => {
 setIs2FAEnabled(true);
 setShowSetup2FA(false);
 }}
 >
 VerifyandEnable
 </Button>
 <Button variant="outline" onClick={() => setShowSetup2FA(false)} className="border-border text-foreground-light">
 Cancel
 </Button>
 </div>
 </div>
 )}

 {is2FAEnabled && (
 <div className="flex items-center gap-4">
 <Button variant="outline" className="border-border text-foreground-light">
 <RefreshCw className="w-4 h-4 mr-2" />
 re-newGenerateRestore
 </Button>
 <Button variant="outline" className="text-destructive hover:text-destructive border-destructive/30">
 DisableTwo-stepVerify
 </Button>
 </div>
 )}
 </div>
 </div>

 {/* Sign InDevice */}
 <div className="page-panel">
 <div className="page-panel-header">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center">
 <Monitor className="w-4 h-4 text-foreground-muted" />
 </div>
 <div>
 <h2 className="page-panel-title">Sign InDevice</h2>
 <p className="page-panel-description mt-1">ManagealreadySign In'sDeviceandwill</p>
 </div>
 </div>
 <Button variant="outline" size="sm" className="text-destructive hover:text-destructive border-destructive/30">
 Sign OutAllDevice
 </Button>
 </div>
 </div>

 <div className="p-6 space-y-3">
 {loginDevices.map((device) => (
 <div
 key={device.id}
 className={cn(
 "flex items-center gap-4 p-4 rounded-md border transition-colors",
 device.isCurrent ? "bg-brand-200 border-brand-400/30" : "bg-surface-100/60 border-border"
 )}
 >
 <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center shrink-0">
 {device.device.includes("iPhone") ? (
 <Smartphone className="w-4 h-4 text-foreground-muted" />
 ) : (
 <Monitor className="w-4 h-4 text-foreground-muted" />
 )}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <h3 className="text-[13px] font-medium text-foreground">{device.device}</h3>
 {device.isCurrent && (
 <Badge className="bg-brand-500 text-background">CurrentDevice</Badge>
 )}
 </div>
 <div className="flex items-center gap-4 mt-1 text-xs text-foreground-muted">
 <span>{device.browser}</span>
 <span className="flex items-center gap-1">
 <MapPin className="w-3 h-3" />
 {device.location}
 </span>
 <span className="flex items-center gap-1">
 <Clock className="w-3 h-3" />
 {device.lastActive}
 </span>
 </div>
 </div>
 {!device.isCurrent && (
 <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-surface-200">
 <Trash2 className="w-4 h-4" />
 </Button>
 )}
 </div>
 ))}
 </div>
 </div>

 {/* Sign InHistory */}
 <div className="page-panel">
 <div className="page-panel-header">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center">
 <Clock className="w-4 h-4 text-foreground-muted" />
 </div>
 <div>
 <h2 className="page-panel-title">Sign InHistory</h2>
 <p className="page-panel-description mt-1">Recent'sSign InActivityRecord</p>
 </div>
 </div>
 <Button variant="outline" size="sm" className="border-border text-foreground-light">
 <Download className="w-4 h-4 mr-2" />
 ExportLogs
 </Button>
 </div>
 </div>

 <div className="p-6">
 <div className="space-y-2">
 {loginHistory.map((record) => (
 <div
 key={record.id}
 className="flex items-center gap-4 p-3 rounded-md hover:bg-surface-200/60 transition-colors"
 >
 <div className={cn(
 "w-2 h-2 rounded-full shrink-0",
 record.status === "success" ? "bg-brand-500" : "bg-destructive"
 )} />
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <span className="text-[13px] text-foreground">{record.device}</span>
 {record.status === "blocked" && (
 <Badge variant="secondary" className="bg-destructive-200 text-destructive text-xs">
 alreadyBlock
 </Badge>
 )}
 </div>
 <div className="flex items-center gap-4 text-xs text-foreground-muted mt-0.5">
 <span>{record.time}</span>
 <span className="flex items-center gap-1">
 <MapPin className="w-3 h-3" />
 {record.location}
 </span>
 <span className="flex items-center gap-1">
 <Globe className="w-3 h-3" />
 {record.ip}
 </span>
 </div>
 </div>
 </div>
 ))}
 </div>

 <Button variant="outline" className="w-full mt-4 border-border text-foreground-light">
 View moreHistoryRecord
 </Button>
 </div>
 </div>
 </div>
 </div>
 </PageContainer>
 );
}
