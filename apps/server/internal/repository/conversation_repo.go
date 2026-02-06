package repository

import (
	"context"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ConversationListOptions 对话列表查询选项
type ConversationListOptions struct {
	UserID      uuid.UUID
	WorkspaceID *uuid.UUID
	FolderID    *uuid.UUID
	Starred     *bool
	Pinned      *bool
	Archived    *bool
	Search      string
	Page        int
	PageSize    int
	OrderBy     string
}

// ConversationRepository 对话仓储接口
type ConversationRepository interface {
	Create(ctx context.Context, conversation *entity.Conversation) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Conversation, error)
	GetByIDWithMessages(ctx context.Context, id uuid.UUID, messageLimit int) (*entity.Conversation, error)
	List(ctx context.Context, opts ConversationListOptions) ([]entity.Conversation, int64, error)
	Update(ctx context.Context, conversation *entity.Conversation) error
	Delete(ctx context.Context, id uuid.UUID) error

	// 状态操作
	SetStarred(ctx context.Context, id uuid.UUID, starred bool) error
	SetPinned(ctx context.Context, id uuid.UUID, pinned bool) error
	SetArchived(ctx context.Context, id uuid.UUID, archived bool) error

	// 批量操作
	BatchSetStarred(ctx context.Context, ids []uuid.UUID, starred bool) error
	BatchSetArchived(ctx context.Context, ids []uuid.UUID, archived bool) error
	BatchDelete(ctx context.Context, ids []uuid.UUID) error
	BatchMove(ctx context.Context, ids []uuid.UUID, folderID *uuid.UUID) error

	// 统计
	CountByUser(ctx context.Context, userID uuid.UUID) (int64, error)
	CountByFolder(ctx context.Context, folderID uuid.UUID) (int64, error)

	// 更新消息计数和预览
	UpdateMessageStats(ctx context.Context, id uuid.UUID, messageCount int, preview string) error
	IncrementTokenUsage(ctx context.Context, id uuid.UUID, tokens int) error
}

type conversationRepository struct {
	db *gorm.DB
}

// NewConversationRepository 创建对话仓储实例
func NewConversationRepository(db *gorm.DB) ConversationRepository {
	return &conversationRepository{db: db}
}

func (r *conversationRepository) Create(ctx context.Context, conversation *entity.Conversation) error {
	return r.db.WithContext(ctx).Create(conversation).Error
}

func (r *conversationRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Conversation, error) {
	var conversation entity.Conversation
	if err := r.db.WithContext(ctx).
		Preload("Tags").
		Preload("Folder").
		First(&conversation, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &conversation, nil
}

func (r *conversationRepository) GetByIDWithMessages(ctx context.Context, id uuid.UUID, messageLimit int) (*entity.Conversation, error) {
	var conversation entity.Conversation
	if err := r.db.WithContext(ctx).
		Preload("Tags").
		Preload("Folder").
		Preload("Messages", func(db *gorm.DB) *gorm.DB {
			query := db.Order("created_at DESC")
			if messageLimit > 0 {
				query = query.Limit(messageLimit)
			}
			return query
		}).
		First(&conversation, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &conversation, nil
}

func (r *conversationRepository) List(ctx context.Context, opts ConversationListOptions) ([]entity.Conversation, int64, error) {
	var conversations []entity.Conversation
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.Conversation{}).
		Where("user_id = ?", opts.UserID)

	// Workspace 筛选
	if opts.WorkspaceID != nil {
		query = query.Where("workspace_id = ?", opts.WorkspaceID)
	}

	// 文件夹筛选
	if opts.FolderID != nil {
		query = query.Where("folder_id = ?", opts.FolderID)
	}

	// 状态筛选
	if opts.Starred != nil {
		query = query.Where("starred = ?", *opts.Starred)
	}
	if opts.Pinned != nil {
		query = query.Where("pinned = ?", *opts.Pinned)
	}
	if opts.Archived != nil {
		query = query.Where("archived = ?", *opts.Archived)
	}

	// 搜索
	if opts.Search != "" {
		searchPattern := "%" + opts.Search + "%"
		query = query.Where("title LIKE ? OR preview LIKE ?", searchPattern, searchPattern)
	}

	// 计算总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 排序
	orderBy := "pinned DESC, updated_at DESC"
	if opts.OrderBy != "" {
		orderBy = opts.OrderBy
	}
	query = query.Order(orderBy)

	// 分页
	if opts.Page > 0 && opts.PageSize > 0 {
		offset := (opts.Page - 1) * opts.PageSize
		query = query.Offset(offset).Limit(opts.PageSize)
	}

	// 预加载关联
	if err := query.Preload("Tags").Find(&conversations).Error; err != nil {
		return nil, 0, err
	}

	return conversations, total, nil
}

func (r *conversationRepository) Update(ctx context.Context, conversation *entity.Conversation) error {
	return r.db.WithContext(ctx).Save(conversation).Error
}

func (r *conversationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.Conversation{}, "id = ?", id).Error
}

