'use client'

/**
 * KBD Keyboard Shortcut Component
 *
 * Used to display keyboard shortcuts and modifier keys
 */

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// KBD Variant
const kbdVariants = cva(
  ['inline-flex items-center justify-center', 'font-mono font-medium', 'select-none'],
  {
    variants: {
      variant: {
        default: [
          'bg-muted border border-border',
          'text-muted-foreground',
          'shadow-[0_1px_0_1px] shadow-border/50',
        ],
        outline: ['bg-transparent border border-border', 'text-muted-foreground'],
        ghost: ['bg-muted/50', 'text-muted-foreground'],
        filled: ['bg-foreground/10', 'text-foreground'],
        primary: ['bg-primary/10 border border-primary/20', 'text-primary'],
      },
      size: {
        xs: 'h-4 min-w-4 px-1 text-[10px] rounded',
        sm: 'h-5 min-w-5 px-1.5 text-[11px] rounded-md',
        default: 'h-6 min-w-6 px-1.5 text-xs rounded-md',
        lg: 'h-7 min-w-7 px-2 text-sm rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface KbdProps
  extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof kbdVariants> {}

function Kbd({ className, variant, size, children, ...props }: KbdProps) {
  return (
    <kbd className={cn(kbdVariants({ variant, size }), className)} {...props}>
      {children}
    </kbd>
  )
}

/**
 * KeyboardShortcut - keyBoard Shortcutskeygroup
 */
interface KeyboardShortcutProps {
  /** Shortcutkeycountgroup */
  keys: string[]
  /** Variant */
  variant?: KbdProps['variant']
  /** Dimension */
  size?: KbdProps['size']
  /** Delimiterstyle */
  separator?: 'plus' | 'then' | 'none'
  className?: string
}

function KeyboardShortcut({
  keys,
  variant = 'default',
  size = 'default',
  separator = 'plus',
  className,
}: KeyboardShortcutProps) {
  const separatorElement =
    separator === 'plus' ? (
      <span className="text-muted-foreground/50 text-xs mx-0.5">+</span>
    ) : separator === 'then' ? (
      <span className="text-muted-foreground/50 text-xs mx-1">then</span>
    ) : null

  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          <Kbd variant={variant} size={size}>
            {formatKey(key)}
          </Kbd>
          {index < keys.length - 1 && separatorElement}
        </React.Fragment>
      ))}
    </span>
  )
}

/**
 * Formatkey
 */
function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    // key
    cmd: '⌘',
    command: '⌘',
    meta: '⌘',
    ctrl: '⌃',
    control: '⌃',
    alt: '⌥',
    option: '⌥',
    shift: '⇧',
    // Featureskey
    enter: '↵',
    return: '↵',
    tab: '⇥',
    space: '␣',
    backspace: '⌫',
    delete: '⌦',
    escape: '⎋',
    esc: '⎋',
    // methodkey
    up: '↑',
    down: '↓',
    left: '←',
    right: '→',
    // otherhe
    capslock: '⇪',
    fn: 'fn',
  }

  const normalized = key.toLowerCase()
  return keyMap[normalized] || key.toUpperCase()
}

/**
 * ShortcutHint - Shortcut key tip (used for buttons/menus)
 */
interface ShortcutHintProps {
  keys: string[]
  className?: string
}

function ShortcutHint({ keys, className }: ShortcutHintProps) {
  return (
    <span className={cn('ml-auto text-xs text-muted-foreground', className)}>
      {keys.map(formatKey).join('')}
    </span>
  )
}

/**
 * HotkeyDisplay - keyDisplayComponent
 */
interface HotkeyDisplayProps {
  /** keyText, if "Ctrl+K" or "⌘K" */
  hotkey: string
  variant?: KbdProps['variant']
  size?: KbdProps['size']
  className?: string
}

function HotkeyDisplay({
  hotkey,
  variant = 'default',
  size = 'sm',
  className,
}: HotkeyDisplayProps) {
  // ParsekeyString
  const parts = hotkey.split(/([+\s])/).filter((p) => p && p !== '+' && p !== '')

  return (
    <KeyboardShortcut
      keys={parts}
      variant={variant}
      size={size}
      separator="none"
      className={className}
    />
  )
}

/**
 * CommandPaletteTrigger - CommandPanelTriggerstyle
 */
interface CommandPaletteTriggerProps {
  placeholder?: string
  shortcut?: string[]
  onClick?: () => void
  className?: string
}

function CommandPaletteTrigger({
  placeholder = 'Search...',
  shortcut = ['cmd', 'k'],
  onClick,
  className,
}: CommandPaletteTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 w-full max-w-sm',
        'h-9 px-3 rounded-lg',
        'bg-muted/50 border border-border',
        'text-sm text-muted-foreground',
        'hover:bg-muted hover:border-border',
        'transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary/50',
        className
      )}
    >
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <span className="flex-1 text-left">{placeholder}</span>
      <KeyboardShortcut keys={shortcut} size="xs" separator="none" />
    </button>
  )
}

export {
  Kbd,
  KeyboardShortcut,
  ShortcutHint,
  HotkeyDisplay,
  CommandPaletteTrigger,
  kbdVariants,
  formatKey,
}
export type {
  KeyboardShortcutProps,
  ShortcutHintProps,
  HotkeyDisplayProps,
  CommandPaletteTriggerProps,
}
