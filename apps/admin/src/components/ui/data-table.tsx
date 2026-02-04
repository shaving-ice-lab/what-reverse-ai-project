"use client";

/**
 * Admin 数据表格组件
 * 支持数据密度切换、行内操作、排序、筛选、导出
 */

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  MoreHorizontal,
  Settings2,
  Download,
  RefreshCw,
  Filter,
  Columns,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { LoadingState, EmptyState, Skeleton } from "./data-states";

// ============================================
// 数据密度配置
// ============================================

export type DataDensity = "compact" | "default" | "comfortable";

interface DensityConfig {
  rowHeight: string;
  cellPadding: string;
  fontSize: string;
  iconSize: string;
}

const DENSITY_CONFIGS: Record<DataDensity, DensityConfig> = {
  compact: {
    rowHeight: "h-8",
    cellPadding: "px-3 py-1.5",
    fontSize: "text-[11px]",
    iconSize: "w-3.5 h-3.5",
  },
  default: {
    rowHeight: "h-10",
    cellPadding: "px-4 py-2.5",
    fontSize: "text-[12px]",
    iconSize: "w-4 h-4",
  },
  comfortable: {
    rowHeight: "h-12",
    cellPadding: "px-4 py-3",
    fontSize: "text-[13px]",
    iconSize: "w-4 h-4",
  },
};

// ============================================
// 列定义类型
// ============================================

export interface ColumnDef<T> {
  /** 列唯一标识 */
  id: string;
  /** 列标题 */
  header: string;
  /** 数据访问器 */
  accessor: keyof T | ((row: T) => React.ReactNode);
  /** 是否可排序 */
  sortable?: boolean;
  /** 列宽度 */
  width?: string;
  /** 对齐方式 */
  align?: "left" | "center" | "right";
  /** 是否默认隐藏 */
  hidden?: boolean;
  /** 单元格渲染器 */
  cell?: (row: T, index: number) => React.ReactNode;
  /** 头部渲染器 */
  headerCell?: () => React.ReactNode;
}

// ============================================
// 排序状态
// ============================================

export interface SortState {
  column: string | null;
  direction: "asc" | "desc" | null;
}

// ============================================
// 行操作定义
// ============================================

export interface RowAction<T> {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  /** 是否危险操作 */
  danger?: boolean;
  /** 是否禁用 */
  disabled?: boolean | ((row: T) => boolean);
  /** 是否显示 */
  hidden?: boolean | ((row: T) => boolean);
}

// ============================================
// DataTable 组件
// ============================================

