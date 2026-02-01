"use client";

/**
 * AI 写作助手面板
 * 用于创意内容生成，提供智能写作建议和增强功能
 */

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Wand2,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  MessageSquare,
  Zap,
  FileText,
  PenTool,
  Globe,
  Target,
  TrendingUp,
  Languages,
  MoreHorizontal,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Settings,
  Mic,
  Type,
  List,
  AlignLeft,
  Hash,
  AtSign,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 写作风格
const writingStyles = [
  { id: "professional", label: "专业正式", icon: FileText },
  { id: "casual", label: "轻松随意", icon: MessageSquare },
  { id: "creative", label: "创意独特", icon: Sparkles },
  { id: "persuasive", label: "说服力强", icon: Target },
  { id: "informative", label: "信息丰富", icon: Lightbulb },
];

// 内容类型
const contentTypes = [
  { id: "article", label: "文章", icon: FileText },
  { id: "marketing", label: "营销文案", icon: TrendingUp },
  { id: "social", label: "社交媒体", icon: Globe },
  { id: "email", label: "邮件", icon: AtSign },
  { id: "blog", label: "博客", icon: PenTool },
];

// 快捷操作
const quickActions = [
  { id: "expand", label: "扩展内容", icon: ArrowRight, description: "让内容更加详细丰富" },
  { id: "summarize", label: "精简总结", icon: List, description: "提炼核心要点" },
  { id: "rewrite", label: "改写优化", icon: RefreshCw, description: "换一种表达方式" },
  { id: "translate", label: "翻译转换", icon: Languages, description: "翻译成其他语言" },
  { id: "tone", label: "调整语气", icon: Type, description: "改变写作风格" },
  { id: "grammar", label: "语法检查", icon: Check, description: "修正语法错误" },
];

// AI 建议
const aiSuggestions = [
  "添加一个引人入胜的开头",
  "加入数据或案例来支持论点",
  "使用更生动的动词",
  "添加号召性用语",
  "优化段落过渡",
];

interface AIWritingPanelProps {
  content: string;
  onContentChange: (content: string) => void;
  onGenerate?: (prompt: string) => Promise<string>;
  className?: string;
}

export function AIWritingPanel({
  content,
  onContentChange,
  onGenerate,
  className,
}: AIWritingPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("professional");
  const [selectedType, setSelectedType] = useState("article");
  const [prompt, setPrompt] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [generatedVariants, setGeneratedVariants] = useState<string[]>([]);
  const [activeVariant, setActiveVariant] = useState(0);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 复制内容
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 执行快捷操作
  const handleQuickAction = async (actionId: string) => {
    if (!content.trim()) return;
    
    setIsGenerating(true);
    
    // 模拟 AI 处理
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    let newContent = content;
    
    switch (actionId) {
      case "expand":
        newContent = `${content}\n\n此外，值得一提的是，这一观点还可以从以下几个方面进行深入探讨：\n\n1. 首先，从理论层面来看...\n2. 其次，结合实践案例分析...\n3. 最后，展望未来发展趋势...`;
        break;
      case "summarize":
        newContent = `核心要点：\n• ${content.slice(0, 100)}...\n• 主要论点：内容已精简\n• 关键结论：请查看原文`;
        break;
      case "rewrite":
        newContent = `经过优化的版本：\n\n${content.replace(/。/g, '！').replace(/，/g, '、')}`;
        break;
      default:
        break;
    }
    
    onContentChange(newContent);
    setIsGenerating(false);
  };

  // 生成内容
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    // 模拟生成
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const generatedContent = `根据您的要求"${prompt}"，以下是生成的${contentTypes.find(t => t.id === selectedType)?.label}内容：\n\n${selectedStyle === 'professional' ? '尊敬的读者，\n\n' : '嗨！\n\n'}这是一段由 AI 生成的示例内容。在实际使用中，这里会根据您的具体需求生成相应的高质量内容。\n\n${selectedStyle === 'professional' ? '我们希望以上内容能够满足您的需求。' : '希望对你有帮助！'}`;
    
    onContentChange(generatedContent);
    setPrompt("");
    setIsGenerating(false);
  };

  // 应用建议
  const handleApplySuggestion = (suggestion: string) => {
    setPrompt(suggestion);
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* 工具栏 */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50">
        {/* 内容类型 */}
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[120px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {contentTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                <span className="flex items-center gap-2">
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 写作风格 */}
        <Select value={selectedStyle} onValueChange={setSelectedStyle}>
          <SelectTrigger className="w-[120px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {writingStyles.map((style) => (
              <SelectItem key={style.id} value={style.id}>
                <span className="flex items-center gap-2">
                  <style.icon className="w-4 h-4" />
                  {style.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        {/* 快捷操作 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Wand2 className="w-4 h-4" />
              AI 操作
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {quickActions.map((action) => (
              <DropdownMenuItem
                key={action.id}
                onClick={() => handleQuickAction(action.id)}
                disabled={!content.trim() || isGenerating}
              >
                <action.icon className="w-4 h-4 mr-2" />
                <div className="flex-1">
                  <p className="font-medium">{action.label}</p>
                  <p className="text-xs text-foreground-light">{action.description}</p>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          disabled={!content.trim()}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              已复制
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              复制
            </>
          )}
        </Button>
      </div>

      {/* 内容编辑区 */}
      <div className="flex-1 p-4 overflow-auto">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="在这里输入或生成内容..."
          className="min-h-[300px] resize-none border-none focus-visible:ring-0 text-base leading-relaxed"
        />
      </div>

      {/* AI 生成面板 */}
      <div className="border-t border-border bg-card/50 p-4 space-y-4">
        {/* AI 建议 */}
        {showSuggestions && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground-light flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                AI 建议
              </span>
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-xs text-foreground-light hover:text-foreground"
              >
                隐藏
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {aiSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleApplySuggestion(suggestion)}
                  className="px-3 py-1.5 rounded-full bg-surface-200 text-xs text-foreground-light hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 生成输入 */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述您想要生成的内容..."
              className="min-h-[80px] resize-none"
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="h-10 px-6 bg-primary hover:bg-primary/90"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                生成
              </>
            )}
          </Button>
        </div>

        {/* 快捷提示 */}
        <div className="flex items-center justify-between text-xs text-foreground-light">
          <span>提示：使用 Cmd+Enter 快速生成</span>
          <span>Token 使用：0 / 4,000</span>
        </div>
      </div>
    </div>
  );
}

// 写作建议卡片
interface WritingSuggestionCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

export function WritingSuggestionCard({
  title,
  description,
  icon: Icon,
  onClick,
}: WritingSuggestionCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all text-left group"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
          {title}
        </h4>
        <p className="text-sm text-foreground-light mt-1">{description}</p>
      </div>
    </button>
  );
}
