/**
 * AI CreativeAssistantTypeDefinition
 * 
 * Used forTemplateSystem, GenerateTaskandDocumentManage
 */

// ===== TemplateCategory =====

/**
 * CreativeTemplateCategory
 */
export type CreativeTemplateCategory = 
 | "business" // 
 | "content" // ContentMarketing
 | "product" // ProductPlanning
 | "marketing"; // EnterpriseService

// ===== InputFieldType =====

/**
 * InputFieldType
 */
export type InputFieldType = 
 | "text" // rowText
 | "textarea" // multiplerowText
 | "number" // countchar
 | "select" // selectdown
 | "multiselect" // multipleselectdown
 | "slider" // Slider
 | "switch" // Toggle
 | "date"; // Date

/**
 * downOption
 */
export interface SelectOption {
 value: string;
 label: string;
 description?: string;
}

/**
 * InputFieldVerifyRule
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
 * InputFieldDefinition
 * 
 * Used forDefinitionTemplate'sInputFormField
 */
export interface InputField {
 /** Field1Identifier */
 id: string;
 
 /** FieldDisplayTags */
 label: string;
 
 /** FieldType */
 type: InputFieldType;
 
 /** TipText */
 placeholder?: string;
 
 /** HelpDescriptionText */
 helpText?: string;
 
 /** Defaultvalue */
 defaultValue?: string | number | boolean | string[];
 
 /** downOption (select/multiselect TypeUsage) */
 options?: SelectOption[];
 
 /** VerifyRule */
 validation?: InputValidation;
 
 /** isnoEnable AI Suggestion */
 aiSuggest?: boolean;
 
 /** AI SuggestionPrompt (aiSuggest=true timeUsage) */
 aiSuggestPrompt?: string;
 
 /** ConditionDisplay (DependencyotherheField'svalue) */
 showWhen?: {
 field: string;
 operator: "eq" | "neq" | "contains" | "notEmpty";
 value?: string | number | boolean;
 };
}

// ===== OutputChapterType =====

/**
 * OutputChapterDefinition
 * 
 * Used forDefinitionGenerateDocument'sChapterStructure
 */
export interface OutputSection {
 /** Chapter1Identifier */
 id: string;
 
 /** ChapterTitle */
 title: string;
 
 /** ChapterDescription */
 description: string;
 
 /** GenerateChapter'sPromptTemplate */
 promptTemplate: string;
 
 /** ChapterIcon */
 icon?: string;
 
 /** EstimatedGenerateTime(s) */
 estimatedTime?: number;
 
 /** Dependency'sbeforeChapter (needetcpendingthisChapterDone) */
 dependsOn?: string[];
 
 /** isnocanwithIndependentre-newGenerate */
 regeneratable?: boolean;
 
 /** OutputFormat */
 outputFormat?: "markdown" | "json" | "table" | "list";
}

// ===== TemplatemainStructure =====

/**
 * TemplateExample
 */
export interface TemplateExample {
 /** ExampleInputData */
 input: Record<string, unknown>;
 
 /** ExampleOutput (Markdown Format) */
 output: string;
 
 /** ExampleTitle */
 title?: string;
 
 /** ExampleDescription */
 description?: string;
}

/**
 * CreativeTemplateDefinition
 * 
 * AI CreativeAssistant'sCoreDataStructure, DefinitionTemplate'sCompleteConfig
 */
export interface CreativeTemplate {
 /** Template1Identifier */
 id: string;
 
 /** TemplateName */
 name: string;
 
 /** TemplateDescription */
 description: string;
 
 /** TemplateIcon */
 icon: string;
 
 /** TemplateCategory */
 category: CreativeTemplateCategory;
 
 /** InputFieldDefinition */
 inputs: {
 /** RequiredField */
 required: InputField[];
 /** selectField */
 optional: InputField[];
 };
 
 /** OutputChapterDefinition */
 outputSections: OutputSection[];
 
 /** Associate'sWorkflowID */
 workflowId: string;
 
 /** TemplateExample */
 example?: TemplateExample;
 
 /** Usagetimescount */
 usageCount: number;
 
 /** Rating (1-5) */
 rating: number;
 
 /** ReviewsCount */
 reviewCount: number;
 
 /** Tags */
 tags: string[];
 
 /** EstimatedGenerateTime(s) */
 estimatedTime?: number;
 
 /** isnoasmethodTemplate */
 isOfficial?: boolean;
 
 /** CreateuserID */
 creatorId?: string;
 
 /** CreateuserName */
 creatorName?: string;
 
 /** Version Number */
 version: number;
 
 /** Created At */
 createdAt: string;
 
 /** Updated At */
 updatedAt: string;
}

// ===== GenerateTaskType =====

/**
 * GenerateTaskStatus
 */
export type CreativeTaskStatus =
 | "pending" // etcpendingStart
 | "processing" // Processing
 | "completed" // Completed
 | "failed" // Failed
 | "cancelled"; // Cancelled

/**
 * ChapterGenerateStatus
 */
export type SectionStatus =
 | "pending" // etcpendingGenerate
 | "generating" // Generating
 | "completed" // Completed
 | "failed" // Failed
 | "skipped"; // alreadySkip

/**
 * ChapterStatusInfo
 */
export interface SectionState {
 /** ChapterID */
 sectionId: string;
 
 /** ChapterStatus */
 status: SectionStatus;
 
