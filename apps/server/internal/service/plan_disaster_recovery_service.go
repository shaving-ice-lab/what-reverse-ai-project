package service

import (
	"context"
	"errors"
)

// DisasterRecoveryPlan 灾备与恢复（DR）规划
type DisasterRecoveryPlan struct {
	Key             string                `json:"key"`
	Title           string                `json:"title"`
	Summary         string                `json:"summary"`
	RecoveryTargets []RecoveryTarget      `json:"recovery_targets"`
	CrossRegionPlan CrossRegionBackupPlan `json:"cross_region_plan"`
	FailoverPlan    FailoverPlan          `json:"failover_plan"`
	Notes           []string              `json:"notes,omitempty"`
}

// RecoveryTarget RPO/RTO 目标
type RecoveryTarget struct {
	Key         string   `json:"key"`
	Title       string   `json:"title"`
	Scope       string   `json:"scope"`
	RPO         string   `json:"rpo"`
	RTO         string   `json:"rto"`
	Measurement string   `json:"measurement"`
	Metrics     []string `json:"metrics,omitempty"`
	Acceptance  []string `json:"acceptance,omitempty"`
	Notes       []string `json:"notes,omitempty"`
}

// CrossRegionBackupPlan 跨区备份与恢复演练计划
type CrossRegionBackupPlan struct {
	Key           string   `json:"key"`
	Title         string   `json:"title"`
	Summary       string   `json:"summary"`
	Frequency     string   `json:"frequency"`
	Preconditions []string `json:"preconditions,omitempty"`
	Steps         []string `json:"steps"`
	Validation    []string `json:"validation"`
	Rollback      []string `json:"rollback,omitempty"`
	References    []string `json:"references,omitempty"`
}

// FailoverPlan 故障切换流程
type FailoverPlan struct {
	Key        string   `json:"key"`
	Title      string   `json:"title"`
	Summary    string   `json:"summary"`
	Triggers   []string `json:"triggers"`
	Steps      []string `json:"steps"`
	Validation []string `json:"validation"`
	Rollback   []string `json:"rollback"`
	References []string `json:"references,omitempty"`
}

// PlanDisasterRecoveryService 灾备与恢复规划服务接口
type PlanDisasterRecoveryService interface {
	GetPlan(ctx context.Context) (*DisasterRecoveryPlan, error)
}

type planDisasterRecoveryService struct {
	plan DisasterRecoveryPlan
}

// ErrDisasterRecoveryPlanNotFound 灾备规划不存在
var ErrDisasterRecoveryPlanNotFound = errors.New("disaster recovery plan not found")

// NewPlanDisasterRecoveryService 创建灾备规划服务
func NewPlanDisasterRecoveryService() PlanDisasterRecoveryService {
	return &planDisasterRecoveryService{
		plan: defaultDisasterRecoveryPlan(),
	}
}

func (s *planDisasterRecoveryService) GetPlan(ctx context.Context) (*DisasterRecoveryPlan, error) {
	if s == nil || s.plan.Key == "" {
		return nil, ErrDisasterRecoveryPlanNotFound
	}
	output := s.plan
	return &output, nil
}

func defaultDisasterRecoveryPlan() DisasterRecoveryPlan {
	return DisasterRecoveryPlan{
		Key:     "disaster_recovery",
		Title:   "灾备与恢复（DR）",
		Summary: "定义 RPO/RTO 目标、跨区备份演练与故障切换流程。",
		RecoveryTargets: []RecoveryTarget{
			{
				Key:         "workspace_db",
				Title:       "Workspace 数据库",
				Scope:       "workspace database",
				RPO:         "15m",
				RTO:         "60m",
				Measurement: "备份最新时间差 + 恢复完成耗时",
				Metrics: []string{
					"backup_age_seconds",
					"workspace_db_restore_duration_seconds",
				},
				Acceptance: []string{
					"备份间隔 <= 15 分钟",
					"恢复演练在 60 分钟内完成",
				},
			},
			{
				Key:         "runtime_service",
				Title:       "Runtime 服务",
				Scope:       "runtime execute + public access",
				RPO:         "5m",
				RTO:         "30m",
				Measurement: "可用性与请求恢复时间",
				Metrics: []string{
					"runtime_availability",
					"runtime_failover_duration_seconds",
				},
				Acceptance: []string{
					"故障切换后 30 分钟内恢复 95% 请求",
				},
			},
			{
				Key:         "audit_logs",
				Title:       "审计与运行日志",
				Scope:       "audit/runtime logs",
				RPO:         "60m",
				RTO:         "4h",
				Measurement: "日志回放与补偿时间",
				Metrics: []string{
					"audit_log_replay_lag_minutes",
				},
				Acceptance: []string{
					"审计日志可在 4 小时内恢复查询",
				},
			},
		},
		CrossRegionPlan: CrossRegionBackupPlan{
			Key:       "cross_region_backup",
			Title:     "跨区备份与恢复演练",
			Summary:   "定期备份 workspace 数据库，并在异地演练恢复。",
			Frequency: "每月 1 次（关键 workspace 可提升频率）",
			Preconditions: []string{
				"启用多区域部署配置",
				"备份存储支持跨区复制",
			},
			Steps: []string{
				"执行 POST /api/v1/workspaces/:id/database/backup 创建备份",
				"将备份复制到 secondary region 存储",
				"在演练环境执行 POST /api/v1/workspaces/:id/database/restore",
				"校验关键表行数与运行时执行结果",
			},
			Validation: []string{
				"备份可在异地恢复成功",
				"恢复后 runtime 可以执行并产生日志",
			},
			Rollback: []string{
				"演练环境恢复失败时不影响主环境",
			},
			References: []string{
				"/api/v1/workspaces/:id/database/backup",
				"/api/v1/workspaces/:id/database/restore",
			},
		},
		FailoverPlan: FailoverPlan{
			Key:     "failover_process",
			Title:   "故障切换流程",
			Summary: "当主区域不可用时切换至备用区域并恢复服务。",
			Triggers: []string{
				"主区域 runtime 5xx 持续超过阈值",
				"数据库不可用或区域级故障",
			},
			Steps: []string{
				"冻结写入或开启只读模式",
				"切换域名解析或路由到备用区域",
				"恢复 workspace 数据库与必要配置",
				"验证关键 API 与 runtime 执行",
				"逐步恢复写入流量",
			},
			Validation: []string{
				"公开访问入口可正常响应",
				"关键工作流执行成功",
				"监控指标恢复稳定",
			},
			Rollback: []string{
				"主区域恢复后切回并同步差异数据",
				"关闭只读模式并恢复常规流量",
			},
			References: []string{
				"/api/v1/workspaces/:id/restore",
				"/api/v1/workspaces/:id/database/restore",
			},
		},
		Notes: []string{
			"RPO/RTO 目标可按 workspace 等级分层调整。",
			"建议与故障演练计划一起执行并沉淀 Runbook。",
		},
	}
}
