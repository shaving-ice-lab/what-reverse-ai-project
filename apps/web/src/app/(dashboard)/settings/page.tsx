"use client";

/**
 * 偏好设置页面 - Supabase 风格（支持亮/暗主题）
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

// Toggle Row 组件 - Supabase 风格
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

// 设置卡片组件 - Supabase 风格
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
      {/* 头部 */}
      <div className="page-panel-header">
        <h2 className="page-panel-title">{title}</h2>
        {description && <p className="page-panel-description mt-1">{description}</p>}
      </div>
      {/* 内容 */}
      <div className="p-6">{children}</div>
      {/* 底部操作栏 */}
      {footer && (
        <div className="px-6 py-4 border-t border-border bg-surface-200/60 flex justify-end">
          {footer}
        </div>
      )}
    </div>
  );
}

// 使用量统计数据
const usageStats = [
  { label: "API 调用", value: "12,580", limit: "100,000", percentage: 12.5 },
  { label: "存储空间", value: "256 MB", limit: "1 GB", percentage: 25 },
  { label: "工作流执行", value: "3,847", limit: "50,000", percentage: 7.7 },
  { label: "团队成员", value: "3", limit: "5", percentage: 60 },
];

// 连接的服务
const connectedServices = [
  { id: "github", name: "GitHub", icon: Github, connected: true, lastSync: "2 小时前" },
  { id: "slack", name: "Slack", icon: Slack, connected: true, lastSync: "刚刚" },
  { id: "email", name: "Email (SMTP)", icon: Mail, connected: false, lastSync: null },
  { id: "database", name: "PostgreSQL", icon: Database, connected: true, lastSync: "5 分钟前" },
];