func (r *conversationRepository) SetStarred(ctx context.Context, id uuid.UUID, starred bool) error {
	return r.db.WithContext(ctx).Model(&entity.Conversation{}).
		Where("id = ?", id).
		Update("starred", starred).Error
}

func (r *conversationRepository) SetPinned(ctx context.Context, id uuid.UUID, pinned bool) error {
	return r.db.WithContext(ctx).Model(&entity.Conversation{}).
		Where("id = ?", id).
		Update("pinned", pinned).Error
}

func (r *conversationRepository) SetArchived(ctx context.Context, id uuid.UUID, archived bool) error {
	return r.db.WithContext(ctx).Model(&entity.Conversation{}).
		Where("id = ?", id).
		Update("archived", archived).Error
}

func (r *conversationRepository) BatchSetStarred(ctx context.Context, ids []uuid.UUID, starred bool) error {
	return r.db.WithContext(ctx).Model(&entity.Conversation{}).
		Where("id IN ?", ids).
		Update("starred", starred).Error
}

func (r *conversationRepository) BatchSetArchived(ctx context.Context, ids []uuid.UUID, archived bool) error {
	return r.db.WithContext(ctx).Model(&entity.Conversation{}).
		Where("id IN ?", ids).
		Update("archived", archived).Error
}

func (r *conversationRepository) BatchDelete(ctx context.Context, ids []uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.Conversation{}, "id IN ?", ids).Error
}

func (r *conversationRepository) BatchMove(ctx context.Context, ids []uuid.UUID, folderID *uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&entity.Conversation{}).
		Where("id IN ?", ids).
		Update("folder_id", folderID).Error
}

func (r *conversationRepository) CountByUser(ctx context.Context, userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&entity.Conversation{}).
		Where("user_id = ?", userID).
		Count(&count).Error
	return count, err
}

func (r *conversationRepository) CountByFolder(ctx context.Context, folderID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&entity.Conversation{}).
		Where("folder_id = ?", folderID).
		Count(&count).Error
	return count, err
}

func (r *conversationRepository) UpdateMessageStats(ctx context.Context, id uuid.UUID, messageCount int, preview string) error {
	return r.db.WithContext(ctx).Model(&entity.Conversation{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"message_count": messageCount,
			"preview":       preview,
		}).Error
}

func (r *conversationRepository) IncrementTokenUsage(ctx context.Context, id uuid.UUID, tokens int) error {
	return r.db.WithContext(ctx).Model(&entity.Conversation{}).
		Where("id = ?", id).
		Update("token_usage", gorm.Expr("token_usage + ?", tokens)).Error
}

// ConversationFolderRepository 对话文件夹仓储接口
type ConversationFolderRepository interface {
	Create(ctx context.Context, folder *entity.ConversationFolder) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.ConversationFolder, error)
	List(ctx context.Context, userID uuid.UUID) ([]entity.ConversationFolder, error)
	ListWithCount(ctx context.Context, userID uuid.UUID) ([]entity.ConversationFolder, error)
	Update(ctx context.Context, folder *entity.ConversationFolder) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type conversationFolderRepository struct {
	db *gorm.DB
}

