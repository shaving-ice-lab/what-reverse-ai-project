package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrDeviceNotFound     = errors.New("device not found")
	ErrDeviceNotActive    = errors.New("device not active")
	ErrConflictNotFound   = errors.New("conflict not found")
	ErrInvalidResolution  = errors.New("invalid resolution type")
)

// SyncService 同步服务接口
type SyncService interface {
	// 设备管理
	RegisterDevice(ctx context.Context, userID uuid.UUID, req RegisterDeviceRequest) (*entity.SyncDevice, error)
	GetDevices(ctx context.Context, userID uuid.UUID) ([]entity.SyncDevice, error)
	UpdateDeviceActivity(ctx context.Context, deviceID string) error
	DeactivateDevice(ctx context.Context, userID uuid.UUID, deviceID string) error
	
	// 同步操作
	Pull(ctx context.Context, userID uuid.UUID, req entity.SyncPullRequest) (*entity.SyncPullResponse, error)
	Push(ctx context.Context, userID uuid.UUID, req entity.SyncPushRequest) (*entity.SyncPushResponse, error)
	
	// 冲突解决
	GetConflicts(ctx context.Context, userID uuid.UUID) ([]entity.SyncConflict, error)
	ResolveConflict(ctx context.Context, userID uuid.UUID, conflictID uuid.UUID, resolution string) error
	
	// 状态查询
	GetSyncStatus(ctx context.Context, userID uuid.UUID, deviceID string) (*entity.SyncStatus, error)
	
	// 工作流同步
	SyncWorkflow(ctx context.Context, userID uuid.UUID, deviceID string, workflowID uuid.UUID, encryptedData string, version int64) error
}

// RegisterDeviceRequest 注册设备请求
type RegisterDeviceRequest struct {
	DeviceID   string `json:"device_id" validate:"required"`
	DeviceName string `json:"device_name"`
	DeviceType string `json:"device_type"` // desktop, mobile, web
	Platform   string `json:"platform"`    // windows, macos, linux, ios, android, web
	PublicKey  string `json:"public_key"`  // 用于端到端加密的公钥
}

type syncService struct {
	syncRepo     repository.SyncRepository
	workflowRepo repository.WorkflowRepository
}

// NewSyncService 创建同步服务实例
func NewSyncService(syncRepo repository.SyncRepository, workflowRepo repository.WorkflowRepository) SyncService {
	return &syncService{
		syncRepo:     syncRepo,
		workflowRepo: workflowRepo,
	}
}

// ========== 设备管理 ==========

func (s *syncService) RegisterDevice(ctx context.Context, userID uuid.UUID, req RegisterDeviceRequest) (*entity.SyncDevice, error) {
	// 检查设备是否已存在
	existing, _ := s.syncRepo.GetDevice(ctx, req.DeviceID)
	if existing != nil {
		// 更新现有设备
		existing.DeviceName = req.DeviceName
		existing.DeviceType = req.DeviceType
		existing.Platform = req.Platform
		existing.PublicKey = req.PublicKey
		existing.IsActive = true
		now := time.Now()
		existing.LastSeenAt = &now
		
		if err := s.syncRepo.UpdateDevice(ctx, existing); err != nil {
			return nil, err
		}
		return existing, nil
	}
	
	// 创建新设备
	now := time.Now()
	device := &entity.SyncDevice{
		UserID:     userID,
		DeviceID:   req.DeviceID,
		DeviceName: req.DeviceName,
		DeviceType: req.DeviceType,
		Platform:   req.Platform,
		PublicKey:  req.PublicKey,
		IsActive:   true,
		LastSeenAt: &now,
	}
	
	if err := s.syncRepo.RegisterDevice(ctx, device); err != nil {
		return nil, err
	}
	
	return device, nil
}

func (s *syncService) GetDevices(ctx context.Context, userID uuid.UUID) ([]entity.SyncDevice, error) {
	return s.syncRepo.GetUserDevices(ctx, userID)
}

func (s *syncService) UpdateDeviceActivity(ctx context.Context, deviceID string) error {
	device, err := s.syncRepo.GetDevice(ctx, deviceID)
	if err != nil {
		return ErrDeviceNotFound
	}
	
	now := time.Now()
	device.LastSeenAt = &now
	
	return s.syncRepo.UpdateDevice(ctx, device)
}

func (s *syncService) DeactivateDevice(ctx context.Context, userID uuid.UUID, deviceID string) error {
	device, err := s.syncRepo.GetDevice(ctx, deviceID)
	if err != nil {
		return ErrDeviceNotFound
	}
	
	// 验证设备属于该用户
	if device.UserID != userID {
		return ErrUnauthorized
	}
	
	return s.syncRepo.DeactivateDevice(ctx, deviceID)
}

// ========== 同步操作 ==========

