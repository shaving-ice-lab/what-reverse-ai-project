"use client";

/**
 * 工单详情页 - Supabase 风格
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  LifeBuoy,
  Loader2,
  MessageSquare,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  supportApi,
  type SupportQueue,
  type SupportTeam,
  type SupportTicket,
  type SupportTicketComment,
} from "@/lib/api/support";

type StatusHistoryItem = {
  from?: string;
  to?: string;
  note?: string;
  at?: string;
  actor_user_id?: string;
};

const statusOptions = [
  { id: "open", label: "待处理" },
  { id: "in_progress", label: "处理中" },
  { id: "waiting_on_customer", label: "等待用户" },
  { id: "resolved", label: "已解决" },
  { id: "closed", label: "已关闭" },
];

const statusStyleMap: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  open: { label: "待处理", bg: "bg-surface-200", color: "text-foreground-light", dot: "bg-foreground-muted" },
  in_progress: { label: "处理中", bg: "bg-warning-200", color: "text-warning", dot: "bg-warning" },
  waiting_on_customer: { label: "等待用户", bg: "bg-brand-200/60", color: "text-brand-500", dot: "bg-brand-500" },
  resolved: { label: "已解决", bg: "bg-brand-200", color: "text-brand-500", dot: "bg-brand-500" },
  closed: { label: "已关闭", bg: "bg-surface-200", color: "text-foreground-muted", dot: "bg-foreground-muted" },
};

const priorityStyleMap: Record<string, { label: string; bg: string; color: string }> = {
  critical: { label: "紧急", bg: "bg-destructive-200", color: "text-destructive" },
  high: { label: "高", bg: "bg-warning-200", color: "text-warning" },
  normal: { label: "中", bg: "bg-brand-200", color: "text-brand-500" },
  low: { label: "低", bg: "bg-surface-200", color: "text-foreground-muted" },
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const parseHistory = (ticket?: SupportTicket | null): StatusHistoryItem[] => {
  const raw = ticket?.metadata?.status_history;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const entry = item as Record<string, unknown>;
      return {
        from: entry.from as string | undefined,
        to: entry.to as string | undefined,
        note: entry.note as string | undefined,
        at: entry.at as string | undefined,
        actor_user_id: entry.actor_user_id as string | undefined,
      };
    })
    .filter(Boolean) as StatusHistoryItem[];
};

export default function SupportTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState("open");
  const [noteDraft, setNoteDraft] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [comments, setComments] = useState<SupportTicketComment[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentInternal, setCommentInternal] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [teams, setTeams] = useState<SupportTeam[]>([]);
  const [queues, setQueues] = useState<SupportQueue[]>([]);

  useEffect(() => {
    if (!ticketId) return;
    let active = true;
    setIsLoading(true);
    setErrorMessage(null);
    supportApi
      .adminGetTicket(ticketId)
      .then((res) => {
        if (!active) return;
        setTicket(res.ticket);
        setStatusDraft(res.ticket?.status || "open");
        setNoteDraft(res.ticket?.status_note || "");
      })
      .catch((error) => {
        if (!active) return;
        setErrorMessage((error as Error).message || "加载失败");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [ticketId]);

  useEffect(() => {
    if (!ticketId) return;
    let active = true;
    Promise.all([supportApi.adminListTeams(true), supportApi.adminListQueues(true)])
      .then(([teamRes, queueRes]) => {
        if (!active) return;
        setTeams(teamRes.teams ?? []);
        setQueues(queueRes.queues ?? []);
      })
      .catch(() => {
        if (!active) return;
      });
    return () => {
      active = false;
    };
  }, [ticketId]);

  useEffect(() => {
    if (!ticketId) return;
    let active = true;
    setCommentLoading(true);
    supportApi
      .adminListComments(ticketId)
      .then((res) => {
        if (!active) return;
        setComments(res.comments ?? []);
      })
      .catch(() => {
        if (!active) return;
      })
      .finally(() => {
        if (active) setCommentLoading(false);
      });
    return () => {
      active = false;
    };
  }, [ticketId]);

  const history = useMemo(() => parseHistory(ticket), [ticket]);
  const teamLookup = useMemo(
    () => Object.fromEntries(teams.map((team) => [team.id, team.name])),
    [teams]
  );
  const queueLookup = useMemo(
    () => Object.fromEntries(queues.map((queue) => [queue.id, queue.name])),
    [queues]
  );
  const statusStyle = statusStyleMap[ticket?.status || "open"] || statusStyleMap.open;
  const priorityStyle =
    priorityStyleMap[ticket?.priority || "normal"] || priorityStyleMap.normal;
  const slaResponseOverdue =
    ticket?.sla_response_due_at &&
    ticket.status !== "resolved" &&
    ticket.status !== "closed" &&
    new Date(ticket.sla_response_due_at).getTime() < Date.now();
  const slaUpdateOverdue =
    ticket?.sla_update_due_at &&
    ticket.status !== "resolved" &&
    ticket.status !== "closed" &&
    new Date(ticket.sla_update_due_at).getTime() < Date.now();
  const slaResolveOverdue =
    ticket?.sla_resolve_due_at &&
    ticket.status !== "resolved" &&
    ticket.status !== "closed" &&
    new Date(ticket.sla_resolve_due_at).getTime() < Date.now();
  const assigneeLabel = useMemo(() => {
    if (!ticket?.assignee_value) return "未分派";
    const assigneeType = ticket.assignee_type || "team";
    if (assigneeType === "team") {
      return `${teamLookup[ticket.assignee_value] || ticket.assignee_value} · 团队`;
    }
    if (assigneeType === "queue") {
      return `${queueLookup[ticket.assignee_value] || ticket.assignee_value} · 队列`;
    }
    if (assigneeType === "user") {
      return `${ticket.assignee_value} · 用户`;
    }
    return `${assigneeType} · ${ticket.assignee_value}`;
  }, [ticket, teamLookup, queueLookup]);

  const submitStatusUpdate = async () => {
    if (!ticket) return;
    setIsUpdating(true);
    try {
      const response = await supportApi.adminUpdateStatus(ticket.id, {
        status: statusDraft,
        note: noteDraft || undefined,
      });
      setTicket(response.ticket);
    } catch (error) {
      setErrorMessage((error as Error).message || "更新失败");
    } finally {
      setIsUpdating(false);
    }
  };

  const submitComment = async () => {
    if (!ticket || commentDraft.trim() === "") return;
    setCommentSubmitting(true);
    try {
      const response = await supportApi.adminCreateComment(ticket.id, {
        body: commentDraft.trim(),
        is_internal: commentInternal,
      });
      setComments((prev) => [...prev, response.comment]);
      setCommentDraft("");
    } catch (error) {
      setErrorMessage((error as Error).message || "评论提交失败");
    } finally {
      setCommentSubmitting(false);
    }
  };

  return (
    <div className="page-section p-6">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-border text-foreground-light hover:text-foreground"
            onClick={() => router.push("/dashboard/support-tickets")}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            返回列表
          </Button>
          <div>
            <p className="page-caption">Support</p>
            <h1 className="page-title flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-brand-500" />
              工单详情
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
          加载中...
        </div>
      ) : !ticket ? (
        <div className="page-panel py-16 text-center text-sm text-foreground-muted">
          未找到工单
        </div>
      ) : (
        <div className="page-grid xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
          <div className="space-y-6">
            <div className="page-panel">
              <div className="page-panel-header">
                <h2 className="page-panel-title">{ticket.subject}</h2>
                <p className="page-panel-description">编号：{ticket.reference}</p>
              </div>
              <div className="p-5 space-y-3 text-sm text-foreground-light">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className={cn("text-[11px] px-2 py-0.5", statusStyle.bg, statusStyle.color)}>
                    <span className={cn("mr-1 inline-block h-2 w-2 rounded-full", statusStyle.dot)} />
                    {statusStyle.label}
                  </Badge>
                  <Badge variant="secondary" className={cn("text-[11px] px-2 py-0.5", priorityStyle.bg, priorityStyle.color)}>
                    {priorityStyle.label}
                  </Badge>
                  {slaResponseOverdue && (
                    <Badge variant="secondary" className="bg-destructive-200 text-destructive text-[11px] px-2 py-0.5">
                      响应 SLA 已超时
                    </Badge>
                  )}
                  {slaUpdateOverdue && (
                    <Badge variant="secondary" className="bg-destructive-200 text-destructive text-[11px] px-2 py-0.5">
                      更新 SLA 已超时
                    </Badge>
                  )}
                  {slaResolveOverdue && (
                    <Badge variant="secondary" className="bg-destructive-200 text-destructive text-[11px] px-2 py-0.5">
                      解决 SLA 已超时
                    </Badge>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-md border border-border bg-surface-75/60 p-4">
                    <div className="text-xs text-foreground-muted">联系人</div>
                    <div className="text-sm text-foreground mt-1">
                      {ticket.requester_name || "未提供"}
                    </div>
                    <div className="text-xs text-foreground-muted mt-1">
                      {ticket.requester_email}
                    </div>
                  </div>
                  <div className="rounded-md border border-border bg-surface-75/60 p-4">
                    <div className="text-xs text-foreground-muted">时间信息</div>
                    <div className="text-sm text-foreground mt-1">
                      创建：{formatDate(ticket.created_at)}
                    </div>
                    <div className="text-xs text-foreground-muted mt-1">
                    响应 SLA 截止：{formatDate(ticket.sla_response_due_at)}
                  </div>
                  <div className="text-xs text-foreground-muted mt-1">
                    更新 SLA 截止：{formatDate(ticket.sla_update_due_at)}
                  </div>
                  <div className="text-xs text-foreground-muted mt-1">
                    解决 SLA 截止：{formatDate(ticket.sla_resolve_due_at)}
                    </div>
                  </div>
                </div>
                <div className="rounded-md border border-border bg-surface-75/60 p-4">
                  <div className="text-xs text-foreground-muted mb-2">问题描述</div>
                  <p className="text-sm text-foreground-light whitespace-pre-line">
                    {ticket.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="page-panel">
              <div className="page-panel-header">
                <h2 className="page-panel-title">状态流转</h2>
                <p className="page-panel-description">跟踪工单处理过程</p>
              </div>
              <div className="p-5 space-y-3">
                {history.length === 0 ? (
                  <div className="rounded-md border border-border bg-surface-75/60 py-10 text-center text-sm text-foreground-muted">
                    暂无状态流转记录
                  </div>
                ) : (
                  history.map((item, index) => (
                    <div key={`${item.at}-${index}`} className="flex gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-brand-500" />
                      <div className="flex-1 rounded-md border border-border bg-surface-75/60 px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-foreground-muted">
                          <span>
                            {item.from || "创建"} → {statusStyleMap[item.to || "open"]?.label || item.to}
                          </span>
                          <span>{formatDate(item.at)}</span>
                        </div>
                        {item.note && (
                          <div className="mt-2 text-sm text-foreground-light">
                            {item.note}
                          </div>
                        )}
                        {item.actor_user_id && (
                          <div className="mt-2 text-xs text-foreground-muted">
                            操作人：{item.actor_user_id}
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
                <h2 className="page-panel-title">评论与协作</h2>
                <p className="page-panel-description">记录处理备注与团队协作</p>
              </div>
              <div className="p-5 space-y-4">
                {commentLoading ? (
                  <div className="rounded-md border border-border bg-surface-75/60 py-8 text-center text-sm text-foreground-muted">
                    评论加载中...
                  </div>
                ) : comments.length === 0 ? (
                  <div className="rounded-md border border-border bg-surface-75/60 py-8 text-center text-sm text-foreground-muted">
                    暂无评论
                  </div>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="rounded-md border border-border bg-surface-75/60 p-4">
                        <div className="flex items-center justify-between text-xs text-foreground-muted">
                          <span>
                            {comment.author_name || comment.author_user_id || "支持团队"}
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
                            内部评论
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-md border border-border bg-surface-75/60 p-4 space-y-3">
                  <label className="text-xs font-medium text-foreground">新增评论</label>
                  <textarea
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    rows={4}
                    placeholder="记录处理进度或补充信息..."
                    className="w-full px-3 py-2 rounded-md bg-surface-200 border border-border text-foreground resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-foreground-muted">
                      <Switch checked={commentInternal} onCheckedChange={setCommentInternal} />
                      标记为内部评论
                    </div>
                    <Button
                      size="sm"
                      className="bg-brand-500 hover:bg-brand-600 text-background"
                      onClick={submitComment}
                      disabled={commentSubmitting}
                    >
                      {commentSubmitting ? "发送中..." : "发送评论"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="page-panel">
              <div className="page-panel-header">
                <h3 className="page-panel-title">更新状态</h3>
                <p className="page-panel-description">同步最新处理进度</p>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-foreground">状态</label>
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
                  <label className="text-xs font-medium text-foreground">处理备注</label>
                  <Input
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="选填"
                    className="mt-2 h-9 bg-surface-200 border-border text-foreground"
                  />
                </div>
                <Button
                  size="sm"
                  className="w-full bg-brand-500 hover:bg-brand-600 text-background"
                  onClick={submitStatusUpdate}
                  disabled={isUpdating}
                >
                  {isUpdating ? "更新中..." : "确认更新"}
                </Button>
              </div>
            </div>

            <div className="page-panel">
              <div className="page-panel-header">
                <h3 className="page-panel-title">关联资源</h3>
                <p className="page-panel-description">快速查看相关 Workspace/App</p>
              </div>
              <div className="p-5 space-y-3 text-sm text-foreground-light">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-foreground-muted" />
                  Workspace：{ticket.workspace_id || "未绑定"}
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-foreground-muted" />
                  Workspace：{ticket.workspace_id || "未绑定"}
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-foreground-muted" />
                  分派：{assigneeLabel}
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border bg-surface-75/60 px-4 py-3 text-xs text-foreground-muted flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
              若需追加信息，请使用状态备注记录处理细节与时间点。
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <Link href="/dashboard/support-tickets" className="text-xs text-foreground-muted hover:text-foreground">
          返回工单列表
        </Link>
      </div>
    </div>
  );
}
