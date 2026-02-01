"use client";

/**
 * 忘记密码页面
 * Manus 风格：简约、专业，适配认证布局
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Loader2,
  KeyRound,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // 验证邮箱
    if (!email || !email.includes("@")) {
      setError("请输入有效的邮箱地址");
      setIsSubmitting(false);
      return;
    }

    // 模拟提交
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  // 提交成功状态
  if (isSubmitted) {
    return (
      <div className={cn(
        "w-full max-w-[400px] mx-auto transition-all duration-500",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 flex items-center justify-center">
            <Workflow className="w-12 h-12 text-foreground/90" />
          </div>
        </div>

        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <h1 className="text-[24px] font-semibold text-foreground mb-2">
            邮件已发送
          </h1>
          
          <p className="text-[15px] text-muted-foreground mb-2">
            我们已向 <strong className="text-foreground">{email}</strong> 发送了密码重置链接
          </p>
          <p className="text-[14px] text-muted-foreground mb-8">
            请检查您的收件箱和垃圾邮件文件夹
          </p>

          <div className="space-y-3">
            <button
              onClick={() => {
                setIsSubmitted(false);
                setEmail("");
              }}
              className="w-full h-[52px] rounded-xl bg-muted border border-border text-foreground font-medium text-[15px] hover:bg-muted/80 transition-all cursor-pointer active:scale-[0.98]"
            >
              使用其他邮箱
            </button>
            
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full h-[52px] rounded-xl bg-primary text-primary-foreground font-medium text-[15px] hover:bg-primary/90 transition-all active:scale-[0.98]"
            >
              返回登录
            </Link>
          </div>

          <p className="text-[14px] text-muted-foreground mt-8">
            没有收到邮件？{" "}
            <button
              onClick={() => {
                setIsSubmitting(true);
                setTimeout(() => setIsSubmitting(false), 1500);
              }}
              className="text-primary hover:underline cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? "发送中..." : "重新发送"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "w-full max-w-[400px] mx-auto transition-all duration-500",
      mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <Link href="/" className="group">
          <div className="w-16 h-16 flex items-center justify-center">
            <Workflow className="w-12 h-12 text-foreground/90 group-hover:text-foreground transition-colors" />
          </div>
        </Link>
      </div>

      {/* 标题 */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-[28px] font-semibold text-foreground tracking-tight">
          忘记密码？
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          输入您的邮箱地址，我们将发送密码重置链接
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[14px]">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* 邮箱 */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              className="w-full h-[52px] pl-12 pr-4 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground text-[15px] focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              required
            />
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={isSubmitting || !email}
            className={cn(
              "w-full h-[52px] rounded-xl font-medium text-[15px] flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-[0.98]",
              email
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground border border-border cursor-not-allowed",
              isSubmitting && "opacity-70 cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                发送中...
              </>
            ) : (
              <>
                发送重置链接
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* 返回登录 */}
      <div className="mt-8 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-[14px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回登录
        </Link>
      </div>

      {/* 底部链接 */}
      <p className="text-center text-[14px] text-muted-foreground mt-6">
        还没有账户？{" "}
        <Link href="/register" className="text-foreground hover:text-primary font-medium transition-colors">
          立即注册
        </Link>
      </p>
    </div>
  );
}
