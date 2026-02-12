package handler

import (
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/reverseai/server/internal/api/middleware"
	"github.com/reverseai/server/internal/domain/entity"
	"github.com/reverseai/server/internal/pkg/idempotency"
	"github.com/reverseai/server/internal/pkg/queue"
	"github.com/reverseai/server/internal/service"
)

// WorkspaceDatabaseHandler 工作空间数据库处理器
type WorkspaceDatabaseHandler struct {
	workspaceDatabaseService service.WorkspaceDatabaseService
	workspaceDBRoleService   service.WorkspaceDBRoleService
	auditLogService          service.AuditLogService
	taskQueue                *queue.Queue
}

// NewWorkspaceDatabaseHandler 创建工作空间数据库处理器
func NewWorkspaceDatabaseHandler(
	workspaceDatabaseService service.WorkspaceDatabaseService,
	workspaceDBRoleService service.WorkspaceDBRoleService,
	auditLogService service.AuditLogService,
	taskQueue *queue.Queue,
) *WorkspaceDatabaseHandler {
	return &WorkspaceDatabaseHandler{
		workspaceDatabaseService: workspaceDatabaseService,
		workspaceDBRoleService:   workspaceDBRoleService,
		auditLogService:          auditLogService,
		taskQueue:                taskQueue,
	}
}

// Provision 创建工作空间数据库
func (h *WorkspaceDatabaseHandler) Provision(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	if isAsyncRequest(c) {
		if h.taskQueue == nil {
			return errorResponse(c, http.StatusServiceUnavailable, "QUEUE_UNAVAILABLE", "任务队列不可用")
		}
		result, err := h.taskQueue.EnqueueDBProvision(c.Request().Context(), &queue.DBProvisionPayload{
			WorkspaceID: workspaceID.String(),
			OwnerID:     uid.String(),
		})
		if err != nil {
			return errorResponse(c, http.StatusInternalServerError, "QUEUE_ENQUEUE_FAILED", "任务入队失败")
		}
		return successResponse(c, map[string]interface{}{
			"queued": true,
			"task":   result,
		})
	}

	ctx := idempotency.WithKey(c.Request().Context(), middleware.GetIdempotencyKey(c))
	database, err := h.workspaceDatabaseService.Provision(ctx, workspaceID, uid)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		case service.ErrWorkspaceDatabaseExists:
			return errorResponse(c, http.StatusConflict, "ALREADY_EXISTS", "工作空间数据库已存在或正在创建")
		case service.ErrWorkspaceDatabaseQuotaExceeded:
			return errorResponse(c, http.StatusForbidden, "QUOTA_EXCEEDED", "数据库配额已超限")
		case service.ErrWorkspaceDatabaseProvisionFailed:
			return errorResponse(c, http.StatusInternalServerError, "PROVISION_FAILED", "工作空间数据库创建失败")
		case service.ErrIdempotencyConflict:
			return errorResponse(c, http.StatusConflict, "IDEMPOTENCY_CONFLICT", "幂等键与请求不一致")
		case service.ErrIdempotencyInProgress:
			return errorResponse(c, http.StatusConflict, "IDEMPOTENCY_IN_PROGRESS", "幂等请求处理中")
		default:
			return errorResponse(c, http.StatusInternalServerError, "PROVISION_FAILED", "工作空间数据库创建失败")
		}
	}

	h.recordAudit(c, workspaceID, uid, "workspace.db.provision", "workspace_database", &database.ID, entity.JSON{
		"status":  database.Status,
		"db_name": database.DBName,
	})

	return successResponse(c, map[string]interface{}{
		"database": database,
	})
}

// CreateWorkspaceDBRoleRequest 创建数据库角色请求
type CreateWorkspaceDBRoleRequest struct {
	RoleType  string     `json:"role_type"`
	ExpiresAt *time.Time `json:"expires_at"`
}

// RevokeWorkspaceDBRoleRequest 撤销数据库角色请求
type RevokeWorkspaceDBRoleRequest struct {
	Reason string `json:"reason"`
}

