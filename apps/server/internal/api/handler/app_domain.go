package handler

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/queue"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// AppDomainHandler App 域名处理器
type AppDomainHandler struct {
	domainService   service.AppDomainService
	appService      service.AppService
	auditLogService service.AuditLogService
	taskQueue       *queue.Queue
}

// NewAppDomainHandler 创建 App 域名处理器
func NewAppDomainHandler(domainService service.AppDomainService, appService service.AppService, auditLogService service.AuditLogService, taskQueue *queue.Queue) *AppDomainHandler {
	return &AppDomainHandler{
		domainService:   domainService,
		appService:      appService,
		auditLogService: auditLogService,
		taskQueue:       taskQueue,
	}
}

type CreateAppDomainRequest struct {
	Domain string `json:"domain"`
}

type UpdateDomainExpiryRequest struct {
	DomainExpiresAt *string `json:"domain_expires_at"`
}

type BlockDomainRequest struct {
	Reason string `json:"reason"`
}

// List 获取 App 域名列表
func (h *AppDomainHandler) List(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "APP_INVALID_ID", "App ID 无效")
	}

	domains, err := h.domainService.ListByApp(c.Request().Context(), uid, appID)
	if err != nil {
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "APP_NOT_FOUND", "App 不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问该 App")
		default:
			return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取域名列表失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"domains": domains,
	})
}

// Create 创建 App 域名
func (h *AppDomainHandler) Create(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "APP_INVALID_ID", "App ID 无效")
	}

	var req CreateAppDomainRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	result, err := h.domainService.Create(c.Request().Context(), uid, appID, service.CreateAppDomainRequest{
		Domain: req.Domain,
	})
	if err != nil {
		switch err {
		case service.ErrAppNotFound:
			return errorResponse(c, http.StatusNotFound, "APP_NOT_FOUND", "App 不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问该 App")
		case service.ErrAppDomainInvalid:
			return errorResponse(c, http.StatusBadRequest, "INVALID_DOMAIN", "域名格式无效")
		case service.ErrAppDomainReserved:
			return errorResponse(c, http.StatusConflict, "DOMAIN_RESERVED", "域名为平台保留域名")
		case service.ErrAppDomainExists:
			return errorResponse(c, http.StatusConflict, "DOMAIN_EXISTS", "域名已绑定")
		default:
			return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "创建域名失败")
		}
	}

	h.recordAuditForApp(c, uid, appID, "app.domain.create", "app_domain", &result.Domain.ID, entity.JSON{
		"domain": result.Domain.Domain,
		"status": result.Domain.Status,
	})

	return successResponse(c, map[string]interface{}{
		"domain":       result.Domain,
		"verification": result.Verification,
	})
}