func (s *syncService) Pull(ctx context.Context, userID uuid.UUID, req entity.SyncPullRequest) (*entity.SyncPullResponse, error) {
	// 验证设备
	device, err := s.syncRepo.GetDevice(ctx, req.DeviceID)
	if err != nil {
		return nil, ErrDeviceNotFound
	}
	if !device.IsActive {
		return nil, ErrDeviceNotActive
	}
	
	// 更新设备活动时间
	s.UpdateDeviceActivity(ctx, req.DeviceID)
	
	// 获取待同步的变更
	changes, err := s.syncRepo.GetPendingChanges(ctx, userID, req.DeviceID, req.LastSyncAt, 100)
	if err != nil {
		return nil, err
	}
	
	// 过滤资源类型
	if len(req.ResourceTypes) > 0 {
		resourceTypeSet := make(map[string]bool)
		for _, rt := range req.ResourceTypes {
			resourceTypeSet[rt] = true
		}
		
		filtered := make([]entity.SyncChange, 0)
		for _, change := range changes {
			if resourceTypeSet[change.ResourceType] {
				filtered = append(filtered, change)
			}
		}
		changes = filtered
	}
	
	// 更新设备最后同步时间
	now := time.Now()
	device.LastSyncAt = &now
	s.syncRepo.UpdateDevice(ctx, device)
	
	return &entity.SyncPullResponse{
		Changes:    changes,
		HasMore:    len(changes) == 100,
		ServerTime: now,
	}, nil
}

func (s *syncService) Push(ctx context.Context, userID uuid.UUID, req entity.SyncPushRequest) (*entity.SyncPushResponse, error) {
	// 验证设备
	device, err := s.syncRepo.GetDevice(ctx, req.DeviceID)
	if err != nil {
		return nil, ErrDeviceNotFound
	}
	if !device.IsActive {
		return nil, ErrDeviceNotActive
	}
	
	// 更新设备活动时间
	s.UpdateDeviceActivity(ctx, req.DeviceID)
	
	accepted := make([]string, 0)
	conflicts := make([]entity.SyncConflict, 0)
	
	for _, change := range req.Changes {
		// 设置用户和设备信息
		change.UserID = userID
		change.DeviceID = req.DeviceID
		
		// 检查是否有冲突
		existingRecord, _ := s.syncRepo.GetSyncRecord(ctx, userID, change.ResourceType, change.ResourceID)
		
		if existingRecord != nil && existingRecord.RemoteVersion >= change.Version {
			// 存在冲突
			conflict := entity.SyncConflict{
				UserID:         userID,
				ResourceType:   change.ResourceType,
				ResourceID:     change.ResourceID,
				LocalDeviceID:  req.DeviceID,
				RemoteDeviceID: existingRecord.DeviceID,
				LocalData:      change.EncryptedData,
				LocalVersion:   change.Version,
				RemoteVersion:  existingRecord.RemoteVersion,
			}
			
			if err := s.syncRepo.CreateConflict(ctx, &conflict); err != nil {
				continue
			}
			
			conflicts = append(conflicts, conflict)
		} else {
			// 接受变更
			if err := s.syncRepo.CreateChange(ctx, &change); err != nil {
				continue
			}
			
			// 更新同步记录
			record := &entity.SyncRecord{
				UserID:         userID,
				DeviceID:       req.DeviceID,
				ResourceType:   change.ResourceType,
				ResourceID:     change.ResourceID,
				State:          entity.SyncStateInSync,
				RemoteVersion:  change.Version,
				DataHash:       change.DataHash,
				LastModifiedAt: time.Now(),
			}
			now := time.Now()
			record.LastSyncedAt = &now
			
			if existingRecord != nil {
				record.ID = existingRecord.ID
				record.LocalVersion = existingRecord.LocalVersion
			}
			
			s.syncRepo.UpsertSyncRecord(ctx, record)
			
			accepted = append(accepted, change.ID.String())
		}
	}
	
	// 更新设备最后同步时间
	now := time.Now()
	device.LastSyncAt = &now
	s.syncRepo.UpdateDevice(ctx, device)
	
	return &entity.SyncPushResponse{
		Accepted:   accepted,
		Conflicts:  conflicts,
		ServerTime: now,
	}, nil
}

// ========== 冲突解决 ==========

func (s *syncService) GetConflicts(ctx context.Context, userID uuid.UUID) ([]entity.SyncConflict, error) {
	return s.syncRepo.GetUnresolvedConflicts(ctx, userID)
}

func (s *syncService) ResolveConflict(ctx context.Context, userID uuid.UUID, conflictID uuid.UUID, resolution string) error {
	// 验证 resolution 类型
	validResolutions := map[string]bool{
		"local":  true,
		"remote": true,
		"merge":  true,
		"manual": true,
	}
	if !validResolutions[resolution] {
		return ErrInvalidResolution
	}
	
	return s.syncRepo.ResolveConflict(ctx, conflictID, resolution)
}

// ========== 状态查询 ==========

func (s *syncService) GetSyncStatus(ctx context.Context, userID uuid.UUID, deviceID string) (*entity.SyncStatus, error) {
	return s.syncRepo.GetSyncStatus(ctx, userID, deviceID)
}

// ========== 工作流同步 ==========

func (s *syncService) SyncWorkflow(ctx context.Context, userID uuid.UUID, deviceID string, workflowID uuid.UUID, encryptedData string, version int64) error {
	// 创建同步变更记录
	change := &entity.SyncChange{
		UserID:        userID,
		DeviceID:      deviceID,
		ResourceType:  "workflow",
		ResourceID:    workflowID,
		Operation:     entity.SyncOpUpdate,
		EncryptedData: encryptedData,
		DataHash:      hashData(encryptedData),
		Version:       version,
	}
	
	return s.syncRepo.CreateChange(ctx, change)
}

// hashData 计算数据哈希
func hashData(data string) string {
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}
