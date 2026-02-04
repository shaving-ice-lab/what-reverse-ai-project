package repository

import (
	"context"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// RuntimeEventRepository 运行时事件仓储接口
type RuntimeEventRepository interface {
	// Create 创建事件
	Create(ctx context.Context, event *entity.RuntimeEvent) error
	// CreateBatch 批量创建事件
	CreateBatch(ctx context.Context, events []*entity.RuntimeEvent) error
	// GetByID 根据 ID 获取事件
	GetByID(ctx context.Context, id uuid.UUID) (*entity.RuntimeEvent, error)
	// List 查询事件列表
	List(ctx context.Context, filter entity.RuntimeEventFilter) ([]entity.RuntimeEvent, int64, error)
	// ListByTraceID 根据 trace_id 查询事件（用于链路追踪）
	ListByTraceID(ctx context.Context, traceID string) ([]entity.RuntimeEvent, error)
	// ListByExecution 根据执行 ID 查询事件（用于执行回放）
	ListByExecution(ctx context.Context, executionID uuid.UUID) ([]entity.RuntimeEvent, error)
	// GetStats 获取事件统计
	GetStats(ctx context.Context, filter entity.RuntimeEventFilter) (*entity.RuntimeEventStats, error)
	// GetLatestSequenceNum 获取最新序列号
	GetLatestSequenceNum(ctx context.Context) (int64, error)
	// StreamAfterSequenceNum 流式获取指定序列号之后的事件
	StreamAfterSequenceNum(ctx context.Context, afterSequenceNum int64, limit int) ([]entity.RuntimeEvent, error)
	// DeleteOlderThan 删除指定时间之前的事件（用于数据保留策略）
	DeleteOlderThan(ctx context.Context, before time.Time) (int64, error)
}

type runtimeEventRepository struct {
	db *gorm.DB
}

// NewRuntimeEventRepository 创建事件仓储实例
func NewRuntimeEventRepository(db *gorm.DB) RuntimeEventRepository {
	return &runtimeEventRepository{db: db}
}

func (r *runtimeEventRepository) Create(ctx context.Context, event *entity.RuntimeEvent) error {
	// 获取下一个序列号
	seqNum, err := r.GetLatestSequenceNum(ctx)
	if err != nil {
		return err
	}
	event.SequenceNum = seqNum + 1

	return r.db.WithContext(ctx).Create(event).Error
}

func (r *runtimeEventRepository) CreateBatch(ctx context.Context, events []*entity.RuntimeEvent) error {
	if len(events) == 0 {
		return nil
	}

	// 获取起始序列号
	seqNum, err := r.GetLatestSequenceNum(ctx)
	if err != nil {
		return err
	}

	// 分配序列号
	for i, event := range events {
		event.SequenceNum = seqNum + int64(i) + 1
	}

	return r.db.WithContext(ctx).CreateInBatches(events, 100).Error
}

func (r *runtimeEventRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.RuntimeEvent, error) {
	var event entity.RuntimeEvent
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&event).Error; err != nil {
		return nil, err
	}
	return &event, nil
}

func (r *runtimeEventRepository) List(ctx context.Context, filter entity.RuntimeEventFilter) ([]entity.RuntimeEvent, int64, error) {
	query := r.db.WithContext(ctx).Model(&entity.RuntimeEvent{})

	// 应用过滤条件
	query = applyEventFilter(query, filter)

	// 获取总数
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 排序
	orderBy := filter.OrderBy
	if orderBy == "" {
		orderBy = "created_at"
	}
	if filter.OrderDesc {
		query = query.Order(orderBy + " DESC")
	} else {
		query = query.Order(orderBy + " ASC")
	}

	// 分页
	page := filter.Page
	if page < 1 {
		page = 1
	}
	pageSize := filter.PageSize
	if pageSize < 1 {
		pageSize = 50
	}
	if pageSize > 1000 {
		pageSize = 1000
	}
	offset := (page - 1) * pageSize

	var events []entity.RuntimeEvent
	if err := query.Offset(offset).Limit(pageSize).Find(&events).Error; err != nil {
		return nil, 0, err
	}

	return events, total, nil
}

func (r *runtimeEventRepository) ListByTraceID(ctx context.Context, traceID string) ([]entity.RuntimeEvent, error) {
	var events []entity.RuntimeEvent
	err := r.db.WithContext(ctx).
		Where("trace_id = ?", traceID).
		Order("sequence_num ASC").
		Find(&events).Error
	return events, err
}

