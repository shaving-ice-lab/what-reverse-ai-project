package handler

import (
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/reverseai/server/internal/api/middleware"
	"github.com/reverseai/server/internal/domain/entity"
	"github.com/reverseai/server/internal/service"
)

type WorkspaceHandler struct {
	workspaceService       service.WorkspaceService
	workspaceDomainService service.WorkspaceDomainService
	auditLogService        service.AuditLogService
	exportService          service.WorkspaceExportService
}

func NewWorkspaceHandler(
	workspaceService service.WorkspaceService,
	workspaceDomainService service.WorkspaceDomainService,
	auditLogService service.AuditLogService,
	exportService service.WorkspaceExportService,
) *WorkspaceHandler {
	return &WorkspaceHandler{
		workspaceService:       workspaceService,
		workspaceDomainService: workspaceDomainService,
		auditLogService:        auditLogService,
		exportService:          exportService,
	}
}

type CreateWorkspaceRequest struct {
	Name   string  `json:"name"`
	Slug   *string `json:"slug"`
	Icon   *string `json:"icon"`
	Plan   *string `json:"plan"`
	Region *string `json:"region"`
}

type UpdateWorkspaceRequest struct {
	Name *string `json:"name"`
	Slug *string `json:"slug"`
	Icon *string `json:"icon"`
	Plan *string `json:"plan"`
}

type CreateWorkspaceMemberRequest struct {
	UserID string  `json:"user_id"`
	RoleID *string `json:"role_id"`
}

type UpdateWorkspaceMemberRoleRequest struct {
	RoleID string `json:"role_id"`
}

// WorkspaceExportJobResponse 导出任务响应
type WorkspaceExportJobResponse struct {
	ID          string  `json:"id"`
	WorkspaceID string  `json:"workspace_id"`
	Status      string  `json:"status"`
	ExportType  string  `json:"export_type"`
	FileName    *string `json:"file_name,omitempty"`
	FileSize    *int64  `json:"file_size,omitempty"`
	Error       *string `json:"error,omitempty"`
	CreatedAt   string  `json:"created_at"`
	StartedAt   *string `json:"started_at,omitempty"`
	CompletedAt *string `json:"completed_at,omitempty"`
	ExpiresAt   *string `json:"expires_at,omitempty"`
	DownloadURL *string `json:"download_url,omitempty"`
}

// List 获取工作空间列表
func (h *WorkspaceHandler) List(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaces, err := h.workspaceService.ListByUser(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取工作空间列表失败")
	}

	accessMap := make(map[string]interface{}, len(workspaces))
	for _, workspace := range workspaces {
		access, err := h.workspaceService.GetWorkspaceAccess(c.Request().Context(), workspace.ID, uid)
		if err != nil {
			continue
		}
		accessMap[workspace.ID.String()] = map[string]interface{}{
			"role":        access.Role,
			"permissions": access.Permissions,
			"is_owner":    access.IsOwner,
		}
	}

	return successResponse(c, map[string]interface{}{
		"workspaces": workspaces,
		"total":      len(workspaces),
		"access":     accessMap,
	})
}

// Create 创建工作空间
func (h *WorkspaceHandler) Create(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req CreateWorkspaceRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}
	if strings.TrimSpace(req.Name) == "" {
		return errorResponse(c, http.StatusBadRequest, "NAME_REQUIRED", "工作空间名称不能为空")
	}

	workspace, err := h.workspaceService.Create(c.Request().Context(), uid, service.CreateWorkspaceRequest{
		Name:   req.Name,
		Slug:   req.Slug,
		Icon:   req.Icon,
		Plan:   req.Plan,
		Region: req.Region,
	})
	if err != nil {
		switch {
		case errors.Is(err, service.ErrWorkspaceInvalidName),
			errors.Is(err, service.ErrWorkspaceInvalidSlug),
			errors.Is(err, service.ErrWorkspaceInvalidIcon),
			errors.Is(err, service.ErrWorkspaceInvalidPlan):
			return errorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "工作空间参数无效")
		case errors.Is(err, service.ErrWorkspaceSlugExists):
			return errorResponse(c, http.StatusConflict, "SLUG_EXISTS", "工作空间 Slug 已存在")
		case errors.Is(err, service.ErrWorkspaceUserNotFound):
			return errorResponse(c, http.StatusNotFound, "USER_NOT_FOUND", "用户不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "CREATE_FAILED", "创建工作空间失败")
		}
	}

	h.recordAudit(c, workspace.ID, uid, "workspace.create", "workspace", &workspace.ID, entity.JSON{
		"name": workspace.Name,
		"slug": workspace.Slug,
		"plan": workspace.Plan,
	})

	return successResponse(c, map[string]interface{}{
		"workspace": workspace,
	})
}

