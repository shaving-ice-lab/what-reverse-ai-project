package queue

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"math/rand"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/executor"
	"github.com/agentflow/server/internal/pkg/logger"
	"github.com/agentflow/server/internal/pkg/websocket"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
	"github.com/hibiken/asynq"
)

// Worker 任务处理器
type Worker struct {
	server             *asynq.Server
	mux                *asynq.ServeMux
	client             *asynq.Client
	engine             *executor.Engine
	executionRepo      repository.ExecutionRepository
	workflowRepo       repository.WorkflowRepository
	wsHub              *websocket.Hub
	log                logger.Logger
	modelUsageRecorder executor.ModelUsageRecorder
	auditRecorder      executor.AuditRecorder
	dbProvisioner      DBProvisioner
	domainVerifier     DomainVerifier
	metricsAggregator  MetricsAggregator
}

// WorkerConfig Worker 配置
type WorkerConfig struct {
	RedisAddr     string
	RedisPassword string
	RedisDB       int
	Concurrency   int
	Queues        map[string]int
	EngineConfig  *executor.EngineConfig
}

// DBProvisioner 数据库创建执行器
type DBProvisioner interface {
	Provision(ctx context.Context, workspaceID, ownerID uuid.UUID) error
}

// DomainVerifier 域名验证执行器
type DomainVerifier interface {
	VerifyByID(ctx context.Context, ownerID, domainID uuid.UUID) error
}

// MetricsAggregator 指标聚合执行器
type MetricsAggregator interface {
	AggregateWorkspaceUsage(ctx context.Context, ownerID, workspaceID uuid.UUID) error
}

// NewWorker 创建 Worker
func NewWorker(
	cfg *WorkerConfig,
	executionRepo repository.ExecutionRepository,
	workflowRepo repository.WorkflowRepository,
	wsHub *websocket.Hub,
	log logger.Logger,
	dbProvider executor.DBProvider,
	dbAuthorizer executor.DBAuthorizer,
	modelUsageRecorder executor.ModelUsageRecorder,
	auditRecorder executor.AuditRecorder,
	dbProvisioner DBProvisioner,
	domainVerifier DomainVerifier,
	metricsAggregator MetricsAggregator,
) (*Worker, error) {
	redisOpt := asynq.RedisClientOpt{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	}

	rand.Seed(time.Now().UnixNano())
	client := asynq.NewClient(redisOpt)
	concurrency := cfg.Concurrency
	if concurrency <= 0 {
		concurrency = 10
	}
	queueWeights := normalizeQueueWeights(cfg.Queues)

	server := asynq.NewServer(
		redisOpt,
		asynq.Config{
			Concurrency:    concurrency,
			Queues:         queueWeights,
			RetryDelayFunc: retryDelay,
			ErrorHandler: asynq.ErrorHandlerFunc(func(ctx context.Context, task *asynq.Task, err error) {
				log.Error("Task processing failed",
					"type", task.Type(),
					"error", err)
			}),
		},
	)

	// 创建执行引擎
	engine := executor.NewEngine(cfg.EngineConfig, log, dbProvider, dbAuthorizer)

	worker := &Worker{
		server:             server,
		mux:                asynq.NewServeMux(),
		client:             client,
		engine:             engine,
		executionRepo:      executionRepo,
		workflowRepo:       workflowRepo,
		wsHub:              wsHub,
		log:                log,
		modelUsageRecorder: modelUsageRecorder,
		auditRecorder:      auditRecorder,
		dbProvisioner:      dbProvisioner,
		domainVerifier:     domainVerifier,
		metricsAggregator:  metricsAggregator,
	}

	// 注册事件处理器
	if wsHub != nil {
		engine.RegisterEventHandler(&wsEventHandler{hub: wsHub})
	}

	// 注册任务处理器
	worker.mux.HandleFunc(TaskTypeWorkflowExecution, worker.handleWorkflowExecution)
	worker.mux.HandleFunc(TaskTypeScheduledTrigger, worker.handleScheduledTrigger)
	worker.mux.HandleFunc(TaskTypeWebhookTrigger, worker.handleWebhookTrigger)
	if worker.dbProvisioner != nil {
		worker.mux.HandleFunc(TaskTypeDBProvision, worker.handleDBProvision)
	}
	if worker.domainVerifier != nil {
		worker.mux.HandleFunc(TaskTypeDomainVerify, worker.handleDomainVerify)
	}
	if worker.metricsAggregator != nil {
		worker.mux.HandleFunc(TaskTypeMetricsAggregation, worker.handleMetricsAggregation)
	}

	return worker, nil
}

