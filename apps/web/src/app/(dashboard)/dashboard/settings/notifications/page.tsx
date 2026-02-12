'use client'

/**
 * Notification Settings Page
 * Supabase Style: Minimal, Professional
 */

import { useState } from 'react'
import {
  Bell,
  Mail,
  Smartphone,
  Zap,
  CheckCircle,
  Clock,
  Users,
  CreditCard,
  Shield,
  Save,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PageContainer, PageHeader } from '@/components/dashboard/page-layout'

// Notification Categories
const notificationCategories = [
  {
    id: 'app',
    title: 'App notifications',
    icon: Zap,
    description: 'Notifications related to app building and publishing',
    settings: [
      {
        id: 'app_published',
        title: 'App published',
        description: 'Notify when an app is published',
        email: true,
        push: true,
        inApp: true,
      },
      {
        id: 'app_error',
        title: 'App Error',
        description: 'Notify when an app build or publish fails',
        email: true,
        push: true,
        inApp: true,
      },
      {
        id: 'database_change',
        title: 'Database change',
        description: 'Notify when database schema changes are applied',
        email: false,
        push: true,
        inApp: true,
      },
    ],
  },
  {
    id: 'team',
    title: 'Team collaboration',
    icon: Users,
    description: 'Team and collaboration notifications',
    settings: [
      {
        id: 'team_invite',
        title: 'Team invite',
        description: 'Notify when invited to a team',
        email: true,
        push: true,
        inApp: true,
      },
      {
        id: 'team_mention',
        title: 'Mentions',
        description: 'Notify on comments or @mentions',
        email: true,
        push: true,
        inApp: true,
      },
      {
        id: 'workspace_shared',
        title: 'Workspace shared',
        description: 'Notify when someone shares a workspace with you',
        email: false,
        push: true,
        inApp: true,
      },
    ],
  },
  {
    id: 'system',
    title: 'System notifications',
    icon: Bell,
    description: 'System status and maintenance notifications',
    settings: [
      {
        id: 'system_maintenance',
        title: 'Planned maintenance',
        description: 'Notify before scheduled maintenance',
        email: true,
        push: false,
        inApp: true,
      },
      {
        id: 'system_incident',
        title: 'System incident',
        description: 'Notify when a system incident occurs',
        email: true,
        push: true,
        inApp: true,
      },
      {
        id: 'feature_update',
        title: 'Feature updates',
        description: 'Notify when new features are released',
        email: true,
        push: false,
        inApp: true,
      },
    ],
  },
  {
    id: 'billing',
    title: 'Billing notifications',
    icon: CreditCard,
    description: 'Subscription and billing notifications',
    settings: [
      {
        id: 'billing_invoice',
        title: 'Invoice generated',
        description: 'Notify when a new invoice is generated',
        email: true,
        push: false,
        inApp: true,
      },
      {
        id: 'billing_payment',
        title: 'Payment confirmed',
        description: 'Notify when payment succeeds',
        email: true,
        push: false,
        inApp: true,
      },
      {
        id: 'billing_quota',
        title: 'Quota warning',
        description: 'Notify when usage approaches quota limit',
        email: true,
        push: true,
        inApp: true,
      },
    ],
  },
  {
    id: 'security',
    title: 'Security notifications',
    icon: Shield,
    description: 'Account security notifications',
    settings: [
      {
        id: 'security_login',
        title: 'New device sign-in',
        description: 'Notify when signing in from a new device',
        email: true,
        push: true,
        inApp: true,
      },
      {
        id: 'security_password',
        title: 'Password change',
        description: 'Notify when password is changed',
        email: true,
        push: false,
        inApp: true,
      },
      {
        id: 'security_api_key',
        title: 'API Key Activity',
        description: 'Notify when an API key is created or used',
        email: false,
        push: false,
        inApp: true,
      },
    ],
  },
]

// Toggle Component
function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors',
        checked ? 'bg-brand-500' : 'bg-surface-200',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      disabled={disabled}
    >
      <span
        className={cn(
          'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-sm transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-[2px]'
        )}
      />
    </button>
  )
}

