package service

import (
	"context"
	"errors"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/pkg/creative"
	"github.com/agentflow/server/internal/pkg/logger"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

// 错误定义
var (
	ErrCreativeTaskNotFound       = errors.New("creative task not found")
	ErrCreativeTaskNoPermission   = errors.New("no permission to access this task")
	ErrCreativeTaskAlreadyRunning = errors.New("task is already running")
	ErrCreativeTaskNotRunning     = errors.New("task is not running")
	ErrCreativeTaskCompleted      = errors.New("task has already completed")
	ErrCreativeTaskCancelled      = errors.New("task has been cancelled")
	ErrCreativeTaskFailed         = errors.New("task has failed")
	ErrInvalidTemplateID          = errors.New("invalid template id")
	ErrInvalidInputs              = errors.New("invalid inputs")
)

// CreateTaskInput 创建任务输入
type CreateTaskInput struct {
	TemplateID uuid.UUID              `json:"template_id"`
	Inputs     map[string]interface{} `json:"inputs"`
}

// TaskProgress 任务进度信息
type TaskProgress struct {
	TaskID            uuid.UUID                 `json:"task_id"`
	Status            entity.CreativeTaskStatus `json:"status"`
	Progress          int                       `json:"progress"`
	TotalSections     int                       `json:"total_sections"`
	CompletedSections int                       `json:"completed_sections"`
	CurrentSection    *string                   `json:"current_section,omitempty"`
	ErrorMessage      *string                   `json:"error_message,omitempty"`
	StartedAt         *time.Time                `json:"started_at,omitempty"`
	CompletedAt       *time.Time                `json:"completed_at,omitempty"`
}

// CreativeTaskService 创意任务服务接口
type CreativeTaskService interface {
	// 任务管理
	Create(ctx context.Context, userID uuid.UUID, input CreateTaskInput) (*entity.CreativeTask, error)
	GetByID(ctx context.Context, taskID, userID uuid.UUID) (*entity.CreativeTask, error)
	GetProgress(ctx context.Context, taskID, userID uuid.UUID) (*TaskProgress, error)
	List(ctx context.Context, userID uuid.UUID, params repository.CreativeTaskListParams) ([]entity.CreativeTask, int64, error)
	Cancel(ctx context.Context, taskID, userID uuid.UUID) error
	Delete(ctx context.Context, taskID, userID uuid.UUID) error

	// 执行控制
	StartExecution(ctx context.Context, taskID uuid.UUID) error
	UpdateProgress(ctx context.Context, taskID uuid.UUID, progress, completedSections int, currentSection string) error
	MarkCompleted(ctx context.Context, taskID uuid.UUID, outputMarkdown string, metadata entity.JSON) error
	MarkFailed(ctx context.Context, taskID uuid.UUID, errorMessage string) error

	// 章节状态
	UpdateSectionState(ctx context.Context, taskID uuid.UUID, sectionID string, state entity.SectionState) error

	// Token 统计
	AddTokenUsage(ctx context.Context, taskID uuid.UUID, promptTokens, completionTokens int) error

	// 统计查询
	GetRecentTasks(ctx context.Context, userID uuid.UUID, limit int) ([]entity.CreativeTask, error)
	CountByStatus(ctx context.Context, userID uuid.UUID, status entity.CreativeTaskStatus) (int64, error)
}

type creativeTaskService struct {
	taskRepo     repository.CreativeTaskRepository
	templateRepo repository.CreativeTemplateRepository
	generator    *creative.Generator
	log          logger.Logger
}

// NewCreativeTaskService 创建创意任务服务实例
func NewCreativeTaskService(
	taskRepo repository.CreativeTaskRepository,
	templateRepo repository.CreativeTemplateRepository,
	generator *creative.Generator,
	log logger.Logger,
) CreativeTaskService {
	return &creativeTaskService{
		taskRepo:     taskRepo,
		templateRepo: templateRepo,
		generator:    generator,
		log:          log,
	}
}

// Create 创建生成任务
func (s *creativeTaskService) Create(ctx context.Context, userID uuid.UUID, input CreateTaskInput) (*entity.CreativeTask, error) {
	// 验证模板是否存在
	template, err := s.templateRepo.GetByID(ctx, input.TemplateID)
	if err != nil {
		return nil, err
	}
	if template == nil {
		return nil, ErrInvalidTemplateID
	}

	// 验证输入参数 (可以根据模板的 InputsRequired 进行验证)
	if input.Inputs == nil {
		input.Inputs = make(map[string]interface{})
	}

	// 解析输出章节数量
	totalSections := 0
	if template.OutputSections != nil {
		if sections, ok := template.OutputSections["sections"].([]interface{}); ok {
			totalSections = len(sections)
		}
	}

	// 创建任务
	task := &entity.CreativeTask{
		UserID:        userID,
		TemplateID:    &input.TemplateID,
		Inputs:        entity.JSON(input.Inputs),
		Status:        entity.CreativeTaskStatusPending,
		Sections:      entity.JSON{},
		TotalSections: totalSections,
		TokenUsage: entity.JSON{
			"prompt_tokens":     0,
			"completion_tokens": 0,
			"total_tokens":      0,
		},
	}

	if err := s.taskRepo.Create(ctx, task); err != nil {
		s.log.Error("Failed to create creative task", "error", err, "userID", userID)
		return nil, err
	}

	// 增加模板使用次数
	_ = s.templateRepo.IncrementUsageCount(ctx, input.TemplateID)

	s.log.Info("Creative task created",
		"taskID", task.ID,
		"userID", userID,
		"templateID", input.TemplateID,
		"totalSections", totalSections)

	return task, nil
}

// GetByID 获取任务详情
func (s *creativeTaskService) GetByID(ctx context.Context, taskID, userID uuid.UUID) (*entity.CreativeTask, error) {
	task, err := s.taskRepo.GetByIDAndUserID(ctx, taskID, userID)
	if err != nil {
		return nil, err
	}
	if task == nil {
		return nil, ErrCreativeTaskNotFound
	}
	return task, nil
}

// GetProgress 获取任务进度
func (s *creativeTaskService) GetProgress(ctx context.Context, taskID, userID uuid.UUID) (*TaskProgress, error) {
	task, err := s.GetByID(ctx, taskID, userID)
	if err != nil {
		return nil, err
	}

	return &TaskProgress{
		TaskID:            task.ID,
		Status:            task.Status,
		Progress:          task.Progress,
		TotalSections:     task.TotalSections,
		CompletedSections: task.CompletedSections,
		CurrentSection:    task.CurrentSection,
		ErrorMessage:      task.ErrorMessage,
		StartedAt:         task.StartedAt,
		CompletedAt:       task.CompletedAt,
	}, nil
}

// List 获取任务列表
func (s *creativeTaskService) List(ctx context.Context, userID uuid.UUID, params repository.CreativeTaskListParams) ([]entity.CreativeTask, int64, error) {
	params.UserID = userID

	// 设置默认分页
	if params.Page <= 0 {
		params.Page = 1
	}
	if params.PageSize <= 0 {
		params.PageSize = 20
	}
	if params.PageSize > 100 {
		params.PageSize = 100
	}

	return s.taskRepo.List(ctx, params)
}

// Cancel 取消任务
func (s *creativeTaskService) Cancel(ctx context.Context, taskID, userID uuid.UUID) error {
	task, err := s.GetByID(ctx, taskID, userID)
	if err != nil {
		return err
	}

	// 检查任务状态
	switch task.Status {
	case entity.CreativeTaskStatusCompleted:
		return ErrCreativeTaskCompleted
	case entity.CreativeTaskStatusCancelled:
		return ErrCreativeTaskCancelled
	case entity.CreativeTaskStatusFailed:
		return ErrCreativeTaskFailed
	}

	// 更新状态为已取消
	if err := s.taskRepo.UpdateStatus(ctx, taskID, entity.CreativeTaskStatusCancelled, nil); err != nil {
		s.log.Error("Failed to cancel creative task", "error", err, "taskID", taskID)
		return err
	}

	// 如果有正在运行的生成器，通知取消
	if s.generator != nil {
		s.generator.CancelTask(taskID.String())
	}

	s.log.Info("Creative task cancelled", "taskID", taskID, "userID", userID)
	return nil
}

// Delete 删除任务
func (s *creativeTaskService) Delete(ctx context.Context, taskID, userID uuid.UUID) error {
	task, err := s.GetByID(ctx, taskID, userID)
	if err != nil {
		return err
	}

	// 如果任务正在运行，先取消
	if task.Status == entity.CreativeTaskStatusProcessing {
		if err := s.Cancel(ctx, taskID, userID); err != nil {
			s.log.Warn("Failed to cancel task before delete", "taskID", taskID, "error", err)
		}
	}

	if err := s.taskRepo.Delete(ctx, taskID); err != nil {
		s.log.Error("Failed to delete creative task", "error", err, "taskID", taskID)
		return err
	}

	s.log.Info("Creative task deleted", "taskID", taskID, "userID", userID)
	return nil
}

// StartExecution 开始执行任务
func (s *creativeTaskService) StartExecution(ctx context.Context, taskID uuid.UUID) error {
	task, err := s.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		return err
	}
	if task == nil {
		return ErrCreativeTaskNotFound
	}

	// 检查状态
	if task.Status == entity.CreativeTaskStatusProcessing {
		return ErrCreativeTaskAlreadyRunning
	}
	if task.Status == entity.CreativeTaskStatusCompleted {
		return ErrCreativeTaskCompleted
	}

	// 设置开始时间和状态
	if err := s.taskRepo.SetStartedAt(ctx, taskID); err != nil {
		s.log.Error("Failed to set task started_at", "error", err, "taskID", taskID)
		return err
	}

	s.log.Info("Creative task execution started", "taskID", taskID)
	return nil
}

