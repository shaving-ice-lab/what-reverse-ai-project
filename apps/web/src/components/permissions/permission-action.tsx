"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  hasAnyWorkspacePermission,
  type WorkspacePermission,
  type WorkspacePermissionMap,
} from "@/lib/permissions";
import { cn } from "@/lib/utils";

interface PermissionActionProps {
  permissions?: Partial<WorkspacePermissionMap>;
  required: WorkspacePermission[];
  requireAll?: boolean;
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  href?: string;
  tooltip?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}

export function PermissionAction({
  permissions,
  required,
  requireAll = false,
  label,
  icon: Icon,
  onClick,
  href,
  tooltip = "权限不足",
  variant,
  size,
  className,
}: PermissionActionProps) {
  const allowed = requireAll
    ? required.every((permission) => Boolean(permissions?.[permission]))
    : hasAnyWorkspacePermission(permissions, ...required);

  const labelContent = (
    <>
      {Icon && <Icon className={cn("w-4 h-4", label ? "mr-1.5" : "")} />}
      {label}
    </>
  );

  if (allowed) {
    if (href) {
      return (
        <Button variant={variant} size={size} className={className} asChild>
          <Link href={href}>{labelContent}</Link>
        </Button>
      );
    }
    return (
      <Button variant={variant} size={size} className={className} onClick={onClick}>
        {labelContent}
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button variant={variant} size={size} className={className} disabled>
            {labelContent}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="bg-surface-100 border-border text-foreground">
        <span className="text-[11px]">{tooltip}</span>
      </TooltipContent>
    </Tooltip>
  );
}
