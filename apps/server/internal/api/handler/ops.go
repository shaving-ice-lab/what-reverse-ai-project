package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/domain/entity"
	taskqueue "github.com/agentflow/server/internal/pkg/queue"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// OpsHandler 运维与发布辅助处理器
type OpsHandler struct {
	opsService service.OpsService
	taskQueue  *taskqueue.Queue
}

// NewOpsHandler 创建运维处理器
func NewOpsHandler(opsService service.OpsService, taskQueue *taskqueue.Queue) *OpsHandler {
	return &OpsHandler{opsService: opsService, taskQueue: taskQueue}
}

// TriggerAlertTestRequest 告警演练请求
type TriggerAlertTestRequest struct {
	Severity string                 `json:"severity"`
	Message  string                 `json:"message"`
	Source   string                 `json:"source"`
	Metadata map[string]interface{} `json:"metadata"`
}

// TriggerAlertTest 触发告警演练
// @Summary 触发告警演练
// @Tags Ops
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body TriggerAlertTestRequest true "告警演练请求"
// @Success 200 {object} service.AlertTestResult
// @Router /api/v1/ops/alerts/test [post]
func (h *OpsHandler) TriggerAlertTest(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req TriggerAlertTestRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	severity := entity.RuntimeEventSeverity(strings.ToLower(strings.TrimSpace(req.Severity)))
	result, err := h.opsService.TriggerAlertTest(c.Request().Context(), service.AlertTestRequest{
		Severity: severity,
		Message:  strings.TrimSpace(req.Message),
		Source:   strings.TrimSpace(req.Source),
		Metadata: entity.JSON(req.Metadata),
		UserID:   &uid,
	})
	if err != nil {
		switch err {
		case service.ErrInvalidAlertSeverity:
			return errorResponse(c, http.StatusBadRequest, "INVALID_SEVERITY", "告警级别无效")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ALERT_TEST_FAILED", "告警演练触发失败")
		}
	}

	return successResponse(c, result)
}

// ListDeadTasks 列出死信队列任务
func (h *OpsHandler) ListDeadTasks(c echo.Context) error {
	if h.taskQueue == nil {
		return errorResponse(c, http.StatusServiceUnavailable, "QUEUE_UNAVAILABLE", "任务队列不可用")
	}
	queueName := strings.TrimSpace(c.QueryParam("queue"))
	if queueName == "" {
		queueName = taskqueue.QueueExecution
	}
	page := parsePage(c.QueryParam("page"), 1)
	pageSize := parsePageSize(c.QueryParam("page_size"), 20)
	tasks, err := h.taskQueue.ListDeadTasks(queueName, page, pageSize)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "QUEUE_LIST_FAILED", "获取死信队列失败")
	}
	return successResponse(c, map[string]interface{}{
		"queue":     queueName,
		"page":      page,
		"page_size": pageSize,
		"tasks":     tasks,
	})
}

// RetryDeadTask 重放死信队列任务
func (h *OpsHandler) RetryDeadTask(c echo.Context) error {
	if h.taskQueue == nil {
		return errorResponse(c, http.StatusServiceUnavailable, "QUEUE_UNAVAILABLE", "任务队列不可用")
	}
	queueName := strings.TrimSpace(c.QueryParam("queue"))
	if queueName == "" {
		queueName = taskqueue.QueueExecution
	}
	taskID := strings.TrimSpace(c.Param("taskId"))
	if taskID == "" {
		return errorResponse(c, http.StatusBadRequest, "TASK_ID_REQUIRED", "任务 ID 不能为空")
	}
	if err := h.taskQueue.RetryDeadTask(queueName, taskID); err != nil {
		return errorResponse(c, http.StatusInternalServerError, "QUEUE_RETRY_FAILED", "重放任务失败")
	}
	return successResponse(c, map[string]interface{}{
		"queue":    queueName,
		"task_id":  taskID,
		"replayed": true,
	})
}

// DeleteDeadTask 删除死信队列任务
func (h *OpsHandler) DeleteDeadTask(c echo.Context) error {
	if h.taskQueue == nil {
		return errorResponse(c, http.StatusServiceUnavailable, "QUEUE_UNAVAILABLE", "任务队列不可用")
	}
	queueName := strings.TrimSpace(c.QueryParam("queue"))
	if queueName == "" {
		queueName = taskqueue.QueueExecution
	}
	taskID := strings.TrimSpace(c.Param("taskId"))
	if taskID == "" {
		return errorResponse(c, http.StatusBadRequest, "TASK_ID_REQUIRED", "任务 ID 不能为空")
	}
	if err := h.taskQueue.DeleteDeadTask(queueName, taskID); err != nil {
		return errorResponse(c, http.StatusInternalServerError, "QUEUE_DELETE_FAILED", "删除任务失败")
	}
	return successResponse(c, map[string]interface{}{
		"queue":   queueName,
		"task_id": taskID,
		"deleted": true,
	})
}

func parsePage(value string, fallback int) int {
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil || parsed <= 0 {
		return fallback
	}
	return parsed
}

func parsePageSize(value string, fallback int) int {
	parsed := parsePage(value, fallback)
	if parsed > 100 {
		return 100
	}
	return parsed
}
