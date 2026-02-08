"use client";

/**
 * File / Knowledge Base Page
 * Layout with sidebar for folder filtering and knowledge base list,
 * main content for overview and file list
 */

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/dashboard/supabase-ui";
import {
 PageWithSidebar,
 SidebarNavGroup,
} from "@/components/dashboard/page-layout";
import { Button, ButtonGroup } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
 DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
 FolderOpen,
 Upload,
 Search,
 Grid,
 List,
 MoreVertical,
 File,
 FileText,
 FileImage,
 FileCode,
 FileSpreadsheet,
 Folder,
 Plus,
 Trash2,
 Download,
 Share2,
 Star,
 Database,
 Brain,
 Check,
 Eye,
 Edit3,
 Link as LinkIcon,
 RefreshCw,
 ChevronDown,
 HardDrive,
 FolderPlus,
 Settings,
 LayoutGrid,
} from "lucide-react";

// Folder Structure
const folders = [
 { id: "all", name: "All Files", count: 24 },
 { id: "documents", name: "Document", count: 12 },
 { id: "images", name: "Image", count: 5 },
 { id: "code", name: "Code", count: 4 },
 { id: "datasets", name: "Dataset", count: 3 },
];

// Knowledge Base
const knowledgeBases = [
 {
 id: "kb-1",
    name: "Product Docs",
    description: "Product descriptions, FAQ, help documents",
 fileCount: 45,
 vectorCount: 12800,
 lastUpdated: "2 hours ago",
 status: "active",
 },
 {
 id: "kb-2",
    name: "Technical Docs",
    description: "API docs, development guides, architecture documents",
 fileCount: 28,
 vectorCount: 8500,
 lastUpdated: "1 day ago",
 status: "active",
 },
 {
 id: "kb-3",
    name: "Customer Feedback",
    description: "User feedback, survey reports, reviews data",
 fileCount: 15,
 vectorCount: 4200,
 lastUpdated: "3 days ago",
 status: "indexing",
 },
];

// FileData
const files = [
 {
 id: "1",
 name: "ProductRequirementsDocument v2.0.docx",
 type: "document",
 size: "2.4 MB",
 folder: "documents",
 uploadedAt: "2026-01-30",
 updatedAt: "2 hours ago",
 starred: true,
 indexed: true,
    knowledgeBase: "Product Docs",
 },
 {
 id: "2",
 name: "API InterfaceStandard.md",
 type: "document",
 size: "156 KB",
 folder: "documents",
 uploadedAt: "2026-01-28",
 updatedAt: "1 day ago",
 starred: false,
 indexed: true,
    knowledgeBase: "Technical Docs",
 },
 {
 id: "3",
 name: "UserSurveyData.xlsx",
 type: "spreadsheet",
 size: "4.8 MB",
 folder: "datasets",
 uploadedAt: "2026-01-25",
 updatedAt: "3 days ago",
 starred: true,
 indexed: false,
 knowledgeBase: null,
 },
 {
 id: "4",
 name: "ArchitectureDesign.png",
 type: "image",
 size: "1.2 MB",
 folder: "images",
 uploadedAt: "2026-01-24",
 updatedAt: "4 days ago",
 starred: false,
 indexed: false,
 knowledgeBase: null,
 },
 {
 id: "5",
 name: "Toolcount.ts",
 type: "code",
 size: "45 KB",
 folder: "code",
 uploadedAt: "2026-01-22",
 updatedAt: "6 days ago",
 starred: false,
 indexed: true,
    knowledgeBase: "Technical Docs",
 },
 {
 id: "6",
 name: "MarketingPlan.pdf",
 type: "document",
 size: "3.6 MB",
 folder: "documents",
 uploadedAt: "2026-01-20",
 updatedAt: "1 week ago",
 starred: false,
 indexed: false,
 knowledgeBase: null,
 },
 {
 id: "7",
 name: "BrandDesign.fig",
 type: "image",
 size: "8.2 MB",
 folder: "images",
 uploadedAt: "2026-01-18",
 updatedAt: "2 weeks ago",
 starred: true,
 indexed: false,
 knowledgeBase: null,
 },
 {
 id: "8",
 name: "TrainingDataset.json",
 type: "code",
 size: "15.4 MB",
 folder: "datasets",
 uploadedAt: "2026-01-15",
 updatedAt: "2 weeks ago",
 starred: false,
 indexed: true,
    knowledgeBase: "Customer Feedback",
 },
];

