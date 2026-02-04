"use client";

/**
 * 编辑 Agent 页面
 * Supabase 风格：简约、专业、表单丰富
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Bot,
  ArrowLeft,
  Save,
  Trash2,
  Upload,
  Code,
  MessageSquare,
  Zap,
  Eye,
  Settings,
  AlertCircle,
  Check,
  X,
  RefreshCw,
  Play,
  Copy,
  Shield,
  Clock,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// 模拟 Agent 数据
const mockAgent = {
  id: "1",
  name: "客服助手",
  description: "智能客服机器人，能够处理常见问题并提供24/7支持",
  model: "gpt-4",
  capabilities: ["chat", "analyze"],
  systemPrompt: "你是一个专业的客服助手，帮助用户解决问题。请保持友好、专业的态度，如果遇到无法解决的问题，请引导用户联系人工客服。",
  welcomeMessage: "您好！我是智能客服助手，有什么可以帮助您的？",
  temperature: 0.7,
  maxTokens: 2048,
  avatar: null,
  status: "active",
  createdAt: "2026-01-15",
  updatedAt: "2026-01-28",
};

// AI 模型选项
const aiModels = [
  { id: "gpt-4", name: "GPT-4", provider: "OpenAI" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "OpenAI" },
  { id: "claude-3", name: "Claude 3", provider: "Anthropic" },
  { id: "qwen", name: "通义千问", provider: "阿里云" },
];

// 能力选项
const capabilities = [
  { id: "chat", name: "对话", icon: MessageSquare, description: "自然语言对话" },
  { id: "code", name: "代码", icon: Code, description: "代码生成和分析" },
  { id: "analyze", name: "分析", icon: Zap, description: "数据分析" },
  { id: "search", name: "搜索", icon: Eye, description: "网络搜索" },
];

export default function EditAgentPage() {
  const params = useParams();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "model" | "advanced">("basic");

  // 表单状态
  const [formData, setFormData] = useState({
    name: mockAgent.name, description: mockAgent.description,
    model: mockAgent.model,
    capabilities: mockAgent.capabilities,
    systemPrompt: mockAgent.systemPrompt,
    welcomeMessage: mockAgent.welcomeMessage,
    temperature: mockAgent.temperature,
    maxTokens: mockAgent.maxTokens,
    avatar: mockAgent.avatar,
  });

  // 更新表单
  const updateForm = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // 切换能力
  const toggleCapability = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      capabilities: prev.capabilities.includes(id)
        ? prev.capabilities.filter((c) => c !== id)
        : [...prev.capabilities, id],
    }));
    setHasChanges(true);
  };

  // 保存更改
  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    setHasChanges(false);
  };

  // 删除 Agent
  const handleDelete = () => {
    if (confirm("确定要删除这个 Agent 吗？此操作不可撤销。")) {
      router.push("/dashboard/my-agents");
    }
  };

  return (
    <div className="min-h-full bg-background-studio">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background-studio/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/my-agents/${params.id}`}
              className="flex items-center gap-2 text-[13px] text-foreground-light hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Link>
            <div className="h-5 w-px bg-border-muted" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-brand-200 flex items-center justify-center">
                <Bot className="w-4 h-4 text-brand-500" />
              </div>
              <div>
                <p className="page-caption">Agents</p>
                <h1 className="text-page-title text-foreground">编辑 Agent</h1>
                <p className="text-description">最后更新: {mockAgent.updatedAt}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-xs text-foreground-light flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                有未保存的更改
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-foreground-light hover:text-foreground hover:bg-surface-200 border-border"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              删除
            </Button>
            <Button
              size="sm"
              className="bg-brand-500 hover:bg-brand-600 text-background"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  保存更改
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border bg-surface-75/80">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-6">
            {[
              { id: "basic" as const, label: "基本信息", icon: Bot },
              { id: "model" as const, label: "模型配置", icon: Settings },
              { id: "advanced" as const, label: "高级设置", icon: Shield },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-1 py-4 border-b-2 text-[13px] font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-brand-400 text-brand-500"
                    : "border-transparent text-foreground-muted hover:text-foreground"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Basic Info */}
        {activeTab === "basic" && (
          <div className="space-y-8">
            <div className="p-5 rounded-md bg-surface-100 border border-border">
              <h3 className="text-sm font-medium text-foreground mb-6">基本信息</h3>
              
              <div className="space-y-6">
                {/* Avatar */}
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-2">
                    头像
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-md bg-surface-200 flex items-center justify-center border-2 border-dashed border-border">
                      {formData.avatar ? (
                        <img
                          src={formData.avatar}
                          alt=""
                          className="w-full h-full rounded-md object-cover"
                        />
                      ) : (
                        <Bot className="w-6 h-6 text-foreground-muted" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="border-border text-foreground-light">
                        <Upload className="w-4 h-4 mr-2" />
                        上传图片
                      </Button>
                      <p className="text-xs text-foreground-muted">
                        支持 JPG, PNG 格式，建议尺寸 512x512
                      </p>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-2">
                    Agent 名称 *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    placeholder="给您的 Agent 起个名字"
                    className="h-9 bg-surface-200 border-border"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-2">
                    描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                    placeholder="描述这个 Agent 的功能和用途..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-md bg-surface-200 border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none text-[13px]"
                  />
                </div>

                {/* Capabilities */}
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-3">
                    能力配置
                  </label>
                  <div className="page-grid sm:grid-cols-2">
                    {capabilities.map((cap) => (
                      <button
                        key={cap.id}
                        onClick={() => toggleCapability(cap.id)}
                        className={cn(
                          "p-4 rounded-md text-left transition-all",
                          formData.capabilities.includes(cap.id)
                            ? "bg-brand-200 border-2 border-brand-400"
                            : "bg-surface-75 border border-border hover:border-border-strong"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <cap.icon className={cn(
                            "w-4 h-4",
                            formData.capabilities.includes(cap.id)
                              ? "text-brand-500"
                              : "text-foreground-muted"
                          )} />
                          <div>
                            <span className="text-[13px] font-medium text-foreground">
                              {cap.name}
                            </span>
                            <p className="text-xs text-foreground-muted">
                              {cap.description}
                            </p>
                          </div>
                          {formData.capabilities.includes(cap.id) && (
                            <Check className="w-4 h-4 text-brand-500 ml-auto" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Prompts */}
            <div className="p-5 rounded-md bg-surface-100 border border-border">
              <h3 className="text-sm font-medium text-foreground mb-6">提示词配置</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-2">
                    系统提示词
                  </label>
                  <textarea
                    value={formData.systemPrompt}
                    onChange={(e) => updateForm("systemPrompt", e.target.value)}
                    placeholder="定义 Agent 的角色、行为和回复风格..."
                    rows={6}
                    className="w-full px-4 py-3 rounded-md bg-surface-200 border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none font-mono text-[13px]"
                  />
                  <p className="text-xs text-foreground-muted mt-2">
                    系统提示词会影响 Agent 的行为和回复风格
                  </p>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-2">
                    欢迎消息
                  </label>
                  <Input
                    value={formData.welcomeMessage}
                    onChange={(e) => updateForm("welcomeMessage", e.target.value)}
                    placeholder="Agent 开始对话时的欢迎消息..."
                    className="h-9 bg-surface-200 border-border"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Model Config */}
        {activeTab === "model" && (
          <div className="space-y-8">
            <div className="p-5 rounded-md bg-surface-100 border border-border">
              <h3 className="text-sm font-medium text-foreground mb-6">AI 模型</h3>
              
              <div className="page-grid sm:grid-cols-2">
                {aiModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => updateForm("model", model.id)}
                    className={cn(
                      "p-4 rounded-md text-left transition-all",
                      formData.model === model.id
                        ? "bg-brand-200 border-2 border-brand-400"
                        : "bg-surface-75 border border-border hover:border-border-strong"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[13px] font-medium text-foreground">
                          {model.name}
                        </span>
                        <p className="text-xs text-foreground-muted mt-0.5">
                          {model.provider}
                        </p>
                      </div>
                      {formData.model === model.id && (
                        <Check className="w-4 h-4 text-brand-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-md bg-surface-100 border border-border">
              <h3 className="text-sm font-medium text-foreground mb-6">参数设置</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-2">
                    温度 (Temperature)
                    <span className="ml-2 text-brand-500 font-normal">
                      {formData.temperature}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => updateForm("temperature", parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-foreground-muted mt-1">
                    <span>精确 (0)</span>
                    <span>创意 (2)</span>
                  </div>
                  <p className="text-xs text-foreground-muted mt-2">
                    较低的温度会产生更确定性的回复，较高的温度会产生更多样化的回复
                  </p>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-2">
                    最大 Token 数
                  </label>
                  <Input
                    type="number"
                    value={formData.maxTokens}
                    onChange={(e) => updateForm("maxTokens", parseInt(e.target.value))}
                    min={256}
                    max={8192}
                    className="h-9 bg-surface-200 border-border"
                  />
                  <p className="text-xs text-foreground-muted mt-2">
                    限制每次回复的最大长度（256 - 8192）
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Settings */}
        {activeTab === "advanced" && (
          <div className="space-y-8">
            <div className="p-5 rounded-md bg-surface-100 border border-border">
              <h3 className="text-sm font-medium text-foreground mb-6">状态管理</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-md bg-surface-75">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      mockAgent.status === "active" ? "bg-brand-500" : "bg-foreground-muted"
                    )} />
                    <div>
                      <div className="text-[13px] font-medium text-foreground">Agent 状态</div>
                      <div className="text-xs text-foreground-muted">
                        {mockAgent.status === "active" ? "运行中" : "已暂停"}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="border-border text-foreground-light">
                    {mockAgent.status === "active" ? "暂停" : "启动"}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-md bg-surface-75">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-foreground-muted" />
                    <div>
                      <div className="text-[13px] font-medium text-foreground">创建时间</div>
                      <div className="text-xs text-foreground-muted">
                        {mockAgent.createdAt}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-md bg-surface-100 border border-border">
              <h3 className="text-sm font-medium text-foreground mb-6">API 访问</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-2">
                    Agent ID
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={mockAgent.id}
                      readOnly
                      className="h-9 bg-surface-200 border-border font-mono"
                    />
                    <Button variant="outline" className="shrink-0 border-border text-foreground-light">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-md bg-surface-75">
                  <p className="text-xs text-foreground-muted">
                    使用 Agent ID 通过 API 调用此 Agent。
                    <Link href="/docs/api" className="text-brand-500 hover:underline ml-1">
                      查看 API 文档
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-md bg-surface-200 border border-border-strong">
              <h3 className="text-sm font-semibold text-foreground mb-4">危险操作</h3>
              <p className="text-xs text-foreground-light mb-4">
                删除 Agent 后将无法恢复，所有对话历史也将被删除。
              </p>
              <Button
                variant="outline"
                className="text-foreground-light border-border-strong hover:bg-surface-300"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                删除 Agent
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
