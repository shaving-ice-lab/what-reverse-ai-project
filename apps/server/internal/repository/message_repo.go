package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// MessageListOptions 消息列表查询选项
type MessageListOptions struct {
	ConversationID uuid.UUID
	Page           int
	PageSize       int
	BeforeID       *uuid.UUID // 获取此ID之前的消息
	AfterID        *uuid.UUID // 获取此ID之后的消息
}

// MessageRepository 消息仓储接口
type MessageRepository interface {
	Create(ctx context.Context, message *entity.Message) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Message, error)
	List(ctx context.Context, opts MessageListOptions) ([]entity.Message, int64, error)
	Update(ctx context.Context, message *entity.Message) error
	Delete(ctx context.Context, id uuid.UUID) error
	
	// 批量操作
	BatchCreate(ctx context.Context, messages []entity.Message) error
	DeleteByConversation(ctx context.Context, conversationID uuid.UUID) error
	
	// 统计
	CountByConversation(ctx context.Context, conversationID uuid.UUID) (int64, error)
	
	// 获取最新消息
	GetLatest(ctx context.Context, conversationID uuid.UUID) (*entity.Message, error)
	GetLatestN(ctx context.Context, conversationID uuid.UUID, n int) ([]entity.Message, error)
	
	// Token统计
	SumTokensByConversation(ctx context.Context, conversationID uuid.UUID) (int64, error)
}

type messageRepository struct {
	db *gorm.DB
}

// NewMessageRepository 创建消息仓储实例
func NewMessageRepository(db *gorm.DB) MessageRepository {
	return &messageRepository{db: db}
}

func (r *messageRepository) Create(ctx context.Context, message *entity.Message) error {
	return r.db.WithContext(ctx).Create(message).Error
}

func (r *messageRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Message, error) {
	var message entity.Message
	if err := r.db.WithContext(ctx).First(&message, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &message, nil
}

func (r *messageRepository) List(ctx context.Context, opts MessageListOptions) ([]entity.Message, int64, error) {
	var messages []entity.Message
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.Message{}).
		Where("conversation_id = ?", opts.ConversationID)

	// 基于游标的分页
	if opts.BeforeID != nil {
		var beforeMsg entity.Message
		if err := r.db.WithContext(ctx).First(&beforeMsg, "id = ?", opts.BeforeID).Error; err == nil {
			query = query.Where("created_at < ?", beforeMsg.CreatedAt)
		}
	}
	if opts.AfterID != nil {
		var afterMsg entity.Message
		if err := r.db.WithContext(ctx).First(&afterMsg, "id = ?", opts.AfterID).Error; err == nil {
			query = query.Where("created_at > ?", afterMsg.CreatedAt)
		}
	}

	// 计算总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 排序 (最新的在前)
	query = query.Order("created_at DESC")

	// 分页
	if opts.Page > 0 && opts.PageSize > 0 {
		offset := (opts.Page - 1) * opts.PageSize
		query = query.Offset(offset).Limit(opts.PageSize)
	} else if opts.PageSize > 0 {
		query = query.Limit(opts.PageSize)
	}

	if err := query.Find(&messages).Error; err != nil {
		return nil, 0, err
	}

	return messages, total, nil
}

func (r *messageRepository) Update(ctx context.Context, message *entity.Message) error {
	return r.db.WithContext(ctx).Save(message).Error
}

func (r *messageRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.Message{}, "id = ?", id).Error
}

func (r *messageRepository) BatchCreate(ctx context.Context, messages []entity.Message) error {
	if len(messages) == 0 {
		return nil
	}
	return r.db.WithContext(ctx).Create(&messages).Error
}

func (r *messageRepository) DeleteByConversation(ctx context.Context, conversationID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Where("conversation_id = ?", conversationID).
		Delete(&entity.Message{}).Error
}

func (r *messageRepository) CountByConversation(ctx context.Context, conversationID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&entity.Message{}).
		Where("conversation_id = ?", conversationID).
		Count(&count).Error
	return count, err
}

func (r *messageRepository) GetLatest(ctx context.Context, conversationID uuid.UUID) (*entity.Message, error) {
	var message entity.Message
	if err := r.db.WithContext(ctx).
		Where("conversation_id = ?", conversationID).
		Order("created_at DESC").
		First(&message).Error; err != nil {
		return nil, err
	}
	return &message, nil
}

func (r *messageRepository) GetLatestN(ctx context.Context, conversationID uuid.UUID, n int) ([]entity.Message, error) {
	var messages []entity.Message
	if err := r.db.WithContext(ctx).
		Where("conversation_id = ?", conversationID).
		Order("created_at DESC").
		Limit(n).
		Find(&messages).Error; err != nil {
		return nil, err
	}
	
	// 反转顺序，使最早的消息在前
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}
	
	return messages, nil
}

func (r *messageRepository) SumTokensByConversation(ctx context.Context, conversationID uuid.UUID) (int64, error) {
	var sum int64
	err := r.db.WithContext(ctx).Model(&entity.Message{}).
		Where("conversation_id = ?", conversationID).
		Select("COALESCE(SUM(token_usage), 0)").
		Scan(&sum).Error
	return sum, err
}
