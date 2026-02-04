package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/idempotency"
	"github.com/agentflow/server/internal/repository"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type AppHandler struct {
	appService      service.AppService
	auditLogService service.AuditLogService
}

func NewAppHandler(appService service.AppService, auditLogService service.AuditLogService) *AppHandler {
	return &AppHandler{
		appService:      appService,
		auditLogService: auditLogService,
	}
}

type CreateAppRequest struct {
	WorkspaceID string  `json:"workspace_id"`
	Name        string  `json:"name"`
	Slug        string  `json:"slug"`
	Icon        string  `json:"icon"`
	Description *string `json:"description"`
}

type CreateAppFromWorkflowRequest struct {
	WorkspaceID string                 `json:"workspace_id"`
	WorkflowID  string                 `json:"workflow_id"`
	Name        string                 `json:"name"`
	Slug        string                 `json:"slug"`
	Icon        string                 `json:"icon"`
	Description *string                `json:"description"`
	UISchema    map[string]interface{} `json:"ui_schema"`
}

type CreateAppFromAIRequest struct {
	WorkspaceID string `json:"workspace_id"`
	Description string `json:"description"`
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Icon        string `json:"icon"`
}

type UpdateAppRequest struct {
	Name        *string `json:"name"`
	Slug        *string `json:"slug"`
	Icon        *string `json:"icon"`
	Description *string `json:"description"`
}

type CreateAppVersionRequest struct {
	WorkflowID *string                `json:"workflow_id"`
	Changelog  *string                `json:"changelog"`
	UISchema   map[string]interface{} `json:"ui_schema"`
	DBSchema   map[string]interface{} `json:"db_schema"`
	ConfigJSON map[string]interface{} `json:"config_json"`
	Source     *string                `json:"source"`
}

type PublishAppRequest struct {
	VersionID    *string                       `json:"version_id"`
	AccessPolicy *UpdateAppAccessPolicyRequest `json:"access_policy"`
	RateLimit    map[string]interface{}        `json:"rate_limit"`
}

type RollbackAppRequest struct {
	VersionID string `json:"version_id"`
}

type SubmitDBSchemaReviewRequest struct {
	VersionID *string `json:"version_id"`
	Note      *string `json:"note"`
}

type ApproveDBSchemaReviewRequest struct {
	VersionID *string `json:"version_id"`
	Note      *string `json:"note"`
}

type RejectDBSchemaReviewRequest struct {
	VersionID *string `json:"version_id"`
	Reason    *string `json:"reason"`
}

type SubmitMajorChangeReviewRequest struct {
	VersionID *string `json:"version_id"`
	Note      *string `json:"note"`
}

type ApproveMajorChangeReviewRequest struct {
	VersionID *string `json:"version_id"`
	Note      *string `json:"note"`
}

type RejectMajorChangeReviewRequest struct {
	VersionID *string `json:"version_id"`
	Reason    *string `json:"reason"`
}

type RollbackDBSchemaRequest struct {
	TargetVersionID *string `json:"target_version_id"`
	BaseVersionID   *string `json:"base_version_id"`
	Changelog       *string `json:"changelog"`
}

type UpdateAppAccessPolicyRequest struct {
	AccessMode         *string                `json:"access_mode"`
	DataClassification *string                `json:"data_classification"`
	RateLimitJSON      map[string]interface{} `json:"rate_limit_json"`
	AllowedOrigins     []string               `json:"allowed_origins"`
	RequireCaptcha     *bool                  `json:"require_captcha"`
}

type UpdateAppPublicBrandingRequest struct {
	Branding map[string]interface{} `json:"branding"`
	Theme    map[string]interface{} `json:"theme"`
}

type UpdateAppPublicSEORequest struct {
	SEO map[string]interface{} `json:"seo"`
}

type UpdateAppPublicInputsRequest struct {
	Template map[string]interface{} `json:"template"`
	Defaults map[string]interface{} `json:"defaults"`
}

type UpdateAppUISchemaRequest struct {
	UISchema map[string]interface{} `json:"ui_schema"`
}

type AppVersionListParams struct {
	Page     int `query:"page"`
	PageSize int `query:"page_size"`
}

type AppExecutionResponse struct {
	ID           uuid.UUID   `json:"id"`
	AppID        uuid.UUID   `json:"app_id"`
	WorkflowID   uuid.UUID   `json:"workflow_id"`
	SessionID    *string     `json:"session_id,omitempty"`
	Status       string      `json:"status"`
	Inputs       entity.JSON `json:"inputs,omitempty"`
	Outputs      entity.JSON `json:"outputs,omitempty"`
	ErrorMessage *string     `json:"error_message,omitempty"`
	DurationMs   *int        `json:"duration_ms,omitempty"`
	StartedAt    *time.Time  `json:"started_at,omitempty"`
	CompletedAt  *time.Time  `json:"completed_at,omitempty"`
	CreatedAt    time.Time   `json:"created_at"`
}

func toAppExecutionResponse(appID uuid.UUID, execution entity.Execution) AppExecutionResponse {
	return AppExecutionResponse{
		ID:           execution.ID,
		AppID:        appID,
		WorkflowID:   execution.WorkflowID,
		Status:       execution.Status,
		Inputs:       execution.Inputs,
		Outputs:      execution.Outputs,
		ErrorMessage: execution.ErrorMessage,
		DurationMs:   execution.DurationMs,
		StartedAt:    execution.StartedAt,
		CompletedAt:  execution.CompletedAt,
		CreatedAt:    execution.CreatedAt,
	}
}

// List 获取 App 列表
func (h *AppHandler) List(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	var workspaceID *uuid.UUID
	if workspaceParam := c.QueryParam("workspace_id"); workspaceParam != "" {
		parsed, err := uuid.Parse(workspaceParam)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "WORKSPACE_INVALID_ID", "工作空间 ID 无效")
		}
		workspaceID = &parsed
	}

	params := repository.AppListParams{
		WorkspaceID: workspaceID,
		Search:      c.QueryParam("search"),
		Status:      c.QueryParam("status"),
		Sort:        c.QueryParam("sort"),
		Order:       c.QueryParam("order"),
		Page:        page,
		PageSize:    pageSize,
	}

	apps, total, err := h.appService.List(c.Request().Context(), uid, params)
	if err != nil {
		switch err {
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限查看 App 列表")
		case service.ErrAppWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "WORKSPACE_NOT_FOUND", "工作空间不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取 App 列表失败")
		}
	}

	return successResponseWithMeta(c, apps, map[string]interface{}{
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// Create 创建 App
func (h *AppHandler) Create(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req CreateAppRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}
	if req.WorkspaceID == "" {
		return errorResponse(c, http.StatusBadRequest, "WORKSPACE_ID_REQUIRED", "工作空间 ID 不能为空")
	}
	if req.Name == "" {
		return errorResponse(c, http.StatusBadRequest, "NAME_REQUIRED", "App 名称不能为空")
	}

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "WORKSPACE_INVALID_ID", "工作空间 ID 无效")
	}

	ctx := idempotency.WithKey(c.Request().Context(), middleware.GetIdempotencyKey(c))
	app, err := h.appService.Create(ctx, uid, service.CreateAppRequest{
		WorkspaceID: workspaceID,
		Name:        req.Name,
		Slug:        req.Slug,
		Icon:        req.Icon,
		Description: req.Description,
	})
	if err != nil {
		switch err {
		case service.ErrAppInvalidName, service.ErrAppInvalidSlug, service.ErrAppInvalidWorkspace:
			return errorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "App 参数无效")
		case service.ErrAppWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "WORKSPACE_NOT_FOUND", "工作空间不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限创建 App")
		case service.ErrAppSlugExists:
			return errorResponse(c, http.StatusConflict, "SLUG_EXISTS", "App Slug 已存在")
		case service.ErrAppQuotaExceeded:
			return errorResponse(c, http.StatusForbidden, "QUOTA_EXCEEDED", "App 数量已达到上限")
		case service.ErrIdempotencyConflict:
			return errorResponse(c, http.StatusConflict, "IDEMPOTENCY_CONFLICT", "幂等键与请求不一致")
		case service.ErrIdempotencyInProgress:
			return errorResponse(c, http.StatusConflict, "IDEMPOTENCY_IN_PROGRESS", "幂等请求处理中")
		default:
			return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "创建 App 失败")
		}
	}

	h.recordAudit(c, app.WorkspaceID, uid, "app.create", "app", &app.ID, entity.JSON{
		"name":   app.Name,
		"slug":   app.Slug,
		"status": app.Status,
	})

	return successResponse(c, map[string]interface{}{
		"app": app,
	})
}

