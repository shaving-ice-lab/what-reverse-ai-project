"use client";

/**
 * ModelSelectComponent
 *
 * Features: 
 * - DisplayCloudModelList(OpenAI, Anthropic, Google etc)
 * - DisplayLocal Ollama ModelList
 * - DisplayModelInstallStatus
 * - Display Ollama RunStatus
 * - SupportModelDownloadInteractive
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

// ========== TypeDefinition ==========

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
 /** Currentselect'sModel */
 value?: string;
 /** ModelCallback */
 onChange?: (model: string) => void;
 /** isnoDisable */
 disabled?: boolean;
 /** DisplayLocalModel */
 localOnly?: boolean;
 /** DisplayCloudModel */
 cloudOnly?: boolean;
 /** CustomTrigger */
 trigger?: React.ReactNode;
 /** Pop upmethod */
 side?: "top" | "right" | "bottom" | "left";
 /** formethod */
 align?: "start" | "center" | "end";
 /** CustomClass Name */
 className?: string;
}

// ========== PresetCloudModelList ==========

const CLOUD_MODELS: CloudModel[] = [
 // OpenAI Models
 {
 id: "gpt-4o",
 name: "GPT-4o",
 provider: "openai",
 description: "BestmultipleModalModel, SupportImageUnderstand",
 contextLength: 128000,
 inputPrice: 5,
 outputPrice: 15,
 isDefault: true,
 },
 {
 id: "gpt-4o-mini",
 name: "GPT-4o Mini",
 provider: "openai",
 description: "comparemost'sSmartModel",
 contextLength: 128000,
 inputPrice: 0.15,
 outputPrice: 0.6,
 },
 {
 id: "gpt-4-turbo",
 name: "GPT-4 Turbo",
 provider: "openai",
 description: "canContextModel",
 contextLength: 128000,
 inputPrice: 10,
 outputPrice: 30,
 },
 {
 id: "gpt-3.5-turbo",
 name: "GPT-3.5 Turbo",
 provider: "openai",
 description: "QuickandEconomy",
 contextLength: 16385,
 inputPrice: 0.5,
 outputPrice: 1.5,
 },
 // Anthropic Models
 {
 id: "claude-3-5-sonnet-20241022",
 name: "Claude 3.5 Sonnet",
 provider: "anthropic",
 description: "mostnewBest's Claude Model",
 contextLength: 200000,
 inputPrice: 3,
 outputPrice: 15,
 },
 {
 id: "claude-3-opus-20240229",
 name: "Claude 3 Opus",
 provider: "anthropic",
 description: "BestInferencecanpower",
 contextLength: 200000,
 inputPrice: 15,
 outputPrice: 75,
 },
 {
 id: "claude-3-haiku-20240307",
 name: "Claude 3 Haiku",
 provider: "anthropic",
 description: "QuickandEconomy",
 contextLength: 200000,
 inputPrice: 0.25,
 outputPrice: 1.25,
 },
 // Google Models
 {
 id: "gemini-1.5-pro",
 name: "Gemini 1.5 Pro",
 provider: "google",
 description: "ContextSupport",
 contextLength: 2000000,
 inputPrice: 3.5,
 outputPrice: 10.5,
 },
 {
 id: "gemini-1.5-flash",
 name: "Gemini 1.5 Flash",
 provider: "google",
 description: "QuickEfficient",
 contextLength: 1000000,
 inputPrice: 0.075,
 outputPrice: 0.3,
 },
];

// PresetcanDownload's Ollama Model
const DOWNLOADABLE_MODELS = [
 { name: "llama3.2", description: "Meta mostnew Llama 3.2", size: "2GB" },
 { name: "llama3.2:1b", description: "Llama 3.2 1B version", size: "1.3GB" },
 { name: "llama3.1", description: "Meta Llama 3.1 8B", size: "4.7GB" },
 { name: "mistral", description: "Mistral 7B can", size: "4.1GB" },
 { name: "qwen2.5", description: "Tongyi1000 2.5", size: "4.4GB" },
 { name: "qwen2.5-coder", description: "Tongyi1000Codeuse", size: "4.7GB" },
 { name: "phi3", description: "Microsoft Phi-3 small", size: "2.2GB" },
 { name: "deepseek-coder-v2", description: "DeepSeekCodeModel", size: "8.9GB" },
 { name: "gemma2", description: "Google Gemma 2", size: "5.4GB" },
 { name: "codellama", description: "Meta Codeuse Llama", size: "3.8GB" },
];

