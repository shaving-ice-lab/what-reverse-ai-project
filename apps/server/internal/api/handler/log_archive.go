package handler

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type LogArchiveHandler struct {
	logArchiveService service.LogArchiveService
}

func NewLogArchiveHandler(logArchiveService service.LogArchiveService) *LogArchiveHandler {
	return &LogArchiveHandler{logArchiveService: logArchiveService}
}

type LogArchiveRequest struct {
	ArchiveType string  `json:"archive_type"`
	RangeStart  *string `json:"range_start,omitempty"`
	RangeEnd    *string `json:"range_end,omitempty"`
}

type LogArchiveJobResponse struct {
	ID          string  `json:"id"`
	Workspace   string  `json:"workspace_id"`
	Status      string  `json:"status"`
	ArchiveType string  `json:"archive_type"`
	RangeStart  *string `json:"range_start,omitempty"`
	RangeEnd    *string `json:"range_end,omitempty"`
	FileName    *string `json:"file_name,omitempty"`
	FileSize    *int64  `json:"file_size,omitempty"`
	Error       *string `json:"error,omitempty"`
	CreatedAt   string  `json:"created_at"`
	StartedAt   *string `json:"started_at,omitempty"`
	CompletedAt *string `json:"completed_at,omitempty"`
	ExpiresAt   *string `json:"expires_at,omitempty"`
	DownloadURL *string `json:"download_url,omitempty"`
}

type LogArchiveReplayResponse struct {
	Records    []map[string]interface{} `json:"records"`
	NextOffset *int                     `json:"next_offset,omitempty"`
}

// Request 创建日志归档任务
func (h *LogArchiveHandler) Request(c echo.Context) error {
	if h.logArchiveService == nil {
		return errorResponse(c, http.StatusServiceUnavailable, "ARCHIVE_UNAVAILABLE", "归档服务暂不可用")
	}
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}
	var req LogArchiveRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}
	rangeStart, err := parseArchiveTime(req.RangeStart)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_RANGE_START", "归档开始时间无效")
	}
	rangeEnd, err := parseArchiveTime(req.RangeEnd)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_RANGE_END", "归档结束时间无效")
	}
	job, err := h.logArchiveService.RequestArchive(c.Request().Context(), workspaceID, uid, service.LogArchiveRequest{
		ArchiveType: strings.TrimSpace(req.ArchiveType),
		RangeStart:  rangeStart,
		RangeEnd:    rangeEnd,
	})
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限发起归档")
		case service.ErrLogArchiveDisabled:
			return errorResponse(c, http.StatusServiceUnavailable, "ARCHIVE_DISABLED", "日志归档已禁用")
		case service.ErrLogArchiveInvalidRange, service.ErrLogArchiveUnsupported:
			return errorResponse(c, http.StatusBadRequest, "INVALID_ARCHIVE", "归档参数无效")
		case service.ErrWorkspaceExportUnavailable:
			return errorResponse(c, http.StatusServiceUnavailable, "ARCHIVE_UNAVAILABLE", "归档服务暂不可用")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ARCHIVE_REQUEST_FAILED", "创建归档任务失败")
		}
	}
	return successResponse(c, map[string]interface{}{
		"archive": buildLogArchiveJobResponse(job),
	})
}

// List 获取归档任务列表
func (h *LogArchiveHandler) List(c echo.Context) error {
	if h.logArchiveService == nil {
		return errorResponse(c, http.StatusServiceUnavailable, "ARCHIVE_UNAVAILABLE", "归档服务暂不可用")
	}
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}
	archiveType := c.QueryParam("archive_type")
	jobs, err := h.logArchiveService.ListArchives(c.Request().Context(), workspaceID, uid, service.LogArchiveListParams{
		ArchiveType: archiveType,
	})
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限查看归档")
		case service.ErrLogArchiveUnsupported:
			return errorResponse(c, http.StatusBadRequest, "INVALID_ARCHIVE", "归档类型无效")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ARCHIVE_LIST_FAILED", "获取归档任务失败")
		}
	}
	resp := make([]LogArchiveJobResponse, 0, len(jobs))
	for _, job := range jobs {
		resp = append(resp, buildLogArchiveJobResponse(&job))
	}
	return successResponse(c, map[string]interface{}{
		"archives": resp,
		"total":    len(resp),
	})
}

