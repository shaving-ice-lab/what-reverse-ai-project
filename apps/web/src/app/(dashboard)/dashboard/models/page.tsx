"use client";

/**
 * AI Model Management Page
 * View, compare and configure available AI models
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button, ButtonGroup } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState, PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import {
 Brain,
 Search,
 Star,
 Zap,
 Clock,
 DollarSign,
 MessageSquare,
 Code,
 FileText,
 Image as ImageIcon,
 Sparkles,
 TrendingUp,
 Settings,
 Check,
 Info,
 ExternalLink,
 ArrowUpDown,
 Crown,
 Shield,
 Gauge,
 Target,
 X,
} from "lucide-react";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";

// Model capability types
const capabilities = {
 chat: { label: "Conversation", icon: MessageSquare, color: "text-brand-500" },
 code: { label: "Code", icon: Code, color: "text-brand-500" },
 analysis: { label: "Analytics", icon: FileText, color: "text-foreground-light" },
 creative: { label: "Creative", icon: Sparkles, color: "text-foreground-light" },
 vision: { label: "Vision", icon: ImageIcon, color: "text-foreground-light" },
};

const compareLimit = 3;

const statusFilters = [
  { id: "all", label: "All Models" },
  { id: "default", label: "Default Model" },
  { id: "new", label: "Newly launched" },
] as const;

// Model Data
const models = [
 {
 id: "gpt-4-turbo",
 name: "GPT-4 Turbo",
 provider: "OpenAI",
 description: "Latest GPT-4 model with stronger inference and larger context window",
 capabilities: ["chat", "code", "analysis", "creative", "vision"],
 contextWindow: 128000,
 maxOutput: 4096,
 inputPrice: 0.01,
 outputPrice: 0.03,
 speed: "fast",
 quality: 95,
 popularity: 98,
 isDefault: true,
 isNew: false,
 tags: ["Recommended", "Multiple models"],
 },
 {
 id: "gpt-4",
 name: "GPT-4",
 provider: "OpenAI",
 description: "General-purpose language model for complex tasks and deep inference",
 capabilities: ["chat", "code", "analysis", "creative"],
 contextWindow: 8192,
 maxOutput: 4096,
 inputPrice: 0.03,
 outputPrice: 0.06,
 speed: "medium",
 quality: 92,
 popularity: 85,
 isDefault: false,
 isNew: false,
 tags: ["Stable"],
 },
 {
 id: "gpt-3.5-turbo",
 name: "GPT-3.5 Turbo",
 provider: "OpenAI",
 description: "Fast and economical model for high-volume daily tasks",
 capabilities: ["chat", "code", "analysis"],
 contextWindow: 16385,
 maxOutput: 4096,
 inputPrice: 0.0005,
 outputPrice: 0.0015,
 speed: "very-fast",
 quality: 78,
 popularity: 92,
 isDefault: false,
 isNew: false,
 tags: ["Economy"],
 },
 {
 id: "claude-3-opus",
 name: "Claude 3 Opus",
 provider: "Anthropic",
 description: "Anthropic's top model for complex analytics and creative writing",
 capabilities: ["chat", "code", "analysis", "creative", "vision"],
 contextWindow: 200000,
 maxOutput: 4096,
 inputPrice: 0.015,
 outputPrice: 0.075,
 speed: "medium",
 quality: 96,
 popularity: 78,
 isDefault: false,
 isNew: true,
 tags: ["Best", "Context"],
 },
 {
 id: "claude-3-sonnet",
 name: "Claude 3 Sonnet",
 provider: "Anthropic",
 description: "Balanced capability and cost endpoint model",
 capabilities: ["chat", "code", "analysis", "creative", "vision"],
 contextWindow: 200000,
 maxOutput: 4096,
 inputPrice: 0.003,
 outputPrice: 0.015,
 speed: "fast",
 quality: 88,
 popularity: 72,
 isDefault: false,
 isNew: true,
 tags: ["Balance"],
 },
 {
    id: "claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    description: "Fastest Claude model, suitable for real-time apps",
    capabilities: ["chat", "code", "analysis", "vision"],
    contextWindow: 200000,
    maxOutput: 4096,
    inputPrice: 0.00025,
    outputPrice: 0.00125,
    speed: "very-fast",
    quality: 75,
    popularity: 65,
    isDefault: false,
    isNew: true,
    tags: ["Fastest", "Economical"],
  },
 {
 id: "gemini-pro",
 name: "Gemini Pro",
 provider: "Google",
 description: "Google's multimodal AI model for text and image understanding",
 capabilities: ["chat", "code", "analysis", "vision"],
 contextWindow: 32000,
 maxOutput: 8192,
 inputPrice: 0.00025,
 outputPrice: 0.0005,
 speed: "fast",
 quality: 82,
 popularity: 68,
 isDefault: false,
 isNew: false,
 tags: ["Multiple models"],
 },
 {
 id: "llama-3-70b",
 name: "Llama 3 70B",
 provider: "Meta",
 description: "Open-source large language model",
 capabilities: ["chat", "code", "analysis"],
 contextWindow: 8192,
 maxOutput: 4096,
 inputPrice: 0.0007,
 outputPrice: 0.0009,
 speed: "fast",
 quality: 80,
 popularity: 55,
 isDefault: false,
 isNew: false,
 tags: ["Open Source"],
 },
];

// Speed configuration
const speedConfig = {
  "very-fast": { label: "Fastest", color: "text-brand-500", value: 95 },
  fast: { label: "Fast", color: "text-brand-500", value: 75 },
  medium: { label: "Medium", color: "text-foreground-light", value: 50 },
  slow: { label: "Slow", color: "text-foreground-light", value: 25 },
};

// Usage Statistics
const usageStats = {
 totalTokens: 1250000,
 totalCost: 45.80,
 favoriteModel: "gpt-4-turbo",
 avgResponseTime: 850,
};

export default function ModelsPage() {
 const [searchQuery, setSearchQuery] = useState("");
 const [selectedProvider, setSelectedProvider] = useState("all");
 const [selectedCapability, setSelectedCapability] = useState("all");
 const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]["id"]>("all");
 const [sortBy, setSortBy] = useState("popularity");
 const [compareMode, setCompareMode] = useState(false);
 const [selectedModels, setSelectedModels] = useState<string[]>([]);

 // Fetch All Providers
 const providers = [...new Set(models.map((m) => m.provider))];

 const defaultModel = models.find((model) => model.isDefault);
 const favoriteModel = models.find((model) => model.id === usageStats.favoriteModel);
 const topQualityModel = models.reduce((best, model) => (model.quality > best.quality ? model : best), models[0]);
 const fastestModel = models.reduce((best, model) => (
 speedConfig[model.speed as keyof typeof speedConfig].value >
 speedConfig[best.speed as keyof typeof speedConfig].value
 ? model
 : best
 ), models[0]);
 const mostPopularModel = models.reduce((best, model) => (model.popularity > best.popularity ? model : best), models[0]);
 const fastestSpeedLabel = speedConfig[fastestModel.speed as keyof typeof speedConfig].label;

 const isFiltering =
 searchQuery.length > 0 ||
 selectedProvider !== "all" ||
 selectedCapability !== "all" ||
 statusFilter !== "all";

 // Filter and Sort Models
 const filteredModels = models
 .filter((model) => {
 const matchesSearch =
 model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 model.description.toLowerCase().includes(searchQuery.toLowerCase());
 const matchesProvider =
 selectedProvider === "all" || model.provider === selectedProvider;
 const matchesCapability =
 selectedCapability === "all" ||
 model.capabilities.includes(selectedCapability);
 const matchesStatus =
 statusFilter === "all" ||
 (statusFilter === "default" && model.isDefault) ||
 (statusFilter === "new" && model.isNew);
 return matchesSearch && matchesProvider && matchesCapability && matchesStatus;
 })
 .sort((a, b) => {
 switch (sortBy) {
 case "quality":
 return b.quality - a.quality;
 case "price":
 return a.inputPrice - b.inputPrice;
 case "speed":
 return (
 speedConfig[b.speed as keyof typeof speedConfig].value -
 speedConfig[a.speed as keyof typeof speedConfig].value
 );
 default:
 return b.popularity - a.popularity;
 }
 });

 const selectedModelDetails = selectedModels
 .map((modelId) => models.find((model) => model.id === modelId))
 .filter((model): model is (typeof models)[number] => Boolean(model));

 const toggleModelSelection = (modelId: string) => {
 setSelectedModels((prev) =>
 prev.includes(modelId)
 ? prev.filter((id) => id !== modelId)
 : prev.length < compareLimit
 ? [...prev, modelId]
 : prev
 );
 };

 return (
 <PageContainer>
 <div className="space-y-6">
 <PageHeader
 eyebrow="Models"
 title="AI Model"
 description="Browse, compare and configure available AI models"
 actions={(
 <div className="flex flex-wrap items-center gap-2">
 <Button
 variant={compareMode ? "default" : "outline"}
 size="sm"
 leftIcon={<ArrowUpDown className="h-4 w-4" />}
 onClick={() => {
 setCompareMode(!compareMode);
 if (compareMode) setSelectedModels([]);
 }}
 >
 {compareMode ? "Exit Compare" : "Compare Models"}
 </Button>
 <Button
 variant="outline"
 size="sm"
 leftIcon={<Settings className="h-4 w-4" />}
 >
 Model Settings
 </Button>
 </div>
 )}
 >
 <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
 <span className="inline-flex items-center gap-1.5">
 <Brain className="h-3.5 w-3.5" />
 Models: {models.length}
 </span>
 <span className="inline-flex items-center gap-1.5">
 <Crown className="h-3.5 w-3.5" />
 Default: {defaultModel?.name || "Not configured"}
 </span>
 {compareMode && (
 <Badge variant="primary" size="xs">
 Compare enabled · {selectedModels.length}/{compareLimit}
 </Badge>
 )}
 </div>
 </PageHeader>

 <div className="page-divider" />

 <div className="page-grid sm:grid-cols-2 lg:grid-cols-4">
 <div className="page-panel p-4">
 <div className="flex items-center justify-between text-xs text-foreground-muted">
 <span>Token Consumption</span>
 <Zap className="h-4 w-4" />
 </div>
              <div className="mt-3 text-stat-number text-foreground">
                {(usageStats.totalTokens / 1000000).toFixed(2)}M
              </div>
              <p className="text-xs text-foreground-light">Total calls this month</p>
            </div>
            <div className="page-panel p-4">
              <div className="flex items-center justify-between text-xs text-foreground-muted">
                <span>This month's cost</span>
                <DollarSign className="h-4 w-4" />
              </div>
              <div className="mt-3 text-stat-number text-foreground">
                ${usageStats.totalCost.toFixed(2)}
              </div>
              <p className="text-xs text-foreground-light">Based on actual billing</p>
            </div>
            <div className="page-panel p-4">
              <div className="flex items-center justify-between text-xs text-foreground-muted">
                <span>Most used model</span>
                <Star className="h-4 w-4 text-brand-500" />
              </div>
              <div className="mt-3 text-sm font-semibold text-foreground">
                {favoriteModel?.name || "Not configured"}
              </div>
              <p className="text-xs text-foreground-light">Most called in past 30 days</p>
            </div>
            <div className="page-panel p-4">
              <div className="flex items-center justify-between text-xs text-foreground-muted">
                <span>Average response</span>
                <Clock className="h-4 w-4" />
              </div>
              <div className="mt-3 text-stat-number text-foreground">
                {usageStats.avgResponseTime}ms
              </div>
              <p className="text-xs text-foreground-light">Average latency last week</p>
            </div>
 </div>

 {compareMode && (
 <div className="page-panel border-brand-500/30 bg-brand-200/10 px-5 py-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div className="flex items-center gap-2">
 <Info className="h-4 w-4 text-brand-500" />
 <p className="text-sm font-medium text-foreground">Compare enabled</p>
 </div>
 <Badge variant="solid-primary" size="sm">
 Selected {selectedModels.length}/{compareLimit}
 </Badge>
 </div>
 <p className="mt-2 text-[13px] text-foreground-light">
 Select up to {compareLimit} models to compare; click a card to add or remove.
 </p>
 </div>
 )}

 <div className="page-panel">
 <div className="page-panel-header flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="page-panel-title">Filter and sort</p>
            <p className="page-panel-description">Filter by capability, provider and price.</p>
          </div>
 {isFiltering && (
 <Button
 variant="outline"
 size="sm"
 onClick={() => {
 setSearchQuery("");
 setSelectedProvider("all");
 setSelectedCapability("all");
 setStatusFilter("all");
 }}
 >
 Clear Filter
 </Button>
 )}
 </div>

 <div className="px-6 pb-6 space-y-4">
 <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
 <div className="w-full max-w-md">
 <Input
 variant="search"
 inputSize="sm"
 placeholder="Search model name, description or keywords..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 leftIcon={<Search className="h-4 w-4" />}
 />
 </div>
 <div className="flex flex-wrap items-center gap-2">
 <Select value={selectedProvider} onValueChange={setSelectedProvider}>
 <SelectTrigger className="h-8 w-[150px] bg-surface-200 border-border text-foreground-light">
 <SelectValue placeholder="Provider" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All providers</SelectItem>
 {providers.map((provider) => (
 <SelectItem key={provider} value={provider}>
 {provider}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>

                <Select value={selectedCapability} onValueChange={setSelectedCapability}>
                  <SelectTrigger className="h-8 w-[150px] bg-surface-200 border-border text-foreground-light">
                    <SelectValue placeholder="Capability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All capabilities</SelectItem>
                    {Object.entries(capabilities).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-8 w-[150px] bg-surface-200 border-border text-foreground-light">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popularity">By popularity</SelectItem>
                    <SelectItem value="quality">By quality</SelectItem>
                    <SelectItem value="price">By price</SelectItem>
                    <SelectItem value="speed">By speed</SelectItem>
                  </SelectContent>
                </Select>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <span className="text-xs text-foreground-muted">Status</span>
 <ButtonGroup attached>
 {statusFilters.map((filter) => (
 <Button
 key={filter.id}
 size="sm"
 variant={statusFilter === filter.id ? "default" : "outline"}
 onClick={() => setStatusFilter(filter.id)}
 >
 {filter.label}
 </Button>
 ))}
 </ButtonGroup>
 </div>
 </div>
 </div>

 <section className="page-grid lg:grid-cols-[minmax(0,1fr)_320px]">
 <div className="space-y-4">
 <div className="page-panel">
 <div className="page-panel-header flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="page-panel-title">Model list</p>
                  <p className="page-panel-description">
                    Currently showing {filteredModels.length} models. Select and configure as needed.
                  </p>
                </div>
                <Badge variant="secondary" size="xs">
                  Showing {filteredModels.length} 
                </Badge>
 </div>
 <div className="px-6 pb-6 pt-4">
 {filteredModels.length === 0 ? (
 <EmptyState
 icon={<Search className="h-5 w-5" />}
title="No matching models"
  description="Try adjusting keywords, provider or capability filters."
 className="px-0 py-12"
 action={isFiltering ? {
 label: "Clear Filter",
 onClick: () => {
 setSearchQuery("");
 setSelectedProvider("all");
 setSelectedCapability("all");
 setStatusFilter("all");
 },
 } : undefined}
 />
 ) : (
 <div className="page-grid">
 {filteredModels.map((model) => {
 const speed = speedConfig[model.speed as keyof typeof speedConfig];
 const isSelected = selectedModels.includes(model.id);

 return (
 <div
 key={model.id}
 className={cn(
 "group rounded-md border p-5 transition-supabase",
 compareMode && isSelected
 ? "border-brand-500/50 bg-brand-200/10"
 : "border-border bg-surface-100 hover:border-border-strong hover:bg-surface-75",
 compareMode && "cursor-pointer"
 )}
 onClick={() => compareMode && toggleModelSelection(model.id)}
 >
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div className="flex items-start gap-3">
 {compareMode && (
 <div
 className={cn(
 "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2",
 isSelected
 ? "border-brand-500 bg-brand-500"
 : "border-border-muted bg-surface-200"
 )}
 >
 {isSelected && <Check className="h-3 w-3 text-background" />}
 </div>
 )}
 <div>
 <div className="flex flex-wrap items-center gap-2">
 <h3 className="text-sm font-semibold text-foreground">{model.name}</h3>
 {model.isDefault && (
 <Badge variant="solid-primary" size="xs">
 Default
 </Badge>
 )}
 {model.isNew && (
 <Badge variant="warning" size="xs">
 new
 </Badge>
 )}
 </div>
 <p className="text-[12px] text-foreground-light">{model.provider}</p>
 </div>
 </div>
 <div className="flex flex-wrap items-center gap-1">
 {model.tags.slice(0, 2).map((tag) => (
 <Badge key={tag} variant="secondary" size="xs">
 {tag}
 </Badge>
 ))}
 </div>
 </div>

 <p className="mt-3 text-[13px] text-foreground-light line-clamp-2">
 {model.description}
 </p>

 <div className="mt-4 flex flex-wrap gap-2">
 {model.capabilities.map((cap) => {
 const config = capabilities[cap as keyof typeof capabilities];
 const Icon = config.icon;
 return (
 <Badge
 key={cap}
 variant="secondary"
 size="sm"
 icon={<Icon className={cn("h-3 w-3", config.color)} />}
 className="bg-surface-200"
 >
 {config.label}
 </Badge>
 );
 })}
 </div>

 <div className="mt-4 grid gap-3 border-t border-border pt-4 md:grid-cols-2">
 <div className="space-y-2">
 <div className="flex items-center justify-between text-xs">
 <span className="text-foreground-muted">Rating</span>
 <span className="font-medium text-foreground">{model.quality}/100</span>
 </div>
 <Progress value={model.quality} size="sm" />
 </div>
 <div className="space-y-2">
 <div className="flex items-center justify-between text-xs">
 <span className="text-foreground-muted">Speed</span>
 <span className={cn("font-medium", speed.color)}>{speed.label}</span>
 </div>
 <Progress value={speed.value} size="sm" variant={speed.value >= 75 ? "success" : "default"} />
 </div>
 </div>

 <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-[12px] text-foreground-light">
 <div className="flex flex-wrap items-center gap-4">
 <span>
 Context <span className="text-foreground">{(model.contextWindow / 1000).toFixed(0)}K</span>
 </span>
 <span>
 Input <span className="text-foreground">${model.inputPrice}/1K</span>
 </span>
 <span>
 Output <span className="text-foreground">${model.outputPrice}/1K</span>
 </span>
 </div>
 {!compareMode && (
 <div className="flex items-center gap-2">
 <Button
 variant="ghost"
 size="sm"
 rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
 className="text-foreground-light hover:text-foreground"
 >
 Document
 </Button>
 <Button size="sm">Use this model</Button>
 </div>
 )}
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>

 {selectedModels.length >= 2 && (
 <div className="page-panel">
                <div className="page-panel-header">
                  <div>
                    <p className="page-panel-title">Model comparison</p>
                    <p className="page-panel-description">Selected {selectedModels.length} model(s)</p>
                  </div>
                </div>
 <div className="px-6 pb-6 overflow-x-auto">
 <table className="w-full text-[12px]">
 <thead className="bg-surface-200 text-foreground-muted">
 <tr>
 <th className="text-left py-3 px-4 text-[11px] font-medium uppercase tracking-wider">
 Metrics
 </th>
 {selectedModels.map((modelId) => {
 const model = models.find((m) => m.id === modelId);
 return (
 <th key={modelId} className="text-center py-3 px-4 font-medium text-foreground">
 {model?.name}
 </th>
 );
 })}
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 <tr>
 <td className="py-3 px-4 text-foreground-light">Rating</td>
 {selectedModels.map((modelId) => {
 const model = models.find((m) => m.id === modelId);
 return (
 <td key={modelId} className="text-center py-3 px-4 font-medium text-foreground">
 {model?.quality}
 </td>
 );
 })}
 </tr>
 <tr>
 <td className="py-3 px-4 text-foreground-light">Context window</td>
 {selectedModels.map((modelId) => {
 const model = models.find((m) => m.id === modelId);
 return (
 <td key={modelId} className="text-center py-3 px-4 text-foreground">
 {model && (model.contextWindow / 1000).toFixed(0)}K
 </td>
 );
 })}
 </tr>
 <tr>
 <td className="py-3 px-4 text-foreground-light">Input price</td>
 {selectedModels.map((modelId) => {
 const model = models.find((m) => m.id === modelId);
 return (
 <td key={modelId} className="text-center py-3 px-4 text-foreground">
 ${model?.inputPrice}/1K
 </td>
 );
 })}
 </tr>
 <tr>
 <td className="py-3 px-4 text-foreground-light">Output price</td>
 {selectedModels.map((modelId) => {
 const model = models.find((m) => m.id === modelId);
 return (
 <td key={modelId} className="text-center py-3 px-4 text-foreground">
 ${model?.outputPrice}/1K
 </td>
 );
 })}
 </tr>
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>

 <aside className="space-y-4 lg:sticky lg:top-6 self-start">
 <div className="page-panel">
              <div className="page-panel-header">
                <div>
                  <p className="page-panel-title">Compare list</p>
                  <p className="page-panel-description">Select up to {compareLimit} models</p>
                </div>
              </div>
              <div className="p-6 space-y-3">
                {compareMode ? (
                  <>
                    {selectedModelDetails.length === 0 ? (
                      <div className="rounded-md border border-dashed border-border-muted bg-surface-100/60 p-4 text-center text-[13px] text-foreground-light">
                        Select models to add to comparison list.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedModelDetails.map((model) => (
                          <div
                            key={model.id}
                            className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-100 px-3 py-2"
                          >
                            <div>
                              <p className="text-[13px] font-medium text-foreground">{model.name}</p>
                              <p className="text-[11px] text-foreground-muted">{model.provider}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => toggleModelSelection(model.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2">
                      <Button size="sm" disabled={selectedModelDetails.length < 2}>
                        Start comparison
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!selectedModelDetails.length}
                        onClick={() => setSelectedModels([])}
                      >
                        Clear
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[13px] text-foreground-light">
                      Enable comparison to compare multiple models by speed and price.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setCompareMode(true)}>
                      Enable comparison
                    </Button>
                  </div>
                )}
 </div>
 </div>

 <div className="page-panel">
              <div className="page-panel-header">
                <div>
                  <p className="page-panel-title">Recommended strategy</p>
                  <p className="page-panel-description">Select models based on quality, speed and popularity.</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-200">
                    <Shield className="h-4 w-4 text-brand-500" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">Default recommendation</p>
                    <p className="text-xs text-foreground-light">
                      {defaultModel?.name || "Not configured"} is the default model.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-200">
                    <Gauge className="h-4 w-4 text-foreground-light" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">Latency priority</p>
                    <p className="text-xs text-foreground-light">
                      {fastestModel.name} ({fastestSpeedLabel}) suitable for real-time interactive scenarios.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-200">
                    <Target className="h-4 w-4 text-foreground-light" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">Quality priority</p>
                    <p className="text-xs text-foreground-light">
                      {topQualityModel.name} highest quality ({topQualityModel.quality}/100).
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-200">
                    <TrendingUp className="h-4 w-4 text-foreground-light" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">Popular choice</p>
                    <p className="text-xs text-foreground-light">
                      {mostPopularModel.name} highest usage rate ({mostPopularModel.popularity}%).
                    </p>
                  </div>
                </div>
 </div>
 </div>
 </aside>
 </section>
 </div>
 </PageContainer>
 );
}
