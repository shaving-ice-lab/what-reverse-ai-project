/**
 * 设计系统常量
 * 用于统一管理设计相关的配置，确保整个应用的视觉一致性
 */

// ===== 过渡动画 =====
export const TRANSITIONS = {
  fast: "150ms",
  base: "200ms",
  slow: "300ms",
  slower: "500ms",
} as const;

export const EASINGS = {
  out: "cubic-bezier(0.4, 0, 0.2, 1)",
  inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

// ===== 断点 =====
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

// ===== 布局尺寸 =====
export const LAYOUT = {
  // 头部高度
  headerHeight: 64,
  headerHeightMobile: 56,
  headerHeightSmall: 52,
  // 侧边栏宽度
  sidebarWidth: 240,
  sidebarWidthTablet: 200,
  sidebarWidthCollapsed: 64,
  // 面板宽度
  panelWidthSmall: 200,
  panelWidthMedium: 280,
  panelWidthLarge: 360,
  panelWidthSheet: 320,
  // 容器最大宽度
  containerSm: 640,
  containerMd: 768,
  containerLg: 1024,
  containerXl: 1280,
  container2xl: 1536,
  contentMaxWidth: 1440,
  // 触摸目标最小尺寸
  touchTargetMin: 44,
  // 容器内边距
  containerPaddingX: 24,
  containerPaddingXLg: 32,
  // 页面间距
  pageHeaderPaddingY: 24,
  pageHeaderPaddingYLg: 32,
  pageContentPaddingY: 24,
  pageContentPaddingYLg: 32,
  // 工具栏高度
  toolbarHeight: 40,
  // 区块间距
  sectionGap: 64,
  sectionGapLg: 96,
  // 卡片间距
  cardGap: 20,
  cardGapLg: 24,
} as const;

// ===== 动画配置 =====
export const ANIMATION = {
  // 入场动画延迟基数
  staggerDelay: 50,
  // 入场动画时长
  entranceDuration: 400,
  // 快速动画
  fast: 150,
  // 基础动画
  base: 200,
  // 慢速动画
  slow: 300,
} as const;

// ===== 节点颜色映射 =====
export const NODE_COLORS = {
  // AI 节点 - 紫色系
  ai: {
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-800",
    text: "text-violet-700 dark:text-violet-300",
    icon: "text-violet-600 dark:text-violet-400",
    accent: "#8b5cf6",
  },
  // 集成节点 - 蓝色系
  integration: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-300",
    icon: "text-blue-600 dark:text-blue-400",
    accent: "#3b82f6",
  },
  // 逻辑节点 - 橙色系
  logic: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-300",
    icon: "text-amber-600 dark:text-amber-400",
    accent: "#f59e0b",
  },
  // 数据节点 - 绿色系
  data: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-700 dark:text-emerald-300",
    icon: "text-emerald-600 dark:text-emerald-400",
    accent: "#10b981",
  },
  // 文本节点 - 粉色系
  text: {
    bg: "bg-pink-50 dark:bg-pink-950/30",
    border: "border-pink-200 dark:border-pink-800",
    text: "text-pink-700 dark:text-pink-300",
    icon: "text-pink-600 dark:text-pink-400",
    accent: "#ec4899",
  },
  // 代码节点 - 靛青色系
  code: {
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    border: "border-indigo-200 dark:border-indigo-800",
    text: "text-indigo-700 dark:text-indigo-300",
    icon: "text-indigo-600 dark:text-indigo-400",
    accent: "#6366f1",
  },
  // 流程节点 - 灰色系
  flow: {
    bg: "bg-muted/30",
    border: "border-border",
    text: "text-foreground",
    icon: "text-muted-foreground",
    accent: "#64748b",
  },
} as const;

export type NodeColorCategory = keyof typeof NODE_COLORS;

// ===== 节点类型到分类映射 =====
export const NODE_TYPE_CATEGORY: Record<string, NodeColorCategory> = {
  // AI
  llm_chat: "ai",
  llm_completion: "ai",
  embedding: "ai",
  // 集成
  http_request: "integration",
  webhook: "integration",
  // 逻辑
  condition: "logic",
  loop: "logic",
  parallel: "logic",
  delay: "logic",
  try_catch: "logic",
  // 数据
  variable: "data",
  transform: "data",
  merge: "data",
  filter: "data",
  // 文本
  template: "text",
  regex: "text",
  split: "text",
  // 代码
  code_js: "code",
  expression: "code",
  // 流程
  start: "flow",
  end: "flow",
  input: "flow",
  output: "flow",
};

// ===== 端口类型颜色 =====
export const PORT_COLORS = {
  string: {
    bg: "bg-emerald-500",
    border: "border-emerald-400",
  },
  number: {
    bg: "bg-blue-500",
    border: "border-blue-400",
  },
  boolean: {
    bg: "bg-amber-500",
    border: "border-amber-400",
  },
  object: {
    bg: "bg-violet-500",
    border: "border-violet-400",
  },
  array: {
    bg: "bg-pink-500",
    border: "border-pink-400",
  },
  any: {
    bg: "bg-slate-500",
    border: "border-slate-400",
  },
} as const;

