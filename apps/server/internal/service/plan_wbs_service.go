package service

import (
	"context"
	"errors"
	"strings"
)

// WBSModule WBS 模块任务表
type WBSModule struct {
	Key     string    `json:"key"`
	Name    string    `json:"name"`
	Version string    `json:"version"`
	Tasks   []WBSTask `json:"tasks"`
	Notes   []string  `json:"notes,omitempty"`
}

// WBSTask WBS 任务项
type WBSTask struct {
	ID           string   `json:"id"`
	Title        string   `json:"title"`
	Phase        string   `json:"phase"`
	Owner        string   `json:"owner"`
	Deliverable  string   `json:"deliverable"`
	Acceptance   string   `json:"acceptance"`
	EstimateDays int      `json:"estimate_days"`
	Dependencies []string `json:"dependencies,omitempty"`
	Sequence     int      `json:"sequence"`
}

// PlanWBSService WBS 规划服务接口
type PlanWBSService interface {
	ListModules(ctx context.Context) []WBSModule
	GetModule(ctx context.Context, key string) (*WBSModule, error)
}

type planWBSService struct {
	modules []WBSModule
	index   map[string]WBSModule
}

// ErrWBSModuleNotFound WBS 模块不存在
var ErrWBSModuleNotFound = errors.New("wbs module not found")

// NewPlanWBSService 创建 WBS 规划服务
func NewPlanWBSService() PlanWBSService {
	modules := defaultWBSModules()
	normalized := make([]WBSModule, 0, len(modules))
	index := make(map[string]WBSModule, len(modules))
	for _, module := range modules {
		key := normalizeWBSModuleKey(module.Key)
		if key == "" {
			continue
		}
		module.Key = key
		normalized = append(normalized, module)
		index[key] = module
	}
	return &planWBSService{
		modules: normalized,
		index:   index,
	}
}

func (s *planWBSService) ListModules(ctx context.Context) []WBSModule {
	if len(s.modules) == 0 {
		return []WBSModule{}
	}
	output := make([]WBSModule, len(s.modules))
	copy(output, s.modules)
	return output
}

func (s *planWBSService) GetModule(ctx context.Context, key string) (*WBSModule, error) {
	if s == nil {
		return nil, ErrWBSModuleNotFound
	}
	normalized := normalizeWBSModuleKey(key)
	if normalized == "" {
		return nil, ErrWBSModuleNotFound
	}
	module, ok := s.index[normalized]
	if !ok {
		return nil, ErrWBSModuleNotFound
	}
	result := module
	return &result, nil
}

func normalizeWBSModuleKey(key string) string {
	return strings.ToLower(strings.TrimSpace(key))
}

