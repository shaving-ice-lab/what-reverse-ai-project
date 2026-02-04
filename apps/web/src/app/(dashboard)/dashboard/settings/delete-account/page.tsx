"use client";

/**
 * 删除账户页面 - Supabase 风格
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";
import Link from "next/link";

// 删除前的检查项
const preDeleteChecks = [
  {
    id: "workflows",
    title: "工作流数据",
    description: "您的所有工作流将被永久删除",
    icon: Trash2,
  },
  {
    id: "templates",
    title: "模板和收藏",
    description: "您创建和收藏的模板将被移除",
    icon: Trash2,
  },
  {
    id: "api-keys",
    title: "API 密钥",
    description: "所有 API 密钥将失效",
    icon: Shield,
  },
  {
    id: "billing",
    title: "订阅和账单",
    description: "订阅将被取消，不会再收取费用",
    icon: CheckCircle,
  },
];

export default function DeleteAccountPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expectedText = "删除我的账户";
  const isConfirmValid = confirmText === expectedText;

  const handleDelete = async () => {
    if (!isConfirmValid || !password) return;
    
    setIsDeleting(true);
    setError(null);

    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 登出并跳转
      await logout();
      router.push("/?deleted=true");
    } catch (err) {
      setError("删除账户失败，请稍后重试");
      setIsDeleting(false);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Settings"
          title="删除账户"
          description="此操作不可逆，请谨慎操作"
          backHref="/dashboard/settings"
          backLabel="返回设置"
        />

        <div className="page-divider" />

        <div className="page-section">

      {/* 步骤指示器 */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              "flex-1 h-1 rounded-full transition-colors",
              s <= step ? "bg-destructive" : "bg-surface-200"
            )}
          />
        ))}
      </div>

      {/* 步骤 1: 了解后果 */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="p-5 rounded-md bg-destructive-200 border border-destructive/30">
            <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              删除账户将导致以下后果
            </h3>
            <p className="text-[13px] text-foreground-light">
              请仔细阅读以下内容，确保您了解删除账户的影响。
            </p>
          </div>

          <div className="space-y-3">
            {preDeleteChecks.map((check) => (
              <div
                key={check.id}
                className="flex items-start gap-4 p-4 rounded-md bg-surface-100 border border-border"
              >
                <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center shrink-0">
                  <check.icon className="w-4 h-4 text-foreground-muted" />
                </div>
                <div>
                  <h4 className="text-[13px] font-medium text-foreground">{check.title}</h4>
                  <p className="text-xs text-foreground-muted">{check.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 导出数据提示 */}
          <div className="p-4 rounded-md bg-surface-100/60 border border-border">
            <div className="flex items-center gap-3">
              <Download className="w-4 h-4 text-foreground-muted" />
              <div className="flex-1">
                <p className="text-[13px] text-foreground">
                  建议在删除前导出您的数据
                </p>
                <p className="text-xs text-foreground-muted">
                  您可以在设置页面导出所有工作流和配置
                </p>
              </div>
              <Link href="/dashboard/settings#data">
                <Button variant="outline" size="sm" className="border-border text-foreground-light">
                  导出数据
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Link href="/dashboard/settings" className="flex-1">
              <Button variant="outline" className="w-full border-border text-foreground-light">
                取消
              </Button>
            </Link>
            <Button
              onClick={() => setStep(2)}
              className="flex-1 bg-destructive hover:bg-destructive/90 text-background"
            >
              我已了解，继续
            </Button>
          </div>
        </div>
      )}

      {/* 步骤 2: 选择原因 */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="p-5 rounded-md bg-surface-100 border border-border">
            <h3 className="text-sm font-medium text-foreground mb-4">
              请告诉我们您离开的原因
            </h3>
            <p className="text-[13px] text-foreground-light mb-4">
              您的反馈将帮助我们改进产品（可选）
            </p>

            <div className="space-y-2">
              {[
                "产品不满足我的需求",
                "价格太高",
                "使用其他产品",
                "公司/项目已结束",
                "其他原因",
              ].map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-md border transition-colors text-[13px]",
                    reason === r
                      ? "border-border-strong bg-destructive-200 text-foreground"
                      : "border-border hover:border-border-strong text-foreground-light hover:text-foreground"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>

            {reason === "其他原因" && (
              <textarea
                placeholder="请告诉我们具体原因..."
                className="w-full mt-4 p-3 rounded-md bg-surface-200 border border-border text-foreground text-[13px] resize-none h-24"
              />
            )}
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1 border-border text-foreground-light"
            >
              上一步
            </Button>
            <Button
              onClick={() => setStep(3)}
              className="flex-1 bg-destructive hover:bg-destructive/90 text-background"
            >
              继续
            </Button>
          </div>
        </div>
      )}

      {/* 步骤 3: 确认删除 */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="p-5 rounded-md bg-destructive-200 border border-destructive/30">
            <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              最后确认
            </h3>
            <p className="text-[13px] text-foreground-light">
              此操作将永久删除您的账户和所有数据，无法恢复。
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-destructive-200 border border-destructive/30 text-destructive text-[13px] flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label className="text-[13px] text-foreground">
                请输入 <span className="font-mono text-destructive">"{expectedText}"</span> 以确认
              </Label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={expectedText}
                className="mt-2 h-9 bg-surface-200 border-border"
              />
            </div>

            <div>
              <Label className="text-[13px] text-foreground">请输入您的密码</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码确认身份"
                className="mt-2 h-9 bg-surface-200 border-border"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              className="flex-1 border-border text-foreground-light"
              disabled={isDeleting}
            >
              上一步
            </Button>
            <Button
              onClick={handleDelete}
              disabled={!isConfirmValid || !password || isDeleting}
              className="flex-1 bg-destructive hover:bg-destructive/90 text-background disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  删除中...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  永久删除账户
                </>
              )}
            </Button>
          </div>
        </div>
      )}
        </div>
      </div>
    </PageContainer>
  );
}
