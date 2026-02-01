"use client";

/**
 * Prompt 预览组件 - 极简风格
 */

import { useMemo, useState } from "react";
import { Eye, EyeOff, Copy, Check, RefreshCw, FileCode, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface PromptPreviewProps {
  template: string;
  variables?: Record<string, unknown>;
  title?: string;
  className?: string;
}

const mockVariables: Record<string, unknown> = {
  input: "这是用户输入的内容示例",
  name: "张三",
  age: 25,
  items: ["苹果", "香蕉", "橙子"],
  user: {
    id: "user_123",
    email: "user@example.com",
  },
  timestamp: new Date().toISOString(),
  count: 42,
};

function renderTemplate(
  template: string,
  variables: Record<string, unknown>
): { rendered: string; usedVariables: string[]; missingVariables: string[] } {
  const usedVariables: string[] = [];
  const missingVariables: string[] = [];
  
  const variablePattern = /\{\{([^}]+)\}\}/g;
  
  const rendered = template.replace(variablePattern, (match, varPath) => {
    const path = varPath.trim();
    const parts = path.split(".");
    
    let value: unknown = variables;
    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        value = mockVariables;
        for (const p of parts) {
          if (value && typeof value === "object" && p in value) {
            value = (value as Record<string, unknown>)[p];
          } else {
            missingVariables.push(path);
            return match;
          }
        }
      }
    }
    
    usedVariables.push(path);
    
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value);
    }
    return String(value ?? "");
  });
  
  return { rendered, usedVariables, missingVariables };
}

export function PromptPreview({
  template,
  variables = {},
  title = "预览",
  className,
}: PromptPreviewProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [useRealVariables, setUseRealVariables] = useState(false);

  const { rendered, usedVariables, missingVariables } = useMemo(() => {
    if (!template) {
      return { rendered: "", usedVariables: [], missingVariables: [] };
    }
    const vars = useRealVariables ? variables : mockVariables;
    return renderTemplate(template, vars);
  }, [template, variables, useRealVariables]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rendered);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!template) {
    return null;
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn(
        "rounded-lg border border-border bg-surface-100",
        className
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 bg-surface-200">
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 text-sm font-medium hover:text-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded bg-surface-100 border border-border">
              {isOpen ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </span>
            <FileCode className="h-4 w-4" />
            {title}
          </button>
        </CollapsibleTrigger>
        
        <div className="flex items-center gap-1">
          {usedVariables.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {usedVariables.length} 变量
            </Badge>
          )}
          {missingVariables.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {missingVariables.length} 缺失
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setUseRealVariables(!useRealVariables)}
            title={useRealVariables ? "使用模拟数据" : "使用真实数据"}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", useRealVariables && "text-brand-500")} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopy}
            disabled={!rendered}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-brand-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      <CollapsibleContent>
        <Separator />
        <ScrollArea className="max-h-[180px]">
          <div className="p-3">
            {rendered ? (
              <pre className="text-sm whitespace-pre-wrap break-words font-mono text-foreground-muted p-2 rounded-md bg-surface-200">
                {rendered}
              </pre>
            ) : (
              <p className="text-sm text-foreground-muted italic text-center py-3">
                输入模板内容查看预览...
              </p>
            )}
          </div>
        </ScrollArea>
        
        {(usedVariables.length > 0 || missingVariables.length > 0) && (
          <>
            <Separator />
            <div className="px-3 py-2 text-xs space-y-1.5 bg-surface-200">
              {usedVariables.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-foreground-muted">使用变量:</span>
                  {usedVariables.map((v) => (
                    <Badge key={v} variant="secondary" className="text-xs font-mono">
                      {v}
                    </Badge>
                  ))}
                </div>
              )}
              {missingVariables.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-destructive">缺失变量:</span>
                  {missingVariables.map((v) => (
                    <Badge key={v} variant="destructive" className="text-xs font-mono">
                      {v}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface HTTPPreviewProps {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  className?: string;
}

export function HTTPPreview({
  method,
  url,
  headers = {},
  body,
  className,
}: HTTPPreviewProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const curlCommand = useMemo(() => {
    if (!url) return "";
    
    let cmd = `curl -X ${method}`;
    
    Object.entries(headers).forEach(([key, value]) => {
      if (value) {
        cmd += ` \\\n  -H "${key}: ${value}"`;
      }
    });
    
    if (body && method !== "GET" && method !== "HEAD") {
      const bodyStr = typeof body === "string" ? body : JSON.stringify(body, null, 2);
      cmd += ` \\\n  -d '${bodyStr}'`;
    }
    
    cmd += ` \\\n  "${url}"`;
    
    return cmd;
  }, [method, url, headers, body]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(curlCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!url) return null;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn(
        "rounded-lg border border-border bg-surface-100",
        className
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 bg-surface-200">
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 text-sm font-medium hover:text-foreground">
            <span className="flex items-center justify-center w-6 h-6 rounded bg-surface-100 border border-border">
              {isOpen ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </span>
            <Terminal className="h-4 w-4 text-brand-500" />
            cURL 预览
          </button>
        </CollapsibleTrigger>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-brand-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      <CollapsibleContent>
        <Separator />
        <ScrollArea className="max-h-[180px]">
          <div className="p-3">
            <pre className="text-sm whitespace-pre-wrap break-all font-mono text-foreground-muted p-2 rounded-md bg-surface-200">
              {curlCommand}
            </pre>
          </div>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
}
