package service

import (
	"context"
	"errors"
	"reflect"

	"github.com/agentflow/server/internal/domain/entity"
	"github.com/agentflow/server/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrVersionNotFound = errors.New("version not found")
)

// WorkflowVersionService 工作流版本服务接口
type WorkflowVersionService interface {
	// 创建版本（自动在工作流更新时调用）
	CreateVersion(ctx context.Context, workflow *entity.Workflow, userID uuid.UUID, changeLog string, changeType string) (*entity.WorkflowVersion, error)

	// 获取版本列表
	List(ctx context.Context, workflowID uuid.UUID, userID uuid.UUID, params repository.VersionListParams) ([]entity.WorkflowVersion, int64, error)

	// 获取指定版本
	GetVersion(ctx context.Context, workflowID uuid.UUID, version int, userID uuid.UUID) (*entity.WorkflowVersion, error)

	// 恢复到指定版本
	RestoreVersion(ctx context.Context, workflowID uuid.UUID, version int, userID uuid.UUID, changeLog string) (*entity.Workflow, error)

	// 对比两个版本
	CompareVersions(ctx context.Context, workflowID uuid.UUID, v1 int, v2 int, userID uuid.UUID) (*entity.VersionDiff, error)

	// 手动创建版本快照
	CreateSnapshot(ctx context.Context, workflowID uuid.UUID, userID uuid.UUID, changeLog string) (*entity.WorkflowVersion, error)
}

// VersionRetentionConfig 版本保留策略配置
type VersionRetentionConfig struct {
	MaxVersions   int  // 最大保留版本数，默认 50
	RetentionDays int  // 保留天数，默认 90
	AutoCleanup   bool // 是否自动清理
}

type workflowVersionService struct {
	versionRepo  repository.WorkflowVersionRepository
	workflowRepo repository.WorkflowRepository
	config       VersionRetentionConfig
}

// NewWorkflowVersionService 创建工作流版本服务实例
func NewWorkflowVersionService(versionRepo repository.WorkflowVersionRepository, workflowRepo repository.WorkflowRepository) WorkflowVersionService {
	return &workflowVersionService{
		versionRepo:  versionRepo,
		workflowRepo: workflowRepo,
		config: VersionRetentionConfig{
			MaxVersions:   50,
			RetentionDays: 90,
			AutoCleanup:   true,
		},
	}
}

func (s *workflowVersionService) CreateVersion(ctx context.Context, workflow *entity.Workflow, userID uuid.UUID, changeLog string, changeType string) (*entity.WorkflowVersion, error) {
	// 获取下一个版本号
	nextVersion, err := s.versionRepo.GetNextVersion(ctx, workflow.ID)
	if err != nil {
		return nil, err
	}

	version := &entity.WorkflowVersion{
		WorkflowID:  workflow.ID,
		Version:     nextVersion,
		Name:        workflow.Name,
		Description: workflow.Description,
		Definition:  workflow.Definition,
		Variables:   workflow.Variables,
		ChangeLog:   changeLog,
		ChangeType:  changeType,
		CreatedBy:   userID,
	}

	if err := s.versionRepo.Create(ctx, version); err != nil {
		return nil, err
	}

	// 自动清理旧版本
	if s.config.AutoCleanup && s.config.MaxVersions > 0 {
		_ = s.versionRepo.DeleteOldVersions(ctx, workflow.ID, s.config.MaxVersions)
	}

	return version, nil
}

func (s *workflowVersionService) List(ctx context.Context, workflowID uuid.UUID, userID uuid.UUID, params repository.VersionListParams) ([]entity.WorkflowVersion, int64, error) {
	// 验证工作流存在且用户有权限访问
	workflow, err := s.workflowRepo.GetByID(ctx, workflowID)
	if err != nil {
		return nil, 0, ErrWorkflowNotFound
	}
	if workflow.UserID != userID {
		return nil, 0, ErrUnauthorized
	}

	return s.versionRepo.List(ctx, workflowID, params)
}

