/**
 * AI 创意助手类型定义
 * 
 * 用于模板系统、生成任务和文档管理
 */

// ===== 模板分类 =====

/**
 * 创意模板分类
 */
export type CreativeTemplateCategory = 
  | "business"   // 商业策划类
  | "content"    // 内容营销类
  | "product"    // 产品规划类
  | "marketing"; // 企业服务类

// ===== 输入字段类型 =====

/**
 * 输入字段类型
 */
export type InputFieldType = 
  | "text"        // 单行文本
  | "textarea"    // 多行文本
  | "number"      // 数字
  | "select"      // 单选下拉
  | "multiselect" // 多选下拉
  | "slider"      // 滑块
  | "switch"      // 开关
  | "date";       // 日期

/**
 * 下拉选项
 */
export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

/**
 * 输入字段验证规则
 */
export interface InputValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
}

/**
 * 输入字段定义
 * 
 * 用于定义模板的输入表单字段
 */
export interface InputField {
  /** 字段唯一标识 */
  id: string;
  
  /** 字段显示标签 */
  label: string;
  
  /** 字段类型 */
  type: InputFieldType;
  
  /** 占位提示文本 */
  placeholder?: string;
  
  /** 帮助说明文本 */
  helpText?: string;
  
  /** 默认值 */
  defaultValue?: string | number | boolean | string[];
  
  /** 下拉选项 (select/multiselect 类型使用) */
  options?: SelectOption[];
  
  /** 验证规则 */
  validation?: InputValidation;
  
  /** 是否启用 AI 建议 */
  aiSuggest?: boolean;
  
  /** AI 建议提示词 (aiSuggest=true 时使用) */
  aiSuggestPrompt?: string;
  
  /** 条件显示 (依赖其他字段的值) */
  showWhen?: {
    field: string;
    operator: "eq" | "neq" | "contains" | "notEmpty";
    value?: string | number | boolean;
  };
}

// ===== 输出章节类型 =====

/**
 * 输出章节定义
 * 
 * 用于定义生成文档的章节结构
 */
export interface OutputSection {
  /** 章节唯一标识 */
  id: string;
  
  /** 章节标题 */
  title: string;
  
  /** 章节描述 */
  description: string;
  
  /** 生成该章节的提示词模板 */
  promptTemplate: string;
  
  /** 章节图标 */
  icon?: string;
  
  /** 预计生成时间(秒) */
  estimatedTime?: number;
  
  /** 依赖的前置章节 (需等待这些章节完成) */
  dependsOn?: string[];
  
  /** 是否可以独立重新生成 */
  regeneratable?: boolean;
  
  /** 输出格式 */
  outputFormat?: "markdown" | "json" | "table" | "list";
}

// ===== 模板主结构 =====

/**
 * 模板示例
 */
export interface TemplateExample {
  /** 示例输入数据 */
  input: Record<string, unknown>;
  
  /** 示例输出 (Markdown 格式) */
  output: string;
  
  /** 示例标题 */
  title?: string;
  
  /** 示例描述 */
  description?: string;
}

/**
 * 创意模板定义
 * 
 * AI 创意助手的核心数据结构，定义了模板的完整配置
 */
export interface CreativeTemplate {
  /** 模板唯一标识 */
  id: string;
  
  /** 模板名称 */
  name: string;
  
  /** 模板描述 */
  description: string;
  
  /** 模板图标 */
  icon: string;
  
  /** 模板分类 */
  category: CreativeTemplateCategory;
  
  /** 输入字段定义 */
  inputs: {
    /** 必填字段 */
    required: InputField[];
    /** 选填字段 */
    optional: InputField[];
  };
  
  /** 输出章节定义 */
  outputSections: OutputSection[];
  
  /** 关联的工作流ID */
  workflowId: string;
  
  /** 模板示例 */
  example?: TemplateExample;
  
  /** 使用次数 */
  usageCount: number;
  
  /** 评分 (1-5) */
  rating: number;
  
  /** 评价数量 */
  reviewCount: number;
  
  /** 标签 */
  tags: string[];
  
  /** 预计生成时间(秒) */
  estimatedTime?: number;
  
  /** 是否为官方模板 */
  isOfficial?: boolean;
  
  /** 创建者ID */
  creatorId?: string;
  
  /** 创建者名称 */
  creatorName?: string;
  
  /** 版本号 */
  version: number;
  
  /** 创建时间 */
  createdAt: string;
  
  /** 更新时间 */
  updatedAt: string;
}

// ===== 生成任务类型 =====

/**
 * 生成任务状态
 */
export type CreativeTaskStatus =
  | "pending"     // 等待开始
  | "processing"  // 处理中
  | "completed"   // 已完成
  | "failed"      // 失败
  | "cancelled";  // 已取消

/**
 * 章节生成状态
 */
export type SectionStatus =
  | "pending"     // 等待生成
  | "generating"  // 生成中
  | "completed"   // 已完成
  | "failed"      // 失败
  | "skipped";    // 已跳过

/**
 * 章节状态信息
 */
export interface SectionState {
  /** 章节ID */
  sectionId: string;
  
  /** 章节状态 */
  status: SectionStatus;
  
  /** 生成的内容 */
  content?: string;
  
  /** 开始时间 */
  startedAt?: string;
  
  /** 完成时间 */
  completedAt?: string;
  