// Get 获取归档任务详情
func (h *LogArchiveHandler) Get(c echo.Context) error {
	if h.logArchiveService == nil {
		return errorResponse(c, http.StatusServiceUnavailable, "ARCHIVE_UNAVAILABLE", "归档服务暂不可用")
	}
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}
	archiveID, err := uuid.Parse(c.Param("archiveId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ARCHIVE_ID", "归档任务 ID 无效")
	}
	job, err := h.logArchiveService.GetArchive(c.Request().Context(), workspaceID, archiveID, uid)
	if err != nil {
		switch err {
		case service.ErrLogArchiveNotFound:
			return errorResponse(c, http.StatusNotFound, "ARCHIVE_NOT_FOUND", "归档任务不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限查看归档")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ARCHIVE_FETCH_FAILED", "获取归档任务失败")
		}
	}
	return successResponse(c, map[string]interface{}{
		"archive": buildLogArchiveJobResponse(job),
	})
}

// Download 下载归档包
func (h *LogArchiveHandler) Download(c echo.Context) error {
	if h.logArchiveService == nil {
		return errorResponse(c, http.StatusServiceUnavailable, "ARCHIVE_UNAVAILABLE", "归档服务暂不可用")
	}
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}
	archiveID, err := uuid.Parse(c.Param("archiveId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ARCHIVE_ID", "归档任务 ID 无效")
	}
	download, err := h.logArchiveService.Download(c.Request().Context(), workspaceID, archiveID, uid)
	if err != nil {
		switch err {
		case service.ErrLogArchiveNotFound:
			return errorResponse(c, http.StatusNotFound, "ARCHIVE_NOT_FOUND", "归档任务不存在")
		case service.ErrLogArchiveNotReady:
			return errorResponse(c, http.StatusConflict, "ARCHIVE_NOT_READY", "归档任务尚未完成")
		case service.ErrLogArchiveExpired:
			return errorResponse(c, http.StatusGone, "ARCHIVE_EXPIRED", "归档包已过期")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限下载归档包")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ARCHIVE_DOWNLOAD_FAILED", "下载归档包失败")
		}
	}
	return c.Attachment(download.FilePath, download.FileName)
}

// Replay 归档回放
func (h *LogArchiveHandler) Replay(c echo.Context) error {
	if h.logArchiveService == nil {
		return errorResponse(c, http.StatusServiceUnavailable, "ARCHIVE_UNAVAILABLE", "归档服务暂不可用")
	}
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}
	archiveID, err := uuid.Parse(c.Param("archiveId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ARCHIVE_ID", "归档任务 ID 无效")
	}

	from, err := parseQueryTime(c.QueryParam("from"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_FROM", "起始时间无效")
	}
	to, err := parseQueryTime(c.QueryParam("to"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TO", "结束时间无效")
	}
	action := strings.TrimSpace(c.QueryParam("action"))
	targetType := strings.TrimSpace(c.QueryParam("target_type"))
	workflowIDRaw := strings.TrimSpace(c.QueryParam("workflow_id"))
	userIDRaw := strings.TrimSpace(c.QueryParam("user_id"))
	nodeID := strings.TrimSpace(c.QueryParam("node_id"))
	nodeType := strings.TrimSpace(c.QueryParam("node_type"))
	status := strings.TrimSpace(c.QueryParam("status"))
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	offset, _ := strconv.Atoi(c.QueryParam("offset"))
	var executionID *uuid.UUID
	if raw := strings.TrimSpace(c.QueryParam("execution_id")); raw != "" {
		parsed, err := uuid.Parse(raw)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_EXECUTION_ID", "执行 ID 无效")
		}
		executionID = &parsed
	}
	var workflowID *uuid.UUID
	if workflowIDRaw != "" {
		parsed, err := uuid.Parse(workflowIDRaw)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_WORKFLOW_ID", "工作流 ID 无效")
		}
		workflowID = &parsed
	}
	var filterUserID *uuid.UUID
	if userIDRaw != "" {
		parsed, err := uuid.Parse(userIDRaw)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
		}
		filterUserID = &parsed
	}
	var actorUserID *uuid.UUID
	if raw := strings.TrimSpace(c.QueryParam("actor_user_id")); raw != "" {
		parsed, err := uuid.Parse(raw)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_ACTOR_ID", "操作人 ID 无效")
		}
		actorUserID = &parsed
	}
	var targetID *uuid.UUID
	if raw := strings.TrimSpace(c.QueryParam("target_id")); raw != "" {
		parsed, err := uuid.Parse(raw)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_TARGET_ID", "目标 ID 无效")
		}
		targetID = &parsed
	}
	result, err := h.logArchiveService.Replay(c.Request().Context(), workspaceID, archiveID, uid, service.LogArchiveReplayParams{
		Dataset:     strings.TrimSpace(c.QueryParam("dataset")),
		From:        from,
		To:          to,
		Limit:       limit,
		Offset:      offset,
		ExecutionID: executionID,
		Action:      action,
		ActorUserID: actorUserID,
		TargetType:  targetType,
		TargetID:    targetID,
		WorkflowID:  workflowID,
		UserID:      filterUserID,
		NodeID:      nodeID,
		NodeType:    nodeType,
		Status:      status,
	})
	if err != nil {
		switch err {
		case service.ErrLogArchiveNotFound:
			return errorResponse(c, http.StatusNotFound, "ARCHIVE_NOT_FOUND", "归档任务不存在")
		case service.ErrLogArchiveNotReady:
			return errorResponse(c, http.StatusConflict, "ARCHIVE_NOT_READY", "归档任务尚未完成")
		case service.ErrLogArchiveExpired:
			return errorResponse(c, http.StatusGone, "ARCHIVE_EXPIRED", "归档包已过期")
		case service.ErrLogArchiveDatasetInvalid:
			return errorResponse(c, http.StatusBadRequest, "INVALID_DATASET", "回放数据集无效")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ARCHIVE_REPLAY_FAILED", "归档回放失败")
		}
	}
	return successResponse(c, LogArchiveReplayResponse{
		Records:    result.Records,
		NextOffset: result.NextOffset,
	})
}