// Get 获取工作空间详情
func (h *WorkspaceHandler) Get(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	access, err := h.workspaceService.GetWorkspaceAccess(c.Request().Context(), workspaceID, uid)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取工作空间失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"workspace":   access.Workspace,
		"role":        access.Role,
		"permissions": access.Permissions,
		"is_owner":    access.IsOwner,
	})
}

// Update 更新工作空间
func (h *WorkspaceHandler) Update(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	var req UpdateWorkspaceRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	workspace, err := h.workspaceService.Update(c.Request().Context(), workspaceID, uid, service.UpdateWorkspaceRequest{
		Name: req.Name,
		Slug: req.Slug,
		Icon: req.Icon,
		Plan: req.Plan,
	})
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限更新此工作空间")
		case service.ErrWorkspaceSlugExists:
			return errorResponse(c, http.StatusConflict, "SLUG_EXISTS", "工作空间 Slug 已存在")
		case service.ErrWorkspaceInvalidName, service.ErrWorkspaceInvalidSlug, service.ErrWorkspaceInvalidIcon, service.ErrWorkspaceInvalidPlan:
			return errorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "工作空间更新字段无效")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新工作空间失败")
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
	if req.Plan != nil {
		changed = append(changed, "plan")
	}
	h.recordAudit(c, workspace.ID, uid, "workspace.update", "workspace", &workspace.ID, entity.JSON{
		"fields": changed,
	})

	return successResponse(c, map[string]interface{}{
		"workspace": workspace,
	})
}

// ExportData 导出工作空间数据
func (h *WorkspaceHandler) ExportData(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	exportData, err := h.workspaceService.ExportData(c.Request().Context(), workspaceID, uid)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限导出工作空间数据")
		case service.ErrWorkspaceExportUnavailable:
			return errorResponse(c, http.StatusServiceUnavailable, "EXPORT_UNAVAILABLE", "导出服务暂不可用")
		default:
			return errorResponse(c, http.StatusInternalServerError, "EXPORT_FAILED", "导出失败")
		}
	}

	h.recordAudit(c, workspaceID, uid, "workspace.export", "workspace", &workspaceID, entity.JSON{
		"exported_at": exportData.ExportedAt,
	})

	return successResponse(c, map[string]interface{}{
		"export": exportData,
	})
}

// RequestExport 创建导出任务（异步）
func (h *WorkspaceHandler) RequestExport(c echo.Context) error {
	if h.exportService == nil {
		return errorResponse(c, http.StatusServiceUnavailable, "EXPORT_UNAVAILABLE", "导出服务暂不可用")
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

	job, err := h.exportService.RequestExport(c.Request().Context(), workspaceID, uid)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限导出工作空间数据")
		case service.ErrWorkspaceExportDisabled:
			return errorResponse(c, http.StatusServiceUnavailable, "EXPORT_DISABLED", "导出功能已禁用")
		case service.ErrWorkspaceExportUnavailable:
			return errorResponse(c, http.StatusServiceUnavailable, "EXPORT_UNAVAILABLE", "导出服务暂不可用")
		default:
			return errorResponse(c, http.StatusInternalServerError, "EXPORT_REQUEST_FAILED", "创建导出任务失败")
		}
	}

	h.recordAudit(c, workspaceID, uid, "workspace.export.requested", "workspace", &workspaceID, entity.JSON{
		"export_id": job.ID.String(),
	})

	return successResponse(c, map[string]interface{}{
		"export": h.buildExportJobResponse(job),
	})
}

