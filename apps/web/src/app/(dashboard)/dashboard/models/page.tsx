"use client";

/**
 * AI 模型管理页面
 * 查看、比较和配置可用的 AI 模型
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

// 模型能力类型
const capabilities = {
  chat: { label: "对话", icon: MessageSquare, color: "text-brand-500" },
  code: { label: "代码", icon: Code, color: "text-brand-500" },
  analysis: { label: "分析", icon: FileText, color: "text-foreground-light" },
  creative: { label: "创意", icon: Sparkles, color: "text-foreground-light" },
  vision: { label: "视觉", icon: ImageIcon, color: "text-foreground-light" },
};

const compareLimit = 3;

const statusFilters = [
  { id: "all", label: "全部模型" },
  { id: "default", label: "默认模型" },
  { id: "new", label: "新上线" },
] as const;

// 模型数据
const models = [
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "OpenAI",
    description: "最新的 GPT-4 模型，具有更强的推理能力和更长的上下文窗口",
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
    tags: ["推荐", "多模态"],
  },
  {
    id: "gpt-4",
    name: "GPT-4",
    provider: "OpenAI",
    description: "强大的通用语言模型，适合复杂任务和深度推理",
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
    tags: ["稳定"],
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    description: "快速且经济实惠的模型，适合大多数日常任务",
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
    tags: ["经济"],
  },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    provider: "Anthropic",
    description: "Anthropic 最强大的模型，擅长复杂分析和创意写作",
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
    tags: ["最强", "长上下文"],
  },
  {
    id: "claude-3-sonnet",
    name: "Claude 3 Sonnet",
    provider: "Anthropic",
    description: "平衡性能与成本的中端模型",
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
    tags: ["平衡"],
  },
  {
    id: "claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    description: "速度最快的 Claude 模型，适合实时应用",
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
    tags: ["最快", "经济"],
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    provider: "Google",
    description: "Google 的多模态 AI 模型，支持文本和图像理解",
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
    tags: ["多模态"],
  },
  {
    id: "llama-3-70b",
    name: "Llama 3 70B",
    provider: "Meta",
    description: "开源的大型语言模型，性能接近闭源模型",
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
    tags: ["开源"],
  },
];

// 速度配置
const speedConfig = {
  "very-fast": { label: "极快", color: "text-brand-500", value: 95 },
  fast: { label: "快速", color: "text-brand-500", value: 75 },
  medium: { label: "中等", color: "text-foreground-light", value: 50 },
  slow: { label: "较慢", color: "text-foreground-light", value: 25 },
};

// 使用统计
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

  // 获取所有提供商
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

  // 筛选和排序模型
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
          title="AI 模型"
          description="浏览、比较并配置可用的 AI 模型"
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
                {compareMode ? "退出比较" : "比较模型"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Settings className="h-4 w-4" />}
              >
                模型设置
              </Button>
            </div>
          )}
        >
          <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
            <span className="inline-flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5" />
              模型数量 {models.length}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Crown className="h-3.5 w-3.5" />
              默认模型 {defaultModel?.name || "未设置"}
            </span>
            {compareMode && (
              <Badge variant="primary" size="xs">
                比较模式已开启 · {selectedModels.length}/{compareLimit}
              </Badge>
            )}
          </div>
        </PageHeader>

        <div className="page-divider" />

        <div className="page-grid sm:grid-cols-2 lg:grid-cols-4">
          <div className="page-panel p-4">
            <div className="flex items-center justify-between text-xs text-foreground-muted">
              <span>Token 消耗</span>
              <Zap className="h-4 w-4" />
            </div>
            <div className="mt-3 text-stat-number text-foreground">
              {(usageStats.totalTokens / 1000000).toFixed(2)}M
            </div>
            <p className="text-xs text-foreground-light">本月调用总量</p>
          </div>
          <div className="page-panel p-4">
            <div className="flex items-center justify-between text-xs text-foreground-muted">
              <span>本月费用</span>
              <DollarSign className="h-4 w-4" />
            </div>
            <div className="mt-3 text-stat-number text-foreground">
              ${usageStats.totalCost.toFixed(2)}
            </div>
            <p className="text-xs text-foreground-light">按实际账单统计</p>
          </div>
          <div className="page-panel p-4">
            <div className="flex items-center justify-between text-xs text-foreground-muted">
              <span>常用模型</span>
              <Star className="h-4 w-4 text-brand-500" />
            </div>
            <div className="mt-3 text-sm font-semibold text-foreground">
              {favoriteModel?.name || "未设置"}
            </div>
            <p className="text-xs text-foreground-light">过去 30 天调用最高</p>
          </div>
          <div className="page-panel p-4">
            <div className="flex items-center justify-between text-xs text-foreground-muted">
              <span>平均响应</span>
              <Clock className="h-4 w-4" />
            </div>
            <div className="mt-3 text-stat-number text-foreground">
              {usageStats.avgResponseTime}ms
            </div>
            <p className="text-xs text-foreground-light">近一周平均延迟</p>
          </div>
        </div>

        {compareMode && (
          <div className="page-panel border-brand-500/30 bg-brand-200/10 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-brand-500" />
                <p className="text-sm font-medium text-foreground">比较模式已开启</p>
              </div>
              <Badge variant="solid-primary" size="sm">
                已选 {selectedModels.length}/{compareLimit}
              </Badge>
            </div>
            <p className="mt-2 text-[13px] text-foreground-light">
              选择最多 {compareLimit} 个模型进行对比，点击卡片即可加入或移除。
            </p>
          </div>
        )}

        <div className="page-panel">
          <div className="page-panel-header flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="page-panel-title">筛选与排序</p>
              <p className="page-panel-description">按能力、提供商与价格快速定位模型。</p>
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
                清除筛选
              </Button>
            )}
          </div>

          <div className="px-6 pb-6 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="w-full max-w-md">
                <Input
                  variant="search"
                  inputSize="sm"
                  placeholder="搜索模型名称、描述或关键词..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger className="h-8 w-[150px] bg-surface-200 border-border text-foreground-light">
                    <SelectValue placeholder="提供商" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有提供商</SelectItem>
                    {providers.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {provider}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCapability} onValueChange={setSelectedCapability}>
                  <SelectTrigger className="h-8 w-[150px] bg-surface-200 border-border text-foreground-light">
                    <SelectValue placeholder="能力" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有能力</SelectItem>
                    {Object.entries(capabilities).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-8 w-[150px] bg-surface-200 border-border text-foreground-light">
                    <SelectValue placeholder="排序" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popularity">按热度</SelectItem>
                    <SelectItem value="quality">按质量</SelectItem>
                    <SelectItem value="price">按价格</SelectItem>
                    <SelectItem value="speed">按速度</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-foreground-muted">状态</span>
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
                  <p className="page-panel-title">模型列表</p>
                  <p className="page-panel-description">
                    当前显示 {filteredModels.length} 个模型，按需选择与配置。
                  </p>
                </div>
                <Badge variant="secondary" size="xs">
                  显示 {filteredModels.length} 个
                </Badge>
              </div>
              <div className="px-6 pb-6 pt-4">
                {filteredModels.length === 0 ? (
                  <EmptyState
                    icon={<Search className="h-5 w-5" />}
                    title="未找到匹配模型"
                    description="尝试调整关键词、提供商或能力筛选。"
                    className="px-0 py-12"
                    action={isFiltering ? {
                      label: "清除筛选",
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
                                      默认
                                    </Badge>
                                  )}
                                  {model.isNew && (
                                    <Badge variant="warning" size="xs">
                                      新
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
                                <span className="text-foreground-muted">质量评分</span>
                                <span className="font-medium text-foreground">{model.quality}/100</span>
                              </div>
                              <Progress value={model.quality} size="sm" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-foreground-muted">速度</span>
                                <span className={cn("font-medium", speed.color)}>{speed.label}</span>
                              </div>
                              <Progress value={speed.value} size="sm" variant={speed.value >= 75 ? "success" : "default"} />
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-[12px] text-foreground-light">
                            <div className="flex flex-wrap items-center gap-4">
                              <span>
                                上下文 <span className="text-foreground">{(model.contextWindow / 1000).toFixed(0)}K</span>
                              </span>
                              <span>
                                输入 <span className="text-foreground">${model.inputPrice}/1K</span>
                              </span>
                              <span>
                                输出 <span className="text-foreground">${model.outputPrice}/1K</span>
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
                                  文档
                                </Button>
                                <Button size="sm">使用此模型</Button>
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
                    <p className="page-panel-title">模型对比</p>
                    <p className="page-panel-description">已选择 {selectedModels.length} 个模型</p>
                  </div>
                </div>
                <div className="px-6 pb-6 overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead className="bg-surface-200 text-foreground-muted">
                      <tr>
                        <th className="text-left py-3 px-4 text-[11px] font-medium uppercase tracking-wider">
                          指标
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
                        <td className="py-3 px-4 text-foreground-light">质量评分</td>
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
                        <td className="py-3 px-4 text-foreground-light">上下文窗口</td>
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
                        <td className="py-3 px-4 text-foreground-light">输入价格</td>
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
                        <td className="py-3 px-4 text-foreground-light">输出价格</td>
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
                  <p className="page-panel-title">比较列表</p>
                  <p className="page-panel-description">最多选择 {compareLimit} 个模型</p>
                </div>
              </div>
              <div className="p-6 space-y-3">
                {compareMode ? (
                  <>
                    {selectedModelDetails.length === 0 ? (
                      <div className="rounded-md border border-dashed border-border-muted bg-surface-100/60 p-4 text-center text-[13px] text-foreground-light">
                        选择模型加入比较列表。
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
                        开始比较
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!selectedModelDetails.length}
                        onClick={() => setSelectedModels([])}
                      >
                        清空
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[13px] text-foreground-light">
                      开启比较模式以对比多个模型的质量、速度与价格。
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setCompareMode(true)}>
                      开启比较
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="page-panel">
              <div className="page-panel-header">
                <div>
                  <p className="page-panel-title">推荐策略</p>
                  <p className="page-panel-description">根据质量、速度与热度选择模型。</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-200">
                    <Shield className="h-4 w-4 text-brand-500" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">默认与回退</p>
                    <p className="text-xs text-foreground-light">
                      {defaultModel?.name || "未设置"} 作为稳态回退模型。
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-200">
                    <Gauge className="h-4 w-4 text-foreground-light" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">低延迟优先</p>
                    <p className="text-xs text-foreground-light">
                      {fastestModel.name}（{fastestSpeedLabel}）适合实时交互场景。
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-200">
                    <Target className="h-4 w-4 text-foreground-light" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">质量优先</p>
                    <p className="text-xs text-foreground-light">
                      {topQualityModel.name} 质量评分最高（{topQualityModel.quality}/100）。
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-200">
                    <TrendingUp className="h-4 w-4 text-foreground-light" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">热门选择</p>
                    <p className="text-xs text-foreground-light">
                      {mostPopularModel.name} 使用率最高（{mostPopularModel.popularity}%）。
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
