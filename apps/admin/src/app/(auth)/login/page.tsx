"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";

function resolveEnvLabel() {
  const env = (process.env.NEXT_PUBLIC_APP_ENV || "dev").toUpperCase();
  if (env === "PRODUCTION") return "PROD";
  return env;
}

function AdminLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = useMemo(() => {
    const raw = searchParams?.get("redirect") || "/";
    // 安全兜底：避免跳出本站
    if (raw.startsWith("http://") || raw.startsWith("https://")) return "/";
    return raw || "/";
  }, [searchParams]);

  const envLabel = resolveEnvLabel();

  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-background" />
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold text-foreground">
              AgentFlow Admin
            </div>
            <div className="text-[11px] text-foreground-muted">
              管理员控制台
            </div>
          </div>
        </div>
        <Badge variant="outline" size="sm">
          {envLabel}
        </Badge>
      </div>

      <div className="rounded-xl border border-border bg-surface-100 p-6 shadow-2xl shadow-black/30">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-surface-200 border border-border flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-brand-500" />
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-foreground">
              登录
            </div>
            <div className="mt-1 text-[12px] text-foreground-light">
              仅允许管理员账号访问。登录后将校验管理员权限与能力点。
            </div>
          </div>
        </div>

        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            clearError();
            try {
              await login({ email, password });
              router.replace(redirectTo);
            } catch {
              // store 已记录 error
            }
          }}
        >
          <div>
            <label className="block text-[11px] text-foreground-muted mb-1">
              邮箱
            </label>
            <Input
              type="email"
              autoComplete="email"
              placeholder="admin@agentflow.ai"
              variant="default"
              inputSize="lg"
              leftIcon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[11px] text-foreground-muted mb-1">
              密码
            </label>
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              variant="default"
              inputSize="lg"
              leftIcon={<KeyRound className="w-4 h-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div
              className={cn(
                "rounded-lg border border-destructive/30 bg-destructive-200/60 px-3 py-2",
                "text-[12px] text-destructive"
              )}
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={isLoading}
            loadingText="正在登录..."
          >
            进入控制台
          </Button>
        </form>

        <div className="mt-5 text-[11px] text-foreground-muted">
          如需开通权限，请联系平台管理员将邮箱加入 <code className="px-1 py-0.5 rounded bg-surface-200 border border-border">AdminEmails</code> 白名单。
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md" />}>
      <AdminLoginInner />
    </Suspense>
  );
}

