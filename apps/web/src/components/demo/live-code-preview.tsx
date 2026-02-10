'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  Copy,
  Check,
  Play,
  Terminal,
  Code2,
  ChevronDown,
  Loader2,
  CheckCircle,
  FileCode,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// Code example config
const codeExamples = {
  typescript: {
    label: 'TypeScript',
    icon: FileCode,
    code: `import { AgentFlow } from '@agentflow/sdk';

// Create a workflow instance
const workflow = new AgentFlow({
  name: 'Smart Support Assistant',
  description: 'Auto-reply to customer inquiries'
});

// Add LLM Node
workflow.addNode({
 type: 'llm',
 model: 'gpt-4',
  prompt: 'You are a professional support assistant...'
});

// Run the workflow
const result = await workflow.run({
  input: 'I want to check my order status'
});

console.log(result.output);`,
    output: `{
 "success": true,
 "output": "Hello! I can help you check your order status. Please provide your order number and I'll look it up for you.",
 "tokens": 45,
 "duration": "1.2s"
}`,
  },
  python: {
    label: 'Python',
    icon: FileCode,
    code: `from agentflow import AgentFlow

# Create a workflow instance
workflow = AgentFlow(
  name="Data Analytics Assistant",
  description="Automatically analyze data and generate reports"
)

# Add a data processing node
workflow.add_node(
 type="data",
 operation="transform",
 config={"format": "json"}
)

# Add an AI analytics node
workflow.add_node(
 type="llm",
 model="claude-3",
  prompt="Analyze the following data and generate insights..."
)

# Execute the workflow
result = workflow.run(data=raw_data)
print(result.insights)`,
    output: `{
 "insights": [
    "Sales grew 23% compared to last period",
    "User conversion rate improved by 15%",
    "Suggestion: Optimize product page to improve performance"
 ],
 "charts": ["trend_chart.png", "funnel_chart.png"],
 "duration": "3.5s"
}`,
  },
  curl: {
    label: 'cURL',
    icon: Terminal,
    code: `# Create a workflow
curl -X POST https://api.agentflow.ai/v1/workflows \\
 -H "Authorization: Bearer $API_KEY" \\
 -H "Content-Type: application/json" \\
 -d '{
 "name": "EmailAutoReply",
 "nodes": [
 {
 "type": "trigger",
 "config": { "event": "email.received" }
 },
 {
 "type": "llm",
 "model": "gpt-4",
 "prompt": "Generate a professional email reply..."
 },
 {
 "type": "action",
 "action": "email.send"
 }
 ]
 }'`,
    output: `{
 "id": "wf_abc123",
 "name": "EmailAutoReply",
 "status": "active",
 "created_at": "2026-01-28T10:30:00Z",
 "nodes_count": 3
}`,
  },
}

export interface LiveCodePreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Initial language */
  initialLanguage?: keyof typeof codeExamples
  /** Whether to display the output panel */
  showOutput?: boolean
  /** Whether to auto-run the demo */
  autoRun?: boolean
  /** Whether to allow language switching */
  allowLanguageSwitch?: boolean
  /** Title */
  title?: string
}

