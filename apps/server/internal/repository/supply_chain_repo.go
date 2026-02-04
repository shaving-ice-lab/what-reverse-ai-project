package repository

import (
	"context"
	"errors"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SBOMFilter SBOM 查询过滤
type SBOMFilter struct {
	WorkspaceID  *uuid.UUID
	ArtifactType string
	ArtifactID   string
	Format       string
	Source       string
}

// SignatureFilter 签名查询过滤
type SignatureFilter struct {
	WorkspaceID  *uuid.UUID
	ArtifactType string
	ArtifactID   string
	Digest       string
	Algorithm    string
}

// SupplyChainRepository 供应链数据仓储接口
type SupplyChainRepository interface {
	CreateSBOM(ctx context.Context, record *entity.SBOMRecord) error
	ListSBOMs(ctx context.Context, filter SBOMFilter, offset, limit int) ([]entity.SBOMRecord, int64, error)
	GetLatestSBOM(ctx context.Context, filter SBOMFilter) (*entity.SBOMRecord, error)

	CreateSignature(ctx context.Context, record *entity.ArtifactSignature) error
	ListSignatures(ctx context.Context, filter SignatureFilter, offset, limit int) ([]entity.ArtifactSignature, int64, error)
	GetLatestSignature(ctx context.Context, filter SignatureFilter) (*entity.ArtifactSignature, error)
}

type supplyChainRepository struct {
	db *gorm.DB
}

// NewSupplyChainRepository 创建供应链仓储实例
func NewSupplyChainRepository(db *gorm.DB) SupplyChainRepository {
	return &supplyChainRepository{db: db}
}

func (r *supplyChainRepository) CreateSBOM(ctx context.Context, record *entity.SBOMRecord) error {
	return r.db.WithContext(ctx).Create(record).Error
}

func (r *supplyChainRepository) ListSBOMs(ctx context.Context, filter SBOMFilter, offset, limit int) ([]entity.SBOMRecord, int64, error) {
	var records []entity.SBOMRecord
	var total int64

	query := r.applySBOMFilter(r.db.WithContext(ctx).Model(&entity.SBOMRecord{}), filter)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	if err := query.Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&records).Error; err != nil {
		return nil, 0, err
	}
	return records, total, nil
}

func (r *supplyChainRepository) GetLatestSBOM(ctx context.Context, filter SBOMFilter) (*entity.SBOMRecord, error) {
	var record entity.SBOMRecord
	query := r.applySBOMFilter(r.db.WithContext(ctx).Model(&entity.SBOMRecord{}), filter)
	if err := query.Order("created_at DESC").First(&record).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &record, nil
}

func (r *supplyChainRepository) CreateSignature(ctx context.Context, record *entity.ArtifactSignature) error {
	return r.db.WithContext(ctx).Create(record).Error
}

func (r *supplyChainRepository) ListSignatures(ctx context.Context, filter SignatureFilter, offset, limit int) ([]entity.ArtifactSignature, int64, error) {
	var records []entity.ArtifactSignature
	var total int64

	query := r.applySignatureFilter(r.db.WithContext(ctx).Model(&entity.ArtifactSignature{}), filter)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	if err := query.Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&records).Error; err != nil {
		return nil, 0, err
	}
	return records, total, nil
}

func (r *supplyChainRepository) GetLatestSignature(ctx context.Context, filter SignatureFilter) (*entity.ArtifactSignature, error) {
	var record entity.ArtifactSignature
	query := r.applySignatureFilter(r.db.WithContext(ctx).Model(&entity.ArtifactSignature{}), filter)
	if err := query.Order("created_at DESC").First(&record).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &record, nil
}

func (r *supplyChainRepository) applySBOMFilter(query *gorm.DB, filter SBOMFilter) *gorm.DB {
	if filter.WorkspaceID != nil {
		query = query.Where("workspace_id = ?", *filter.WorkspaceID)
	}
	if filter.ArtifactType != "" {
		query = query.Where("artifact_type = ?", filter.ArtifactType)
	}
	if filter.ArtifactID != "" {
		query = query.Where("artifact_id = ?", filter.ArtifactID)
	}
	if filter.Format != "" {
		query = query.Where("format = ?", filter.Format)
	}
	if filter.Source != "" {
		query = query.Where("source = ?", filter.Source)
	}
	return query
}

func (r *supplyChainRepository) applySignatureFilter(query *gorm.DB, filter SignatureFilter) *gorm.DB {
	if filter.WorkspaceID != nil {
		query = query.Where("workspace_id = ?", *filter.WorkspaceID)
	}
	if filter.ArtifactType != "" {
		query = query.Where("artifact_type = ?", filter.ArtifactType)
	}
	if filter.ArtifactID != "" {
		query = query.Where("artifact_id = ?", filter.ArtifactID)
	}
	if filter.Digest != "" {
		query = query.Where("digest = ?", filter.Digest)
	}
	if filter.Algorithm != "" {
		query = query.Where("algorithm = ?", filter.Algorithm)
	}
	return query
}
