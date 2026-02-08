"use client";

/**
 * AI Chat Enhanced Component - Manus Style
 *
 * Contains: Message bubble, code highlighting, Markdown rendering, quick actions, etc.
 */

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
 Copy,

 Check,

 ThumbsUp,

 ThumbsDown,

 RotateCcw,

 Share2,

 Bookmark,

 Code,

 FileText,

 Download,

 ExternalLink,

 Play,

 Sparkles,

 ChevronDown,

 ChevronRight,

 Zap,

 MessageSquare,

 Image as ImageIcon,

 Link as LinkIcon,

 Terminal,

 Eye,

 EyeOff,

 Volume2,

 VolumeX,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
 Tooltip,

 TooltipContent,

 TooltipProvider,

 TooltipTrigger,
} from "@/components/ui/tooltip";

// Message Types

interface Message {
 id: string;

 role: "user" | "assistant" | "system";

 content: string;

 timestamp: Date;

 model?: string;

 tokens?: number;

 isStreaming?: boolean;

 attachments?: Attachment[];

 codeBlocks?: CodeBlock[];
}

interface Attachment {
 type: "image" | "file" | "link";

 url: string;

 name: string;

 size?: number;
}

interface CodeBlock {
 language: string;

 code: string;

 filename?: string;
}

// AI Message Bubble Component

interface AIMessageBubbleProps {
 message: Message;

 avatar?: string;

 onCopy?: () => void;

 onRegenerate?: () => void;

 onFeedback?: (type: "positive" | "negative") => void;

 className?: string;
}