// CreateFromWorkflow 从工作流创建 App
func (h *AppHandler) CreateFromWorkflow(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req CreateAppFromWorkflowRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}
	if req.WorkspaceID == "" || req.WorkflowID == "" {
		return errorResponse(c, http.StatusBadRequest, "WORKFLOW_REQUIRED", "工作空间与工作流 ID 不能为空")
	}

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "WORKSPACE_INVALID_ID", "工作空间 ID 无效")
	}
	workflowID, err := uuid.Parse(req.WorkflowID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_WORKFLOW_ID", "工作流 ID 无效")
	}

	var uiSchema *entity.JSON
	if len(req.UISchema) > 0 {
		value := entity.JSON(req.UISchema)
		uiSchema = &value
	}

	ctx := idempotency.WithKey(c.Request().Context(), middleware.GetIdempotencyKey(c))
	app, err := h.appService.CreateFromWorkflow(ctx, uid, service.CreateAppFromWorkflowRequest{
		WorkspaceID: workspaceID,
		WorkflowID:  workflowID,
		Name:        req.Name,
		Slug:        req.Slug,
		Icon:        req.Icon,
		Description: req.Description,
		UISchema:    uiSchema,
	})
	if err != nil {
		switch err {
		case service.ErrAppInvalidName, service.ErrAppInvalidSlug, service.ErrAppInvalidWorkspace:
			return errorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "App 参数无效")
		case service.ErrAppWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "WORKSPACE_NOT_FOUND", "工作空间不存在")
		case service.ErrAppWorkflowNotFound:
			return errorResponse(c, http.StatusNotFound, "WORKFLOW_NOT_FOUND", "工作流不存在")
		case service.ErrAppWorkflowWorkspaceMismatch:
			return errorResponse(c, http.StatusBadRequest, "WORKFLOW_MISMATCH", "工作流不属于该工作空间")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限创建 App")
		case service.ErrAppSlugExists:
			return errorResponse(c, http.StatusConflict, "SLUG_EXISTS", "App Slug 已存在")
		case service.ErrAppQuotaExceeded:
			return errorResponse(c, http.StatusForbidden, "QUOTA_EXCEEDED", "App 数量已达到上限")
		case service.ErrIdempotencyConflict:
			return errorResponse(c, http.StatusConflict, "IDEMPOTENCY_CONFLICT", "幂等键与请求不一致")
		case service.ErrIdempotencyInProgress:
			return errorResponse(c, http.StatusConflict, "IDEMPOTENCY_IN_PROGRESS", "幂等请求处理中")
		default:
			return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "创建 App 失败")
		}
	}

	h.recordAudit(c, app.WorkspaceID, uid, "app.create_from_workflow", "app", &app.ID, entity.JSON{
		"name":        app.Name,
		"slug":        app.Slug,
		"workflow_id": workflowID.String(),
	})

	return successResponse(c, map[string]interface{}{
		"app": app,
	})
}

// CreateFromAI 从 AI 生成创建 App
func (h *AppHandler) CreateFromAI(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req CreateAppFromAIRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}
	if req.WorkspaceID == "" || req.Description == "" {
		return errorResponse(c, http.StatusBadRequest, "DESCRIPTION_REQUIRED", "工作空间与描述不能为空")
	}

	workspaceID, err := uuid.Parse(req.WorkspaceID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "WORKSPACE_INVALID_ID", "工作空间 ID 无效")
	}

	ctx := idempotency.WithKey(c.Request().Context(), middleware.GetIdempotencyKey(c))
	app, err := h.appService.CreateFromAI(ctx, uid, service.CreateAppFromAIRequest{
		WorkspaceID: workspaceID,
		Description: req.Description,
		Name:        req.Name,
		Slug:        req.Slug,
		Icon:        req.Icon,
	})
	if err != nil {
		switch err {
		case service.ErrAppInvalidName, service.ErrAppInvalidSlug, service.ErrAppInvalidWorkspace, service.ErrAppInvalidDescription:
			return errorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "App 参数无效")
		case service.ErrAppWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "WORKSPACE_NOT_FOUND", "工作空间不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限创建 App")
		case service.ErrAppSlugExists:
			return errorResponse(c, http.StatusConflict, "SLUG_EXISTS", "App Slug 已存在")
		case service.ErrAppQuotaExceeded:
			return errorResponse(c, http.StatusForbidden, "QUOTA_EXCEEDED", "App 数量已达到上限")
		case service.ErrAppAIGenerationFailed, service.ErrAppInvalidWorkflow:
			return errorResponse(c, http.StatusBadRequest, "AI_FAILED", "AI 生成失败")
		case service.ErrIdempotencyConflict:
			return errorResponse(c, http.StatusConflict, "IDEMPOTENCY_CONFLICT", "幂等键与请求不一致")
		case service.ErrIdempotencyInProgress:
			return errorResponse(c, http.StatusConflict, "IDEMPOTENCY_IN_PROGRESS", "幂等请求处理中")
		default:
			return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "创建 App 失败")
		}
	}

	h.recordAudit(c, app.WorkspaceID, uid, "app.create_from_ai", "app", &app.ID, entity.JSON{
		"name":        app.Name,
		"slug":        app.Slug,
		"description": req.Description,
	})

	return successResponse(c, map[string]interface{}{
		"app": app,
	})
}

// Get 获取 App 详情
func (h *AppHandler) Get(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "App ID 无效")
	}

	app, err := h.appService.GetByID(c.Request().Context(), appID, uid)
	if err != nil {
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "App 不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问 App")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取 App 失败")
		}
	}

	h.recordAudit(c, app.WorkspaceID, uid, "app.publish", "app", &app.ID, entity.JSON{
		"version_id": app.CurrentVersionID,
		"status":     app.Status,
	})

	return successResponse(c, map[string]interface{}{
		"app": app,
	})
}

