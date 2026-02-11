package executor

import (
	"context"
	"fmt"
	"time"
)

// NodeTypeScheduleTrigger 定时触发节点
const NodeTypeScheduleTrigger NodeType = "schedule_trigger"

// ScheduleTriggerExecutor 定时触发 Workflow（cron 表达式）
// 注意：实际的定时调度由外部调度器（cron scheduler）驱动。
// 此执行器在 Workflow 被触发执行时提供触发上下文信息。
type ScheduleTriggerExecutor struct{}

func NewScheduleTriggerExecutor() *ScheduleTriggerExecutor {
	return &ScheduleTriggerExecutor{}
}

func (e *ScheduleTriggerExecutor) GetType() NodeType {
	return NodeTypeScheduleTrigger
}

func (e *ScheduleTriggerExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	// Config:
	//   cron: string — cron 表达式（e.g. "0 */5 * * *" 每5分钟）
	//   timezone: string — 时区（default: "UTC"）
	//   description: string — 调度描述
	//   enabled: bool — 是否启用
	//   max_retries: int — 最大重试次数
	//   payload: {} — 每次触发时注入的静态数据

	cronExpr := getString(node.Config, "cron")
	timezone := getString(node.Config, "timezone")
	if timezone == "" {
		timezone = "UTC"
	}
	description := getString(node.Config, "description")
	enabled := true
	if enabledRaw, ok := node.Config["enabled"]; ok {
		if b, ok := enabledRaw.(bool); ok {
			enabled = b
		}
	}

	now := time.Now().UTC()
	loc, err := time.LoadLocation(timezone)
	if err != nil {
		loc = time.UTC
	}
	localNow := now.In(loc)

	// Static payload
	payload, _ := node.Config["payload"].(map[string]interface{})
	if payload == nil {
		payload = map[string]interface{}{}
	}

	// Build trigger context
	triggerInfo := map[string]interface{}{
		"trigger_type": "schedule",
		"cron":         cronExpr,
		"timezone":     timezone,
		"description":  description,
		"enabled":      enabled,
		"triggered_at": now.Format(time.RFC3339),
		"local_time":   localNow.Format(time.RFC3339),
		"day_of_week":  localNow.Weekday().String(),
		"hour":         localNow.Hour(),
		"minute":       localNow.Minute(),
	}

	// Set trigger data in execution context
	if execCtx != nil {
		execCtx.TriggerType = "schedule"
		execCtx.TriggerData = map[string]interface{}{
			"cron":         cronExpr,
			"triggered_at": now.Format(time.RFC3339),
		}
	}

	// Merge payload into outputs
	outputs := map[string]interface{}{
		"trigger":      triggerInfo,
		"payload":      payload,
		"triggered_at": now.Format(time.RFC3339),
		"output":       triggerInfo,
		"result":       triggerInfo,
	}
	for k, v := range payload {
		outputs[k] = v
	}

	if !enabled {
		return &NodeResult{
			NodeID: node.ID,
			Status: NodeStatusCompleted,
			Outputs: map[string]interface{}{
				"trigger": triggerInfo,
				"skipped": true,
				"reason":  "schedule is disabled",
				"output":  map[string]interface{}{"skipped": true},
			},
			Logs: []LogEntry{{Level: "info", Message: fmt.Sprintf("Schedule trigger %q is disabled, skipping", description), Timestamp: time.Now()}},
		}, nil
	}

	return &NodeResult{
		NodeID:  node.ID,
		Status:  NodeStatusCompleted,
		Outputs: outputs,
	}, nil
}
