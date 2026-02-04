"use client";

/**
 * 数据导出页面 - Supabase 风格

 * 导出用户数据、工作流、对话等
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import {
  Download,

  FileJson,

  FileText,

  FileSpreadsheet,

  Archive,

  Clock,

  CheckCircle2,

  Loader2,

  AlertCircle,

  Zap,

  Bot,

  MessageSquare,

  FolderOpen,

  Settings,

  User,

  Database,

  Calendar,

  Info,

  ChevronDown,

  Shield,

  RefreshCw,
} from "lucide-react";

import {
  DropdownMenu,

  DropdownMenuContent,

  DropdownMenuItem,

  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 可导出数据类型

const exportableData = [

  {
    id: "workflows",

    title: "工作流",

    description: "所有工作流配置和执行历史",

    icon: Zap,

    color: "text-warning",

    bgColor: "bg-warning-200",

    count: 24,

    size: "~2.3 MB",

  },

  {
    id: "agents",

    title: "AI Agents",

    description: "自定义 Agent 配置和对话模板",

    icon: Bot,

    color: "text-foreground-light",

    bgColor: "bg-surface-200",

    count: 8,

    size: "~1.1 MB",

  },

  {
    id: "conversations",

    title: "对话历史",

    description: "所有对话记录和消息",

    icon: MessageSquare,

    color: "text-brand-500",

    bgColor: "bg-brand-200",

    count: 156,

    size: "~8.5 MB",

  },

  {
    id: "files",

    title: "文件库",

    description: "上传的文档和知识库文件",

    icon: FolderOpen,

    color: "text-brand-500",

    bgColor: "bg-brand-200",

    count: 42,

    size: "~45.2 MB",

  },

  {
    id: "settings",

    title: "设置与偏好",

    description: "账户设置、通知偏好等",

    icon: Settings,

    color: "text-foreground-light",

    bgColor: "bg-surface-200",

    count: 1,

    size: "~0.1 MB",

  },

  {
    id: "profile",

    title: "个人资料",

    description: "用户信息和账户数据",

    icon: User,

    color: "text-foreground-light",

    bgColor: "bg-surface-200",

    count: 1,

    size: "~0.05 MB",

  },

];

// 导出格式

const exportFormats = [

  { id: "json", label: "JSON", icon: FileJson, description: "结构化数据格式" },

  { id: "csv", label: "CSV", icon: FileSpreadsheet, description: "表格数据格式" },

  { id: "txt", label: "TXT", icon: FileText, description: "纯文本格式" },

  { id: "zip", label: "ZIP 打包", icon: Archive, description: "压缩包格式" },

];

// 历史导出记录

const exportHistory = [

  {
    id: "1",

    name: "完整数据备份",

    items: ["workflows", "agents", "conversations", "files"],

    format: "zip",

    size: "52.3 MB",

    status: "completed",

    createdAt: "2026-01-28 14:30",

    expiresAt: "2026-02-04",

  },

  {
    id: "2",

    name: "工作流导出",

    items: ["workflows"],

    format: "json",

    size: "2.1 MB",

    status: "completed",

    createdAt: "2026-01-25 10:15",

    expiresAt: "2026-02-01",

  },

  {
    id: "3",

    name: "对话记录导出",

    items: ["conversations"],

    format: "csv",

    size: "5.8 MB",

    status: "expired",

    createdAt: "2026-01-15 09:00",

    expiresAt: "2026-01-22",

  },

];

// 状态配置

const statusConfig = {
  pending: { label: "准备中", color: "text-warning", bg: "bg-warning-200", icon: Clock },

  processing: { label: "处理中", color: "text-foreground-light", bg: "bg-surface-200", icon: Loader2 },

  completed: { label: "已完成", color: "text-brand-500", bg: "bg-brand-200", icon: CheckCircle2 },

  failed: { label: "失败", color: "text-destructive", bg: "bg-destructive-200", icon: AlertCircle },

  expired: { label: "已过期", color: "text-foreground-muted", bg: "bg-surface-200", icon: Clock },
};

export default function ExportPage() {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(["workflows", "agents"]));

  const [selectedFormat, setSelectedFormat] = useState("json");

  const [isExporting, setIsExporting] = useState(false);

  const [exportProgress, setExportProgress] = useState(0);

  const [dateRange, setDateRange] = useState("all");

  // 切换选择

  const toggleItem = (id: string) => {
    const newSelected = new Set(selectedItems);

    if (newSelected.has(id)) {
      newSelected.delete(id);

    } else {
      newSelected.add(id);

    }

    setSelectedItems(newSelected);

  };

  // 全选/取消全选

  const toggleSelectAll = () => {
    if (selectedItems.size === exportableData.length) {
      setSelectedItems(new Set());

    } else {
      setSelectedItems(new Set(exportableData.map((item) => item.id)));

    }

  };

  // 计算总大小

  const calculateTotalSize = () => {
    let total = 0;

    selectedItems.forEach((id) => {
      const item = exportableData.find((d) => d.id === id);

      if (item) {
        const sizeStr = item.size.replace("~", "").replace(" MB", "");

        total += parseFloat(sizeStr);

      }

    });

    return total.toFixed(1);

  };

  // 开始导出

  const handleExport = async () => {
    if (selectedItems.size === 0) return;

    setIsExporting(true);

    setExportProgress(0);

    // 模拟导出进度

    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      setExportProgress(i);

    }

    setIsExporting(false);

    setExportProgress(0);

  };

  return (
    <PageContainer>
      <p className="page-caption">Data</p>
      <PageHeader
        title="数据导出"
        description="导出您的数据进行备份或迁移"
        actions={(
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-border text-foreground-light hover:text-foreground"
            >
              <Info className="w-4 h-4" />
              导出说明
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-border text-foreground-light hover:text-foreground"
            >
              <Download className="w-4 h-4" />
              导出历史
            </Button>
          </div>
        )}
      />

      <div className="max-w-6xl mx-auto">

        <div className="page-grid lg:grid-cols-[minmax(0,1fr)_320px]">

          {/* 左侧 - 数据选择 */}

          <div className="page-section">

            {/* 选择要导出的数据 */}

            <div className="page-panel overflow-hidden">

              <div className="page-panel-header flex items-center justify-between">
                <div>
                  <h2 className="page-panel-title">选择要导出的数据</h2>
                  <p className="page-panel-description mt-1">选择需要备份或迁移的项目数据</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="text-foreground-light hover:text-foreground"
                >
                  {selectedItems.size === exportableData.length ? "取消全选" : "全选"}
                </Button>
              </div>

              <div className="divide-y divide-border">

                {exportableData.map((item) => {
                  const Icon = item.icon;

                  const isSelected = selectedItems.has(item.id);

                  return (
                    <label

                      key={item.id}

                      className={cn(
                        "flex items-center gap-4 px-5 py-3 cursor-pointer transition-colors",
                        isSelected ? "bg-surface-75" : "hover:bg-surface-100"
                      )}

                    >

                      <Checkbox

                        checked={isSelected}

                        onCheckedChange={() => toggleItem(item.id)}

                      />

                      <div className={cn("w-9 h-9 rounded-md flex items-center justify-center shrink-0", item.bgColor)}>

                        <Icon className={cn("w-4 h-4", item.color)} />

                      </div>

                      <div className="flex-1 min-w-0">

                        <div className="flex items-center gap-2">

                          <h3 className="text-[13px] font-medium text-foreground">{item.title}</h3>

                          <Badge variant="secondary" className="text-[10px] bg-surface-200 text-foreground-muted">

                            {item.count} 项

                          </Badge>

                        </div>

                        <p className="text-[13px] text-foreground-light">{item.description}</p>

                      </div>

                      <span className="text-[12px] text-foreground-light shrink-0 tabular-nums">{item.size}</span>

                    </label>

                  );

                })}

              </div>
              <div className="flex items-center justify-between px-5 py-3 text-[12px] text-foreground-muted bg-surface-75 border-t border-border">
                <span>已选择 {selectedItems.size} 项</span>
                <span className="tabular-nums">预估 ~{calculateTotalSize()} MB</span>
              </div>

            </div>

            {/* 导出设置 */}

            <div className="page-panel">

              <div className="page-panel-header">
                <h2 className="page-panel-title">导出设置</h2>
                <p className="page-panel-description mt-1">设置导出格式和时间范围</p>
              </div>

              <div className="p-6 space-y-5">

                {/* 导出格式 */}

                <div>

                  <label className="block text-[13px] font-medium text-foreground mb-2">

                    导出格式

                  </label>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">

                    {exportFormats.map((format) => {
                      const Icon = format.icon;
                      const isActive = selectedFormat === format.id;

                      return (
                        <button
                          key={format.id}
                          onClick={() => setSelectedFormat(format.id)}
                          aria-pressed={isActive}
                          className={cn(
                            "group rounded-md border px-3 py-2 text-left transition-colors",
                            isActive
                              ? "border-brand-500/60 bg-brand-200/30"
                              : "border-border bg-surface-75 hover:border-border-strong hover:bg-surface-100"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-md flex items-center justify-center",
                                isActive ? "bg-brand-200/70 text-brand-500" : "bg-surface-200 text-foreground-muted"
                              )}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-[13px] font-medium text-foreground">{format.label}</div>
                              <div className="text-[11px] text-foreground-muted">{format.description}</div>
                            </div>
                          </div>
                        </button>
                      );

                    })}

                  </div>

                </div>

                {/* 时间范围 */}

                <div>

                  <label className="block text-[13px] font-medium text-foreground mb-2">

                    时间范围

                  </label>

                  <DropdownMenu>

                    <DropdownMenuTrigger asChild>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-between border-border bg-surface-100 text-foreground-light hover:text-foreground"
                      >

                        <span className="flex items-center gap-2">

                          <Calendar className="w-4 h-4" />

                          {dateRange === "all" ? "全部数据" :

                           dateRange === "30d" ? "最近 30 天" :

                           dateRange === "90d" ? "最近 90 天" : "最近 1 年"}

                        </span>

                        <ChevronDown className="w-4 h-4" />

                      </Button>

                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="w-full">

                      <DropdownMenuItem onClick={() => setDateRange("all")}>全部数据</DropdownMenuItem>

                      <DropdownMenuItem onClick={() => setDateRange("30d")}>最近 30 天</DropdownMenuItem>

                      <DropdownMenuItem onClick={() => setDateRange("90d")}>最近 90 天</DropdownMenuItem>

                      <DropdownMenuItem onClick={() => setDateRange("1y")}>最近 1 年</DropdownMenuItem>

                    </DropdownMenuContent>

                  </DropdownMenu>

                </div>

              </div>

            </div>

            {/* 历史导出记录 */}

            <div className="page-panel overflow-hidden">

              <div className="page-panel-header">
                <h2 className="page-panel-title">历史导出记录</h2>
                <p className="page-panel-description mt-1">最近生成的导出任务与下载记录</p>
              </div>

              {exportHistory.length === 0 ? (
                <div className="text-center py-8">

                  <Database className="w-10 h-10 text-foreground-muted mx-auto mb-3" />

                  <p className="text-[13px] text-foreground-light">暂无导出记录</p>

                </div>

              ) : (
                <div className="divide-y divide-border">

                  {exportHistory.map((record) => {
                    const status = statusConfig[record.status as keyof typeof statusConfig];

                    const StatusIcon = status?.icon || Clock;

                    const formatConfig = exportFormats.find((f) => f.id === record.format);

                    const FormatIcon = formatConfig?.icon || FileText;

                    return (
                      <div

                        key={record.id}

                        className="flex items-center gap-4 px-5 py-4 hover:bg-surface-75 transition-colors"

                      >

                        <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center shrink-0">

                          <FormatIcon className="w-4 h-4 text-foreground-muted" />

                        </div>

                        <div className="flex-1 min-w-0">

                          <div className="flex items-center gap-2">

                            <h3 className="text-[13px] font-medium text-foreground">{record.name}</h3>

                            <Badge variant="secondary" className={cn("text-[10px]", status?.bg, status?.color)}>

                              {status?.label}

                            </Badge>

                          </div>

                          <p className="text-[12px] text-foreground-muted mt-1">
                            <span className="tabular-nums">{record.createdAt}</span>
                            <span className="px-2">·</span>
                            <span className="tabular-nums">{record.size}</span>
                          </p>

                        </div>

                        <div className="flex items-center gap-2">
                          <StatusIcon className={cn("w-4 h-4", status?.color)} />
                          {record.status === "completed" && (
                            <Button variant="outline" size="sm" className="border-border text-foreground-light">
                              <Download className="w-4 h-4 mr-1" />
                              下载
                            </Button>
                          )}
                          {record.status === "expired" && (
                            <Button variant="outline" size="sm" className="border-border text-foreground-light">
                              <RefreshCw className="w-4 h-4 mr-1" />
                              重新导出
                            </Button>
                          )}
                        </div>

                      </div>

                    );

                  })}

                </div>

              )}

            </div>

          </div>

          {/* 右侧 - 导出摘要 */}

          <div className="page-section">

            {/* 导出摘要 */}

            <div className="page-panel sticky top-6">

              <div className="page-panel-header">
                <h2 className="page-panel-title">导出摘要</h2>
                <p className="page-panel-description mt-1">确认设置后即可开始导出</p>
              </div>

              <div className="p-6">
                <div className="space-y-3 text-[13px]">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-light">选中项目</span>
                    <span className="font-medium text-foreground">{selectedItems.size} 类数据</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-light">预估大小</span>
                    <span className="font-medium text-foreground tabular-nums">~{calculateTotalSize()} MB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-light">导出格式</span>
                    <span className="font-medium text-foreground uppercase">{selectedFormat}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-light">时间范围</span>
                    <span className="font-medium text-foreground">
                      {dateRange === "all" ? "全部" :
                       dateRange === "30d" ? "30 天" :
                       dateRange === "90d" ? "90 天" : "1 年"}
                    </span>
                  </div>
                </div>

                {isExporting && (
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-[13px] mb-2">
                      <span className="text-foreground-light">导出进度</span>
                      <span className="font-medium text-foreground tabular-nums">{exportProgress}%</span>
                    </div>
                    <Progress value={exportProgress} className="h-1.5" />
                  </div>
                )}

                <Button
                  className="w-full mt-5 bg-brand-500 hover:bg-brand-600 text-background"
                  onClick={handleExport}
                  disabled={selectedItems.size === 0 || isExporting}
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
                <p className="text-xs text-foreground-muted text-center mt-3">
                  导出文件将在 7 天后自动删除
                </p>
              </div>
            </div>

            {/* 提示信息 */}

            <div className="page-panel bg-brand-200/40 border-brand-400/30">
              <div className="p-4 flex items-start gap-3">

                <Info className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />

                <div>

                  <h3 className="text-[13px] font-medium text-foreground mb-1">关于数据导出</h3>

                  <ul className="text-[13px] text-foreground-light space-y-1">

                    <li>• 导出的数据为只读副本</li>

                    <li>• 大文件导出可能需要几分钟</li>

                    <li>• 导出链接有效期为 7 天</li>

                  </ul>

                </div>

              </div>

            </div>

            {/* 数据安全 */}

            <div className="page-panel">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-brand-500" />
                  <h3 className="text-[13px] font-medium text-foreground">数据安全</h3>
                </div>
                <ul className="text-[13px] text-foreground-light space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                    导出文件使用 AES-256 加密
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                    传输过程使用 HTTPS 协议
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                    文件过期后自动删除
                  </li>
                </ul>
              </div>
            </div>

          </div>

        </div>

      </div>

    </PageContainer>

  );
}