// ExportConfig 导出 App 配置
func (h *AppHandler) ExportConfig(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "App ID 无效")
	}

	exportData, err := h.appService.ExportConfig(c.Request().Context(), uid, appID)
	if err != nil {
		h.recordAuditForApp(c, uid, appID, "app.export", "app", &appID, entity.JSON{
			"status": "failed",
			"error":  err.Error(),
		})
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "APP_NOT_FOUND", "App 不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限导出 App 配置")
		case service.ErrAppVersionNotFound:
			return errorResponse(c, http.StatusNotFound, "VERSION_NOT_FOUND", "版本不存在")
		case service.ErrAppVersionMismatch:
			return errorResponse(c, http.StatusBadRequest, "VERSION_MISMATCH", "版本不属于该 App")
		default:
			return errorResponse(c, http.StatusInternalServerError, "EXPORT_FAILED", "导出配置失败")
		}
	}

	slug := strings.TrimSpace(exportData.App.Slug)
	if slug == "" {
		slug = exportData.App.ID.String()
	}
	slug = strings.ReplaceAll(slug, " ", "-")
	filename := fmt.Sprintf("app-%s-config.json", slug)

	h.recordAudit(c, exportData.App.WorkspaceID, uid, "app.export", "app", &appID, entity.JSON{
		"filename":    filename,
		"exported_at": exportData.ExportedAt,
		"app_name":    exportData.App.Name,
	})

	return successResponse(c, map[string]interface{}{
		"export":   exportData,
		"filename": filename,
	})
}

// Update 更新 App 基础信息
func (h *AppHandler) Update(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "App ID 无效")
	}

	var req UpdateAppRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	app, err := h.appService.Update(c.Request().Context(), uid, appID, service.UpdateAppRequest{
		Name:        req.Name,
		Slug:        req.Slug,
		Icon:        req.Icon,
		Description: req.Description,
	})
	if err != nil {
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "App 不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限更新 App")
		case service.ErrAppInvalidName, service.ErrAppInvalidSlug:
			return errorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "App 更新字段无效")
		case service.ErrAppSlugExists:
			return errorResponse(c, http.StatusConflict, "SLUG_EXISTS", "App Slug 已存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新 App 失败")
		}
	}

	changed := []string{}
	if req.Name != nil {
		changed = append(changed, "name")
	}
	if req.Slug != nil {
		changed = append(changed, "slug")
	}
	if req.Icon != nil {
		changed = append(changed, "icon")
	}
	if req.Description != nil {
		changed = append(changed, "description")
	}
	h.recordAuditForApp(c, uid, appID, "app.update", "app", &appID, entity.JSON{
		"fields": changed,
	})

	return successResponse(c, map[string]interface{}{
		"app": app,
	})
}

// GetAccessPolicy 获取 App 访问策略
func (h *AppHandler) GetAccessPolicy(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "App ID 无效")
	}

	policy, err := h.appService.GetAccessPolicy(c.Request().Context(), uid, appID)
	if err != nil {
		switch err {
		case service.ErrAppNotFound, service.ErrAppPolicyNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "App 访问策略不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问 App")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取 App 访问策略失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"access_policy": policy,
	})
}

// UpdateAccessPolicy 更新 App 访问策略
func (h *AppHandler) UpdateAccessPolicy(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "App ID 无效")
	}

	var req UpdateAppAccessPolicyRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	policy, err := h.appService.UpdateAccessPolicy(c.Request().Context(), uid, appID, service.UpdateAppAccessPolicyRequest{
		AccessMode:         req.AccessMode,
		DataClassification: req.DataClassification,
		RateLimitJSON:      req.RateLimitJSON,
		AllowedOrigins:     req.AllowedOrigins,
		RequireCaptcha:     req.RequireCaptcha,
	})
	if err != nil {
		switch err {
		case service.ErrAppNotFound, service.ErrAppPolicyNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "App 访问策略不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限更新 App 访问策略")
		case service.ErrAppInvalidAccessMode, service.ErrAppInvalidAllowedOrigin, service.ErrAppInvalidDataClassification, service.ErrAppInvalidRateLimitAlgorithm, service.ErrAppInvalidAccessPolicy:
			return errorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "访问策略字段无效")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新 App 访问策略失败")
		}
	}

	h.recordAuditForApp(c, uid, appID, "app.policy.update", "app_access_policy", &policy.ID, entity.JSON{
		"access_mode":         policy.AccessMode,
		"data_classification": policy.DataClassification,
		"require_captcha":     policy.RequireCaptcha,
		"allowed_origins":     policy.AllowedOrigins,
	})

	return successResponse(c, map[string]interface{}{
		"access_policy": policy,
	})
}

// UpdatePublicBranding 更新公开访问页面主题与品牌设置
func (h *AppHandler) UpdatePublicBranding(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "APP_INVALID_ID", "App ID 无效")
	}

	var req UpdateAppPublicBrandingRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	version, err := h.appService.UpdatePublicBranding(c.Request().Context(), uid, appID, service.UpdateAppPublicBrandingRequest{
		Branding: req.Branding,
		Theme:    req.Theme,
	})
	if err != nil {
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "APP_NOT_FOUND", "App 不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限更新 App")
		case service.ErrAppVersionRequired:
			return errorResponse(c, http.StatusBadRequest, "VERSION_REQUIRED", "App 版本未就绪")
		case service.ErrAppInvalidPublicBranding:
			return errorResponse(c, http.StatusBadRequest, "INVALID_BRANDING", "品牌/主题设置无效")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新品牌设置失败")
		}
	}

	h.recordAuditForApp(c, uid, appID, "app.public_branding.update", "app_version", &version.ID, entity.JSON{
		"app_version_id": version.ID,
	})

	return successResponse(c, map[string]interface{}{
		"version": version,
	})
}

// UpdatePublicSEO 更新公开访问 SEO 与元信息
func (h *AppHandler) UpdatePublicSEO(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "APP_INVALID_ID", "App ID 无效")
	}

	var req UpdateAppPublicSEORequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	version, err := h.appService.UpdatePublicSEO(c.Request().Context(), uid, appID, service.UpdateAppPublicSEORequest{
		SEO: req.SEO,
	})
	if err != nil {
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "APP_NOT_FOUND", "App 不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限更新 App")
		case service.ErrAppVersionRequired:
			return errorResponse(c, http.StatusBadRequest, "VERSION_REQUIRED", "App 版本未就绪")
		case service.ErrAppInvalidPublicSEO:
			return errorResponse(c, http.StatusBadRequest, "INVALID_SEO", "SEO 设置无效")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新 SEO 失败")
		}
	}

	h.recordAuditForApp(c, uid, appID, "app.public_seo.update", "app_version", &version.ID, entity.JSON{
		"app_version_id": version.ID,
	})

	return successResponse(c, map[string]interface{}{
		"version": version,
	})
}

