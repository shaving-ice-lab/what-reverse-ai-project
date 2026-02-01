package notification

import (
	"context"
	"fmt"
	"time"

	"github.com/agentflow/server/internal/pkg/logger"
	"github.com/google/uuid"
)

// =====================
// 通知类型
// =====================

// NotificationType 通知类型
type NotificationType string

const (
	// 收入相关
	NotifyEarningReceived     NotificationType = "earning_received"     // 收到收入
	NotifyWithdrawalSubmitted NotificationType = "withdrawal_submitted" // 提现申请已提交
	NotifyWithdrawalApproved  NotificationType = "withdrawal_approved"  // 提现审核通过
	NotifyWithdrawalRejected  NotificationType = "withdrawal_rejected"  // 提现被拒绝
	NotifyWithdrawalCompleted NotificationType = "withdrawal_completed" // 提现到账
	NotifyWithdrawalFailed    NotificationType = "withdrawal_failed"    // 提现失败
	
	// 交易相关
	NotifyAgentPurchased      NotificationType = "agent_purchased"      // Agent 被购买
	NotifySubscriptionRenewed NotificationType = "subscription_renewed" // 订阅续费
	NotifyTipReceived         NotificationType = "tip_received"         // 收到打赏
	NotifyReferralBonus       NotificationType = "referral_bonus"       // 推荐奖励
	
	// 系统相关
	NotifySystemAnnouncement  NotificationType = "system_announcement"  // 系统公告
	NotifyAccountVerified     NotificationType = "account_verified"     // 账户已验证
)

// NotificationChannel 通知渠道
type NotificationChannel string

const (
	ChannelInApp NotificationChannel = "in_app" // 站内通知
	ChannelEmail NotificationChannel = "email"  // 邮件
	ChannelSMS   NotificationChannel = "sms"    // 短信
	ChannelPush  NotificationChannel = "push"   // 推送
)

// =====================
// 通知数据结构
// =====================

// Notification 通知
type Notification struct {
	ID          uuid.UUID                 `json:"id"`
	UserID      uuid.UUID                 `json:"user_id"`
	Type        NotificationType          `json:"type"`
	Title       string                    `json:"title"`
	Content     string                    `json:"content"`
	Data        map[string]interface{}    `json:"data,omitempty"`
	Channels    []NotificationChannel     `json:"channels"`
	IsRead      bool                      `json:"is_read"`
	ReadAt      *time.Time                `json:"read_at,omitempty"`
	CreatedAt   time.Time                 `json:"created_at"`
}

// NotificationRequest 发送通知请求
type NotificationRequest struct {
	UserID   uuid.UUID
	Type     NotificationType
	Title    string
	Content  string
	Data     map[string]interface{}
	Channels []NotificationChannel
}

// =====================
// 通知服务接口
// =====================

// NotificationService 通知服务接口
type NotificationService interface {
	// 发送通知
	Send(ctx context.Context, req *NotificationRequest) error
	
	// 批量发送
	SendBatch(ctx context.Context, reqs []*NotificationRequest) error
	
	// 发送收入通知
	SendEarningNotification(ctx context.Context, userID uuid.UUID, amount float64, earningType string, agentName string) error
	
	// 发送提现通知
	SendWithdrawalNotification(ctx context.Context, userID uuid.UUID, notifyType NotificationType, amount float64, reason string) error
}

// =====================
// 通知服务实现
// =====================

type notificationService struct {
	log    logger.Logger
	// TODO: 添加邮件服务、短信服务、推送服务等
}

// NewNotificationService 创建通知服务
func NewNotificationService(log logger.Logger) NotificationService {
	return &notificationService{
		log: log,
	}
}

// Send 发送通知
func (s *notificationService) Send(ctx context.Context, req *NotificationRequest) error {
	notification := &Notification{
		ID:        uuid.New(),
		UserID:    req.UserID,
		Type:      req.Type,
		Title:     req.Title,
		Content:   req.Content,
		Data:      req.Data,
		Channels:  req.Channels,
		IsRead:    false,
		CreatedAt: time.Now(),
	}
	
	s.log.Info("Sending notification",
		"user_id", req.UserID,
		"type", req.Type,
		"title", req.Title,
	)
	
	// 根据渠道发送通知
	for _, channel := range req.Channels {
		switch channel {
		case ChannelInApp:
			if err := s.sendInApp(ctx, notification); err != nil {
				s.log.Error("Failed to send in-app notification", "error", err)
			}
		case ChannelEmail:
			if err := s.sendEmail(ctx, notification); err != nil {
				s.log.Error("Failed to send email notification", "error", err)
			}
		case ChannelSMS:
			if err := s.sendSMS(ctx, notification); err != nil {
				s.log.Error("Failed to send SMS notification", "error", err)
			}
		case ChannelPush:
			if err := s.sendPush(ctx, notification); err != nil {
				s.log.Error("Failed to send push notification", "error", err)
			}
		}
	}
	
	return nil
}

