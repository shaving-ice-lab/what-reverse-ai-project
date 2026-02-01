package handler

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/creative"
	"github.com/agentflow/server/internal/repository"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// CreativeTaskHandler 创意任务处理器
type CreativeTaskHandler struct {
	taskService service.CreativeTaskService
	generator   *creative.Generator
}

// NewCreativeTaskHandler 创建创意任务处理器
func NewCreativeTaskHandler(
	taskService service.CreativeTaskService,
	generator *creative.Generator,
) *CreativeTaskHandler {
	return &CreativeTaskHandler{
		taskService: taskService,
		generator:   generator,
	}
}

// ================== 请求/响应结构 ==================

// CreateTaskRequest 创建任务请求
type CreateTaskRequest struct {
	TemplateID string                 `json:"template_id" validate:"required"`
	Inputs     map[string]interface{} `json:"inputs" validate:"required"`
}

// TaskResponse 任务响应
type TaskResponse struct {
	ID                uuid.UUID                 `json:"id"`
	TemplateID        *uuid.UUID                `json:"template_id,omitempty"`
	TemplateName      string                    `json:"template_name,omitempty"`
	Status            entity.CreativeTaskStatus `json:"status"`
	Progress          int                       `json:"progress"`
	TotalSections     int                       `json:"total_sections"`
	CompletedSections int                       `json:"completed_sections"`
	CurrentSection    *string                   `json:"current_section,omitempty"`
	ErrorMessage      *string                   `json:"error_message,omitempty"`
	TokenUsage        entity.JSON               `json:"token_usage,omitempty"`
	StartedAt         *string                   `json:"started_at,omitempty"`
	CompletedAt       *string                   `json:"completed_at,omitempty"`
	CreatedAt         string                    `json:"created_at"`
}

// TaskDetailResponse 任务详情响应
type TaskDetailResponse struct {
	TaskResponse
	Inputs         entity.JSON `json:"inputs"`
	Sections       entity.JSON `json:"sections"`
	OutputMarkdown *string     `json:"output_markdown,omitempty"`
	OutputMetadata entity.JSON `json:"output_metadata,omitempty"`
}

// TaskProgressResponse 任务进度响应
type TaskProgressResponse struct {
	TaskID            uuid.UUID                 `json:"task_id"`
	Status            entity.CreativeTaskStatus `json:"status"`
	Progress          int                       `json:"progress"`
	TotalSections     int                       `json:"total_sections"`
	CompletedSections int                       `json:"completed_sections"`
	CurrentSection    *string                   `json:"current_section,omitempty"`
	ErrorMessage      *string                   `json:"error_message,omitempty"`
	StartedAt         *string                   `json:"started_at,omitempty"`
	CompletedAt       *string                   `json:"completed_at,omitempty"`
}

// ================== API 端点 ==================

// Create 创建生成任务
// POST /api/v1/creative/generate
// @Summary 创建 AI 创意生成任务
// @Description 基于指定模板和输入参数创建一个新的生成任务，任务会异步执行
// @Tags Creative Tasks
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body CreateTaskRequest true "创建任务参数"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /api/v1/creative/generate [post]
func (h *CreativeTaskHandler) Create(c echo.Context) error {
	// 获取当前用户
	userIDStr := middleware.GetUserID(c)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "请先登录")
	}

	// 解析请求
	var req CreateTaskRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数格式错误")
	}

	// 验证模板 ID
	templateID, err := uuid.Parse(req.TemplateID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TEMPLATE_ID", "无效的模板 ID")
	}

	// 验证输入
	if req.Inputs == nil {
		req.Inputs = make(map[string]interface{})
	}

	// 创建任务
	task, err := h.taskService.Create(c.Request().Context(), userID, service.CreateTaskInput{
		TemplateID: templateID,
		Inputs:     req.Inputs,
	})
	if err != nil {
		switch err {
		case service.ErrInvalidTemplateID:
			return errorResponse(c, http.StatusBadRequest, "INVALID_TEMPLATE", "模板不存在")
		case service.ErrInvalidInputs:
			return errorResponse(c, http.StatusBadRequest, "INVALID_INPUTS", "输入参数无效")
		default:
			return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "创建任务失败")
		}
	}

	// 异步启动执行
	go h.startTaskExecution(task.ID, userID)

	// 返回响应
	return successResponse(c, map[string]interface{}{
		"task": h.buildTaskResponse(task),
	})
}