// UpdatePublicInputs 更新公开访问的输入模板与默认值
func (h *AppHandler) UpdatePublicInputs(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "APP_INVALID_ID", "App ID 无效")
	}

	var req UpdateAppPublicInputsRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	version, err := h.appService.UpdatePublicInputs(c.Request().Context(), uid, appID, service.UpdateAppPublicInputsRequest{
		Template: req.Template,
		Defaults: req.Defaults,
	})
	if err != nil {
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "APP_NOT_FOUND", "App 不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限更新 App")
		case service.ErrAppVersionRequired:
			return errorResponse(c, http.StatusBadRequest, "VERSION_REQUIRED", "App 版本未就绪")
		case service.ErrAppInvalidPublicInputs:
			return errorResponse(c, http.StatusBadRequest, "INVALID_INPUTS", "输入模板/默认值无效")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新输入模板失败")
		}
	}

	h.recordAuditForApp(c, uid, appID, "app.public_inputs.update", "app_version", &version.ID, entity.JSON{
		"app_version_id": version.ID,
	})

	return successResponse(c, map[string]interface{}{
		"version": version,
	})
}

// UpdateUISchema 更新 UI Schema
func (h *AppHandler) UpdateUISchema(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "APP_INVALID_ID", "App ID 无效")
	}

	var req UpdateAppUISchemaRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	version, err := h.appService.UpdateUISchema(c.Request().Context(), uid, appID, service.UpdateAppUISchemaRequest{
		UISchema: req.UISchema,
	})
	if err != nil {
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "APP_NOT_FOUND", "App 不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限更新 App")
		case service.ErrAppVersionRequired:
			return errorResponse(c, http.StatusBadRequest, "VERSION_REQUIRED", "App 版本未就绪")
		case service.ErrAppInvalidUISchema:
			return errorResponse(c, http.StatusBadRequest, "INVALID_UI_SCHEMA", "UI Schema 无效")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新 UI Schema 失败")
		}
	}

	h.recordAuditForApp(c, uid, appID, "app.ui_schema.update", "app_version", &version.ID, entity.JSON{
		"app_version_id": version.ID,
	})

	return successResponse(c, map[string]interface{}{
		"version": version,
	})
}

// ListVersions 获取 App 版本列表
func (h *AppHandler) ListVersions(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "APP_INVALID_ID", "App ID 无效")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	versions, total, err := h.appService.ListVersions(c.Request().Context(), uid, appID, service.AppVersionListParams{
		Page:     page,
		PageSize: pageSize,
	})
	if err != nil {
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "APP_NOT_FOUND", "App 不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问该 App")
		default:
			return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取 App 版本失败")
		}
	}

	return successResponseWithMeta(c, map[string]interface{}{
		"items": versions,
	}, map[string]interface{}{
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// ListExecutions 获取 App 执行记录列表
func (h *AppHandler) ListExecutions(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "APP_INVALID_ID", "App ID 无效")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 20
	}

	executions, total, err := h.appService.ListExecutions(c.Request().Context(), uid, appID, service.AppExecutionListParams{
		Status:   strings.TrimSpace(c.QueryParam("status")),
		Page:     page,
		PageSize: pageSize,
		Sort:     strings.TrimSpace(c.QueryParam("sort")),
		Order:    strings.TrimSpace(c.QueryParam("order")),
	})
	if err != nil {
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "APP_NOT_FOUND", "App 不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问该 App")
		case service.ErrAppVersionNotFound:
			return errorResponse(c, http.StatusNotFound, "VERSION_NOT_FOUND", "App 版本不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取执行记录失败")
		}
	}

	resp := make([]AppExecutionResponse, len(executions))
	for i, execution := range executions {
		resp[i] = toAppExecutionResponse(appID, execution)
	}

	return successResponseWithMeta(c, map[string]interface{}{
		"items":     resp,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	}, map[string]interface{}{
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// CompareVersions 对比 App 版本
func (h *AppHandler) CompareVersions(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "APP_INVALID_ID", "App ID 无效")
	}

	fromRaw := strings.TrimSpace(c.QueryParam("from"))
	toRaw := strings.TrimSpace(c.QueryParam("to"))
	if fromRaw == "" || toRaw == "" {
		return errorResponse(c, http.StatusBadRequest, "VERSION_REQUIRED", "需要指定对比版本")
	}
	fromID, err := uuid.Parse(fromRaw)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_FROM", "对比版本参数无效")
	}
	toID, err := uuid.Parse(toRaw)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_TO", "对比版本参数无效")
	}

	diff, err := h.appService.CompareVersions(c.Request().Context(), uid, appID, fromID, toID)
	if err != nil {
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "APP_NOT_FOUND", "App 不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问该 App")
		case service.ErrAppVersionNotFound:
			return errorResponse(c, http.StatusNotFound, "VERSION_NOT_FOUND", "版本不存在")
		case service.ErrAppVersionMismatch:
			return errorResponse(c, http.StatusBadRequest, "VERSION_MISMATCH", "版本不属于该 App")
		default:
			return errorResponse(c, http.StatusInternalServerError, "COMPARE_FAILED", "版本对比失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"diff": diff,
	})
}

// CreateVersion 创建 App 版本
func (h *AppHandler) CreateVersion(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "App ID 无效")
	}

	var req CreateAppVersionRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	source := ""
	if req.Source != nil {
		source = strings.TrimSpace(*req.Source)
	}
	if source == "schema_import" {
		if err := validateJSONSchemaPayload(req, appSchemaImportSchema); err != nil {
			metadata := entity.JSON{
				"status": "failed",
				"error":  err.Error(),
				"source": source,
			}
			if req.WorkflowID != nil {
				metadata["workflow_id"] = *req.WorkflowID
			}
			h.recordAuditForApp(c, uid, appID, "app.schema.import", "app_version", nil, metadata)
			return errorResponse(c, http.StatusBadRequest, "SCHEMA_INVALID", "Schema 校验失败")
		}
	}

	var workflowID *uuid.UUID
	if req.WorkflowID != nil && *req.WorkflowID != "" {
		parsed, err := uuid.Parse(*req.WorkflowID)
		if err != nil {
			if source == "schema_import" {
				metadata := entity.JSON{
					"status": "failed",
					"error":  err.Error(),
					"source": source,
				}
				if req.WorkflowID != nil {
					metadata["workflow_id"] = *req.WorkflowID
				}
				h.recordAuditForApp(c, uid, appID, "app.schema.import", "app_version", nil, metadata)
			}
			return errorResponse(c, http.StatusBadRequest, "INVALID_WORKFLOW_ID", "工作流 ID 无效")
		}
		workflowID = &parsed
	}

	var uiSchema *entity.JSON
	if req.UISchema != nil {
		value := entity.JSON(req.UISchema)
		uiSchema = &value
	}
	var dbSchema *entity.JSON
	if req.DBSchema != nil {
		value := entity.JSON(req.DBSchema)
		dbSchema = &value
	}
	var configJSON *entity.JSON
	if req.ConfigJSON != nil {
		value := entity.JSON(req.ConfigJSON)
		configJSON = &value
	}

	version, err := h.appService.CreateVersion(c.Request().Context(), uid, appID, service.CreateAppVersionRequest{
		WorkflowID: workflowID,
		Changelog:  req.Changelog,
		UISchema:   uiSchema,
		DBSchema:   dbSchema,
		ConfigJSON: configJSON,
	})
	if err != nil {
		if source == "schema_import" {
			metadata := entity.JSON{
				"status": "failed",
				"error":  err.Error(),
				"source": source,
			}
			if req.WorkflowID != nil {
				metadata["workflow_id"] = *req.WorkflowID
			}
			h.recordAuditForApp(c, uid, appID, "app.schema.import", "app_version", nil, metadata)
		}
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "App 不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限创建版本")
		case service.ErrAppWorkflowNotFound:
			return errorResponse(c, http.StatusNotFound, "WORKFLOW_NOT_FOUND", "工作流不存在")
		case service.ErrAppWorkflowWorkspaceMismatch:
			return errorResponse(c, http.StatusBadRequest, "WORKFLOW_MISMATCH", "工作流不属于该工作空间")
		default:
			return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "创建版本失败")
		}
	}

	action := "app.version.create"
	if source == "schema_import" {
		action = "app.schema.import"
	}
	metadata := entity.JSON{
		"version":     version.Version,
		"version_id":  version.ID.String(),
		"workflow_id": version.WorkflowID,
	}
	if source != "" {
		metadata["source"] = source
	}
	h.recordAuditForApp(c, uid, appID, action, "app_version", &version.ID, metadata)

	return successResponse(c, map[string]interface{}{
		"version": version,
	})
}

