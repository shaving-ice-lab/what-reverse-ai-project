/**
 * CustomNodeTypeDefinition
 */

// NodeStatus
export type CustomNodeStatus =
  | 'draft' // Draft
  | 'pending_review' // Pending Review
  | 'published' // Published
  | 'rejected' // alreadyDeny
  | 'deprecated' // alreadyDeprecated

// NodeCategory
export type CustomNodeCategory =
  | 'ai' // AI/LLM
  | 'data' // DataProcess
  | 'integration' // Integration/API
  | 'utility' // Tool
  | 'logic' // LogicControl
  | 'communication' // Communication
  | 'storage' // Storage
  | 'other' // otherhe

// Input/OutputPortDefinition
export interface NodePort {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any'
  description?: string
  required?: boolean
  default?: unknown
}

// CustomNode
export interface CustomNode {
  id: string

  // Basic Information
  name: string
  displayName?: string
  slug: string
  description: string
  longDescription: string | null
  icon: string

  // Category
  category: CustomNodeCategory
  tags: string[]

  // Version
  version: string
  latestVersion?: string
  minSdkVersion?: string
  maxSdkVersion?: string | null

  // Status
  status: CustomNodeStatus

  // TechnologyInfo
  inputs: NodePort[]
  outputs: NodePort[]

  // Statistics
  installCount: number
  starCount: number
  reviewCount: number
  avgRating: number

  // user
  author: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
    isVerified: boolean
  }

  // Time
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

// NodeDetails
export interface CustomNodeDetail extends CustomNode {
  // Source Code/Info
  packageName: string
  repositoryUrl: string | null
  documentationUrl: string | null

  // Version History
  versions: CustomNodeVersion[]

  // Dependency
  dependencies: string[]

  // ExampleCode
  exampleCode: string | null

  // Screenshot
  screenshots: string[]

  // ReviewsDistribution
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }

  // UserStatus
  userState?: {
    isInstalled: boolean
    isStarred: boolean
    installedVersion: string | null
  }
}

// NodeVersion
export interface CustomNodeVersion {
  version: string
  changelog: string
  publishedAt: string
  downloads: number
}

// NodeReviews
export interface CustomNodeReview {
  id: string
  nodeId: string
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

  createdAt: string
  updatedAt: string
}

// QueryParameter
export interface CustomNodeListParams {
  category?: CustomNodeCategory
  search?: string
  sort?: 'popular' | 'newest' | 'rating' | 'name'
  page?: number
  pageSize?: number
  installed?: boolean // onlyalreadyInstall
}

// API ResponseType
export interface CustomNodeListResponse {
  success: boolean
  data: {
    nodes: CustomNode[]
  }
  meta: {
    total: number
    page: number
    page_size: number
  }
}

export interface CustomNodeDetailResponse {
  success: boolean
  data: CustomNodeDetail
}

// NodeCategoryInterface
export interface NodeCategory {
  id: string
  name: string
  icon: string
  count: number
}
