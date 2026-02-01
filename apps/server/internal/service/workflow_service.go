package service

import (
	"context"
	"errors"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrWorkflowNotFound = errors.New("workflow not found")
	ErrUnauthorized     = errors.New("unauthorized")
)

// WorkflowService 工作流服务接口
type WorkflowService interface {
	Create(ctx context.Context, userID uuid.UUID, req CreateWorkflowRequest) (*entity.Workflow, error)
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Workflow, error)
	List(ctx context.Context, userID uuid.UUID, params repository.ListParams) ([]entity.Workflow, int64, error)
	Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, req UpdateWorkflowRequest) (*entity.Workflow, error)
	Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
	Duplicate(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*entity.Workflow, error)
	// 批量操作
	BatchDelete(ctx context.Context, ids []uuid.UUID, userID uuid.UUID) (int64, error)
	BatchArchive(ctx context.Context, ids []uuid.UUID, userID uuid.UUID) (int64, error)
	// 导出导入
	Export(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*WorkflowExport, error)
	BatchExport(ctx context.Context, ids []uuid.UUID, userID uuid.UUID) ([]WorkflowExport, error)
	Import(ctx context.Context, userID uuid.UUID, data *WorkflowImport) (*entity.Workflow, error)
}

// CreateWorkflowRequest 创建工作流请求
type CreateWorkflowRequest struct {
	Name        string
	Description *string
	Definition  entity.JSON
	Variables   entity.JSON
}

// UpdateWorkflowRequest 更新工作流请求
type UpdateWorkflowRequest struct {
	Name          *string
	Description   *string
	Definition    *entity.JSON
	Variables     *entity.JSON
	TriggerType   *string
	TriggerConfig *entity.JSON
	Status        *string
}

// WorkflowExport 工作流导出数据
type WorkflowExport struct {
	Version    string       `json:"version"`
	ExportedAt string       `json:"exported_at"`
	Workflow   WorkflowData `json:"workflow"`
}

// WorkflowData 工作流数据（导出用）
type WorkflowData struct {
	Name          string      `json:"name"`
	Description   *string     `json:"description"`
	Icon          string      `json:"icon"`
	Definition    entity.JSON `json:"definition"`
	Variables     entity.JSON `json:"variables"`
	TriggerType   string      `json:"trigger_type"`
	TriggerConfig entity.JSON `json:"trigger_config"`
}

// WorkflowImport 工作流导入数据
type WorkflowImport struct {
	Workflow WorkflowData `json:"workflow"`
	FolderID *uuid.UUID   `json:"folder_id"`
}

type workflowService struct {
	workflowRepo repository.WorkflowRepository
}

// NewWorkflowService 创建工作流服务实例
func NewWorkflowService(workflowRepo repository.WorkflowRepository) WorkflowService {
	return &workflowService{workflowRepo: workflowRepo}
}

func (s *workflowService) Create(ctx context.Context, userID uuid.UUID, req CreateWorkflowRequest) (*entity.Workflow, error) {
	workflow := &entity.Workflow{
		UserID:      userID,
		Name:        req.Name,
		Description: req.Description,
		Definition:  req.Definition,
		Variables:   req.Variables,
	}

	if workflow.Definition == nil {
		workflow.Definition = entity.JSON{
			"version": "1.0.0",
			"nodes":   []interface{}{},
			"edges":   []interface{}{},
			"settings": map[string]interface{}{
				"timeout": 300000,
				"retryPolicy": map[string]interface{}{
					"maxRetries": 3,
					"backoffMs":  1000,
				},
				"errorHandling": "stop",
			},
		}
	}

	if err := s.workflowRepo.Create(ctx, workflow); err != nil {
		return nil, err
	}

	return workflow, nil
}

func (s *workflowService) GetByID(ctx context.Context, id uuid.UUID) (*entity.Workflow, error) {
	return s.workflowRepo.GetByID(ctx, id)
}

func (s *workflowService) List(ctx context.Context, userID uuid.UUID, params repository.ListParams) ([]entity.Workflow, int64, error) {
	return s.workflowRepo.List(ctx, userID, params)
}

