'use client'

/**
 * Ticket Details Page - Supabase Style
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  LifeBuoy,
  Loader2,
  MessageSquare,
  User,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  supportApi,
  type SupportQueue,
  type SupportTeam,
  type SupportTicket,
  type SupportTicketComment,
} from '@/lib/api/support'

type StatusHistoryItem = {
  from?: string
  to?: string
  note?: string
  at?: string
  actor_user_id?: string
}

const statusOptions = [
  { id: 'open', label: 'Pending' },
  { id: 'in_progress', label: 'Processing' },
  { id: 'waiting_on_customer', label: 'Waiting for User' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'closed', label: 'Closed' },
]

const statusStyleMap: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  open: {
    label: 'Pending',
    bg: 'bg-surface-200',
    color: 'text-foreground-light',
    dot: 'bg-foreground-muted',
  },
  in_progress: {
    label: 'Processing',
    bg: 'bg-warning-200',
    color: 'text-warning',
    dot: 'bg-warning',
  },
  waiting_on_customer: {
    label: 'Waiting for User',
    bg: 'bg-brand-200/60',
    color: 'text-brand-500',
    dot: 'bg-brand-500',
  },
  resolved: { label: 'Resolved', bg: 'bg-brand-200', color: 'text-brand-500', dot: 'bg-brand-500' },
  closed: {
    label: 'Closed',
    bg: 'bg-surface-200',
    color: 'text-foreground-muted',
    dot: 'bg-foreground-muted',
  },
}

const priorityStyleMap: Record<string, { label: string; bg: string; color: string }> = {
  critical: { label: 'Urgent', bg: 'bg-destructive-200', color: 'text-destructive' },
  high: { label: 'High', bg: 'bg-warning-200', color: 'text-warning' },
  normal: { label: 'Normal', bg: 'bg-brand-200', color: 'text-brand-500' },
  low: { label: 'Low', bg: 'bg-surface-200', color: 'text-foreground-muted' },
}

const formatDate = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const parseHistory = (ticket?: SupportTicket | null): StatusHistoryItem[] => {
  const raw = ticket?.metadata?.status_history
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const entry = item as Record<string, unknown>
      return {
        from: entry.from as string | undefined,
        to: entry.to as string | undefined,
        note: entry.note as string | undefined,
        at: entry.at as string | undefined,
        actor_user_id: entry.actor_user_id as string | undefined,
      }
    })
    .filter(Boolean) as StatusHistoryItem[]
}

export default function SupportTicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string)

  const [ticket, setTicket] = useState<SupportTicket | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusDraft, setStatusDraft] = useState('open')
  const [noteDraft, setNoteDraft] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [comments, setComments] = useState<SupportTicketComment[]>([])
  const [commentDraft, setCommentDraft] = useState('')
  const [commentInternal, setCommentInternal] = useState(true)
  const [commentLoading, setCommentLoading] = useState(false)
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [teams, setTeams] = useState<SupportTeam[]>([])
  const [queues, setQueues] = useState<SupportQueue[]>([])

  useEffect(() => {
    if (!ticketId) return
    let active = true
    setIsLoading(true)
    setErrorMessage(null)
    supportApi
      .adminGetTicket(ticketId)
      .then((res) => {
        if (!active) return
        setTicket(res.ticket)
        setStatusDraft(res.ticket?.status || 'open')
        setNoteDraft(res.ticket?.status_note || '')
      })
      .catch((error) => {
        if (!active) return
        setErrorMessage((error as Error).message || 'Failed to load ticket details')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [ticketId])

  useEffect(() => {
    if (!ticketId) return
    let active = true
    Promise.all([supportApi.adminListTeams(true), supportApi.adminListQueues(true)])
      .then(([teamRes, queueRes]) => {
        if (!active) return
        setTeams(teamRes.teams ?? [])
        setQueues(queueRes.queues ?? [])
      })
      .catch(() => {
        if (!active) return
      })
    return () => {
      active = false
    }
  }, [ticketId])

  useEffect(() => {
    if (!ticketId) return
    let active = true
    setCommentLoading(true)
    supportApi
      .adminListComments(ticketId)
      .then((res) => {
        if (!active) return
        setComments(res.comments ?? [])
      })
      .catch(() => {
        if (!active) return
      })
      .finally(() => {
        if (active) setCommentLoading(false)
      })
    return () => {
      active = false
    }
  }, [ticketId])

  const history = useMemo(() => parseHistory(ticket), [ticket])
  const teamLookup = useMemo(
    () => Object.fromEntries(teams.map((team) => [team.id, team.name])),
    [teams]
  )
  const queueLookup = useMemo(
    () => Object.fromEntries(queues.map((queue) => [queue.id, queue.name])),
    [queues]
  )
  const statusStyle = statusStyleMap[ticket?.status || 'open'] || statusStyleMap.open
  const priorityStyle = priorityStyleMap[ticket?.priority || 'normal'] || priorityStyleMap.normal
  const slaResponseOverdue =
    ticket?.sla_response_due_at &&
    ticket.status !== 'resolved' &&
    ticket.status !== 'closed' &&
    new Date(ticket.sla_response_due_at).getTime() < Date.now()
  const slaUpdateOverdue =
    ticket?.sla_update_due_at &&
    ticket.status !== 'resolved' &&
    ticket.status !== 'closed' &&
    new Date(ticket.sla_update_due_at).getTime() < Date.now()
  const slaResolveOverdue =
    ticket?.sla_resolve_due_at &&
    ticket.status !== 'resolved' &&
    ticket.status !== 'closed' &&
    new Date(ticket.sla_resolve_due_at).getTime() < Date.now()
  const assigneeLabel = useMemo(() => {
    if (!ticket?.assignee_value) return 'Not Yet Dispatched'
    const assigneeType = ticket.assignee_type || 'team'
    if (assigneeType === 'team') {
      return `${teamLookup[ticket.assignee_value] || ticket.assignee_value} · Team`
    }
    if (assigneeType === 'queue') {
      return `${queueLookup[ticket.assignee_value] || ticket.assignee_value} · Queue`
    }
    if (assigneeType === 'user') {
      return `${ticket.assignee_value} · User`
    }
    return `${assigneeType} · ${ticket.assignee_value}`
  }, [ticket, teamLookup, queueLookup])

  const submitStatusUpdate = async () => {
    if (!ticket) return
    setIsUpdating(true)
    try {
      const response = await supportApi.adminUpdateStatus(ticket.id, {
        status: statusDraft,
        note: noteDraft || undefined,
      })
      setTicket(response.ticket)
    } catch (error) {
      setErrorMessage((error as Error).message || 'Failed to Update')
    } finally {
      setIsUpdating(false)
    }
  }

  const submitComment = async () => {
    if (!ticket || commentDraft.trim() === '') return
    setCommentSubmitting(true)
    try {
      const response = await supportApi.adminCreateComment(ticket.id, {
        body: commentDraft.trim(),
        is_internal: commentInternal,
      })
      setComments((prev) => [...prev, response.comment])
      setCommentDraft('')
    } catch (error) {
      setErrorMessage((error as Error).message || 'Failed to submit comment')
    } finally {
      setCommentSubmitting(false)
    }
  }

  return (
    <div className="page-section p-6">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-border text-foreground-light hover:text-foreground"
            onClick={() => router.push('/dashboard/support-tickets')}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to List
          </Button>
          <div>
            <p className="page-caption">Support</p>
            <h1 className="page-title flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-brand-500" />
              Ticket Details
            </h1>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="page-panel py-16 text-center text-sm text-foreground-muted">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
          Loading...
        </div>
      ) : !ticket ? (
        <div className="page-panel py-16 text-center text-sm text-foreground-muted">
          Ticket Not Found
        </div>
      ) : (
        <div className="page-grid xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
          <div className="space-y-6">
            <div className="page-panel">
              <div className="page-panel-header">
                <h2 className="page-panel-title">{ticket.subject}</h2>
                <p className="page-panel-description">Number: {ticket.reference}</p>
              </div>
              <div className="p-5 space-y-3 text-sm text-foreground-light">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={cn('text-[11px] px-2 py-0.5', statusStyle.bg, statusStyle.color)}
                  >
                    <span
                      className={cn('mr-1 inline-block h-2 w-2 rounded-full', statusStyle.dot)}
                    />
                    {statusStyle.label}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={cn('text-[11px] px-2 py-0.5', priorityStyle.bg, priorityStyle.color)}
                  >
                    {priorityStyle.label}
                  </Badge>
                  {slaResponseOverdue && (
                    <Badge
                      variant="secondary"
                      className="bg-destructive-200 text-destructive text-[11px] px-2 py-0.5"
                    >
                      Response SLA Timed Out
                    </Badge>
                  )}
                  {slaUpdateOverdue && (
                    <Badge
                      variant="secondary"
                      className="bg-destructive-200 text-destructive text-[11px] px-2 py-0.5"
                    >
                      Update SLA Timed Out
                    </Badge>
                  )}
                  {slaResolveOverdue && (
                    <Badge
                      variant="secondary"
                      className="bg-destructive-200 text-destructive text-[11px] px-2 py-0.5"
                    >
                      Resolve SLA Timed Out
                    </Badge>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-md border border-border bg-surface-75/60 p-4">
                    <div className="text-xs text-foreground-muted">Contact Person</div>
                    <div className="text-sm text-foreground mt-1">
                      {ticket.requester_name || 'Not Provided'}
                    </div>
                    <div className="text-xs text-foreground-muted mt-1">
                      {ticket.requester_email}
                    </div>
                  </div>
                  <div className="rounded-md border border-border bg-surface-75/60 p-4">
                    <div className="text-xs text-foreground-muted">Time Info</div>
                    <div className="text-sm text-foreground mt-1">
                      Created: {formatDate(ticket.created_at)}
                    </div>
                    <div className="text-xs text-foreground-muted mt-1">
                      Response SLA Deadline: {formatDate(ticket.sla_response_due_at)}
                    </div>
                    <div className="text-xs text-foreground-muted mt-1">
                      Update SLA Deadline: {formatDate(ticket.sla_update_due_at)}
                    </div>
                    <div className="text-xs text-foreground-muted mt-1">
                      Resolve SLA Deadline: {formatDate(ticket.sla_resolve_due_at)}
                    </div>
                  </div>
                </div>
                <div className="rounded-md border border-border bg-surface-75/60 p-4">
                  <div className="text-xs text-foreground-muted mb-2">Issue Description</div>
                  <p className="text-sm text-foreground-light whitespace-pre-line">
                    {ticket.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="page-panel">
              <div className="page-panel-header">
                <h2 className="page-panel-title">Status Workflow</h2>
                <p className="page-panel-description">Track ticket progress</p>
              </div>
              <div className="p-5 space-y-3">
                {history.length === 0 ? (
                  <div className="rounded-md border border-border bg-surface-75/60 py-10 text-center text-sm text-foreground-muted">
                    No workflow records for this status
                  </div>
                ) : (
                  history.map((item, index) => (
                    <div key={`${item.at}-${index}`} className="flex gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-brand-500" />
                      <div className="flex-1 rounded-md border border-border bg-surface-75/60 px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-foreground-muted">
                          <span>
                            {item.from || 'Create'} →{' '}
                            {statusStyleMap[item.to || 'open']?.label || item.to}
                          </span>
                          <span>{formatDate(item.at)}</span>
                        </div>
                        {item.note && (
                          <div className="mt-2 text-sm text-foreground-light">{item.note}</div>
                        )}
                        {item.actor_user_id && (
                          <div className="mt-2 text-xs text-foreground-muted">
                            Action by: {item.actor_user_id}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="page-panel">
              <div className="page-panel-header">
                <h2 className="page-panel-title">Comments and Collaboration</h2>
                <p className="page-panel-description">
                  Record process notes and team collaboration
                </p>
              </div>
              <div className="p-5 space-y-4">
                {commentLoading ? (
                  <div className="rounded-md border border-border bg-surface-75/60 py-8 text-center text-sm text-foreground-muted">
                    Loading comments...
                  </div>
                ) : comments.length === 0 ? (
                  <div className="rounded-md border border-border bg-surface-75/60 py-8 text-center text-sm text-foreground-muted">
                    No Comments
                  </div>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-md border border-border bg-surface-75/60 p-4"
                      >
                        <div className="flex items-center justify-between text-xs text-foreground-muted">
                          <span>
                            {comment.author_name || comment.author_user_id || 'Support Team'}
                          </span>
                          <span>{formatDate(comment.created_at)}</span>
                        </div>
                        <p className="mt-2 text-sm text-foreground-light whitespace-pre-line">
                          {comment.body}
                        </p>
                        {comment.is_internal && (
                          <Badge
                            variant="secondary"
                            className="mt-3 bg-surface-200 text-foreground-muted text-[11px]"
                          >
                            Internal Comment
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-md border border-border bg-surface-75/60 p-4 space-y-3">
                  <label className="text-xs font-medium text-foreground">Add Comment</label>
                  <textarea
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    rows={4}
                    placeholder="Record process progress or add info..."
                    className="w-full px-3 py-2 rounded-md bg-surface-200 border border-border text-foreground resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-foreground-muted">
                      <Switch checked={commentInternal} onCheckedChange={setCommentInternal} />
                      Mark as Internal Comment
                    </div>
                    <Button
                      size="sm"
                      className="bg-brand-500 hover:bg-brand-600 text-background"
                      onClick={submitComment}
                      disabled={commentSubmitting}
                    >
                      {commentSubmitting ? 'Sending...' : 'Send Comment'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="page-panel">
              <div className="page-panel-header">
                <h3 className="page-panel-title">Update Status</h3>
                <p className="page-panel-description">Sync latest process progress</p>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-foreground">Status</label>
                  <select
                    value={statusDraft}
                    onChange={(e) => setStatusDraft(e.target.value)}
                    className="mt-2 h-9 w-full rounded-md border border-border bg-surface-200 px-2 text-xs text-foreground"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Process Notes</label>
                  <Input
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Optional"
                    className="mt-2 h-9 bg-surface-200 border-border text-foreground"
                  />
                </div>
                <Button
                  size="sm"
                  className="w-full bg-brand-500 hover:bg-brand-600 text-background"
                  onClick={submitStatusUpdate}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Confirm Update'}
                </Button>
              </div>
            </div>

            <div className="page-panel">
              <div className="page-panel-header">
                <h3 className="page-panel-title">Associated Resources</h3>
                <p className="page-panel-description">Quick view related workspace/app</p>
              </div>
              <div className="p-5 space-y-3 text-sm text-foreground-light">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-foreground-muted" />
                  Workspace: {ticket.workspace_id || 'Unbound'}
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-foreground-muted" />
                  Workspace: {ticket.workspace_id || 'Unbound'}
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-foreground-muted" />
                  Dispatch: {assigneeLabel}
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border bg-surface-75/60 px-4 py-3 text-xs text-foreground-muted flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
              Need more info? Please use the status notes to record process and timeline.
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <Link
          href="/dashboard/support-tickets"
          className="text-xs text-foreground-muted hover:text-foreground"
        >
          Back to Ticket List
        </Link>
      </div>
    </div>
  )
}