// VerifyByID 验证域名（不依赖 app_id）
func (h *AppDomainHandler) VerifyByID(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	domainID, err := uuid.Parse(c.Param("domainId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "DOMAIN_INVALID_ID", "域名 ID 无效")
	}

	result, err := h.domainService.VerifyByID(c.Request().Context(), uid, domainID)
	if err != nil {
		switch err {
		case service.ErrAppNotFound, service.ErrAppDomainNotFound:
			return errorResponse(c, http.StatusNotFound, "DOMAIN_NOT_FOUND", "域名不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问该 App")
		case service.ErrAppDomainBlocked:
			return errorResponse(c, http.StatusForbidden, "DOMAIN_BLOCKED", "域名已被封禁")
		case service.ErrAppDomainInvalidToken:
			return errorResponse(c, http.StatusBadRequest, "INVALID_TOKEN", "验证 token 无效")
		case service.ErrAppDomainVerificationFailed:
			return errorResponse(c, http.StatusBadRequest, "VERIFICATION_FAILED", "域名验证失败")
		default:
			return errorResponse(c, http.StatusInternalServerError, "VERIFY_FAILED", "验证域名失败")
		}
	}

	h.recordAuditForApp(c, uid, result.Domain.AppID, "app.domain.verify", "app_domain", &result.Domain.ID, entity.JSON{
		"domain":   result.Domain.Domain,
		"verified": result.Verified,
		"method":   result.Method,
	})

	return successResponse(c, map[string]interface{}{
		"domain":       result.Domain,
		"verified":     result.Verified,
		"method":       result.Method,
		"verification": result.Verification,
	})
}

// Verify 验证域名
func (h *AppDomainHandler) Verify(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "APP_INVALID_ID", "App ID 无效")
	}

	domainID, err := uuid.Parse(c.Param("domainId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "DOMAIN_INVALID_ID", "域名 ID 无效")
	}

	if isAsyncRequest(c) {
		if h.taskQueue == nil {
			return errorResponse(c, http.StatusServiceUnavailable, "QUEUE_UNAVAILABLE", "任务队列不可用")
		}
		result, err := h.taskQueue.EnqueueDomainVerify(c.Request().Context(), &queue.DomainVerifyPayload{
			DomainID: domainID.String(),
			OwnerID:  uid.String(),
		}, nil)
		if err != nil {
			return errorResponse(c, http.StatusInternalServerError, "QUEUE_ENQUEUE_FAILED", "任务入队失败")
		}
		return successResponse(c, map[string]interface{}{
			"queued": true,
			"task":   result,
		})
	}

	result, err := h.domainService.Verify(c.Request().Context(), uid, appID, domainID)
	if err != nil {
		var verifyErr *service.DomainVerifyError
		if errors.As(err, &verifyErr) {
			details := map[string]interface{}{
				"domain":       verifyErr.Domain,
				"retry_at":     verifyErr.NextRetryAt,
				"support_url":  verifyErr.SupportURL,
				"verification": verifyErr.Verification,
			}
			switch {
			case errors.Is(err, service.ErrAppDomainRetryLater):
				return errorResponseWithDetails(c, http.StatusTooManyRequests, "RETRY_LATER", "请稍后重试域名验证", details)
			case errors.Is(err, service.ErrAppDomainSupportRequired):
				return errorResponseWithDetails(c, http.StatusBadRequest, "SUPPORT_REQUIRED", "域名验证失败，请联系客服处理", details)
			default:
				return errorResponseWithDetails(c, http.StatusBadRequest, "VERIFICATION_FAILED", "域名验证失败", details)
			}
		}
		switch err {
		case service.ErrAppNotFound, service.ErrAppDomainNotFound:
			return errorResponse(c, http.StatusNotFound, "DOMAIN_NOT_FOUND", "域名不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问该 App")
		case service.ErrAppDomainBlocked:
			return errorResponse(c, http.StatusForbidden, "DOMAIN_BLOCKED", "域名已被封禁")
		case service.ErrAppDomainInvalidToken:
			return errorResponse(c, http.StatusBadRequest, "INVALID_TOKEN", "验证 token 无效")
		case service.ErrAppDomainVerificationFailed:
			return errorResponse(c, http.StatusBadRequest, "VERIFICATION_FAILED", "域名验证失败")
		default:
			return errorResponse(c, http.StatusInternalServerError, "VERIFY_FAILED", "验证域名失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"domain":       result.Domain,
		"verified":     result.Verified,
		"method":       result.Method,
		"verification": result.Verification,
	})
}

// IssueCertificate 签发证书
func (h *AppDomainHandler) IssueCertificate(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "APP_INVALID_ID", "App ID 无效")
	}

	domainID, err := uuid.Parse(c.Param("domainId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "DOMAIN_INVALID_ID", "域名 ID 无效")
	}

	domain, err := h.domainService.IssueCertificate(c.Request().Context(), uid, appID, domainID)
	if err != nil {
		var sslErr *service.SSLIssueError
		if errors.As(err, &sslErr) {
			details := map[string]interface{}{
				"domain":      sslErr.Domain,
				"retry_at":    sslErr.NextRetryAt,
				"support_url": sslErr.SupportURL,
			}
			switch {
			case errors.Is(err, service.ErrAppDomainSSLRetryLater):
				return errorResponseWithDetails(c, http.StatusTooManyRequests, "SSL_RETRY_LATER", "证书签发处理中，请稍后重试", details)
			case errors.Is(err, service.ErrAppDomainSSLSupportRequired):
				return errorResponseWithDetails(c, http.StatusBadRequest, "SSL_SUPPORT_REQUIRED", "证书签发失败，请联系客服处理", details)
			default:
				return errorResponseWithDetails(c, http.StatusInternalServerError, "SSL_ISSUE_FAILED", "签发证书失败", details)
			}
		}
		switch err {
		case service.ErrAppNotFound, service.ErrAppDomainNotFound:
			return errorResponse(c, http.StatusNotFound, "DOMAIN_NOT_FOUND", "域名不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问该 App")
		case service.ErrAppDomainBlocked:
			return errorResponse(c, http.StatusForbidden, "DOMAIN_BLOCKED", "域名已被封禁")
		case service.ErrAppDomainNotVerified:
			return errorResponse(c, http.StatusBadRequest, "DOMAIN_NOT_VERIFIED", "域名未验证")
		case service.ErrAppDomainCertificateIssueFailed:
			return errorResponse(c, http.StatusBadGateway, "CERT_ISSUE_FAILED", "证书签发失败")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ISSUE_FAILED", "签发证书失败")
		}
	}

	h.recordAuditForApp(c, uid, appID, "app.domain.issue_cert", "app_domain", &domain.ID, entity.JSON{
		"domain":     domain.Domain,
		"ssl_status": domain.SSLStatus,
	})

	return successResponse(c, map[string]interface{}{
		"domain": domain,
	})
}

