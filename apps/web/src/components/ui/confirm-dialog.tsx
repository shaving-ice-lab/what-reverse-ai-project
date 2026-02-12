'use client'

/**
 * Confirm Dialog Component
 * Used for dangerous actions that require double confirmation
 */

import { ReactNode, useState } from 'react'
import {
  AlertTriangle,
  Trash2,
  LogOut,
  CheckCircle,
  Info,
  HelpCircle,
  LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

// ============================================
// ConfirmDialog
// ============================================

type DialogVariant = 'danger' | 'destructive' | 'warning' | 'info' | 'success'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: DialogVariant
  icon?: LucideIcon
  isLoading?: boolean
  children?: ReactNode
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  icon,
  isLoading = false,
  children,
}: ConfirmDialogProps) {
  const getVariantConfig = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-red-500/10',
          iconColor: 'text-red-500',
          buttonClass: 'bg-red-500 hover:bg-red-600 text-white',
        }
      case 'warning':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-amber-500/10',
          iconColor: 'text-amber-500',
          buttonClass: 'bg-amber-500 hover:bg-amber-600 text-white',
        }
      case 'info':
        return {
          icon: Info,
          iconBg: 'bg-blue-500/10',
          iconColor: 'text-blue-500',
          buttonClass: 'bg-blue-500 hover:bg-blue-600 text-white',
        }
      case 'success':
        return {
          icon: CheckCircle,
          iconBg: 'bg-emerald-500/10',
          iconColor: 'text-emerald-500',
          buttonClass: 'bg-emerald-500 hover:bg-emerald-600 text-white',
        }
      case 'destructive':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-red-500/10',
          iconColor: 'text-red-500',
          buttonClass: 'bg-red-500 hover:bg-red-600 text-white',
        }
      default:
        return {
          icon: HelpCircle,
          iconBg: 'bg-gray-500/10',
          iconColor: 'text-gray-500',
          buttonClass: '',
        }
    }
  }

  const config = getVariantConfig()
  const Icon = icon || config.icon

  if (!isOpen) return null

  return (
    <>
      {/* Background Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 rounded-2xl bg-card border border-border shadow-2xl z-50">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
              config.iconBg
            )}
          >
            <Icon className={cn('w-6 h-6', config.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
        </div>

        {children && <div className="mt-4">{children}</div>}

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button className={config.buttonClass} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </>
  )
}

// ============================================
// DeleteConfirmDialog
// ============================================

interface DeleteConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  itemName: string
  itemType?: string
  isLoading?: boolean
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = 'item',
  isLoading = false,
}: DeleteConfirmDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Delete ${itemType}`}
      description={`Delete "${itemName}"? This action cannot be undone.`}
      confirmText="Delete"
      cancelText="Cancel"
      variant="danger"
      icon={Trash2}
      isLoading={isLoading}
    />
  )
}

// ============================================
// Logout Confirm Dialog
// ============================================

interface LogoutConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  isLoading?: boolean
}

export function LogoutConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: LogoutConfirmDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Sign Out"
      description="Are you sure you want to sign out of your account?"
      confirmText="Exit"
      cancelText="Cancel"
      variant="warning"
      icon={LogOut}
      isLoading={isLoading}
    />
  )
}

// ============================================
// Input Confirm Dialog
// ============================================

interface InputConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (value: string) => void | Promise<void>
  title: string
  description?: string
  placeholder?: string
  confirmText?: string
  confirmValue?: string
  variant?: DialogVariant
  isLoading?: boolean
}

export function InputConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  placeholder = 'Please enter confirmation text',
  confirmText = 'Confirm',
  confirmValue,
  variant = 'danger',
  isLoading = false,
}: InputConfirmDialogProps) {
  const [inputValue, setInputValue] = useState('')

  const handleConfirm = () => {
    onConfirm(inputValue)
  }

  const isConfirmDisabled = confirmValue ? inputValue !== confirmValue : !inputValue.trim()

  if (!isOpen) return null

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={() => {
        onClose()
        setInputValue('')
      }}
      onConfirm={handleConfirm}
      title={title}
      description={description}
      confirmText={confirmText}
      variant={variant}
      isLoading={isLoading || isConfirmDisabled}
    >
      <div className="mt-4">
        {confirmValue && (
          <p className="text-sm text-muted-foreground mb-2">
            Please enter{' '}
            <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-foreground">
              {confirmValue}
            </code>{' '}
            to confirm
          </p>
        )}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="w-full h-10 px-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>
    </ConfirmDialog>
  )
}

// ============================================
// Hook
// ============================================

interface UseConfirmDialogOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: DialogVariant
}

export function useConfirmDialog(defaultOptions?: Partial<UseConfirmDialogOptions>) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null)
  const [activeOptions, setActiveOptions] = useState<Partial<UseConfirmDialogOptions>>(
    defaultOptions ?? {}
  )

  const confirm = (callOptions?: Partial<UseConfirmDialogOptions>): Promise<boolean> => {
    if (callOptions) setActiveOptions({ ...defaultOptions, ...callOptions })
    setIsOpen(true)
    return new Promise((resolve) => {
      setResolvePromise(() => resolve)
    })
  }

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      resolvePromise?.(true)
    } finally {
      setIsLoading(false)
      setIsOpen(false)
    }
  }

  const handleClose = () => {
    resolvePromise?.(false)
    setIsOpen(false)
  }

  const DialogComponent = () => (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      isLoading={isLoading}
      title={activeOptions?.title ?? 'Confirm'}
      description={activeOptions?.description}
      confirmText={activeOptions?.confirmText}
      cancelText={activeOptions?.cancelText}
      variant={activeOptions?.variant}
    />
  )

  return {
    confirm,
    Dialog: DialogComponent,
    ConfirmDialog: DialogComponent,
  }
}
