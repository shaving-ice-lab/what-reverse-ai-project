'use client'

/**
 * CodeblockDisplayComponent
 * SupportSyntaxHighlight, Copy, rowetcFeatures
 */

import { useState, useCallback } from 'react'
import {
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Terminal,
  FileCode,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

// LanguageIconandColorConfig
const languageConfig: Record<string, { label: string; color: string }> = {
  javascript: { label: 'JavaScript', color: 'text-yellow-500' },
  typescript: { label: 'TypeScript', color: 'text-blue-500' },
  python: { label: 'Python', color: 'text-green-500' },
  java: { label: 'Java', color: 'text-orange-500' },
  go: { label: 'Go', color: 'text-cyan-500' },
  rust: { label: 'Rust', color: 'text-orange-600' },
  cpp: { label: 'C++', color: 'text-blue-600' },
  c: { label: 'C', color: 'text-blue-400' },
  csharp: { label: 'C#', color: 'text-purple-500' },
  php: { label: 'PHP', color: 'text-indigo-500' },
  ruby: { label: 'Ruby', color: 'text-red-500' },
  swift: { label: 'Swift', color: 'text-orange-400' },
  kotlin: { label: 'Kotlin', color: 'text-purple-400' },
  html: { label: 'HTML', color: 'text-orange-500' },
  css: { label: 'CSS', color: 'text-blue-500' },
  scss: { label: 'SCSS', color: 'text-pink-500' },
  json: { label: 'JSON', color: 'text-yellow-600' },
  yaml: { label: 'YAML', color: 'text-red-400' },
  markdown: { label: 'Markdown', color: 'text-muted-foreground' },
  sql: { label: 'SQL', color: 'text-blue-400' },
  bash: { label: 'Bash', color: 'text-green-400' },
  shell: { label: 'Shell', color: 'text-green-500' },
  powershell: { label: 'PowerShell', color: 'text-blue-500' },
  dockerfile: { label: 'Dockerfile', color: 'text-blue-400' },
  graphql: { label: 'GraphQL', color: 'text-pink-600' },
}

// ============================================
// BasicCodeblock
// ============================================

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
  showLineNumbers?: boolean
  showCopyButton?: boolean
  maxHeight?: number
  collapsible?: boolean
  defaultCollapsed?: boolean
  className?: string
}

export function CodeBlock({
  code,
  language = 'plaintext',
  filename,
  showLineNumbers = true,
  showCopyButton = true,
  maxHeight,
  collapsible = false,
  defaultCollapsed = false,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [isExpanded, setIsExpanded] = useState(false)

  const lines = code.split('\n')
  const langConfig = languageConfig[language] || { label: language, color: 'text-muted-foreground' }

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  const displayedCode =
    collapsible && isCollapsed
      ? lines.slice(0, 5).join('\n') + (lines.length > 5 ? '\n...' : '')
      : code

  return (
    <div className={cn('rounded-xl border border-border overflow-hidden bg-card', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-popover border-b border-border">
        <div className="flex items-center gap-2">
          <FileCode className={cn('w-4 h-4', langConfig.color)} />
          <span className="text-sm text-muted-foreground">{filename || langConfig.label}</span>
        </div>
        <div className="flex items-center gap-1">
          {collapsible && lines.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Expand
                </>
              ) : (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Collapse
                </>
              )}
            </Button>
          )}
          {maxHeight && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          )}
          {showCopyButton && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1 text-emerald-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* CodeRegion */}
      <div
        className={cn('overflow-auto', !isExpanded && maxHeight && `max-h-[${maxHeight}px]`)}
        style={!isExpanded && maxHeight ? { maxHeight } : undefined}
      >
        <pre className="p-4 text-sm leading-relaxed">
          <code className="font-mono text-foreground">
            {showLineNumbers ? (
              <table className="border-collapse">
                <tbody>
                  {displayedCode.split('\n').map((line, index) => (
                    <tr key={index} className="hover:bg-white/5">
                      <td className="pr-4 text-right text-muted-foreground select-none w-8">
                        {index + 1}
                      </td>
                      <td className="whitespace-pre">{line || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              displayedCode
            )}
          </code>
        </pre>
      </div>
    </div>
  )
}

// ============================================
// inCode
// ============================================

interface InlineCodeProps {
  children: string
  className?: string
}

export function InlineCode({ children, className }: InlineCodeProps) {
  return (
    <code
      className={cn('px-1.5 py-0.5 rounded bg-muted font-mono text-sm text-foreground', className)}
    >
      {children}
    </code>
  )
}

// ============================================
// Terminal Output
// ============================================

interface TerminalOutputProps {
  lines: { type: 'input' | 'output' | 'error'; content: string }[]
  title?: string
  showPrompt?: boolean
  className?: string
}

export function TerminalOutput({
  lines,
  title = 'Terminal',
  showPrompt = true,
  className,
}: TerminalOutputProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const text = lines.map((l) => l.content).join('\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('rounded-xl border border-border overflow-hidden bg-card', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-popover border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-sm text-muted-foreground ml-2">{title}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 font-mono text-sm">
        {lines.map((line, index) => (
          <div key={index} className="flex items-start">
            {showPrompt && line.type === 'input' && (
              <span className="text-emerald-500 mr-2 select-none">$</span>
            )}
            <span
              className={cn(
                line.type === 'input' && 'text-foreground',
                line.type === 'output' && 'text-muted-foreground',
                line.type === 'error' && 'text-red-400'
              )}
            >
              {line.content}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// Codeforcompare
// ============================================

interface CodeDiffProps {
  before: string
  after: string
  language?: string
  beforeLabel?: string
  afterLabel?: string
  className?: string
}

export function CodeDiff({
  before,
  after,
  language = 'plaintext',
  beforeLabel = 'Before',
  afterLabel = 'After',
  className,
}: CodeDiffProps) {
  return (
    <div className={cn('grid md:grid-cols-2 gap-4', className)}>
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          {beforeLabel}
        </p>
        <CodeBlock code={before} language={language} showLineNumbers={false} />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          {afterLabel}
        </p>
        <CodeBlock code={after} language={language} showLineNumbers={false} />
      </div>
    </div>
  )
}

// ============================================
// CommandrowShowcase
// ============================================

interface CommandLineProps {
  command: string
  output?: string
  className?: string
}

export function CommandLine({ command, output, className }: CommandLineProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('rounded-lg bg-card overflow-hidden', className)}>
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2 font-mono text-sm">
          <Terminal className="w-4 h-4 text-emerald-500" />
          <span className="text-emerald-500">$</span>
          <span className="text-foreground">{command}</span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      {output && (
        <div className="px-4 pb-3 font-mono text-sm text-muted-foreground whitespace-pre-wrap">
          {output}
        </div>
      )}
    </div>
  )
}
