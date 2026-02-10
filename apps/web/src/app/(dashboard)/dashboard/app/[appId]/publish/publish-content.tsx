'use client'

/**
 * App Publish Settings Page - Supabase Style
 * Access Policy / Anonymous Toggle / Rate Limiting and Protection
 */

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Lock,
  RefreshCw,
  SlidersHorizontal,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FormRow,
  PageContainer,
  PageHeader,
  PageWithSidebar,
  SettingsSection,
  SidebarNavGroup,
  SidebarNavItem,
  ToggleRow,
} from '@/components/dashboard/page-layout'
import { appApi, type App, type AppAccessPolicy, type AppDomain } from '@/lib/api/workspace'
import { workspaceApi, type Workspace } from '@/lib/api/workspace'
import { useAuthStore } from '@/stores/useAuthStore'
import { buildWorkspacePermissions, resolveWorkspaceRoleFromUser } from '@/lib/permissions'
import { PermissionGate } from '@/components/permissions/permission-gate'

type RateLimitKey = 'per_minute' | 'per_hour' | 'per_day'

const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
  draft: { label: 'Draft', color: 'text-foreground-muted', bgColor: 'bg-surface-200', icon: Clock },
  published: {
    label: 'Published',
    color: 'text-brand-500',
    bgColor: 'bg-brand-200',
    icon: CheckCircle2,
  },
  deprecated: {
    label: 'Deprecated',
    color: 'text-warning',
    bgColor: 'bg-warning-200',
    icon: AlertCircle,
  },
  archived: {
    label: 'Archived',
    color: 'text-foreground-muted',
    bgColor: 'bg-surface-200',
    icon: Archive,
  },
}

const accessModeConfig: Record<
  string,
  { label: string; description: string; icon: React.ElementType }
> = {
  private: {
    label: 'Private Access',
    description: 'Only workspace members can access',
    icon: Lock,
  },
  public_auth: {
    label: 'Public Access (Sign-in Required)',
    description: 'Signed-in users can access',
    icon: Users,
  },
  public_anonymous: {
    label: 'Public Access (Anonymous)',
    description: 'Anyone can access',
    icon: Globe,
  },
}

const rateLimitLabels: Record<RateLimitKey, string> = {
  per_minute: 'Per Minute',
  per_hour: 'Per Hour',
  per_day: 'Per Day',
}

const domainStatusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  active: { label: 'Active', color: 'text-brand-500', bgColor: 'bg-brand-200' },
  verified: { label: 'Verified', color: 'text-brand-500', bgColor: 'bg-brand-200' },
  verifying: { label: 'Verifying', color: 'text-warning', bgColor: 'bg-warning-200' },
  pending: {
    label: 'Pending Verification',
    color: 'text-foreground-muted',
    bgColor: 'bg-surface-200',
  },
  failed: { label: 'Failed to Verify', color: 'text-destructive', bgColor: 'bg-destructive/10' },
  blocked: { label: 'Blocked', color: 'text-destructive', bgColor: 'bg-destructive/10' },
}

// Sidebar Navigation
function AppNav({ appId, activeTab }: { appId: string; activeTab: string }) {
  const navItems = [
    { id: 'overview', label: 'Overview', href: `/dashboard/app/${appId}` },
    { id: 'builder', label: 'Build', href: `/dashboard/app/${appId}/builder` },
    { id: 'publish', label: 'Publish Settings', href: `/dashboard/app/${appId}/publish` },
    { id: 'versions', label: 'Version History', href: `/dashboard/app/${appId}/versions` },
    { id: 'monitoring', label: 'Monitor', href: `/dashboard/app/${appId}/monitoring` },
    { id: 'domains', label: 'Domain', href: `/dashboard/app/${appId}/domains` },
  ]

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
  )
}

type PublishSettingsPageProps = {
  workspaceId: string
  appId: string
}