// Delete 删除归档包
func (h *LogArchiveHandler) Delete(c echo.Context) error {
	if h.logArchiveService == nil {
		return errorResponse(c, http.StatusServiceUnavailable, "ARCHIVE_UNAVAILABLE", "归档服务暂不可用")
	}
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}
	archiveID, err := uuid.Parse(c.Param("archiveId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ARCHIVE_ID", "归档任务 ID 无效")
	}
	if err := h.logArchiveService.DeleteArchive(c.Request().Context(), workspaceID, archiveID, uid); err != nil {
		switch err {
		case service.ErrLogArchiveNotFound:
			return errorResponse(c, http.StatusNotFound, "ARCHIVE_NOT_FOUND", "归档任务不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限删除归档包")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ARCHIVE_DELETE_FAILED", "删除归档包失败")
		}
	}
	return successResponse(c, map[string]interface{}{
		"message": "归档包已删除",
	})
}

func buildLogArchiveJobResponse(job *entity.WorkspaceExportJob) LogArchiveJobResponse {
	resp := LogArchiveJobResponse{
		ID:          job.ID.String(),
		Workspace:   job.WorkspaceID.String(),
		Status:      string(job.Status),
		ArchiveType: logArchiveTypeLabel(job.ExportType),
		FileName:    job.FileName,
		FileSize:    job.FileSize,
		Error:       job.ErrorMessage,
		CreatedAt:   job.CreatedAt.Format(time.RFC3339),
	}
	if job.ArchiveRangeStart != nil {
		t := job.ArchiveRangeStart.Format(time.RFC3339)
		resp.RangeStart = &t
	}
	if job.ArchiveRangeEnd != nil {
		t := job.ArchiveRangeEnd.Format(time.RFC3339)
		resp.RangeEnd = &t
	}
	if job.StartedAt != nil {
		t := job.StartedAt.Format(time.RFC3339)
		resp.StartedAt = &t
	}
	if job.CompletedAt != nil {
		t := job.CompletedAt.Format(time.RFC3339)
		resp.CompletedAt = &t
	}
	if job.ExpiresAt != nil {
		t := job.ExpiresAt.Format(time.RFC3339)
		resp.ExpiresAt = &t
	}
	if job.Status == entity.WorkspaceExportStatusCompleted {
		downloadURL := "/api/v1/workspaces/" + job.WorkspaceID.String() + "/log-archives/" + job.ID.String() + "/download"
		resp.DownloadURL = &downloadURL
	}
	return resp
}

func logArchiveTypeLabel(value entity.WorkspaceExportJobType) string {
	switch value {
	case entity.WorkspaceExportTypeExecutionLogArchive:
		return "execution_logs"
	case entity.WorkspaceExportTypeAuditLogArchive:
		return "audit_logs"
	default:
		return string(value)
	}
}

func parseArchiveTime(value *string) (*time.Time, error) {
	if value == nil {
		return nil, nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil, nil
	}
	t, err := time.Parse(time.RFC3339, trimmed)
	if err != nil {
		return nil, err
	}
	utc := t.UTC()
	return &utc, nil
}

func parseQueryTime(raw string) (*time.Time, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return nil, nil
	}
	t, err := time.Parse(time.RFC3339, trimmed)
	if err != nil {
		return nil, err
	}
	utc := t.UTC()
	return &utc, nil
}
