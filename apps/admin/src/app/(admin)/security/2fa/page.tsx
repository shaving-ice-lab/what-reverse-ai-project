"use client";

import { useMemo, useState } from "react";
import {
  Shield,
  Smartphone,
  Key,
  Mail,
  Search,
  Settings,
  AlertTriangle,
  Check,
  X,
  RefreshCw,
  Download,
  QrCode,
  Lock,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  SettingsSection,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FullPagination } from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { formatRelativeTime } from "@/lib/utils";

// ===== Types =====

interface TwoFactorConfig {
  id: string;
  user_id: string;
  user_email: string;
  method: "totp" | "sms" | "email" | "hardware_key";
  enabled: boolean;
  verified: boolean;
  last_used_at?: string;
  backup_codes_remaining: number;
  created_at: string;
  updated_at: string;
}

interface TwoFactorSettings {
  enforce_2fa: boolean;
  allowed_methods: ("totp" | "sms" | "email" | "hardware_key")[];
  grace_period_days: number;
  backup_codes_count: number;
  require_on_sensitive_actions: boolean;
}

// ===== Mock Data =====

const mockConfigs: TwoFactorConfig[] = [
  {
    id: "2fa_001",
    user_id: "u_admin_001",
    user_email: "admin@agentflow.ai",
    method: "totp",
    enabled: true,
    verified: true,
    last_used_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    backup_codes_remaining: 8,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2fa_002",
    user_id: "u_ops_001",
    user_email: "ops@agentflow.ai",
    method: "hardware_key",
    enabled: true,
    verified: true,
    last_used_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    backup_codes_remaining: 10,
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2fa_003",
    user_id: "u_support_001",
    user_email: "support@agentflow.ai",
    method: "totp",
    enabled: true,
    verified: true,
    last_used_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    backup_codes_remaining: 5,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2fa_004",
    user_id: "u_finance_001",
    user_email: "finance@agentflow.ai",
    method: "sms",
    enabled: false,
    verified: false,
    backup_codes_remaining: 10,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2fa_005",
    user_id: "u_viewer_001",
    user_email: "viewer@agentflow.ai",
    method: "email",
    enabled: true,
    verified: true,
    last_used_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    backup_codes_remaining: 10,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockSettings: TwoFactorSettings = {
  enforce_2fa: true,
  allowed_methods: ["totp", "sms", "email", "hardware_key"],
  grace_period_days: 7,
  backup_codes_count: 10,
  require_on_sensitive_actions: true,
};

const METHOD_LABELS: Record<TwoFactorConfig["method"], string> = {
  totp: "身份验证器 (TOTP)",
  sms: "短信验证",
  email: "邮箱验证",
  hardware_key: "硬件密钥",
};

const METHOD_ICONS: Record<TwoFactorConfig["method"], typeof Smartphone> = {
  totp: QrCode,
  sms: Smartphone,
  email: Mail,
  hardware_key: Key,
};

export default function TwoFactorPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [settings, setSettings] = useState<TwoFactorSettings>(mockSettings);

  // Reset modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetUser, setResetUser] = useState<TwoFactorConfig | null>(null);
  const [resetReason, setResetReason] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Settings modal
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Filtering
  const filteredConfigs = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return mockConfigs.filter((config) => {
      return (
        !normalized ||
        config.user_email.toLowerCase().includes(normalized) ||
        METHOD_LABELS[config.method].toLowerCase().includes(normalized)
      );
    });
  }, [search]);

  const total = filteredConfigs.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagedData = filteredConfigs.slice((page - 1) * pageSize, page * pageSize);

  const handleReset2FA = async () => {
    if (!resetUser || !resetReason.trim()) return;
    setIsResetting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsResetting(false);
    setResetModalOpen(false);
    setResetUser(null);
    setResetReason("");
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSettingsModalOpen(false);
  };

  // Stats
  const enabledCount = mockConfigs.filter((c) => c.enabled && c.verified).length;
  const pendingCount = mockConfigs.filter((c) => !c.enabled || !c.verified).length;
  const totpCount = mockConfigs.filter((c) => c.method === "totp" && c.enabled).length;
  const hardwareCount = mockConfigs.filter((c) => c.method === "hardware_key" && c.enabled).length;

  return (
    <PageContainer>
      <PageHeader
        title="双因素认证 (2FA)"
        description="管理管理员账号的双因素认证配置。"
        icon={<Lock className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-3.5 h-3.5 mr-1" />
              导出报告
            </Button>
            <Button size="sm" onClick={() => setSettingsModalOpen(true)}>
              <Settings className="w-3.5 h-3.5 mr-1" />
              全局配置
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-success-500" />
            </div>
            <div>
              <div className="text-[11px] text-foreground-muted">已启用</div>
              <div className="text-[20px] font-semibold text-foreground">{enabledCount}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning-500" />
            </div>
            <div>
              <div className="text-[11px] text-foreground-muted">待配置</div>
              <div className="text-[20px] font-semibold text-foreground">{pendingCount}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-brand-500" />
            </div>
            <div>
              <div className="text-[11px] text-foreground-muted">TOTP</div>
              <div className="text-[20px] font-semibold text-foreground">{totpCount}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-foreground/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <div className="text-[11px] text-foreground-muted">硬件密钥</div>
              <div className="text-[20px] font-semibold text-foreground">{hardwareCount}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Global Settings Summary */}
      <Card className="mb-6 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-brand-500" />
            </div>
            <div>
              <div className="text-[13px] font-medium text-foreground">全局 2FA 策略</div>
              <div className="text-[11px] text-foreground-muted">
                {settings.enforce_2fa ? "强制所有管理员启用 2FA" : "可选启用 2FA"}
                {settings.enforce_2fa && ` (宽限期 ${settings.grace_period_days} 天)`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {settings.allowed_methods.map((method) => {
                const Icon = METHOD_ICONS[method];
                return (
                  <div
                    key={method}
                    className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center"
                    title={METHOD_LABELS[method]}
                  >
                    <Icon className="w-4 h-4 text-foreground-muted" />
                  </div>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsModalOpen(true)}
            >
              修改配置
            </Button>
          </div>
        </div>
      </Card>

      {/* 2FA Configurations */}
      <SettingsSection
        title="管理员 2FA 状态"
        description="查看和管理所有管理员的双因素认证配置。"
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="搜索用户或认证方式"
              leftIcon={<Search className="w-3.5 h-3.5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Badge variant="outline" size="sm">
            共 {total} 位管理员
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户</TableHead>
              <TableHead>认证方式</TableHead>
              <TableHead>备用码</TableHead>
              <TableHead>最后使用</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-[12px] text-foreground-muted">
                  暂无 2FA 配置
                </TableCell>
              </TableRow>
            ) : (
              pagedData.map((config) => {
                const MethodIcon = METHOD_ICONS[config.method];
                return (
                  <TableRow key={config.id}>
                    <TableCell>
                      <div className="text-[12px] text-foreground">{config.user_email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-surface-200 flex items-center justify-center">
                          <MethodIcon className="w-3.5 h-3.5 text-foreground-muted" />
                        </div>
                        <span className="text-[12px] text-foreground">
                          {METHOD_LABELS[config.method]}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] text-foreground">
                          {config.backup_codes_remaining}
                        </span>
                        <span className="text-[11px] text-foreground-muted">/ 10</span>
                        {config.backup_codes_remaining <= 3 && (
                          <AlertTriangle className="w-3 h-3 text-warning-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {config.last_used_at ? (
                        <span className="text-[12px] text-foreground-light">
                          {formatRelativeTime(config.last_used_at)}
                        </span>
                      ) : (
                        <span className="text-[12px] text-foreground-muted">从未使用</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {config.enabled && config.verified ? (
                        <Badge variant="success" size="sm">
                          <Check className="w-3 h-3 mr-1" />
                          已启用
                        </Badge>
                      ) : config.enabled && !config.verified ? (
                        <Badge variant="warning" size="sm">
                          待验证
                        </Badge>
                      ) : (
                        <Badge variant="outline" size="sm">
                          <X className="w-3 h-3 mr-1" />
                          未启用
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setResetUser(config);
                          setResetModalOpen(true);
                        }}
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1" />
                        重置
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <div className="mt-4">
          <FullPagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            showInput={false}
            size="sm"
            variant="outline"
          />
        </div>
      </SettingsSection>

      {/* Reset 2FA Modal */}
      <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent>
          <DialogHeader icon={<AlertTriangle className="w-6 h-6" />} iconVariant="warning">
            <DialogTitle>重置 2FA</DialogTitle>
            <DialogDescription>
              重置用户的双因素认证配置，用户需要重新设置。
            </DialogDescription>
          </DialogHeader>

          {resetUser && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="grid gap-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">用户</span>
                    <span className="text-foreground">{resetUser.user_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">当前方式</span>
                    <span className="text-foreground">{METHOD_LABELS[resetUser.method]}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-warning-500/30 bg-warning-500/5 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning-500 mt-0.5" />
                  <div className="text-[12px] text-foreground">
                    <p className="font-medium">注意事项</p>
                    <ul className="text-foreground-light mt-1 list-disc list-inside space-y-0.5">
                      <li>用户的现有 2FA 配置将被清除</li>
                      <li>用户需要在下次登录时重新设置 2FA</li>
                      <li>所有备用码将失效</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-foreground mb-1.5 block">
                  重置原因 <span className="text-destructive">*</span>
                </label>
                <Input
                  inputSize="sm"
                  placeholder="请输入重置原因"
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setResetModalOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={!resetReason.trim() || isResetting}
              onClick={handleReset2FA}
            >
              {isResetting ? "重置中..." : "确认重置"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
        <DialogContent size="lg">
          <DialogHeader icon={<Settings className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>全局 2FA 配置</DialogTitle>
            <DialogDescription>
              配置双因素认证的全局策略。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-surface-75">
              <div>
                <div className="text-[13px] font-medium text-foreground">强制启用 2FA</div>
                <div className="text-[11px] text-foreground-muted mt-0.5">
                  要求所有管理员必须启用双因素认证
                </div>
              </div>
              <Switch
                checked={settings.enforce_2fa}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enforce_2fa: checked })
                }
              />
            </div>

            {settings.enforce_2fa && (
              <div>
                <label className="text-[12px] font-medium text-foreground mb-1.5 block">
                  宽限期（天）
                </label>
                <Input
                  inputSize="sm"
                  type="number"
                  min={0}
                  max={30}
                  value={settings.grace_period_days}
                  onChange={(e) =>
                    setSettings({ ...settings, grace_period_days: parseInt(e.target.value) || 0 })
                  }
                />
                <div className="text-[11px] text-foreground-muted mt-1">
                  新管理员可在此期限内完成 2FA 设置
                </div>
              </div>
            )}

            <div>
              <label className="text-[12px] font-medium text-foreground mb-2 block">
                允许的认证方式
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(["totp", "sms", "email", "hardware_key"] as const).map((method) => {
                  const Icon = METHOD_ICONS[method];
                  const isEnabled = settings.allowed_methods.includes(method);
                  return (
                    <div
                      key={method}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-75"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-foreground-muted" />
                        <span className="text-[12px] text-foreground">
                          {METHOD_LABELS[method]}
                        </span>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSettings({
                              ...settings,
                              allowed_methods: [...settings.allowed_methods, method],
                            });
                          } else {
                            setSettings({
                              ...settings,
                              allowed_methods: settings.allowed_methods.filter((m) => m !== method),
                            });
                          }
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-surface-75">
              <div>
                <div className="text-[13px] font-medium text-foreground">敏感操作二次验证</div>
                <div className="text-[11px] text-foreground-muted mt-0.5">
                  执行高风险操作时要求 2FA 验证
                </div>
              </div>
              <Switch
                checked={settings.require_on_sensitive_actions}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, require_on_sensitive_actions: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSettingsModalOpen(false)}>
              取消
            </Button>
            <Button size="sm" disabled={isSaving} onClick={handleSaveSettings}>
              {isSaving ? "保存中..." : "保存配置"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
