"use client";

/**
 * 对话详情页面 - 聊天界面
 * 支持查看历史消息、发送新消息、流式响应
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Settings,
  Share2,
  MoreHorizontal,
  Star,
  Archive,
  Trash2,
  Edit3,
  Loader2,
  Sparkles,
  RefreshCw,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChatInput, QuickReplies } from "@/components/chat/chat-input";
import { ChatMessages, WelcomeMessage, type ChatMessage } from "@/components/chat/chat-messages";
import { AISettingsPanel } from "@/components/chat/ai-settings-panel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { conversationApi } from "@/lib/api";
import { useStreamingChat } from "@/hooks";
import type { Conversation, Message as ConversationMessage, AIParameters } from "@/types/conversation";
import { AI_MODELS, formatRelativeTime, getModelDisplayName } from "@/types/conversation";

// 将后端消息格式转换为组件消息格式
function toDisplayMessage(msg: ConversationMessage): ChatMessage {
  return {
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: new Date(msg.createdAt),
    model: msg.model,
    tokens: msg.tokenUsage,
    liked: msg.liked,
    disliked: msg.disliked,
    bookmarked: msg.bookmarked,
  };
}

// 可用模型列表
const AVAILABLE_MODELS = AI_MODELS.map((m) => ({
  id: m.id,
  name: m.name,
  icon: "✨",
}));

// 建议问题
const SUGGESTIONS = [
  { label: "帮我写一段代码", prompt: "帮我写一个 React 组件" },
  { label: "解释一个概念", prompt: "解释一下什么是微服务架构" },
  { label: "总结文章内容", prompt: "帮我总结以下文章的主要内容" },
  { label: "提供建议", prompt: "给我一些提高工作效率的建议" },
];

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  // 状态
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [useStreaming, setUseStreaming] = useState(true); // 是否使用流式响应
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // 消息编辑状态
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  
  // 回复状态
  const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null);
  
  // 快捷回复建议
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  
  // AI 参数设置
  const [aiParams, setAiParams] = useState<AIParameters>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // 流式聊天 hook
  const { streamChat, cancelStream, isStreaming } = useStreamingChat();

  // 加载对话详情
  const fetchConversation = useCallback(async () => {
    if (!conversationId || conversationId === "new") {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const conv = await conversationApi.get(conversationId, 100);
      setConversation(conv);
      setSelectedModel(conv.model || "gpt-4");
      setEditTitle(conv.title);
      
      // 加载 AI 参数
      setAiParams({
        temperature: conv.temperature,
        maxTokens: conv.maxTokens,
        topP: conv.topP,
        topK: conv.topK,
        frequencyPenalty: conv.frequencyPenalty,
        presencePenalty: conv.presencePenalty,
      });

      // 转换消息格式（需要反转顺序，因为 API 返回的是最新的在前）
      if (conv.messages && conv.messages.length > 0) {
        const displayMessages = conv.messages
          .map(toDisplayMessage)
          .reverse();
        setMessages(displayMessages);
      }
    } catch (err) {
      console.error("Failed to fetch conversation:", err);
      setError("加载对话失败，请重试");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  // 发送消息
  const handleSend = async (content: string) => {
    if (!content.trim() || sending) return;

    let currentConversationId = conversationId;

    // 如果是新对话，先创建对话
    if (conversationId === "new") {
      try {
        const newConv = await conversationApi.create({
          title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
          model: selectedModel,
        });
        currentConversationId = newConv.id;
        setConversation(newConv);
        // 更新 URL（不刷新页面）
        window.history.replaceState(null, "", `/chat/${newConv.id}`);
      } catch (err) {
        console.error("Failed to create conversation:", err);
        setError("创建对话失败");
        return;
      }
    }

    // 创建用户消息临时显示
    const tempUserMessageId = `temp-user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: tempUserMessageId,
      role: "user",
      content,
      timestamp: new Date(),
      parentId: replyingToMessage?.id,
      parentMessage: replyingToMessage || undefined,
    };

    // 创建 AI 消息占位
    const tempAiMessageId = `temp-ai-${Date.now()}`;
    const aiMessage: ChatMessage = {
      id: tempAiMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      model: selectedModel,
    };

    // 清除回复状态
    const replyParentId = replyingToMessage?.id;
    setReplyingToMessage(null);

    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setSending(true);
    setStreamingMessageId(tempAiMessageId);

    try {
      if (useStreaming) {
        // 使用流式响应
        const fullContent = await streamChat(currentConversationId, content, {
          model: selectedModel,
          onToken: (token) => {
            // 实时更新 AI 消息内容
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === tempAiMessageId
                  ? { ...msg, content: msg.content + token }
                  : msg
              )
            );
          },
          onComplete: (finalContent) => {
            // 流式响应完成，更新最终内容
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === tempAiMessageId
                  ? { ...msg, content: finalContent }
                  : msg
              )
            );
          },
          onError: (error) => {
            console.error("Streaming error:", error);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === tempAiMessageId
                  ? { ...msg, content: "抱歉，发送消息时出现错误。请重试。" }
                  : msg
              )
            );
          },
        });
      } else {
        // 使用非流式响应
        const response = await conversationApi.chat(currentConversationId, content, {
          model: selectedModel,
        });

        // 更新消息为真实的 ID 和内容
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === tempUserMessageId) {
              return {
                ...msg,
                id: response.userMessage.id,
              };
            }
            if (msg.id === tempAiMessageId) {
              return {
                ...msg,
                id: response.aiMessage.id,
                content: response.aiMessage.content,
                model: response.aiMessage.model,
              };
            }
            return msg;
          })
        );
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      // 显示错误消息
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempAiMessageId
            ? { ...msg, content: "抱歉，发送消息时出现错误。请重试。" }
            : msg
        )
      );
    } finally {
      setSending(false);
      setStreamingMessageId(null);
      
      // 生成快捷回复建议（基于对话内容生成一些建议）
      generateQuickReplies();
    }
  };

  // 生成快捷回复建议
  const generateQuickReplies = () => {
    // 基于最近的对话内容生成一些常用的后续问题
    const suggestions = [
      "继续解释",
      "能举个例子吗？",
      "有什么需要注意的？",
      "总结一下",
    ];
    setQuickReplies(suggestions);
  };

  // 取消发送
  const handleCancel = () => {
    // 取消流式请求
    cancelStream();
    // 取消普通请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setSending(false);
    setStreamingMessageId(null);
  };

  // 重新生成
  const handleRegenerate = async (messageId: string) => {
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    // 找到之前的用户消息
    const prevUserMessage = messages
      .slice(0, messageIndex)
      .reverse()
      .find((m) => m.role === "user");

    if (prevUserMessage) {
      // 删除当前 AI 消息和之后的消息
      setMessages((prev) => prev.slice(0, messageIndex));
      // 重新发送
      await handleSend(prevUserMessage.content);
    }
  };

  // 开始编辑消息
  const startEditMessage = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (message) {
      setEditingMessageId(messageId);
      setEditingContent(message.content);
    }
  };

  // 保存消息编辑
  const saveEditMessage = async () => {
    if (!editingMessageId || !editingContent.trim() || !conversation) return;

    try {
      await conversationApi.updateMessage(
        conversation.id,
        editingMessageId,
        editingContent.trim()
      );

      setMessages((prev) =>
        prev.map((m) =>
          m.id === editingMessageId
            ? { ...m, content: editingContent.trim() }
            : m
        )
      );
      setEditingMessageId(null);
      setEditingContent("");
    } catch (err) {
      console.error("Failed to update message:", err);
    }
  };

  // 取消消息编辑
  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  // 删除消息
  const handleDeleteMessage = async (messageId: string) => {
    if (!conversation) return;
    
    try {
      await conversationApi.deleteMessage(conversation.id, messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  // 消息反馈（点赞/点踩/收藏）
  const handleMessageFeedback = async (messageId: string, action: "like" | "dislike" | "bookmark") => {
    if (!conversation) return;
    
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    // 先乐观更新 UI
    const newLiked = action === "like" ? !message.liked : (action === "dislike" && message.liked ? false : message.liked);
    const newDisliked = action === "dislike" ? !message.disliked : (action === "like" && message.disliked ? false : message.disliked);
    const newBookmarked = action === "bookmark" ? !message.bookmarked : message.bookmarked;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, liked: newLiked, disliked: newDisliked, bookmarked: newBookmarked }
          : m
      )
    );

    try {
      // 调用 API 持久化
      await conversationApi.updateMessageFeedback(conversation.id, messageId, {
        liked: action === "like" ? newLiked : undefined,
        disliked: action === "dislike" ? newDisliked : undefined,
        bookmarked: action === "bookmark" ? newBookmarked : undefined,
      });
    } catch (err) {
      console.error("Failed to update message feedback:", err);
      // 回滚 UI
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, liked: message.liked, disliked: message.disliked, bookmarked: message.bookmarked }
            : m
        )
      );
    }
  };

  // 消息操作
  const handleMessageAction = (action: string, messageId: string) => {
    switch (action) {
      case "regenerate":
        handleRegenerate(messageId);
        break;
      case "edit":
        startEditMessage(messageId);
        break;
      case "delete":
        handleDeleteMessage(messageId);
        break;
      case "like":
      case "dislike":
      case "bookmark":
        handleMessageFeedback(messageId, action);
        break;
      case "reply":
        const replyTarget = messages.find((m) => m.id === messageId);
        if (replyTarget) {
          setReplyingToMessage(replyTarget);
        }
        break;
    }
  };

  // 取消回复
  const cancelReply = () => {
    setReplyingToMessage(null);
  };

  // 切换收藏
  const handleToggleStar = async () => {
    if (!conversation) return;
    try {
      await conversationApi.setStarred(conversation.id, !conversation.starred);
      setConversation((prev) =>
        prev ? { ...prev, starred: !prev.starred } : null
      );
    } catch (err) {
      console.error("Failed to toggle star:", err);
    }
  };

  // 归档对话
  const handleArchive = async () => {
    if (!conversation) return;
    try {
      await conversationApi.setArchived(conversation.id, true);
      router.push("/dashboard/conversations");
    } catch (err) {
      console.error("Failed to archive:", err);
    }
  };

  // 删除对话
  const handleDelete = async () => {
    if (!conversation) return;
    if (!confirm("确定要删除这个对话吗？")) return;
    try {
      await conversationApi.delete(conversation.id);
      router.push("/dashboard/conversations");
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  // 更新标题
  const handleUpdateTitle = async () => {
    if (!conversation || !editTitle.trim()) return;
    try {
      await conversationApi.update(conversation.id, { title: editTitle });
      setConversation((prev) =>
        prev ? { ...prev, title: editTitle } : null
      );
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update title:", err);
    }
  };

  // 加载状态
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background-studio">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-background-studio">
        <p className="text-foreground-light">{error}</p>
        <Button onClick={fetchConversation}>
          <RefreshCw className="w-4 h-4 mr-2" />
          重试
        </Button>
      </div>
    );
  }

  const isNewConversation = conversationId === "new" || !conversation;
  const messageCount = messages.length || conversation?.messageCount || 0;
  const lastUpdatedLabel = conversation?.updatedAt
    ? formatRelativeTime(conversation.updatedAt)
    : messageCount > 0
      ? "刚刚"
      : "—";

  return (
    <div className="flex h-full flex-col bg-background-studio">
      {/* 头部 */}
      <header className="shrink-0 border-b border-border bg-surface-75/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-start justify-between gap-4 px-6 py-3">
          <div className="flex items-start gap-3 min-w-0">
            <Link href="/dashboard/conversations">
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-foreground-muted hover:text-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>

            <div className="min-w-0">
              <div className="page-caption flex items-center gap-2">
                <span>对话</span>
                <span className="h-1 w-1 rounded-full bg-foreground-muted" />
                <span>{isNewConversation ? "新对话" : "对话详情"}</span>
              </div>

              {isEditing ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    inputSize="sm"
                    className="w-64 bg-surface-100 border-border focus:border-brand-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdateTitle();
                      if (e.key === "Escape") setIsEditing(false);
                    }}
                  />
                  <Button size="sm" onClick={handleUpdateTitle}>
                    保存
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                    className="text-foreground-muted hover:text-foreground"
                  >
                    取消
                  </Button>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-2 min-w-0">
                  <h1 className="text-[14px] font-medium text-foreground truncate max-w-[360px]">
                    {conversation?.title || "新对话"}
                  </h1>
                  {conversation?.starred && (
                    <Star className="w-4 h-4 text-warning fill-warning" />
                  )}
                </div>
              )}

              <p className="mt-1 text-[11px] text-foreground-muted">
                当前模型 {getModelDisplayName(selectedModel)} · {messageCount} 条消息 · 更新 {lastUpdatedLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* AI 设置 */}
            <div className="flex items-center gap-1 rounded-md border border-border bg-surface-100 p-1">
              <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-foreground-muted hover:text-foreground"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="bg-surface-100 border-border">
                  <SheetHeader>
                    <SheetTitle className="text-foreground">AI 参数设置</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <AISettingsPanel
                      params={aiParams}
                      onChange={(params) => {
                        setAiParams(params);
                        // 如果对话已存在，保存到服务器
                        if (conversation) {
                          conversationApi.update(conversation.id, params).catch(console.error);
                        }
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* 模型选择 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2 border-border text-[12px] text-foreground-light hover:text-foreground hover:bg-surface-200"
                >
                  <Sparkles className="w-4 h-4 text-brand-500" />
                  {getModelDisplayName(selectedModel)}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-surface-100 border-border">
                {AVAILABLE_MODELS.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className="text-foreground-light hover:text-foreground hover:bg-surface-200"
                  >
                    <span className="mr-2">{model.icon}</span>
                    {model.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {!isNewConversation && (
              <div className="flex items-center gap-1 rounded-md border border-border bg-surface-100 p-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-foreground-muted hover:text-foreground"
                  onClick={handleToggleStar}
                >
                  <Star
                    className={cn(
                      "w-5 h-5",
                      conversation?.starred && "text-warning fill-warning"
                    )}
                  />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-foreground-muted hover:text-foreground"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-surface-100 border-border">
                    <DropdownMenuItem onClick={() => setIsEditing(true)} className="text-foreground-light hover:text-foreground hover:bg-surface-200">
                      <Edit3 className="w-4 h-4 mr-2" />
                      重命名
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-foreground-light hover:text-foreground hover:bg-surface-200">
                      <Share2 className="w-4 h-4 mr-2" />
                      分享
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem onClick={handleArchive} className="text-foreground-light hover:text-foreground hover:bg-surface-200">
                      <Archive className="w-4 h-4 mr-2" />
                      归档
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive hover:bg-destructive-200"
                      onClick={handleDelete}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 消息区域 */}
      <main className="flex-1 overflow-auto scrollbar-thin">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-6">
          <div className="page-panel overflow-hidden">
            <div className="page-panel-header flex items-center justify-between">
              <div>
                <h2 className="page-panel-title">消息</h2>
                <p className="page-panel-description">
                  {messages.length > 0 ? "最新对话内容" : "准备开始对话"}
                </p>
              </div>
              <span className="text-xs text-foreground-muted">
                {messageCount} 条
              </span>
            </div>
            {messages.length === 0 ? (
              <WelcomeMessage
                title="开始新对话"
                description="输入您的问题或选择一个建议开始对话。AI 助手将为您提供帮助。"
                suggestions={SUGGESTIONS}
                onSuggestionClick={handleSend}
                className="min-h-[60vh] border-t border-border/60"
              />
            ) : (
              <ChatMessages
                messages={messages}
                isLoading={sending}
                streamingMessageId={streamingMessageId}
                editingMessageId={editingMessageId}
                editingContent={editingContent}
                onEditingContentChange={setEditingContent}
                onSaveEdit={saveEditMessage}
                onCancelEdit={cancelEditMessage}
                onMessageAction={handleMessageAction}
                className="border-t border-border/60"
              />
            )}
          </div>
        </div>
      </main>

      <div className="shrink-0 border-t border-border bg-background-studio/95">
        <div className="mx-auto w-full max-w-5xl px-6">
          {/* 快捷回复建议 */}
          {!sending && messages.length > 0 && quickReplies.length > 0 && (
            <div className="pt-3 pb-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="page-caption">快捷回复</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[11px] text-foreground-muted hover:text-foreground"
                  onClick={() => setQuickReplies([])}
                >
                  清除
                </Button>
              </div>
              <QuickReplies
                suggestions={quickReplies}
                onSelect={(suggestion) => {
                  handleSend(suggestion);
                  setQuickReplies([]);
                }}
              />
            </div>
          )}

          {/* 回复指示器 */}
          {replyingToMessage && (
            <div className="mb-2 rounded-md border border-border border-l-2 border-l-brand-500/30 bg-surface-75/80 px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12px]">
                  <MessageSquare className="w-4 h-4 text-brand-500" />
                  <span className="text-foreground-muted">
                    回复 {replyingToMessage.role === "user" ? "你" : "AI"}：
                  </span>
                  <span className="text-foreground truncate max-w-[320px] font-medium">
                    {replyingToMessage.content.slice(0, 50)}
                    {replyingToMessage.content.length > 50 && "..."}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelReply}
                  className="h-6 px-2 text-xs text-foreground-muted hover:text-foreground"
                >
                  取消
                </Button>
              </div>
            </div>
          )}

          {/* 输入区域 */}
          <ChatInput
            onSend={handleSend}
            onCancel={handleCancel}
            isLoading={sending}
            placeholder={replyingToMessage ? "输入回复内容..." : "输入消息，按 Enter 发送..."}
            showModels={false}
            models={AVAILABLE_MODELS}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            className="border-t-0 bg-transparent px-0"
          />
        </div>
      </div>
    </div>
  );
}
