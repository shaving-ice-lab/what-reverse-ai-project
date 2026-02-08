"use client";

/**
 * App Preferences Page - Supabase Style
 * Appearance, Language, Default Settings, etc.
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

// Theme Options
const themeOptions = [
 { id: "light", label: "Light", icon: Sun, preview: "bg-surface-100" },
 { id: "dark", label: "Dark", icon: Moon, preview: "bg-background-studio" },
 { id: "system", label: "System", icon: Monitor, preview: "bg-surface-100" },
];

// Language Options
const languageOptions = [
 { id: "zh-CN", label: "", flag: "🇨🇳" },
 { id: "zh-TW", label: "", flag: "🇹🇼" },
 { id: "en-US", label: "English", flag: "🇺🇸" },
  { id: "ja-JP", label: "Japanese", flag: "🇯🇵" },
];

// Font Size Options
const fontSizeOptions = [
  { id: "small", label: "Small", size: "14px" },
  { id: "medium", label: "Medium", size: "16px" },
  { id: "large", label: "Large", size: "18px" },
];

// Default AI Model
const defaultModels = [
 { id: "gpt-4", label: "GPT-4", provider: "OpenAI" },
 { id: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", provider: "OpenAI" },
 { id: "claude-3", label: "Claude 3", provider: "Anthropic" },
 { id: "gemini-pro", label: "Gemini Pro", provider: "Google" },
];

// Toggle Component
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

  // Save Settings
 const handleSave = async () => {
 setIsSaving(true);
 await new Promise((resolve) => setTimeout(resolve, 1000));
 setIsSaving(false);
 setSaved(true);
 setTimeout(() => setSaved(false), 3000);
 };

  // Reset Settings
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
        title="App Preferences"
 description="Customize your experience"
 actions={(
 <div className="flex items-center gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={handleReset}
 className="border-border text-foreground-light hover:text-foreground"
 >
 <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Default
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
 Saving...
 </>
 ) : saved ? (
 <>
 <CheckCircle2 className="w-4 h-4 mr-2" />
 Saved
 </>
 ) : (
 <>
 <Save className="w-4 h-4 mr-2" />
            Save Changes
 </>
 )}
 </Button>
 </div>
 )}
 />

 <div className="page-section">
        {/* Appearance Settings */}
          <div className="page-panel">
            <div className="page-panel-header">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-brand-200 flex items-center justify-center">
                  <Palette className="w-4 h-4 text-brand-500" />
                </div>
                <div>
                  <h2 className="page-panel-title">Appearance</h2>
                  <p className="page-panel-description mt-1">Customize the look and feel</p>
 </div>
 </div>
 </div>

 <div className="p-6 space-y-6">
 {/* Theme */}
 <div>
 <label className="block text-[13px] font-medium text-foreground mb-3">Theme</label>
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

          {/* Font Size */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[13px] font-medium text-foreground">Font Size</h4>
                <p className="text-xs text-foreground-muted">Adjust the interface font size</p>
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

          {/* Animation Effects */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[13px] font-medium text-foreground">Animation Effects</h4>
 <p className="text-xs text-foreground-muted">Enable page animation and transition effects</p>
 </div>
 <Toggle checked={animationEnabled} onChange={setAnimationEnabled} />
 </div>

 {/* Compact */}
 <div className="flex items-center justify-between">
 <div>
            <h4 className="text-[13px] font-medium text-foreground">Compact Mode</h4>
                <p className="text-xs text-foreground-muted">Reduce spacing between interface elements</p>
 </div>
 <Toggle checked={compactMode} onChange={setCompactMode} />
 </div>
 </div>
 </div>

        {/* Language and Region */}
          <div className="page-panel">
            <div className="page-panel-header">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-brand-200 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-brand-500" />
                </div>
                <div>
                  <h2 className="page-panel-title">Language and Region</h2>
 <p className="page-panel-description mt-1">Set display language</p>
 </div>
 </div>
 </div>

 <div className="p-6 flex items-center justify-between">
 <div>
            <h4 className="text-[13px] font-medium text-foreground">Display Language</h4>
 <p className="text-xs text-foreground-muted">Select display language</p>
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

        {/* Default Settings */}
          <div className="page-panel">
            <div className="page-panel-header">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-brand-200 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-brand-500" />
                </div>
                <div>
                  <h2 className="page-panel-title">Default Settings</h2>
                  <p className="page-panel-description mt-1">Configure default behaviors</p>
 </div>
 </div>
 </div>

 <div className="p-6 space-y-6">
 {/* Default AI Model */}
 <div className="flex items-center justify-between">
 <div>
 <h4 className="text-[13px] font-medium text-foreground">Default AI Model</h4>
 <p className="text-xs text-foreground-muted">Default model for new conversations</p>
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

          {/* Auto Save */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[13px] font-medium text-foreground">Auto Save</h4>
 <p className="text-xs text-foreground-muted">Auto-save workflow and document changes</p>
 </div>
 <Toggle checked={autoSave} onChange={setAutoSave} />
 </div>

          {/* Sound Effects */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[13px] font-medium text-foreground">Sound Effects</h4>
                <p className="text-xs text-foreground-muted">Play a sound when an action completes</p>
 </div>
 <Toggle checked={soundEffects} onChange={setSoundEffects} />
 </div>

          {/* Welcome Page */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[13px] font-medium text-foreground">Display welcome page</h4>
                <p className="text-xs text-foreground-muted">Show a quick start guide after signing in</p>
 </div>
 <Toggle checked={showWelcome} onChange={setShowWelcome} />
 </div>

          {/* Default Workflow View */}
 <div className="flex items-center justify-between">
 <div>
 <h4 className="text-[13px] font-medium text-foreground">Workflow default view</h4>
 <p className="text-xs text-foreground-muted">Default way to display workflow list</p>
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
 Grid
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
 List
 </button>
 </div>
 </div>
 </div>
 </div>

        {/* Info Notice */}
          <div className="page-panel bg-brand-200/40 border-brand-400/30">
            <div className="p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] text-foreground">
                  Changes take effect after saving. Some settings may require a page refresh.
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </PageContainer>
 );
}