// CreateRole 创建数据库角色
func (h *WorkspaceDatabaseHandler) CreateRole(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	var req CreateWorkspaceDBRoleRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	role, password, err := h.workspaceDBRoleService.Create(c.Request().Context(), workspaceID, uid, service.CreateWorkspaceDBRoleRequest{
		RoleType:  req.RoleType,
		ExpiresAt: req.ExpiresAt,
	})
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		case service.ErrWorkspaceDatabaseNotFound:
			return errorResponse(c, http.StatusNotFound, "DB_NOT_FOUND", "工作空间数据库不存在")
		case service.ErrWorkspaceDatabaseNotReady:
			return errorResponse(c, http.StatusConflict, "DB_NOT_READY", "工作空间数据库尚未就绪")
		case service.ErrWorkspaceDBRoleExists:
			return errorResponse(c, http.StatusConflict, "ROLE_EXISTS", "数据库角色已存在")
		case service.ErrWorkspaceDBRoleInvalid:
			return errorResponse(c, http.StatusBadRequest, "INVALID_ROLE", "数据库角色参数无效")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ROLE_CREATE_FAILED", "数据库角色创建失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"role":     role,
		"password": password,
	})
}

// ListRoles 获取数据库角色列表
func (h *WorkspaceDatabaseHandler) ListRoles(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	var roleType *string
	if raw := strings.TrimSpace(c.QueryParam("role_type")); raw != "" {
		normalized := strings.ToLower(raw)
		roleType = &normalized
	}
	var status *string
	if raw := strings.TrimSpace(c.QueryParam("status")); raw != "" {
		status = &raw
	}

	roles, err := h.workspaceDBRoleService.List(c.Request().Context(), workspaceID, uid, service.WorkspaceDBRoleListParams{
		RoleType: roleType,
		Status:   status,
	})
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ROLE_LIST_FAILED", "获取数据库角色失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"roles": roles,
	})
}

// RotateRole 轮换数据库角色密钥
func (h *WorkspaceDatabaseHandler) RotateRole(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}
	roleID, err := uuid.Parse(c.Param("roleId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ROLE_ID", "数据库角色 ID 无效")
	}

	role, password, err := h.workspaceDBRoleService.Rotate(c.Request().Context(), workspaceID, uid, roleID)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		case service.ErrWorkspaceDatabaseNotFound:
			return errorResponse(c, http.StatusNotFound, "DB_NOT_FOUND", "工作空间数据库不存在")
		case service.ErrWorkspaceDatabaseNotReady:
			return errorResponse(c, http.StatusConflict, "DB_NOT_READY", "工作空间数据库尚未就绪")
		case service.ErrWorkspaceDBRoleNotFound:
			return errorResponse(c, http.StatusNotFound, "ROLE_NOT_FOUND", "数据库角色不存在")
		case service.ErrWorkspaceDBRoleInactive:
			return errorResponse(c, http.StatusConflict, "ROLE_INACTIVE", "数据库角色不可用")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ROLE_ROTATE_FAILED", "数据库角色密钥轮换失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"role":     role,
		"password": password,
	})
}

// RevokeRole 撤销数据库角色
func (h *WorkspaceDatabaseHandler) RevokeRole(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}
	roleID, err := uuid.Parse(c.Param("roleId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ROLE_ID", "数据库角色 ID 无效")
	}

	var req RevokeWorkspaceDBRoleRequest
	if err := c.Bind(&req); err != nil {
		req.Reason = ""
	}

	role, err := h.workspaceDBRoleService.Revoke(c.Request().Context(), workspaceID, uid, roleID, req.Reason)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		case service.ErrWorkspaceDBRoleNotFound:
			return errorResponse(c, http.StatusNotFound, "ROLE_NOT_FOUND", "数据库角色不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ROLE_REVOKE_FAILED", "数据库角色撤销失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"role": role,
	})
}

// Get 获取工作空间数据库状态
func (h *WorkspaceDatabaseHandler) Get(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	database, err := h.workspaceDatabaseService.GetByWorkspaceID(c.Request().Context(), workspaceID, uid)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		case service.ErrWorkspaceDatabaseNotFound:
			return errorResponse(c, http.StatusNotFound, "DB_NOT_FOUND", "工作空间数据库不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取工作空间数据库失败")
		}
	}

	h.recordAudit(c, workspaceID, uid, "workspace.db.rotate_secret", "workspace_database", &database.ID, entity.JSON{
		"status":  database.Status,
		"db_user": database.DBUser,
	})

	return successResponse(c, map[string]interface{}{
		"database": database,
	})
}

