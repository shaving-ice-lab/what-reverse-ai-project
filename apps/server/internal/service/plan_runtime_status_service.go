package service

import (
	"context"
	"errors"
)

// RuntimeStatusItem 运行时状态枚举项
type RuntimeStatusItem struct {
	Key         string `json:"key"`
	Title       string `json:"title"`
	Description string `json:"description"`
	IsTerminal  bool   `json:"is_terminal"`
}

// RuntimeStatusTable 运行时状态枚举表
type RuntimeStatusTable struct {
	Key      string              `json:"key"`
	Title    string              `json:"title"`
	Statuses []RuntimeStatusItem `json:"statuses"`
	Notes    []string            `json:"notes,omitempty"`
}

// PlanRuntimeStatusService 运行时状态规划服务接口
type PlanRuntimeStatusService interface {
	GetStatusTable(ctx context.Context) (*RuntimeStatusTable, error)
}

type planRuntimeStatusService struct {
	table RuntimeStatusTable
}

// ErrRuntimeStatusTableNotFound 运行时状态表不存在
var ErrRuntimeStatusTableNotFound = errors.New("runtime status table not found")

// NewPlanRuntimeStatusService 创建运行时状态规划服务
func NewPlanRuntimeStatusService() PlanRuntimeStatusService {
	return &planRuntimeStatusService{
		table: defaultRuntimeStatusTable(),
	}
}

func (s *planRuntimeStatusService) GetStatusTable(ctx context.Context) (*RuntimeStatusTable, error) {
	if s == nil || s.table.Key == "" {
		return nil, ErrRuntimeStatusTableNotFound
	}
	output := s.table
	return &output, nil
}

func defaultRuntimeStatusTable() RuntimeStatusTable {
	return RuntimeStatusTable{
		Key:   "runtime_status_enum",
		Title: "运行时状态枚举表",
		Statuses: []RuntimeStatusItem{
			{
				Key:         ExecutionStatusPending,
				Title:       "待执行",
				Description: "已创建等待调度",
				IsTerminal:  false,
			},
			{
				Key:         ExecutionStatusRunning,
				Title:       "执行中",
				Description: "执行引擎正在处理",
				IsTerminal:  false,
			},
			{
				Key:         ExecutionStatusCompleted,
				Title:       "已完成",
				Description: "执行成功完成",
				IsTerminal:  true,
			},
			{
				Key:         ExecutionStatusFailed,
				Title:       "已失败",
				Description: "执行失败并终止",
				IsTerminal:  true,
			},
			{
				Key:         ExecutionStatusCancelled,
				Title:       "已取消",
				Description: "执行被取消或中止",
				IsTerminal:  true,
			},
		},
		Notes: []string{
			"状态值与执行服务状态保持一致。",
			"终态：completed / failed / cancelled。",
		},
	}
}
