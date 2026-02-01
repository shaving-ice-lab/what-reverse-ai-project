package creative

import (
	"sync"
	"time"
)

// ========================
// 生成任务状态
// ========================

// TaskStatus 任务状态
type TaskStatus string

const (
	TaskStatusPending    TaskStatus = "pending"
	TaskStatusProcessing TaskStatus = "processing"
	TaskStatusCompleted  TaskStatus = "completed"
	TaskStatusFailed     TaskStatus = "failed"
	TaskStatusCancelled  TaskStatus = "cancelled"
)

// SectionStatus 章节状态
type SectionStatus string

const (
	SectionStatusPending    SectionStatus = "pending"
	SectionStatusGenerating SectionStatus = "generating"
	SectionStatusCompleted  SectionStatus = "completed"
	SectionStatusFailed     SectionStatus = "failed"
	SectionStatusSkipped    SectionStatus = "skipped"
)

// ========================
// 输出章节定义
// ========================

// OutputSectionConfig 输出章节配置
type OutputSectionConfig struct {
	ID             string   `json:"id"`
	Title          string   `json:"title"`
	Description    string   `json:"description"`
	PromptTemplate string   `json:"promptTemplate"`
	Icon           string   `json:"icon,omitempty"`
	EstimatedTime  int      `json:"estimatedTime,omitempty"` // 预计生成时间(秒)
	DependsOn      []string `json:"dependsOn,omitempty"`     // 依赖的章节ID
	Regeneratable  bool     `json:"regeneratable,omitempty"`
	OutputFormat   string   `json:"outputFormat,omitempty"` // markdown, json, table, list
}

// ========================
// 章节状态跟踪
// ========================

// SectionState 章节状态
type SectionState struct {
	ID        string        `json:"id"`
	Title     string        `json:"title"`
	Status    SectionStatus `json:"status"`
	Content   string        `json:"content,omitempty"`
	Error     string        `json:"error,omitempty"`
	StartedAt *time.Time    `json:"startedAt,omitempty"`
	EndedAt   *time.Time    `json:"endedAt,omitempty"`
	TokenUsed int           `json:"tokenUsed,omitempty"`
	Retries   int           `json:"retries,omitempty"`
}

// ========================
// 生成任务
// ========================

// GenerationTask 生成任务
type GenerationTask struct {
	ID         string                 `json:"id"`
	TemplateID string                 `json:"templateId"`
	UserID     string                 `json:"userId"`
	Status     TaskStatus             `json:"status"`
	Inputs     map[string]interface{} `json:"inputs"`

	// 章节状态
	Sections map[string]*SectionState `json:"sections"`

	// 生成结果
	OutputMarkdown string                 `json:"outputMarkdown,omitempty"`
	OutputMetadata map[string]interface{} `json:"outputMetadata,omitempty"`

	// Token 使用统计
	TokenUsage TokenUsage `json:"tokenUsage"`

	// 时间信息
	CreatedAt   time.Time  `json:"createdAt"`
	StartedAt   *time.Time `json:"startedAt,omitempty"`
	CompletedAt *time.Time `json:"completedAt,omitempty"`

	// 错误信息
	Error string `json:"error,omitempty"`

	// 取消通道
	cancelChan chan struct{}
	cancelled  bool
	mu         sync.RWMutex
}

// TokenUsage Token 使用统计
type TokenUsage struct {
	PromptTokens     int `json:"promptTokens"`
	CompletionTokens int `json:"completionTokens"`
	TotalTokens      int `json:"totalTokens"`
}

// NewGenerationTask 创建生成任务
func NewGenerationTask(taskID, templateID, userID string, inputs map[string]interface{}) *GenerationTask {
	return &GenerationTask{
		ID:         taskID,
		TemplateID: templateID,
		UserID:     userID,
		Status:     TaskStatusPending,
		Inputs:     inputs,
		Sections:   make(map[string]*SectionState),
		CreatedAt:  time.Now(),
		cancelChan: make(chan struct{}),
	}
}

// Cancel 取消任务
func (t *GenerationTask) Cancel() {
	t.mu.Lock()
	defer t.mu.Unlock()
	if !t.cancelled {
		t.cancelled = true
		close(t.cancelChan)
		t.Status = TaskStatusCancelled
	}
}

// IsCancelled 检查是否已取消
func (t *GenerationTask) IsCancelled() bool {
	t.mu.RLock()
	defer t.mu.RUnlock()
	return t.cancelled
}

// GetCancelChan 获取取消通道
func (t *GenerationTask) GetCancelChan() <-chan struct{} {
	return t.cancelChan
}

// SetSectionStatus 设置章节状态
func (t *GenerationTask) SetSectionStatus(sectionID string, status SectionStatus) {
	t.mu.Lock()
	defer t.mu.Unlock()
	if section, ok := t.Sections[sectionID]; ok {
		section.Status = status
		if status == SectionStatusGenerating && section.StartedAt == nil {
			now := time.Now()
			section.StartedAt = &now
		}
		if status == SectionStatusCompleted || status == SectionStatusFailed {
			now := time.Now()
			section.EndedAt = &now
		}
	}
}

// SetSectionContent 设置章节内容
func (t *GenerationTask) SetSectionContent(sectionID, content string, tokenUsed int) {
	t.mu.Lock()
	defer t.mu.Unlock()
	if section, ok := t.Sections[sectionID]; ok {
		section.Content = content
		section.TokenUsed = tokenUsed
		section.Status = SectionStatusCompleted
		now := time.Now()
		section.EndedAt = &now
	}
}