// RotateSecret 轮换工作空间数据库密钥
func (h *WorkspaceDatabaseHandler) RotateSecret(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	database, err := h.workspaceDatabaseService.RotateSecret(c.Request().Context(), workspaceID, uid)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		case service.ErrWorkspaceDatabaseNotFound:
			return errorResponse(c, http.StatusNotFound, "DB_NOT_FOUND", "工作空间数据库不存在")
		case service.ErrWorkspaceDatabaseNotReady:
			return errorResponse(c, http.StatusConflict, "DB_NOT_READY", "工作空间数据库尚未就绪")
		case service.ErrWorkspaceDatabaseRotateFailed:
			return errorResponse(c, http.StatusInternalServerError, "ROTATE_FAILED", "工作空间数据库密钥轮换失败")
		default:
			return errorResponse(c, http.StatusInternalServerError, "ROTATE_FAILED", "工作空间数据库密钥轮换失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"database": database,
	})
}

// Backup 创建工作空间数据库备份
func (h *WorkspaceDatabaseHandler) Backup(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	result, err := h.workspaceDatabaseService.Backup(c.Request().Context(), workspaceID, uid)
	if err != nil {
		h.recordAudit(c, workspaceID, uid, "workspace.db.backup", "workspace_database_backup", nil, entity.JSON{
			"status": "failed",
			"error":  err.Error(),
		})
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		case service.ErrWorkspaceDatabaseNotFound:
			return errorResponse(c, http.StatusNotFound, "DB_NOT_FOUND", "工作空间数据库不存在")
		case service.ErrWorkspaceDatabaseNotReady:
			return errorResponse(c, http.StatusConflict, "DB_NOT_READY", "工作空间数据库尚未就绪")
		case service.ErrWorkspaceDatabaseBackupFailed:
			return errorResponse(c, http.StatusInternalServerError, "BACKUP_FAILED", "工作空间数据库备份失败")
		default:
			return errorResponse(c, http.StatusInternalServerError, "BACKUP_FAILED", "工作空间数据库备份失败")
		}
	}

	h.recordAudit(c, workspaceID, uid, "workspace.db.backup", "workspace_database_backup", nil, entity.JSON{
		"backup_id": result.BackupID,
		"database":  result.Database,
		"tables":    result.Tables,
	})

	return successResponse(c, map[string]interface{}{
		"backup": result,
	})
}

// RestoreWorkspaceDatabaseRequest 恢复请求
type RestoreWorkspaceDatabaseRequest struct {
	BackupID string `json:"backup_id"`
}

// SubmitWorkspaceDBSchemaMigrationRequest 提交迁移审批请求
type SubmitWorkspaceDBSchemaMigrationRequest struct {
	Note      *string `json:"note"`
	VerifySQL *string `json:"verify_sql"`
	Force     bool    `json:"force"`
}

// ApproveWorkspaceDBSchemaMigrationRequest 审批通过请求
type ApproveWorkspaceDBSchemaMigrationRequest struct {
	Note *string `json:"note"`
}

// RejectWorkspaceDBSchemaMigrationRequest 审批拒绝请求
type RejectWorkspaceDBSchemaMigrationRequest struct {
	Reason *string `json:"reason"`
}

// Restore 从备份恢复工作空间数据库
func (h *WorkspaceDatabaseHandler) Restore(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	var req RestoreWorkspaceDatabaseRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}
	if strings.TrimSpace(req.BackupID) == "" {
		return errorResponse(c, http.StatusBadRequest, "BACKUP_ID_REQUIRED", "备份 ID 不能为空")
	}

	result, err := h.workspaceDatabaseService.Restore(c.Request().Context(), workspaceID, uid, req.BackupID)
	if err != nil {
		h.recordAudit(c, workspaceID, uid, "workspace.db.restore", "workspace_database_restore", nil, entity.JSON{
			"status":    "failed",
			"error":     err.Error(),
			"backup_id": req.BackupID,
		})
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		case service.ErrWorkspaceDatabaseNotFound:
			return errorResponse(c, http.StatusNotFound, "DB_NOT_FOUND", "工作空间数据库不存在")
		case service.ErrWorkspaceDatabaseNotReady:
			return errorResponse(c, http.StatusConflict, "DB_NOT_READY", "工作空间数据库尚未就绪")
		case service.ErrWorkspaceDatabaseBackupNotFound:
			return errorResponse(c, http.StatusNotFound, "BACKUP_NOT_FOUND", "备份不存在")
		case service.ErrWorkspaceDatabaseRestoreFailed:
			return errorResponse(c, http.StatusInternalServerError, "RESTORE_FAILED", "工作空间数据库恢复失败")
		default:
			return errorResponse(c, http.StatusInternalServerError, "RESTORE_FAILED", "工作空间数据库恢复失败")
		}
	}

	h.recordAudit(c, workspaceID, uid, "workspace.db.restore", "workspace_database_restore", nil, entity.JSON{
		"backup_id":       result.BackupID,
		"restored_tables": result.RestoredTables,
	})

	return successResponse(c, map[string]interface{}{
		"restore": result,
	})
}

