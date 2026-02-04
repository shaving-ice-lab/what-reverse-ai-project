package service

import (
	"context"
	"errors"
	"regexp"
	"strings"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrPlanModuleNotFound  = errors.New("plan module not found")
	ErrPlanTaskNotFound    = errors.New("plan task not found")
	ErrPlanInvalidInput    = errors.New("invalid plan input")
	ErrPlanModuleKeyExists = errors.New("plan module key exists")
	ErrPlanAlreadySeeded   = errors.New("plan already seeded")
	ErrPlanSeedUnavailable = errors.New("plan seed unavailable")
)

const defaultWBSBackfillModuleKey = "multi-region-edge"

// PlanModuleService 规划模块服务接口
type PlanModuleService interface {
	ListModules(ctx context.Context, userID, workspaceID uuid.UUID) ([]entity.PlanModule, error)
	CreateModule(ctx context.Context, userID uuid.UUID, req CreatePlanModuleRequest) (*entity.PlanModule, error)
	UpdateModule(ctx context.Context, userID, moduleID uuid.UUID, req UpdatePlanModuleRequest) (*entity.PlanModule, error)
	DeleteModule(ctx context.Context, userID, moduleID uuid.UUID) error
	CreateTask(ctx context.Context, userID, moduleID uuid.UUID, req CreatePlanTaskRequest) (*entity.PlanTask, error)
	UpdateTask(ctx context.Context, userID, taskID uuid.UUID, req UpdatePlanTaskRequest) (*entity.PlanTask, error)
	DeleteTask(ctx context.Context, userID, taskID uuid.UUID) error
	ReorderTasks(ctx context.Context, userID, moduleID uuid.UUID, taskIDs []uuid.UUID) error
	SeedModules(ctx context.Context, userID, workspaceID uuid.UUID) ([]entity.PlanModule, error)
}

// CreatePlanModuleRequest 创建规划模块请求
type CreatePlanModuleRequest struct {
	WorkspaceID uuid.UUID
	Key         *string
	Name        string
	Description *string
	Version     *string
	Status      *string
	SortOrder   *int
}

// UpdatePlanModuleRequest 更新规划模块请求
type UpdatePlanModuleRequest struct {
	Key         *string
	Name        *string
	Description *string
	Version     *string
	Status      *string
	SortOrder   *int
}

// CreatePlanTaskRequest 创建规划任务请求
type CreatePlanTaskRequest struct {
	Code         *string
	Title        string
	Phase        *string
	Owner        *string
	Deliverable  *string
	Acceptance   *string
	EstimateDays *int
	Status       *string
	Dependencies []string
	Sequence     *int
}

// UpdatePlanTaskRequest 更新规划任务请求
type UpdatePlanTaskRequest struct {
	Code         *string
	Title        *string
	Phase        *string
	Owner        *string
	Deliverable  *string
	Acceptance   *string
	EstimateDays *int
	Status       *string
	Dependencies *[]string
	Sequence     *int
}

type planModuleService struct {
	moduleRepo     repository.PlanModuleRepository
	taskRepo       repository.PlanTaskRepository
	workspaceSvc   WorkspaceService
	planWBSService PlanWBSService
}

// NewPlanModuleService 创建规划模块服务实例
func NewPlanModuleService(
	moduleRepo repository.PlanModuleRepository,
	taskRepo repository.PlanTaskRepository,
	workspaceSvc WorkspaceService,
	planWBSService PlanWBSService,
) PlanModuleService {
	return &planModuleService{
		moduleRepo:     moduleRepo,
		taskRepo:       taskRepo,
		workspaceSvc:   workspaceSvc,
		planWBSService: planWBSService,
	}
}

