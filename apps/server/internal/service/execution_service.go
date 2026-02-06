package service

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"sync"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/executor"
	"github.com/agentflow/server/internal/pkg/logger"
	"github.com/agentflow/server/internal/pkg/observability"
	"github.com/agentflow/server/internal/pkg/queue"
	"github.com/agentflow/server/internal/pkg/redis"
	"github.com/agentflow/server/internal/pkg/websocket"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrExecutionNotFound   = errors.New("execution not found")
	ErrCannotCancel        = errors.New("cannot cancel execution in current state")
	ErrCannotRetry         = errors.New("cannot retry execution in current state")
	ErrExecutionOverloaded = errors.New("execution overloaded")
)

// ExecutionService 执行服务接口
type ExecutionService interface {
	Execute(ctx context.Context, workflowID, userID uuid.UUID, inputs entity.JSON, triggerType string, triggerData entity.JSON) (*entity.Execution, error)
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Execution, []entity.NodeLog, error)
	List(ctx context.Context, userID uuid.UUID, params repository.ExecutionListParams) ([]entity.Execution, int64, error)
	Cancel(ctx context.Context, id, userID uuid.UUID) error
	Retry(ctx context.Context, id, userID uuid.UUID) (*entity.Execution, error)
}

type executionService struct {
	executionRepo      repository.ExecutionRepository
	workflowRepo       repository.WorkflowRepository
	workspaceService   WorkspaceService
	billingService     BillingService
	redis              *redis.Client
	engine             *executor.Engine
	wsHub              *websocket.Hub
	log                logger.Logger
	metrics            *observability.MetricsCollector
	loadShedder        *executionLoadShedder
	pii                *piiSanitizer
	eventRecorder      EventRecorderService
	auditLogService    AuditLogService
	auditRecorder      executor.AuditRecorder
	modelUsageRecorder executor.ModelUsageRecorder
	taskQueue          *queue.Queue
	resultCache        *ttlCache[executionResultCacheEntry]
}

type executionLoadShedder struct {
	mu          sync.Mutex
	maxInFlight int
	inFlight    int
}

func newExecutionLoadShedder(maxInFlight int) *executionLoadShedder {
	if maxInFlight <= 0 {
		return nil
	}
	return &executionLoadShedder{
		maxInFlight: maxInFlight,
	}
}

