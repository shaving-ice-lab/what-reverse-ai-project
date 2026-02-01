/**
 * 用户活动相关类型定义
 */

/**
 * 用户活动记录
 */
export interface UserActivity {
  /** 活动 ID */
  id: string;
  /** 操作类型 */
  action: string;
  /** 相关实体类型 */
  entity_type?: string;
  /** 相关实体 ID */
  entity_id?: string;
  /** 设备信息 */
  device?: string;
  /** IP 地址 */
  ip?: string;
  /** 地理位置 */
  location?: string;
  /** 创建时间 */
  created_at: string;
}

/**
 * 格式化的活动记录（用于前端显示）
 */
export interface FormattedActivity {
  id: string;
  action: string;
  target?: string;
  device: string;
  time: string;
}
