// App Schema v2.0 Type Definitions

export interface AppSchema {
  app_schema_version: '2.0.0'
  app_name?: string
  pages: AppPage[]
  navigation: AppNavigation
  default_page: string
  theme?: AppTheme
}

export interface AppPage {
  id: string
  title: string
  route: string
  icon?: string
  blocks: AppBlock[]
  actions?: AppAction[]
}

export interface AppNavigation {
  type: 'sidebar' | 'topbar' | 'tabs'
  items?: AppNavItem[]
}

export interface AppNavItem {
  page_id: string
  label: string
  icon?: string
}

export interface AppTheme {
  primary_color?: string
  border_radius?: string
}

// ========== Block Types ==========

export type AppBlockType =
  | 'stats_card'
  | 'data_table'
  | 'form'
  | 'form_dialog'
  | 'chart'
  | 'detail_view'
  | 'markdown'
  | 'image'
  | 'hero'
  | 'tabs_container'
  | 'list'
  | 'divider'

export interface AppBlock {
  id: string
  type: AppBlockType
  label?: string
  config: Record<string, unknown>
  data_source?: DataSource
  grid?: { col_span?: number; row_span?: number }
}

export interface DataSource {
  table: string
  columns?: string[]
  where?: string
  order_by?: { column: string; direction: 'ASC' | 'DESC' }[]
  limit?: number
  aggregation?: { function: string; column: string; alias: string }[]
}

// ========== Stats Card ==========

export interface StatsCardConfig {
  value_key: string
  label: string
  format?: 'number' | 'currency' | 'percent'
  trend_key?: string
  color?: 'default' | 'green' | 'red' | 'blue' | 'amber'
  icon?: string
}

// ========== Data Table ==========

export interface DataTableConfig {
  table_name: string
  columns: DataTableColumn[]
  actions?: ('edit' | 'delete' | 'view' | 'create')[]
  filters_enabled?: boolean
  search_enabled?: boolean
  search_key?: string
  pagination?: boolean
  page_size?: number
}

export interface DataTableColumn {
  key: string
  label: string
  type?: 'text' | 'number' | 'date' | 'boolean' | 'badge'
  sortable?: boolean
  width?: string
}

// ========== Chart ==========

export interface ChartConfig {
  chart_type: 'bar' | 'line' | 'pie' | 'area'
  x_key: string
  y_key: string
  color?: string
  title?: string
  height?: number
}

// ========== Form ==========

export interface FormConfig {
  title?: string
  description?: string
  fields: FormField[]
  submit_label?: string
  table_name?: string
  mode?: 'create' | 'edit'
  workflow_id?: string
  on_submit_action?: AppAction
}

export interface FormField {
  name: string
  label: string
  type: 'text' | 'number' | 'email' | 'textarea' | 'select' | 'date' | 'checkbox'
  required?: boolean
  placeholder?: string
  options?: { label: string; value: string }[]
  default_value?: unknown
}

// ========== Detail View ==========

export interface DetailViewConfig {
  fields: { key: string; label: string; type?: string }[]
  table_name?: string
  record_id_key?: string
}

// ========== Image ==========

export interface ImageConfig {
  src: string
  alt?: string
  width?: string
  height?: string
  object_fit?: 'cover' | 'contain' | 'fill' | 'none'
  border_radius?: string
  caption?: string
  link?: string
}

// ========== Hero ==========

export interface HeroConfig {
  title: string
  subtitle?: string
  description?: string
  background_color?: string
  background_image?: string
  text_color?: string
  align?: 'left' | 'center' | 'right'
  actions?: { label: string; href?: string; variant?: 'primary' | 'secondary' }[]
  size?: 'sm' | 'md' | 'lg'
}

// ========== Tabs Container ==========

export interface TabsContainerConfig {
  tabs: {
    id: string
    label: string
    icon?: string
    blocks: AppBlock[]
  }[]
  default_tab?: string
}

// ========== List ==========

export interface ListConfig {
  table_name: string
  title_key: string
  subtitle_key?: string
  description_key?: string
  image_key?: string
  badge_key?: string
  layout?: 'list' | 'grid'
  columns?: number
  clickable?: boolean
  empty_message?: string
}

// ========== Divider ==========

export interface DividerConfig {
  label?: string
  style?: 'solid' | 'dashed' | 'dotted'
  spacing?: 'sm' | 'md' | 'lg'
}

// ========== Actions ==========

export interface AppAction {
  id: string
  label: string
  type: 'navigate' | 'api_call' | 'dialog' | 'workflow'
  target?: string
  config?: Record<string, unknown>
}
