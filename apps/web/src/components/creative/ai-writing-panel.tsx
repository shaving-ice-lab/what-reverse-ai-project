'use client'

/**
 * AI Writing Assistant Panel
 * Provides creative content generation, smart writing suggestions, and enhanced features
 */

import { useState, useEffect, useRef } from 'react'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Writing Styles
const writingStyles = [
  { id: 'professional', label: 'Professional', icon: FileText },
  { id: 'casual', label: 'Casual', icon: MessageSquare },
  { id: 'creative', label: 'Creative', icon: Sparkles },
  { id: 'persuasive', label: 'Persuasive', icon: Target },
  { id: 'informative', label: 'Informative', icon: Lightbulb },
]

// Content Types
const contentTypes = [
  { id: 'article', label: 'Article', icon: FileText },
  { id: 'marketing', label: 'Marketing Copy', icon: TrendingUp },
  { id: 'social', label: 'Social Media', icon: Globe },
  { id: 'email', label: 'Email', icon: AtSign },
  { id: 'blog', label: 'Blog', icon: PenTool },
]

// Quick Actions
const quickActions = [
  {
    id: 'expand',
    label: 'Expand Content',
    icon: ArrowRight,
    description: 'Make content more detailed and rich',
  },
  { id: 'summarize', label: 'Summarize', icon: List, description: 'Extract core points' },
  {
    id: 'rewrite',
    label: 'Rewrite',
    icon: RefreshCw,
    description: 'Rephrase in a different style',
  },
  {
    id: 'translate',
    label: 'Translate',
    icon: Languages,
    description: 'Translate to another language',
  },
  { id: 'tone', label: 'Adjust Tone', icon: Type, description: 'Change the writing style' },
  { id: 'grammar', label: 'Grammar Check', icon: Check, description: 'Fix grammar errors' },
]

// AI Suggestions
const aiSuggestions = [
  'Add a compelling introduction',
  'Include data or case studies for support',
  'Use more vivid language',
  'Add a call to action',
  'Improve paragraph transitions',
]

interface AIWritingPanelProps {
  content: string
  onContentChange: (content: string) => void
  onGenerate?: (prompt: string) => Promise<string>
  className?: string
}

export function AIWritingPanel({
  content,
  onContentChange,
  onGenerate,
  className,
}: AIWritingPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState('professional')
  const [selectedType, setSelectedType] = useState('article')
  const [prompt, setPrompt] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [generatedVariants, setGeneratedVariants] = useState<string[]>([])
  const [activeVariant, setActiveVariant] = useState(0)
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Copy content
  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Execute quick action
  const handleQuickAction = async (actionId: string) => {
    if (!content.trim()) return

    setIsGenerating(true)

    // Mock AI Process
    await new Promise((resolve) => setTimeout(resolve, 1500))

    let newContent = content

    switch (actionId) {
      case 'expand':
        newContent = `${content}\n\nFurthermore, it is worth noting that this topic can be explored from the following perspectives:\n\n1. First, from a theoretical standpoint...\n2. Additionally, practical case studies suggest...\n3. Finally, looking at future development trends...`
        break
      case 'summarize':
        newContent = `Key points:\n• ${content.slice(0, 100)}...\n• Main takeaway: Content has been summarized\n• Highlights: See above`
        break
      case 'rewrite':
        newContent = `Improved version:\n\n${content.replace(/./g, '!').replace(/, /g, ', ')}`
        break
      default:
        break
    }

    onContentChange(newContent)
    setIsGenerating(false)
  }

  // Generate content
  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)

    // Mock generation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const generatedContent = `Based on your request "${prompt}", here is the generated ${contentTypes.find((t) => t.id === selectedType)?.label} content:\n\n${selectedStyle === 'professional' ? 'Dear reader,\n\n' : 'Hi there!\n\n'}This is an AI-generated example. In actual use, the content will be generated based on your specific requirements.\n\n${selectedStyle === 'professional' ? 'We hope this content meets your needs.' : 'Hope this helps!'}`

    onContentChange(generatedContent)
    setPrompt('')
    setIsGenerating(false)
  }

  // Apply suggestion
  const handleApplySuggestion = (suggestion: string) => {
    setPrompt(suggestion)
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50">
        {/* Content Type */}
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

        {/* Writing Style */}
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

        {/* Quick Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Wand2 className="w-4 h-4" />
              AI Action
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

        <Button variant="outline" size="sm" onClick={handleCopy} disabled={!content.trim()}>
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </>
          )}
        </Button>
      </div>

      {/* Content Editor */}
      <div className="flex-1 p-4 overflow-auto">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Enter or generate content here..."
          className="min-h-[300px] resize-none border-none focus-visible:ring-0 text-base leading-relaxed"
        />
      </div>

      {/* AI Generation Panel */}
      <div className="border-t border-border bg-card/50 p-4 space-y-4">
        {/* AI Suggestion */}
        {showSuggestions && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground-light flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                AI Suggestion
              </span>
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-xs text-foreground-light hover:text-foreground"
              >
                Hide
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

        {/* Generation Input */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the content you want to generate..."
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
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>

        {/* Shortcut Tip */}
        <div className="flex items-center justify-between text-xs text-foreground-light">
          <span>Tip: Use Cmd+Enter to quickly generate</span>
          <span>Token Usage: 0 / 4,000</span>
        </div>
      </div>
    </div>
  )
}

// Writing Suggestion Card
interface WritingSuggestionCardProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
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
  )
}