func normalizeQueueWeights(overrides map[string]int) map[string]int {
	defaults := map[string]int{
		QueueExecution:          6,
		QueueDBProvision:        3,
		QueueDomainVerify:       2,
		QueueMetricsAggregation: 1,
		QueueWebhook:            3,
		QueueScheduled:          1,
		QueueWorkflowLegacy:     6,
	}
	if len(overrides) == 0 {
		return defaults
	}

	weights := map[string]int{}
	for key, value := range defaults {
		weights[key] = value
	}
	for key, value := range overrides {
		if value > 0 {
			if key == QueueWorkflowLegacy {
				weights[QueueExecution] = value
				weights[QueueWorkflowLegacy] = value
				continue
			}
			weights[key] = value
		}
	}
	return weights
}

// Start 启动 Worker
func (w *Worker) Start() error {
	w.log.Info("Starting task worker...")
	return w.server.Start(w.mux)
}

// Shutdown 关闭 Worker
func (w *Worker) Shutdown() {
	w.log.Info("Shutting down task worker...")
	w.server.Shutdown()
	if w.client != nil {
		_ = w.client.Close()
	}
}

// handleWorkflowExecution 处理工作流执行任务
func (w *Worker) handleWorkflowExecution(ctx context.Context, task *asynq.Task) error {
	var payload WorkflowExecutionPayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	w.log.Info("Processing workflow execution",
		"executionId", payload.ExecutionID,
		"workflowId", payload.WorkflowID)

	// 获取执行记录
	executionID, err := uuid.Parse(payload.ExecutionID)
	if err != nil {
		return fmt.Errorf("invalid execution ID: %w", err)
	}

	execution, err := w.executionRepo.GetByID(ctx, executionID)
	if err != nil {
		return fmt.Errorf("failed to get execution: %w", err)
	}

	// 获取工作流
	workflowID, err := uuid.Parse(payload.WorkflowID)
	if err != nil {
		return fmt.Errorf("invalid workflow ID: %w", err)
	}

	workflow, err := w.workflowRepo.GetByID(ctx, workflowID)
	if err != nil {
		return fmt.Errorf("failed to get workflow: %w", err)
	}

	// 解析工作流定义
	defJSON, err := json.Marshal(workflow.Definition)
	if err != nil {
		return w.updateExecutionFailed(ctx, execution, fmt.Errorf("failed to marshal definition: %w", err))
	}

	def, err := executor.ParseWorkflowDefinition(defJSON)
	if err != nil {
		return w.updateExecutionFailed(ctx, execution, fmt.Errorf("failed to parse definition: %w", err))
	}

	// 创建执行上下文
	execCtx := executor.NewExecutionContext(
		payload.ExecutionID,
		payload.WorkflowID,
		payload.UserID,
		workflow.WorkspaceID.String(),
	)
	execCtx.ModelUsageRecorder = w.modelUsageRecorder
	execCtx.AuditRecorder = w.auditRecorder
	execCtx.TriggerType = payload.TriggerType
	execCtx.RecordAudit(ctx, executor.AuditEvent{
		Action:     "workflow_executed",
		TargetType: "workflow",
		TargetID:   payload.WorkflowID,
	})

	// TODO: 加载用户 API 密钥
	// execCtx.APIKeys = loadUserAPIKeys(payload.UserID)

	// 执行工作流
	result, err := w.engine.Execute(ctx, def, payload.Inputs, execCtx)

	// 更新执行记录
	return w.updateExecutionResult(ctx, execution, result, err)
}

// handleScheduledTrigger 处理定时触发任务
func (w *Worker) handleScheduledTrigger(ctx context.Context, task *asynq.Task) error {
	var payload ScheduledTriggerPayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	w.log.Info("Processing scheduled trigger",
		"workflowId", payload.WorkflowID)

	// 创建执行记录并执行
	workflowID, _ := uuid.Parse(payload.WorkflowID)
	userID, _ := uuid.Parse(payload.UserID)

	// 获取工作流并执行
	workflow, err := w.workflowRepo.GetByID(ctx, workflowID)
	if err != nil {
		return fmt.Errorf("failed to get workflow: %w", err)
	}

	// 创建执行记录
	execution := &entity.Execution{
		WorkflowID:  workflowID,
		UserID:      userID,
		WorkspaceID: workflow.WorkspaceID,
		Status:      "pending",
		TriggerType: "scheduled",
		Inputs:      entity.JSON{},
	}

	if err := w.executionRepo.Create(ctx, execution); err != nil {
		return fmt.Errorf("failed to create execution: %w", err)
	}

	defJSON, _ := json.Marshal(workflow.Definition)
	def, err := executor.ParseWorkflowDefinition(defJSON)
	if err != nil {
		return w.updateExecutionFailed(ctx, execution, err)
	}

	execCtx := executor.NewExecutionContext(
		execution.ID.String(),
		payload.WorkflowID,
		payload.UserID,
		workflow.WorkspaceID.String(),
	)
	execCtx.ModelUsageRecorder = w.modelUsageRecorder
	execCtx.AuditRecorder = w.auditRecorder
	execCtx.TriggerType = "scheduled"
	execCtx.RecordAudit(ctx, executor.AuditEvent{
		Action:     "workflow_executed",
		TargetType: "workflow",
		TargetID:   payload.WorkflowID,
	})

	result, err := w.engine.Execute(ctx, def, nil, execCtx)
	return w.updateExecutionResult(ctx, execution, result, err)
}

