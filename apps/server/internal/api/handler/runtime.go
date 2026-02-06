package handler

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/agentflow/server/internal/config"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/observability"
	"github.com/agentflow/server/internal/pkg/uischema"
	"github.com/agentflow/server/internal/service"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// RuntimeHandler Workspace Runtime 处理器
type RuntimeHandler struct {
	runtimeService   service.RuntimeService
	executionService service.ExecutionService
	billingService   service.BillingService
	auditLogService  service.AuditLogService
	jwtCfg           *config.JWTConfig
	captchaVerifier  service.CaptchaVerifier
	baseHosts        map[string]struct{}
	metrics          *observability.MetricsCollector
	schemaCacheTTL   time.Duration
	schemaStaleTTL   time.Duration
}

// NewRuntimeHandler 创建 Runtime 处理器
func NewRuntimeHandler(
	runtimeService service.RuntimeService,
	executionService service.ExecutionService,
	billingService service.BillingService,
	auditLogService service.AuditLogService,
	jwtCfg *config.JWTConfig,
	captchaVerifier service.CaptchaVerifier,
	baseURL string,
	regionBaseURLs map[string]string,
	schemaCacheTTL time.Duration,
	schemaStaleTTL time.Duration,
) *RuntimeHandler {
	return &RuntimeHandler{
		runtimeService:   runtimeService,
		executionService: executionService,
		billingService:   billingService,
		auditLogService:  auditLogService,
		jwtCfg:           jwtCfg,
		captchaVerifier:  captchaVerifier,
		baseHosts:        buildRuntimeBaseHosts(baseURL, regionBaseURLs),
		metrics:          observability.GetMetricsCollector(),
		schemaCacheTTL:   schemaCacheTTL,
		schemaStaleTTL:   schemaStaleTTL,
	}
}

// RuntimeExecuteRequest Runtime 执行请求
type RuntimeExecuteRequest struct {
	Inputs       map[string]interface{} `json:"inputs"`
	TriggerType  string                 `json:"trigger_type"`
	CaptchaToken string                 `json:"captcha_token"`
}

type runtimeAccessPolicy struct {
	AccessMode         string      `json:"access_mode"`
	DataClassification string      `json:"data_classification,omitempty"`
	RateLimitJSON      entity.JSON `json:"rate_limit_json,omitempty"`
	AllowedOrigins     []string    `json:"allowed_origins,omitempty"`
	RequireCaptcha     bool        `json:"require_captcha"`
}

func buildRuntimeAccessPolicy(workspace *entity.Workspace) *runtimeAccessPolicy {
	if workspace == nil {
		return nil
	}
	return &runtimeAccessPolicy{
		AccessMode:         workspace.AccessMode,
		DataClassification: workspace.DataClassification,
		RateLimitJSON:      workspace.RateLimitJSON,
		AllowedOrigins:     []string(workspace.AllowedOrigins),
		RequireCaptcha:     workspace.RequireCaptcha,
	}
}

// GetEntry 获取 Workspace Runtime 入口信息
func (h *RuntimeHandler) GetEntry(c echo.Context) error {
	startedAt := time.Now()
	workspaceID := "unknown"
	defer h.recordRuntimeMetrics(c, startedAt, &workspaceID)

	userID, err := h.getOptionalUserID(c)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "INVALID_TOKEN", "无效或过期的 Token")
	}

	entry, err := h.resolveEntry(c, userID)
	if err != nil {
		return runtimeErrorResponse(c, err, "RUNTIME_FAILED", "获取 Workspace 入口失败")
	}
	if entry != nil {
		if entry.Workspace != nil {
			workspaceID = entry.Workspace.ID.String()
		}
	}

	captchaToken := h.getCaptchaToken(c, "")
	accessResult, err := h.trackAnonymousAccess(c, entry, "runtime_entry", captchaToken, false)
	if err != nil {
		return runtimeErrorResponse(c, err, "RUNTIME_FAILED", "记录访问失败")
	}

	requireCaptcha := entry.Workspace != nil && entry.Workspace.RequireCaptcha
	if accessResult != nil && accessResult.Decision.RequireCaptcha {
		requireCaptcha = true
	}
	if err := h.ensureCaptcha(c, entry, captchaToken, requireCaptcha); err != nil {
		return h.handleCaptchaError(c, err)
	}

	var session *entity.WorkspaceSession
	if accessResult != nil {
		session = accessResult.Session
	}
	if session != nil {
		c.Response().Header().Set("X-Workspace-Session-Id", session.ID.String())
	}

	h.recordAnonymousAudit(c, entry, session, "runtime_entry", userID)

	return successResponse(c, map[string]interface{}{
		"workspace":     entry.Workspace,
		"access_policy": buildRuntimeAccessPolicy(entry.Workspace),
		"session_id":    sessionIDOrEmpty(session),
	})
}

