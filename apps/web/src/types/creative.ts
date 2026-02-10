/**
 * AI Creative Assistant Type Definitions
 *
 * Used for template system, generation tasks, and document management
 */

// ===== Template Category =====

/**
 * Creative template category
 */
export type CreativeTemplateCategory =
  | 'business' // Business
  | 'content' // Content Marketing
  | 'product' // Product Planning
  | 'marketing' // Enterprise Service

// ===== Input Field Type =====

/**
 * Input field type
 */
export type InputFieldType =
  | 'text' // Single-line text
  | 'textarea' // Multi-line text
  | 'number' // Number
  | 'select' // Dropdown select
  | 'multiselect' // Multi-select dropdown
  | 'slider' // Slider
  | 'switch' // Toggle
  | 'date' // Date

/**
 * Dropdown option
 */
export interface SelectOption {
  value: string
  label: string
  description?: string
}

/**
 * Input field validation rules
 */
export interface InputValidation {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
  patternMessage?: string
}

/**
 * Input field definition
 *
 * Used for defining template input form fields
 */
export interface InputField {
  /** Field unique identifier */
  id: string

  /** Field display label */
  label: string

  /** Field type */
  type: InputFieldType

  /** Placeholder text */
  placeholder?: string

  /** Help description text */
  helpText?: string

  /** Default value */
  defaultValue?: string | number | boolean | string[]

  /** Dropdown options (used for select/multiselect types) */
  options?: SelectOption[]

  /** Validation rules */
  validation?: InputValidation

  /** Whether to enable AI suggestions */
  aiSuggest?: boolean

  /** AI suggestion prompt (used when aiSuggest=true) */
  aiSuggestPrompt?: string

  /** Conditional display (depends on another field's value) */
  showWhen?: {
    field: string
    operator: 'eq' | 'neq' | 'contains' | 'notEmpty'
    value?: string | number | boolean
  }
}

// ===== Output Section Type =====

/**
 * Output section definition
 *
 * Used for defining generated document section structure
 */
export interface OutputSection {
  /** Section unique identifier */
  id: string

  /** Section title */
  title: string

  /** Section description */
  description: string

  /** Prompt template for generating this section */
  promptTemplate: string

  /** Section icon */
  icon?: string

  /** Estimated generation time (seconds) */
  estimatedTime?: number

  /** Dependent preceding sections (must wait for these to complete) */
  dependsOn?: string[]

  /** Whether it can be independently regenerated */
  regeneratable?: boolean

  /** Output format */
  outputFormat?: 'markdown' | 'json' | 'table' | 'list'
}

// ===== Template Main Structure =====

/**
 * Template example
 */
export interface TemplateExample {
  /** Example input data */
  input: Record<string, unknown>

  /** Example output (Markdown format) */
  output: string

  /** Example title */
  title?: string

  /** Example description */
  description?: string
}

/**
 * Creative template definition
 *
 * AI creative assistant's core data structure, defines the complete template configuration
 */
export interface CreativeTemplate {
  /** Template unique identifier */
  id: string

  /** Template name */
  name: string

  /** Template description */
  description: string

  /** Template icon */
  icon: string

  /** Template category */
  category: CreativeTemplateCategory

  /** Input field definitions */
  inputs: {
    /** Required fields */
    required: InputField[]
    /** Optional fields */
    optional: InputField[]
  }

  /** Output section definitions */
  outputSections: OutputSection[]

  /** Associated workflow ID */
  workflowId: string

  /** Template example */
  example?: TemplateExample

  /** Usage count */
  usageCount: number

  /** Rating (1-5) */
  rating: number

  /** Review count */
  reviewCount: number

  /** Tags */
  tags: string[]

  /** Estimated generation time (seconds) */
  estimatedTime?: number

  /** Whether it is an official template */
  isOfficial?: boolean

  /** Creator user ID */
  creatorId?: string

  /** Creator user name */
  creatorName?: string

  /** Version Number */
  version: number

  /** Created At */
  createdAt: string

  /** Updated At */
  updatedAt: string
}

// ===== Generation Task Type =====

/**
 * Generation task status
 */
export type CreativeTaskStatus =
  | 'pending' // Awaiting start
  | 'processing' // Processing
  | 'completed' // Completed
  | 'failed' // Failed
  | 'cancelled' // Cancelled

/**
 * Section generation status
 */
export type SectionStatus =
  | 'pending' // Awaiting generation
  | 'generating' // Generating
  | 'completed' // Completed
  | 'failed' // Failed
  | 'skipped' // Skipped

/**
 * Section status info
 */
export interface SectionState {
  /** Section ID */
  sectionId: string

  /** Section status */
  status: SectionStatus

  /** Generated content */
  content?: string