func defaultWBSModules() []WBSModule {
	return []WBSModule{
		{
			Key:     "workspace",
			Name:    "Workspace",
			Version: "v1",
			Tasks: []WBSTask{
				{
					ID:           "ws-schema-migrations",
					Title:        "表结构与迁移",
					Phase:        "foundation",
					Owner:        "backend",
					Deliverable:  "workspaces/workspace_members/workspace_roles/workspace_databases 迁移脚本",
					Acceptance:   "迁移可执行，表结构与索引满足需求",
					EstimateDays: 2,
					Sequence:     1,
				},
				{
					ID:           "ws-api-contracts",
					Title:        "API 接口",
					Phase:        "core",
					Owner:        "backend",
					Deliverable:  "Workspace CRUD、成员管理、用量与导出接口",
					Acceptance:   "接口鉴权可用，响应包裹统一，覆盖核心场景",
					EstimateDays: 3,
					Dependencies: []string{"ws-schema-migrations"},
					Sequence:     2,
				},
				{
					ID:           "ws-permissions-members",
					Title:        "权限与成员",
					Phase:        "access",
					Owner:        "backend",
					Deliverable:  "角色与权限模型、成员邀请与角色变更流程",
					Acceptance:   "权限校验覆盖 Workspace 核心接口",
					EstimateDays: 2,
					Dependencies: []string{"ws-schema-migrations"},
					Sequence:     3,
				},
				{
					ID:           "ws-frontend-pages",
					Title:        "前端页面",
					Phase:        "ui",
					Owner:        "frontend",
					Deliverable:  "Workspace 列表、设置、成员管理、应用列表页面",
					Acceptance:   "页面可完成创建/编辑/成员管理与导航",
					EstimateDays: 3,
					Dependencies: []string{"ws-api-contracts", "ws-permissions-members"},
					Sequence:     4,
				},
			},
			Notes: []string{
				"本任务表用于排期与依赖梳理，状态由项目管理流程维护。",
				"后续可扩展到 Runtime/Domain/Billing 模块。",
			},
		},
		{
			Key:     "app",
			Name:    "App",
			Version: "v1",
			Tasks: []WBSTask{
				{
					ID:           "app-models",
					Title:        "App 模型",
					Phase:        "foundation",
					Owner:        "backend",
					Deliverable:  "apps/app_versions/app_access_policies/app_domains 表结构与迁移",
					Acceptance:   "模型与索引满足创建/版本/发布/域名策略需求",
					EstimateDays: 2,
					Sequence:     1,
				},
				{
					ID:           "app-versioning",
					Title:        "版本管理",
					Phase:        "core",
					Owner:        "backend",
					Deliverable:  "版本创建/回滚/对比 API 与服务能力",
					Acceptance:   "版本可创建、查看、回滚与对比",
					EstimateDays: 2,
					Dependencies: []string{"app-models"},
					Sequence:     2,
				},
				{
					ID:           "app-publish-flow",
					Title:        "发布流程",
					Phase:        "release",
					Owner:        "backend",
					Deliverable:  "发布/下线流程与状态机",
					Acceptance:   "发布流程可回滚，状态可追踪",
					EstimateDays: 2,
					Dependencies: []string{"app-versioning"},
					Sequence:     3,
				},
				{
					ID:           "app-access-policy",
					Title:        "公开访问策略",
					Phase:        "access",
					Owner:        "backend",
					Deliverable:  "访问策略、限流与域名绑定规则",
					Acceptance:   "访问策略可配置并可通过 API 生效",
					EstimateDays: 1,
					Dependencies: []string{"app-publish-flow"},
					Sequence:     4,
				},
			},
			Notes: []string{
				"任务表聚焦 App 生命周期与访问策略。",
				"前端页面规划可在后续 WBS 版本补充。",
			},
		},
		{
			Key:     "runtime",
			Name:    "Runtime",
			Version: "v1",
			Tasks: []WBSTask{
				{
					ID:           "runtime-routing",
					Title:        "路由解析",
					Phase:        "foundation",
					Owner:        "backend",
					Deliverable:  "workspace/app slug 解析、域名入口映射与访问策略解析",
					Acceptance:   "支持路径与域名入口解析，并返回访问策略",
					EstimateDays: 2,
					Sequence:     1,
				},
				{
					ID:           "runtime-execution-chain",
					Title:        "执行链路",
					Phase:        "core",
					Owner:        "backend",
					Deliverable:  "App -> Workflow -> Execution 链路与运行时输入/输出封装",
					Acceptance:   "执行可触发工作流并返回标准化结果",
					EstimateDays: 3,
					Dependencies: []string{"runtime-routing"},
					Sequence:     2,
				},
				{
					ID:           "runtime-logs-metrics",
					Title:        "日志与监控",
					Phase:        "observability",
					Owner:        "backend",
					Deliverable:  "执行日志、错误码与运行时指标采集",
					Acceptance:   "可查询执行日志并统计核心指标",
					EstimateDays: 2,
					Dependencies: []string{"runtime-execution-chain"},
					Sequence:     3,
				},
			},
			Notes: []string{
				"Runtime WBS 关注访问入口解析、执行链路与可观测性。",
			},
		},
		{
			Key:     "multi-region-edge",
			Name:    "Multi-Region & Edge",
			Version: "v1",
			Tasks: []WBSTask{
				{
					ID:           "mre-multi-region-deployment",
					Title:        "多地域部署策略",
					Phase:        "foundation",
					Owner:        "backend",
					Deliverable:  "多地域部署方案、用户就近访问策略",
					Acceptance:   "部署方案可扩展，支持用户就近访问",
					EstimateDays: 3,
					Sequence:     1,
				},
				{
					ID:           "mre-cdn-static-acceleration",
					Title:        "CDN 与静态资源加速",
					Phase:        "core",
					Owner:        "backend",
					Deliverable:  "CDN 配置方案、静态资源加速规则",
					Acceptance:   "方案可用，静态资源可加速",
					EstimateDays: 2,
					Dependencies: []string{"mre-multi-region-deployment"},
					Sequence:     2,
				},
				{
					ID:           "mre-runtime-proximity-routing",
					Title:        "Runtime 入口就近路由",
					Phase:        "access",
					Owner:        "backend",
					Deliverable:  "就近路由规则、入口流量调度策略",
					Acceptance:   "路由规则可控，支持就近路由",
					EstimateDays: 2,
					Dependencies: []string{"mre-multi-region-deployment"},
					Sequence:     3,
				},
			},
			Notes: []string{
				"聚焦多地域部署、CDN 静态加速与 Runtime 就近路由。",
			},
		},
		{
			Key:     "db-provisioner",
			Name:    "DB Provisioner",
			Version: "v1",
			Tasks: []WBSTask{
				{
					ID:           "dbp-provisioning",
					Title:        "资源创建与权限",
					Phase:        "foundation",
					Owner:        "backend",
					Deliverable:  "数据库/用户创建、权限授权与连接串生成",
					Acceptance:   "创建流程可自动化，失败可回滚",
					EstimateDays: 2,
					Sequence:     1,
				},
				{
					ID:           "dbp-secret-rotation",
					Title:        "密钥与连接管理",
					Phase:        "security",
					Owner:        "backend",
					Deliverable:  "secret_ref 加密存储、密钥轮换与访问控制",
					Acceptance:   "密钥不明文落库，支持轮换",
					EstimateDays: 2,
					Dependencies: []string{"dbp-provisioning"},
					Sequence:     2,
				},
				{
					ID:           "dbp-migrations-backup",
					Title:        "迁移与备份恢复",
					Phase:        "ops",
					Owner:        "backend",
					Deliverable:  "迁移执行、备份/恢复与状态跟踪",
					Acceptance:   "迁移可执行，备份恢复可回滚",
					EstimateDays: 3,
					Dependencies: []string{"dbp-secret-rotation"},
					Sequence:     3,
				},
			},
			Notes: []string{
				"DB Provisioner WBS 聚焦数据库创建、密钥安全与运维能力。",
			},
		},
		{
			Key:     "domain",
			Name:    "Domain",
			Version: "v1",
			Tasks: []WBSTask{
				{
					ID:           "domain-binding",
					Title:        "绑定与校验流程",
					Phase:        "foundation",
					Owner:        "backend",
					Deliverable:  "域名绑定、DNS 校验与状态流转",
					Acceptance:   "支持绑定、验证、启用与状态追踪",
					EstimateDays: 2,
					Sequence:     1,
				},
				{
					ID:           "domain-cert-automation",
					Title:        "证书签发与续期",
					Phase:        "security",
					Owner:        "backend",
					Deliverable:  "TLS 证书签发、续期与失败回退",
					Acceptance:   "证书流程自动化并可回滚",
					EstimateDays: 2,
					Dependencies: []string{"domain-binding"},
					Sequence:     2,
				},
				{
					ID:           "domain-routing-ops",
					Title:        "路由与运营管理",
					Phase:        "ops",
					Owner:        "backend",
					Deliverable:  "Host 路由映射、域名列表与运营提醒",
					Acceptance:   "访问可路由且支持运营提示",
					EstimateDays: 2,
					Dependencies: []string{"domain-cert-automation"},
					Sequence:     3,
				},
			},
			Notes: []string{
				"Domain WBS 聚焦绑定校验、证书与路由运营。",
			},
		},
		{
			Key:     "billing",
			Name:    "Billing",
			Version: "v1",
			Tasks: []WBSTask{
				{
					ID:           "billing-dimensions",
					Title:        "计量维度与规则",
					Phase:        "foundation",
					Owner:        "backend",
					Deliverable:  "调用/Token/存储/带宽计量定义与规则",
					Acceptance:   "计量规则可复用",
					EstimateDays: 2,
					Sequence:     1,
				},
				{
					ID:           "billing-usage-quota",
					Title:        "用量采集与配额",
					Phase:        "core",
					Owner:        "backend",
					Deliverable:  "用量采集、扣减与超额处理",
					Acceptance:   "配额可触发并返回标准错误",
					EstimateDays: 3,
					Dependencies: []string{"billing-dimensions"},
					Sequence:     2,
				},
				{
					ID:           "billing-reporting",
					Title:        "统计与对账展示",
					Phase:        "ops",
					Owner:        "backend",
					Deliverable:  "用量统计、账单汇总与导出",
					Acceptance:   "可查询统计并支持导出",
					EstimateDays: 2,
					Dependencies: []string{"billing-usage-quota"},
					Sequence:     3,
				},
			},
			Notes: []string{
				"Billing WBS 聚焦计量、配额与统计对账。",
			},
		},
	}
}