// GetStatus 获取任务状态
// GET /api/v1/creative/generate/:taskId
// @Summary 获取生成任务状态
// @Description 获取指定生成任务的当前状态和进度信息
// @Tags Creative Tasks
// @Produce json
// @Security BearerAuth
// @Param taskId path string true "任务 ID"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /api/v1/creative/generate/{taskId} [get]
func (h *CreativeTaskHandler) GetStatus(c echo.Context) error {
	// 获取当前用户
	userIDStr := middleware.GetUserID(c)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "请先登录")
	}

	// 解析任务 ID
	taskID, err := uuid.Parse(c.Param("taskId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TASK_ID", "无效的任务 ID")
	}

	// 获取任务
	task, err := h.taskService.GetByID(c.Request().Context(), taskID, userID)
	if err != nil {
		if err == service.ErrCreativeTaskNotFound {
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "任务不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取任务状态失败")
	}

	// 返回详细响应
	return successResponse(c, map[string]interface{}{
		"task": h.buildTaskDetailResponse(task),
	})
}

// Stream SSE 流式获取任务进度
// GET /api/v1/creative/generate/:taskId/stream
// @Summary SSE 流式获取任务进度
// @Description 通过 Server-Sent Events 实时获取生成任务的进度和内容
// @Tags Creative Tasks
// @Produce text/event-stream
// @Security BearerAuth
// @Param taskId path string true "任务 ID"
// @Success 200 {object} string "SSE event stream"
// @Failure 404 {object} map[string]interface{}
// @Router /api/v1/creative/generate/{taskId}/stream [get]
func (h *CreativeTaskHandler) Stream(c echo.Context) error {
	// 获取当前用户
	userIDStr := middleware.GetUserID(c)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "请先登录")
	}

	// 解析任务 ID
	taskID, err := uuid.Parse(c.Param("taskId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TASK_ID", "无效的任务 ID")
	}

	// 验证任务存在且属于该用户
	task, err := h.taskService.GetByID(c.Request().Context(), taskID, userID)
	if err != nil {
		if err == service.ErrCreativeTaskNotFound {
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "任务不存在")
		}
		return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取任务失败")
	}

	// 设置 SSE 头
	c.Response().Header().Set("Content-Type", "text/event-stream")
	c.Response().Header().Set("Cache-Control", "no-cache")
	c.Response().Header().Set("Connection", "keep-alive")
	c.Response().Header().Set("X-Accel-Buffering", "no")

	// 如果任务已完成或失败，直接返回最终状态
	if task.Status == entity.CreativeTaskStatusCompleted ||
		task.Status == entity.CreativeTaskStatusFailed ||
		task.Status == entity.CreativeTaskStatusCancelled {
		h.sendSSEEvent(c, "complete", map[string]interface{}{
			"task": h.buildTaskDetailResponse(task),
		})
		return nil
	}

	// 订阅任务事件
	ctx := c.Request().Context()
	eventChan := make(chan creative.TaskEvent, 100)

	// 注册事件监听
	if h.generator != nil {
		h.generator.Subscribe(taskID.String(), eventChan)
		defer h.generator.Unsubscribe(taskID.String(), eventChan)
	}

	// 发送初始状态
	h.sendSSEEvent(c, "init", map[string]interface{}{
		"task_id": taskID,
		"status":  task.Status,
	})

	// 监听事件
	for {
		select {
		case <-ctx.Done():
			return nil
		case event, ok := <-eventChan:
			if !ok {
				return nil
			}
			h.sendSSEEvent(c, event.Type, event.Data)
			c.Response().Flush()

			// 如果是完成或错误事件，结束流
			if event.Type == "complete" || event.Type == "error" || event.Type == "cancelled" {
				return nil
			}
		case <-time.After(30 * time.Second):
			// 心跳
			h.sendSSEEvent(c, "ping", map[string]interface{}{
				"timestamp": time.Now().Unix(),
			})
			c.Response().Flush()
		}
	}
}

// Cancel 取消任务
// POST /api/v1/creative/generate/:taskId/cancel
// @Summary 取消生成任务
// @Description 取消正在执行的生成任务
// @Tags Creative Tasks
// @Produce json
// @Security BearerAuth
// @Param taskId path string true "任务 ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /api/v1/creative/generate/{taskId}/cancel [post]
func (h *CreativeTaskHandler) Cancel(c echo.Context) error {
	// 获取当前用户
	userIDStr := middleware.GetUserID(c)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "请先登录")
	}

	// 解析任务 ID
	taskID, err := uuid.Parse(c.Param("taskId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TASK_ID", "无效的任务 ID")
	}

	// 取消任务
	if err := h.taskService.Cancel(c.Request().Context(), taskID, userID); err != nil {
		switch err {
		case service.ErrCreativeTaskNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "任务不存在")
		case service.ErrCreativeTaskCompleted:
			return errorResponse(c, http.StatusBadRequest, "ALREADY_COMPLETED", "任务已完成，无法取消")
		case service.ErrCreativeTaskCancelled:
			return errorResponse(c, http.StatusBadRequest, "ALREADY_CANCELLED", "任务已取消")
		case service.ErrCreativeTaskFailed:
			return errorResponse(c, http.StatusBadRequest, "ALREADY_FAILED", "任务已失败")
		default:
			return errorResponse(c, http.StatusInternalServerError, "CANCEL_FAILED", "取消任务失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"message": "任务已取消",
		"task_id": taskID,
	})
}