// GetSchema 获取 Workspace Runtime Schema
func (h *RuntimeHandler) GetSchema(c echo.Context) error {
	startedAt := time.Now()
	workspaceID := "unknown"
	defer h.recordRuntimeMetrics(c, startedAt, &workspaceID)

	userID, err := h.getOptionalUserID(c)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "INVALID_TOKEN", "无效或过期的 Token")
	}

	cacheRequest := h.shouldUseSchemaCache(c)
	skipSession := cacheRequest && h.getOptionalSessionID(c) == nil

	schema, err := h.resolveSchema(c, userID)
	if err != nil {
		return runtimeErrorResponse(c, err, "RUNTIME_FAILED", "获取 Schema 失败")
	}
	if schema != nil {
		if schema.Workspace != nil {
			workspaceID = schema.Workspace.ID.String()
		}
	}

	captchaToken := h.getCaptchaToken(c, "")
	accessResult, err := h.trackAnonymousAccess(c, &schema.RuntimeEntry, "runtime_schema", captchaToken, skipSession)
	if err != nil {
		return runtimeErrorResponse(c, err, "RUNTIME_FAILED", "记录访问失败")
	}

	requireCaptcha := schema.Workspace != nil && schema.Workspace.RequireCaptcha
	if accessResult != nil && accessResult.Decision.RequireCaptcha {
		requireCaptcha = true
	}
	if err := h.ensureCaptcha(c, &schema.RuntimeEntry, captchaToken, requireCaptcha); err != nil {
		return h.handleCaptchaError(c, err)
	}

	var session *entity.WorkspaceSession
	if accessResult != nil {
		session = accessResult.Session
	}
	if session != nil {
		c.Response().Header().Set("X-Workspace-Session-Id", session.ID.String())
	}

	h.recordAnonymousAudit(c, &schema.RuntimeEntry, session, "runtime_schema", userID)

	normalizedUISchema, err := uischema.NormalizeMap(schema.Version.UISchema)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_UI_SCHEMA", "UI Schema 无效")
	}
	if normalizedUISchema != nil {
		schema.Version.UISchema = normalizedUISchema
	}

	schemaPayload := map[string]interface{}{
		"ui_schema":   schema.Version.UISchema,
		"db_schema":   schema.Version.DBSchema,
		"config_json": schema.Version.ConfigJSON,
		"version":     schema.Version.Version,
		"workflow_id": schema.Version.WorkflowID,
		"version_id":  schema.Version.ID,
		"created_at":  schema.Version.CreatedAt,
		"changelog":   schema.Version.Changelog,
	}
	if schema.Version.ConfigJSON != nil {
		if outputSchema, ok := schema.Version.ConfigJSON["output_schema"]; ok {
			schemaPayload["output_schema"] = outputSchema
		}
		if inputMapping, ok := schema.Version.ConfigJSON["input_mapping"]; ok {
			schemaPayload["input_mapping"] = inputMapping
		}
	}

	cacheable := h.schemaCacheEnabled(schema.Workspace, cacheRequest, skipSession)
	var etag string
	if cacheable {
		etag = buildSchemaETag(schemaPayload, schema.Workspace, schema.Version)
	}
	h.setSchemaCacheHeaders(c, cacheable, etag)
	if cacheable && etagMatches(c.Request().Header.Get("If-None-Match"), etag) {
		return c.NoContent(http.StatusNotModified)
	}

	return successResponse(c, map[string]interface{}{
		"workspace":     schema.Workspace,
		"access_policy": buildRuntimeAccessPolicy(schema.Workspace),
		"session_id":    sessionIDOrEmpty(session),
		"schema":        schemaPayload,
	})
}

// GetDomainEntry 获取域名绑定的 Runtime 入口
func (h *RuntimeHandler) GetDomainEntry(c echo.Context) error {
	startedAt := time.Now()
	workspaceID := "unknown"
	defer h.recordRuntimeMetrics(c, startedAt, &workspaceID)

	userID, err := h.getOptionalUserID(c)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "INVALID_TOKEN", "无效或过期的 Token")
	}

	domain := h.getDomainHost(c)
	entry, err := h.runtimeService.GetEntryByDomain(c.Request().Context(), domain, userID)
	if err != nil {
		return runtimeErrorResponse(c, err, "RUNTIME_FAILED", "获取 Workspace 入口失败")
	}
	if entry != nil {
		if entry.Workspace != nil {
			workspaceID = entry.Workspace.ID.String()
		}
	}

	captchaToken := h.getCaptchaToken(c, "")
	accessResult, err := h.trackAnonymousAccess(c, entry, "runtime_entry", captchaToken, false)
	if err != nil {
		return runtimeErrorResponse(c, err, "RUNTIME_FAILED", "记录访问失败")
	}

	requireCaptcha := entry.Workspace != nil && entry.Workspace.RequireCaptcha
	if accessResult != nil && accessResult.Decision.RequireCaptcha {
		requireCaptcha = true
	}
	if err := h.ensureCaptcha(c, entry, captchaToken, requireCaptcha); err != nil {
		return h.handleCaptchaError(c, err)
	}

	var session *entity.WorkspaceSession
	if accessResult != nil {
		session = accessResult.Session
	}
	if session != nil {
		c.Response().Header().Set("X-Workspace-Session-Id", session.ID.String())
	}

	h.recordAnonymousAudit(c, entry, session, "runtime_entry", userID)

	return successResponse(c, map[string]interface{}{
		"workspace":     entry.Workspace,
		"access_policy": buildRuntimeAccessPolicy(entry.Workspace),
		"session_id":    sessionIDOrEmpty(session),
	})
}

