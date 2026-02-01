"use client";

import { useState, useEffect } from "react";
import { Search, Sparkles, Clock, Users, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { templateApiNew, type Template, type TemplateCategory } from "@/lib/api/template";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TemplateGalleryProps {
  onSelectTemplate?: (template: Template) => void;
  onUseTemplate?: (workflow: Record<string, unknown>) => void;
  selectedId?: string;
}

// 难度标签配置
const difficultyConfig = {
  beginner: { label: "入门", color: "bg-green-500" },
  intermediate: { label: "进阶", color: "bg-yellow-500" },
  advanced: { label: "高级", color: "bg-red-500" },
};

export function TemplateGallery({ 
  onSelectTemplate, 
  onUseTemplate,
  selectedId 
}: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [featuredTemplates, setFeaturedTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");

  // 加载模板数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [templatesRes, categoriesRes, featuredRes] = await Promise.all([
          templateApiNew.list({
            search: search || undefined", category: category !== "all" ? category : undefined,
            difficulty: difficulty !== "all" ? difficulty : undefined,
          }),
          templateApiNew.getCategories(),
          templateApiNew.getFeatured(4),
        ]);
        setTemplates(templatesRes.data.templates);
        setCategories(categoriesRes.data.categories);
        setFeaturedTemplates(featuredRes.data.templates);
      } catch (error) {
        toast.error("加载模板失败");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [search, category, difficulty]);

  // 使用模板
  const handleUseTemplate = async (template: Template) => {
    try {
      const response = await templateApiNew.use(template.id);
      toast.success("工作流创建成功");
      onUseTemplate?.(response.data.workflow);
    } catch (error) {
      toast.error("使用模板失败");
    }
  };

  return (
    <div className="space-y-6">
      {/* 搜索和筛选 */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-light" />
          <Input
            placeholder="搜索模板..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="选择分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="难度" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部难度</SelectItem>
            <SelectItem value="beginner">入门</SelectItem>
            <SelectItem value="intermediate">进阶</SelectItem>
            <SelectItem value="advanced">高级</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 精选模板 */}
      {category === "all" && !search && featuredTemplates.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            精选模板
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                selected={selectedId === template.id}
                onClick={() => onSelectTemplate?.(template)}
                onUse={() => handleUseTemplate(template)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 全部模板 */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">
          {category === "all" ? "全部模板" : categories.find((c) => c.id === category)?.name}
          <span className="text-foreground-light text-sm font-normal ml-2">
            ({templates.length})
          </span>
        </h3>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 rounded-lg bg-surface-200 animate-pulse" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 text-foreground-light">
            未找到匹配的模板
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                selected={selectedId === template.id}
                onClick={() => onSelectTemplate?.(template)}
                onUse={() => handleUseTemplate(template)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: Template;
  selected: boolean;
  onClick: () => void;
  onUse: () => void;
}

function TemplateCard({ template, selected, onClick, onUse }: TemplateCardProps) {
  const difficulty = difficultyConfig[template.difficulty] || difficultyConfig.beginner;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
        selected && "ring-2 ring-brand-500 border-primary"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{template.icon}</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{template.name}</h4>
            <p className="text-sm text-foreground-light line-clamp-2 mt-1">
              {template.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          <Badge variant="outline" className="text-xs">
            {template.node_count} 节点
          </Badge>
          <Badge variant="secondary" className={cn("text-xs", difficulty.color, "text-white")}>
            {difficulty.label}
          </Badge>
          {template.is_official && (
            <Badge variant="default" className="text-xs bg-blue-500">
              官方
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="px-4 py-3 border-t bg-muted/30 flex justify-between">
        <div className="flex items-center gap-3 text-xs text-foreground-light">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {template.use_count} 次使用
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {template.estimated_time} 分钟
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2"
          onClick={(e) => {
            e.stopPropagation();
            onUse();
          }}
        >
          使用
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}