export function AIMessageBubble({
 message,

 avatar,

 onCopy,

 onRegenerate,

 onFeedback,

 className,
}: AIMessageBubbleProps) {
 const [copied, setCopied] = useState(false);

 const [showRaw, setShowRaw] = useState(false);

 const [isSpeaking, setIsSpeaking] = useState(false);

 const handleCopy = () => {
 navigator.clipboard.writeText(message.content);

 setCopied(true);

 setTimeout(() => setCopied(false), 2000);

 onCopy?.();

 };

 const toggleSpeech = () => {
 if (isSpeaking) {
 window.speechSynthesis.cancel();

 setIsSpeaking(false);

 } else {
 const utterance = new SpeechSynthesisUtterance(message.content);

 utterance.onend = () => setIsSpeaking(false);

 window.speechSynthesis.speak(utterance);

 setIsSpeaking(true);

 }

 };

 return (
 <div className={cn("group animate-fadeInUp", className)}>

 <div className="flex gap-4">

 {/* AI Avatar */}

 <Avatar className="w-8 h-8 shrink-0 ring-2 ring-border">

 {avatar ? (
 <AvatarImage src={avatar} />

 ) : (
 <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80">

 <Sparkles className="w-4 h-4 text-white" />

 </AvatarFallback>

 )}

 </Avatar>

      {/* Message Content */}

 <div className="flex-1 max-w-[85%]">

      {/* Message Header */}

 <div className="flex items-center gap-2 mb-2">

 <span className="text-xs text-muted-foreground font-medium">AgentFlow AI</span>

 {message.model && (
 <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">

 {message.model}

 </span>

 )}

 {message.isStreaming && (
 <span className="flex items-center gap-1 text-[10px] text-primary">

 <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />

 Generating

 </span>

 )}

 </div>

      {/* Message Body */}

 <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-muted/50 border border-border text-sm leading-relaxed text-foreground/80">

 {showRaw ? (
 <pre className="whitespace-pre-wrap font-mono text-xs">{message.content}</pre>

 ) : (
 <div className="prose prose-invert prose-sm max-w-none">

 {/* Render Markdown Content */}

 <RenderMarkdown content={message.content} />

 </div>

 )}

 </div>

      {/* Code Block Showcase */}

 {message.codeBlocks && message.codeBlocks.length > 0 && (
 <div className="mt-3 space-y-3">

 {message.codeBlocks.map((block, index) => (
 <CodeBlockDisplay key={index} {...block} />

 ))}

 </div>

 )}

      {/* Attachment Showcase */}

 {message.attachments && message.attachments.length > 0 && (
 <div className="mt-3 flex flex-wrap gap-2">

 {message.attachments.map((attachment, index) => (
 <AttachmentPreview key={index} attachment={attachment} />

 ))}

 </div>

 )}

      {/* Message Actions */}

 <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">

 <TooltipProvider delayDuration={0}>

 <Tooltip>

 <TooltipTrigger asChild>

 <button

 onClick={handleCopy}

 className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground/70 transition-colors"

 >

 {copied ? (
 <Check className="w-4 h-4 text-emerald-400" />

 ) : (
 <Copy className="w-4 h-4" />

 )}

 </button>

 </TooltipTrigger>

 <TooltipContent side="bottom" className="bg-card text-foreground text-xs">

            {copied ? "Copied": "Copy"}

 </TooltipContent>

 </Tooltip>

 <Tooltip>

 <TooltipTrigger asChild>

 <button

 onClick={() => onFeedback?.("positive")}

 className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground/70 transition-colors"

 >

 <ThumbsUp className="w-4 h-4" />

 </button>

 </TooltipTrigger>

 <TooltipContent side="bottom" className="bg-card text-foreground text-xs">

            Helpful

 </TooltipContent>

 </Tooltip>

 <Tooltip>

 <TooltipTrigger asChild>

 <button

 onClick={() => onFeedback?.("negative")}

 className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground/70 transition-colors"

 >

 <ThumbsDown className="w-4 h-4" />

 </button>

 </TooltipTrigger>

 <TooltipContent side="bottom" className="bg-card text-foreground text-xs">

            Not helpful

 </TooltipContent>

 </Tooltip>

 <Tooltip>

 <TooltipTrigger asChild>

 <button

 onClick={onRegenerate}

 className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground/70 transition-colors"

 >

 <RotateCcw className="w-4 h-4" />

 </button>

 </TooltipTrigger>

 <TooltipContent side="bottom" className="bg-card text-foreground text-xs">

            Regenerate

 </TooltipContent>

 </Tooltip>

 <Tooltip>

 <TooltipTrigger asChild>

 <button

 onClick={toggleSpeech}

 className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground/70 transition-colors"

 >

 {isSpeaking ? (
 <VolumeX className="w-4 h-4" />

 ) : (
 <Volume2 className="w-4 h-4" />

 )}

 </button>

 </TooltipTrigger>

 <TooltipContent side="bottom" className="bg-card text-foreground text-xs">

            {isSpeaking ? "Stop reading": "Read aloud"}

 </TooltipContent>

 </Tooltip>

 <Tooltip>

 <TooltipTrigger asChild>

 <button

 onClick={() => setShowRaw(!showRaw)}

 className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground/70 transition-colors"

 >

 {showRaw ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}

 </button>

 </TooltipTrigger>

 <TooltipContent side="bottom" className="bg-card text-foreground text-xs">

            {showRaw ? "Formatted view": "Raw view"}

 </TooltipContent>

 </Tooltip>

 <Tooltip>

 <TooltipTrigger asChild>

 <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground/70 transition-colors">

 <Share2 className="w-4 h-4" />

 </button>

 </TooltipTrigger>

 <TooltipContent side="bottom" className="bg-card text-foreground text-xs">

 Share

 </TooltipContent>

 </Tooltip>

 {message.tokens && (
 <span className="ml-2 text-[10px] text-muted-foreground/70">

 {message.tokens} tokens

 </span>

 )}

 </TooltipProvider>

 </div>

 </div>

 </div>

 </div>

 );
}

// User Message Bubble Component

interface UserMessageBubbleProps {
 message: Message;

 avatar?: string;

 username?: string;

 className?: string;
}