// RenewCertificate 续期证书
func (h *AppDomainHandler) RenewCertificate(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "APP_INVALID_ID", "App ID 无效")
	}

	domainID, err := uuid.Parse(c.Param("domainId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "DOMAIN_INVALID_ID", "域名 ID 无效")
	}

	domain, err := h.domainService.RenewCertificate(c.Request().Context(), uid, appID, domainID)
	if err != nil {
		var sslErr *service.SSLIssueError
		if errors.As(err, &sslErr) {
			details := map[string]interface{}{
				"domain":      sslErr.Domain,
				"retry_at":    sslErr.NextRetryAt,
				"support_url": sslErr.SupportURL,
			}
			switch {
			case errors.Is(err, service.ErrAppDomainSSLRetryLater):
				return errorResponseWithDetails(c, http.StatusTooManyRequests, "SSL_RETRY_LATER", "证书续期处理中，请稍后重试", details)
			case errors.Is(err, service.ErrAppDomainSSLSupportRequired):
				return errorResponseWithDetails(c, http.StatusBadRequest, "SSL_SUPPORT_REQUIRED", "证书续期失败，请联系客服处理", details)
			default:
				return errorResponseWithDetails(c, http.StatusInternalServerError, "SSL_RENEW_FAILED", "续期证书失败", details)
			}
		}
		switch err {
		case service.ErrAppNotFound, service.ErrAppDomainNotFound:
			return errorResponse(c, http.StatusNotFound, "DOMAIN_NOT_FOUND", "域名不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问该 App")
		case service.ErrAppDomainBlocked:
			return errorResponse(c, http.StatusForbidden, "DOMAIN_BLOCKED", "域名已被封禁")
		case service.ErrAppDomainSSLNotIssued:
			return errorResponse(c, http.StatusBadRequest, "SSL_NOT_ISSUED", "证书未签发")
		case service.ErrAppDomainSSLNotDue:
			return errorResponse(c, http.StatusConflict, "SSL_NOT_DUE", "证书尚未到期")
		case service.ErrAppDomainCertificateRenewFailed:
			return errorResponse(c, http.StatusBadGateway, "CERT_RENEW_FAILED", "证书续期失败")
		default:
			return errorResponse(c, http.StatusInternalServerError, "RENEW_FAILED", "续期证书失败")
		}
	}

	h.recordAuditForApp(c, uid, appID, "app.domain.renew_cert", "app_domain", &domain.ID, entity.JSON{
		"domain":     domain.Domain,
		"ssl_status": domain.SSLStatus,
	})

	return successResponse(c, map[string]interface{}{
		"domain": domain,
	})
}