// GetDomainSchema 获取域名绑定的 Runtime Schema
func (h *RuntimeHandler) GetDomainSchema(c echo.Context) error {
	startedAt := time.Now()
	workspaceID := "unknown"
	defer h.recordRuntimeMetrics(c, startedAt, &workspaceID)

	userID, err := h.getOptionalUserID(c)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "INVALID_TOKEN", "无效或过期的 Token")
	}

	cacheRequest := h.shouldUseSchemaCache(c)
	skipSession := cacheRequest && h.getOptionalSessionID(c) == nil

	domain := h.getDomainHost(c)
	schema, err := h.runtimeService.GetSchemaByDomain(c.Request().Context(), domain, userID)
	if err != nil {
		return runtimeErrorResponse(c, err, "RUNTIME_FAILED", "获取 Schema 失败")
	}
	if schema != nil {
		if schema.Workspace != nil {
			workspaceID = schema.Workspace.ID.String()
		}
	}

	captchaToken := h.getCaptchaToken(c, "")
	accessResult, err := h.trackAnonymousAccess(c, &schema.RuntimeEntry, "runtime_schema", captchaToken, skipSession)
	if err != nil {
		return runtimeErrorResponse(c, err, "RUNTIME_FAILED", "记录访问失败")
	}

	requireCaptcha := schema.Workspace != nil && schema.Workspace.RequireCaptcha
	if accessResult != nil && accessResult.Decision.RequireCaptcha {
		requireCaptcha = true
	}
	if err := h.ensureCaptcha(c, &schema.RuntimeEntry, captchaToken, requireCaptcha); err != nil {
		return h.handleCaptchaError(c, err)
	}

	var session *entity.WorkspaceSession
	if accessResult != nil {
		session = accessResult.Session
	}
	if session != nil {
		c.Response().Header().Set("X-Workspace-Session-Id", session.ID.String())
	}

	h.recordAnonymousAudit(c, &schema.RuntimeEntry, session, "runtime_schema", userID)

	normalizedUISchema, err := uischema.NormalizeMap(schema.Version.UISchema)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_UI_SCHEMA", "UI Schema 无效")
	}
	if normalizedUISchema != nil {
		schema.Version.UISchema = normalizedUISchema
	}

	schemaPayload := map[string]interface{}{
		"ui_schema":   schema.Version.UISchema,
		"db_schema":   schema.Version.DBSchema,
		"config_json": schema.Version.ConfigJSON,
		"version":     schema.Version.Version,
		"workflow_id": schema.Version.WorkflowID,
		"version_id":  schema.Version.ID,
		"created_at":  schema.Version.CreatedAt,
		"changelog":   schema.Version.Changelog,
	}
	if schema.Version.ConfigJSON != nil {
		if outputSchema, ok := schema.Version.ConfigJSON["output_schema"]; ok {
			schemaPayload["output_schema"] = outputSchema
		}
		if inputMapping, ok := schema.Version.ConfigJSON["input_mapping"]; ok {
			schemaPayload["input_mapping"] = inputMapping
		}
	}

	cacheable := h.schemaCacheEnabled(schema.Workspace, cacheRequest, skipSession)
	var etag string
	if cacheable {
		etag = buildSchemaETag(schemaPayload, schema.Workspace, schema.Version)
	}
	h.setSchemaCacheHeaders(c, cacheable, etag)
	if cacheable && etagMatches(c.Request().Header.Get("If-None-Match"), etag) {
		return c.NoContent(http.StatusNotModified)
	}

	return successResponse(c, map[string]interface{}{
		"workspace":     schema.Workspace,
		"access_policy": buildRuntimeAccessPolicy(schema.Workspace),
		"session_id":    sessionIDOrEmpty(session),
		"schema":        schemaPayload,
	})
}

