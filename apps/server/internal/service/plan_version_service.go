package service

import (
	"context"
	"errors"
	"strconv"
	"strings"
	"time"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrPlanVersionNotFound = errors.New("plan version not found")
)

// PlanVersionService 规划版本服务接口
type PlanVersionService interface {
	ListVersions(ctx context.Context, userID, workspaceID uuid.UUID, limit int) ([]entity.PlanVersion, error)
	CreateVersion(ctx context.Context, userID, workspaceID uuid.UUID, req CreatePlanVersionRequest) (*entity.PlanVersion, error)
	GetVersion(ctx context.Context, userID, versionID uuid.UUID) (*entity.PlanVersion, error)
	RestoreVersion(ctx context.Context, userID, versionID uuid.UUID) (*PlanRestoreResult, error)
}

// CreatePlanVersionRequest 创建版本请求
type CreatePlanVersionRequest struct {
	Label *string
	Note  *string
}

type planVersionService struct {
	versionRepo  repository.PlanVersionRepository
	moduleRepo   repository.PlanModuleRepository
	workspaceSvc WorkspaceService
}

// NewPlanVersionService 创建规划版本服务实例
func NewPlanVersionService(
	versionRepo repository.PlanVersionRepository,
	moduleRepo repository.PlanModuleRepository,
	workspaceSvc WorkspaceService,
) PlanVersionService {
	return &planVersionService{
		versionRepo:  versionRepo,
		moduleRepo:   moduleRepo,
		workspaceSvc: workspaceSvc,
	}
}

func (s *planVersionService) ListVersions(ctx context.Context, userID, workspaceID uuid.UUID, limit int) ([]entity.PlanVersion, error) {
	if err := ensurePlanView(ctx, s.workspaceSvc, workspaceID, userID); err != nil {
		return nil, err
	}
	return s.versionRepo.ListByWorkspace(ctx, workspaceID, limit)
}

func (s *planVersionService) CreateVersion(ctx context.Context, userID, workspaceID uuid.UUID, req CreatePlanVersionRequest) (*entity.PlanVersion, error) {
	if err := ensurePlanManage(ctx, s.workspaceSvc, workspaceID, userID); err != nil {
		return nil, err
	}
	modules, err := s.moduleRepo.ListByWorkspaceWithTasks(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	snapshot := buildPlanSnapshot(modules)
	label := trimPtr(req.Label)
	note := trimPtr(req.Note)

	version := &entity.PlanVersion{
		WorkspaceID: workspaceID,
		Label:       label,
		Note:        note,
		Snapshot:    snapshot,
		CreatedBy:   &userID,
		CreatedAt:   time.Now().UTC(),
	}
	if err := s.versionRepo.Create(ctx, version); err != nil {
		return nil, err
	}
	return version, nil
}

func (s *planVersionService) GetVersion(ctx context.Context, userID, versionID uuid.UUID) (*entity.PlanVersion, error) {
	version, err := s.versionRepo.GetByID(ctx, versionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPlanVersionNotFound
		}
		return nil, err
	}
	if err := ensurePlanView(ctx, s.workspaceSvc, version.WorkspaceID, userID); err != nil {
		return nil, err
	}
	return version, nil
}

// PlanRestoreResult 规划恢复结果
type PlanRestoreResult struct {
	Modules int `json:"modules"`
	Tasks   int `json:"tasks"`
}

func (s *planVersionService) RestoreVersion(ctx context.Context, userID, versionID uuid.UUID) (*PlanRestoreResult, error) {
	version, err := s.versionRepo.GetByID(ctx, versionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPlanVersionNotFound
		}
		return nil, err
	}
	if err := ensurePlanManage(ctx, s.workspaceSvc, version.WorkspaceID, userID); err != nil {
		return nil, err
	}

	currentModules, err := s.moduleRepo.ListByWorkspaceWithTasks(ctx, version.WorkspaceID)
	if err != nil {
		return nil, err
	}
	backupLabel := "自动备份：恢复前 " + time.Now().Format("2006-01-02 15:04")
	backupNote := "恢复目标版本: " + version.ID.String()
	backupVersion := &entity.PlanVersion{
		WorkspaceID: version.WorkspaceID,
		Label:       &backupLabel,
		Note:        &backupNote,
		Snapshot:    buildPlanSnapshot(currentModules),
		CreatedBy:   &userID,
		CreatedAt:   time.Now().UTC(),
	}
	if err := s.versionRepo.Create(ctx, backupVersion); err != nil {
		return nil, err
	}

	modules, tasks := parsePlanSnapshot(version.Snapshot)
	for i := range modules {
		modules[i].WorkspaceID = version.WorkspaceID
		for j := range modules[i].Tasks {
			modules[i].Tasks[j].ModuleID = modules[i].ID
		}
	}
	if err := s.moduleRepo.ReplaceWorkspaceModules(ctx, version.WorkspaceID, modules); err != nil {
		return nil, err
	}

	return &PlanRestoreResult{
		Modules: len(modules),
		Tasks:   tasks,
	}, nil
}