// NewConversationFolderRepository 创建对话文件夹仓储实例
func NewConversationFolderRepository(db *gorm.DB) ConversationFolderRepository {
	return &conversationFolderRepository{db: db}
}

func (r *conversationFolderRepository) Create(ctx context.Context, folder *entity.ConversationFolder) error {
	return r.db.WithContext(ctx).Create(folder).Error
}

func (r *conversationFolderRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.ConversationFolder, error) {
	var folder entity.ConversationFolder
	if err := r.db.WithContext(ctx).First(&folder, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &folder, nil
}

func (r *conversationFolderRepository) List(ctx context.Context, userID uuid.UUID) ([]entity.ConversationFolder, error) {
	var folders []entity.ConversationFolder
	if err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("sort_order ASC, created_at ASC").
		Find(&folders).Error; err != nil {
		return nil, err
	}
	return folders, nil
}

func (r *conversationFolderRepository) ListWithCount(ctx context.Context, userID uuid.UUID) ([]entity.ConversationFolder, error) {
	var folders []entity.ConversationFolder

	if err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("sort_order ASC, created_at ASC").
		Find(&folders).Error; err != nil {
		return nil, err
	}

	// 获取每个文件夹的对话数量
	for i := range folders {
		var count int64
		r.db.WithContext(ctx).Model(&entity.Conversation{}).
			Where("folder_id = ? AND archived = ?", folders[i].ID, false).
			Count(&count)
		folders[i].ConversationCount = int(count)
	}

	return folders, nil
}

func (r *conversationFolderRepository) Update(ctx context.Context, folder *entity.ConversationFolder) error {
	return r.db.WithContext(ctx).Save(folder).Error
}

func (r *conversationFolderRepository) Delete(ctx context.Context, id uuid.UUID) error {
	// 先将该文件夹下的对话移出
	r.db.WithContext(ctx).Model(&entity.Conversation{}).
		Where("folder_id = ?", id).
		Update("folder_id", nil)

	return r.db.WithContext(ctx).Delete(&entity.ConversationFolder{}, "id = ?", id).Error
}

// ConversationTagRepository 对话标签仓储接口
type ConversationTagRepository interface {
	Create(ctx context.Context, tag *entity.ConversationTag) error
	DeleteByConversation(ctx context.Context, conversationID uuid.UUID) error
	ListByConversation(ctx context.Context, conversationID uuid.UUID) ([]entity.ConversationTag, error)
	SetTags(ctx context.Context, conversationID uuid.UUID, tags []string) error
}

type conversationTagRepository struct {
	db *gorm.DB
}

// NewConversationTagRepository 创建对话标签仓储实例
func NewConversationTagRepository(db *gorm.DB) ConversationTagRepository {
	return &conversationTagRepository{db: db}
}

func (r *conversationTagRepository) Create(ctx context.Context, tag *entity.ConversationTag) error {
	return r.db.WithContext(ctx).Create(tag).Error
}

func (r *conversationTagRepository) DeleteByConversation(ctx context.Context, conversationID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Where("conversation_id = ?", conversationID).
		Delete(&entity.ConversationTag{}).Error
}

func (r *conversationTagRepository) ListByConversation(ctx context.Context, conversationID uuid.UUID) ([]entity.ConversationTag, error) {
	var tags []entity.ConversationTag
	if err := r.db.WithContext(ctx).
		Where("conversation_id = ?", conversationID).
		Find(&tags).Error; err != nil {
		return nil, err
	}
	return tags, nil
}

func (r *conversationTagRepository) SetTags(ctx context.Context, conversationID uuid.UUID, tags []string) error {
	// 删除旧标签
	if err := r.DeleteByConversation(ctx, conversationID); err != nil {
		return err
	}

	// 创建新标签
	for _, tagName := range tags {
		tag := &entity.ConversationTag{
			ConversationID: conversationID,
			TagName:        tagName,
		}
		if err := r.Create(ctx, tag); err != nil {
			return err
		}
	}

	return nil
}
