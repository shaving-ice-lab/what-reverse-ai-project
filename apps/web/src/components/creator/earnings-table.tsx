"use client";

/**
 * EarningsDetailTableComponent - Enhanced
 */

import { useState } from "react";
import {
 Package,
 RefreshCw,
 Gift,
 Users,
 Clock,
 CheckCircle2,
 XCircle,
 ExternalLink,
 MoreHorizontal,
 Eye,
 Copy,
 Receipt,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "@/components/ui/table";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Earning {
 id: string;
 earning_type: string;
 gross_amount: number;
 net_amount: number;
 status: string;
 agent?: { name: string; icon?: string } | null;
 created_at: string;
}

interface EarningsTableProps {
 earnings: Earning[];
}

// EarningsTypeConfig
const earningTypeConfig = {
 sale: {
 label: "Sales",
 icon: Package,
 color: "text-brand-500",
 bgColor: "bg-brand-200/70",
 },
 subscription: {
 label: "Subscription",
 icon: RefreshCw,
 color: "text-foreground-light",
 bgColor: "bg-surface-200",
 },
 tip: {
 label: "",
 icon: Gift,
 color: "text-foreground-light",
 bgColor: "bg-surface-200",
 },
 referral: {
 label: "Recommended",
 icon: Users,
 color: "text-foreground-light",
 bgColor: "bg-surface-200",
 },
};

// StatusConfig
const statusConfig = {
 pending: {
 label: "pendingConfirm",
 icon: Clock,
 color: "text-warning",
 bgColor: "bg-warning-200",
 borderColor: "border-warning/30",
 dotColor: "bg-warning",
 animate: true,
 },
 confirmed: {
 label: "alreadyConfirm",
 icon: CheckCircle2,
 color: "text-foreground-light",
 bgColor: "bg-surface-200",
 borderColor: "border-border",
 dotColor: "bg-foreground-muted",
 animate: false,
 },
 settled: {
 label: "alreadySettlement",
 icon: CheckCircle2,
 color: "text-brand-500",
 bgColor: "bg-brand-200/60",
 borderColor: "border-brand-500/30",
 dotColor: "bg-brand-500",
 animate: false,
 },
 refunded: {
 label: "alreadyRefund",
 icon: XCircle,
 color: "text-destructive-400",
 bgColor: "bg-destructive-200",
 borderColor: "border-destructive/30",
 dotColor: "bg-destructive-400",
 animate: false,
 },
 cancelled: {
 label: "Cancelled",
 icon: XCircle,
 color: "text-foreground-muted",
 bgColor: "bg-surface-200",
 borderColor: "border-border",
 dotColor: "bg-foreground-muted",
 animate: false,
 },
};

export function EarningsTable({ earnings }: EarningsTableProps) {
 const [hoveredRow, setHoveredRow] = useState<string | null>(null);

 if (earnings.length === 0) {
 return (
 <div className="flex flex-col items-center justify-center py-16 text-foreground-muted">
 <div className="h-16 w-16 rounded-2xl bg-surface-200 flex items-center justify-center mb-4">
 <Receipt className="h-8 w-8 opacity-50" />
 </div>
 <p className="text-sm font-medium mb-1">NoneEarningsRecord</p>
 <p className="text-xs text-foreground-muted">EarningsRecordwillatthisinDisplay</p>
 </div>
 );
 }

 return (
 <div className="overflow-x-auto rounded-lg border border-border">
 <Table>
 <TableHeader>
 <TableRow className="bg-surface-200 border-border">
 <TableHead className="text-table-header">
 Type
 </TableHead>
 <TableHead className="text-table-header">
 Source
 </TableHead>
 <TableHead className="text-table-header text-right">
 totalAmount
 </TableHead>
 <TableHead className="text-table-header text-right">
 Earnings
 </TableHead>
 <TableHead className="text-table-header">
 Status
 </TableHead>
 <TableHead className="text-table-header">
 Time
 </TableHead>
 <TableHead className="text-table-header w-10">
 
 </TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {earnings.map((earning, index) => {
 const typeConfig = earningTypeConfig[earning.earning_type as keyof typeof earningTypeConfig];
 const TypeIcon = typeConfig?.icon || Package;
 const statusCfg = statusConfig[earning.status as keyof typeof statusConfig];
 const isHovered = hoveredRow === earning.id;

 return (
 <TableRow 
 key={earning.id} 
 className={cn(
 "border-border transition-colors duration-200 cursor-pointer",
 isHovered && "bg-surface-100"
 )}
 onMouseEnter={() => setHoveredRow(earning.id)}
 onMouseLeave={() => setHoveredRow(null)}
 style={{
 animationDelay: `${index * 50}ms`,
 }}
 >
 {/* Type */}
 <TableCell className="py-4">
 <div className="flex items-center gap-3">
 <div className={cn(
 "h-9 w-9 rounded-xl flex items-center justify-center transition-transform duration-200",
 typeConfig?.bgColor || "bg-surface-200",
 isHovered && "scale-110"
 )}>
 <TypeIcon className={cn("h-4 w-4", typeConfig?.color || "text-foreground-muted")} />
 </div>
 <div>
 <span className="text-sm font-medium text-foreground">
 {typeConfig?.label || earning.earning_type}
 </span>
 <p className="text-xs text-foreground-muted mt-0.5">
 #{earning.id.slice(0, 8)}
 </p>
 </div>
 </div>
 </TableCell>
 
 {/* Source */}
 <TableCell className="py-4">
 {earning.agent ? (
 <div className="flex items-center gap-2">
 {(earning.agent as any).icon && (
 <span className="text-base">{(earning.agent as any).icon}</span>
 )}
 <span className="text-sm text-foreground font-medium">
 {earning.agent.name}
 </span>
 </div>
 ) : (
 <span className="text-sm text-foreground-muted">-</span>
 )}
 </TableCell>
 
 {/* totalAmount */}
 <TableCell className="py-4 text-right">
 <span className="text-sm text-foreground-muted tabular-nums">
 {earning.gross_amount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
 </span>
 </TableCell>
 
 {/* Earnings */}
 <TableCell className="py-4 text-right">
 <span className="text-sm font-semibold text-brand-500 tabular-nums">
 +{earning.net_amount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
 </span>
 </TableCell>
 
 {/* Status */}
 <TableCell className="py-4">
 <Badge 
 variant="outline" 
 className={cn(
 "text-xs font-medium px-2.5 py-1 rounded-full border",
 statusCfg?.bgColor,
 statusCfg?.color,
 statusCfg?.borderColor
 )}
 >
 <span className={cn(
 "h-1.5 w-1.5 rounded-full mr-1.5",
 statusCfg?.dotColor,
 statusCfg?.animate && "animate-pulse"
 )} />
 {statusCfg?.label || earning.status}
 </Badge>
 </TableCell>
 
 {/* Time */}
 <TableCell className="py-4">
 <Tooltip>
 <TooltipTrigger asChild>
 <span className="text-sm text-foreground-muted cursor-help">
 {formatDateTime(earning.created_at)}
 </span>
 </TooltipTrigger>
 <TooltipContent>
 {new Date(earning.created_at).toLocaleString("zh-CN", {
 year: "numeric",
 month: "long",
 day: "numeric",
 hour: "2-digit",
 minute: "2-digit",
 second: "2-digit",
 })}
 </TooltipContent>
 </Tooltip>
 </TableCell>
 
 {/* Action */}
 <TableCell className="py-4">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button 
 variant="ghost" 
 size="sm" 
 className={cn(
 "h-8 w-8 p-0 opacity-0 transition-opacity",
 isHovered && "opacity-100"
 )}
 >
 <MoreHorizontal className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-40">
 <DropdownMenuItem className="text-sm cursor-pointer">
 <Eye className="h-4 w-4 mr-2" />
 ViewDetails
 </DropdownMenuItem>
 <DropdownMenuItem className="text-sm cursor-pointer">
 <Copy className="h-4 w-4 mr-2" />
 CopyOrder
 </DropdownMenuItem>
 <DropdownMenuItem className="text-sm cursor-pointer">
 <ExternalLink className="h-4 w-4 mr-2" />
 View Agent
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </TableCell>
 </TableRow>
 );
 })}
 </TableBody>
 </Table>
 </div>
 );
}

// FormatDate & Time
function formatDateTime(dateStr: string): string {
 const date = new Date(dateStr);
 const now = new Date();
 const diffMs = now.getTime() - date.getTime();
 const diffMins = Math.floor(diffMs / 60000);
 const diffHours = Math.floor(diffMs / 3600000);
 const diffDays = Math.floor(diffMs / 86400000);
 
 // forTimeDisplay
 if (diffMins < 1) return "Just now";
 if (diffMins < 60) return `${diffMins} minbefore`;
 if (diffHours < 24) return `${diffHours} hbefore`;
 if (diffDays < 7) return `${diffDays} daysbefore`;
 
 // forTimeDisplay
 return date.toLocaleString("zh-CN", {
 month: "short",
 day: "numeric",
 hour: "2-digit",
 minute: "2-digit",
 });
}
