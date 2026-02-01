package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// VersionListParams 版本列表参数
type VersionListParams struct {
	Page     int
	PageSize int
}

// WorkflowVersionRepository 工作流版本仓储接口
type WorkflowVersionRepository interface {
	Create(ctx context.Context, version *entity.WorkflowVersion) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.WorkflowVersion, error)
	GetByWorkflowAndVersion(ctx context.Context, workflowID uuid.UUID, version int) (*entity.WorkflowVersion, error)
	List(ctx context.Context, workflowID uuid.UUID, params VersionListParams) ([]entity.WorkflowVersion, int64, error)
	GetLatest(ctx context.Context, workflowID uuid.UUID) (*entity.WorkflowVersion, error)
	GetNextVersion(ctx context.Context, workflowID uuid.UUID) (int, error)
	DeleteOldVersions(ctx context.Context, workflowID uuid.UUID, keepCount int) error
}

type workflowVersionRepository struct {
	db *gorm.DB
}

// NewWorkflowVersionRepository 创建工作流版本仓储实例
func NewWorkflowVersionRepository(db *gorm.DB) WorkflowVersionRepository {
	return &workflowVersionRepository{db: db}
}

func (r *workflowVersionRepository) Create(ctx context.Context, version *entity.WorkflowVersion) error {
	return r.db.WithContext(ctx).Create(version).Error
}

func (r *workflowVersionRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.WorkflowVersion, error) {
	var version entity.WorkflowVersion
	if err := r.db.WithContext(ctx).
		Preload("Creator").
		First(&version, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &version, nil
}

func (r *workflowVersionRepository) GetByWorkflowAndVersion(ctx context.Context, workflowID uuid.UUID, version int) (*entity.WorkflowVersion, error) {
	var v entity.WorkflowVersion
	if err := r.db.WithContext(ctx).
		Preload("Creator").
		First(&v, "workflow_id = ? AND version = ?", workflowID, version).Error; err != nil {
		return nil, err
	}
	return &v, nil
}

func (r *workflowVersionRepository) List(ctx context.Context, workflowID uuid.UUID, params VersionListParams) ([]entity.WorkflowVersion, int64, error) {
	var versions []entity.WorkflowVersion
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.WorkflowVersion{}).Where("workflow_id = ?", workflowID)

	// 统计总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 按版本号倒序排序
	query = query.Order("version DESC")

	// 分页
	if params.Page > 0 && params.PageSize > 0 {
		offset := (params.Page - 1) * params.PageSize
		query = query.Offset(offset).Limit(params.PageSize)
	}

	// 预加载创建者信息
	if err := query.Preload("Creator").Find(&versions).Error; err != nil {
		return nil, 0, err
	}

	return versions, total, nil
}

func (r *workflowVersionRepository) GetLatest(ctx context.Context, workflowID uuid.UUID) (*entity.WorkflowVersion, error) {
	var version entity.WorkflowVersion
	if err := r.db.WithContext(ctx).
		Where("workflow_id = ?", workflowID).
		Order("version DESC").
		First(&version).Error; err != nil {
		return nil, err
	}
	return &version, nil
}

func (r *workflowVersionRepository) GetNextVersion(ctx context.Context, workflowID uuid.UUID) (int, error) {
	var maxVersion int
	err := r.db.WithContext(ctx).
		Model(&entity.WorkflowVersion{}).
		Where("workflow_id = ?", workflowID).
		Select("COALESCE(MAX(version), 0)").
		Scan(&maxVersion).Error
	if err != nil {
		return 0, err
	}
	return maxVersion + 1, nil
}

func (r *workflowVersionRepository) DeleteOldVersions(ctx context.Context, workflowID uuid.UUID, keepCount int) error {
	// 获取需要保留的版本号
	var keepVersions []int
	if err := r.db.WithContext(ctx).
		Model(&entity.WorkflowVersion{}).
		Where("workflow_id = ?", workflowID).
		Order("version DESC").
		Limit(keepCount).
		Pluck("version", &keepVersions).Error; err != nil {
		return err
	}

	if len(keepVersions) == 0 {
		return nil
	}

	// 删除旧版本
	return r.db.WithContext(ctx).
		Where("workflow_id = ? AND version NOT IN ?", workflowID, keepVersions).
		Delete(&entity.WorkflowVersion{}).Error
}