func (s *workflowVersionService) GetVersion(ctx context.Context, workflowID uuid.UUID, version int, userID uuid.UUID) (*entity.WorkflowVersion, error) {
	// 验证工作流存在且用户有权限访问
	workflow, err := s.workflowRepo.GetByID(ctx, workflowID)
	if err != nil {
		return nil, ErrWorkflowNotFound
	}
	if workflow.UserID != userID {
		return nil, ErrUnauthorized
	}

	v, err := s.versionRepo.GetByWorkflowAndVersion(ctx, workflowID, version)
	if err != nil {
		return nil, ErrVersionNotFound
	}

	return v, nil
}

func (s *workflowVersionService) RestoreVersion(ctx context.Context, workflowID uuid.UUID, version int, userID uuid.UUID, changeLog string) (*entity.Workflow, error) {
	// 获取工作流
	workflow, err := s.workflowRepo.GetByID(ctx, workflowID)
	if err != nil {
		return nil, ErrWorkflowNotFound
	}
	if workflow.UserID != userID {
		return nil, ErrUnauthorized
	}

	// 获取要恢复的版本
	targetVersion, err := s.versionRepo.GetByWorkflowAndVersion(ctx, workflowID, version)
	if err != nil {
		return nil, ErrVersionNotFound
	}

	// 先保存当前版本
	if changeLog == "" {
		changeLog = "恢复前自动保存"
	}
	_, _ = s.CreateVersion(ctx, workflow, userID, changeLog, "restore")

	// 恢复工作流
	workflow.Name = targetVersion.Name
	workflow.Description = targetVersion.Description
	workflow.Definition = targetVersion.Definition
	workflow.Variables = targetVersion.Variables
	workflow.Version++

	if err := s.workflowRepo.Update(ctx, workflow); err != nil {
		return nil, err
	}

	// 创建恢复版本记录
	restoreLog := "恢复到版本 " + string(rune(version+'0'))
	if changeLog != "" && changeLog != "恢复前自动保存" {
		restoreLog = changeLog
	}
	_, _ = s.CreateVersion(ctx, workflow, userID, restoreLog, "restore")

	return workflow, nil
}

func (s *workflowVersionService) CompareVersions(ctx context.Context, workflowID uuid.UUID, v1 int, v2 int, userID uuid.UUID) (*entity.VersionDiff, error) {
	// 验证工作流存在且用户有权限访问
	workflow, err := s.workflowRepo.GetByID(ctx, workflowID)
	if err != nil {
		return nil, ErrWorkflowNotFound
	}
	if workflow.UserID != userID {
		return nil, ErrUnauthorized
	}

	// 获取两个版本
	version1, err := s.versionRepo.GetByWorkflowAndVersion(ctx, workflowID, v1)
	if err != nil {
		return nil, ErrVersionNotFound
	}

	version2, err := s.versionRepo.GetByWorkflowAndVersion(ctx, workflowID, v2)
	if err != nil {
		return nil, ErrVersionNotFound
	}

	// 计算差异
	diff := s.calculateDiff(version1, version2)
	diff.V1 = v1
	diff.V2 = v2

	return diff, nil
}

func (s *workflowVersionService) CreateSnapshot(ctx context.Context, workflowID uuid.UUID, userID uuid.UUID, changeLog string) (*entity.WorkflowVersion, error) {
	// 获取工作流
	workflow, err := s.workflowRepo.GetByID(ctx, workflowID)
	if err != nil {
		return nil, ErrWorkflowNotFound
	}
	if workflow.UserID != userID {
		return nil, ErrUnauthorized
	}

	if changeLog == "" {
		changeLog = "手动创建快照"
	}

	return s.CreateVersion(ctx, workflow, userID, changeLog, "manual")
}