export type PortType = keyof typeof PORT_COLORS;

// ===== 状态颜色 =====
export const STATUS_COLORS = {
  pending: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
    dot: "bg-muted-foreground",
  },
  running: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500",
  },
  completed: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
  failed: {
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
    dot: "bg-red-500",
  },
  paused: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  cancelled: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
    dot: "bg-muted-foreground",
  },
} as const;

export type StatusType = keyof typeof STATUS_COLORS;

// ===== 节点尺寸 =====
export const NODE_SIZES = {
  minWidth: 200,
  maxWidth: 320,
  defaultWidth: 240,
  portSize: 10,
  portSizeTouch: 16,
  headerHeight: 40,
  padding: 12,
} as const;

// ===== Z-Index 层级 =====
export const Z_INDEX = {
  background: 0,
  canvas: 10,
  node: 20,
  nodeSelected: 30,
  panel: 40,
  toolbar: 50,
  dropdown: 60,
  modal: 70,
  toast: 80,
  tooltip: 90,
} as const;

// ===== 辅助函数 =====

/**
 * 获取节点的颜色配置
 */
export function getNodeColors(nodeType: string) {
  const category = NODE_TYPE_CATEGORY[nodeType] || "flow";
  return NODE_COLORS[category];
}

/**
 * 获取端口的颜色配置
 */
export function getPortColors(portType: string) {
  return PORT_COLORS[portType as PortType] || PORT_COLORS.any;
}

/**
 * 获取状态的颜色配置
 */
export function getStatusColors(status: string) {
  return STATUS_COLORS[status as StatusType] || STATUS_COLORS.pending;
}

/**
 * 生成动画延迟样式
 */
export function getAnimationDelay(index: number, baseDelay = 50) {
  return { animationDelay: `${index * baseDelay}ms` };
}

/**
 * 检查是否为移动端
 */
export function isMobileBreakpoint(width: number) {
  return width < BREAKPOINTS.md;
}

/**
 * 检查是否为平板端
 */
export function isTabletBreakpoint(width: number) {
  return width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
}

/**
 * 检查是否为桌面端
 */
export function isDesktopBreakpoint(width: number) {
  return width >= BREAKPOINTS.lg;
}

/**
 * 获取当前断点名称
 */
export function getCurrentBreakpoint(width: number): "sm" | "md" | "lg" | "xl" | "2xl" {
  if (width >= BREAKPOINTS["2xl"]) return "2xl";
  if (width >= BREAKPOINTS.xl) return "xl";
  if (width >= BREAKPOINTS.lg) return "lg";
  if (width >= BREAKPOINTS.md) return "md";
  return "sm";
}

/**
 * 根据断点获取布局尺寸
 */
export function getResponsiveLayout(width: number) {
  const isMobile = isMobileBreakpoint(width);
  const isTablet = isTabletBreakpoint(width);
  
  return {
    headerHeight: isMobile 
      ? width < 480 ? LAYOUT.headerHeightSmall : LAYOUT.headerHeightMobile 
      : LAYOUT.headerHeight,
    sidebarWidth: isMobile 
      ? 0 
      : isTablet ? LAYOUT.sidebarWidthTablet : LAYOUT.sidebarWidth,
    panelWidth: isMobile 
      ? width 
      : isTablet ? LAYOUT.panelWidthMedium : LAYOUT.panelWidthLarge,
    showSidebar: !isMobile,
    showMinimap: !isMobile,
    touchTargetSize: isMobile ? LAYOUT.touchTargetMin : 36,
  };
}

/**
 * 生成响应式类名
 */
export function getResponsiveClasses(
  base: string,
  sm?: string,
  md?: string,
  lg?: string
) {
  return [
    base,
    sm && `sm:${sm}`,
    md && `md:${md}`,
    lg && `lg:${lg}`,
  ].filter(Boolean).join(" ");
}

/**
 * 页面容器类名 - 统一页面布局
 */
export const PAGE_CLASSES = {
  // 页面容器
  container: "max-w-[var(--content-max-width)] mx-auto px-[var(--container-padding-x)] lg:px-[var(--container-padding-x-lg)]",
  // 页面头部区域
  header: "py-[var(--page-header-padding-y)] lg:py-[var(--page-header-padding-y-lg)]",
  // 页面内容区域
  content: "py-[var(--page-content-padding-y)] lg:py-[var(--page-content-padding-y-lg)]",
  // 页面标题
  title: "text-2xl lg:text-3xl font-bold tracking-tight",
  // 页面描述
  description: "mt-1 text-[var(--color-muted-foreground)]",
  // 页面区块
  section: "py-[var(--section-gap)] lg:py-[var(--section-gap-lg)]",
  // 内容网格
  grid: "grid gap-[var(--card-gap)] lg:gap-[var(--card-gap-lg)]",
} as const;

/**
 * 生成交错动画样式
 */
export function getStaggerStyles(index: number, baseDelay = ANIMATION.staggerDelay) {
  return {
    animationDelay: `${index * baseDelay}ms`,
    style: { animationDelay: `${index * baseDelay}ms` },
  };
}