// ExecuteDomain 执行域名绑定的 Workspace Runtime
func (h *RuntimeHandler) ExecuteDomain(c echo.Context) error {
	startedAt := time.Now()
	workspaceID := "unknown"
	defer h.recordRuntimeMetrics(c, startedAt, &workspaceID)

	userID, err := h.getOptionalUserID(c)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "INVALID_TOKEN", "无效或过期的 Token")
	}

	var req RuntimeExecuteRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	triggerType := strings.TrimSpace(req.TriggerType)
	if triggerType == "" {
		triggerType = "workspace_runtime"
	}

	domain := h.getDomainHost(c)
	schema, err := h.runtimeService.GetSchemaByDomain(c.Request().Context(), domain, userID)
	if err != nil {
		return runtimeErrorResponse(c, err, "RUNTIME_FAILED", "执行失败")
	}
	if schema != nil {
		if schema.Workspace != nil {
			workspaceID = schema.Workspace.ID.String()
		}
	}

	normalizedSchema, err := uischema.Normalize(schema.Version.UISchema)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_UI_SCHEMA", "UI Schema 无效")
	}

	captchaToken := h.getCaptchaToken(c, req.CaptchaToken)
	accessResult, err := h.trackAnonymousAccess(c, &schema.RuntimeEntry, "runtime_execute", captchaToken, false)
	if err != nil {
		return runtimeErrorResponse(c, err, "RUNTIME_FAILED", "记录访问失败")
	}

	requireCaptcha := schema.Workspace != nil && schema.Workspace.RequireCaptcha
	if accessResult != nil && accessResult.Decision.RequireCaptcha {
		requireCaptcha = true
	}
	if err := h.ensureCaptcha(c, &schema.RuntimeEntry, captchaToken, requireCaptcha); err != nil {
		return h.handleCaptchaError(c, err)
	}

	var session *entity.WorkspaceSession
	if accessResult != nil {
		session = accessResult.Session
	}
	if session != nil {
		c.Response().Header().Set("X-Workspace-Session-Id", session.ID.String())
	}

	h.recordAnonymousAudit(c, &schema.RuntimeEntry, session, "runtime_execute", userID)

	if schema.Version.WorkflowID == nil {
		return errorResponse(c, http.StatusBadRequest, "WORKFLOW_REQUIRED", "Workspace 未绑定工作流")
	}

	inputPayload := req.Inputs
	if normalizedSchema != nil {
		mappedInputs, validationErr, err := uischema.MapInputs(normalizedSchema, req.Inputs)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_INPUTS", "输入校验失败")
		}
		if validationErr != nil {
			return errorResponseWithDetails(c, http.StatusBadRequest, "INVALID_INPUTS", "输入校验失败", validationErr.Errors)
		}
		inputPayload = mappedInputs
	}

	if h.billingService != nil {
		consumeResult, err := h.billingService.ConsumeUsage(c.Request().Context(), schema.Workspace.OwnerUserID, schema.Workspace.ID, service.ConsumeUsageRequest{
			Usage: map[string]float64{
				"requests": 1,
			},
		})
		if err != nil {
			switch err {
			case service.ErrBillingInvalidUsage, service.ErrBillingInvalidDimension:
				return errorResponse(c, http.StatusBadRequest, "INVALID_USAGE", "用量数据无效")
			case service.ErrWorkspaceNotFound:
				return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
			case service.ErrWorkspaceUnauthorized:
				return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
			default:
				return errorResponse(c, http.StatusInternalServerError, "BILLING_FAILED", "配额扣减失败")
			}
		}
		if consumeResult != nil && !consumeResult.Allowed {
			return errorResponseWithDetails(c, http.StatusForbidden, "QUOTA_EXCEEDED", "配额已超限", buildQuotaExceededDetails(consumeResult))
		}
	}

	inputs := entity.JSON(inputPayload)
	triggerData := buildRuntimeTriggerData(schema, session)
	execution, err := h.executionService.Execute(
		c.Request().Context(),
		*schema.Version.WorkflowID,
		schema.Workspace.OwnerUserID,
		inputs,
		triggerType,
		triggerData,
	)
	if err != nil {
		switch err {
		case service.ErrExecutionOverloaded:
			return errorResponse(c, http.StatusServiceUnavailable, "OVERLOADED", "系统繁忙，请稍后重试")
		case service.ErrWorkflowNotFound:
			return errorResponse(c, http.StatusNotFound, "WORKFLOW_NOT_FOUND", "工作流不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限执行工作流")
		default:
			return errorResponse(c, http.StatusInternalServerError, "EXECUTE_FAILED", "执行失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"execution_id": execution.ID,
		"status":       execution.Status,
		"workflow_id":  execution.WorkflowID,
		"started_at":   execution.StartedAt,
		"session_id":   sessionIDOrEmpty(session),
		"message":      "执行已开始",
	})
}

