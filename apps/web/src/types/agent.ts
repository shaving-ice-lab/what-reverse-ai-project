/**
 * Agent StoreRelatedTypeDefinition
 */

// ===== Agent Entity =====

export interface Agent {
  id: string
  userId: string
  workflowId: string

  // Basic Information
  name: string
  slug: string
  description: string
  longDescription: string | null
  icon: string
  coverImage: string | null

  // Category
  category: AgentCategory
  tags: string[]

  // Status
  status: AgentStatus

  // Pricing
  pricingType: PricingType
  price: number | null
  currency: string

  // Statistics
  useCount: number
  starCount: number
  reviewCount: number
  avgRating: number
  revenue: number

  // Media
  screenshots: string[]
  demoVideo: string | null

  // userInfo
  author: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  }

  // Time
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

export type AgentCategory =
  | 'content' // ContentCreative
  | 'data' // DataProcess
  | 'customer' // CustomerService
  | 'productivity' // Officerate
  | 'developer' // DevelopmentTool
  | 'research' // ResearchAnalytics
  | 'education' // EducationLearn
  | 'finance' // FinanceFinance
  | 'marketing' // MarketplaceMarketing
  | 'other' // otherhe

export type AgentStatus =
  | 'draft' // Draft
  | 'pending_review' // Pending Review
  | 'published' // Published
  | 'rejected' // alreadyDeny
  | 'archived' // Archived

export type PricingType =
  | 'free' // Free
  | 'paid' // timesPaid
  | 'subscription' // Subscription

// ===== Agent Details =====

export interface AgentDetail extends Agent {
  // WorkflowInfo
  workflow: {
    id: string
    name: string
    definition: unknown
  }

  // Version History
  versions: AgentVersion[]

  // ReviewsStatistics
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }

  // Related Agent
  relatedAgents: Agent[]

  // UserStatus
  userState?: {
    isStarred: boolean
    isPurchased: boolean
    review?: Review
  }
}

export interface AgentVersion {
  version: string
  changelog: string
  publishedAt: string
}

// ===== Reviews =====

export interface Review {
  id: string
  agentId: string
  userId: string
  rating: number
  title: string
  content: string

  user: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  }

  //
  helpfulCount: number

  createdAt: string
  updatedAt: string
}

// ===== Category =====

export interface Category {
  id: AgentCategory
  name: string
  icon: string
  description: string
  count: number
}

// ===== QueryParameter =====

export interface AgentListParams {
  category?: AgentCategory
  search?: string
  sort?: 'popular' | 'newest' | 'rating' | 'price_asc' | 'price_desc'
  pricingType?: PricingType
  minRating?: number
  page?: number
  pageSize?: number
  my?: boolean // onlyBackCurrentUserPublish's Agent
  status?: AgentStatus // byStatusFilter
}

// ===== PublishRequest =====

export interface PublishAgentRequest {
  workflowId: string
  name: string
  description: string
  longDescription?: string
  icon?: string
  coverImage?: string
  category: AgentCategory
  tags: string[]
  pricingType: PricingType
  price?: number
  screenshots?: string[]
  demoVideo?: string
}

export interface UpdateAgentRequest {
  name?: string
  description?: string
  longDescription?: string
  icon?: string
  coverImage?: string
  category?: AgentCategory
  tags?: string[]
  pricingType?: PricingType
  price?: number
  screenshots?: string[]
  demoVideo?: string
}

// ===== ReviewsRequest =====

export interface CreateReviewRequest {
  rating: number
  title: string
  content: string
}
