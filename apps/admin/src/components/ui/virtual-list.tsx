"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

export interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((item: T, index: number) => number);
  overscan?: number;
  renderItem: (item: T, index: number, style: CSSProperties) => ReactNode;
  className?: string;
  containerClassName?: string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  loading?: boolean;
  loadingComponent?: ReactNode;
  emptyComponent?: ReactNode;
}

// ============================================
// Virtual List Component
// ============================================

export function VirtualList<T>({
  items,
  itemHeight,
  overscan = 5,
  renderItem,
  className,
  containerClassName,
  onEndReached,
  endReachedThreshold = 200,
  loading,
  loadingComponent,
  emptyComponent,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate item positions
  const getItemHeight = useCallback(
    (item: T, index: number): number => {
      return typeof itemHeight === "function" ? itemHeight(item, index) : itemHeight;
    },
    [itemHeight]
  );

  // Calculate total height and item positions
  const { totalHeight, itemPositions } = useCallback(() => {
    let total = 0;
    const positions: number[] = [];

    items.forEach((item, index) => {
      positions.push(total);
      total += getItemHeight(item, index);
    });

    return { totalHeight: total, itemPositions: positions };
  }, [items, getItemHeight])();

  // Calculate visible range
  const getVisibleRange = useCallback(() => {
    if (items.length === 0) return { start: 0, end: 0 };

    // Binary search for start index
    let start = 0;
    let end = items.length - 1;

    while (start < end) {
      const mid = Math.floor((start + end) / 2);
      if (itemPositions[mid] + getItemHeight(items[mid], mid) < scrollTop) {
        start = mid + 1;
      } else {
        end = mid;
      }
    }

    const startIndex = Math.max(0, start - overscan);

    // Find end index
    let endIndex = startIndex;
    let accHeight = itemPositions[startIndex] || 0;

    while (endIndex < items.length && accHeight < scrollTop + containerHeight) {
      accHeight += getItemHeight(items[endIndex], endIndex);
      endIndex++;
    }

    endIndex = Math.min(items.length, endIndex + overscan);

    return { start: startIndex, end: endIndex };
  }, [items, itemPositions, scrollTop, containerHeight, overscan, getItemHeight]);

  // Handle scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      setScrollTop(target.scrollTop);

      // Check if end reached
      if (onEndReached) {
        const distanceFromEnd =
          target.scrollHeight - target.scrollTop - target.clientHeight;
        if (distanceFromEnd < endReachedThreshold) {
          onEndReached();
        }
      }
    },
    [onEndReached, endReachedThreshold]
  );

  // Update container height on resize
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  const { start, end } = getVisibleRange();

  // Render visible items
  const visibleItems = items.slice(start, end).map((item, index) => {
    const actualIndex = start + index;
    const top = itemPositions[actualIndex];
    const height = getItemHeight(item, actualIndex);

    return renderItem(item, actualIndex, {
      position: "absolute",
      top,
      left: 0,
      right: 0,
      height,
    });
  });

  if (items.length === 0 && !loading) {
    return emptyComponent || null;
  }

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto", containerClassName)}
      onScroll={handleScroll}
    >
      <div
        className={cn("relative", className)}
        style={{ height: totalHeight, minHeight: "100%" }}
      >
        {visibleItems}
        {loading && (
          <div
            style={{
              position: "absolute",
              top: totalHeight,
              left: 0,
              right: 0,
            }}
          >
            {loadingComponent || (
              <div className="py-4 text-center text-sm text-foreground-muted">
                Loading more...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Virtual Table Component
// ============================================

export interface VirtualTableColumn<T> {
  key: string;
  header: ReactNode;
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  render: (item: T, index: number) => ReactNode;
  align?: "left" | "center" | "right";
}

export interface VirtualTableProps<T> {
  items: T[];
  columns: VirtualTableColumn<T>[];
  rowHeight?: number;
  headerHeight?: number;
  overscan?: number;
  className?: string;
  onRowClick?: (item: T, index: number) => void;
  selectedIds?: Set<string>;
  getRowId?: (item: T) => string;
  onEndReached?: () => void;
  loading?: boolean;
  emptyComponent?: ReactNode;
}

export function VirtualTable<T>({
  items,
  columns,
  rowHeight = 48,
  headerHeight = 40,
  overscan = 5,
  className,
  onRowClick,
  selectedIds,
  getRowId,
  onEndReached,
  loading,
  emptyComponent,
}: VirtualTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate visible range
  const totalHeight = items.length * rowHeight;
  const visibleCount = Math.ceil(containerHeight / rowHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleCount + overscan * 2);

  // Handle scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      setScrollTop(target.scrollTop);

      if (onEndReached) {
        const distanceFromEnd =
          target.scrollHeight - target.scrollTop - target.clientHeight;
        if (distanceFromEnd < 200) {
          onEndReached();
        }
      }
    },
    [onEndReached]
  );

  // Update container height
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight - headerHeight);
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [headerHeight]);

  // Render visible rows
  const visibleRows = items.slice(startIndex, endIndex).map((item, index) => {
    const actualIndex = startIndex + index;
    const top = actualIndex * rowHeight;
    const rowId = getRowId?.(item);
    const isSelected = rowId ? selectedIds?.has(rowId) : false;

    return (
      <div
        key={rowId || actualIndex}
        className={cn(
          "absolute left-0 right-0 flex items-center border-b border-border transition-colors",
          onRowClick && "cursor-pointer hover:bg-background-hover",
          isSelected && "bg-brand-500/5"
        )}
        style={{ top, height: rowHeight }}
        onClick={() => onRowClick?.(item, actualIndex)}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className={cn(
              "px-3 truncate",
              column.align === "center" && "text-center",
              column.align === "right" && "text-right"
            )}
            style={{
              width: column.width || "auto",
              minWidth: column.minWidth,
              maxWidth: column.maxWidth,
              flex: column.width ? "none" : 1,
            }}
          >
            {column.render(item, actualIndex)}
          </div>
        ))}
      </div>
    );
  });

  if (items.length === 0 && !loading) {
    return emptyComponent || null;
  }

  return (
    <div
      ref={containerRef}
      className={cn("flex flex-col overflow-hidden", className)}
    >
      {/* Header */}
      <div
        className="flex items-center border-b border-border bg-background-surface shrink-0"
        style={{ height: headerHeight }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className={cn(
              "px-3 text-xs font-medium text-foreground-muted uppercase tracking-wide truncate",
              column.align === "center" && "text-center",
              column.align === "right" && "text-right"
            )}
            style={{
              width: column.width || "auto",
              minWidth: column.minWidth,
              maxWidth: column.maxWidth,
              flex: column.width ? "none" : 1,
            }}
          >
            {column.header}
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto" onScroll={handleScroll}>
        <div className="relative" style={{ height: totalHeight }}>
          {visibleRows}
          {loading && (
            <div
              className="absolute left-0 right-0 py-4 text-center text-sm text-foreground-muted"
              style={{ top: totalHeight }}
            >
              Loading more...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
