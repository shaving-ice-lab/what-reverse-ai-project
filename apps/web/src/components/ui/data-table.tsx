"use client";

/**
 * 数据表格组件
 * 支持排序、筛选、分页、选择等功能
 */

import { useState, useMemo, ReactNode } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  MoreHorizontal,
  ArrowUpDown,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import { Checkbox } from "./checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// ============================================
// 类型定义
// ============================================

export interface Column<T> {
  id: string;
  header: string | ReactNode;
  accessor: keyof T | ((row: T) => ReactNode);
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  cell?: (value: unknown, row: T) => ReactNode;
}

type SortDirection = "asc" | "desc" | null;

interface SortState {
  column: string | null;
  direction: SortDirection;
}

// ============================================
// 表格头部单元格
// ============================================

interface TableHeaderCellProps {
  children: ReactNode;
  sortable?: boolean;
  sortDirection?: SortDirection;
  onSort?: () => void;
  align?: "left" | "center" | "right";
  width?: string;
  className?: string;
}

function TableHeaderCell({
  children,
  sortable,
  sortDirection,
  onSort,
  align = "left",
  width,
  className,
}: TableHeaderCellProps) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <th
      className={cn(
        "px-4 py-3 text-sm font-medium text-muted-foreground bg-muted/50",
        alignClass[align],
        sortable && "cursor-pointer select-none hover:bg-muted transition-colors",
        className
      )}
      style={{ width }}
      onClick={sortable ? onSort : undefined}
    >
      <div
        className={cn(
          "flex items-center gap-1",
          align === "center" && "justify-center",
          align === "right" && "justify-end"
        )}
      >
        {children}
        {sortable && (
          <span className="ml-1">
            {sortDirection === "asc" ? (
              <ChevronUp className="w-4 h-4" />
            ) : sortDirection === "desc" ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronsUpDown className="w-4 h-4 text-muted-foreground/50" />
            )}
          </span>
        )}
      </div>
    </th>
  );
}

// ============================================
// 表格数据单元格
// ============================================

interface TableCellProps {
  children: ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}

function TableCell({ children, align = "left", className }: TableCellProps) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <td className={cn("px-4 py-3 text-sm", alignClass[align], className)}>
      {children}
    </td>
  );
}

// ============================================
// 分页组件
// ============================================

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalItems: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalItems,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className,
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={cn("flex items-center justify-between px-4 py-3", className)}>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          显示 {startItem} - {endItem} 条，共 {totalItems} 条
        </span>
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span>每页</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 px-2 rounded-md border border-border bg-background text-sm"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>条</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage === 1}
          onClick={() => onPageChange(1)}
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-1 mx-2">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(totalPages)}
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 数据表格
// ============================================

interface DataTableProps<T extends { id: string | number }> {
  data: T[];
  columns: Column<T>[];
  selectable?: boolean;
  selectedIds?: Set<string | number>;
  onSelectionChange?: (ids: Set<string | number>) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  paginated?: boolean;
  pageSize?: number;
  emptyMessage?: string;
  loading?: boolean;
  stickyHeader?: boolean;
  rowActions?: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  selectable = false,
  selectedIds,
  onSelectionChange,
  searchable = false,
  searchPlaceholder = "搜索...",
  searchKeys,
  paginated = false,
  pageSize: initialPageSize = 10,
  emptyMessage = "暂无数据",
  loading = false,
  stickyHeader = false,
  rowActions,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<SortState>({ column: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // 搜索过滤
  const filteredData = useMemo(() => {
    if (!searchQuery || !searchKeys?.length) return data;

    const query = searchQuery.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((key) => {
        const value = row[key];
        return String(value).toLowerCase().includes(query);
      })
    );
  }, [data, searchQuery, searchKeys]);

  // 排序
  const sortedData = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredData;

    const column = columns.find((c) => c.id === sort.column);
    if (!column) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aValue: unknown;
      let bValue: unknown;

      if (typeof column.accessor === "function") {
        aValue = column.accessor(a);
        bValue = column.accessor(b);
      } else {
        aValue = a[column.accessor];
        bValue = b[column.accessor];
      }

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = String(aValue).localeCompare(String(bValue), undefined, { numeric: true });
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sort, columns]);

  // 分页
  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, paginated, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // 排序切换
  const handleSort = (columnId: string) => {
    setSort((prev) => {
      if (prev.column !== columnId) {
        return { column: columnId, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { column: columnId, direction: "desc" };
      }
      return { column: null, direction: null };
    });
  };

  // 选择处理
  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    const allIds = new Set(paginatedData.map((row) => row.id));
    const allSelected = paginatedData.every((row) => selectedIds?.has(row.id));
    onSelectionChange(allSelected ? new Set() : allIds);
  };

  const handleSelectRow = (id: string | number) => {
    if (!onSelectionChange || !selectedIds) return;
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    onSelectionChange(newSelection);
  };

  const allSelected = paginatedData.length > 0 && paginatedData.every((row) => selectedIds?.has(row.id));
  const someSelected = paginatedData.some((row) => selectedIds?.has(row.id)) && !allSelected;

  return (
    <div className={cn("border border-border rounded-xl overflow-hidden", className)}>
      {/* 搜索栏 */}
      {searchable && (
        <div className="p-4 border-b border-border bg-card">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={cn(stickyHeader && "sticky top-0 z-10")}>
            <tr className="border-b border-border">
              {selectable && (
                <th className="w-12 px-4 py-3 bg-muted/50">
                  <Checkbox
                    checked={allSelected}
                    // indeterminate={someSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
              )}
              {columns.map((column) => (
                <TableHeaderCell
                  key={column.id}
                  sortable={column.sortable}
                  sortDirection={sort.column === column.id ? sort.direction : null}
                  onSort={() => column.sortable && handleSort(column.id)}
                  align={column.align}
                  width={column.width}
                >
                  {column.header}
                </TableHeaderCell>
              ))}
              {rowActions && (
                <th className="w-12 px-4 py-3 bg-muted/50" />
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                  className="px-4 py-16 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>加载中...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                  className="px-4 py-16 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-border transition-colors",
                    onRowClick && "cursor-pointer hover:bg-muted/50",
                    selectedIds?.has(row.id) && "bg-primary/5"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="w-12 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds?.has(row.id)}
                        onCheckedChange={() => handleSelectRow(row.id)}
                      />
                    </td>
                  )}
                  {columns.map((column) => {
                    let value: unknown;
                    if (typeof column.accessor === "function") {
                      value = column.accessor(row);
                    } else {
                      value = row[column.accessor];
                    }

                    return (
                      <TableCell key={column.id} align={column.align}>
                        {column.cell ? column.cell(value, row) : (value as ReactNode)}
                      </TableCell>
                    );
                  })}
                  {rowActions && (
                    <td className="w-12 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {rowActions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {paginated && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          totalItems={sortedData.length}
          onPageSizeChange={setPageSize}
          className="border-t border-border bg-card"
        />
      )}
    </div>
  );
}