// Get File Icon
const getFileIcon = (type: string) => {
 switch (type) {
 case "document":
 return FileText;
 case "image":
 return FileImage;
 case "code":
 return FileCode;
 case "spreadsheet":
 return FileSpreadsheet;
 default:
 return File;
 }
};

// Storage Usage
const storageUsage = {
 used: 2.4,
 limit: 10,
 breakdown: [
 { type: "Document", size: 1.2, color: "bg-brand-500" },
 { type: "Image", size: 0.6, color: "bg-surface-300" },
 { type: "Dataset", size: 0.4, color: "bg-warning" },
 { type: "Code", size: 0.2, color: "bg-brand-400" },
 ],
};

// Sidebar Component
function FilesSidebar({
 selectedFolder,
 setSelectedFolder,
 showKnowledgeBases,
 setShowKnowledgeBases,
}: {
 selectedFolder: string;
 setSelectedFolder: (folder: string) => void;
 showKnowledgeBases: boolean;
 setShowKnowledgeBases: (show: boolean) => void;
}) {
 const storagePercent = Math.min(
 100,
 Math.round((storageUsage.used / storageUsage.limit) * 100)
 );

 return (
 <div className="space-y-1">
    {/* Folder Filter */}
 <SidebarNavGroup title="Folder">
 {folders.map((folder) => (
 <button
 key={folder.id}
 onClick={() => setSelectedFolder(folder.id)}
 className={cn(
 "w-full flex items-center justify-between h-8 px-2 rounded-md text-[12px] font-medium transition-colors",
 selectedFolder === folder.id
 ? "bg-surface-100/70 text-foreground"
 : "text-foreground-light hover:bg-surface-100/60 hover:text-foreground"
 )}
 >
 <span className="flex items-center gap-2">
 {folder.id === "all" ? (
 <HardDrive className="w-3.5 h-3.5" />
 ) : (
 <Folder className="w-3.5 h-3.5" />
 )}
 {folder.name}
 </span>
 <span className="text-[11px] text-foreground-muted">
 {folder.count}
 </span>
 </button>
 ))}
 </SidebarNavGroup>

    {/* Create Folder */}
      <button className="w-full flex items-center gap-2 h-8 px-2 rounded-md text-[12px] text-foreground-muted hover:text-foreground hover:bg-surface-100/60 transition-colors mt-2">
        <Plus className="w-3.5 h-3.5" />
        Create Folder
 </button>

      {/* Separator */}
 <div className="h-px bg-border my-3" />

 {/* Knowledge Base */}
 <SidebarNavGroup title="Knowledge Base">
 {knowledgeBases.map((kb) => (
 <button
 key={kb.id}
 className="w-full flex items-center justify-between h-8 px-2 rounded-md text-[12px] font-medium text-foreground-light hover:bg-surface-100/60 hover:text-foreground transition-colors"
 >
 <span className="flex items-center gap-2 truncate">
 <Brain className="w-3.5 h-3.5 shrink-0" />
 <span className="truncate">{kb.name}</span>
 </span>
 {kb.status === "indexing" ? (
 <RefreshCw className="w-3 h-3 animate-spin text-brand-500 shrink-0" />
 ) : (
 <span className="text-[11px] text-foreground-muted shrink-0">
 {kb.fileCount}
 </span>
 )}
 </button>
 ))}
 <button className="w-full flex items-center gap-2 h-8 px-2 rounded-md text-[12px] text-foreground-muted hover:text-foreground hover:bg-surface-100/60 transition-colors">
 <Plus className="w-3.5 h-3.5" />
        Create Knowledge Base
 </button>
 </SidebarNavGroup>

      {/* Separator */}
 <div className="h-px bg-border my-3" />

      {/* Storage Usage */}
      <div className="px-2 py-2">
        <div className="flex items-center justify-between text-[11px] mb-2">
          <span className="text-foreground-muted">Storage Usage</span>
 <span className="text-foreground font-medium">
 {storageUsage.used} / {storageUsage.limit} GB
 </span>
 </div>
 <Progress value={storagePercent} size="sm" />
 <div className="mt-2 space-y-1">
 {storageUsage.breakdown.map((item) => (
 <div
 key={item.type}
 className="flex items-center justify-between text-[10px] text-foreground-muted"
 >
 <span className="flex items-center gap-1.5">
 <span className={cn("w-1.5 h-1.5 rounded-full", item.color)} />
 {item.type}
 </span>
 <span>{item.size} GB</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}

type SortBy = "updated" | "name" | "size";

export default function FilesPage() {
 const [searchQuery, setSearchQuery] = useState("");
 const [selectedFolder, setSelectedFolder] = useState("all");
 const [viewMode, setViewMode] = useState<"grid" | "list">("list");
 const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
 const [isSelectionMode, setIsSelectionMode] = useState(false);
 const [showKnowledgeBases, setShowKnowledgeBases] = useState(true);
 const [isDragging, setIsDragging] = useState(false);
 const [sortBy, setSortBy] = useState<SortBy>("updated");

  // Filter Files
 const filteredFiles = files.filter((file) => {
 const matchesSearch = file.name
 .toLowerCase()
 .includes(searchQuery.toLowerCase());
 const matchesFolder =
 selectedFolder === "all" || file.folder === selectedFolder;
 return matchesSearch && matchesFolder;
 });

  // Toggle Selection
 const toggleSelect = (id: string) => {
 const newSelected = new Set(selectedFiles);
 if (newSelected.has(id)) {
 newSelected.delete(id);
 } else {
 newSelected.add(id);
 }
 setSelectedFiles(newSelected);
 };

 // Select All
 const toggleSelectAll = () => {
 if (filteredFiles.length === 0) return;
 if (selectedFiles.size === filteredFiles.length) {
 setSelectedFiles(new Set());
 } else {
 setSelectedFiles(new Set(filteredFiles.map((f) => f.id)));
 }
 };

 const resetSelection = () => {
 setIsSelectionMode(false);
 setSelectedFiles(new Set());
 };

 const activeFolder = folders.find((folder) => folder.id === selectedFolder);

  // Statistics
 const stats = {
 total: files.length,
 indexed: files.filter((f) => f.indexed).length,
 starred: files.filter((f) => f.starred).length,
 knowledgeBases: knowledgeBases.length,
 totalVectors: knowledgeBases.reduce((sum, kb) => sum + kb.vectorCount, 0),
 };

 const sortOptions: Array<{ value: SortBy; label: string }> = [
    { value: "updated", label: "Recently Updated" },
 { value: "name", label: "Name" },
 { value: "size", label: "Size" },
 ];

  // Sort Files
 const sortedFiles = [...filteredFiles].sort((a, b) => {
 switch (sortBy) {
 case "name":
 return a.name.localeCompare(b.name, "zh-Hans-CN");
 case "size":
 return (
 parseFloat(b.size.replace(/[^\d.]/g, "")) -
 parseFloat(a.size.replace(/[^\d.]/g, ""))
 );
 case "updated":
 default:
      return 0; // Maintain order (already sorted by update time)
 }
 });

  // Most Recently Updated File
 const mostRecentFile = files[0];

 return (
 <PageWithSidebar
 sidebarTitle="File"
 sidebarWidth="narrow"
 sidebar={
 <FilesSidebar
 selectedFolder={selectedFolder}
 setSelectedFolder={setSelectedFolder}
 showKnowledgeBases={showKnowledgeBases}
 setShowKnowledgeBases={setShowKnowledgeBases}
 />
 }
 >
 <div className="space-y-6 max-w-[960px]">
 {/* PageHeader */}
 <div className="flex items-start justify-between">
 <div>
 <h1 className="text-[18px] font-semibold text-foreground">
          File Management
 </h1>
 <p className="text-[12px] text-foreground-light mt-1">
 Manage uploads, knowledge base index and vector data
 </p>
 </div>
 <div className="flex items-center gap-2">
 {isSelectionMode ? (
 <>
 <span className="text-[12px] text-foreground-light">
              {selectedFiles.size} selected
 </span>
 <Button variant="outline" size="sm" onClick={resetSelection}>
 Cancel
 </Button>
 <Button variant="outline" size="sm" leftIcon={<Download />}>
 Download
 </Button>
 <Button variant="destructive" size="sm" leftIcon={<Trash2 />}>
 Delete
 </Button>
 </>
 ) : (
 <>
 <Button
 variant="outline"
 size="sm"
 leftIcon={<FolderPlus className="h-3.5 w-3.5" />}
 >
              Create Folder
 </Button>
 <Button size="sm" leftIcon={<Upload className="h-3.5 w-3.5" />}>
              Upload File
 </Button>
 </>
 )}
 </div>
 </div>

        {/* Overview Panel */}
 <div className="page-panel">
 <div className="page-panel-header">
 <h2 className="page-panel-title">Overview</h2>
 <p className="page-panel-description">Storage usage and key metrics</p>
 </div>
 <div className="p-4">
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
 <div className="p-3 rounded-md border border-border bg-surface-75/60">
 <p className="text-[11px] text-foreground-muted mb-1">
                Total Files
 </p>
 <p className="text-lg font-semibold text-foreground">
 {stats.total}
 </p>
 <p className="text-[11px] text-foreground-muted">
                {stats.starred} favorited
 </p>
 </div>
 <div className="p-3 rounded-md border border-border bg-surface-75/60">
 <p className="text-[11px] text-foreground-muted mb-1">
                Indexed
 </p>
 <p className="text-lg font-semibold text-foreground">
 {stats.indexed}
 </p>
 <p className="text-[11px] text-foreground-muted">
                {Math.round((stats.indexed / stats.total) * 100)}% coverage
 </p>
 </div>
 <div className="p-3 rounded-md border border-border bg-surface-75/60">
 <p className="text-[11px] text-foreground-muted mb-1">Knowledge Base</p>
 <p className="text-lg font-semibold text-foreground">
 {stats.knowledgeBases}
 </p>
 <p className="text-[11px] text-foreground-muted">
                {(stats.totalVectors / 1000).toFixed(1)}k vectors
 </p>
 </div>
 <div className="p-3 rounded-md border border-border bg-surface-75/60">
 <p className="text-[11px] text-foreground-muted mb-1">
                Storage Usage
 </p>
 <p className="text-lg font-semibold text-brand-500">
 {Math.round((storageUsage.used / storageUsage.limit) * 100)}%
 </p>
 <p className="text-[11px] text-foreground-muted">
 {storageUsage.used} / {storageUsage.limit} GB
 </p>
 </div>
 </div>

          {/* Recently Updated */}
            {mostRecentFile && (
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-medium text-foreground-muted uppercase tracking-wide">
                    Recently Updated
 </span>
 <span className="text-[11px] text-foreground-muted">
 {mostRecentFile.updatedAt}
 </span>
 </div>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3 min-w-0">
 <div className="w-8 h-8 rounded-md bg-surface-200/80 border border-border flex items-center justify-center shrink-0">
 {(() => {
 const FileIcon = getFileIcon(mostRecentFile.type);
 return (
 <FileIcon className="w-3.5 h-3.5 text-foreground-light" />
 );
 })()}
 </div>
 <div className="min-w-0">
 <div className="flex items-center gap-2">
 {mostRecentFile.starred && (
 <Star className="w-3.5 h-3.5 text-warning fill-current" />
 )}
 <span className="text-[13px] font-medium text-foreground truncate">
 {mostRecentFile.name}
 </span>
 {mostRecentFile.indexed && (
 <Badge variant="primary" size="xs">
                Indexed
 </Badge>
 )}
 </div>
 <p className="text-[11px] text-foreground-light">
                {mostRecentFile.size} · Uploaded on {mostRecentFile.uploadedAt}
 </p>
 </div>
 </div>
 <Button
 variant="outline"
 size="sm"
 className="shrink-0 ml-4"
 leftIcon={<Eye className="w-3.5 h-3.5" />}
 >
 Preview
 </Button>
 </div>
 </div>
 )}
 </div>
 </div>

      {/* File List Panel */}
 <div className="page-panel">
 <div className="page-panel-header flex items-center justify-between">
 <div>
 <h2 className="page-panel-title">
 {activeFolder?.name || "File"}
 </h2>
 <p className="page-panel-description">
 {sortedFiles.length} File
 {selectedFolder !== "all" && ` · ${activeFolder?.name}`}
 </p>
 </div>
 <div className="flex items-center gap-2">
 {!isSelectionMode && (
 <Button
 variant="ghost"
 size="sm"
 leftIcon={<Check className="w-3.5 h-3.5" />}
 onClick={() => setIsSelectionMode(true)}
 >
 Select
 </Button>
 )}
 <ButtonGroup
 attached
 className="border border-border rounded-md overflow-hidden bg-surface-200/60"
 >
 <Button
 variant="ghost"
 size="sm"
 className={cn(
 "rounded-none h-7 px-2",
 viewMode === "list"
 ? "bg-surface-200 text-foreground"
 : "text-foreground-muted hover:text-foreground"
 )}
 onClick={() => setViewMode("list")}
 >
 <List className="w-3.5 h-3.5" />
 </Button>
 <Button
 variant="ghost"
 size="sm"
 className={cn(
 "rounded-none h-7 px-2",
 viewMode === "grid"
 ? "bg-surface-200 text-foreground"
 : "text-foreground-muted hover:text-foreground"
 )}
 onClick={() => setViewMode("grid")}
 >
 <LayoutGrid className="w-3.5 h-3.5" />
 </Button>
 </ButtonGroup>
 </div>
 </div>

 {/* Toolbar */}
 <div className="px-4 py-3 border-b border-border flex items-center gap-3">
 <Input
 placeholder="Search files..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 variant="search"
 inputSize="sm"
 leftIcon={<Search className="h-3.5 w-3.5" />}
 className="max-w-[240px]"
 />
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant="outline"
 size="sm"
 rightIcon={<ChevronDown className="h-3 w-3" />}
 className="h-8"
 >
 {sortOptions.find((option) => option.value === sortBy)?.label}
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent
 align="start"
 className="w-36 bg-surface-100 border border-border rounded-md"
 >
 {sortOptions.map((option) => (
 <DropdownMenuItem
 key={option.value}
 onClick={() => setSortBy(option.value)}
 className={cn(
 "px-3 py-1.5 text-[12px] rounded-md mx-1 cursor-pointer",
 sortBy === option.value
 ? "bg-surface-200 text-foreground"
 : "text-foreground-light hover:bg-surface-200 hover:text-foreground"
 )}
 >
 {option.label}
 </DropdownMenuItem>
 ))}
 </DropdownMenuContent>
 </DropdownMenu>
 </div>

          {/* Drag & Drop Upload Region */}
 <div
 className={cn("relative", isDragging && "bg-surface-75/50")}
 onDragOver={(e) => {
 e.preventDefault();
 setIsDragging(true);
 }}
 onDragLeave={() => setIsDragging(false)}
 onDrop={(e) => {
 e.preventDefault();
 setIsDragging(false);
 }}
 >
            {/* Drag & Drop Upload Overlay */}
 {isDragging && (
 <div className="absolute inset-4 z-20 rounded-md border-2 border-dashed border-brand-500 bg-background-overlay flex items-center justify-center pointer-events-none">
 <div className="text-center">
 <Upload className="w-8 h-8 text-brand-500 mx-auto mb-2" />
 <p className="text-[13px] font-medium text-foreground">
                Drop files to upload
 </p>
 </div>
 </div>
 )}

            {/* List View */}
 {sortedFiles.length > 0 && viewMode === "list" && (
 <div>
              {/* Header */}
 <div className="hidden lg:grid grid-cols-[1fr_80px_100px_120px_80px] gap-4 px-4 py-2 border-b border-border text-[11px] font-medium text-foreground-muted uppercase tracking-wide">
 {isSelectionMode && <span className="w-5" />}
 <span>File</span>
 <span>Size</span>
 <span>Updated At</span>
 <span>Knowledge Base</span>
 <span className="text-right">Action</span>
 </div>
              {/* File List */}
 <div className="divide-y divide-border">
 {sortedFiles.map((file) => {
 const FileIcon = getFileIcon(file.type);
 const isSelected = selectedFiles.has(file.id);

 return (
 <div
 key={file.id}
 className={cn(
 "group grid grid-cols-1 lg:grid-cols-[1fr_80px_100px_120px_80px] gap-4 px-4 py-3 hover:bg-surface-75/50 transition-colors",
 isSelected && "bg-brand-200/20",
 isSelectionMode && "cursor-pointer"
 )}
 onClick={() =>
 isSelectionMode && toggleSelect(file.id)
 }
 >
                  {/* File Info */}
 <div className="flex items-center gap-3 min-w-0">
 {isSelectionMode && (
 <Checkbox
 aria-label={`Select ${file.name}`}
 checked={isSelected}
 onCheckedChange={() => toggleSelect(file.id)}
 onClick={(e) => e.stopPropagation()}
 />
 )}
 <div className="w-8 h-8 rounded-md bg-surface-200/80 border border-border flex items-center justify-center shrink-0">
 <FileIcon className="w-3.5 h-3.5 text-foreground-light" />
 </div>
 <div className="min-w-0">
 <div className="flex items-center gap-2">
 {file.starred && (
 <Star className="w-3.5 h-3.5 text-warning fill-current shrink-0" />
 )}
 <span className="text-[13px] font-medium text-foreground truncate">
 {file.name}
 </span>
 {file.indexed && (
 <Badge variant="primary" size="xs">
 Index
 </Badge>
 )}
 </div>
 <p className="text-[11px] text-foreground-light truncate">
                Uploaded on {file.uploadedAt}
 </p>
 </div>
 </div>

 {/* Size */}
 <div className="hidden lg:flex items-center text-[11px] text-foreground-light">
 {file.size}
 </div>

 {/* Updated At */}
 <div className="hidden lg:flex items-center text-[11px] text-foreground-light">
 {file.updatedAt}
 </div>

 {/* Knowledge Base */}
 <div className="hidden lg:flex items-center text-[11px] text-foreground-light">
 {file.knowledgeBase || "-"}
 </div>

 {/* Action */}
 <div className="flex items-center justify-end gap-1">
 <Button
 variant="ghost"
 size="icon-sm"
 className="text-foreground-muted hover:text-foreground h-7 w-7"
 onClick={(e) => e.stopPropagation()}
 >
 <Download className="w-3.5 h-3.5" />
 </Button>
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant="ghost"
 size="icon-sm"
 className="text-foreground-muted hover:text-foreground h-7 w-7"
 onClick={(e) => e.stopPropagation()}
 >
 <MoreVertical className="w-3.5 h-3.5" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent
 align="end"
 className="w-40 bg-surface-100 border border-border rounded-md"
 >
 <DropdownMenuItem
 icon={<Eye />}
 className="cursor-pointer"
 >
 Preview
 </DropdownMenuItem>
 <DropdownMenuItem
 icon={<Edit3 />}
 className="cursor-pointer"
 >
                  Rename
 </DropdownMenuItem>
 <DropdownMenuItem
 icon={<Star />}
 className="cursor-pointer"
 >
 {file.starred ? "Unfavorite": "Favorite"}
 </DropdownMenuItem>
 <DropdownMenuItem
 icon={<Brain />}
 className="cursor-pointer"
 >
                  Add to Knowledge Base
 </DropdownMenuItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem
 icon={<Share2 />}
 className="cursor-pointer"
 >
 Share
 </DropdownMenuItem>
 <DropdownMenuItem
 icon={<LinkIcon />}
 className="cursor-pointer"
 >
                  Copy Link
 </DropdownMenuItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem
 destructive
 icon={<Trash2 />}
 className="cursor-pointer"
 >
 Delete
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>

                  {/* Mobile Info */}
 <div className="flex flex-wrap items-center gap-3 text-[11px] text-foreground-muted lg:hidden">
 <span>{file.size}</span>
 <span>{file.updatedAt}</span>
 {file.knowledgeBase && (
 <span>{file.knowledgeBase}</span>
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 )}

          {/* Grid View */}
 {sortedFiles.length > 0 && viewMode === "grid" && (
 <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {sortedFiles.map((file) => {
 const FileIcon = getFileIcon(file.type);
 const isSelected = selectedFiles.has(file.id);

 return (
 <div
 key={file.id}
 className={cn(
 "relative p-4 rounded-lg border border-border bg-surface-75/60 hover:border-border-strong hover:bg-surface-100/80 transition-colors group",
 isSelected && "border-brand-400 bg-brand-200/15"
 )}
 onClick={() =>
 isSelectionMode && toggleSelect(file.id)
 }
 >
 {isSelectionMode && (
 <Checkbox
 aria-label={`Select ${file.name}`}
 checked={isSelected}
 onCheckedChange={() => toggleSelect(file.id)}
 onClick={(e) => e.stopPropagation()}
 className="absolute top-3 right-3"
 />
 )}

 <div className="flex items-start justify-between mb-3">
 <div className="w-8 h-8 rounded-md bg-surface-200/80 border border-border flex items-center justify-center">
 <FileIcon className="w-3.5 h-3.5 text-foreground-light" />
 </div>
 {file.indexed && (
 <Badge variant="primary" size="xs">
 Index
 </Badge>
 )}
 </div>

 <h3 className="text-[13px] font-medium text-foreground mb-1 flex items-center gap-2">
 {file.starred && (
 <Star className="w-3.5 h-3.5 text-warning fill-current" />
 )}
 <span className="truncate">{file.name}</span>
 </h3>

 <p className="text-[11px] text-foreground-light mb-3">
 {file.size} · {file.updatedAt}
 </p>

 <div className="flex items-center justify-between text-[10px] text-foreground-muted">
              <span>{file.knowledgeBase || "Not indexed"}</span>
 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
 <button
 className="p-1 rounded hover:bg-surface-200 transition-colors"
 onClick={(e) => e.stopPropagation()}
 >
 <Download className="w-3.5 h-3.5" />
 </button>
 <button
 className="p-1 rounded hover:bg-surface-200 transition-colors"
 onClick={(e) => e.stopPropagation()}
 >
 <MoreVertical className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* Empty State */}
 {sortedFiles.length === 0 && (
 <div className="px-4 py-12 text-center">
 <div className="w-12 h-12 rounded-md bg-surface-200/80 border border-border flex items-center justify-center mx-auto mb-4">
 <FolderOpen className="w-5 h-5 text-foreground-muted" />
 </div>
 <h3 className="text-[13px] font-medium text-foreground mb-1">
 {searchQuery ? "No matching files" : "No files yet"}
 </h3>
 <p className="text-[11px] text-foreground-light mb-4 max-w-xs mx-auto">
 {searchQuery
 ? "Try other keywords"
: "Drag & drop files here or click to upload and start building your knowledge base"}
 </p>
 {searchQuery ? (
 <Button
 variant="outline"
 size="sm"
 onClick={() => {
 setSearchQuery("");
 setSelectedFolder("all");
 }}
 >
 Clear Filter
 </Button>
 ) : (
 <Button size="sm" leftIcon={<Upload className="w-3.5 h-3.5" />}>
              Upload File
 </Button>
 )}
 </div>
 )}
 </div>
 </div>
 </div>
 </PageWithSidebar>
 );
}