// GetExport 获取导出任务状态
func (h *WorkspaceHandler) GetExport(c echo.Context) error {
	if h.exportService == nil {
		return errorResponse(c, http.StatusServiceUnavailable, "EXPORT_UNAVAILABLE", "导出服务暂不可用")
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
	exportID, err := uuid.Parse(c.Param("exportId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_EXPORT_ID", "导出任务 ID 无效")
	}

	job, err := h.exportService.GetJob(c.Request().Context(), workspaceID, exportID, uid)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限查看导出任务")
		case service.ErrWorkspaceExportNotFound:
			return errorResponse(c, http.StatusNotFound, "EXPORT_NOT_FOUND", "导出任务不存在")
		case service.ErrWorkspaceExportUnavailable:
			return errorResponse(c, http.StatusServiceUnavailable, "EXPORT_UNAVAILABLE", "导出服务暂不可用")
		default:
			return errorResponse(c, http.StatusInternalServerError, "EXPORT_FETCH_FAILED", "获取导出任务失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"export": h.buildExportJobResponse(job),
	})
}

// DownloadExport 下载导出包
func (h *WorkspaceHandler) DownloadExport(c echo.Context) error {
	if h.exportService == nil {
		return errorResponse(c, http.StatusServiceUnavailable, "EXPORT_UNAVAILABLE", "导出服务暂不可用")
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
	exportID, err := uuid.Parse(c.Param("exportId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_EXPORT_ID", "导出任务 ID 无效")
	}

	download, err := h.exportService.Download(c.Request().Context(), workspaceID, exportID, uid)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限下载导出包")
		case service.ErrWorkspaceExportNotFound:
			return errorResponse(c, http.StatusNotFound, "EXPORT_NOT_FOUND", "导出任务不存在")
		case service.ErrWorkspaceExportNotReady:
			return errorResponse(c, http.StatusConflict, "EXPORT_NOT_READY", "导出任务尚未完成")
		case service.ErrWorkspaceExportExpired:
			return errorResponse(c, http.StatusGone, "EXPORT_EXPIRED", "导出包已过期")
		case service.ErrWorkspaceExportUnavailable:
			return errorResponse(c, http.StatusNotFound, "EXPORT_UNAVAILABLE", "导出包不可用")
		default:
			return errorResponse(c, http.StatusInternalServerError, "EXPORT_DOWNLOAD_FAILED", "下载导出包失败")
		}
	}

	return c.Attachment(download.FilePath, download.FileName)
}

// Delete 删除工作空间（软删除）
func (h *WorkspaceHandler) Delete(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	result, err := h.workspaceService.Delete(c.Request().Context(), workspaceID, uid)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限删除工作空间")
		default:
			return errorResponse(c, http.StatusInternalServerError, "DELETE_FAILED", "删除工作空间失败")
		}
	}

	h.recordAudit(c, workspaceID, uid, "workspace.delete", "workspace", &workspaceID, entity.JSON{
		"stage": result.Stage,
	})

	return successResponse(c, map[string]interface{}{
		"deletion": result,
	})
}

// Restore 恢复被删除的工作空间
func (h *WorkspaceHandler) Restore(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	result, err := h.workspaceService.Restore(c.Request().Context(), workspaceID, uid)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限恢复工作空间")
		case service.ErrWorkspaceNotDeleted:
			return errorResponse(c, http.StatusBadRequest, "NOT_DELETED", "工作空间未被删除")
		case service.ErrWorkspaceRestoreExpired:
			return errorResponse(c, http.StatusConflict, "RESTORE_EXPIRED", "恢复窗口已过期")
		default:
			return errorResponse(c, http.StatusInternalServerError, "RESTORE_FAILED", "恢复工作空间失败")
		}
	}

	h.recordAudit(c, workspaceID, uid, "workspace.restore", "workspace", &workspaceID, entity.JSON{
		"stage": result.Stage,
	})

	return successResponse(c, map[string]interface{}{
		"restore": result,
	})
}

