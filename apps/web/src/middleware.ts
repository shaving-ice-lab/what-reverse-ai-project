import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const DASHBOARD_PREFIX = "/dashboard";

// Old authenticated routes that used to live at "/xxx"
// Now they are all under "/dashboard/xxx"
const LEGACY_DASHBOARD_PREFIXES = [
  "/achievements",
  "/activity",
  "/admin",
  "/analytics",
  "/api-keys",
  "/apps",
  "/billing",
  "/chat",
  "/conversations",
  "/creative",
  "/creator",
  "/data",
  "/editor",
  "/export",
  "/feedback",
  "/files",
  "/getting-started",
  "/history",
  "/integrations",
  "/logs",
  "/models",
  "/my-agents",
  "/notifications",
  "/plans",
  "/profile",
  "/quick-actions",
  "/referral",
  "/review",
  "/search",
  "/settings",
  "/shortcuts",
  "/support-settings",
  "/support-tickets",
  "/team",
  "/template-gallery",
  "/upgrade",
  "/webhooks",
  "/workflows",
  "/workspaces",
] as const;

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Already on the new namespace
  if (pathname.startsWith(DASHBOARD_PREFIX)) {
    return NextResponse.next();
  }

  // Public learning hub canonical path
  if (pathname === "/learn") {
    const url = request.nextUrl.clone();
    url.pathname = "/learn/courses";
    return NextResponse.redirect(url);
  }

  const shouldRedirect = LEGACY_DASHBOARD_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
  if (!shouldRedirect) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `${DASHBOARD_PREFIX}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Exclude Next internals, API routes and static files
    "/((?!api|_next|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};

