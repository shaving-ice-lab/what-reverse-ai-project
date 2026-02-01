"use client";

/**
 * 文件库/知识库页面 - 两栏布局
 * 与 workflows 页面布局样式一致
 * 左侧：文件夹筛选 + 知识库列表
 * 右侧：概览 + 文件列表
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

// 文件夹结构
const folders = [
  { id: "all", name: "全部文件", count: 24 },
  { id: "documents", name: "文档", count: 12 },
  { id: "images", name: "图片", count: 5 },
  { id: "code", name: "代码", count: 4 },
  { id: "datasets", name: "数据集", count: 3 },
];

// 知识库
const knowledgeBases = [
  {
    id: "kb-1",
    name: "产品文档",
    description: "产品说明书、FAQ、帮助文档",
    fileCount: 45,
    vectorCount: 12800,
    lastUpdated: "2小时前",
    status: "active",
  },
  {
    id: "kb-2",
    name: "技术资料",
    description: "API 文档、开发指南、架构文档",
    fileCount: 28,
    vectorCount: 8500,
    lastUpdated: "1天前",
    status: "active",
  },
  {
    id: "kb-3",
    name: "客户反馈",
    description: "用户反馈、调研报告、评价数据",
    fileCount: 15,
    vectorCount: 4200,
    lastUpdated: "3天前",
    status: "indexing",
  },
];

// 文件数据
const files = [
  {
    id: "1",
    name: "产品需求文档 v2.0.docx",
    type: "document",
    size: "2.4 MB",
    folder: "documents",
    uploadedAt: "2026-01-30",
    updatedAt: "2小时前",
    starred: true,
    indexed: true,
    knowledgeBase: "产品文档",
  },
  {
    id: "2",
    name: "API 接口规范.md",
    type: "document",
    size: "156 KB",
    folder: "documents",
    uploadedAt: "2026-01-28",
    updatedAt: "1天前",
    starred: false,
    indexed: true,
    knowledgeBase: "技术资料",
  },
  {
    id: "3",
    name: "用户调研数据.xlsx",
    type: "spreadsheet",
    size: "4.8 MB",
    folder: "datasets",
    uploadedAt: "2026-01-25",
    updatedAt: "3天前",
    starred: true,
    indexed: false,
    knowledgeBase: null,
  },
  {
    id: "4",
    name: "架构设计图.png",
    type: "image",
    size: "1.2 MB",
    folder: "images",
    uploadedAt: "2026-01-24",
    updatedAt: "4天前",
    starred: false,
    indexed: false,
    knowledgeBase: null,
  },
  {
    id: "5",
    name: "工具函数库.ts",
    type: "code",
    size: "45 KB",
    folder: "code",
    uploadedAt: "2026-01-22",
    updatedAt: "6天前",
    starred: false,
    indexed: true,
    knowledgeBase: "技术资料",
  },
  {
    id: "6",
    name: "营销方案.pdf",
    type: "document",
    size: "3.6 MB",
    folder: "documents",
    uploadedAt: "2026-01-20",
    updatedAt: "1周前",
    starred: false,
    indexed: false,
    knowledgeBase: null,
  },
  {
    id: "7",
    name: "品牌设计稿.fig",
    type: "image",
    size: "8.2 MB",
    folder: "images",
    uploadedAt: "2026-01-18",
    updatedAt: "2周前",
    starred: true,
    indexed: false,
    knowledgeBase: null,
  },
  {
    id: "8",
    name: "训练数据集.json",
    type: "code",
    size: "15.4 MB",
    folder: "datasets",
    uploadedAt: "2026-01-15",
    updatedAt: "2周前",
    starred: false,
    indexed: true,
    knowledgeBase: "客户反馈",
  },
];

// 获取文件图标
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

// 存储使用情况
const storageUsage = {
  used: 2.4,
  limit: 10,
  breakdown: [
    { type: "文档", size: 1.2, color: "bg-brand-500" },
    { type: "图片", size: 0.6, color: "bg-surface-300" },
    { type: "数据集", size: 0.4, color: "bg-warning" },
    { type: "代码", size: 0.2, color: "bg-brand-400" },
  ],
};

// 侧边栏组件
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
      {/* 文件夹筛选 */}
      <SidebarNavGroup title="文件夹">
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

      {/* 新建文件夹 */}
      <button className="w-full flex items-center gap-2 h-8 px-2 rounded-md text-[12px] text-foreground-muted hover:text-foreground hover:bg-surface-100/60 transition-colors mt-2">
        <Plus className="w-3.5 h-3.5" />
        新建文件夹
      </button>

      {/* 分隔线 */}
      <div className="h-px bg-border my-3" />

      {/* 知识库 */}
      <SidebarNavGroup title="知识库">
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
          新建知识库
        </button>
      </SidebarNavGroup>

      {/* 分隔线 */}
      <div className="h-px bg-border my-3" />

      {/* 存储使用 */}
      <div className="px-2 py-2">
        <div className="flex items-center justify-between text-[11px] mb-2">
          <span className="text-foreground-muted">存储使用</span>
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

  // 筛选文件
  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFolder =
      selectedFolder === "all" || file.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  // 切换选择
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedFiles(newSelected);
  };

  // 全选
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

  // 统计数据
  const stats = {
    total: files.length,
    indexed: files.filter((f) => f.indexed).length,
    starred: files.filter((f) => f.starred).length,
    knowledgeBases: knowledgeBases.length,
    totalVectors: knowledgeBases.reduce((sum, kb) => sum + kb.vectorCount, 0),
  };

  const sortOptions: Array<{ value: SortBy; label: string }> = [
    { value: "updated", label: "最近更新" },
    { value: "name", label: "名称" },
    { value: "size", label: "大小" },
  ];

  // 排序文件
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
        return 0; // 保持原顺序（假设已按更新时间排序）
    }
  });

  // 最近更新的文件
  const mostRecentFile = files[0];

  return (
    <PageWithSidebar
      sidebarTitle="文件"
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
        {/* 页面头部 */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[18px] font-semibold text-foreground">
              文件管理
            </h1>
            <p className="text-[12px] text-foreground-light mt-1">
              管理上传文件、知识库索引和向量数据
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSelectionMode ? (
              <>
                <span className="text-[12px] text-foreground-light">
                  已选择 {selectedFiles.size} 项
                </span>
                <Button variant="outline" size="sm" onClick={resetSelection}>
                  取消
                </Button>
                <Button variant="outline" size="sm" leftIcon={<Download />}>
                  下载
                </Button>
                <Button variant="destructive" size="sm" leftIcon={<Trash2 />}>
                  删除
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<FolderPlus className="h-3.5 w-3.5" />}
                >
                  新建文件夹
                </Button>
                <Button size="sm" leftIcon={<Upload className="h-3.5 w-3.5" />}>
                  上传文件
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 概览面板 */}
        <div className="page-panel">
          <div className="page-panel-header">
            <h2 className="page-panel-title">概览</h2>
            <p className="page-panel-description">存储使用与关键指标</p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="p-3 rounded-md border border-border bg-surface-75/60">
                <p className="text-[11px] text-foreground-muted mb-1">
                  总文件数
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {stats.total}
                </p>
                <p className="text-[11px] text-foreground-muted">
                  {stats.starred} 已收藏
                </p>
              </div>
              <div className="p-3 rounded-md border border-border bg-surface-75/60">
                <p className="text-[11px] text-foreground-muted mb-1">
                  已索引
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {stats.indexed}
                </p>
                <p className="text-[11px] text-foreground-muted">
                  {Math.round((stats.indexed / stats.total) * 100)}% 覆盖率
                </p>
              </div>
              <div className="p-3 rounded-md border border-border bg-surface-75/60">
                <p className="text-[11px] text-foreground-muted mb-1">知识库</p>
                <p className="text-lg font-semibold text-foreground">
                  {stats.knowledgeBases}
                </p>
                <p className="text-[11px] text-foreground-muted">
                  {(stats.totalVectors / 1000).toFixed(1)}k 向量
                </p>
              </div>
              <div className="p-3 rounded-md border border-border bg-surface-75/60">
                <p className="text-[11px] text-foreground-muted mb-1">
                  存储使用
                </p>
                <p className="text-lg font-semibold text-brand-500">
                  {Math.round((storageUsage.used / storageUsage.limit) * 100)}%
                </p>
                <p className="text-[11px] text-foreground-muted">
                  {storageUsage.used} / {storageUsage.limit} GB
                </p>
              </div>
            </div>

            {/* 最近更新 */}
            {mostRecentFile && (
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-medium text-foreground-muted uppercase tracking-wide">
                    最近更新
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
                            已索引
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-foreground-light">
                        {mostRecentFile.size} · 上传于 {mostRecentFile.uploadedAt}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 ml-4"
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                  >
                    预览
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 文件列表面板 */}
        <div className="page-panel">
          <div className="page-panel-header flex items-center justify-between">
            <div>
              <h2 className="page-panel-title">
                {activeFolder?.name || "文件"}
              </h2>
              <p className="page-panel-description">
                {sortedFiles.length} 个文件
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
                  选择
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

          {/* 工具栏 */}
          <div className="px-4 py-3 border-b border-border flex items-center gap-3">
            <Input
              placeholder="搜索文件..."
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

          {/* 拖拽上传区域 */}
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
            {/* 拖拽上传覆盖层 */}
            {isDragging && (
              <div className="absolute inset-4 z-20 rounded-md border-2 border-dashed border-brand-500 bg-background-overlay flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <Upload className="w-8 h-8 text-brand-500 mx-auto mb-2" />
                  <p className="text-[13px] font-medium text-foreground">
                    释放文件以上传
                  </p>
                </div>
              </div>
            )}

            {/* 列表视图 */}
            {sortedFiles.length > 0 && viewMode === "list" && (
              <div>
                {/* 表头 */}
                <div className="hidden lg:grid grid-cols-[1fr_80px_100px_120px_80px] gap-4 px-4 py-2 border-b border-border text-[11px] font-medium text-foreground-muted uppercase tracking-wide">
                  {isSelectionMode && <span className="w-5" />}
                  <span>文件名</span>
                  <span>大小</span>
                  <span>更新时间</span>
                  <span>知识库</span>
                  <span className="text-right">操作</span>
                </div>
                {/* 列表项 */}
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
                        {/* 文件信息 */}
                        <div className="flex items-center gap-3 min-w-0">
                          {isSelectionMode && (
                            <Checkbox
                              aria-label={`选择 ${file.name}`}
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
                                  索引
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-foreground-light truncate">
                              上传于 {file.uploadedAt}
                            </p>
                          </div>
                        </div>

                        {/* 大小 */}
                        <div className="hidden lg:flex items-center text-[11px] text-foreground-light">
                          {file.size}
                        </div>

                        {/* 更新时间 */}
                        <div className="hidden lg:flex items-center text-[11px] text-foreground-light">
                          {file.updatedAt}
                        </div>

                        {/* 知识库 */}
                        <div className="hidden lg:flex items-center text-[11px] text-foreground-light">
                          {file.knowledgeBase || "-"}
                        </div>

                        {/* 操作 */}
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
                                预览
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                icon={<Edit3 />}
                                className="cursor-pointer"
                              >
                                重命名
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                icon={<Star />}
                                className="cursor-pointer"
                              >
                                {file.starred ? "取消收藏" : "收藏"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                icon={<Brain />}
                                className="cursor-pointer"
                              >
                                添加到知识库
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                icon={<Share2 />}
                                className="cursor-pointer"
                              >
                                分享
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                icon={<LinkIcon />}
                                className="cursor-pointer"
                              >
                                复制链接
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                destructive
                                icon={<Trash2 />}
                                className="cursor-pointer"
                              >
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* 移动端信息 */}
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

            {/* 网格视图 */}
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
                          aria-label={`选择 ${file.name}`}
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
                            索引
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
                        <span>{file.knowledgeBase || "未索引"}</span>
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

            {/* 空状态 */}
            {sortedFiles.length === 0 && (
              <div className="px-4 py-12 text-center">
                <div className="w-12 h-12 rounded-md bg-surface-200/80 border border-border flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="w-5 h-5 text-foreground-muted" />
                </div>
                <h3 className="text-[13px] font-medium text-foreground mb-1">
                  {searchQuery ? "没有找到匹配的文件" : "还没有文件"}
                </h3>
                <p className="text-[11px] text-foreground-light mb-4 max-w-xs mx-auto">
                  {searchQuery
                    ? "尝试使用其他关键词"
                    : "拖拽文件到此处或点击上传开始构建知识库"}
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
                    清除筛选
                  </Button>
                ) : (
                  <Button size="sm" leftIcon={<Upload className="w-3.5 h-3.5" />}>
                    上传文件
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