// ListMembers 获取工作空间成员列表
func (h *WorkspaceHandler) ListMembers(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	members, err := h.workspaceService.ListMembers(c.Request().Context(), workspaceID, uid)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限查看成员")
		default:
			return errorResponse(c, http.StatusInternalServerError, "LIST_FAILED", "获取成员列表失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"members": members,
		"total":   len(members),
	})
}

// AddMember 邀请成员加入工作空间
func (h *WorkspaceHandler) AddMember(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	var req CreateWorkspaceMemberRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}
	if strings.TrimSpace(req.UserID) == "" {
		return errorResponse(c, http.StatusBadRequest, "USER_ID_REQUIRED", "成员用户 ID 不能为空")
	}

	memberUserID, err := uuid.Parse(req.UserID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "成员用户 ID 无效")
	}

	var roleID *uuid.UUID
	if req.RoleID != nil && strings.TrimSpace(*req.RoleID) != "" {
		parsed, err := uuid.Parse(*req.RoleID)
		if err != nil {
			return errorResponse(c, http.StatusBadRequest, "INVALID_ROLE_ID", "角色 ID 无效")
		}
		roleID = &parsed
	}

	member, err := h.workspaceService.AddMember(c.Request().Context(), workspaceID, uid, memberUserID, roleID)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限邀请成员")
		case service.ErrWorkspaceUserNotFound:
			return errorResponse(c, http.StatusNotFound, "USER_NOT_FOUND", "成员用户不存在")
		case service.ErrWorkspaceRoleNotFound:
			return errorResponse(c, http.StatusNotFound, "ROLE_NOT_FOUND", "角色不存在")
		case service.ErrWorkspaceMemberExists:
			return errorResponse(c, http.StatusConflict, "MEMBER_EXISTS", "成员已存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ADD_FAILED", "邀请成员失败")
		}
	}

	h.recordAudit(c, workspaceID, uid, "workspace.member.add", "workspace_member", &member.ID, entity.JSON{
		"user_id": member.UserID.String(),
		"role_id": member.RoleID,
	})

	return successResponse(c, map[string]interface{}{
		"member": member,
	})
}

// RemoveMember 移除成员
func (h *WorkspaceHandler) RemoveMember(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	memberID, err := uuid.Parse(c.Param("memberId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_MEMBER_ID", "成员 ID 无效")
	}

	if err := h.workspaceService.RemoveMember(c.Request().Context(), workspaceID, uid, memberID); err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限移除成员")
		case service.ErrWorkspaceMemberNotFound:
			return errorResponse(c, http.StatusNotFound, "MEMBER_NOT_FOUND", "成员不存在")
		case service.ErrWorkspaceOwnerRoleLocked:
			return errorResponse(c, http.StatusBadRequest, "OWNER_CANNOT_BE_REMOVED", "不能移除工作空间拥有者")
		default:
			return errorResponse(c, http.StatusInternalServerError, "REMOVE_FAILED", "移除成员失败")
		}
	}

	h.recordAudit(c, workspaceID, uid, "workspace.member.remove", "workspace_member", &memberID, entity.JSON{
		"member_id": memberID.String(),
	})

	return successResponse(c, map[string]interface{}{
		"message": "成员已移除",
	})
}

