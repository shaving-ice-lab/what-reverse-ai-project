package handler

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type WorkspaceHandler struct {
	workspaceService service.WorkspaceService
	auditLogService  service.AuditLogService
	exportService    service.WorkspaceExportService
}

func NewWorkspaceHandler(
	workspaceService service.WorkspaceService,
	auditLogService service.AuditLogService,
	exportService service.WorkspaceExportService,
) *WorkspaceHandler {
	return &WorkspaceHandler{
		workspaceService: workspaceService,
		auditLogService:  auditLogService,
		exportService:    exportService,
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
		switch err {
		case service.ErrWorkspaceInvalidName, service.ErrWorkspaceInvalidSlug, service.ErrWorkspaceInvalidIcon, service.ErrWorkspaceInvalidPlan:
			return errorResponse(c, http.StatusBadRequest, "INVALID_INPUT", "工作空间参数无效")
		case service.ErrWorkspaceSlugExists:
			return errorResponse(c, http.StatusConflict, "SLUG_EXISTS", "工作空间 Slug 已存在")
		case service.ErrWorkspaceUserNotFound:
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
