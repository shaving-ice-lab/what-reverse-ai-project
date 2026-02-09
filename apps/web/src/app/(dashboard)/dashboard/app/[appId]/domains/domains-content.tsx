"use client";

/**
 * Domain Management Page - Supabase Style
 * Domain Binding, Verification Status, SSL Certificate Management
 */

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
 Globe,
 Plus,
 CheckCircle2,
 XCircle,
 AlertCircle,
 Clock,
 Loader2,
 RefreshCw,
 Copy,
 ExternalLink,
 Info,
 Lock,
 MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import {
 PageContainer,
 PageHeader,
 PageWithSidebar,
 SettingsSection,
 SidebarNavItem,
 SidebarNavGroup,
 EmptyState,
} from "@/components/dashboard/page-layout";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
 DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { appApi, type App, type AppDomain, type DomainVerificationInfo } from "@/lib/api/workspace";
import { workspaceApi, type Workspace } from "@/lib/api/workspace";
import { useAuthStore } from "@/stores/useAuthStore";
import { buildWorkspacePermissions, resolveWorkspaceRoleFromUser } from "@/lib/permissions";
import { AppAccessGate } from "@/components/permissions/app-access-gate";
import { PermissionAction } from "@/components/permissions/permission-action";
import { PermissionGate } from "@/components/permissions/permission-gate";

// DomainStatusConfig
const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  pending: { label: "Pending Configuration", color: "text-foreground-muted", bgColor: "bg-surface-200", icon: Clock },
 verifying: { label: "Verifying", color: "text-warning", bgColor: "bg-warning-200", icon: Loader2 },
 verified: { label: "Verified", color: "text-brand-500", bgColor: "bg-brand-200", icon: CheckCircle2 },
  active: { label: "Active", color: "text-brand-500", bgColor: "bg-brand-200", icon: CheckCircle2 },
  failed: { label: "Failed to Verify", color: "text-destructive", bgColor: "bg-destructive-200", icon: XCircle },
  blocked: { label: "Blocked", color: "text-destructive", bgColor: "bg-destructive-200", icon: Lock },
};

// SSL StatusConfig
const sslStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending Issuance", color: "text-foreground-muted" },
  issuing: { label: "Issuing", color: "text-warning" },
  issued: { label: "Issued", color: "text-brand-500" },
  failed: { label: "Failed to Issue", color: "text-destructive" },
 expired: { label: "Expired", color: "text-destructive" },
};

// EdgeNavigation
function AppNav({ appId, activeTab }: { appId: string; activeTab: string }) {
 const navItems = [
 { id: "overview", label: "Overview", href: `/dashboard/app/${appId}` },
 { id: "builder", label: "Build", href: `/dashboard/app/${appId}/builder` },
    { id: "publish", label: "Publish Settings", href: `/dashboard/app/${appId}/publish` },
 { id: "versions", label: "Version History", href: `/dashboard/app/${appId}/versions` },
 { id: "monitoring", label: "Monitor", href: `/dashboard/app/${appId}/monitoring` },
 { id: "domains", label: "Domain", href: `/dashboard/app/${appId}/domains` },
 ];

 return (
 <SidebarNavGroup title="App">
 {navItems.map((item) => (
 <SidebarNavItem
 key={item.id}
 href={item.href}
 label={item.label}
 active={activeTab === item.id}
 />
 ))}
 </SidebarNavGroup>
 );
}

export default function DomainsPage() {
 const params = useParams();
 const workspaceId = Array.isArray(params?.workspaceId)
 ? params.workspaceId[0]
 : (params?.workspaceId as string | undefined);
 const appId = Array.isArray(params?.appId) ? params.appId[0] : (params?.appId as string | undefined);

 if (!workspaceId || !appId) {
 return null;
 }

 return <DomainsPageContent workspaceId={workspaceId} appId={appId} />;
}

type DomainsPageProps = {
 workspaceId: string;
 appId: string;
};

