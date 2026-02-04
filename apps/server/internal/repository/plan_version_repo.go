package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PlanVersionRepository 规划版本仓储接口
type PlanVersionRepository interface {
	Create(ctx context.Context, version *entity.PlanVersion) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.PlanVersion, error)
	ListByWorkspace(ctx context.Context, workspaceID uuid.UUID, limit int) ([]entity.PlanVersion, error)
}

type planVersionRepository struct {
	db *gorm.DB
}

// NewPlanVersionRepository 创建规划版本仓储实例
func NewPlanVersionRepository(db *gorm.DB) PlanVersionRepository {
	return &planVersionRepository{db: db}
}

func (r *planVersionRepository) Create(ctx context.Context, version *entity.PlanVersion) error {
	return r.db.WithContext(ctx).Create(version).Error
}

func (r *planVersionRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.PlanVersion, error) {
	var version entity.PlanVersion
	if err := r.db.WithContext(ctx).First(&version, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &version, nil
}

func (r *planVersionRepository) ListByWorkspace(ctx context.Context, workspaceID uuid.UUID, limit int) ([]entity.PlanVersion, error) {
	var versions []entity.PlanVersion
	query := r.db.WithContext(ctx).
		Where("workspace_id = ?", workspaceID).
		Order("created_at DESC")
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Find(&versions).Error; err != nil {
		return nil, err
	}
	return versions, nil
}