// SubmitDBSchemaReview 提交 DB Schema 审核
func (h *AppHandler) SubmitDBSchemaReview(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "App ID 无效")
	}

	var req SubmitDBSchemaReviewRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	var versionID *uuid.UUID
	if req.VersionID != nil && *req.VersionID != "" {
		parsed, err := uuid.Parse(*req.VersionID)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_VERSION_ID", "版本 ID 无效")
		}
		versionID = &parsed
	}

	queue, err := h.appService.SubmitDBSchemaReview(c.Request().Context(), uid, appID, service.SubmitDBSchemaReviewRequest{
		VersionID: versionID,
		Note:      req.Note,
	})
	if err != nil {
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "App 不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限提交审核")
		case service.ErrAppVersionRequired:
			return errorResponse(c, http.StatusBadRequest, "VERSION_REQUIRED", "缺少版本信息")
		case service.ErrAppVersionNotFound:
			return errorResponse(c, http.StatusNotFound, "VERSION_NOT_FOUND", "版本不存在")
		case service.ErrAppVersionMismatch:
			return errorResponse(c, http.StatusBadRequest, "VERSION_MISMATCH", "版本不属于该 App")
		case service.ErrDBSchemaMissing:
			return errorResponse(c, http.StatusBadRequest, "DB_SCHEMA_EMPTY", "DB Schema 为空")
		case service.ErrDBSchemaReviewExists:
			return errorResponse(c, http.StatusConflict, "REVIEW_EXISTS", "已存在待审核记录")
		case service.ErrDBSchemaReviewUnavailable:
			return errorResponse(c, http.StatusInternalServerError, "REVIEW_UNAVAILABLE", "审核服务不可用")
		default:
			return errorResponse(c, http.StatusInternalServerError, "SUBMIT_FAILED", "提交审核失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"review":  queue,
		"message": "已提交审核",
	})
}

// GetDBSchemaReview 获取 DB Schema 审核状态
func (h *AppHandler) GetDBSchemaReview(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "App ID 无效")
	}

	var versionID *uuid.UUID
	if versionIDStr := c.QueryParam("version_id"); versionIDStr != "" {
		parsed, err := uuid.Parse(versionIDStr)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_VERSION_ID", "版本 ID 无效")
		}
		versionID = &parsed
	}

	queue, err := h.appService.GetDBSchemaReview(c.Request().Context(), uid, appID, versionID)
	if err != nil {
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "App 不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限查看审核")
		case service.ErrAppVersionRequired:
			return errorResponse(c, http.StatusBadRequest, "VERSION_REQUIRED", "缺少版本信息")
		case service.ErrAppVersionNotFound:
			return errorResponse(c, http.StatusNotFound, "VERSION_NOT_FOUND", "版本不存在")
		case service.ErrAppVersionMismatch:
			return errorResponse(c, http.StatusBadRequest, "VERSION_MISMATCH", "版本不属于该 App")
		case service.ErrDBSchemaReviewNotFound:
			return errorResponse(c, http.StatusNotFound, "REVIEW_NOT_FOUND", "审核记录不存在")
		case service.ErrDBSchemaReviewUnavailable:
			return errorResponse(c, http.StatusInternalServerError, "REVIEW_UNAVAILABLE", "审核服务不可用")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取审核信息失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"review": queue,
	})
}

// GetDBSchemaReviewHistory 获取 DB Schema 审核记录
func (h *AppHandler) GetDBSchemaReviewHistory(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "App ID 无效")
	}

	var versionID *uuid.UUID
	if versionIDStr := c.QueryParam("version_id"); versionIDStr != "" {
		parsed, err := uuid.Parse(versionIDStr)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_VERSION_ID", "版本 ID 无效")
		}
		versionID = &parsed
	}

	records, err := h.appService.GetDBSchemaReviewHistory(c.Request().Context(), uid, appID, versionID)
	if err != nil {
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "App 不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限查看审核")
		case service.ErrAppVersionRequired:
			return errorResponse(c, http.StatusBadRequest, "VERSION_REQUIRED", "缺少版本信息")
		case service.ErrAppVersionNotFound:
			return errorResponse(c, http.StatusNotFound, "VERSION_NOT_FOUND", "版本不存在")
		case service.ErrAppVersionMismatch:
			return errorResponse(c, http.StatusBadRequest, "VERSION_MISMATCH", "版本不属于该 App")
		case service.ErrDBSchemaReviewNotFound:
			return errorResponse(c, http.StatusNotFound, "REVIEW_NOT_FOUND", "审核记录不存在")
		case service.ErrDBSchemaReviewUnavailable:
			return errorResponse(c, http.StatusInternalServerError, "REVIEW_UNAVAILABLE", "审核服务不可用")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取审核记录失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"records": records,
	})
}

