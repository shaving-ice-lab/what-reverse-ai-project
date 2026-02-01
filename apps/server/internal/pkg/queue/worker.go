package queue

import (
	"context"
	"encoding/json"
	"fmt"

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
	server        *asynq.Server
	mux           *asynq.ServeMux
	engine        *executor.Engine
	executionRepo repository.ExecutionRepository
	workflowRepo  repository.WorkflowRepository
	wsHub         *websocket.Hub
	log           logger.Logger
}

// WorkerConfig Worker 配置
type WorkerConfig struct {
	RedisAddr     string
	RedisPassword string
	RedisDB       int
	Concurrency   int
}

// NewWorker 创建 Worker
func NewWorker(
	cfg *WorkerConfig,
	executionRepo repository.ExecutionRepository,
	workflowRepo repository.WorkflowRepository,
	wsHub *websocket.Hub,
	log logger.Logger,
) (*Worker, error) {
	redisOpt := asynq.RedisClientOpt{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	}

	server := asynq.NewServer(
		redisOpt,
		asynq.Config{
			Concurrency: cfg.Concurrency,
			Queues: map[string]int{
				"workflow":  6, // 高优先级
				"webhook":   3, // 中优先级
				"scheduled": 1, // 低优先级
			},
			ErrorHandler: asynq.ErrorHandlerFunc(func(ctx context.Context, task *asynq.Task, err error) {
				log.Error("Task processing failed",
					"type", task.Type(),
					"error", err)
			}),
		},
	)

	// 创建执行引擎
	engine := executor.NewEngine(nil, log)

	worker := &Worker{
		server:        server,
		mux:           asynq.NewServeMux(),
		engine:        engine,
		executionRepo: executionRepo,
		workflowRepo:  workflowRepo,
		wsHub:         wsHub,
		log:           log,
	}

	// 注册事件处理器
	if wsHub != nil {
		engine.RegisterEventHandler(&wsEventHandler{hub: wsHub})
	}

	// 注册任务处理器
	worker.mux.HandleFunc(TaskTypeWorkflowExecution, worker.handleWorkflowExecution)
	worker.mux.HandleFunc(TaskTypeScheduledTrigger, worker.handleScheduledTrigger)
	worker.mux.HandleFunc(TaskTypeWebhookTrigger, worker.handleWebhookTrigger)

	return worker, nil
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
	)

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

	// 创建执行记录
	execution := &entity.Execution{
		WorkflowID:  workflowID,
		UserID:      userID,
		Status:      "pending",
		TriggerType: "scheduled",
		Inputs:      entity.JSON{},
	}

	if err := w.executionRepo.Create(ctx, execution); err != nil {
		return fmt.Errorf("failed to create execution: %w", err)
	}

	// 获取工作流并执行
	workflow, err := w.workflowRepo.GetByID(ctx, workflowID)
	if err != nil {
		return w.updateExecutionFailed(ctx, execution, err)
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
	)

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
	)

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
