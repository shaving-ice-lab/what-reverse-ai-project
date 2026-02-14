'use client'

/**
 * Agent Page — Redirects to /dashboard/workspace
 * Kept for backward compatibility with bookmarks and old links.
 */

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AgentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const params = searchParams.toString()
    router.replace(`/dashboard/workspace${params ? `?${params}` : ''}`)
  }, [router, searchParams])

  return null
}