// RollbackDBSchema 回滚 DB Schema
func (h *AppHandler) RollbackDBSchema(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "App ID 无效")
	}

	var req RollbackDBSchemaRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}
	if req.TargetVersionID == nil || *req.TargetVersionID == "" {
		return errorResponse(c, http.StatusBadRequest, "VERSION_REQUIRED", "目标版本不能为空")
	}
	targetVersionID, err := uuid.Parse(*req.TargetVersionID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_VERSION_ID", "目标版本 ID 无效")
	}

	var baseVersionID *uuid.UUID
	if req.BaseVersionID != nil && *req.BaseVersionID != "" {
		parsed, err := uuid.Parse(*req.BaseVersionID)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_VERSION_ID", "基础版本 ID 无效")
		}
		baseVersionID = &parsed
	}

	version, err := h.appService.RollbackDBSchema(c.Request().Context(), uid, appID, service.RollbackDBSchemaRequest{
		TargetVersionID: &targetVersionID,
		BaseVersionID:   baseVersionID,
		Changelog:       req.Changelog,
	})
	if err != nil {
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "App 不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限回滚")
		case service.ErrAppVersionRequired:
			return errorResponse(c, http.StatusBadRequest, "VERSION_REQUIRED", "缺少版本信息")
		case service.ErrAppVersionNotFound:
			return errorResponse(c, http.StatusNotFound, "VERSION_NOT_FOUND", "版本不存在")
		case service.ErrAppVersionMismatch:
			return errorResponse(c, http.StatusBadRequest, "VERSION_MISMATCH", "版本不属于该 App")
		case service.ErrDBSchemaMissing:
			return errorResponse(c, http.StatusBadRequest, "DB_SCHEMA_EMPTY", "目标版本 DB Schema 为空")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ROLLBACK_FAILED", "回滚失败")
		}
	}

	baseVersionValue := ""
	if baseVersionID != nil {
		baseVersionValue = baseVersionID.String()
	}
	h.recordAuditForApp(c, uid, appID, "app.db_schema.rollback", "app_version", &version.ID, entity.JSON{
		"target_version_id": targetVersionID.String(),
		"base_version_id":   baseVersionValue,
	})

	return successResponse(c, map[string]interface{}{
		"version": version,
		"message": "DB Schema 回滚已生成新版本",
	})
}

// ApproveDBSchemaReview 审核通过 DB Schema
func (h *AppHandler) ApproveDBSchemaReview(c echo.Context) error {
	reviewerIDStr := middleware.GetUserID(c)
	reviewerID, err := uuid.Parse(reviewerIDStr)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "审核人 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "App ID 无效")
	}

	var req ApproveDBSchemaReviewRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	var versionID *uuid.UUID
	if req.VersionID != nil && *req.VersionID != "" {
		parsed, err := uuid.Parse(*req.VersionID)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_VERSION_ID", "版本 ID 无效")
		}
		versionID = &parsed
	}

	queue, err := h.appService.ApproveDBSchemaReview(c.Request().Context(), reviewerID, appID, service.ApproveDBSchemaReviewRequest{
		VersionID: versionID,
		Note:      req.Note,
	})
	if err != nil {
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "App 不存在")
		case service.ErrAppVersionRequired:
			return errorResponse(c, http.StatusBadRequest, "VERSION_REQUIRED", "缺少版本信息")
		case service.ErrAppVersionNotFound:
			return errorResponse(c, http.StatusNotFound, "VERSION_NOT_FOUND", "版本不存在")
		case service.ErrAppVersionMismatch:
			return errorResponse(c, http.StatusBadRequest, "VERSION_MISMATCH", "版本不属于该 App")
		case service.ErrDBSchemaReviewNotFound:
			return errorResponse(c, http.StatusNotFound, "REVIEW_NOT_FOUND", "审核记录不存在")
		case service.ErrDBSchemaReviewerNotFound:
			return errorResponse(c, http.StatusBadRequest, "REVIEWER_NOT_FOUND", "审核人不存在")
		case service.ErrDBSchemaReviewUnavailable:
			return errorResponse(c, http.StatusInternalServerError, "REVIEW_UNAVAILABLE", "审核服务不可用")
		default:
			return errorResponse(c, http.StatusInternalServerError, "APPROVE_FAILED", "审核失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"review":  queue,
		"message": "审核通过",
	})
}

// RejectDBSchemaReview 审核拒绝 DB Schema
func (h *AppHandler) RejectDBSchemaReview(c echo.Context) error {
	reviewerIDStr := middleware.GetUserID(c)
	reviewerID, err := uuid.Parse(reviewerIDStr)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "审核人 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "App ID 无效")
	}

	var req RejectDBSchemaReviewRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	var versionID *uuid.UUID
	if req.VersionID != nil && *req.VersionID != "" {
		parsed, err := uuid.Parse(*req.VersionID)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_VERSION_ID", "版本 ID 无效")
		}
		versionID = &parsed
	}

	queue, err := h.appService.RejectDBSchemaReview(c.Request().Context(), reviewerID, appID, service.RejectDBSchemaReviewRequest{
		VersionID: versionID,
		Reason:    req.Reason,
	})
	if err != nil {
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "App 不存在")
		case service.ErrAppVersionRequired:
			return errorResponse(c, http.StatusBadRequest, "VERSION_REQUIRED", "缺少版本信息")
		case service.ErrAppVersionNotFound:
			return errorResponse(c, http.StatusNotFound, "VERSION_NOT_FOUND", "版本不存在")
		case service.ErrAppVersionMismatch:
			return errorResponse(c, http.StatusBadRequest, "VERSION_MISMATCH", "版本不属于该 App")
		case service.ErrDBSchemaReviewNotFound:
			return errorResponse(c, http.StatusNotFound, "REVIEW_NOT_FOUND", "审核记录不存在")
		case service.ErrDBSchemaReviewerNotFound:
			return errorResponse(c, http.StatusBadRequest, "REVIEWER_NOT_FOUND", "审核人不存在")
		case service.ErrDBSchemaReviewUnavailable:
			return errorResponse(c, http.StatusInternalServerError, "REVIEW_UNAVAILABLE", "审核服务不可用")
		default:
			return errorResponse(c, http.StatusInternalServerError, "REJECT_FAILED", "审核失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"review":  queue,
		"message": "审核已拒绝",
	})
}

// SubmitMajorChangeReview 提交重大变更审核
func (h *AppHandler) SubmitMajorChangeReview(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "App ID 无效")
	}

	var req SubmitMajorChangeReviewRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	var versionID *uuid.UUID
	if req.VersionID != nil && *req.VersionID != "" {
		parsed, err := uuid.Parse(*req.VersionID)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_VERSION_ID", "版本 ID 无效")
		}
		versionID = &parsed
	}

	queue, err := h.appService.SubmitMajorChangeReview(c.Request().Context(), uid, appID, service.SubmitMajorChangeReviewRequest{
		VersionID: versionID,
		Note:      req.Note,
	})
	if err != nil {
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "App 不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限提交审核")
		case service.ErrAppVersionRequired:
			return errorResponse(c, http.StatusBadRequest, "VERSION_REQUIRED", "缺少版本信息")
		case service.ErrAppVersionNotFound:
			return errorResponse(c, http.StatusNotFound, "VERSION_NOT_FOUND", "版本不存在")
		case service.ErrAppVersionMismatch:
			return errorResponse(c, http.StatusBadRequest, "VERSION_MISMATCH", "版本不属于该 App")
		case service.ErrMajorChangeNotRequired:
			return errorResponse(c, http.StatusBadRequest, "MAJOR_CHANGE_NOT_REQUIRED", "当前版本不包含重大变更")
		case service.ErrMajorChangeReviewExists:
			return errorResponse(c, http.StatusConflict, "REVIEW_EXISTS", "已存在待审核记录")
		case service.ErrMajorChangeReviewUnavailable:
			return errorResponse(c, http.StatusInternalServerError, "REVIEW_UNAVAILABLE", "审核服务不可用")
		default:
			return errorResponse(c, http.StatusInternalServerError, "SUBMIT_FAILED", "提交审核失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"review":  queue,
		"message": "已提交审核",
	})
}

