/**
 * 登录设备相关类型定义
 */

/**
 * 登录设备
 */
export interface LoginDevice {
  /** 设备/会话 ID */
  id: string;
  /** 设备类型: desktop, mobile, tablet */
  type: "desktop" | "mobile" | "tablet";
  /** 设备名称 */
  name: string;
  /** 浏览器 */
  browser: string;
  /** 地理位置 */
  location: string;
  /** IP 地址 (部分隐藏) */
  ip: string;
  /** 是否为当前设备 */
  is_current: boolean;
  /** 最后活动时间 */
  last_active: string;
}

/**
 * 格式化的设备信息（用于前端显示）
 */
export interface FormattedDevice extends LoginDevice {
  lastActiveFormatted: string;
}