// UpdateProgress 更新进度
func (s *creativeTaskService) UpdateProgress(ctx context.Context, taskID uuid.UUID, progress, completedSections int, currentSection string) error {
	if err := s.taskRepo.UpdateProgress(ctx, taskID, progress, completedSections); err != nil {
		return err
	}
	if currentSection != "" {
		if err := s.taskRepo.UpdateCurrentSection(ctx, taskID, currentSection); err != nil {
			s.log.Warn("Failed to update current section", "taskID", taskID, "error", err)
		}
	}
	return nil
}

// MarkCompleted 标记完成
func (s *creativeTaskService) MarkCompleted(ctx context.Context, taskID uuid.UUID, outputMarkdown string, metadata entity.JSON) error {
	// 更新输出
	if err := s.taskRepo.UpdateOutput(ctx, taskID, outputMarkdown, metadata); err != nil {
		s.log.Error("Failed to update task output", "error", err, "taskID", taskID)
		return err
	}

	// 设置完成时间
	if err := s.taskRepo.SetCompletedAt(ctx, taskID); err != nil {
		s.log.Error("Failed to set task completed_at", "error", err, "taskID", taskID)
		return err
	}

	s.log.Info("Creative task completed", "taskID", taskID)
	return nil
}

// MarkFailed 标记失败
func (s *creativeTaskService) MarkFailed(ctx context.Context, taskID uuid.UUID, errorMessage string) error {
	if err := s.taskRepo.UpdateStatus(ctx, taskID, entity.CreativeTaskStatusFailed, &errorMessage); err != nil {
		s.log.Error("Failed to mark task as failed", "error", err, "taskID", taskID)
		return err
	}

	s.log.Warn("Creative task failed", "taskID", taskID, "error", errorMessage)
	return nil
}

// UpdateSectionState 更新章节状态
func (s *creativeTaskService) UpdateSectionState(ctx context.Context, taskID uuid.UUID, sectionID string, state entity.SectionState) error {
	return s.taskRepo.UpdateSectionState(ctx, taskID, sectionID, state)
}

// AddTokenUsage 添加 Token 使用量
func (s *creativeTaskService) AddTokenUsage(ctx context.Context, taskID uuid.UUID, promptTokens, completionTokens int) error {
	return s.taskRepo.AddTokenUsage(ctx, taskID, promptTokens, completionTokens)
}

// GetRecentTasks 获取最近任务
func (s *creativeTaskService) GetRecentTasks(ctx context.Context, userID uuid.UUID, limit int) ([]entity.CreativeTask, error) {
	if limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}
	return s.taskRepo.GetRecentTasks(ctx, userID, limit)
}

// CountByStatus 按状态统计
func (s *creativeTaskService) CountByStatus(ctx context.Context, userID uuid.UUID, status entity.CreativeTaskStatus) (int64, error) {
	return s.taskRepo.CountByStatus(ctx, userID, status)
}