// Execute 执行 Workspace Runtime
func (h *RuntimeHandler) Execute(c echo.Context) error {
	startedAt := time.Now()
	workspaceID := "unknown"
	defer h.recordRuntimeMetrics(c, startedAt, &workspaceID)

	userID, err := h.getOptionalUserID(c)
	if err != nil {
		return errorResponse(c, http.StatusUnauthorized, "INVALID_TOKEN", "无效或过期的 Token")
	}

	var req RuntimeExecuteRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	triggerType := strings.TrimSpace(req.TriggerType)
	if triggerType == "" {
		triggerType = "workspace_runtime"
	}

	schema, err := h.resolveSchema(c, userID)
	if err != nil {
		return runtimeErrorResponse(c, err, "RUNTIME_FAILED", "执行失败")
	}
	if schema != nil {
		if schema.Workspace != nil {
			workspaceID = schema.Workspace.ID.String()
		}
	}

	captchaToken := h.getCaptchaToken(c, req.CaptchaToken)
	accessResult, err := h.trackAnonymousAccess(c, &schema.RuntimeEntry, "runtime_execute", captchaToken, false)
	if err != nil {
		return runtimeErrorResponse(c, err, "RUNTIME_FAILED", "记录访问失败")
	}

	requireCaptcha := schema.Workspace != nil && schema.Workspace.RequireCaptcha
	if accessResult != nil && accessResult.Decision.RequireCaptcha {
		requireCaptcha = true
	}
	if err := h.ensureCaptcha(c, &schema.RuntimeEntry, captchaToken, requireCaptcha); err != nil {
		return h.handleCaptchaError(c, err)
	}

	var session *entity.WorkspaceSession
	if accessResult != nil {
		session = accessResult.Session
	}

	normalizedSchema, err := uischema.Normalize(schema.Version.UISchema)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_UI_SCHEMA", "UI Schema 无效")
	}

	if session != nil {
		c.Response().Header().Set("X-Workspace-Session-Id", session.ID.String())
	}

	h.recordAnonymousAudit(c, &schema.RuntimeEntry, session, "runtime_execute", userID)

	if schema.Version.WorkflowID == nil {
		return errorResponse(c, http.StatusBadRequest, "WORKFLOW_REQUIRED", "Workspace 未绑定工作流")
	}

	inputPayload := req.Inputs
	if normalizedSchema != nil {
		mappedInputs, validationErr, err := uischema.MapInputs(normalizedSchema, req.Inputs)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_INPUTS", "输入校验失败")
		}
		if validationErr != nil {
			return errorResponseWithDetails(c, http.StatusBadRequest, "INVALID_INPUTS", "输入校验失败", validationErr.Errors)
		}
		inputPayload = mappedInputs
	}

	if h.billingService != nil {
		consumeResult, err := h.billingService.ConsumeUsage(c.Request().Context(), schema.Workspace.OwnerUserID, schema.Workspace.ID, service.ConsumeUsageRequest{
			Usage: map[string]float64{
				"requests": 1,
			},
		})
		if err != nil {
			switch err {
			case service.ErrBillingInvalidUsage, service.ErrBillingInvalidDimension:
				return errorResponse(c, http.StatusBadRequest, "INVALID_USAGE", "用量数据无效")
			case service.ErrWorkspaceNotFound:
				return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
			case service.ErrWorkspaceUnauthorized:
				return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
			default:
				return errorResponse(c, http.StatusInternalServerError, "BILLING_FAILED", "配额扣减失败")
			}
		}
		if consumeResult != nil && !consumeResult.Allowed {
			return errorResponseWithDetails(c, http.StatusForbidden, "QUOTA_EXCEEDED", "配额已超限", buildQuotaExceededDetails(consumeResult))
		}
	}

	inputs := entity.JSON(inputPayload)
	triggerData := buildRuntimeTriggerData(schema, session)
	execution, err := h.executionService.Execute(
		c.Request().Context(),
		*schema.Version.WorkflowID,
		schema.Workspace.OwnerUserID,
		inputs,
		triggerType,
		triggerData,
	)
	if err != nil {
		status := http.StatusInternalServerError
		errorCode := "EXECUTE_FAILED"
		message := "执行失败"
		switch err {
		case service.ErrExecutionOverloaded:
			status = http.StatusServiceUnavailable
			errorCode = "OVERLOADED"
			message = "系统繁忙，请稍后重试"
		case service.ErrWorkflowNotFound:
			status = http.StatusNotFound
			errorCode = "WORKFLOW_NOT_FOUND"
			message = "工作流不存在"
		case service.ErrUnauthorized:
			status = http.StatusForbidden
			errorCode = "FORBIDDEN"
			message = "无权限执行工作流"
		}
		_ = h.runtimeService.RecordRuntimeEvent(c.Request().Context(), &schema.RuntimeEntry, session, service.RuntimeEventExecuteFailed, entity.JSON{
			"trigger_type": triggerType,
			"error_code":   errorCode,
		})
		return errorResponse(c, status, errorCode, message)
	}

	_ = h.runtimeService.RecordRuntimeEvent(c.Request().Context(), &schema.RuntimeEntry, session, service.RuntimeEventExecuteSuccess, entity.JSON{
		"trigger_type": triggerType,
		"execution_id": execution.ID,
		"status":       execution.Status,
	})

	return successResponse(c, map[string]interface{}{
		"execution_id": execution.ID,
		"status":       execution.Status,
		"workflow_id":  execution.WorkflowID,
		"started_at":   execution.StartedAt,
		"session_id":   sessionIDOrEmpty(session),
		"message":      "执行已开始",
	})
}

func (h *RuntimeHandler) getOptionalUserID(c echo.Context) (*uuid.UUID, error) {
	authHeader := strings.TrimSpace(c.Request().Header.Get("Authorization"))
	if authHeader == "" {
		return nil, nil
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return nil, jwt.ErrInvalidKey
	}

	token, err := jwt.Parse(parts[1], func(token *jwt.Token) (interface{}, error) {
		return []byte(h.jwtCfg.Secret), nil
	})
	if err != nil || !token.Valid {
		return nil, jwt.ErrInvalidKey
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, jwt.ErrInvalidKey
	}

	userID, ok := claims["user_id"].(string)
	if !ok || strings.TrimSpace(userID) == "" {
		return nil, jwt.ErrInvalidKey
	}

	parsed, err := uuid.Parse(userID)
	if err != nil {
		return nil, jwt.ErrInvalidKey
	}

	return &parsed, nil
}

func (h *RuntimeHandler) getOptionalSessionID(c echo.Context) *uuid.UUID {
	sessionID := strings.TrimSpace(c.Request().Header.Get("X-Workspace-Session-Id"))
	if sessionID == "" {
		sessionID = strings.TrimSpace(c.Request().Header.Get("X-Workspace-Session"))
	}
	if sessionID == "" {
		sessionID = strings.TrimSpace(c.Request().Header.Get("X-App-Session-Id"))
	}
	if sessionID == "" {
		sessionID = strings.TrimSpace(c.Request().Header.Get("X-App-Session"))
	}
	if sessionID == "" {
		sessionID = strings.TrimSpace(c.QueryParam("session_id"))
	}
	if sessionID == "" {
		return nil
	}

	parsed, err := uuid.Parse(sessionID)
	if err != nil {
		return nil
	}
	return &parsed
}

