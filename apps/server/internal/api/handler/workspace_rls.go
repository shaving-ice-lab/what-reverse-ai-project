package handler

import (
	"fmt"
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/reverseai/server/internal/api/middleware"
	"github.com/reverseai/server/internal/service"
)

// WorkspaceRLSHandler RLS 策略 Handler
type WorkspaceRLSHandler struct {
	rlsService       service.WorkspaceRLSService
	workspaceService service.WorkspaceService
}

func NewWorkspaceRLSHandler(rlsService service.WorkspaceRLSService, workspaceService service.WorkspaceService) *WorkspaceRLSHandler {
	return &WorkspaceRLSHandler{rlsService: rlsService, workspaceService: workspaceService}
}

// requireMemberAccess 验证用户是工作空间成员或 owner（访客无写入权限）
func (h *WorkspaceRLSHandler) requireMemberAccess(c echo.Context, workspaceID uuid.UUID) error {
	if h.workspaceService == nil {
		return nil
	}
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return fmt.Errorf("invalid_user")
	}
	access, err := h.workspaceService.GetWorkspaceAccess(c.Request().Context(), workspaceID, uid)
	if err != nil {
		_ = errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		return err
	}
	if !access.IsOwner && access.Role == nil {
		_ = errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无写入权限，仅 workspace 成员可执行此操作")
		return fmt.Errorf("write_forbidden")
	}
	return nil
}

type createRLSPolicyRequest struct {
	TableName   string `json:"table_name"`
	Column      string `json:"column"`
	MatchField  string `json:"match_field"`
	Operation   string `json:"operation"`
	Description string `json:"description"`
}

// CreatePolicy 创建 RLS 策略
func (h *WorkspaceRLSHandler) CreatePolicy(c echo.Context) error {
	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Invalid workspace ID")
	}
	if err := h.requireMemberAccess(c, workspaceID); err != nil {
		return nil
	}

	var req createRLSPolicyRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_BODY", "Invalid request body")
	}
	if req.TableName == "" || req.Column == "" {
		return errorResponse(c, http.StatusBadRequest, "MISSING_FIELDS", "table_name and column are required")
	}

	policy, err := h.rlsService.CreatePolicy(c.Request().Context(), workspaceID, req.TableName, req.Column, req.MatchField, req.Operation, req.Description)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", err.Error())
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"code":    "OK",
		"message": "created",
		"data":    policy,
	})
}

// ListPolicies 列出 RLS 策略
func (h *WorkspaceRLSHandler) ListPolicies(c echo.Context) error {
	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Invalid workspace ID")
	}

	policies, err := h.rlsService.ListPolicies(c.Request().Context(), workspaceID)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", err.Error())
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"code":    "OK",
		"message": "ok",
		"data":    policies,
	})
}

type updateRLSPolicyRequest struct {
	Enabled     *bool   `json:"enabled,omitempty"`
	Column      *string `json:"column,omitempty"`
	MatchField  *string `json:"match_field,omitempty"`
	Operation   *string `json:"operation,omitempty"`
	Description *string `json:"description,omitempty"`
}

// UpdatePolicy 更新 RLS 策略
func (h *WorkspaceRLSHandler) UpdatePolicy(c echo.Context) error {
	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Invalid workspace ID")
	}
	if err := h.requireMemberAccess(c, workspaceID); err != nil {
		return nil
	}

	policyID, err := uuid.Parse(c.Param("policyId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_POLICY_ID", "Invalid policy ID")
	}

	var req updateRLSPolicyRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_BODY", "Invalid request body")
	}

	policy, err := h.rlsService.UpdatePolicy(c.Request().Context(), workspaceID, policyID, req.Enabled, req.Column, req.MatchField, req.Operation, req.Description)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", err.Error())
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"code":    "OK",
		"message": "updated",
		"data":    policy,
	})
}

// DeletePolicy 删除 RLS 策略
func (h *WorkspaceRLSHandler) DeletePolicy(c echo.Context) error {
	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "Invalid workspace ID")
	}
	if err := h.requireMemberAccess(c, workspaceID); err != nil {
		return nil
	}

	policyID, err := uuid.Parse(c.Param("policyId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_POLICY_ID", "Invalid policy ID")
	}

	if err := h.rlsService.DeletePolicy(c.Request().Context(), workspaceID, policyID); err != nil {
		return errorResponse(c, http.StatusInternalServerError, "DELETE_FAILED", err.Error())
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"code":    "OK",
		"message": "deleted",
	})
}
