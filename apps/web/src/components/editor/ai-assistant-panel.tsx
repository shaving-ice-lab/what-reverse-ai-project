'use client'

/**
 * AI Assistant Panel Component
 *
 * Features:
 * - Conversation Input
 * - Conversation History Display
 * - Generation Preview
 * - Generate / Regenerate Button
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  RefreshCw,
  Wand2,
  Database,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertCircle,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'

// ========== Type Definitions ==========

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  workflowJSON?: string
  uiSchema?: Record<string, unknown>
  dbSchema?: Record<string, unknown> | string
  suggestions?: string[]
  actions?: ChatAction[]
  isLoading?: boolean
  error?: string
}

export interface ChatAction {
  type: 'generate' | 'modify' | 'modify_app' | 'explain' | 'suggest'
  label: string
  data?: Record<string, unknown>
}

export interface NodeSuggestion {
  nodeType: string
  nodeName: string
  description: string
  confidence: number
  reason: string
}

export interface AIAssistantPanelProps {
  /** Generate Workflow Callback */
  onGenerateWorkflow?: (workflowJSON: string) => void
  /** Apply Workflow Callback */
  onApplyWorkflow?: (workflowJSON: string) => void
  /** Get Node Suggestion Callback */
  onGetNodeSuggestion?: (nodeId: string) => Promise<NodeSuggestion[]>
  /** Whether expanded */
  isExpanded?: boolean
  /** Expanded State Callback */
  onExpandedChange?: (expanded: boolean) => void
  /** Custom Class Name */
  className?: string
}

// Example Prompts
const EXAMPLE_PROMPTS = [
  'Create an article summary workflow: input an article link, output a summary',
  'Build an auto-reply support bot',
  'Create a data analytics flow that fetches data from an API and uses AI to analyze it',
  'Create an email auto-categorization and reply workflow',
]

// ========== Message Component ==========

interface MessageItemProps {
  message: ChatMessage
  onApplyWorkflow?: (json: string) => void
  onActionClick?: (action: ChatAction) => void
}

