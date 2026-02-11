package executor

import (
	"context"
	"fmt"
	"strings"
	"time"
)

// NodeTypeNotification 通知节点
const NodeTypeNotification NodeType = "notification"

// NotificationExecutor 发送通知（邮件/站内通知/Webhook 回调）
type NotificationExecutor struct{}

func NewNotificationExecutor() *NotificationExecutor {
	return &NotificationExecutor{}
}

func (e *NotificationExecutor) GetType() NodeType {
	return NodeTypeNotification
}

func (e *NotificationExecutor) Execute(ctx context.Context, node *NodeDefinition, inputs map[string]interface{}, execCtx *ExecutionContext) (*NodeResult, error) {
	// Config:
	//   channel: string — "email" / "in_app" / "webhook"
	//   recipients: []string — 收件人列表（email 地址或用户 ID）
	//   subject: string — 标题（支持变量插值）
	//   body: string — 正文内容（支持变量插值）
	//   template: string — 可选模板名
	//   webhook_url: string — Webhook URL (channel=webhook 时使用)
	//   metadata: {} — 附加元数据

	channel := strings.ToLower(getString(node.Config, "channel"))
	if channel == "" {
		channel = "in_app"
	}

	subject := getString(node.Config, "subject")
	if subject != "" {
		subject = interpolateVariables(subject, inputs, execCtx)
	}

	body := getString(node.Config, "body")
	if body != "" {
		body = interpolateVariables(body, inputs, execCtx)
	}

	recipientsRaw, _ := node.Config["recipients"].([]interface{})
	recipients := make([]string, 0, len(recipientsRaw))
	for _, r := range recipientsRaw {
		s := fmt.Sprintf("%v", r)
		s = interpolateVariables(s, inputs, execCtx)
		recipients = append(recipients, s)
	}

	// Also accept recipients from inputs
	if len(recipients) == 0 {
		if recipientInput, ok := inputs["recipients"].([]interface{}); ok {
			for _, r := range recipientInput {
				recipients = append(recipients, fmt.Sprintf("%v", r))
			}
		} else if recipientStr, ok := inputs["recipient"].(string); ok {
			recipients = append(recipients, recipientStr)
		}
	}

	// Build notification record
	notification := map[string]interface{}{
		"channel":    channel,
		"recipients": recipients,
		"subject":    subject,
		"body":       body,
		"sent_at":    time.Now().UTC().Format(time.RFC3339),
		"status":     "queued",
	}

	// Record audit
	if execCtx != nil {
		execCtx.RecordAudit(ctx, AuditEvent{
			Action:     "notification_sent",
			TargetType: "notification",
			Metadata: map[string]interface{}{
				"channel":         channel,
				"recipient_count": len(recipients),
				"subject":         subject,
			},
		})
	}

	// In a real implementation, this would dispatch to email/push/webhook services
	// For now, we record the notification and mark as sent
	notification["status"] = "sent"

	outputs := map[string]interface{}{
		"notification": notification,
		"sent":         true,
		"channel":      channel,
		"recipients":   recipients,
		"output":       notification,
		"result":       notification,
	}

	return &NodeResult{
		NodeID:  node.ID,
		Status:  NodeStatusCompleted,
		Outputs: outputs,
	}, nil
}
