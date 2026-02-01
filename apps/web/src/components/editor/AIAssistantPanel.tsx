"use client";

/**
 * AI 助手面板组件
 *
 * 功能：
 * - 对话输入框
 * - 对话历史显示
 * - 生成预览
 * - 生成/重新生成按钮
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  RefreshCw,
  Wand2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertCircle,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

// ========== 类型定义 ==========

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  workflowJSON?: string;
  suggestions?: string[];
  actions?: ChatAction[];
  isLoading?: boolean;
  error?: string;
}

export interface ChatAction {
  type: "generate" | "modify" | "explain" | "suggest";
  label: string;
  data?: Record<string, unknown>;
}

export interface NodeSuggestion {
  nodeType: string;
  nodeName: string;
  description: string;
  confidence: number;
  reason: string;
}

export interface AIAssistantPanelProps {
  /** 生成工作流回调 */
  onGenerateWorkflow?: (workflowJSON: string) => void;
  /** 应用工作流回调 */
  onApplyWorkflow?: (workflowJSON: string) => void;
  /** 获取节点建议回调 */
  onGetNodeSuggestion?: (nodeId: string) => Promise<NodeSuggestion[]>;
  /** 是否展开 */
  isExpanded?: boolean;
  /** 展开状态变化回调 */
  onExpandedChange?: (expanded: boolean) => void;
  /** 自定义类名 */
  className?: string;
}

// 示例提示
const EXAMPLE_PROMPTS = [
  "创建一个文章摘要工作流，输入文章链接，输出摘要",
  "做一个客服自动回复机器人",
  "帮我创建一个数据分析流程，从 API 获取数据后用 AI 分析",
  "创建一个邮件自动分类和回复的工作流",
];

// ========== 消息组件 ==========

interface MessageItemProps {
  message: ChatMessage;
  onApplyWorkflow?: (json: string) => void;
  onActionClick?: (action: ChatAction) => void;
}

function MessageItem({ message, onApplyWorkflow, onActionClick }: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [showJSON, setShowJSON] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("已复制");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败");
    }
  };

  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 p-4",
        isUser ? "bg-transparent" : "bg-surface-200/40"
      )}
    >
      {/* 头像 */}
      <div
        className={cn(
          "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-surface-200" : "bg-brand-200/60"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-brand-500" />
        )}
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-foreground">
            {isUser ? "你" : "AI 助手"}
          </span>
          <span className="text-xs text-foreground-muted">
            {message.timestamp.toLocaleTimeString("zh-CN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* 消息内容 */}
        {message.isLoading ? (
          <div className="flex items-center gap-2 text-foreground-muted">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">正在思考...</span>
          </div>
        ) : message.error ? (
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{message.error}</span>
          </div>
        ) : (
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {message.content}
          </p>
        )}

        {/* 生成的工作流 */}
        {message.workflowJSON && (
          <div className="mt-3 rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setShowJSON(!showJSON)}
              className="w-full flex items-center justify-between p-3 bg-surface-100 hover:bg-surface-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-brand-500" />
                <span className="text-sm font-medium text-foreground">
                  生成的工作流
                </span>
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
                应用到画布
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-border"
                onClick={() => handleCopy(message.workflowJSON!)}
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 mr-1.5 text-brand-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                )}
                复制 JSON
              </Button>
            </div>
          </div>
        )}

        {/* 建议 */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>建议</span>
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

        {/* 动作按钮 */}
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
  );
}