func (r *runtimeEventRepository) ListByExecution(ctx context.Context, executionID uuid.UUID) ([]entity.RuntimeEvent, error) {
	var events []entity.RuntimeEvent
	err := r.db.WithContext(ctx).
		Where("execution_id = ?", executionID).
		Order("sequence_num ASC").
		Find(&events).Error
	return events, err
}

func (r *runtimeEventRepository) GetStats(ctx context.Context, filter entity.RuntimeEventFilter) (*entity.RuntimeEventStats, error) {
	query := r.db.WithContext(ctx).Model(&entity.RuntimeEvent{})
	query = applyEventFilter(query, filter)

	stats := &entity.RuntimeEventStats{
		CountByType: make(map[entity.RuntimeEventType]int64),
	}

	// 总数
	if err := query.Count(&stats.TotalCount).Error; err != nil {
		return nil, err
	}

	// 错误数
	if err := query.Where("severity = ?", entity.SeverityError).Count(&stats.ErrorCount).Error; err != nil {
		return nil, err
	}

	// 警告数
	query2 := r.db.WithContext(ctx).Model(&entity.RuntimeEvent{})
	query2 = applyEventFilter(query2, filter)
	if err := query2.Where("severity = ?", entity.SeverityWarning).Count(&stats.WarningCount).Error; err != nil {
		return nil, err
	}

	// 按类型统计
	type TypeCount struct {
		Type  string
		Count int64
	}
	var typeCounts []TypeCount
	query3 := r.db.WithContext(ctx).Model(&entity.RuntimeEvent{})
	query3 = applyEventFilter(query3, filter)
	if err := query3.Select("type, count(*) as count").Group("type").Scan(&typeCounts).Error; err != nil {
		return nil, err
	}
	for _, tc := range typeCounts {
		stats.CountByType[entity.RuntimeEventType(tc.Type)] = tc.Count
	}

	return stats, nil
}

func (r *runtimeEventRepository) GetLatestSequenceNum(ctx context.Context) (int64, error) {
	var maxSeq struct {
		Max *int64
	}
	err := r.db.WithContext(ctx).
		Model(&entity.RuntimeEvent{}).
		Select("MAX(sequence_num) as max").
		Scan(&maxSeq).Error
	if err != nil {
		return 0, err
	}
	if maxSeq.Max == nil {
		return 0, nil
	}
	return *maxSeq.Max, nil
}

func (r *runtimeEventRepository) StreamAfterSequenceNum(ctx context.Context, afterSequenceNum int64, limit int) ([]entity.RuntimeEvent, error) {
	if limit < 1 {
		limit = 100
	}
	if limit > 1000 {
		limit = 1000
	}

	var events []entity.RuntimeEvent
	err := r.db.WithContext(ctx).
		Where("sequence_num > ?", afterSequenceNum).
		Order("sequence_num ASC").
		Limit(limit).
		Find(&events).Error
	return events, err
}

func (r *runtimeEventRepository) DeleteOlderThan(ctx context.Context, before time.Time) (int64, error) {
	result := r.db.WithContext(ctx).
		Where("created_at < ?", before).
		Delete(&entity.RuntimeEvent{})
	return result.RowsAffected, result.Error
}

// applyEventFilter 应用事件过滤条件
func applyEventFilter(query *gorm.DB, filter entity.RuntimeEventFilter) *gorm.DB {
	if filter.StartTime != nil {
		query = query.Where("created_at >= ?", filter.StartTime)
	}
	if filter.EndTime != nil {
		query = query.Where("created_at <= ?", filter.EndTime)
	}
	if len(filter.Types) > 0 {
		query = query.Where("type IN ?", filter.Types)
	}
	if len(filter.Severities) > 0 {
		query = query.Where("severity IN ?", filter.Severities)
	}
	if filter.WorkspaceID != nil {
		query = query.Where("workspace_id = ?", filter.WorkspaceID)
	}
	if filter.AppID != nil {
		query = query.Where("app_id = ?", filter.AppID)
	}
	if filter.ExecutionID != nil {
		query = query.Where("execution_id = ?", filter.ExecutionID)
	}
	if filter.UserID != nil {
		query = query.Where("user_id = ?", filter.UserID)
	}
	if filter.SessionID != nil {
		query = query.Where("session_id = ?", filter.SessionID)
	}
	if filter.TraceID != "" {
		query = query.Where("trace_id = ?", filter.TraceID)
	}
	if filter.AfterSequenceNum > 0 {
		query = query.Where("sequence_num > ?", filter.AfterSequenceNum)
	}
	return query
}