func (h *RuntimeHandler) resolveEntry(c echo.Context, userID *uuid.UUID) (*service.RuntimeEntry, error) {
	if h.shouldPreferDomain(c) {
		domain := h.getDomainHost(c)
		return h.runtimeService.GetEntryByDomain(c.Request().Context(), domain, userID)
	}
	return h.runtimeService.GetEntry(
		c.Request().Context(),
		c.Param("workspaceSlug"),
		userID,
	)
}

func (h *RuntimeHandler) resolveSchema(c echo.Context, userID *uuid.UUID) (*service.RuntimeSchema, error) {
	if h.shouldPreferDomain(c) {
		domain := h.getDomainHost(c)
		return h.runtimeService.GetSchemaByDomain(c.Request().Context(), domain, userID)
	}
	return h.runtimeService.GetSchema(
		c.Request().Context(),
		c.Param("workspaceSlug"),
		userID,
	)
}

func (h *RuntimeHandler) shouldPreferDomain(c echo.Context) bool {
	if len(h.baseHosts) == 0 {
		return false
	}
	host := h.getDomainHost(c)
	if host == "" {
		return false
	}
	if _, ok := h.baseHosts[host]; ok {
		return false
	}
	return true
}

func (h *RuntimeHandler) getDomainHost(c echo.Context) string {
	raw := strings.TrimSpace(c.Request().Header.Get("X-Forwarded-Host"))
	if raw == "" {
		raw = parseForwardedHost(c.Request().Header.Get("Forwarded"))
	}
	if raw == "" {
		raw = strings.TrimSpace(c.Request().Host)
	}
	if raw == "" {
		return ""
	}
	if strings.Contains(raw, ",") {
		raw = strings.TrimSpace(strings.Split(raw, ",")[0])
	}
	if host, _, err := net.SplitHostPort(raw); err == nil {
		raw = host
	}
	raw = strings.ToLower(strings.TrimSpace(raw))
	return strings.TrimSuffix(raw, ".")
}

func parseForwardedHost(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return ""
	}
	if strings.Contains(trimmed, ",") {
		trimmed = strings.TrimSpace(strings.Split(trimmed, ",")[0])
	}
	for _, segment := range strings.Split(trimmed, ";") {
		part := strings.TrimSpace(segment)
		if part == "" {
			continue
		}
		kv := strings.SplitN(part, "=", 2)
		if len(kv) != 2 {
			continue
		}
		key := strings.TrimSpace(kv[0])
		if !strings.EqualFold(key, "host") {
			continue
		}
		host := strings.TrimSpace(kv[1])
		host = strings.Trim(host, "\"")
		return strings.TrimSpace(host)
	}
	return ""
}

func buildRuntimeBaseHosts(baseURL string, regionBaseURLs map[string]string) map[string]struct{} {
	hosts := make(map[string]struct{})
	addHost := func(value string) {
		if host := normalizeRuntimeHost(value); host != "" {
			hosts[host] = struct{}{}
		}
	}

	addHost(baseURL)
	for _, value := range regionBaseURLs {
		addHost(value)
	}

	for _, host := range []string{"localhost", "127.0.0.1", "::1"} {
		hosts[host] = struct{}{}
	}
	return hosts
}

func normalizeRuntimeHost(value string) string {
	trimmed := strings.TrimSpace(strings.ToLower(value))
	if trimmed == "" {
		return ""
	}
	if !strings.Contains(trimmed, "://") {
		trimmed = "http://" + trimmed
	}
	parsed, err := url.Parse(trimmed)
	if err != nil {
		return ""
	}
	host := strings.TrimSpace(parsed.Host)
	if host == "" {
		host = strings.TrimSpace(parsed.Path)
	}
	if host == "" {
		return ""
	}
	if strings.Contains(host, ",") {
		host = strings.TrimSpace(strings.Split(host, ",")[0])
	}
	if normalized, _, err := net.SplitHostPort(host); err == nil {
		host = normalized
	}
	host = strings.ToLower(strings.TrimSpace(host))
	return strings.TrimSuffix(host, ".")
}

func runtimeErrorResponse(c echo.Context, err error, fallbackCode, fallbackMessage string) error {
	if status, code, message, ok := mapRuntimeError(err); ok {
		return errorResponse(c, status, code, message)
	}
	return errorResponse(c, http.StatusInternalServerError, fallbackCode, fallbackMessage)
}

