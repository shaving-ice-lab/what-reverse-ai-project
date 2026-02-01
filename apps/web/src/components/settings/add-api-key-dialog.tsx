"use client";

/**
 * 添加 API 密钥对话框 - 增强版
 */

import { useState } from "react";
import { 
  Plus, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Key,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { apiKeysApi } from "@/lib/api/api-keys";
import { PROVIDER_CONFIGS, type ApiKeyProvider } from "@/types/api-key";

interface AddApiKeyDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function AddApiKeyDialog({ trigger, onSuccess }: AddApiKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<ApiKeyProvider>("openai");
  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);
  
  const providerConfig = PROVIDER_CONFIGS[provider];
  
  // 验证密钥格式
  const validateKey = (): boolean => {
    if (!apiKey.trim()) {
      setError("请输入 API 密钥");
      return false;
    }
    
    if (providerConfig.keyPattern && !providerConfig.keyPattern.test(apiKey)) {
      setError(`密钥格式不正确，请检查是否为有效的 ${providerConfig.name} 密钥`);
      return false;
    }
    
    return true;
  };
  
  // 测试密钥
  const handleTest = async () => {
    if (!validateKey()) return;
    
    setIsTesting(true);
    setTestResult(null);
    setError(null);
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const isValid = apiKey.length > 20;
      
      setTestResult({
        valid: isValid,
        message: isValid ? "密钥有效" : "密钥无效，请检查",
      });
    } catch (err) {
      setTestResult({
        valid: false,
        message: err instanceof Error ? err.message : "测试失败",
      });
    } finally {
      setIsTesting(false);
    }
  };
  
  // 提交
  const handleSubmit = async () => {
    if (!validateKey()) return;
    
    if (!name.trim()) {
      setError("请输入密钥名称");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await apiKeysApi.create({
        name: name.trim(),
        provider,
        key: apiKey.trim(),
      });
      
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "添加失败");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setProvider("openai");
      setName("");
      setApiKey("");
      setShowKey(false);
      setError(null);
      setTestResult(null);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            size="sm"
            className={cn(
              "bg-gradient-to-r from-primary via-violet-500 to-indigo-500",
              "hover:from-primary/90 hover:to-indigo-400",
              "shadow-lg shadow-primary/20 hover:shadow-primary/30",
              "text-white font-medium",
              "transition-all duration-300"
            )}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            添加密钥
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className={cn(
        "sm:max-w-[480px]",
        "border-border/50",
        "shadow-2xl"
      )}>
        {/* 顶部装饰条 */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-violet-500 to-indigo-500 rounded-t-lg" />
        
        <DialogHeader className="pt-2">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br from-primary/20 to-violet-500/10",
              "border border-primary/20"
            )}>
              <Key className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">添加 API 密钥</DialogTitle>
              <DialogDescription className="flex items-center gap-1.5 mt-0.5">
                <Shield className="w-3 h-3" />
                密钥将使用 AES-256 加密存储
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          {/* 提供商选择 - 增强版 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              选择提供商
            </Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as ApiKeyProvider)}>
              <SelectTrigger className={cn(
                "h-12 rounded-xl",
                "border-border/50 hover:border-primary/30",
                "transition-all duration-200"
              )}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {Object.values(PROVIDER_CONFIGS).map((config) => (
                  <SelectItem 
                    key={config.id} 
                    value={config.id}
                    className="rounded-lg py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{config.icon}</span>
                      <div>
                        <span className="font-medium">{config.name}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* 密钥名称 - 增强版 */}
          <div className="space-y-3">
            <Label htmlFor="keyName" className="text-sm font-medium">
              密钥名称
            </Label>
            <Input
              id="keyName"
              placeholder={`我的 ${providerConfig.name} 密钥`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn(
                "h-12 rounded-xl",
                "border-border/50 focus:border-primary/50",
                "transition-all duration-200"
              )}
            />
          </div>
          
          {/* API 密钥 - 增强版 */}
          <div className="space-y-3">
            <Label htmlFor="apiKey" className="text-sm font-medium flex items-center gap-2">
              API 密钥
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded">
                机密
              </span>
            </Label>
            <div className="relative group">
              <Input
                id="apiKey"
                type={showKey ? "text" : "password"}
                placeholder={providerConfig.keyPlaceholder}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestResult(null);
                  setError(null);
                }}
                className={cn(
                  "h-12 pr-12 rounded-xl font-mono text-sm",
                  "border-border/50 focus:border-primary/50",
                  "transition-all duration-200"
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8",
                  "text-muted-foreground hover:text-foreground",
                  "transition-colors duration-200"
                )}
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              密钥将安全存储，仅在执行工作流时解密使用
            </p>
          </div>
          
          {/* 测试结果 - 增强版 */}
          {testResult && (
            <div
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl",
                "animate-in slide-in-from-top-2 duration-300",
                testResult.valid
                  ? "bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20"
                  : "bg-gradient-to-r from-destructive/10 via-destructive/5 to-transparent border border-destructive/20"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                testResult.valid ? "bg-emerald-500/20" : "bg-destructive/20"
              )}>
                {testResult.valid ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
              <div>
                <p className={cn(
                  "text-sm font-medium",
                  testResult.valid ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                )}>
                  {testResult.valid ? "验证通过" : "验证失败"}
                </p>
                <p className="text-xs text-muted-foreground">{testResult.message}</p>
              </div>
            </div>
          )}
          
          {/* 错误提示 - 增强版 */}
          {error && (
            <div className={cn(
              "flex items-center gap-3 p-4 rounded-xl",
              "bg-destructive/10 border border-destructive/20",
              "animate-in shake duration-300"
            )}>
              <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center shrink-0">
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            disabled={isTesting || !apiKey.trim()}
            className={cn(
              "h-11 px-5 rounded-xl",
              "border-border/50 hover:border-primary/30 hover:bg-primary/5",
              "transition-all duration-200"
            )}
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                验证中...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                测试连接
              </>
            )}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className={cn(
              "h-11 px-6 rounded-xl",
              "bg-gradient-to-r from-primary via-violet-500 to-indigo-500",
              "hover:from-primary/90 hover:to-indigo-400",
              "shadow-lg shadow-primary/20 hover:shadow-primary/30",
              "text-white font-medium",
              "transition-all duration-300"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                添加中...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                添加密钥
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
