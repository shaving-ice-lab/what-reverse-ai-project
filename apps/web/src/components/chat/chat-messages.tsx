'use client'

/**
 * Chat Message Component
 * Used to display conversation message list
 */

import { useState, useRef, useEffect, ReactNode } from 'react'
import {
  User,
  Bot,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  MoreHorizontal,
  Volume2,
  VolumeX,
  Bookmark,
  Share2,
  Flag,
  Sparkles,
  Clock,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  Code,
  FileText,
  Image as ImageIcon,
  Loader2,
  Reply,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

// ============================================
// Type Definitions
// ============================================

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  model?: string
  tokens?: number
  liked?: boolean
  disliked?: boolean
  bookmarked?: boolean
  attachments?: { type: 'image' | 'file' | 'code'; name: string; url?: string }[]
  parentId?: string // Replied message ID
  parentMessage?: ChatMessage // Referenced message content (for display)
}

// ============================================
// Message Bubble
// ============================================

interface MessageBubbleProps {
  message: ChatMessage
  isStreaming?: boolean
  isEditing?: boolean
  editingContent?: string
  onEditingContentChange?: (content: string) => void
  onSaveEdit?: () => void
  onCancelEdit?: () => void
  onCopy?: () => void
  onLike?: () => void
  onDislike?: () => void
  onReply?: () => void
  onRegenerate?: () => void
  onBookmark?: () => void
  onEdit?: () => void
  onDelete?: () => void
  showActions?: boolean
  className?: string
}