export function UserMessageBubble({
 message,

 avatar,

 username,

 className,
}: UserMessageBubbleProps) {
 return (
 <div className={cn("flex justify-end animate-fadeInUp", className)}>

 <div className="flex gap-4 flex-row-reverse max-w-[85%]">

    {/* User Avatar */}

 <Avatar className="w-8 h-8 shrink-0 ring-2 ring-border">

 <AvatarImage src={avatar} />

 <AvatarFallback className="bg-muted text-foreground text-sm">

 {username?.charAt(0) || "U"}

 </AvatarFallback>

 </Avatar>

      {/* Message Content */}

 <div className="text-right">

 <div className="inline-block px-4 py-3 rounded-2xl rounded-tr-sm bg-primary text-white text-sm leading-relaxed">

 <div className="whitespace-pre-wrap">{message.content}</div>

 </div>

      {/* Attachment Showcase */}

 {message.attachments && message.attachments.length > 0 && (
 <div className="mt-2 flex flex-wrap gap-2 justify-end">

 {message.attachments.map((attachment, index) => (
 <AttachmentPreview key={index} attachment={attachment} />

 ))}

 </div>

 )}

 {/* Time */}

 <p className="text-[10px] text-muted-foreground/70 mt-1">

 {message.timestamp.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}

 </p>

 </div>

 </div>

 </div>

 );
}

// Code Block Display Component

interface CodeBlockDisplayProps {
 language: string;

 code: string;

 filename?: string;
}

function CodeBlockDisplay({ language, code, filename }: CodeBlockDisplayProps) {
 const [copied, setCopied] = useState(false);

 const [collapsed, setCollapsed] = useState(false);

 const handleCopy = () => {
 navigator.clipboard.writeText(code);

 setCopied(true);

 setTimeout(() => setCopied(false), 2000);

 };

 const lines = code.split("\n").length;

 return (
 <div className="rounded-xl overflow-hidden border border-border bg-card">

    {/* Code Block Header */}

 <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border">

 <div className="flex items-center gap-2">

 <Terminal className="w-4 h-4 text-muted-foreground" />

 <span className="text-xs text-muted-foreground font-mono">

 {filename || language}

 </span>

      <span className="text-[10px] text-muted-foreground/70">{lines} lines</span>

 </div>

 <div className="flex items-center gap-1">

 <button

 onClick={() => setCollapsed(!collapsed)}

 className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground/70 transition-colors"

 >

 {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}

 </button>

 <button

 onClick={handleCopy}

 className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground/70 transition-colors"

 >

 {copied ? (
 <Check className="w-4 h-4 text-emerald-400" />

 ) : (
 <Copy className="w-4 h-4" />

 )}

 </button>

 <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground/70 transition-colors">

 <Play className="w-4 h-4" />

 </button>

 </div>

 </div>

    {/* Code Content */}

 {!collapsed && (
 <div className="p-4 overflow-x-auto">

 <pre className="text-xs font-mono text-foreground/70 leading-relaxed">

 <code>{code}</code>

 </pre>

 </div>

 )}

 </div>

 );
}

// Attachment Preview Component

interface AttachmentPreviewProps {
 attachment: Attachment;
}

function AttachmentPreview({ attachment }: AttachmentPreviewProps) {
 const getIcon = () => {
 switch (attachment.type) {
 case "image":

 return ImageIcon;

 case "link":

 return LinkIcon;

 default:

 return FileText;

 }

 };

 const Icon = getIcon();

 if (attachment.type === "image") {
 return (
 <div className="relative group rounded-lg overflow-hidden border border-border max-w-[200px]">

 <img src={attachment.url} alt={attachment.name} className="w-full h-auto" />

 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">

 <button className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">

 <ExternalLink className="w-4 h-4 text-white" />

 </button>

 <button className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">

 <Download className="w-4 h-4 text-white" />

 </button>

 </div>

 </div>

 );

 }

 return (
 <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors cursor-pointer">

 <Icon className="w-4 h-4 text-muted-foreground" />

 <span className="text-xs text-foreground/70 truncate max-w-[120px]">{attachment.name}</span>

 {attachment.size && (
 <span className="text-[10px] text-muted-foreground/70">

 {(attachment.size / 1024).toFixed(1)} KB

 </span>

 )}

 </div>

 );
}

