/**
 * Agent 商店相关类型定义
 */

// ===== Agent 实体 =====

export interface Agent {
  id: string;
  userId: string;
  workflowId: string;
  
  // 基础信息
  name: string;
  slug: string;
  description: string;
  longDescription: string | null;
  icon: string;
  coverImage: string | null;
  
  // 分类
  category: AgentCategory;
  tags: string[];
  
  // 状态
  status: AgentStatus;
  
  // 定价
  pricingType: PricingType;
  price: number | null;
  currency: string;
  
  // 统计
  useCount: number;
  starCount: number;
  reviewCount: number;
  avgRating: number;
  revenue: number;
  
  // 媒体
  screenshots: string[];
  demoVideo: string | null;
  
  // 作者信息
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  
  // 时间
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export type AgentCategory =
  | "content"      // 内容创作
  | "data"         // 数据处理
  | "customer"     // 客户服务
  | "productivity" // 办公效率
  | "developer"    // 开发工具
  | "research"     // 研究分析
  | "education"    // 教育学习
  | "finance"      // 金融财务
  | "marketing"    // 市场营销
  | "other";       // 其他

export type AgentStatus =
  | "draft"          // 草稿
  | "pending_review" // 待审核
  | "published"      // 已发布
  | "rejected"       // 已拒绝
  | "archived";      // 已归档

export type PricingType =
  | "free"        // 免费
  | "paid"        // 单次付费
  | "subscription"; // 订阅

// ===== Agent 详情 =====

export interface AgentDetail extends Agent {
  // 工作流信息
  workflow: {
    id: string;
    name: string;
    definition: unknown;
  };
  
  // 版本历史
  versions: AgentVersion[];
  
  // 评价统计
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  
  // 相关 Agent
  relatedAgents: Agent[];
  
  // 用户状态
  userState?: {
    isStarred: boolean;
    isPurchased: boolean;
    review?: Review;
  };
}

export interface AgentVersion {
  version: string;
  changelog: string;
  publishedAt: string;
}

// ===== 评价 =====

export interface Review {
  id: string;
  agentId: string;
  userId: string;
  rating: number;
  title: string;
  content: string;
  
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  
  // 互动
  helpfulCount: number;
  
  createdAt: string;
  updatedAt: string;
}

// ===== 分类 =====

export interface Category {
  id: AgentCategory;
  name: string;
  icon: string;
  description: string;
  count: number;
}

// ===== 查询参数 =====

export interface AgentListParams {
  category?: AgentCategory;
  search?: string;
  sort?: "popular" | "newest" | "rating" | "price_asc" | "price_desc";
  pricingType?: PricingType;
  minRating?: number;
  page?: number;
  pageSize?: number;
  my?: boolean; // 仅返回当前用户发布的 Agent
  status?: AgentStatus; // 按状态筛选
}

// ===== 发布请求 =====

export interface PublishAgentRequest {
  workflowId: string;
  name: string;
  description: string;
  longDescription?: string;
  icon?: string;
  coverImage?: string;
  category: AgentCategory;
  tags: string[];
  pricingType: PricingType;
  price?: number;
  screenshots?: string[];
  demoVideo?: string;
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  longDescription?: string;
  icon?: string;
  coverImage?: string;
  category?: AgentCategory;
  tags?: string[];
  pricingType?: PricingType;
  price?: number;
  screenshots?: string[];
  demoVideo?: string;
}

// ===== 评价请求 =====

export interface CreateReviewRequest {
  rating: number;
  title: string;
  content: string;
}
