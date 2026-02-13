package queue

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/hibiken/asynq"
	"github.com/reverseai/server/internal/pkg/logger"
)

// 队列名称
const (
	QueueDomainVerify       = "domain_verify"
	QueueMetricsAggregation = "metrics_aggregation"
)

// 任务类型常量
const (
	TaskTypeDomainVerify       = "app:domain:verify"
	TaskTypeMetricsAggregation = "metrics:aggregate"
)

// DomainVerifyPayload 域名验证载荷
type DomainVerifyPayload struct {
	DomainID string `json:"domain_id"`
	OwnerID  string `json:"owner_id"`
}

// MetricsAggregationPayload 指标聚合载荷
type MetricsAggregationPayload struct {
	OwnerID     string  `json:"owner_id"`
	WorkspaceID *string `json:"workspace_id,omitempty"`
}

// EnqueueResult 统一任务入队结果
type EnqueueResult struct {
	TaskID  string `json:"task_id,omitempty"`
	Queue   string `json:"queue"`
	Deduped bool   `json:"deduped"`
}

const (
	defaultTaskRetention       = 24 * time.Hour
	domainVerifyTimeout        = 3 * time.Minute
	metricsAggregationTimeout  = 3 * time.Minute
	dedupShortTTL              = 5 * time.Minute
	dedupMediumTTL             = 15 * time.Minute
	maxRetryDomainVerify       = 5
	maxRetryMetricsAggregation = 2
)

// Queue 任务队列管理器
type Queue struct {
	client    *asynq.Client
	inspector *asynq.Inspector
	log       logger.Logger
}

// QueueConfig 队列配置
type QueueConfig struct {
	RedisAddr     string
	RedisPassword string
	RedisDB       int
	Concurrency   int
}

// NewQueue 创建任务队列
func NewQueue(cfg *QueueConfig, log logger.Logger) (*Queue, error) {
	redisOpt := asynq.RedisClientOpt{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	}

	client := asynq.NewClient(redisOpt)
	inspector := asynq.NewInspector(redisOpt)

	return &Queue{
		client:    client,
		inspector: inspector,
		log:       log,
	}, nil
}

// Close 关闭队列
func (q *Queue) Close() error {
	return q.client.Close()
}

// CancelTask 取消任务
func (q *Queue) CancelTask(taskID string) error {
	return q.inspector.CancelProcessing(taskID)
}

// GetTaskInfo 获取任务信息
func (q *Queue) GetTaskInfo(queue, taskID string) (*asynq.TaskInfo, error) {
	return q.inspector.GetTaskInfo(queue, taskID)
}

// GetQueueInfo 获取队列信息
func (q *Queue) GetQueueInfo(queueName string) (*asynq.QueueInfo, error) {
	return q.inspector.GetQueueInfo(queueName)
}

// EnqueueDomainVerify 将域名验证任务加入队列（支持延时执行）
func (q *Queue) EnqueueDomainVerify(ctx context.Context, payload *DomainVerifyPayload, processAt *time.Time) (*EnqueueResult, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}
	opts := []asynq.Option{
		asynq.MaxRetry(maxRetryDomainVerify),
		asynq.Timeout(domainVerifyTimeout),
		asynq.Retention(defaultTaskRetention),
		asynq.Unique(dedupMediumTTL),
		asynq.Queue(QueueDomainVerify),
	}
	if processAt != nil {
		opts = append(opts, asynq.ProcessAt(*processAt))
	}
	task := asynq.NewTask(TaskTypeDomainVerify, data, opts...)
	info, err := q.client.EnqueueContext(ctx, task)
	if err != nil {
		if isDuplicateTask(err) {
			return &EnqueueResult{Queue: QueueDomainVerify, Deduped: true}, nil
		}
		return nil, fmt.Errorf("failed to enqueue domain verify task: %w", err)
	}
	q.log.Info("Enqueued domain verify task",
		"taskId", info.ID,
		"domainId", payload.DomainID)
	return &EnqueueResult{TaskID: info.ID, Queue: QueueDomainVerify}, nil
}

// EnqueueMetricsAggregation 将指标聚合任务加入队列
func (q *Queue) EnqueueMetricsAggregation(ctx context.Context, payload *MetricsAggregationPayload, processAt *time.Time) (*EnqueueResult, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}
	opts := []asynq.Option{
		asynq.MaxRetry(maxRetryMetricsAggregation),
		asynq.Timeout(metricsAggregationTimeout),
		asynq.Retention(defaultTaskRetention),
		asynq.Unique(dedupShortTTL),
		asynq.Queue(QueueMetricsAggregation),
	}
	if processAt != nil {
		opts = append(opts, asynq.ProcessAt(*processAt))
	}
	task := asynq.NewTask(TaskTypeMetricsAggregation, data, opts...)
	info, err := q.client.EnqueueContext(ctx, task)
	if err != nil {
		if isDuplicateTask(err) {
			return &EnqueueResult{Queue: QueueMetricsAggregation, Deduped: true}, nil
		}
		return nil, fmt.Errorf("failed to enqueue metrics aggregation task: %w", err)
	}
	q.log.Info("Enqueued metrics aggregation task",
		"taskId", info.ID,
		"workspaceId", payload.WorkspaceID)
	return &EnqueueResult{TaskID: info.ID, Queue: QueueMetricsAggregation}, nil
}

// ListDeadTasks 获取死信队列任务
func (q *Queue) ListDeadTasks(queueName string, page, pageSize int) ([]*asynq.TaskInfo, error) {
	return q.inspector.ListArchivedTasks(queueName, asynq.Page(page), asynq.PageSize(pageSize))
}

// RetryDeadTask 重新入队死信任务
func (q *Queue) RetryDeadTask(queueName, taskID string) error {
	return q.inspector.RunTask(queueName, taskID)
}

// DeleteDeadTask 删除死信任务
func (q *Queue) DeleteDeadTask(queueName, taskID string) error {
	return q.inspector.DeleteTask(queueName, taskID)
}

func isDuplicateTask(err error) bool {
	return errors.Is(err, asynq.ErrDuplicateTask)
}