// SendBatch 批量发送通知
func (s *notificationService) SendBatch(ctx context.Context, reqs []*NotificationRequest) error {
	for _, req := range reqs {
		if err := s.Send(ctx, req); err != nil {
			s.log.Error("Failed to send notification in batch", 
				"user_id", req.UserID,
				"error", err,
			)
		}
	}
	return nil
}

// SendEarningNotification 发送收入通知
func (s *notificationService) SendEarningNotification(ctx context.Context, userID uuid.UUID, amount float64, earningType string, agentName string) error {
	var title, content string
	var notifyType NotificationType
	
	switch earningType {
	case "sale":
		title = "🎉 收到新的销售收入"
		content = fmt.Sprintf("您的 Agent「%s」被购买，获得收入 ¥%.2f", agentName, amount)
		notifyType = NotifyAgentPurchased
	case "subscription":
		title = "💰 订阅续费收入"
		content = fmt.Sprintf("您的 Agent「%s」订阅续费，获得收入 ¥%.2f", agentName, amount)
		notifyType = NotifySubscriptionRenewed
	case "tip":
		title = "🎁 收到打赏"
		content = fmt.Sprintf("有用户给您打赏了 ¥%.2f", amount)
		notifyType = NotifyTipReceived
	case "referral":
		title = "🎯 推荐奖励"
		content = fmt.Sprintf("您获得推荐奖励 ¥%.2f", amount)
		notifyType = NotifyReferralBonus
	default:
		title = "💵 收到收入"
		content = fmt.Sprintf("您获得收入 ¥%.2f", amount)
		notifyType = NotifyEarningReceived
	}
	
	return s.Send(ctx, &NotificationRequest{
		UserID:   userID,
		Type:     notifyType,
		Title:    title,
		Content:  content,
		Data: map[string]interface{}{
			"amount":       amount,
			"earning_type": earningType,
			"agent_name":   agentName,
		},
		Channels: []NotificationChannel{ChannelInApp},
	})
}

// SendWithdrawalNotification 发送提现通知
func (s *notificationService) SendWithdrawalNotification(ctx context.Context, userID uuid.UUID, notifyType NotificationType, amount float64, reason string) error {
	var title, content string
	
	switch notifyType {
	case NotifyWithdrawalSubmitted:
		title = "📤 提现申请已提交"
		content = fmt.Sprintf("您的提现申请（¥%.2f）已提交，请等待审核", amount)
	case NotifyWithdrawalApproved:
		title = "✅ 提现审核通过"
		content = fmt.Sprintf("您的提现申请（¥%.2f）已审核通过，正在处理转账", amount)
	case NotifyWithdrawalRejected:
		title = "❌ 提现被拒绝"
		content = fmt.Sprintf("您的提现申请（¥%.2f）被拒绝。原因：%s", amount, reason)
	case NotifyWithdrawalCompleted:
		title = "🎉 提现到账成功"
		content = fmt.Sprintf("您的提现（¥%.2f）已到账，请查收", amount)
	case NotifyWithdrawalFailed:
		title = "⚠️ 提现失败"
		content = fmt.Sprintf("您的提现（¥%.2f）处理失败。原因：%s。资金已退回账户余额", amount, reason)
	default:
		return nil
	}
	
	return s.Send(ctx, &NotificationRequest{
		UserID:   userID,
		Type:     notifyType,
		Title:    title,
		Content:  content,
		Data: map[string]interface{}{
			"amount": amount,
			"reason": reason,
		},
		Channels: []NotificationChannel{ChannelInApp, ChannelEmail},
	})
}

// =====================
// 渠道发送实现
// =====================

// sendInApp 发送站内通知
func (s *notificationService) sendInApp(ctx context.Context, notification *Notification) error {
	// TODO: 存储到通知表，通过 WebSocket 推送给用户
	s.log.Info("[InApp] Notification sent",
		"user_id", notification.UserID,
		"type", notification.Type,
	)
	return nil
}

// sendEmail 发送邮件通知
func (s *notificationService) sendEmail(ctx context.Context, notification *Notification) error {
	// TODO: 集成邮件服务（如 SendGrid、阿里云邮件等）
	s.log.Info("[Email] Notification sent",
		"user_id", notification.UserID,
		"type", notification.Type,
	)
	return nil
}

// sendSMS 发送短信通知
func (s *notificationService) sendSMS(ctx context.Context, notification *Notification) error {
	// TODO: 集成短信服务（如阿里云短信、腾讯云短信等）
	s.log.Info("[SMS] Notification sent",
		"user_id", notification.UserID,
		"type", notification.Type,
	)
	return nil
}

// sendPush 发送推送通知
func (s *notificationService) sendPush(ctx context.Context, notification *Notification) error {
	// TODO: 集成推送服务（如极光推送、个推等）
	s.log.Info("[Push] Notification sent",
		"user_id", notification.UserID,
		"type", notification.Type,
	)
	return nil
}