// Markdown Render Component (simplified)

function RenderMarkdown({ content }: { content: string }) {
  // Simple Markdown render logic

  // In production, use react-markdown or similar

 const parts = content.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g);

 return (
 <>

 {parts.map((part, index) => {
 if (part.startsWith("**") && part.endsWith("**")) {
 return <strong key={index}>{part.slice(2, -2)}</strong>;

 }

 if (part.startsWith("*") && part.endsWith("*")) {
 return <em key={index}>{part.slice(1, -1)}</em>;

 }

 if (part.startsWith("`") && part.endsWith("`")) {
 return (
 <code

 key={index}

 className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono text-primary"

 >

 {part.slice(1, -1)}

 </code>

 );

 }

    // Link Match

 const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);

 if (linkMatch) {
 return (
 <a

 key={index}

 href={linkMatch[2]}

 className="text-primary hover:underline"

 target="_blank"

 rel="noopener noreferrer"

 >

 {linkMatch[1]}

 </a>

 );

 }

 return <span key={index}>{part}</span>;

 })}

 </>

 );
}

// Typing Indicator

interface TypingIndicatorProps {
 modelName?: string;
}

export function TypingIndicator({ modelName = "AI" }: TypingIndicatorProps) {
 return (
 <div className="flex gap-4 animate-fadeInUp">

 <Avatar className="w-8 h-8 shrink-0 ring-2 ring-border">

 <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80">

 <Sparkles className="w-4 h-4 text-white" />

 </AvatarFallback>

 </Avatar>

 <div>

 <div className="flex items-center gap-2 mb-2">

 <span className="text-xs text-muted-foreground">AgentFlow AI</span>

 {modelName && (
 <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">

 {modelName}

 </span>

 )}

 </div>

 <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-muted/50 border border-border rounded-tl-sm">

 <div className="flex gap-1">

 <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />

 <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />

 <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />

 </div>

          <span className="text-xs text-muted-foreground">Thinking...</span>

 </div>

 </div>

 </div>

 );
}

// Quick Reply Suggestion Component

interface SuggestedRepliesProps {
 suggestions: string[];

 onSelect: (suggestion: string) => void;
}

export function SuggestedReplies({ suggestions, onSelect }: SuggestedRepliesProps) {
 return (
 <div className="flex flex-wrap gap-2 py-3">

 {suggestions.map((suggestion, index) => (
 <button

 key={index}

 onClick={() => onSelect(suggestion)}

 className="px-3 py-1.5 rounded-full bg-muted/50 border border-border text-xs text-foreground/70 hover:bg-muted hover:border-border/80 hover:text-foreground transition-all"

 >

 {suggestion}

 </button>

 ))}

 </div>

 );
}

// Conversation Context Indicator Component

interface ContextIndicatorProps {
 contextItems: { type: string; name: string }[];

 onRemove: (index: number) => void;
}

export function ContextIndicator({ contextItems, onRemove }: ContextIndicatorProps) {
 if (contextItems.length === 0) return null;

 return (
 <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b border-border">

 <span className="text-xs text-muted-foreground">Context:</span>

 {contextItems.map((item, index) => (
 <span

 key={index}

 className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-xs text-primary"

 >

 {item.type === "file" ? <FileText className="w-3 h-3" /> : <LinkIcon className="w-3 h-3" />}

 {item.name}

 <button

 onClick={() => onRemove(index)}

 className="ml-0.5 hover:text-red-400 transition-colors"

 >

 

 </button>

 </span>

 ))}

 </div>

 );
}

