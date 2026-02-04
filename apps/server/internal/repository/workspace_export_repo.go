package repository

import (
	"context"
	"errors"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WorkspaceExportRepository 工作空间导出任务仓储接口
type WorkspaceExportRepository interface {
	Create(ctx context.Context, job *entity.WorkspaceExportJob) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.WorkspaceExportJob, error)
	GetByIDAndWorkspace(ctx context.Context, id, workspaceID uuid.UUID) (*entity.WorkspaceExportJob, error)
	ListByWorkspace(ctx context.Context, workspaceID uuid.UUID, limit int) ([]entity.WorkspaceExportJob, error)
	ListPending(ctx context.Context, limit int) ([]entity.WorkspaceExportJob, error)
	Update(ctx context.Context, job *entity.WorkspaceExportJob) error
	SetProcessing(ctx context.Context, id uuid.UUID) error
	SetCompleted(ctx context.Context, id uuid.UUID, fileName, filePath string, fileSize int64, checksum string, expiresAt *time.Time) error
	SetFailed(ctx context.Context, id uuid.UUID, errorMsg string) error
	GetLatestByWorkspaceAndType(ctx context.Context, workspaceID uuid.UUID, exportType entity.WorkspaceExportJobType) (*entity.WorkspaceExportJob, error)
	GetLatestCompletedByWorkspaceAndType(ctx context.Context, workspaceID uuid.UUID, exportType entity.WorkspaceExportJobType) (*entity.WorkspaceExportJob, error)
	ListByWorkspaceAndType(ctx context.Context, workspaceID uuid.UUID, exportType entity.WorkspaceExportJobType) ([]entity.WorkspaceExportJob, error)
	DeleteByWorkspaceAndType(ctx context.Context, workspaceID uuid.UUID, exportType entity.WorkspaceExportJobType) (int64, error)
	HasActiveByWorkspaceAndType(ctx context.Context, workspaceID uuid.UUID, exportType entity.WorkspaceExportJobType) (bool, error)
	ExistsByWorkspaceTypeAndRange(ctx context.Context, workspaceID uuid.UUID, exportType entity.WorkspaceExportJobType, rangeStart, rangeEnd time.Time) (bool, error)
	ListExpiredByType(ctx context.Context, exportType entity.WorkspaceExportJobType, limit int) ([]entity.WorkspaceExportJob, error)
	DeleteByID(ctx context.Context, id uuid.UUID) error
}

type workspaceExportRepository struct {
	db *gorm.DB
}

// NewWorkspaceExportRepository 创建导出任务仓储实例
func NewWorkspaceExportRepository(db *gorm.DB) WorkspaceExportRepository {
	return &workspaceExportRepository{db: db}
}

func (r *workspaceExportRepository) Create(ctx context.Context, job *entity.WorkspaceExportJob) error {
	return r.db.WithContext(ctx).Create(job).Error
}

