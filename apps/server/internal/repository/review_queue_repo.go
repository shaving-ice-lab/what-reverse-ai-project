package repository

import (
	"context"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ReviewQueueListParams 审核队列列表查询参数
type ReviewQueueListParams struct {
	ItemType    *entity.ReviewItemType
	Status      *entity.ReviewStatus
	Priority    *entity.ReviewPriority
	SubmitterID *uuid.UUID
	ReviewerID  *uuid.UUID
	Page        int
	PageSize    int
}

// ReviewQueueRepository 审核队列仓储接口
type ReviewQueueRepository interface {
	// 队列操作
	Create(ctx context.Context, queue *entity.ReviewQueue) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.ReviewQueue, error)
	GetByItemID(ctx context.Context, itemType entity.ReviewItemType, itemID uuid.UUID) (*entity.ReviewQueue, error)
	List(ctx context.Context, params ReviewQueueListParams) ([]entity.ReviewQueue, int64, error)
	Update(ctx context.Context, queue *entity.ReviewQueue) error
	Delete(ctx context.Context, id uuid.UUID) error

	// 分配审核员
	Assign(ctx context.Context, queueID uuid.UUID, reviewerID uuid.UUID) error
	Unassign(ctx context.Context, queueID uuid.UUID) error

	// 审核操作
	Approve(ctx context.Context, queueID uuid.UUID, reviewerID uuid.UUID, note string) error
	Reject(ctx context.Context, queueID uuid.UUID, reviewerID uuid.UUID, note string) error
	RequestRevision(ctx context.Context, queueID uuid.UUID, reviewerID uuid.UUID, note string) error

	// 审核记录
	CreateRecord(ctx context.Context, record *entity.ReviewRecord) error
	ListRecords(ctx context.Context, queueID uuid.UUID) ([]entity.ReviewRecord, error)

	// 审核评论
	CreateComment(ctx context.Context, comment *entity.ReviewComment) error
	ListComments(ctx context.Context, queueID uuid.UUID) ([]entity.ReviewComment, error)
	ResolveComment(ctx context.Context, commentID uuid.UUID, resolvedBy uuid.UUID) error

	// 审核员
	GetReviewer(ctx context.Context, userID uuid.UUID) (*entity.Reviewer, error)
	CreateReviewer(ctx context.Context, reviewer *entity.Reviewer) error
	UpdateReviewer(ctx context.Context, reviewer *entity.Reviewer) error
	ListReviewers(ctx context.Context, activeOnly bool) ([]entity.Reviewer, error)

	// 检查项模板
	GetChecklist(ctx context.Context, itemType entity.ReviewItemType) (*entity.ReviewChecklist, error)
	ListChecklists(ctx context.Context) ([]entity.ReviewChecklist, error)
	CreateChecklist(ctx context.Context, checklist *entity.ReviewChecklist) error

	// 统计
	GetStats(ctx context.Context) ([]entity.ReviewStats, error)
	GetPendingCount(ctx context.Context) (int64, error)
}

type reviewQueueRepository struct {
	db *gorm.DB
}

// NewReviewQueueRepository 创建审核队列仓储实例
func NewReviewQueueRepository(db *gorm.DB) ReviewQueueRepository {
	return &reviewQueueRepository{db: db}
}

// Create 创建审核队列
func (r *reviewQueueRepository) Create(ctx context.Context, queue *entity.ReviewQueue) error {
	return r.db.WithContext(ctx).Create(queue).Error
}

