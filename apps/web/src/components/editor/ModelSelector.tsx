"use client";

/**
 * 模型选择器组件
 *
 * 功能：
 * - 显示云端模型列表（OpenAI, Anthropic, Google 等）
 * - 显示本地 Ollama 模型列表
 * - 显示模型安装状态
 * - 显示 Ollama 运行状态
 * - 支持模型下载交互
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Cloud,
  HardDrive,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  ChevronDown,
  Sparkles,
  Bot,
  Zap,
  Globe,
  AlertCircle,
  Info,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ========== 类型定义 ==========

export interface CloudModel {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "google" | "azure" | "ollama";
  description?: string;
  contextLength?: number;
  inputPrice?: number; // per 1M tokens
  outputPrice?: number; // per 1M tokens
  isDefault?: boolean;
}

export interface LocalModel {
  name: string;
  model: string;
  size: number; // bytes
  digest: string;
  modifiedAt: string;
}

export interface OllamaStatus {
  running: boolean;
  version?: string;
  modelsCount: number;
}

export interface ModelSelectorProps {
  /** 当前选中的模型 */
  value?: string;
  /** 模型变化回调 */
  onChange?: (model: string) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 只显示本地模型 */
  localOnly?: boolean;
  /** 只显示云端模型 */
  cloudOnly?: boolean;
  /** 自定义触发器 */
  trigger?: React.ReactNode;
  /** 弹出方向 */
  side?: "top" | "right" | "bottom" | "left";
  /** 对齐方式 */
  align?: "start" | "center" | "end";
  /** 自定义类名 */
  className?: string;
}

// ========== 预设云端模型列表 ==========

const CLOUD_MODELS: CloudModel[] = [
  // OpenAI Models
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "最强多模态模型，支持图像理解",
    contextLength: 128000,
    inputPrice: 5,
    outputPrice: 15,
    isDefault: true,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    description: "性价比最高的智能模型",
    contextLength: 128000,
    inputPrice: 0.15,
    outputPrice: 0.6,
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "openai",
    description: "高性能长上下文模型",
    contextLength: 128000,
    inputPrice: 10,
    outputPrice: 30,
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "openai",
    description: "快速且经济实惠",
    contextLength: 16385,
    inputPrice: 0.5,
    outputPrice: 1.5,
  },
  // Anthropic Models
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    description: "最新最强的 Claude 模型",
    contextLength: 200000,
    inputPrice: 3,
    outputPrice: 15,
  },
  {
    id: "claude-3-opus-20240229",
    name: "Claude 3 Opus",
    provider: "anthropic",
    description: "最强推理能力",
    contextLength: 200000,
    inputPrice: 15,
    outputPrice: 75,
  },
  {
    id: "claude-3-haiku-20240307",
    name: "Claude 3 Haiku",
    provider: "anthropic",
    description: "快速且经济",
    contextLength: 200000,
    inputPrice: 0.25,
    outputPrice: 1.25,
  },
  // Google Models
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "google",
    description: "超长上下文支持",
    contextLength: 2000000,
    inputPrice: 3.5,
    outputPrice: 10.5,
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    provider: "google",
    description: "快速高效",
    contextLength: 1000000,
    inputPrice: 0.075,
    outputPrice: 0.3,
  },
];

// 预设可下载的 Ollama 模型
const DOWNLOADABLE_MODELS = [
  { name: "llama3.2", description: "Meta 最新 Llama 3.2", size: "2GB" },
  { name: "llama3.2:1b", description: "Llama 3.2 1B 轻量版", size: "1.3GB" },
  { name: "llama3.1", description: "Meta Llama 3.1 8B", size: "4.7GB" },
  { name: "mistral", description: "Mistral 7B 高性能", size: "4.1GB" },
  { name: "qwen2.5", description: "通义千问 2.5", size: "4.4GB" },
  { name: "qwen2.5-coder", description: "通义千问代码专用", size: "4.7GB" },
  { name: "phi3", description: "Microsoft Phi-3 小型", size: "2.2GB" },
  { name: "deepseek-coder-v2", description: "深度求索代码模型", size: "8.9GB" },
  { name: "gemma2", description: "Google Gemma 2", size: "5.4GB" },
  { name: "codellama", description: "Meta 代码专用 Llama", size: "3.8GB" },
];

// Provider 图标和颜色映射
const PROVIDER_CONFIG: Record<
  string,
  { icon: typeof Cloud; color: string; bg: string }
> = {
  openai: { icon: Sparkles, color: "text-brand-500", bg: "bg-brand-200/60" },
  anthropic: { icon: Bot, color: "text-foreground-light", bg: "bg-surface-200" },
  google: { icon: Globe, color: "text-foreground-light", bg: "bg-surface-200" },
  azure: { icon: Cloud, color: "text-foreground-light", bg: "bg-surface-200" },
  ollama: { icon: HardDrive, color: "text-brand-500", bg: "bg-brand-200/60" },
};