func (r *workspaceExportRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.WorkspaceExportJob, error) {
	var job entity.WorkspaceExportJob
	if err := r.db.WithContext(ctx).First(&job, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &job, nil
}

func (r *workspaceExportRepository) GetByIDAndWorkspace(ctx context.Context, id, workspaceID uuid.UUID) (*entity.WorkspaceExportJob, error) {
	var job entity.WorkspaceExportJob
	if err := r.db.WithContext(ctx).
		Where("id = ? AND workspace_id = ?", id, workspaceID).
		First(&job).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &job, nil
}

func (r *workspaceExportRepository) ListByWorkspace(ctx context.Context, workspaceID uuid.UUID, limit int) ([]entity.WorkspaceExportJob, error) {
	if limit <= 0 {
		limit = 20
	}
	var jobs []entity.WorkspaceExportJob
	err := r.db.WithContext(ctx).
		Where("workspace_id = ?", workspaceID).
		Order("created_at DESC").
		Limit(limit).
		Find(&jobs).Error
	return jobs, err
}

func (r *workspaceExportRepository) ListPending(ctx context.Context, limit int) ([]entity.WorkspaceExportJob, error) {
	if limit <= 0 {
		limit = 5
	}
	var jobs []entity.WorkspaceExportJob
	err := r.db.WithContext(ctx).
		Where("status = ?", entity.WorkspaceExportStatusPending).
		Order("created_at ASC").
		Limit(limit).
		Find(&jobs).Error
	return jobs, err
}

func (r *workspaceExportRepository) Update(ctx context.Context, job *entity.WorkspaceExportJob) error {
	return r.db.WithContext(ctx).Save(job).Error
}

func (r *workspaceExportRepository) SetProcessing(ctx context.Context, id uuid.UUID) error {
	now := time.Now()
	return r.db.WithContext(ctx).
		Model(&entity.WorkspaceExportJob{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":     entity.WorkspaceExportStatusProcessing,
			"started_at": now,
		}).Error
}

func (r *workspaceExportRepository) SetCompleted(ctx context.Context, id uuid.UUID, fileName, filePath string, fileSize int64, checksum string, expiresAt *time.Time) error {
	now := time.Now()
	updates := map[string]interface{}{
		"status":       entity.WorkspaceExportStatusCompleted,
		"completed_at": now,
		"file_name":    fileName,
		"file_path":    filePath,
		"file_size":    fileSize,
		"checksum":     checksum,
	}
	if expiresAt != nil {
		updates["expires_at"] = *expiresAt
	}
	return r.db.WithContext(ctx).
		Model(&entity.WorkspaceExportJob{}).
		Where("id = ?", id).
		Updates(updates).Error
}

func (r *workspaceExportRepository) SetFailed(ctx context.Context, id uuid.UUID, errorMsg string) error {
	return r.db.WithContext(ctx).
		Model(&entity.WorkspaceExportJob{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":        entity.WorkspaceExportStatusFailed,
			"error_message": errorMsg,
		}).Error
}

func (r *workspaceExportRepository) GetLatestByWorkspaceAndType(ctx context.Context, workspaceID uuid.UUID, exportType entity.WorkspaceExportJobType) (*entity.WorkspaceExportJob, error) {
	var job entity.WorkspaceExportJob
	if err := r.db.WithContext(ctx).
		Where("workspace_id = ? AND export_type = ?", workspaceID, exportType).
		Order("created_at DESC").
		First(&job).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &job, nil
}

func (r *workspaceExportRepository) GetLatestCompletedByWorkspaceAndType(ctx context.Context, workspaceID uuid.UUID, exportType entity.WorkspaceExportJobType) (*entity.WorkspaceExportJob, error) {
	var job entity.WorkspaceExportJob
	if err := r.db.WithContext(ctx).
		Where("workspace_id = ? AND export_type = ? AND status = ?", workspaceID, exportType, entity.WorkspaceExportStatusCompleted).
		Order("created_at DESC").
		First(&job).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &job, nil
}

func (r *workspaceExportRepository) ListByWorkspaceAndType(ctx context.Context, workspaceID uuid.UUID, exportType entity.WorkspaceExportJobType) ([]entity.WorkspaceExportJob, error) {
	var jobs []entity.WorkspaceExportJob
	err := r.db.WithContext(ctx).
		Where("workspace_id = ? AND export_type = ?", workspaceID, exportType).
		Order("created_at DESC").
		Find(&jobs).Error
	return jobs, err
}

func (r *workspaceExportRepository) DeleteByWorkspaceAndType(ctx context.Context, workspaceID uuid.UUID, exportType entity.WorkspaceExportJobType) (int64, error) {
	result := r.db.WithContext(ctx).
		Where("workspace_id = ? AND export_type = ?", workspaceID, exportType).
		Delete(&entity.WorkspaceExportJob{})
	return result.RowsAffected, result.Error
}

func (r *workspaceExportRepository) HasActiveByWorkspaceAndType(ctx context.Context, workspaceID uuid.UUID, exportType entity.WorkspaceExportJobType) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).
		Model(&entity.WorkspaceExportJob{}).
		Where("workspace_id = ? AND export_type = ? AND status IN ?", workspaceID, exportType, []entity.WorkspaceExportJobStatus{
			entity.WorkspaceExportStatusPending,
			entity.WorkspaceExportStatusProcessing,
		}).
		Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *workspaceExportRepository) ExistsByWorkspaceTypeAndRange(ctx context.Context, workspaceID uuid.UUID, exportType entity.WorkspaceExportJobType, rangeStart, rangeEnd time.Time) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).
		Model(&entity.WorkspaceExportJob{}).
		Where("workspace_id = ? AND export_type = ? AND archive_range_start = ? AND archive_range_end = ?", workspaceID, exportType, rangeStart, rangeEnd).
		Where("status IN ?", []entity.WorkspaceExportJobStatus{
			entity.WorkspaceExportStatusPending,
			entity.WorkspaceExportStatusProcessing,
			entity.WorkspaceExportStatusCompleted,
		}).
		Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *workspaceExportRepository) ListExpiredByType(ctx context.Context, exportType entity.WorkspaceExportJobType, limit int) ([]entity.WorkspaceExportJob, error) {
	if limit <= 0 {
		limit = 50
	}
	var jobs []entity.WorkspaceExportJob
	err := r.db.WithContext(ctx).
		Where("export_type = ? AND expires_at IS NOT NULL AND expires_at <= ?", exportType, time.Now()).
		Order("expires_at ASC").
		Limit(limit).
		Find(&jobs).Error
	return jobs, err
}

func (r *workspaceExportRepository) DeleteByID(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.WorkspaceExportJob{}, "id = ?", id).Error
}