func buildPlanSnapshot(modules []entity.PlanModule) entity.JSON {
	moduleSnapshots := make([]map[string]interface{}, 0, len(modules))
	totalTasks := 0
	for _, module := range modules {
		taskSnapshots := make([]map[string]interface{}, 0, len(module.Tasks))
		for _, task := range module.Tasks {
			totalTasks += 1
			taskSnapshots = append(taskSnapshots, map[string]interface{}{
				"id":            task.ID,
				"code":          task.Code,
				"title":         task.Title,
				"phase":         task.Phase,
				"owner":         task.Owner,
				"deliverable":   task.Deliverable,
				"acceptance":    task.Acceptance,
				"estimate_days": task.EstimateDays,
				"status":        task.Status,
				"dependencies":  task.Dependencies,
				"sequence":      task.Sequence,
			})
		}
		moduleSnapshots = append(moduleSnapshots, map[string]interface{}{
			"id":          module.ID,
			"key":         module.Key,
			"name":        module.Name,
			"description": module.Description,
			"version":     module.Version,
			"status":      module.Status,
			"sort_order":  module.SortOrder,
			"tasks":       taskSnapshots,
		})
	}
	return entity.JSON{
		"captured_at":   time.Now().UTC().Format(time.RFC3339),
		"total_modules": len(moduleSnapshots),
		"total_tasks":   totalTasks,
		"modules":       moduleSnapshots,
	}
}

func parsePlanSnapshot(snapshot entity.JSON) ([]entity.PlanModule, int) {
	rawModules, ok := snapshot["modules"]
	if !ok || rawModules == nil {
		return []entity.PlanModule{}, 0
	}
	var moduleMaps []map[string]interface{}
	switch value := rawModules.(type) {
	case []map[string]interface{}:
		moduleMaps = value
	case []interface{}:
		for _, item := range value {
			if module, ok := item.(map[string]interface{}); ok {
				moduleMaps = append(moduleMaps, module)
			}
		}
	}

	modules := make([]entity.PlanModule, 0, len(moduleMaps))
	totalTasks := 0
	for index, module := range moduleMaps {
		moduleID := planParseUUID(planGetString(module["id"]))
		if moduleID == uuid.Nil {
			moduleID = uuid.New()
		}
		description := strings.TrimSpace(planGetString(module["description"]))
		var descriptionPtr *string
		if description != "" {
			descriptionPtr = &description
		}

		sortOrder := planGetInt(module["sort_order"])
		if sortOrder == 0 {
			sortOrder = index + 1
		}

		planModule := entity.PlanModule{
			ID:          moduleID,
			WorkspaceID: uuid.Nil,
			Key:         planGetString(module["key"]),
			Name:        planGetString(module["name"]),
			Description: descriptionPtr,
			Version:     planGetString(module["version"]),
			Status:      planGetString(module["status"]),
			SortOrder:   sortOrder,
		}

		rawTasks, ok := module["tasks"]
		if ok && rawTasks != nil {
			var taskMaps []map[string]interface{}
			switch tasksValue := rawTasks.(type) {
			case []map[string]interface{}:
				taskMaps = tasksValue
			case []interface{}:
				for _, taskItem := range tasksValue {
					if taskMap, ok := taskItem.(map[string]interface{}); ok {
						taskMaps = append(taskMaps, taskMap)
					}
				}
			}

			for idx, task := range taskMaps {
				taskID := planParseUUID(planGetString(task["id"]))
				if taskID == uuid.Nil {
					taskID = uuid.New()
				}
				status := planGetString(task["status"])
				if normalized, err := normalizePlanStatus(&status, "todo"); err == nil {
					status = normalized
				} else {
					status = "todo"
				}

				codeValue := planGetString(task["code"])
				code, err := normalizePlanCode(&codeValue)
				if err != nil {
					code = ""
				}

				sequence := planGetInt(task["sequence"])
				if sequence == 0 {
					sequence = idx + 1
				}

				planModule.Tasks = append(planModule.Tasks, entity.PlanTask{
					ID:           taskID,
					ModuleID:     moduleID,
					Code:         code,
					Title:        planGetString(task["title"]),
					Phase:        planGetString(task["phase"]),
					Owner:        planGetString(task["owner"]),
					Deliverable:  planGetString(task["deliverable"]),
					Acceptance:   planGetString(task["acceptance"]),
					EstimateDays: planGetInt(task["estimate_days"]),
					Status:       status,
					Dependencies: entity.StringArray(planGetStringSlice(task["dependencies"])),
					Sequence:     sequence,
				})
				totalTasks += 1
			}
		}

		modules = append(modules, planModule)
	}
	return modules, totalTasks
}

func planGetString(value interface{}) string {
	switch v := value.(type) {
	case string:
		return v
	case []byte:
		return string(v)
	default:
		return ""
	}
}

func planGetInt(value interface{}) int {
	switch v := value.(type) {
	case int:
		return v
	case int64:
		return int(v)
	case float64:
		return int(v)
	case float32:
		return int(v)
	case string:
		if parsed, err := strconv.Atoi(strings.TrimSpace(v)); err == nil {
			return parsed
		}
	}
	return 0
}

func planGetStringSlice(value interface{}) []string {
	switch v := value.(type) {
	case []string:
		return v
	case []interface{}:
		output := make([]string, 0, len(v))
		for _, item := range v {
			if str, ok := item.(string); ok {
				output = append(output, str)
			}
		}
		return output
	default:
		return []string{}
	}
}

func planParseUUID(value string) uuid.UUID {
	if strings.TrimSpace(value) == "" {
		return uuid.Nil
	}
	parsed, err := uuid.Parse(strings.TrimSpace(value))
	if err != nil {
		return uuid.Nil
	}
	return parsed
}