// SetSectionError 设置章节错误
func (t *GenerationTask) SetSectionError(sectionID, errMsg string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	if section, ok := t.Sections[sectionID]; ok {
		section.Error = errMsg
		section.Status = SectionStatusFailed
		now := time.Now()
		section.EndedAt = &now
	}
}

// InitializeSections 初始化章节状态
func (t *GenerationTask) InitializeSections(sections []OutputSectionConfig) {
	t.mu.Lock()
	defer t.mu.Unlock()
	for _, section := range sections {
		t.Sections[section.ID] = &SectionState{
			ID:     section.ID,
			Title:  section.Title,
			Status: SectionStatusPending,
		}
	}
}

// GetProgress 获取进度信息
func (t *GenerationTask) GetProgress() (completed int, total int) {
	t.mu.RLock()
	defer t.mu.RUnlock()
	total = len(t.Sections)
	for _, section := range t.Sections {
		if section.Status == SectionStatusCompleted {
			completed++
		}
	}
	return
}

// ========================
// 生成上下文
// ========================

// GenerationContext 生成上下文
type GenerationContext struct {
	// 用户输入
	Inputs map[string]interface{} `json:"inputs"`

	// 已生成的章节内容 (sectionID -> content)
	SectionResults map[string]string `json:"sectionResults"`

	// 搜索结果缓存 (query -> results)
	SearchResults map[string]interface{} `json:"searchResults,omitempty"`

	// 全局变量 (可在模板中引用)
	Variables map[string]interface{} `json:"variables,omitempty"`

	mu sync.RWMutex
}

// NewGenerationContext 创建生成上下文
func NewGenerationContext(inputs map[string]interface{}) *GenerationContext {
	return &GenerationContext{
		Inputs:         inputs,
		SectionResults: make(map[string]string),
		SearchResults:  make(map[string]interface{}),
		Variables:      make(map[string]interface{}),
	}
}

// SetSectionResult 设置章节结果
func (c *GenerationContext) SetSectionResult(sectionID, content string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.SectionResults[sectionID] = content
}

// GetSectionResult 获取章节结果
func (c *GenerationContext) GetSectionResult(sectionID string) (string, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	content, ok := c.SectionResults[sectionID]
	return content, ok
}

// SetSearchResult 设置搜索结果缓存
func (c *GenerationContext) SetSearchResult(query string, result interface{}) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.SearchResults[query] = result
}

// GetSearchResult 获取搜索结果缓存
func (c *GenerationContext) GetSearchResult(query string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	result, ok := c.SearchResults[query]
	return result, ok
}

// SetVariable 设置变量
func (c *GenerationContext) SetVariable(key string, value interface{}) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.Variables[key] = value
}

// GetVariable 获取变量
func (c *GenerationContext) GetVariable(key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	value, ok := c.Variables[key]
	return value, ok
}

// BuildPromptContext 构建 prompt 上下文
func (c *GenerationContext) BuildPromptContext(dependsOn []string) map[string]interface{} {
	c.mu.RLock()
	defer c.mu.RUnlock()

	ctx := map[string]interface{}{
		"inputs":    c.Inputs,
		"variables": c.Variables,
	}

	// 添加依赖章节的内容
	previousSections := make(map[string]string)
	for _, depID := range dependsOn {
		if content, ok := c.SectionResults[depID]; ok {
			previousSections[depID] = content
		}
	}
	ctx["previousSections"] = previousSections

	// 添加所有已完成的章节作为参考
	ctx["allSections"] = c.SectionResults

	return ctx
}

// ========================
// 事件定义
// ========================

// EventType 事件类型
type EventType string

const (
	EventTaskStarted     EventType = "task_started"
	EventSectionStarted  EventType = "section_started"
	EventSectionContent  EventType = "section_content"
	EventSectionComplete EventType = "section_complete"
	EventSectionFailed   EventType = "section_failed"
	EventTaskComplete    EventType = "task_complete"
	EventTaskFailed      EventType = "task_failed"
	EventTaskCancelled   EventType = "task_cancelled"
)

// GenerationEvent 生成事件
type GenerationEvent struct {
	Type      EventType              `json:"type"`
	TaskID    string                 `json:"taskId"`
	SectionID string                 `json:"sectionId,omitempty"`
	Title     string                 `json:"title,omitempty"`
	Content   string                 `json:"content,omitempty"`
	Progress  int                    `json:"progress,omitempty"`
	Total     int                    `json:"total,omitempty"`
	Error     string                 `json:"error,omitempty"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
	Timestamp time.Time              `json:"timestamp"`
}

// NewGenerationEvent 创建生成事件
func NewGenerationEvent(eventType EventType, taskID string) *GenerationEvent {
	return &GenerationEvent{
		Type:      eventType,
		TaskID:    taskID,
		Timestamp: time.Now(),
	}
}

// EventHandler 事件处理器接口
type EventHandler interface {
	HandleEvent(event *GenerationEvent)
}

// EventHandlerFunc 事件处理函数
type EventHandlerFunc func(event *GenerationEvent)

// HandleEvent 实现 EventHandler 接口
func (f EventHandlerFunc) HandleEvent(event *GenerationEvent) {
	f(event)
}