// GetMajorChangeReview 获取重大变更审核状态
func (h *AppHandler) GetMajorChangeReview(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "App ID 无效")
	}

	var versionID *uuid.UUID
	if versionIDStr := c.QueryParam("version_id"); versionIDStr != "" {
		parsed, err := uuid.Parse(versionIDStr)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_VERSION_ID", "版本 ID 无效")
		}
		versionID = &parsed
	}

	queue, err := h.appService.GetMajorChangeReview(c.Request().Context(), uid, appID, versionID)
	if err != nil {
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "App 不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限查看审核")
		case service.ErrAppVersionRequired:
			return errorResponse(c, http.StatusBadRequest, "VERSION_REQUIRED", "缺少版本信息")
		case service.ErrAppVersionNotFound:
			return errorResponse(c, http.StatusNotFound, "VERSION_NOT_FOUND", "版本不存在")
		case service.ErrAppVersionMismatch:
			return errorResponse(c, http.StatusBadRequest, "VERSION_MISMATCH", "版本不属于该 App")
		case service.ErrMajorChangeReviewNotFound:
			return errorResponse(c, http.StatusNotFound, "REVIEW_NOT_FOUND", "审核记录不存在")
		case service.ErrMajorChangeReviewUnavailable:
			return errorResponse(c, http.StatusInternalServerError, "REVIEW_UNAVAILABLE", "审核服务不可用")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取审核信息失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"review": queue,
	})
}

// GetMajorChangeReviewHistory 获取重大变更审核记录
func (h *AppHandler) GetMajorChangeReviewHistory(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "App ID 无效")
	}

	var versionID *uuid.UUID
	if versionIDStr := c.QueryParam("version_id"); versionIDStr != "" {
		parsed, err := uuid.Parse(versionIDStr)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_VERSION_ID", "版本 ID 无效")
		}
		versionID = &parsed
	}

	records, err := h.appService.GetMajorChangeReviewHistory(c.Request().Context(), uid, appID, versionID)
	if err != nil {
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "App 不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限查看审核")
		case service.ErrAppVersionRequired:
			return errorResponse(c, http.StatusBadRequest, "VERSION_REQUIRED", "缺少版本信息")
		case service.ErrAppVersionNotFound:
			return errorResponse(c, http.StatusNotFound, "VERSION_NOT_FOUND", "版本不存在")
		case service.ErrAppVersionMismatch:
			return errorResponse(c, http.StatusBadRequest, "VERSION_MISMATCH", "版本不属于该 App")
		case service.ErrMajorChangeReviewNotFound:
			return errorResponse(c, http.StatusNotFound, "REVIEW_NOT_FOUND", "审核记录不存在")
		case service.ErrMajorChangeReviewUnavailable:
			return errorResponse(c, http.StatusInternalServerError, "REVIEW_UNAVAILABLE", "审核服务不可用")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取审核记录失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"records": records,
	})
}

// ApproveMajorChangeReview 审核通过重大变更
func (h *AppHandler) ApproveMajorChangeReview(c echo.Context) error {
	reviewerIDStr := middleware.GetUserID(c)
	reviewerID, err := uuid.Parse(reviewerIDStr)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "审核人 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "App ID 无效")
	}

	var req ApproveMajorChangeReviewRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	var versionID *uuid.UUID
	if req.VersionID != nil && *req.VersionID != "" {
		parsed, err := uuid.Parse(*req.VersionID)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_VERSION_ID", "版本 ID 无效")
		}
		versionID = &parsed
	}

	queue, err := h.appService.ApproveMajorChangeReview(c.Request().Context(), reviewerID, appID, service.ApproveMajorChangeReviewRequest{
		VersionID: versionID,
		Note:      req.Note,
	})
	if err != nil {
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "App 不存在")
		case service.ErrAppVersionRequired:
			return errorResponse(c, http.StatusBadRequest, "VERSION_REQUIRED", "缺少版本信息")
		case service.ErrAppVersionNotFound:
			return errorResponse(c, http.StatusNotFound, "VERSION_NOT_FOUND", "版本不存在")
		case service.ErrAppVersionMismatch:
			return errorResponse(c, http.StatusBadRequest, "VERSION_MISMATCH", "版本不属于该 App")
		case service.ErrMajorChangeReviewNotFound:
			return errorResponse(c, http.StatusNotFound, "REVIEW_NOT_FOUND", "审核记录不存在")
		case service.ErrMajorChangeReviewerNotFound:
			return errorResponse(c, http.StatusBadRequest, "REVIEWER_NOT_FOUND", "审核人不存在")
		case service.ErrMajorChangeReviewUnavailable:
			return errorResponse(c, http.StatusInternalServerError, "REVIEW_UNAVAILABLE", "审核服务不可用")
		default:
			return errorResponse(c, http.StatusInternalServerError, "APPROVE_FAILED", "审核失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"review":  queue,
		"message": "审核通过",
	})
}

// RejectMajorChangeReview 审核拒绝重大变更
func (h *AppHandler) RejectMajorChangeReview(c echo.Context) error {
	reviewerIDStr := middleware.GetUserID(c)
	reviewerID, err := uuid.Parse(reviewerIDStr)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "审核人 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "App ID 无效")
	}

	var req RejectMajorChangeReviewRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	var versionID *uuid.UUID
	if req.VersionID != nil && *req.VersionID != "" {
		parsed, err := uuid.Parse(*req.VersionID)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_VERSION_ID", "版本 ID 无效")
		}
		versionID = &parsed
	}

	queue, err := h.appService.RejectMajorChangeReview(c.Request().Context(), reviewerID, appID, service.RejectMajorChangeReviewRequest{
		VersionID: versionID,
		Reason:    req.Reason,
	})
	if err != nil {
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "App 不存在")
		case service.ErrAppVersionRequired:
			return errorResponse(c, http.StatusBadRequest, "VERSION_REQUIRED", "缺少版本信息")
		case service.ErrAppVersionNotFound:
			return errorResponse(c, http.StatusNotFound, "VERSION_NOT_FOUND", "版本不存在")
		case service.ErrAppVersionMismatch:
			return errorResponse(c, http.StatusBadRequest, "VERSION_MISMATCH", "版本不属于该 App")
		case service.ErrMajorChangeReviewNotFound:
			return errorResponse(c, http.StatusNotFound, "REVIEW_NOT_FOUND", "审核记录不存在")
		case service.ErrMajorChangeReviewerNotFound:
			return errorResponse(c, http.StatusBadRequest, "REVIEWER_NOT_FOUND", "审核人不存在")
		case service.ErrMajorChangeReviewUnavailable:
			return errorResponse(c, http.StatusInternalServerError, "REVIEW_UNAVAILABLE", "审核服务不可用")
		default:
			return errorResponse(c, http.StatusInternalServerError, "REJECT_FAILED", "审核失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"review":  queue,
		"message": "审核已拒绝",
	})
}