// Migrate 执行工作空间数据库迁移
func (h *WorkspaceDatabaseHandler) Migrate(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	result, err := h.workspaceDatabaseService.Migrate(c.Request().Context(), workspaceID, uid)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		case service.ErrWorkspaceDatabaseNotFound:
			return errorResponse(c, http.StatusNotFound, "DB_NOT_FOUND", "工作空间数据库不存在")
		case service.ErrWorkspaceDatabaseNotReady:
			return errorResponse(c, http.StatusConflict, "DB_NOT_READY", "工作空间数据库尚未就绪")
		case service.ErrWorkspaceDatabaseMigrationLocked:
			return errorResponse(c, http.StatusConflict, "MIGRATION_LOCKED", "已有迁移在执行，请稍后重试")
		case service.ErrWorkspaceDatabaseMigrationFailed:
			return errorResponse(c, http.StatusInternalServerError, "MIGRATION_FAILED", "工作空间数据库迁移失败")
		default:
			return errorResponse(c, http.StatusInternalServerError, "MIGRATION_FAILED", "工作空间数据库迁移失败")
		}
	}

	h.recordAudit(c, workspaceID, uid, "workspace.db.migrate", "workspace_database_migration", nil, entity.JSON{
		"applied":         result.Applied,
		"current_version": result.CurrentVersion,
	})

	return successResponse(c, map[string]interface{}{
		"migration": result,
	})
}

// PreviewMigrationPlan 预览迁移计划与预检结果
func (h *WorkspaceDatabaseHandler) PreviewMigrationPlan(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	plan, precheck, err := h.workspaceDatabaseService.PreviewDBSchemaMigration(c.Request().Context(), workspaceID, uid)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		case service.ErrWorkspaceDatabaseNotFound:
			return errorResponse(c, http.StatusNotFound, "DB_NOT_FOUND", "工作空间数据库不存在")
		case service.ErrWorkspaceDatabaseNotReady:
			return errorResponse(c, http.StatusConflict, "DB_NOT_READY", "工作空间数据库尚未就绪")
		case service.ErrWorkspaceDBSchemaMigrationNoPending:
			return errorResponse(c, http.StatusConflict, "NO_PENDING", "暂无可执行的迁移")
		default:
			return errorResponse(c, http.StatusInternalServerError, "PREVIEW_FAILED", "迁移预检失败")
		}
	}

	h.recordAudit(c, workspaceID, uid, "workspace.db.migration.preview", "workspace_database_migration_plan", nil, entity.JSON{
		"total_pending":  plan.TotalPending,
		"target_version": plan.TargetVersion,
	})

	return successResponse(c, map[string]interface{}{
		"plan":     plan,
		"precheck": precheck,
	})
}

