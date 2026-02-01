package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ConversationTemplateRepository 对话模板仓储接口
type ConversationTemplateRepository interface {
	Create(ctx context.Context, template *entity.ConversationTemplate) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.ConversationTemplate, error)
	Update(ctx context.Context, template *entity.ConversationTemplate) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, userID uuid.UUID, opts TemplateListOptions) ([]entity.ConversationTemplate, int64, error)
	IncrementUsage(ctx context.Context, id uuid.UUID) error
}

// TemplateListOptions 模板列表选项
type TemplateListOptions struct {
	Page          int
	PageSize      int
	IncludePublic bool   // 是否包含公开模板
	IncludeSystem bool   // 是否包含系统模板
	Search        string // 搜索关键词
}

type conversationTemplateRepository struct {
	db *gorm.DB
}

// NewConversationTemplateRepository 创建对话模板仓储
func NewConversationTemplateRepository(db *gorm.DB) ConversationTemplateRepository {
	return &conversationTemplateRepository{db: db}
}

func (r *conversationTemplateRepository) Create(ctx context.Context, template *entity.ConversationTemplate) error {
	return r.db.WithContext(ctx).Create(template).Error
}

func (r *conversationTemplateRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.ConversationTemplate, error) {
	var template entity.ConversationTemplate
	err := r.db.WithContext(ctx).First(&template, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &template, nil
}

func (r *conversationTemplateRepository) Update(ctx context.Context, template *entity.ConversationTemplate) error {
	return r.db.WithContext(ctx).Save(template).Error
}

func (r *conversationTemplateRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.ConversationTemplate{}, "id = ?", id).Error
}

func (r *conversationTemplateRepository) List(ctx context.Context, userID uuid.UUID, opts TemplateListOptions) ([]entity.ConversationTemplate, int64, error) {
	var templates []entity.ConversationTemplate
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.ConversationTemplate{})

	// 构建查询条件：用户自己的模板 OR 公开模板 OR 系统模板
	conditions := []string{"user_id = ?"}
	args := []interface{}{userID}

	if opts.IncludePublic {
		conditions = append(conditions, "is_public = ?")
		args = append(args, true)
	}
	if opts.IncludeSystem {
		conditions = append(conditions, "is_system = ?")
		args = append(args, true)
	}

	// 使用 OR 连接条件
	conditionStr := conditions[0]
	for i := 1; i < len(conditions); i++ {
		conditionStr += " OR " + conditions[i]
	}
	query = query.Where(conditionStr, args...)

	// 搜索
	if opts.Search != "" {
		query = query.Where("name LIKE ? OR description LIKE ?", "%"+opts.Search+"%", "%"+opts.Search+"%")
	}

	// 计数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 分页
	if opts.Page <= 0 {
		opts.Page = 1
	}
	if opts.PageSize <= 0 {
		opts.PageSize = 20
	}
	offset := (opts.Page - 1) * opts.PageSize

	// 排序：系统模板优先，然后按使用次数和更新时间
	err := query.
		Order("is_system DESC, usage_count DESC, updated_at DESC").
		Offset(offset).
		Limit(opts.PageSize).
		Find(&templates).Error

	if err != nil {
		return nil, 0, err
	}

	return templates, total, nil
}

func (r *conversationTemplateRepository) IncrementUsage(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.ConversationTemplate{}).
		Where("id = ?", id).
		UpdateColumn("usage_count", gorm.Expr("usage_count + 1")).
		Error
}
