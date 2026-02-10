'use client'

/**
 * ReviewDetailsPage
 *
 * Supabase Style: Minimal, Clear, Professional
 *
 * Features:
 * - Display complete review item info
 * - Content snapshot preview
 * - Review history records
 * - Comment and discussion features
 * - Review actions (Approve/Reject/Request Changes)
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { formatDistanceToNow, format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  Shield,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  AlertCircle,
  Bot,
  Layers,
  FileText,
  User,
  MessageSquare,
  Send,
  History,
  Eye,
  Zap,
  ArrowUp,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { useConfirmDialog } from '@/components/ui/confirm-dialog'
import { PageContainer, PageHeader } from '@/components/dashboard/page-layout'
import { TabNav } from '@/components/dashboard/supabase-ui'
import { reviewApi } from '@/lib/api/review'
import type {
  ReviewQueueItem,
  ReviewStatus,
  ReviewItemType,
  ReviewPriority,
  ReviewRecord,
  ReviewComment,
  ChecklistItem,
} from '@/types/review'

import { cn } from '@/lib/utils'

// StatusConfig - Supabase Style

const statusConfig: Record<
  ReviewStatus,
  {
    label: string
    icon: typeof CheckCircle
    badge: 'success' | 'warning' | 'destructive' | 'secondary'
  }
> = {
  pending: { label: 'Pending Review', icon: Clock, badge: 'warning' },
  in_review: { label: 'In Review', icon: Loader2, badge: 'secondary' },
  approved: { label: 'Approved', icon: CheckCircle, badge: 'success' },
  rejected: { label: 'Rejected', icon: XCircle, badge: 'destructive' },
  revision: { label: 'Changes Requested', icon: AlertTriangle, badge: 'warning' },
  cancelled: { label: 'Cancelled', icon: X, badge: 'secondary' },
}

// Item Type Config - Supabase Style

const itemTypeConfig: Record<ReviewItemType, { label: string; icon: typeof Bot; color: string }> = {
  agent: { label: 'Agent', icon: Bot, color: 'text-foreground-light' },

  workflow: { label: 'Workflow', icon: Layers, color: 'text-brand-500' },

  template: { label: 'Template', icon: FileText, color: 'text-foreground-light' },

  user: { label: 'User', icon: User, color: 'text-brand-500' },

  content: { label: 'Content', icon: MessageSquare, color: 'text-foreground-light' },
}

// Priority Config - Supabase Style

const priorityConfig: Record<
  ReviewPriority,
  { label: string; icon: typeof Zap; badge: 'secondary' | 'warning' | 'destructive' }
> = {
  low: { label: 'Low', icon: ArrowRight, badge: 'secondary' },
  normal: { label: 'Normal', icon: ArrowRight, badge: 'secondary' },
  high: { label: 'High', icon: ArrowUp, badge: 'warning' },
  urgent: { label: 'Urgent', icon: Zap, badge: 'destructive' },
}

// Action Type Config - Supabase Style

const actionConfig: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  assign: { label: 'Assign Reviewer', icon: User, color: 'text-foreground-light' },

  review: { label: 'Start Review', icon: Eye, color: 'text-foreground-light' },

  approve: { label: 'Approve', icon: CheckCircle, color: 'text-brand-500' },

  reject: { label: 'Reject', icon: XCircle, color: 'text-destructive' },

  request_revision: { label: 'Request Changes', icon: AlertTriangle, color: 'text-warning' },

  resubmit: { label: 'Resubmit', icon: RefreshCw, color: 'text-foreground-light' },

  cancel: { label: 'Cancel Review', icon: X, color: 'text-foreground-muted' },
}

export default function ReviewDetailPage() {
  const router = useRouter()

  const params = useParams()

  const reviewId = params.id as string

  const { confirm, ConfirmDialog } = useConfirmDialog()

  // Status

  const [review, setReview] = useState<ReviewQueueItem | null>(null)

  const [records, setRecords] = useState<ReviewRecord[]>([])

  const [comments, setComments] = useState<ReviewComment[]>([])

  const [checklist, setChecklist] = useState<ChecklistItem[]>([])

  const [isLoading, setIsLoading] = useState(true)

  const [error, setError] = useState<string | null>(null)

  // UI Status

  const [activeTab, setActiveTab] = useState<'preview' | 'history' | 'comments'>('preview')

  const [showSnapshot, setShowSnapshot] = useState(true)

  const [reviewComment, setReviewComment] = useState('')

  const [newComment, setNewComment] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isCommenting, setIsCommenting] = useState(false)

  // Load Review Details

  const loadReview = useCallback(async () => {
    setIsLoading(true)

    setError(null)

    try {
      const response = await reviewApi.get(reviewId)

      setReview(response.data)

      setRecords(response.data.records || [])

      setComments(response.data.comments || [])

      // Load Checklist Template

      if (response.data.itemType) {
        try {
          const checklistResponse = await reviewApi.getChecklist(response.data.itemType)

          setChecklist(checklistResponse.data.items.map((item) => ({ ...item, checked: false })))
        } catch {
          // Checklist template may not exist, ignore error
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load review details')
    } finally {
      setIsLoading(false)
    }
  }, [reviewId])

  // Initial Load

  useEffect(() => {
    loadReview()
  }, [loadReview])

  // Review Action

  const handleReviewAction = async (action: 'approve' | 'reject' | 'request_revision') => {
    const actionLabels = {
      approve: 'Approve Review',

      reject: 'Reject Review',

      request_revision: 'Request Changes',
    }

    const confirmed = await confirm({
      title: actionLabels[action],

      description:
        action === 'approve'
          ? 'Approve this review? The item will be published.'
          : action === 'reject'
            ? 'Reject this review? Please provide a reason below.'
            : 'Request changes? The submitter will be notified to edit.',

      confirmText: 'Confirm',

      cancelText: 'Cancel',

      variant: action === 'reject' ? 'destructive' : 'default',
    })

    if (!confirmed) return

    setIsSubmitting(true)

    try {
      await reviewApi.review(reviewId, {
        action,

        comment: reviewComment || undefined,

        checklist: checklist.length > 0 ? checklist : undefined,
      })

      setReviewComment('')

      loadReview()
    } catch (err) {
      console.error('Review operation failed:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Send Comment

  const handleSendComment = async () => {
    if (!newComment.trim()) return

    setIsCommenting(true)

    try {
      await reviewApi.createComment(reviewId, {
        content: newComment,

        commentType: 'comment',
      })

      setNewComment('')

      loadReview()
    } catch (err) {
      console.error('Failed to send comment:', err)
    } finally {
      setIsCommenting(false)
    }
  }

  // Toggle Checklist Item

  const toggleChecklistItem = (index: number) => {
    setChecklist((prev) =>
      prev.map((item, i) => (i === index ? { ...item, checked: !item.checked } : item))
    )
  }

  // Check if all required items are checked

  const allRequiredChecked = checklist.filter((c) => c.required).every((c) => c.checked)

  if (isLoading) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </PageContainer>
    )
  }

  if (error || !review) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[60vh]">
        <Card padding="lg" className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-md bg-surface-200 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {error || 'Review item not found'}
          </h3>
          <div className="flex gap-2 mt-4 justify-center">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button variant="outline" onClick={loadReview}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </Card>
      </PageContainer>
    )
  }

  const status = statusConfig[review.status]

  const itemType = itemTypeConfig[review.itemType]

  const priority = priorityConfig[review.priority]

  const StatusIcon = status.icon

  const ItemTypeIcon = itemType.icon

  const PriorityIcon = priority.icon

  const canReview = review.status === 'pending' || review.status === 'in_review'

  const tabs = [
    { label: 'Content Preview', value: 'preview' },
    { label: 'Review History', value: 'history', count: records.length },
    { label: 'Discussion', value: 'comments', count: comments.length },
  ]

  const headerBadges = (
    <div className="flex flex-wrap items-center gap-2">
      {review.priority !== 'normal' && (
        <Badge variant={priority.badge} size="sm" className="gap-1">
          <PriorityIcon className="w-3 h-3" />
          {priority.label}
        </Badge>
      )}
      <Badge variant={status.badge} size="sm" className="gap-1">
        <StatusIcon className={cn('w-3 h-3', review.status === 'in_review' && 'animate-spin')} />
        {status.label}
      </Badge>
    </div>
  )

  return (
    <PageContainer className="space-y-6">
      <ConfirmDialog />

      <PageHeader
        eyebrow="Moderation"
        icon={<Shield className="w-4 h-4" />}
        title={review.title}
        description={review.description || 'Review details and actions'}
        backHref="/dashboard/review"
        backLabel="Back to List"
        badge={headerBadges}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={loadReview}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      <div className="page-divider" />

      <div className="flex flex-wrap items-center gap-4 text-xs text-foreground-muted">
        <span className="flex items-center gap-1.5">
          <ItemTypeIcon className="w-3.5 h-3.5" />
          {itemType.label}
        </span>
        <span className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          {review.submitter?.username || 'Unknown User'}
        </span>
        <span className="flex items-center gap-1.5 font-mono">
          <Clock className="w-3.5 h-3.5" />
          {formatDistanceToNow(new Date(review.submittedAt), { addSuffix: true, locale: zhCN })}
        </span>
        {review.revisionCount > 0 && (
          <span className="flex items-center gap-1.5 text-warning">
            <AlertTriangle className="w-3.5 h-3.5" />
            Submission #{review.revisionCount + 1}
          </span>
        )}
      </div>

      <TabNav
        tabs={tabs}
        activeTab={activeTab}
        onChange={(value) => setActiveTab(value as 'preview' | 'history' | 'comments')}
      />

      <div
        className={cn(
          'page-grid',
          canReview ? 'lg:grid-cols-[minmax(0,1fr)_360px]' : 'grid-cols-1'
        )}
      >
        <div className="space-y-6">
          {activeTab === 'preview' && (
            <div className="space-y-6">
              {review.submissionNote && (
                <Card>
                  <CardHeader bordered>
                    <CardTitle size="sm">Submission description</CardTitle>
                  </CardHeader>
                  <CardContent padding="sm">
                    <p className="text-sm text-foreground-muted">{review.submissionNote}</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <button
                  type="button"
                  onClick={() => setShowSnapshot(!showSnapshot)}
                  className="w-full text-left"
                >
                  <CardHeader
                    bordered
                    action={
                      showSnapshot ? (
                        <ChevronUp className="w-4 h-4 text-foreground-muted" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-foreground-muted" />
                      )
                    }
                  >
                    <CardTitle size="sm" className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Content Snapshot
                    </CardTitle>
                    <CardDescription>Latest submitted content snapshot preview</CardDescription>
                  </CardHeader>
                </button>
                {showSnapshot && (
                  <CardContent padding="sm">
                    <pre className="text-xs text-foreground-muted bg-surface-75 rounded-md p-4 overflow-auto max-h-[500px]">
                      {JSON.stringify(review.snapshot, null, 2)}
                    </pre>
                  </CardContent>
                )}
              </Card>

              {review.resultNote && (
                <Card
                  variant={
                    review.status === 'approved'
                      ? 'brand'
                      : review.status === 'rejected'
                        ? 'destructive'
                        : 'warning'
                  }
                  padding="sm"
                >
                  <div className="flex items-start gap-2">
                    {review.status === 'approved' ? (
                      <CheckCircle className="w-4 h-4 text-brand-500 mt-0.5" />
                    ) : review.status === 'rejected' ? (
                      <XCircle className="w-4 h-4 text-destructive mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-foreground">Review feedback</div>
                      <p className="text-sm text-foreground-muted mt-1">{review.resultNote}</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {records.length === 0 ? (
                <Card variant="muted" padding="lg" className="text-center">
                  <History className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
                  <p className="text-foreground-muted">No review records</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {records.map((record) => {
                    const actionCfg = actionConfig[record.action] || {
                      label: record.action,
                      icon: History,
                      color: 'text-foreground-muted',
                    }
                    const ActionIcon = actionCfg.icon
                    return (
                      <Card key={record.id} padding="sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center">
                              <ActionIcon className={cn('w-4 h-4', actionCfg.color)} />
                            </div>
                            <div>
                              <div className={cn('text-sm font-medium', actionCfg.color)}>
                                {actionCfg.label}
                              </div>
                              {record.fromStatus && record.toStatus && (
                                <div className="text-xs text-foreground-muted mt-0.5">
                                  {statusConfig[record.fromStatus]?.label} →{' '}
                                  {statusConfig[record.toStatus]?.label}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-foreground-muted">
                            {format(new Date(record.createdAt), 'yyyy-MM-dd HH:mm', {
                              locale: zhCN,
                            })}
                          </span>
                        </div>
                        {record.comment && (
                          <p className="text-sm text-foreground-muted mt-2">{record.comment}</p>
                        )}
                        <div className="mt-3 flex items-center gap-2 text-xs text-foreground-muted">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="text-[10px]">
                              {record.reviewer?.displayName?.charAt(0) || 'R'}
                            </AvatarFallback>
                          </Avatar>
                          <span>{record.reviewer?.displayName || 'Review'}</span>
                          {record.durationMs && (
                            <span>Duration {Math.round(record.durationMs / 1000)}s</span>
                          )}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              <Card>
                <CardHeader bordered>
                  <CardTitle size="sm">Add comment</CardTitle>
                </CardHeader>
                <CardContent padding="sm" className="space-y-3">
                  <Textarea
                    placeholder="Add comment or question..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[90px] resize-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSendComment}
                      disabled={!newComment.trim() || isCommenting}
                      className="bg-brand-500 hover:bg-brand-600 text-background"
                    >
                      {isCommenting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Send
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {comments.length === 0 ? (
                <Card variant="muted" padding="lg" className="text-center">
                  <MessageSquare className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
                  <p className="text-foreground-muted">No comments</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <Card key={comment.id} padding="sm">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={comment.user?.avatar} />
                          <AvatarFallback>
                            {comment.user?.username?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-foreground">
                              {comment.user?.username || 'User'}
                            </span>
                            <span className="text-xs text-foreground-muted">
                              {formatDistanceToNow(new Date(comment.createdAt), {
                                addSuffix: true,
                                locale: zhCN,
                              })}
                            </span>
                            {comment.isResolved && (
                              <span className="text-xs text-brand-500 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Resolved
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-foreground-muted">{comment.content}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {canReview && (
          <Card variant="panel" className="sticky top-6 h-fit">
            <CardHeader bordered>
              <CardTitle size="sm" className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-500" />
                Review Actions
              </CardTitle>
            </CardHeader>
            <CardContent padding="sm" className="space-y-6">
              {checklist.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-medium text-foreground-muted uppercase">
                    Review Checklist
                  </div>
                  <div className="space-y-2">
                    {checklist.map((item, index) => (
                      <label
                        key={item.id}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors',
                          item.checked
                            ? 'bg-brand-200 border-brand-400/60'
                            : 'bg-surface-100 border-border hover:bg-surface-75'
                        )}
                      >
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={() => toggleChecklistItem(index)}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <span
                            className={cn(
                              'text-sm',
                              item.checked ? 'text-foreground' : 'text-foreground-muted'
                            )}
                          >
                            {item.label}
                          </span>
                          {item.required && <span className="text-destructive ml-1">*</span>}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="text-xs font-medium text-foreground-muted uppercase">
                  Review feedback
                </div>
                <Textarea
                  placeholder="Fill in review feedback (optional)..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full bg-brand-500 hover:bg-brand-600 text-background"
                  onClick={() => handleReviewAction('approve')}
                  disabled={isSubmitting || (checklist.length > 0 && !allRequiredChecked)}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Approve
                </Button>
                <Button
                  variant="warning"
                  className="w-full"
                  onClick={() => handleReviewAction('request_revision')}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 mr-2" />
                  )}
                  Request Changes
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleReviewAction('reject')}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Reject
                </Button>
              </div>

              {checklist.length > 0 && !allRequiredChecked && (
                <p className="text-xs text-foreground-muted text-center">
                  Please complete all required checks first
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  )
}
