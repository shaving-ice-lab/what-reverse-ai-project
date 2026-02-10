'use client'

/**
 * Integration Marketplace Page
 * Showcases available third-party service integrations and plugins
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageContainer, PageHeader } from '@/components/dashboard/page-layout'
import { Download, ExternalLink, Key, Plus, Search, Settings, Star } from 'lucide-react'

// Collection filter (for Supabase Integrations)
const collections = [
  { id: 'all', label: 'All' },
  { id: 'wrappers', label: 'Wrappers' },
  { id: 'modules', label: 'Postgres Modules' },
  { id: 'graphql', label: 'GraphQL' },
  { id: 'vault', label: 'Vault beta' },
]

const collectionLabelMap = new Map(
  collections.map((collection) => [collection.id, collection.label])
)

const releaseBadgeLabel = {
  alpha: 'Alpha',
  beta: 'Beta',
} as const

const releaseBadgeVariant = {
  alpha: 'info',
  beta: 'warning',
} as const

// Integration data
const integrations = [
  {
    id: 'cron',
    name: 'Cron',
    description: 'Schedule tasks, drive processes and automation triggers.',
    collection: 'modules',
    icon: '⏱️',
    color: 'bg-surface-200',
    official: true,
    installed: true,
    popular: true,
    installs: 8600,
    rating: 4.8,
    features: ['Scheduled Tasks', 'Timezone Scheduling', 'Retry on Failure'],
  },
  {
    id: 'queues',
    name: 'Queues',
    description: 'Message queue for workflow tasks with latency and concurrency control.',
    collection: 'modules',
    icon: '📦',
    color: 'bg-surface-200',
    official: true,
    installed: false,
    popular: true,
    installs: 9200,
    rating: 4.7,
    features: ['Latency Queue', 'Concurrency Control', 'Retry Policy'],
  },
  {
    id: 'db-webhooks',
    name: 'Database Webhooks',
    description:
      'Database events are pushed in real time to external systems or workflow endpoints.',
    collection: 'modules',
    icon: '🔗',
    color: 'bg-surface-200',
    official: true,
    installed: false,
    popular: true,
    installs: 6800,
    rating: 4.6,
    features: ['Event Subscription', 'Payload Validation', 'Replay Protection'],
  },
  {
    id: 'graphql',
    name: 'GraphQL',
    description: 'Query workflow data with GraphQL and an interactive IDE.',
    collection: 'graphql',
    icon: '🔺',
    color: 'bg-surface-200',
    official: true,
    installed: true,
    popular: true,
    installs: 10400,
    rating: 4.8,
    features: ['Schema Generation', 'GraphiQL', 'Permission Control'],
  },
  {
    id: 'vault',
    name: 'Vault',
    description: 'App encryption and key management, protect sensitive data.',
    collection: 'vault',
    icon: '🛡️',
    color: 'bg-surface-200',
    official: true,
    release: 'beta',
    installed: true,
    popular: false,
    installs: 3500,
    rating: 4.4,
    features: ['Key Rotation', 'Field Encryption', 'Audit Log'],
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'AI workflow and Slack integration; auto-send notifications and messages.',
    collection: 'wrappers',
    icon: '🔔',
    color: 'bg-surface-200',
    official: true,
    installed: true,
    popular: true,
    installs: 12500,
    rating: 4.8,
    features: ['Message Notifications', 'Workflow Triggers', 'Channel Management'],
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Connect Google Drive and auto-sync files and documents.',
    collection: 'wrappers',
    icon: '📁',
    color: 'bg-surface-200',
    official: true,
    installed: true,
    popular: true,
    installs: 18200,
    rating: 4.9,
    features: ['File Sync', 'Auto Backup', 'Permission Management'],
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Notion database integration; auto-update and create pages.',
    collection: 'wrappers',
    icon: '📝',
    color: 'bg-surface-200',
    official: true,
    installed: false,
    popular: true,
    installs: 15800,
    rating: 4.7,
    features: ['Database Sync', 'Page Creation', 'Content Export'],
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Connect GitHub; automate code review and issue management.',
    collection: 'wrappers',
    icon: '🐙',
    color: 'bg-surface-200',
    official: true,
    installed: false,
    popular: true,
    installs: 9800,
    rating: 4.6,
    features: ['Code Review', 'Issue Automation', 'PR Management'],
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Salesforce CRM integration; automate customer data management.',
    collection: 'wrappers',
    icon: '☁️',
    color: 'bg-surface-200',
    official: false,
    release: 'beta',
    installed: false,
    popular: false,
    installs: 5200,
    rating: 4.5,
    features: ['Customer Sync', 'Sales Automation', 'Report Generation'],
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect to thousands of apps via Zapier.',
    collection: 'wrappers',
    icon: '⚡',
    color: 'bg-surface-200',
    official: true,
    installed: true,
    popular: true,
    installs: 22000,
    rating: 4.8,
    features: ['Multi-App Connect', 'Automation Workflows', 'Conditional Triggers'],
  },
  {
    id: 'airtable',
    name: 'Airtable',
    description: 'Airtable database integration; manage structured data.',
    collection: 'wrappers',
    icon: '📊',
    color: 'bg-surface-200',
    official: false,
    release: 'beta',
    installed: false,
    popular: false,
    installs: 7600,
    rating: 4.6,
    features: ['Data Sync', 'Table Management', 'View Customization'],
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'AI assistant integration for Discord.',
    collection: 'wrappers',
    icon: '🎮',
    color: 'bg-surface-200',
    official: false,
    installed: false,
    popular: false,
    installs: 6400,
    rating: 4.4,
    features: ['Bot Integration', 'Message Automation', 'Channel Management'],
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    description: 'Automate Google Sheets data processing and analytics.',
    collection: 'wrappers',
    icon: '📈',
    color: 'bg-surface-200',
    official: true,
    installed: true,
    popular: true,
    installs: 14200,
    rating: 4.7,
    features: ['Data Import', 'Automation', 'Report Generation'],
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Jira integration; automate item and issue tracking.',
    collection: 'wrappers',
    icon: '📋',
    color: 'bg-surface-200',
    official: false,
    release: 'alpha',
    installed: false,
    popular: false,
    installs: 4800,
    rating: 4.5,
    features: ['Issue Sync', 'Sprint Management', 'Report Generation'],
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Automate email marketing and user list management.',
    collection: 'wrappers',
    icon: '📧',
    color: 'bg-surface-200',
    official: false,
    installed: false,
    popular: false,
    installs: 3200,
    rating: 4.3,
    features: ['Email Automation', 'User Groups', 'Marketing Campaigns'],
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'CRM and marketing automation integration.',
    collection: 'wrappers',
    icon: '🟠',
    color: 'bg-surface-200',
    official: false,
    release: 'beta',
    installed: false,
    popular: false,
    installs: 4100,
    rating: 4.4,
    features: ['Customer Management', 'Marketing Automation', 'Sales Analytics'],
  },
]

export default function IntegrationsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCollection, setSelectedCollection] = useState('all')

  // Filter integrations
  const filteredIntegrations = useMemo(() => {
    return integrations.filter((integration) => {
      const matchesSearch =
        integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        integration.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCollection =
        selectedCollection === 'all' || integration.collection === selectedCollection

      return matchesSearch && matchesCollection
    })
  }, [searchQuery, selectedCollection])

  const installedCount = integrations.filter((i) => i.installed).length
  const totalCount = integrations.length
  const filteredCount = filteredIntegrations.length
  const activeCollectionLabel = collectionLabelMap.get(selectedCollection) ?? 'All'
  const installedIntegrations = integrations.filter((i) => i.installed)
  const collectionCounts = useMemo(() => {
    const counts: Record<string, number> = { all: integrations.length }
    integrations.forEach((integration) => {
      counts[integration.collection] = (counts[integration.collection] ?? 0) + 1
    })
    return counts
  }, [])

  return (
    <PageContainer className="dashboard-page">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Integrations"
          title="Extend your database"
          description="Manage connections, permissions, and automation triggers for your team and community."
          actions={
            <div className="page-toolbar">
              <Button variant="outline" size="sm" leftIcon={<Settings className="h-4 w-4" />}>
                Manage Integrations
              </Button>
              <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                Add Integration
              </Button>
            </div>
          }
        >
          <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
            <Badge variant="secondary" size="xs">
              {installedCount} Connected
            </Badge>
            <Badge variant="outline" size="xs">
              {totalCount} Total
            </Badge>
            <Badge variant="outline" size="xs">
              {filteredCount} Filtered
            </Badge>
          </div>
        </PageHeader>

        <div className="page-grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="page-panel p-4">
            <div className="text-xs text-foreground-light">Connected</div>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-stat-number text-foreground">{installedCount}</span>
              <span className="text-[11px] text-foreground-muted">Integrations</span>
            </div>
            <p className="mt-2 text-[11px] text-foreground-muted">Plugins enabled for your team</p>
          </div>
          <div className="page-panel p-4">
            <div className="text-xs text-foreground-light">Total integrations</div>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-stat-number text-foreground">{totalCount}</span>
              <span className="text-[11px] text-foreground-muted">Available</span>
            </div>
            <p className="mt-2 text-[11px] text-foreground-muted">
              Connections maintained by the team and community
            </p>
          </div>
          <div className="page-panel p-4">
            <div className="text-xs text-foreground-light">Current filter</div>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-stat-number text-foreground">{filteredCount}</span>
              <span className="text-[11px] text-foreground-muted">Results</span>
            </div>
            <p className="mt-2 text-[11px] text-foreground-muted">
              Auto-updates based on category and search filters
            </p>
          </div>
        </div>

        <div className="page-divider" />

        <section className="page-grid lg:grid-cols-[220px_minmax(0,1fr)_320px]">
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="page-panel">
              <div className="page-panel-header">
                <p className="page-panel-title">Collections</p>
              </div>
              <div className="p-3 space-y-1">
                {collections.map((collection) => {
                  const isActive = selectedCollection === collection.id
                  return (
                    <button
                      key={collection.id}
                      type="button"
                      onClick={() => setSelectedCollection(collection.id)}
                      className={cn(
                        'relative flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors',
                        isActive
                          ? 'bg-surface-200 text-foreground before:absolute before:left-0 before:top-1/2 before:h-4 before:w-[2px] before:-translate-y-1/2 before:rounded-full before:bg-brand-500'
                          : 'text-foreground-muted hover:bg-surface-200/60 hover:text-foreground'
                      )}
                    >
                      <span>{collection.label}</span>
                      <span className="rounded-full bg-surface-200 px-1.5 py-0.5 text-[10px] text-foreground-muted">
                        {collectionCounts[collection.id] ?? 0}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </aside>
          <div className="space-y-4">
            <div className="page-panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Integration catalog</h2>
                  <p className="text-xs text-foreground-light">
                    Compatible plugins and community connectors, suitable for any team size and
                    deployment model.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" size="xs">
                    Showing {filteredCount}
                  </Badge>
                  <Badge variant="outline" size="xs">
                    {activeCollectionLabel}
                  </Badge>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="w-full max-w-sm">
                  <Input
                    variant="search"
                    placeholder="Search integrations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftIcon={<Search className="h-4 w-4" />}
                  />
                </div>
                <span className="text-xs text-foreground-muted">Search by name or description</span>
              </div>
            </div>

            {filteredIntegrations.length === 0 ? (
              <div className="rounded-md border border-dashed border-border-muted bg-surface-100/60 px-6 py-12 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface-200">
                  <Search className="h-4 w-4 text-foreground-muted" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">
                  No matching integrations
                </h3>
                <p className="mt-1 text-xs text-foreground-light">
                  Try adjusting your keywords or switching category.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-5 border-border-muted text-foreground-light hover:text-foreground hover:bg-surface-200"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCollection('all')
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="page-grid md:grid-cols-2 xl:grid-cols-3">
                {filteredIntegrations.map((integration) => {
                  const collectionLabel = collectionLabelMap.get(integration.collection) ?? 'Other'
                  return (
                    <div
                      key={integration.id}
                      className={cn(
                        'group flex h-full flex-col rounded-md border p-4 transition-supabase hover:border-border-strong hover:bg-surface-75',
                        integration.installed
                          ? 'border-brand-500/30 bg-brand-200/10'
                          : 'border-border bg-surface-100'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface-200 text-xl',
                            integration.color
                          )}
                        >
                          {integration.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">
                              {integration.name}
                            </h3>
                            <Badge variant="outline" size="xs">
                              {collectionLabel}
                            </Badge>
                            {integration.official && (
                              <Badge variant="secondary" size="xs">
                                Official
                              </Badge>
                            )}
                            {integration.installed && (
                              <Badge variant="primary" size="xs">
                                Installed
                              </Badge>
                            )}
                            {integration.release && (
                              <Badge size="xs" variant={releaseBadgeVariant[integration.release]}>
                                {releaseBadgeLabel[integration.release]}
                              </Badge>
                            )}
                            {integration.popular && (
                              <Badge variant="warning" size="xs">
                                Popular
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-foreground-muted line-clamp-2">
                            {integration.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {integration.features.slice(0, 3).map((feature) => (
                          <span
                            key={feature}
                            className="rounded-full bg-surface-200 px-2.5 py-0.5 text-[11px] text-foreground-muted"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs text-foreground-muted">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-warning fill-warning" />
                            {integration.rating}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {(integration.installs / 1000).toFixed(1)}k
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {integration.installed ? (
                            <Button
                              size="xs"
                              variant="outline"
                              className="border-border-muted text-foreground-light hover:text-foreground hover:bg-surface-200"
                            >
                              Manage
                            </Button>
                          ) : (
                            <Button
                              size="xs"
                              variant="outline"
                              className="border-border-muted text-foreground-light hover:text-foreground hover:bg-surface-200"
                            >
                              Install
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="icon-xs"
                            className="border-border-muted text-foreground-muted hover:text-foreground hover:bg-surface-200"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="page-panel">
              <div className="page-panel-header flex items-center justify-between">
                <div>
                  <h3 className="page-panel-title">Connected</h3>
                  <p className="page-panel-description">
                    Integrations and authorization status currently in use by your team.
                  </p>
                </div>
                <Badge variant="secondary" size="xs">
                  {installedCount}
                </Badge>
              </div>

              <div className="p-5">
                {installedIntegrations.length === 0 ? (
                  <p className="text-xs text-foreground-muted">No integrations connected.</p>
                ) : (
                  <div className="space-y-3">
                    {installedIntegrations.map((integration) => {
                      const collectionLabel =
                        collectionLabelMap.get(integration.collection) ?? 'Other'
                      return (
                        <div
                          key={integration.id}
                          className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-200/60 px-3 py-2"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface-200 text-lg',
                                integration.color
                              )}
                            >
                              {integration.icon}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {integration.name}
                              </p>
                              <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-foreground-muted">
                                <span>{collectionLabel}</span>
                                {integration.release && (
                                  <span className="rounded-full bg-surface-200 px-2 py-0.5 text-[10px] text-foreground-muted">
                                    {releaseBadgeLabel[integration.release]}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-border text-foreground-light hover:text-foreground hover:bg-surface-200"
                          >
                            Manage
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="page-panel">
              <div className="page-panel-header">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-200">
                    <Key className="h-4 w-4 text-foreground-muted" />
                  </div>
                  <div>
                    <h3 className="page-panel-title">API Keys & Permissions</h3>
                    <p className="page-panel-description">
                      Create keys and manage permissions for integration and webhook calls.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-5 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border-muted text-foreground-light hover:text-foreground hover:bg-surface-200"
                  asChild
                >
                  <Link href="/dashboard/settings/api-keys">Manage API Keys</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border-muted text-foreground-light hover:text-foreground hover:bg-surface-200"
                >
                  View Permission Docs
                </Button>
              </div>
            </div>
            <div className="page-panel">
              <div className="page-panel-header">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-200">
                    <span className="text-base text-brand-500">✦</span>
                  </div>
                  <div>
                    <h3 className="page-panel-title">Custom integration</h3>
                    <p className="page-panel-description">
                      Use APIs, webhooks, and queue tasks to connect systems to your workflows.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-5 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border-muted text-foreground-light hover:text-foreground hover:bg-surface-200"
                >
                  View Docs
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border-muted text-foreground-light hover:text-foreground hover:bg-surface-200"
                >
                  Create Webhook
                </Button>
              </div>
            </div>

            <div className="page-panel">
              <div className="page-panel-header">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-200">
                    <span className="text-base text-foreground-muted">◎</span>
                  </div>
                  <div>
                    <h3 className="page-panel-title">Permissions and security</h3>
                    <p className="page-panel-description">
                      All integrations use a minimum-permission policy and support real-time access
                      revocation.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-2 text-xs text-foreground-muted">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  OAuth scopes are transparently displayed and reviewed
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  Integration keys support auto-rotation and alerts
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  Logs used for audit tracking
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </PageContainer>
  )
}
