"use client";

/**
 * 修改密码对话框 - 增强版
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Key,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { userApi } from "@/lib/api/auth";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  // 表单状态
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // 显示密码
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // UI 状态
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 重置表单
  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setError(null);
    setSuccess(false);
  };

  // 关闭对话框
  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  // 验证密码强度
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "密码长度至少 8 个字符";
    }
    if (!/[A-Z]/.test(password)) {
      return "密码需要包含大写字母";
    }
    if (!/[a-z]/.test(password)) {
      return "密码需要包含小写字母";
    }
    if (!/[0-9]/.test(password)) {
      return "密码需要包含数字";
    }
    return null;
  };

  // 提交修改
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // 验证
    if (!currentPassword) {
      setError("请输入当前密码");
      return;
    }
    
    if (!newPassword) {
      setError("请输入新密码");
      return;
    }
    
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }
    
    if (currentPassword === newPassword) {
      setError("新密码不能与当前密码相同");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await userApi.changePassword({
        currentPassword,
        newPassword,
      });
      
      setSuccess(true);
      
      // 2秒后关闭
      setTimeout(() => {
        handleClose(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "修改密码失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 密码强度指示器
  const getPasswordStrength = (password: string): { level: number; text: string; color: string } => {
    if (!password) return { level: 0, text: "", color: "" };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return { level: 1, text: "弱", color: "bg-red-500" };
    if (strength <= 4) return { level: 2, text: "中", color: "bg-amber-500" };
    return { level: 3, text: "强", color: "bg-emerald-500" };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn(
        "sm:max-w-[480px]",
        "border-border/50",
        "shadow-2xl"
      )}>
        {/* 顶部装饰条 */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-primary to-teal-500 rounded-t-lg" />
        
        <DialogHeader className="pt-2">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br from-emerald-500/20 to-primary/10",
              "border border-emerald-500/20"
            )}>
              <Lock className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <DialogTitle className="text-lg">修改密码</DialogTitle>
              <DialogDescription className="flex items-center gap-1.5 mt-0.5">
                <Shield className="w-3 h-3" />
                为了您的账户安全，请定期更换密码
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {success ? (
          <div className="py-10 text-center animate-in zoom-in-95 duration-300">
            <div className={cn(
              "w-20 h-20 rounded-2xl mx-auto mb-5",
              "bg-gradient-to-br from-emerald-500/20 to-primary/10",
              "border border-emerald-500/30",
              "flex items-center justify-center",
              "shadow-lg shadow-emerald-500/20"
            )}>
              <ShieldCheck className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">密码修改成功</h3>
            <p className="text-sm text-muted-foreground">您的账户安全等级已提升</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-emerald-600 dark:text-emerald-400">正在跳转...</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 py-4">
            {/* 错误提示 */}
            {error && (
              <div className={cn(
                "flex items-center gap-3 p-4 rounded-xl",
                "bg-destructive/10 border border-destructive/20",
                "animate-in slide-in-from-top-2 duration-300"
              )}>
                <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                </div>
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* 当前密码 */}
            <div className="space-y-3">
              <Label htmlFor="currentPassword" className="text-sm font-medium">
                当前密码
              </Label>
              <div className="relative group">
                <Input
                  id="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  placeholder="输入当前密码"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={cn(
                    "h-12 pr-12 rounded-xl",
                    "border-border/50 focus:border-primary/50",
                    "transition-all duration-200"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className={cn(
                    "absolute right-4 top-1/2 -translate-y-1/2",
                    "text-muted-foreground hover:text-foreground",
                    "transition-colors duration-200"
                  )}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 新密码 */}
            <div className="space-y-3">
              <Label htmlFor="newPassword" className="text-sm font-medium flex items-center gap-2">
                新密码
                {passwordStrength.level > 0 && (
                  <span className={cn(
                    "px-2 py-0.5 text-[9px] font-bold uppercase rounded-full",
                    passwordStrength.level === 1 && "bg-red-500/10 text-red-500",
                    passwordStrength.level === 2 && "bg-amber-500/10 text-amber-500",
                    passwordStrength.level === 3 && "bg-emerald-500/10 text-emerald-500"
                  )}>
                    强度: {passwordStrength.text}
                  </span>
                )}
              </Label>
              <div className="relative group">
                <Input
                  id="newPassword"
                  type={showNew ? "text" : "password"}
                  placeholder="输入新密码"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={cn(
                    "h-12 pr-12 rounded-xl",
                    "border-border/50 focus:border-primary/50",
                    "transition-all duration-200"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className={cn(
                    "absolute right-4 top-1/2 -translate-y-1/2",
                    "text-muted-foreground hover:text-foreground",
                    "transition-colors duration-200"
                  )}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {/* 密码强度指示器 - 增强版 */}
              {newPassword && (
                <div className="space-y-2">
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1.5 flex-1 rounded-full transition-all duration-300",
                          i <= passwordStrength.level 
                            ? cn(passwordStrength.color, "shadow-sm") 
                            : "bg-muted/50"
                        )}
                        style={i <= passwordStrength.level ? {
                          boxShadow: passwordStrength.level === 1 
                            ? '0 0 8px rgba(239,68,68,0.3)'
                            : passwordStrength.level === 2 
                              ? '0 0 8px rgba(245,158,11,0.3)'
                              : '0 0 8px rgba(16,185,129,0.3)'
                        } : undefined}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                密码需要至少 8 个字符，包含大小写字母和数字
              </p>
            </div>

            {/* 确认新密码 */}
            <div className="space-y-3">
              <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-2">
                确认新密码
                {confirmPassword && confirmPassword === newPassword && (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                )}
              </Label>
              <div className="relative group">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="再次输入新密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    "h-12 pr-12 rounded-xl",
                    "border-border/50 focus:border-primary/50",
                    confirmPassword && confirmPassword !== newPassword && "border-destructive/50 focus:border-destructive",
                    "transition-all duration-200"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className={cn(
                    "absolute right-4 top-1/2 -translate-y-1/2",
                    "text-muted-foreground hover:text-foreground",
                    "transition-colors duration-200"
                  )}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  两次输入的密码不一致
                </p>
              )}
            </div>

            <DialogFooter className="pt-4 gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleClose(false)}
                className={cn(
                  "h-11 px-5 rounded-xl",
                  "border-border/50 hover:border-primary/30",
                  "transition-all duration-200"
                )}
              >
                取消
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className={cn(
                  "h-11 px-6 rounded-xl",
                  "bg-gradient-to-r from-emerald-500 to-primary",
                  "hover:from-emerald-400 hover:to-[primary/90]",
                  "shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30",
                  "text-white font-medium",
                  "transition-all duration-300"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    修改中...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    确认修改
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
