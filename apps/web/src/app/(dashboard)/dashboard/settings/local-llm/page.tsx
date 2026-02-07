"use client";

/**
 * Local LLM SettingsPage - Supabase Style
 */

import React, { useState } from "react";
import {
 RefreshCw,
 Download,
 Trash2,
 ExternalLink,
 CheckCircle2,
 XCircle,
 Loader2,
 Play,
 AlertCircle,
 HardDrive,
 Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useLocalLLM } from "@/hooks/useLocalLLM";
import {
 RECOMMENDED_MODELS,
 formatBytes,
 type LocalModelInfo,
 type LLMProviderType,
} from "@/lib/llm";
import { cn } from "@/lib/utils";

const PROVIDER_NAMES: Record<LLMProviderType, string> = {
 ollama: "Ollama",
 "lm-studio": "LM Studio",
 "llama-cpp": "llama.cpp",
};

const PROVIDER_LINKS: Record<LLMProviderType, string> = {
 ollama: "https://ollama.ai",
 "lm-studio": "https://lmstudio.ai",
 "llama-cpp": "https://github.com/ggerganov/llama.cpp",
};

// SettingsCardComponent
function SettingsSection({
 title,
 description,
 children,
 action,
}: {
 title: string;
 description?: string;
 children: React.ReactNode;
 action?: React.ReactNode;
}) {
 return (
 <div className="page-panel overflow-hidden mb-6">
 <div className="page-panel-header flex items-start justify-between">
 <div>
 <h2 className="page-panel-title">{title}</h2>
 {description && <p className="page-panel-description mt-1">{description}</p>}
 </div>
 {action}
 </div>
 <div className="p-6">{children}</div>
 </div>
 );
}

// StatusIndicator
function StatusIndicator({
 status,
 provider = "ollama",
}: {
 status: "checking" | "available" | "unavailable";
 provider?: LLMProviderType;
}) {
 const providerName = PROVIDER_NAMES[provider];

 switch (status) {
 case "checking":
 return (
 <div className="flex items-center gap-2 text-[13px] text-foreground-muted">
 <Loader2 className="h-4 w-4 animate-spin" />
 <span>Checking...</span>
 </div>
 );
 case "available":
 return (
 <div className="flex items-center gap-2 text-[13px] text-brand-500">
 <CheckCircle2 className="h-4 w-4" />
 <span>{providerName} Run</span>
 </div>
 );
 case "unavailable":
 return (
 <div className="flex items-center gap-2 text-[13px] text-foreground-muted">
 <XCircle className="h-4 w-4" />
 <span>{providerName} not yetRun</span>
 </div>
 );
 }
}

// Provider Select
function ProviderSelector({
 provider,
 name,
 isActive,
 isAvailable,
 modelsCount,
 onClick,
}: {
 provider: LLMProviderType;
 name: string;
 isActive: boolean;
 isAvailable: boolean;
 modelsCount: number;
 onClick: () => void;
}) {
 return (
 <button
 onClick={onClick}
 className={cn(
 "w-full flex items-center justify-between p-4 rounded-md text-left transition-all duration-200 cursor-pointer",
 "border",
 isActive
 ? "border-brand-500 bg-brand-200"
 : "border-border hover:border-border-strong bg-surface-100/60"
 )}
 >
 <div className="flex items-center gap-3">
 <Server className="h-4 w-4 text-foreground-muted" />
 <span className="text-[13px] font-medium text-foreground">{name}</span>
 {isActive && (
 <Badge className="text-xs bg-brand-200 text-brand-500 border-brand-400">
 Current
 </Badge>
 )}
 </div>
 <div className="flex items-center gap-2">
 {isAvailable ? (
 <span className="text-xs text-brand-500">{modelsCount} Model</span>
 ) : (
 <span className="text-xs text-foreground-muted">Offline</span>
 )}
 </div>
 </button>
 );
}

