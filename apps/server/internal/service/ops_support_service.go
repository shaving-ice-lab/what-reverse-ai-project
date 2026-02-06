package service

import (
	"context"
	"errors"
	"strings"
)

// OpsSOP 运维与客服 SOP 定义
type OpsSOP struct {
	Key           string            `json:"key"`
	Title         string            `json:"title"`
	Summary       string            `json:"summary"`
	Severity      string            `json:"severity"`
	Owners        []string          `json:"owners"`
	Triggers      []string          `json:"triggers"`
	Preconditions []string          `json:"preconditions"`
	Steps         []OpsSOPStep      `json:"steps"`
	Escalation    string            `json:"escalation,omitempty"`
	RollbackPlan  string            `json:"rollback_plan,omitempty"`
	References    []OpsSOPReference `json:"references,omitempty"`
}

// OpsSOPStep SOP 步骤
type OpsSOPStep struct {
	Title    string   `json:"title"`
	Actions  []string `json:"actions"`
	Expected string   `json:"expected,omitempty"`
}

// OpsSOPReference SOP 参考链接
type OpsSOPReference struct {
	Label  string `json:"label"`
	Target string `json:"target"`
}

// OpsSupportService 运维与客服 SOP 服务接口
type OpsSupportService interface {
	ListSOPs(ctx context.Context) []OpsSOP
	GetSOP(ctx context.Context, key string) (*OpsSOP, error)
}

type opsSupportService struct {
	sops  []OpsSOP
	index map[string]OpsSOP
}

// ErrOpsSOPNotFound SOP 未找到
var ErrOpsSOPNotFound = errors.New("ops sop not found")

// NewOpsSupportService 创建运维与客服 SOP 服务
func NewOpsSupportService() OpsSupportService {
	sops := defaultOpsSOPs()
	normalized := make([]OpsSOP, 0, len(sops))
	index := make(map[string]OpsSOP, len(sops))
	for _, sop := range sops {
		key := normalizeOpsSOPKey(sop.Key)
		if key == "" {
			continue
		}
		sop.Key = key
		normalized = append(normalized, sop)
		index[key] = sop
	}
	return &opsSupportService{
		sops:  normalized,
		index: index,
	}
}

func (s *opsSupportService) ListSOPs(ctx context.Context) []OpsSOP {
	if len(s.sops) == 0 {
		return []OpsSOP{}
	}
	output := make([]OpsSOP, len(s.sops))
	copy(output, s.sops)
	return output
}

func (s *opsSupportService) GetSOP(ctx context.Context, key string) (*OpsSOP, error) {
	if s == nil {
		return nil, ErrOpsSOPNotFound
	}
	normalized := normalizeOpsSOPKey(key)
	if normalized == "" {
		return nil, ErrOpsSOPNotFound
	}
	sop, ok := s.index[normalized]
	if !ok {
		return nil, ErrOpsSOPNotFound
	}
	result := sop
	return &result, nil
}

func normalizeOpsSOPKey(key string) string {
	return strings.ToLower(strings.TrimSpace(key))
}