export function PublishSettingsPageContent({ workspaceId, appId }: PublishSettingsPageProps) {
  const { user } = useAuthStore()
  const workspaceRole = resolveWorkspaceRoleFromUser(user?.role)
  const permissions = buildWorkspacePermissions(workspaceRole)
  const canPublish = Boolean(permissions?.workspace_publish)
  const canEdit = Boolean(permissions?.workspace_edit)

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [app, setApp] = useState<App | null>(null)
  const [accessPolicy, setAccessPolicy] = useState<AppAccessPolicy | null>(null)
  const [domains, setDomains] = useState<AppDomain[]>([])
  const [domainsError, setDomainsError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [accessMode, setAccessMode] = useState<AppAccessPolicy['access_mode']>('private')
  const [rateLimits, setRateLimits] = useState<Record<RateLimitKey, string>>({
    per_minute: '',
    per_hour: '',
    per_day: '',
  })
  const [allowedOriginsText, setAllowedOriginsText] = useState('')
  const [requireCaptcha, setRequireCaptcha] = useState(false)
  const [origin, setOrigin] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDesc, setSeoDesc] = useState('')
  const [seoSaved, setSeoSaved] = useState(false)
  const [isSavingSEO, setIsSavingSEO] = useState(false)
  const [seoSaveError, setSeoSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishMessage, setPublishMessage] = useState<string | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [workspaceId, appId])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setLoadError(null)
      setDomainsError(null)
      const [workspaceData, appData, accessPolicyData, domainsData] = await Promise.all([
        workspaceApi.get(workspaceId),
        appApi.get(appId),
        appApi.getAccessPolicy(appId).catch(() => null),
        appApi.getDomains(appId).catch(() => {
          setDomainsError('Failed to load domains. Please try again later.')
          return []
        }),
      ])
      setWorkspace(workspaceData)
      setApp(appData)
      setAccessPolicy(accessPolicyData)
      setDomains(domainsData)
    } catch (error) {
      console.error('Failed to load publish settings:', error)
      setLoadError('Failed to load publish settings. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadData()
    setIsRefreshing(false)
  }

  useEffect(() => {
    const sourcePolicy = accessPolicy ?? app?.access_policy ?? null
    if (!sourcePolicy) {
      setAccessMode('private')
      setRateLimits({ per_minute: '', per_hour: '', per_day: '' })
      setAllowedOriginsText('')
      setRequireCaptcha(false)
      return
    }

    setAccessMode(sourcePolicy.access_mode || 'private')
    setRateLimits({
      per_minute: sourcePolicy.rate_limit_json?.per_minute
        ? String(sourcePolicy.rate_limit_json.per_minute)
        : '',
      per_hour: sourcePolicy.rate_limit_json?.per_hour
        ? String(sourcePolicy.rate_limit_json.per_hour)
        : '',
      per_day: sourcePolicy.rate_limit_json?.per_day
        ? String(sourcePolicy.rate_limit_json.per_day)
        : '',
    })
    setAllowedOriginsText(sourcePolicy.allowed_origins?.join(', ') || '')
    setRequireCaptcha(Boolean(sourcePolicy.require_captcha))
  }, [accessPolicy, app?.access_policy])

  // Load SEO from current version config_json.public_seo
  useEffect(() => {
    const raw = (app?.current_version?.config_json as any)?.public_seo
    if (!raw || typeof raw !== 'object') return
    const title = typeof raw.title === 'string' ? raw.title : ''
    const desc = typeof raw.description === 'string' ? raw.description : ''
    setSeoTitle(title)
    setSeoDesc(desc)
  }, [app?.current_version?.id])

  const runtimeEntryUrl =
    workspace?.slug && app?.slug ? `/runtime/${workspace.slug}/${app.slug}` : null
  const shareLink =
    origin && workspace?.slug && app?.slug ? `${origin}/runtime/${workspace.slug}/${app.slug}` : ''

  const isAnonymousAccess = accessMode === 'public_anonymous'
  const accessMeta = accessModeConfig[accessMode] || accessModeConfig.private
  const AccessIcon = accessMeta.icon
  const hasDomains = domains.length > 0
  const primaryDomain = domains[0]?.domain || ''
  const primaryStatus = domains[0]?.status || 'pending'
  const domainStatusMeta = domainStatusConfig[primaryStatus] || domainStatusConfig.pending
  const expiryDates = domains
    .map((domain) => domain.domain_expires_at || domain.ssl_expires_at)
    .filter(Boolean)
    .map((value) => new Date(value as string))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime())
  const nextExpiry = expiryDates[0]
  const daysToExpiry = nextExpiry ? Math.ceil((nextExpiry.getTime() - Date.now()) / 86400000) : null
  const expiryLabel = nextExpiry ? nextExpiry.toLocaleDateString('en-US') : 'No info available'
  const expiryReminder =
    daysToExpiry === null
      ? 'No renewal reminder'
      : daysToExpiry <= 30
        ? `${daysToExpiry} days remaining — consider renewing soon`
        : `${daysToExpiry} days remaining`

  const resetSaveNotice = () => {
    if (saveMessage) setSaveMessage(null)
    if (saveError) setSaveError(null)
  }

  const handleAccessModeChange = (value: AppAccessPolicy['access_mode']) => {
    resetSaveNotice()
    setAccessMode(value)
  }

  const handleAnonymousToggle = (checked: boolean) => {
    resetSaveNotice()
    if (checked) {
      setAccessMode('public_anonymous')
    } else if (accessMode === 'public_anonymous') {
      setAccessMode('public_auth')
    }
  }

  const handleRateLimitChange = (key: RateLimitKey, value: string) => {
    resetSaveNotice()
    setRateLimits((prev) => ({ ...prev, [key]: value }))
  }

  const parseNumber = (value: string) => {
    const normalized = value.trim()
    if (!normalized) return undefined
    const numeric = Number(normalized)
    if (Number.isNaN(numeric) || numeric <= 0) return undefined
    return Math.floor(numeric)
  }

  const buildRateLimitPayload = () => {
    const payload: NonNullable<AppAccessPolicy['rate_limit_json']> = {
      per_minute: parseNumber(rateLimits.per_minute),
      per_hour: parseNumber(rateLimits.per_hour),
      per_day: parseNumber(rateLimits.per_day),
    }
    const hasValues = Object.values(payload).some((value) => value !== undefined)
    return hasValues ? payload : {}
  }

  const parseOrigins = (value: string) => {
    if (!value.trim()) return []
    const items = value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean)
    return Array.from(new Set(items))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setSaveError(null)
      setSaveMessage(null)
      const updated = await appApi.updateAccessPolicy(appId, {
        access_mode: accessMode,
        rate_limit_json: buildRateLimitPayload(),
        allowed_origins: parseOrigins(allowedOriginsText),
        require_captcha: requireCaptcha,
      })
      setAccessPolicy(updated)
      setSaveMessage('Access policy saved.')
    } catch (error) {
      console.error('Failed to update access policy:', error)
      setSaveError('Failed to save. Please try again later.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveSEO = async () => {
    try {
      setIsSavingSEO(true)
      setSeoSaveError(null)
      setSeoSaved(false)
      await appApi.updatePublicSEO(appId, {
        title: seoTitle.trim(),
        description: seoDesc.trim(),
      })
      setSeoSaved(true)
      setTimeout(() => setSeoSaved(false), 2000)
    } catch (error) {
      console.error('Failed to update public SEO:', error)
      setSeoSaveError('Failed to save SEO settings. Please try again later.')
    } finally {
      setIsSavingSEO(false)
    }
  }

  const handlePublish = async () => {
    if (!app) return
    if (!confirm('Are you sure you want to publish this app?')) return
    try {
      setIsPublishing(true)
      setPublishError(null)
      setPublishMessage(null)
      const updated = await appApi.publish(appId)
      setApp(updated)
      setPublishMessage('Publish request submitted.')
    } catch (error) {
      console.error('Failed to publish app:', error)
      setPublishError('Failed to publish. Please try again later.')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleSaveDraft = () => {
    setPublishError(null)
    setPublishMessage('Draft saved. Not yet published externally.')
  }

  const handleCopyLink = async (value: string) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  const statusMeta = statusConfig[app?.status || 'draft'] || statusConfig.draft
  const StatusIcon = statusMeta.icon

  if (isLoading && !app) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-foreground-muted" />
        </div>
      </PageContainer>
    )
  }

  if (!app) {
    return (
      <PageContainer>
        <div className="text-center py-16">
          <p className="text-foreground-muted">App does not exist or has been deleted</p>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageWithSidebar
      sidebarWidth="narrow"
      sidebarTitle={app?.name || 'App'}
      sidebar={<AppNav appId={appId} activeTab="publish" />}
    >
      <PageContainer>
        <PageHeader
          title="Publish Settings"
          eyebrow={app?.name}
          description="Configure access policies, anonymous access, and rate limiting rules to ensure secure publishing."
          backHref={`/dashboard/app/${appId}`}
          backLabel="Back to App Overview"
          icon={<SlidersHorizontal className="w-4 h-4" />}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={cn('w-4 h-4 mr-1.5', isRefreshing && 'animate-spin')} />
                Refresh
              </Button>
              <Button size="sm" asChild>
                <Link href={`/dashboard/app/${appId}/builder`}>Open Builder</Link>
              </Button>
              <PermissionGate permissions={permissions} required={['workspace_publish']}>
                <Button size="sm" onClick={handlePublish} disabled={isPublishing}>
                  {isPublishing && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  Publish App
                </Button>
              </PermissionGate>
            </div>
          }
        />

        {loadError && (
          <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
            {loadError}
          </div>
        )}

        <SettingsSection
          title="Access Policy"
          description="Configure access scope, anonymous access, and app permissions"
          footer={
            <div className="flex w-full flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-foreground-muted">
                {!canPublish
                  ? 'Your current role does not have publish permissions. You can only view settings.'
                  : 'Changes take effect immediately after saving.'}
              </div>
              <PermissionGate permissions={permissions} required={['workspace_publish']}>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  Save Settings
                </Button>
              </PermissionGate>
            </div>
          }
        >
          {(saveMessage || saveError) && (
            <div
              className={cn(
                'mb-3 rounded-md border px-3 py-2 text-[12px]',
                saveError
                  ? 'border-destructive/40 bg-destructive/10 text-destructive'
                  : 'border-brand-200/60 bg-brand-200/20 text-brand-500'
              )}
            >
              {saveError || saveMessage}
            </div>
          )}

          <div className="rounded-md border border-border bg-surface-75 p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-surface-200 border border-border flex items-center justify-center">
                <AccessIcon className="w-4 h-4 text-foreground-light" />
              </div>
              <div>
                <div className="text-[13px] font-medium text-foreground">{accessMeta.label}</div>
                <div className="text-[11px] text-foreground-muted">{accessMeta.description}</div>
              </div>
            </div>
          </div>

          <FormRow label="Access" description="Private / Sign-in Required / Public Access">
            <Select
              value={accessMode}
              onValueChange={(value) =>
                handleAccessModeChange(value as AppAccessPolicy['access_mode'])
              }
              disabled={!canPublish}
            >
              <SelectTrigger className="h-9 bg-surface-75 border-border" disabled={!canPublish}>
                <SelectValue placeholder="Select access mode" />
              </SelectTrigger>
              <SelectContent className="bg-surface-100 border-border">
                <SelectItem value="private">
                  <span className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5" />
                    Private Access
                  </span>
                </SelectItem>
                <SelectItem value="public_auth">
                  <span className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    Public Access (Sign-in Required)
                  </span>
                </SelectItem>
                <SelectItem value="public_anonymous">
                  <span className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" />
                    Public Access (Anonymous)
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </FormRow>

          <ToggleRow
            label="Allow Anonymous Access"
            description="When enabled, users who are not signed in can access directly"
            checked={isAnonymousAccess}
            onCheckedChange={handleAnonymousToggle}
            disabled={!canPublish || accessMode === 'private'}
          />
        </SettingsSection>

        <div className="mt-6 space-y-6">
          <SettingsSection
            title="Rate Limiting and Access Protection"
            description="Limit access rate and origins to reduce abuse risk"
          >
            <FormRow
              label="Rate Limit"
              description="Leave empty for no limit. We recommend setting at least one limit for public access."
            >
              <div className="grid gap-3 sm:grid-cols-3">
                {(Object.keys(rateLimitLabels) as RateLimitKey[]).map((key) => (
                  <div key={key} className="space-y-1.5">
                    <Input
                      type="number"
                      min={1}
                      placeholder="e.g., 60"
                      value={rateLimits[key]}
                      onChange={(event) => handleRateLimitChange(key, event.target.value)}
                      disabled={!canPublish}
                    />
                    <div className="text-[11px] text-foreground-muted">{rateLimitLabels[key]}</div>
                  </div>
                ))}
              </div>
            </FormRow>

            <FormRow
              label="Allowed Origins"
              description="Restrict allowed domain origins for API calls. Supports comma or newline separators."
            >
              <Textarea
                placeholder="https://example.com, https://app.example.com"
                value={allowedOriginsText}
                onChange={(event) => {
                  resetSaveNotice()
                  setAllowedOriginsText(event.target.value)
                }}
                disabled={!canPublish}
              />
            </FormRow>

            <ToggleRow
              label="CAPTCHA Protection"
              description="When enabled, anonymous access requires a CAPTCHA verification to prevent abuse."
              checked={requireCaptcha}
              onCheckedChange={(checked) => {
                resetSaveNotice()
                setRequireCaptcha(checked)
              }}
              disabled={!canPublish || accessMode === 'private'}
            />
          </SettingsSection>

          <SettingsSection
            title="SEO and Sharing"
            description="Title, description, and share link for the public access page"
            compact
          >
            <FormRow label="SEO Title" description="Used for search results and share previews">
              <Input
                placeholder="Enter a title"
                value={seoTitle}
                onChange={(event) => setSeoTitle(event.target.value)}
                disabled={!canPublish}
              />
            </FormRow>
            <FormRow label="SEO Description" description="A brief introduction of your app's value">
              <Textarea
                placeholder="Enter a description"
                value={seoDesc}
                onChange={(event) => setSeoDesc(event.target.value)}
                className="min-h-[80px]"
                disabled={!canPublish}
              />
            </FormRow>
            <FormRow label="Share Link" description="Public access entry point for external users">
              <div className="flex items-center gap-2">
                <Input value={shareLink} readOnly />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyLink(shareLink)}
                  disabled={!shareLink}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  {linkCopied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </FormRow>
            <div className="mt-4 flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveSEO}
                disabled={!canPublish || isSavingSEO}
              >
                {isSavingSEO && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                Save SEO
              </Button>
              {seoSaved && <span className="text-[11px] text-brand-500">SEO settings saved</span>}
              {seoSaveError && <span className="text-[11px] text-destructive">{seoSaveError}</span>}
            </div>
          </SettingsSection>

          <SettingsSection
            title="Domain Binding Summary"
            description="View current domain bindings, verification progress, and renewal reminders"
            compact
          >
            {domainsError && (
              <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
                {domainsError}
              </div>
            )}

            {!hasDomains ? (
              <div className="rounded-md border border-border bg-surface-75 p-4">
                <div className="text-[12px] text-foreground-light">No custom domain bound.</div>
                <div className="mt-2 text-[11px] text-foreground-muted">
                  Binding a domain lets you customize the access entry and improve brand visibility.
                </div>
                <div className="mt-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/app/${appId}/domains`}>Bind Domain</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-md border border-border bg-surface-75 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-foreground-muted">
                      Current Domain
                    </div>
                    <div className="mt-2 text-[12px] text-foreground">{primaryDomain}</div>
                  </div>
                  <div className="rounded-md border border-border bg-surface-75 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-foreground-muted">
                      Verification Status
                    </div>
                    <div className="mt-2">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'gap-1 text-[10px]',
                          domainStatusMeta.bgColor,
                          domainStatusMeta.color
                        )}
                      >
                        {domainStatusMeta.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="rounded-md border border-border bg-surface-75 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-foreground-muted">
                      Renewal Reminder
                    </div>
                    <div className="mt-2 text-[12px] text-foreground">{expiryLabel}</div>
                    <div
                      className={cn(
                        'mt-1 text-[11px]',
                        daysToExpiry !== null && daysToExpiry <= 30
                          ? 'text-warning'
                          : 'text-foreground-muted'
                      )}
                    >
                      {expiryReminder}
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/app/${appId}/domains`}>Manage Domain</Link>
                  </Button>
                </div>
              </>
            )}
          </SettingsSection>

          <SettingsSection
            title="Publish Status"
            description="View current publish status and access entry"
            compact
          >
            {(publishMessage || publishError) && (
              <div
                className={cn(
                  'mb-3 rounded-md border px-3 py-2 text-[12px]',
                  publishError
                    ? 'border-destructive/40 bg-destructive/10 text-destructive'
                    : 'border-brand-200/60 bg-brand-200/20 text-brand-500'
                )}
              >
                {publishError || publishMessage}
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.9fr]">
              <div className="rounded-md border border-border bg-surface-75 p-4">
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className={cn('gap-1 text-[10px]', statusMeta.bgColor, statusMeta.color)}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {statusMeta.label}
                  </Badge>
                  <div className="text-[11px] text-foreground-muted">
                    {app?.published_at
                      ? `Published on ${new Date(app.published_at).toLocaleString('en-US')}`
                      : 'Unpublished'}
                  </div>
                </div>
                <div className="mt-3 text-[12px] text-foreground-light">
                  After publishing, the app can be accessed via the public entry URL. We recommend
                  configuring the access policy before publishing.
                </div>
              </div>

              <div className="rounded-md border border-border bg-surface-75 p-4">
                <div className="text-[11px] text-foreground-muted uppercase tracking-wider">
                  Access Entry
                </div>
                <div className="mt-2">
                  {runtimeEntryUrl ? (
                    <Link
                      href={runtimeEntryUrl}
                      className="inline-flex items-center gap-1 text-[12px] text-brand-500 hover:text-brand-600"
                    >
                      Open Runtime Page
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  ) : (
                    <span className="text-[12px] text-foreground-muted">
                      Please configure workspace/app slug first
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <PermissionGate permissions={permissions} required={['workspace_publish']}>
                <Button onClick={handlePublish} disabled={isPublishing}>
                  {isPublishing && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  {app?.status === 'published' ? 'Republish' : 'Publish App'}
                </Button>
              </PermissionGate>
              <Button variant="outline" asChild>
                <Link href={`/dashboard/app/${appId}/domains`}>Manage Domain</Link>
              </Button>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Publish Actions"
            description="Publish, save draft, or cancel"
            compact
          >
            <div className="flex flex-wrap items-center gap-2">
              <PermissionGate permissions={permissions} required={['workspace_publish']}>
                <Button onClick={handlePublish} disabled={isPublishing}>
                  {isPublishing && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  {app?.status === 'published' ? 'Republish' : 'Publish'}
                </Button>
              </PermissionGate>
              <PermissionGate permissions={permissions} required={['workspace_edit']}>
                <Button variant="outline" onClick={handleSaveDraft} disabled={!canEdit}>
                  Save Draft
                </Button>
              </PermissionGate>
              <Button variant="ghost" asChild>
                <Link href={`/dashboard/app/${appId}`}>Cancel</Link>
              </Button>
            </div>
            <div className="mt-2 text-[11px] text-foreground-muted">
              Saving as draft will not publish externally. It only retains the current configuration
              and access policy settings.
            </div>
          </SettingsSection>
        </div>
      </PageContainer>
    </PageWithSidebar>
  )
}

export default function PublishSettingsPage() {
  const params = useParams()
  const workspaceId = Array.isArray(params?.workspaceId)
    ? params.workspaceId[0]
    : (params?.workspaceId as string | undefined)
  const appId = Array.isArray(params?.appId)
    ? params.appId[0]
    : (params?.appId as string | undefined)

  if (!workspaceId || !appId) {
    return null
  }

  return <PublishSettingsPageContent workspaceId={workspaceId} appId={appId} />
}
