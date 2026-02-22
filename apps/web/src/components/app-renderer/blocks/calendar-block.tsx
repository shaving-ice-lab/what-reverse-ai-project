'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Clock, MapPin, User, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDataProvider } from '../data-provider'
import { usePageParams } from '../app-renderer'
import type { CalendarConfig, DataSource } from '../types'

interface CalendarBlockProps {
  config: CalendarConfig
  dataSource?: DataSource
}

interface CalendarEvent {
  id: unknown
  title: string
  start: Date
  end: Date
  status?: string
  raw: Record<string, unknown>
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

const DEFAULT_STATUS_COLORS: Record<string, string> = {
  待审批: 'bg-amber-500/15 text-amber-700 border-amber-400/30',
  已批准: 'bg-emerald-500/15 text-emerald-700 border-emerald-400/30',
  进行中: 'bg-blue-500/15 text-blue-700 border-blue-400/30',
  已完成: 'bg-slate-500/10 text-slate-600 border-slate-400/30',
  已拒绝: 'bg-red-500/15 text-red-700 border-red-400/30',
  已取消: 'bg-gray-500/10 text-gray-500 border-gray-400/30',
  pending: 'bg-amber-500/15 text-amber-700 border-amber-400/30',
  approved: 'bg-emerald-500/15 text-emerald-700 border-emerald-400/30',
  in_progress: 'bg-blue-500/15 text-blue-700 border-blue-400/30',
  completed: 'bg-slate-500/10 text-slate-600 border-slate-400/30',
  rejected: 'bg-red-500/15 text-red-700 border-red-400/30',
  cancelled: 'bg-gray-500/10 text-gray-500 border-gray-400/30',
}

function getStatusColor(status: string | undefined, customColors?: Record<string, string>): string {
  if (!status) return 'bg-brand-500/15 text-brand-600 border-brand-400/30'
  const colors = { ...DEFAULT_STATUS_COLORS, ...customColors }
  return colors[status] || 'bg-brand-500/15 text-brand-600 border-brand-400/30'
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Monday=0, Sunday=6
}

export function CalendarBlock({ config, dataSource }: CalendarBlockProps) {
  const { queryRows, onTableChange } = useDataProvider()
  const { navigateToPage } = usePageParams()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'month' | 'week'>(config.default_view || 'month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const tableName = dataSource?.table || config.table_name

  const fetchEvents = useCallback(async () => {
    if (!tableName) return
    setLoading(true)
    try {
      const result = await queryRows(tableName, { limit: 500 })
      const parsed: CalendarEvent[] = result.rows
        .map((row) => {
          const startStr = row[config.start_key] as string
          const endStr = row[config.end_key] as string
          if (!startStr) return null
          const start = new Date(startStr)
          const end = endStr ? new Date(endStr) : new Date(start.getTime() + 3600000)
          if (isNaN(start.getTime())) return null
          return {
            id: row['id'] ?? row[Object.keys(row)[0]],
            title: String(row[config.title_key] || ''),
            start,
            end,
            status: config.status_key ? String(row[config.status_key] || '') : undefined,
            raw: row,
          }
        })
        .filter(Boolean) as CalendarEvent[]
      setEvents(parsed)
    } catch {
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [tableName, queryRows, config.start_key, config.end_key, config.title_key, config.status_key])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    if (!tableName) return
    return onTableChange((table) => {
      if (table === tableName) fetchEvents()
    })
  }, [onTableChange, tableName, fetchEvents])

  // Navigation
  const goToday = () => setCurrentDate(new Date())
  const goPrev = () => {
    const d = new Date(currentDate)
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1)
    else d.setDate(d.getDate() - 7)
    setCurrentDate(d)
  }
  const goNext = () => {
    const d = new Date(currentDate)
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1)
    else d.setDate(d.getDate() + 7)
    setCurrentDate(d)
  }

  const handleEventClick = (evt: CalendarEvent) => {
    if (config.click_action?.type === 'navigate') {
      const targetPage = config.click_action.target_page || config.click_action.page_id || ''
      const paramKey = config.click_action.param_key || 'id'
      navigateToPage(targetPage, { [paramKey]: evt.raw['id'] ?? evt.id })
    } else {
      setSelectedEvent(selectedEvent?.id === evt.id ? null : evt)
    }
  }

  // Month view data
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const today = new Date()