// calculateDiff 计算两个版本的差异
func (s *workflowVersionService) calculateDiff(v1, v2 *entity.WorkflowVersion) *entity.VersionDiff {
	diff := &entity.VersionDiff{
		NodesAdded:       []map[string]interface{}{},
		NodesRemoved:     []map[string]interface{}{},
		NodesModified:    []entity.NodeModification{},
		EdgesAdded:       []map[string]interface{}{},
		EdgesRemoved:     []map[string]interface{}{},
		VariablesChanged: map[string]interface{}{},
	}

	// 获取节点
	nodes1 := s.getNodes(v1.Definition)
	nodes2 := s.getNodes(v2.Definition)

	// 建立节点ID映射
	nodesMap1 := make(map[string]map[string]interface{})
	nodesMap2 := make(map[string]map[string]interface{})

	for _, node := range nodes1 {
		if id, ok := node["id"].(string); ok {
			nodesMap1[id] = node
		}
	}
	for _, node := range nodes2 {
		if id, ok := node["id"].(string); ok {
			nodesMap2[id] = node
		}
	}

	// 查找新增和修改的节点
	for id, node2 := range nodesMap2 {
		if node1, exists := nodesMap1[id]; exists {
			// 检查是否修改
			if !reflect.DeepEqual(node1, node2) {
				modification := entity.NodeModification{
					NodeID:  id,
					Before:  node1,
					After:   node2,
					Changes: s.findChangedFields(node1, node2),
				}
				diff.NodesModified = append(diff.NodesModified, modification)
			}
		} else {
			// 新增
			diff.NodesAdded = append(diff.NodesAdded, node2)
		}
	}

	// 查找删除的节点
	for id, node1 := range nodesMap1 {
		if _, exists := nodesMap2[id]; !exists {
			diff.NodesRemoved = append(diff.NodesRemoved, node1)
		}
	}

	// 获取边
	edges1 := s.getEdges(v1.Definition)
	edges2 := s.getEdges(v2.Definition)

	edgesMap1 := make(map[string]map[string]interface{})
	edgesMap2 := make(map[string]map[string]interface{})

	for _, edge := range edges1 {
		if id, ok := edge["id"].(string); ok {
			edgesMap1[id] = edge
		}
	}
	for _, edge := range edges2 {
		if id, ok := edge["id"].(string); ok {
			edgesMap2[id] = edge
		}
	}

	// 查找新增的边
	for id, edge2 := range edgesMap2 {
		if _, exists := edgesMap1[id]; !exists {
			diff.EdgesAdded = append(diff.EdgesAdded, edge2)
		}
	}

	// 查找删除的边
	for id, edge1 := range edgesMap1 {
		if _, exists := edgesMap2[id]; !exists {
			diff.EdgesRemoved = append(diff.EdgesRemoved, edge1)
		}
	}

	// 比较变量
	if !reflect.DeepEqual(v1.Variables, v2.Variables) {
		diff.VariablesChanged = map[string]interface{}{
			"before": v1.Variables,
			"after":  v2.Variables,
		}
	}

	// 计算摘要
	diff.Summary = entity.DiffSummary{
		NodesChangeCount: len(diff.NodesAdded) + len(diff.NodesRemoved) + len(diff.NodesModified),
		EdgesChangeCount: len(diff.EdgesAdded) + len(diff.EdgesRemoved),
	}
	diff.Summary.TotalChanges = diff.Summary.NodesChangeCount + diff.Summary.EdgesChangeCount
	if len(diff.VariablesChanged) > 0 {
		diff.Summary.TotalChanges++
	}

	return diff
}

func (s *workflowVersionService) getNodes(definition entity.JSON) []map[string]interface{} {
	if definition == nil {
		return nil
	}
	if nodes, ok := definition["nodes"].([]interface{}); ok {
		result := make([]map[string]interface{}, 0, len(nodes))
		for _, node := range nodes {
			if n, ok := node.(map[string]interface{}); ok {
				result = append(result, n)
			}
		}
		return result
	}
	return nil
}

func (s *workflowVersionService) getEdges(definition entity.JSON) []map[string]interface{} {
	if definition == nil {
		return nil
	}
	if edges, ok := definition["edges"].([]interface{}); ok {
		result := make([]map[string]interface{}, 0, len(edges))
		for _, edge := range edges {
			if e, ok := edge.(map[string]interface{}); ok {
				result = append(result, e)
			}
		}
		return result
	}
	return nil
}

func (s *workflowVersionService) findChangedFields(before, after map[string]interface{}) []string {
	changes := []string{}
	allKeys := make(map[string]bool)

	for k := range before {
		allKeys[k] = true
	}
	for k := range after {
		allKeys[k] = true
	}

	for key := range allKeys {
		v1, ok1 := before[key]
		v2, ok2 := after[key]

		if ok1 != ok2 || !reflect.DeepEqual(v1, v2) {
			changes = append(changes, key)
		}
	}

	return changes
}