// Activate 域名路由生效
func (h *AppDomainHandler) Activate(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "APP_INVALID_ID", "App ID 无效")
	}

	domainID, err := uuid.Parse(c.Param("domainId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "DOMAIN_INVALID_ID", "域名 ID 无效")
	}

	domain, err := h.domainService.Activate(c.Request().Context(), uid, appID, domainID)
	if err != nil {
		switch err {
		case service.ErrAppNotFound, service.ErrAppDomainNotFound:
			return errorResponse(c, http.StatusNotFound, "DOMAIN_NOT_FOUND", "域名不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问该 App")
		case service.ErrAppDomainBlocked:
			return errorResponse(c, http.StatusForbidden, "DOMAIN_BLOCKED", "域名已被封禁")
		case service.ErrAppDomainNotVerified:
			return errorResponse(c, http.StatusBadRequest, "DOMAIN_NOT_VERIFIED", "域名未验证")
		case service.ErrAppDomainSSLNotIssued:
			return errorResponse(c, http.StatusBadRequest, "SSL_NOT_ISSUED", "证书未签发")
		case service.ErrAppDomainRoutingFailed:
			return errorResponse(c, http.StatusBadGateway, "ROUTING_FAILED", "域名切流失败")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ACTIVATE_FAILED", "域名生效失败")
		}
	}

	h.recordAuditForApp(c, uid, appID, "app.domain.activate", "app_domain", &domain.ID, entity.JSON{
		"domain":     domain.Domain,
		"ssl_status": domain.SSLStatus,
	})

	return successResponse(c, map[string]interface{}{
		"domain": domain,
	})
}

// Rollback 域名路由回滚
func (h *AppDomainHandler) Rollback(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "APP_INVALID_ID", "App ID 无效")
	}

	domainID, err := uuid.Parse(c.Param("domainId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "DOMAIN_INVALID_ID", "域名 ID 无效")
	}

	domain, err := h.domainService.Rollback(c.Request().Context(), uid, appID, domainID)
	if err != nil {
		switch err {
		case service.ErrAppNotFound, service.ErrAppDomainNotFound:
			return errorResponse(c, http.StatusNotFound, "DOMAIN_NOT_FOUND", "域名不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问该 App")
		case service.ErrAppDomainBlocked:
			return errorResponse(c, http.StatusForbidden, "DOMAIN_BLOCKED", "域名已被封禁")
		case service.ErrAppDomainNotActive:
			return errorResponse(c, http.StatusBadRequest, "DOMAIN_NOT_ACTIVE", "域名未生效")
		case service.ErrAppDomainRoutingFailed:
			return errorResponse(c, http.StatusBadGateway, "ROUTING_FAILED", "域名回滚失败")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ROLLBACK_FAILED", "域名回滚失败")
		}
	}

	h.recordAuditForApp(c, uid, appID, "app.domain.rollback", "app_domain", &domain.ID, entity.JSON{
		"domain": domain.Domain,
		"status": domain.Status,
	})

	return successResponse(c, map[string]interface{}{
		"domain": domain,
	})
}

// UpdateExpiry 更新域名到期时间
func (h *AppDomainHandler) UpdateExpiry(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "APP_INVALID_ID", "App ID 无效")
	}

	domainID, err := uuid.Parse(c.Param("domainId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "DOMAIN_INVALID_ID", "域名 ID 无效")
	}

	var req UpdateDomainExpiryRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	var expiresAt *time.Time
	if req.DomainExpiresAt != nil && strings.TrimSpace(*req.DomainExpiresAt) != "" {
		parsed, err := time.Parse(time.RFC3339, strings.TrimSpace(*req.DomainExpiresAt))
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_EXPIRES_AT", "domain_expires_at 格式无效")
		}
		expiresAt = &parsed
	}

	domain, err := h.domainService.UpdateExpiry(c.Request().Context(), uid, appID, domainID, expiresAt)
	if err != nil {
		switch err {
		case service.ErrAppNotFound, service.ErrAppDomainNotFound:
			return errorResponse(c, http.StatusNotFound, "DOMAIN_NOT_FOUND", "域名不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问该 App")
		case service.ErrAppDomainBlocked:
			return errorResponse(c, http.StatusForbidden, "DOMAIN_BLOCKED", "域名已被封禁")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新域名到期时间失败")
		}
	}

	h.recordAuditForApp(c, uid, appID, "app.domain.expiry.update", "app_domain", &domain.ID, entity.JSON{
		"domain":            domain.Domain,
		"domain_expires_at": domain.DomainExpiresAt,
	})

	return successResponse(c, map[string]interface{}{
		"domain": domain,
	})
}

