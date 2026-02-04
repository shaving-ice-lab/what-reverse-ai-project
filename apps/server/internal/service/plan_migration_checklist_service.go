package service

import (
	"context"
	"errors"
)

// MigrationChecklist 迁移脚本执行清单
type MigrationChecklist struct {
	Key     string                   `json:"key"`
	Title   string                   `json:"title"`
	Summary string                   `json:"summary"`
	Steps   []MigrationChecklistStep `json:"steps"`
	Notes   []string                 `json:"notes,omitempty"`
}

// MigrationChecklistStep 迁移清单步骤
type MigrationChecklistStep struct {
	Key         string   `json:"key"`
	Title       string   `json:"title"`
	Deliverable string   `json:"deliverable"`
	Acceptance  string   `json:"acceptance"`
	Items       []string `json:"items,omitempty"`
}

// PlanMigrationChecklistService 迁移清单规划服务接口
type PlanMigrationChecklistService interface {
	GetChecklist(ctx context.Context) (*MigrationChecklist, error)
}

type planMigrationChecklistService struct {
	checklist MigrationChecklist
}

// ErrMigrationChecklistNotFound 迁移清单不存在
var ErrMigrationChecklistNotFound = errors.New("migration checklist not found")

// NewPlanMigrationChecklistService 创建迁移清单规划服务
func NewPlanMigrationChecklistService() PlanMigrationChecklistService {
	return &planMigrationChecklistService{
		checklist: defaultMigrationChecklist(),
	}
}

func (s *planMigrationChecklistService) GetChecklist(ctx context.Context) (*MigrationChecklist, error) {
	if s == nil || s.checklist.Key == "" {
		return nil, ErrMigrationChecklistNotFound
	}
	result := s.checklist
	return &result, nil
}

func defaultMigrationChecklist() MigrationChecklist {
	return MigrationChecklist{
		Key:     "migration_script_execution",
		Title:   "迁移脚本执行清单",
		Summary: "覆盖迁移前检查、数据回填、灰度切换与回滚步骤。",
		Steps: []MigrationChecklistStep{
			{
				Key:         "pre_migration_check",
				Title:       "迁移前检查",
				Deliverable: "检查清单",
				Acceptance:  "可执行",
				Items: []string{
					"备份主库",
					"关闭写入或开启双写",
				},
			},
			{
				Key:         "data_backfill",
				Title:       "数据回填步骤",
				Deliverable: "步骤清单",
				Acceptance:  "无数据丢失",
				Items: []string{
					"创建 default workspace",
					"回填 workspace_id",
					"校验数量与一致性",
				},
			},
			{
				Key:         "canary_switch",
				Title:       "灰度切换步骤",
				Deliverable: "步骤清单",
				Acceptance:  "平滑",
				Items: []string{
					"小流量开关",
					"监控指标对比",
				},
			},
			{
				Key:         "rollback",
				Title:       "回滚步骤",
				Deliverable: "回滚清单",
				Acceptance:  "可恢复",
			},
		},
		Notes: []string{
			"该清单用于迁移脚本执行前后的操作约束与验证步骤。",
		},
	}
}
