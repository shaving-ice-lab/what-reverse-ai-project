'use client'

/**
 * Withdrawal Dialog Component
 */

import { useState } from 'react'
import { Wallet, AlertCircle, CheckCircle2, CreditCard, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

interface WithdrawalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  balance: number
  paymentMethod?: string | null
  isVerified: boolean
}

// Minimum withdrawal amount
const MIN_WITHDRAWAL_AMOUNT = 100
// Withdrawal fee rate
const WITHDRAWAL_FEE_RATE = 0.01
// Minimum fee
const MIN_WITHDRAWAL_FEE = 1

export function WithdrawalDialog({
  open,
  onOpenChange,
  balance,
  paymentMethod,
  isVerified,
}: WithdrawalDialogProps) {
  const [step, setStep] = useState<'amount' | 'confirm' | 'success'>('amount')
  const [amount, setAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const numericAmount = parseFloat(amount) || 0
  const fee = Math.max(numericAmount * WITHDRAWAL_FEE_RATE, MIN_WITHDRAWAL_FEE)
  const actualAmount = numericAmount - fee

  const handleAmountChange = (value: string) => {
    // Allow digits and decimals
    if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
      setAmount(value)
      setError(null)
    }
  }

  const handleQuickSelect = (percentage: number) => {
    const value = Math.floor(balance * percentage * 100) / 100
    setAmount(value.toString())
    setError(null)
  }

  const validateAmount = () => {
    if (numericAmount < MIN_WITHDRAWAL_AMOUNT) {
      setError(`Minimum withdrawal amount is ${MIN_WITHDRAWAL_AMOUNT}`)
      return false
    }
    if (numericAmount > balance) {
      setError('Withdrawal amount cannot exceed available balance')
      return false
    }
    return true
  }

  const handleNext = () => {
    if (validateAmount()) {
      setStep('confirm')
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    // Mock submit
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setStep('success')
  }

  const handleClose = () => {
    setStep('amount')
    setAmount('')
    setError(null)
    onOpenChange(false)
  }

  // Check if withdrawal is possible
  if (!isVerified || !paymentMethod) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px] bg-surface-100 border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Set Up Payment Info</DialogTitle>
            <DialogDescription className="text-foreground-light">
              Please set up your payment account information before withdrawing
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Alert className="border-warning/30 bg-warning-200">
              <AlertCircle className="h-4 w-4 text-warning" />
              <AlertTitle className="text-warning">Payment info required</AlertTitle>
              <AlertDescription className="text-foreground-light">
                Please add your payment account information (PayPal / bank transfer) in the Settings
                page first.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
              Cancel
            </Button>
            <Button
              className="bg-brand-500 hover:bg-brand-600 text-background"
              onClick={() => {
                onOpenChange(false)
                // TODO: Navigate to Settings page
              }}
            >
              Go to Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] bg-surface-100 border-border text-foreground">
        {step === 'amount' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground">Request Withdrawal</DialogTitle>
              <DialogDescription className="text-foreground-light">
                Available Balance: {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-6">
              {/* Amount Input */}
              <div className="space-y-3">
                <Label className="text-foreground-light">Withdrawal Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-semibold text-foreground-muted"></span>
                  <Input
                    type="text"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00"
                    className={cn(
                      'pl-8 pr-4 h-14 text-2xl font-semibold border-border bg-surface-200',
                      error && 'border-destructive-400'
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

              {/* Quick Select */}
              <div className="flex gap-2">
                {[0.25, 0.5, 0.75, 1].map((percentage) => (
                  <Button
                    key={percentage}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickSelect(percentage)}
                    className="flex-1 border-border text-foreground-muted hover:border-brand-500 hover:text-brand-500"
                  >
                    {percentage === 1 ? 'All' : `${percentage * 100}%`}
                  </Button>
                ))}
              </div>

              {/* Fee Preview */}
              {numericAmount > 0 && (
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-light">Withdrawal Amount</span>
                    <span className="text-foreground">
                      {numericAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-light">Fee (1%)</span>
                    <span className="text-foreground">
                      -{fee.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 mt-2">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-foreground-light">You&apos;ll receive</span>
                      <span className="text-brand-500">
                        {actualAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose} className="border-border">
                Cancel
              </Button>
              <Button
                onClick={handleNext}
                disabled={numericAmount < MIN_WITHDRAWAL_AMOUNT}
                className="bg-brand-500 hover:bg-brand-600 text-background"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground">Confirm Withdrawal</DialogTitle>
              <DialogDescription className="text-foreground-light">
                Please confirm the withdrawal details below
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {/* Payment Account */}
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-surface-200 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-foreground-muted" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">
                      {paymentMethod === 'alipay'
                        ? 'Alipay'
                        : paymentMethod === 'wechat'
                          ? 'WeChat Pay'
                          : 'Bank Transfer'}
                    </div>
                    <div className="text-sm text-foreground-light">
                      {paymentMethod === 'alipay' ? '****@example.com' : '**** **** 1234'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount Confirmation */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-foreground-light">Withdrawal Amount</span>
                  <span className="font-medium text-foreground">
                    {numericAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-light">Fee</span>
                  <span className="text-foreground">
                    {fee.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-foreground-light">You&apos;ll receive</span>
                    <span className="text-xl font-bold text-brand-500">
                      {actualAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tip */}
              <Alert className="border-border">
                <AlertCircle className="h-4 w-4 text-foreground-muted" />
                <AlertDescription className="text-foreground-light">
                  Withdrawals are typically processed within 1-3 business days.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('amount')} className="border-border">
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-brand-500 hover:bg-brand-600 text-background"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Confirm Withdrawal
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'success' && (
          <>
            <div className="py-8 flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-brand-200/60 border border-brand-500/30 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-brand-500" />
              </div>

              <h3 className="text-xl font-bold text-foreground mb-2">
                Withdrawal Request Submitted!
              </h3>
              <p className="text-foreground-light mb-6">
                Estimated arrival within 1-3 business days. Please check your account.
              </p>

              <div className="rounded-lg border border-border bg-surface-200 p-4 w-full">
                <div className="flex justify-between mb-3">
                  <span className="text-foreground-light">Withdrawal Amount</span>
                  <span className="font-semibold text-foreground">
                    {numericAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-border">
                  <span className="text-foreground-light">You&apos;ll receive</span>
                  <span className="text-xl font-bold text-brand-500">
                    {actualAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleClose}
                className="w-full bg-brand-500 hover:bg-brand-600 text-background"
              >
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