// ModelList
function ModelItem({
 model,
 onTest,
 onDelete,
 isDeleting,
}: {
 model: LocalModelInfo;
 onTest: () => void;
 onDelete: () => void;
 isDeleting: boolean;
}) {
 return (
 <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <span className="text-[13px] font-medium text-foreground truncate">
 {model.name}
 </span>
 {model.details?.parameterSize && (
 <span className="text-xs text-foreground-muted">
 {model.details.parameterSize}
 </span>
 )}
 </div>
 <div className="flex items-center gap-3 mt-1 text-xs text-foreground-muted">
 <span>{formatBytes(model.size)}</span>
 {model.details?.family && <span>{model.details.family}</span>}
 </div>
 </div>
 <div className="flex items-center gap-1 ml-4">
 <Button
 variant="ghost"
 size="icon"
 className="h-8 w-8 text-foreground-muted hover:text-foreground hover:bg-surface-200/60"
 onClick={onTest}
 >
 <Play className="h-4 w-4" />
 </Button>
 <Button
 variant="ghost"
 size="icon"
 className="h-8 w-8 text-foreground-muted hover:text-foreground hover:bg-surface-200/60"
 onClick={onDelete}
 disabled={isDeleting}
 >
 {isDeleting ? (
 <Loader2 className="h-4 w-4 animate-spin" />
 ) : (
 <Trash2 className="h-4 w-4" />
 )}
 </Button>
 </div>
 </div>
 );
}

// RecommendedModelList
function RecommendedModelItem({
 model,
 isInstalled,
 isDownloading,
 onDownload,
}: {
 model: (typeof RECOMMENDED_MODELS)[0];
 isInstalled: boolean;
 isDownloading: boolean;
 onDownload: () => void;
}) {
 return (
 <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <span className="text-[13px] font-medium text-foreground">{model.name}</span>
 {isInstalled && (
 <Badge className="text-xs bg-brand-200 text-brand-500 border-brand-400">
 alreadyInstall
 </Badge>
 )}
 </div>
 <p className="text-xs text-foreground-muted mt-0.5">{model.description}</p>
 <div className="flex items-center gap-2 mt-1">
 <span className="text-xs text-foreground-muted">{model.size}</span>
 </div>
 </div>
 <Button
 variant={isInstalled ? "ghost" : "outline"}
 size="sm"
 disabled={isInstalled || isDownloading}
 onClick={onDownload}
 className={cn(
 !isInstalled &&
 !isDownloading &&
 "border-border hover:border-brand-500 hover:bg-brand-200"
 )}
 >
 {isInstalled ? (
 <CheckCircle2 className="h-4 w-4 text-brand-500" />
 ) : isDownloading ? (
 <>
 <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
 Download
 </>
 ) : (
 <>
 <Download className="h-4 w-4 mr-1.5" />
 Download
 </>
 )}
 </Button>
 </div>
 );
}

// DownloadProgress
function DownloadProgress({
 modelName,
 progress,
 onCancel,
}: {
 modelName: string;
 progress: { status: string; completed?: number; total?: number };
 onCancel: () => void;
}) {
 const percentage =
 progress.total && progress.completed
 ? Math.round((progress.completed / progress.total) * 100)
 : 0;

 return (
 <div className="p-4 rounded-md bg-surface-100 border border-border">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2">
 <Download className="h-4 w-4 text-brand-500" />
 <span className="text-[13px] font-medium text-foreground">
 Download {modelName}
 </span>
 </div>
 <Button
 variant="ghost"
 size="sm"
 onClick={onCancel}
 className="text-foreground-muted hover:text-foreground"
 >
 Cancel
 </Button>
 </div>
 <div className="space-y-2">
 <div className="flex justify-between text-xs text-foreground-muted">
 <span>{percentage}%</span>
 {progress.total && progress.completed && (
 <span>
 {formatBytes(progress.completed)} / {formatBytes(progress.total)}
 </span>
 )}
 </div>
 <div className="h-1.5 bg-surface-300 rounded-full overflow-hidden">
 <div
 className="h-full bg-brand-500 transition-all duration-300"
 style={{ width: `${percentage}%` }}
 />
 </div>
 </div>
 </div>
 );
}

