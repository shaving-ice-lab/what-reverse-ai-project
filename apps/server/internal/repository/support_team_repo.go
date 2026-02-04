package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SupportTeamRepository 支持团队仓储接口
type SupportTeamRepository interface {
	List(ctx context.Context, includeDisabled bool) ([]entity.SupportTeam, error)
	Create(ctx context.Context, team *entity.SupportTeam) error
	Update(ctx context.Context, team *entity.SupportTeam) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.SupportTeam, error)
}

type supportTeamRepository struct {
	db *gorm.DB
}

// NewSupportTeamRepository 创建支持团队仓储实例
func NewSupportTeamRepository(db *gorm.DB) SupportTeamRepository {
	return &supportTeamRepository{db: db}
}

func (r *supportTeamRepository) List(ctx context.Context, includeDisabled bool) ([]entity.SupportTeam, error) {
	var teams []entity.SupportTeam
	query := r.db.WithContext(ctx).Model(&entity.SupportTeam{})
	if !includeDisabled {
		query = query.Where("enabled = ?", true)
	}
	if err := query.Order("created_at DESC").Find(&teams).Error; err != nil {
		return nil, err
	}
	return teams, nil
}

func (r *supportTeamRepository) Create(ctx context.Context, team *entity.SupportTeam) error {
	return r.db.WithContext(ctx).Create(team).Error
}

func (r *supportTeamRepository) Update(ctx context.Context, team *entity.SupportTeam) error {
	return r.db.WithContext(ctx).Save(team).Error
}

func (r *supportTeamRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.SupportTeam, error) {
	var team entity.SupportTeam
	if err := r.db.WithContext(ctx).First(&team, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &team, nil
}