// ========== 主组件 ==========

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
      id: "welcome",
      role: "assistant",
      content:
        "你好！我是 AI 助手，可以帮你快速创建工作流。\n\n你可以告诉我你想要自动化什么任务，我会帮你生成工作流。",
      timestamp: new Date(),
      actions: [
        { type: "generate", label: "创建新工作流" },
        { type: "suggest", label: "查看示例" },
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 发送消息
  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // 调用 AI API
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          conversation_history: messages
            .filter((m) => m.role !== "system")
            .slice(-10)
            .map((m) => ({
              role: m.role,
              content: m.content,
            })),
        }),
      });

      if (!response.ok) {
        throw new Error("请求失败");
      }

      const data = await response.json();
      const aiResponse = data.data?.response;

      // 更新助手消息
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? {
                ...m,
                content: aiResponse?.message || "我理解了你的需求，让我来处理...",
                workflowJSON: aiResponse?.workflow_json,
                suggestions: aiResponse?.suggestions,
                actions: aiResponse?.actions,
                isLoading: false,
              }
            : m
        )
      );

      // 如果有生成的工作流，触发回调
      if (aiResponse?.workflow_json) {
        onGenerateWorkflow?.(aiResponse.workflow_json);
      }
    } catch (error) {
      // 模拟响应（开发环境）
      const mockWorkflow = generateMockWorkflow(userMessage.content);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? {
                ...m,
                content: `好的，根据你的描述「${userMessage.content}」，我创建了一个工作流。\n\n这个工作流包含以下步骤：\n1. 开始节点接收输入\n2. AI 处理节点分析内容\n3. 模板节点格式化输出\n4. 结束节点返回结果`,
                workflowJSON: mockWorkflow,
                suggestions: [
                  "可以添加条件节点来处理不同情况",
                  "考虑添加错误处理逻辑",
                ],
                isLoading: false,
              }
            : m
        )
      );

      onGenerateWorkflow?.(mockWorkflow);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, onGenerateWorkflow]);

  // 处理按键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 处理动作点击
  const handleActionClick = (action: ChatAction) => {
    if (action.type === "suggest") {
      setShowExamples(true);
    } else if (action.type === "generate") {
      textareaRef.current?.focus();
    }
  };

  // 使用示例
  const handleUseExample = (example: string) => {
    setInput(example);
    setShowExamples(false);
    textareaRef.current?.focus();
  };

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "fixed bottom-4 right-4 h-12 px-4 gap-2",
          "bg-brand-200/40 border-brand-500/30 hover:border-brand-500/50",
          "text-brand-500 hover:text-brand-600",
          className
        )}
        onClick={() => onExpandedChange?.(true)}
      >
        <Sparkles className="w-5 h-5" />
        <span>AI 助手</span>
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-surface-100 border-l border-border",
        className
      )}
    >
      {/* 头部 */}
      <div className="shrink-0 flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-200/60 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-brand-500" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">AI 助手</h3>
            <p className="text-[10px] text-foreground-muted">对话式工作流生成</p>
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
              <TooltipContent>收起</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* 消息列表 */}
      <ScrollArea ref={scrollRef} className="flex-1">
        <div className="divide-y divide-muted/50">
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

      {/* 示例提示 */}
      {showExamples && (
        <div className="shrink-0 p-4 border-t border-border bg-surface-200/60">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-foreground-muted">示例提示</span>
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

      {/* 输入区域 */}
      <div className="shrink-0 p-4 border-t border-border">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="描述你想要创建的工作流..."
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
                <TooltipContent>示例</TooltipContent>
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
          按 Enter 发送，Shift + Enter 换行
        </p>
      </div>
    </div>
  );
}

// 生成模拟工作流（开发环境）
function generateMockWorkflow(description: string): string {
  const workflow = {
    name: `AI 生成: ${description.slice(0, 20)}...`,
    description: description,
    nodes: [
      {
        id: "start-1",
        type: "start",
        position: { x: 100, y: 200 },
        data: { label: "开始" },
      },
      {
        id: "llm-1",
        type: "llm",
        position: { x: 350, y: 200 },
        data: {
          label: "AI 处理",
          model: "gpt-4o-mini",
          systemPrompt: "你是一个有帮助的助手。",
          userPrompt: "{{input}}",
          temperature: 0.7,
        },
      },
      {
        id: "template-1",
        type: "template",
        position: { x: 600, y: 200 },
        data: {
          label: "格式化输出",
          template: "处理结果：\n\n{{llm-1.text}}",
        },
      },
      {
        id: "end-1",
        type: "end",
        position: { x: 850, y: 200 },
        data: { label: "结束" },
      },
    ],
    edges: [
      { id: "e1", source: "start-1", target: "llm-1" },
      { id: "e2", source: "llm-1", target: "template-1" },
      { id: "e3", source: "template-1", target: "end-1" },
    ],
  };

  return JSON.stringify(workflow, null, 2);
}

export default AIAssistantPanel;