// UpdateMemberRole 更新成员角色
func (h *WorkspaceHandler) UpdateMemberRole(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	memberID, err := uuid.Parse(c.Param("memberId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_MEMBER_ID", "成员 ID 无效")
	}

	var req UpdateWorkspaceMemberRoleRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}
	if strings.TrimSpace(req.RoleID) == "" {
		return errorResponse(c, http.StatusBadRequest, "ROLE_ID_REQUIRED", "角色 ID 不能为空")
	}
	roleID, err := uuid.Parse(req.RoleID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ROLE_ID", "角色 ID 无效")
	}

	member, err := h.workspaceService.UpdateMemberRole(c.Request().Context(), workspaceID, uid, memberID, roleID)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限更新成员")
		case service.ErrWorkspaceMemberNotFound:
			return errorResponse(c, http.StatusNotFound, "MEMBER_NOT_FOUND", "成员不存在")
		case service.ErrWorkspaceRoleNotFound:
			return errorResponse(c, http.StatusNotFound, "ROLE_NOT_FOUND", "角色不存在")
		case service.ErrWorkspaceOwnerRoleLocked:
			return errorResponse(c, http.StatusBadRequest, "OWNER_ROLE_LOCKED", "不能修改拥有者角色")
		default:
			return errorResponse(c, http.StatusInternalServerError, "UPDATE_FAILED", "更新成员角色失败")
		}
	}

	h.recordAudit(c, workspaceID, uid, "workspace.member.role_update", "workspace_member", &member.ID, entity.JSON{
		"user_id": member.UserID.String(),
		"role_id": member.RoleID,
	})

	return successResponse(c, map[string]interface{}{
		"member": member,
	})
}

// VerifyDomainByID 验证工作空间域名
func (h *WorkspaceHandler) VerifyDomainByID(c echo.Context) error {
	if h.workspaceDomainService == nil {
		return errorResponse(c, http.StatusServiceUnavailable, "DOMAIN_SERVICE_UNAVAILABLE", "域名服务不可用")
	}
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	domainID, err := uuid.Parse(c.Param("domainId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "域名 ID 无效")
	}

	result, err := h.workspaceDomainService.VerifyDomainByID(c.Request().Context(), uid, domainID)
	if err != nil {
		var verifyErr *service.DomainVerifyError
		if errors.As(err, &verifyErr) {
			return errorResponse(c, http.StatusBadRequest, "VERIFICATION_FAILED", "域名验证失败")
		}
		switch err {
		case service.ErrWorkspaceDomainNotFound:
			return errorResponse(c, http.StatusNotFound, "DOMAIN_NOT_FOUND", "域名不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限操作该域名")
		case service.ErrWorkspaceDomainVerificationFailed:
			return errorResponse(c, http.StatusBadRequest, "VERIFICATION_FAILED", "域名验证失败")
		default:
			return errorResponse(c, http.StatusInternalServerError, "VERIFY_FAILED", "域名验证失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"domain":       result.Domain,
		"verification": result.Verification,
		"verified":     result.Verified,
	})
}

func (h *WorkspaceHandler) recordAudit(ctx echo.Context, workspaceID uuid.UUID, actorID uuid.UUID, action string, targetType string, targetID *uuid.UUID, metadata entity.JSON) {
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

func (h *WorkspaceHandler) buildExportJobResponse(job *entity.WorkspaceExportJob) WorkspaceExportJobResponse {
	resp := WorkspaceExportJobResponse{
		ID:          job.ID.String(),
		WorkspaceID: job.WorkspaceID.String(),
		Status:      string(job.Status),
		ExportType:  string(job.ExportType),
		FileName:    job.FileName,
		FileSize:    job.FileSize,
		Error:       job.ErrorMessage,
		CreatedAt:   job.CreatedAt.Format(time.RFC3339),
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
		downloadURL := fmt.Sprintf("/api/v1/workspaces/%s/exports/%s/download", job.WorkspaceID.String(), job.ID.String())
		resp.DownloadURL = &downloadURL
	}

	return resp
}

// ===== Workspace 应用功能 Handler =====

// PublishWorkspace 发布 Workspace
func (h *WorkspaceHandler) PublishWorkspace(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"code": "INVALID_ID", "message": "invalid workspace id"})
	}
	ws, err := h.workspaceService.Publish(c.Request().Context(), id, uid)
	if err != nil {
		return h.handleWorkspaceError(c, err)
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"code": "OK", "message": "OK", "data": map[string]interface{}{"workspace": ws}})
}

