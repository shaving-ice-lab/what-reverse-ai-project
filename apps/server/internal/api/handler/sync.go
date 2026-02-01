package handler

import (
	"errors"
	"net/http"
	"time"

	"github.com/agentflow/server/internal/api/middleware"
	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/service"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// SyncHandler 同步处理器
type SyncHandler struct {
	syncService service.SyncService
}

// NewSyncHandler 创建同步处理器
func NewSyncHandler(syncService service.SyncService) *SyncHandler {
	return &SyncHandler{syncService: syncService}
}

// ========== 请求/响应结构 ==========

type RegisterDeviceRequest struct {
	DeviceID   string `json:"device_id" validate:"required"`
	DeviceName string `json:"device_name"`
	DeviceType string `json:"device_type"` // desktop, mobile, web
	Platform   string `json:"platform"`    // windows, macos, linux, ios, android
	PublicKey  string `json:"public_key"`  // 端到端加密公钥
}

type SyncPullRequest struct {
	DeviceID      string   `json:"device_id" validate:"required"`
	LastSyncAt    *string  `json:"last_sync_at"`
	ResourceTypes []string `json:"resource_types,omitempty"`
}

type SyncPushRequest struct {
	DeviceID string          `json:"device_id" validate:"required"`
	Changes  []SyncChangeDTO `json:"changes" validate:"required"`
}

type SyncChangeDTO struct {
	ResourceType  string `json:"resource_type" validate:"required"`
	ResourceID    string `json:"resource_id" validate:"required"`
	Operation     string `json:"operation" validate:"required"` // create, update, delete
	EncryptedData string `json:"encrypted_data"`
	DataHash      string `json:"data_hash"`
	Version       int64  `json:"version" validate:"required"`
}

type ResolveConflictRequest struct {
	Resolution string `json:"resolution" validate:"required"` // local, remote, merge, manual
}

// ========== 设备管理 ==========

// RegisterDevice 注册同步设备
func (h *SyncHandler) RegisterDevice(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req RegisterDeviceRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if req.DeviceID == "" {
		return errorResponse(c, http.StatusBadRequest, "REQUIRED_FIELDS", "设备 ID 不能为空")
	}

	device, err := h.syncService.RegisterDevice(c.Request().Context(), uid, service.RegisterDeviceRequest{
		DeviceID:   req.DeviceID,
		DeviceName: req.DeviceName,
		DeviceType: req.DeviceType,
		Platform:   req.Platform,
		PublicKey:  req.PublicKey,
	})
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "REGISTER_FAILED", "设备注册失败")
	}

	return successResponse(c, map[string]interface{}{
		"device":  device,
		"message": "设备注册成功",
	})
}

// GetDevices 获取用户的同步设备列表
func (h *SyncHandler) GetDevices(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	devices, err := h.syncService.GetDevices(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "GET_DEVICES_FAILED", "获取设备列表失败")
	}

	return successResponse(c, map[string]interface{}{
		"devices": devices,
	})
}

// DeactivateDevice 停用同步设备
func (h *SyncHandler) DeactivateDevice(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	deviceID := c.Param("device_id")
	if deviceID == "" {
		return errorResponse(c, http.StatusBadRequest, "REQUIRED_FIELDS", "设备 ID 不能为空")
	}

	if err := h.syncService.DeactivateDevice(c.Request().Context(), uid, deviceID); err != nil {
		switch err {
		case service.ErrDeviceNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "设备不存在")
		case service.ErrUnauthorized:
			return errorResponse(c, http.StatusForbidden, "FORBIDDEN", "无权操作")
		default:
			return errorResponse(c, http.StatusInternalServerError, "DEACTIVATE_FAILED", "停用设备失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"success": true,
		"message": "设备已停用",
	})
}

// ========== 同步操作 ==========

// Pull 拉取同步变更
func (h *SyncHandler) Pull(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req SyncPullRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if req.DeviceID == "" {
		return errorResponse(c, http.StatusBadRequest, "REQUIRED_FIELDS", "设备 ID 不能为空")
	}

	// 解析时间
	var pullReq entity.SyncPullRequest
	pullReq.DeviceID = req.DeviceID
	pullReq.ResourceTypes = req.ResourceTypes
	
	if req.LastSyncAt != nil && *req.LastSyncAt != "" {
		// 解析 ISO 8601 时间格式
		t, err := parseTime(*req.LastSyncAt)
		if err == nil {
			pullReq.LastSyncAt = &t
		}
	}

	response, err := h.syncService.Pull(c.Request().Context(), uid, pullReq)
	if err != nil {
		switch err {
		case service.ErrDeviceNotFound:
			return errorResponse(c, http.StatusNotFound, "DEVICE_NOT_FOUND", "设备不存在")
		case service.ErrDeviceNotActive:
			return errorResponse(c, http.StatusForbidden, "DEVICE_INACTIVE", "设备已停用")
		default:
			return errorResponse(c, http.StatusInternalServerError, "PULL_FAILED", "拉取同步失败")
		}
	}

	return successResponse(c, response)
}

