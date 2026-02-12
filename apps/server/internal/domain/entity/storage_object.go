package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// StorageObject 文件存储对象
type StorageObject struct {
	ID          uuid.UUID      `gorm:"type:char(36);primaryKey" json:"id"`
	WorkspaceID uuid.UUID      `gorm:"type:char(36);not null;index" json:"workspace_id"`
	OwnerID     *uuid.UUID     `gorm:"type:char(36);index" json:"owner_id,omitempty"`
	FileName    string         `gorm:"size:500;not null" json:"file_name"`
	MimeType    string         `gorm:"size:200;not null" json:"mime_type"`
	FileSize    int64          `gorm:"not null" json:"file_size"`
	StoragePath string         `gorm:"size:1000;not null" json:"storage_path"`
	PublicURL   string         `gorm:"size:1000" json:"public_url"`
	Prefix      string         `gorm:"size:500;index" json:"prefix"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (StorageObject) TableName() string {
	return "storage_objects"
}