// handleWebhookTrigger 处理 Webhook 触发任务
func (w *Worker) handleWebhookTrigger(ctx context.Context, task *asynq.Task) error {
	var payload WebhookTriggerPayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	w.log.Info("Processing webhook trigger",
		"workflowId", payload.WorkflowID,
		"method", payload.Method)

	// 获取工作流
	workflowID, _ := uuid.Parse(payload.WorkflowID)
	workflow, err := w.workflowRepo.GetByID(ctx, workflowID)
	if err != nil {
		return fmt.Errorf("failed to get workflow: %w", err)
	}

	// 创建执行记录
	execution := &entity.Execution{
		WorkflowID:  workflowID,
		UserID:      workflow.UserID,
		WorkspaceID: workflow.WorkspaceID,
		Status:      "pending",
		TriggerType: "webhook",
		Inputs:      payload.Body,
	}

	if err := w.executionRepo.Create(ctx, execution); err != nil {
		return fmt.Errorf("failed to create execution: %w", err)
	}

	// 解析并执行
	defJSON, _ := json.Marshal(workflow.Definition)
	def, err := executor.ParseWorkflowDefinition(defJSON)
	if err != nil {
		return w.updateExecutionFailed(ctx, execution, err)
	}

	execCtx := executor.NewExecutionContext(
		execution.ID.String(),
		payload.WorkflowID,
		workflow.UserID.String(),
		workflow.WorkspaceID.String(),
	)
	execCtx.ModelUsageRecorder = w.modelUsageRecorder
	execCtx.AuditRecorder = w.auditRecorder
	execCtx.TriggerType = "webhook"
	execCtx.RecordAudit(ctx, executor.AuditEvent{
		Action:     "workflow_executed",
		TargetType: "workflow",
		TargetID:   payload.WorkflowID,
	})

	// 将 Webhook 数据作为输入
	inputs := map[string]interface{}{
		"webhook": map[string]interface{}{
			"method":  payload.Method,
			"headers": payload.Headers,
			"body":    payload.Body,
		},
	}

	result, err := w.engine.Execute(ctx, def, inputs, execCtx)
	return w.updateExecutionResult(ctx, execution, result, err)
}

// handleDBProvision 处理 Workspace DB 创建任务
func (w *Worker) handleDBProvision(ctx context.Context, task *asynq.Task) error {
	if w.dbProvisioner == nil {
		return fmt.Errorf("db provisioner not configured")
	}
	var payload DBProvisionPayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}
	workspaceID, err := uuid.Parse(payload.WorkspaceID)
	if err != nil {
		return fmt.Errorf("invalid workspace ID: %w", err)
	}
	ownerID, err := uuid.Parse(payload.OwnerID)
	if err != nil {
		return fmt.Errorf("invalid owner ID: %w", err)
	}
	if err := w.dbProvisioner.Provision(ctx, workspaceID, ownerID); err != nil {
		if errors.Is(err, ErrTaskNoop) {
			return nil
		}
		return err
	}
	return nil
}

// handleDomainVerify 处理域名验证任务
func (w *Worker) handleDomainVerify(ctx context.Context, task *asynq.Task) error {
	if w.domainVerifier == nil {
		return fmt.Errorf("domain verifier not configured")
	}
	var payload DomainVerifyPayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}
	domainID, err := uuid.Parse(payload.DomainID)
	if err != nil {
		return fmt.Errorf("invalid domain ID: %w", err)
	}
	ownerID, err := uuid.Parse(payload.OwnerID)
	if err != nil {
		return fmt.Errorf("invalid owner ID: %w", err)
	}
	if err := w.domainVerifier.VerifyByID(ctx, ownerID, domainID); err != nil {
		if errors.Is(err, ErrTaskNoop) {
			return nil
		}
		var retryErr *RetryLaterError
		if errors.As(err, &retryErr) && w.client != nil {
			processAt := retryErr.NextRun
			data, marshalErr := json.Marshal(payload)
			if marshalErr != nil {
				return marshalErr
			}
			retryTask := asynq.NewTask(TaskTypeDomainVerify, data,
				asynq.MaxRetry(maxRetryDomainVerify),
				asynq.Timeout(domainVerifyTimeout),
				asynq.Retention(defaultTaskRetention),
				asynq.Unique(dedupMediumTTL),
				asynq.ProcessAt(processAt),
				asynq.Queue(QueueDomainVerify),
			)
			if _, enqueueErr := w.client.EnqueueContext(ctx, retryTask); enqueueErr != nil {
				if isDuplicateTask(enqueueErr) {
					return nil
				}
				return enqueueErr
			}
			return nil
		}
		return err
	}
	return nil
}