// SubmitMigration 提交迁移审批
func (h *WorkspaceDatabaseHandler) SubmitMigration(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	var req SubmitWorkspaceDBSchemaMigrationRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	migration, err := h.workspaceDatabaseService.SubmitDBSchemaMigration(c.Request().Context(), workspaceID, uid, service.SubmitWorkspaceDBSchemaMigrationRequest{
		Note:      req.Note,
		VerifySQL: req.VerifySQL,
		Force:     req.Force,
	})
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		case service.ErrWorkspaceDatabaseNotFound:
			return errorResponse(c, http.StatusNotFound, "DB_NOT_FOUND", "工作空间数据库不存在")
		case service.ErrWorkspaceDatabaseNotReady:
			return errorResponse(c, http.StatusConflict, "DB_NOT_READY", "工作空间数据库尚未就绪")
		case service.ErrWorkspaceDBSchemaMigrationActive:
			return errorResponse(c, http.StatusConflict, "MIGRATION_ACTIVE", "已有迁移在审批或执行中")
		case service.ErrWorkspaceDBSchemaMigrationNoPending:
			return errorResponse(c, http.StatusConflict, "NO_PENDING", "暂无可执行的迁移")
		case service.ErrWorkspaceDBSchemaMigrationBlocked:
			return errorResponse(c, http.StatusBadRequest, "MIGRATION_BLOCKED", "迁移预检未通过")
		case service.ErrWorkspaceDBSchemaMigrationInvalidVerifySQL:
			return errorResponse(c, http.StatusBadRequest, "VERIFY_SQL_INVALID", "验证 SQL 仅支持只读语句")
		case service.ErrWorkspaceDBSchemaMigrationReviewUnavailable:
			return errorResponse(c, http.StatusInternalServerError, "REVIEW_UNAVAILABLE", "审核服务不可用")
		default:
			return errorResponse(c, http.StatusInternalServerError, "SUBMIT_FAILED", "提交迁移审批失败")
		}
	}

	h.recordAudit(c, workspaceID, uid, "workspace.db.migration.submit", "workspace_db_schema_migration", &migration.ID, entity.JSON{
		"status":         migration.Status,
		"target_version": migration.TargetVersion,
	})

	return successResponse(c, map[string]interface{}{
		"migration": migration,
		"message":   "迁移审批已提交",
	})
}

// GetMigration 获取迁移审批记录
func (h *WorkspaceDatabaseHandler) GetMigration(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	migrationID, err := uuid.Parse(c.Param("migrationId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_MIGRATION_ID", "迁移 ID 无效")
	}

	migration, err := h.workspaceDatabaseService.GetDBSchemaMigration(c.Request().Context(), workspaceID, uid, migrationID)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		case service.ErrWorkspaceDBSchemaMigrationNotFound:
			return errorResponse(c, http.StatusNotFound, "MIGRATION_NOT_FOUND", "迁移记录不存在")
		default:
			return errorResponse(c, http.StatusInternalServerError, "GET_FAILED", "获取迁移记录失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"migration": migration,
	})
}

// ApproveMigration 审批通过迁移
func (h *WorkspaceDatabaseHandler) ApproveMigration(c echo.Context) error {
	reviewerIDStr := middleware.GetUserID(c)
	reviewerID, err := uuid.Parse(reviewerIDStr)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "审核人 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	migrationID, err := uuid.Parse(c.Param("migrationId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_MIGRATION_ID", "迁移 ID 无效")
	}

	var req ApproveWorkspaceDBSchemaMigrationRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	migration, err := h.workspaceDatabaseService.ApproveDBSchemaMigration(c.Request().Context(), reviewerID, workspaceID, migrationID, service.ApproveWorkspaceDBSchemaMigrationRequest{
		Note: req.Note,
	})
	if err != nil {
		switch err {
		case service.ErrWorkspaceDBSchemaMigrationNotFound:
			return errorResponse(c, http.StatusNotFound, "MIGRATION_NOT_FOUND", "迁移记录不存在")
		case service.ErrDBSchemaReviewerNotFound:
			return errorResponse(c, http.StatusBadRequest, "REVIEWER_NOT_FOUND", "审核人不存在")
		case service.ErrWorkspaceDBSchemaMigrationReviewUnavailable:
			return errorResponse(c, http.StatusInternalServerError, "REVIEW_UNAVAILABLE", "审核服务不可用")
		default:
			return errorResponse(c, http.StatusInternalServerError, "APPROVE_FAILED", "审批失败")
		}
	}

	h.recordAudit(c, workspaceID, reviewerID, "workspace.db.migration.approve", "workspace_db_schema_migration", &migration.ID, entity.JSON{
		"status": migration.Status,
	})

	return successResponse(c, map[string]interface{}{
		"migration": migration,
		"message":   "迁移审批已通过",
	})
}