func defaultOpsSOPs() []OpsSOP {
	return []OpsSOP{
		{
			Key:      "domain_binding_failure",
			Title:    "域名绑定故障处理",
			Summary:  "处理域名验证失败、证书签发失败与路由生效失败。",
			Severity: "P1",
			Owners:   []string{"ops", "support"},
			Triggers: []string{
				"域名状态为 failed 或 verification_attempts >= 3",
				"API 返回 DOMAIN_NOT_VERIFIED / CERT_ISSUE_FAILED / ROUTING_FAILED",
				"用户报告自定义域名无法访问",
			},
			Preconditions: []string{
				"确认 workspace_id 与 domain_id 归属",
				"已获取域名验证 token 或 CNAME 目标",
			},
			Steps: []OpsSOPStep{
				{
					Title: "确认域名记录状态",
					Actions: []string{
						"调用 GET /api/v1/workspaces/:id/domains 获取 status/ssl_status/last_verification_error/next_retry_at",
						"若 status=failed，记录 support_url 与错误详情",
					},
					Expected: "已定位域名状态与失败原因",
				},
				{
					Title: "校验 DNS 记录并触发验证",
					Actions: []string{
						"核对 TXT `_agentflow.<domain>` 或 CNAME 指向 base host",
						"等待 TTL 后调用 POST /api/v1/workspaces/:id/domains/:domainId/verify",
					},
					Expected: "域名状态变为 verified 或给出可执行错误",
				},
				{
					Title: "处理证书签发",
					Actions: []string{
						"当 ssl_status 非 issued 时调用 POST /api/v1/workspaces/:id/domains/:domainId/cert/issue",
						"若签发失败，返回 DNS 校验并重试",
					},
					Expected: "ssl_status 变为 issued",
				},
				{
					Title: "生效或回滚路由",
					Actions: []string{
						"调用 POST /api/v1/workspaces/:id/domains/:domainId/activate 使域名生效",
						"失败时调用 POST /api/v1/workspaces/:id/domains/:domainId/rollback",
					},
					Expected: "域名状态为 active 或已回滚",
				},
			},
			Escalation:   "verification_attempts >= 3 或 support_url 已生成时，转人工排查权威 DNS 与路由服务日志。",
			RollbackPlan: "执行 /rollback 或删除域名记录后恢复默认访问。",
			References: []OpsSOPReference{
				{Label: "列出域名", Target: "GET /api/v1/workspaces/:id/domains"},
				{Label: "验证域名", Target: "POST /api/v1/workspaces/:id/domains/:domainId/verify"},
				{Label: "签发证书", Target: "POST /api/v1/workspaces/:id/domains/:domainId/cert/issue"},
				{Label: "域名生效", Target: "POST /api/v1/workspaces/:id/domains/:domainId/activate"},
				{Label: "域名回滚", Target: "POST /api/v1/workspaces/:id/domains/:domainId/rollback"},
			},
		},
		{
			Key:      "workspace_db_provision_failed",
			Title:    "DB 创建失败处理",
			Summary:  "处理工作空间数据库创建失败与重复创建冲突。",
			Severity: "P1",
			Owners:   []string{"ops", "support"},
			Triggers: []string{
				"API 返回 PROVISION_FAILED / QUOTA_EXCEEDED",
				"数据库状态为 failed 或 provisioning 超时",
			},
			Preconditions: []string{
				"确认 workspace_id 归属",
				"确认数据库配额可用",
			},
			Steps: []OpsSOPStep{
				{
					Title: "核对数据库状态与配额",
					Actions: []string{
						"调用 GET /api/v1/workspaces/:id/database 获取状态与 db_name",
						"调用 GET /api/v1/billing/workspaces/:id/quota 校验 db_storage_gb",
					},
					Expected: "确认是配额问题还是创建失败",
				},
				{
					Title: "重新触发创建",
					Actions: []string{
						"当状态为 failed 或长时间 provisioning 时，调用 POST /api/v1/workspaces/:id/database 重新创建",
						"若返回 ALREADY_EXISTS，等待状态完成后再重试",
					},
					Expected: "数据库状态变为 ready",
				},
				{
					Title: "确认访问凭据与初始化",
					Actions: []string{
						"必要时调用 POST /api/v1/workspaces/:id/database/rotate-secret 轮换密钥",
						"调用 POST /api/v1/workspaces/:id/database/migrate 执行迁移",
					},
					Expected: "数据库可连接且迁移完成",
				},
			},
			Escalation:   "多次失败或配额异常时，检查数据库主机连通性与权限配置。",
			RollbackPlan: "保留 failed 记录，等待恢复配额或基础设施后再次触发创建。",
			References: []OpsSOPReference{
				{Label: "创建数据库", Target: "POST /api/v1/workspaces/:id/database"},
				{Label: "查询数据库状态", Target: "GET /api/v1/workspaces/:id/database"},
				{Label: "查看配额", Target: "GET /api/v1/billing/workspaces/:id/quota"},
				{Label: "轮换密钥", Target: "POST /api/v1/workspaces/:id/database/rotate-secret"},
				{Label: "执行迁移", Target: "POST /api/v1/workspaces/:id/database/migrate"},
			},
		},
		{
			Key:      "anonymous_abuse",
			Title:    "匿名滥用处理",
			Summary:  "通过限流、灰名单、黑名单与验证码降低匿名滥用。",
			Severity: "P1",
			Owners:   []string{"ops", "support", "security"},
			Triggers: []string{
				"runtime_rate_limited / runtime_risk_detected 事件激增",
				"匿名访问异常增长或用户投诉",
			},
			Preconditions: []string{
				"Workspace access_mode 为 public_anonymous",
				"已收集滥用 IP/UA/路径信息",
			},
			Steps: []OpsSOPStep{
				{
					Title: "确认访问策略",
					Actions: []string{
						"调用 GET /api/v1/workspaces/:id/access-policy 确认 access_mode 与 rate_limit_json",
					},
					Expected: "确认可对匿名访问策略进行调整",
				},
				{
					Title: "设置黑名单或灰名单",
					Actions: []string{
						"通过 PATCH /api/v1/workspaces/:id/access-policy 更新 rate_limit_json.blacklist/graylist",
						"可填入原始 IP 或 sha256 哈希值（支持前缀 sha256:/hash:）",
					},
					Expected: "高风险访问被阻断或触发验证码",
				},
				{
					Title: "收紧限流策略",
					Actions: []string{
						"设置 rate_limit_json.per_ip / per_session / per_workspace 的 max_requests 与 window_seconds",
						"必要时提高 require_captcha 或设置 graylist_policy",
					},
					Expected: "请求被限流且风险事件下降",
				},
			},
			Escalation:   "持续异常时，结合日志分析并升级安全团队处理。",
			RollbackPlan: "移除 blacklist/graylist 并恢复默认限流配置。",
			References: []OpsSOPReference{
				{Label: "查看访问策略", Target: "GET /api/v1/workspaces/:id/access-policy"},
				{Label: "更新访问策略", Target: "PATCH /api/v1/workspaces/:id/access-policy"},
				{Label: "运行时事件", Target: "runtime_rate_limited / runtime_risk_detected"},
			},
		},
		{
			Key:      "user_data_recovery",
			Title:    "用户数据恢复流程",
			Summary:  "从备份恢复工作空间数据库并验证数据可用性。",
			Severity: "P1",
			Owners:   []string{"ops", "support"},
			Triggers: []string{
				"用户报告数据丢失或损坏",
				"数据迁移失败或异常清理",
			},
			Preconditions: []string{
				"数据库状态为 ready",
				"具备可用备份 backup_id",
			},
			Steps: []OpsSOPStep{
				{
					Title: "确认数据库与备份",
					Actions: []string{
						"调用 GET /api/v1/workspaces/:id/database 确认状态为 ready",
						"必要时调用 POST /api/v1/workspaces/:id/database/backup 生成最新备份",
					},
					Expected: "获取可用 backup_id",
				},
				{
					Title: "执行恢复",
					Actions: []string{
						"调用 POST /api/v1/workspaces/:id/database/restore 并传入 backup_id",
						"执行 POST /api/v1/workspaces/:id/database/migrate 确保 schema 同步",
					},
					Expected: "恢复成功且迁移完成",
				},
				{
					Title: "验证与回归检查",
					Actions: []string{
						"抽样核对关键表与应用访问路径",
						"记录恢复结果与影响范围",
					},
					Expected: "用户核心数据可用",
				},
			},
			Escalation:   "恢复失败或数据不可用时，升级数据库管理员进行手动恢复。",
			RollbackPlan: "使用上一份备份重新 restore 或保留现有数据副本。",
			References: []OpsSOPReference{
				{Label: "创建备份", Target: "POST /api/v1/workspaces/:id/database/backup"},
				{Label: "执行恢复", Target: "POST /api/v1/workspaces/:id/database/restore"},
				{Label: "执行迁移", Target: "POST /api/v1/workspaces/:id/database/migrate"},
			},
		},
	}
}
