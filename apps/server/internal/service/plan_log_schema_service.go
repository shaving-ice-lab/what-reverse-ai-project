package service

import (
	"context"
	"errors"
)

// LogFieldSpec 日志字段规范
type LogFieldSpec struct {
	Key         string `json:"key"`
	Type        string `json:"type"`
	Required    bool   `json:"required"`
	Description string `json:"description"`
}

// LogSchemaSection 字段表分区
type LogSchemaSection struct {
	Key    string         `json:"key"`
	Title  string         `json:"title"`
	Table  string         `json:"table"`
	Fields []LogFieldSpec `json:"fields"`
	Notes  []string       `json:"notes,omitempty"`
}

// LogSchemaSpec 日志字段表
type LogSchemaSpec struct {
	Key      string             `json:"key"`
	Title    string             `json:"title"`
	Sections []LogSchemaSection `json:"sections"`
	Notes    []string           `json:"notes,omitempty"`
}

// PlanLogSchemaService 日志字段规范规划服务接口
type PlanLogSchemaService interface {
	GetSchema(ctx context.Context) (*LogSchemaSpec, error)
}

type planLogSchemaService struct {
	schema LogSchemaSpec
}

// ErrLogSchemaNotFound 日志字段表不存在
var ErrLogSchemaNotFound = errors.New("log schema not found")

// NewPlanLogSchemaService 创建日志字段规范规划服务
func NewPlanLogSchemaService() PlanLogSchemaService {
	return &planLogSchemaService{
		schema: defaultLogSchema(),
	}
}

func (s *planLogSchemaService) GetSchema(ctx context.Context) (*LogSchemaSpec, error) {
	if s == nil || s.schema.Key == "" {
		return nil, ErrLogSchemaNotFound
	}
	output := s.schema
	return &output, nil
}

func defaultLogSchema() LogSchemaSpec {
	return LogSchemaSpec{
		Key:   "log_schema",
		Title: "执行日志与审计日志字段表",
		Sections: []LogSchemaSection{
			{
				Key:   "executions",
				Title: "Execution 执行记录",
				Table: "what_reverse_executions",
				Fields: []LogFieldSpec{
					{Key: "id", Type: "uuid", Required: true, Description: "执行记录 ID"},
					{Key: "workflow_id", Type: "uuid", Required: true, Description: "工作流 ID"},
					{Key: "user_id", Type: "uuid", Required: true, Description: "执行用户 ID"},
					{Key: "workspace_id", Type: "uuid", Required: false, Description: "工作空间 ID"},
					{Key: "status", Type: "string", Required: true, Description: "执行状态"},
					{Key: "trigger_type", Type: "string", Required: true, Description: "触发类型"},
					{Key: "trigger_data", Type: "json", Required: false, Description: "触发上下文数据"},
					{Key: "inputs", Type: "json", Required: false, Description: "输入数据"},
					{Key: "outputs", Type: "json", Required: false, Description: "输出数据"},
					{Key: "context", Type: "json", Required: false, Description: "执行上下文"},
					{Key: "token_usage", Type: "json", Required: false, Description: "资源消耗统计"},
					{Key: "started_at", Type: "datetime", Required: false, Description: "开始时间"},
					{Key: "completed_at", Type: "datetime", Required: false, Description: "结束时间"},
					{Key: "duration_ms", Type: "int", Required: false, Description: "耗时（毫秒）"},
					{Key: "error_message", Type: "text", Required: false, Description: "错误信息"},
					{Key: "error_node_id", Type: "string", Required: false, Description: "出错节点 ID"},
					{Key: "created_at", Type: "datetime", Required: true, Description: "创建时间"},
				},
			},
			{
				Key:   "node_logs",
				Title: "NodeLog 节点执行日志",
				Table: "what_reverse_node_logs",
				Fields: []LogFieldSpec{
					{Key: "id", Type: "uuid", Required: true, Description: "节点日志 ID"},
					{Key: "execution_id", Type: "uuid", Required: true, Description: "关联执行 ID"},
					{Key: "node_id", Type: "string", Required: true, Description: "节点 ID"},
					{Key: "node_type", Type: "string", Required: true, Description: "节点类型"},
					{Key: "status", Type: "string", Required: true, Description: "节点执行状态"},
					{Key: "inputs", Type: "json", Required: false, Description: "节点输入"},
					{Key: "outputs", Type: "json", Required: false, Description: "节点输出"},
					{Key: "logs", Type: "json", Required: false, Description: "节点日志内容"},
					{Key: "started_at", Type: "datetime", Required: false, Description: "开始时间"},
					{Key: "completed_at", Type: "datetime", Required: false, Description: "结束时间"},
					{Key: "duration_ms", Type: "int", Required: false, Description: "耗时（毫秒）"},
					{Key: "error_message", Type: "text", Required: false, Description: "错误信息"},
					{Key: "created_at", Type: "datetime", Required: true, Description: "创建时间"},
				},
			},
			{
				Key:   "audit_logs",
				Title: "Audit 审计日志",
				Table: "what_reverse_audit_logs",
				Fields: []LogFieldSpec{
					{Key: "id", Type: "uuid", Required: true, Description: "审计日志 ID"},
					{Key: "workspace_id", Type: "uuid", Required: true, Description: "工作空间 ID"},
					{Key: "actor_user_id", Type: "uuid", Required: false, Description: "操作者用户 ID"},
					{Key: "action", Type: "string", Required: true, Description: "动作标识"},
					{Key: "target_type", Type: "string", Required: true, Description: "对象类型"},
					{Key: "target_id", Type: "uuid", Required: false, Description: "对象 ID"},
					{Key: "metadata_json", Type: "json", Required: false, Description: "操作上下文与附加信息"},
					{Key: "created_at", Type: "datetime", Required: true, Description: "创建时间"},
					{Key: "metadata.request_id", Type: "string", Required: false, Description: "请求 ID（可追溯）"},
					{Key: "metadata.trace_id", Type: "string", Required: false, Description: "链路 Trace ID"},
					{Key: "metadata.span_id", Type: "string", Required: false, Description: "Span ID"},
					{Key: "metadata.remote_ip", Type: "string", Required: false, Description: "请求 IP"},
					{Key: "metadata.user_agent", Type: "string", Required: false, Description: "客户端 User-Agent"},
					{Key: "metadata.http_method", Type: "string", Required: false, Description: "HTTP 方法"},
					{Key: "metadata.http_path", Type: "string", Required: false, Description: "HTTP 路径"},
				},
				Notes: []string{
					"metadata 字段用于补充审计追溯信息，默认经过 PII 脱敏。",
				},
			},
		},
		Notes: []string{
			"字段表与现有数据模型保持一致，可直接落库。",
		},
	}
}