function MessageItem({ message, onApplyWorkflow, onActionClick }: MessageItemProps) {
  const [copiedTarget, setCopiedTarget] = useState<'workflow' | 'db' | null>(null)
  const [showJSON, setShowJSON] = useState(false)
  const [showDBSchema, setShowDBSchema] = useState(false)

  const handleCopy = async (text: string, target: 'workflow' | 'db') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedTarget(target)
      toast.success('Copied')
      setTimeout(() => setCopiedTarget(null), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const isUser = message.role === 'user'
  const dbSchemaText = message.dbSchema
    ? typeof message.dbSchema === 'string'
      ? message.dbSchema
      : JSON.stringify(message.dbSchema, null, 2)
    : ''

  return (
    <div className={cn('flex gap-3 p-4', isUser ? 'bg-transparent' : 'bg-surface-200/40')}>
      {/* Avatar */}
      <div
        className={cn(
          'shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-surface-200' : 'bg-brand-200/60'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-brand-500" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-foreground">
            {isUser ? 'You' : 'AI Assistant'}
          </span>
          <span className="text-xs text-foreground-muted">
            {message.timestamp.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Message Content */}
        {message.isLoading ? (
          <div className="flex items-center gap-2 text-foreground-muted">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        ) : message.error ? (
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{message.error}</span>
          </div>
        ) : (
          <p className="text-sm text-foreground whitespace-pre-wrap">{message.content}</p>
        )}

        {/* Generated Workflow */}
        {message.workflowJSON && (
          <div className="mt-3 rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setShowJSON(!showJSON)}
              className="w-full flex items-center justify-between p-3 bg-surface-100 hover:bg-surface-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-brand-500" />
                <span className="text-sm font-medium text-foreground">Generated Workflow</span>
              </div>
              {showJSON ? (
                <ChevronUp className="w-4 h-4 text-foreground-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-foreground-muted" />
              )}
            </button>

            {showJSON && (
              <div className="p-3 bg-surface-100">
                <pre className="text-xs text-foreground-muted font-mono overflow-x-auto max-h-48">
                  {message.workflowJSON}
                </pre>
              </div>
            )}

            <div className="flex items-center gap-2 p-3 border-t border-border">
              <Button
                size="sm"
                className="bg-brand-500 hover:bg-brand-600 text-background"
                onClick={() => onApplyWorkflow?.(message.workflowJSON!)}
              >
                <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                Apply to Canvas
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-border"
                onClick={() => handleCopy(message.workflowJSON!, 'workflow')}
              >
                {copiedTarget === 'workflow' ? (
                  <Check className="w-3.5 h-3.5 mr-1.5 text-brand-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                )}
                Copy JSON
              </Button>
            </div>
          </div>
        )}

        {/* Data Model Suggestion */}
        {message.dbSchema && (
          <div className="mt-3 rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setShowDBSchema(!showDBSchema)}
              className="w-full flex items-center justify-between p-3 bg-surface-100 hover:bg-surface-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-brand-500" />
                <span className="text-sm font-medium text-foreground">Data Model Suggestion</span>
              </div>
              {showDBSchema ? (
                <ChevronUp className="w-4 h-4 text-foreground-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-foreground-muted" />
              )}
            </button>

            {showDBSchema && (
              <div className="p-3 bg-surface-100">
                <pre className="text-xs text-foreground-muted font-mono overflow-x-auto max-h-48">
                  {dbSchemaText}
                </pre>
              </div>
            )}

            <div className="flex items-center gap-2 p-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="border-border"
                onClick={() => handleCopy(dbSchemaText, 'db')}
              >
                {copiedTarget === 'db' ? (
                  <Check className="w-3.5 h-3.5 mr-1.5 text-brand-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                )}
                Copy JSON
              </Button>
            </div>
          </div>
        )}

        {/* Suggestion */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Suggestion</span>
            </div>
            {message.suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="text-xs text-foreground-muted pl-5 flex items-start gap-1.5"
              >
                <span className="text-foreground-muted/60">•</span>
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {message.actions && message.actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.actions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="h-7 text-xs border-border hover:border-brand-500 hover:text-brand-500"
                onClick={() => onActionClick?.(action)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ========== Main Component ==========

export function AIAssistantPanel({
  onGenerateWorkflow,
  onApplyWorkflow,
  onGetNodeSuggestion,
  isExpanded = true,
  onExpandedChange,
  className,
}: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I'm your AI assistant and I can help you quickly create workflows.\n\nTell me what task you want to automate, and I'll generate a workflow for you.",
      timestamp: new Date(),
      actions: [
        { type: 'generate', label: 'Create New Workflow' },
        { type: 'suggest', label: 'View Examples' },
      ],
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showExamples, setShowExamples] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Send Message
  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Call AI API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversation_history: messages
            .filter((m) => m.role !== 'system')
            .slice(-10)
            .map((m) => ({
              role: m.role,
              content: m.content,
            })),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to request')
      }

      const data = await response.json()
      const aiResponse = data.data?.response

      // Update Assistant Message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? {
                ...m,
                content:
                  aiResponse?.message || 'I understand your requirements. Let me process that...',
                workflowJSON: aiResponse?.workflow_json,
                uiSchema: aiResponse?.ui_schema,
                dbSchema: aiResponse?.db_schema,
                suggestions: aiResponse?.suggestions,
                actions: aiResponse?.actions,
                isLoading: false,
              }
            : m
        )
      )

      // If a workflow was generated, trigger the callback
      if (aiResponse?.workflow_json) {
        onGenerateWorkflow?.(aiResponse.workflow_json)
      }
    } catch (error) {
      // Mock Response (Development Environment)
      const mockWorkflow = generateMockWorkflow(userMessage.content)

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? {
                ...m,
                content: `Based on your description "${userMessage.content}", I've created a workflow.\n\nThis workflow contains the following steps:\n1. Start node receives input\n2. AI processing node analyzes content\n3. Template node formats output\n4. End node returns result`,
                workflowJSON: mockWorkflow,
                suggestions: [
                  'You can add condition nodes to handle different scenarios',
                  'Consider adding error handling logic',
                ],
                isLoading: false,
              }
            : m
        )
      )

      onGenerateWorkflow?.(mockWorkflow)
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, onGenerateWorkflow])

  // Handle keypress
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Handle Action Click
  const handleActionClick = (action: ChatAction) => {
    if (action.type === 'suggest') {
      setShowExamples(true)
    } else if (
      action.type === 'generate' ||
      action.type === 'modify' ||
      action.type === 'modify_app'
    ) {
      textareaRef.current?.focus()
    }
  }

  // Use Example
  const handleUseExample = (example: string) => {
    setInput(example)
    setShowExamples(false)
    textareaRef.current?.focus()
  }

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn(
          'fixed bottom-4 right-4 h-12 px-4 gap-2',
          'bg-brand-200/40 border-brand-500/30 hover:border-brand-500/50',
          'text-brand-500 hover:text-brand-600',
          className
        )}
        onClick={() => onExpandedChange?.(true)}
      >
        <Sparkles className="w-5 h-5" />
        <span>AI Assistant</span>
      </Button>
    )
  }

  return (
    <div className={cn('flex flex-col h-full bg-surface-100 border-l border-border', className)}>
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-200/60 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-brand-500" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">AI Assistant</h3>
            <p className="text-[10px] text-foreground-muted">Conversational Workflow Generation</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onExpandedChange?.(false)}
                >
                  <Minimize2 className="w-4 h-4 text-foreground-muted" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Collapse</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Message List */}
      <ScrollArea ref={scrollRef} className="flex-1">
        <div className="divide-y divide-border/50">
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              onApplyWorkflow={onApplyWorkflow}
              onActionClick={handleActionClick}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Example Prompts */}
      {showExamples && (
        <div className="shrink-0 p-4 border-t border-border bg-surface-200/60">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-foreground-muted">Example Prompts</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowExamples(false)}
            >
              <X className="w-3.5 h-3.5 text-foreground-muted" />
            </Button>
          </div>
          <div className="space-y-2">
            {EXAMPLE_PROMPTS.map((example, index) => (
              <button
                key={index}
                onClick={() => handleUseExample(example)}
                className="w-full text-left p-2.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-sm text-foreground transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="shrink-0 p-4 border-t border-border">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the workflow you want to create..."
            className="min-h-[80px] pr-12 resize-none bg-surface-200 border-border focus:border-brand-500 placeholder:text-foreground-muted"
            disabled={isLoading}
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setShowExamples(!showExamples)}
                  >
                    <Lightbulb className="w-4 h-4 text-foreground-muted" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Example</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              size="sm"
              className="h-8 w-8 p-0 bg-brand-500 hover:bg-brand-600"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-background" />
              ) : (
                <Send className="w-4 h-4 text-background" />
              )}
            </Button>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-foreground-muted">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  )
}

// Generate Mock Workflow (Development Environment)
function generateMockWorkflow(description: string): string {
  const workflow = {
    name: `AI Generate: ${description.slice(0, 20)}...`,
    description: description,
    nodes: [
      {
        id: 'start-1',
        type: 'start',
        position: { x: 100, y: 200 },
        data: { label: 'Start' },
      },
      {
        id: 'llm-1',
        type: 'llm',
        position: { x: 350, y: 200 },
        data: {
          label: 'AI Process',
          model: 'gpt-4o-mini',
          systemPrompt: 'You are a helpful assistant.',
          userPrompt: '{{input}}',
          temperature: 0.7,
        },
      },
      {
        id: 'template-1',
        type: 'template',
        position: { x: 600, y: 200 },
        data: {
          label: 'Format Output',
          template: 'Processing Result:\n\n{{llm-1.text}}',
        },
      },
      {
        id: 'end-1',
        type: 'end',
        position: { x: 850, y: 200 },
        data: { label: 'End' },
      },
    ],
    edges: [
      { id: 'e1', source: 'start-1', target: 'llm-1' },
      { id: 'e2', source: 'llm-1', target: 'template-1' },
      { id: 'e3', source: 'template-1', target: 'end-1' },
    ],
  }

  return JSON.stringify(workflow, null, 2)
}

export default AIAssistantPanel
