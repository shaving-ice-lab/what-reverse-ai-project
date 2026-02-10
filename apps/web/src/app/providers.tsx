'use client'

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
import { useState, useEffect, type ReactNode } from 'react'
import { ToastProvider, useToast, setGlobalToast, toast } from '@/components/ui/toast'
import { ErrorBoundary, getErrorMessage } from '@/components/ui/error-boundary'
import { ApiError } from '@/lib/api'
import { CACHE_TIMES } from '@/lib/cache'
import { ClientTelemetry } from '@/components/observability/client-telemetry'
import { reportError } from '@/lib/telemetry'
import { isFeatureEnabled } from '@/lib/feature-flags'

interface ProvidersProps {
  children: ReactNode
}

const MAX_QUERY_RETRIES = 2
const RETRY_BASE_DELAY_MS = 400

function shouldIgnoreError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError'
}

function shouldRetry(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 'TOKEN_EXPIRED') return false
    if ([400, 401, 403, 404, 409, 422].includes(error.status)) return false
    if (error.status === 429 || error.code === 'RATE_LIMITED') return false
    return error.status >= 500 || error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT'
  }

  return true
}

function handleGlobalError(error: unknown) {
  if (shouldIgnoreError(error)) return
  toast.error(getErrorMessage(error))
}

// Settings all toast (used for component environment)
function GlobalToastSetter() {
  const { addToast } = useToast()

  useEffect(() => {
    setGlobalToast(addToast)
    return () => setGlobalToast(null)
  }, [addToast])

  return null
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: handleGlobalError }),
        mutationCache: new MutationCache({ onError: handleGlobalError }),
        defaultOptions: {
          queries: {
            // DataExpiredTime: 5min
            staleTime: CACHE_TIMES.MEDIUM,
            // CacheTime: 30min
            gcTime: CACHE_TIMES.LONG,
            // FailedRetryPolicy
            retry: (failureCount, error) => {
              if (!shouldRetry(error)) return false
              return failureCount < MAX_QUERY_RETRIES
            },
            retryDelay: (attempt) => Math.min(RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1), 5000),
            // WindowFocustimenotAutore-newFetch
            refetchOnWindowFocus: false,
          },
          mutations: {
            // Avoidetcre-Submit
            retry: false,
          },
        },
      })
  )

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <ErrorBoundary
            showDetails={process.env.NODE_ENV === 'development'}
            onError={(error, errorInfo) =>
              reportError(error, {
                source: 'error-boundary',
                componentStack: errorInfo.componentStack,
              })
            }
          >
            {children}
          </ErrorBoundary>
          <GlobalToastSetter />
        </ToastProvider>
        {isFeatureEnabled('analytics') && <ClientTelemetry />}
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ThemeProvider>
  )
}
