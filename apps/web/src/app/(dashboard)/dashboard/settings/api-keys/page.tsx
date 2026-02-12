'use client'

/**
 * API Key Management Page
 */

import React, { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'
import {
  Key,
  Trash2,
  Copy,
  Plus,
  CheckCircle2,
  AlertCircle,
  Zap,
  Activity,
  RefreshCw,
  PlayCircle,
  Loader2,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useConfirmDialog } from '@/components/ui/confirm-dialog'
import { AddApiKeyDialog } from '@/components/settings/add-api-key-dialog'
import { Badge } from '@/components/ui/badge'
import { PageContainer, PageHeader } from '@/components/dashboard/page-layout'
import { apiKeysApi } from '@/lib/api/api-keys'
import { PROVIDER_CONFIGS, type ApiKey, type ApiKeyStatus } from '@/types/api-key'
import { cn } from '@/lib/utils'

// Status text mapping
const statusLabels: Record<ApiKeyStatus, string> = {
  active: 'Normal',
  expired: 'Expired',
  revoked: 'Revoked',
}

// Default daily usage statistics (Past 7 days)
const defaultDailyUsage = [
  { day: 'Mon', calls: 0, tokens: 0, cost: 0 },
  { day: 'Tue', calls: 0, tokens: 0, cost: 0 },
  { day: 'Wed', calls: 0, tokens: 0, cost: 0 },
  { day: 'Thu', calls: 0, tokens: 0, cost: 0 },
  { day: 'Fri', calls: 0, tokens: 0, cost: 0 },
  { day: 'Sat', calls: 0, tokens: 0, cost: 0 },
  { day: 'Sun', calls: 0, tokens: 0, cost: 0 },
]

// Settings card component
function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="page-panel overflow-hidden mb-6">
      <div className="page-panel-header">
        <h2 className="page-panel-title">{title}</h2>
        {description && <p className="page-panel-description mt-1">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; message: string }>
  >({})
  const [dailyUsage] = useState(defaultDailyUsage)
  const { confirm, ConfirmDialog } = useConfirmDialog()

  // Calculate statistics data
  const stats = {
    totalKeys: apiKeys.length,
    activeKeys: apiKeys.filter((k) => k.status === 'active').length,
  }

  // Load key list
  const loadApiKeys = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const keys = await apiKeysApi.list()
      setApiKeys(keys)
    } catch (err) {
      console.error('Failed to load API keys:', err)
      setError(err instanceof Error ? err.message : 'Failed to load API keys')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadApiKeys()
  }, [loadApiKeys])

  // Test key
  const handleTestKey = async (apiKey: ApiKey) => {
    setTestingId(apiKey.id)
    setTestResults((prev) => {
      const newResults = { ...prev }
      delete newResults[apiKey.id]
      return newResults
    })

    try {
      const result = await apiKeysApi.test(apiKey.id)
      setTestResults((prev) => ({
        ...prev,
        [apiKey.id]: {
          success: result.valid,
          message: result.message || (result.valid ? 'Key format valid' : 'Key format invalid'),
        },
      }))
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [apiKey.id]: {
          success: false,
          message:
            err instanceof Error ? err.message : 'Failed to test API key. Please try again later.',
        },
      }))
    } finally {
      setTestingId(null)
    }
  }

  // Calculate bar chart maximum height
  const maxCalls = Math.max(...dailyUsage.map((d) => d.calls), 1)

  // Delete key
  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Key',
      description: 'After deletion, apps using this key will stop working. This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    })

    if (confirmed) {
      try {
        await apiKeysApi.delete(id)
        setApiKeys((prev) => prev.filter((k) => k.id !== id))
      } catch (err) {
        console.error('Delete failed:', err)
        setError(err instanceof Error ? err.message : 'Failed to delete API key')
      }
    }
  }

  // Copy key prefix
  const handleCopyPrefix = (key: ApiKey) => {
    navigator.clipboard.writeText(`${key.keyPrefix}...${key.keySuffix}`)
    setCopiedId(key.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <ConfirmDialog />

        <div className="space-y-3">
          <PageHeader
            eyebrow="Settings"
            title="API Key"
            description="Manage your AI service API keys"
            className="mb-0"
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={loadApiKeys}
                disabled={isLoading}
                className="border-border text-foreground-light"
              >
                <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
                Refresh
              </Button>
            }
          />
        </div>

        <div className="page-divider" />

        {/* Error notice */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-surface-200 border border-border text-foreground text-[13px] mb-6">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 text-xs"
              onClick={() => setError(null)}
            >
              Close
            </Button>
          </div>
        )}

        {/* Security notice */}
        <div className="flex items-start gap-3 p-4 rounded-md bg-surface-100 border border-border text-[13px]">
          <AlertCircle className="h-4 w-4 text-foreground-muted mt-0.5 shrink-0" />
          <div className="text-foreground-light">
            API keys are stored with AES-256 encryption and decrypted only when the AI Agent
            executes tasks. Keep your key safe.
          </div>
        </div>

        <SettingsSection
          title="Create key and permissions"
          description="Create a key and set minimum permission scope in integration settings"
        >
          <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-4">
            <div className="space-y-3 text-[12px] text-foreground-light">
              <p>1) Create Key: Create a key for each environment (Development / Production).</p>
              <p>2) Minimum permission: only model permission is required.</p>
              <p>3) Usage: Used by the AI Agent and app runtime to make API calls.</p>
            </div>
            <div className="rounded-md border border-border bg-surface-75 p-4">
              <div className="text-[11px] text-foreground-muted uppercase tracking-wider">
                Recommended Permissions
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {['Model Call', 'Agent Execute', 'Webhook Trigger', 'Read Statistics'].map(
                  (item) => (
                    <Badge key={item} variant="secondary" className="text-[10px]">
                      {item}
                    </Badge>
                  )
                )}
              </div>
              <div className="mt-3">
                <AddApiKeyDialog
                  trigger={
                    <Button size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-1.5" />
                      Create New Key
                    </Button>
                  }
                  onSuccess={loadApiKeys}
                />
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Key statistics */}
        <div className="page-grid grid-cols-2 gap-4">
          <div className="bg-surface-100 border border-border rounded-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-md bg-brand-200 flex items-center justify-center">
                <Zap className="h-4 w-4 text-brand-500" />
              </div>
            </div>
            <p className="text-xl font-semibold text-foreground">{stats.totalKeys}</p>
            <p className="text-xs text-foreground-muted mt-1">Total Keys</p>
          </div>
          <div className="bg-surface-100 border border-border rounded-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-md bg-brand-200 flex items-center justify-center">
                <Activity className="h-4 w-4 text-brand-500" />
              </div>
            </div>
            <p className="text-xl font-semibold text-foreground">{stats.activeKeys}</p>
            <p className="text-xs text-foreground-muted mt-1">Active Keys</p>
          </div>
        </div>

        {/* Usage trend chart */}
        <SettingsSection title="Usage Trend" description="API Call Statistics (Last 7 Days)">
          <div className="flex items-end justify-between gap-2 h-32 mb-4">
            {dailyUsage.map((day, index) => {
              const height = (day.calls / maxCalls) * 100
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-brand-500 rounded-t-md transition-all duration-300 hover:bg-brand-600 cursor-pointer relative group"
                    style={{ height: `${height}%`, minHeight: '8px' }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-100 border border-border rounded-md px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {day.calls} calls
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-foreground-muted border-t border-border pt-2">
            {dailyUsage.map((day, index) => (
              <span key={index} className="flex-1 text-center">
                {day.day}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-500" />
                <span className="text-xs text-foreground-muted">API Call Count</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-foreground-light">
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
              View Detailed Report
            </Button>
          </div>
        </SettingsSection>

        {/* Key list */}
        <SettingsSection
          title="Keys you've added"
          description="View and manage API keys you've added"
        >
          {isLoading ? (
            // Loading skeleton
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-surface-100/60 border border-border rounded-md px-4 py-3"
                >
                  <div className="w-9 h-9 rounded-md bg-surface-200 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-200 rounded animate-pulse w-1/4" />
                    <div className="h-3 bg-surface-200 rounded animate-pulse w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : apiKeys.length === 0 ? (
            // Empty State
            <div className="text-center py-12">
              <div className="w-14 h-14 mx-auto mb-4 rounded-md bg-surface-200 flex items-center justify-center">
                <Key className="h-6 w-6 text-foreground-muted" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1">No API Keys</h3>
              <p className="text-[13px] text-foreground-light mb-6">
                Add an API key to use the LLM Node
              </p>
              <AddApiKeyDialog
                trigger={
                  <Button className="bg-brand-500 hover:bg-brand-600 text-background">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Key
                  </Button>
                }
                onSuccess={loadApiKeys}
              />
            </div>
          ) : (
            // Key list
            <div className="space-y-3">
              {apiKeys.map((apiKey) => {
                const provider = PROVIDER_CONFIGS[apiKey.provider]
                const testResult = testResults[apiKey.id]
                const isTesting = testingId === apiKey.id

                return (
                  <div
                    key={apiKey.id}
                    className="bg-surface-100/60 border border-border rounded-md transition-all duration-200 hover:border-border-strong"
                  >
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-md bg-surface-100 flex items-center justify-center text-sm"
                          style={{ color: provider?.color || 'var(--foreground-muted)' }}
                        >
                          {provider?.icon || <Key className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-medium text-foreground">
                              {apiKey.name}
                            </span>
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-[10px] px-1.5 py-0',
                                apiKey.status === 'active' && 'bg-brand-200 text-brand-500',
                                apiKey.status === 'expired' &&
                                  'bg-surface-200 text-foreground-light',
                                apiKey.status === 'revoked' &&
                                  'bg-surface-200 text-foreground-muted'
                              )}
                            >
                              {statusLabels[apiKey.status]}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-foreground-muted mt-0.5">
                            <code className="font-mono">
                              {apiKey.keyPrefix}...{apiKey.keySuffix}
                            </code>
                            {apiKey.lastUsedAt && (
                              <span className="hidden sm:inline">
                                {formatDistanceToNow(new Date(apiKey.lastUsedAt), {
                                  addSuffix: true,
                                  locale: enUS,
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Test button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-foreground-muted hover:text-foreground"
                          onClick={() => handleTestKey(apiKey)}
                          disabled={isTesting}
                        >
                          {isTesting ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                              Test
                            </>
                          ) : (
                            <>
                              <PlayCircle className="w-3.5 h-3.5 mr-1.5" />
                              Test
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-foreground-muted hover:text-foreground"
                          onClick={() => handleCopyPrefix(apiKey)}
                        >
                          {copiedId === apiKey.id ? (
                            <CheckCircle2 className="w-4 h-4 text-brand-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-foreground-muted hover:text-foreground hover:bg-surface-200"
                          onClick={() => handleDelete(apiKey.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Test result */}
                    {testResult && (
                      <div
                        className={cn(
                          'px-4 py-2 border-t border-border text-xs flex items-center gap-2',
                          testResult.success
                            ? 'bg-brand-200 text-brand-500'
                            : 'bg-surface-200 text-foreground-light'
                        )}
                      >
                        {testResult.success ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5" />
                        )}
                        {testResult.message}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Add button */}
              <AddApiKeyDialog
                trigger={
                  <button className="w-full mt-4 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-md text-[13px] text-foreground-muted hover:border-brand-400 hover:text-foreground hover:bg-brand-200 transition-all duration-200 cursor-pointer">
                    <Plus className="w-4 h-4" />
                    Add API Key
                  </button>
                }
                onSuccess={loadApiKeys}
              />
            </div>
          )}
        </SettingsSection>

        {/* Supported providers */}
        <SettingsSection
          title="Supported Providers"
          description="We support the following AI service providers"
        >
          <div className="page-grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.values(PROVIDER_CONFIGS).map((provider) => (
              <div
                key={provider.id}
                className="flex items-center gap-2 p-3 rounded-md bg-surface-100/60 border border-border"
              >
                <span style={{ color: provider.color }}>{provider.icon}</span>
                <span className="text-[13px] text-foreground">{provider.name}</span>
              </div>
            ))}
          </div>
        </SettingsSection>
      </div>
    </PageContainer>
  )
}
