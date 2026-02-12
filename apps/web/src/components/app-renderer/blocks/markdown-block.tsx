'use client'

import React from 'react'

interface MarkdownBlockProps {
  content: string
}

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0
  let safety = 0

  while (remaining.length > 0 && safety++ < 500) {
    // Inline code: `text` — check first to avoid conflicts inside code
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`/)
    // Link: [text](url)
    const linkMatch = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)/)
    // Bold: **text** — must be checked before italic
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*/)
    // Italic: *text* — must NOT match **
    const italicMatch = remaining.match(/^(.*?)(?<!\*)\*([^*]+)\*(?!\*)/)

    // Find earliest match
    const matches = [
      codeMatch && { idx: codeMatch[1].length, type: 'code' as const, m: codeMatch },
      linkMatch && { idx: linkMatch[1].length, type: 'link' as const, m: linkMatch },
      boldMatch && { idx: boldMatch[1].length, type: 'bold' as const, m: boldMatch },
      italicMatch && { idx: italicMatch[1].length, type: 'italic' as const, m: italicMatch },
    ]
      .filter(Boolean)
      .sort((a, b) => a!.idx - b!.idx)

    if (matches.length === 0) {
      parts.push(remaining)
      break
    }

    const best = matches[0]!
    const consumed = best.m[0].length
    if (consumed === 0) {
      parts.push(remaining)
      break
    }

    if (best.m[1]) parts.push(best.m[1])

    if (best.type === 'link') {
      parts.push(
        <a
          key={key++}
          href={best.m[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-500 hover:underline"
        >
          {best.m[2]}
        </a>
      )
    } else if (best.type === 'bold') {
      parts.push(
        <strong key={key++} className="font-semibold text-foreground">
          {best.m[2]}
        </strong>
      )
    } else if (best.type === 'italic') {
      parts.push(<em key={key++}>{best.m[2]}</em>)
    } else if (best.type === 'code') {
      parts.push(
        <code key={key++} className="text-xs bg-surface-200/50 px-1 py-0.5 rounded font-mono">
          {best.m[2]}
        </code>
      )
    }
    remaining = remaining.slice(consumed)
  }

  return parts
}

export function MarkdownBlock({ content }: MarkdownBlockProps) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Code block: ```
    if (line.startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <pre
          key={i}
          className="bg-surface-200/30 rounded p-3 text-xs font-mono overflow-x-auto my-2"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
      i++
      continue
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-sm font-semibold text-foreground mt-2 mb-1">
          {parseInline(line.slice(4))}
        </h3>
      )
      i++
      continue
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-base font-semibold text-foreground mt-3 mb-1">
          {parseInline(line.slice(3))}
        </h2>
      )
      i++
      continue
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-lg font-bold text-foreground mt-0 mb-2">
          {parseInline(line.slice(2))}
        </h1>
      )
      i++
      continue
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={i} className="border-border my-3" />)
      i++
      continue
    }

    // Blockquote — collect consecutive > lines
    if (line.startsWith('> ') || line === '>') {
      const bqLines: React.ReactNode[] = []
      const startIdx = i
      while (i < lines.length && (lines[i].startsWith('> ') || lines[i] === '>')) {
        const text = lines[i].startsWith('> ') ? lines[i].slice(2) : ''
        bqLines.push(
          <p key={i} className="text-sm">
            {text ? parseInline(text) : <br />}
          </p>
        )
        i++
      }
      elements.push(
        <blockquote
          key={`bq-${startIdx}`}
          className="border-l-2 border-brand-500/40 pl-3 my-2 text-foreground-muted italic"
        >
          {bqLines}
        </blockquote>
      )
      continue
    }

    // Unordered list — collect consecutive items and wrap in <ul>
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: React.ReactNode[] = []
      const startIdx = i
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(
          <li key={i} className="text-sm">
            {parseInline(lines[i].slice(2))}
          </li>
        )
        i++
      }
      elements.push(
        <ul key={`ul-${startIdx}`} className="list-disc ml-4 space-y-0.5 my-1">
          {items}
        </ul>
      )
      continue
    }

    // Ordered list — collect consecutive items and wrap in <ol>
    const olMatch = line.match(/^(\d+)\.\s(.+)/)
    if (olMatch) {
      const items: React.ReactNode[] = []
      const startIdx = i
      while (i < lines.length) {
        const m = lines[i].match(/^(\d+)\.\s(.+)/)
        if (!m) break
        items.push(
          <li key={i} className="text-sm">
            {parseInline(m[2])}
          </li>
        )
        i++
      }
      elements.push(
        <ol key={`ol-${startIdx}`} className="list-decimal ml-4 space-y-0.5 my-1">
          {items}
        </ol>
      )
      continue
    }

    // Empty line
    if (line.trim() === '') {
      elements.push(<br key={i} />)
      i++
      continue
    }

    // Paragraph
    elements.push(
      <p key={i} className="text-sm mb-1">
        {parseInline(line)}
      </p>
    )
    i++
  }

  return (
    <div className="border border-border rounded-lg p-4 prose prose-sm max-w-none text-foreground-light">
      {elements}
    </div>
  )
}