func (s *planModuleService) ListModules(ctx context.Context, userID, workspaceID uuid.UUID) ([]entity.PlanModule, error) {
	if err := ensurePlanView(ctx, s.workspaceSvc, workspaceID, userID); err != nil {
		return nil, err
	}
	modules, err := s.moduleRepo.ListByWorkspaceWithTasks(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	updated, err := s.backfillWBSModule(ctx, userID, workspaceID, modules, defaultWBSBackfillModuleKey)
	if err != nil {
		if errors.Is(err, ErrWorkspaceUnauthorized) {
			return modules, nil
		}
		return nil, err
	}
	return updated, nil
}

func (s *planModuleService) CreateModule(ctx context.Context, userID uuid.UUID, req CreatePlanModuleRequest) (*entity.PlanModule, error) {
	if err := ensurePlanManage(ctx, s.workspaceSvc, req.WorkspaceID, userID); err != nil {
		return nil, err
	}
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return nil, ErrPlanInvalidInput
	}

	key, err := normalizePlanKey(req.Key)
	if err != nil {
		return nil, err
	}
	if key != "" {
		if existing, err := s.moduleRepo.GetByWorkspaceAndKey(ctx, req.WorkspaceID, key); err == nil && existing != nil {
			return nil, ErrPlanModuleKeyExists
		} else if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
	}

	module := &entity.PlanModule{
		WorkspaceID: req.WorkspaceID,
		Key:         key,
		Name:        name,
		Description: trimPtr(req.Description),
	}
	if req.Version != nil && strings.TrimSpace(*req.Version) != "" {
		module.Version = strings.TrimSpace(*req.Version)
	}
	if req.Status != nil && strings.TrimSpace(*req.Status) != "" {
		module.Status = strings.TrimSpace(*req.Status)
	}
	if req.SortOrder != nil {
		module.SortOrder = *req.SortOrder
	}

	if err := s.moduleRepo.Create(ctx, module); err != nil {
		return nil, err
	}
	return module, nil
}

func (s *planModuleService) UpdateModule(ctx context.Context, userID, moduleID uuid.UUID, req UpdatePlanModuleRequest) (*entity.PlanModule, error) {
	module, err := s.moduleRepo.GetByID(ctx, moduleID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPlanModuleNotFound
		}
		return nil, err
	}
	if err := ensurePlanManage(ctx, s.workspaceSvc, module.WorkspaceID, userID); err != nil {
		return nil, err
	}

	if req.Name != nil {
		name := strings.TrimSpace(*req.Name)
		if name == "" {
			return nil, ErrPlanInvalidInput
		}
		module.Name = name
	}
	if req.Key != nil {
		key, err := normalizePlanKey(req.Key)
		if err != nil {
			return nil, err
		}
		if key != "" {
			existing, err := s.moduleRepo.GetByWorkspaceAndKey(ctx, module.WorkspaceID, key)
			if err == nil && existing != nil && existing.ID != module.ID {
				return nil, ErrPlanModuleKeyExists
			}
			if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, err
			}
		}
		module.Key = key
	}
	if req.Description != nil {
		module.Description = trimPtr(req.Description)
	}
	if req.Version != nil && strings.TrimSpace(*req.Version) != "" {
		module.Version = strings.TrimSpace(*req.Version)
	}
	if req.Status != nil && strings.TrimSpace(*req.Status) != "" {
		module.Status = strings.TrimSpace(*req.Status)
	}
	if req.SortOrder != nil {
		module.SortOrder = *req.SortOrder
	}

	if err := s.moduleRepo.Update(ctx, module); err != nil {
		return nil, err
	}
	return module, nil
}

func (s *planModuleService) DeleteModule(ctx context.Context, userID, moduleID uuid.UUID) error {
	module, err := s.moduleRepo.GetByID(ctx, moduleID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrPlanModuleNotFound
		}
		return err
	}
	if err := ensurePlanManage(ctx, s.workspaceSvc, module.WorkspaceID, userID); err != nil {
		return err
	}
	return s.moduleRepo.Delete(ctx, moduleID)
}

