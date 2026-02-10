/**
 * Design System Constants
 * Used for managing design-related configurations, ensuring app's visual consistency
 */

// ===== Transition & Animation =====
export const TRANSITIONS = {
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const

export const EASINGS = {
  out: 'cubic-bezier(0.4, 0, 0.2, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const

// ===== Breakpoint =====
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

// ===== LayoutDimension =====
export const LAYOUT = {
  // Header Height
  headerHeight: 64,
  headerHeightMobile: 56,
  headerHeightSmall: 52,
  // Sidebar Width
  sidebarWidth: 240,
  sidebarWidthTablet: 200,
  sidebarWidthCollapsed: 64,
  // Panel Width
  panelWidthSmall: 200,
  panelWidthMedium: 280,
  panelWidthLarge: 360,
  panelWidthSheet: 320,
  // Maximum Width
  containerSm: 640,
  containerMd: 768,
  containerLg: 1024,
  containerXl: 1280,
  container2xl: 1536,
  contentMaxWidth: 1440,
  // Touch Target Minimum Dimension
  touchTargetMin: 44,
  // Container Padding
  containerPaddingX: 24,
  containerPaddingXLg: 32,
  // Page Spacing
  pageHeaderPaddingY: 24,
  pageHeaderPaddingYLg: 32,
  pageContentPaddingY: 24,
  pageContentPaddingYLg: 32,
  // Toolbar Height
  toolbarHeight: 40,
  // Section Spacing
  sectionGap: 64,
  sectionGapLg: 96,
  // Card Spacing
  cardGap: 20,
  cardGapLg: 24,
} as const

// ===== Animation Config =====
export const ANIMATION = {
  // Stagger Animation Delay
  staggerDelay: 50,
  // Entrance Animation Duration
  entranceDuration: 400,
  // Quick Animation
  fast: 150,
  // Basic Animation
  base: 200,
  // Slow Animation
  slow: 300,
} as const

// ===== NodeColorMapping =====
export const NODE_COLORS = {
  // AI Node - Purple
  ai: {
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    border: 'border-violet-200 dark:border-violet-800',
    text: 'text-violet-700 dark:text-violet-300',
    icon: 'text-violet-600 dark:text-violet-400',
    accent: '#8b5cf6',
  },
  // Integration Node - Blue
  integration: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    icon: 'text-blue-600 dark:text-blue-400',
    accent: '#3b82f6',
  },
  // LogicNode - Orange
  logic: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    icon: 'text-amber-600 dark:text-amber-400',
    accent: '#f59e0b',
  },
  // DataNode - Green
  data: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    icon: 'text-emerald-600 dark:text-emerald-400',
    accent: '#10b981',
  },
  // TextNode - Pink
  text: {
    bg: 'bg-pink-50 dark:bg-pink-950/30',
    border: 'border-pink-200 dark:border-pink-800',
    text: 'text-pink-700 dark:text-pink-300',
    icon: 'text-pink-600 dark:text-pink-400',
    accent: '#ec4899',
  },
  // CodeNode -
  code: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    border: 'border-indigo-200 dark:border-indigo-800',
    text: 'text-indigo-700 dark:text-indigo-300',
    icon: 'text-indigo-600 dark:text-indigo-400',
    accent: '#6366f1',
  },
  // FlowNode - Gray
  flow: {
    bg: 'bg-muted/30',
    border: 'border-border',
    text: 'text-foreground',
    icon: 'text-muted-foreground',
    accent: '#64748b',
  },
} as const

export type NodeColorCategory = keyof typeof NODE_COLORS

// ===== NodeTypetoCategoryMapping =====
export const NODE_TYPE_CATEGORY: Record<string, NodeColorCategory> = {
  // AI
  llm_chat: 'ai',
  llm_completion: 'ai',
  embedding: 'ai',
  // Integration
  http_request: 'integration',
  webhook: 'integration',
  // Logic
  condition: 'logic',
  loop: 'logic',
  parallel: 'logic',
  delay: 'logic',
  try_catch: 'logic',
  // Data
  variable: 'data',
  transform: 'data',
  merge: 'data',
  filter: 'data',
  // Text
  template: 'text',
  regex: 'text',
  split: 'text',
  // Code
  code_js: 'code',
  expression: 'code',
  // Flow
  start: 'flow',
  end: 'flow',
  input: 'flow',
  output: 'flow',
}

// ===== PortTypeColor =====
export const PORT_COLORS = {
  string: {
    bg: 'bg-emerald-500',
    border: 'border-emerald-400',
  },
  number: {
    bg: 'bg-blue-500',
    border: 'border-blue-400',
  },
  boolean: {
    bg: 'bg-amber-500',
    border: 'border-amber-400',
  },
  object: {
    bg: 'bg-violet-500',
    border: 'border-violet-400',
  },
  array: {
    bg: 'bg-pink-500',
    border: 'border-pink-400',
  },
  any: {
    bg: 'bg-slate-500',
    border: 'border-slate-400',
  },
} as const

