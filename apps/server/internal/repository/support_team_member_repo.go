package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SupportTeamMemberRepository 支持团队成员仓储接口
type SupportTeamMemberRepository interface {
	ListByTeam(ctx context.Context, teamID uuid.UUID) ([]entity.SupportTeamMember, error)
	Create(ctx context.Context, member *entity.SupportTeamMember) error
	Delete(ctx context.Context, teamID, userID uuid.UUID) error
}

type supportTeamMemberRepository struct {
	db *gorm.DB
}

// NewSupportTeamMemberRepository 创建支持团队成员仓储实例
func NewSupportTeamMemberRepository(db *gorm.DB) SupportTeamMemberRepository {
	return &supportTeamMemberRepository{db: db}
}

func (r *supportTeamMemberRepository) ListByTeam(ctx context.Context, teamID uuid.UUID) ([]entity.SupportTeamMember, error) {
	var members []entity.SupportTeamMember
	if err := r.db.WithContext(ctx).
		Where("team_id = ?", teamID).
		Order("sort_order ASC, created_at ASC").
		Find(&members).Error; err != nil {
		return nil, err
	}
	return members, nil
}

func (r *supportTeamMemberRepository) Create(ctx context.Context, member *entity.SupportTeamMember) error {
	return r.db.WithContext(ctx).Create(member).Error
}

func (r *supportTeamMemberRepository) Delete(ctx context.Context, teamID, userID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Where("team_id = ? AND user_id = ?", teamID, userID).
		Delete(&entity.SupportTeamMember{}).Error
}