export default function LocalLLMPage() {
 const {
 activeProvider,
 status,
 models,
 downloadProgress,
 downloadingModel,
 error,
 isLoading,
 providerStatuses,
 checkStatus,
 refreshModels,
 pullModel,
 deleteModel,
 testModel,
 cancelDownload,
 switchProvider,
 } = useLocalLLM();

 const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
 const [testResult, setTestResult] = useState<{
 modelName: string;
 result: string;
 error?: string;
 } | null>(null);
 const [testingModel, setTestingModel] = useState<string | null>(null);
 const [deletingModel, setDeletingModel] = useState<string | null>(null);
 const { confirm, ConfirmDialog } = useConfirmDialog();

 const handleTestModel = async (modelName: string) => {
 setTestingModel(modelName);
 setTestResult(null);
 try {
 const result = await testModel(modelName);
 setTestResult({ modelName, result });
 } catch (err) {
 setTestResult({
 modelName,
 result: "",
 error: err instanceof Error ? err.message: "TestFailed",
 });
 } finally {
 setTestingModel(null);
 }
 };

 const handleDeleteModel = async (modelName: string) => {
 const confirmed = await confirm({
 title: "DeleteModel",
 description: `OKneedDelete ${modelName} ??This action cannot be undone.`,
 confirmText: "Delete",
 cancelText: "Cancel",
 variant: "destructive",
 });

 if (confirmed) {
 setDeletingModel(modelName);
 try {
 await deleteModel(modelName);
 } finally {
 setDeletingModel(null);
 }
 }
 };

 const handlePullModel = async (modelName: string) => {
 try {
 await pullModel(modelName);
 } catch {
 // Erroralreadyat hook Process
 }
 };

 return (
 <PageContainer>
 <div className="space-y-6">
 <ConfirmDialog />

 <PageHeader
 eyebrow="Settings"
 title="Local LLM"
 description="ManageandConfigLocalRun's AI largeLanguageModel"
 />

 <div className="page-divider" />

 {/* LLM EngineSelect */}
 <SettingsSection
 title="LLM Engine"
 description="SelectyouneedUsage'sLocal LLM RunEngine"
 >
 <div className="space-y-2">
 <ProviderSelector
 provider="ollama"
 name="Ollama"
 isActive={activeProvider === "ollama"}
 isAvailable={providerStatuses["ollama"]?.available || false}
 modelsCount={providerStatuses["ollama"]?.modelsCount || 0}
 onClick={() => switchProvider("ollama")}
 />
 <ProviderSelector
 provider="lm-studio"
 name="LM Studio"
 isActive={activeProvider === "lm-studio"}
 isAvailable={providerStatuses["lm-studio"]?.available || false}
 modelsCount={providerStatuses["lm-studio"]?.modelsCount || 0}
 onClick={() => switchProvider("lm-studio")}
 />
 </div>
 </SettingsSection>

 {/* ConnectStatus */}
 <SettingsSection
 title="ConnectStatus"
 description="CheckLocal LLM Engine'sRunStatus"
 action={
 <Button
 variant="ghost"
 size="sm"
 onClick={checkStatus}
 disabled={status === "checking"}
 className="text-foreground-muted hover:text-foreground"
 >
 <RefreshCw
 className={cn(
 "h-4 w-4 mr-1.5",
 status === "checking" && "animate-spin"
 )}
 />
 Refresh
 </Button>
 }
 >
 <div className="p-4 rounded-md bg-surface-100/60 border border-border">
 <StatusIndicator status={status} provider={activeProvider} />
 </div>

 {status === "unavailable" && (
 <div className="flex items-start gap-3 p-4 mt-4 rounded-md bg-surface-200 border border-border text-[13px]">
 <AlertCircle className="h-4 w-4 text-foreground-light mt-0.5 shrink-0" />
 <div>
 <p className="text-foreground font-medium">
 {PROVIDER_NAMES[activeProvider]} not yetRun
 </p>
 <p className="text-foreground-light mt-1">
 PleaseEnsureyoualreadyInstallandLaunch {PROVIDER_NAMES[activeProvider]}
 </p>
 <Button
 variant="link"
 size="sm"
 className="h-auto p-0 mt-2 text-brand-500 hover:text-brand-600"
 asChild
 >
 <a
 href={PROVIDER_LINKS[activeProvider]}
 target="_blank"
 rel="noopener noreferrer"
 >
 <ExternalLink className="h-3 w-3 mr-1" />
 Install {PROVIDER_NAMES[activeProvider]}
 </a>
 </Button>
 </div>
 </div>
 )}

 {/* URL Config */}
 {activeProvider === "ollama" && status === "available" && (
 <div className="mt-4 space-y-2">
 <label className="text-[13px] font-medium text-foreground block">
 ServiceAddress
 </label>
 <div className="flex gap-2">
 <Input
 value={ollamaUrl}
 onChange={(e) => setOllamaUrl(e.target.value)}
 placeholder="http://localhost:11434"
 className="h-9 bg-surface-200 border-border focus:border-brand-500"
 />
 <Button
 variant="outline"
 size="sm"
 onClick={checkStatus}
 className="border-border text-foreground-light hover:bg-surface-200/60"
 >
 Test
 </Button>
 </div>
 </div>
 )}
 </SettingsSection>

 {/* ErrorTip */}
 {error && (
 <div className="flex items-center gap-2 p-3 rounded-md bg-surface-200 border border-border text-foreground text-[13px]">
 <AlertCircle className="h-4 w-4 shrink-0 text-foreground-light" />
 {error}
 </div>
 )}

 {/* DownloadProgress */}
 {downloadingModel && downloadProgress && (
 <DownloadProgress
 modelName={downloadingModel}
 progress={downloadProgress}
 onCancel={cancelDownload}
 />
 )}

 {/* alreadyInstallModel */}
 {status === "available" && (
 <SettingsSection
 title={`alreadyInstallModel (${models.length})`}
 description="ManageyouLocalalreadyDownload'sModel"
 action={
 <Button
 variant="ghost"
 size="sm"
 onClick={refreshModels}
 disabled={isLoading}
 className="text-foreground-muted hover:text-foreground"
 >
 <RefreshCw
 className={cn(
 "h-4 w-4 mr-1.5",
 isLoading && "animate-spin"
 )}
 />
 Refresh
 </Button>
 }
 >
 {models.length > 0 ? (
 <div>
 {models.map((model) => (
 <ModelItem
 key={model.name}
 model={model}
 onTest={() => handleTestModel(model.name)}
 onDelete={() => handleDeleteModel(model.name)}
 isDeleting={deletingModel === model.name}
 />
 ))}
 </div>
 ) : (
 <div className="text-center py-12">
 <HardDrive className="h-10 w-10 mx-auto mb-3 text-foreground-muted" />
 <p className="text-[13px] text-foreground-light">NonealreadyInstallModel</p>
 <p className="text-xs text-foreground-muted mt-1">
 fromdownmethodRecommendedModelSelectDownload
 </p>
 </div>
 )}
 </SettingsSection>
 )}

 {/* RecommendedModel */}
 {status === "available" && (
 <SettingsSection
 title="RecommendedModel"
 description="PopularOpen SourceModel, ClickDownloadnowcanUsage"
 >
 <div>
 {RECOMMENDED_MODELS.map((model) => {
 const isInstalled = models.some((m) => m.name === model.name);
 const isDownloading = downloadingModel === model.name;

 return (
 <RecommendedModelItem
 key={model.name}
 model={model}
 isInstalled={isInstalled}
 isDownloading={isDownloading}
 onDownload={() => handlePullModel(model.name)}
 />
 );
 })}
 </div>
 </SettingsSection>
 )}

 {/* TestResultDialog */}
 <Dialog open={!!testResult} onOpenChange={() => setTestResult(null)}>
 <DialogContent className="bg-surface-100 border-border">
 <DialogHeader>
 <DialogTitle className="text-foreground">
 {testResult?.error ? "Test Failed" : "Test Successful"}
 </DialogTitle>
 <DialogDescription className="text-foreground-light">
 Model: {testResult?.modelName}
 </DialogDescription>
 </DialogHeader>
 <div className="py-2">
 {testResult?.error ? (
 <div className="flex items-center gap-2 p-4 rounded-md bg-surface-200 border border-border text-foreground text-[13px]">
 <XCircle className="h-4 w-4 shrink-0 text-foreground-light" />
 {testResult.error}
 </div>
 ) : (
 <div className="p-4 rounded-md bg-surface-100/60 border border-border text-[13px] text-foreground">
 <p className="whitespace-pre-wrap">{testResult?.result}</p>
 </div>
 )}
 </div>
 <DialogFooter>
 <Button
 size="sm"
 onClick={() => setTestResult(null)}
 className="bg-brand-500 hover:bg-brand-600 text-background"
 >
 Close
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* currentlyatTestDialog */}
 <Dialog open={!!testingModel} onOpenChange={() => {}}>
 <DialogContent className="bg-surface-100 border-border">
 <DialogHeader>
 <DialogTitle className="text-foreground">currentlyatTest</DialogTitle>
 <DialogDescription className="text-foreground-light">
 currentlyatand {testingModel} ProceedConversationTest...
 </DialogDescription>
 </DialogHeader>
 <div className="flex items-center justify-center py-8">
 <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
 </div>
 </DialogContent>
 </Dialog>
 </div>
 </PageContainer>
 );
}
