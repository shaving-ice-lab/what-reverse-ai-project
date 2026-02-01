"use client";

/**
 * 收入明细表格组件 - 增强版
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

// 收入类型配置
const earningTypeConfig = {
  sale: {
    label: "销售",
    icon: Package,
    color: "text-brand-500",
    bgColor: "bg-brand-200/70",
  },
  subscription: {
    label: "订阅",
    icon: RefreshCw,
    color: "text-foreground-light",
    bgColor: "bg-surface-200",
  },
  tip: {
    label: "打赏",
    icon: Gift,
    color: "text-foreground-light",
    bgColor: "bg-surface-200",
  },
  referral: {
    label: "推荐",
    icon: Users,
    color: "text-foreground-light",
    bgColor: "bg-surface-200",
  },
};

// 状态配置
const statusConfig = {
  pending: {
    label: "待确认",
    icon: Clock,
    color: "text-warning",
    bgColor: "bg-warning-200",
    borderColor: "border-warning/30",
    dotColor: "bg-warning",
    animate: true,
  },
  confirmed: {
    label: "已确认",
    icon: CheckCircle2,
    color: "text-foreground-light",
    bgColor: "bg-surface-200",
    borderColor: "border-border",
    dotColor: "bg-foreground-muted",
    animate: false,
  },
  settled: {
    label: "已结算",
    icon: CheckCircle2,
    color: "text-brand-500",
    bgColor: "bg-brand-200/60",
    borderColor: "border-brand-500/30",
    dotColor: "bg-brand-500",
    animate: false,
  },
  refunded: {
    label: "已退款",
    icon: XCircle,
    color: "text-destructive-400",
    bgColor: "bg-destructive-200",
    borderColor: "border-destructive/30",
    dotColor: "bg-destructive-400",
    animate: false,
  },
  cancelled: {
    label: "已取消",
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
        <p className="text-sm font-medium mb-1">暂无收入记录</p>
      <p className="text-xs text-foreground-muted">收入记录将在这里显示</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
        <TableRow className="bg-surface-200 border-border">
          <TableHead className="text-table-header">
              类型
            </TableHead>
          <TableHead className="text-table-header">
              来源
            </TableHead>
          <TableHead className="text-table-header text-right">
              总金额
            </TableHead>
          <TableHead className="text-table-header text-right">
              净收入
            </TableHead>
          <TableHead className="text-table-header">
              状态
            </TableHead>
          <TableHead className="text-table-header">
              时间
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
                {/* 类型 */}
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
                
                {/* 来源 */}
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
                
                {/* 总金额 */}
                <TableCell className="py-4 text-right">
                  <span className="text-sm text-foreground-muted tabular-nums">
                    {earning.gross_amount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                  </span>
                </TableCell>
                
                {/* 净收入 */}
                <TableCell className="py-4 text-right">
                  <span className="text-sm font-semibold text-brand-500 tabular-nums">
                    +{earning.net_amount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                  </span>
                </TableCell>
                
                {/* 状态 */}
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
                
                {/* 时间 */}
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
                
                {/* 操作 */}
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
                        查看详情
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-sm cursor-pointer">
                        <Copy className="h-4 w-4 mr-2" />
                        复制订单号
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-sm cursor-pointer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        查看 Agent
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

// 格式化日期时间
function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  // 相对时间显示
  if (diffMins < 1) return "刚刚";
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;
  
  // 绝对时间显示
  return date.toLocaleString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
