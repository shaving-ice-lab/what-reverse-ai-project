package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SyncState 同步状态
type SyncState string

const (
	SyncStatePending   SyncState = "pending"
	SyncStateInSync    SyncState = "in_sync"
	SyncStateConflict  SyncState = "conflict"
	SyncStateError     SyncState = "error"
)

// SyncOperation 同步操作类型
type SyncOperation string

const (
	SyncOpCreate SyncOperation = "create"
	SyncOpUpdate SyncOperation = "update"
	SyncOpDelete SyncOperation = "delete"
)

// SyncRecord 同步记录
// 记录每个资源的同步状态
type SyncRecord struct {
	ID           uuid.UUID      `gorm:"type:char(36);primaryKey" json:"id"`
	UserID       uuid.UUID      `gorm:"type:char(36);not null;index" json:"user_id"`
	DeviceID     string         `gorm:"size:100;not null;index" json:"device_id"`
	
	// 资源信息
	ResourceType string         `gorm:"size:50;not null;index" json:"resource_type"` // workflow, folder, settings
	ResourceID   uuid.UUID      `gorm:"type:char(36);not null;index" json:"resource_id"`
	
	// 同步状态
	State        SyncState      `gorm:"type:varchar(20);default:'pending'" json:"state"`
	
	// 版本控制
	LocalVersion  int64         `gorm:"default:0" json:"local_version"`
	RemoteVersion int64         `gorm:"default:0" json:"remote_version"`
	
	// 加密数据哈希（用于快速比较）
	DataHash     string         `gorm:"size:64" json:"data_hash"`
	
	// 时间戳
	LastSyncedAt *time.Time     `json:"last_synced_at"`
	LastModifiedAt time.Time    `json:"last_modified_at"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName 表名
func (SyncRecord) TableName() string {
	return "what_reverse_sync_records"
}

// BeforeCreate 创建前钩子
func (s *SyncRecord) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// SyncDevice 同步设备
// 记录用户的同步设备
type SyncDevice struct {
	ID           uuid.UUID      `gorm:"type:char(36);primaryKey" json:"id"`
	UserID       uuid.UUID      `gorm:"type:char(36);not null;index" json:"user_id"`
	
	// 设备信息
	DeviceID     string         `gorm:"size:100;not null;uniqueIndex" json:"device_id"`
	DeviceName   string         `gorm:"size:200" json:"device_name"`
	DeviceType   string         `gorm:"size:50" json:"device_type"` // desktop, mobile, web
	Platform     string         `gorm:"size:50" json:"platform"`    // windows, macos, linux, ios, android, web
	
	// 公钥（用于端到端加密）
	PublicKey    string         `gorm:"type:text" json:"public_key"`
	
	// 状态
	IsActive     bool           `gorm:"default:true" json:"is_active"`
	
	// 最后活动
	LastSeenAt   *time.Time     `json:"last_seen_at"`
	LastSyncAt   *time.Time     `json:"last_sync_at"`
	
	// 时间戳
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName 表名
func (SyncDevice) TableName() string {
	return "what_reverse_sync_devices"
}

// BeforeCreate 创建前钩子
func (d *SyncDevice) BeforeCreate(tx *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return nil
}

// SyncChange 同步变更
// 记录待同步的变更
type SyncChange struct {
	ID           uuid.UUID       `gorm:"type:char(36);primaryKey" json:"id"`
	UserID       uuid.UUID       `gorm:"type:char(36);not null;index" json:"user_id"`
	DeviceID     string          `gorm:"size:100;not null;index" json:"device_id"`
	
	// 资源信息
	ResourceType string          `gorm:"size:50;not null" json:"resource_type"`
	ResourceID   uuid.UUID       `gorm:"type:char(36);not null" json:"resource_id"`
	
	// 变更信息
	Operation    SyncOperation   `gorm:"type:varchar(20);not null" json:"operation"`
	
	// 加密的数据内容
	EncryptedData string         `gorm:"type:longtext" json:"encrypted_data"`
	
	// 数据哈希
	DataHash     string          `gorm:"size:64" json:"data_hash"`
	
	// 版本号
	Version      int64           `gorm:"not null" json:"version"`
	
	// 是否已处理
	IsProcessed  bool            `gorm:"default:false;index" json:"is_processed"`
	ProcessedAt  *time.Time      `json:"processed_at"`
	
	// 时间戳
	CreatedAt    time.Time       `json:"created_at"`
}

// TableName 表名
func (SyncChange) TableName() string {
	return "what_reverse_sync_changes"
}

// BeforeCreate 创建前钩子
func (c *SyncChange) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

// SyncConflict 同步冲突
type SyncConflict struct {
	ID            uuid.UUID      `gorm:"type:char(36);primaryKey" json:"id"`
	UserID        uuid.UUID      `gorm:"type:char(36);not null;index" json:"user_id"`
	
	// 资源信息
	ResourceType  string         `gorm:"size:50;not null" json:"resource_type"`
	ResourceID    uuid.UUID      `gorm:"type:char(36);not null" json:"resource_id"`
	
	// 冲突的设备
	LocalDeviceID  string        `gorm:"size:100" json:"local_device_id"`
	RemoteDeviceID string        `gorm:"size:100" json:"remote_device_id"`
	
	// 冲突的数据（加密）
	LocalData     string         `gorm:"type:longtext" json:"local_data"`
	RemoteData    string         `gorm:"type:longtext" json:"remote_data"`
	
	// 版本信息
	LocalVersion  int64          `gorm:"default:0" json:"local_version"`
	RemoteVersion int64          `gorm:"default:0" json:"remote_version"`
	
	// 解决状态
	IsResolved    bool           `gorm:"default:false;index" json:"is_resolved"`
	Resolution    string         `gorm:"size:20" json:"resolution"` // local, remote, merge, manual
	ResolvedAt    *time.Time     `json:"resolved_at"`
	
	// 时间戳
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
}

// TableName 表名
func (SyncConflict) TableName() string {
	return "what_reverse_sync_conflicts"
}

// BeforeCreate 创建前钩子
func (c *SyncConflict) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

// SyncStatus 同步状态汇总（非持久化）
type SyncStatus struct {
	DeviceID           string    `json:"device_id"`
	LastSyncAt         *time.Time `json:"last_sync_at"`
	PendingChanges     int       `json:"pending_changes"`
	ConflictsCount     int       `json:"conflicts_count"`
	TotalSyncedItems   int       `json:"total_synced_items"`
	SyncState          SyncState `json:"sync_state"`
}

// SyncPullRequest 拉取同步请求
type SyncPullRequest struct {
	DeviceID    string    `json:"device_id"`
	LastSyncAt  *time.Time `json:"last_sync_at"`
	ResourceTypes []string `json:"resource_types,omitempty"`
}

// SyncPullResponse 拉取同步响应
type SyncPullResponse struct {
	Changes    []SyncChange `json:"changes"`
	HasMore    bool         `json:"has_more"`
	NextCursor string       `json:"next_cursor,omitempty"`
	ServerTime time.Time    `json:"server_time"`
}

// SyncPushRequest 推送同步请求
type SyncPushRequest struct {
	DeviceID  string       `json:"device_id"`
	Changes   []SyncChange `json:"changes"`
}

// SyncPushResponse 推送同步响应
type SyncPushResponse struct {
	Accepted   []string        `json:"accepted"`   // 接受的变更 ID
	Conflicts  []SyncConflict  `json:"conflicts"`  // 产生的冲突
	ServerTime time.Time       `json:"server_time"`
}
