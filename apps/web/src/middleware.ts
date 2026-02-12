import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const DASHBOARD_PREFIX = '/dashboard'

// Old authenticated routes that used to live at "/xxx"
// Now they are all under "/dashboard/xxx"
const LEGACY_DASHBOARD_PREFIXES = ['/apps', '/profile', '/settings', '/workspaces'] as const

function resolveLegacyDashboardPath(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  if (segments[0] !== 'dashboard') return null

  // Legacy: /dashboard/workspaces/:id/apps/:appId/... → /dashboard/agent
  if (segments[1] === 'workspaces' && segments[3] === 'apps') {
    return '/dashboard/agent'
  }

  // Legacy: /dashboard/app/:appId/... → /dashboard/agent
  if (segments[1] === 'app' && segments[2]) {
    return '/dashboard/agent'
  }

  // Legacy: /dashboard/apps → /dashboard/agent
  if (segments[1] === 'apps' && !segments[2]) {
    return '/dashboard/agent'
  }

  // Legacy redirect → /dashboard/agent
  if (segments[1] === 'builder') {
    return '/dashboard/agent'
  }

  return null
}

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Already on the new namespace
  if (pathname.startsWith(DASHBOARD_PREFIX)) {
    const legacyRedirect = resolveLegacyDashboardPath(pathname)
    if (legacyRedirect && legacyRedirect !== pathname) {
      const url = request.nextUrl.clone()
      url.pathname = legacyRedirect
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  const shouldRedirect = LEGACY_DASHBOARD_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))
  if (!shouldRedirect) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = `${DASHBOARD_PREFIX}${pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    // Exclude Next internals, API routes and static files
    '/((?!api|_next|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
  ],
}