  /** Start time */
  startedAt?: string

  /** Completion time */
  completedAt?: string

  /** Duration (ms) */
  durationMs?: number

  /** Error info */
  error?: string

  /** Token consumption */
  tokenUsage?: {
    prompt: number
    completion: number
    total: number
  }
}

/**
 * Token usage statistics
 */
export interface TokenUsageStats {
  prompt: number
  completion: number
  total: number
}

/**
 * Creative generation task
 *
 * Records the complete status of a generation task
 */
export interface CreativeTask {
  /** Task unique identifier */
  id: string

  /** User ID */
  userId: string

  /** Template ID used */
  templateId: string

  /** User input data */
  inputs: Record<string, unknown>

  /** Task status */
  status: CreativeTaskStatus

  /** Section states */
  sections: Record<string, SectionState>

  /** Completed section count */
  completedSections: number

  /** Total section count */
  totalSections: number

  /** Progress percentage (0-100) */
  progress: number

  /** Final output (Markdown format) */
  outputMarkdown?: string

  /** Output metadata */
  outputMetadata?: {
    title: string
    wordCount: number
    characterCount: number
  }

  /** Search result cache */
  searchCache?: Record<string, unknown>

  /** Token consumption statistics */
  tokenUsage: TokenUsageStats

  /** Estimated remaining time (seconds) */
  estimatedRemainingTime?: number

  /** Error info */
  errorMessage?: string

  /** Start time */
  startedAt?: string

  /** Completion time */
  completedAt?: string

  /** Created At */
  createdAt: string
}

// ===== Document Type =====

/**
 * Document section
 */
export interface DocumentSection {
  /** Section ID */
  id: string

  /** Section title */
  title: string

  /** Section content (Markdown) */
  content: string

  /** Section order */
  order: number

  /** Whether it has been edited */
  isEdited?: boolean

  /** Version number */
  version: number

  /** Version history */
  history?: {
    content: string
    editedAt: string
    version: number
  }[]
}

/**
 * Share settings
 */
export interface ShareSettings {
  /** Share ID (used for generating share link) */
  shareId: string

  /** Whether it is public */
  isPublic: boolean

  /** Access password (optional) */
  password?: string

  /** Expiration time (optional) */
  expiresAt?: string

  /** Whether downloads are allowed */
  allowDownload: boolean

  /** View count */
  viewCount: number
}

/**
 * Creative document
 *
 * Document saved after generation task completes
 */
export interface CreativeDocument {
  /** Document unique identifier */
  id: string

  /** User ID */
  userId: string

  /** Associated task ID */
  taskId: string

  /** Template ID used */
  templateId: string

  /** Document title */
  title: string

  /** Complete content (Markdown format) */
  content: string

  /** Section list */
  sections: DocumentSection[]

  /** Version number */
  version: number

  /** Parent version ID (for versioning) */
  parentId?: string

  /** Share settings */
  share?: ShareSettings

  /** Whether it is starred */
  isStarred: boolean

  /** Tags */
  tags: string[]

  /** Created At */
  createdAt: string

  /** Updated At */
  updatedAt: string
}

// ===== SSE Event Type =====

/**
 * SSE event type
 */
export type CreativeSSEEventType =
  | 'task:started' // Task started
  | 'section:start' // Section generation started
  | 'section:content' // Section content fragment
  | 'section:complete' // Section generation completed
  | 'section:error' // Section generation failed
  | 'task:progress' // Task progress update
  | 'task:complete' // Task completed
  | 'task:error' // Task failed
  | 'search:start' // Search started
  | 'search:complete' // Search completed

/**
 * SSE event payload
 */
export interface CreativeSSEEvent {
  type: CreativeSSEEventType
  data: {
    taskId: string
    sectionId?: string
    content?: string
    progress?: number
    error?: string
    metadata?: Record<string, unknown>
  }
  timestamp: string
}

// ===== API Request/Response Type =====

/**
 * Create generation task request
 */
export interface CreateTaskRequest {
  templateId: string
  inputs: Record<string, unknown>
}

/**
 * Create generation task response
 */
export interface CreateTaskResponse {
  taskId: string
  status: CreativeTaskStatus
  estimatedTime: number
}

/**
 * Regenerate section request
 */
export interface RegenerateSectionRequest {
  documentId: string
  sectionId: string
  instruction?: string
}

/**
 * Document export format
 */
export type ExportFormat = 'markdown' | 'pdf' | 'docx' | 'html'

/**
 * Create share link request
 */
export interface CreateShareRequest {
  documentId: string
  password?: string
  expiresInDays?: number
  allowDownload?: boolean
}

/**
 * Create share link response
 */
export interface CreateShareResponse {
  shareId: string
  shareUrl: string
  expiresAt?: string
}
