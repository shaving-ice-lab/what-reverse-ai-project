"use client";

/**
 * 对话导入对话框组件
 * 支持导入 JSON 格式的对话
 */

import { useState, useCallback } from "react";
import { Upload, FileJson, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { conversationApi, type ImportConversationRequest } from "@/lib/api";
import type { ConversationFolder } from "@/types/conversation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: ConversationFolder[];
  onSuccess?: () => void;
}

export function ImportDialog({
  open,
  onOpenChange,
  folders,
  onSuccess,
}: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportConversationRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    importedCount: number;
    totalMessages: number;
  } | null>(null);
  
  // 表单状态
  const [title, setTitle] = useState("");
  const [folderId, setFolderId] = useState<string>("");

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setResult(null);

    // 解析文件
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        // 验证数据格式
        if (!data.title && !data.messages) {
          setError("无效的对话文件格式");
          return;
        }

        // 转换为导入格式
        const importData: ImportConversationRequest = {
          title: data.title || selectedFile.name.replace(/\.\w+$/, ""),
          model: data.model,
          systemPrompt: data.system_prompt,
          messages: [],
        };

        if (Array.isArray(data.messages)) {
          importData.messages = data.messages.map((msg: Record<string, unknown>) => ({
            role: (msg.role as string) || "user",
            content: (msg.content as string) || "",
            model: msg.model as string,
            createdAt: msg.created_at as string,
          }));
        }

        setParsedData(importData);
        setTitle(importData.title);
      } catch {
        setError("文件解析失败，请确保文件是有效的 JSON 格式");
      }
    };

    reader.onerror = () => {
      setError("文件读取失败");
    };

    reader.readAsText(selectedFile);
  }, []);

  const handleImport = async () => {
    if (!parsedData) return;

    setImporting(true);
    setError(null);

    try {
      const importResult = await conversationApi.importConversation({
        ...parsedData,
        title: title || parsedData.title,
        folderId: folderId || undefined,
      });

      setResult({
        success: importResult.success,
        importedCount: importResult.importedCount,
        totalMessages: importResult.totalMessages,
      });

      if (importResult.success) {
        onSuccess?.();
      }
    } catch (err) {
      setError("导入失败，请重试");
      console.error("Import failed:", err);
    } finally {
      setImporting(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setParsedData(null);
    setError(null);
    setResult(null);
    setTitle("");
    setFolderId("");
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            导入对话
          </DialogTitle>
          <DialogDescription>
            从 JSON 文件导入对话记录
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 文件上传 */}
          <div className="space-y-2">
            <Label>选择文件</Label>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                "hover:border-primary hover:bg-muted/50",
                file && "border-primary bg-muted/30"
              )}
              onClick={() => document.getElementById("import-file")?.click()}
            >
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <FileJson className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
              {file ? (
                <div>
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground">
                    点击或拖拽文件到此处
                  </p>
                  <p className="text-xs text-muted-foreground">
                    支持 JSON 格式
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 解析结果 */}
          {parsedData && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">对话标题</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="输入对话标题"
                />
              </div>

              <div className="space-y-2">
                <Label>目标文件夹</Label>
                <Select value={folderId} onValueChange={setFolderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择文件夹（可选）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">根目录</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.icon} {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 rounded-lg bg-muted text-sm">
                <p className="text-muted-foreground">
                  将导入 <span className="font-medium text-foreground">{parsedData.messages.length}</span> 条消息
                </p>
                {parsedData.model && (
                  <p className="text-muted-foreground">
                    模型: <span className="font-medium text-foreground">{parsedData.model}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 成功提示 */}
          {result?.success && (
            <Alert className="border-emerald-500 bg-emerald-500/10">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <AlertDescription className="text-emerald-700 dark:text-emerald-400">
                导入成功！已导入 {result.importedCount} / {result.totalMessages} 条消息
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            {result?.success ? "完成" : "取消"}
          </Button>
          {!result?.success && (
            <Button
              onClick={handleImport}
              disabled={!parsedData || importing}
            >
              {importing ? "导入中..." : "导入"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
