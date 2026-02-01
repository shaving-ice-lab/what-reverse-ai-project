package repository

import (
	"context"
	"errors"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CreativeTaskListParams 任务列表查询参数
type CreativeTaskListParams struct {
	UserID     uuid.UUID                  // 用户ID (必须)
	TemplateID *uuid.UUID                 // 模板ID筛选
	Status     *entity.CreativeTaskStatus // 状态筛选
	Page       int                        // 页码
	PageSize   int                        // 每页数量
	Sort       string                     // 排序方式: newest, oldest
}

// CreativeTaskRepository 创意任务仓储接口
type CreativeTaskRepository interface {
	// 基础 CRUD
	Create(ctx context.Context, task *entity.CreativeTask) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.CreativeTask, error)
	GetByIDAndUserID(ctx context.Context, id, userID uuid.UUID) (*entity.CreativeTask, error)
	List(ctx context.Context, params CreativeTaskListParams) ([]entity.CreativeTask, int64, error)
	Update(ctx context.Context, task *entity.CreativeTask) error
	Delete(ctx context.Context, id uuid.UUID) error

	// 状态管理
	UpdateStatus(ctx context.Context, id uuid.UUID, status entity.CreativeTaskStatus, errorMsg *string) error
	UpdateProgress(ctx context.Context, id uuid.UUID, progress, completedSections int) error
	UpdateCurrentSection(ctx context.Context, id uuid.UUID, sectionID string) error
	UpdateSectionState(ctx context.Context, id uuid.UUID, sectionID string, state entity.SectionState) error

	// 输出管理
	UpdateOutput(ctx context.Context, id uuid.UUID, markdown string, metadata entity.JSON) error
	UpdateSearchCache(ctx context.Context, id uuid.UUID, cache entity.JSON) error

	// Token 统计
	AddTokenUsage(ctx context.Context, id uuid.UUID, promptTokens, completionTokens int) error

	// 时间戳管理
	SetStartedAt(ctx context.Context, id uuid.UUID) error
	SetCompletedAt(ctx context.Context, id uuid.UUID) error

	// 统计查询
	CountByUserID(ctx context.Context, userID uuid.UUID) (int64, error)
	CountByStatus(ctx context.Context, userID uuid.UUID, status entity.CreativeTaskStatus) (int64, error)
	GetRecentTasks(ctx context.Context, userID uuid.UUID, limit int) ([]entity.CreativeTask, error)

	// 清理
	DeleteOldTasks(ctx context.Context, olderThan time.Time) (int64, error)
}

type creativeTaskRepository struct {
	db *gorm.DB
}

// NewCreativeTaskRepository 创建创意任务仓储实例
func NewCreativeTaskRepository(db *gorm.DB) CreativeTaskRepository {
	return &creativeTaskRepository{db: db}
}

// Create 创建任务
func (r *creativeTaskRepository) Create(ctx context.Context, task *entity.CreativeTask) error {
	return r.db.WithContext(ctx).Create(task).Error
}

// GetByID 通过 ID 获取任务
func (r *creativeTaskRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.CreativeTask, error) {
	var task entity.CreativeTask
	if err := r.db.WithContext(ctx).
		Preload("User").
		Preload("Template").
		First(&task, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &task, nil
}

// GetByIDAndUserID 通过 ID 和用户 ID 获取任务
func (r *creativeTaskRepository) GetByIDAndUserID(ctx context.Context, id, userID uuid.UUID) (*entity.CreativeTask, error) {
	var task entity.CreativeTask
	if err := r.db.WithContext(ctx).
		Preload("Template").
		Where("id = ? AND user_id = ?", id, userID).
		First(&task).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &task, nil
}

// List 获取任务列表
func (r *creativeTaskRepository) List(ctx context.Context, params CreativeTaskListParams) ([]entity.CreativeTask, int64, error) {
	var tasks []entity.CreativeTask
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.CreativeTask{}).
		Where("user_id = ?", params.UserID)

	// 模板筛选
	if params.TemplateID != nil {
		query = query.Where("template_id = ?", *params.TemplateID)
	}

	// 状态筛选
	if params.Status != nil {
		query = query.Where("status = ?", *params.Status)
	}

	// 统计总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 排序
	switch params.Sort {
	case "oldest":
		query = query.Order("created_at ASC")
	case "newest":
		fallthrough
	default:
		query = query.Order("created_at DESC")
	}

	// 分页
	if params.Page > 0 && params.PageSize > 0 {
		offset := (params.Page - 1) * params.PageSize
		query = query.Offset(offset).Limit(params.PageSize)
	}

	// 查询
	if err := query.Preload("Template").Find(&tasks).Error; err != nil {
		return nil, 0, err
	}

	return tasks, total, nil
}

// Update 更新任务
func (r *creativeTaskRepository) Update(ctx context.Context, task *entity.CreativeTask) error {
	return r.db.WithContext(ctx).Save(task).Error
}

// Delete 删除任务
func (r *creativeTaskRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.CreativeTask{}, "id = ?", id).Error
}