  /** 耗时(毫秒) */
  durationMs?: number;
  
  /** 错误信息 */
  error?: string;
  
  /** Token 消耗 */
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

/**
 * Token 使用统计
 */
export interface TokenUsageStats {
  prompt: number;
  completion: number;
  total: number;
}

/**
 * 创意生成任务
 * 
 * 记录一次生成任务的完整状态
 */
export interface CreativeTask {
  /** 任务唯一标识 */
  id: string;
  
  /** 用户ID */
  userId: string;
  
  /** 使用的模板ID */
  templateId: string;
  
  /** 用户输入数据 */
  inputs: Record<string, unknown>;
  
  /** 任务状态 */
  status: CreativeTaskStatus;
  
  /** 各章节状态 */
  sections: Record<string, SectionState>;
  
  /** 完成的章节数 */
  completedSections: number;
  
  /** 总章节数 */
  totalSections: number;
  
  /** 进度百分比 (0-100) */
  progress: number;
  
  /** 最终输出 (Markdown 格式) */
  outputMarkdown?: string;
  
  /** 输出元数据 */
  outputMetadata?: {
    title: string;
    wordCount: number;
    characterCount: number;
  };
  
  /** 搜索结果缓存 */
  searchCache?: Record<string, unknown>;
  
  /** Token 消耗统计 */
  tokenUsage: TokenUsageStats;
  
  /** 预计剩余时间(秒) */
  estimatedRemainingTime?: number;
  
  /** 错误信息 */
  errorMessage?: string;
  
  /** 开始时间 */
  startedAt?: string;
  
  /** 完成时间 */
  completedAt?: string;
  
  /** 创建时间 */
  createdAt: string;
}

// ===== 文档类型 =====

/**
 * 文档章节
 */
export interface DocumentSection {
  /** 章节ID */
  id: string;
  
  /** 章节标题 */
  title: string;
  
  /** 章节内容 (Markdown) */
  content: string;
  
  /** 章节顺序 */
  order: number;
  
  /** 是否已编辑 */
  isEdited?: boolean;
  
  /** 版本号 */
  version: number;
  
  /** 历史版本 */
  history?: {
    content: string;
    editedAt: string;
    version: number;
  }[];
}

/**
 * 分享设置
 */
export interface ShareSettings {
  /** 分享ID (用于生成分享链接) */
  shareId: string;
  
  /** 是否公开 */
  isPublic: boolean;
  
  /** 访问密码 (可选) */
  password?: string;
  
  /** 过期时间 (可选) */
  expiresAt?: string;
  
  /** 是否允许下载 */
  allowDownload: boolean;
  
  /** 访问次数 */
  viewCount: number;
}

/**
 * 创意文档
 * 
 * 生成任务完成后保存的文档
 */
export interface CreativeDocument {
  /** 文档唯一标识 */
  id: string;
  
  /** 用户ID */
  userId: string;
  
  /** 关联的任务ID */
  taskId: string;
  
  /** 使用的模板ID */
  templateId: string;
  
  /** 文档标题 */
  title: string;
  
  /** 完整内容 (Markdown 格式) */
  content: string;
  
  /** 章节列表 */
  sections: DocumentSection[];
  
  /** 版本号 */
  version: number;
  
  /** 父版本ID (用于版本追溯) */
  parentId?: string;
  
  /** 分享设置 */
  share?: ShareSettings;
  
  /** 是否收藏 */
  isStarred: boolean;
  
  /** 标签 */
  tags: string[];
  
  /** 创建时间 */
  createdAt: string;
  
  /** 更新时间 */
  updatedAt: string;
}

// ===== SSE 事件类型 =====

/**
 * SSE 事件类型
 */
export type CreativeSSEEventType =
  | "task:started"        // 任务开始
  | "section:start"       // 章节开始生成
  | "section:content"     // 章节内容片段
  | "section:complete"    // 章节生成完成
  | "section:error"       // 章节生成失败
  | "task:progress"       // 任务进度更新
  | "task:complete"       // 任务完成
  | "task:error"          // 任务失败
  | "search:start"        // 搜索开始
  | "search:complete";    // 搜索完成

/**
 * SSE 事件载荷
 */
export interface CreativeSSEEvent {
  type: CreativeSSEEventType;
  data: {
    taskId: string;
    sectionId?: string;
    content?: string;
    progress?: number;
    error?: string;
    metadata?: Record<string, unknown>;
  };
  timestamp: string;
}

// ===== API 请求/响应类型 =====

/**
 * 创建生成任务请求
 */
export interface CreateTaskRequest {
  templateId: string;
  inputs: Record<string, unknown>;
}

/**
 * 创建生成任务响应
 */
export interface CreateTaskResponse {
  taskId: string;
  status: CreativeTaskStatus;
  estimatedTime: number;
}

/**
 * 重新生成章节请求
 */
export interface RegenerateSectionRequest {
  documentId: string;
  sectionId: string;
  instruction?: string;
}

/**
 * 文档导出格式
 */
export type ExportFormat = "markdown" | "pdf" | "docx" | "html";

/**
 * 创建分享链接请求
 */
export interface CreateShareRequest {
  documentId: string;
  password?: string;
  expiresInDays?: number;
  allowDownload?: boolean;
}

/**
 * 创建分享链接响应
 */
export interface CreateShareResponse {
  shareId: string;
  shareUrl: string;
  expiresAt?: string;
}
