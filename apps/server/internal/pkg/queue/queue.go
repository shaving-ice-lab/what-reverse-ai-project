package queue

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/agentflow/server/internal/pkg/logger"
	"github.com/hibiken/asynq"
)

// 任务类型常量
const (
	TaskTypeWorkflowExecution = "workflow:execute"
	TaskTypeScheduledTrigger  = "workflow:scheduled"
	TaskTypeWebhookTrigger    = "workflow:webhook"
)

// WorkflowExecutionPayload 工作流执行任务载荷
type WorkflowExecutionPayload struct {
	ExecutionID string                 `json:"execution_id"`
	WorkflowID  string                 `json:"workflow_id"`
	UserID      string                 `json:"user_id"`
	Inputs      map[string]interface{} `json:"inputs"`
	TriggerType string                 `json:"trigger_type"`
}

// ScheduledTriggerPayload 定时触发载荷
type ScheduledTriggerPayload struct {
	WorkflowID  string    `json:"workflow_id"`
	UserID      string    `json:"user_id"`
	CronExpr    string    `json:"cron_expr"`
	NextRunTime time.Time `json:"next_run_time"`
}

// WebhookTriggerPayload Webhook 触发载荷
type WebhookTriggerPayload struct {
	WorkflowID string                 `json:"workflow_id"`
	NodeID     string                 `json:"node_id"`
	Method     string                 `json:"method"`
	Headers    map[string]string      `json:"headers"`
	Body       map[string]interface{} `json:"body"`
}

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

// EnqueueWorkflowExecution 将工作流执行任务加入队列
func (q *Queue) EnqueueWorkflowExecution(ctx context.Context, payload *WorkflowExecutionPayload) (*asynq.TaskInfo, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}

	task := asynq.NewTask(TaskTypeWorkflowExecution, data,
		asynq.MaxRetry(3),
		asynq.Timeout(10*time.Minute),
		asynq.Queue("workflow"),
	)

	info, err := q.client.EnqueueContext(ctx, task)
	if err != nil {
		return nil, fmt.Errorf("failed to enqueue task: %w", err)
	}

	q.log.Info("Enqueued workflow execution task",
		"taskId", info.ID,
		"executionId", payload.ExecutionID,
		"workflowId", payload.WorkflowID)

	return info, nil
}

// EnqueueScheduledTrigger 将定时触发任务加入队列
func (q *Queue) EnqueueScheduledTrigger(ctx context.Context, payload *ScheduledTriggerPayload, processAt time.Time) (*asynq.TaskInfo, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}

	task := asynq.NewTask(TaskTypeScheduledTrigger, data,
		asynq.ProcessAt(processAt),
		asynq.MaxRetry(1),
		asynq.Queue("scheduled"),
	)

	info, err := q.client.EnqueueContext(ctx, task)
	if err != nil {
		return nil, fmt.Errorf("failed to enqueue scheduled task: %w", err)
	}

	q.log.Info("Enqueued scheduled trigger task",
		"taskId", info.ID,
		"workflowId", payload.WorkflowID,
		"processAt", processAt)

	return info, nil
}

// EnqueueWebhookTrigger 将 Webhook 触发任务加入队列
func (q *Queue) EnqueueWebhookTrigger(ctx context.Context, payload *WebhookTriggerPayload) (*asynq.TaskInfo, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}

	task := asynq.NewTask(TaskTypeWebhookTrigger, data,
		asynq.MaxRetry(3),
		asynq.Timeout(5*time.Minute),
		asynq.Queue("webhook"),
	)

	info, err := q.client.EnqueueContext(ctx, task)
	if err != nil {
		return nil, fmt.Errorf("failed to enqueue webhook task: %w", err)
	}

	q.log.Info("Enqueued webhook trigger task",
		"taskId", info.ID,
		"workflowId", payload.WorkflowID)

	return info, nil
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