// Push 推送同步变更
func (h *SyncHandler) Push(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	var req SyncPushRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if req.DeviceID == "" {
		return errorResponse(c, http.StatusBadRequest, "REQUIRED_FIELDS", "设备 ID 不能为空")
	}

	// 转换变更数据
	changes := make([]entity.SyncChange, 0, len(req.Changes))
	for _, dto := range req.Changes {
		resourceID, err := uuid.Parse(dto.ResourceID)
		if err != nil {
			continue
		}
		
		changes = append(changes, entity.SyncChange{
			ResourceType:  dto.ResourceType,
			ResourceID:    resourceID,
			Operation:     entity.SyncOperation(dto.Operation),
			EncryptedData: dto.EncryptedData,
			DataHash:      dto.DataHash,
			Version:       dto.Version,
		})
	}

	response, err := h.syncService.Push(c.Request().Context(), uid, entity.SyncPushRequest{
		DeviceID: req.DeviceID,
		Changes:  changes,
	})
	if err != nil {
		switch err {
		case service.ErrDeviceNotFound:
			return errorResponse(c, http.StatusNotFound, "DEVICE_NOT_FOUND", "设备不存在")
		case service.ErrDeviceNotActive:
			return errorResponse(c, http.StatusForbidden, "DEVICE_INACTIVE", "设备已停用")
		default:
			return errorResponse(c, http.StatusInternalServerError, "PUSH_FAILED", "推送同步失败")
		}
	}

	return successResponse(c, response)
}

// ========== 冲突解决 ==========

// GetConflicts 获取未解决的冲突
func (h *SyncHandler) GetConflicts(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	conflicts, err := h.syncService.GetConflicts(c.Request().Context(), uid)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "GET_CONFLICTS_FAILED", "获取冲突列表失败")
	}

	return successResponse(c, map[string]interface{}{
		"conflicts": conflicts,
	})
}

// ResolveConflict 解决冲突
func (h *SyncHandler) ResolveConflict(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	conflictID, err := uuid.Parse(c.Param("conflict_id"))
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_ID", "冲突 ID 无效")
	}

	var req ResolveConflictRequest
	if err := c.Bind(&req); err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_REQUEST", "请求参数无效")
	}

	if err := h.syncService.ResolveConflict(c.Request().Context(), uid, conflictID, req.Resolution); err != nil {
		switch err {
		case service.ErrConflictNotFound:
			return errorResponse(c, http.StatusNotFound, "NOT_FOUND", "冲突不存在")
		case service.ErrInvalidResolution:
			return errorResponse(c, http.StatusBadRequest, "INVALID_RESOLUTION", "无效的解决方式")
		default:
			return errorResponse(c, http.StatusInternalServerError, "RESOLVE_FAILED", "解决冲突失败")
		}
	}

	return successResponse(c, map[string]interface{}{
		"success": true,
		"message": "冲突已解决",
	})
}

// ========== 状态查询 ==========

// GetSyncStatus 获取同步状态
func (h *SyncHandler) GetSyncStatus(c echo.Context) error {
	userID := middleware.GetUserID(c)
	uid, err := uuid.Parse(userID)
	if err != nil {
		return errorResponse(c, http.StatusBadRequest, "INVALID_USER_ID", "用户 ID 无效")
	}

	deviceID := c.QueryParam("device_id")
	if deviceID == "" {
		return errorResponse(c, http.StatusBadRequest, "REQUIRED_FIELDS", "设备 ID 不能为空")
	}

	status, err := h.syncService.GetSyncStatus(c.Request().Context(), uid, deviceID)
	if err != nil {
		return errorResponse(c, http.StatusInternalServerError, "GET_STATUS_FAILED", "获取同步状态失败")
	}

	return successResponse(c, map[string]interface{}{
		"status": status,
	})
}

// ========== 辅助函数 ==========

func parseTime(s string) (time.Time, error) {
	// 尝试多种时间格式
	formats := []string{
		time.RFC3339,
		time.RFC3339Nano,
		"2006-01-02T15:04:05Z",
		"2006-01-02T15:04:05",
		"2006-01-02 15:04:05",
	}
	
	for _, format := range formats {
		if t, err := time.Parse(format, s); err == nil {
			return t, nil
		}
	}
	
	return time.Time{}, errors.New("invalid time format")
}
