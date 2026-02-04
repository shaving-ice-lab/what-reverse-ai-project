package service

import (
	"context"
	"errors"
)

// RACIEntry RACI 表条目
type RACIEntry struct {
	Key         string   `json:"key"`
	Activity    string   `json:"activity"`
	Responsible []string `json:"responsible"`
	Accountable []string `json:"accountable"`
	Consulted   []string `json:"consulted,omitempty"`
	Informed    []string `json:"informed,omitempty"`
}

// RACITable RACI 表定义
type RACITable struct {
	Key     string      `json:"key"`
	Title   string      `json:"title"`
	Roles   []string    `json:"roles"`
	Entries []RACIEntry `json:"entries"`
	Notes   []string    `json:"notes,omitempty"`
}

// DecisionOwner 关键决策 Owner
type DecisionOwner struct {
	Key       string   `json:"key"`
	Decision  string   `json:"decision"`
	Owner     string   `json:"owner"`
	Backups   []string `json:"backups,omitempty"`
	Consulted []string `json:"consulted,omitempty"`
	Notes     []string `json:"notes,omitempty"`
}

// RACIPlan 角色与责任分工计划
type RACIPlan struct {
	Key            string          `json:"key"`
	Title          string          `json:"title"`
	Table          RACITable       `json:"table"`
	DecisionOwners []DecisionOwner `json:"decision_owners"`
}

// PlanRACIService RACI 规划服务接口
type PlanRACIService interface {
	GetPlan(ctx context.Context) (*RACIPlan, error)
}

type planRACIService struct {
	plan RACIPlan
}

// ErrRACIPlanNotFound RACI 计划不存在
var ErrRACIPlanNotFound = errors.New("raci plan not found")

// NewPlanRACIService 创建 RACI 规划服务
func NewPlanRACIService() PlanRACIService {
	return &planRACIService{plan: defaultRACIPlan()}
}

func (s *planRACIService) GetPlan(ctx context.Context) (*RACIPlan, error) {
	if s == nil || s.plan.Key == "" {
		return nil, ErrRACIPlanNotFound
	}
	plan := s.plan
	return &plan, nil
}

func defaultRACIPlan() RACIPlan {
	roles := []string{"产品", "后端", "前端", "运维", "安全"}
	return RACIPlan{
		Key:   "raci_plan",
		Title: "角色与责任分工（RACI）",
		Table: RACITable{
			Key:   "raci_table",
			Title: "RACI 表",
			Roles: roles,
			Entries: []RACIEntry{
				{
					Key:         "requirements_scope",
					Activity:    "需求与范围定义",
					Responsible: []string{"产品"},
					Accountable: []string{"产品"},
					Consulted:   []string{"后端", "前端", "安全"},
					Informed:    []string{"运维"},
				},
				{
					Key:         "architecture_module",
					Activity:    "系统架构与模块拆分",
					Responsible: []string{"后端"},
					Accountable: []string{"后端"},
					Consulted:   []string{"产品", "前端", "安全"},
					Informed:    []string{"运维"},
				},
				{
					Key:         "schema_migrations",
					Activity:    "数据库 Schema 与迁移",
					Responsible: []string{"后端"},
					Accountable: []string{"后端"},
					Consulted:   []string{"产品", "安全"},
					Informed:    []string{"运维", "前端"},
				},
				{
					Key:         "api_contracts",
					Activity:    "API 设计与契约",
					Responsible: []string{"后端"},
					Accountable: []string{"后端"},
					Consulted:   []string{"产品", "前端"},
					Informed:    []string{"安全", "运维"},
				},
				{
					Key:         "frontend_ia",
					Activity:    "前端信息架构与页面",
					Responsible: []string{"前端"},
					Accountable: []string{"前端"},
					Consulted:   []string{"产品", "后端"},
					Informed:    []string{"运维", "安全"},
				},
				{
					Key:         "runtime_performance",
					Activity:    "运行时执行与性能优化",
					Responsible: []string{"后端"},
					Accountable: []string{"后端"},
					Consulted:   []string{"运维", "安全"},
					Informed:    []string{"产品", "前端"},
				},
				{
					Key:         "ops_observability",
					Activity:    "监控、告警与运维 SOP",
					Responsible: []string{"运维"},
					Accountable: []string{"运维"},
					Consulted:   []string{"后端", "安全"},
					Informed:    []string{"产品", "前端"},
				},
				{
					Key:         "security_compliance",
					Activity:    "安全与合规评审",
					Responsible: []string{"安全"},
					Accountable: []string{"安全"},
					Consulted:   []string{"后端", "产品"},
					Informed:    []string{"运维", "前端"},
				},
				{
					Key:         "release_canary",
					Activity:    "发布与灰度策略",
					Responsible: []string{"运维"},
					Accountable: []string{"运维"},
					Consulted:   []string{"后端", "产品", "安全"},
					Informed:    []string{"前端"},
				},
				{
					Key:         "billing_quota",
					Activity:    "计费与配额策略",
					Responsible: []string{"产品"},
					Accountable: []string{"产品"},
					Consulted:   []string{"后端", "运维"},
					Informed:    []string{"安全", "前端"},
				},
			},
			Notes: []string{
				"RACI 中 R=负责、A=最终负责、C=协作、I=知会。",
			},
		},
		DecisionOwners: []DecisionOwner{
			{
				Key:       "schema_change",
				Decision:  "Schema 变更与迁移策略",
				Owner:     "后端",
				Backups:   []string{"运维"},
				Consulted: []string{"安全", "产品"},
			},
			{
				Key:       "security_exception",
				Decision:  "安全豁免与风险接受",
				Owner:     "安全",
				Backups:   []string{"运维"},
				Consulted: []string{"后端", "产品"},
			},
			{
				Key:       "release_window",
				Decision:  "发布窗口与灰度策略",
				Owner:     "运维",
				Backups:   []string{"后端"},
				Consulted: []string{"安全", "产品"},
			},
			{
				Key:       "billing_policy",
				Decision:  "计费与配额策略",
				Owner:     "产品",
				Backups:   []string{"后端"},
				Consulted: []string{"运维"},
			},
			{
				Key:       "access_policy",
				Decision:  "访问策略与权限模型",
				Owner:     "后端",
				Backups:   []string{"安全"},
				Consulted: []string{"产品"},
			},
			{
				Key:       "incident_response",
				Decision:  "故障升级与回滚决策",
				Owner:     "运维",
				Backups:   []string{"后端"},
				Consulted: []string{"安全", "产品"},
			},
		},
	}
}