// Provider IconandColorMapping
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

// ========== Formatcount ==========

const formatBytes = (bytes: number): string => {
 if (bytes === 0) return "0 B";
 const k = 1024;
 const sizes = ["B", "KB", "MB", "GB", "TB"];
 const i = Math.floor(Math.log(bytes) / Math.log(k));
 return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + "" + sizes[i];
};

const formatContextLength = (tokens: number): string => {
 if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
 if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`;
 return tokens.toString();
};

// ========== ComponentImplement ==========

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
 // Status
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

 // Checkisnoat Tauri Environment
 const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

 // Check Ollama Status
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

 // FetchLocalModelList
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

 // DownloadModel
 const downloadModel = useCallback(
 async (modelName: string) => {
 if (!isTauri) return;

 setDownloadingModels((prev) => new Map(prev).set(modelName, 0));

 try {
 // @ts-ignore - Tauri API
 const { invoke } = await import("@tauri-apps/api/core");

 // MockProgress(ActualShoulduseEventListen)
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

 toast.success("ModelDownloadDone", {
 description: `${modelName} alreadySuccessInstall`,
 });

 // RefreshModelList
 loadLocalModels();
 } catch (error) {
 setDownloadingModels((prev) => {
 const newMap = new Map(prev);
 newMap.delete(modelName);
 return newMap;
 });
 toast.error("DownloadFailed", {
 description: error instanceof Error ? error.message: "PleaseRetry",
 });
 }
 },
 [isTauri, loadLocalModels]
 );

 // DeleteModel
 const deleteModel = useCallback(
 async (modelName: string) => {
 if (!isTauri) return;

 setDeletingModels((prev) => new Set(prev).add(modelName));

 try {
 // @ts-ignore - Tauri API
 const { invoke } = await import("@tauri-apps/api/core");
 await invoke("delete_ollama_model", { modelName });

 toast.success("ModelDeleted", {
 description: `${modelName} alreadyfromLocalRemove`,
 });

 // RefreshModelList
 loadLocalModels();
 } catch (error) {
 toast.error("DeleteFailed", {
 description: error instanceof Error ? error.message: "PleaseRetry",
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

 // Initial
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

 // FetchCurrentselect'sModelInfo
 const selectedModel = useMemo(() => {
 if (!value) return null;

 // firstfromCloudModel
 const cloudModel = CLOUD_MODELS.find((m) => m.id === value);
 if (cloudModel) return { ...cloudModel, type: "cloud" as const };

 // againfromLocalModel
 const localModel = localModels.find(
 (m) => m.name === value || m.model === value
 );
 if (localModel) {
 return {
 id: localModel.name, name: localModel.name,
 provider: "ollama" as const,
 type: "local" as const,
 size: localModel.size,
 };
 }

 return null;
 }, [value, localModels]);

 // ProcessModelSelect
 const handleSelect = (modelId: string) => {
 onChange?.(modelId);
 setOpen(false);
 };

 // alreadyInstall'sLocalModelNameCollection
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
 Local
 </Badge>
 )}
 </>
 ) : (
 <span className="text-foreground-light">SelectModel...</span>
 )}
 </div>
 <ChevronDown className="w-4 h-4 shrink-0 text-foreground-light" />
 </Button>
 )}
 </PopoverTrigger>

 <PopoverContent
 side={side}
 align={align}
 className="w-[400px] p-0 bg-surface-100 border-border"
 >
 {/* Tab Switch */}
 {!localOnly && !cloudOnly && (
 <div className="flex border-b border-border">
 <button
 className={cn(
 "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm transition-colors",
 activeTab === "cloud"
 ? "text-foreground border-b-2 border-brand-500 -mb-px"
 : "text-foreground-light hover:text-foreground"
 )}
 onClick={() => setActiveTab("cloud")}
 >
 <Cloud className="w-4 h-4" />
 CloudModel
 </button>
 <button
 className={cn(
 "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm transition-colors",
 activeTab === "local"
 ? "text-foreground border-b-2 border-brand-500 -mb-px"
 : "text-foreground-light hover:text-foreground"
 )}
 onClick={() => setActiveTab("local")}
 >
 <HardDrive className="w-4 h-4" />
 LocalModel
 </button>
 </div>
 )}

 {/* CloudModelList */}
 {(activeTab === "cloud" || cloudOnly) && !localOnly && (
 <div className="max-h-[400px] overflow-y-auto">
 {/* byProvider Group */}
 {(["openai", "anthropic", "google"] as const).map((provider) => {
 const models = CLOUD_MODELS.filter(
 (m) => m.provider === provider
 );
 if (models.length === 0) return null;

 const config = PROVIDER_CONFIG[provider];
 const Icon = config.icon;

 return (
 <div key={provider} className="p-2">
 <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-foreground-light uppercase tracking-wider">
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
 Recommended
 </Badge>
 )}
 </div>
 {model.description && (
 <p className="text-xs text-foreground-light mt-0.5">
 {model.description}
 </p>
 )}
 <div className="flex items-center gap-3 mt-1 text-[10px] text-foreground-light/70">
 {model.contextLength && (
 <span>
 Context: {formatContextLength(model.contextLength)}
 </span>
 )}
 {model.inputPrice && (
 <span>
 ${model.inputPrice}/M Input
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

 {/* LocalModelList */}
 {(activeTab === "local" || localOnly) && !cloudOnly && (
 <div className="max-h-[400px] overflow-y-auto">
 {/* Ollama Status */}
 <div className="p-3 border-b border-border">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Server className="w-4 h-4 text-foreground-light" />
 <span className="text-sm text-foreground">Ollama Service</span>
 </div>
 <div className="flex items-center gap-2">
 {isLoadingStatus ? (
 <Loader2 className="w-4 h-4 animate-spin text-foreground-light" />
 ) : ollamaStatus?.running ? (
 <>
 <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
 <span className="text-xs text-brand-500">Running</span>
 </>) : (
 <>
 <XCircle className="w-4 h-4 text-destructive" />
 <span className="text-xs text-destructive">Not Running</span>
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
 "w-3.5 h-3.5 text-foreground-light",
 isLoadingStatus && "animate-spin"
 )}
 />
 </Button>
 </div>
 </div>

 {!isTauri && (
 <div className="mt-2 p-2 rounded-lg bg-warning-200 text-warning text-xs flex items-start gap-2">
 <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
 <span>LocalModelonlyatfaceAppAvailable</span>
 </div>
 )}

 {isTauri && !ollamaStatus?.running && (
 <div className="mt-2 p-2 rounded-lg bg-surface-200 text-foreground-light text-xs flex items-start gap-2">
 <Info className="w-4 h-4 shrink-0 mt-0.5" />
 <span>PleasefirstLaunch Ollama Service: OpenendpointRun `ollama serve`</span>
 </div>
 )}
 </div>

 {/* alreadyInstall'sModel */}
 {localModels.length > 0 && (
 <div className="p-2">
 <div className="px-2 py-1.5 text-xs text-foreground-light uppercase tracking-wider">
 alreadyInstall ({localModels.length})
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
 <div className="text-[10px] text-foreground-light/70">
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
 className="h-7 w-7 p-0 text-foreground-light hover:text-destructive"
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
 <TooltipContent>DeleteModel</TooltipContent>
 </Tooltip>
 </TooltipProvider>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* canDownload'sModel */}
 {ollamaStatus?.running && (
 <div className="p-2 border-t border-border">
 <div className="px-2 py-1.5 text-xs text-foreground-light uppercase tracking-wider">
 canDownload'sModel
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
 <Zap className="w-4 h-4 text-foreground-light" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="font-medium text-sm text-foreground">
 {model.name}
 </div>
 <div className="text-[10px] text-foreground-light/70">
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
 alreadyInstall
 </Badge>
 ) : isDownloading ? (
 <span className="text-xs text-foreground-light">
 {Math.round(progress)}%
 </span>
 ) : (
 <Button
 variant="ghost"
 size="sm"
 className="h-7 px-2 text-xs text-foreground-light hover:text-brand-500"
 onClick={() => downloadModel(model.name)}
 >
 <Download className="w-3.5 h-3.5 mr-1" />
 Download
 </Button>
 )}
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* Empty State */}
 {ollamaStatus?.running &&
 localModels.length === 0 &&
 !isLoadingModels && (
 <div className="p-6 text-center">
 <HardDrive className="w-10 h-10 mx-auto text-foreground-light/50 mb-3" />
 <p className="text-sm text-foreground-light mb-1">NoneLocalModel</p>
 <p className="text-xs text-foreground-light/70">
 fromonmethodListDownloadModelStartUsage
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
