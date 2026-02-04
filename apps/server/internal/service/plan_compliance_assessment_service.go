package service

import (
	"context"
	"errors"

	"github.com/agentflow/server/internal/pkg/security"
)

// ComplianceChecklistPlan 合规清单规划输出
type ComplianceChecklistPlan struct {
	Key       string                         `json:"key"`
	Title     string                         `json:"title"`
	Summary   string                         `json:"summary"`
	Checklist []security.ComplianceCheckItem `json:"checklist"`
	Notes     []string                       `json:"notes,omitempty"`
}

// PlanComplianceAssessmentService 合规清单与差距评估规划服务接口
type PlanComplianceAssessmentService interface {
	GetPlan(ctx context.Context) (*ComplianceChecklistPlan, error)
}

type planComplianceAssessmentService struct {
	plan ComplianceChecklistPlan
}

// ErrCompliancePlanNotFound 合规清单规划不存在
var ErrCompliancePlanNotFound = errors.New("compliance checklist plan not found")

// NewPlanComplianceAssessmentService 创建合规清单规划服务
func NewPlanComplianceAssessmentService() PlanComplianceAssessmentService {
	return &planComplianceAssessmentService{
		plan: defaultComplianceChecklistPlan(),
	}
}

func (s *planComplianceAssessmentService) GetPlan(ctx context.Context) (*ComplianceChecklistPlan, error) {
	if s == nil || s.plan.Key == "" {
		return nil, ErrCompliancePlanNotFound
	}
	output := s.plan
	return &output, nil
}

func defaultComplianceChecklistPlan() ComplianceChecklistPlan {
	return ComplianceChecklistPlan{
		Key:       "compliance_checklist",
		Title:     "合规清单与差距评估",
		Summary:   "提供合规检查清单，并支持按 workspace 输出差距评估结果。",
		Checklist: security.GetComplianceChecks(),
		Notes: []string{
			"可通过 /api/v1/plans/compliance?workspace_id=... 获取差距评估结果。",
			"合规检查项来自 security.DefaultComplianceChecks。",
		},
	}
}