export function DomainsPageContent({ workspaceId, appId }: DomainsPageProps) {
 const router = useRouter();
 const { user } = useAuthStore();
 const workspaceRole = resolveWorkspaceRoleFromUser(user?.role);
 const permissions = buildWorkspacePermissions(workspaceRole);

 const [workspace, setWorkspace] = useState<Workspace | null>(null);
 const [app, setApp] = useState<App | null>(null);
 const [domains, setDomains] = useState<AppDomain[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [primaryDomainId, setPrimaryDomainId] = useState<string | null>(null);
 const [verificationTargetId, setVerificationTargetId] = useState<string>("");
 const [domainActionMessage, setDomainActionMessage] = useState<string | null>(null);
 const [domainActionError, setDomainActionError] = useState<string | null>(null);
 const [showCertDialog, setShowCertDialog] = useState(false);
 const [certDomain, setCertDomain] = useState<AppDomain | null>(null);

 // BindDomainDialog
 const [showBindDialog, setShowBindDialog] = useState(false);
 const [bindDomain, setBindDomain] = useState("");
 const [isBinding, setIsBinding] = useState(false);

 // VerifyDescriptionDialog
 const [showVerifyDialog, setShowVerifyDialog] = useState(false);
 const [selectedDomain, setSelectedDomain] = useState<AppDomain | null>(null);
 const [selectedVerification, setSelectedVerification] = useState<DomainVerificationInfo | null>(null);
 const [isVerifying, setIsVerifying] = useState(false);
 const defaultTxtPrefix = "_agentflow";
 const defaultCnameTarget = "cname.agentflow.app";

 const buildVerificationFallback = (domain: AppDomain | null): DomainVerificationInfo | null => {
 if (!domain?.domain) return null;
 return {
 txt_name: `${defaultTxtPrefix}.${domain.domain}`,
 txt_value: domain.verification_token || "",
 cname_target: defaultCnameTarget,
 };
 };

 // LoadData
 useEffect(() => {
 loadData();
 }, [workspaceId, appId]);

 const loadData = async () => {
 try {
 setIsLoading(true);
 const [ws, appData, domainsData] = await Promise.all([
 workspaceApi.get(workspaceId),
 appApi.get(appId),
 appApi.getDomains(appId),
 ]);
 setWorkspace(ws);
 setApp(appData);
 setDomains(domainsData);
 } catch (error) {
 console.error("Failed to load data:", error);
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 if (domains.length === 0) {
 setPrimaryDomainId(null);
 setVerificationTargetId("");
 return;
 }
 if (!primaryDomainId || !domains.some((domain) => domain.id === primaryDomainId)) {
 setPrimaryDomainId(domains[0].id);
 }
 if (!verificationTargetId || !domains.some((domain) => domain.id === verificationTargetId)) {
 setVerificationTargetId(domains[0].id);
 }
 }, [domains, primaryDomainId, verificationTargetId]);

 // BindDomain
 const handleBind = async () => {
 if (!bindDomain) return;

 try {
 setIsBinding(true);
 const result = await appApi.bindDomain(appId, { domain: bindDomain });
 setShowBindDialog(false);
 setBindDomain("");
 setSelectedDomain(result.domain);
 setSelectedVerification(result.verification || buildVerificationFallback(result.domain));
 setShowVerifyDialog(true);
 loadData();
 } catch (error) {
 console.error("Failed to bind domain:", error);
 } finally {
 setIsBinding(false);
 }
 };

 // VerifyDomain
 const handleVerify = async (domainId: string) => {
 try {
 setIsVerifying(true);
 const result = await appApi.verifyDomain(appId, domainId);
 setSelectedDomain(result.domain);
 if (result.verification) {
 setSelectedVerification(result.verification);
 }
 loadData();
 setShowVerifyDialog(false);
 } catch (error) {
 console.error("Failed to verify domain:", error);
 } finally {
 setIsVerifying(false);
 }
 };

 // DeleteDomain
 const handleDelete = async (domainId: string) => {
    if (!confirm("Are you sure you want to delete this domain binding?")) return;

 try {
 await appApi.deleteDomain(appId, domainId);
 loadData();
 } catch (error) {
 console.error("Failed to delete domain:", error);
 }
 };

 const openVerifyDialog = (domain: AppDomain) => {
 setSelectedDomain(domain);
 setSelectedVerification(buildVerificationFallback(domain));
 setShowVerifyDialog(true);
 };

 const handleSetPrimaryDomain = (domainId: string) => {
 setPrimaryDomainId(domainId);
 setDomainActionError(null);
    setDomainActionMessage("Set as primary domain.");
 setTimeout(() => setDomainActionMessage(null), 2000);
 };

 const handleOpenCertificate = (domain: AppDomain) => {
 setCertDomain(domain);
 setShowCertDialog(true);
 };

 // Copied to clipboard
 const copyToClipboard = (text: string) => {
 navigator.clipboard.writeText(text);
 };

 // FetchStatusConfig
 const getStatusConfig = (status: string) => {
 return statusConfig[status] || statusConfig.pending;
 };

 // FormatDate
 const formatDate = (dateStr?: string) => {
 if (!dateStr) return "-";
 return new Date(dateStr).toLocaleDateString("zh-CN");
 };

 const sortedDomains = useMemo(() => {
 if (!primaryDomainId) return domains;
 return [...domains].sort((a, b) => {
 if (a.id === primaryDomainId) return -1;
 if (b.id === primaryDomainId) return 1;
 return 0;
 });
 }, [domains, primaryDomainId]);

 const verificationTarget =
 sortedDomains.find((domain) => domain.id === verificationTargetId) || sortedDomains[0] || null;
 const verificationPreview = buildVerificationFallback(verificationTarget);
 const previewTxtName =
 verificationPreview?.txt_name ||
 (verificationTarget?.domain ? `${defaultTxtPrefix}.${verificationTarget.domain}` : "");
 const previewTxtValue = verificationPreview?.txt_value || verificationTarget?.verification_token || "";
 const previewCnameTarget = verificationPreview?.cname_target || defaultCnameTarget;

 const expiringDomains = domains
 .map((domain) => {
 if (!domain.domain_expires_at) return null;
 const expiresAt = new Date(domain.domain_expires_at);
 if (Number.isNaN(expiresAt.getTime())) return null;
 const daysRemaining = Math.ceil((expiresAt.getTime() - Date.now()) / 86400000);
 return { domain, daysRemaining };
 })
 .filter((item): item is { domain: AppDomain; daysRemaining: number } => Boolean(item))
 .filter((item) => item.daysRemaining <= 30)
 .sort((a, b) => a.daysRemaining - b.daysRemaining);

 const verification = selectedVerification || buildVerificationFallback(selectedDomain);
 const txtName = verification?.txt_name || (selectedDomain?.domain ? `${defaultTxtPrefix}.${selectedDomain.domain}` : "");
 const txtValue = verification?.txt_value || selectedDomain?.verification_token || "";
 const cnameTarget = verification?.cname_target || defaultCnameTarget;

 if (isLoading && !app) {
 return (
 <PageContainer>
 <div className="flex items-center justify-center py-16">
 <Loader2 className="w-6 h-6 animate-spin text-foreground-muted" />
 </div>
 </PageContainer>
 );
 }

 return (
 <AppAccessGate
 app={app}
 permissions={permissions}
 required={["workspace_publish"]}
 backHref="/dashboard/apps"
 >
 <PageWithSidebar
 sidebarWidth="narrow"
 sidebarTitle={app?.name || "App"}
 sidebar={<AppNav appId={appId} activeTab="domains" />}
 >
 <PageContainer>
 {/* PageHeader */}
 <PageHeader
                title="Domain Management"
 eyebrow={app?.name}
 backHref="/dashboard/apps"
                backLabel="Back to App List"
 actions={
 <PermissionAction
 permissions={permissions}
 required={["workspace_publish"]}
                    label="Bind Domain"
                    icon={Plus}
 size="sm"
 onClick={() => setShowBindDialog(true)}
 />
 }
 />

 {expiringDomains.length > 0 && (
 <div className="mb-4 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-[12px] text-warning">
                Domains expiring soon: 
 <span className="ml-1">
 {expiringDomains
 .slice(0, 2)
.map((item) => `${item.domain.domain} · ${item.daysRemaining} days`)
 .join(", ")}
 </span>
 {expiringDomains.length > 2 && <span> and {expiringDomains.length - 2} more</span>}
 </div>
 )}

 {/* DefaultDomain */}
 <SettingsSection
                title="Default Domain"
                description="System-allocated access address. No configuration needed."
 compact
 >
 <div className="flex items-center justify-between p-3 rounded-md bg-surface-75">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-md bg-brand-200 flex items-center justify-center">
 <Globe className="w-4 h-4 text-brand-500" />
 </div>
 <div>
 <p className="text-[13px] font-medium text-foreground">
 {workspace?.slug}.agentflow.app/{app?.slug}
 </p>
 <p className="text-[11px] text-foreground-muted">
                    HTTPS Auto-Enabled
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Badge variant="secondary" className="bg-brand-200 text-brand-500 gap-1">
 <Lock className="w-3 h-3" />
 HTTPS
 </Badge>
 <Button
 variant="ghost"
 size="icon"
 className="h-8 w-8"
 onClick={() => copyToClipboard(`https://${workspace?.slug}.agentflow.app/${app?.slug}`)}
 >
 <Copy className="w-4 h-4" />
 </Button>
 <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
 <a
 href={`https://${workspace?.slug}.agentflow.app/${app?.slug}`}
 target="_blank"
 rel="noopener noreferrer"
 >
 <ExternalLink className="w-4 h-4" />
 </a>
 </Button>
 </div>
 </div>
 </SettingsSection>

 <SettingsSection
                title="Bind and Verify"
                description="Configure DNS records and complete verification to ensure domain availability."
 compact
 >
 {(domainActionMessage || domainActionError) && (
 <div
 className={cn(
 "mb-3 rounded-md border px-3 py-2 text-[12px]",
 domainActionError
 ? "border-destructive/40 bg-destructive/10 text-destructive"
 : "border-brand-200/60 bg-brand-200/20 text-brand-500"
 )}
 >
 {domainActionError || domainActionMessage}
 </div>
 )}

 {domains.length === 0 ? (
 <EmptyState
 icon={<Globe className="w-6 h-6" />}
                    title="No Domain Bound"
                    description="Bind a domain first, then verify based on the DNS configuration instructions."
 action={{
                      label: "Bind Domain",
                      onClick: () => setShowBindDialog(true),
                    }}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div className="min-w-[220px]">
                        <div className="text-[11px] text-foreground-muted mb-2">Verify Domain</div>
 <Select value={verificationTargetId} onValueChange={setVerificationTargetId}>
 <SelectTrigger className="h-9 bg-surface-75 border-border">
                        <SelectValue placeholder="Select Domain" />
 </SelectTrigger>
 <SelectContent className="bg-surface-100 border-border">
 {sortedDomains.map((domain) => (
 <SelectItem key={domain.id} value={domain.id}>
 {domain.domain}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="flex flex-wrap items-center gap-2">
 <Button variant="outline" size="sm" onClick={() => setShowBindDialog(true)}>
                        Bind New Domain
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => verificationTarget && openVerifyDialog(verificationTarget)}
 disabled={!verificationTarget}
 >
 View DNS Config
 </Button>
 <Button
 size="sm"
 onClick={() => verificationTarget && handleVerify(verificationTarget.id)}
 disabled={!verificationTarget || isVerifying}
 >
 {isVerifying && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
 {verificationTarget?.status === "verified" || verificationTarget?.status === "active"
                        ? "Re-verify"
: "Verify Now"}
 </Button>
 </div>
 </div>

 {verificationTarget && (
 <div className="rounded-md border border-border bg-surface-75 p-4">
 <div className="grid gap-3 md:grid-cols-2">
 <div className="space-y-2">
 <div className="text-[11px] text-foreground-muted">TXT Record</div>
 <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-100 px-3 py-2">
 <div>
 <div className="text-[12px] font-mono text-foreground">{previewTxtName}</div>
 <div className="text-[10px] text-foreground-muted truncate">{previewTxtValue || "-"}</div>
 </div>
 <Button
 variant="ghost"
 size="icon"
 className="h-7 w-7"
 onClick={() => copyToClipboard(previewTxtValue)}
 >
 <Copy className="w-3 h-3" />
 </Button>
 </div>
 </div>
 <div className="space-y-2">
 <div className="text-[11px] text-foreground-muted">CNAME Record</div>
 <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-100 px-3 py-2">
 <div>
 <div className="text-[12px] font-mono text-foreground">
 {verificationTarget.domain.split(".")[0] || "app"}
 </div>
 <div className="text-[10px] text-foreground-muted">{previewCnameTarget}</div>
 </div>
 <Button
 variant="ghost"
 size="icon"
 className="h-7 w-7"
 onClick={() => copyToClipboard(previewCnameTarget)}
 >
 <Copy className="w-3 h-3" />
 </Button>
 </div>
 </div>
 </div>
 <div className="mt-3 text-[11px] text-foreground-muted">
                    DNS records can take minutes to hours to take effect. Please click Verify after completing configuration.
 </div>
 </div>
 )}
 </div>
 )}
 </SettingsSection>

 {/* Custom DomainList */}
 <div className="mt-6">
 <SettingsSection
 title="Custom Domain"
                  description="Bind your own domain for a more professional access experience."
 compact
 >
 {domains.length === 0 ? (
 <EmptyState
 icon={<Globe className="w-6 h-6" />}
                    title="No Custom Domain"
                    description="Bind your own domain to make your app more professional."
 action={{
                      label: "Bind Domain",
                      onClick: () => setShowBindDialog(true),
                    }}
                  />
                ) : (
                  <div className="rounded-md bg-surface-100 border border-border overflow-hidden">
                    <div className="grid grid-cols-[2fr_1fr_1.3fr_1fr_1.6fr] gap-4 px-4 py-3 border-b border-border bg-surface-75 text-[11px] font-medium text-foreground-muted uppercase tracking-wider">
                      <div>Domain</div>
                      <div>Status</div>
                      <div>Verify</div>
                      <div>Certificate Expiry</div>
 <div className="text-right">Action</div>
 </div>
 {sortedDomains.map((domain) => {
 const status = getStatusConfig(domain.status);
 const StatusIcon = status.icon;
 const sslStatus = domain.ssl_status ? sslStatusConfig[domain.ssl_status] : null;
 const isPrimary = primaryDomainId === domain.id;
 const verificationLabel =
 domain.status === "active" || domain.status === "verified"
 ? `Verified · ${formatDate(domain.verified_at)}`
 : domain.status === "verifying"
 ? "Verifying"
 : domain.status === "failed"
                        ? "Verification Failed"
: "Pending Verification";

 return (
 <div
 key={domain.id}
 className={cn(
 "grid grid-cols-[2fr_1fr_1.3fr_1fr_1.6fr] gap-4 px-4 py-3 border-b border-border last:border-b-0 text-[12px]",
 isPrimary && "bg-surface-75/80"
 )}
 >
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <span className="text-[12px] font-medium text-foreground">{domain.domain}</span>
 {isPrimary && (
 <Badge variant="secondary" className="text-[10px] bg-brand-200 text-brand-500">
 Primary Domain
 </Badge>
 )}
 </div>
 <div className="text-[10px] text-foreground-muted">
                            Bound at {formatDate(domain.created_at)}
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Badge
 variant="secondary"
 className={cn("gap-1 text-[10px]", status.bgColor, status.color)}
 >
 <StatusIcon className={cn("w-3 h-3", domain.status === "verifying" && "animate-spin")} />
 {status.label}
 </Badge>
 {sslStatus && (
 <span className={cn("text-[10px]", sslStatus.color)}>
 SSL: {sslStatus.label}
 </span>
 )}
 </div>
 <div className="text-[11px] text-foreground-muted">
 {verificationLabel}
 </div>
 <div className="text-[11px] text-foreground-muted">
 {formatDate(domain.ssl_expires_at)}
 </div>
 <div className="flex items-center justify-end gap-2">
 {(domain.status === "pending" || domain.status === "failed") && (
 <Button
 variant="outline"
 size="sm"
 onClick={() => openVerifyDialog(domain)}
 >
                            View Configuration
 </Button>
 )}
 {domain.status === "verified" && (
 <Button
 variant="outline"
 size="sm"
 onClick={() => handleVerify(domain.id)}
 disabled={isVerifying}
 >
 <RefreshCw className={cn("w-4 h-4 mr-1.5", isVerifying && "animate-spin")} />
                            Re-verify
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-surface-100 border-border">
                            <DropdownMenuItem
                              onClick={() => handleSetPrimaryDomain(domain.id)}
                              disabled={isPrimary}
                            >
                              Set as Primary Domain
 </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenCertificate(domain)}>
                            View Certificate
 </DropdownMenuItem>
 <DropdownMenuSeparator className="bg-border" />
 <PermissionGate permissions={permissions} required={["workspace_publish"]}>
 <DropdownMenuItem
 onClick={() => handleDelete(domain.id)}
 className="text-destructive"
 >
 Delete
 </DropdownMenuItem>
 </PermissionGate>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </SettingsSection>
 </div>
 </PageContainer>

        {/* Bind Domain Dialog */}
 <Dialog open={showBindDialog} onOpenChange={setShowBindDialog}>
 <DialogContent className="sm:max-w-md bg-surface-100 border-border">
 <DialogHeader>
              <DialogTitle className="text-foreground">Bind Domain</DialogTitle>
              <DialogDescription className="text-foreground-light">
                Enter the domain you want to bind. After binding, you'll need to configure DNS records for verification.
 </DialogDescription>
 </DialogHeader>

 <div className="space-y-4 py-4">
 <div>
 <label className="block text-[12px] font-medium text-foreground mb-2">
 Domain <span className="text-destructive">*</span>
 </label>
 <Input
                    placeholder="e.g., app.example.com"
 value={bindDomain}
 onChange={(e) => setBindDomain(e.target.value)}
 className="h-9 bg-surface-75 border-border focus:border-brand-500"
 />
 <p className="text-[11px] text-foreground-muted mt-1.5">
                    We recommend using a subdomain, e.g., app.example.com
 </p>
 </div>

 <div className="p-3 rounded-md bg-surface-75 text-[12px] text-foreground-light">
 <p className="flex items-center gap-2">
 <Info className="w-4 h-4 text-foreground-muted shrink-0" />
                    After binding, you need to add the required records in your domain's DNS settings.
 </p>
 </div>
 </div>

 <DialogFooter>
 <Button
 variant="outline"
 onClick={() => setShowBindDialog(false)}
 className="border-border"
 >
 Cancel
 </Button>
 <Button onClick={handleBind} disabled={!bindDomain || isBinding}>
 {isBinding && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
 Bind
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

        {/* DNS Configuration Instructions Dialog */}
 <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
 <DialogContent className="sm:max-w-lg bg-surface-100 border-border">
 <DialogHeader>
              <DialogTitle className="text-foreground">DNS Configuration Instructions</DialogTitle>
 <DialogDescription className="text-foreground-light">
 Please add the following record in your domain DNS settings
 </DialogDescription>
 </DialogHeader>

 <div className="space-y-4 py-4">
            {/* TXT Record Verification */}
 <div className="p-4 rounded-md bg-surface-75 border border-border">
 <h4 className="text-[12px] font-medium text-foreground mb-3">
                    Method 1: TXT Record Verification
 </h4>
 <div className="space-y-2">
 <div className="flex items-center justify-between">
                      <span className="text-[11px] text-foreground-muted">Record Type</span>
                      <span className="text-[12px] font-mono text-foreground">TXT</span>
 </div>
 <div className="flex items-center justify-between">
                      <span className="text-[11px] text-foreground-muted">Host Record</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-mono text-foreground">
                          {txtName || `${defaultTxtPrefix}.${selectedDomain?.domain ?? ""}`}
 </span>
 <Button
 variant="ghost"
 size="icon"
 className="h-6 w-6"
 onClick={() => copyToClipboard(txtName || `${defaultTxtPrefix}.${selectedDomain?.domain ?? ""}`)}
 >
 <Copy className="w-3 h-3" />
 </Button>
 </div>
 </div>
 <div className="flex items-center justify-between">
                      <span className="text-[11px] text-foreground-muted">Record Value</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-mono text-foreground truncate max-w-[200px]">
                          {txtValue || "loading..."}
 </span>
 <Button
 variant="ghost"
 size="icon"
 className="h-6 w-6"
 onClick={() => copyToClipboard(txtValue)}
 >
 <Copy className="w-3 h-3" />
 </Button>
 </div>
 </div>
 </div>
 </div>

 {/* CNAME Record */}
 <div className="p-4 rounded-md bg-surface-75 border border-border">
 <h4 className="text-[12px] font-medium text-foreground mb-3">
                    Method 2: CNAME Record
 </h4>
 <div className="space-y-2">
 <div className="flex items-center justify-between">
                      <span className="text-[11px] text-foreground-muted">Record Type</span>
                      <span className="text-[12px] font-mono text-foreground">CNAME</span>
 </div>
 <div className="flex items-center justify-between">
                      <span className="text-[11px] text-foreground-muted">Host Record</span>
                      <span className="text-[12px] font-mono text-foreground">
                        {selectedDomain?.domain?.split(".")[0] || "app"}
 </span>
 </div>
 <div className="flex items-center justify-between">
                      <span className="text-[11px] text-foreground-muted">Record Value</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-mono text-foreground">
                          {cnameTarget}
 </span>
 <Button
 variant="ghost"
 size="icon"
 className="h-6 w-6"
 onClick={() => copyToClipboard(cnameTarget)}
 >
 <Copy className="w-3 h-3" />
 </Button>
 </div>
 </div>
 </div>
 </div>

 <div className="p-3 rounded-md bg-warning-200 text-[12px] text-warning">
 <p className="flex items-center gap-2">
 <AlertCircle className="w-4 h-4 shrink-0" />
                DNS records can take minutes to hours to take effect. Please wait patiently.
 </p>
 </div>
 </div>

 <DialogFooter>
 <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>
                Verify Later
 </Button>
 <Button
 onClick={() => selectedDomain && handleVerify(selectedDomain.id)}
 disabled={isVerifying}
 >
 {isVerifying && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                Verify Now
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

        {/* Certificate Details Dialog */}
 <Dialog open={showCertDialog} onOpenChange={setShowCertDialog}>
 <DialogContent className="sm:max-w-md bg-surface-100 border-border">
 <DialogHeader>
              <DialogTitle className="text-foreground">Certificate Details</DialogTitle>
              <DialogDescription className="text-foreground-light">
                View SSL certificate status and validity.
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-3 py-2">
 {!certDomain ? (
                  <div className="text-[12px] text-foreground-muted">No certificate information.</div>
 ) : (
 <>
 <div className="flex items-center justify-between text-[12px]">
 <span className="text-foreground-muted">Domain</span>
 <span className="text-foreground">{certDomain.domain}</span>
 </div>
 <div className="flex items-center justify-between text-[12px]">
                    <span className="text-foreground-muted">Certificate Status</span>
 <span className="text-foreground">
 {certDomain.ssl_status
 ? sslStatusConfig[certDomain.ssl_status]?.label || certDomain.ssl_status
: "Unknown"}
 </span>
 </div>
 <div className="flex items-center justify-between text-[12px]">
                    <span className="text-foreground-muted">Issue Time</span>
 <span className="text-foreground">{formatDate(certDomain.ssl_issued_at)}</span>
 </div>
 <div className="flex items-center justify-between text-[12px]">
                    <span className="text-foreground-muted">Expiry Time</span>
 <span className="text-foreground">{formatDate(certDomain.ssl_expires_at)}</span>
 </div>
 </>
 )}
 </div>
 <DialogFooter>
 <Button variant="outline" onClick={() => setShowCertDialog(false)}>
 Close
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </PageWithSidebar>
 </AppAccessGate>
 );
}
