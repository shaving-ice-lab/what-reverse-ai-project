'use client'

/**
 * Profile Page - Supabase Style (Support/Theme)
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Camera,
  Mail,
  User as UserIcon,
  Copy,
  CheckCircle2,
  AlertCircle,
  Save,
  Building2,
  Briefcase,
  Globe,
  Phone,
  Github,
  Twitter,
  Linkedin,
  Shield,
  Smartphone,
  Monitor,
  Clock,
  MapPin,
  Key,
  History,
  LogOut,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useAuthStore } from '@/stores/useAuthStore'
import { userApi } from '@/lib/api/auth'
import { workspaceStorageApi } from '@/lib/api/workspace-storage'
import { useWorkspace } from '@/hooks/useWorkspace'
import { cn, formatRelativeTime } from '@/lib/utils'
import { ChangePasswordDialog } from '@/components/settings/change-password-dialog'
import { PageContainer, PageHeader } from '@/components/dashboard/page-layout'

// Settings Card Component
function SettingsSection({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('page-panel overflow-hidden mb-6', className)}>
      <div className="page-panel-header">
        <h2 className="page-panel-title">{title}</h2>
        {description && <p className="page-panel-description mt-1">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// Mock Signed-in Device Data
const mockDevices = [
  {
    id: '1',
    type: 'desktop',
    name: 'Windows PC',
    browser: 'Chrome 120',
    location: 'Beijing, ',
    ip: '192.168.1.***',
    lastActive: new Date(Date.now() - 1000 * 60 * 5), // 5 min ago
    isCurrent: true,
  },
  {
    id: '2',
    type: 'mobile',
    name: 'iPhone 15 Pro',
    browser: 'Safari',
    location: 'on, ',
    ip: '10.0.0.***',
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    isCurrent: false,
  },
  {
    id: '3',
    type: 'desktop',
    name: 'MacBook Pro',
    browser: 'Safari 17',
    location: 'Shenzhen, ',
    ip: '172.16.0.***',
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    isCurrent: false,
  },
]

// Mock Activity History
const mockActivities = [
  {
    id: '1',
    action: 'Sign in success',
    time: new Date(Date.now() - 1000 * 60 * 5),
    device: 'Chrome / Windows',
  },
  {
    id: '2',
    action: 'Edit password',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24),
    device: 'Safari / macOS',
  },
  {
    id: '3',
    action: 'Update profile',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    device: 'Chrome / Windows',
  },
  {
    id: '4',
    action: 'Create app',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    device: 'Safari / iOS',
  },
  {
    id: '5',
    action: 'Sign in success',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    device: 'Chrome / Windows',
  },
]

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const { workspaceId } = useWorkspace()

  // Basic Info
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')

  // Extended Info
  const [company, setCompany] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [website, setWebsite] = useState('')
  const [phone, setPhone] = useState('')

  // Social Accounts
  const [githubConnected, setGithubConnected] = useState(false)
  const [twitterConnected, setTwitterConnected] = useState(false)
  const [linkedinConnected, setLinkedinConnected] = useState(false)

  // Security Settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  // UI Status
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [devices] = useState(mockDevices)
  const [activities] = useState(mockActivities)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  // Load User Data
  const loadUserData = useCallback(async () => {
    setIsLoadingData(true)
    try {
      const userData = await userApi.getCurrentUser()
      setUser(userData)

      // Fill Form
      setUsername(userData.username || '')
      setDisplayName(userData.display_name || '')
      setBio(userData.bio || '')

      setHasChanges(false)
    } catch (err) {
      console.error('Load user data failed:', err)
    } finally {
      setIsLoadingData(false)
    }
  }, [setUser])

  // Initial Load
  useEffect(() => {
    loadUserData()
  }, [loadUserData])

  // Sync data from store
  useEffect(() => {
    if (user) {
      setUsername(user.username || '')
      setDisplayName(user.display_name || '')
      setBio(user.bio || '')
    }
  }, [user])

  // Track Changes
  useEffect(() => {
    setHasChanges(true)
  }, [username, displayName, bio, company, jobTitle, website, phone])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const updatedUser = await userApi.updateProfile({
        username: username.trim(),
        display_name: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
      })
      setUser(updatedUser)
      setSuccess(true)
      setHasChanges(false)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image size cannot exceed 2 MB.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (!workspaceId) {
        setError('No active workspace for file upload.')
        setIsLoading(false)
        return
      }
      const storageObj = await workspaceStorageApi.upload(workspaceId, file, 'avatars')
      const avatarUrl = storageObj.public_url || `/storage/files/${storageObj.id}`
      await userApi.updateProfile({ avatar_url: avatarUrl })
      if (user) {
        setUser({ ...user, avatar_url: avatarUrl })
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload.')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading State
  if (isLoadingData) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <div className="mb-6 space-y-2">
            <div className="h-4 w-24 bg-surface-200 rounded animate-pulse" />
            <div className="h-7 w-32 bg-surface-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-surface-200 rounded animate-pulse" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="page-panel overflow-hidden">
              <div className="page-panel-header">
                <div className="h-4 w-24 bg-surface-200 rounded animate-pulse" />
              </div>
              <div className="p-6 space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-10 bg-surface-200 rounded animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    )
  }

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Settings"
          title="Profile"
          description="Manage your account information and personal settings"
        />

        <div className="page-section">
          {/* Avatar Section */}
          <SettingsSection title="Avatar" description="Click to change your personal avatar">
            <div className="flex items-center gap-5">
              <div className="relative group">
                <Avatar className="h-16 w-16 border border-border">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback className="text-xl bg-brand-500 text-background font-semibold">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-background-studio/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-200">
                  <Camera className="h-5 w-5 text-foreground" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{user?.username || 'User'}</p>
                <p className="text-[13px] text-foreground-light">{user?.email}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-8 text-xs text-foreground-muted hover:text-foreground"
                  asChild
                >
                  <label className="cursor-pointer">
                    <Camera className="h-3.5 w-3.5 mr-1.5" />
                    Change Avatar
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </Button>
              </div>
            </div>
          </SettingsSection>

          {/* Basic Info */}
          <SettingsSection title="Basic Info" description="Update your account basic information">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="page-grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Username */}
                <div>
                  <label className="text-[13px] font-medium text-foreground mb-2 block">
                    Username
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                    <Input
                      placeholder="Enter username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 h-9 bg-surface-200 border-border"
                    />
                  </div>
                </div>

                {/* DisplayName */}
                <div>
                  <label className="text-[13px] font-medium text-foreground mb-2 block">
                    Display Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                    <Input
                      placeholder="Your preferred display name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-10 h-9 bg-surface-200 border-border"
                    />
                  </div>
                </div>

                {/* Email (read) */}
                <div>
                  <label className="text-[13px] font-medium text-foreground mb-2 block">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                    <Input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="pl-10 h-9 bg-surface-200 border-border opacity-60"
                    />
                  </div>
                </div>

                {/* Company */}
                <div>
                  <label className="text-[13px] font-medium text-foreground mb-2 block">
                    Company/Organization
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                    <Input
                      placeholder="Your company or organization"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="pl-10 h-9 bg-surface-200 border-border"
                    />
                  </div>
                </div>

                {/* */}
                <div>
                  <label className="text-[13px] font-medium text-foreground mb-2 block"></label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                    <Input
                      placeholder="Your job title"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="pl-10 h-9 bg-surface-200 border-border"
                    />
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label className="text-[13px] font-medium text-foreground mb-2 block">
                    Personal Website
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                    <Input
                      placeholder="https://yourwebsite.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="pl-10 h-9 bg-surface-200 border-border"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="text-[13px] font-medium text-foreground mb-2 block">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                    <Input
                      placeholder="+86 138-xxxx-xxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 h-9 bg-surface-200 border-border"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Bio */}
              <div>
                <label className="text-[13px] font-medium text-foreground mb-2 block">
                  Personal Bio
                </label>
                <Textarea
                  placeholder="Introduce yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="resize-none bg-surface-200 border-border"
                />
                <p className="text-xs text-foreground-muted mt-1.5">
                  Bio will be displayed on your public profile page
                </p>
              </div>

              {/* Status Messages */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-destructive-200 border border-destructive/20 text-destructive text-[13px]">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-brand-200 border border-brand-400/30 text-brand-500 text-[13px]">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Changes Saved
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !hasChanges}
                className="bg-brand-500 hover:bg-brand-600 text-background font-medium transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </SettingsSection>

          {/* Social Account Linking */}
          <SettingsSection
            title="Social Accounts"
            description="Link your social media accounts for quick sign-in"
          >
            <div className="space-y-3">
              {/* GitHub */}
              <div className="flex items-center justify-between p-4 rounded-md border border-border bg-surface-100/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center">
                    <Github className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">GitHub</p>
                    <p className="text-xs text-foreground-muted">
                      {githubConnected ? 'Connected @username' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <Button
                  variant={githubConnected ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => setGithubConnected(!githubConnected)}
                  className={cn(
                    githubConnected
                      ? 'border-border text-foreground-light'
                      : 'bg-surface-200 hover:bg-surface-300 text-foreground'
                  )}
                >
                  {githubConnected ? 'Disconnect' : 'Connect Account'}
                </Button>
              </div>

              {/* Twitter/X */}
              <div className="flex items-center justify-between p-4 rounded-md border border-border bg-surface-100/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center">
                    <Twitter className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">X (Twitter)</p>
                    <p className="text-xs text-foreground-muted">
                      {twitterConnected ? 'Connected @username' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTwitterConnected(!twitterConnected)}
                  className="border-border text-foreground-light"
                >
                  {twitterConnected ? 'Disconnect' : 'Connect Account'}
                </Button>
              </div>

              {/* LinkedIn */}
              <div className="flex items-center justify-between p-4 rounded-md border border-border bg-surface-100/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-brand-500 flex items-center justify-center">
                    <Linkedin className="h-4 w-4 text-background" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">LinkedIn</p>
                    <p className="text-xs text-foreground-muted">
                      {linkedinConnected ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <Button
                  variant={linkedinConnected ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => setLinkedinConnected(!linkedinConnected)}
                  className={cn(
                    linkedinConnected
                      ? 'border-border text-foreground-light'
                      : 'bg-brand-500 hover:bg-brand-600 text-background'
                  )}
                >
                  {linkedinConnected ? 'Disconnect' : 'Connect Account'}
                </Button>
              </div>
            </div>
          </SettingsSection>

          {/* Security Settings */}
          <SettingsSection title="Security Settings" description="Protect your account security">
            <div className="space-y-3">
              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between p-4 rounded-md border border-border bg-surface-100/60">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-md flex items-center justify-center',
                      twoFactorEnabled
                        ? 'bg-brand-200 text-brand-500'
                        : 'bg-surface-200 text-foreground-muted'
                    )}
                  >
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">
                      Two-Factor Authentication (2FA)
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {twoFactorEnabled
                        ? 'Enabled - Using authenticator app'
                        : 'Add an extra layer of security to your account'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {twoFactorEnabled && (
                    <Badge
                      variant="secondary"
                      className="bg-brand-200 text-brand-500 border-brand-400/30"
                    >
                      Enabled
                    </Badge>
                  )}
                  <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
                </div>
              </div>

              {/* Change Password */}
              <div className="flex items-center justify-between p-4 rounded-md border border-border bg-surface-100/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center text-foreground-muted">
                    <Key className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">Password</p>
                    <p className="text-xs text-foreground-muted">
                      Change your password periodically to protect account security
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswordDialog(true)}
                  className="border-border text-foreground-light"
                >
                  Change Password
                </Button>
              </div>

              {/* Change Password Dialog */}
              <ChangePasswordDialog
                open={showPasswordDialog}
                onOpenChange={setShowPasswordDialog}
              />
            </div>
          </SettingsSection>

          {/* Signed-in Devices */}
          <SettingsSection
            title="Signed-in Devices"
            description="Manage devices signed into this account"
          >
            <div className="space-y-3">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-md border',
                    device.isCurrent
                      ? 'border-brand-400/30 bg-brand-200'
                      : 'border-border bg-surface-100/60'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-md flex items-center justify-center',
                        device.isCurrent
                          ? 'bg-brand-500 text-background'
                          : 'bg-surface-200 text-foreground-muted'
                      )}
                    >
                      {device.type === 'mobile' ? (
                        <Smartphone className="h-4 w-4" />
                      ) : (
                        <Monitor className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-medium text-foreground">{device.name}</p>
                        {device.isCurrent && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 bg-brand-200 text-brand-500"
                          >
                            Current Device
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-foreground-muted mt-0.5">
                        <span>{device.browser}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {device.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(device.lastActive)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!device.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive-200"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="mt-4 w-full sm:w-auto border-border text-foreground-light"
            >
              Sign Out All Other Devices
            </Button>
          </SettingsSection>

          {/* Activity History */}
          <SettingsSection
            title="Activity History"
            description="View your account's recent activity"
          >
            <div className="space-y-0 divide-y divide-border">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center text-foreground-muted">
                      <History className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-foreground">{activity.action}</p>
                      <p className="text-xs text-foreground-muted">{activity.device}</p>
                    </div>
                  </div>
                  <p className="text-xs text-foreground-muted">
                    {formatRelativeTime(activity.time)}
                  </p>
                </div>
              ))}
            </div>
            <Button variant="link" className="mt-2 p-0 h-auto text-[13px] text-brand-500">
              View All Activity
            </Button>
          </SettingsSection>

          {/* Account Information */}
          <SettingsSection title="Account Information" description="View your account details">
            <div className="space-y-0 divide-y divide-border">
              <div className="flex items-center justify-between py-4 first:pt-0">
                <div>
                  <p className="text-[13px] text-foreground-light">Account ID</p>
                  <p className="font-mono text-xs mt-0.5 text-foreground">
                    {user?.id || 'unknown'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyId}
                  className="h-8 text-foreground-muted hover:text-foreground"
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-brand-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-[13px] text-foreground-light">Sign Up Date</p>
                  <p className="text-[13px] mt-0.5 text-foreground">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Unknown'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between py-4 last:pb-0">
                <div>
                  <p className="text-[13px] text-foreground-light">Email Verification</p>
                  <p
                    className={cn(
                      'text-[13px] mt-0.5 flex items-center gap-1.5',
                      user?.email_verified ? 'text-brand-500' : 'text-warning'
                    )}
                  >
                    {user?.email_verified ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Verified
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3.5 w-3.5" />
                        Unverified
                      </>
                    )}
                  </p>
                </div>
                {!user?.email_verified && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-border text-foreground-light"
                  >
                    Resend
                  </Button>
                )}
              </div>
            </div>
          </SettingsSection>

          {/* Danger Zone */}
          <div className="page-panel bg-destructive-200/40 border-destructive/30">
            <div className="p-5">
              <h2 className="text-sm font-medium text-destructive mb-2">Danger Zone</h2>
              <p className="text-[13px] text-foreground-light mb-4">
                Once you delete your account, all data will be permanently deleted and cannot be
                restored.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="border-border text-foreground-light">
                  Export Data
                </Button>
                <Button
                  variant="destructive"
                  className="bg-transparent border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
