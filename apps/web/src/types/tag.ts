/**
 * 标签相关类型定义
 */

/**
 * 工作流标签
 */
export interface Tag {
  /** 标签 ID */
  id: string;
  /** 用户 ID */
  user_id: string;
  /** 标签名称 */
  name: string;
  /** 标签颜色 */
  color: string;
  /** 创建时间 */
  created_at: string;
}

/**
 * 带使用数量的标签
 */
export interface TagWithCount extends Tag {
  /** 使用数量 */
  count: number;
}

/**
 * 前端展示用的标签
 */
export interface WorkflowTag {
  id: string;
  name: string;
  color: string;
  count: number;
}
