"use client";

/**
 * 聊天输入组件
 * 支持文本输入、文件上传、语音输入等
 */

import { useState, useRef, useCallback, KeyboardEvent } from "react";
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  Image as ImageIcon,
  FileText,
  Code,
  X,
  Sparkles,
  ChevronUp,
  Settings,
  Loader2,
  AtSign,
  Hash,
  Smile,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================
// 类型定义
// ============================================

interface Attachment {
  id: string;
  type: "image" | "file" | "code";
  name: string;
  size: number;
  url?: string;
}

interface ChatInputProps {
  onSend: (message: string, attachments?: Attachment[]) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  maxLength?: number;
  showAttachments?: boolean;
  showVoice?: boolean;
  showModels?: boolean;
  models?: { id: string; name: string; icon?: string }[];
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  disabled?: boolean;
  className?: string;
}

// ============================================
// 主输入组件
// ============================================

export function ChatInput({
  onSend,
  onCancel,
  isLoading = false,
  placeholder = "输入消息...",
  maxLength = 10000,
  showAttachments = true,
  showVoice = true,
  showModels = false,
  models = [],
  selectedModel,
  onModelChange,
  disabled = false,
  className,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSend = (message.trim().length > 0 || attachments.length > 0) && !disabled && !isLoading;

  // 自动调整高度
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  const handleSend = () => {
    if (!canSend) return;
    onSend(message.trim(), attachments);
    setMessage("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (type: "image" | "file" | "code") => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newAttachments: Attachment[] = Array.from(files).map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: file.type.startsWith("image/") ? "image" : "file",
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
      }));
      setAttachments((prev) => [...prev, ...newAttachments]);
    }
    e.target.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: 实现语音录制功能
  };

  const currentModel = models.find((m) => m.id === selectedModel);

  return (
    <div className={cn("border-t border-border bg-background-studio/95 backdrop-blur", className)}>
      {/* 附件预览 */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-0 pt-4">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-100 border border-border text-sm group"
            >
              {attachment.type === "image" && (
                <ImageIcon className="w-4 h-4 text-brand-500" />
              )}
              {attachment.type === "file" && (
                <FileText className="w-4 h-4 text-foreground-muted" />
              )}
              {attachment.type === "code" && (
                <Code className="w-4 h-4 text-foreground-muted" />
              )}
              <span className="text-foreground max-w-[150px] truncate">
                {attachment.name}
              </span>
              <button
                onClick={() => removeAttachment(attachment.id)}
                className="p-0.5 rounded hover:bg-surface-200 text-foreground-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 输入区域 */}
      <div className="py-4">
        <div
          className={cn(
            "flex items-end gap-2 rounded-lg border px-3 py-2.5 transition-all",
            isFocused
              ? "border-brand-500/60 bg-surface-100 shadow-[0_0_0_1px_rgba(62,207,142,0.18)]"
              : "border-border bg-surface-100/70 hover:border-border-strong"
          )}
        >
          {/* 附件按钮 */}
          {showAttachments && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-foreground-muted hover:text-foreground"
                  disabled={disabled}
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-surface-100 border-border">
                <DropdownMenuItem
                  onClick={() => handleFileSelect("image")}
                  className="text-foreground-light hover:text-foreground hover:bg-surface-200"
                >
                  <ImageIcon className="w-4 h-4 mr-2 text-brand-500" />
                  上传图片
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleFileSelect("file")}
                  className="text-foreground-light hover:text-foreground hover:bg-surface-200"
                >
                  <FileText className="w-4 h-4 mr-2 text-foreground-muted" />
                  上传文件
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleFileSelect("code")}
                  className="text-foreground-light hover:text-foreground hover:bg-surface-200"
                >
                  <Code className="w-4 h-4 mr-2 text-foreground-muted" />
                  上传代码
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* 文本输入 */}
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 min-h-[24px] max-h-[200px] resize-none border-0 bg-transparent p-0 text-[13px] leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0"
            rows={1}
          />

          {/* 字数统计 */}
          {message.length > maxLength * 0.8 && (
            <span
              className={cn(
                "text-xs shrink-0",
                message.length > maxLength ? "text-red-500" : "text-foreground-light"
              )}
            >
              {message.length}/{maxLength}
            </span>
          )}

          {/* 语音按钮 */}
          {showVoice && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-9 w-9 shrink-0 text-foreground-muted hover:text-foreground",
                      isRecording && "text-destructive-400 bg-destructive-200/60"
                    )}
                    onClick={toggleRecording}
                    disabled={disabled}
                  >
                    {isRecording ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isRecording ? "停止录音" : "语音输入"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* 发送/停止按钮 */}
          {isLoading ? (
            <Button
              size="icon"
              variant="outline"
              className="h-9 w-9 shrink-0"
              onClick={onCancel}
            >
              <X className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleSend}
              disabled={!canSend}
            >
              <Send className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* 底部工具栏 */}
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
            {showModels && currentModel && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-surface-200 transition-colors text-foreground-light hover:text-foreground">
                    <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                    {currentModel.name}
                    <ChevronUp className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-surface-100 border-border">
                  {models.map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => onModelChange?.(model.id)}
                      className="text-foreground-light hover:text-foreground hover:bg-surface-200"
                    >
                      <Sparkles className="w-4 h-4 mr-2 text-brand-500" />
                      {model.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <span>按 Enter 发送，Shift+Enter 换行</span>
          </div>
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

// ============================================
// 快速回复建议
// ============================================

interface QuickRepliesProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  className?: string;
}

export function QuickReplies({
  suggestions,
  onSelect,
  className,
}: QuickRepliesProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSelect(suggestion)}
          className="px-2.5 py-1.5 rounded-md border border-border bg-surface-100 text-[11px] font-medium text-foreground-light hover:text-foreground hover:border-border-strong hover:bg-surface-200 transition-colors"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}

// ============================================
// 输入状态指示
// ============================================

interface TypingIndicatorProps {
  isTyping: boolean;
  userName?: string;
  className?: string;
}

export function TypingIndicator({
  isTyping,
  userName = "AI",
  className,
}: TypingIndicatorProps) {
  if (!isTyping) return null;

  return (
    <div className={cn("flex items-center gap-2 px-4 py-2 text-sm text-foreground-muted", className)}>
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-foreground-muted animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 rounded-full bg-foreground-muted animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 rounded-full bg-foreground-muted animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span>{userName} 正在输入...</span>
    </div>
  );
}
