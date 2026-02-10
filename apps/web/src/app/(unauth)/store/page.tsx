'use client'

/**
 * AppMarketplacePage - LobeHub StyleDesign
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { MarketplaceStoreContent } from '@/components/store/marketplace-store-content'
import { useAuthStore } from '@/stores/useAuthStore'

export default function StorePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, isInitialized, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (!isInitialized || isLoading) return
    if (isAuthenticated) {
      router.replace('/dashboard/store')
    }
  }, [isAuthenticated, isInitialized, isLoading, router])

  if (isInitialized && !isLoading && isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <MarketplaceStoreContent variant="public" />
      <SiteFooter />
    </div>
  )
}
