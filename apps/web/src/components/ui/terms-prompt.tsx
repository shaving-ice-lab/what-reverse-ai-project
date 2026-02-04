"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TermsPromptProps {
  storageKey: string;
  version?: string;
  title?: string;
  description?: string;
  termsUrl?: string;
  onStatusChange?: (accepted: boolean) => void;
  className?: string;
}

type StoredTermsState = {
  version: string;
  accepted_at: string;
};

export function TermsPrompt({
  storageKey,
  version = "v1",
  title = "公开访问使用条款",
  description = "继续访问即表示你已阅读并同意相关使用条款与隐私政策。",
  termsUrl = "/terms",
  onStatusChange,
  className,
}: TermsPromptProps) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setAccepted(false);
        setOpen(true);
        onStatusChange?.(false);
        return;
      }
      const parsed = JSON.parse(raw) as StoredTermsState;
      const isValid = parsed?.version === version && Boolean(parsed?.accepted_at);
      setAccepted(isValid);
      setOpen(!isValid);
      onStatusChange?.(isValid);
    } catch {
      setAccepted(false);
      setOpen(true);
      onStatusChange?.(false);
    }
  }, [storageKey, version, onStatusChange]);

  const handleAccept = () => {
    if (!checked) return;
    const payload: StoredTermsState = {
      version,
      accepted_at: new Date().toISOString(),
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // 忽略存储失败，仍允许继续访问
    }
    setAccepted(true);
    setOpen(false);
    onStatusChange?.(true);
  };

  if (accepted && !open) {
    return null;
  }

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className={cn("border-border/70 bg-card/90", className)}>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="mt-4 flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
          <Checkbox
            id="terms-agree"
            checked={checked}
            onCheckedChange={(value) => setChecked(Boolean(value))}
            className="mt-1"
          />
          <label htmlFor="terms-agree" className="text-sm text-foreground leading-relaxed">
            我已阅读并同意{" "}
            <Link href={termsUrl} className="text-primary hover:underline" target="_blank">
              使用条款
            </Link>
            。
          </label>
        </div>

        <AlertDialogFooter className="mt-6">
          <AlertDialogAction asChild>
            <Button onClick={handleAccept} disabled={!checked}>
              同意并继续
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
