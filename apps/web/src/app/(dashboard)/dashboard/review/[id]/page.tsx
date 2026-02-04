"use client";

/**
 * 审核详情页面
 *
 * Supabase 风格：极简、清晰、专业
 *
 * 功能：
 * - 显示审核项目完整信息
 * - 内容快照预览
 * - 审核历史记录
 * - 评论讨论功能
 * - 审核操作（通过/拒绝/要求修改）
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { zhCN } from "date-fns/locale";
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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardTitle, 
  CardDescription, 
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import { TabNav } from "@/components/dashboard/supabase-ui";
import { reviewApi } from "@/lib/api/review";
import type { 

  ReviewQueueItem, 

  ReviewStatus, 

  ReviewItemType, 

  ReviewPriority,

  ReviewRecord,

  ReviewComment,

  ChecklistItem,
} from "@/types/review";

import { cn } from "@/lib/utils";

// 状态配置 - Supabase 风格

const statusConfig: Record<
  ReviewStatus,
  { label: string; icon: typeof CheckCircle; badge: "success" | "warning" | "destructive" | "secondary" }
> = {
  pending: { label: "待审核", icon: Clock, badge: "warning" },
  in_review: { label: "审核中", icon: Loader2, badge: "secondary" },
  approved: { label: "已通过", icon: CheckCircle, badge: "success" },
  rejected: { label: "已拒绝", icon: XCircle, badge: "destructive" },
  revision: { label: "需修改", icon: AlertTriangle, badge: "warning" },
  cancelled: { label: "已取消", icon: X, badge: "secondary" },
};

// 项目类型配置 - Supabase 风格

const itemTypeConfig: Record<ReviewItemType, { label: string; icon: typeof Bot; color: string }> = {
  agent: { label: "Agent", icon: Bot, color: "text-foreground-light" },

  workflow: { label: "工作流", icon: Layers, color: "text-brand-500" },

  template: { label: "模板", icon: FileText, color: "text-foreground-light" },

  user: { label: "用户", icon: User, color: "text-brand-500" },

  content: { label: "内容", icon: MessageSquare, color: "text-foreground-light" },
};

// 优先级配置 - Supabase 风格

const priorityConfig: Record<
  ReviewPriority,
  { label: string; icon: typeof Zap; badge: "secondary" | "warning" | "destructive" }
> = {
  low: { label: "低", icon: ArrowRight, badge: "secondary" },
  normal: { label: "普通", icon: ArrowRight, badge: "secondary" },
  high: { label: "高", icon: ArrowUp, badge: "warning" },
  urgent: { label: "紧急", icon: Zap, badge: "destructive" },
};

// 操作类型配置 - Supabase 风格

const actionConfig: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  assign: { label: "分配审核", icon: User, color: "text-foreground-light" },

  review: { label: "开始审核", icon: Eye, color: "text-foreground-light" },

  approve: { label: "通过审核", icon: CheckCircle, color: "text-brand-500" },

  reject: { label: "拒绝审核", icon: XCircle, color: "text-destructive" },

  request_revision: { label: "要求修改", icon: AlertTriangle, color: "text-warning" },

  resubmit: { label: "重新提交", icon: RefreshCw, color: "text-foreground-light" },

  cancel: { label: "取消审核", icon: X, color: "text-foreground-muted" },
};

export default function ReviewDetailPage() {
  const router = useRouter();

  const params = useParams();

  const reviewId = params.id as string;

  const { confirm, ConfirmDialog } = useConfirmDialog();

  // 状态

  const [review, setReview] = useState<ReviewQueueItem | null>(null);

  const [records, setRecords] = useState<ReviewRecord[]>([]);

  const [comments, setComments] = useState<ReviewComment[]>([]);

  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // UI 状态

  const [activeTab, setActiveTab] = useState<"preview" | "history" | "comments">("preview");

  const [showSnapshot, setShowSnapshot] = useState(true);

  const [reviewComment, setReviewComment] = useState("");

  const [newComment, setNewComment] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isCommenting, setIsCommenting] = useState(false);

  // 加载审核详情

  const loadReview = useCallback(async () => {
    setIsLoading(true);

    setError(null);

    try {
      const response = await reviewApi.get(reviewId);

      setReview(response.data);

      setRecords(response.data.records || []);

      setComments(response.data.comments || []);

      // 加载检查项模板

      if (response.data.itemType) {
        try {
          const checklistResponse = await reviewApi.getChecklist(response.data.itemType);

          setChecklist(checklistResponse.data.items.map(item => ({ ...item, checked: false })));

        } catch {
          // 检查项模板可能不存在，忽略错误

        }

      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");

    } finally {
      setIsLoading(false);

    }

  }, [reviewId]);

  // 初始加载

  useEffect(() => {
    loadReview();

  }, [loadReview]);

  // 审核操作

  const handleReviewAction = async (action: "approve" | "reject" | "request_revision") => {
    const actionLabels = {
      approve: "通过审核",

      reject: "拒绝审核",

      request_revision: "要求修改",

    };

    const confirmed = await confirm({
      title: actionLabels[action],

      description: action === "approve" 

        ? "确定要通过此审核吗？通过后项目将可以发布。"

        : action === "reject"

        ? "确定要拒绝此审核吗？请在下方填写拒绝原因。"

        : "确定要要求修改吗？提交者将收到修改通知。",

      confirmText: "确认",

      cancelText: "取消",

      variant: action === "reject" ? "destructive" : "default",

    });

    if (!confirmed) return;

    setIsSubmitting(true);

    try {
      await reviewApi.review(reviewId, {
        action,

        comment: reviewComment || undefined,

        checklist: checklist.length > 0 ? checklist : undefined,

      });

      setReviewComment("");

      loadReview();

    } catch (err) {
      console.error("审核操作失败:", err);

    } finally {
      setIsSubmitting(false);

    }

  };

  // 发送评论

  const handleSendComment = async () => {
    if (!newComment.trim()) return;

    setIsCommenting(true);

    try {
      await reviewApi.createComment(reviewId, {
        content: newComment,

        commentType: "comment",

      });

      setNewComment("");

      loadReview();

    } catch (err) {
      console.error("发送评论失败:", err);

    } finally {
      setIsCommenting(false);

    }

  };

  // 切换检查项

  const toggleChecklistItem = (index: number) => {
    setChecklist(prev => prev.map((item, i) => 

      i === index ? { ...item, checked: !item.checked } : item

    ));

  };

  // 检查是否所有必填项都已勾选

  const allRequiredChecked = checklist.filter(c => c.required).every(c => c.checked);

  if (isLoading) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </PageContainer>

    );

  }

  if (error || !review) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[60vh]">
        <Card padding="lg" className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-md bg-surface-200 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {error || "审核项目不存在"}
          </h3>
          <div className="flex gap-2 mt-4 justify-center">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回
            </Button>
            <Button variant="outline" onClick={loadReview}>
              <RefreshCw className="mr-2 h-4 w-4" />
              重试
            </Button>
          </div>
        </Card>
      </PageContainer>

    );

  }

  const status = statusConfig[review.status];

  const itemType = itemTypeConfig[review.itemType];

  const priority = priorityConfig[review.priority];

  const StatusIcon = status.icon;

  const ItemTypeIcon = itemType.icon;

  const PriorityIcon = priority.icon;

  const canReview = review.status === "pending" || review.status === "in_review";

  const tabs = [
    { label: "内容预览", value: "preview" },
    { label: "审核历史", value: "history", count: records.length },
    { label: "讨论", value: "comments", count: comments.length },
  ];

  const headerBadges = (
    <div className="flex flex-wrap items-center gap-2">
      {review.priority !== "normal" && (
        <Badge variant={priority.badge} size="sm" className="gap-1">
          <PriorityIcon className="w-3 h-3" />
          {priority.label}
        </Badge>
      )}
      <Badge variant={status.badge} size="sm" className="gap-1">
        <StatusIcon className={cn("w-3 h-3", review.status === "in_review" && "animate-spin")} />
        {status.label}
      </Badge>
    </div>
  );

  return (
    <PageContainer className="space-y-6">
      <ConfirmDialog />

      <PageHeader
        eyebrow="Moderation"
        icon={<Shield className="w-4 h-4" />}
        title={review.title}
        description={review.description || "审核项目详情与操作"}
        backHref="/review"
        backLabel="返回列表"
        badge={headerBadges}
        actions={(
          <Button
            variant="outline"
            size="sm"
            onClick={loadReview}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            刷新
          </Button>
        )}
      />

      <div className="page-divider" />

      <div className="flex flex-wrap items-center gap-4 text-xs text-foreground-muted">
        <span className="flex items-center gap-1.5">
          <ItemTypeIcon className="w-3.5 h-3.5" />
          {itemType.label}
        </span>
        <span className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          {review.submitter?.username || "未知用户"}
        </span>
        <span className="flex items-center gap-1.5 font-mono">
          <Clock className="w-3.5 h-3.5" />
          {formatDistanceToNow(new Date(review.submittedAt), { addSuffix: true, locale: zhCN })}
        </span>
        {review.revisionCount > 0 && (
          <span className="flex items-center gap-1.5 text-warning">
            <AlertTriangle className="w-3.5 h-3.5" />
            第 {review.revisionCount + 1} 次提交
          </span>
        )}
      </div>

      <TabNav
        tabs={tabs}
        activeTab={activeTab}
        onChange={(value) => setActiveTab(value as "preview" | "history" | "comments")}
      />

      <div className={cn("page-grid", canReview ? "lg:grid-cols-[minmax(0,1fr)_360px]" : "grid-cols-1")}>
        <div className="space-y-6">
          {activeTab === "preview" && (
            <div className="space-y-6">
              {review.submissionNote && (
                <Card>
                  <CardHeader bordered>
                    <CardTitle size="sm">提交说明</CardTitle>
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
                      内容快照
                    </CardTitle>
                    <CardDescription>最新提交内容的快照预览</CardDescription>
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
                    review.status === "approved"
                      ? "brand"
                      : review.status === "rejected"
                      ? "destructive"
                      : "warning"
                  }
                  padding="sm"
                >
                  <div className="flex items-start gap-2">
                    {review.status === "approved" ? (
                      <CheckCircle className="w-4 h-4 text-brand-500 mt-0.5" />
                    ) : review.status === "rejected" ? (
                      <XCircle className="w-4 h-4 text-destructive mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-foreground">审核意见</div>
                      <p className="text-sm text-foreground-muted mt-1">{review.resultNote}</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-4">
              {records.length === 0 ? (
                <Card variant="muted" padding="lg" className="text-center">
                  <History className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
                  <p className="text-foreground-muted">暂无审核记录</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {records.map((record) => {
                    const actionCfg = actionConfig[record.action] || {
                      label: record.action,
                      icon: History,
                      color: "text-foreground-muted",
                    };
                    const ActionIcon = actionCfg.icon;
                    return (
                      <Card key={record.id} padding="sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center">
                              <ActionIcon className={cn("w-4 h-4", actionCfg.color)} />
                            </div>
                            <div>
                              <div className={cn("text-sm font-medium", actionCfg.color)}>
                                {actionCfg.label}
                              </div>
                              {record.fromStatus && record.toStatus && (
                                <div className="text-xs text-foreground-muted mt-0.5">
                                  {statusConfig[record.fromStatus]?.label} → {statusConfig[record.toStatus]?.label}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-foreground-muted">
                            {format(new Date(record.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                          </span>
                        </div>
                        {record.comment && (
                          <p className="text-sm text-foreground-muted mt-2">{record.comment}</p>
                        )}
                        <div className="mt-3 flex items-center gap-2 text-xs text-foreground-muted">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="text-[10px]">
                              {record.reviewer?.displayName?.charAt(0) || "R"}
                            </AvatarFallback>
                          </Avatar>
                          <span>{record.reviewer?.displayName || "审核员"}</span>
                          {record.durationMs && (
                            <span>耗时 {Math.round(record.durationMs / 1000)}秒</span>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "comments" && (
            <div className="space-y-4">
              <Card>
                <CardHeader bordered>
                  <CardTitle size="sm">添加评论</CardTitle>
                </CardHeader>
                <CardContent padding="sm" className="space-y-3">
                  <Textarea
                    placeholder="添加评论或提问..."
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
                      发送
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {comments.length === 0 ? (
                <Card variant="muted" padding="lg" className="text-center">
                  <MessageSquare className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
                  <p className="text-foreground-muted">暂无评论</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <Card key={comment.id} padding="sm">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={comment.user?.avatar} />
                          <AvatarFallback>
                            {comment.user?.username?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-foreground">
                              {comment.user?.username || "用户"}
                            </span>
                            <span className="text-xs text-foreground-muted">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: zhCN })}
                            </span>
                            {comment.isResolved && (
                              <span className="text-xs text-brand-500 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                已解决
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
                审核操作
              </CardTitle>
            </CardHeader>
            <CardContent padding="sm" className="space-y-6">
              {checklist.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-medium text-foreground-muted uppercase">
                    审核检查项
                  </div>
                  <div className="space-y-2">
                    {checklist.map((item, index) => (
                      <label
                        key={item.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors",
                          item.checked
                            ? "bg-brand-200 border-brand-400/60"
                            : "bg-surface-100 border-border hover:bg-surface-75"
                        )}
                      >
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={() => toggleChecklistItem(index)}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <span className={cn("text-sm", item.checked ? "text-foreground" : "text-foreground-muted")}>
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
                <div className="text-xs font-medium text-foreground-muted uppercase">审核意见</div>
                <Textarea
                  placeholder="填写审核意见（可选）..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full bg-brand-500 hover:bg-brand-600 text-background"
                  onClick={() => handleReviewAction("approve")}
                  disabled={isSubmitting || (checklist.length > 0 && !allRequiredChecked)}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  通过审核
                </Button>
                <Button
                  variant="warning"
                  className="w-full"
                  onClick={() => handleReviewAction("request_revision")}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 mr-2" />
                  )}
                  要求修改
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleReviewAction("reject")}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  拒绝审核
                </Button>
              </div>

              {checklist.length > 0 && !allRequiredChecked && (
                <p className="text-xs text-foreground-muted text-center">
                  请先完成所有必填检查项
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}