func mapRuntimeError(err error) (int, string, string, bool) {
	if err == nil {
		return 0, "", "", false
	}
	switch {
	case errors.Is(err, jwt.ErrInvalidKey):
		return http.StatusUnauthorized, "INVALID_TOKEN", "无效或过期的 Token", true
	case errors.Is(err, service.ErrRuntimeDomainNotFound):
		return http.StatusNotFound, "DOMAIN_NOT_FOUND", "域名未绑定", true
	case errors.Is(err, service.ErrRuntimeDomainBlocked):
		return http.StatusForbidden, "DOMAIN_BLOCKED", "域名已被封禁", true
	case errors.Is(err, service.ErrRuntimeDomainNotActive):
		return http.StatusConflict, "DOMAIN_NOT_ACTIVE", "域名未生效", true
	case errors.Is(err, service.ErrRuntimeInvalidDomain):
		return http.StatusBadRequest, "INVALID_DOMAIN", "域名无效", true
	case errors.Is(err, service.ErrRuntimeWorkspaceNotFound),
		errors.Is(err, service.ErrRuntimeNotPublished):
		return http.StatusNotFound, "NOT_FOUND", "Workspace 不存在或未发布", true
	case errors.Is(err, service.ErrRuntimeAuthRequired):
		return http.StatusUnauthorized, "UNAUTHORIZED", "需要登录后访问", true
	case errors.Is(err, service.ErrRuntimeAccessDenied):
		return http.StatusForbidden, "FORBIDDEN", "无权限访问该 Workspace", true
	case errors.Is(err, service.ErrRuntimeInvalidSlug):
		return http.StatusBadRequest, "INVALID_SLUG", "访问入口参数无效", true
	case errors.Is(err, service.ErrRuntimeVersionRequired),
		errors.Is(err, service.ErrRuntimeVersionNotFound):
		return http.StatusBadRequest, "VERSION_REQUIRED", "Workspace 版本未就绪", true
	case errors.Is(err, service.ErrRuntimeRateLimited):
		return http.StatusTooManyRequests, "RATE_LIMITED", "访问过于频繁", true
	case errors.Is(err, service.ErrRuntimeOverloaded):
		return http.StatusServiceUnavailable, "OVERLOADED", "系统繁忙，请稍后重试", true
	case errors.Is(err, service.ErrRuntimeIPBlocked):
		return http.StatusForbidden, "IP_BLOCKED", "访问已被封禁", true
	case errors.Is(err, service.ErrRuntimeSessionBlocked):
		return http.StatusForbidden, "SESSION_BLOCKED", "会话已被封禁", true
	default:
		return 0, "", "", false
	}
}

