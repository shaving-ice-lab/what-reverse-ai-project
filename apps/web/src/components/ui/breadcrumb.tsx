"use client"

/**
 * Breadcrumb BreadcrumbNavigationComponent
 * 
 * Support: 
 * - multipletypeDelimiterstyle
 * - canCollapseDisplay
 * - IconandDescription
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, ChevronDown, MoreHorizontal, Home, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// DelimiterType
type SeparatorType = "chevron" | "slash" | "arrow" | "dot"

const separatorIcons: Record<SeparatorType, React.ReactNode> = {
 chevron: <ChevronRight className="w-4 h-4" />,
 slash: <span className="text-lg">/</span>,
 arrow: <span className="text-sm">→</span>,
 dot: <span className="text-lg">•</span>,
}

// Breadcrumb Context
interface BreadcrumbContextValue {
 separator: SeparatorType
}

const BreadcrumbContext = React.createContext<BreadcrumbContextValue>({
 separator: "chevron",
})

/**
 * Breadcrumb - Breadcrumb
 */
interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
 /** DelimiterType */
 separator?: SeparatorType
 /** MaximumDisplaycount(ExceedCollapse) */
 maxItems?: number
 /** CollapsetimeDisplay'scount(tailDisplaymultiplefew) */
 itemsBeforeCollapse?: number
 itemsAfterCollapse?: number
}

function Breadcrumb({
 className,
 separator = "chevron",
 maxItems,
 itemsBeforeCollapse = 1,
 itemsAfterCollapse = 2,
 children,
 ...props
}: BreadcrumbProps) {
 const items = React.Children.toArray(children)
 const shouldCollapse = maxItems && items.length > maxItems

 // CollapseProcess
 const visibleItems = React.useMemo(() => {
 if (!shouldCollapse) return items

 const beforeItems = items.slice(0, itemsBeforeCollapse)
 const afterItems = items.slice(-itemsAfterCollapse)

 return [
 ...beforeItems,
 <BreadcrumbEllipsis key="ellipsis" items={items.slice(itemsBeforeCollapse, -itemsAfterCollapse)} />,
 ...afterItems,
 ]
 }, [items, shouldCollapse, itemsBeforeCollapse, itemsAfterCollapse])

 return (
 <BreadcrumbContext.Provider value={{ separator }}>
 <nav
 aria-label="BreadcrumbNavigation"
 className={cn("flex items-center", className)}
 {...props}
 >
 <ol className="flex items-center gap-1.5 text-sm">
 {visibleItems.map((child, index) => (
 <React.Fragment key={index}>
 {index > 0 && (
 <li className="text-muted-foreground/50 flex items-center" aria-hidden>
 {separatorIcons[separator]}
 </li>
 )}
 {child}
 </React.Fragment>
 ))}
 </ol>
 </nav>
 </BreadcrumbContext.Provider>
 )
}

/**
 * BreadcrumbItem - Breadcrumb
 */
interface BreadcrumbItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
 /** isnoasCurrentPage */
 isCurrent?: boolean
}

function BreadcrumbItem({
 className,
 isCurrent = false,
 children,
 ...props
}: BreadcrumbItemProps) {
 return (
 <li
 className={cn("flex items-center gap-1.5", className)}
 aria-current={isCurrent ? "page" : undefined}
 {...props}
 >
 {children}
 </li>
 )
}

/**
 * BreadcrumbLink - BreadcrumbLink
 */
interface BreadcrumbLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
 /** isnoDisable */
 disabled?: boolean
 /** beforeIcon */
 icon?: React.ReactNode
 /** isnoasCurrentPage */
 isCurrent?: boolean
 /** asButtonUsage */
 asChild?: boolean
}

const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
 ({ className, disabled, icon, isCurrent, asChild, children, ...props }, ref) => {
 const Comp = asChild ? Slot : "a"

 return (
 <Comp
 ref={ref}
 className={cn(
 "flex items-center gap-1.5 transition-colors",
 isCurrent
 ? "text-foreground font-medium cursor-default"
 : "text-muted-foreground hover:text-foreground",
 disabled && "pointer-events-none opacity-50",
 className
 )}
 aria-disabled={disabled}
 {...props}
 >
 {icon}
 {children}
 </Comp>
 )
 }
)
BreadcrumbLink.displayName = "BreadcrumbLink"

/**
 * BreadcrumbPage - CurrentPage(notcanClick)
 */
interface BreadcrumbPageProps extends React.HTMLAttributes<HTMLSpanElement> {
 icon?: React.ReactNode
}

function BreadcrumbPage({
 className,
 icon,
 children,
 ...props
}: BreadcrumbPageProps) {
 return (
 <span
 className={cn(
 "flex items-center gap-1.5 text-foreground font-medium",
 className
 )}
 aria-current="page"
 {...props}
 >
 {icon}
 {children}
 </span>
 )
}

