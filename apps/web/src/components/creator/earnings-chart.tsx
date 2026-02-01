"use client";

/**
 * 收入趋势图表组件 - 增强版
 */

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MonthlyEarning {
  month: string;
  gross: number;
  net: number;
  count: number;
}

interface EarningsChartProps {
  data: MonthlyEarning[];
  className?: string;
}

export function EarningsChart({ data, className }: EarningsChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  const chartData = useMemo(() => {
    return data.map((item, index) => {
      const prevItem = data[index - 1];
      const growthRate = prevItem 
        ? ((item.gross - prevItem.gross) / prevItem.gross * 100).toFixed(1)
        : "0";
      
      return {
        ...item,
        monthLabel: formatMonth(item.month),
        fullMonth: formatFullMonth(item.month),
        growthRate: parseFloat(growthRate),
      };
    });
  }, [data]);

  // 计算平均值用于参考线
  const averageGross = useMemo(() => {
    return data.reduce((sum, item) => sum + item.gross, 0) / data.length;
  }, [data]);

  return (
    <div className={cn("w-full h-[280px] relative", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={chartData} 
          margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
          onMouseMove={(state: any) => {
            if (state?.activeTooltipIndex !== undefined) {
              setActiveIndex(state.activeTooltipIndex);
            }
          }}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <defs>
            {/* 总收入渐变 */}
            <linearGradient id="colorGrossEnhanced" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity={0.4} />
              <stop offset="50%" stopColor="var(--color-brand-500)" stopOpacity={0.15} />
              <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity={0} />
            </linearGradient>
            {/* 净收入渐变 */}
            <linearGradient id="colorNetEnhanced" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-foreground-light)" stopOpacity={0.4} />
              <stop offset="50%" stopColor="var(--color-foreground-light)" stopOpacity={0.15} />
              <stop offset="100%" stopColor="var(--color-foreground-light)" stopOpacity={0} />
            </linearGradient>
            {/* 发光效果滤镜 */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* 网格线 */}
          <CartesianGrid 
            strokeDasharray="4 4" 
            stroke="currentColor" 
            strokeOpacity={0.08}
            vertical={false}
          />
          
          {/* 平均线 */}
          <ReferenceLine 
            y={averageGross} 
            stroke="var(--color-brand-500)" 
            strokeDasharray="8 8" 
            strokeOpacity={0.4}
            label={{
              value: `平均 ${(averageGross / 1000).toFixed(1)}k`,
              fill: 'var(--color-brand-500)',
              fontSize: 10,
              position: 'right',
            }}
          />
          
          {/* X 轴 */}
          <XAxis
            dataKey="monthLabel"
            axisLine={false}
            tickLine={false}
            tick={{ 
              fill: 'currentColor', 
              fontSize: 12,
              opacity: 0.5,
            }}
            dy={10}
            interval={0}
          />
          
          {/* Y 轴 */}
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ 
              fill: 'currentColor', 
              fontSize: 11,
              opacity: 0.5,
            }}
            tickFormatter={(value) => `${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}`}
            dx={-5}
            width={55}
          />
          
          {/* 自定义 Tooltip */}
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{
              stroke: 'var(--color-brand-500)',
              strokeWidth: 1,
              strokeDasharray: '4 4',
              strokeOpacity: 0.5,
            }}
          />
          
          {/* 总收入区域 */}
          <Area
            type="monotone"
            dataKey="gross"
            name="总收入"
            stroke="var(--color-brand-500)"
            strokeWidth={2.5}
            fill="url(#colorGrossEnhanced)"
            dot={false}
            activeDot={{
              r: 6,
              fill: 'var(--color-brand-500)',
              stroke: '#fff',
              strokeWidth: 2,
              filter: 'url(#glow)',
            }}
          />
          
          {/* 净收入区域 */}
          <Area
            type="monotone"
            dataKey="net"
            name="净收入"
            stroke="var(--color-foreground-light)"
            strokeWidth={2.5}
            fill="url(#colorNetEnhanced)"
            dot={false}
            activeDot={{
              r: 6,
              fill: 'var(--color-foreground-light)',
              stroke: '#fff',
              strokeWidth: 2,
              filter: 'url(#glow)',
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// 自定义 Tooltip - 增强版
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0]?.payload;
  const isPositiveGrowth = data?.growthRate >= 0;

  return (
    <div className="bg-surface-100 border border-border rounded-lg shadow-xl p-4 min-w-[200px]">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
        <p className="text-sm font-semibold text-foreground">
          {data?.fullMonth || label}
        </p>
        {data?.growthRate !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
            isPositiveGrowth
              ? "text-brand-500 bg-brand-200/60"
              : "text-destructive-400 bg-destructive-200/70"
          )}>
            {isPositiveGrowth ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {isPositiveGrowth ? "+" : ""}{data.growthRate}%
          </div>
        )}
      </div>
      
      {/* 数据 */}
      <div className="space-y-2">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-foreground-muted">
                {entry.name}
              </span>
            </div>
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      
      {/* 交易笔数 */}
      {data?.count && (
        <div className="mt-3 pt-2 border-t border-border flex items-center justify-between">
          <span className="text-xs text-foreground-muted">交易笔数</span>
          <span className="text-xs font-medium text-foreground-muted">
            {data.count} 笔
          </span>
        </div>
      )}
    </div>
  );
}

// 格式化月份显示（简短）
function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const monthNum = parseInt(m, 10);
  return `${monthNum}月`;
}

// 格式化月份显示（完整）
function formatFullMonth(month: string): string {
  const [year, m] = month.split("-");
  const monthNum = parseInt(m, 10);
  return `${year}年${monthNum}月`;
}
