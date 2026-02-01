"use client";

/**
 * 提现对话框组件
 */

import { useState } from "react";
import {
  Wallet,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface WithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: number;
  paymentMethod?: string | null;
  isVerified: boolean;
}

// 最小提现金额
const MIN_WITHDRAWAL_AMOUNT = 100;
// 提现手续费率
const WITHDRAWAL_FEE_RATE = 0.01;
// 最小手续费
const MIN_WITHDRAWAL_FEE = 1;

export function WithdrawalDialog({
  open,
  onOpenChange,
  balance,
  paymentMethod,
  isVerified,
}: WithdrawalDialogProps) {
  const [step, setStep] = useState<"amount" | "confirm" | "success">("amount");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericAmount = parseFloat(amount) || 0;
  const fee = Math.max(numericAmount * WITHDRAWAL_FEE_RATE, MIN_WITHDRAWAL_FEE);
  const actualAmount = numericAmount - fee;

  const handleAmountChange = (value: string) => {
    // 只允许数字和小数点
    if (/^\d*\.?\d{0,2}$/.test(value) || value === "") {
      setAmount(value);
      setError(null);
    }
  };

  const handleQuickSelect = (percentage: number) => {
    const value = Math.floor(balance * percentage * 100) / 100;
    setAmount(value.toString());
    setError(null);
  };

  const validateAmount = () => {
    if (numericAmount < MIN_WITHDRAWAL_AMOUNT) {
      setError(`最低提现金额为 ${MIN_WITHDRAWAL_AMOUNT}`);
      return false;
    }
    if (numericAmount > balance) {
      setError("提现金额不能超过可用余额");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateAmount()) {
      setStep("confirm");
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // 模拟提交
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setStep("success");
  };

  const handleClose = () => {
    setStep("amount");
    setAmount("");
    setError(null);
    onOpenChange(false);
  };

  // 检查是否可以提现
  if (!isVerified || !paymentMethod) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px] bg-surface-100 border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">设置收款信息</DialogTitle>
            <DialogDescription className="text-foreground-light">
              提现前请先设置收款账户信息
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Alert className="border-warning/30 bg-warning-200">
              <AlertCircle className="h-4 w-4 text-warning" />
              <AlertTitle className="text-warning">需要设置收款信息</AlertTitle>
              <AlertDescription className="text-foreground-light">
                请先前往设置页面添加您的收款账户信息（支付宝/微信/银行卡）。
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border"
            >
              取消
            </Button>
            <Button
              className="bg-brand-500 hover:bg-brand-600 text-background"
              onClick={() => {
                onOpenChange(false);
                // TODO: 跳转到设置页面
              }}
            >
              去设置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] bg-surface-100 border-border text-foreground">
        {step === "amount" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground">申请提现</DialogTitle>
              <DialogDescription className="text-foreground-light">
                可用余额: {balance.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6">
              {/* 金额输入 */}
              <div className="space-y-3">
                <Label className="text-foreground-light">提现金额</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-semibold text-foreground-muted">
                    
                  </span>
                  <Input
                    type="text"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00"
                    className={cn(
                      "pl-8 pr-4 h-14 text-2xl font-semibold border-border bg-surface-200",
                      error && "border-destructive-400"
                    )}
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive-400 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {error}
                  </p>
                )}
              </div>

              {/* 快捷选择 */}
              <div className="flex gap-2">
                {[0.25, 0.5, 0.75, 1].map((percentage) => (
                  <Button
                    key={percentage}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickSelect(percentage)}
                    className="flex-1 border-border text-foreground-muted hover:border-brand-500 hover:text-brand-500"
                  >
                    {percentage === 1 ? "全部" : `${percentage * 100}%`}
                  </Button>
                ))}
              </div>

              {/* 费用预览 */}
              {numericAmount > 0 && (
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-light">提现金额</span>
                    <span className="text-foreground">
                      {numericAmount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-light">手续费 (1%)</span>
                    <span className="text-foreground">
                      -{fee.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 mt-2">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-foreground-light">实际到账</span>
                      <span className="text-brand-500">
                        {actualAmount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-border"
              >
                取消
              </Button>
              <Button
                onClick={handleNext}
                disabled={numericAmount < MIN_WITHDRAWAL_AMOUNT}
                className="bg-brand-500 hover:bg-brand-600 text-background"
              >
                下一步
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground">确认提现信息</DialogTitle>
              <DialogDescription className="text-foreground-light">
                请确认以下提现信息
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {/* 收款账户 */}
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-surface-200 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-foreground-muted" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">
                      {paymentMethod === "alipay" ? "支付宝" : paymentMethod === "wechat" ? "微信支付" : "银行卡"}
                    </div>
                  <div className="text-sm text-foreground-light">
                      {paymentMethod === "alipay" ? "****@example.com" : "**** **** 1234"}
                    </div>
                  </div>
                </div>
              </div>

              {/* 金额确认 */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-foreground-light">提现金额</span>
                  <span className="font-medium text-foreground">
                    {numericAmount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-light">手续费</span>
                  <span className="text-foreground">
                    {fee.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-foreground-light">实际到账</span>
                    <span className="text-xl font-bold text-brand-500">
                      {actualAmount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* 提示 */}
              <Alert className="border-border">
                <AlertCircle className="h-4 w-4 text-foreground-muted" />
                <AlertDescription className="text-foreground-light">
                  提现申请将在 1-3 个工作日内处理完成
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep("amount")}
                className="border-border"
              >
                返回
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-brand-500 hover:bg-brand-600 text-background"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    确认提现
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "success" && (
          <>
            <div className="py-8 flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-brand-200/60 border border-brand-500/30 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-brand-500" />
              </div>
              
              <h3 className="text-xl font-bold text-foreground mb-2">
                提现申请已提交！
              </h3>
              <p className="text-foreground-light mb-6">
                预计 1-3 个工作日内到账，请注意查收
              </p>
              
              <div className="rounded-lg border border-border bg-surface-200 p-4 w-full">
                <div className="flex justify-between mb-3">
                  <span className="text-foreground-light">提现金额</span>
                  <span className="font-semibold text-foreground">
                    {numericAmount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-border">
                  <span className="text-foreground-light">实际到账</span>
                  <span className="text-xl font-bold text-brand-500">
                    {actualAmount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleClose}
                className="w-full bg-brand-500 hover:bg-brand-600 text-background"
              >
                完成
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