func (s *workflowService) Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, req UpdateWorkflowRequest) (*entity.Workflow, error) {
	workflow, err := s.workflowRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrWorkflowNotFound
	}

	// 检查权限
	if workflow.UserID != userID {
		return nil, ErrUnauthorized
	}

	// 更新字段
	if req.Name != nil {
		workflow.Name = *req.Name
	}
	if req.Description != nil {
		workflow.Description = req.Description
	}
	if req.Definition != nil {
		workflow.Definition = *req.Definition
		workflow.Version++
	}
	if req.Variables != nil {
		workflow.Variables = *req.Variables
	}
	if req.TriggerType != nil {
		workflow.TriggerType = *req.TriggerType
	}
	if req.TriggerConfig != nil {
		workflow.TriggerConfig = *req.TriggerConfig
	}
	if req.Status != nil {
		workflow.Status = *req.Status
	}

	if err := s.workflowRepo.Update(ctx, workflow); err != nil {
		return nil, err
	}

	return workflow, nil
}

func (s *workflowService) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	workflow, err := s.workflowRepo.GetByID(ctx, id)
	if err != nil {
		return ErrWorkflowNotFound
	}

	// 检查权限
	if workflow.UserID != userID {
		return ErrUnauthorized
	}

	return s.workflowRepo.Delete(ctx, id)
}

func (s *workflowService) Duplicate(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*entity.Workflow, error) {
	original, err := s.workflowRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrWorkflowNotFound
	}

	// 创建副本
	copy := &entity.Workflow{
		UserID:        userID,
		Name:          original.Name + " (副本)",
		Description:   original.Description,
		Icon:          original.Icon,
		Definition:    original.Definition,
		Variables:     original.Variables,
		TriggerType:   original.TriggerType,
		TriggerConfig: original.TriggerConfig,
	}

	if err := s.workflowRepo.Create(ctx, copy); err != nil {
		return nil, err
	}

	return copy, nil
}

func (s *workflowService) BatchDelete(ctx context.Context, ids []uuid.UUID, userID uuid.UUID) (int64, error) {
	return s.workflowRepo.DeleteByIDs(ctx, ids, userID)
}

func (s *workflowService) BatchArchive(ctx context.Context, ids []uuid.UUID, userID uuid.UUID) (int64, error) {
	return s.workflowRepo.BatchUpdateStatus(ctx, ids, userID, "archived")
}

func (s *workflowService) Export(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*WorkflowExport, error) {
	workflow, err := s.workflowRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrWorkflowNotFound
	}

	// 检查权限
	if workflow.UserID != userID {
		return nil, ErrUnauthorized
	}

	export := &WorkflowExport{
		Version:    "1.0.0",
		ExportedAt: workflow.UpdatedAt.Format("2006-01-02T15:04:05Z"),
		Workflow: WorkflowData{
			Name:          workflow.Name,
			Description:   workflow.Description,
			Icon:          workflow.Icon,
			Definition:    workflow.Definition,
			Variables:     workflow.Variables,
			TriggerType:   workflow.TriggerType,
			TriggerConfig: workflow.TriggerConfig,
		},
	}

	return export, nil
}

func (s *workflowService) BatchExport(ctx context.Context, ids []uuid.UUID, userID uuid.UUID) ([]WorkflowExport, error) {
	workflows, err := s.workflowRepo.GetByIDs(ctx, ids)
	if err != nil {
		return nil, err
	}

	exports := make([]WorkflowExport, 0, len(workflows))
	for _, workflow := range workflows {
		// 只导出用户自己的工作流
		if workflow.UserID != userID {
			continue
		}

		export := WorkflowExport{
			Version:    "1.0.0",
			ExportedAt: workflow.UpdatedAt.Format("2006-01-02T15:04:05Z"),
			Workflow: WorkflowData{
				Name:          workflow.Name,
				Description:   workflow.Description,
				Icon:          workflow.Icon,
				Definition:    workflow.Definition,
				Variables:     workflow.Variables,
				TriggerType:   workflow.TriggerType,
				TriggerConfig: workflow.TriggerConfig,
			},
		}
		exports = append(exports, export)
	}

	return exports, nil
}

func (s *workflowService) Import(ctx context.Context, userID uuid.UUID, data *WorkflowImport) (*entity.Workflow, error) {
	workflow := &entity.Workflow{
		UserID:        userID,
		Name:          data.Workflow.Name,
		Description:   data.Workflow.Description,
		Icon:          data.Workflow.Icon,
		Definition:    data.Workflow.Definition,
		Variables:     data.Workflow.Variables,
		TriggerType:   data.Workflow.TriggerType,
		TriggerConfig: data.Workflow.TriggerConfig,
		FolderID:      data.FolderID,
	}

	if workflow.Icon == "" {
		workflow.Icon = "⚡"
	}

	if err := s.workflowRepo.Create(ctx, workflow); err != nil {
		return nil, err
	}

	return workflow, nil
}
