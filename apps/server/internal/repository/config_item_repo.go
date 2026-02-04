package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ConfigItemFilter 配置条目筛选条件
type ConfigItemFilter struct {
	ScopeType       string
	ScopeID         *uuid.UUID
	ConfigKey       *string
	IncludeInactive bool
}

// ConfigItemRepository 配置条目仓储接口
type ConfigItemRepository interface {
	Create(ctx context.Context, item *entity.ConfigItem) error
	Update(ctx context.Context, item *entity.ConfigItem) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.ConfigItem, error)
	FindByScopeAndKey(ctx context.Context, scopeType string, scopeID *uuid.UUID, key string) (*entity.ConfigItem, error)
	List(ctx context.Context, filter ConfigItemFilter) ([]entity.ConfigItem, error)
}

type configItemRepository struct {
	db *gorm.DB
}

// NewConfigItemRepository 创建配置条目仓储实例
func NewConfigItemRepository(db *gorm.DB) ConfigItemRepository {
	return &configItemRepository{db: db}
}

func (r *configItemRepository) Create(ctx context.Context, item *entity.ConfigItem) error {
	return r.db.WithContext(ctx).Create(item).Error
}

func (r *configItemRepository) Update(ctx context.Context, item *entity.ConfigItem) error {
	return r.db.WithContext(ctx).Save(item).Error
}

func (r *configItemRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.ConfigItem, error) {
	var item entity.ConfigItem
	if err := r.db.WithContext(ctx).First(&item, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *configItemRepository) FindByScopeAndKey(ctx context.Context, scopeType string, scopeID *uuid.UUID, key string) (*entity.ConfigItem, error) {
	query := r.db.WithContext(ctx).Model(&entity.ConfigItem{}).Where("scope_type = ? AND config_key = ?", scopeType, key)
	if scopeID == nil {
		query = query.Where("scope_id IS NULL")
	} else {
		query = query.Where("scope_id = ?", *scopeID)
	}

	var item entity.ConfigItem
	if err := query.First(&item).Error; err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *configItemRepository) List(ctx context.Context, filter ConfigItemFilter) ([]entity.ConfigItem, error) {
	query := r.db.WithContext(ctx).Model(&entity.ConfigItem{})
	if filter.ScopeType != "" {
		query = query.Where("scope_type = ?", filter.ScopeType)
	}
	if filter.ScopeID != nil {
		query = query.Where("scope_id = ?", *filter.ScopeID)
	}
	if filter.ConfigKey != nil && *filter.ConfigKey != "" {
		query = query.Where("config_key = ?", *filter.ConfigKey)
	}
	if !filter.IncludeInactive {
		query = query.Where("is_active = ?", true)
	}

	var items []entity.ConfigItem
	if err := query.Order("updated_at desc").Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}
