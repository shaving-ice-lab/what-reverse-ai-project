package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SupportAssignmentRuleRepository 自动分派规则仓储接口
type SupportAssignmentRuleRepository interface {
	List(ctx context.Context, includeDisabled bool) ([]entity.SupportAssignmentRule, error)
	Create(ctx context.Context, rule *entity.SupportAssignmentRule) error
	Update(ctx context.Context, rule *entity.SupportAssignmentRule) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.SupportAssignmentRule, error)
}

type supportAssignmentRuleRepository struct {
	db *gorm.DB
}

// NewSupportAssignmentRuleRepository 创建自动分派规则仓储实例
func NewSupportAssignmentRuleRepository(db *gorm.DB) SupportAssignmentRuleRepository {
	return &supportAssignmentRuleRepository{db: db}
}

func (r *supportAssignmentRuleRepository) List(ctx context.Context, includeDisabled bool) ([]entity.SupportAssignmentRule, error) {
	var rules []entity.SupportAssignmentRule
	query := r.db.WithContext(ctx).Model(&entity.SupportAssignmentRule{})
	if !includeDisabled {
		query = query.Where("enabled = ?", true)
	}
	if err := query.Order("sort_order ASC, created_at DESC").Find(&rules).Error; err != nil {
		return nil, err
	}
	return rules, nil
}

func (r *supportAssignmentRuleRepository) Create(ctx context.Context, rule *entity.SupportAssignmentRule) error {
	return r.db.WithContext(ctx).Create(rule).Error
}

func (r *supportAssignmentRuleRepository) Update(ctx context.Context, rule *entity.SupportAssignmentRule) error {
	return r.db.WithContext(ctx).Save(rule).Error
}

func (r *supportAssignmentRuleRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.SupportAssignmentRule, error) {
	var rule entity.SupportAssignmentRule
	if err := r.db.WithContext(ctx).First(&rule, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &rule, nil
}
