"use client";

/**
 * 文档组装节点 - Document Assembler
 * 
 * 功能:
 * - 整合多个章节内容
 * - 自动生成目录
 * - 生成文档摘要
 * - 标准化 Markdown 格式
 * - 支持自定义模板
 */

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { FileText, List, AlignLeft, BookOpen, FileOutput, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/types/workflow";

export interface DocumentAssemblerNodeProps extends NodeProps {
  data: WorkflowNodeData;
  isConnectable?: boolean;
}

export const DocumentAssemblerNode = memo(function DocumentAssemblerNode({
  data,
  selected,
  isConnectable = true,
}: DocumentAssemblerNodeProps) {
  const config = data.config as {
    title?: string;
    generateTOC?: boolean;
    generateSummary?: boolean;
    includeMetadata?: boolean;
    normalizationLevel?: number;
    author?: string;
    inputCount?: number;
  };

  const title = config.title || "未命名文档";
  const inputCount = config.inputCount || 3;
  const normalizationLevel = config.normalizationLevel ?? 1;

  // 功能标签
  const features = [];
  if (config.generateTOC) features.push({ icon: List, label: "目录" });
  if (config.generateSummary) features.push({ icon: AlignLeft, label: "摘要" });
  if (config.includeMetadata) features.push({ icon: FileOutput, label: "元数据" });

  return (
    <div
      className={cn(
        "min-w-[200px] rounded-lg border bg-surface-100 transition-all",
        selected
          ? "border-brand-500 shadow-md shadow-brand-500/10"
          : "border-border hover:border-brand-500/40"
      )}
    >
      {/* 多个输入端口 - 用于接收各章节内容 */}
      {Array.from({ length: inputCount }).map((_, i) => (
        <Handle
          key={`section-${i}`}
          id={`section-${i}`}
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          style={{ top: `${25 + i * (50 / inputCount)}%` }}
          className="w-3! h-3! border-2! border-background! rounded-full! -left-1.5! bg-brand-500!"
        />
      ))}

      {/* 头部 */}
      <div className="flex items-center gap-2.5 border-b border-border/70 px-3 py-2.5 bg-brand-200/30">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-500 text-background">
          <BookOpen className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{data.label || "文档组装"}</h3>
          <p className="text-xs text-foreground-muted flex items-center gap-1">
            <FileText className="h-3 w-3" />
            整合 {inputCount} 个章节
          </p>
        </div>
      </div>

      {/* 文档标题预览 */}
      <div className="px-3 py-2 border-b border-border/70">
        <div className="text-xs text-foreground-muted mb-1">文档标题</div>
        <div className="text-sm font-medium text-foreground truncate">
          {title}
        </div>
      </div>

      {/* 功能配置 */}
      <div className="px-3 py-2.5 space-y-2 text-xs">
        {/* 功能标签 */}
        {features.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {features.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-brand-200/40 text-brand-500"
              >
                <Icon className="h-3 w-3" />
                {label}
              </span>
            ))}
          </div>
        )}

        {/* 标准化级别 */}
        <div className="flex items-center gap-2">
          <span className="text-foreground-muted">格式标准化:</span>
          <div className="flex gap-0.5">
            {[1, 2, 3].map((level) => (
              <span
                key={level}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  level <= normalizationLevel
                    ? "bg-brand-500"
                    : "bg-surface-200"
                )}
              />
            ))}
          </div>
          <span className="text-foreground-muted">
            {normalizationLevel === 0 ? "关闭" : 
             normalizationLevel === 1 ? "基础" : 
             normalizationLevel === 2 ? "标准" : "高级"}
          </span>
        </div>

        {/* 作者 */}
        {config.author && (
          <div className="flex items-center gap-2 text-foreground-muted">
            <Sparkles className="h-3 w-3 text-brand-500" />
            <span>作者: {config.author}</span>
          </div>
        )}
      </div>

      {/* 底部 */}
      <div className="flex justify-between px-3 py-2 border-t border-border text-xs text-foreground-muted bg-surface-200">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
          章节 x{inputCount}
        </span>
        <span className="flex items-center gap-1">
          Markdown
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
        </span>
      </div>

      {/* 输出端口 - 完整文档 */}
      <Handle
        id="document"
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={{ top: "30%" }}
        className="w-3! h-3! border-2! border-background! rounded-full! -right-1.5! bg-brand-500!"
      />

      {/* 输出端口 - 目录 */}
      <Handle
        id="toc"
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={{ top: "50%" }}
        className="w-3! h-3! border-2! border-background! rounded-full! -right-1.5! bg-surface-300!"
      />

      {/* 输出端口 - 摘要 */}
      <Handle
        id="summary"
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={{ top: "70%" }}
        className="w-3! h-3! border-2! border-background! rounded-full! -right-1.5! bg-brand-500!"
      />
    </div>
  );
});