/**
 * 常用动画类名组合
 */
export const ANIMATION_CLASSES = {
  // 入场动画
  fadeIn: "animate-fade-in",
  slideUp: "animate-slide-up",
  slideDown: "animate-slide-down",
  slideInLeft: "animate-slide-in-left",
  slideInRight: "animate-slide-in-right",
  scaleIn: "animate-scale-in",
  scaleUp: "animate-scale-up",
  // 循环动画
  float: "animate-float",
  floatSlow: "animate-float-slow",
  pulse: "animate-pulse-subtle",
  pulseGlow: "animate-pulse-glow",
  shimmer: "animate-shimmer",
  spin: "animate-spin",
  // 交互效果
  hoverLift: "hover-lift",
  hoverScale: "hover-scale",
  hoverGlow: "hover-glow",
  hoverBorder: "hover-border",
  pressEffect: "press-effect",
} as const;

/**
 * 表单相关样式
 */
export const FORM_CLASSES = {
  // 表单组
  group: "space-y-2",
  // 标签
  label: "text-sm font-medium",
  // 描述文本
  hint: "text-xs text-[var(--color-muted-foreground)]",
  // 错误文本
  error: "text-xs text-[var(--color-destructive)]",
  // 输入框容器
  inputWrapper: "relative",
} as const;

/**
 * 常用布局工具类组合
 */
export const LAYOUT_CLASSES = {
  // 居中容器
  centerContainer: "max-w-[var(--content-max-width)] mx-auto px-[var(--container-padding-x)] lg:px-[var(--container-padding-x-lg)]",
  // Flex 居中
  flexCenter: "flex items-center justify-center",
  // Flex 两端对齐
  flexBetween: "flex items-center justify-between",
  // 网格布局
  gridAuto: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--card-gap)]",
  // 堆叠布局
  stack: "flex flex-col gap-4",
  // 内联布局
  inline: "flex items-center gap-2",
} as const;

/**
 * 卡片样式组合
 */
export const CARD_CLASSES = {
  // 基础卡片
  base: "rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5",
  // 交互卡片
  interactive: "rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 transition-all duration-200 hover:border-[var(--color-border-hover)] hover:shadow-md hover:-translate-y-0.5",
  // 玻璃卡片
  glass: "rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-card)]/60 backdrop-blur-md p-5",
  // 高亮卡片
  elevated: "rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-md",
} as const;

/**
 * 文本样式组合
 */
export const TEXT_CLASSES = {
  // 页面标题
  pageTitle: "text-2xl sm:text-3xl font-bold tracking-tight",
  // 区块标题
  sectionTitle: "text-lg sm:text-xl font-semibold",
  // 卡片标题
  cardTitle: "text-base font-semibold",
  // 描述文本
  muted: "text-[var(--color-muted-foreground)]",
  // 小文本
  small: "text-sm text-[var(--color-muted-foreground)]",
  // 渐变文本
  gradient: "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] bg-clip-text text-transparent",
} as const;

/**
 * 按钮样式组合
 */
export const BUTTON_CLASSES = {
  // 主要按钮
  primary: "bg-gradient-primary hover:opacity-90 shadow-sm hover:shadow-primary transition-all",
  // 轮廓按钮
  outline: "border border-[var(--color-border)] hover:bg-[var(--color-accent)] hover:border-[var(--color-border-hover)]",
  // 幽灵按钮
  ghost: "hover:bg-[var(--color-accent)]",
  // 图标按钮
  icon: "h-9 w-9 p-0 hover:bg-[var(--color-accent)]",
} as const;

/**
 * 状态样式
 */
export const STATE_CLASSES = {
  // 成功状态
  success: {
    container: "bg-[var(--color-success-muted)] border border-[var(--color-success)]/20 text-[var(--color-success)]",
    text: "text-[var(--color-success)]",
    bg: "bg-[var(--color-success-muted)]",
  },
  // 错误状态
  error: {
    container: "bg-[var(--color-destructive-muted)] border border-[var(--color-destructive)]/20 text-[var(--color-destructive)]",
    text: "text-[var(--color-destructive)]",
    bg: "bg-[var(--color-destructive-muted)]",
  },
  // 警告状态
  warning: {
    container: "bg-[var(--color-warning-muted)] border border-[var(--color-warning)]/20 text-[var(--color-warning)]",
    text: "text-[var(--color-warning)]",
    bg: "bg-[var(--color-warning-muted)]",
  },
  // 信息状态
  info: {
    container: "bg-[var(--color-info-muted)] border border-[var(--color-info)]/20 text-[var(--color-info)]",
    text: "text-[var(--color-info)]",
    bg: "bg-[var(--color-info-muted)]",
  },
} as const;

/**
 * 空状态样式
 */
export const EMPTY_STATE_CLASSES = {
  container: "text-center py-16 sm:py-20",
  icon: "w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-2xl sm:rounded-3xl bg-[var(--color-muted)] flex items-center justify-center",
  title: "text-lg sm:text-xl font-semibold mb-2",
  description: "text-sm sm:text-base text-[var(--color-muted-foreground)] mb-6 max-w-md mx-auto",
} as const;