export function MessageBubble({
  message,
  isStreaming = false,
  isEditing = false,
  editingContent = '',
  onEditingContentChange,
  onSaveEdit,
  onCancelEdit,
  onCopy,
  onLike,
  onDislike,
  onReply,
  onRegenerate,
  onBookmark,
  onEdit,
  onDelete,
  showActions = true,
  className,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const isUser = message.role === 'user'
  const isLongMessage = message.content.length > 500

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onCopy?.()
  }

  // Text-to-speech feature
  const handleSpeak = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    } else {
      const utterance = new SpeechSynthesisUtterance(message.content)
      utterance.lang = 'zh-CN'
      utterance.rate = 1
      utterance.pitch = 1
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utterance)
      setIsSpeaking(true)
    }
  }

  const displayContent =
    isExpanded || !isLongMessage ? message.content : message.content.slice(0, 500) + '...'

  return (
    <div
      className={cn(
        'group flex gap-4 px-6 py-5 transition-colors',
        isUser ? 'bg-transparent hover:bg-surface-75/40' : 'bg-surface-100/70 hover:bg-surface-100',
        className
      )}
    >
      {/* Avatar */}
      <Avatar className="w-8 h-8 shrink-0">
        {isUser ? (
          <AvatarFallback className="bg-surface-200 text-foreground">
            <User className="w-4 h-4" />
          </AvatarFallback>
        ) : (
          <AvatarFallback className="bg-brand-500/15 text-brand-500">
            <Sparkles className="w-4 h-4" />
          </AvatarFallback>
        )}
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Reply reference */}
        {message.parentMessage && (
          <div className="flex items-start gap-2 p-2 rounded-md bg-surface-100 border border-border border-l-brand-500/40">
            <Reply className="w-4 h-4 text-foreground-muted shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-xs text-foreground-muted">
                Replying to {message.parentMessage.role === 'user' ? 'You' : 'AI'}:
              </span>
              <p className="text-sm text-foreground-light line-clamp-2">
                {message.parentMessage.content.slice(0, 100)}
                {message.parentMessage.content.length > 100 && '...'}
              </p>
            </div>
          </div>
        )}

        {/* Header Info */}
        <div className="flex items-center gap-2 text-[13px]">
          <span className="font-medium text-foreground">
            {isUser ? 'You' : message.model || 'AI Assistant'}
          </span>
          <span className="text-foreground-light text-xs">
            {message.timestamp.toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {message.tokens && (
            <span className="px-1.5 py-0.5 rounded bg-surface-200 text-[10px] text-foreground-muted">
              {message.tokens} tokens
            </span>
          )}
          {message.bookmarked && <Bookmark className="w-3.5 h-3.5 text-warning fill-warning" />}
        </div>

        {/* Message Content */}
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editingContent}
              onChange={(e) => onEditingContentChange?.(e.target.value)}
              className="min-h-[100px] resize-y bg-surface-100"
              placeholder="Edit message content..."
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={onSaveEdit}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={onCancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-foreground leading-relaxed">
              {displayContent}
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-brand-500 animate-pulse" />
              )}
            </p>
          </div>
        )}

        {/* Message Expand/Collapse */}
        {!isEditing && isLongMessage && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Expand All
              </>
            )}
          </button>
        )}

        {/* Attachment */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-100 border border-border text-xs"
              >
                {attachment.type === 'image' && <ImageIcon className="w-4 h-4 text-brand-500" />}
                {attachment.type === 'file' && (
                  <FileText className="w-4 h-4 text-foreground-muted" />
                )}
                {attachment.type === 'code' && <Code className="w-4 h-4 text-foreground-muted" />}
                <span className="text-foreground">{attachment.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {showActions && !isStreaming && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-foreground-muted hover:text-foreground"
              onClick={handleCopy}
            >
              {copied ? <Check className="w-4 h-4 text-brand-500" /> : <Copy className="w-4 h-4" />}
            </Button>

            {!isUser && (
              <>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className={cn(
                    'text-foreground-muted hover:text-foreground',
                    message.liked && 'text-brand-500'
                  )}
                  onClick={onLike}
                >
                  <ThumbsUp className={cn('w-4 h-4', message.liked && 'fill-current')} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className={cn(
                    'text-foreground-muted hover:text-foreground',
                    message.disliked && 'text-destructive-400'
                  )}
                  onClick={onDislike}
                >
                  <ThumbsDown className={cn('w-4 h-4', message.disliked && 'fill-current')} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-foreground-muted hover:text-foreground"
                  onClick={onRegenerate}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-foreground-muted hover:text-foreground"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-surface-100 border-border">
                <DropdownMenuItem
                  onClick={onReply}
                  className="text-foreground-light hover:text-foreground hover:bg-surface-200"
                >
                  <Reply className="w-4 h-4" />
                  Reply
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onBookmark}
                  className="text-foreground-light hover:text-foreground hover:bg-surface-200"
                >
                  <Bookmark className="w-4 h-4" />
                  {message.bookmarked ? 'Remove Bookmark' : 'Bookmark'}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-foreground-light hover:text-foreground hover:bg-surface-200">
                  <Share2 className="w-4 h-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleSpeak}
                  className="text-foreground-light hover:text-foreground hover:bg-surface-200"
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-4 h-4" />
                      Stop Reading
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      Read Aloud
                    </>
                  )}
                </DropdownMenuItem>
                {isUser && (
                  <>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem
                      onClick={onEdit}
                      className="text-foreground-light hover:text-foreground hover:bg-surface-200"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive-400 hover:bg-destructive-200"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// Message List
// ============================================

interface ChatMessagesProps {
  messages: ChatMessage[]
  isLoading?: boolean
  streamingMessageId?: string
  editingMessageId?: string | null
  editingContent?: string
  onEditingContentChange?: (content: string) => void
  onSaveEdit?: () => void
  onCancelEdit?: () => void
  onMessageAction?: (action: string, messageId: string) => void
  className?: string
}

export function ChatMessages({
  messages,
  isLoading = false,
  streamingMessageId,
  editingMessageId,
  editingContent = '',
  onEditingContentChange,
  onSaveEdit,
  onCancelEdit,
  onMessageAction,
  className,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className={cn('flex flex-col divide-y divide-border/60', className)}>
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isStreaming={streamingMessageId === message.id}
          isEditing={editingMessageId === message.id}
          editingContent={editingMessageId === message.id ? editingContent : undefined}
          onEditingContentChange={onEditingContentChange}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onCopy={() => onMessageAction?.('copy', message.id)}
          onLike={() => onMessageAction?.('like', message.id)}
          onDislike={() => onMessageAction?.('dislike', message.id)}
          onReply={() => onMessageAction?.('reply', message.id)}
          onRegenerate={() => onMessageAction?.('regenerate', message.id)}
          onBookmark={() => onMessageAction?.('bookmark', message.id)}
          onEdit={() => onMessageAction?.('edit', message.id)}
          onDelete={() => onMessageAction?.('delete', message.id)}
        />
      ))}

      {isLoading && !streamingMessageId && (
        <div className="flex gap-4 px-6 py-5 bg-surface-100/70">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-brand-500/15 text-brand-500">
              <Sparkles className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-foreground-muted" />
            <span className="text-sm text-foreground-light">AI is thinking...</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}

// ============================================
// Welcome Message
// ============================================

interface WelcomeMessageProps {
  title?: string
  description?: string
  suggestions?: { label: string; prompt: string }[]
  onSuggestionClick?: (prompt: string) => void
  className?: string
}

export function WelcomeMessage({
  title = "Hi! I'm Your AI Assistant",
  description = 'I can help you with various tasks, such as answering questions, writing, programming, and more. How can I help you?',
  suggestions = [],
  onSuggestionClick,
  className,
}: WelcomeMessageProps) {
  return (
    <div className={cn('flex w-full flex-col items-center justify-center py-10', className)}>
      <div className="w-full max-w-3xl space-y-6">
        <div className="flex items-start gap-4 rounded-lg border border-border bg-surface-100 px-6 py-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-500/15 text-brand-500">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-foreground-light">{description}</p>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSuggestionClick?.(suggestion.prompt)}
                className="rounded-lg border border-border bg-surface-100 px-4 py-3 text-left transition-colors hover:border-border-strong hover:bg-surface-200 group"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground group-hover:text-brand-500 transition-colors">
                    {suggestion.label}
                  </p>
                  <span className="text-[10px] uppercase tracking-wider text-foreground-muted">
                    Quick Start
                  </span>
                </div>
                <p className="mt-2 text-xs text-foreground-light line-clamp-1">
                  {suggestion.prompt}
                </p>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg border border-border bg-surface-75 px-4 py-3 text-xs text-foreground-muted">
          <span>Tip: Supports file upload, voice input, and quick replies</span>
          <span className="text-brand-500">Enter to send, Shift + Enter for new line</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Date Divider
// ============================================

interface DateDividerProps {
  date: Date
  className?: string
}

export function DateDivider({ date, className }: DateDividerProps) {
  const formatDate = (d: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className={cn('flex items-center gap-4 py-4', className)}>
      <div className="flex-1 h-px bg-border/70" />
      <span className="text-xs text-foreground-muted px-2 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {formatDate(date)}
      </span>
      <div className="flex-1 h-px bg-border/70" />
    </div>
  )
}
