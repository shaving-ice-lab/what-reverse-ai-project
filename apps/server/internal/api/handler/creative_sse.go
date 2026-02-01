package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/agentflow/server/internal/pkg/creative"
	"github.com/agentflow/server/internal/pkg/logger"
	"github.com/labstack/echo/v4"
)

// CreativeSSEHandler AI 创意助手 SSE 处理器
type CreativeSSEHandler struct {
	log           logger.Logger
	connManager   *creative.SSEConnectionManager
	cacheManager  *creative.TaskCacheManager
	generator     *creative.DocumentGenerator
}

// NewCreativeSSEHandler 创建 SSE 处理器
func NewCreativeSSEHandler(
	log logger.Logger,
	connManager *creative.SSEConnectionManager,
	cacheManager *creative.TaskCacheManager,
	generator *creative.DocumentGenerator,
) *CreativeSSEHandler {
	return &CreativeSSEHandler{
		log:          log,
		connManager:  connManager,
		cacheManager: cacheManager,
		generator:    generator,
	}
}

// ========================
// 响应写入器包装
// ========================

// echoSSEWriter 包装 echo 响应写入器以实现 SSEWriter 接口
type echoSSEWriter struct {
	response http.ResponseWriter
	flusher  http.Flusher
}

// Write 实现 io.Writer
func (w *echoSSEWriter) Write(p []byte) (n int, err error) {
	return w.response.Write(p)
}

// Flush 实现 Flush 方法
func (w *echoSSEWriter) Flush() {
	if w.flusher != nil {
		w.flusher.Flush()
	}
}

// ========================
// SSE 端点
// ========================

// Stream 流式获取生成进度
// GET /api/v1/creative/generate/:taskId/stream
// @Summary 流式获取生成进度
// @Description 通过 Server-Sent Events 实时获取 AI 创意助手的生成进度
// @Tags Creative Generation
// @Produce text/event-stream
// @Param taskId path string true "任务 ID"
// @Success 200 {object} string "SSE 事件流"
// @Failure 400 {object} ErrorResponse "请求参数错误"
// @Failure 404 {object} ErrorResponse "任务不存在"
// @Router /api/v1/creative/generate/{taskId}/stream [get]
func (h *CreativeSSEHandler) Stream(c echo.Context) error {
	taskID := c.Param("taskId")
	if taskID == "" {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TASK_ID", "Task ID is required")
	}

	// 获取任务
	task, ok := h.cacheManager.GetTask(taskID)
	if !ok {
		return errorResponse(c, http.StatusNotFound, "TASK_NOT_FOUND", "Task not found")
	}

	// 设置 SSE 响应头
	c.Response().Header().Set("Content-Type", "text/event-stream")
	c.Response().Header().Set("Cache-Control", "no-cache")
	c.Response().Header().Set("Connection", "keep-alive")
	c.Response().Header().Set("X-Accel-Buffering", "no") // 禁用 nginx 缓冲
	c.Response().WriteHeader(http.StatusOK)

	// 获取 Flusher
	flusher, ok := c.Response().Writer.(http.Flusher)
	if !ok {
		return errorResponse(c, http.StatusInternalServerError, "SSE_NOT_SUPPORTED", "Server does not support SSE")
	}

	// 创建 SSE 写入器和编码器
	writer := &echoSSEWriter{
		response: c.Response().Writer,
		flusher:  flusher,
	}
	encoder := creative.NewSSEEncoder(writer)

	// 创建上下文
	ctx, cancel := context.WithCancel(c.Request().Context())
	defer cancel()

	// 添加连接到管理器
	conn := h.connManager.AddConnection(taskID, encoder)
	defer h.connManager.RemoveConnection(taskID, conn)

	// 发送当前状态
	if err := h.sendCurrentState(encoder, task); err != nil {
		h.log.Error("Failed to send current state", "error", err)
		return nil
	}

	// 如果任务已完成，发送完成事件后关闭
	if task.Status == creative.TaskStatusCompleted {
		return nil
	}

	// 如果任务已失败，发送错误事件后关闭
	if task.Status == creative.TaskStatusFailed {
		return nil
	}

	// 如果任务已取消，发送取消事件后关闭
	if task.Status == creative.TaskStatusCancelled {
		return nil
	}

	// 启动心跳
	go creative.StartHeartbeat(ctx, encoder, 30*time.Second)

	// 等待任务完成或客户端断开
	select {
	case <-ctx.Done():
		h.log.Info("SSE client disconnected", "taskId", taskID)
	case <-task.GetCancelChan():
		h.log.Info("Task cancelled", "taskId", taskID)
		creative.SendError(encoder, "TASK_CANCELLED", "Task was cancelled", taskID)
	}

	return nil
}

// sendCurrentState 发送当前状态
func (h *CreativeSSEHandler) sendCurrentState(encoder *creative.SSEEncoder, task *creative.GenerationTask) error {
	// 发送任务开始事件
	if err := creative.SendTaskStarted(encoder, task.ID, task.TemplateID, len(task.Sections), 0); err != nil {
		return err
	}

	// 发送已完成章节的状态
	completed, total := task.GetProgress()
	for sectionID, section := range task.Sections {
		switch section.Status {
		case creative.SectionStatusCompleted:
			if err := creative.SendSectionComplete(encoder, sectionID, section.Title, completed, total, section.TokenUsed); err != nil {
				return err
			}
			// 发送章节内容
			if section.Content != "" {
				if err := creative.SendSectionContent(encoder, sectionID, section.Content, false); err != nil {
					return err
				}
			}
		case creative.SectionStatusGenerating:
			if err := creative.SendSectionStart(encoder, sectionID, section.Title, completed, total); err != nil {
				return err
			}
		case creative.SectionStatusFailed:
			if err := creative.SendSectionFailed(encoder, sectionID, section.Title, section.Error, section.Retries); err != nil {
				return err
			}
		}
	}

	// 如果任务已完成，发送完成事件
	if task.Status == creative.TaskStatusCompleted {
		var duration int64
		if task.StartedAt != nil && task.CompletedAt != nil {
			duration = task.CompletedAt.Sub(*task.StartedAt).Milliseconds()
		}
		return creative.SendComplete(encoder, task.ID, "", task.OutputMarkdown, task.TokenUsage, duration)
	}

	// 如果任务失败，发送错误事件
	if task.Status == creative.TaskStatusFailed {
		return creative.SendError(encoder, "GENERATION_FAILED", task.Error, task.ID)
	}

	return nil
}

// ========================
// 流式内容事件发送
// ========================

// StreamingContentHandler 流式内容处理器
type StreamingContentHandler struct {
	encoder   *creative.SSEEncoder
	sectionID string
}

// NewStreamingContentHandler 创建流式内容处理器
func NewStreamingContentHandler(encoder *creative.SSEEncoder, sectionID string) *StreamingContentHandler {
	return &StreamingContentHandler{
		encoder:   encoder,
		sectionID: sectionID,
	}
}

// OnContent 接收流式内容片段
func (h *StreamingContentHandler) OnContent(content string) error {
	return creative.SendSectionContent(h.encoder, h.sectionID, content, true)
}
