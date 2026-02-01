"use client";

/**
 * 应用偏好设置页面 - Supabase 风格
 * 外观、语言、默认设置等
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import {
  Settings,
  Sun,
  Moon,
  Monitor,
  Globe,
  Type,
  Layout,
  Palette,
  Bell,
  Zap,
  Bot,
  MessageSquare,
  Clock,
  Save,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  Info,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 主题选项
const themeOptions = [
  { id: "light", label: "浅色", icon: Sun, preview: "bg-surface-100" },
  { id: "dark", label: "深色", icon: Moon, preview: "bg-background-studio" },
  { id: "system", label: "跟随系统", icon: Monitor, preview: "bg-surface-100" },
];

// 语言选项
const languageOptions = [
  { id: "zh-CN", label: "简体中文", flag: "🇨🇳" },
  { id: "zh-TW", label: "繁體中文", flag: "🇹🇼" },
  { id: "en-US", label: "English", flag: "🇺🇸" },
  { id: "ja-JP", label: "日本語", flag: "🇯🇵" },
];

// 字体大小选项
const fontSizeOptions = [
  { id: "small", label: "小", size: "14px" },
  { id: "medium", label: "中", size: "16px" },
  { id: "large", label: "大", size: "18px" },
];

// 默认 AI 模型
const defaultModels = [
  { id: "gpt-4", label: "GPT-4", provider: "OpenAI" },
  { id: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", provider: "OpenAI" },
  { id: "claude-3", label: "Claude 3", provider: "Anthropic" },
  { id: "gemini-pro", label: "Gemini Pro", provider: "Google" },
];

// 开关组件
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
        checked ? "bg-brand-500" : "bg-surface-200"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-sm transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-[2px]"
        )}
      />
    </button>
  );
}

export default function PreferencesPage() {
  const [theme, setTheme] = useState("dark");
  const [language, setLanguage] = useState("zh-CN");
  const [fontSize, setFontSize] = useState("medium");
  const [defaultModel, setDefaultModel] = useState("gpt-4");
  const [autoSave, setAutoSave] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [defaultWorkflowView, setDefaultWorkflowView] = useState("grid");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 保存设置
  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // 重置设置
  const handleReset = () => {
    setTheme("dark");
    setLanguage("zh-CN");
    setFontSize("medium");
    setDefaultModel("gpt-4");
    setAutoSave(true);
    setSoundEffects(true);
    setAnimationEnabled(true);
    setCompactMode(false);
    setShowWelcome(true);
    setDefaultWorkflowView("grid");
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Settings"
          title="应用偏好"
          description="自定义您的使用体验"
          actions={(
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="border-border text-foreground-light hover:text-foreground"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                重置默认
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="bg-brand-500 hover:bg-brand-600 text-background"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : saved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    已保存
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    保存更改
                  </>
                )}
              </Button>
            </div>
          )}
        />

        <div className="page-section">
        {/* 外观设置 */}
        <div className="page-panel">
          <div className="page-panel-header">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-brand-200 flex items-center justify-center">
                <Palette className="w-4 h-4 text-brand-500" />
              </div>
              <div>
                <h2 className="page-panel-title">外观设置</h2>
                <p className="page-panel-description mt-1">自定义界面外观</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* 主题 */}
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-3">主题</label>
              <div className="page-grid grid-cols-3 gap-3">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setTheme(option.id)}
                      className={cn(
                        "p-4 rounded-md border transition-all text-center",
                        theme === option.id
                          ? "border-brand-400 bg-brand-200"
                          : "border-border hover:border-border-strong"
                      )}
                    >
                      <div className={cn("w-full h-8 rounded-md mb-3", option.preview)} />
                      <div className="flex items-center justify-center gap-2">
                        <Icon className="w-4 h-4 text-foreground-muted" />
                        <span className="text-[13px] font-medium text-foreground">{option.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 字体大小 */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[13px] font-medium text-foreground">字体大小</h4>
                <p className="text-xs text-foreground-muted">调整界面文字大小</p>
              </div>
              <div className="flex items-center gap-2">
                {fontSizeOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setFontSize(option.id)}
                    className={cn(
                      "px-4 py-2 rounded-md text-[13px] transition-all",
                      fontSize === option.id
                        ? "bg-brand-500 text-background"
                        : "bg-surface-200 text-foreground-light hover:text-foreground"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 动画效果 */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[13px] font-medium text-foreground">动画效果</h4>
                <p className="text-xs text-foreground-muted">启用界面动画和过渡效果</p>
              </div>
              <Toggle checked={animationEnabled} onChange={setAnimationEnabled} />
            </div>

            {/* 紧凑模式 */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[13px] font-medium text-foreground">紧凑模式</h4>
                <p className="text-xs text-foreground-muted">减少界面元素间距</p>
              </div>
              <Toggle checked={compactMode} onChange={setCompactMode} />
            </div>
          </div>
        </div>

        {/* 语言和区域 */}
        <div className="page-panel">
          <div className="page-panel-header">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-brand-200 flex items-center justify-center">
                <Globe className="w-4 h-4 text-brand-500" />
              </div>
              <div>
                <h2 className="page-panel-title">语言和区域</h2>
                <p className="page-panel-description mt-1">设置显示语言</p>
              </div>
            </div>
          </div>

          <div className="p-6 flex items-center justify-between">
            <div>
              <h4 className="text-[13px] font-medium text-foreground">界面语言</h4>
              <p className="text-xs text-foreground-muted">选择显示语言</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[160px] justify-between border-border text-foreground-light">
                  <span className="flex items-center gap-2">
                    {languageOptions.find((l) => l.id === language)?.flag}
                    {languageOptions.find((l) => l.id === language)?.label}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {languageOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    onClick={() => setLanguage(option.id)}
                    className="flex items-center gap-2"
                  >
                    <span>{option.flag}</span>
                    <span>{option.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 默认设置 */}
        <div className="page-panel">
          <div className="page-panel-header">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-brand-200 flex items-center justify-center">
                <Settings className="w-4 h-4 text-brand-500" />
              </div>
              <div>
                <h2 className="page-panel-title">默认设置</h2>
                <p className="page-panel-description mt-1">配置默认行为</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* 默认 AI 模型 */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[13px] font-medium text-foreground">默认 AI 模型</h4>
                <p className="text-xs text-foreground-muted">新对话使用的默认模型</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="min-w-[180px] justify-between border-border text-foreground-light">
                    <span className="flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      {defaultModels.find((m) => m.id === defaultModel)?.label}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {defaultModels.map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => setDefaultModel(model.id)}
                    >
                      <div>
                        <p className="font-medium">{model.label}</p>
                        <p className="text-xs text-foreground-muted">{model.provider}</p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* 自动保存 */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[13px] font-medium text-foreground">自动保存</h4>
                <p className="text-xs text-foreground-muted">自动保存工作流和文档更改</p>
              </div>
              <Toggle checked={autoSave} onChange={setAutoSave} />
            </div>

            {/* 音效 */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[13px] font-medium text-foreground">音效提示</h4>
                <p className="text-xs text-foreground-muted">操作完成时播放提示音</p>
              </div>
              <Toggle checked={soundEffects} onChange={setSoundEffects} />
            </div>

            {/* 欢迎页面 */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[13px] font-medium text-foreground">显示欢迎页面</h4>
                <p className="text-xs text-foreground-muted">登录后显示快速入门引导</p>
              </div>
              <Toggle checked={showWelcome} onChange={setShowWelcome} />
            </div>

            {/* 默认工作流视图 */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[13px] font-medium text-foreground">工作流默认视图</h4>
                <p className="text-xs text-foreground-muted">工作流列表的默认展示方式</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDefaultWorkflowView("grid")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[13px] transition-all",
                    defaultWorkflowView === "grid"
                      ? "bg-brand-500 text-background"
                      : "bg-surface-200 text-foreground-light hover:text-foreground"
                  )}
                >
                  网格
                </button>
                <button
                  onClick={() => setDefaultWorkflowView("list")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[13px] transition-all",
                    defaultWorkflowView === "list"
                      ? "bg-brand-500 text-background"
                      : "bg-surface-200 text-foreground-light hover:text-foreground"
                  )}
                >
                  列表
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="page-panel bg-brand-200/40 border-brand-400/30">
          <div className="p-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] text-foreground">
                更改将在保存后立即生效。部分设置可能需要刷新页面。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </PageContainer>
  );
}