export function LiveCodePreview({
  initialLanguage = 'typescript',
  showOutput = true,
  autoRun = true,
  allowLanguageSwitch = true,
  title,
  className,
  ...props
}: LiveCodePreviewProps) {
  const [language, setLanguage] = useState<keyof typeof codeExamples>(initialLanguage)
  const [copied, setCopied] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const currentExample = codeExamples[language]

  // Auto-run demo
  useEffect(() => {
    if (autoRun) {
      const timer = setTimeout(() => {
        handleRun()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [autoRun, language])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentExample.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRun = () => {
    setIsRunning(true)
    setShowResult(false)

    // Mock run
    setTimeout(() => {
      setIsRunning(false)
      setShowResult(true)
    }, 1500)
  }

  const handleLanguageChange = (lang: keyof typeof codeExamples) => {
    setLanguage(lang)
    setShowResult(false)
    setIsDropdownOpen(false)
  }

  // Simple Syntax Highlighting
  const highlightCode = (code: string) => {
    return code
      .replace(
        /\b(import|from|const|let|var|function|return|await|async|class|new|if|else|for|while)\b/g,
        '<span class="text-violet-400">$1</span>'
      )
      .replace(/\b(true|false|null|undefined)\b/g, '<span class="text-amber-400">$1</span>')
      .replace(/(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g, '<span class="text-emerald-400">$&</span>')
      .replace(/\/\/.*/g, '<span class="text-muted-foreground/60 italic">$&</span>')
      .replace(/#.*/g, '<span class="text-muted-foreground/60 italic">$&</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="text-orange-400">$1</span>')
  }

  return (
    <div
      className={cn(
        'rounded-2xl overflow-hidden',
        'bg-background border border-border/50',
        'shadow-2xl shadow-black/20',
        className
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-card border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>

          {/* Language Switcher */}
          {allowLanguageSwitch ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <currentExample.icon className="w-3.5 h-3.5" />
                {currentExample.label}
                <ChevronDown
                  className={cn('w-3 h-3 transition-transform', isDropdownOpen && 'rotate-180')}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 py-1 rounded-lg bg-card border border-border/50 shadow-xl z-10 min-w-[120px]">
                  {Object.entries(codeExamples).map(([key, example]) => (
                    <button
                      key={key}
                      onClick={() => handleLanguageChange(key as keyof typeof codeExamples)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left',
                        'hover:bg-muted/50 transition-colors',
                        language === key ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      <example.icon className="w-3.5 h-3.5" />
                      {example.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground ml-2">{title || 'example.ts'}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleRun}
            disabled={isRunning}
          >
            {isRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Play className="w-3.5 h-3.5 mr-1" />
                Run
              </>
            )}
          </Button>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            title="Copy code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className={cn('grid', showOutput && showResult ? 'lg:grid-cols-2' : 'grid-cols-1')}>
        {/* Code Panel */}
        <div className="overflow-auto max-h-[400px] border-r border-border/30">
          <pre className="p-4 text-sm font-mono leading-relaxed">
            <code className="text-foreground">
              {currentExample.code.split('\n').map((line, i) => (
                <div key={i} className="hover:bg-muted/50 flex">
                  <span className="pr-4 text-right text-muted-foreground/40 select-none w-8 shrink-0">
                    {i + 1}
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: highlightCode(line) }} />
                </div>
              ))}
            </code>
          </pre>
        </div>

        {/* Output Panel */}
        {showOutput && showResult && (
          <div className="bg-background border-t lg:border-t-0 border-border/30">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 bg-card/50">
              <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Output</span>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 ml-auto" />
              <span className="text-xs text-emerald-400">Success</span>
            </div>
            <div className="overflow-auto max-h-[350px]">
              <pre className="p-4 text-sm font-mono leading-relaxed">
                <code className="text-emerald-400/90">
                  {currentExample.output.split('\n').map((line, i) => (
                    <div key={i} className="hover:bg-muted/50">
                      <span dangerouslySetInnerHTML={{ __html: highlightCode(line) }} />
                    </div>
                  ))}
                </code>
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Running indicator */}
      {isRunning && (
        <div className="px-4 py-2 bg-card/50 border-t border-border/30 flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
          <span className="text-xs text-muted-foreground">Executing...</span>
        </div>
      )}
    </div>
  )
}

// Simple code display
export interface SimpleCodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  code: string
  language?: string
  showLineNumbers?: boolean
  maxHeight?: number
}

export function SimpleCodeBlock({
  code,
  language = 'typescript',
  showLineNumbers = true,
  maxHeight = 400,
  className,
  ...props
}: SimpleCodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const highlightCode = (line: string) => {
    return line
      .replace(
        /\b(import|from|const|let|var|function|return|await|async|class|new)\b/g,
        '<span class="text-violet-400">$1</span>'
      )
      .replace(/(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g, '<span class="text-emerald-400">$&</span>')
      .replace(/\/\/.*/g, '<span class="text-muted-foreground/60 italic">$&</span>')
  }

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden',
        'bg-background border border-border/50',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-muted-foreground ml-2">{language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      <div className="overflow-auto" style={{ maxHeight }}>
        <pre className="p-4 text-sm font-mono leading-relaxed">
          <code className="text-foreground">
            {code.split('\n').map((line, i) => (
              <div key={i} className="hover:bg-muted/50 flex">
                {showLineNumbers && (
                  <span className="pr-4 text-right text-muted-foreground/40 select-none w-8 shrink-0">
                    {i + 1}
                  </span>
                )}
                <span dangerouslySetInnerHTML={{ __html: highlightCode(line) }} />
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  )
}
