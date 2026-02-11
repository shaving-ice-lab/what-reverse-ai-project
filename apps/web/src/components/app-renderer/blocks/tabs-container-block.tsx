'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import type { TabsContainerConfig, AppBlock } from '../types'

interface TabsContainerBlockProps {
  config: TabsContainerConfig
  renderBlock: (block: AppBlock) => React.ReactNode
}

export function TabsContainerBlock({ config, renderBlock }: TabsContainerBlockProps) {
  const tabs = config.tabs || []
  const [activeTabId, setActiveTabId] = useState(() => config.default_tab || tabs[0]?.id || '')

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0]

  if (tabs.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-lg p-4 text-center text-xs text-foreground-muted">
        No tabs configured
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="border-b border-border px-2 flex items-center gap-0 bg-surface-200/20 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={cn(
                'px-4 py-2.5 text-sm border-b-2 transition-colors shrink-0',
                isActive
                  ? 'border-brand-500 text-brand-500 font-medium'
                  : 'border-transparent text-foreground-muted hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div className="p-4 space-y-4">
        {activeTab?.blocks?.map((block) => (
          <React.Fragment key={block.id}>
            {renderBlock(block)}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
