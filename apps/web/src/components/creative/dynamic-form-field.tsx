"use client";

/**
 * 动态表单字段组件
 * 
 * 根据 InputField 类型定义动态渲染不同类型的表单控件
 * 支持验证、AI 建议、条件显示等功能
 */

import { useState, useCallback } from "react";
import {
  Sparkles,
  HelpCircle,
  AlertCircle,
  Check,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { InputField, InputValidation } from "@/types/creative";

export interface DynamicFormFieldProps {
  field: InputField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  isRequired?: boolean;
  onAISuggest?: (fieldId: string, prompt: string) => Promise<string>;
  allValues?: Record<string, unknown>;
}

/**
 * 验证字段值
 */
export function validateFieldValue(
  value: unknown,
  validation?: InputValidation,
  isRequired?: boolean
): string | undefined {
  // 必填验证
  if (isRequired || validation?.required) {
    if (value === undefined || value === null || value === "") {
      return "此字段为必填项";
    }
    if (Array.isArray(value) && value.length === 0) {
      return "请至少选择一项";
    }
  }

  // 如果值为空且非必填，跳过其他验证
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const strValue = String(value);

  // 长度验证
  if (validation?.minLength && strValue.length < validation.minLength) {
    return `至少需要 ${validation.minLength} 个字符`;
  }
  if (validation?.maxLength && strValue.length > validation.maxLength) {
    return `最多允许 ${validation.maxLength} 个字符`;
  }

  // 数值范围验证
  if (typeof value === "number") {
    if (validation?.min !== undefined && value < validation.min) {
      return `不能小于 ${validation.min}`;
    }
    if (validation?.max !== undefined && value > validation.max) {
      return `不能大于 ${validation.max}`;
    }
  }

  // 正则验证
  if (validation?.pattern) {
    const regex = new RegExp(validation.pattern);
    if (!regex.test(strValue)) {
      return validation.patternMessage || "格式不正确";
    }
  }

  return undefined;
}

/**
 * 检查条件显示
 */
export function checkShowCondition(
  field: InputField,
  allValues: Record<string, unknown>
): boolean {
  if (!field.showWhen) return true;

  const { field: dependField, operator", value: expectedValue } = field.showWhen;
  const actualValue = allValues[dependField];

  switch (operator) {
    case "eq":
      return actualValue === expectedValue;
    case "neq":
      return actualValue !== expectedValue;
    case "contains":
      if (Array.isArray(actualValue)) {
        return actualValue.includes(expectedValue);
      }
      return String(actualValue).includes(String(expectedValue));
    case "notEmpty":
      return actualValue !== undefined && actualValue !== null && actualValue !== "";
    default:
      return true;
  }
}

/**
 * 动态表单字段组件
 */
export function DynamicFormField({
  field,
  value,
  onChange,
  error,
  isRequired,
  onAISuggest,
  allValues = {},
}: DynamicFormFieldProps) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  // 检查条件显示
  if (!checkShowCondition(field, allValues)) {
    return null;
  }

  // AI 建议处理
  const handleAISuggest = useCallback(async () => {
    if (!onAISuggest || !field.aiSuggestPrompt) return;

    setAiLoading(true);
    try {
      const suggestion = await onAISuggest(field.id, field.aiSuggestPrompt);
      setAiSuggestion(suggestion);
    } catch (err) {
      console.error("AI suggest failed:", err);
    } finally {
      setAiLoading(false);
    }
  }, [onAISuggest, field.id, field.aiSuggestPrompt]);

  // 应用 AI 建议
  const applyAISuggestion = useCallback(() => {
    if (aiSuggestion) {
      onChange(aiSuggestion);
      setAiSuggestion(null);
    }
  }, [aiSuggestion, onChange]);

  // 渲染表单控件
  const renderControl = () => {
    switch (field.type) {
      case "text":
        return (
          <Input
            id={field.id}
            value={String(value || "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={cn(
              "bg-white dark:bg-card border-border",
              error && "border-red-500 dark:border-red-500"
            )}
          />
        );

      case "textarea":
        return (
          <Textarea
            id={field.id}
            value={String(value || "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={cn(
              "bg-white dark:bg-card border-border resize-none",
              error && "border-red-500 dark:border-red-500"
            )}
          />
        );

      case "number":
        return (
          <Input
            id={field.id}
            type="number"
            value={value !== undefined && value !== null ? String(value) : ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            className={cn(
              "bg-white dark:bg-card border-border",
              error && "border-red-500 dark:border-red-500"
            )}
          />
        );

      case "select":
        return (
          <Select
            value={String(value || "")}
            onValueChange={(v) => onChange(v)}
          >
            <SelectTrigger
              className={cn(
                "bg-white dark:bg-card border-border",
                error && "border-red-500 dark:border-red-500"
              )}
            >
              <SelectValue placeholder={field.placeholder || "请选择..."} />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-popover border-border">
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div>
                    <span>{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {option.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multiselect":
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className={cn(
                  "w-full justify-between bg-white dark:bg-card border-border",
                  error && "border-red-500 dark:border-red-500"
                )}
              >
                <span className="truncate">
                  {selectedValues.length > 0
                    ? `已选择 ${selectedValues.length} 项`
                    : field.placeholder || "请选择..."}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-2 bg-white dark:bg-popover border-border">
              <div className="space-y-1">
                {field.options?.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <div
                      key={option.value}
                      onClick={() => {
                        if (isSelected) {
                          onChange(selectedValues.filter((v) => v !== option.value));
                        } else {
                          onChange([...selectedValues, option.value]);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors",
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center",
                          isSelected
                            ? "bg-primary border-primary"
                            : "border-border"
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <span>{option.label}</span>
                    </div>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        );

      case "slider":
        const sliderValue = typeof value === "number" ? value : (field.validation?.min || 0);
        return (
          <div className="space-y-3">
            <Slider
              value={[sliderValue]}
              onValueChange={([v]) => onChange(v)}
              min={field.validation?.min || 0}
              max={field.validation?.max || 100}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{field.validation?.min || 0}</span>
              <span className="font-medium text-primary">{sliderValue}</span>
              <span>{field.validation?.max || 100}</span>
            </div>
          </div>
        );

      case "switch":
        return (
          <div className="flex items-center gap-3">
            <Switch
              id={field.id}
              checked={Boolean(value)}
              onCheckedChange={(checked) => onChange(checked)}
            />
            <Label
              htmlFor={field.id}
              className="text-sm text-muted-foreground cursor-pointer"
            >
              {value ? "是" : "否"}
            </Label>
          </div>
        );

      case "date":
        return (
          <Input
            id={field.id}
            type="date"
            value={String(value || "")}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              "bg-white dark:bg-card border-border",
              error && "border-red-500 dark:border-red-500"
            )}
          />
        );

      default:
        return (
          <Input
            id={field.id}
            value={String(value || "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="bg-white dark:bg-card border-border"
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      {/* 标签行 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label
            htmlFor={field.id}
            className="text-sm font-medium text-foreground"
          >
            {field.label}
          </Label>
          {isRequired && (
            <span className="text-red-500 text-xs">*</span>
          )}
          {field.helpText && (
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                {field.helpText}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* AI 建议按钮 */}
        {field.aiSuggest && onAISuggest && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAISuggest}
            disabled={aiLoading}
            className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10"
          >
            {aiLoading ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3 mr-1" />
            )}
            AI 建议
          </Button>
        )}
      </div>

      {/* 表单控件 */}
      {renderControl()}

      {/* AI 建议结果 */}
      {aiSuggestion && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-1 text-xs text-primary mb-1">
                <Sparkles className="w-3 h-3" />
                AI 建议
              </div>
              <p className="text-sm text-foreground">
                {aiSuggestion}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={applyAISuggestion}
              className="h-7 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              采用
            </Button>
          </div>
        </div>
      )}

      {/* 错误信息 */}
      {error && (
        <div className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}

      {/* 字符计数（文本类型） */}
      {(field.type === "text" || field.type === "textarea") &&
        field.validation?.maxLength && (
          <div className="text-right text-xs text-muted-foreground">
            {String(value || "").length} / {field.validation.maxLength}
          </div>
        )}
    </div>
  );
}

export default DynamicFormField;
