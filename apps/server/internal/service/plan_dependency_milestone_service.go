package service

import (
	"context"
	"errors"
)

// DependencyEdge 依赖关系边
type DependencyEdge struct {
	From      string `json:"from"`
	To        string `json:"to"`
	FromLabel string `json:"from_label,omitempty"`
	ToLabel   string `json:"to_label,omitempty"`
	Type      string `json:"type"`
	Rationale string `json:"rationale,omitempty"`
}

// DependencyMatrix 依赖矩阵
type DependencyMatrix struct {
	Key   string           `json:"key"`
	Title string           `json:"title"`
	Edges []DependencyEdge `json:"edges"`
	Notes []string         `json:"notes,omitempty"`
}

// Milestone 节点定义
type Milestone struct {
	Key         string   `json:"key"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Sequence    int      `json:"sequence"`
	DependsOn   []string `json:"depends_on,omitempty"`
	Status      string   `json:"status"`
	Target      string   `json:"target,omitempty"`
}

// MilestoneTimeline 里程碑时间线
type MilestoneTimeline struct {
	Key        string      `json:"key"`
	Title      string      `json:"title"`
	Milestones []Milestone `json:"milestones"`
	Notes      []string    `json:"notes,omitempty"`
}

// DependencyMilestonePlan 依赖与里程碑计划
type DependencyMilestonePlan struct {
	Key              string            `json:"key"`
	Title            string            `json:"title"`
	DependencyMatrix DependencyMatrix  `json:"dependency_matrix"`
	Milestones       MilestoneTimeline `json:"milestones"`
}

// PlanDependencyMilestoneService 依赖与里程碑规划服务接口
type PlanDependencyMilestoneService interface {
	GetPlan(ctx context.Context) (*DependencyMilestonePlan, error)
}

type planDependencyMilestoneService struct {
	planWBSService PlanWBSService
}

// ErrDependencyMilestonePlanNotFound 依赖与里程碑计划不存在
var ErrDependencyMilestonePlanNotFound = errors.New("dependency milestone plan not found")

// NewPlanDependencyMilestoneService 创建依赖与里程碑规划服务
func NewPlanDependencyMilestoneService(planWBSService PlanWBSService) PlanDependencyMilestoneService {
	return &planDependencyMilestoneService{planWBSService: planWBSService}
}

func (s *planDependencyMilestoneService) GetPlan(ctx context.Context) (*DependencyMilestonePlan, error) {
	if s == nil || s.planWBSService == nil {
		return nil, ErrDependencyMilestonePlanNotFound
	}
	modules := s.planWBSService.ListModules(ctx)
	if len(modules) == 0 {
		return nil, ErrDependencyMilestonePlanNotFound
	}
	moduleNames := map[string]string{}
	for _, module := range modules {
		if module.Key == "" {
			continue
		}
		moduleNames[module.Key] = module.Name
	}

	resolveName := func(key string) string {
		if name, ok := moduleNames[key]; ok && name != "" {
			return name
		}
		return key
	}

	matrix := DependencyMatrix{
		Key:   "module_dependency_matrix",
		Title: "模块依赖矩阵",
		Edges: []DependencyEdge{
			{
				From:      "workspace",
				To:        "app",
				FromLabel: resolveName("workspace"),
				ToLabel:   resolveName("app"),
				Type:      "module",
				Rationale: "App 依赖 Workspace 的基础数据与权限模型",
			},
			{
				From:      "app",
				To:        "runtime",
				FromLabel: resolveName("app"),
				ToLabel:   resolveName("runtime"),
				Type:      "module",
				Rationale: "Runtime 依赖 App 的发布与访问策略",
			},
		},
		Notes: []string{
			"依赖关系用于排期与风险评估，需与实际版本规划同步。",
		},
	}

	milestones := MilestoneTimeline{
		Key:   "module_milestones",
		Title: "模块里程碑与时间线",
		Milestones: []Milestone{
			{
				Key:         "workspace_ready",
				Title:       "Workspace 基础可用",
				Description: "完成 Workspace 模型、权限与关键 API",
				Sequence:    1,
				Status:      "planned",
				Target:      "TBD",
			},
			{
				Key:         "app_ready",
				Title:       "App 生命周期闭环",
				Description: "完成 Workspace 模型、版本管理与发布流程",
				Sequence:    2,
				DependsOn:   []string{"workspace_ready"},
				Status:      "planned",
				Target:      "TBD",
			},
			{
				Key:         "runtime_ready",
				Title:       "Runtime 执行链路",
				Description: "完成路由解析、执行链路与日志监控",
				Sequence:    3,
				DependsOn:   []string{"app_ready"},
				Status:      "planned",
				Target:      "TBD",
			},
		},
		Notes: []string{
			"时间线字段为占位，需要结合项目排期更新时间。",
		},
	}

	return &DependencyMilestonePlan{
		Key:              "dependency_milestone_plan",
		Title:            "依赖与里程碑表",
		DependencyMatrix: matrix,
		Milestones:       milestones,
	}, nil
}
