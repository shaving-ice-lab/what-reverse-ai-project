'use client'

/**
 * Webhook management – configure endpoints and event subscriptions.
 */

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Webhook,
  Plus,
  Search,
  Copy,
  Check,
  MoreHorizontal,
  Settings,
  Trash2,
  RefreshCw,
  Play,
  Pause,
  Eye,
  EyeOff,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Code,
  ExternalLink,
  ChevronDown,
  Filter,
  ArrowRight,
  Shield,
  Key,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

// Webhook Data
const webhooks = [
  {
    id: 'wh-1',
    name: 'Workflow Completion Notifications',
    url: 'https://api.example.com/webhooks/workflow-complete',
    events: ['workflow.completed', 'workflow.failed'],
    status: 'active',
    createdAt: '2026-01-15',
    lastTriggered: '10 min ago',
    successRate: 98.5,
    totalDeliveries: 1234,
    recentDeliveries: [
      { status: 'success', time: '10 min ago' },
      { status: 'success', time: '1 hour ago' },
      { status: 'failed', time: '2 hours ago' },
      { status: 'success', time: '3 hours ago' },
      { status: 'success', time: '5 hours ago' },
    ],
  },
  {
    id: 'wh-2',
    name: 'Agent Conversation Callback',
    url: 'https://api.example.com/webhooks/agent-conversation',
    events: ['agent.conversation.started', 'agent.conversation.ended'],
    status: 'active',
    createdAt: '2026-01-20',
    lastTriggered: '30 min ago',
    successRate: 100,
    totalDeliveries: 567,
    recentDeliveries: [
      { status: 'success', time: '30 min ago' },
      { status: 'success', time: '1 hour ago' },
      { status: 'success', time: '2 hours ago' },
    ],
  },
  {
    id: 'wh-3',
    name: 'Team Member Changes',
    url: 'https://slack.com/api/webhooks/team-changes',
    events: ['team.member.added', 'team.member.removed'],
    status: 'paused',
    createdAt: '2026-01-10',
    lastTriggered: '2 days ago',
    successRate: 95.2,
    totalDeliveries: 89,
    recentDeliveries: [
      { status: 'success', time: '2 days ago' },
      { status: 'failed', time: '3 days ago' },
    ],
  },
  {
    id: 'wh-4',
    name: 'Billing Events',
    url: 'https://billing.example.com/webhooks/events',
    events: ['billing.subscription.created', 'billing.payment.success', 'billing.payment.failed'],
    status: 'active',
    createdAt: '2026-01-05',
    lastTriggered: 'Yesterday',
    successRate: 100,
    totalDeliveries: 45,
    recentDeliveries: [
      { status: 'success', time: 'Yesterday' },
      { status: 'success', time: '3 days ago' },
    ],
  },
]

// Available events for subscription
const availableEvents = [
  {
    group: 'Workflow',
    events: [
      'workflow.created',
      'workflow.updated',
      'workflow.deleted',
      'workflow.completed',
      'workflow.failed',
      'workflow.started',
    ],
  },
  {
    group: 'Agent',
    events: [
      'agent.created',
      'agent.updated',
      'agent.deleted',
      'agent.conversation.started',
      'agent.conversation.ended',
    ],
  },
  {
    group: 'Team',
    events: ['team.member.added', 'team.member.removed', 'team.member.role.changed'],
  },
  {
    group: 'Billing',
    events: [
      'billing.subscription.created',
      'billing.subscription.cancelled',
      'billing.payment.success',
      'billing.payment.failed',
    ],
  },
  { group: 'File', events: ['file.uploaded', 'file.deleted', 'file.shared'] },
]

// Status Config
const statusConfig = {
  active: { label: 'Active', color: 'text-brand-500', bg: 'bg-brand-200', dot: 'bg-brand-500' },
  paused: {
    label: 'Paused',
    color: 'text-foreground-light',
    bg: 'bg-surface-200',
    dot: 'bg-warning',
  },
  error: {
    label: 'Error',
    color: 'text-destructive',
    bg: 'bg-destructive-200',
    dot: 'bg-destructive',
  },
}

