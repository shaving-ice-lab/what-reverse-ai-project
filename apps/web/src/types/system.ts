/**
 * 系统相关类型定义
 */

/**
 * 系统健康状态
 */
export interface SystemHealth {
  /** 服务名称 */
  name: string;
  /** 状态: healthy, degraded, down */
  status: "healthy" | "degraded" | "down";
  /** 延迟 (毫秒) */
  latency_ms: number;
  /** 图标 */
  icon?: string;
}

/**
 * 系统公告
 */
export interface Announcement {
  /** 公告 ID */
  id: string;
  /** 标题 */
  title: string;
  /** 描述 */
  description: string;
  /** 类型: feature, improvement, notice, warning */
  type: "feature" | "improvement" | "notice" | "warning";
  /** 是否已读 */
  is_read?: boolean;
  /** 创建时间 */
  created_at: string;
}

/**
 * 格式化的系统健康状态（用于前端显示）
 */
export interface FormattedSystemHealth {
  name: string;
  status: "healthy" | "degraded" | "down";
  latency: string;
  icon: React.ComponentType<{ className?: string }>;
}