// List 获取任务列表
// GET /api/v1/creative/generate
// @Summary 获取生成任务列表
// @Description 获取当前用户的生成任务列表，支持分页和筛选
// @Tags Creative Tasks
// @Produce json
// @Security BearerAuth
// @Param template_id query string false "模板 ID 筛选"
// @Param status query string false "状态筛选 (pending/processing/completed/failed/cancelled)"
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(20)
// @Param sort query string false "排序方式 (newest/oldest)" default(newest)
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/creative/generate [get]
func (h *CreativeTaskHandler) List(c echo.Context) error {
	// 获取当前用户
	userIDStr := middleware.GetUserID(c)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "UNAUTHORIZED", "请先登录")
	}

	// 解析分页参数
	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	// 构建查询参数
	params := repository.CreativeTaskListParams{
		Page:     page,
		PageSize: pageSize,
		Sort:     c.QueryParam("sort"),
	}

	// 模板筛选
	if templateIDStr := c.QueryParam("template_id"); templateIDStr != "" {
		if templateID, err := uuid.Parse(templateIDStr); err == nil {
			params.TemplateID = &templateID
		}
	}

	// 状态筛选
	if statusStr := c.QueryParam("status"); statusStr != "" {
		status := entity.CreativeTaskStatus(statusStr)
		params.Status = &status
	}

	// 调用服务
	tasks, total, err := h.taskService.List(c.Request().Context(), userID, params)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取任务列表失败")
	}

	// 转换响应
	items := make([]TaskResponse, len(tasks))
	for i, task := range tasks {
		items[i] = h.buildTaskResponse(&task)
	}

	return successResponseWithMeta(c, map[string]interface{}{
		"tasks": items,
	}, map[string]interface{}{
		"total":       total,
		"page":        page,
		"page_size":   pageSize,
		"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
	})
}

// ================== 辅助方法 ==================

// startTaskExecution 启动任务执行 (异步)
func (h *CreativeTaskHandler) startTaskExecution(taskID, userID uuid.UUID) {
	ctx := context.Background()

	// 启动执行
	if err := h.taskService.StartExecution(ctx, taskID); err != nil {
		h.taskService.MarkFailed(ctx, taskID, err.Error())
		return
	}

	// 如果有生成器，启动生成
	if h.generator != nil {
		if err := h.generator.StartTask(ctx, taskID.String()); err != nil {
			h.taskService.MarkFailed(ctx, taskID, err.Error())
		}
	}
}

// buildTaskResponse 构建任务响应
func (h *CreativeTaskHandler) buildTaskResponse(task *entity.CreativeTask) TaskResponse {
	resp := TaskResponse{
		ID:                task.ID,
		TemplateID:        task.TemplateID,
		Status:            task.Status,
		Progress:          task.Progress,
		TotalSections:     task.TotalSections,
		CompletedSections: task.CompletedSections,
		CurrentSection:    task.CurrentSection,
		ErrorMessage:      task.ErrorMessage,
		TokenUsage:        task.TokenUsage,
		CreatedAt:         task.CreatedAt.Format(time.RFC3339),
	}

	if task.Template != nil {
		resp.TemplateName = task.Template.Name
	}

	if task.StartedAt != nil {
		s := task.StartedAt.Format(time.RFC3339)
		resp.StartedAt = &s
	}

	if task.CompletedAt != nil {
		s := task.CompletedAt.Format(time.RFC3339)
		resp.CompletedAt = &s
	}

	return resp
}

// buildTaskDetailResponse 构建任务详情响应
func (h *CreativeTaskHandler) buildTaskDetailResponse(task *entity.CreativeTask) TaskDetailResponse {
	return TaskDetailResponse{
		TaskResponse:   h.buildTaskResponse(task),
		Inputs:         task.Inputs,
		Sections:       task.Sections,
		OutputMarkdown: task.OutputMarkdown,
		OutputMetadata: task.OutputMetadata,
	}
}

// sendSSEEvent 发送 SSE 事件
func (h *CreativeTaskHandler) sendSSEEvent(c echo.Context, eventType string, data interface{}) {
	c.Response().Write([]byte("event: " + eventType + "\n"))
	c.Response().Write([]byte("data: "))
	c.JSON(http.StatusOK, data)
	c.Response().Write([]byte("\n\n"))
}
