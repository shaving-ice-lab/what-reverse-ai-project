"use client";

/**
 * 分类和标签选择组件
 * 
 * 支持分类单选和标签多选
 */

import { useState, useRef, useEffect } from "react";
import {
  FileText,
  BarChart3,
  MessageSquare,
  Users,
  Code2,
  Globe,
  TrendingUp,
  Sparkles,
  GraduationCap,
  Wallet,
  Check,
  X,
  Plus,
  Tag,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentCategory } from "@/types/agent";

// 分类配置
const categories: Array<{
  id: AgentCategory;
  label: string;
  description: string;
  icon: typeof MessageSquare;
}> = [
  { id: "content", label: "内容创作", description: "文章写作、内容生成", icon: FileText },
  { id: "data", label: "数据处理", description: "数据分析、转换、清洗", icon: BarChart3 },
  { id: "customer", label: "客户服务", description: "客服、FAQ、工单处理", icon: MessageSquare },
  { id: "productivity", label: "办公效率", description: "日程、任务、自动化", icon: Users },
  { id: "developer", label: "开发工具", description: "代码审查、文档生成", icon: Code2 },
  { id: "research", label: "研究分析", description: "市场调研、数据分析", icon: Globe },
  { id: "education", label: "教育学习", description: "教学、答疑、练习", icon: GraduationCap },
  { id: "finance", label: "金融财务", description: "财务分析、报表处理", icon: Wallet },
  { id: "marketing", label: "市场营销", description: "营销文案、社交媒体", icon: TrendingUp },
  { id: "other", label: "其他", description: "其他类型的 Agent", icon: Sparkles },
];

// 推荐标签
const suggestedTags = [
  "自动化", "AI", "GPT", "写作", "分析",
  "效率", "办公", "营销", "数据", "代码",
  "客服", "翻译", "摘要", "生成", "助手",
];

interface CategoryTagSelectorProps {
  // 当前选择
  selectedCategory: AgentCategory | null;
  selectedTags: string[];
  
  // 回调
  onCategoryChange: (category: AgentCategory) => void;
  onTagsChange: (tags: string[]) => void;
  
  // 配置
  maxTags?: number;
  
  // 样式
  className?: string;
}

export function CategoryTagSelector({
  selectedCategory,
  selectedTags,
  onCategoryChange,
  onTagsChange,
  maxTags = 5,
  className,
}: CategoryTagSelectorProps) {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 聚焦标签输入框
  useEffect(() => {
    if (showTagInput && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [showTagInput]);

  // 添加标签
  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;
    if (selectedTags.includes(trimmedTag)) return;
    if (selectedTags.length >= maxTags) return;
    
    onTagsChange([...selectedTags, trimmedTag]);
    setNewTag("");
  };

  // 删除标签
  const handleRemoveTag = (tag: string) => {
    onTagsChange(selectedTags.filter((t) => t !== tag));
  };

  // 处理标签输入键盘事件
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag(newTag);
    } else if (e.key === "Escape") {
      setShowTagInput(false);
      setNewTag("");
    }
  };

  const selectedCategoryData = categories.find((c) => c.id === selectedCategory);
  const CategoryIcon = selectedCategoryData?.icon || Sparkles;

  return (
    <div className={cn("space-y-6", className)}>
      {/* 分类选择 */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          分类 <span className="text-destructive">*</span>
        </label>
        
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className={cn(
              "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-colors text-left",
              selectedCategory
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-background hover:border-primary/50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                selectedCategory ? "bg-primary/10" : "bg-muted"
              )}>
                <CategoryIcon className={cn(
                  "w-5 h-5",
                  selectedCategory ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <div className={cn(
                  "font-medium",
                  selectedCategory ? "text-foreground" : "text-muted-foreground"
                )}>
                  {selectedCategoryData?.label || "选择分类"}
                </div>
                {selectedCategoryData && (
                  <div className="text-sm text-muted-foreground">
                    {selectedCategoryData.description}
                  </div>
                )}
              </div>
            </div>
            <ChevronDown className={cn(
              "w-5 h-5 text-muted-foreground transition-transform",
              isCategoryOpen && "rotate-180"
            )} />
          </button>

          {/* 下拉菜单 */}
          {isCategoryOpen && (
            <div className="absolute z-10 w-full mt-2 py-2 rounded-xl bg-card border border-border shadow-xl max-h-80 overflow-y-auto">
              {categories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.id;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      onCategoryChange(category.id);
                      setIsCategoryOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 transition-colors",
                      isSelected
                        ? "bg-primary/10"
                        : "hover:bg-muted"
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center",
                      isSelected ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Icon className={cn(
                        "w-4 h-4",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className={cn(
                        "font-medium",
                        isSelected ? "text-primary" : "text-foreground"
                      )}>
                        {category.label}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {category.description}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 标签选择 */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          标签
          <span className="text-muted-foreground font-normal ml-2">
            ({selectedTags.length}/{maxTags})
          </span>
        </label>

        {/* 已选标签 */}
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm"
            >
              <Tag className="w-3 h-3" />
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="p-0.5 rounded-full hover:bg-primary/20 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          
          {/* 添加标签按钮/输入框 */}
          {selectedTags.length < maxTags && (
            showTagInput ? (
              <div className="inline-flex items-center gap-1">
                <input
                  ref={tagInputRef}
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => {
                    if (newTag.trim()) {
                      handleAddTag(newTag);
                    }
                    setShowTagInput(false);
                  }}
                  placeholder="输入标签"
                  className="w-24 px-2 py-1 text-sm rounded-lg border border-border bg-background focus:outline-none focus:border-primary"
                  maxLength={20}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowTagInput(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-border text-muted-foreground text-sm hover:border-primary/50 hover:text-primary transition-colors"
              >
                <Plus className="w-3 h-3" />
                添加标签
              </button>
            )
          )}
        </div>

        {/* 推荐标签 */}
        <div>
          <div className="text-xs text-muted-foreground mb-2">推荐标签</div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedTags
              .filter((tag) => !selectedTags.includes(tag))
              .slice(0, 10)
              .map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  disabled={selectedTags.length >= maxTags}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs transition-colors",
                    selectedTags.length >= maxTags
                      ? "bg-muted text-muted-foreground/50 cursor-not-allowed"
                      : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  {tag}
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
