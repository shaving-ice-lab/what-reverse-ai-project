"use client";

/**
 * Empty StateComponent
 * Used forShowcaseListasEmpty, SearchNo resultsetcScenario
 */

import { ReactNode } from "react";
import Link from "next/link";
import {
 FolderOpen,
 Search,
 FileText,
 MessageSquare,
 Zap,
 Bot,
 Users,
 Inbox,
 AlertCircle,
 AlertTriangle,
 RefreshCw,
 Plus,
 ShieldAlert,
 WifiOff,
 Wrench,
 KeyRound,
 Timer,
 LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

// ============================================
// mainEmpty StateComponent
// ============================================

type EmptyStateTone = "neutral" | "info" | "warning" | "error" | "success";
type EmptyStateSize = "sm" | "md" | "lg";

const sizeStyles: Record<
 EmptyStateSize,
 { container: string; iconWrap: string; icon: string; title: string; description: string }
> = {
 sm: {
 container: "py-8",
 iconWrap: "w-10 h-10",
 icon: "w-5 h-5",
 title: "text-sm",
 description: "text-[12px]",
 },
 md: {
 container: "py-12",
 iconWrap: "w-11 h-11",
 icon: "w-5 h-5",
 title: "text-base",
 description: "text-[13px]",
 },
 lg: {
 container: "py-16",
 iconWrap: "w-12 h-12",
 icon: "w-6 h-6",
 title: "text-base",
 description: "text-[13px]",
 },
};

const toneStyles: Record<
 EmptyStateTone,
 {
 iconBg: string;
 iconColor: string;
 badge: string;
 border: string;
 glow: string;
 gradient: string;
 }
> = {
 neutral: {
 iconBg: "bg-surface-200",
 iconColor: "text-foreground-muted",
 badge: "text-foreground-light",
 border: "border-border",
 glow: "shadow-[0_0_18px_rgba(255,255,255,0.02)]",
 gradient: "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_55%)]",
 },
 info: {
 iconBg: "bg-brand-200/70",
 iconColor: "text-brand-500",
 badge: "text-brand-500",
 border: "border-brand-500/30",
 glow: "shadow-[0_0_24px_rgba(62,207,142,0.14)]",
 gradient: "bg-[radial-gradient(circle_at_top,rgba(62,207,142,0.18),transparent_55%)]",
 },
 warning: {
 iconBg: "bg-warning-200/70",
 iconColor: "text-warning",
 badge: "text-warning",
 border: "border-warning/40",
 glow: "shadow-[0_0_24px_rgba(245,158,11,0.16)]",
 gradient: "bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.2),transparent_55%)]",
 },
 error: {
 iconBg: "bg-destructive-200/70",
 iconColor: "text-destructive",
 badge: "text-destructive",
 border: "border-destructive/40",
 glow: "shadow-[0_0_24px_rgba(239,68,68,0.16)]",
 gradient: "bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.18),transparent_55%)]",
 },
 success: {
 iconBg: "bg-brand-200/70",
 iconColor: "text-brand-500",
 badge: "text-brand-500",
 border: "border-brand-500/40",
 glow: "shadow-[0_0_24px_rgba(62,207,142,0.16)]",
 gradient: "bg-[radial-gradient(circle_at_top,rgba(62,207,142,0.2),transparent_55%)]",
 },
};

interface EmptyStateProps {
 icon?: LucideIcon;
 title: string;
 description?: string;
 action?: {
 label: string;
 href?: string;
 onClick?: () => void;
 icon?: LucideIcon;
 };
 secondaryAction?: {
 label: string;
 href?: string;
 onClick?: () => void;
 };
 tone?: EmptyStateTone;
 size?: EmptyStateSize;
 badge?: string;
 className?: string;
 children?: ReactNode;
}

export function EmptyState({
 icon: Icon = Inbox,
 title,
 description,
 action,
 secondaryAction,
 tone = "neutral",
 size = "lg",
 badge,
 className,
 children,
}: EmptyStateProps) {
 const ActionIcon = action?.icon || Plus;
 const toneStyle = toneStyles[tone];
 const sizeStyle = sizeStyles[size];

 return (
 <div
 className={cn(
 "flex flex-col items-center justify-center px-4 text-center",
 sizeStyle.container,
 className
 )}
 >
 {badge && (
 <div
 className={cn(
 "text-[10px] tracking-[0.35em] uppercase mb-3",
 toneStyle.badge
 )}
 >
 {badge}
 </div>
 )}
 <div
 className={cn(
 "rounded-lg flex items-center justify-center mb-4",
 sizeStyle.iconWrap,
 toneStyle.iconBg
 )}
 >
 <Icon className={cn(sizeStyle.icon, toneStyle.iconColor)} />
 </div>
 
 <h3 className={cn("font-medium text-foreground mb-2", sizeStyle.title)}>
 {title}
 </h3>
 
 {description && (
 <p className={cn("text-foreground-light max-w-sm mb-6", sizeStyle.description)}>
 {description}
 </p>
 )}
 
 {children}
 
 {(action || secondaryAction) && (
 <div className="flex items-center gap-3 mt-2">
 {secondaryAction && (
 secondaryAction.href ? (
 <Link href={secondaryAction.href}>
 <Button variant="outline" size="sm">
 {secondaryAction.label}
 </Button>
 </Link>
 ) : (
 <Button variant="outline" size="sm" onClick={secondaryAction.onClick}>
 {secondaryAction.label}
 </Button>
 )
 )}
 
 {action && (
 action.href ? (
 <Link href={action.href}>
 <Button size="sm">
 <ActionIcon className="w-4 h-4 mr-2" />
 {action.label}
 </Button>
 </Link>
 ) : (
 <Button size="sm" onClick={action.onClick}>
 <ActionIcon className="w-4 h-4 mr-2" />
 {action.label}
 </Button>
 )
 )}
 </div>
 )}
 </div>
 );
}

type ExceptionVariant =
 | "empty"
 | "error"
 | "permission"
 | "offline"
 | "maintenance"
 | "not_found"
 | "rate_limit";

const exceptionPresets: Record<
 ExceptionVariant,
 { title: string; description: string; icon: LucideIcon; tone: EmptyStateTone; badge: string }
> = {
 empty: {
 title: "No data available",
 description: "CurrentNocanShowcase'sContent",
 icon: Inbox,
 tone: "neutral",
 badge: "EMPTY",
 },
 error: {
 title: "LoadFailed",
 description: "Occur1Error, Please try again laterRetry",
 icon: AlertTriangle,
 tone: "error",
 badge: "ERROR",
 },
 permission: {
 title: "Insufficient permissions",
 description: "PleaseCheckPermissionorContactAdminFetchAccess",
 icon: ShieldAlert,
 tone: "warning",
 badge: "ACCESS",
 },
 offline: {
 title: "NetworkUnavailable",
 description: "PleaseCheckNetworkConnectafterRetry",
 icon: WifiOff,
 tone: "warning",
 badge: "OFFLINE",
 },
 maintenance: {
 title: "SystemMaintain",
 description: "CurrentServicecurrentlyatMaintain, Please try again later",
 icon: Wrench,
 tone: "info",
 badge: "MAINT",
 },
 not_found: {
 title: "not yettoContent",
 description: "NoMatch'sContentoralreadybyRemove",
 icon: Search,
 tone: "neutral",
 badge: "MISSING",
 },
 rate_limit: {
 title: "RequestpastatFrequent",
 description: "Please try again laterorReduceRequestrate",
 icon: Timer,
 tone: "warning",
 badge: "LIMIT",
 },
};

interface ExceptionStateProps extends Omit<EmptyStateProps, "icon" | "title" | "description" | "tone" | "badge"> {
 variant?: ExceptionVariant;
 title?: string;
 description?: string;
 icon?: LucideIcon;
 tone?: EmptyStateTone;
 badge?: string;
}

export function ExceptionState({
 variant = "empty",
 title,
 description,
 icon,
 tone,
 badge,
 size = "md",
 className,
 ...rest
}: ExceptionStateProps) {
 const preset = exceptionPresets[variant];
 const resolvedTone = tone || preset.tone;
 const toneStyle = toneStyles[resolvedTone];

 return (
 <div
 className={cn(
 "relative overflow-hidden rounded-2xl border bg-surface-100/70 p-6",
 toneStyle.border,
 toneStyle.glow,
 className
 )}
 >
 <div className={cn("absolute inset-0 pointer-events-none opacity-45", toneStyle.gradient)} />
 <EmptyState
 icon={icon || preset.icon}
 title={title || preset.title}
 description={description || preset.description}
 tone={resolvedTone}
 size={size}
 badge={badge || preset.badge}
 className="py-0"
 {...rest}
 />
 </div>
 );
}

// ============================================
// PresetEmpty StateVariant
// ============================================

// SearchNo results
interface SearchEmptyStateProps {
 query?: string;
 onClear?: () => void;
 className?: string;
}

export function SearchEmptyState({ query, onClear, className }: SearchEmptyStateProps) {
 return (
 <EmptyState
 icon={Search}
 title={query ? `Noto "${query}" 'sRelatedResult`: "NotoResult"}
 description="TryUsageotherheKeywordsorAdjustFilterCondition"
 secondaryAction={
 onClear
 ? {
 label: "ClearSearch",
 onClick: onClear,
 }
 : undefined
 }
 className={className}
 />
 );
}

// EmptyFolder
interface FolderEmptyStateProps {
 onUpload?: () => void;
 className?: string;
}

export function FolderEmptyState({ onUpload, className }: FolderEmptyStateProps) {
 return (
 <EmptyState
 icon={FolderOpen}
 title="FolderasEmpty"
 description="UploadFileorCreatenewFolderStartOrganizeyou'sContent"
 action={
 onUpload
 ? {
 label: "UploadFile",
 onClick: onUpload,
 }
 : undefined
 }
 className={className}
 />
 );
}

// NoneWorkflow
interface WorkflowEmptyStateProps {
 onCreateClick?: () => void;
 className?: string;
}

export function WorkflowEmptyState({ onCreateClick, className }: WorkflowEmptyStateProps) {
 return (
 <EmptyState
 icon={Zap}
 title="Not yetWorkflow"
 description="Createyou's#1Workflow, StartAutomationJourney"
 action={
 onCreateClick
 ? {
 label: "CreateWorkflow",
 onClick: onCreateClick,
 }
 : {
 label: "CreateWorkflow",
 href: "/dashboard/workflows/new",
 }
 }
 className={className}
 />
 );
}

// NoneConversation
interface ConversationEmptyStateProps {
 className?: string;
}

export function ConversationEmptyState({ className }: ConversationEmptyStateProps) {
 return (
 <EmptyState
 icon={MessageSquare}
 title="StartnewConversation"
 description="and AI AssistantExchange, FetchHelpandInspiration"
 action={{
 label: "CreateConversation",
 href: "/dashboard/conversations",
 icon: MessageSquare,
 }}
 className={className}
 />
 );
}

// None Agent
interface AgentEmptyStateProps {
 className?: string;
}

export function AgentEmptyState({ className }: AgentEmptyStateProps) {
 return (
 <EmptyState
 icon={Bot}
 title="Not yet Agent"
 description="Createyou's#1 AI Agent, letityouProcessTask"
 action={{
 label: "Create Agent",
 href: "/dashboard/my-agents/new",
 }}
 className={className}
 />
 );
}

// NoneTeamMember
interface TeamEmptyStateProps {
 onInvite?: () => void;
 className?: string;
}

export function TeamEmptyState({ onInvite, className }: TeamEmptyStateProps) {
 return (
 <EmptyState
 icon={Users}
 title="InviteTeamMember"
 description="andTeam1Collaboration, ImproveWorkrate"
 action={
 onInvite
 ? {
 label: "InviteMember",
 onClick: onInvite,
 }
 : undefined
 }
 className={className}
 />
 );
}

// LoadError
interface ErrorEmptyStateProps {
 title?: string;
 description?: string;
 onRetry?: () => void;
 className?: string;
}

export function ErrorEmptyState({
 title = "LoadFailed",
 description = "Occur1Error, PleaseRetry",
 onRetry,
 className,
}: ErrorEmptyStateProps) {
 return (
 <EmptyState
 icon={AlertCircle}
 title={title}
 description={description}
 tone="error"
 action={
 onRetry
 ? {
 label: "Retry",
 onClick: onRetry,
 icon: RefreshCw,
 }
 : undefined
 }
 className={className}
 />
 );
}

// None API Key
interface ApiKeyEmptyStateProps {
 onAddClick?: () => void;
 className?: string;
}

export function ApiKeyEmptyState({ onAddClick, className }: ApiKeyEmptyStateProps) {
 return (
 <EmptyState
 icon={KeyRound}
 title="Not yet API Key"
 description="AddKeywithSecurityAccess API"
 action={
 onAddClick
 ? {
 label: "AddKey",
 onClick: onAddClick,
 }
 : undefined
 }
 className={className}
 />
 );
}

// NoneDocument
interface DocumentEmptyStateProps {
 onCreate?: () => void;
 className?: string;
}

export function DocumentEmptyState({ onCreate, className }: DocumentEmptyStateProps) {
 return (
 <EmptyState
 icon={FileText}
 title="Not yetDocument"
 description="Createyou's#1Document, StartContentCreative"
 action={
 onCreate
 ? {
 label: "CreateDocument",
 onClick: onCreate,
 }
 : {
 label: "CreateDocument",
 href: "/dashboard/creative/generate",
 }
 }
 className={className}
 />
 );
}

export const SearchEmpty = SearchEmptyState;
export const WorkflowEmpty = WorkflowEmptyState;
export const ErrorEmpty = ErrorEmptyState;
export const ApiKeyEmpty = ApiKeyEmptyState;
