package service

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/executor"
	"github.com/agentflow/server/internal/pkg/logger"
	"github.com/agentflow/server/internal/pkg/redis"
	"github.com/agentflow/server/internal/pkg/websocket"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrExecutionNotFound = errors.New("execution not found")
	ErrCannotCancel      = errors.New("cannot cancel execution in current state")
	ErrCannotRetry       = errors.New("cannot retry execution in current state")
)

// ExecutionService 执行服务接口
type ExecutionService interface {
	Execute(ctx context.Context, workflowID, userID uuid.UUID, inputs entity.JSON, triggerType string) (*entity.Execution, error)
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Execution, []entity.NodeLog, error)
	List(ctx context.Context, userID uuid.UUID, params repository.ExecutionListParams) ([]entity.Execution, int64, error)
	Cancel(ctx context.Context, id, userID uuid.UUID) error
	Retry(ctx context.Context, id, userID uuid.UUID) (*entity.Execution, error)
}

type executionService struct {
	executionRepo repository.ExecutionRepository
	workflowRepo  repository.WorkflowRepository
	redis         *redis.Client
	engine        *executor.Engine
	wsHub         *websocket.Hub
	log           logger.Logger
}

// NewExecutionService 创建执行服务实例
func NewExecutionService(
	executionRepo repository.ExecutionRepository,
	workflowRepo repository.WorkflowRepository,
	redis *redis.Client,
	log logger.Logger,
) ExecutionService {
	// 创建执行引擎
	engine := executor.NewEngine(nil, log)

	return &executionService{
		executionRepo: executionRepo,
		workflowRepo:  workflowRepo,
		redis:         redis,
		engine:        engine,
		log:           log,
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

func (s *executionService) Execute(ctx context.Context, workflowID, userID uuid.UUID, inputs entity.JSON, triggerType string) (*entity.Execution, error) {
	// 获取工作流
	workflow, err := s.workflowRepo.GetByID(ctx, workflowID)
	if err != nil {
		return nil, ErrWorkflowNotFound
	}

	// 检查权限 (仅所有者可执行私有工作流)
	if !workflow.IsPublic && workflow.UserID != userID {
		return nil, ErrUnauthorized
	}

	// 创建执行记录
	now := time.Now()
	execution := &entity.Execution{
		WorkflowID:  workflowID,
		UserID:      userID,
		Status:      "pending",
		TriggerType: triggerType,
		Inputs:      inputs,
		StartedAt:   &now,
	}

	if err := s.executionRepo.Create(ctx, execution); err != nil {
		return nil, err
	}

	// 增加执行次数
	_ = s.workflowRepo.IncrementRunCount(ctx, workflowID)

	// 更新状态为运行中
	execution.Status = "running"
	_ = s.executionRepo.Update(ctx, execution)

	// 异步执行工作流
	go s.executeWorkflow(ctx, execution, workflow, inputs)

	return execution, nil
}

// executeWorkflow 异步执行工作流
func (s *executionService) executeWorkflow(ctx context.Context, execution *entity.Execution, workflow *entity.Workflow, inputs entity.JSON) {
	// 解析工作流定义
	defJSON, err := json.Marshal(workflow.Definition)
	if err != nil {
		s.updateExecutionFailed(ctx, execution, err)
		return
	}

	def, err := executor.ParseWorkflowDefinition(defJSON)
	if err != nil {
		s.updateExecutionFailed(ctx, execution, err)
		return
	}

	// 创建执行上下文
	execCtx := executor.NewExecutionContext(
		execution.ID.String(),
		workflow.ID.String(),
		execution.UserID.String(),
	)

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

	// 更新执行记录
	now := time.Now()
	execution.CompletedAt = &now
	if execution.StartedAt != nil {
		duration := int(now.Sub(*execution.StartedAt).Milliseconds())
		execution.DurationMs = &duration
	}

	if err != nil {
		execution.Status = "failed"
		errMsg := err.Error()
		execution.ErrorMessage = &errMsg
	} else {
		execution.Status = "completed"
		if result.Outputs != nil {
			execution.Outputs = result.Outputs
		}
		// 保存 Token 使用量
		if result.TokenUsage.TotalTokens > 0 {
			execution.TokenUsage = entity.JSON{
				"prompt_tokens":     result.TokenUsage.PromptTokens,
				"completion_tokens": result.TokenUsage.CompletionTokens,
				"total_tokens":      result.TokenUsage.TotalTokens,
			}
		}
	}

	// 保存节点执行日志
	for nodeID, nodeResult := range result.NodeResults {
		nodeLog := &entity.NodeLog{
			ExecutionID: execution.ID,
			NodeID:      nodeID,
			NodeType:    string(def.Nodes[0].Type), // 简化：实际应从 DAG 获取
			Status:      string(nodeResult.Status),
			Inputs:      nodeResult.Outputs, // 简化
			Outputs:     nodeResult.Outputs,
			StartedAt:   &nodeResult.StartedAt,
			CompletedAt: &nodeResult.FinishedAt,
			DurationMs:  &nodeResult.DurationMs,
		}
		if nodeResult.Error != nil {
			errMsg := nodeResult.Error.Error()
			nodeLog.ErrorMessage = &errMsg
		}
		_ = s.executionRepo.CreateNodeLog(ctx, nodeLog)
	}

	_ = s.executionRepo.Update(ctx, execution)
}

func (s *executionService) updateExecutionFailed(ctx context.Context, execution *entity.Execution, err error) {
	now := time.Now()
	execution.Status = "failed"
	execution.CompletedAt = &now
	errMsg := err.Error()
	execution.ErrorMessage = &errMsg
	if execution.StartedAt != nil {
		duration := int(now.Sub(*execution.StartedAt).Milliseconds())
		execution.DurationMs = &duration
	}
	_ = s.executionRepo.Update(ctx, execution)
}

func (s *executionService) GetByID(ctx context.Context, id uuid.UUID) (*entity.Execution, []entity.NodeLog, error) {
	execution, err := s.executionRepo.GetByID(ctx, id)
	if err != nil {
		return nil, nil, ErrExecutionNotFound
	}

	nodeLogs, err := s.executionRepo.GetNodeLogs(ctx, id)
	if err != nil {
		return nil, nil, err
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
	if execution.Status != "pending" && execution.Status != "running" {
		return ErrCannotCancel
	}

	// 更新状态
	now := time.Now()
	execution.Status = "cancelled"
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
	if execution.Status != "failed" {
		return nil, ErrCannotRetry
	}

	// 创建新的执行记录
	return s.Execute(ctx, execution.WorkflowID, userID, execution.Inputs, execution.TriggerType)
}