func (s *planModuleService) CreateTask(ctx context.Context, userID, moduleID uuid.UUID, req CreatePlanTaskRequest) (*entity.PlanTask, error) {
	module, err := s.moduleRepo.GetByID(ctx, moduleID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPlanModuleNotFound
		}
		return nil, err
	}
	if err := ensurePlanManage(ctx, s.workspaceSvc, module.WorkspaceID, userID); err != nil {
		return nil, err
	}

	title := strings.TrimSpace(req.Title)
	if title == "" {
		return nil, ErrPlanInvalidInput
	}

	sequence := 0
	if req.Sequence != nil {
		sequence = *req.Sequence
	} else {
		maxSeq, err := s.taskRepo.GetMaxSequence(ctx, moduleID)
		if err != nil {
			return nil, err
		}
		sequence = maxSeq + 1
	}

	status, err := normalizePlanStatus(req.Status, "todo")
	if err != nil {
		return nil, err
	}
	code, err := normalizePlanCode(req.Code)
	if err != nil {
		return nil, err
	}

	task := &entity.PlanTask{
		ModuleID:     moduleID,
		Code:         code,
		Title:        title,
		Phase:        trimValue(req.Phase),
		Owner:        trimValue(req.Owner),
		Deliverable:  trimValue(req.Deliverable),
		Acceptance:   trimValue(req.Acceptance),
		EstimateDays: normalizeEstimate(req.EstimateDays),
		Status:       status,
		Dependencies: sanitizeDependencies(req.Dependencies),
		Sequence:     sequence,
	}

	if err := s.taskRepo.Create(ctx, task); err != nil {
		return nil, err
	}
	return task, nil
}

func (s *planModuleService) UpdateTask(ctx context.Context, userID, taskID uuid.UUID, req UpdatePlanTaskRequest) (*entity.PlanTask, error) {
	task, err := s.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPlanTaskNotFound
		}
		return nil, err
	}
	module, err := s.moduleRepo.GetByID(ctx, task.ModuleID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPlanModuleNotFound
		}
		return nil, err
	}
	if err := ensurePlanManage(ctx, s.workspaceSvc, module.WorkspaceID, userID); err != nil {
		return nil, err
	}

	if req.Code != nil {
		code, err := normalizePlanCode(req.Code)
		if err != nil {
			return nil, err
		}
		task.Code = code
	}
	if req.Title != nil {
		title := strings.TrimSpace(*req.Title)
		if title == "" {
			return nil, ErrPlanInvalidInput
		}
		task.Title = title
	}
	if req.Phase != nil {
		task.Phase = trimValue(req.Phase)
	}
	if req.Owner != nil {
		task.Owner = trimValue(req.Owner)
	}
	if req.Deliverable != nil {
		task.Deliverable = trimValue(req.Deliverable)
	}
	if req.Acceptance != nil {
		task.Acceptance = trimValue(req.Acceptance)
	}
	if req.EstimateDays != nil {
		task.EstimateDays = normalizeEstimate(req.EstimateDays)
	}
	if req.Status != nil {
		status, err := normalizePlanStatus(req.Status, task.Status)
		if err != nil {
			return nil, err
		}
		task.Status = status
	}
	if req.Dependencies != nil {
		task.Dependencies = sanitizeDependencies(*req.Dependencies)
	}
	if req.Sequence != nil {
		task.Sequence = *req.Sequence
	}

	if err := s.taskRepo.Update(ctx, task); err != nil {
		return nil, err
	}
	return task, nil
}

func (s *planModuleService) DeleteTask(ctx context.Context, userID, taskID uuid.UUID) error {
	task, err := s.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrPlanTaskNotFound
		}
		return err
	}
	module, err := s.moduleRepo.GetByID(ctx, task.ModuleID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrPlanModuleNotFound
		}
		return err
	}
	if err := ensurePlanManage(ctx, s.workspaceSvc, module.WorkspaceID, userID); err != nil {
		return err
	}
	return s.taskRepo.Delete(ctx, taskID)
}

func (s *planModuleService) ReorderTasks(ctx context.Context, userID, moduleID uuid.UUID, taskIDs []uuid.UUID) error {
	module, err := s.moduleRepo.GetByID(ctx, moduleID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrPlanModuleNotFound
		}
		return err
	}
	if err := ensurePlanManage(ctx, s.workspaceSvc, module.WorkspaceID, userID); err != nil {
		return err
	}
	return s.taskRepo.UpdateSequences(ctx, moduleID, taskIDs)
}

