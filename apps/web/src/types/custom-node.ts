/**
 * 自定义节点类型定义
 */

// 节点状态
export type CustomNodeStatus =
  | "draft"          // 草稿
  | "pending_review" // 待审核
  | "published"      // 已发布
  | "rejected"       // 已拒绝
  | "deprecated";    // 已废弃

// 节点分类
export type CustomNodeCategory =
  | "ai"             // AI/LLM
  | "data"           // 数据处理
  | "integration"    // 集成/API
  | "utility"        // 工具
  | "logic"          // 逻辑控制
  | "communication"  // 通信
  | "storage"        // 存储
  | "other";         // 其他

// 输入/输出端口定义
export interface NodePort {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array" | "any";
  description?: string;
  required?: boolean;
  default?: unknown;
}

// 自定义节点
export interface CustomNode {
  id: string;
  
  // 基础信息
  name: string;
  displayName?: string;
  slug: string;
  description: string;
  longDescription: string | null;
  icon: string;
  
  // 分类
  category: CustomNodeCategory;
  tags: string[];
  
  // 版本
  version: string;
  latestVersion?: string;
  minSdkVersion?: string;
  maxSdkVersion?: string | null;
  
  // 状态
  status: CustomNodeStatus;
  
  // 技术信息
  inputs: NodePort[];
  outputs: NodePort[];
  
  // 统计
  installCount: number;
  starCount: number;
  reviewCount: number;
  avgRating: number;
  
  // 作者
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    isVerified: boolean;
  };
  
  // 时间
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

// 节点详情
export interface CustomNodeDetail extends CustomNode {
  // 源码/包信息
  packageName: string;
  repositoryUrl: string | null;
  documentationUrl: string | null;
  
  // 版本历史
  versions: CustomNodeVersion[];
  
  // 依赖
  dependencies: string[];
  
  // 示例代码
  exampleCode: string | null;
  
  // 截图
  screenshots: string[];
  
  // 评价分布
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  
  // 用户状态
  userState?: {
    isInstalled: boolean;
    isStarred: boolean;
    installedVersion: string | null;
  };
}

// 节点版本
export interface CustomNodeVersion {
  version: string;
  changelog: string;
  publishedAt: string;
  downloads: number;
}

// 节点评价
export interface CustomNodeReview {
  id: string;
  nodeId: string;
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
  
  createdAt: string;
  updatedAt: string;
}

// 查询参数
export interface CustomNodeListParams {
  category?: CustomNodeCategory;
  search?: string;
  sort?: "popular" | "newest" | "rating" | "name";
  page?: number;
  pageSize?: number;
  installed?: boolean; // 仅已安装
}

// API 响应类型
export interface CustomNodeListResponse {
  success: boolean;
  data: {
    nodes: CustomNode[];
  };
  meta: {
    total: number;
    page: number;
    page_size: number;
  };
}

export interface CustomNodeDetailResponse {
  success: boolean;
  data: CustomNodeDetail;
}

// 节点分类接口
export interface NodeCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}
