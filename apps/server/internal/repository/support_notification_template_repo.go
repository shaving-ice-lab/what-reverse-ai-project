package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"gorm.io/gorm"
)

// SupportNotificationTemplateRepository 支持通知模板仓储接口
type SupportNotificationTemplateRepository interface {
	GetByKey(ctx context.Context, key string) (*entity.SupportNotificationTemplate, error)
	Upsert(ctx context.Context, template *entity.SupportNotificationTemplate) error
}

type supportNotificationTemplateRepository struct {
	db *gorm.DB
}

// NewSupportNotificationTemplateRepository 创建支持通知模板仓储实例
func NewSupportNotificationTemplateRepository(db *gorm.DB) SupportNotificationTemplateRepository {
	return &supportNotificationTemplateRepository{db: db}
}

func (r *supportNotificationTemplateRepository) GetByKey(ctx context.Context, key string) (*entity.SupportNotificationTemplate, error) {
	var template entity.SupportNotificationTemplate
	if err := r.db.WithContext(ctx).First(&template, "key = ?", key).Error; err != nil {
		return nil, err
	}
	return &template, nil
}

func (r *supportNotificationTemplateRepository) Upsert(ctx context.Context, template *entity.SupportNotificationTemplate) error {
	if template == nil {
		return nil
	}
	var existing entity.SupportNotificationTemplate
	err := r.db.WithContext(ctx).First(&existing, "key = ?", template.Key).Error
	if err == nil {
		template.ID = existing.ID
		return r.db.WithContext(ctx).Save(template).Error
	}
	if err == gorm.ErrRecordNotFound {
		return r.db.WithContext(ctx).Create(template).Error
	}
	return err
}
