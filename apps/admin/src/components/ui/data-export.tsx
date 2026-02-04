"use client";

import { useState } from "react";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { cn } from "@/lib/utils";

// ============================================
// Export Types
// ============================================

export type ExportFormat = "csv" | "json" | "xlsx";

export interface ExportColumn {
  key: string;
  label: string;
  selected?: boolean;
}

export interface ExportConfig {
  format: ExportFormat;
  columns: ExportColumn[];
  filename?: string;
  includeHeaders?: boolean;
}

// ============================================
// Export Dialog
// ============================================

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  columns: ExportColumn[];
  onExport: (config: ExportConfig) => Promise<void>;
  defaultFilename?: string;
  totalCount?: number;
  selectedCount?: number;
}

export function ExportDialog({
  open,
  onOpenChange,
  title = "导出数据",
  columns,
  onExport,
  defaultFilename = "export",
  totalCount,
  selectedCount,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(columns.filter((c) => c.selected !== false).map((c) => c.key))
  );
  const [loading, setLoading] = useState(false);
  const [exportSelected, setExportSelected] = useState(false);

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectAllColumns = () => {
    setSelectedColumns(new Set(columns.map((c) => c.key)));
  };

  const deselectAllColumns = () => {
    setSelectedColumns(new Set());
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      await onExport({
        format,
        columns: columns.filter((c) => selectedColumns.has(c.key)),
        filename: defaultFilename,
        includeHeaders: true,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const formatOptions: { value: ExportFormat; label: string; icon: React.ReactNode }[] = [
    { value: "csv", label: "CSV", icon: <FileText className="w-4 h-4" /> },
    { value: "json", label: "JSON", icon: <FileJson className="w-4 h-4" /> },
    { value: "xlsx", label: "Excel", icon: <FileSpreadsheet className="w-4 h-4" /> },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Scope */}
          {selectedCount !== undefined && selectedCount > 0 && (
            <div>
              <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide">
                导出范围
              </label>
              <div className="mt-2 flex gap-3">
                <button
                  onClick={() => setExportSelected(false)}
                  className={cn(
                    "flex-1 px-4 py-2 rounded-lg border text-sm text-left transition-colors",
                    !exportSelected
                      ? "border-brand-500 bg-brand-500/10 text-foreground"
                      : "border-border hover:border-foreground-muted text-foreground-light"
                  )}
                >
                  <div className="font-medium">全部数据</div>
                  {totalCount !== undefined && (
                    <div className="text-xs text-foreground-muted mt-0.5">
                      共 {totalCount} 条
                    </div>
                  )}
                </button>
                <button
                  onClick={() => setExportSelected(true)}
                  className={cn(
                    "flex-1 px-4 py-2 rounded-lg border text-sm text-left transition-colors",
                    exportSelected
                      ? "border-brand-500 bg-brand-500/10 text-foreground"
                      : "border-border hover:border-foreground-muted text-foreground-light"
                  )}
                >
                  <div className="font-medium">已选数据</div>
                  <div className="text-xs text-foreground-muted mt-0.5">
                    共 {selectedCount} 条
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Format Selection */}
          <div>
            <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide">
              导出格式
            </label>
            <div className="mt-2 flex gap-2">
              {formatOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormat(option.value)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors",
                    format === option.value
                      ? "border-brand-500 bg-brand-500/10 text-foreground"
                      : "border-border hover:border-foreground-muted text-foreground-light"
                  )}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Column Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide">
                导出字段 ({selectedColumns.size}/{columns.length})
              </label>
              <div className="flex gap-2">
                <button
                  onClick={selectAllColumns}
                  className="text-xs text-brand-500 hover:text-brand-400"
                >
                  全选
                </button>
                <button
                  onClick={deselectAllColumns}
                  className="text-xs text-foreground-muted hover:text-foreground"
                >
                  清空
                </button>
              </div>
            </div>
            <div className="max-h-[200px] overflow-y-auto border border-border rounded-lg">
              {columns.map((column) => (
                <label
                  key={column.key}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-background-hover cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.has(column.key)}
                    onChange={() => toggleColumn(column.key)}
                    className="w-4 h-4 rounded border-border text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-foreground">{column.label}</span>
                  <span className="text-xs text-foreground-muted ml-auto">
                    {column.key}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleExport}
            disabled={selectedColumns.size === 0}
            loading={loading}
            loadingText="导出中..."
          >
            <Download className="w-4 h-4 mr-1" />
            导出
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Export Button
// ============================================

interface ExportButtonProps {
  columns: ExportColumn[];
  onExport: (config: ExportConfig) => Promise<void>;
  filename?: string;
  totalCount?: number;
  selectedCount?: number;
  disabled?: boolean;
}

export function ExportButton({
  columns,
  onExport,
  filename,
  totalCount,
  selectedCount,
  disabled,
}: ExportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        <Download className="w-4 h-4 mr-1" />
        导出
      </Button>

      <ExportDialog
        open={open}
        onOpenChange={setOpen}
        columns={columns}
        onExport={onExport}
        defaultFilename={filename}
        totalCount={totalCount}
        selectedCount={selectedCount}
      />
    </>
  );
}

// ============================================
// Export Utilities
// ============================================

export function exportToCSV(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filename: string
) {
  const headers = columns.map((c) => c.label).join(",");
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const value = row[c.key];
        if (value === null || value === undefined) return "";
        const str = String(value);
        // Escape quotes and wrap in quotes if contains comma/newline
        if (str.includes(",") || str.includes("\n") || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(",")
  );

  const csv = [headers, ...rows].join("\n");
  downloadFile(csv, `${filename}.csv`, "text/csv;charset=utf-8;");
}

export function exportToJSON(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filename: string
) {
  const filtered = data.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((c) => {
      obj[c.key] = row[c.key];
    });
    return obj;
  });

  const json = JSON.stringify(filtered, null, 2);
  downloadFile(json, `${filename}.json`, "application/json;charset=utf-8;");
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