func (s *planModuleService) SeedModules(ctx context.Context, userID, workspaceID uuid.UUID) ([]entity.PlanModule, error) {
	if err := ensurePlanManage(ctx, s.workspaceSvc, workspaceID, userID); err != nil {
		return nil, err
	}
	existing, err := s.moduleRepo.ListByWorkspaceWithTasks(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	if len(existing) > 0 {
		return nil, ErrPlanAlreadySeeded
	}
	if s.planWBSService == nil {
		return nil, ErrPlanSeedUnavailable
	}

	defaultModules := s.planWBSService.ListModules(ctx)
	if len(defaultModules) == 0 {
		return nil, ErrPlanSeedUnavailable
	}

	for idx, module := range defaultModules {
		record := &entity.PlanModule{
			WorkspaceID: workspaceID,
			Key:         strings.TrimSpace(module.Key),
			Name:        module.Name,
			Version:     module.Version,
			Status:      "active",
			SortOrder:   idx + 1,
		}
		if err := s.moduleRepo.Create(ctx, record); err != nil {
			return nil, err
		}

		for _, task := range module.Tasks {
			taskRecord := &entity.PlanTask{
				ModuleID:     record.ID,
				Code:         strings.TrimSpace(task.ID),
				Title:        strings.TrimSpace(task.Title),
				Phase:        strings.TrimSpace(task.Phase),
				Owner:        strings.TrimSpace(task.Owner),
				Deliverable:  strings.TrimSpace(task.Deliverable),
				Acceptance:   strings.TrimSpace(task.Acceptance),
				EstimateDays: task.EstimateDays,
				Status:       "todo",
				Dependencies: sanitizeDependencies(task.Dependencies),
				Sequence:     task.Sequence,
			}
			if taskRecord.Title == "" {
				continue
			}
			if err := s.taskRepo.Create(ctx, taskRecord); err != nil {
				return nil, err
			}
		}
	}

	return s.moduleRepo.ListByWorkspaceWithTasks(ctx, workspaceID)
}

func (s *planModuleService) backfillWBSModule(
	ctx context.Context,
	userID uuid.UUID,
	workspaceID uuid.UUID,
	modules []entity.PlanModule,
	moduleKey string,
) ([]entity.PlanModule, error) {
	if s == nil || s.planWBSService == nil {
		return modules, nil
	}
	if len(modules) == 0 {
		return modules, nil
	}
	normalizedKey := normalizeWBSModuleKey(moduleKey)
	if normalizedKey == "" {
		return modules, nil
	}

	maxSortOrder := 0
	var target *entity.PlanModule
	for idx := range modules {
		module := &modules[idx]
		if module.SortOrder > maxSortOrder {
			maxSortOrder = module.SortOrder
		}
		if normalizeWBSModuleKey(module.Key) == normalizedKey {
			target = module
			break
		}
	}

	var wbsModule *WBSModule
	if target == nil || len(target.Tasks) == 0 {
		module, err := s.planWBSService.GetModule(ctx, normalizedKey)
		if err != nil {
			if err == ErrWBSModuleNotFound {
				return modules, nil
			}
			return modules, err
		}
		wbsModule = module
	}

	if target == nil && wbsModule != nil {
		nameKey := normalizeModuleName(wbsModule.Name)
		if nameKey != "" {
			for idx := range modules {
				if normalizeModuleName(modules[idx].Name) == nameKey {
					target = &modules[idx]
					break
				}
			}
		}
	}

	if target == nil && wbsModule != nil {
		if err := ensurePlanManage(ctx, s.workspaceSvc, workspaceID, userID); err != nil {
			return modules, err
		}
		newModule := &entity.PlanModule{
			WorkspaceID: workspaceID,
			Key:         normalizedKey,
			Name:        wbsModule.Name,
			Version:     wbsModule.Version,
			Status:      "active",
			SortOrder:   maxSortOrder + 1,
		}
		if err := s.moduleRepo.Create(ctx, newModule); err != nil {
			return modules, err
		}
		tasks, err := s.createModuleTasks(ctx, newModule.ID, wbsModule.Tasks)
		if err != nil {
			return modules, err
		}
		newModule.Tasks = tasks
		modules = append(modules, *newModule)
		return modules, nil
	}

	if target != nil && len(target.Tasks) == 0 && wbsModule != nil {
		if err := ensurePlanManage(ctx, s.workspaceSvc, workspaceID, userID); err != nil {
			return modules, err
		}
		tasks, err := s.createModuleTasks(ctx, target.ID, wbsModule.Tasks)
		if err != nil {
			return modules, err
		}
		if len(tasks) > 0 {
			target.Tasks = append(target.Tasks, tasks...)
		}
	}

	return modules, nil
}

func (s *planModuleService) createModuleTasks(ctx context.Context, moduleID uuid.UUID, tasks []WBSTask) ([]entity.PlanTask, error) {
	if len(tasks) == 0 {
		return nil, nil
	}
	created := make([]entity.PlanTask, 0, len(tasks))
	for _, task := range tasks {
		title := strings.TrimSpace(task.Title)
		if title == "" {
			continue
		}
		record := &entity.PlanTask{
			ModuleID:     moduleID,
			Code:         strings.TrimSpace(task.ID),
			Title:        title,
			Phase:        strings.TrimSpace(task.Phase),
			Owner:        strings.TrimSpace(task.Owner),
			Deliverable:  strings.TrimSpace(task.Deliverable),
			Acceptance:   strings.TrimSpace(task.Acceptance),
			EstimateDays: task.EstimateDays,
			Status:       "todo",
			Dependencies: sanitizeDependencies(task.Dependencies),
			Sequence:     task.Sequence,
		}
		if err := s.taskRepo.Create(ctx, record); err != nil {
			return created, err
		}
		created = append(created, *record)
	}
	return created, nil
}

func normalizePlanKey(key *string) (string, error) {
	if key == nil {
		return "", nil
	}
	trimmed := strings.TrimSpace(*key)
	if trimmed == "" {
		return "", nil
	}
	normalized := strings.ToLower(trimmed)
	normalized = strings.ReplaceAll(normalized, " ", "-")
	reg := regexp.MustCompile("[^a-z0-9-]")
	normalized = reg.ReplaceAllString(normalized, "")
	reg = regexp.MustCompile("-+")
	normalized = reg.ReplaceAllString(normalized, "-")
	normalized = strings.Trim(normalized, "-")
	if normalized == "" {
		return "", ErrPlanInvalidInput
	}
	return normalized, nil
}

func normalizePlanStatus(status *string, fallback string) (string, error) {
	if status == nil {
		return fallback, nil
	}
	trimmed := strings.TrimSpace(*status)
	if trimmed == "" {
		return fallback, nil
	}
	switch trimmed {
	case "todo", "in_progress", "blocked", "done":
		return trimmed, nil
	default:
		return "", ErrPlanInvalidInput
	}
}

func normalizePlanCode(code *string) (string, error) {
	if code == nil {
		return "", nil
	}
	trimmed := strings.TrimSpace(*code)
	if trimmed == "" {
		return "", nil
	}
	normalized := strings.ToLower(trimmed)
	normalized = strings.ReplaceAll(normalized, " ", "-")
	reg := regexp.MustCompile("[^a-z0-9-]")
	normalized = reg.ReplaceAllString(normalized, "")
	reg = regexp.MustCompile("-+")
	normalized = reg.ReplaceAllString(normalized, "-")
	normalized = strings.Trim(normalized, "-")
	if normalized == "" {
		return "", ErrPlanInvalidInput
	}
	return normalized, nil
}

func normalizeEstimate(value *int) int {
	if value == nil {
		return 0
	}
	if *value < 0 {
		return 0
	}
	return *value
}

func sanitizeDependencies(values []string) entity.StringArray {
	if len(values) == 0 {
		return entity.StringArray{}
	}
	output := make([]string, 0, len(values))
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			continue
		}
		output = append(output, trimmed)
	}
	return entity.StringArray(output)
}

func trimPtr(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func trimValue(value *string) string {
	if value == nil {
		return ""
	}
	return strings.TrimSpace(*value)
}

func normalizeModuleName(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}