export type PortType = keyof typeof PORT_COLORS

// ===== StatusColor =====
export const STATUS_COLORS = {
  pending: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
    dot: 'bg-muted-foreground',
  },
  running: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  completed: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  failed: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
  },
  paused: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  cancelled: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
    dot: 'bg-muted-foreground',
  },
} as const

export type StatusType = keyof typeof STATUS_COLORS

// ===== NodeDimension =====
export const NODE_SIZES = {
  minWidth: 200,
  maxWidth: 320,
  defaultWidth: 240,
  portSize: 10,
  portSizeTouch: 16,
  headerHeight: 40,
  padding: 12,
} as const

// ===== Z-Index Hierarchy =====
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
} as const

// ===== Helper Functions =====

/**
 * Get Node Color Config
 */
export function getNodeColors(nodeType: string) {
  const category = NODE_TYPE_CATEGORY[nodeType] || 'flow'
  return NODE_COLORS[category]
}

/**
 * Get Port Color Config
 */
export function getPortColors(portType: string) {
  return PORT_COLORS[portType as PortType] || PORT_COLORS.any
}

/**
 * Get Status Color Config
 */
export function getStatusColors(status: string) {
  return STATUS_COLORS[status as StatusType] || STATUS_COLORS.pending
}

/**
 * Generate Animation Delay Style
 */
export function getAnimationDelay(index: number, baseDelay = 50) {
  return { animationDelay: `${index * baseDelay}ms` }
}

/**
 * Check if Mobile Breakpoint
 */
export function isMobileBreakpoint(width: number) {
  return width < BREAKPOINTS.md
}

/**
 * Check if Tablet Breakpoint
 */
export function isTabletBreakpoint(width: number) {
  return width >= BREAKPOINTS.md && width < BREAKPOINTS.lg
}

/**
 * Check if Desktop Breakpoint
 */
export function isDesktopBreakpoint(width: number) {
  return width >= BREAKPOINTS.lg
}

/**
 * Get Current Breakpoint Name
 */
export function getCurrentBreakpoint(width: number): 'sm' | 'md' | 'lg' | 'xl' | '2xl' {
  if (width >= BREAKPOINTS['2xl']) return '2xl'
  if (width >= BREAKPOINTS.xl) return 'xl'
  if (width >= BREAKPOINTS.lg) return 'lg'
  if (width >= BREAKPOINTS.md) return 'md'
  return 'sm'
}

/**
 * Get Layout Dimensions Based on Breakpoint
 */
export function getResponsiveLayout(width: number) {
  const isMobile = isMobileBreakpoint(width)
  const isTablet = isTabletBreakpoint(width)

  return {
    headerHeight: isMobile
      ? width < 480
        ? LAYOUT.headerHeightSmall
        : LAYOUT.headerHeightMobile
      : LAYOUT.headerHeight,
    sidebarWidth: isMobile ? 0 : isTablet ? LAYOUT.sidebarWidthTablet : LAYOUT.sidebarWidth,
    panelWidth: isMobile ? width : isTablet ? LAYOUT.panelWidthMedium : LAYOUT.panelWidthLarge,
    showSidebar: !isMobile,
    showMinimap: !isMobile,
    touchTargetSize: isMobile ? LAYOUT.touchTargetMin : 36,
  }
}

/**
 * GenerateResponseClass Name
 */
export function getResponsiveClasses(base: string, sm?: string, md?: string, lg?: string) {
  return [base, sm && `sm:${sm}`, md && `md:${md}`, lg && `lg:${lg}`].filter(Boolean).join('')
}

/**
 * PageClass Name - 1PageLayout
 */
export const PAGE_CLASSES = {
  // Page
  container:
    'max-w-[var(--content-max-width)] mx-auto px-[var(--container-padding-x)] lg:px-[var(--container-padding-x-lg)]',
  // PageHeaderRegion
  header: 'py-[var(--page-header-padding-y)] lg:py-[var(--page-header-padding-y-lg)]',
  // PageContentRegion
  content: 'py-[var(--page-content-padding-y)] lg:py-[var(--page-content-padding-y-lg)]',
  // PageTitle
  title: 'text-2xl lg:text-3xl font-bold tracking-tight',
  // PageDescription
  description: 'mt-1 text-[var(--color-muted-foreground)]',
  // Pageblock
  section: 'py-[var(--section-gap)] lg:py-[var(--section-gap-lg)]',
  // ContentGrid
  grid: 'grid gap-[var(--card-gap)] lg:gap-[var(--card-gap-lg)]',
} as const

/**
 * GenerateAnimationstyle
 */
export function getStaggerStyles(index: number, baseDelay = ANIMATION.staggerDelay) {
  return {
    animationDelay: `${index * baseDelay}ms`,
    style: { animationDelay: `${index * baseDelay}ms` },
  }
}

/**
 * useAnimationClass Namegroup
 */