export default function NotificationsSettingsPage() {
  const [settings, setSettings] = useState(notificationCategories)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Update Settings
  const updateSetting = (
    categoryId: string,
    settingId: string,
    field: 'email' | 'push' | 'inApp',
    value: boolean
  ) => {
    setSettings((prev) =>
      prev.map((category) => {
        if (category.id !== categoryId) return category
        return {
          ...category,
          settings: category.settings.map((setting) => {
            if (setting.id !== settingId) return setting
            return { ...setting, [field]: value }
          }),
        }
      })
    )
    setSaved(false)
  }

  // Toggle Category
  const toggleCategory = (
    categoryId: string,
    field: 'email' | 'push' | 'inApp',
    value: boolean
  ) => {
    setSettings((prev) =>
      prev.map((category) => {
        if (category.id !== categoryId) return category
        return {
          ...category,
          settings: category.settings.map((setting) => ({
            ...setting,
            [field]: value,
          })),
        }
      })
    )
    setSaved(false)
  }

  // Save Settings
  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Settings"
          title="Notification Settings"
          description="Manage how and how often you receive notifications"
          actions={
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
                  Save Changes
                </>
              )}
            </Button>
          }
        />

        {/* Notification Channel Descriptions */}
        <div className="page-section">
          <div className="page-grid sm:grid-cols-2 lg:grid-cols-3">
            <div className="page-panel p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-md bg-brand-200 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-brand-500" />
                </div>
                <span className="text-[13px] font-medium text-foreground">Email</span>
              </div>
              <p className="text-xs text-foreground-muted">Receive notifications via email</p>
            </div>
            <div className="page-panel p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-foreground-light" />
                </div>
                <span className="text-[13px] font-medium text-foreground">Push</span>
              </div>
              <p className="text-xs text-foreground-muted">Browser or mobile push notifications</p>
            </div>
            <div className="page-panel p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-md bg-brand-200 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-brand-500" />
                </div>
                <span className="text-[13px] font-medium text-foreground">In-App</span>
              </div>
              <p className="text-xs text-foreground-muted">Display notifications within the app</p>
            </div>
          </div>
        </div>

        {/* Notification Settings List */}
        <div className="page-section">
          <div className="space-y-5">
            {settings.map((category) => {
              // Check if all settings are enabled
              const allEmailEnabled = category.settings.every((s) => s.email)
              const allPushEnabled = category.settings.every((s) => s.push)
              const allInAppEnabled = category.settings.every((s) => s.inApp)

              return (
                <div key={category.id} className="page-panel overflow-hidden">
                  {/* Category Header */}
                  <div className="page-panel-header">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center">
                          <category.icon className="w-4 h-4 text-foreground-muted" />
                        </div>
                        <div>
                          <h3 className="page-panel-title">{category.title}</h3>
                          <p className="page-panel-description mt-1">{category.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-foreground-muted w-8 text-center">
                            Email
                          </span>
                          <Toggle
                            checked={allEmailEnabled}
                            onChange={(v) => toggleCategory(category.id, 'email', v)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-foreground-muted w-8 text-center">
                            Push
                          </span>
                          <Toggle
                            checked={allPushEnabled}
                            onChange={(v) => toggleCategory(category.id, 'push', v)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-foreground-muted w-8 text-center">
                            In-App
                          </span>
                          <Toggle
                            checked={allInAppEnabled}
                            onChange={(v) => toggleCategory(category.id, 'inApp', v)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Settings List */}
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
                              onChange={(v) => updateSetting(category.id, setting.id, 'email', v)}
                            />
                          </div>
                          <div className="w-16 flex justify-center">
                            <Toggle
                              checked={setting.push}
                              onChange={(v) => updateSetting(category.id, setting.id, 'push', v)}
                            />
                          </div>
                          <div className="w-16 flex justify-center">
                            <Toggle
                              checked={setting.inApp}
                              onChange={(v) => updateSetting(category.id, setting.id, 'inApp', v)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Global Settings */}
        <div className="page-section">
          <div className="page-panel">
            <div className="page-panel-header">
              <h3 className="page-panel-title">Global Settings</h3>
              <p className="page-panel-description mt-1">Control your notification preferences</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[13px] font-medium text-foreground">Do Not Disturb</h4>
                  <p className="text-xs text-foreground-muted">
                    Pause all push notifications during specified times
                  </p>
                </div>
                <Toggle checked={false} onChange={() => {}} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[13px] font-medium text-foreground">Daily Summary</h4>
                  <p className="text-xs text-foreground-muted">
                    Urgent notifications and daily email summary
                  </p>
                </div>
                <Toggle checked={true} onChange={() => {}} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
