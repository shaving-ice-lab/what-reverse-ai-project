"use client";

/**
 * 域名管理页 - Supabase 风格
 * 域名绑定、验证状态、SSL 证书管理
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

// 域名状态配置
const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  pending: { label: "待配置", color: "text-foreground-muted", bgColor: "bg-surface-200", icon: Clock },
  verifying: { label: "验证中", color: "text-warning", bgColor: "bg-warning-200", icon: Loader2 },
  verified: { label: "已验证", color: "text-brand-500", bgColor: "bg-brand-200", icon: CheckCircle2 },
  active: { label: "已生效", color: "text-brand-500", bgColor: "bg-brand-200", icon: CheckCircle2 },
  failed: { label: "验证失败", color: "text-destructive", bgColor: "bg-destructive-200", icon: XCircle },
  blocked: { label: "已封禁", color: "text-destructive", bgColor: "bg-destructive-200", icon: Lock },
};

// SSL 状态配置
const sslStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "待签发", color: "text-foreground-muted" },
  issuing: { label: "签发中", color: "text-warning" },
  issued: { label: "已签发", color: "text-brand-500" },
  failed: { label: "签发失败", color: "text-destructive" },
  expired: { label: "已过期", color: "text-destructive" },
};

// 侧边导航
function AppNav({ appId, activeTab }: { appId: string; activeTab: string }) {
  const navItems = [
    { id: "overview", label: "概览", href: `/dashboard/app/${appId}` },
    { id: "builder", label: "构建", href: `/dashboard/app/${appId}/builder` },
    { id: "publish", label: "发布设置", href: `/dashboard/app/${appId}/publish` },
    { id: "versions", label: "版本历史", href: `/dashboard/app/${appId}/versions` },
    { id: "monitoring", label: "监控", href: `/dashboard/app/${appId}/monitoring` },
    { id: "domains", label: "域名", href: `/dashboard/app/${appId}/domains` },
  ];

  return (
    <SidebarNavGroup title="应用">
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

  // 绑定域名对话框
  const [showBindDialog, setShowBindDialog] = useState(false);
  const [bindDomain, setBindDomain] = useState("");
  const [isBinding, setIsBinding] = useState(false);

  // 验证说明对话框
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

  // 加载数据
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

  // 绑定域名
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

  // 验证域名
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

  // 删除域名
  const handleDelete = async (domainId: string) => {
    if (!confirm("确定要删除此域名绑定吗？")) return;

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
    setDomainActionMessage("已设为主域名。");
    setTimeout(() => setDomainActionMessage(null), 2000);
  };

  const handleOpenCertificate = (domain: AppDomain) => {
    setCertDomain(domain);
    setShowCertDialog(true);
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // 获取状态配置
  const getStatusConfig = (status: string) => {
    return statusConfig[status] || statusConfig.pending;
  };

  // 格式化日期
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
        sidebarTitle={app?.name || "应用"}
        sidebar={<AppNav appId={appId} activeTab="domains" />}
      >
        <PageContainer>
        {/* 页面头部 */}
        <PageHeader
          title="域名管理"
          eyebrow={app?.name}
          backHref="/dashboard/apps"
          backLabel="返回应用列表"
          actions={
            <PermissionAction
              permissions={permissions}
              required={["workspace_publish"]}
              label="绑定域名"
              icon={Plus}
              size="sm"
              onClick={() => setShowBindDialog(true)}
            />
          }
        />

        {expiringDomains.length > 0 && (
          <div className="mb-4 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-[12px] text-warning">
            域名即将到期：
            <span className="ml-1">
              {expiringDomains
                .slice(0, 2)
                .map((item) => `${item.domain.domain} · ${item.daysRemaining}天`)
                .join("，")}
            </span>
            {expiringDomains.length > 2 && <span> 等 {expiringDomains.length} 个</span>}
          </div>
        )}

        {/* 默认域名 */}
        <SettingsSection
          title="默认域名"
          description="系统分配的访问地址，无需配置即可使用"
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
                  HTTPS 自动启用
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
          title="绑定与验证"
          description="配置 DNS 记录并完成验证，确保域名可用"
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
              title="还没有绑定域名"
              description="先绑定域名，再根据 DNS 配置说明完成验证。"
              action={{
                label: "绑定域名",
                onClick: () => setShowBindDialog(true),
              }}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-[220px]">
                  <div className="text-[11px] text-foreground-muted mb-2">验证域名</div>
                  <Select value={verificationTargetId} onValueChange={setVerificationTargetId}>
                    <SelectTrigger className="h-9 bg-surface-75 border-border">
                      <SelectValue placeholder="选择域名" />
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
                    绑定新域名
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => verificationTarget && openVerifyDialog(verificationTarget)}
                    disabled={!verificationTarget}
                  >
                    查看 DNS 配置
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => verificationTarget && handleVerify(verificationTarget.id)}
                    disabled={!verificationTarget || isVerifying}
                  >
                    {isVerifying && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                    {verificationTarget?.status === "verified" || verificationTarget?.status === "active"
                      ? "重新验证"
                      : "立即验证"}
                  </Button>
                </div>
              </div>

              {verificationTarget && (
                <div className="rounded-md border border-border bg-surface-75 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="text-[11px] text-foreground-muted">TXT 记录</div>
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
                      <div className="text-[11px] text-foreground-muted">CNAME 记录</div>
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
                    DNS 记录生效可能需要几分钟到几小时，请在完成配置后再点击验证。
                  </div>
                </div>
              )}
            </div>
          )}
        </SettingsSection>

        {/* 自定义域名列表 */}
        <div className="mt-6">
          <SettingsSection
            title="自定义域名"
            description="绑定你自己的域名，提供更专业的访问体验"
            compact
          >
            {domains.length === 0 ? (
              <EmptyState
                icon={<Globe className="w-6 h-6" />}
                title="暂无自定义域名"
                description="绑定你自己的域名，让应用更加专业"
                action={{
                  label: "绑定域名",
                  onClick: () => setShowBindDialog(true),
                }}
              />
            ) : (
              <div className="rounded-md bg-surface-100 border border-border overflow-hidden">
                <div className="grid grid-cols-[2fr_1fr_1.3fr_1fr_1.6fr] gap-4 px-4 py-3 border-b border-border bg-surface-75 text-[11px] font-medium text-foreground-muted uppercase tracking-wider">
                  <div>域名</div>
                  <div>状态</div>
                  <div>验证</div>
                  <div>证书到期</div>
                  <div className="text-right">操作</div>
                </div>
                {sortedDomains.map((domain) => {
                  const status = getStatusConfig(domain.status);
                  const StatusIcon = status.icon;
                  const sslStatus = domain.ssl_status ? sslStatusConfig[domain.ssl_status] : null;
                  const isPrimary = primaryDomainId === domain.id;
                  const verificationLabel =
                    domain.status === "active" || domain.status === "verified"
                      ? `已验证 · ${formatDate(domain.verified_at)}`
                      : domain.status === "verifying"
                      ? "验证中"
                      : domain.status === "failed"
                      ? "验证失败"
                      : "待验证";

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
                              主域名
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] text-foreground-muted">
                          绑定于 {formatDate(domain.created_at)}
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
                            查看配置
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
                            重新验证
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
                              设为主域名
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenCertificate(domain)}>
                              查看证书
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <PermissionGate permissions={permissions} required={["workspace_publish"]}>
                              <DropdownMenuItem
                                onClick={() => handleDelete(domain.id)}
                                className="text-destructive"
                              >
                                删除
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

      {/* 绑定域名对话框 */}
      <Dialog open={showBindDialog} onOpenChange={setShowBindDialog}>
        <DialogContent className="sm:max-w-md bg-surface-100 border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">绑定域名</DialogTitle>
            <DialogDescription className="text-foreground-light">
              输入你要绑定的域名，绑定后需要配置 DNS 记录进行验证
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-[12px] font-medium text-foreground mb-2">
                域名 <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="例如：app.example.com"
                value={bindDomain}
                onChange={(e) => setBindDomain(e.target.value)}
                className="h-9 bg-surface-75 border-border focus:border-brand-500"
              />
              <p className="text-[11px] text-foreground-muted mt-1.5">
                建议使用子域名，如 app.example.com
              </p>
            </div>

            <div className="p-3 rounded-md bg-surface-75 text-[12px] text-foreground-light">
              <p className="flex items-center gap-2">
                <Info className="w-4 h-4 text-foreground-muted shrink-0" />
                绑定后，你需要在域名的 DNS 设置中添加相应记录
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBindDialog(false)}
              className="border-border"
            >
              取消
            </Button>
            <Button onClick={handleBind} disabled={!bindDomain || isBinding}>
              {isBinding && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              绑定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DNS 配置说明对话框 */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent className="sm:max-w-lg bg-surface-100 border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">DNS 配置说明</DialogTitle>
            <DialogDescription className="text-foreground-light">
              请在你的域名 DNS 设置中添加以下记录
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* TXT 记录验证 */}
            <div className="p-4 rounded-md bg-surface-75 border border-border">
              <h4 className="text-[12px] font-medium text-foreground mb-3">
                方式一：TXT 记录验证
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-foreground-muted">记录类型</span>
                  <span className="text-[12px] font-mono text-foreground">TXT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-foreground-muted">主机记录</span>
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
                  <span className="text-[11px] text-foreground-muted">记录值</span>
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

            {/* CNAME 记录 */}
            <div className="p-4 rounded-md bg-surface-75 border border-border">
              <h4 className="text-[12px] font-medium text-foreground mb-3">
                方式二：CNAME 记录
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-foreground-muted">记录类型</span>
                  <span className="text-[12px] font-mono text-foreground">CNAME</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-foreground-muted">主机记录</span>
                  <span className="text-[12px] font-mono text-foreground">
                    {selectedDomain?.domain?.split(".")[0] || "app"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-foreground-muted">记录值</span>
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
                DNS 记录生效可能需要几分钟到几小时，请耐心等待
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>
              稍后验证
            </Button>
            <Button
              onClick={() => selectedDomain && handleVerify(selectedDomain.id)}
              disabled={isVerifying}
            >
              {isVerifying && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              立即验证
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 证书详情对话框 */}
      <Dialog open={showCertDialog} onOpenChange={setShowCertDialog}>
        <DialogContent className="sm:max-w-md bg-surface-100 border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">证书详情</DialogTitle>
            <DialogDescription className="text-foreground-light">
              查看 SSL 证书状态与有效期
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {!certDomain ? (
              <div className="text-[12px] text-foreground-muted">暂无证书信息。</div>
            ) : (
              <>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-foreground-muted">域名</span>
                  <span className="text-foreground">{certDomain.domain}</span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-foreground-muted">证书状态</span>
                  <span className="text-foreground">
                    {certDomain.ssl_status
                      ? sslStatusConfig[certDomain.ssl_status]?.label || certDomain.ssl_status
                      : "未知"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-foreground-muted">签发时间</span>
                  <span className="text-foreground">{formatDate(certDomain.ssl_issued_at)}</span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-foreground-muted">到期时间</span>
                  <span className="text-foreground">{formatDate(certDomain.ssl_expires_at)}</span>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCertDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </PageWithSidebar>
    </AppAccessGate>
  );
}
