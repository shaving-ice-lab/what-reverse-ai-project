'use client'

/**
 * DropdownMenu Dropdown MenuComponent - Enhanced
 *
 * Support:
 * - IconandShortcutkey
 * - DangerActionstyle
 * - DescriptionText
 * - AvatarMenu
 */

import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Check, ChevronRight, Circle, Command } from 'lucide-react'
import { cn } from '@/lib/utils'

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
    icon?: React.ReactNode
  }
>(({ className, inset, icon, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-[13px] outline-none',
      'text-foreground-light transition-colors',
      'focus:bg-surface-200 focus:text-foreground',
      'data-[state=open]:bg-surface-200 data-[state=open]:text-foreground',
      '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
      inset && 'pl-8',
      className
    )}
    {...props}
  >
    {icon && <span className="shrink-0 text-foreground-muted">{icon}</span>}
    {children}
    <ChevronRight className="ml-auto h-4 w-4 text-foreground-muted" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      'z-50 min-w-32 overflow-hidden rounded-md p-1',
      'bg-surface-100 border border-border',
      'shadow-lg shadow-black/30',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
      'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-32 overflow-hidden rounded-md p-1',
        'bg-surface-100 border border-border',
        'shadow-lg shadow-black/30',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

interface DropdownMenuItemProps extends React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Item
> {
  inset?: boolean
  /** Left sideIcon */
  icon?: React.ReactNode
  /** Shortcutkey */
  shortcut?: string
  /** DangerActionstyle */
  destructive?: boolean
  /** DescriptionText */
  description?: string
}

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuItemProps
>(
  (
    { className, inset, icon, shortcut, destructive, description, asChild, children, ...props },
    ref
  ) => (
    <DropdownMenuPrimitive.Item
      ref={ref}
      asChild={asChild}
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-[13px] outline-none',
        'transition-colors',
        destructive
          ? 'text-destructive-400 focus:bg-destructive-200 focus:text-destructive'
          : 'text-foreground-light focus:bg-surface-200 focus:text-foreground',
        'data-disabled:pointer-events-none data-disabled:opacity-50',
        '[&>svg]:size-4 [&>svg]:shrink-0',
        inset && 'pl-8',
        description && 'py-2',
        className
      )}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <React.Fragment>
          {icon && (
            <span
              className={cn(
                'shrink-0',
                destructive ? 'text-destructive-400' : 'text-foreground-muted'
              )}
            >
              {icon}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <div>{children}</div>
            {description && (
              <p className="text-[11px] text-foreground-muted mt-0.5 font-normal">{description}</p>
            )}
          </div>
          {shortcut && <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>}
        </React.Fragment>
      )}
    </DropdownMenuPrimitive.Item>
  )
)
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-2 text-[13px] outline-none',
      'transition-colors',
      'focus:bg-surface-200 focus:text-foreground',
      'data-disabled:pointer-events-none data-disabled:opacity-50',
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-brand-500" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-2 text-[13px] outline-none',
      'transition-colors',
      'focus:bg-surface-200 focus:text-foreground',
      'data-disabled:pointer-events-none data-disabled:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current text-brand-500" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      'px-2 py-1.5 text-[11px] font-medium text-foreground-muted uppercase tracking-wider',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-border', className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

interface DropdownMenuShortcutProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Shortcutkeycountgroup, if ["⌘", "K"] */
  keys?: string[]
}

const DropdownMenuShortcut = ({
  className,
  keys,
  children,
  ...props
}: DropdownMenuShortcutProps) => {
  // ifresultenter keys, RenderkeyBoard Shortcutskeystyle
  if (keys && keys.length > 0) {
    return (
      <span className={cn('ml-auto flex items-center gap-0.5', className)} {...props}>
        {keys.map((key, i) => (
          <kbd
            key={i}
            className="px-1 py-0.5 text-[10px] font-medium bg-surface-200 rounded border border-border"
          >
            {key}
          </kbd>
        ))}
      </span>
    )
  }

  return (
    <span
      className={cn('ml-auto text-xs text-foreground-muted tracking-widest', className)}
      {...props}
    >
      {children}
    </span>
  )
}
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut'

/**
 * DropdownMenuHeader - MenuHeader(UserInfo)
 */
interface DropdownMenuHeaderProps {
  avatar?: string
  name: string
  email?: string
  className?: string
}

function DropdownMenuHeader({ avatar, name, email, className }: DropdownMenuHeaderProps) {
  return (
    <div className={cn('flex items-center gap-3 px-2 py-2', className)}>
      {avatar ? (
        <img src={avatar} alt={name} className="w-9 h-9 rounded-full object-cover" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-brand-200 flex items-center justify-center text-brand-500 text-sm font-medium">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-foreground truncate">{name}</p>
        {email && <p className="text-[11px] text-foreground-light truncate">{email}</p>}
      </div>
    </div>
  )
}

/**
 * DropdownMenuIconItem - IconMenu(version)
 */
interface DropdownMenuIconItemProps {
  icon: React.ReactNode
  label: string
  shortcut?: string
  destructive?: boolean
  disabled?: boolean
  onSelect?: () => void
}

function DropdownMenuIconItem({
  icon,
  label,
  shortcut,
  destructive,
  disabled,
  onSelect,
}: DropdownMenuIconItemProps) {
  return (
    <DropdownMenuItem
      icon={icon}
      shortcut={shortcut}
      destructive={destructive}
      disabled={disabled}
      onSelect={onSelect}
    >
      {label}
    </DropdownMenuItem>
  )
}

/**
 * DropdownMenuSection - GroupRegion
 */
interface DropdownMenuSectionProps {
  title?: string
  children: React.ReactNode
}

function DropdownMenuSection({ title, children }: DropdownMenuSectionProps) {
  return (
    <>
      {title && <DropdownMenuLabel>{title}</DropdownMenuLabel>}
      <DropdownMenuGroup>{children}</DropdownMenuGroup>
    </>
  )
}

/**
 * SimpleDropdownMenu - SimpleDropdown Menu
 */
interface SimpleMenuItem {
  type?: 'item' | 'separator' | 'label'
  label?: string
  icon?: React.ReactNode
  shortcut?: string
  destructive?: boolean
  disabled?: boolean
  onSelect?: () => void
}

interface SimpleDropdownMenuProps {
  trigger: React.ReactNode
  items: SimpleMenuItem[]
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
}

function SimpleDropdownMenu({
  trigger,
  items,
  align = 'end',
  side = 'bottom',
}: SimpleDropdownMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side}>
        {items.map((item, index) => {
          if (item.type === 'separator') {
            return <DropdownMenuSeparator key={index} />
          }
          if (item.type === 'label') {
            return <DropdownMenuLabel key={index}>{item.label}</DropdownMenuLabel>
          }
          return (
            <DropdownMenuItem
              key={index}
              icon={item.icon}
              shortcut={item.shortcut}
              destructive={item.destructive}
              disabled={item.disabled}
              onSelect={item.onSelect}
            >
              {item.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuHeader,
  DropdownMenuIconItem,
  DropdownMenuSection,
  SimpleDropdownMenu,
}
export type {
  DropdownMenuItemProps,
  DropdownMenuShortcutProps,
  DropdownMenuHeaderProps,
  DropdownMenuIconItemProps,
  SimpleDropdownMenuProps,
}
