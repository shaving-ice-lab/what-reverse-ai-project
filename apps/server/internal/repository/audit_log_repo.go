package repository

import (
	"context"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AuditLogRepository 审计日志仓储接口
type AuditLogRepository interface {
	Create(ctx context.Context, log *entity.AuditLog) error
	ListByWorkspace(ctx context.Context, params AuditLogListParams) ([]entity.AuditLog, int64, error)
	DeleteOlderThan(ctx context.Context, before time.Time) (int64, error)
	ListAuditLogsByWorkspaceAndCreatedBetween(ctx context.Context, workspaceID uuid.UUID, start, end time.Time, offset, limit int) ([]entity.AuditLog, error)
	GetEarliestAuditLogCreatedAtByWorkspace(ctx context.Context, workspaceID uuid.UUID) (*time.Time, error)
	ListWorkspaceIDsWithAuditLogsBefore(ctx context.Context, before time.Time, limit int) ([]uuid.UUID, error)
	DeleteByWorkspaceAndCreatedBetween(ctx context.Context, workspaceID uuid.UUID, start, end time.Time) (int64, error)
}

// AuditLogListParams 审计日志查询参数
type AuditLogListParams struct {
	WorkspaceID uuid.UUID
	ActorUserID *uuid.UUID
	Action      string
	Actions     []string
	TargetType  string
	Page        int
	PageSize    int
}

type auditLogRepository struct {
	db *gorm.DB
}

// NewAuditLogRepository 创建审计日志仓储实例
func NewAuditLogRepository(db *gorm.DB) AuditLogRepository {
	return &auditLogRepository{db: db}
}

func (r *auditLogRepository) Create(ctx context.Context, log *entity.AuditLog) error {
	if log.ID == uuid.Nil {
		log.ID = uuid.New()
	}
	if log.CreatedAt.IsZero() {
		log.CreatedAt = time.Now()
	}
	return r.db.WithContext(ctx).Create(log).Error
}

func (r *auditLogRepository) ListByWorkspace(ctx context.Context, params AuditLogListParams) ([]entity.AuditLog, int64, error) {
	var logs []entity.AuditLog
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.AuditLog{})

	if params.WorkspaceID != uuid.Nil {
		query = query.Where("workspace_id = ?", params.WorkspaceID)
	}
	if params.ActorUserID != nil {
		query = query.Where("actor_user_id = ?", *params.ActorUserID)
	}
	if len(params.Actions) > 0 {
		query = query.Where("action IN ?", params.Actions)
	} else if params.Action != "" {
		query = query.Where("action = ?", params.Action)
	}
	if params.TargetType != "" {
		query = query.Where("target_type = ?", params.TargetType)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	page := params.Page
	pageSize := params.PageSize
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	if err := query.Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&logs).Error; err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}

func (r *auditLogRepository) DeleteOlderThan(ctx context.Context, before time.Time) (int64, error) {
	result := r.db.WithContext(ctx).
		Where("created_at < ?", before).
		Delete(&entity.AuditLog{})
	return result.RowsAffected, result.Error
}

func (r *auditLogRepository) ListAuditLogsByWorkspaceAndCreatedBetween(ctx context.Context, workspaceID uuid.UUID, start, end time.Time, offset, limit int) ([]entity.AuditLog, error) {
	if limit <= 0 {
		limit = 200
	}
	var logs []entity.AuditLog
	err := r.db.WithContext(ctx).
		Where("workspace_id = ? AND created_at >= ? AND created_at < ?", workspaceID, start, end).
		Order("created_at ASC").
		Offset(offset).
		Limit(limit).
		Find(&logs).Error
	return logs, err
}

func (r *auditLogRepository) GetEarliestAuditLogCreatedAtByWorkspace(ctx context.Context, workspaceID uuid.UUID) (*time.Time, error) {
	var result struct {
		CreatedAt *time.Time `gorm:"column:created_at"`
	}
	err := r.db.WithContext(ctx).
		Model(&entity.AuditLog{}).
		Select("MIN(created_at) AS created_at").
		Where("workspace_id = ?", workspaceID).
		Scan(&result).Error
	if err != nil {
		return nil, err
	}
	return result.CreatedAt, nil
}

func (r *auditLogRepository) ListWorkspaceIDsWithAuditLogsBefore(ctx context.Context, before time.Time, limit int) ([]uuid.UUID, error) {
	if limit <= 0 {
		limit = 200
	}
	var ids []uuid.UUID
	err := r.db.WithContext(ctx).
		Model(&entity.AuditLog{}).
		Select("DISTINCT workspace_id").
		Where("created_at < ?", before).
		Limit(limit).
		Scan(&ids).Error
	return ids, err
}

func (r *auditLogRepository) DeleteByWorkspaceAndCreatedBetween(ctx context.Context, workspaceID uuid.UUID, start, end time.Time) (int64, error) {
	result := r.db.WithContext(ctx).
		Where("workspace_id = ? AND created_at >= ? AND created_at < ?", workspaceID, start, end).
		Delete(&entity.AuditLog{})
	return result.RowsAffected, result.Error
}