export default function PreferencesPage() {
  const { theme, setTheme } = useTheme();
  const { user, setUser } = useAuthStore();
  
  // 偏好设置状态
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

  // 加载用户偏好设置
  const loadPreferences = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const userData = await userApi.getCurrentUser();
      
      // 更新本地状态
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
      
      // 更新 store 中的用户数据
      setUser(userData);
    } catch (err) {
      console.error("加载偏好设置失败:", err);
    } finally {
      setIsLoadingData(false);
    }
  }, [setTheme, setUser]);

  // 初始加载
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // 跟踪变更
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
      
      // 保存到服务器
      const updatedUser = await userApi.updateProfile({ preferences });
      
      // 更新 store
      setUser(updatedUser);
      
      setSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    // 重新加载用户偏好
    loadPreferences();
    setHasChanges(false);
  };

  // 初始加载状态
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
          title="通用设置"
          description="配置外观、通知和性能选项"
          actions={(
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-foreground-light hover:text-foreground"
                onClick={handleCancel}
                disabled={isLoading || !hasChanges}
              >
                取消
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading || !hasChanges}
                className="bg-brand-500 hover:bg-brand-500/90 text-background font-medium transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  "保存更改"
                )}
              </Button>
            </div>
          )}
        />

        <div className="page-divider" />

      {/* 外观设置 */}
      <SettingsSection title="外观" description="自定义应用的视觉效果">
        <div className="space-y-5">
          {/* 主题选择 */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              主题
            </label>
            <div className="page-grid grid-cols-3 gap-3 max-w-md">
              {[
                { value: "light", label: "浅色", icon: Sun },
                { value: "dark", label: "深色", icon: Moon },
                { value: "system", label: "系统", icon: Monitor },
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

          {/* 语言选择 */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              语言
            </label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full max-w-[240px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zh-CN">简体中文</SelectItem>
                <SelectItem value="zh-TW">繁體中文</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsSection>

      {/* 通知设置 */}
      <SettingsSection title="通知" description="管理您希望收到的通知类型">
        <ToggleRow
          label="工作流完成"
          description="当工作流运行完成时发送通知"
          checked={notifications.workflowComplete}
          onCheckedChange={(checked) =>
            setNotifications((prev) => ({ ...prev, workflowComplete: checked }))
          }
        />
        <ToggleRow
          label="工作流错误"
          description="当工作流运行出错时发送通知"
          checked={notifications.workflowError}
          onCheckedChange={(checked) =>
            setNotifications((prev) => ({ ...prev, workflowError: checked }))
          }
        />
        <ToggleRow
          label="系统更新"
          description="接收系统更新和新功能通知"
          checked={notifications.systemUpdates}
          onCheckedChange={(checked) =>
            setNotifications((prev) => ({ ...prev, systemUpdates: checked }))
          }
        />
        <ToggleRow
          label="每周报告"
          description="每周发送使用情况摘要"
          checked={notifications.weeklyDigest}
          onCheckedChange={(checked) =>
            setNotifications((prev) => ({ ...prev, weeklyDigest: checked }))
          }
        />
      </SettingsSection>

      {/* 性能设置 */}
      <SettingsSection title="性能" description="优化应用性能和体验">
        <ToggleRow
          label="自动保存"
          description="自动保存您的工作流更改"
          checked={performance.autoSave}
          onCheckedChange={(checked) =>
            setPerformance((prev) => ({ ...prev, autoSave: checked }))
          }
        />
        <ToggleRow
          label="界面动画"
          description="启用界面过渡动画效果"
          checked={performance.animations}
          onCheckedChange={(checked) =>
            setPerformance((prev) => ({ ...prev, animations: checked }))
          }
        />
        <ToggleRow
          label="紧凑模式"
          description="使用更紧凑的界面布局"
          checked={performance.compactMode}
          onCheckedChange={(checked) =>
            setPerformance((prev) => ({ ...prev, compactMode: checked }))
          }
        />
      </SettingsSection>

      {/* 使用量统计 */}
      <SettingsSection title="使用量统计" description="查看您的账户使用情况">
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
                已使用 {stat.percentage.toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-foreground-muted" />
          <span className="text-[13px] text-foreground-light">
            数据更新于 {new Date().toLocaleString()}
          </span>
        </div>
      </SettingsSection>

      {/* 连接的服务 */}
      <SettingsSection title="连接的服务" description="管理您的第三方服务集成">
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
                      ? `最后同步: ${service.lastSync}` 
                      : "未连接"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {service.connected ? (
                  <>
                    <Button variant="ghost" size="sm" className="h-8 text-foreground-light hover:text-foreground">
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      同步
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive">
                      <X className="w-3.5 h-3.5 mr-1.5" />
                      断开
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" className="h-8 border-border text-foreground-light hover:text-foreground">
                    <Link2 className="w-3.5 h-3.5 mr-1.5" />
                    连接
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" className="mt-4 border-border text-foreground-light hover:text-foreground">
          <Link2 className="w-4 h-4 mr-2" />
          添加新的集成
        </Button>
      </SettingsSection>

      {/* 数据导出 */}
      <SettingsSection title="数据导出" description="导出您的数据和配置">
        <div className="page-grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-md border border-border bg-surface-100/60 hover:border-brand-400 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-md bg-brand-200 flex items-center justify-center">
                <Download className="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">导出工作流</p>
                <p className="text-xs text-foreground-muted">JSON 格式</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2 border-border text-foreground-light hover:bg-surface-200 hover:text-foreground">
              下载
            </Button>
          </div>
          <div className="p-4 rounded-md border border-border bg-surface-100/60 hover:border-brand-400 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-md bg-surface-200 flex items-center justify-center">
                <Database className="w-5 h-5 text-foreground-light" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">导出执行日志</p>
                <p className="text-xs text-foreground-muted">CSV 格式</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2 border-border text-foreground-light hover:bg-surface-200 hover:text-foreground">
              下载
            </Button>
          </div>
          <div className="p-4 rounded-md border border-border bg-surface-100/60 hover:border-brand-400 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-md bg-surface-200 flex items-center justify-center">
                <Key className="w-5 h-5 text-foreground-light" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">导出 API 密钥</p>
                <p className="text-xs text-foreground-muted">加密备份</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2 border-border text-foreground-light hover:bg-surface-200 hover:text-foreground">
              下载
            </Button>
          </div>
          <div className="p-4 rounded-md border border-border bg-surface-100/60 hover:border-brand-400 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-md bg-warning-200 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">导出使用报告</p>
                <p className="text-xs text-foreground-muted">PDF 格式</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2 border-border text-foreground-light hover:bg-surface-200 hover:text-foreground">
              下载
            </Button>
          </div>
        </div>
      </SettingsSection>

      {/* 危险操作区域 */}
      <SettingsSection title="危险操作" description="以下操作不可逆，请谨慎操作">
        <div className="space-y-4">
          <div className="p-4 rounded-md border border-warning/30 bg-warning-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">清空所有工作流</p>
                  <p className="text-xs text-foreground-light mt-1">
                    删除所有工作流及其执行历史，此操作无法撤销
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="text-warning border-warning/30 hover:bg-warning-200/20">
                清空
              </Button>
            </div>
          </div>
          
          <div className="p-4 rounded-md border border-destructive/30 bg-destructive-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Trash2 className="w-5 h-5 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">删除账户</p>
                  <p className="text-xs text-foreground-light mt-1">
                    永久删除您的账户和所有数据，此操作无法撤销
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-destructive border-destructive/30 hover:bg-destructive-200/20"
                onClick={() => setShowDeleteConfirm(true)}
              >
                删除账户
              </Button>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
          <div className="w-full max-w-md bg-surface-100 border border-border rounded-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-md bg-destructive-200 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">确认删除账户</h3>
                <p className="text-sm text-foreground-light">此操作无法撤销</p>
              </div>
            </div>
            <p className="text-sm text-foreground-light mb-6">
              删除账户后，您的所有工作流、执行历史、API 密钥和其他数据将被永久删除，无法恢复。
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="border-border text-foreground-light hover:bg-surface-200 hover:text-foreground">
                取消
              </Button>
              <Button className="bg-destructive hover:bg-destructive/90 text-background">
                确认删除
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 提示信息 */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-md bg-destructive-200 border border-destructive/30 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-4 rounded-md bg-brand-200 border border-brand-400 text-brand-500 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          设置已保存
        </div>
      )}

      </div>
    </PageContainer>
  );
}
