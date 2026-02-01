"use client";

/**
 * 通知设置页面
 * Supabase 风格：简约、专业
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

// 通知类型
interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
}

// 通知分类
const notificationCategories = [
  {
    id: "workflow",
    title: "工作流通知",
    icon: Zap,
    description: "与工作流执行相关的通知",
    settings: [
      {
        id: "workflow_complete",
        title: "工作流完成",
        description: "当工作流执行完成时通知",
        email: true,
        push: true,
        inApp: true,
      },
      {
        id: "workflow_failed",
        title: "工作流失败",
        description: "当工作流执行失败时通知",
        email: true,
        push: true,
        inApp: true,
      },
      {
        id: "workflow_scheduled",
        title: "定时任务提醒",
        description: "定时工作流执行前提醒",
        email: false,
        push: true,
        inApp: true,
      },
    ],
  },
  {
    id: "team",
    title: "团队协作",
    icon: Users,
    description: "团队成员和协作相关通知",
    settings: [
      {
        id: "team_invite",
        title: "团队邀请",
        description: "收到团队邀请时通知",
        email: true,
        push: true,
        inApp: true,
      },
      {
        id: "team_mention",
        title: "@提及",
        description: "在评论或讨论中被提及时通知",
        email: true,
        push: true,
        inApp: true,
      },
      {
        id: "workflow_shared",
        title: "工作流分享",
        description: "有人与您分享工作流时通知",
        email: false,
        push: true,
        inApp: true,
      },
    ],
  },
  {
    id: "system",
    title: "系统通知",
    icon: Bell,
    description: "系统状态和维护相关通知",
    settings: [
      {
        id: "system_maintenance",
        title: "计划维护",
        description: "系统计划维护提前通知",
        email: true,
        push: false,
        inApp: true,
      },
      {
        id: "system_incident",
        title: "系统故障",
        description: "发生系统故障时通知",
        email: true,
        push: true,
        inApp: true,
      },
      {
        id: "feature_update",
        title: "功能更新",
        description: "新功能发布时通知",
        email: true,
        push: false,
        inApp: true,
      },
    ],
  },
  {
    id: "billing",
    title: "账单通知",
    icon: CreditCard,
    description: "订阅和账单相关通知",
    settings: [
      {
        id: "billing_invoice",
        title: "账单生成",
        description: "新账单生成时通知",
        email: true,
        push: false,
        inApp: true,
      },
      {
        id: "billing_payment",
        title: "付款确认",
        description: "付款成功时通知",
        email: true,
        push: false,
        inApp: true,
      },
      {
        id: "billing_quota",
        title: "配额警告",
        description: "接近使用配额上限时通知",
        email: true,
        push: true,
        inApp: true,
      },
    ],
  },
  {
    id: "security",
    title: "安全通知",
    icon: Shield,
    description: "账户安全相关通知",
    settings: [
      {
        id: "security_login",
        title: "新设备登录",
        description: "从新设备登录时通知",
        email: true,
        push: true,
        inApp: true,
      },
      {
        id: "security_password",
        title: "密码更改",
        description: "密码更改时通知",
        email: true,
        push: false,
        inApp: true,
      },
      {
        id: "security_api_key",
        title: "API Key 活动",
        description: "API Key 创建或使用时通知",
        email: false,
        push: false,
        inApp: true,
      },
    ],
  },
];

// 开关组件
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

  // 更新单个设置
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

  // 切换整个分类
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

  // 保存设置
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
          title="通知设置"
          description="管理您接收通知的方式和频率"
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
                  保存中...
                </>
              ) : saved ? (
                <>
                  <CheckCircle className="mr-2 w-4 h-4" />
                  已保存
                </>
              ) : (
                <>
                  <Save className="mr-2 w-4 h-4" />
                  保存更改
                </>
              )}
            </Button>
          )}
        />

        {/* 通知渠道说明 */}
        <div className="page-section">
          <div className="page-grid sm:grid-cols-2 lg:grid-cols-3">
            <div className="page-panel p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-md bg-brand-200 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-brand-500" />
                </div>
                <span className="text-[13px] font-medium text-foreground">邮件</span>
              </div>
              <p className="text-xs text-foreground-muted">
                通过邮件接收重要通知
              </p>
            </div>
            <div className="page-panel p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-foreground-light" />
                </div>
                <span className="text-[13px] font-medium text-foreground">推送</span>
              </div>
              <p className="text-xs text-foreground-muted">
                浏览器或移动端推送通知
              </p>
            </div>
            <div className="page-panel p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-md bg-brand-200 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-brand-500" />
                </div>
                <span className="text-[13px] font-medium text-foreground">应用内</span>
              </div>
              <p className="text-xs text-foreground-muted">
                在 AgentFlow 应用内显示通知
              </p>
            </div>
          </div>
        </div>

        {/* 通知设置列表 */}
        <div className="page-section">
          <div className="space-y-5">
            {settings.map((category) => {
              // 检查是否所有设置都已开启
              const allEmailEnabled = category.settings.every((s) => s.email);
              const allPushEnabled = category.settings.every((s) => s.push);
              const allInAppEnabled = category.settings.every((s) => s.inApp);

              return (
                <div key={category.id} className="page-panel overflow-hidden">
                {/* 分类头部 */}
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
                          邮件
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
                          推送
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
                          应用内
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

                {/* 设置项列表 */}
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

        {/* 全局设置 */}
        <div className="page-section">
          <div className="page-panel">
            <div className="page-panel-header">
              <h3 className="page-panel-title">全局设置</h3>
              <p className="page-panel-description mt-1">统一控制通知节奏</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[13px] font-medium text-foreground">
                    免打扰模式
                  </h4>
                  <p className="text-xs text-foreground-muted">
                    在指定时间段内暂停所有推送通知
                  </p>
                </div>
                <Toggle checked={false} onChange={() => {}} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[13px] font-medium text-foreground">
                    每日摘要
                  </h4>
                  <p className="text-xs text-foreground-muted">
                    将非紧急通知汇总为每日邮件摘要
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