// handleMetricsAggregation 处理指标聚合任务
func (w *Worker) handleMetricsAggregation(ctx context.Context, task *asynq.Task) error {
	if w.metricsAggregator == nil {
		return fmt.Errorf("metrics aggregator not configured")
	}
	var payload MetricsAggregationPayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}
	ownerID, err := uuid.Parse(payload.OwnerID)
	if err != nil {
		return fmt.Errorf("invalid owner ID: %w", err)
	}
	if payload.WorkspaceID != nil {
		workspaceID, err := uuid.Parse(*payload.WorkspaceID)
		if err != nil {
			return fmt.Errorf("invalid workspace ID: %w", err)
		}
		if err := w.metricsAggregator.AggregateWorkspaceUsage(ctx, ownerID, workspaceID); err != nil {
			return err
		}
	}
	return nil
}

func (w *Worker) updateExecutionFailed(ctx context.Context, execution *entity.Execution, err error) error {
	execution.Status = "failed"
	errMsg := err.Error()
	execution.ErrorMessage = &errMsg
	return w.executionRepo.Update(ctx, execution)
}

func (w *Worker) updateExecutionResult(ctx context.Context, execution *entity.Execution, result *executor.ExecutionResult, err error) error {
	if err != nil {
		execution.Status = "failed"
		errMsg := err.Error()
		execution.ErrorMessage = &errMsg
	} else {
		execution.Status = "completed"
		if result != nil && result.Outputs != nil {
			execution.Outputs = result.Outputs
		}
	}

	if result != nil {
		execution.DurationMs = &result.DurationMs
		if result.TokenUsage.TotalTokens > 0 {
			execution.TokenUsage = entity.JSON{
				"prompt_tokens":     result.TokenUsage.PromptTokens,
				"completion_tokens": result.TokenUsage.CompletionTokens,
				"total_tokens":      result.TokenUsage.TotalTokens,
			}
		}
	}

	return w.executionRepo.Update(ctx, execution)
}

// wsEventHandler WebSocket 事件处理器
type wsEventHandler struct {
	hub *websocket.Hub
}

func (h *wsEventHandler) HandleEvent(event *executor.ExecutionEvent) {
	if h.hub == nil {
		return
	}

	var msgType websocket.MessageType
	switch event.Type {
	case executor.EventExecutionStarted:
		msgType = websocket.MessageTypeExecutionStarted
	case executor.EventExecutionCompleted:
		msgType = websocket.MessageTypeExecutionCompleted
	case executor.EventExecutionFailed:
		msgType = websocket.MessageTypeExecutionFailed
	case executor.EventExecutionCancelled:
		msgType = websocket.MessageTypeExecutionCancelled
	case executor.EventNodeStarted:
		msgType = websocket.MessageTypeExecutionNodeStarted
	case executor.EventNodeCompleted:
		msgType = websocket.MessageTypeExecutionNodeCompleted
	case executor.EventNodeFailed:
		msgType = websocket.MessageTypeExecutionNodeFailed
	default:
		return
	}

	payload := &websocket.ExecutionPayload{
		ExecutionID: event.ExecutionID,
		WorkflowID:  event.WorkflowID,
		Status:      event.Status,
		NodeID:      event.NodeID,
		NodeType:    string(event.NodeType),
		Inputs:      event.Inputs,
		Outputs:     event.Outputs,
		Error:       event.Error,
		DurationMs:  event.DurationMs,
		Progress:    event.Progress,
		TotalNodes:  event.TotalNodes,
	}

	h.hub.BroadcastExecutionEvent(event.ExecutionID, msgType, payload)
}

const (
	retryBaseDelay   = 500 * time.Millisecond
	retryMaxDelay    = 10 * time.Minute
	retryJitterRatio = 0.2
)

func retryDelay(attempt int, _ error, _ *asynq.Task) time.Duration {
	if attempt <= 0 {
		return retryBaseDelay
	}
	delay := retryBaseDelay * time.Duration(math.Pow(2, float64(attempt-1)))
	if delay > retryMaxDelay {
		delay = retryMaxDelay
	}
	return addJitter(delay, retryJitterRatio)
}

func addJitter(delay time.Duration, ratio float64) time.Duration {
	if ratio <= 0 {
		return delay
	}
	jitter := 1 + (rand.Float64()*2-1)*ratio
	return time.Duration(float64(delay) * jitter)
}