// ========== 格式化函数 ==========

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const formatContextLength = (tokens: number): string => {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`;
  return tokens.toString();
};

// ========== 组件实现 ==========

export function ModelSelector({
  value,
  onChange,
  disabled = false,
  localOnly = false,
  cloudOnly = false,
  trigger,
  side = "bottom",
  align = "start",
  className,
}: ModelSelectorProps) {
  // 状态
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"cloud" | "local">(
    localOnly ? "local" : "cloud"
  );
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [localModels, setLocalModels] = useState<LocalModel[]>([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [downloadingModels, setDownloadingModels] = useState<
    Map<string, number>
  >(new Map());
  const [deletingModels, setDeletingModels] = useState<Set<string>>(new Set());

  // 检查是否在 Tauri 环境
  const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

  // 检查 Ollama 状态
  const checkOllamaStatus = useCallback(async () => {
    if (!isTauri) {
      setOllamaStatus({ running: false, modelsCount: 0 });
      return;
    }

    setIsLoadingStatus(true);
    try {
      // @ts-ignore - Tauri API
      const { invoke } = await import("@tauri-apps/api/core");
      const status = await invoke("check_ollama_status");
      setOllamaStatus(status as OllamaStatus);
    } catch (error) {
      console.error("Failed to check Ollama status:", error);
      setOllamaStatus({ running: false, modelsCount: 0 });
    } finally {
      setIsLoadingStatus(false);
    }
  }, [isTauri]);

  // 获取本地模型列表
  const loadLocalModels = useCallback(async () => {
    if (!isTauri || !ollamaStatus?.running) {
      setLocalModels([]);
      return;
    }

    setIsLoadingModels(true);
    try {
      // @ts-ignore - Tauri API
      const { invoke } = await import("@tauri-apps/api/core");
      const models = await invoke("list_ollama_models");
      setLocalModels(models as LocalModel[]);
    } catch (error) {
      console.error("Failed to load local models:", error);
      setLocalModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  }, [isTauri, ollamaStatus?.running]);

  // 下载模型
  const downloadModel = useCallback(
    async (modelName: string) => {
      if (!isTauri) return;

      setDownloadingModels((prev) => new Map(prev).set(modelName, 0));

      try {
        // @ts-ignore - Tauri API
        const { invoke } = await import("@tauri-apps/api/core");

        // 模拟进度（实际应该用事件监听）
        const progressInterval = setInterval(() => {
          setDownloadingModels((prev) => {
            const current = prev.get(modelName) || 0;
            if (current < 95) {
              return new Map(prev).set(modelName, current + Math.random() * 10);
            }
            return prev;
          });
        }, 500);

        await invoke("pull_ollama_model", { modelName });

        clearInterval(progressInterval);
        setDownloadingModels((prev) => {
          const newMap = new Map(prev);
          newMap.delete(modelName);
          return newMap;
        });

        toast.success("模型下载完成", {
          description: `${modelName} 已成功安装`,
        });

        // 刷新模型列表
        loadLocalModels();
      } catch (error) {
        setDownloadingModels((prev) => {
          const newMap = new Map(prev);
          newMap.delete(modelName);
          return newMap;
        });
        toast.error("下载失败", {
          description: error instanceof Error ? error.message : "请重试",
        });
      }
    },
    [isTauri, loadLocalModels]
  );

  // 删除模型
  const deleteModel = useCallback(
    async (modelName: string) => {
      if (!isTauri) return;

      setDeletingModels((prev) => new Set(prev).add(modelName));

      try {
        // @ts-ignore - Tauri API
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("delete_ollama_model", { modelName });

        toast.success("模型已删除", {
          description: `${modelName} 已从本地移除`,
        });

        // 刷新模型列表
        loadLocalModels();
      } catch (error) {
        toast.error("删除失败", {
          description: error instanceof Error ? error.message : "请重试",
        });
      } finally {
        setDeletingModels((prev) => {
          const newSet = new Set(prev);
          newSet.delete(modelName);
          return newSet;
        });
      }
    },
    [isTauri, loadLocalModels]
  );

  // 初始化
  useEffect(() => {
    if (open && !cloudOnly) {
      checkOllamaStatus();
    }
  }, [open, cloudOnly, checkOllamaStatus]);

  useEffect(() => {
    if (ollamaStatus?.running) {
      loadLocalModels();
    }
  }, [ollamaStatus?.running, loadLocalModels]);

  // 获取当前选中的模型信息
  const selectedModel = useMemo(() => {
    if (!value) return null;

    // 先从云端模型找
    const cloudModel = CLOUD_MODELS.find((m) => m.id === value);
    if (cloudModel) return { ...cloudModel, type: "cloud" as const };

    // 再从本地模型找
    const localModel = localModels.find(
      (m) => m.name === value || m.model === value
    );
    if (localModel) {
      return {
        id: localModel.name,
        name: localModel.name,
        provider: "ollama" as const,
        type: "local" as const,
        size: localModel.size,
      };
    }

    return null;
  }, [value, localModels]);

  // 处理模型选择
  const handleSelect = (modelId: string) => {
    onChange?.(modelId);
    setOpen(false);
  };

  // 已安装的本地模型名称集合
  const installedModelNames = useMemo(
    () => new Set(localModels.map((m) => m.name.split(":")[0])),
    [localModels]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between h-9 px-3",
              "bg-surface-100 border-border hover:bg-surface-200",
              "text-sm text-foreground",
              className
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              {selectedModel ? (
                <>
                  {(() => {
                    const config =
                      PROVIDER_CONFIG[selectedModel.provider] ||
                      PROVIDER_CONFIG.openai;
                    const Icon = config.icon;
                    return (
                      <div
                        className={cn(
                          "w-5 h-5 rounded flex items-center justify-center shrink-0",
                          config.bg
                        )}
                      >
                        <Icon className={cn("w-3 h-3", config.color)} />
                      </div>
                    );
                  })()}
                  <span className="truncate">{selectedModel.name}</span>
                  {selectedModel.type === "local" && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1 py-0 bg-brand-200/60 text-brand-500"
                    >
                      本地
                    </Badge>
                  )}
                </>
              ) : (
                <span className="text-foreground-muted">选择模型...</span>
              )}
            </div>
            <ChevronDown className="w-4 h-4 shrink-0 text-foreground-muted" />
          </Button>
        )}
      </PopoverTrigger>

      <PopoverContent
        side={side}
        align={align}
        className="w-[400px] p-0 bg-surface-100 border-border"
      >
        {/* Tab 切换 */}
        {!localOnly && !cloudOnly && (
          <div className="flex border-b border-border">
            <button
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm transition-colors",
                activeTab === "cloud"
                  ? "text-foreground border-b-2 border-brand-500 -mb-px"
                  : "text-foreground-muted hover:text-foreground"
              )}
              onClick={() => setActiveTab("cloud")}
            >
              <Cloud className="w-4 h-4" />
              云端模型
            </button>
            <button
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm transition-colors",
                activeTab === "local"
                  ? "text-foreground border-b-2 border-brand-500 -mb-px"
                  : "text-foreground-muted hover:text-foreground"
              )}
              onClick={() => setActiveTab("local")}
            >
              <HardDrive className="w-4 h-4" />
              本地模型
            </button>
          </div>
        )}

        {/* 云端模型列表 */}
        {(activeTab === "cloud" || cloudOnly) && !localOnly && (
          <div className="max-h-[400px] overflow-y-auto">
            {/* 按 Provider 分组 */}
            {(["openai", "anthropic", "google"] as const).map((provider) => {
              const models = CLOUD_MODELS.filter(
                (m) => m.provider === provider
              );
              if (models.length === 0) return null;

              const config = PROVIDER_CONFIG[provider];
              const Icon = config.icon;

              return (
                <div key={provider} className="p-2">
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-foreground-muted uppercase tracking-wider">
                    <Icon className={cn("w-3.5 h-3.5", config.color)} />
                    {provider === "openai"
                      ? "OpenAI"
                      : provider === "anthropic"
                      ? "Anthropic"
                      : "Google"}
                  </div>
                  <div className="space-y-1">
                    {models.map((model) => (
                      <button
                        key={model.id}
                        className={cn(
                          "w-full flex items-start gap-3 p-2 rounded-lg transition-colors",
                          "hover:bg-surface-200",
                          value === model.id && "bg-surface-200 ring-1 ring-brand-500"
                        )}
                        onClick={() => handleSelect(model.id)}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                            config.bg
                          )}
                        >
                          <Icon className={cn("w-4 h-4", config.color)} />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground">
                              {model.name}
                            </span>
                            {model.isDefault && (
                              <Badge className="text-[10px] px-1 py-0 bg-brand-200/60 text-brand-500">
                                推荐
                              </Badge>
                            )}
                          </div>
                          {model.description && (
                            <p className="text-xs text-foreground-muted mt-0.5">
                              {model.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-foreground-muted">
                            {model.contextLength && (
                              <span>
                                上下文: {formatContextLength(model.contextLength)}
                              </span>
                            )}
                            {model.inputPrice && (
                              <span>
                                ${model.inputPrice}/M 输入
                              </span>
                            )}
                          </div>
                        </div>
                        {value === model.id && (
                          <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0 mt-1" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 本地模型列表 */}
        {(activeTab === "local" || localOnly) && !cloudOnly && (
          <div className="max-h-[400px] overflow-y-auto">
            {/* Ollama 状态 */}
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-foreground-muted" />
                  <span className="text-sm text-foreground">Ollama 服务</span>
                </div>
                <div className="flex items-center gap-2">
                  {isLoadingStatus ? (
                    <Loader2 className="w-4 h-4 animate-spin text-foreground-muted" />
                  ) : ollamaStatus?.running ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                      <span className="text-xs text-brand-500">运行中</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-destructive" />
                      <span className="text-xs text-destructive">未运行</span>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={checkOllamaStatus}
                  >
                    <RefreshCw
                      className={cn(
                        "w-3.5 h-3.5 text-foreground-muted",
                        isLoadingStatus && "animate-spin"
                      )}
                    />
                  </Button>
                </div>
              </div>

              {!isTauri && (
                <div className="mt-2 p-2 rounded-lg bg-warning-200 text-warning text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>本地模型仅在桌面应用中可用</span>
                </div>
              )}

              {isTauri && !ollamaStatus?.running && (
                <div className="mt-2 p-2 rounded-lg bg-surface-200 text-foreground-muted text-xs flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>请先启动 Ollama 服务：打开终端运行 `ollama serve`</span>
                </div>
              )}
            </div>

            {/* 已安装的模型 */}
            {localModels.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1.5 text-xs text-foreground-muted uppercase tracking-wider">
                  已安装 ({localModels.length})
                </div>
                <div className="space-y-1">
                  {localModels.map((model) => (
                    <div
                      key={model.name}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg transition-colors",
                        "hover:bg-surface-200",
                        value === model.name && "bg-surface-200 ring-1 ring-brand-500"
                      )}
                    >
                      <button
                        className="flex-1 flex items-center gap-3 text-left"
                        onClick={() => handleSelect(model.name)}
                      >
                        <div className="w-8 h-8 rounded-lg bg-brand-200/60 flex items-center justify-center shrink-0">
                          <HardDrive className="w-4 h-4 text-brand-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-foreground">
                            {model.name}
                          </div>
                          <div className="text-[10px] text-foreground-muted">
                            {formatBytes(model.size)}
                          </div>
                        </div>
                        {value === model.name && (
                          <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                        )}
                      </button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-foreground-muted hover:text-destructive"
                              onClick={() => deleteModel(model.name)}
                              disabled={deletingModels.has(model.name)}
                            >
                              {deletingModels.has(model.name) ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>删除模型</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 可下载的模型 */}
            {ollamaStatus?.running && (
              <div className="p-2 border-t border-border">
                <div className="px-2 py-1.5 text-xs text-foreground-muted uppercase tracking-wider">
                  可下载的模型
                </div>
                <div className="space-y-1">
                  {DOWNLOADABLE_MODELS.map((model) => {
                    const isInstalled = installedModelNames.has(
                      model.name.split(":")[0]
                    );
                    const isDownloading = downloadingModels.has(model.name);
                    const progress = downloadingModels.get(model.name) || 0;

                    return (
                      <div
                        key={model.name}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-200"
                      >
                        <div className="w-8 h-8 rounded-lg bg-surface-200 flex items-center justify-center shrink-0">
                          <Zap className="w-4 h-4 text-foreground-muted" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-foreground">
                            {model.name}
                          </div>
                          <div className="text-[10px] text-foreground-muted">
                            {model.description} • {model.size}
                          </div>
                          {isDownloading && (
                            <Progress
                              value={progress}
                              className="h-1 mt-1.5 bg-surface-200"
                            />
                          )}
                        </div>
                        {isInstalled ? (
                          <Badge className="text-[10px] px-1.5 py-0.5 bg-brand-200/60 text-brand-500">
                            已安装
                          </Badge>
                        ) : isDownloading ? (
                          <span className="text-xs text-foreground-muted">
                            {Math.round(progress)}%
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-foreground-muted hover:text-brand-500"
                            onClick={() => downloadModel(model.name)}
                          >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            下载
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 空状态 */}
            {ollamaStatus?.running &&
              localModels.length === 0 &&
              !isLoadingModels && (
                <div className="p-6 text-center">
                  <HardDrive className="w-10 h-10 mx-auto text-foreground-muted mb-3" />
                  <p className="text-sm text-foreground-muted mb-1">暂无本地模型</p>
                  <p className="text-xs text-foreground-muted">
                    从上方列表下载模型开始使用
                  </p>
                </div>
              )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default ModelSelector;
