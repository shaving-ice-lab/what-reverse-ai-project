package repository

import (
	"context"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AgentReportRepository Agent 举报仓储接口
type AgentReportRepository interface {
	Create(ctx context.Context, report *entity.AgentReport) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.AgentReport, error)
	GetByAgentAndUser(ctx context.Context, agentID, userID uuid.UUID) (*entity.AgentReport, error)
	ListByAgent(ctx context.Context, agentID uuid.UUID, page, pageSize int) ([]entity.AgentReport, int64, error)
	ListByStatus(ctx context.Context, status string, page, pageSize int) ([]entity.AgentReport, int64, error)
	ListPending(ctx context.Context, page, pageSize int) ([]entity.AgentReport, int64, error)
	Update(ctx context.Context, report *entity.AgentReport) error
	UpdateStatus(ctx context.Context, id uuid.UUID, status string, resolution *string, reviewedBy uuid.UUID) error
	CountByAgent(ctx context.Context, agentID uuid.UUID) (int64, error)
}

type agentReportRepository struct {
	db *gorm.DB
}

// NewAgentReportRepository 创建 Agent 举报仓储实例
func NewAgentReportRepository(db *gorm.DB) AgentReportRepository {
	return &agentReportRepository{db: db}
}

func (r *agentReportRepository) Create(ctx context.Context, report *entity.AgentReport) error {
	return r.db.WithContext(ctx).Create(report).Error
}

func (r *agentReportRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.AgentReport, error) {
	var report entity.AgentReport
	if err := r.db.WithContext(ctx).Preload("Agent").Preload("User").First(&report, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &report, nil
}

func (r *agentReportRepository) GetByAgentAndUser(ctx context.Context, agentID, userID uuid.UUID) (*entity.AgentReport, error) {
	var report entity.AgentReport
	if err := r.db.WithContext(ctx).First(&report, "agent_id = ? AND user_id = ?", agentID, userID).Error; err != nil {
		return nil, err
	}
	return &report, nil
}

func (r *agentReportRepository) ListByAgent(ctx context.Context, agentID uuid.UUID, page, pageSize int) ([]entity.AgentReport, int64, error) {
	var reports []entity.AgentReport
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.AgentReport{}).Where("agent_id = ?", agentID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if page > 0 && pageSize > 0 {
		offset := (page - 1) * pageSize
		query = query.Offset(offset).Limit(pageSize)
	}

	if err := query.Order("created_at desc").Preload("User").Find(&reports).Error; err != nil {
		return nil, 0, err
	}

	return reports, total, nil
}

func (r *agentReportRepository) ListByStatus(ctx context.Context, status string, page, pageSize int) ([]entity.AgentReport, int64, error) {
	var reports []entity.AgentReport
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.AgentReport{}).Where("status = ?", status)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if page > 0 && pageSize > 0 {
		offset := (page - 1) * pageSize
		query = query.Offset(offset).Limit(pageSize)
	}

	if err := query.Order("created_at desc").Preload("Agent").Preload("User").Find(&reports).Error; err != nil {
		return nil, 0, err
	}

	return reports, total, nil
}

func (r *agentReportRepository) ListPending(ctx context.Context, page, pageSize int) ([]entity.AgentReport, int64, error) {
	return r.ListByStatus(ctx, "pending", page, pageSize)
}

func (r *agentReportRepository) Update(ctx context.Context, report *entity.AgentReport) error {
	return r.db.WithContext(ctx).Save(report).Error
}

func (r *agentReportRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string, resolution *string, reviewedBy uuid.UUID) error {
	now := time.Now()
	updates := map[string]interface{}{
		"status":      status,
		"reviewed_by": reviewedBy,
		"reviewed_at": now,
	}

	if resolution != nil {
		updates["resolution"] = *resolution
	}

	return r.db.WithContext(ctx).Model(&entity.AgentReport{}).
		Where("id = ?", id).
		Updates(updates).Error
}

func (r *agentReportRepository) CountByAgent(ctx context.Context, agentID uuid.UUID) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&entity.AgentReport{}).
		Where("agent_id = ?", agentID).
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}