// UpdateStatus 更新任务状态
func (r *creativeTaskRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status entity.CreativeTaskStatus, errorMsg *string) error {
	updates := map[string]interface{}{
		"status": status,
	}
	if errorMsg != nil {
		updates["error_message"] = *errorMsg
	}
	return r.db.WithContext(ctx).
		Model(&entity.CreativeTask{}).
		Where("id = ?", id).
		Updates(updates).Error
}

// UpdateProgress 更新进度
func (r *creativeTaskRepository) UpdateProgress(ctx context.Context, id uuid.UUID, progress, completedSections int) error {
	return r.db.WithContext(ctx).
		Model(&entity.CreativeTask{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"progress":           progress,
			"completed_sections": completedSections,
		}).Error
}

// UpdateCurrentSection 更新当前章节
func (r *creativeTaskRepository) UpdateCurrentSection(ctx context.Context, id uuid.UUID, sectionID string) error {
	return r.db.WithContext(ctx).
		Model(&entity.CreativeTask{}).
		Where("id = ?", id).
		Update("current_section", sectionID).Error
}

// UpdateSectionState 更新章节状态
func (r *creativeTaskRepository) UpdateSectionState(ctx context.Context, id uuid.UUID, sectionID string, state entity.SectionState) error {
	// 先获取当前任务
	var task entity.CreativeTask
	if err := r.db.WithContext(ctx).First(&task, "id = ?", id).Error; err != nil {
		return err
	}

	// 更新章节状态
	task.UpdateSectionState(sectionID, state)

	// 保存
	return r.db.WithContext(ctx).
		Model(&entity.CreativeTask{}).
		Where("id = ?", id).
		Update("sections", task.Sections).Error
}

// UpdateOutput 更新输出
func (r *creativeTaskRepository) UpdateOutput(ctx context.Context, id uuid.UUID, markdown string, metadata entity.JSON) error {
	return r.db.WithContext(ctx).
		Model(&entity.CreativeTask{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"output_markdown": markdown,
			"output_metadata": metadata,
		}).Error
}

// UpdateSearchCache 更新搜索缓存
func (r *creativeTaskRepository) UpdateSearchCache(ctx context.Context, id uuid.UUID, cache entity.JSON) error {
	return r.db.WithContext(ctx).
		Model(&entity.CreativeTask{}).
		Where("id = ?", id).
		Update("search_cache", cache).Error
}

// AddTokenUsage 添加 Token 使用量
func (r *creativeTaskRepository) AddTokenUsage(ctx context.Context, id uuid.UUID, promptTokens, completionTokens int) error {
	// 先获取当前任务
	var task entity.CreativeTask
	if err := r.db.WithContext(ctx).First(&task, "id = ?", id).Error; err != nil {
		return err
	}

	// 添加 Token 使用量
	task.AddTokenUsage(promptTokens, completionTokens)

	// 保存
	return r.db.WithContext(ctx).
		Model(&entity.CreativeTask{}).
		Where("id = ?", id).
		Update("token_usage", task.TokenUsage).Error
}

// SetStartedAt 设置开始时间
func (r *creativeTaskRepository) SetStartedAt(ctx context.Context, id uuid.UUID) error {
	now := time.Now()
	return r.db.WithContext(ctx).
		Model(&entity.CreativeTask{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"started_at": now,
			"status":     entity.CreativeTaskStatusProcessing,
		}).Error
}

// SetCompletedAt 设置完成时间
func (r *creativeTaskRepository) SetCompletedAt(ctx context.Context, id uuid.UUID) error {
	now := time.Now()
	return r.db.WithContext(ctx).
		Model(&entity.CreativeTask{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"completed_at": now,
			"status":       entity.CreativeTaskStatusCompleted,
			"progress":     100,
		}).Error
}

// CountByUserID 统计用户任务数
func (r *creativeTaskRepository) CountByUserID(ctx context.Context, userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.CreativeTask{}).
		Where("user_id = ?", userID).
		Count(&count).Error
	return count, err
}

// CountByStatus 按状态统计
func (r *creativeTaskRepository) CountByStatus(ctx context.Context, userID uuid.UUID, status entity.CreativeTaskStatus) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.CreativeTask{}).
		Where("user_id = ? AND status = ?", userID, status).
		Count(&count).Error
	return count, err
}

// GetRecentTasks 获取最近任务
func (r *creativeTaskRepository) GetRecentTasks(ctx context.Context, userID uuid.UUID, limit int) ([]entity.CreativeTask, error) {
	var tasks []entity.CreativeTask
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Preload("Template").
		Find(&tasks).Error
	return tasks, err
}

// DeleteOldTasks 删除旧任务
func (r *creativeTaskRepository) DeleteOldTasks(ctx context.Context, olderThan time.Time) (int64, error) {
	result := r.db.WithContext(ctx).
		Where("created_at < ? AND status IN ?", olderThan, 
			[]entity.CreativeTaskStatus{
				entity.CreativeTaskStatusCompleted,
				entity.CreativeTaskStatusFailed,
				entity.CreativeTaskStatusCancelled,
			}).
		Delete(&entity.CreativeTask{})
	return result.RowsAffected, result.Error
}
