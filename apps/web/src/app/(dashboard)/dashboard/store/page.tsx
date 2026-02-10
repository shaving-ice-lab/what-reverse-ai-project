'use client'

/**
 * Dashboard Store page
 * Route: /dashboard/store
 */

import { PageContainer } from '@/components/dashboard/page-layout'
import { MarketplaceStoreContent } from '@/components/store/marketplace-store-content'

export default function DashboardStorePage() {
  return (
    <PageContainer fullWidth>
      <MarketplaceStoreContent variant="dashboard" />
    </PageContainer>
  )
}
