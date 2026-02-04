"use client";

import { useMemo, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronRight,
  HelpCircle,
  Keyboard,
  LogOut,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { SidebarNavGroup, SidebarNavItem } from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CommandPalette, useCommandPalette } from "@/components/ui/command-palette";
import { useKeyboardShortcuts } from "@/components/ui/keyboard-shortcuts";
import { useTour, adminDashboardTour, isTourCompleted } from "@/components/ui/onboarding-tour";
import { SkipLink } from "@/components/ui/accessibility";
import { adminNavGroups, segmentLabels } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePermission } from "@/hooks/usePermission";

interface AdminShellProps {
  children: ReactNode;
}

const resolveEnvLabel = () => {
  const env = (process.env.NEXT_PUBLIC_APP_ENV || "dev").toUpperCase();
  if (env === "PRODUCTION") return "PROD";
  return env;
};

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const envLabel = resolveEnvLabel();
  const { user, logout, isLoading } = useAuthStore();
  const { hasPermission } = usePermission();

  // Command Palette
  const { open: commandPaletteOpen, setOpen: setCommandPaletteOpen } = useCommandPalette();

  // Keyboard Shortcuts
  const { showHelp: showKeyboardHelp, registerShortcut, unregisterShortcut } = useKeyboardShortcuts();

  // Onboarding Tour
  const { startTour } = useTour();

  // Register global shortcuts
  useEffect(() => {
    const shortcuts = [
      {
        id: "go-dashboard",
        keys: ["g", "d"],
        label: "前往总览",
        category: "导航",
        handler: () => router.push("/"),
      },
      {
        id: "go-users",
        keys: ["g", "u"],
        label: "前往用户管理",
        category: "导航",
        handler: () => router.push("/users"),
      },
      {
        id: "go-tickets",
        keys: ["g", "t"],
        label: "前往工单中心",
        category: "导航",
        handler: () => router.push("/support/tickets"),
      },
      {
        id: "go-system",
        keys: ["g", "s"],
        label: "前往系统健康",
        category: "导航",
        handler: () => router.push("/system/health"),
      },
    ];

    shortcuts.forEach((s) => registerShortcut(s));
    return () => shortcuts.forEach((s) => unregisterShortcut(s.id));
  }, [router, registerShortcut, unregisterShortcut]);

  // Start onboarding tour for new users
  useEffect(() => {
    const tourId = adminDashboardTour.id;
    if (!isTourCompleted(tourId) && user?.email) {
      // Delay tour start to let UI render
      const timer = setTimeout(() => {
        startTour(adminDashboardTour);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [startTour, user]);

  const flatNavItems = adminNavGroups.flatMap((group) => group.items);
  const navMap = new Map(flatNavItems.map((item) => [item.href, item]));

  const visibleNavGroups = useMemo(() => {
    return adminNavGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) => !item.capabilityKey || hasPermission(item.capabilityKey)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [hasPermission]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const buildBreadcrumbs = () => {
    if (!pathname || pathname === "/") {
      return [{ href: "/", label: "总览" }];
    }

    const segments = pathname.split("/").filter(Boolean);
    let currentPath = "";
    return segments.map((segment) => {
      currentPath += `/${segment}`;
      const navItem = navMap.get(currentPath);
      const label =
        navItem?.title ||
        segmentLabels[segment] ||
        segment.replace(/-/g, " ");
      return { href: currentPath, label };
    });
  };

  const breadcrumbs = buildBreadcrumbs();

  return (
    <>
      {/* Skip Link for Accessibility */}
      <SkipLink href="#main-content" />

      <div className="flex h-screen overflow-hidden bg-background-studio text-foreground">
        <aside className="w-[220px] shrink-0 border-r border-border bg-background-studio" data-tour="sidebar">
          <div className="h-12 px-4 flex items-center gap-2 border-b border-border">
            <div className="w-7 h-7 rounded-md bg-brand-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-background" />
            </div>
            <div className="leading-tight">
              <div className="text-[12px] font-semibold">AgentFlow</div>
              <div className="text-[10px] text-foreground-muted">Admin Console</div>
            </div>
          </div>
          <div className="h-[calc(100%-3rem)] overflow-y-auto scrollbar-thin px-2 py-3">
            {visibleNavGroups.map((group, groupIndex) => (
              <SidebarNavGroup key={group.title} title={group.title}>
                {group.items.map((item, itemIndex) => (
                  <SidebarNavItem
                    key={item.href}
                    href={item.href}
                    label={item.title}
                    icon={<item.icon className="w-3.5 h-3.5" />}
                    badge={item.badge}
                    active={isActive(item.href)}
                    external={item.external}
                    data-tour={
                      item.href === "/users"
                        ? "nav-users"
                        : item.href === "/support/tickets"
                        ? "nav-support"
                        : item.href === "/system/health"
                        ? "nav-system"
                        : undefined
                    }
                  />
                ))}
              </SidebarNavGroup>
            ))}
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 border-b border-border bg-background-studio/95 backdrop-blur flex items-center gap-4 px-4">
            <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
              <span className="text-foreground-light">Admin</span>
              {breadcrumbs.map((crumb) => (
                <div key={crumb.href} className="flex items-center gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-foreground-muted" />
                  <Link
                    href={crumb.href}
                    className={cn(
                      "hover:text-foreground transition-colors",
                      crumb.href === pathname && "text-foreground"
                    )}
                  >
                    {crumb.label}
                  </Link>
                </div>
              ))}
            </div>

            {/* Global Search Button */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex-1 max-w-[420px] h-8 px-3 flex items-center gap-2 border border-border rounded-lg bg-background hover:bg-background-hover transition-colors text-left"
              data-tour="global-search"
            >
              <Search className="w-3.5 h-3.5 text-foreground-muted" />
              <span className="flex-1 text-sm text-foreground-muted">搜索用户 / Workspace / 工单...</span>
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] text-foreground-muted">
                ⌘K
              </kbd>
            </button>

            <div className="ml-auto flex items-center gap-2">
              {/* Keyboard Shortcuts Help */}
              <Button
                variant="ghost"
                size="sm"
                onClick={showKeyboardHelp}
                title="键盘快捷键 (?)"
                className="hidden sm:flex"
              >
                <Keyboard className="w-4 h-4" />
              </Button>

              {user?.email ? (
                <Badge
                  variant="outline"
                  size="sm"
                  className="max-w-[220px] truncate flex items-center gap-1.5"
                >
                  <UserRound className="w-3.5 h-3.5 text-foreground-muted" />
                  <span className="truncate">{user.email}</span>
                </Badge>
              ) : null}
              <Badge variant="outline" size="sm">
                {envLabel}
              </Badge>
              <Link href="/system/health">
                <Button variant="outline" size="sm">
                  系统状态
                </Button>
              </Link>
              <Link href="/support/tickets">
                <Button size="sm">待处理工单</Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                loading={isLoading}
                loadingText="退出中..."
                onClick={async () => {
                  await logout();
                  router.replace("/login");
                }}
              >
                <LogOut className="w-4 h-4" />
                退出
              </Button>
            </div>
          </header>

          <main id="main-content" className="flex-1 overflow-hidden bg-background-studio">
            <div className="dashboard-shell" data-layout="standard">
              <div className="dashboard-content">
                <div className="dashboard-page">{children}</div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
    </>
  );
}