func (s *executionLoadShedder) TryAcquire() bool {
	if s == nil {
		return true
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.inFlight >= s.maxInFlight {
		return false
	}
	s.inFlight++
	return true
}

func (s *executionLoadShedder) Release() {
	if s == nil {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.inFlight > 0 {
		s.inFlight--
	}
}

// NewExecutionService 创建执行服务实例
func NewExecutionService(
	executionRepo repository.ExecutionRepository,
	workflowRepo repository.WorkflowRepository,
	workspaceService WorkspaceService,
	billingService BillingService,
	modelUsageRecorder executor.ModelUsageRecorder,
	redis *redis.Client,
	log logger.Logger,
	eventRecorder EventRecorderService,
	auditLogService AuditLogService,
	piiEnabled bool,
	engineCfg *executor.EngineConfig,
	workspaceDBRuntime WorkspaceDBRuntime,
	taskQueue *queue.Queue,
	maxInFlight int,
	cacheSettings ExecutionCacheSettings,
) ExecutionService {
	// 创建执行引擎
	engine := executor.NewEngine(engineCfg, log, workspaceDBRuntime, workspaceDBRuntime)
	loadShedder := newExecutionLoadShedder(maxInFlight)
	auditRecorder := NewExecutionAuditRecorder(auditLogService)

	return &executionService{
		executionRepo:      executionRepo,
		workflowRepo:       workflowRepo,
		workspaceService:   workspaceService,
		billingService:     billingService,
		redis:              redis,
		engine:             engine,
		log:                log,
		metrics:            observability.GetMetricsCollector(),
		loadShedder:        loadShedder,
		pii:                newPIISanitizer(piiEnabled),
		eventRecorder:      eventRecorder,
		auditLogService:    auditLogService,
		auditRecorder:      auditRecorder,
		modelUsageRecorder: modelUsageRecorder,
		taskQueue:          taskQueue,
		resultCache:        newExecutionResultCache(cacheSettings.ResultTTL),
	}
}

// SetWebSocketHub 设置 WebSocket Hub (用于实时推送)
func (s *executionService) SetWebSocketHub(hub *websocket.Hub) {
	s.wsHub = hub
	// 注册事件处理器
	s.engine.RegisterEventHandler(&wsEventHandler{hub: hub})
}

// wsEventHandler WebSocket 事件处理器
type wsEventHandler struct {
	hub *websocket.Hub
}

func (h *wsEventHandler) HandleEvent(event *executor.ExecutionEvent) {
	if h.hub == nil {
		return
	}

	// 映射事件类型
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
	case executor.EventLog:
		msgType = websocket.MessageTypeExecutionLog
	default:
		return
	}

	// 构建载荷
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

func (s *executionService) Execute(ctx context.Context, workflowID, userID uuid.UUID, inputs entity.JSON, triggerType string, triggerData entity.JSON) (*entity.Execution, error) {
	// 获取工作流
	workflow, err := s.workflowRepo.GetByID(ctx, workflowID)
	if err != nil {
		return nil, ErrWorkflowNotFound
	}

	// 检查权限 (仅所有者可执行私有工作流)
	if !workflow.IsPublic && workflow.UserID != userID {
		return nil, ErrUnauthorized
	}

	acquired := false
	if s.loadShedder != nil {
		if !s.loadShedder.TryAcquire() {
			return nil, ErrExecutionOverloaded
		}
		acquired = true
	}
	success := false
	defer func() {
		if !success && acquired {
			s.loadShedder.Release()
		}
	}()

	// 迁移兜底：确保 workflow 绑定 workspace
	if workflow.WorkspaceID == uuid.Nil && s.workspaceService != nil {
		workspace, err := s.workspaceService.EnsureDefaultWorkspaceByUserID(ctx, workflow.UserID)
		if err != nil {
			return nil, err
		}
		workflow.WorkspaceID = workspace.ID
		if err := s.workflowRepo.Update(ctx, workflow); err != nil {
			return nil, err
		}
	}

	// 创建执行记录
	now := time.Now()
	inputsForLog := inputs
	if s.pii != nil {
		inputsForLog = s.pii.sanitizeJSON(inputs)
	}
	triggerDataForLog := triggerData
	if s.pii != nil {
		triggerDataForLog = s.pii.sanitizeJSON(triggerData)
	}
	execution := &entity.Execution{
		WorkflowID:  workflowID,
		UserID:      userID,
		WorkspaceID: workflow.WorkspaceID,
		Status:      ExecutionStatusPending,
		TriggerType: triggerType,
		TriggerData: triggerDataForLog,
		Inputs:      inputsForLog,
		StartedAt:   &now,
	}

	if err := s.executionRepo.Create(ctx, execution); err != nil {
		return nil, err
	}

	// 增加执行次数
	_ = s.workflowRepo.IncrementRunCount(ctx, workflowID)

	// 更新状态为运行中
	if !canTransitionExecutionStatus(execution.Status, ExecutionStatusRunning) {
		s.log.Warn("Invalid execution status transition", "from", execution.Status, "to", ExecutionStatusRunning, "execution_id", execution.ID)
	}
	execution.Status = ExecutionStatusRunning
	_ = s.executionRepo.Update(ctx, execution)

	s.recordExecutionAudit(ctx, execution, triggerData)

	// 增加正在执行的工作流计数
	if s.metrics != nil {
		s.metrics.ExecutionsInProgress.WithLabelValues(workflow.WorkspaceID.String()).Inc()
	}

	// 异步执行工作流
	go s.executeWorkflow(ctx, execution, workflow, inputs)

	success = true
	return execution, nil
}

// executeWorkflow 异步执行工作流
func (s *executionService) executeWorkflow(ctx context.Context, execution *entity.Execution, workflow *entity.Workflow, inputs entity.JSON) {
	if s.loadShedder != nil {
		defer s.loadShedder.Release()
	}
	workspaceID := workflow.WorkspaceID.String()
	triggerType := execution.TriggerType
	if triggerType == "" {
		triggerType = "manual"
	}

	// 确保减少 ExecutionsInProgress 计数
	defer func() {
		if s.metrics != nil {
			s.metrics.ExecutionsInProgress.WithLabelValues(workspaceID).Dec()
		}
	}()

	// 解析工作流定义
	defJSON, err := json.Marshal(workflow.Definition)
	if err != nil {
		s.updateExecutionFailed(ctx, execution, err)
		s.recordExecutionMetrics(workspaceID, "failed", triggerType, execution)
		return
	}

	def, err := executor.ParseWorkflowDefinition(defJSON)
	if err != nil {
		s.updateExecutionFailed(ctx, execution, err)
		s.recordExecutionMetrics(workspaceID, "failed", triggerType, execution)
		return
	}

	// 创建执行上下文
	execCtx := executor.NewExecutionContext(
		execution.ID.String(),
		workflow.ID.String(),
		execution.UserID.String(),
		execution.WorkspaceID.String(),
	)
	execCtx.ModelUsageRecorder = s.modelUsageRecorder
	execCtx.AuditRecorder = s.auditRecorder
	execCtx.TriggerType = execution.TriggerType
	execCtx.TriggerData = buildExecutionAuditTriggerData(execution.TriggerData)

	// TODO: 加载用户的 API 密钥
	// execCtx.APIKeys["openai"] = userApiKeys["openai"]

	// 转换输入
	inputsMap := make(map[string]interface{})
	if inputs != nil {
		for k, v := range inputs {
			inputsMap[k] = v
		}
	}

	// 执行工作流
	result, err := s.engine.Execute(ctx, def, inputsMap, execCtx)
	normalizedTokenUsage := executor.NormalizeTokenUsage(result.TokenUsage)

	// 更新执行记录
	now := time.Now()
	execution.CompletedAt = &now
	if execution.StartedAt != nil {
		duration := int(now.Sub(*execution.StartedAt).Milliseconds())
		execution.DurationMs = &duration
	}

	var status string
	if err != nil {
		if !canTransitionExecutionStatus(execution.Status, ExecutionStatusFailed) {
			s.log.Warn("Invalid execution status transition", "from", execution.Status, "to", ExecutionStatusFailed, "execution_id", execution.ID)
		}
		execution.Status = ExecutionStatusFailed
		errMsg := err.Error()
		if s.pii != nil {
			errMsg = s.pii.sanitizeString(errMsg)
		}
		execution.ErrorMessage = &errMsg
		status = "failed"
	} else {
		if !canTransitionExecutionStatus(execution.Status, ExecutionStatusCompleted) {
			s.log.Warn("Invalid execution status transition", "from", execution.Status, "to", ExecutionStatusCompleted, "execution_id", execution.ID)
		}
		execution.Status = ExecutionStatusCompleted
		if result.Outputs != nil {
			outputsForLog := result.Outputs
			if s.pii != nil {
				outputsForLog = s.pii.sanitizeJSON(result.Outputs)
			}
			execution.Outputs = outputsForLog
		}
		status = "completed"
	}

	// 保存 Token 使用量
	if normalizedTokenUsage.TotalTokens > 0 {
		execution.TokenUsage = entity.JSON{
			"prompt_tokens":     normalizedTokenUsage.PromptTokens,
			"completion_tokens": normalizedTokenUsage.CompletionTokens,
			"total_tokens":      normalizedTokenUsage.TotalTokens,
		}
	}

	// 保存节点执行日志并记录节点指标
	for nodeID, nodeResult := range result.NodeResults {
		nodeType := string(def.Nodes[0].Type) // 简化：实际应从 DAG 获取
		// 尝试获取真实的节点类型
		for _, node := range def.Nodes {
			if node.ID == nodeID {
				nodeType = string(node.Type)
				break
			}
		}

		inputsForLog := nodeResult.Outputs
		outputsForLog := nodeResult.Outputs
		if s.pii != nil {
			inputsForLog = s.pii.sanitizeJSON(nodeResult.Outputs)
			outputsForLog = s.pii.sanitizeJSON(nodeResult.Outputs)
		}
		var logsForLog entity.JSON
		if len(nodeResult.Logs) > 0 {
			logsPayload := entity.JSON{
				"events": nodeResult.Logs,
			}
			if s.pii != nil {
				logsPayload = s.pii.sanitizeJSON(logsPayload)
			}
			logsForLog = logsPayload
		}

		nodeLog := &entity.NodeLog{
			ExecutionID: execution.ID,
			NodeID:      nodeID,
			NodeType:    nodeType,
			Status:      string(nodeResult.Status),
			Inputs:      inputsForLog, // 简化
			Outputs:     outputsForLog,
			StartedAt:   &nodeResult.StartedAt,
			CompletedAt: &nodeResult.FinishedAt,
			DurationMs:  &nodeResult.DurationMs,
			Logs:        logsForLog,
		}
		if nodeResult.Error != nil {
			errMsg := nodeResult.Error.Error()
			if s.pii != nil {
				errMsg = s.pii.sanitizeString(errMsg)
			}
			nodeLog.ErrorMessage = &errMsg
		}
		_ = s.executionRepo.CreateNodeLog(ctx, nodeLog)

		// 记录节点执行指标
		if s.metrics != nil {
			nodeStatus := "completed"
			if nodeResult.Error != nil {
				nodeStatus = "failed"
			}
			s.metrics.RecordNodeExecution(nodeType, nodeStatus, float64(nodeResult.DurationMs)/1000.0)
		}
	}

	_ = s.executionRepo.Update(ctx, execution)

	// 记录执行指标
	s.recordExecutionMetrics(workspaceID, status, triggerType, execution)

	// 记录 Token 用量
	s.consumeTokenUsage(ctx, execution, normalizedTokenUsage)

	// 异步刷新聚合指标缓存
	s.enqueueMetricsAggregation(ctx, execution)
}

const metricsAggregationDelay = 1 * time.Minute

func (s *executionService) enqueueMetricsAggregation(ctx context.Context, execution *entity.Execution) {
	if s.taskQueue == nil || execution == nil {
		return
	}
	if execution.UserID == uuid.Nil || execution.WorkspaceID == uuid.Nil {
		return
	}
	workspaceID := execution.WorkspaceID.String()
	payload := &queue.MetricsAggregationPayload{
		OwnerID:     execution.UserID.String(),
		WorkspaceID: &workspaceID,
	}
	processAt := time.Now().Add(metricsAggregationDelay)
	if _, err := s.taskQueue.EnqueueMetricsAggregation(ctx, payload, &processAt); err != nil {
		s.log.Warn("Failed to enqueue metrics aggregation",
			"error", err,
			"workspace_id", execution.WorkspaceID,
			"execution_id", execution.ID)
	}
}

// recordExecutionMetrics 记录执行指标
func (s *executionService) recordExecutionMetrics(workspaceID, status, triggerType string, execution *entity.Execution) {
	if s.metrics == nil {
		return
	}

	var durationSeconds float64
	if execution.DurationMs != nil {
		durationSeconds = float64(*execution.DurationMs) / 1000.0
	}

	s.metrics.RecordExecution(workspaceID, status, triggerType, durationSeconds)
}

func (s *executionService) consumeTokenUsage(ctx context.Context, execution *entity.Execution, usage executor.TokenUsage) {
	if s.billingService == nil || execution == nil || usage.TotalTokens <= 0 {
		return
	}
	consumeCtx := ctx
	if consumeCtx == nil || consumeCtx.Err() != nil {
		consumeCtx = context.Background()
	}
	_, err := s.billingService.ConsumeUsage(consumeCtx, execution.UserID, execution.WorkspaceID, ConsumeUsageRequest{
		Usage: map[string]float64{
			"tokens": float64(usage.TotalTokens),
		},
	})
	if err != nil {
		s.log.Warn("Failed to consume token usage", "execution_id", execution.ID, "error", err)
	}
}

func (s *executionService) updateExecutionFailed(ctx context.Context, execution *entity.Execution, err error) {
	now := time.Now()
	if !canTransitionExecutionStatus(execution.Status, ExecutionStatusFailed) {
		s.log.Warn("Invalid execution status transition", "from", execution.Status, "to", ExecutionStatusFailed, "execution_id", execution.ID)
	}
	execution.Status = ExecutionStatusFailed
	execution.CompletedAt = &now
	errMsg := err.Error()
	if s.pii != nil {
		errMsg = s.pii.sanitizeString(errMsg)
	}
	execution.ErrorMessage = &errMsg
	if execution.StartedAt != nil {
		duration := int(now.Sub(*execution.StartedAt).Milliseconds())
		execution.DurationMs = &duration
	}
	_ = s.executionRepo.Update(ctx, execution)
	s.recordExecutionFailure(ctx, execution, errMsg)
}

func (s *executionService) recordExecutionFailure(ctx context.Context, execution *entity.Execution, errMsg string) {
	if s.eventRecorder == nil || execution == nil {
		return
	}
	builder := entity.NewRuntimeEvent(entity.EventExecutionFailed).
		WithExecution(execution.ID).
		WithWorkspace(execution.WorkspaceID).
		WithUser(execution.UserID).
		WithMessage("execution failed")
	if errMsg != "" {
		builder = builder.WithError("EXECUTION_FAILED", errMsg, "")
	} else {
		builder = builder.WithSeverity(entity.SeverityError)
	}
	builder = builder.WithMetadata("workflow_id", execution.WorkflowID.String())
	if triggerType := strings.TrimSpace(execution.TriggerType); triggerType != "" {
		builder = builder.WithMetadata("trigger_type", triggerType)
	}
	_ = s.eventRecorder.Record(ctx, builder.Build())
}

func (s *executionService) GetByID(ctx context.Context, id uuid.UUID) (*entity.Execution, []entity.NodeLog, error) {
	if s.resultCache != nil {
		if cached, ok := s.resultCache.Get(id.String()); ok && cached.Execution != nil {
			return cloneExecution(cached.Execution), cloneNodeLogs(cached.NodeLogs), nil
		}
	}
	execution, err := s.executionRepo.GetByID(ctx, id)
	if err != nil {
		return nil, nil, ErrExecutionNotFound
	}

	nodeLogs, err := s.executionRepo.GetNodeLogs(ctx, id)
	if err != nil {
		return nil, nil, err
	}

	if s.resultCache != nil && isTerminalExecutionStatus(execution.Status) {
		s.resultCache.Set(id.String(), executionResultCacheEntry{
			Execution: cloneExecution(execution),
			NodeLogs:  cloneNodeLogs(nodeLogs),
		})
	}
	return execution, nodeLogs, nil
}

func (s *executionService) List(ctx context.Context, userID uuid.UUID, params repository.ExecutionListParams) ([]entity.Execution, int64, error) {
	params.UserID = &userID
	return s.executionRepo.List(ctx, params)
}

func (s *executionService) Cancel(ctx context.Context, id, userID uuid.UUID) error {
	execution, err := s.executionRepo.GetByID(ctx, id)
	if err != nil {
		return ErrExecutionNotFound
	}

	// 检查权限
	if execution.UserID != userID {
		return ErrUnauthorized
	}

	// 检查状态
	if !canTransitionExecutionStatus(execution.Status, ExecutionStatusCancelled) {
		return ErrCannotCancel
	}

	// 更新状态
	now := time.Now()
	execution.Status = ExecutionStatusCancelled
	execution.CompletedAt = &now
	if execution.StartedAt != nil {
		duration := int(now.Sub(*execution.StartedAt).Milliseconds())
		execution.DurationMs = &duration
	}

	return s.executionRepo.Update(ctx, execution)
}

func (s *executionService) Retry(ctx context.Context, id, userID uuid.UUID) (*entity.Execution, error) {
	execution, err := s.executionRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrExecutionNotFound
	}

	// 检查权限
	if execution.UserID != userID {
		return nil, ErrUnauthorized
	}

	// 只能重试失败的执行
	if execution.Status != ExecutionStatusFailed {
		return nil, ErrCannotRetry
	}

	// 创建新的执行记录
	return s.Execute(ctx, execution.WorkflowID, userID, execution.Inputs, execution.TriggerType, execution.TriggerData)
}

func (s *executionService) recordExecutionAudit(ctx context.Context, execution *entity.Execution, triggerData entity.JSON) {
	if s.auditLogService == nil || execution == nil {
		return
	}

	metadata := entity.JSON{
		"execution_id": execution.ID.String(),
		"trigger_type": execution.TriggerType,
	}
	for key, value := range buildExecutionAuditTriggerData(triggerData) {
		metadata[key] = value
	}

	actorID := execution.UserID
	targetID := execution.WorkflowID
	_, _ = s.auditLogService.Record(ctx, AuditLogRecordRequest{
		WorkspaceID: execution.WorkspaceID,
		ActorUserID: &actorID,
		Action:      "workflow_executed",
		TargetType:  "workflow",
		TargetID:    &targetID,
		Metadata:    metadata,
	})
}

func buildExecutionAuditTriggerData(triggerData entity.JSON) map[string]interface{} {
	if triggerData == nil {
		return nil
	}
	allowed := []string{"source", "workspace_id", "workspace_version_id", "session_id", "access_mode"}
	result := make(map[string]interface{})
	for _, key := range allowed {
		if value, ok := triggerData[key]; ok {
			result[key] = value
		}
	}
	if len(result) == 0 {
		return nil
	}
	return result
}