interface DataTableProps<T> {
  /** 数据源 */
  data: T[];
  /** 列定义 */
  columns: ColumnDef<T>[];
  /** 行唯一键 */
  rowKey: keyof T | ((row: T) => string);
  /** 数据密度 */
  density?: DataDensity;
  /** 是否可切换密度 */
  showDensityToggle?: boolean;
  /** 是否显示列配置 */
  showColumnToggle?: boolean;
  /** 行操作 */
  rowActions?: RowAction<T>[];
  /** 是否显示行内操作（悬浮显示） */
  showInlineActions?: boolean;
  /** 排序状态 */
  sortState?: SortState;
  /** 排序变化回调 */
  onSortChange?: (sort: SortState) => void;
  /** 行点击回调 */
  onRowClick?: (row: T) => void;
  /** 是否加载中 */
  loading?: boolean;
  /** 空状态配置 */
  emptyState?: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  /** 工具栏额外内容 */
  toolbar?: React.ReactNode;
  /** 是否显示刷新按钮 */
  showRefresh?: boolean;
  /** 刷新回调 */
  onRefresh?: () => void;
  /** 是否显示导出按钮 */
  showExport?: boolean;
  /** 导出回调 */
  onExport?: () => void;
  /** 选中行 */
  selectedRows?: T[];
  /** 选中变化回调 */
  onSelectionChange?: (rows: T[]) => void;
  /** 是否启用多选 */
  selectable?: boolean;
  /** 表格样式 */
  className?: string;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 是否显示斑马纹 */
  striped?: boolean;
  /** 是否悬浮高亮 */
  hoverable?: boolean;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  rowKey,
  density = "default",
  showDensityToggle = false,
  showColumnToggle = false,
  rowActions,
  showInlineActions = true,
  sortState,
  onSortChange,
  onRowClick,
  loading = false,
  emptyState,
  toolbar,
  showRefresh = false,
  onRefresh,
  showExport = false,
  onExport,
  selectedRows = [],
  onSelectionChange,
  selectable = false,
  className,
  bordered = true,
  striped = false,
  hoverable = true,
}: DataTableProps<T>) {
  const [currentDensity, setCurrentDensity] = React.useState(density);
  const [visibleColumns, setVisibleColumns] = React.useState<string[]>(
    columns.filter((c) => !c.hidden).map((c) => c.id)
  );
  const [hoveredRow, setHoveredRow] = React.useState<string | null>(null);

  const config = DENSITY_CONFIGS[currentDensity];

  // 获取行的唯一键
  const getRowKey = (row: T): string => {
    if (typeof rowKey === "function") return rowKey(row);
    return String(row[rowKey]);
  };

  // 获取单元格值
  const getCellValue = (row: T, column: ColumnDef<T>, index: number): React.ReactNode => {
    if (column.cell) return column.cell(row, index);
    if (typeof column.accessor === "function") return column.accessor(row);
    return row[column.accessor] as React.ReactNode;
  };

  // 处理排序
  const handleSort = (columnId: string) => {
    if (!onSortChange) return;
    const newDirection =
      sortState?.column === columnId
        ? sortState.direction === "asc"
          ? "desc"
          : sortState.direction === "desc"
          ? null
          : "asc"
        : "asc";
    onSortChange({
      column: newDirection ? columnId : null,
      direction: newDirection,
    });
  };

  // 处理行选择
  const handleRowSelect = (row: T) => {
    if (!onSelectionChange) return;
    const key = getRowKey(row);
    const isSelected = selectedRows.some((r) => getRowKey(r) === key);
    if (isSelected) {
      onSelectionChange(selectedRows.filter((r) => getRowKey(r) !== key));
    } else {
      onSelectionChange([...selectedRows, row]);
    }
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (selectedRows.length === data.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange([...data]);
    }
  };

  // 渲染排序图标
  const renderSortIcon = (columnId: string) => {
    if (sortState?.column !== columnId) {
      return <ChevronsUpDown className={cn("opacity-40", config.iconSize)} />;
    }
    if (sortState.direction === "asc") {
      return <ChevronUp className={cn("text-brand-500", config.iconSize)} />;
    }
    return <ChevronDown className={cn("text-brand-500", config.iconSize)} />;
  };

  // 可见列
  const displayColumns = columns.filter((c) => visibleColumns.includes(c.id));

  return (
    <div className={cn("space-y-3", className)}>
      {/* 工具栏 */}
      {(showDensityToggle || showColumnToggle || showRefresh || showExport || toolbar) && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">{toolbar}</div>
          <div className="flex items-center gap-2">
            {showRefresh && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onRefresh}
                disabled={loading}
                aria-label="刷新"
              >
                <RefreshCw className={cn(config.iconSize, loading && "animate-spin")} />
              </Button>
            )}
            {showExport && (
              <Button variant="ghost" size="icon-sm" onClick={onExport} aria-label="导出">
                <Download className={config.iconSize} />
              </Button>
            )}
            {showColumnToggle && (
              <ColumnToggle
                columns={columns}
                visibleColumns={visibleColumns}
                onVisibleChange={setVisibleColumns}
                iconSize={config.iconSize}
              />
            )}
            {showDensityToggle && (
              <DensityToggle
                density={currentDensity}
                onDensityChange={setCurrentDensity}
                iconSize={config.iconSize}
              />
            )}
          </div>
        </div>
      )}

      {/* 表格 */}
      <div
        className={cn(
          "rounded-lg overflow-hidden",
          bordered && "border border-border"
        )}
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-75 hover:bg-surface-75">
              {selectable && (
                <TableHead className={cn(config.cellPadding, "w-10")}>
                  <input
                    type="checkbox"
                    checked={selectedRows.length === data.length && data.length > 0}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-border bg-surface-100 text-brand-500 focus:ring-brand-500/30"
                  />
                </TableHead>
              )}
              {displayColumns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(
                    config.cellPadding,
                    config.fontSize,
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right"
                  )}
                  style={{ width: column.width }}
                >
                  {column.sortable ? (
                    <button
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                      onClick={() => handleSort(column.id)}
                    >
                      {column.headerCell ? column.headerCell() : column.header}
                      {renderSortIcon(column.id)}
                    </button>
                  ) : column.headerCell ? (
                    column.headerCell()
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
              {rowActions && rowActions.length > 0 && (
                <TableHead className={cn(config.cellPadding, "w-10")} />
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={displayColumns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                >
                  <LoadingState message="加载中..." size="sm" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={displayColumns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                >
                  <EmptyState
                    icon={emptyState?.icon}
                    title={emptyState?.title || "暂无数据"}
                    description={emptyState?.description}
                    action={emptyState?.action}
                  />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => {
                const key = getRowKey(row);
                const isSelected = selectedRows.some((r) => getRowKey(r) === key);
                const isHovered = hoveredRow === key;

                return (
                  <TableRow
                    key={key}
                    className={cn(
                      config.rowHeight,
                      striped && index % 2 === 1 && "bg-surface-75/50",
                      hoverable && "hover:bg-surface-100",
                      isSelected && "bg-brand-200/20",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(row)}
                    onMouseEnter={() => setHoveredRow(key)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    {selectable && (
                      <TableCell
                        className={config.cellPadding}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleRowSelect(row)}
                          className="w-3.5 h-3.5 rounded border-border bg-surface-100 text-brand-500 focus:ring-brand-500/30"
                        />
                      </TableCell>
                    )}
                    {displayColumns.map((column) => (
                      <TableCell
                        key={column.id}
                        className={cn(
                          config.cellPadding,
                          config.fontSize,
                          column.align === "center" && "text-center",
                          column.align === "right" && "text-right"
                        )}
                      >
                        {getCellValue(row, column, index)}
                      </TableCell>
                    ))}
                    {rowActions && rowActions.length > 0 && (
                      <TableCell
                        className={cn(config.cellPadding, "text-right")}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {showInlineActions && isHovered ? (
                          <InlineRowActions
                            row={row}
                            actions={rowActions}
                            iconSize={config.iconSize}
                          />
                        ) : (
                          <RowActionsMenu
                            row={row}
                            actions={rowActions}
                            iconSize={config.iconSize}
                          />
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ============================================
// 密度切换组件
// ============================================

interface DensityToggleProps {
  density: DataDensity;
  onDensityChange: (density: DataDensity) => void;
  iconSize: string;
}

function DensityToggle({ density, onDensityChange, iconSize }: DensityToggleProps) {
  const [open, setOpen] = React.useState(false);

  const densityOptions: { value: DataDensity; label: string }[] = [
    { value: "compact", label: "紧凑" },
    { value: "default", label: "默认" },
    { value: "comfortable", label: "宽松" },
  ];

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(!open)}
        aria-label="数据密度"
      >
        <Settings2 className={iconSize} />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-surface-100 border border-border rounded-lg shadow-lg py-1 min-w-[100px]">
            {densityOptions.map((option) => (
              <button
                key={option.value}
                className={cn(
                  "w-full px-3 py-1.5 text-[11px] text-left hover:bg-surface-200 transition-colors",
                  density === option.value && "text-brand-500 bg-surface-200"
                )}
                onClick={() => {
                  onDensityChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// 列配置组件
// ============================================

interface ColumnToggleProps<T> {
  columns: ColumnDef<T>[];
  visibleColumns: string[];
  onVisibleChange: (columns: string[]) => void;
  iconSize: string;
}

function ColumnToggle<T>({
  columns,
  visibleColumns,
  onVisibleChange,
  iconSize,
}: ColumnToggleProps<T>) {
  const [open, setOpen] = React.useState(false);

  const toggleColumn = (columnId: string) => {
    if (visibleColumns.includes(columnId)) {
      onVisibleChange(visibleColumns.filter((c) => c !== columnId));
    } else {
      onVisibleChange([...visibleColumns, columnId]);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(!open)}
        aria-label="列配置"
      >
        <Columns className={iconSize} />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-surface-100 border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
            {columns.map((column) => (
              <button
                key={column.id}
                className="w-full px-3 py-1.5 text-[11px] text-left hover:bg-surface-200 transition-colors flex items-center gap-2"
                onClick={() => toggleColumn(column.id)}
              >
                {visibleColumns.includes(column.id) ? (
                  <Eye className="w-3 h-3 text-brand-500" />
                ) : (
                  <EyeOff className="w-3 h-3 text-foreground-muted" />
                )}
                {column.header}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// 行内操作组件（悬浮显示）
// ============================================

interface InlineRowActionsProps<T> {
  row: T;
  actions: RowAction<T>[];
  iconSize: string;
}

function InlineRowActions<T>({ row, actions, iconSize }: InlineRowActionsProps<T>) {
  const visibleActions = actions.filter((action) => {
    if (typeof action.hidden === "function") return !action.hidden(row);
    return !action.hidden;
  });

  // 只显示前2个操作，其余放入更多菜单
  const primaryActions = visibleActions.slice(0, 2);
  const moreActions = visibleActions.slice(2);

  return (
    <div className="inline-flex items-center gap-1 animate-fade-in">
      {primaryActions.map((action) => {
        const isDisabled =
          typeof action.disabled === "function" ? action.disabled(row) : action.disabled;
        return (
          <Button
            key={action.id}
            variant={action.danger ? "ghost" : "ghost"}
            size="icon-xs"
            disabled={isDisabled}
            onClick={() => action.onClick(row)}
            className={cn(action.danger && "text-destructive hover:text-destructive")}
            aria-label={action.label}
          >
            {action.icon || action.label.charAt(0)}
          </Button>
        );
      })}
      {moreActions.length > 0 && (
        <RowActionsMenu row={row} actions={moreActions} iconSize={iconSize} />
      )}
    </div>
  );
}

// ============================================
// 行操作菜单组件
// ============================================

interface RowActionsMenuProps<T> {
  row: T;
  actions: RowAction<T>[];
  iconSize: string;
}

function RowActionsMenu<T>({ row, actions, iconSize }: RowActionsMenuProps<T>) {
  const [open, setOpen] = React.useState(false);

  const visibleActions = actions.filter((action) => {
    if (typeof action.hidden === "function") return !action.hidden(row);
    return !action.hidden;
  });

  if (visibleActions.length === 0) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => setOpen(!open)}
        aria-label="更多操作"
      >
        <MoreHorizontal className={iconSize} />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-surface-100 border border-border rounded-lg shadow-lg py-1 min-w-[120px]">
            {visibleActions.map((action) => {
              const isDisabled =
                typeof action.disabled === "function" ? action.disabled(row) : action.disabled;
              return (
                <button
                  key={action.id}
                  className={cn(
                    "w-full px-3 py-1.5 text-[11px] text-left hover:bg-surface-200 transition-colors flex items-center gap-2",
                    isDisabled && "opacity-50 cursor-not-allowed",
                    action.danger && "text-destructive hover:bg-destructive-200"
                  )}
                  disabled={isDisabled}
                  onClick={() => {
                    if (!isDisabled) {
                      action.onClick(row);
                      setOpen(false);
                    }
                  }}
                >
                  {action.icon && <span className="w-3.5 h-3.5">{action.icon}</span>}
                  {action.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// 表格骨架屏
// ============================================

interface DataTableSkeletonProps {
  columns?: number;
  rows?: number;
  density?: DataDensity;
}

export function DataTableSkeleton({
  columns = 5,
  rows = 5,
  density = "default",
}: DataTableSkeletonProps) {
  const config = DENSITY_CONFIGS[density];

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="bg-surface-75">
        <div className={cn("flex gap-4", config.cellPadding)}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
      </div>
      <div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className={cn("flex gap-4 border-t border-border", config.cellPadding)}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-3 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export { DENSITY_CONFIGS };