  // Week view data
  const weekStart = useMemo(() => {
    const d = new Date(currentDate)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
  }, [currentDate])

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [weekStart])

  function getEventsForDay(date: Date) {
    return events.filter((evt) => {
      const start = new Date(evt.start)
      start.setHours(0, 0, 0, 0)
      const end = new Date(evt.end)
      end.setHours(23, 59, 59, 999)
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      return dayStart >= start && dayStart <= end
    })
  }

  const monthLabel = currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
  const weekLabel = `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 — ${weekDays[6].getMonth() + 1}月${weekDays[6].getDate()}日`

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-200/20">
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" onClick={goPrev} className="h-7 w-7 p-0">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-foreground min-w-[140px] text-center">
            {viewMode === 'month' ? monthLabel : weekLabel}
          </span>
          <Button size="sm" variant="ghost" onClick={goNext} className="h-7 w-7 p-0">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={goToday} className="h-7 text-[11px] ml-1">
            今天
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-foreground-muted mr-2 tabular-nums">
            {events.length} 条预定
          </span>
          <div className="flex items-center bg-surface-200/50 rounded p-0.5">
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                'h-6 px-2 rounded text-[11px] font-medium transition-colors',
                viewMode === 'month'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-foreground-muted hover:text-foreground'
              )}
            >
              月
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={cn(
                'h-6 px-2 rounded text-[11px] font-medium transition-colors',
                viewMode === 'week'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-foreground-muted hover:text-foreground'
              )}
            >
              周
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-xs text-foreground-muted animate-pulse">加载日历数据...</div>
        </div>
      ) : viewMode === 'month' ? (
        /* Month View */
        <div>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-medium text-foreground-muted py-1.5 border-r border-border/50 last:border-r-0"
              >
                {d}
              </div>
            ))}
          </div>
          {/* Days grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="min-h-[90px] border-r border-b border-border/50 bg-surface-75/30"
              />
            ))}
            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1
              const date = new Date(year, month, dayNum)
              const isToday = isSameDay(date, today)
              const dayEvents = getEventsForDay(date)
              const isWeekend = date.getDay() === 0 || date.getDay() === 6
              return (
                <div
                  key={dayNum}
                  className={cn(
                    'min-h-[90px] border-r border-b border-border/50 p-1 transition-colors',
                    isWeekend && 'bg-surface-75/20',
                    isToday && 'bg-brand-500/5'
                  )}
                >
                  <div
                    className={cn(
                      'text-[11px] font-medium mb-0.5 w-5 h-5 flex items-center justify-center rounded-full',
                      isToday ? 'bg-brand-500 text-white' : 'text-foreground-light'
                    )}
                  >
                    {dayNum}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((evt) => (
                      <button
                        key={String(evt.id)}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEventClick(evt)
                        }}
                        className={cn(
                          'w-full text-left text-[9px] leading-tight px-1 py-0.5 rounded border truncate transition-colors hover:opacity-80',
                          getStatusColor(evt.status, config.status_colors)
                        )}
                        title={`${evt.title} (${formatTime(evt.start)}—${formatTime(evt.end)})${evt.status ? ` [${evt.status}]` : ''}`}
                      >
                        <span className="font-medium">{formatTime(evt.start)}</span> {evt.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[8px] text-foreground-muted pl-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Week View */
        <div>
          {/* Header */}
          <div className="grid grid-cols-7 border-b border-border">
            {weekDays.map((d, i) => {
              const isToday = isSameDay(d, today)
              return (
                <div
                  key={i}
                  className={cn(
                    'text-center py-2 border-r border-border/50 last:border-r-0',
                    isToday && 'bg-brand-500/5'
                  )}
                >
                  <div className="text-[10px] text-foreground-muted">{WEEKDAYS[i]}</div>
                  <div
                    className={cn(
                      'text-sm font-medium mt-0.5',
                      isToday ? 'text-brand-500' : 'text-foreground'
                    )}
                  >
                    {d.getDate()}
                  </div>
                </div>
              )
            })}
          </div>
          {/* Events grid */}
          <div className="grid grid-cols-7 min-h-[360px]">
            {weekDays.map((d, i) => {
              const dayEvents = getEventsForDay(d)
              const isToday = isSameDay(d, today)
              return (
                <div
                  key={i}
                  className={cn(
                    'border-r border-border/50 last:border-r-0 p-1 space-y-1',
                    isToday && 'bg-brand-500/3'
                  )}
                >
                  {dayEvents.map((evt) => (
                    <button
                      key={String(evt.id)}
                      onClick={() => handleEventClick(evt)}
                      className={cn(
                        'w-full text-left text-[10px] leading-tight px-1.5 py-1 rounded border transition-colors hover:opacity-80',
                        getStatusColor(evt.status, config.status_colors)
                      )}
                    >
                      <div className="font-medium truncate">{evt.title}</div>
                      <div className="text-[9px] opacity-70 mt-0.5">
                        {formatTime(evt.start)} — {formatTime(evt.end)}
                      </div>
                      {evt.status && (
                        <div className="text-[8px] opacity-60 mt-0.5">{evt.status}</div>
                      )}
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Status legend */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-t border-border bg-surface-75/30">
        {Object.entries(config.status_colors || DEFAULT_STATUS_COLORS)
          .slice(0, 6)
          .map(([status, colorClass]) => (
            <div key={status} className="flex items-center gap-1">
              <div className={cn('w-2 h-2 rounded-sm border', colorClass)} />
              <span className="text-[9px] text-foreground-muted">{status}</span>
            </div>
          ))}
      </div>

      {/* Event detail panel */}
      {selectedEvent && (
        <div className="border-t border-border bg-surface-100 p-3">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-sm font-semibold text-foreground">{selectedEvent.title}</div>
              {selectedEvent.status && (
                <span
                  className={cn(
                    'inline-block text-[10px] px-1.5 py-0.5 rounded border mt-1',
                    getStatusColor(selectedEvent.status, config.status_colors)
                  )}
                >
                  {selectedEvent.status}
                </span>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[10px]"
              onClick={() => setSelectedEvent(null)}
            >
              关闭
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-foreground-muted">
              <Clock className="w-3 h-3" />
              <span>
                {selectedEvent.start.toLocaleDateString('zh-CN')} {formatTime(selectedEvent.start)}{' '}
                — {formatTime(selectedEvent.end)}
              </span>
            </div>
            {config.detail_fields?.map((f) => {
              const val = selectedEvent.raw[f.key]
              if (val === null || val === undefined || val === '') return null
              return (
                <div key={f.key} className="flex items-center gap-1.5">
                  <span className="text-foreground-muted">{f.label}:</span>
                  <span className="text-foreground">{String(val)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