export default function WebhooksPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Copy URL
  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Filter
  const filteredWebhooks = webhooks.filter(
    (wh) =>
      wh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wh.url.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeCount = webhooks.filter((wh) => wh.status === 'active').length

  return (
    <div className="min-h-full bg-background-studio">
      {/* Page Header */}
      <div className="border-b border-border bg-background-studio/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center">
                <Webhook className="w-4 h-4 text-foreground-light" />
              </div>
              <div>
                <p className="page-caption">Integrations</p>
                <h1 className="text-page-title text-foreground">Webhook management</h1>
                <p className="text-description">
                  Configure event subscription and callback endpoint.
                </p>
              </div>
            </div>

            <Button
              className="bg-brand-500 hover:bg-brand-600 text-background"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Create Webhook
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="page-grid grid-cols-2 md:grid-cols-4">
            <div className="page-panel p-4">
              <p className="text-[13px] text-foreground-light mb-1">Total endpoints</p>
              <p className="text-xl font-semibold text-foreground">{webhooks.length}</p>
            </div>
            <div className="page-panel p-4">
              <p className="text-[13px] text-foreground-light mb-1">Active</p>
              <p className="text-xl font-semibold text-brand-500">{activeCount}</p>
            </div>
            <div className="page-panel p-4">
              <p className="text-[13px] text-foreground-light mb-1">Today's triggers</p>
              <p className="text-xl font-semibold text-foreground">156</p>
            </div>
            <div className="page-panel p-4">
              <p className="text-[13px] text-foreground-light mb-1">Success Rate</p>
              <p className="text-xl font-semibold text-foreground">98.7%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <div className="page-divider" />
        {/* Search */}
        <div className="page-panel p-4 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <Input
              placeholder="Search webhooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-surface-200 border-border text-foreground placeholder:text-foreground-muted focus:border-brand-400"
            />
          </div>
        </div>

        {/* Webhook List */}
        {filteredWebhooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-md bg-surface-200 flex items-center justify-center mb-4">
              <Webhook className="w-6 h-6 text-foreground-muted" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-2">No webhooks</h3>
            <p className="text-[13px] text-foreground-light mb-4">
              Create a webhook to receive event notifications.
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-brand-500 hover:bg-brand-600 text-background"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create webhook
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWebhooks.map((webhook) => {
              const status = statusConfig[webhook.status as keyof typeof statusConfig]

              return (
                <div
                  key={webhook.id}
                  className="p-5 rounded-md bg-surface-100 border border-border hover:border-border-strong transition-supabase"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-2 h-2 rounded-full', status.dot)} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-foreground">{webhook.name}</h3>
                          <Badge
                            variant="secondary"
                            className={cn('text-xs', status.bg, status.color)}
                          >
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-foreground-muted mt-0.5">
                          Created at {webhook.createdAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSelectedWebhook(selectedWebhook === webhook.id ? null : webhook.id)
                        }
                        className="border-border text-foreground-light"
                      >
                        {selectedWebhook === webhook.id ? 'Collapse' : 'Details'}
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 ml-1 transition-transform',
                            selectedWebhook === webhook.id && 'rotate-180'
                          )}
                        />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-border text-foreground-light"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Settings className="w-4 h-4 mr-2" />
                            Edit Config
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Play className="w-4 h-4 mr-2" />
                            Test Send
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            {webhook.status === 'active' ? (
                              <>
                                <Pause className="w-4 h-4 mr-2" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Enable
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* URL */}
                  <div className="flex items-center gap-2 p-3 rounded-md bg-surface-200 mb-4">
                    <Code className="w-4 h-4 text-foreground-muted shrink-0" />
                    <code className="flex-1 text-[13px] text-foreground truncate font-mono">
                      {webhook.url}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(webhook.id, webhook.url)}
                      className="text-foreground-light hover:text-foreground"
                    >
                      {copiedId === webhook.id ? (
                        <Check className="w-4 h-4 text-brand-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* Event Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {webhook.events.map((event) => (
                      <Badge
                        key={event}
                        variant="secondary"
                        className="text-xs font-mono bg-surface-200 text-foreground-light"
                      >
                        {event}
                      </Badge>
                    ))}
                  </div>

                  {/* Statistics Info */}
                  <div className="flex items-center gap-6 text-[13px] text-foreground-light">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Last Trigger: {webhook.lastTriggered}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-brand-500" />
                      Success Rate: {webhook.successRate}%
                    </span>
                    <span>total: {webhook.totalDeliveries.toLocaleString()} times</span>
                  </div>

                  {/* Expanded Details */}
                  {selectedWebhook === webhook.id && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <h4 className="text-[13px] font-medium text-foreground mb-3">
                        Recent Records
                      </h4>
                      <div className="space-y-2">
                        {webhook.recentDeliveries.map((delivery, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-2 rounded-md bg-surface-75"
                          >
                            {delivery.status === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 text-brand-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-destructive" />
                            )}
                            <span
                              className={cn(
                                'text-[13px]',
                                delivery.status === 'success'
                                  ? 'text-brand-500'
                                  : 'text-destructive'
                              )}
                            >
                              {delivery.status === 'success' ? 'Success' : 'Failed'}
                            </span>
                            <span className="text-[13px] text-foreground-muted">
                              {delivery.time}
                            </span>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 border-border text-foreground-light"
                      >
                        View All Logs
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Document Link */}
        <div className="mt-8 p-5 rounded-md bg-surface-75 border border-border">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-md bg-brand-200 flex items-center justify-center shrink-0">
              <Code className="w-4 h-4 text-brand-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-foreground mb-1">
                Webhook development guide
              </h3>
              <p className="text-[13px] text-foreground-light mb-3">
                How to configure and process webhook events, including signature verification and
                retry mechanism.
              </p>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" className="border-border text-foreground-light">
                  <Code className="w-4 h-4 mr-1" />
                  View documentation
                </Button>
                <Button variant="outline" size="sm" className="border-border text-foreground-light">
                  <Shield className="w-4 h-4 mr-1" />
                  Security best practices
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Webhook Modal */}
      {showCreateModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto bg-surface-100 rounded-md border border-border z-50 max-h-[80vh] overflow-auto">
            <div className="p-5 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Create Webhook</h2>
              <p className="text-[13px] text-foreground-light">
                Configure a new event subscription endpoint.
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-foreground mb-2">Name</label>
                <Input
                  placeholder="e.g., Workflow done notifications"
                  className="h-9 bg-surface-200 border-border"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-foreground mb-2">
                  Endpoint URL
                </label>
                <Input
                  placeholder="https://your-server.com/webhook"
                  className="h-9 bg-surface-200 border-border"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-foreground mb-2">
                  Subscription events
                </label>
                <div className="space-y-4 max-h-48 overflow-auto p-3 rounded-md bg-surface-200">
                  {availableEvents.map((group) => (
                    <div key={group.group}>
                      <p className="text-xs font-medium text-foreground-muted mb-2">
                        {group.group}
                      </p>
                      <div className="space-y-2">
                        {group.events.map((event) => (
                          <label key={event} className="flex items-center gap-2">
                            <Checkbox />
                            <span className="text-[13px] font-mono text-foreground">{event}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-foreground mb-2">
                  Secret (optional)
                </label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Used to verify request signature"
                    className="flex-1 h-9 bg-surface-200 border-border"
                  />
                  <Button variant="outline" className="border-border text-foreground-light">
                    <Key className="w-4 h-4 mr-1" />
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-foreground-muted mt-1">
                  Used to verify webhook request identity
                </p>
              </div>
            </div>

            <div className="p-5 border-t border-border flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="border-border text-foreground-light"
              >
                Cancel
              </Button>
              <Button className="bg-brand-500 hover:bg-brand-600 text-background">
                Create Webhook
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
