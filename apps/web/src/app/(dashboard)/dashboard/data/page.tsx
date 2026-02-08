"use client";

/**
 * DataManagePage
 * Import, Export and Manage User Data
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
 Download,
 Upload,
 FileJson,
 FileText,
 Table,
 Archive,
 Clock,
 CheckCircle2,
 XCircle,
 Loader2,
 AlertTriangle,
 Trash2,
 RefreshCw,
 Search,
 Calendar,
 HardDrive,
 Shield,
 Zap,
 Bot,
 MessageSquare,
 Settings,
 FolderOpen,
 ExternalLink,
} from "lucide-react";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { EmptyState, PageHeader, TabNav } from "@/components/dashboard/supabase-ui";
import { PageContainer } from "@/components/dashboard/page-layout";

// Data Type Config
const dataTypes = {
 workflows: {
 label: "Workflow",
 icon: Zap,
 color: "text-warning",
 bg: "bg-warning-200",
 count: 12,
 size: "2.4 MB",
 },
 agents: {
 label: "Agent",
 icon: Bot,
 color: "text-foreground-light",
 bg: "bg-surface-200",
 count: 8,
 size: "1.8 MB",
 },
 conversations: {
    label: "Conversation Records",
 icon: MessageSquare,
 color: "text-brand-500",
 bg: "bg-brand-200",
 count: 156,
 size: "15.6 MB",
 },
 settings: {
 label: "Settings",
 icon: Settings,
 color: "text-foreground-muted",
 bg: "bg-surface-200",
 count: 1,
 size: "0.2 MB",
 },
 files: {
    label: "Uploaded Files",
 icon: FolderOpen,
 color: "text-brand-500",
 bg: "bg-brand-200",
 count: 45,
 size: "128.5 MB",
 },
};

// Export Format
const exportFormats = [
 { id: "json", label: "JSON", icon: FileJson, description: "Standard data format" },
 { id: "csv", label: "CSV", icon: Table, description: "Table data" },
 { id: "markdown", label: "Markdown", icon: FileText, description: "Document format" },
 { id: "zip", label: "ZIP Compressed", icon: Archive, description: "Complete backup" },
];

// Export History
const exportHistory = [
 {
 id: "1",
 type: "full",
 format: "zip",
 size: "148.5 MB",
 status: "completed",
 createdAt: "2026-01-31T10:30:00Z",
 expiresAt: "2026-02-07T10:30:00Z",
 downloadUrl: "#",
 },
 {
 id: "2",
 type: "workflows",
 format: "json",
 size: "2.4 MB",
 status: "completed",
 createdAt: "2026-01-30T15:20:00Z",
 expiresAt: "2026-02-06T15:20:00Z",
 downloadUrl: "#",
 },
 {
 id: "3",
 type: "conversations",
 format: "json",
 size: "15.6 MB",
 status: "processing",
 progress: 65,
 createdAt: "2026-01-31T11:00:00Z",
 },
 {
 id: "4",
 type: "full",
 format: "zip",
 size: "145.2 MB",
 status: "failed",
    error: "Insufficient storage space",
 createdAt: "2026-01-29T09:15:00Z",
 },
];

// Status Config
const statusConfig = {
 completed: {
 label: "Completed",
 icon: CheckCircle2,
 color: "text-brand-500",
 bg: "bg-brand-200",
 },
 processing: {
 label: "Processing",
 icon: Loader2,
 color: "text-foreground-light",
 bg: "bg-surface-200",
 },
 failed: {
 label: "Failed",
 icon: XCircle,
 color: "text-destructive",
 bg: "bg-destructive-200",
 },
 expired: {
 label: "Expired",
 icon: Clock,
 color: "text-foreground-muted",
 bg: "bg-surface-200",
 },
};

type HistoryTab = "all" | "completed" | "processing" | "failed";

function formatDate(dateString: string) {
 const date = new Date(dateString);
 return date.toLocaleString("zh-CN", {
 month: "short",
 day: "numeric",
 hour: "2-digit",
 minute: "2-digit",
 });
}

export default function DataPage() {
 const [selectedTypes, setSelectedTypes] = useState<string[]>(["workflows", "agents"]);
 const [exportFormat, setExportFormat] = useState("json");
 const [isExporting, setIsExporting] = useState(false);
 const [importFile, setImportFile] = useState<File | null>(null);
 const [historyTab, setHistoryTab] = useState<HistoryTab>("all");

 const toggleType = (type: string) => {
 setSelectedTypes((prev) =>
 prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
 );
 };

 const handleExport = () => {
 setIsExporting(true);
 setTimeout(() => setIsExporting(false), 2000);
 };

 // Calculate total size
 const totalSize = Object.entries(dataTypes)
 .filter(([key]) => selectedTypes.includes(key))
 .reduce((sum, [, config]) => sum + parseFloat(config.size), 0);

 // Storage usage
 const storageUsed = 148.5;
 const storageTotal = 500;
 const storagePercent = (storageUsed / storageTotal) * 100;

 const historyCounts = exportHistory.reduce(
 (acc, item) => {
 if (item.status === "completed") acc.completed += 1;
 if (item.status === "processing") acc.processing += 1;
 if (item.status === "failed") acc.failed += 1;
 return acc;
 },
 { completed: 0, processing: 0, failed: 0 }
 );

 const historyTabs = [
 { label: "All", value: "all", count: exportHistory.length },
 { label: "Completed", value: "completed", count: historyCounts.completed },
 { label: "Processing", value: "processing", count: historyCounts.processing },
 { label: "Failed", value: "failed", count: historyCounts.failed },
 ];

 const filteredHistory =
 historyTab === "all"
 ? exportHistory
 : exportHistory.filter((item) => item.status === historyTab);

 return (
 <PageContainer>
 <div className="space-y-6">
 <PageHeader
    title="Data Management"
    description="Import, export, and manage all your data"
 badge={{ text: "Data", variant: "default" }}
 actions={
 <>
 <Button
 variant="ghost"
 size="sm"
 className="text-foreground-light hover:text-foreground"
 >
 <ExternalLink className="w-4 h-4 mr-2" />
 Docs
 </Button>
 <Button
 variant="outline"
 size="sm"
 className="border-border-muted text-foreground-light"
 >
 <Upload className="w-4 h-4 mr-2" />
            Import Data
 </Button>
 <Button size="sm" className="bg-brand-500 hover:bg-brand-600 text-background">
 <Download className="w-4 h-4 mr-2" />
            Create Export
 </Button>
 </>
 }
 />

 <div className="page-divider" />

 {/* Storage Usage */}
 <div className="page-panel">
 <div className="page-panel-header flex items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-md bg-brand-200">
 <HardDrive className="w-4 h-4 text-brand-500" />
 </div>
 <div>
          <h2 className="page-panel-title">Storage Usage</h2>
              <p className="page-panel-description">
                {storageUsed} MB / {storageTotal} MB used
 </p>
 </div>
 </div>
 <Badge
 variant="secondary"
 className={cn(
 "text-xs",
 storagePercent > 80
 ? "bg-destructive-200 text-destructive"
 : storagePercent > 60
 ? "bg-warning-200 text-warning"
 : "bg-brand-200 text-brand-500"
 )}
 >
              {storagePercent.toFixed(1)}% used
 </Badge>
 </div>
 <div className="p-6 space-y-4">
 <Progress value={storagePercent} className="h-1.5" />
 <div className="page-grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
 {Object.entries(dataTypes).map(([key, config]) => {
 const Icon = config.icon;
 return (
 <div key={key} className="rounded-md bg-surface-75/60 p-3 text-center">
 <div className={cn("p-2 rounded-md mx-auto w-fit mb-2", config.bg)}>
 <Icon className={cn("w-4 h-4", config.color)} />
 </div>
 <p className="text-[13px] font-medium text-foreground">{config.size}</p>
 <p className="text-xs text-foreground-muted">{config.label}</p>
 </div>
 );
 })}
 </div>
 </div>
 </div>

 <div className="page-grid lg:grid-cols-[1.1fr_0.9fr]">
 {/* Export Data */}
 <div className="page-panel">
 <div className="page-panel-header flex items-center justify-between gap-4">
 <div className="flex items-center gap-2">
 <Download className="w-4 h-4 text-brand-500" />
 <div>
              <h2 className="page-panel-title">Export Data</h2>
              <p className="page-panel-description">Select the data and format you want to export</p>
 </div>
 </div>
 <Badge variant="secondary" className="bg-surface-200 text-foreground-light">
              {selectedTypes.length} selected
 </Badge>
 </div>

 <div className="p-6 space-y-6">
 {/* Select Data Type */}
 <div className="space-y-2">
              <p className="text-xs text-foreground-muted">Select data to export</p>
 {Object.entries(dataTypes).map(([key, config]) => {
 const Icon = config.icon;
 const isSelected = selectedTypes.includes(key);
 return (
 <button
 key={key}
 type="button"
 onClick={() => toggleType(key)}
 className={cn(
 "w-full text-left flex items-center justify-between gap-3 p-3 rounded-md border transition-colors",
 isSelected
 ? "border-brand-400/70 bg-brand-200/30"
 : "border-border bg-surface-75/60 hover:border-border-strong hover:bg-surface-100"
 )}
 >
 <div className="flex items-center gap-3">
 <Checkbox checked={isSelected} />
 <div className={cn("p-1.5 rounded-md", config.bg)}>
 <Icon className={cn("w-4 h-4", config.color)} />
 </div>
 <div>
 <p className="text-[13px] font-medium text-foreground">{config.label}</p>
 <p className="text-xs text-foreground-muted">
 {config.count} · {config.size}
 </p>
 </div>
 </div>
 </button>
 );
 })}
 </div>

 {/* Select Format */}
 <div className="space-y-3">
              <p className="text-xs text-foreground-muted">Select export format</p>
 <div className="page-grid sm:grid-cols-2 gap-2">
 {exportFormats.map((format) => {
 const Icon = format.icon;
 return (
 <button
 key={format.id}
 type="button"
 onClick={() => setExportFormat(format.id)}
 className={cn(
 "flex items-center gap-3 p-3 rounded-md border text-left transition-colors",
 exportFormat === format.id
 ? "border-brand-400/70 bg-brand-200/30"
 : "border-border bg-surface-75/60 hover:border-border-strong hover:bg-surface-100"
 )}
 >
 <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-100">
 <Icon className="w-4 h-4 text-foreground-muted" />
 </div>
 <div>
 <p className="text-[13px] font-medium text-foreground">{format.label}</p>
 <p className="text-xs text-foreground-muted">{format.description}</p>
 </div>
 </button>
 );
 })}
 </div>
 </div>

 {/* Export Button */}
 <div className="flex items-center justify-between pt-4 border-t border-border">
 <p className="text-[13px] text-foreground-light">
              Estimated size: <span className="font-medium text-foreground">{totalSize.toFixed(1)} MB</span>
 </p>
 <Button
 onClick={handleExport}
 disabled={selectedTypes.length === 0 || isExporting}
 className="bg-brand-500 hover:bg-brand-600 text-background"
 >
 {isExporting ? (
 <>
 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
 Export...
 </>
 ) : (
 <>
 <Download className="w-4 h-4 mr-2" />
                Start Export
 </>
 )}
 </Button>
 </div>
 </div>
 </div>

 {/* Import Data */}
 <div className="page-panel">
 <div className="page-panel-header flex items-center justify-between gap-4">
 <div className="flex items-center gap-2">
 <Upload className="w-4 h-4 text-brand-500" />
 <div>
 <h2 className="page-panel-title">Import Data</h2>
              <p className="page-panel-description">Supports JSON, CSV, ZIP</p>
 </div>
 </div>
 <Badge variant="secondary" className="bg-surface-200 text-foreground-light">
              Security Validated
 </Badge>
 </div>

 <div className="p-6 space-y-6">
 {/* Upload Region */}
 <div
 className={cn(
 "border border-dashed rounded-md p-6 text-center transition-colors cursor-pointer bg-surface-75/60",
 importFile
 ? "border-brand-400/70 bg-brand-200/30"
 : "border-border hover:border-border-strong hover:bg-surface-100"
 )}
 onClick={() => document.getElementById("import-file")?.click()}
 >
 <input
 id="import-file"
 type="file"
 accept=".json,.csv,.zip"
 className="hidden"
 onChange={(e) => setImportFile(e.target.files?.[0] || null)}
 />
 {importFile ? (
 <>
 <CheckCircle2 className="w-10 h-10 text-brand-500 mx-auto mb-4" />
 <p className="text-sm font-medium text-foreground mb-1">{importFile.name}</p>
 <p className="text-[13px] text-foreground-light">
 {(importFile.size / 1024 / 1024).toFixed(2)} MB
 </p>
 </>
 ) : (
 <>
 <Upload className="w-10 h-10 text-foreground-muted mx-auto mb-4" />
 <p className="text-sm font-medium text-foreground mb-1">
              Drag & drop files here, or click to upload
 </p>
 <p className="text-[13px] text-foreground-light">
 Support JSON, CSV, ZIP Format
 </p>
 </>
 )}
 </div>

 {/* Import Options */}
 <div className="space-y-2">
 <label className="flex items-center gap-2 rounded-md border border-border bg-surface-75/60 px-3 py-2 text-[13px] text-foreground">
 <Checkbox id="merge" />
              Merge with existing data (no overwrite)
 </label>
 <label className="flex items-center gap-2 rounded-md border border-border bg-surface-75/60 px-3 py-2 text-[13px] text-foreground">
 <Checkbox id="validate" defaultChecked />
              Validate data before import
 </label>
 </div>

 {/* Import Button */}
 <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
 {importFile && (
 <Button
 variant="outline"
 onClick={() => setImportFile(null)}
 className="border-border-muted text-foreground-light"
 >
 Cancel
 </Button>
 )}
 <Button disabled={!importFile} className="bg-brand-500 hover:bg-brand-600 text-background">
 <Upload className="w-4 h-4 mr-2" />
              Start Import
 </Button>
 </div>

 {/* Warning Tip */}
 <div className="flex items-start gap-2 p-3 rounded-md border border-warning/30 bg-warning-200/60">
 <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
 <p className="text-xs text-foreground-light">
              Import may modify existing settings. We recommend exporting your current data as a backup before importing.
 </p>
 </div>
 </div>
 </div>
 </div>

 {/* Export History */}
 <div className="page-panel">
 <div className="page-panel-header space-y-4">
 <div className="flex items-center justify-between gap-4">
 <div>
              <h2 className="page-panel-title">Export History</h2>
              <p className="page-panel-description">Export records from the last 7 days</p>
 </div>
 <div className="page-toolbar">
 <Input
                placeholder="Search export records"
 inputSize="sm"
 variant="search"
 className="w-[200px]"
 leftIcon={<Search className="h-4 w-4" />}
 />
 <Select defaultValue="7d">
 <SelectTrigger className="h-8 w-[130px] text-[12px]">
 <div className="flex items-center gap-2">
 <Calendar className="h-3.5 w-3.5 text-foreground-muted" />
 <SelectValue placeholder="Time range" />
 </div>
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="24h">Past 24 h</SelectItem>
 <SelectItem value="7d">Past 7 days</SelectItem>
 <SelectItem value="30d">Past 30 days</SelectItem>
 </SelectContent>
 </Select>
 <Button
 variant="outline"
 size="sm"
 className="border-border-muted text-foreground-light"
 >
 <Trash2 className="w-4 h-4 mr-2" />
              Clean Up Expired
 </Button>
 </div>
 </div>

 <TabNav
 tabs={historyTabs}
 activeTab={historyTab}
 onChange={(value) => setHistoryTab(value as HistoryTab)}
 className="border-b-0"
 />
 </div>

 <div className="p-6">
 {filteredHistory.length === 0 ? (
 <EmptyState
 icon={Archive}
              title="No Export Records"
              description="No export records found for the current filter"
 action={{ label: "Create export", onClick: handleExport, icon: Download }}
 />
 ) : (
 <div className="overflow-hidden rounded-md border border-border bg-surface-75/50">
 <div className="divide-y divide-border">
 {filteredHistory.map((item) => {
 const status = statusConfig[item.status as keyof typeof statusConfig];
 const StatusIcon = status.icon;
 const typeConfig = dataTypes[item.type as keyof typeof dataTypes] || {
                  label: "Complete Backup",
 icon: Archive,
 color: "text-brand-500",
 bg: "bg-brand-200",
 };
 const TypeIcon = typeConfig.icon;

 return (
 <div
 key={item.id}
 className="flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-surface-100/60 lg:flex-row lg:items-center lg:justify-between"
 >
 <div className="flex items-start gap-4">
 <div className={cn("p-2 rounded-md", typeConfig.bg)}>
 <TypeIcon className={cn("w-4 h-4", typeConfig.color)} />
 </div>
 <div>
 <div className="flex flex-wrap items-center gap-2 mb-1">
 <p className="text-[13px] font-medium text-foreground">{typeConfig.label}</p>
 <Badge
 variant="secondary"
 className="text-xs bg-surface-200 text-foreground-light"
 >
 {item.format.toUpperCase()}
 </Badge>
 <Badge
 variant="secondary"
 className={cn("text-xs", status.bg, status.color)}
 >
 <StatusIcon
 className={cn(
 "w-3 h-3 mr-1",
 item.status === "processing" && "animate-spin"
 )}
 />
 {status.label}
 </Badge>
 </div>
 <p className="text-[13px] text-foreground-light flex items-center gap-2">
 <Calendar className="h-3.5 w-3.5 text-foreground-muted" />
 {formatDate(item.createdAt)}
                  {item.expiresAt && ` · Expires at ${formatDate(item.expiresAt)}`}
 {item.error && <span className="text-destructive ml-2">{item.error}</span>}
 </p>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-3 justify-between lg:justify-end">
 {item.status === "processing" && item.progress !== undefined && (
 <div className="w-24">
 <Progress value={item.progress} className="h-1.5" />
 <p className="text-xs text-foreground-muted text-center mt-1">
 {item.progress}%
 </p>
 </div>
 )}
 <span className="text-[13px] text-foreground-light">{item.size}</span>
 {item.status === "completed" && item.downloadUrl && (
 <Button
 variant="outline"
 size="sm"
 className="border-border-muted text-foreground-light"
 >
 <Download className="w-4 h-4 mr-2" />
 Download
 </Button>
 )}
 {item.status === "failed" && (
 <Button
 variant="outline"
 size="sm"
 className="border-border-muted text-foreground-light"
 >
 <RefreshCw className="w-4 h-4 mr-2" />
 Retry
 </Button>
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 )}
 </div>
 </div>

 {/* Data Security Tip */}
 <div className="page-panel border-brand-400/30 bg-brand-200/40">
 <div className="p-6 flex items-start gap-4">
 <div className="p-2 rounded-md bg-brand-500">
 <Shield className="w-5 h-5 text-background" />
 </div>
 <div className="flex-1">
            <h3 className="text-sm font-medium text-foreground mb-1">Data Security</h3>
            <p className="text-[13px] text-foreground-light mb-4">
              All exported data is encrypted. Export files are automatically deleted after 7 days. Please download them promptly.
 </p>
 <div className="flex flex-wrap items-center gap-3">
 <Button variant="outline" size="sm" className="border-border-muted text-foreground-light">
              Data Security Policy
 </Button>
 <Button variant="outline" size="sm" className="border-border-muted text-foreground-light">
              Manage Data Retention Settings
 </Button>
 </div>
 </div>
 </div>
 </div>
 </div>
 </PageContainer>
 );
}