// GetByID 根据 ID 获取审核队列
func (r *reviewQueueRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.ReviewQueue, error) {
	var queue entity.ReviewQueue
	if err := r.db.WithContext(ctx).
		Preload("Submitter").
		Preload("Reviewer").
		Preload("Reviewer.User").
		First(&queue, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &queue, nil
}

// GetByItemID 根据项目 ID 获取审核队列
func (r *reviewQueueRepository) GetByItemID(ctx context.Context, itemType entity.ReviewItemType, itemID uuid.UUID) (*entity.ReviewQueue, error) {
	var queue entity.ReviewQueue
	if err := r.db.WithContext(ctx).
		Where("item_type = ? AND item_id = ?", itemType, itemID).
		Order("created_at DESC").
		First(&queue).Error; err != nil {
		return nil, err
	}
	return &queue, nil
}

// List 列表查询
func (r *reviewQueueRepository) List(ctx context.Context, params ReviewQueueListParams) ([]entity.ReviewQueue, int64, error) {
	var queues []entity.ReviewQueue
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.ReviewQueue{})

	if params.ItemType != nil {
		query = query.Where("item_type = ?", *params.ItemType)
	}
	if params.Status != nil {
		query = query.Where("status = ?", *params.Status)
	}
	if params.Priority != nil {
		query = query.Where("priority = ?", *params.Priority)
	}
	if params.SubmitterID != nil {
		query = query.Where("submitter_id = ?", *params.SubmitterID)
	}
	if params.ReviewerID != nil {
		query = query.Where("reviewer_id = ?", *params.ReviewerID)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if params.Page > 0 && params.PageSize > 0 {
		offset := (params.Page - 1) * params.PageSize
		query = query.Offset(offset).Limit(params.PageSize)
	}

	if err := query.
		Order("priority DESC, created_at ASC").
		Preload("Submitter").
		Preload("Reviewer").
		Preload("Reviewer.User").
		Find(&queues).Error; err != nil {
		return nil, 0, err
	}

	return queues, total, nil
}

// Update 更新审核队列
func (r *reviewQueueRepository) Update(ctx context.Context, queue *entity.ReviewQueue) error {
	return r.db.WithContext(ctx).Save(queue).Error
}

// Delete 删除审核队列
func (r *reviewQueueRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.ReviewQueue{}, "id = ?", id).Error
}

// Assign 分配审核员
func (r *reviewQueueRepository) Assign(ctx context.Context, queueID uuid.UUID, reviewerID uuid.UUID) error {
	now := time.Now()
	return r.db.WithContext(ctx).
		Model(&entity.ReviewQueue{}).
		Where("id = ?", queueID).
		Updates(map[string]interface{}{
			"reviewer_id": reviewerID,
			"assigned_at": now,
			"status":      entity.ReviewStatusInReview,
		}).Error
}

// Unassign 取消分配审核员
func (r *reviewQueueRepository) Unassign(ctx context.Context, queueID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&entity.ReviewQueue{}).
		Where("id = ?", queueID).
		Updates(map[string]interface{}{
			"reviewer_id": nil,
			"assigned_at": nil,
			"status":      entity.ReviewStatusPending,
		}).Error
}

// Approve 通过审核
func (r *reviewQueueRepository) Approve(ctx context.Context, queueID uuid.UUID, reviewerID uuid.UUID, note string) error {
	now := time.Now()
	return r.db.WithContext(ctx).
		Model(&entity.ReviewQueue{}).
		Where("id = ?", queueID).
		Updates(map[string]interface{}{
			"status":      entity.ReviewStatusApproved,
			"reviewed_at": now,
			"result_note": note,
		}).Error
}

// Reject 拒绝审核
func (r *reviewQueueRepository) Reject(ctx context.Context, queueID uuid.UUID, reviewerID uuid.UUID, note string) error {
	now := time.Now()
	return r.db.WithContext(ctx).
		Model(&entity.ReviewQueue{}).
		Where("id = ?", queueID).
		Updates(map[string]interface{}{
			"status":      entity.ReviewStatusRejected,
			"reviewed_at": now,
			"result_note": note,
		}).Error
}

// RequestRevision 请求修改
func (r *reviewQueueRepository) RequestRevision(ctx context.Context, queueID uuid.UUID, reviewerID uuid.UUID, note string) error {
	return r.db.WithContext(ctx).
		Model(&entity.ReviewQueue{}).
		Where("id = ?", queueID).
		Updates(map[string]interface{}{
			"status":         entity.ReviewStatusRevision,
			"revision_note":  note,
			"revision_count": gorm.Expr("revision_count + 1"),
		}).Error
}

// CreateRecord 创建审核记录
func (r *reviewQueueRepository) CreateRecord(ctx context.Context, record *entity.ReviewRecord) error {
	return r.db.WithContext(ctx).Create(record).Error
}

// ListRecords 列出审核记录
func (r *reviewQueueRepository) ListRecords(ctx context.Context, queueID uuid.UUID) ([]entity.ReviewRecord, error) {
	var records []entity.ReviewRecord
	if err := r.db.WithContext(ctx).
		Where("queue_id = ?", queueID).
		Order("created_at ASC").
		Preload("Reviewer").
		Preload("Reviewer.User").
		Find(&records).Error; err != nil {
		return nil, err
	}
	return records, nil
}