// Publish 发布 App
func (h *AppHandler) Publish(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "App ID 无效")
	}

	var req PublishAppRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	var versionID *uuid.UUID
	if req.VersionID != nil && *req.VersionID != "" {
		parsed, err := uuid.Parse(*req.VersionID)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_VERSION_ID", "版本 ID 无效")
		}
		versionID = &parsed
	}

	policyReq := req.AccessPolicy
	if policyReq == nil && req.RateLimit != nil {
		policyReq = &UpdateAppAccessPolicyRequest{}
	}
	if policyReq != nil && req.RateLimit != nil && policyReq.RateLimitJSON == nil {
		policyReq.RateLimitJSON = req.RateLimit
	}
	var accessPolicy *service.UpdateAppAccessPolicyRequest
	if policyReq != nil {
		accessPolicy = &service.UpdateAppAccessPolicyRequest{
			AccessMode:         policyReq.AccessMode,
			DataClassification: policyReq.DataClassification,
			RateLimitJSON:      policyReq.RateLimitJSON,
			AllowedOrigins:     policyReq.AllowedOrigins,
			RequireCaptcha:     policyReq.RequireCaptcha,
		}
	}

	ctx := idempotency.WithKey(c.Request().Context(), middleware.GetIdempotencyKey(c))
	app, err := h.appService.Publish(ctx, uid, appID, service.PublishAppRequest{
		VersionID:    versionID,
		AccessPolicy: accessPolicy,
	})
	if err != nil {
		switch err {
		case service.ErrAppNotFound, service.ErrAppPolicyNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "App 不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限发布")
		case service.ErrAppVersionNotFound:
			return errorResponse(c, http.StatusNotFound, "VERSION_NOT_FOUND", "版本不存在")
		case service.ErrAppVersionMismatch:
			return errorResponse(c, http.StatusBadRequest, "VERSION_MISMATCH", "版本不属于该 App")
		case service.ErrAppPublishVersionRequired:
			return errorResponse(c, http.StatusBadRequest, "VERSION_REQUIRED", "发布需要指定版本")
		case service.ErrAppInvalidStatusTransition:
			return errorResponse(c, http.StatusConflict, "STATUS_CONFLICT", "当前状态无法发布")
		case service.ErrAppInvalidAccessMode, service.ErrAppInvalidAllowedOrigin, service.ErrAppInvalidDataClassification, service.ErrAppInvalidRateLimitAlgorithm, service.ErrAppInvalidAccessPolicy:
			return errorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "访问策略字段无效")
		case service.ErrMajorChangeReviewRequired:
			return errorResponse(c, http.StatusConflict, "MAJOR_CHANGE_REVIEW_REQUIRED", "重大变更需先完成审核")
		case service.ErrMajorChangeReviewNotApproved:
			return errorResponse(c, http.StatusConflict, "MAJOR_CHANGE_REVIEW_PENDING", "重大变更审核未通过")
		case service.ErrMajorChangeReviewUnavailable:
			return errorResponse(c, http.StatusInternalServerError, "REVIEW_UNAVAILABLE", "审核服务不可用")
		case service.ErrIdempotencyConflict:
			return errorResponse(c, http.StatusConflict, "IDEMPOTENCY_CONFLICT", "幂等键与请求不一致")
		case service.ErrIdempotencyInProgress:
			return errorResponse(c, http.StatusConflict, "IDEMPOTENCY_IN_PROGRESS", "幂等请求处理中")
		default:
			return errorResponse(c, http.StatusInternalServerError, "PUBLISH_FAILED", "发布失败")
		}
	}

	h.recordAudit(c, app.WorkspaceID, uid, "app.rollback", "app", &app.ID, entity.JSON{
		"version_id": versionID.String(),
		"status":     app.Status,
	})

	return successResponse(c, map[string]interface{}{
		"app": app,
	})
}

// Rollback 回滚 App 版本
func (h *AppHandler) Rollback(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "App ID 无效")
	}

	var req RollbackAppRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}
	if req.VersionID == "" {
		return errorResponse(c, http.StatusBadRequest, "VERSION_REQUIRED", "版本 ID 不能为空")
	}
	versionID, err := uuid.Parse(req.VersionID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_VERSION_ID", "版本 ID 无效")
	}

	app, err := h.appService.Rollback(c.Request().Context(), uid, appID, versionID)
	if err != nil {
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "App 不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限回滚")
		case service.ErrAppVersionNotFound:
			return errorResponse(c, http.StatusNotFound, "VERSION_NOT_FOUND", "版本不存在")
		case service.ErrAppVersionMismatch:
			return errorResponse(c, http.StatusBadRequest, "VERSION_MISMATCH", "版本不属于该 App")
		case service.ErrAppInvalidStatusTransition:
			return errorResponse(c, http.StatusConflict, "STATUS_CONFLICT", "当前状态无法回滚")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ROLLBACK_FAILED", "回滚失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"app": app,
	})
}

// Deprecate 下线 App（Deprecated）
func (h *AppHandler) Deprecate(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "App ID 无效")
	}

	app, err := h.appService.Deprecate(c.Request().Context(), uid, appID)
	if err != nil {
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "App 不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限操作")
		case service.ErrAppInvalidStatusTransition:
			return errorResponse(c, http.StatusConflict, "STATUS_CONFLICT", "当前状态无法下线")
		default:
			return errorResponse(c, http.StatusInternalServerError, "DEPRECATE_FAILED", "下线失败")
		}
	}

	h.recordAudit(c, app.WorkspaceID, uid, "app.deprecate", "app", &app.ID, entity.JSON{
		"status": app.Status,
	})

	return successResponse(c, map[string]interface{}{
		"app": app,
	})
}

// Archive 归档 App
func (h *AppHandler) Archive(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "App ID 无效")
	}

	app, err := h.appService.Archive(c.Request().Context(), uid, appID)
	if err != nil {
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "App 不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限操作")
		case service.ErrAppInvalidStatusTransition:
			return errorResponse(c, http.StatusConflict, "STATUS_CONFLICT", "当前状态无法归档")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ARCHIVE_FAILED", "归档失败")
		}
	}

	h.recordAudit(c, app.WorkspaceID, uid, "app.archive", "app", &app.ID, entity.JSON{
		"status": app.Status,
	})

	return successResponse(c, map[string]interface{}{
		"app": app,
	})
}

func (h *AppHandler) recordAudit(ctx echo.Context, workspaceID uuid.UUID, actorID uuid.UUID, action string, targetType string, targetID *uuid.UUID, metadata entity.JSON) {
	if h.auditLogService == nil {
		return
	}
	metadata = buildAuditMetadata(ctx, metadata)
	_, _ = h.auditLogService.Record(ctx.Request().Context(), service.AuditLogRecordRequest{
		WorkspaceID: workspaceID,
		ActorUserID: &actorID,
		Action:      action,
		TargetType:  targetType,
		TargetID:    targetID,
		Metadata:    metadata,
	})
}

func (h *AppHandler) recordAuditForApp(ctx echo.Context, actorID uuid.UUID, appID uuid.UUID, action string, targetType string, targetID *uuid.UUID, metadata entity.JSON) {
	if h.auditLogService == nil {
		return
	}
	app, err := h.appService.GetByID(ctx.Request().Context(), appID, actorID)
	if err != nil {
		return
	}
	h.recordAudit(ctx, app.WorkspaceID, actorID, action, targetType, targetID, metadata)
}