// RejectMigration 审批拒绝迁移
func (h *WorkspaceDatabaseHandler) RejectMigration(c echo.Context) error {
	reviewerIDStr := middleware.GetUserID(c)
	reviewerID, err := uuid.Parse(reviewerIDStr)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "审核人 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	migrationID, err := uuid.Parse(c.Param("migrationId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_MIGRATION_ID", "迁移 ID 无效")
	}

	var req RejectWorkspaceDBSchemaMigrationRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	migration, err := h.workspaceDatabaseService.RejectDBSchemaMigration(c.Request().Context(), reviewerID, workspaceID, migrationID, service.RejectWorkspaceDBSchemaMigrationRequest{
		Reason: req.Reason,
	})
	if err != nil {
		switch err {
		case service.ErrWorkspaceDBSchemaMigrationNotFound:
			return errorResponse(c, http.StatusNotFound, "MIGRATION_NOT_FOUND", "迁移记录不存在")
		case service.ErrDBSchemaReviewerNotFound:
			return errorResponse(c, http.StatusBadRequest, "REVIEWER_NOT_FOUND", "审核人不存在")
		case service.ErrWorkspaceDBSchemaMigrationReviewUnavailable:
			return errorResponse(c, http.StatusInternalServerError, "REVIEW_UNAVAILABLE", "审核服务不可用")
		default:
			return errorResponse(c, http.StatusInternalServerError, "REJECT_FAILED", "审批拒绝失败")
		}
	}

	h.recordAudit(c, workspaceID, reviewerID, "workspace.db.migration.reject", "workspace_db_schema_migration", &migration.ID, entity.JSON{
		"status": migration.Status,
	})

	return successResponse(c, map[string]interface{}{
		"migration": migration,
		"message":   "迁移审批已拒绝",
	})
}

// ExecuteMigration 执行已审批的迁移流水线
func (h *WorkspaceDatabaseHandler) ExecuteMigration(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	workspaceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "工作空间 ID 无效")
	}

	migrationID, err := uuid.Parse(c.Param("migrationId"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_MIGRATION_ID", "迁移 ID 无效")
	}

	migration, err := h.workspaceDatabaseService.ExecuteDBSchemaMigration(c.Request().Context(), workspaceID, uid, migrationID)
	if err != nil {
		switch err {
		case service.ErrWorkspaceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "工作空间不存在")
		case service.ErrWorkspaceUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权限访问此工作空间")
		case service.ErrWorkspaceDatabaseNotFound:
			return errorResponse(c, http.StatusNotFound, "DB_NOT_FOUND", "工作空间数据库不存在")
		case service.ErrWorkspaceDatabaseNotReady:
			return errorResponse(c, http.StatusConflict, "DB_NOT_READY", "工作空间数据库尚未就绪")
		case service.ErrWorkspaceDatabaseMigrationLocked:
			return errorResponse(c, http.StatusConflict, "MIGRATION_LOCKED", "已有迁移在执行，请稍后重试")
		case service.ErrWorkspaceDBSchemaMigrationActive:
			return errorResponse(c, http.StatusConflict, "MIGRATION_ACTIVE", "已有迁移在审批或执行中")
		case service.ErrWorkspaceDBSchemaMigrationNotFound:
			return errorResponse(c, http.StatusNotFound, "MIGRATION_NOT_FOUND", "迁移记录不存在")
		case service.ErrWorkspaceDBSchemaMigrationNotApproved:
			return errorResponse(c, http.StatusConflict, "NOT_APPROVED", "迁移尚未通过审批")
		case service.ErrWorkspaceDBSchemaMigrationNoPending:
			return errorResponse(c, http.StatusConflict, "NO_PENDING", "暂无可执行的迁移")
		case service.ErrWorkspaceDBSchemaMigrationBlocked:
			return errorResponse(c, http.StatusBadRequest, "MIGRATION_BLOCKED", "迁移预检未通过")
		case service.ErrWorkspaceDatabaseBackupFailed:
			return errorResponse(c, http.StatusInternalServerError, "BACKUP_FAILED", "迁移前备份失败")
		case service.ErrWorkspaceDatabaseMigrationFailed:
			return errorResponse(c, http.StatusInternalServerError, "MIGRATION_FAILED", "迁移执行失败")
		default:
			return errorResponse(c, http.StatusInternalServerError, "EXECUTE_FAILED", "迁移执行失败")
		}
	}

	h.recordAudit(c, workspaceID, uid, "workspace.db.migration.execute", "workspace_db_schema_migration", &migration.ID, entity.JSON{
		"status": migration.Status,
	})

	return successResponse(c, map[string]interface{}{
		"migration": migration,
		"message":   "迁移流水线已执行",
	})
}

func (h *WorkspaceDatabaseHandler) recordAudit(ctx echo.Context, workspaceID uuid.UUID, actorID uuid.UUID, action string, targetType string, targetID *uuid.UUID, metadata entity.JSON) {
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
