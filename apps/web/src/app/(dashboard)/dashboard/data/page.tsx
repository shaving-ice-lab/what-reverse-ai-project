"use client";

/**
 * 数据管理页面
 * 导入、导出和管理用户数据
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

// 数据类型配置
const dataTypes = {
  workflows: {
    label: "工作流",
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
    label: "对话记录",
    icon: MessageSquare,
    color: "text-brand-500",
    bg: "bg-brand-200",
    count: 156,
    size: "15.6 MB",
  },
  settings: {
    label: "设置",
    icon: Settings,
    color: "text-foreground-muted",
    bg: "bg-surface-200",
    count: 1,
    size: "0.2 MB",
  },
  files: {
    label: "上传文件",
    icon: FolderOpen,
    color: "text-brand-500",
    bg: "bg-brand-200",
    count: 45,
    size: "128.5 MB",
  },
};

// 导出格式
const exportFormats = [
  { id: "json", label: "JSON", icon: FileJson, description: "通用数据格式" },
  { id: "csv", label: "CSV", icon: Table, description: "表格数据" },
  { id: "markdown", label: "Markdown", icon: FileText, description: "文档格式" },
  { id: "zip", label: "ZIP 压缩包", icon: Archive, description: "完整备份" },
];

// 导出历史
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
    error: "存储空间不足",
    createdAt: "2026-01-29T09:15:00Z",
  },
];

// 状态配置
const statusConfig = {
  completed: {
    label: "已完成",
    icon: CheckCircle2,
    color: "text-brand-500",
    bg: "bg-brand-200",
  },
  processing: {
    label: "处理中",
    icon: Loader2,
    color: "text-foreground-light",
    bg: "bg-surface-200",
  },
  failed: {
    label: "失败",
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive-200",
  },
  expired: {
    label: "已过期",
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

  // 计算总大小
  const totalSize = Object.entries(dataTypes)
    .filter(([key]) => selectedTypes.includes(key))
    .reduce((sum, [, config]) => sum + parseFloat(config.size), 0);

  // 存储使用情况
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
    { label: "全部", value: "all", count: exportHistory.length },
    { label: "已完成", value: "completed", count: historyCounts.completed },
    { label: "处理中", value: "processing", count: historyCounts.processing },
    { label: "失败", value: "failed", count: historyCounts.failed },
  ];

  const filteredHistory =
    historyTab === "all"
      ? exportHistory
      : exportHistory.filter((item) => item.status === historyTab);

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
        title="数据管理"
        description="导入、导出和管理您的所有数据"
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
              导入数据
            </Button>
            <Button size="sm" className="bg-brand-500 hover:bg-brand-600 text-background">
              <Download className="w-4 h-4 mr-2" />
              新建导出
            </Button>
          </>
        }
      />

        <div className="page-divider" />

        {/* 存储使用情况 */}
        <div className="page-panel">
          <div className="page-panel-header flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-brand-200">
                <HardDrive className="w-4 h-4 text-brand-500" />
              </div>
              <div>
                <h2 className="page-panel-title">存储使用情况</h2>
                <p className="page-panel-description">
                  已使用 {storageUsed} MB / {storageTotal} MB
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
              {storagePercent.toFixed(1)}% 已用
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
          {/* 导出数据 */}
          <div className="page-panel">
            <div className="page-panel-header flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-brand-500" />
                <div>
                  <h2 className="page-panel-title">导出数据</h2>
                  <p className="page-panel-description">选择需要导出的数据与格式</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-surface-200 text-foreground-light">
                已选 {selectedTypes.length} 项
              </Badge>
            </div>

            <div className="p-6 space-y-6">
              {/* 选择数据类型 */}
              <div className="space-y-2">
                <p className="text-xs text-foreground-muted">选择要导出的数据</p>
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
                            {config.count} 项 · {config.size}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 选择格式 */}
              <div className="space-y-3">
                <p className="text-xs text-foreground-muted">选择导出格式</p>
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

              {/* 导出按钮 */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <p className="text-[13px] text-foreground-light">
                  预计大小: <span className="font-medium text-foreground">{totalSize.toFixed(1)} MB</span>
                </p>
                <Button
                  onClick={handleExport}
                  disabled={selectedTypes.length === 0 || isExporting}
                  className="bg-brand-500 hover:bg-brand-600 text-background"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      导出中...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      开始导出
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* 导入数据 */}
          <div className="page-panel">
            <div className="page-panel-header flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-brand-500" />
                <div>
                  <h2 className="page-panel-title">导入数据</h2>
                  <p className="page-panel-description">支持 JSON、CSV、ZIP</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-surface-200 text-foreground-light">
                安全校验
              </Badge>
            </div>

            <div className="p-6 space-y-6">
            {/* 上传区域 */}
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
                    拖拽文件到此处，或点击上传
                  </p>
                  <p className="text-[13px] text-foreground-light">
                    支持 JSON、CSV、ZIP 格式
                  </p>
                </>
              )}
            </div>

            {/* 导入选项 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 rounded-md border border-border bg-surface-75/60 px-3 py-2 text-[13px] text-foreground">
                <Checkbox id="merge" />
                合并现有数据（不覆盖）
              </label>
              <label className="flex items-center gap-2 rounded-md border border-border bg-surface-75/60 px-3 py-2 text-[13px] text-foreground">
                <Checkbox id="validate" defaultChecked />
                导入前验证数据
              </label>
            </div>

            {/* 导入按钮 */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
              {importFile && (
                <Button
                  variant="outline"
                  onClick={() => setImportFile(null)}
                  className="border-border-muted text-foreground-light"
                >
                  取消
                </Button>
              )}
              <Button disabled={!importFile} className="bg-brand-500 hover:bg-brand-600 text-background">
                <Upload className="w-4 h-4 mr-2" />
                开始导入
              </Button>
            </div>

            {/* 警告提示 */}
            <div className="flex items-start gap-2 p-3 rounded-md border border-warning/30 bg-warning-200/60">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-foreground-light">
                导入会修改现有配置。建议在导入前先导出当前数据作为备份。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 导出历史 */}
      <div className="page-panel">
        <div className="page-panel-header space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="page-panel-title">导出历史</h2>
              <p className="page-panel-description">最近 7 天内的导出记录</p>
            </div>
            <div className="page-toolbar">
              <Input
                placeholder="搜索导出记录"
                inputSize="sm"
                variant="search"
                className="w-[200px]"
                leftIcon={<Search className="h-4 w-4" />}
              />
              <Select defaultValue="7d">
                <SelectTrigger className="h-8 w-[130px] text-[12px]">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-foreground-muted" />
                    <SelectValue placeholder="时间范围" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">过去 24 小时</SelectItem>
                  <SelectItem value="7d">过去 7 天</SelectItem>
                  <SelectItem value="30d">过去 30 天</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="border-border-muted text-foreground-light"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                清理过期
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
              title="暂无导出记录"
              description="当前筛选条件下没有导出记录"
              action={{ label: "新建导出", onClick: handleExport, icon: Download }}
            />
          ) : (
            <div className="overflow-hidden rounded-md border border-border bg-surface-75/50">
              <div className="divide-y divide-border">
                {filteredHistory.map((item) => {
                  const status = statusConfig[item.status as keyof typeof statusConfig];
                  const StatusIcon = status.icon;
                  const typeConfig = dataTypes[item.type as keyof typeof dataTypes] || {
                    label: "完整备份",
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
                            {item.expiresAt && ` · 过期于 ${formatDate(item.expiresAt)}`}
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
                            下载
                          </Button>
                        )}
                        {item.status === "failed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-border-muted text-foreground-light"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            重试
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

      {/* 数据安全提示 */}
      <div className="page-panel border-brand-400/30 bg-brand-200/40">
        <div className="p-6 flex items-start gap-4">
          <div className="p-2 rounded-md bg-brand-500">
            <Shield className="w-5 h-5 text-background" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-foreground mb-1">数据安全</h3>
            <p className="text-[13px] text-foreground-light mb-4">
              所有导出的数据都经过加密处理。导出文件将在 7 天后自动删除，请及时下载。
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" className="border-border-muted text-foreground-light">
                了解数据安全政策
              </Button>
              <Button variant="outline" size="sm" className="border-border-muted text-foreground-light">
                管理数据保留设置
              </Button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </PageContainer>
  );
}