func (h *RuntimeHandler) trackAnonymousAccess(c echo.Context, entry *service.RuntimeEntry, eventType string, captchaToken string, skipSession bool) (*service.RuntimeAccessResult, error) {
	if entry == nil {
		return nil, nil
	}

	result, err := h.runtimeService.TrackAnonymousAccess(c.Request().Context(), entry, service.RuntimeAccessMeta{
		SessionID:       h.getOptionalSessionID(c),
		IP:              c.RealIP(),
		UserAgent:       c.Request().UserAgent(),
		EventType:       eventType,
		Path:            c.Request().URL.Path,
		CaptchaProvided: strings.TrimSpace(captchaToken) != "",
		SkipSession:     skipSession,
	})
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (h *RuntimeHandler) recordAnonymousAudit(c echo.Context, entry *service.RuntimeEntry, session *entity.WorkspaceSession, eventType string, userID *uuid.UUID) {
	if h.auditLogService == nil || entry == nil || entry.Workspace == nil {
		return
	}
	if strings.ToLower(strings.TrimSpace(entry.Workspace.AccessMode)) != "public_anonymous" {
		return
	}
	if userID != nil {
		return
	}
	metadata := entity.JSON{
		"event_type":  eventType,
		"access_mode": entry.Workspace.AccessMode,
	}
	if session != nil {
		metadata["session_id"] = session.ID.String()
	}
	metadata = buildAuditMetadata(c, metadata)
	_, _ = h.auditLogService.Record(c.Request().Context(), service.AuditLogRecordRequest{
		WorkspaceID: entry.Workspace.ID,
		ActorUserID: nil,
		Action:      "anonymous_access",
		TargetType:  "workspace",
		TargetID:    &entry.Workspace.ID,
		Metadata:    metadata,
	})
}

func (h *RuntimeHandler) ensureCaptcha(c echo.Context, entry *service.RuntimeEntry, token string, requireCaptcha bool) error {
	if entry == nil || entry.Workspace == nil {
		return nil
	}
	if !requireCaptcha {
		return nil
	}
	if strings.ToLower(strings.TrimSpace(entry.Workspace.AccessMode)) != "public_anonymous" {
		return nil
	}
	if strings.TrimSpace(token) == "" {
		return service.ErrCaptchaRequired
	}
	if h.captchaVerifier == nil {
		return service.ErrCaptchaUnavailable
	}
	return h.captchaVerifier.Verify(c.Request().Context(), token, c.RealIP())
}

func (h *RuntimeHandler) getCaptchaToken(c echo.Context, fallback string) string {
	token := strings.TrimSpace(c.Request().Header.Get("X-Workspace-Captcha-Token"))
	if token == "" {
		token = strings.TrimSpace(c.Request().Header.Get("X-App-Captcha-Token"))
	}
	if token == "" {
		token = strings.TrimSpace(c.QueryParam("captcha_token"))
	}
	if token == "" {
		token = strings.TrimSpace(fallback)
	}
	return token
}

func (h *RuntimeHandler) handleCaptchaError(c echo.Context, err error) error {
	switch err {
	case service.ErrCaptchaRequired:
		return errorResponse(c, http.StatusBadRequest, "CAPTCHA_REQUIRED", "需要验证码")
	case service.ErrCaptchaInvalid:
		return errorResponse(c, http.StatusBadRequest, "CAPTCHA_INVALID", "验证码无效")
	case service.ErrCaptchaUnavailable:
		return errorResponse(c, http.StatusServiceUnavailable, "CAPTCHA_UNAVAILABLE", "验证码服务不可用")
	default:
		return errorResponse(c, http.StatusInternalServerError, "RUNTIME_FAILED", "验证码校验失败")
	}
}

func (h *RuntimeHandler) shouldUseSchemaCache(c echo.Context) bool {
	raw := strings.TrimSpace(c.QueryParam("cache"))
	if raw == "" {
		return false
	}
	switch strings.ToLower(raw) {
	case "1", "true", "yes", "y":
		return true
	default:
		return false
	}
}

func (h *RuntimeHandler) schemaCacheEnabled(workspace *entity.Workspace, cacheRequest bool, skipSession bool) bool {
	if !cacheRequest || !skipSession || workspace == nil {
		return false
	}
	mode := strings.ToLower(strings.TrimSpace(workspace.AccessMode))
	return mode == "public_anonymous"
}

func (h *RuntimeHandler) setSchemaCacheHeaders(c echo.Context, cacheable bool, etag string) {
	if etag != "" {
		c.Response().Header().Set("ETag", etag)
	}
	if !cacheable || h.schemaCacheTTL <= 0 {
		c.Response().Header().Set("Cache-Control", "no-store")
		return
	}
	ttlSeconds := int(h.schemaCacheTTL.Seconds())
	cacheControl := "public, max-age=" + strconv.Itoa(ttlSeconds) + ", s-maxage=" + strconv.Itoa(ttlSeconds)
	if h.schemaStaleTTL > 0 {
		staleSeconds := int(h.schemaStaleTTL.Seconds())
		if staleSeconds > 0 {
			cacheControl += ", stale-while-revalidate=" + strconv.Itoa(staleSeconds)
		}
	}
	c.Response().Header().Set("Cache-Control", cacheControl)
	c.Response().Header().Set("Vary", "Accept-Encoding")
}

func buildSchemaETag(schemaPayload map[string]interface{}, workspace *entity.Workspace, version *entity.WorkspaceVersion) string {
	payload := map[string]interface{}{
		"schema": schemaPayload,
	}
	if workspace != nil {
		payload["workspace_id"] = workspace.ID
		payload["workspace_updated_at"] = workspace.UpdatedAt
		payload["access_mode"] = workspace.AccessMode
		payload["data_classification"] = workspace.DataClassification
	}
	if version != nil {
		payload["version_id"] = version.ID
		payload["version_created_at"] = version.CreatedAt
	}
	bytes, _ := json.Marshal(payload)
	sum := sha256.Sum256(bytes)
	return `"` + hex.EncodeToString(sum[:]) + `"`
}

func etagMatches(headerValue string, etag string) bool {
	if strings.TrimSpace(headerValue) == "" || strings.TrimSpace(etag) == "" {
		return false
	}
	target := strings.Trim(etag, "\"")
	for _, part := range strings.Split(headerValue, ",") {
		candidate := strings.TrimSpace(part)
		candidate = strings.Trim(candidate, "\"")
		if candidate == target {
			return true
		}
	}
	return false
}

func sessionIDOrEmpty(session *entity.WorkspaceSession) string {
	if session == nil {
		return ""
	}
	return session.ID.String()
}

func (h *RuntimeHandler) recordRuntimeMetrics(c echo.Context, startedAt time.Time, workspaceID *string) {
	if h.metrics == nil {
		return
	}
	status := c.Response().Status
	if status == 0 {
		status = http.StatusOK
	}
	resolvedWorkspace := resolveRuntimeMetricLabel(workspaceID)
	h.metrics.RecordRuntimeRequest(resolvedWorkspace, runtimeStatusLabel(status), time.Since(startedAt).Seconds())
}

func resolveRuntimeMetricLabel(value *string) string {
	if value == nil {
		return "unknown"
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return "unknown"
	}
	return trimmed
}

func runtimeStatusLabel(code int) string {
	switch {
	case code >= 200 && code < 300:
		return "2xx"
	case code >= 300 && code < 400:
		return "3xx"
	case code >= 400 && code < 500:
		return "4xx"
	case code >= 500:
		return "5xx"
	default:
		return "unknown"
	}
}

func buildRuntimeTriggerData(schema *service.RuntimeSchema, session *entity.WorkspaceSession) entity.JSON {
	if schema == nil || schema.Workspace == nil || schema.Version == nil {
		return nil
	}
	data := entity.JSON{
		"source":               "workspace_runtime",
		"workspace_id":         schema.Workspace.ID.String(),
		"workspace_version_id": schema.Version.ID.String(),
	}
	if schema.Version.WorkflowID != nil {
		data["workflow_id"] = schema.Version.WorkflowID.String()
	}
	if strings.TrimSpace(schema.Workspace.AccessMode) != "" {
		data["access_mode"] = schema.Workspace.AccessMode
	}
	if session != nil {
		data["session_id"] = session.ID.String()
	}
	return data
}
