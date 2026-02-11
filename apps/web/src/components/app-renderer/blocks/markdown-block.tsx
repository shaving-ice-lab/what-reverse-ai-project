'use client'

import React from 'react'

interface MarkdownBlockProps {
  content: string
}

export function MarkdownBlock({ content }: MarkdownBlockProps) {
  return (
    <div className="border border-border rounded-lg p-4 prose prose-sm max-w-none text-foreground-light">
      {content.split('\n').map((line, i) => {
        if (line.startsWith('# ')) return <h1 key={i} className="text-lg font-bold text-foreground mt-0 mb-2">{line.slice(2)}</h1>
        if (line.startsWith('## ')) return <h2 key={i} className="text-base font-semibold text-foreground mt-3 mb-1">{line.slice(3)}</h2>
        if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-semibold text-foreground mt-2 mb-1">{line.slice(4)}</h3>
        if (line.startsWith('- ')) return <li key={i} className="text-sm ml-4">{line.slice(2)}</li>
        if (line.trim() === '') return <br key={i} />
        return <p key={i} className="text-sm mb-1">{line}</p>
      })}
    </div>
  )
}
