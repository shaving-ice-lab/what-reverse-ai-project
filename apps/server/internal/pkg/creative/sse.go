package creative

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"sync"
	"time"
)

// ========================
// SSE 事件类型定义
// ========================

// SSEEventType SSE 事件类型
type SSEEventType string

const (
	SSEEventTaskStarted     SSEEventType = "task_started"
	SSEEventSectionStart    SSEEventType = "section_start"
	SSEEventSectionContent  SSEEventType = "section_content"
	SSEEventSectionComplete SSEEventType = "section_complete"
	SSEEventSectionFailed   SSEEventType = "section_failed"
	SSEEventComplete        SSEEventType = "complete"
	SSEEventError           SSEEventType = "error"
	SSEEventPing            SSEEventType = "ping"
)

// ========================
// SSE 事件数据结构
// ========================

// SSEEvent SSE 事件
type SSEEvent struct {
	Event string      `json:"-"`     // 事件类型 (不序列化到 data 中)
	Data  interface{} `json:"data"`  // 事件数据
	ID    string      `json:"id,omitempty"`
}

// TaskStartedData 任务开始事件数据
type TaskStartedData struct {
	TaskID        string `json:"taskId"`
	TemplateID    string `json:"templateId"`
	TotalSections int    `json:"totalSections"`
	EstimatedTime int    `json:"estimatedTime,omitempty"` // 预计秒数
}

// SectionStartData 章节开始事件数据
type SectionStartData struct {
	Section       string `json:"section"`
	Title         string `json:"title"`
	Progress      int    `json:"progress"`
	Total         int    `json:"total"`
	EstimatedTime int    `json:"estimatedTime,omitempty"`
}

// SectionContentData 章节内容事件数据
type SectionContentData struct {
	Section string `json:"section"`
	Content string `json:"content"`
	IsDelta bool   `json:"isDelta,omitempty"` // 是否为增量内容
}

// SectionCompleteData 章节完成事件数据
type SectionCompleteData struct {
	Section   string `json:"section"`
	Title     string `json:"title"`
	Progress  int    `json:"progress"`
	Total     int    `json:"total"`
	TokenUsed int    `json:"tokenUsed,omitempty"`
}

// SectionFailedData 章节失败事件数据
type SectionFailedData struct {
	Section string `json:"section"`
	Title   string `json:"title"`
	Error   string `json:"error"`
	Retries int    `json:"retries,omitempty"`
}

// CompleteData 任务完成事件数据
type CompleteData struct {
	TaskID     string                 `json:"taskId"`
	DocumentID string                 `json:"documentId"`
	Markdown   string                 `json:"markdown"`
	TokenUsage TokenUsage             `json:"tokenUsage"`
	Duration   int64                  `json:"duration"` // 总耗时(毫秒)
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
}

// ErrorData 错误事件数据
type ErrorData struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	TaskID  string `json:"taskId,omitempty"`
	Section string `json:"section,omitempty"`
}

// PingData 心跳事件数据
type PingData struct {
	Timestamp int64 `json:"timestamp"`
}

// ========================
// SSE 写入器
// ========================

// SSEWriter SSE 写入器接口
type SSEWriter interface {
	io.Writer
	Flush()
}

// SSEEncoder SSE 编码器
type SSEEncoder struct {
	writer  SSEWriter
	mu      sync.Mutex
	eventID int64
}

// NewSSEEncoder 创建 SSE 编码器
func NewSSEEncoder(w SSEWriter) *SSEEncoder {
	return &SSEEncoder{
		writer: w,
	}
}

// WriteEvent 写入 SSE 事件
func (e *SSEEncoder) WriteEvent(eventType SSEEventType, data interface{}) error {
	e.mu.Lock()
	defer e.mu.Unlock()

	e.eventID++

	// 序列化数据
	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal event data: %w", err)
	}

	// 写入事件
	_, err = fmt.Fprintf(e.writer, "id: %d\nevent: %s\ndata: %s\n\n", e.eventID, eventType, string(jsonData))
	if err != nil {
		return fmt.Errorf("failed to write event: %w", err)
	}

	e.writer.Flush()
	return nil
}

