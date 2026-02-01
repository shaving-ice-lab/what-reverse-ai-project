package repository

import (
	"context"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SyncRepository 同步仓储接口
type SyncRepository interface {
	// 设备管理
	RegisterDevice(ctx context.Context, device *entity.SyncDevice) error
	GetDevice(ctx context.Context, deviceID string) (*entity.SyncDevice, error)
	GetUserDevices(ctx context.Context, userID uuid.UUID) ([]entity.SyncDevice, error)
	UpdateDevice(ctx context.Context, device *entity.SyncDevice) error
	DeactivateDevice(ctx context.Context, deviceID string) error
	
	// 同步记录
	GetSyncRecord(ctx context.Context, userID uuid.UUID, resourceType string, resourceID uuid.UUID) (*entity.SyncRecord, error)
	UpsertSyncRecord(ctx context.Context, record *entity.SyncRecord) error
	GetPendingSyncRecords(ctx context.Context, userID uuid.UUID, deviceID string) ([]entity.SyncRecord, error)
	
	// 变更管理
	CreateChange(ctx context.Context, change *entity.SyncChange) error
	GetPendingChanges(ctx context.Context, userID uuid.UUID, deviceID string, since *time.Time, limit int) ([]entity.SyncChange, error)
	MarkChangesProcessed(ctx context.Context, changeIDs []uuid.UUID) error
	
	// 冲突管理
	CreateConflict(ctx context.Context, conflict *entity.SyncConflict) error
	GetUnresolvedConflicts(ctx context.Context, userID uuid.UUID) ([]entity.SyncConflict, error)
	ResolveConflict(ctx context.Context, conflictID uuid.UUID, resolution string) error
	
	// 统计
	GetSyncStatus(ctx context.Context, userID uuid.UUID, deviceID string) (*entity.SyncStatus, error)
}

type syncRepository struct {
	db *gorm.DB
}

// NewSyncRepository 创建同步仓储实例
func NewSyncRepository(db *gorm.DB) SyncRepository {
	return &syncRepository{db: db}
}

// ========== 设备管理 ==========

func (r *syncRepository) RegisterDevice(ctx context.Context, device *entity.SyncDevice) error {
	return r.db.WithContext(ctx).Create(device).Error
}

func (r *syncRepository) GetDevice(ctx context.Context, deviceID string) (*entity.SyncDevice, error) {
	var device entity.SyncDevice
	if err := r.db.WithContext(ctx).Where("device_id = ?", deviceID).First(&device).Error; err != nil {
		return nil, err
	}
	return &device, nil
}

func (r *syncRepository) GetUserDevices(ctx context.Context, userID uuid.UUID) ([]entity.SyncDevice, error) {
	var devices []entity.SyncDevice
	if err := r.db.WithContext(ctx).
		Where("user_id = ? AND is_active = ?", userID, true).
		Order("last_seen_at DESC").
		Find(&devices).Error; err != nil {
		return nil, err
	}
	return devices, nil
}

func (r *syncRepository) UpdateDevice(ctx context.Context, device *entity.SyncDevice) error {
	return r.db.WithContext(ctx).Save(device).Error
}

func (r *syncRepository) DeactivateDevice(ctx context.Context, deviceID string) error {
	return r.db.WithContext(ctx).
		Model(&entity.SyncDevice{}).
		Where("device_id = ?", deviceID).
		Update("is_active", false).Error
}

// ========== 同步记录 ==========

func (r *syncRepository) GetSyncRecord(ctx context.Context, userID uuid.UUID, resourceType string, resourceID uuid.UUID) (*entity.SyncRecord, error) {
	var record entity.SyncRecord
	if err := r.db.WithContext(ctx).
		Where("user_id = ? AND resource_type = ? AND resource_id = ?", userID, resourceType, resourceID).
		First(&record).Error; err != nil {
		return nil, err
	}
	return &record, nil
}

func (r *syncRepository) UpsertSyncRecord(ctx context.Context, record *entity.SyncRecord) error {
	return r.db.WithContext(ctx).Save(record).Error
}

func (r *syncRepository) GetPendingSyncRecords(ctx context.Context, userID uuid.UUID, deviceID string) ([]entity.SyncRecord, error) {
	var records []entity.SyncRecord
	if err := r.db.WithContext(ctx).
		Where("user_id = ? AND device_id = ? AND state = ?", userID, deviceID, entity.SyncStatePending).
		Find(&records).Error; err != nil {
		return nil, err
	}
	return records, nil
}

// ========== 变更管理 ==========

func (r *syncRepository) CreateChange(ctx context.Context, change *entity.SyncChange) error {
	return r.db.WithContext(ctx).Create(change).Error
}

func (r *syncRepository) GetPendingChanges(ctx context.Context, userID uuid.UUID, deviceID string, since *time.Time, limit int) ([]entity.SyncChange, error) {
	var changes []entity.SyncChange
	
	query := r.db.WithContext(ctx).
		Where("user_id = ? AND device_id != ? AND is_processed = ?", userID, deviceID, false)
	
	if since != nil {
		query = query.Where("created_at > ?", since)
	}
	
	if err := query.Order("created_at ASC").Limit(limit).Find(&changes).Error; err != nil {
		return nil, err
	}
	
	return changes, nil
}

func (r *syncRepository) MarkChangesProcessed(ctx context.Context, changeIDs []uuid.UUID) error {
	if len(changeIDs) == 0 {
		return nil
	}
	now := time.Now()
	return r.db.WithContext(ctx).
		Model(&entity.SyncChange{}).
		Where("id IN ?", changeIDs).
		Updates(map[string]interface{}{
			"is_processed": true,
			"processed_at": now,
		}).Error
}

// ========== 冲突管理 ==========

func (r *syncRepository) CreateConflict(ctx context.Context, conflict *entity.SyncConflict) error {
	return r.db.WithContext(ctx).Create(conflict).Error
}

func (r *syncRepository) GetUnresolvedConflicts(ctx context.Context, userID uuid.UUID) ([]entity.SyncConflict, error) {
	var conflicts []entity.SyncConflict
	if err := r.db.WithContext(ctx).
		Where("user_id = ? AND is_resolved = ?", userID, false).
		Order("created_at DESC").
		Find(&conflicts).Error; err != nil {
		return nil, err
	}
	return conflicts, nil
}

func (r *syncRepository) ResolveConflict(ctx context.Context, conflictID uuid.UUID, resolution string) error {
	now := time.Now()
	return r.db.WithContext(ctx).
		Model(&entity.SyncConflict{}).
		Where("id = ?", conflictID).
		Updates(map[string]interface{}{
			"is_resolved": true,
			"resolution":  resolution,
			"resolved_at": now,
		}).Error
}

// ========== 统计 ==========

func (r *syncRepository) GetSyncStatus(ctx context.Context, userID uuid.UUID, deviceID string) (*entity.SyncStatus, error) {
	status := &entity.SyncStatus{
		DeviceID:  deviceID,
		SyncState: entity.SyncStateInSync,
	}
	
	// 获取设备最后同步时间
	var device entity.SyncDevice
	if err := r.db.WithContext(ctx).Where("device_id = ?", deviceID).First(&device).Error; err == nil {
		status.LastSyncAt = device.LastSyncAt
	}
	
	// 统计待同步变更数
	var pendingCount int64
	r.db.WithContext(ctx).
		Model(&entity.SyncChange{}).
		Where("user_id = ? AND device_id != ? AND is_processed = ?", userID, deviceID, false).
		Count(&pendingCount)
	status.PendingChanges = int(pendingCount)
	
	// 统计未解决冲突数
	var conflictCount int64
	r.db.WithContext(ctx).
		Model(&entity.SyncConflict{}).
		Where("user_id = ? AND is_resolved = ?", userID, false).
		Count(&conflictCount)
	status.ConflictsCount = int(conflictCount)
	
	// 统计已同步项目数
	var syncedCount int64
	r.db.WithContext(ctx).
		Model(&entity.SyncRecord{}).
		Where("user_id = ? AND state = ?", userID, entity.SyncStateInSync).
		Count(&syncedCount)
	status.TotalSyncedItems = int(syncedCount)
	
	// 确定同步状态
	if conflictCount > 0 {
		status.SyncState = entity.SyncStateConflict
	} else if pendingCount > 0 {
		status.SyncState = entity.SyncStatePending
	}
	
	return status, nil
}