// Block 域名封禁
func (h *AppDomainHandler) Block(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "APP_INVALID_ID", "App ID 无效")
	}

	domainID, err := uuid.Parse(c.Param("domainId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "DOMAIN_INVALID_ID", "域名 ID 无效")
	}

	var req BlockDomainRequest
	_ = c.Bind(&req)

	domain, err := h.domainService.Block(c.Request().Context(), uid, appID, domainID, req.Reason)
	if err != nil {
		switch err {
		case service.ErrAppNotFound, service.ErrAppDomainNotFound:
			return errorResponse(c, http.StatusNotFound, "DOMAIN_NOT_FOUND", "域名不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问该 App")
		case service.ErrAppDomainAlreadyBlocked:
			return errorResponse(c, http.StatusConflict, "DOMAIN_BLOCKED", "域名已被封禁")
		default:
			return errorResponse(c, http.StatusInternalServerError, "BLOCK_FAILED", "封禁域名失败")
		}
	}

	h.recordAuditForApp(c, uid, appID, "app.domain.block", "app_domain", &domain.ID, entity.JSON{
		"domain":         domain.Domain,
		"blocked_reason": domain.BlockedReason,
	})

	return successResponse(c, map[string]interface{}{
		"domain": domain,
	})
}

// Unblock 域名解封
func (h *AppDomainHandler) Unblock(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "APP_INVALID_ID", "App ID 无效")
	}

	domainID, err := uuid.Parse(c.Param("domainId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "DOMAIN_INVALID_ID", "域名 ID 无效")
	}

	domain, err := h.domainService.Unblock(c.Request().Context(), uid, appID, domainID)
	if err != nil {
		switch err {
		case service.ErrAppNotFound, service.ErrAppDomainNotFound:
			return errorResponse(c, http.StatusNotFound, "DOMAIN_NOT_FOUND", "域名不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问该 App")
		case service.ErrAppDomainNotBlocked:
			return errorResponse(c, http.StatusConflict, "DOMAIN_NOT_BLOCKED", "域名未被封禁")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UNBLOCK_FAILED", "解封域名失败")
		}
	}

	h.recordAuditForApp(c, uid, appID, "app.domain.unblock", "app_domain", &domain.ID, entity.JSON{
		"domain": domain.Domain,
		"status": domain.Status,
	})

	return successResponse(c, map[string]interface{}{
		"domain": domain,
	})
}

// Delete 删除域名
func (h *AppDomainHandler) Delete(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "APP_INVALID_ID", "App ID 无效")
	}

	domainID, err := uuid.Parse(c.Param("domainId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "DOMAIN_INVALID_ID", "域名 ID 无效")
	}

	if err := h.domainService.Delete(c.Request().Context(), uid, appID, domainID); err != nil {
		switch err {
		case service.ErrAppNotFound, service.ErrAppDomainNotFound:
			return errorResponse(c, http.StatusNotFound, "DOMAIN_NOT_FOUND", "域名不存在")
		case service.ErrAppUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问该 App")
		case service.ErrAppDomainActive:
			return errorResponse(c, http.StatusConflict, "DOMAIN_ACTIVE", "请先回滚生效域名")
		default:
			return errorResponse(c, http.StatusInternalServerError, "DELETE_FAILED", "删除域名失败")
		}
	}

	h.recordAuditForApp(c, uid, appID, "app.domain.delete", "app_domain", &domainID, entity.JSON{
		"domain_id": domainID.String(),
	})

	return successResponse(c, map[string]interface{}{
		"deleted": true,
	})
}

func (h *AppDomainHandler) recordAuditForApp(ctx echo.Context, actorID uuid.UUID, appID uuid.UUID, action string, targetType string, targetID *uuid.UUID, metadata entity.JSON) {
	if h.auditLogService == nil {
		return
	}
	if h.appService == nil {
		return
	}
	app, err := h.appService.GetByID(ctx.Request().Context(), appID, actorID)
	if err != nil {
		return
	}
	metadata = buildAuditMetadata(ctx, metadata)
	_, _ = h.auditLogService.Record(ctx.Request().Context(), service.AuditLogRecordRequest{
		WorkspaceID: app.WorkspaceID,
		ActorUserID: &actorID,
		Action:      action,
		TargetType:  targetType,
		TargetID:    targetID,
		Metadata:    metadata,
	})
}