// WriteComment 写入 SSE 注释 (用于保持连接)
func (e *SSEEncoder) WriteComment(comment string) error {
	e.mu.Lock()
	defer e.mu.Unlock()

	_, err := fmt.Fprintf(e.writer, ": %s\n\n", comment)
	if err != nil {
		return err
	}

	e.writer.Flush()
	return nil
}

// WritePing 写入心跳
func (e *SSEEncoder) WritePing() error {
	return e.WriteEvent(SSEEventPing, PingData{
		Timestamp: time.Now().UnixMilli(),
	})
}

// ========================
// SSE 连接管理
// ========================

// SSEConnection SSE 连接
type SSEConnection struct {
	TaskID    string
	Encoder   *SSEEncoder
	CreatedAt time.Time
	ctx       context.Context
	cancel    context.CancelFunc
}

// SSEConnectionManager SSE 连接管理器
type SSEConnectionManager struct {
	connections map[string][]*SSEConnection // taskID -> connections
	mu          sync.RWMutex
}

// NewSSEConnectionManager 创建 SSE 连接管理器
func NewSSEConnectionManager() *SSEConnectionManager {
	return &SSEConnectionManager{
		connections: make(map[string][]*SSEConnection),
	}
}

// AddConnection 添加连接
func (m *SSEConnectionManager) AddConnection(taskID string, encoder *SSEEncoder) *SSEConnection {
	ctx, cancel := context.WithCancel(context.Background())
	conn := &SSEConnection{
		TaskID:    taskID,
		Encoder:   encoder,
		CreatedAt: time.Now(),
		ctx:       ctx,
		cancel:    cancel,
	}

	m.mu.Lock()
	m.connections[taskID] = append(m.connections[taskID], conn)
	m.mu.Unlock()

	return conn
}

// RemoveConnection 移除连接
func (m *SSEConnectionManager) RemoveConnection(taskID string, conn *SSEConnection) {
	m.mu.Lock()
	defer m.mu.Unlock()

	conn.cancel()

	conns := m.connections[taskID]
	for i, c := range conns {
		if c == conn {
			m.connections[taskID] = append(conns[:i], conns[i+1:]...)
			break
		}
	}

	if len(m.connections[taskID]) == 0 {
		delete(m.connections, taskID)
	}
}

// BroadcastToTask 向任务的所有连接广播事件
func (m *SSEConnectionManager) BroadcastToTask(taskID string, eventType SSEEventType, data interface{}) {
	m.mu.RLock()
	conns := m.connections[taskID]
	m.mu.RUnlock()

	for _, conn := range conns {
		go func(c *SSEConnection) {
			if err := c.Encoder.WriteEvent(eventType, data); err != nil {
				// 写入失败，可能连接已关闭
				m.RemoveConnection(taskID, c)
			}
		}(conn)
	}
}

// GetConnectionCount 获取任务的连接数
func (m *SSEConnectionManager) GetConnectionCount(taskID string) int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.connections[taskID])
}

// ========================
// SSE 事件处理器
// ========================

// SSEEventHandler SSE 事件处理器 (实现 EventHandler 接口)
type SSEEventHandler struct {
	manager *SSEConnectionManager
}

// NewSSEEventHandler 创建 SSE 事件处理器
func NewSSEEventHandler(manager *SSEConnectionManager) *SSEEventHandler {
	return &SSEEventHandler{
		manager: manager,
	}
}

