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
  require_auth?: boolean
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
  | 'calendar'
  | 'detail_view'
  | 'markdown'
  | 'image'
  | 'hero'
  | 'tabs_container'
  | 'list'
  | 'divider'
  | 'auth'
  | 'file_upload'
  | 'custom_code'

export interface AppBlock {
  id: string
  type: AppBlockType
  label?: string
  config: Record<string, unknown>
  data_source?: DataSource
  api_source?: ApiSource
  grid?: { col_span?: number; row_span?: number }
}

export interface ApiSource {
  path: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: Record<string, unknown>
  transform?: string
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
  status_actions?: StatusActionConfig[]
  filters_enabled?: boolean
  search_enabled?: boolean
  search_key?: string
  pagination?: boolean
  page_size?: number
  row_click_action?: {
    type: 'navigate'
    target_page?: string
    page_id?: string
    param_key?: string
    params?: Record<string, string>
  }
}

export interface StatusActionConfig {
  label: string
  from_status: string[]
  to_status: string
  status_column: string
  color?: 'default' | 'green' | 'red' | 'blue' | 'amber'
  confirm?: boolean
  extra_fields?: { key: string; label: string; required?: boolean }[]
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
  category_key?: string
  value_key?: string
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
  on_submit_action?: AppAction
  record_id_param?: string
}

export interface FormField {
  name: string
  key?: string
  label: string
  type: 'text' | 'number' | 'email' | 'textarea' | 'select' | 'date' | 'datetime' | 'checkbox'
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
  record_id_param?: string
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
  click_action?: {
    type: 'navigate'
    target_page: string
    param_key?: string
  }
}

// ========== Divider ==========

export interface DividerConfig {
  label?: string
  style?: 'solid' | 'dashed' | 'dotted'
  spacing?: 'sm' | 'md' | 'lg'
}

// ========== Auth ==========

export interface AuthBlockConfig {
  mode?: 'login' | 'register' | 'login_register'
  title?: string
  description?: string
  login_label?: string
  register_label?: string
  logout_label?: string
  auto_login_after_register?: boolean
}

// ========== File Upload ==========

export interface FileUploadConfig {
  label?: string
  description?: string
  accept?: string
  max_size_mb?: number
  multiple?: boolean
  table_name?: string
  column_name?: string
  prefix?: string
}

// ========== Calendar ==========

export interface CalendarConfig {
  table_name: string
  title_key: string
  start_key: string
  end_key: string
  status_key?: string
  color_key?: string
  detail_fields?: { key: string; label: string }[]
  click_action?: {
    type: 'navigate'
    target_page?: string
    page_id?: string
    param_key?: string
  }
  status_colors?: Record<string, string>
  default_view?: 'month' | 'week'
}

// ========== Custom Code ==========

export interface CustomCodeConfig {
  code?: string
  language?: string
}

// ========== Actions ==========

export interface AppAction {
  id: string
  label: string
  type: 'navigate' | 'api_call' | 'dialog'
  target?: string
  config?: Record<string, unknown>
}
