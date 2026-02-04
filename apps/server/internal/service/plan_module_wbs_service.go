package service

import (
	"context"
	"errors"
)

// ModuleWBSBreakdown 模块级 WBS 细分
type ModuleWBSBreakdown struct {
	Key     string   `json:"key"`
	Name    string   `json:"name"`
	Version string   `json:"version"`
	Items   []string `json:"items"`
}

// ModuleWBSBreakdownList 模块级 WBS 细分列表
type ModuleWBSBreakdownList struct {
	Key     string               `json:"key"`
	Title   string               `json:"title"`
	Modules []ModuleWBSBreakdown `json:"modules"`
	Notes   []string             `json:"notes,omitempty"`
}

// PlanModuleWBSService 模块级 WBS 细分服务接口
type PlanModuleWBSService interface {
	GetBreakdown(ctx context.Context) (*ModuleWBSBreakdownList, error)
}

type planModuleWBSService struct {
	planWBSService PlanWBSService
}

// ErrModuleWBSNotFound 模块 WBS 不存在
var ErrModuleWBSNotFound = errors.New("module wbs not found")

// NewPlanModuleWBSService 创建模块级 WBS 细分服务
func NewPlanModuleWBSService(planWBSService PlanWBSService) PlanModuleWBSService {
	return &planModuleWBSService{planWBSService: planWBSService}
}

func (s *planModuleWBSService) GetBreakdown(ctx context.Context) (*ModuleWBSBreakdownList, error) {
	if s == nil || s.planWBSService == nil {
		return nil, ErrModuleWBSNotFound
	}
	modules := s.planWBSService.ListModules(ctx)
	if len(modules) == 0 {
		return nil, ErrModuleWBSNotFound
	}

	breakdowns := make([]ModuleWBSBreakdown, 0, len(modules))
	for _, module := range modules {
		items := make([]string, 0, len(module.Tasks))
		for _, task := range module.Tasks {
			if task.Title == "" {
				continue
			}
			items = append(items, task.Title)
		}
		breakdowns = append(breakdowns, ModuleWBSBreakdown{
			Key:     module.Key,
			Name:    module.Name,
			Version: module.Version,
			Items:   items,
		})
	}

	result := ModuleWBSBreakdownList{
		Key:     "module_wbs_breakdown",
		Title:   "模块级 WBS 细分（样例）",
		Modules: breakdowns,
		Notes: []string{
			"数据来源为 WBS 规划任务表，按任务标题输出模块级清单。",
		},
	}
	return &result, nil
}