// HandleEvent 处理生成事件并转发到 SSE
func (h *SSEEventHandler) HandleEvent(event *GenerationEvent) {
	var sseEventType SSEEventType
	var data interface{}

	switch event.Type {
	case EventTaskStarted:
		sseEventType = SSEEventTaskStarted
		data = TaskStartedData{
			TaskID:        event.TaskID,
			TotalSections: event.Total,
		}

	case EventSectionStarted:
		sseEventType = SSEEventSectionStart
		data = SectionStartData{
			Section:  event.SectionID,
			Title:    event.Title,
			Progress: event.Progress,
			Total:    event.Total,
		}

	case EventSectionContent:
		sseEventType = SSEEventSectionContent
		data = SectionContentData{
			Section: event.SectionID,
			Content: event.Content,
			IsDelta: true,
		}

	case EventSectionComplete:
		sseEventType = SSEEventSectionComplete
		tokenUsed := 0
		if event.Metadata != nil {
			if tu, ok := event.Metadata["tokenUsed"].(int); ok {
				tokenUsed = tu
			}
		}
		data = SectionCompleteData{
			Section:   event.SectionID,
			Title:     event.Title,
			Progress:  event.Progress,
			Total:     event.Total,
			TokenUsed: tokenUsed,
		}

	case EventSectionFailed:
		sseEventType = SSEEventSectionFailed
		retries := 0
		if event.Metadata != nil {
			if r, ok := event.Metadata["retries"].(int); ok {
				retries = r
			}
		}
		data = SectionFailedData{
			Section: event.SectionID,
			Title:   event.Title,
			Error:   event.Error,
			Retries: retries,
		}

	case EventTaskComplete:
		sseEventType = SSEEventComplete
		var tokenUsage TokenUsage
		if event.Metadata != nil {
			if tu, ok := event.Metadata["tokenUsage"].(TokenUsage); ok {
				tokenUsage = tu
			}
		}
		data = CompleteData{
			TaskID:     event.TaskID,
			Markdown:   event.Content,
			TokenUsage: tokenUsage,
		}

	case EventTaskFailed:
		sseEventType = SSEEventError
		data = ErrorData{
			Code:    "GENERATION_FAILED",
			Message: event.Error,
			TaskID:  event.TaskID,
		}

	case EventTaskCancelled:
		sseEventType = SSEEventError
		data = ErrorData{
			Code:    "TASK_CANCELLED",
			Message: "Task was cancelled by user",
			TaskID:  event.TaskID,
		}

	default:
		return // 未知事件类型，忽略
	}

	h.manager.BroadcastToTask(event.TaskID, sseEventType, data)
}

// ========================
// 心跳保持
// ========================

// StartHeartbeat 启动心跳
func StartHeartbeat(ctx context.Context, encoder *SSEEncoder, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := encoder.WritePing(); err != nil {
				return
			}
		}
	}
}

// ========================
// SSE 工具函数
// ========================

// SendTaskStarted 发送任务开始事件
func SendTaskStarted(encoder *SSEEncoder, taskID, templateID string, totalSections, estimatedTime int) error {
	return encoder.WriteEvent(SSEEventTaskStarted, TaskStartedData{
		TaskID:        taskID,
		TemplateID:    templateID,
		TotalSections: totalSections,
		EstimatedTime: estimatedTime,
	})
}

// SendSectionStart 发送章节开始事件
func SendSectionStart(encoder *SSEEncoder, section, title string, progress, total int) error {
	return encoder.WriteEvent(SSEEventSectionStart, SectionStartData{
		Section:  section,
		Title:    title,
		Progress: progress,
		Total:    total,
	})
}

// SendSectionContent 发送章节内容事件
func SendSectionContent(encoder *SSEEncoder, section, content string, isDelta bool) error {
	return encoder.WriteEvent(SSEEventSectionContent, SectionContentData{
		Section: section,
		Content: content,
		IsDelta: isDelta,
	})
}

// SendSectionComplete 发送章节完成事件
func SendSectionComplete(encoder *SSEEncoder, section, title string, progress, total, tokenUsed int) error {
	return encoder.WriteEvent(SSEEventSectionComplete, SectionCompleteData{
		Section:   section,
		Title:     title,
		Progress:  progress,
		Total:     total,
		TokenUsed: tokenUsed,
	})
}

// SendSectionFailed 发送章节失败事件
func SendSectionFailed(encoder *SSEEncoder, section, title, errMsg string, retries int) error {
	return encoder.WriteEvent(SSEEventSectionFailed, SectionFailedData{
		Section: section,
		Title:   title,
		Error:   errMsg,
		Retries: retries,
	})
}

// SendComplete 发送任务完成事件
func SendComplete(encoder *SSEEncoder, taskID, documentID, markdown string, tokenUsage TokenUsage, duration int64) error {
	return encoder.WriteEvent(SSEEventComplete, CompleteData{
		TaskID:     taskID,
		DocumentID: documentID,
		Markdown:   markdown,
		TokenUsage: tokenUsage,
		Duration:   duration,
	})
}

// SendError 发送错误事件
func SendError(encoder *SSEEncoder, code, message, taskID string) error {
	return encoder.WriteEvent(SSEEventError, ErrorData{
		Code:    code,
		Message: message,
		TaskID:  taskID,
	})
}