export const ANIMATION_CLASSES = {
  // enterAnimation
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
  slideInLeft: 'animate-slide-in-left',
  slideInRight: 'animate-slide-in-right',
  scaleIn: 'animate-scale-in',
  scaleUp: 'animate-scale-up',
  // LoopAnimation
  float: 'animate-float',
  floatSlow: 'animate-float-slow',
  pulse: 'animate-pulse-subtle',
  pulseGlow: 'animate-pulse-glow',
  shimmer: 'animate-shimmer',
  spin: 'animate-spin',
  // InteractiveEffect
  hoverLift: 'hover-lift',
  hoverScale: 'hover-scale',
  hoverGlow: 'hover-glow',
  hoverBorder: 'hover-border',
  pressEffect: 'press-effect',
} as const

/**
 * FormRelatedstyle
 */
export const FORM_CLASSES = {
  // Formgroup
  group: 'space-y-2',
  // Tags
  label: 'text-sm font-medium',
  // DescriptionText
  hint: 'text-xs text-[var(--color-muted-foreground)]',
  // ErrorText
  error: 'text-xs text-[var(--color-destructive)]',
  // Input
  inputWrapper: 'relative',
} as const

/**
 * useLayoutToolgroup
 */
export const LAYOUT_CLASSES = {
  //
  centerContainer:
    'max-w-[var(--content-max-width)] mx-auto px-[var(--container-padding-x)] lg:px-[var(--container-padding-x-lg)]',
  // Flex
  flexCenter: 'flex items-center justify-center',
  // Flex endpointfor
  flexBetween: 'flex items-center justify-between',
  // GridLayout
  gridAuto: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--card-gap)]',
  // StackLayout
  stack: 'flex flex-col gap-4',
  // inLayout
  inline: 'flex items-center gap-2',
} as const

/**
 * Cardstylegroup
 */
export const CARD_CLASSES = {
  // BasicCard
  base: 'rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5',
  // InteractiveCard
  interactive:
    'rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 transition-all duration-200 hover:border-[var(--color-border-hover)] hover:shadow-md hover:-translate-y-0.5',
  // GlassCard
  glass:
    'rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-card)]/60 backdrop-blur-md p-5',
  // HighlightCard
  elevated: 'rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-md',
} as const

/**
 * Textstylegroup
 */
export const TEXT_CLASSES = {
  // PageTitle
  pageTitle: 'text-2xl sm:text-3xl font-bold tracking-tight',
  // blockTitle
  sectionTitle: 'text-lg sm:text-xl font-semibold',
  // CardTitle
  cardTitle: 'text-base font-semibold',
  // DescriptionText
  muted: 'text-[var(--color-muted-foreground)]',
  // smallText
  small: 'text-sm text-[var(--color-muted-foreground)]',
  // GradientText
  gradient:
    'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] bg-clip-text text-transparent',
} as const

/**
 * Buttonstylegroup
 */
export const BUTTON_CLASSES = {
  // mainneedButton
  primary: 'bg-gradient-primary hover:opacity-90 shadow-sm hover:shadow-primary transition-all',
  // OutlineButton
  outline:
    'border border-[var(--color-border)] hover:bg-[var(--color-accent)] hover:border-[var(--color-border-hover)]',
  // GhostButton
  ghost: 'hover:bg-[var(--color-accent)]',
  // IconButton
  icon: 'h-9 w-9 p-0 hover:bg-[var(--color-accent)]',
} as const

/**
 * Statusstyle
 */
export const STATE_CLASSES = {
  // SuccessStatus
  success: {
    container:
      'bg-[var(--color-success-muted)] border border-[var(--color-success)]/20 text-[var(--color-success)]',
    text: 'text-[var(--color-success)]',
    bg: 'bg-[var(--color-success-muted)]',
  },
  // ErrorStatus
  error: {
    container:
      'bg-[var(--color-destructive-muted)] border border-[var(--color-destructive)]/20 text-[var(--color-destructive)]',
    text: 'text-[var(--color-destructive)]',
    bg: 'bg-[var(--color-destructive-muted)]',
  },
  // WarningStatus
  warning: {
    container:
      'bg-[var(--color-warning-muted)] border border-[var(--color-warning)]/20 text-[var(--color-warning)]',
    text: 'text-[var(--color-warning)]',
    bg: 'bg-[var(--color-warning-muted)]',
  },
  // InfoStatus
  info: {
    container:
      'bg-[var(--color-info-muted)] border border-[var(--color-info)]/20 text-[var(--color-info)]',
    text: 'text-[var(--color-info)]',
    bg: 'bg-[var(--color-info-muted)]',
  },
} as const

/**
 * Empty Statestyle
 */
export const EMPTY_STATE_CLASSES = {
  container: 'text-center py-16 sm:py-20',
  icon: 'w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-2xl sm:rounded-3xl bg-[var(--color-muted)] flex items-center justify-center',
  title: 'text-lg sm:text-xl font-semibold mb-2',
  description: 'text-sm sm:text-base text-[var(--color-muted-foreground)] mb-6 max-w-md mx-auto',
} as const