// CreateComment 创建审核评论
func (r *reviewQueueRepository) CreateComment(ctx context.Context, comment *entity.ReviewComment) error {
	return r.db.WithContext(ctx).Create(comment).Error
}

// ListComments 列出审核评论
func (r *reviewQueueRepository) ListComments(ctx context.Context, queueID uuid.UUID) ([]entity.ReviewComment, error) {
	var comments []entity.ReviewComment
	if err := r.db.WithContext(ctx).
		Where("queue_id = ? AND parent_id IS NULL", queueID).
		Order("created_at ASC").
		Preload("User").
		Preload("Replies").
		Preload("Replies.User").
		Find(&comments).Error; err != nil {
		return nil, err
	}
	return comments, nil
}

// ResolveComment 解决评论
func (r *reviewQueueRepository) ResolveComment(ctx context.Context, commentID uuid.UUID, resolvedBy uuid.UUID) error {
	now := time.Now()
	return r.db.WithContext(ctx).
		Model(&entity.ReviewComment{}).
		Where("id = ?", commentID).
		Updates(map[string]interface{}{
			"is_resolved": true,
			"resolved_at": now,
			"resolved_by": resolvedBy,
		}).Error
}

// GetReviewer 获取审核员
func (r *reviewQueueRepository) GetReviewer(ctx context.Context, userID uuid.UUID) (*entity.Reviewer, error) {
	var reviewer entity.Reviewer
	if err := r.db.WithContext(ctx).
		Preload("User").
		First(&reviewer, "user_id = ?", userID).Error; err != nil {
		return nil, err
	}
	return &reviewer, nil
}

// CreateReviewer 创建审核员
func (r *reviewQueueRepository) CreateReviewer(ctx context.Context, reviewer *entity.Reviewer) error {
	return r.db.WithContext(ctx).Create(reviewer).Error
}

// UpdateReviewer 更新审核员
func (r *reviewQueueRepository) UpdateReviewer(ctx context.Context, reviewer *entity.Reviewer) error {
	return r.db.WithContext(ctx).Save(reviewer).Error
}

// ListReviewers 列出审核员
func (r *reviewQueueRepository) ListReviewers(ctx context.Context, activeOnly bool) ([]entity.Reviewer, error) {
	var reviewers []entity.Reviewer
	query := r.db.WithContext(ctx).Preload("User")
	if activeOnly {
		query = query.Where("is_active = ?", true)
	}
	if err := query.Find(&reviewers).Error; err != nil {
		return nil, err
	}
	return reviewers, nil
}

// GetChecklist 获取审核检查项模板
func (r *reviewQueueRepository) GetChecklist(ctx context.Context, itemType entity.ReviewItemType) (*entity.ReviewChecklist, error) {
	var checklist entity.ReviewChecklist
	if err := r.db.WithContext(ctx).
		Where("item_type = ? AND is_active = ? AND is_default = ?", itemType, true, true).
		First(&checklist).Error; err != nil {
		return nil, err
	}
	return &checklist, nil
}

// ListChecklists 列出审核检查项模板
func (r *reviewQueueRepository) ListChecklists(ctx context.Context) ([]entity.ReviewChecklist, error) {
	var checklists []entity.ReviewChecklist
	if err := r.db.WithContext(ctx).
		Where("is_active = ?", true).
		Find(&checklists).Error; err != nil {
		return nil, err
	}
	return checklists, nil
}

// CreateChecklist 创建审核检查项模板
func (r *reviewQueueRepository) CreateChecklist(ctx context.Context, checklist *entity.ReviewChecklist) error {
	return r.db.WithContext(ctx).Create(checklist).Error
}

// GetStats 获取审核统计
func (r *reviewQueueRepository) GetStats(ctx context.Context) ([]entity.ReviewStats, error) {
	var stats []entity.ReviewStats
	if err := r.db.WithContext(ctx).
		Model(&entity.ReviewQueue{}).
		Select("item_type, status, COUNT(*) as count").
		Group("item_type, status").
		Scan(&stats).Error; err != nil {
		return nil, err
	}
	return stats, nil
}

// GetPendingCount 获取待审核数量
func (r *reviewQueueRepository) GetPendingCount(ctx context.Context) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).
		Model(&entity.ReviewQueue{}).
		Where("status = ?", entity.ReviewStatusPending).
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}
