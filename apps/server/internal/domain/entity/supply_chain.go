package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SBOMRecord SBOM 存档记录
type SBOMRecord struct {
	ID uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`

	WorkspaceID uuid.UUID `gorm:"type:char(36);not null;index" json:"workspace_id"`

	ArtifactType string `gorm:"size:50;not null;index" json:"artifact_type"`
	ArtifactID   string `gorm:"size:200;not null;index" json:"artifact_id"`

	Format  string  `gorm:"size:30;not null" json:"format"`
	Version *string `gorm:"size:30" json:"version,omitempty"`
	Source  *string `gorm:"size:50" json:"source,omitempty"`

	Digest   *string `gorm:"size:64" json:"digest,omitempty"`
	Content  JSON    `gorm:"type:json;column:content_json" json:"content"`
	Metadata JSON    `gorm:"type:json;column:metadata_json" json:"metadata,omitempty"`

	GeneratedAt *time.Time `json:"generated_at,omitempty"`
	CreatedBy   *uuid.UUID `gorm:"type:char(36)" json:"created_by,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

// TableName 表名
func (SBOMRecord) TableName() string {
	return "what_reverse_sboms"
}

// BeforeCreate 创建前钩子
func (r *SBOMRecord) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

// ArtifactSignature 构建产物签名记录
type ArtifactSignature struct {
	ID uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`

	WorkspaceID uuid.UUID `gorm:"type:char(36);not null;index" json:"workspace_id"`

	ArtifactType string `gorm:"size:50;not null;index" json:"artifact_type"`
	ArtifactID   string `gorm:"size:200;not null;index" json:"artifact_id"`

	Digest    string `gorm:"size:64;not null" json:"digest"`
	Algorithm string `gorm:"size:30;not null" json:"algorithm"`
	Signature string `gorm:"type:longtext;not null" json:"signature"`

	Signer      *string `gorm:"size:120" json:"signer,omitempty"`
	Certificate *string `gorm:"type:longtext" json:"certificate,omitempty"`

	Verified             bool       `gorm:"default:false" json:"verified"`
	VerifiedAt           *time.Time `json:"verified_at,omitempty"`
	VerificationMetadata JSON       `gorm:"type:json;column:verification_metadata_json" json:"verification_metadata,omitempty"`

	Source    *string    `gorm:"size:50" json:"source,omitempty"`
	CreatedBy *uuid.UUID `gorm:"type:char(36)" json:"created_by,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

// TableName 表名
func (ArtifactSignature) TableName() string {
	return "what_reverse_artifact_signatures"
}

// BeforeCreate 创建前钩子
func (r *ArtifactSignature) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}
