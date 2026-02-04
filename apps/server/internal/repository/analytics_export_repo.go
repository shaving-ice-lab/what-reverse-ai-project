package repository

import (
	"context"
	"errors"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AnalyticsExportRepository 数据分析导出仓储接口
type AnalyticsExportRepository interface {
	Create(ctx context.Context, job *entity.AnalyticsExportJob) error
	GetByIDAndWorkspace(ctx context.Context, id, workspaceID uuid.UUID) (*entity.AnalyticsExportJob, error)
	ListByWorkspace(ctx context.Context, workspaceID uuid.UUID, limit int) ([]entity.AnalyticsExportJob, error)
	SetProcessing(ctx context.Context, id uuid.UUID) error
	SetCompleted(ctx context.Context, id uuid.UUID, fileName, filePath string, fileSize int64, checksum string, expiresAt *time.Time) error
	SetFailed(ctx context.Context, id uuid.UUID, errorMsg string) error
	Update(ctx context.Context, job *entity.AnalyticsExportJob) error
}

type analyticsExportRepository struct {
	db *gorm.DB
}

// NewAnalyticsExportRepository 创建导出仓储实例
func NewAnalyticsExportRepository(db *gorm.DB) AnalyticsExportRepository {
	return &analyticsExportRepository{db: db}
}

func (r *analyticsExportRepository) Create(ctx context.Context, job *entity.AnalyticsExportJob) error {
	return r.db.WithContext(ctx).Create(job).Error
}

func (r *analyticsExportRepository) GetByIDAndWorkspace(ctx context.Context, id, workspaceID uuid.UUID) (*entity.AnalyticsExportJob, error) {
	var job entity.AnalyticsExportJob
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

func (r *analyticsExportRepository) ListByWorkspace(ctx context.Context, workspaceID uuid.UUID, limit int) ([]entity.AnalyticsExportJob, error) {
	if limit <= 0 {
		limit = 20
	}
	var jobs []entity.AnalyticsExportJob
	err := r.db.WithContext(ctx).
		Where("workspace_id = ?", workspaceID).
		Order("created_at DESC").
		Limit(limit).
		Find(&jobs).Error
	return jobs, err
}

func (r *analyticsExportRepository) SetProcessing(ctx context.Context, id uuid.UUID) error {
	now := time.Now()
	return r.db.WithContext(ctx).
		Model(&entity.AnalyticsExportJob{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":     entity.AnalyticsExportStatusProcessing,
			"started_at": now,
		}).Error
}

func (r *analyticsExportRepository) SetCompleted(ctx context.Context, id uuid.UUID, fileName, filePath string, fileSize int64, checksum string, expiresAt *time.Time) error {
	now := time.Now()
	updates := map[string]interface{}{
		"status":       entity.AnalyticsExportStatusCompleted,
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
		Model(&entity.AnalyticsExportJob{}).
		Where("id = ?", id).
		Updates(updates).Error
}

func (r *analyticsExportRepository) SetFailed(ctx context.Context, id uuid.UUID, errorMsg string) error {
	return r.db.WithContext(ctx).
		Model(&entity.AnalyticsExportJob{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":        entity.AnalyticsExportStatusFailed,
			"error_message": errorMsg,
		}).Error
}

func (r *analyticsExportRepository) Update(ctx context.Context, job *entity.AnalyticsExportJob) error {
	return r.db.WithContext(ctx).Save(job).Error
}
