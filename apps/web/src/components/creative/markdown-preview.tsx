'use client'

/**
 * Markdown Preview Component
 *
 * Supports:
 * - Markdown rendering
 * - Table of contents navigation
 * - Chapter navigation
 * - Code highlighting
 */

import { useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'

export interface TableOfContentsItem {
  id: string
  title: string
  level: number
}

export interface MarkdownPreviewProps {
  content: string
  className?: string
  onHeadingClick?: (id: string) => void
}

/**
 * Extract table of contents from Markdown content
 */
export function extractTableOfContents(content: string): TableOfContentsItem[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const items: TableOfContentsItem[] = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const title = match[2].trim()
    const id = title
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '')

    items.push({ id, title, level })
  }

  return items
}

/**
 * Simple Markdown to HTML converter
 */
function markdownToHtml(markdown: string): string {
  let html = markdown

  // Headings (add id for anchor links)
  html = html.replace(/^######\s+(.+)$/gm, (_, title) => {
    const id = title
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '')
    return `<h6 id="${id}" class="scroll-mt-24">${title}</h6>`
  })
  html = html.replace(/^#####\s+(.+)$/gm, (_, title) => {
    const id = title
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '')
    return `<h5 id="${id}" class="scroll-mt-24">${title}</h5>`
  })
  html = html.replace(/^####\s+(.+)$/gm, (_, title) => {
    const id = title
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '')
    return `<h4 id="${id}" class="scroll-mt-24">${title}</h4>`
  })
  html = html.replace(/^###\s+(.+)$/gm, (_, title) => {
    const id = title
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '')
    return `<h3 id="${id}" class="scroll-mt-24">${title}</h3>`
  })
  html = html.replace(/^##\s+(.+)$/gm, (_, title) => {
    const id = title
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '')
    return `<h2 id="${id}" class="scroll-mt-24">${title}</h2>`
  })
  html = html.replace(/^#\s+(.+)$/gm, (_, title) => {
    const id = title
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '')
    return `<h1 id="${id}" class="scroll-mt-24">${title}</h1>`
  })

  // Code block
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="code-block"><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`
  })

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')

  //
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>')

  //
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>')

  // Strikethrough
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>')

  // Link
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  )

  // Image
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="markdown-img" />')

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr />')
  html = html.replace(/^\*\*\*$/gm, '<hr />')

  // Blockquote
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')

  // Unordered list
  html = html.replace(/^[\*\-]\s+(.+)$/gm, '<li class="ul-item">$1</li>')

  // Ordered list
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="ol-item">$1</li>')

  // Wrap consecutive list items
  html = html.replace(/(<li class="ul-item">[\s\S]*?<\/li>)(\n<li class="ul-item">)/g, '$1$2')
  html = html.replace(/(<li class="ol-item">[\s\S]*?<\/li>)(\n<li class="ol-item">)/g, '$1$2')

  // Paragraphs (process remaining text lines)
  const lines = html.split('\n')
  const processedLines = lines.map((line) => {
    // Skip already processed HTML tags
    if (
      line.trim() === '' ||
      line.startsWith('<h') ||
      line.startsWith('<pre') ||
      line.startsWith('<blockquote') ||
      line.startsWith('<li') ||
      line.startsWith('<hr') ||
      line.startsWith('<img') ||
      line.startsWith('</') ||
      line.includes('<code')
    ) {
      return line
    }
    return `<p>${line}</p>`
  })

  return processedLines.join('\n')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Markdown Preview Component
 */
export function MarkdownPreview({ content, className, onHeadingClick }: MarkdownPreviewProps) {
  const html = useMemo(() => markdownToHtml(content), [content])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement
      if (target.tagName.match(/^H[1-6]$/) && target.id && onHeadingClick) {
        onHeadingClick(target.id)
      }
    },
    [onHeadingClick]
  )

  return (
    <div
      className={cn(
        'prose prose-zinc dark:prose-invert max-w-none',
        // Title style
        'prose-h1:text-2xl prose-h1:font-bold prose-h1:text-foreground prose-h1:mb-4 prose-h1:mt-8 prose-h1:pb-2 prose-h1:border-b prose-h1:border-border',
        'prose-h2:text-xl prose-h2:font-semibold prose-h2:text-foreground prose-h2:mb-3 prose-h2:mt-6',
        'prose-h3:text-lg prose-h3:font-semibold prose-h3:text-foreground prose-h3:mb-2 prose-h3:mt-5',
        'prose-h4:text-base prose-h4:font-medium prose-h4:text-foreground prose-h4:mb-2 prose-h4:mt-4',
        // Paragraph style
        'prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4',
        // Link style
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
        // List style
        'prose-li:text-muted-foreground prose-li:my-1',
        'prose-ul:my-4 prose-ol:my-4',
        // Blockquote style
        'prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-muted prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic',
        // Code style
        'prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none',
        'prose-pre:bg-popover prose-pre:text-foreground prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto',
        // Horizontal rule style
        'prose-hr:border-border',
        // Table style
        'prose-table:w-full prose-th:bg-muted prose-th:p-2 prose-td:p-2 prose-td:border prose-td:border-border',
        className
      )}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/**
 * Table of Contents Navigation Component
 */
export interface TableOfContentsProps {
  items: TableOfContentsItem[]
  activeId?: string
  onItemClick: (id: string) => void
  className?: string
}

export function TableOfContents({ items, activeId, onItemClick, className }: TableOfContentsProps) {
  if (items.length === 0) return null

  return (
    <nav className={cn('space-y-1', className)}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onItemClick(item.id)}
          className={cn(
            'block w-full text-left text-sm truncate transition-colors rounded px-2 py-1.5',
            item.level === 1 && 'font-medium',
            item.level === 2 && 'pl-4',
            item.level === 3 && 'pl-6',
            item.level >= 4 && 'pl-8',
            activeId === item.id
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          {item.title}
        </button>
      ))}
    </nav>
  )
}

export default MarkdownPreview