 /** Generate'sContent */
 content?: string;
 
 /** StartTime */
 startedAt?: string;
 
 /** DoneTime */
 completedAt?: string;
 
 /** Duration(s) */
 durationMs?: number;
 
 /** ErrorInfo */
 error?: string;
 
 /** Token Consumption */
 tokenUsage?: {
 prompt: number;
 completion: number;
 total: number;
 };
}

/**
 * Token UsageStatistics
 */
export interface TokenUsageStats {
 prompt: number;
 completion: number;
 total: number;
}

/**
 * CreativeGenerateTask
 * 
 * Record1timesGenerateTask'sCompleteStatus
 */
export interface CreativeTask {
 /** Task1Identifier */
 id: string;
 
 /** UserID */
 userId: string;
 
 /** Usage'sTemplateID */
 templateId: string;
 
 /** UserInputData */
 inputs: Record<string, unknown>;
 
 /** TaskStatus */
 status: CreativeTaskStatus;
 
 /** ChapterStatus */
 sections: Record<string, SectionState>;
 
 /** Done'sChaptercount */
 completedSections: number;
 
 /** totalChaptercount */
 totalSections: number;
 
 /** ProgressPercentage (0-100) */
 progress: number;
 
 /** mostOutput (Markdown Format) */
 outputMarkdown?: string;
 
 /** OutputData */
 outputMetadata?: {
 title: string;
 wordCount: number;
 characterCount: number;
 };
 
 /** SearchResultCache */
 searchCache?: Record<string, unknown>;
 
 /** Token ConsumptionStatistics */
 tokenUsage: TokenUsageStats;
 
 /** EstimatedRemainingTime(s) */
 estimatedRemainingTime?: number;
 
 /** ErrorInfo */
 errorMessage?: string;
 
 /** StartTime */
 startedAt?: string;
 
 /** DoneTime */
 completedAt?: string;
 
 /** Created At */
 createdAt: string;
}

// ===== DocumentType =====

/**
 * DocumentChapter
 */
export interface DocumentSection {
 /** ChapterID */
 id: string;
 
 /** ChapterTitle */
 title: string;
 
 /** ChapterContent (Markdown) */
 content: string;
 
 /** ChapterOrder */
 order: number;
 
 /** isnoalreadyEdit */
 isEdited?: boolean;
 
 /** Version Number */
 version: number;
 
 /** Version History */
 history?: {
 content: string;
 editedAt: string;
 version: number;
 }[];
}

/**
 * ShareSettings
 */
export interface ShareSettings {
 /** ShareID (Used forGenerateShareLink) */
 shareId: string;
 
 /** isnoPublic */
 isPublic: boolean;
 
 /** AccessPassword (Optional) */
 password?: string;
 
 /** ExpiredTime (Optional) */
 expiresAt?: string;
 
 /** isnoAllowDownload */
 allowDownload: boolean;
 
 /** Accesstimescount */
 viewCount: number;
}

/**
 * CreativeDocument
 * 
 * GenerateTaskDoneafterSave'sDocument
 */
export interface CreativeDocument {
 /** Document1Identifier */
 id: string;
 
 /** UserID */
 userId: string;
 
 /** Associate'sTaskID */
 taskId: string;
 
 /** Usage'sTemplateID */
 templateId: string;
 
 /** DocumentTitle */
 title: string;
 
 /** CompleteContent (Markdown Format) */
 content: string;
 
 /** ChapterList */
 sections: DocumentSection[];
 
 /** Version Number */
 version: number;
 
 /** VersionID (Used forVersion) */
 parentId?: string;
 
 /** ShareSettings */
 share?: ShareSettings;
 
 /** isnoFavorite */
 isStarred: boolean;
 
 /** Tags */
 tags: string[];
 
 /** Created At */
 createdAt: string;
 
 /** Updated At */
 updatedAt: string;
}

// ===== SSE EventType =====

/**
 * SSE EventType
 */
export type CreativeSSEEventType =
 | "task:started" // TaskStart
 | "section:start" // ChapterStartGenerate
 | "section:content" // ChapterContentFragment
 | "section:complete" // ChapterGenerateDone
 | "section:error" // ChapterGenerateFailed
 | "task:progress" // TaskProgressUpdate
 | "task:complete" // TaskDone
 | "task:error" // TaskFailed
 | "search:start" // SearchStart
 | "search:complete"; // SearchDone

/**
 * SSE EventPayload
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

// ===== API Request/ResponseType =====

/**
 * CreateGenerateTaskRequest
 */
export interface CreateTaskRequest {
 templateId: string;
 inputs: Record<string, unknown>;
}

/**
 * CreateGenerateTaskResponse
 */
export interface CreateTaskResponse {
 taskId: string;
 status: CreativeTaskStatus;
 estimatedTime: number;
}

/**
 * re-newGenerateChapterRequest
 */
export interface RegenerateSectionRequest {
 documentId: string;
 sectionId: string;
 instruction?: string;
}

/**
 * DocumentExportFormat
 */
export type ExportFormat = "markdown" | "pdf" | "docx" | "html";

/**
 * CreateShareLinkRequest
 */
export interface CreateShareRequest {
 documentId: string;
 password?: string;
 expiresInDays?: number;
 allowDownload?: boolean;
}

/**
 * CreateShareLinkResponse
 */
export interface CreateShareResponse {
 shareId: string;
 shareUrl: string;
 expiresAt?: string;
}
