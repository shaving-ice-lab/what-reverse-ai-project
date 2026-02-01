"use client";

/**
 * 文件库/知识库页面 - Supabase 风格
 * 管理上传的文件、知识库和向量数据
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { EmptyState, Card } from "@/components/dashboard/supabase-ui";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import { Button } from "@/components/ui/button";
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
  MoreHorizontal,
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
  ChevronDown,
  Check,
  Eye,
  Edit3,
  Link as LinkIcon,
  RefreshCw,
  Filter,
  SortAsc,
  HardDrive,
  FolderPlus,
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

// 获取文件颜色
const getFileColor = (type: string) => {
  switch (type) {
    case "document":
      return "text-brand-500 bg-brand-200/70";
    case "image":
      return "text-foreground-light bg-surface-200";
    case "code":
      return "text-brand-500 bg-surface-200";
    case "spreadsheet":
      return "text-brand-500 bg-surface-200";
    default:
      return "text-foreground-muted bg-surface-200";
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

export default function FilesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showKnowledgeBases, setShowKnowledgeBases] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // 筛选文件
  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchQuery.toLowerCase());
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
    if (filteredFiles.length === 0) {
      return;
    }
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

  const storagePercent = Math.min(
    100,
    Math.round((storageUsage.used / storageUsage.limit) * 100)
  );

  const activeFolder = folders.find((folder) => folder.id === selectedFolder);

  const listGridClass = isSelectionMode
    ? "grid-cols-[24px_minmax(220px,2fr)_120px_140px_160px_120px]"
    : "grid-cols-[minmax(240px,2fr)_120px_140px_160px_120px]";

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="文件"
          description="集中管理上传文件、知识库索引和向量数据。"
          actions={
            isSelectionMode ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" size="sm">
                  已选择 {selectedFiles.size} 项
                </Badge>
                <Button variant="outline" size="sm" onClick={resetSelection}>
                  取消选择
                </Button>
                <Button variant="outline" size="sm" leftIcon={<Download />}>
                  下载
                </Button>
                <Button variant="destructive" size="sm" leftIcon={<Trash2 />}>
                  删除
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button size="sm" leftIcon={<Upload />}>
                  上传文件
                </Button>
                <Button variant="outline" size="sm" leftIcon={<FolderPlus />}>
                  新建文件夹
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Check />}
                  onClick={() => setIsSelectionMode(true)}
                >
                  选择
                </Button>
              </div>
            )
          }
        >
          <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
            <span className="inline-flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5" />
              {activeFolder?.name || "全部文件"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              {storageUsage.used} / {storageUsage.limit} GB
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              {filteredFiles.length} 个文件
            </span>
          </div>
        </PageHeader>

        <div className="page-divider" />

        <div className="flex min-h-[640px] gap-6">
          {/* 左侧边栏 */}
          <aside className="w-[280px] shrink-0 space-y-4">
        <div className="page-panel overflow-hidden">
          <div className="p-4 border-b border-border space-y-2">
            <Button size="sm" className="w-full" leftIcon={<Upload />}>
              上传文件
            </Button>
            <Button variant="outline" size="sm" className="w-full" leftIcon={<FolderPlus />}>
              新建文件夹
            </Button>
          </div>

          <div className="p-3">
            <div className="page-caption px-2 pb-2">文件夹</div>
            <nav className="space-y-0.5">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-2 rounded-md text-[13px] transition-colors relative",
                    selectedFolder === folder.id
                      ? "bg-surface-200 text-foreground before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-[2px] before:rounded-full before:bg-brand-500"
                      : "text-foreground-light hover:bg-surface-100 hover:text-foreground"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {folder.id === "all" ? (
                      <HardDrive className="w-4 h-4" />
                    ) : (
                      <Folder className="w-4 h-4" />
                    )}
                    {folder.name}
                  </span>
                  <span className="text-xs text-foreground-muted">{folder.count}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="border-t border-border">
            <button
              onClick={() => setShowKnowledgeBases(!showKnowledgeBases)}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-medium text-foreground-muted uppercase tracking-wider hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                知识库
              </span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform",
                  !showKnowledgeBases && "-rotate-90"
                )}
              />
            </button>

            {showKnowledgeBases && (
              <div className="p-3 space-y-2">
                {knowledgeBases.map((kb) => (
                  <Card
                    key={kb.id}
                    padding="sm"
                    hover
                    className="bg-surface-75/80"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium text-foreground">
                        {kb.name}
                      </span>
                      {kb.status === "indexing" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-brand-500">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          索引中
                        </span>
                      ) : (
                        <Badge variant="secondary" size="xs">
                          活跃
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-foreground-light line-clamp-2 mt-1">
                      {kb.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-foreground-muted mt-2">
                      <span className="flex items-center gap-1">
                        <File className="w-3 h-3" />
                        {kb.fileCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        {(kb.vectorCount / 1000).toFixed(1)}k
                      </span>
                    </div>
                  </Card>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-foreground-light hover:text-foreground"
                  leftIcon={<Plus />}
                >
                  新建知识库
                </Button>
              </div>
            )}
          </div>

          <div className="border-t border-border p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground-muted">存储使用</span>
              <span className="text-foreground font-medium">
                {storageUsage.used} / {storageUsage.limit} GB
              </span>
            </div>
            <Progress value={storagePercent} size="sm" className="mt-2" />
            <div className="mt-3 space-y-1">
              {storageUsage.breakdown.map((item) => (
                <span
                  key={item.type}
                  className="flex items-center justify-between text-xs text-foreground-muted"
                >
                  <span className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", item.color)} />
                    {item.type}
                  </span>
                  <span>{item.size} GB</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 min-w-0 flex flex-col gap-4">

        <div className="page-panel flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="page-panel-header flex items-center justify-between gap-4">
            <div>
              <h2 className="page-panel-title">
                {activeFolder?.name || "文件列表"}
              </h2>
              <p className="page-panel-description">
                共 {filteredFiles.length} 个文件
              </p>
            </div>
          </div>

          <div className="px-4 py-3 border-b border-border bg-surface-75/70 flex flex-wrap items-center gap-3">
            <div className="min-w-[220px] flex-1">
              <Input
                variant="search"
                inputSize="sm"
                leftIcon={<Search className="w-4 h-4" />}
                placeholder="搜索文件..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" leftIcon={<Filter />}>
              筛选
            </Button>
            <Button variant="outline" size="sm" leftIcon={<SortAsc />}>
              排序
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <div className="inline-flex items-center rounded-md border border-border bg-surface-100 p-0.5">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-1.5 rounded-sm transition-colors",
                    viewMode === "grid"
                      ? "bg-surface-200 text-foreground"
                      : "text-foreground-muted hover:bg-surface-200 hover:text-foreground"
                  )}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-1.5 rounded-sm transition-colors",
                    viewMode === "list"
                      ? "bg-surface-200 text-foreground"
                      : "text-foreground-muted hover:bg-surface-200 hover:text-foreground"
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "relative flex-1 overflow-auto",
              isDragging && "bg-surface-75/50"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              // 处理文件上传
            }}
          >
            {isDragging && (
              <div className="absolute inset-4 z-20 rounded-md border-2 border-dashed border-brand-500 bg-background-overlay flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <Upload className="w-10 h-10 text-brand-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">
                    释放文件以上传
                  </p>
                  <p className="text-xs text-foreground-light mt-1">
                    支持多种文件格式与批量上传
                  </p>
                </div>
              </div>
            )}

            {filteredFiles.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title={searchQuery ? "没有找到匹配的文件" : "还没有文件"}
                description={
                  searchQuery
                    ? "尝试其他关键词或调整筛选条件。"
                    : "拖拽文件到此处或点击上传开始构建知识库。"
                }
                action={
                  searchQuery
                    ? undefined
                    : {
                        label: "上传文件",
                        onClick: () => undefined,
                        icon: Upload,
                      }
                }
              />
            ) : viewMode === "list" ? (
              <div className="min-w-[760px]">
                <div
                  className={cn(
                    "grid items-center gap-3 px-4 py-2 text-table-header border-b border-border bg-surface-75/80",
                    listGridClass
                  )}
                >
                  {isSelectionMode && (
                    <Checkbox
                      aria-label="全选"
                      checked={
                        filteredFiles.length > 0 &&
                        selectedFiles.size === filteredFiles.length
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  )}
                  <div>名称</div>
                  <div>大小</div>
                  <div>更新时间</div>
                  <div>知识库</div>
                  <div className="text-right">操作</div>
                </div>

                <div className="divide-y divide-border">
                  {filteredFiles.map((file) => {
                    const FileIcon = getFileIcon(file.type);
                    const fileColor = getFileColor(file.type);
                    const isSelected = selectedFiles.has(file.id);

                    return (
                      <div
                        key={file.id}
                        className={cn(
                          "group grid items-center gap-3 px-4 py-2.5 text-[13px] transition-colors",
                          listGridClass,
                          isSelected
                            ? "bg-brand-200/25"
                            : "hover:bg-surface-100",
                          isSelectionMode ? "cursor-pointer" : "cursor-default"
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
                      onClick={(event) => event.stopPropagation()}
                          />
                        )}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-md flex items-center justify-center",
                              fileColor
                            )}
                          >
                            <FileIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground truncate">
                                {file.name}
                              </span>
                              {file.starred && (
                                <Star className="w-3.5 h-3.5 text-brand-500 fill-brand-500 shrink-0" />
                              )}
                              {file.indexed && (
                                <Badge variant="primary" size="xs">
                                  已索引
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-foreground-muted mt-0.5">
                              上传于 {file.uploadedAt}
                            </p>
                          </div>
                        </div>
                        <div className="text-foreground-light">{file.size}</div>
                        <div className="text-foreground-light">
                          {file.updatedAt}
                        </div>
                        <div>
                          {file.knowledgeBase ? (
                            <Badge variant="secondary" size="xs">
                              {file.knowledgeBase}
                            </Badge>
                          ) : (
                            <span className="text-xs text-foreground-muted">
                              -
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(event) => event.stopPropagation()}
                            className="p-1.5 rounded-md hover:bg-surface-200 text-foreground-muted hover:text-foreground transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                onClick={(event) => event.stopPropagation()}
                                className="p-1.5 rounded-md hover:bg-surface-200 text-foreground-muted hover:text-foreground transition-colors"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-48 bg-surface-100 border-border"
                            >
                              <DropdownMenuItem icon={<Eye />}>
                                预览
                              </DropdownMenuItem>
                              <DropdownMenuItem icon={<Edit3 />}>
                                重命名
                              </DropdownMenuItem>
                              <DropdownMenuItem icon={<Star />}>
                                {file.starred ? "取消收藏" : "收藏"}
                              </DropdownMenuItem>
                              <DropdownMenuItem icon={<Brain />}>
                                添加到知识库
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem icon={<Share2 />}>
                                分享
                              </DropdownMenuItem>
                              <DropdownMenuItem icon={<LinkIcon />}>
                                复制链接
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                destructive
                                icon={<Trash2 />}
                              >
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="page-grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-4">
                {filteredFiles.map((file) => {
                  const FileIcon = getFileIcon(file.type);
                  const fileColor = getFileColor(file.type);
                  const isSelected = selectedFiles.has(file.id);

                  return (
                    <Card
                      key={file.id}
                      hover
                      className={cn(
                        "relative group",
                        isSelected && "border-brand-400 bg-brand-200/20"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-md flex items-center justify-center",
                            fileColor
                          )}
                        >
                          <FileIcon className="w-5 h-5" />
                        </div>
                        {isSelectionMode && (
                          <Checkbox
                            aria-label={`选择 ${file.name}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(file.id)}
                            onClick={(event) => event.stopPropagation()}
                          />
                        )}
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-[13px] font-medium text-foreground truncate">
                            {file.name}
                          </h4>
                          {file.starred && (
                            <Star className="w-3.5 h-3.5 text-brand-500 fill-brand-500 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-foreground-muted">
                          <span>{file.size}</span>
                          <span>•</span>
                          <span>{file.updatedAt}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {file.indexed && (
                            <Badge variant="primary" size="xs">
                              已索引
                            </Badge>
                          )}
                          {file.knowledgeBase && (
                            <Badge variant="secondary" size="xs">
                              {file.knowledgeBase}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded-md hover:bg-surface-200 text-foreground-muted hover:text-foreground transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded-md hover:bg-surface-200 text-foreground-muted hover:text-foreground transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-44 bg-surface-100 border-border"
                          >
                            <DropdownMenuItem icon={<Eye />}>
                              预览
                            </DropdownMenuItem>
                            <DropdownMenuItem icon={<Edit3 />}>
                              重命名
                            </DropdownMenuItem>
                            <DropdownMenuItem icon={<Star />}>
                              {file.starred ? "取消收藏" : "收藏"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              destructive
                              icon={<Trash2 />}
                            >
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      </div>
    </div>
    </PageContainer>
  );
}
