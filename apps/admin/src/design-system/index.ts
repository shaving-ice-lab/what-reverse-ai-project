/**
 * Admin 设计系统导出
 * 
 * 使用方式:
 * import { CHART_COLORS, INTERACTION_STATES } from '@/design-system'
 */

// 从 UI 组件重新导出设计系统常量
export {
  // 数据密度配置
  DENSITY_CONFIGS,
  type DataDensity,
  type ColumnDef,
  type SortState,
  type RowAction,
} from "@/components/ui/data-table"

export {
  // 交互状态配置
  INTERACTION_STATES,
  SPINNER_SIZES,
  SPINNER_COLORS,
  STATUS_DOT_COLORS,
  STATUS_DOT_SIZES,
  STATUS_LABEL_STYLES,
  PROGRESS_SIZES,
  PROGRESS_COLORS,
  SKELETON_ROUNDED,
} from "@/components/ui/interaction-states"

export {
  // 图表配色和样式
  CHART_COLORS,
  CHART_PALETTE,
  CHART_THEME,
  CHART_SIZES,
} from "@/components/ui/chart-styles"

// 设计系统常量
export const DESIGN_SYSTEM_VERSION = "1.0.0"

// 色彩系统
export const COLORS = {
  brand: {
    50: "#ecfdf5",
    100: "#d1fae5",
    200: "#1a3a2a",
    300: "#1f4a35",
    400: "#2a6348",
    500: "#3ECF8E",
    600: "#5fd9a3",
  },
  background: {
    default: "#111111",
    secondary: "#181818",
    studio: "#0f0f0f",
    alternative: "#0b0b0b",
  },
  surface: {
    75: "#1a1a1a",
    100: "#1f1f1f",
    200: "#242424",
    300: "#2b2b2b",
    400: "#333333",
  },
  foreground: {
    default: "#ededed",
    light: "#b0b0b0",
    lighter: "#7a7a7a",
    muted: "#5a5a5a",
  },
  border: {
    default: "#2a2a2a",
    muted: "#242424",
    strong: "#3a3a3a",
    stronger: "#4a4a4a",
  },
  semantic: {
    success: "#3ECF8E",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
  },
} as const

// 字体大小
export const FONT_SIZES = {
  xs: "10px",
  sm: "11px",
  base: "12px",
  md: "13px",
  lg: "14px",
  xl: "16px",
  "2xl": "18px",
  "3xl": "20px",
  "4xl": "24px",
} as const

// 间距
export const SPACING = {
  0: "0",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
} as const

// 圆角
export const RADIUS = {
  none: "0",
  sm: "4px",
  md: "6px",
  lg: "8px",
  xl: "12px",
  full: "9999px",
} as const

// 阴影
export const SHADOWS = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.2)",
  md: "0 1px 3px rgba(0, 0, 0, 0.2)",
  lg: "0 4px 12px rgba(0, 0, 0, 0.3)",
  xl: "0 10px 40px rgba(0, 0, 0, 0.5)",
  glow: "0 0 20px rgba(62, 207, 142, 0.3)",
} as const

// 动画时长
export const DURATIONS = {
  fast: "150ms",
  normal: "200ms",
  slow: "300ms",
  slower: "500ms",
} as const

// 缓动函数
export const EASINGS = {
  default: "ease",
  in: "ease-in",
  out: "ease-out",
  inOut: "ease-in-out",
} as const
