"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LegacyEntryType = "workflow" | "agent";

const legacyEntryCopy: Record<LegacyEntryType, { label: string; description: string }> = {
  workflow: {
    label: "工作流入口",
    description: "正在迁移到 App Workbench，建议从新入口继续创建与管理。",
  },
  agent: {
    label: "Agent 入口",
    description: "正在统一到 App Workbench，建议从新入口继续创建与管理。",
  },
};

interface LegacyEntryBannerProps {
  type: LegacyEntryType;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}

export function LegacyEntryBanner({
  type,
  actionHref = "/dashboard/apps",
  actionLabel = "前往 Workbench",
  className,
}: LegacyEntryBannerProps) {
  const copy = legacyEntryCopy[type];

  return (
    <Alert
      variant="warning"
      className={cn(
        "flex flex-col gap-3 md:flex-row md:items-center md:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <AlertTitle className="text-[11px] uppercase tracking-[0.14em] text-warning">
          旧入口提示
        </AlertTitle>
        <AlertDescription className="text-[12px] text-foreground-light">
          <span className="text-foreground font-medium">{copy.label}</span>
          {" "}
          {copy.description}
        </AlertDescription>
      </div>
      <Button
        asChild
        size="sm"
        rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
      >
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    </Alert>
  );
}