// RollbackWorkspace 回滚到指定版本
func (h *WorkspaceHandler) RollbackWorkspace(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"code": "INVALID_ID", "message": "invalid workspace id"})
	}
	var req struct {
		VersionID string `json:"version_id"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"code": "INVALID_REQUEST", "message": "invalid request"})
	}
	versionID, err := uuid.Parse(req.VersionID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"code": "INVALID_ID", "message": "invalid version id"})
	}
	ws, err := h.workspaceService.Rollback(c.Request().Context(), id, uid, versionID)
	if err != nil {
		return h.handleWorkspaceError(c, err)
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"code": "OK", "message": "OK", "data": map[string]interface{}{"workspace": ws}})
}

// DeprecateWorkspace 下线 Workspace
func (h *WorkspaceHandler) DeprecateWorkspace(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"code": "INVALID_ID", "message": "invalid workspace id"})
	}
	ws, err := h.workspaceService.Deprecate(c.Request().Context(), id, uid)
	if err != nil {
		return h.handleWorkspaceError(c, err)
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"code": "OK", "message": "OK", "data": map[string]interface{}{"workspace": ws}})
}

// ArchiveWorkspace 归档 Workspace
func (h *WorkspaceHandler) ArchiveWorkspace(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"code": "INVALID_ID", "message": "invalid workspace id"})
	}
	ws, err := h.workspaceService.Archive(c.Request().Context(), id, uid)
	if err != nil {
		return h.handleWorkspaceError(c, err)
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"code": "OK", "message": "OK", "data": map[string]interface{}{"workspace": ws}})
}

// CreateWorkspaceVersion 创建版本
func (h *WorkspaceHandler) CreateWorkspaceVersion(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"code": "INVALID_ID", "message": "invalid workspace id"})
	}
	var req service.WorkspaceCreateVersionRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"code": "INVALID_REQUEST", "message": "invalid request"})
	}
	version, err := h.workspaceService.CreateVersion(c.Request().Context(), id, uid, req)
	if err != nil {
		return h.handleWorkspaceError(c, err)
	}
	return c.JSON(http.StatusCreated, map[string]interface{}{"code": "OK", "message": "OK", "data": map[string]interface{}{"version": version}})
}

// GetWorkspaceVersions 获取版本列表
func (h *WorkspaceHandler) GetWorkspaceVersions(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"code": "INVALID_ID", "message": "invalid workspace id"})
	}
	page := intParam(c, "page", 1)
	pageSize := intParam(c, "page_size", 20)
	versions, total, err := h.workspaceService.ListVersions(c.Request().Context(), id, uid, page, pageSize)
	if err != nil {
		return h.handleWorkspaceError(c, err)
	}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"code": "OK", "message": "OK",
		"data": map[string]interface{}{"items": versions, "total": total, "page": page, "page_size": pageSize},
	})
}

// CompareWorkspaceVersions 版本对比
func (h *WorkspaceHandler) CompareWorkspaceVersions(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"code": "INVALID_ID", "message": "invalid workspace id"})
	}
	fromID, err := uuid.Parse(c.QueryParam("from"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"code": "INVALID_ID", "message": "invalid from version id"})
	}
	toID, err := uuid.Parse(c.QueryParam("to"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"code": "INVALID_ID", "message": "invalid to version id"})
	}
	diff, err := h.workspaceService.CompareVersions(c.Request().Context(), id, fromID, toID)
	if err != nil {
		return h.handleWorkspaceError(c, err)
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"code": "OK", "message": "OK", "data": diff})
}

// GetWorkspaceAccessPolicy 获取访问策略
func (h *WorkspaceHandler) GetWorkspaceAccessPolicy(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"code": "INVALID_ID", "message": "invalid workspace id"})
	}
	policy, err := h.workspaceService.GetAccessPolicy(c.Request().Context(), id, uid)
	if err != nil {
		return h.handleWorkspaceError(c, err)
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"code": "OK", "message": "OK", "data": map[string]interface{}{"policy": policy}})
}

// UpdateWorkspaceAccessPolicy 更新访问策略
func (h *WorkspaceHandler) UpdateWorkspaceAccessPolicy(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"code": "INVALID_ID", "message": "invalid workspace id"})
	}
	var req service.UpdateAccessPolicyRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"code": "INVALID_REQUEST", "message": "invalid request"})
	}
	policy, err := h.workspaceService.UpdateAccessPolicy(c.Request().Context(), id, uid, req)
	if err != nil {
		return h.handleWorkspaceError(c, err)
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"code": "OK", "message": "OK", "data": map[string]interface{}{"policy": policy}})
}

// ===== Marketplace Handlers =====

// ListPublicWorkspaces 应用市场公开列表
func (h *WorkspaceHandler) ListPublicWorkspaces(c echo.Context) error {
	page := intParam(c, "page", 1)
	pageSize := intParam(c, "page_size", 20)
	workspaces, total, err := h.workspaceService.ListPublic(c.Request().Context(), page, pageSize)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"code": "INTERNAL_ERROR", "message": err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"code": "OK", "message": "OK",
		"data": map[string]interface{}{"items": workspaces, "total": total, "page": page, "page_size": pageSize},
	})
}

// GetPublicWorkspace 应用市场单个详情
func (h *WorkspaceHandler) GetPublicWorkspace(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"code": "INVALID_ID", "message": "invalid workspace id"})
	}
	ws, err := h.workspaceService.GetPublic(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]interface{}{"code": "NOT_FOUND", "message": "workspace not found"})
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"code": "OK", "message": "OK", "data": map[string]interface{}{"workspace": ws}})
}

// ListPublicRatings 公开评分列表
func (h *WorkspaceHandler) ListPublicRatings(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"code": "INVALID_ID", "message": "invalid workspace id"})
	}
	page := intParam(c, "page", 1)
	pageSize := intParam(c, "page_size", 20)
	ratings, total, err := h.workspaceService.ListRatings(c.Request().Context(), id, page, pageSize)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"code": "INTERNAL_ERROR", "message": err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"code": "OK", "message": "OK",
		"data": map[string]interface{}{"items": ratings, "total": total, "page": page, "page_size": pageSize},
	})
}

// SubmitRating 提交评分
func (h *WorkspaceHandler) SubmitRating(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"code": "INVALID_ID", "message": "invalid workspace id"})
	}
	var req struct {
		Score   int    `json:"score"`
		Comment string `json:"comment"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"code": "INVALID_REQUEST", "message": "invalid request"})
	}
	rating, err := h.workspaceService.SubmitRating(c.Request().Context(), id, uid, req.Score, req.Comment)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"code": "INVALID_REQUEST", "message": err.Error()})
	}
	return c.JSON(http.StatusCreated, map[string]interface{}{"code": "OK", "message": "OK", "data": map[string]interface{}{"rating": rating}})
}

// ===== 工具函数 =====

func (h *WorkspaceHandler) handleWorkspaceError(c echo.Context, err error) error {
	switch {
	case errors.Is(err, service.ErrWorkspaceNotFound):
		return c.JSON(http.StatusNotFound, map[string]interface{}{"code": "NOT_FOUND", "message": "workspace not found"})
	case errors.Is(err, service.ErrWorkspaceUnauthorized):
		return c.JSON(http.StatusForbidden, map[string]interface{}{"code": "FORBIDDEN", "message": "unauthorized"})
	default:
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"code": "INTERNAL_ERROR", "message": err.Error()})
	}
}

func intParam(c echo.Context, name string, defaultVal int) int {
	val := c.QueryParam(name)
	if val == "" {
		return defaultVal
	}
	var n int
	if _, err := fmt.Sscanf(val, "%d", &n); err != nil || n < 1 {
		return defaultVal
	}
	return n
}
