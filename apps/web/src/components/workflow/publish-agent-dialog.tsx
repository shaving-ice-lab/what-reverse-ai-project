"use client";

/**
 * 发布 Agent 对话框组件
 * 
 * 允许用户将工作流发布到 Agent 商店
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Bot,
  Upload,
  X,
  DollarSign,
  Tag,
  Image,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { agentApi } from "@/lib/api";
import type { AgentCategory, PricingType, PublishAgentRequest } from "@/types/agent";
import { cn } from "@/lib/utils";

// 分类配置
const CATEGORIES: { id: AgentCategory; label: string; icon: string }[] = [
  { id: "content", label: "内容创作", icon: "📝" },
  { id: "data", label: "数据处理", icon: "📊" },
  { id: "customer", label: "客户服务", icon: "💬" },
  { id: "productivity", label: "办公效率", icon: "⚡" },
  { id: "developer", label: "开发工具", icon: "🛠️" },
  { id: "research", label: "研究分析", icon: "🔍" },
  { id: "education", label: "教育学习", icon: "📚" },
  { id: "finance", label: "金融财务", icon: "💰" },
  { id: "marketing", label: "市场营销", icon: "📈" },
  { id: "other", label: "其他", icon: "🎯" },
];

// 定价类型配置
const PRICING_TYPES: { id: PricingType; label: string; description: string }[] = [
  { id: "free", label: "免费", description: "任何人都可以免费使用" },
  { id: "paid", label: "单次付费", description: "用户一次性购买后永久使用" },
  { id: "subscription", label: "订阅制", description: "用户按月付费使用" },
];

// 常用标签
const POPULAR_TAGS = [
  "AI", "自动化", "效率提升", "数据分析", "文本处理",
  "图像处理", "客服", "内容生成", "翻译", "代码"
];

interface PublishAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
  workflowName: string;
  workflowDescription?: string;
  onSuccess?: (agentId: string) => void;
}

export function PublishAgentDialog({
  open,
  onOpenChange,
  workflowId,
  workflowName,
  workflowDescription,
  onSuccess,
}: PublishAgentDialogProps) {
  // 表单状态
  const [name, setName] = useState(workflowName);
  const [description, setDescription] = useState(workflowDescription || "");
  const [longDescription, setLongDescription] = useState("");
  const [category, setCategory] = useState<AgentCategory>("other");
  const [pricingType, setPricingType] = useState<PricingType>("free");
  const [price, setPrice] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [icon, setIcon] = useState("🤖");
  
  // UI 状态
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 重置表单
  useEffect(() => {
    if (open) {
      setName(workflowName);
      setDescription(workflowDescription || "");
      setLongDescription("");
      setCategory("other");
      setPricingType("free");
      setPrice("");
      setTags([]);
      setTagInput("");
      setIcon("🤖");
      setStep(1);
      setError(null);
      setSuccess(false);
    }
  }, [open, workflowName, workflowDescription]);

  // 添加标签
  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  // 移除标签
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // 添加热门标签
  const handleAddPopularTag = (tag: string) => {
    if (!tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
    }
  };

  // 验证步骤1
  const validateStep1 = () => {
    if (!name.trim()) {
      setError("请输入 Agent 名称");
      return false;
    }
    if (!description.trim()) {
      setError("请输入简短描述");
      return false;
    }
    setError(null);
    return true;
  };

  // 验证步骤2
  const validateStep2 = () => {
    if (pricingType !== "free" && (!price || parseFloat(price) <= 0)) {
      setError("请输入有效的价格");
      return false;
    }
    setError(null);
    return true;
  };

  // 下一步
  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  // 上一步
  const handleBack = () => {
    setError(null);
    setStep(step - 1);
  };

  // 提交发布
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const request: PublishAgentRequest = {
        workflowId", name: name.trim()", description: description.trim(),
        longDescription: longDescription.trim() || undefined,
        icon,
        category,
        tags,
        pricingType,
        price: pricingType !== "free" ? parseFloat(price) : undefined,
      };

      const response = await agentApi.publish(request);
      
      setSuccess(true);
      
      // 延迟关闭并回调
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.(response.data.id);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "发布失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            发布到 Agent 商店
          </DialogTitle>
          <DialogDescription>
            将你的工作流发布为 Agent，让更多人使用
          </DialogDescription>
        </DialogHeader>

        {/* 步骤指示器 */}
        <div className="flex items-center justify-center gap-2 py-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  step >= s
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-200 text-foreground-light"
                )}
              >
                {success && s === 3 ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  s
                )}
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    "w-12 h-1 rounded-full transition-colors",
                    step > s ? "bg-primary" : "bg-surface-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* 步骤内容 */}
        <div className="py-4 min-h-[300px]">
          {/* 步骤 1: 基本信息 */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="grid grid-cols-[80px,1fr] gap-4 items-start">
                {/* 图标选择 */}
                <div>
                  <Label className="text-xs text-foreground-light mb-2 block">图标</Label>
                  <button
                    onClick={() => {
                      // 简单的 emoji 选择
                      const emojis = ["🤖", "⚡", "🎯", "🔮", "💡", "🚀", "✨", "🔧"];
                      const currentIndex = emojis.indexOf(icon);
                      setIcon(emojis[(currentIndex + 1) % emojis.length]);
                    }}
                    className="w-16 h-16 rounded-xl bg-surface-200 border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center text-3xl transition-colors"
                  >
                    {icon}
                  </button>
                </div>

                {/* 名称和分类 */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Agent 名称 *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="给你的 Agent 起个名字"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label>分类 *</Label>
                    <Select value={category} onValueChange={(v) => setCategory(v as AgentCategory)}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <span className="flex items-center gap-2">
                              <span>{cat.icon}</span>
                              <span>{cat.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="description">简短描述 *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="用一两句话描述这个 Agent 能做什么"
                  className="mt-1.5 resize-none"
                  rows={2}
                />
                <p className="text-xs text-foreground-light mt-1">
                  {description.length}/200 字符
                </p>
              </div>

              <div>
                <Label htmlFor="longDescription">详细介绍</Label>
                <Textarea
                  id="longDescription"
                  value={longDescription}
                  onChange={(e) => setLongDescription(e.target.value)}
                  placeholder="详细介绍你的 Agent 的功能、使用场景、特点等"
                  className="mt-1.5 resize-none"
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* 步骤 2: 定价和标签 */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <Label className="mb-3 block">定价方式</Label>
                <div className="grid gap-3">
                  {PRICING_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setPricingType(type.id)}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left",
                        pricingType === type.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                          pricingType === type.id
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        )}
                      >
                        {pricingType === type.id && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{type.label}</p>
                        <p className="text-sm text-foreground-light">{type.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {pricingType !== "free" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <Label htmlFor="price">价格 (USD) *</Label>
                  <div className="relative mt-1.5">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-light" />
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="pl-9"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label className="mb-3 block">标签（最多10个）</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="px-3 py-1 flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="输入标签"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  />
                  <Button variant="outline" onClick={handleAddTag} disabled={tags.length >= 10}>
                    添加
                  </Button>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-foreground-light mb-2">热门标签：</p>
                  <div className="flex flex-wrap gap-1">
                    {POPULAR_TAGS.filter((t) => !tags.includes(t)).slice(0, 6).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleAddPopularTag(tag)}
                        className="px-2 py-1 text-xs rounded-md bg-surface-200 text-foreground-light hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 步骤 3: 确认发布 */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    发布成功！
                  </h3>
                  <p className="text-sm text-foreground-light">
                    你的 Agent 已提交审核，审核通过后将在商店上架
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-muted/50 rounded-xl p-6">
                    <h4 className="text-sm font-medium text-foreground-light mb-4">确认发布信息</h4>
                    
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-card border border-border flex items-center justify-center text-3xl">
                        {icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{name}</h3>
                        <p className="text-sm text-foreground-light mt-1">{description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-foreground-light">分类</p>
                        <p className="font-medium text-foreground">
                          {CATEGORIES.find((c) => c.id === category)?.label}
                        </p>
                      </div>
                      <div>
                        <p className="text-foreground-light">定价</p>
                        <p className="font-medium text-foreground">
                          {pricingType === "free"
                            ? "免费"
                            : `$${parseFloat(price || "0").toFixed(2)}`}
                        </p>
                      </div>
                    </div>

                    {tags.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-foreground-light mb-2">标签</p>
                        <div className="flex flex-wrap gap-1">
                          {tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">提交后会发生什么？</p>
                      <p className="text-xs text-foreground-light mt-1">
                        你的 Agent 将进入审核队列，我们会在 1-3 个工作日内完成审核。
                        审核通过后，Agent 会自动在商店上架。
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* 底部按钮 */}
        {!success && (
          <DialogFooter className="gap-2 sm:gap-0">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                上一步
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                下一步
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    发布中...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    确认发布
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
