package service

import (
	"context"
	"errors"
	"sort"
	"strings"

	"github.com/agentflow/server/internal/config"
)

// DataResidencyRegion 数据存储地域节点
type DataResidencyRegion struct {
	Region  string   `json:"region"`
	BaseURL string   `json:"base_url,omitempty"`
	Primary bool     `json:"primary"`
	Active  bool     `json:"active"`
	Notes   []string `json:"notes,omitempty"`
}

// DataResidencyRule 数据存储地域策略规则
type DataResidencyRule struct {
	Key         string   `json:"key"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Enforced    bool     `json:"enforced"`
	ConfigKeys  []string `json:"config_keys,omitempty"`
	Source      string   `json:"source,omitempty"`
	Notes       []string `json:"notes,omitempty"`
}

// DataResidencyPolicy 数据存储地域合规策略
type DataResidencyPolicy struct {
	Key           string                `json:"key"`
	Title         string                `json:"title"`
	Summary       string                `json:"summary"`
	PrimaryRegion string                `json:"primary_region,omitempty"`
	ActiveRegion  string                `json:"active_region,omitempty"`
	Regions       []DataResidencyRegion `json:"regions"`
	Rules         []DataResidencyRule   `json:"rules"`
	Notes         []string              `json:"notes,omitempty"`
}

// PlanDataResidencyPolicyService 数据地域合规规划服务接口
type PlanDataResidencyPolicyService interface {
	GetPolicy(ctx context.Context) (*DataResidencyPolicy, error)
}

type planDataResidencyPolicyService struct {
	policy DataResidencyPolicy
}

// ErrDataResidencyPolicyNotFound 数据地域策略不存在
var ErrDataResidencyPolicyNotFound = errors.New("data residency policy not found")

// NewPlanDataResidencyPolicyService 创建数据地域策略规划服务
func NewPlanDataResidencyPolicyService(cfg config.DeploymentConfig) PlanDataResidencyPolicyService {
	return &planDataResidencyPolicyService{
		policy: defaultDataResidencyPolicy(cfg),
	}
}

func (s *planDataResidencyPolicyService) GetPolicy(ctx context.Context) (*DataResidencyPolicy, error) {
	if s == nil || s.policy.Key == "" {
		return nil, ErrDataResidencyPolicyNotFound
	}
	output := s.policy
	return &output, nil
}

func defaultDataResidencyPolicy(cfg config.DeploymentConfig) DataResidencyPolicy {
	activeRegion := strings.TrimSpace(cfg.Region)
	primaryRegion := strings.TrimSpace(cfg.PrimaryRegion)
	if primaryRegion == "" {
		primaryRegion = activeRegion
	}
	if activeRegion == "" {
		activeRegion = primaryRegion
	}

	regions := resolveResidencyRegions(cfg, primaryRegion, activeRegion)
	rules := []DataResidencyRule{
		{
			Key:         "deployment_regions",
			Title:       "部署区域基线",
			Description: "通过 deployment.region/regions/primary_region 约束可用地域范围。",
			Enforced:    len(regions) > 0,
			ConfigKeys: []string{
				"deployment.region",
				"deployment.primary_region",
				"deployment.regions",
			},
			Source: "apps/server/internal/config/config.go",
		},
		{
			Key:         "workspace_region_tag",
			Title:       "工作空间地域标记",
			Description: "创建 workspace 时可写入 region 字段，作为数据地域合规标记。",
			Enforced:    false,
			Source:      "apps/server/internal/service/workspace_service.go",
			Notes: []string{
				"当前仅记录元数据，未做强制校验或写入路由。",
			},
		},
		{
			Key:         "runtime_region_entry",
			Title:       "Runtime 区域入口",
			Description: "支持配置区域入口域名用于 Runtime 访问路由。",
			Enforced:    len(cfg.RegionBaseURLs) > 0,
			ConfigKeys:  []string{"deployment.region_base_urls"},
			Source:      "apps/server/internal/api/handler/runtime.go",
		},
		{
			Key:         "data_location_enforcement",
			Title:       "数据落地与跨区限制",
			Description: "需要在存储层/路由层补充跨区写入与访问限制。",
			Enforced:    false,
			Notes: []string{
				"建议按 workspace.region 绑定数据存储与备份地域。",
			},
		},
	}

	return DataResidencyPolicy{
		Key:           "data_residency_policy",
		Title:         "数据存储地域合规策略",
		Summary:       "定义可用区域、地域标记与跨区访问控制策略。",
		PrimaryRegion: primaryRegion,
		ActiveRegion:  activeRegion,
		Regions:       regions,
		Rules:         rules,
		Notes: []string{
			"地域策略输出与当前配置保持一致，未启用项按 Enforced=false 标注。",
		},
	}
}

func resolveResidencyRegions(cfg config.DeploymentConfig, primaryRegion, activeRegion string) []DataResidencyRegion {
	seen := map[string]struct{}{}
	order := []string{}
	add := func(value string) {
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			return
		}
		if _, ok := seen[trimmed]; ok {
			return
		}
		seen[trimmed] = struct{}{}
		order = append(order, trimmed)
	}

	add(primaryRegion)
	add(activeRegion)
	for _, region := range cfg.Regions {
		add(region)
	}

	keys := make([]string, 0, len(cfg.RegionBaseURLs))
	for key := range cfg.RegionBaseURLs {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	for _, key := range keys {
		add(key)
	}

	regions := make([]DataResidencyRegion, 0, len(order))
	for _, region := range order {
		regions = append(regions, DataResidencyRegion{
			Region:  region,
			BaseURL: strings.TrimSpace(cfg.RegionBaseURLs[region]),
			Primary: primaryRegion != "" && region == primaryRegion,
			Active:  activeRegion != "" && region == activeRegion,
		})
	}
	return regions
}