/**
 * BreadcrumbEllipsis - Collapse'sBreadcrumb(downExpand)
 */
interface BreadcrumbEllipsisProps {
 items: React.ReactNode[]
}

function BreadcrumbEllipsis({ items }: BreadcrumbEllipsisProps) {
 const [isOpen, setIsOpen] = React.useState(false)

 return (
 <li className="relative">
 <button
 onClick={() => setIsOpen(!isOpen)}
 className={cn(
 "flex items-center justify-center w-6 h-6 rounded",
 "text-muted-foreground hover:text-foreground hover:bg-muted",
 "transition-colors"
 )}
 aria-label="Show morePath"
 >
 <MoreHorizontal className="w-4 h-4" />
 </button>

 {/* Dropdown Menu */}
 {isOpen && (
 <>
 <div
 className="fixed inset-0 z-40"
 onClick={() => setIsOpen(false)}
 />
 <div className="absolute top-full left-0 mt-1 z-50 min-w-[160px] p-1 bg-popover border border-border rounded-lg shadow-lg">
 {items.map((item, index) => (
 <div
 key={index}
 className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md cursor-pointer"
 >
 {item}
 </div>
 ))}
 </div>
 </>
 )}
 </li>
 )
}

/**
 * BreadcrumbSeparator - CustomDelimiter
 */
function BreadcrumbSeparator({
 className,
 children,
 ...props
}: React.HTMLAttributes<HTMLLIElement>) {
 return (
 <li
 className={cn("text-muted-foreground/50", className)}
 aria-hidden
 {...props}
 >
 {children || <ChevronRight className="w-4 h-4" />}
 </li>
 )
}

/**
 * SimpleBreadcrumb - versionBreadcrumb
 */
interface SimpleBreadcrumbItem {
 label: string
 href?: string
 icon?: React.ReactNode
}

interface SimpleBreadcrumbProps {
 items: SimpleBreadcrumbItem[]
 separator?: SeparatorType
 homeIcon?: boolean
 className?: string
}

function SimpleBreadcrumb({
 items,
 separator = "chevron",
 homeIcon = true,
 className,
}: SimpleBreadcrumbProps) {
 return (
 <Breadcrumb separator={separator} className={className}>
 {items.map((item, index) => {
 const isLast = index === items.length - 1
 const showHomeIcon = homeIcon && index === 0

 return (
 <BreadcrumbItem key={index} isCurrent={isLast}>
 {isLast ? (
 <BreadcrumbPage icon={item.icon || (showHomeIcon && <Home className="w-4 h-4" />)}>
 {item.label}
 </BreadcrumbPage>
 ) : (
 <BreadcrumbLink
 href={item.href || "#"}
 icon={item.icon || (showHomeIcon && <Home className="w-4 h-4" />)}
 >
 {item.label}
 </BreadcrumbLink>
 )}
 </BreadcrumbItem>
 )
 })}
 </Breadcrumb>
 )
}

/**
 * BreadcrumbWithDropdown - Dropdown Menu'sBreadcrumb
 */
interface BreadcrumbWithDropdownProps {
 label: string
 icon?: React.ReactNode
 items: {
 label: string
 href?: string
 icon?: React.ReactNode
 }[]
}

function BreadcrumbWithDropdown({
 label,
 icon,
 items,
}: BreadcrumbWithDropdownProps) {
 const [isOpen, setIsOpen] = React.useState(false)

 return (
 <div className="relative">
 <button
 onClick={() => setIsOpen(!isOpen)}
 className={cn(
 "flex items-center gap-1.5",
 "text-muted-foreground hover:text-foreground",
 "transition-colors"
 )}
 >
 {icon}
 <span>{label}</span>
 <ChevronDown className={cn(
 "w-3 h-3 transition-transform",
 isOpen && "rotate-180"
 )} />
 </button>

 {isOpen && (
 <>
 <div
 className="fixed inset-0 z-40"
 onClick={() => setIsOpen(false)}
 />
 <div className="absolute top-full left-0 mt-1 z-50 min-w-[180px] p-1 bg-popover border border-border rounded-lg shadow-lg">
 {items.map((item, index) => (
 <a
 key={index}
 href={item.href || "#"}
 className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
 onClick={() => setIsOpen(false)}
 >
 {item.icon}
 {item.label}
 </a>
 ))}
 </div>
 </>
 )}
 </div>
 )
}

export {
 Breadcrumb,
 BreadcrumbItem,
 BreadcrumbLink,
 BreadcrumbPage,
 BreadcrumbSeparator,
 BreadcrumbEllipsis,
 SimpleBreadcrumb,
 BreadcrumbWithDropdown,
}
export type {
 BreadcrumbProps,
 BreadcrumbItemProps,
 BreadcrumbLinkProps,
 BreadcrumbPageProps,
 SimpleBreadcrumbProps,
 SimpleBreadcrumbItem,
 BreadcrumbWithDropdownProps,
}