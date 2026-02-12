'use client'

/**
 * Preferences Page - Supabase Style (Support/Theme)
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Moon,
  Sun,
  CheckCircle2,
  AlertCircle,
  Monitor,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PageContainer, PageHeader } from '@/components/dashboard/page-layout'
import { useTheme } from 'next-themes'
import { userApi } from '@/lib/api/auth'
import { useAuthStore } from '@/stores/useAuthStore'
import type { UserPreferences } from '@/types/auth'
import { cn } from '@/lib/utils'

// Toggle Row Component - Supabase Style
function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-[13px] text-foreground-light mt-0.5">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

// Settings Card Component - Supabase Style
function SettingsSection({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
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
      {/* Footer Action */}
      {footer && (
        <div className="px-6 py-4 border-t border-border bg-surface-200/60 flex justify-end">
          {footer}
        </div>
      )}
    </div>
  )
}

export default function PreferencesPage() {
  const { theme, setTheme } = useTheme()
  const { setUser } = useAuthStore()

  // Preferences Status
  const [language, setLanguage] = useState('zh-CN')
  const [notifications, setNotifications] = useState({
    appPublished: true,
    appError: true,
    systemUpdates: false,
    weeklyDigest: false,
  })
  const [performance, setPerformance] = useState({
    autoSave: true,
    animations: true,
    compactMode: false,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Load User Preferences
  const loadPreferences = useCallback(async () => {
    setIsLoadingData(true)
    try {
      const userData = await userApi.getCurrentUser()

      // Update Local Status
      if (userData.settings) {
        const prefs = userData.settings

        if (prefs.theme) {
          setTheme(prefs.theme)
        }
        if (prefs.language) {
          setLanguage(prefs.language)
        }
        if (prefs.notifications) {
          setNotifications((prev) => ({ ...prev, ...prefs.notifications }))
        }
        if (prefs.performance) {
          setPerformance((prev) => ({ ...prev, ...prefs.performance }))
        }
      }

      // Update store's user data
      setUser(userData)
    } catch (err) {
      console.error('Load preferences failed:', err)
    } finally {
      setIsLoadingData(false)
    }
  }, [setTheme, setUser])

  // Initial Load
  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  // Track Changes
  useEffect(() => {
    setHasChanges(true)
  }, [language, notifications, performance])

  const handleSave = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const preferences: UserPreferences = {
        theme: theme as 'light' | 'dark' | 'system',
        language,
        notifications,
        performance,
      }

      // Save to Service
      const updatedUser = await userApi.updateProfile({ settings: preferences })

      // Update store
      setUser(updatedUser)

      setSuccess(true)
      setHasChanges(false)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    // Reload user preferences
    loadPreferences()
    setHasChanges(false)
  }

  // Initial Load Status
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
    )
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Settings"
          title="User Settings"
          description="Configure appearance, notifications, and performance options"
          actions={
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
                  'Save Changes'
                )}
              </Button>
            </div>
          }
        />

        <div className="page-divider" />

        {/* Appearance Settings */}
        <SettingsSection title="Appearance" description="Customize your app's visual effects">
          <div className="space-y-5">
            {/* Theme Select */}
            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">Theme</label>
              <div className="page-grid grid-cols-3 gap-3 max-w-md">
                {[
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon },
                  { value: 'system', label: 'System', icon: Monitor },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-md border transition-all',
                      theme === option.value
                        ? 'border-brand-500 bg-brand-200'
                        : 'border-border hover:border-border-strong hover:bg-surface-200'
                    )}
                  >
                    <option.icon
                      className={cn(
                        'w-4 h-4',
                        theme === option.value ? 'text-brand-500' : 'text-foreground-muted'
                      )}
                    />
                    <span
                      className={cn(
                        'text-sm font-medium',
                        theme === option.value ? 'text-brand-500' : 'text-foreground-light'
                      )}
                    >
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Language Select */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Language</label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full max-w-[240px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh-CN"></SelectItem>
                  <SelectItem value="zh-TW"></SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </SettingsSection>

        {/* Notification Settings */}
        <SettingsSection title="Notifications" description="Manage your notification preferences">
          <ToggleRow
            label="App Published"
            description="Send notifications when an app is published"
            checked={notifications.appPublished}
            onCheckedChange={(checked) =>
              setNotifications((prev) => ({ ...prev, appPublished: checked }))
            }
          />
          <ToggleRow
            label="App Error"
            description="Send notifications when app errors occur"
            checked={notifications.appError}
            onCheckedChange={(checked) =>
              setNotifications((prev) => ({ ...prev, appError: checked }))
            }
          />
          <ToggleRow
            label="System Updates"
            description="Receive system update and new feature notifications"
            checked={notifications.systemUpdates}
            onCheckedChange={(checked) =>
              setNotifications((prev) => ({ ...prev, systemUpdates: checked }))
            }
          />
          <ToggleRow
            label="Weekly Report"
            description="Send weekly usage summary reports"
            checked={notifications.weeklyDigest}
            onCheckedChange={(checked) =>
              setNotifications((prev) => ({ ...prev, weeklyDigest: checked }))
            }
          />
        </SettingsSection>

        {/* Performance Settings */}
        <SettingsSection title="Performance" description="Optimize app performance and experience">
          <ToggleRow
            label="Auto-save"
            description="Auto-save your app changes"
            checked={performance.autoSave}
            onCheckedChange={(checked) =>
              setPerformance((prev) => ({ ...prev, autoSave: checked }))
            }
          />
          <ToggleRow
            label="Interface Animation"
            description="Enable interface transition animation effects"
            checked={performance.animations}
            onCheckedChange={(checked) =>
              setPerformance((prev) => ({ ...prev, animations: checked }))
            }
          />
          <ToggleRow
            label="Compact"
            description="Use a more compact interface layout"
            checked={performance.compactMode}
            onCheckedChange={(checked) =>
              setPerformance((prev) => ({ ...prev, compactMode: checked }))
            }
          />
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection
          title="Danger Zone"
          description="The actions below are irreversible. Please proceed with caution."
        >
          <div className="p-4 rounded-md border border-destructive/30 bg-destructive-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Trash2 className="w-5 h-5 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Delete Account</p>
                  <p className="text-xs text-foreground-light mt-1">
                    Permanently delete your account and all data. This action cannot be undone.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive-200/20"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </SettingsSection>

        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Confirm Account Deletion
              </AlertDialogTitle>
              <AlertDialogDescription>
                After deleting your account, all workspaces, databases, API keys, and other data
                will be permanently deleted and cannot be restored.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive hover:bg-destructive/90 text-background">
                Confirm Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Status Messages */}
        {error && (
          <div className="flex items-center gap-2 p-4 rounded-md bg-destructive-200 border border-destructive/30 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-4 rounded-md bg-brand-200 border border-brand-400 text-brand-500 text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Settings saved successfully
          </div>
        )}
      </div>
    </PageContainer>
  )
}
